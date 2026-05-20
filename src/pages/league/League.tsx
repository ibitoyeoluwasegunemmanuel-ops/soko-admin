import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { Trophy, Users, Globe, Save, RefreshCw, Star, Zap } from "lucide-react";

type Tab = "rankings" | "tiers" | "regions" | "points" | "bonuses" | "teams";

const TIER_COLORS: Record<string, string> = {
  D: "#6b7280", C: "#3b82f6", B: "#10b981",
  A: "#f59e0b", S: "#ef4444", SS: "#a78bfa", Legend: "#f0abfc",
};

const DEFAULT_TIERS = [
  { key: "D",      label: "D Tier",  icon: "🌱", min: 0,       max: 999 },
  { key: "C",      label: "C Tier",  icon: "⚡", min: 1000,    max: 4999 },
  { key: "B",      label: "B Tier",  icon: "🔥", min: 5000,    max: 19999 },
  { key: "A",      label: "A Tier",  icon: "💎", min: 20000,   max: 49999 },
  { key: "S",      label: "S Tier",  icon: "👑", min: 50000,   max: 199999 },
  { key: "SS",     label: "SS Tier", icon: "🌟", min: 200000,  max: 999999 },
  { key: "Legend", label: "Legend",  icon: "🏆", min: 1000000, max: 999999999 },
];

const REGIONS = [
  "Global","Africa","Nigeria","Ghana","Kenya","South Africa",
  "West Africa","East Africa","North Africa","Europe","Americas","Asia",
];

export function League() {
  const [tab, setTab]         = useState<Tab>("rankings");
  const [rankings, setRankings] = useState<any[]>([]);
  const [teams, setTeams]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats]     = useState({ total: 0, legend: 0, topHundred: 0, teams: 0 });
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  const [resetType, setResetType] = useState("weekly");
  const [resetDay, setResetDay]   = useState("Monday");
  const [region, setRegion]       = useState("Global");
  const [tiers, setTiers]         = useState(DEFAULT_TIERS.map(t => ({ ...t })));
  const [pointRules, setPointRules] = useState({
    gift_received: 10, product_sold: 5,
    live_minute: 2, new_follower: 1, post_like: 0.5,
  });
  const [bonuses, setBonuses] = useState({
    legend_bonus: 500000, ss_bonus: 100000,
    s_bonus: 50000, a_bonus: 20000, weekly_pool: 1000000,
  });

  useEffect(() => {
    async function load() {
      const [rankR, teamR, cfgR] = await Promise.all([
        supabase.from("league_rankings")
          .select("id,user:profiles!user_id(username,avatar_url,is_verified),tier,points,rank")
          .order("points", { ascending: false }).limit(50),
        supabase.from("league_teams")
          .select("id,name,total_points,member_count,leader:profiles!leader_id(username)")
          .order("total_points", { ascending: false }).limit(20),
        supabase.from("app_config").select("key,value")
          .in("key", ["league_reset_type","league_reset_day","league_region","league_point_rules","league_bonuses","league_tier_config"]),
      ]);
      const rList = rankR.data ?? [];
      const tList = teamR.data ?? [];
      setRankings(rList);
      setTeams(tList);
      setStats({ total: rList.length, legend: rList.filter((r:any) => r.tier==="Legend").length, topHundred: Math.min(rList.length,100), teams: tList.length });
      for (const c of cfgR.data ?? []) {
        try {
          if (c.key === "league_reset_type") setResetType(c.value);
          if (c.key === "league_reset_day") setResetDay(c.value);
          if (c.key === "league_region") setRegion(c.value);
          if (c.key === "league_point_rules") setPointRules(JSON.parse(c.value));
          if (c.key === "league_bonuses") setBonuses(JSON.parse(c.value));
          if (c.key === "league_tier_config") setTiers(JSON.parse(c.value));
        } catch {}
      }
      setLoading(false);
    }
    load();
  }, []);

  async function saveConfig() {
    setSaving(true);
    await Promise.all([
      supabase.from("app_config").upsert({ key: "league_reset_type", value: resetType }),
      supabase.from("app_config").upsert({ key: "league_reset_day",  value: resetDay }),
      supabase.from("app_config").upsert({ key: "league_region",     value: region }),
      supabase.from("app_config").upsert({ key: "league_point_rules", value: JSON.stringify(pointRules) }),
      supabase.from("app_config").upsert({ key: "league_bonuses",    value: JSON.stringify(bonuses) }),
      supabase.from("app_config").upsert({ key: "league_tier_config", value: JSON.stringify(tiers) }),
    ]);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const TABS: {key:Tab;label:string}[] = [
    {key:"rankings",label:"Live Rankings"},
    {key:"tiers",   label:"Tier Config"},
    {key:"regions", label:"Region & Schedule"},
    {key:"points",  label:"Point Rules"},
    {key:"bonuses", label:"Bonuses"},
    {key:"teams",   label:"Teams"},
  ];

  const NumInput = ({ label, value, onChange }: { label:string; value:number; onChange:(v:number)=>void }) => (
    <div>
      <label style={{display:"block",fontSize:11,fontWeight:600,color:"var(--muted)",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em"}}>{label}</label>
      <input type="number" value={value} onChange={e=>onChange(Number(e.target.value))} style={{
        width:"100%",height:40,padding:"0 12px",borderRadius:10,
        border:"1px solid var(--border)",background:"var(--bg)",
        color:"var(--text)",fontSize:14,outline:"none",
      }}/>
    </div>
  );

  return (
    <div>
      <PageHeader title="League & Rankings" sub="Tiers, regions, point rules, bonuses and live player rankings">
        <button onClick={async()=>{
          if(!confirm("Reset league cycle? Cannot be undone.")) return;
          await supabase.from("app_config").upsert({key:"league_last_reset",value:new Date().toISOString()});
        }} style={{padding:"8px 14px",borderRadius:10,border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
          <RefreshCw size={13}/> Reset Cycle
        </button>
        <button onClick={saveConfig} disabled={saving} style={{padding:"8px 18px",borderRadius:10,border:"none",background:saved?"#10b981":"#7c3aed",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6,transition:"background 0.2s"}}>
          <Save size={13}/> {saved?"Saved!":saving?"Saving…":"Save Config"}
        </button>
      </PageHeader>

      <div style={{padding:"24px 28px",display:"flex",flexDirection:"column",gap:24}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16}}>
          <StatCard label="Total Players"   value={stats.total}      icon={Users}  color="#7c3aed"/>
          <StatCard label="Legend Tier"     value={stats.legend}     icon={Trophy} color="#f59e0b"/>
          <StatCard label="Top 100"         value={stats.topHundred} icon={Star}   color="#10b981"/>
          <StatCard label="Active Teams"    value={stats.teams}      icon={Globe}  color="#3b82f6"/>
        </div>

        <div style={{display:"flex",gap:4,background:"var(--bg)",border:"1px solid var(--border)",borderRadius:12,padding:4,width:"fit-content",flexWrap:"wrap"}}>
          {TABS.map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)} style={{padding:"7px 16px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:tab===t.key?"#7c3aed":"transparent",color:tab===t.key?"#fff":"var(--muted)"}}>
              {t.label}
            </button>
          ))}
        </div>

        {/* RANKINGS */}
        {tab==="rankings" && (
          <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,overflow:"hidden"}}>
            <div style={{padding:"14px 20px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontWeight:700,color:"var(--text)"}}>Player Rankings</span>
              <span style={{fontSize:12,color:"var(--muted)"}}>Region: {region} · Resets: {resetType}</span>
            </div>
            <table style={{width:"100%",fontSize:13}}>
              <thead><tr style={{borderBottom:"1px solid var(--border)"}}>
                {["Rank","Player","Tier","Points","Verified"].map(h=>(
                  <th key={h} style={{padding:"10px 16px",textAlign:"left",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em",color:"var(--muted)"}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {loading?Array(8).fill(0).map((_,i)=>(
                  <tr key={i}><td colSpan={5} style={{padding:"10px 16px"}}><div style={{height:14,background:"var(--bg)",borderRadius:6}}/></td></tr>
                )):rankings.map((r,i)=>(
                  <tr key={r.id} style={{borderBottom:"1px solid var(--border)"}}>
                    <td style={{padding:"10px 16px",fontWeight:800,color:i<3?"#f59e0b":"var(--muted)",fontSize:i<3?16:13}}>
                      {i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}
                    </td>
                    <td style={{padding:"10px 16px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:30,height:30,borderRadius:"50%",background:"var(--bg)",overflow:"hidden",flexShrink:0}}>
                          {r.user?.avatar_url&&<img src={r.user.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>}
                        </div>
                        <span style={{fontWeight:600,color:"var(--text)"}}>@{r.user?.username??"—"}</span>
                      </div>
                    </td>
                    <td style={{padding:"10px 16px"}}>
                      <span style={{fontSize:11,fontWeight:800,padding:"3px 10px",borderRadius:20,color:TIER_COLORS[r.tier??"D"],background:`${TIER_COLORS[r.tier??"D"]}18`}}>
                        {r.tier??"D"}
                      </span>
                    </td>
                    <td style={{padding:"10px 16px",fontWeight:700,color:"#a78bfa"}}>{Number(r.points??0).toLocaleString()} pts</td>
                    <td style={{padding:"10px 16px",color:r.user?.is_verified?"#10b981":"var(--muted)"}}>{r.user?.is_verified?"✓":"—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading&&rankings.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"var(--muted)",fontSize:13}}>No rankings data yet</div>}
          </div>
        )}

        {/* TIERS */}
        {tab==="tiers" && (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <p style={{fontSize:13,color:"var(--muted)",marginBottom:4}}>Set the minimum points required to reach each tier.</p>
            {tiers.map((tier,i)=>(
              <div key={tier.key} style={{display:"grid",gridTemplateColumns:"56px 1fr 1fr 1fr",gap:12,alignItems:"center",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:"12px 16px"}}>
                <span style={{fontSize:22,textAlign:"center"}}>{tier.icon}</span>
                <div>
                  <div style={{fontSize:11,color:"var(--muted)",marginBottom:2}}>Tier</div>
                  <div style={{fontSize:14,fontWeight:700,color:TIER_COLORS[tier.key]}}>{tier.label}</div>
                </div>
                <div>
                  <div style={{fontSize:11,color:"var(--muted)",marginBottom:4}}>Min Points</div>
                  <input type="number" value={tier.min} onChange={e=>setTiers(prev=>prev.map((t,j)=>j===i?{...t,min:Number(e.target.value)}:t))}
                    style={{width:"100%",height:36,padding:"0 10px",borderRadius:8,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text)",fontSize:13,outline:"none"}}/>
                </div>
                <div>
                  <div style={{fontSize:11,color:"var(--muted)",marginBottom:4}}>Max Points</div>
                  <input type="number" value={tier.max} onChange={e=>setTiers(prev=>prev.map((t,j)=>j===i?{...t,max:Number(e.target.value)}:t))}
                    style={{width:"100%",height:36,padding:"0 10px",borderRadius:8,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text)",fontSize:13,outline:"none"}}/>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* REGIONS */}
        {tab==="regions" && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,padding:24}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}>
                <Globe size={16} style={{color:"#7c3aed"}}/>
                <span style={{fontWeight:700,fontSize:15,color:"var(--text)"}}>Default Region</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div>
                  <label style={{display:"block",fontSize:12,fontWeight:600,color:"var(--muted)",marginBottom:8}}>Region</label>
                  <select value={region} onChange={e=>setRegion(e.target.value)} style={{width:"100%",height:42,padding:"0 12px",borderRadius:10,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text)",fontSize:14,outline:"none"}}>
                    {REGIONS.map(r=><option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div style={{padding:14,borderRadius:10,background:"rgba(124,58,237,0.08)",border:"1px solid rgba(124,58,237,0.2)"}}>
                  <p style={{fontSize:12,color:"#a78bfa"}}>Players always see Global. This sets the default region shown on their ranking screen.</p>
                </div>
              </div>
            </div>
            <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,padding:24}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}>
                <RefreshCw size={16} style={{color:"#10b981"}}/>
                <span style={{fontWeight:700,fontSize:15,color:"var(--text)"}}>Reset Schedule</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div>
                  <label style={{display:"block",fontSize:12,fontWeight:600,color:"var(--muted)",marginBottom:8}}>Reset Frequency</label>
                  <div style={{display:"flex",gap:8}}>
                    {["daily","weekly","monthly"].map(rt=>(
                      <button key={rt} onClick={()=>setResetType(rt)} style={{flex:1,padding:"10px 0",borderRadius:10,border:"1px solid var(--border)",background:resetType===rt?"#7c3aed":"var(--bg)",color:resetType===rt?"#fff":"var(--muted)",fontSize:13,fontWeight:600,cursor:"pointer",textTransform:"capitalize"}}>
                        {rt}
                      </button>
                    ))}
                  </div>
                </div>
                {resetType==="weekly"&&(
                  <div>
                    <label style={{display:"block",fontSize:12,fontWeight:600,color:"var(--muted)",marginBottom:8}}>Reset Day</label>
                    <select value={resetDay} onChange={e=>setResetDay(e.target.value)} style={{width:"100%",height:42,padding:"0 12px",borderRadius:10,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text)",fontSize:14,outline:"none"}}>
                      {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(d=><option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* POINTS */}
        {tab==="points" && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,padding:24}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}>
                <Zap size={16} style={{color:"#f59e0b"}}/>
                <span style={{fontWeight:700,fontSize:15,color:"var(--text)"}}>Points Per Action</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <NumInput label="Points per Gift Received"  value={pointRules.gift_received}  onChange={v=>setPointRules(p=>({...p,gift_received:v}))}/>
                <NumInput label="Points per Product Sold"   value={pointRules.product_sold}   onChange={v=>setPointRules(p=>({...p,product_sold:v}))}/>
                <NumInput label="Points per Live Minute"    value={pointRules.live_minute}    onChange={v=>setPointRules(p=>({...p,live_minute:v}))}/>
                <NumInput label="Points per New Follower"   value={pointRules.new_follower}   onChange={v=>setPointRules(p=>({...p,new_follower:v}))}/>
                <NumInput label="Points per Post Like"      value={pointRules.post_like}      onChange={v=>setPointRules(p=>({...p,post_like:v}))}/>
              </div>
            </div>
            <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,padding:24}}>
              <p style={{fontSize:13,fontWeight:700,color:"var(--text)",marginBottom:16}}>How Points Work</p>
              {[
                {label:"Gifts",desc:"Every coin value of gift × multiplier = points."},
                {label:"Products Sold",desc:"Each completed order earns points for the seller."},
                {label:"Live Minutes",desc:"Accrued per minute while live."},
                {label:"New Followers",desc:"Each new follow earned adds points."},
                {label:"Post Likes",desc:"Each like on a post adds fractional points."},
              ].map(g=>(
                <div key={g.label} style={{padding:"10px 14px",borderRadius:10,background:"var(--bg)",border:"1px solid var(--border)",marginBottom:8}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#a78bfa",marginBottom:2}}>{g.label}</div>
                  <div style={{fontSize:11,color:"var(--muted)"}}>{g.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BONUSES */}
        {tab==="bonuses" && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,padding:24}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}>
                <Trophy size={16} style={{color:"#f59e0b"}}/>
                <span style={{fontWeight:700,fontSize:15,color:"var(--text)"}}>Tier Rewards (₦)</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <NumInput label="Legend Bonus (₦)"    value={bonuses.legend_bonus} onChange={v=>setBonuses(p=>({...p,legend_bonus:v}))}/>
                <NumInput label="SS Tier Bonus (₦)"   value={bonuses.ss_bonus}     onChange={v=>setBonuses(p=>({...p,ss_bonus:v}))}/>
                <NumInput label="S Tier Bonus (₦)"    value={bonuses.s_bonus}      onChange={v=>setBonuses(p=>({...p,s_bonus:v}))}/>
                <NumInput label="A Tier Bonus (₦)"    value={bonuses.a_bonus}      onChange={v=>setBonuses(p=>({...p,a_bonus:v}))}/>
                <NumInput label="Weekly Prize Pool (₦)" value={bonuses.weekly_pool} onChange={v=>setBonuses(p=>({...p,weekly_pool:v}))}/>
              </div>
            </div>
            <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,padding:24}}>
              <p style={{fontSize:13,fontWeight:700,color:"var(--text)",marginBottom:16}}>Reward Summary</p>
              {[
                {tier:"Legend",color:TIER_COLORS.Legend,amount:bonuses.legend_bonus},
                {tier:"SS",    color:TIER_COLORS.SS,    amount:bonuses.ss_bonus},
                {tier:"S",     color:TIER_COLORS.S,     amount:bonuses.s_bonus},
                {tier:"A",     color:TIER_COLORS.A,     amount:bonuses.a_bonus},
              ].map(b=>(
                <div key={b.tier} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",borderRadius:10,background:`${b.color}0f`,border:`1px solid ${b.color}22`,marginBottom:8}}>
                  <span style={{fontSize:13,fontWeight:700,color:b.color}}>{b.tier} Tier</span>
                  <span style={{fontSize:14,fontWeight:800,color:"var(--text)"}}>₦{b.amount.toLocaleString()}</span>
                </div>
              ))}
              <div style={{padding:"10px 14px",borderRadius:10,background:"rgba(124,58,237,0.1)",border:"1px solid rgba(124,58,237,0.25)",marginTop:4,display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:13,fontWeight:700,color:"#a78bfa"}}>Weekly Pool</span>
                <span style={{fontSize:14,fontWeight:800,color:"#a78bfa"}}>₦{bonuses.weekly_pool.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* TEAMS */}
        {tab==="teams" && (
          <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,overflow:"hidden"}}>
            <div style={{padding:"14px 20px",borderBottom:"1px solid var(--border)"}}>
              <span style={{fontWeight:700,color:"var(--text)"}}>Active League Teams</span>
            </div>
            {teams.length===0?(
              <div style={{textAlign:"center",padding:"48px 0",color:"var(--muted)",fontSize:13}}>No teams yet</div>
            ):(
              <table style={{width:"100%",fontSize:13}}>
                <thead><tr style={{borderBottom:"1px solid var(--border)"}}>
                  {["Rank","Team Name","Leader","Members","Total Points"].map(h=>(
                    <th key={h} style={{padding:"10px 16px",textAlign:"left",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em",color:"var(--muted)"}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {teams.map((t,i)=>(
                    <tr key={t.id} style={{borderBottom:"1px solid var(--border)"}}>
                      <td style={{padding:"10px 16px",fontWeight:800,color:i<3?"#f59e0b":"var(--muted)"}}>#{i+1}</td>
                      <td style={{padding:"10px 16px",fontWeight:600,color:"var(--text)"}}>{t.name}</td>
                      <td style={{padding:"10px 16px",color:"var(--muted)"}}>@{t.leader?.username??"—"}</td>
                      <td style={{padding:"10px 16px",color:"var(--muted)"}}>{t.member_count??"—"}</td>
                      <td style={{padding:"10px 16px",fontWeight:700,color:"#a78bfa"}}>{Number(t.total_points??0).toLocaleString()} pts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
