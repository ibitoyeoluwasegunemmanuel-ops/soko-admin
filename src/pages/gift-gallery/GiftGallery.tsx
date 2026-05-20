import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { Gift, Trophy, RefreshCw, Save, Plus, Edit2, Trash2, Check } from "lucide-react";

type Tab = "gallery" | "create" | "leaderboard" | "config";

const RARITY_OPTIONS = ["common","rare","epic","legendary"];
const RARITY_STYLE: Record<string, {color:string;bg:string}> = {
  common:    {color:"rgba(240,242,255,0.5)",  bg:"rgba(255,255,255,0.05)"},
  rare:      {color:"#3b82f6", bg:"rgba(59,130,246,0.1)"},
  epic:      {color:"#a78bfa", bg:"rgba(167,139,250,0.1)"},
  legendary: {color:"#f59e0b", bg:"rgba(245,158,11,0.1)"},
};

interface GiftForm {
  name: string;
  coin_cost: number;
  rarity: string;
  icon_url: string;
  animation_url: string;
  category: string;
  is_active: boolean;
  weekly_limit: number;
  in_gallery: boolean;
  country_availability: string;
}

const BLANK_FORM: GiftForm = {
  name:"", coin_cost:100, rarity:"common", icon_url:"", animation_url:"",
  category:"standard", is_active:true, weekly_limit:0, in_gallery:false, country_availability:"global",
};

export function GiftGallery() {
  const [tab, setTab]       = useState<Tab>("gallery");
  const [gifts, setGifts]   = useState<any[]>([]);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]  = useState(false);
  const [saved, setSaved]    = useState(false);
  const [form, setForm]      = useState<GiftForm>(BLANK_FORM);
  const [editId, setEditId]  = useState<string|null>(null);
  const [stats, setStats]    = useState({total:0, active:0, inGallery:0, sentWeek:0});
  const [resetDay, setResetDay] = useState("Monday");
  const [resetTime, setResetTime] = useState("00:00");
  const [commission, setCommission] = useState({host:70, platform:20, guest:10});

  useEffect(() => {
    async function load() {
      const [giftR, leadR, cfgR] = await Promise.all([
        supabase.from("gifts").select("*").order("coin_cost",{ascending:true}),
        supabase.from("gift_transactions")
          .select("sender:profiles!sender_id(username,avatar_url), coins:coin_cost.sum(), count:id.count()")
          .limit(10),
        supabase.from("app_config").select("key,value")
          .in("key",["gallery_reset_day","gallery_reset_time","gift_commission"]),
      ]);
      const list = giftR.data ?? [];
      setGifts(list);
      setLeaders(leadR.data ?? []);
      setStats({total:list.length, active:list.filter((g:any)=>g.is_active).length, inGallery:list.filter((g:any)=>g.in_gallery).length, sentWeek:list.reduce((s:number,g:any)=>s+Number(g.total_sent??0),0)});
      for (const c of cfgR.data??[]) {
        if (c.key==="gallery_reset_day") setResetDay(c.value);
        if (c.key==="gallery_reset_time") setResetTime(c.value);
        try { if (c.key==="gift_commission") setCommission(JSON.parse(c.value)); } catch {}
      }
      setLoading(false);
    }
    load();
  }, []);

  async function saveGift() {
    setSaving(true);
    if (editId) {
      const {data} = await supabase.from("gifts").update(form).eq("id",editId).select().single();
      if (data) setGifts(prev=>prev.map(g=>g.id===editId?data:g));
    } else {
      const {data} = await supabase.from("gifts").insert(form).select().single();
      if (data) setGifts(prev=>[...prev,data]);
    }
    setForm(BLANK_FORM); setEditId(null); setSaving(false); setSaved(true);
    setTimeout(()=>setSaved(false),2000); setTab("gallery");
  }

  async function toggleGift(id:string, field:"is_active"|"in_gallery", current:boolean) {
    await supabase.from("gifts").update({[field]:!current}).eq("id",id);
    setGifts(prev=>prev.map(g=>g.id===id?{...g,[field]:!current}:g));
  }

  async function deleteGift(id:string) {
    if (!confirm("Delete this gift?")) return;
    await supabase.from("gifts").delete().eq("id",id);
    setGifts(prev=>prev.filter(g=>g.id!==id));
  }

  function startEdit(g:any) {
    setForm({name:g.name,coin_cost:g.coin_cost,rarity:g.rarity??"common",icon_url:g.icon_url??"",animation_url:g.animation_url??"",category:g.category??"standard",is_active:g.is_active??true,weekly_limit:g.weekly_limit??0,in_gallery:g.in_gallery??false,country_availability:g.country_availability??"global"});
    setEditId(g.id); setTab("create");
  }

  async function saveConfig() {
    setSaving(true);
    await Promise.all([
      supabase.from("app_config").upsert({key:"gallery_reset_day",value:resetDay}),
      supabase.from("app_config").upsert({key:"gallery_reset_time",value:resetTime}),
      supabase.from("app_config").upsert({key:"gift_commission",value:JSON.stringify(commission)}),
    ]);
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),2000);
  }

  const TABS:{key:Tab;label:string}[] = [{key:"gallery",label:"Gift Catalog"},{key:"create",label:editId?"Edit Gift":"Create Gift"},{key:"leaderboard",label:"Top Gifters"},{key:"config",label:"Config & Splits"}];

  const F = ({label,children}:{label:string;children:React.ReactNode}) => (
    <div>
      <label style={{display:"block",fontSize:11,fontWeight:600,color:"var(--muted)",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em"}}>{label}</label>
      {children}
    </div>
  );
  const inputSt = {width:"100%",height:40,padding:"0 12px",borderRadius:10,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text)",fontSize:14,outline:"none"} as React.CSSProperties;

  return (
    <div>
      <PageHeader title="Gift Gallery" sub="Manage gifts, weekly gallery, top gifters, commission splits">
        {tab==="create"&&(
          <button onClick={()=>{setForm(BLANK_FORM);setEditId(null);setTab("gallery");}} style={{padding:"8px 14px",borderRadius:10,border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",fontSize:12,fontWeight:600,cursor:"pointer"}}>
            Cancel
          </button>
        )}
        {tab==="config"&&(
          <button onClick={saveConfig} disabled={saving} style={{padding:"8px 16px",borderRadius:10,border:"none",background:saved?"#10b981":"#7c3aed",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
            <Save size={13}/> {saved?"Saved!":saving?"Saving…":"Save Config"}
          </button>
        )}
      </PageHeader>

      <div style={{padding:"24px 28px",display:"flex",flexDirection:"column",gap:24}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16}}>
          <StatCard label="Total Gifts"     value={stats.total}     icon={Gift}    color="#7c3aed"/>
          <StatCard label="Active Gifts"    value={stats.active}    icon={Check}   color="#10b981"/>
          <StatCard label="In Gallery"      value={stats.inGallery} icon={Trophy}  color="#f59e0b"/>
          <StatCard label="Sent This Week"  value={stats.sentWeek}  icon={RefreshCw} color="#3b82f6"/>
        </div>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",gap:4,background:"var(--bg)",border:"1px solid var(--border)",borderRadius:12,padding:4}}>
            {TABS.map(t=>(
              <button key={t.key} onClick={()=>setTab(t.key)} style={{padding:"7px 16px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:tab===t.key?"#7c3aed":"transparent",color:tab===t.key?"#fff":"var(--muted)"}}>
                {t.label}
              </button>
            ))}
          </div>
          {tab==="gallery"&&(
            <button onClick={()=>{setForm(BLANK_FORM);setEditId(null);setTab("create");}} style={{padding:"8px 16px",borderRadius:10,border:"none",background:"#7c3aed",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
              <Plus size={13}/> New Gift
            </button>
          )}
        </div>

        {/* GALLERY */}
        {tab==="gallery" && (
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {RARITY_OPTIONS.map(rarity=>{
              const slice = gifts.filter(g=>g.rarity===rarity||(!g.rarity&&rarity==="common"));
              if (slice.length===0) return null;
              const rs = RARITY_STYLE[rarity];
              return (
                <div key={rarity} style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,overflow:"hidden"}}>
                  <div style={{padding:"12px 18px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:11,fontWeight:800,padding:"3px 10px",borderRadius:20,color:rs.color,background:rs.bg,textTransform:"capitalize"}}>{rarity}</span>
                    <span style={{fontSize:12,color:"var(--muted)"}}>{slice.length} gifts</span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))"}}>
                    {slice.map(g=>(
                      <div key={g.id} style={{padding:"16px",borderRight:"1px solid var(--border)",borderBottom:"1px solid var(--border)"}}>
                        <div style={{width:48,height:48,borderRadius:12,background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,margin:"0 auto 10px",overflow:"hidden"}}>
                          {g.icon_url?<img src={g.icon_url} alt="" style={{width:"100%",height:"100%",objectFit:"contain"}}/>:"🎁"}
                        </div>
                        <p style={{fontSize:13,fontWeight:700,color:"var(--text)",textAlign:"center",marginBottom:2}}>{g.name}</p>
                        <p style={{fontSize:12,fontWeight:700,color:"#a78bfa",textAlign:"center",marginBottom:10}}>{Number(g.coin_cost).toLocaleString()} coins</p>
                        <div style={{display:"flex",flexDirection:"column",gap:4}}>
                          <div style={{display:"flex",gap:4}}>
                            <button onClick={()=>toggleGift(g.id,"is_active",g.is_active)} style={{flex:1,padding:"4px 0",borderRadius:7,border:"none",fontSize:10,fontWeight:700,cursor:"pointer",background:g.is_active?"rgba(239,68,68,0.1)":"rgba(16,185,129,0.1)",color:g.is_active?"#ef4444":"#10b981"}}>
                              {g.is_active?"Disable":"Enable"}
                            </button>
                            <button onClick={()=>toggleGift(g.id,"in_gallery",g.in_gallery)} style={{flex:1,padding:"4px 0",borderRadius:7,border:"none",fontSize:10,fontWeight:700,cursor:"pointer",background:g.in_gallery?"rgba(245,158,11,0.15)":"rgba(255,255,255,0.05)",color:g.in_gallery?"#f59e0b":"var(--muted)"}}>
                              {g.in_gallery?"In Gallery":"Add Gallery"}
                            </button>
                          </div>
                          <div style={{display:"flex",gap:4}}>
                            <button onClick={()=>startEdit(g)} style={{flex:1,padding:"4px 0",borderRadius:7,border:"1px solid var(--border)",background:"transparent",fontSize:10,fontWeight:600,cursor:"pointer",color:"var(--muted)",display:"flex",alignItems:"center",justifyContent:"center",gap:3}}>
                              <Edit2 size={10}/> Edit
                            </button>
                            <button onClick={()=>deleteGift(g.id)} style={{flex:1,padding:"4px 0",borderRadius:7,border:"1px solid rgba(239,68,68,0.2)",background:"transparent",fontSize:10,fontWeight:600,cursor:"pointer",color:"#ef4444",display:"flex",alignItems:"center",justifyContent:"center",gap:3}}>
                              <Trash2 size={10}/> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {!loading&&gifts.length===0&&<div style={{textAlign:"center",padding:"48px 0",color:"var(--muted)",fontSize:13}}>No gifts yet. Create your first gift.</div>}
          </div>
        )}

        {/* CREATE/EDIT */}
        {tab==="create" && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,padding:24,display:"flex",flexDirection:"column",gap:16}}>
              <p style={{fontSize:15,fontWeight:700,color:"var(--text)"}}>{editId?"Edit Gift":"Create New Gift"}</p>
              <F label="Gift Name"><input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Rose, Galaxy, Universe…" style={inputSt}/></F>
              <F label="Coin Cost"><input type="number" value={form.coin_cost} onChange={e=>setForm(p=>({...p,coin_cost:Number(e.target.value)}))} style={inputSt}/></F>
              <F label="Rarity">
                <select value={form.rarity} onChange={e=>setForm(p=>({...p,rarity:e.target.value}))} style={{...inputSt,height:42}}>
                  {RARITY_OPTIONS.map(r=><option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
                </select>
              </F>
              <F label="Category"><input value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} placeholder="standard / premium / seasonal…" style={inputSt}/></F>
              <F label="Icon URL (emoji or image link)"><input value={form.icon_url} onChange={e=>setForm(p=>({...p,icon_url:e.target.value}))} placeholder="https://… or leave blank for 🎁" style={inputSt}/></F>
              <F label="Animation URL (Lottie / mp4)"><input value={form.animation_url} onChange={e=>setForm(p=>({...p,animation_url:e.target.value}))} placeholder="https://…" style={inputSt}/></F>
              <F label="Country Availability">
                <select value={form.country_availability} onChange={e=>setForm(p=>({...p,country_availability:e.target.value}))} style={{...inputSt,height:42}}>
                  {["global","nigeria","ghana","kenya","south_africa","west_africa","africa"].map(c=><option key={c} value={c}>{c.replace(/_/g," ").replace(/\b\w/g,x=>x.toUpperCase())}</option>)}
                </select>
              </F>
              <F label="Weekly Send Limit (0 = unlimited)"><input type="number" value={form.weekly_limit} onChange={e=>setForm(p=>({...p,weekly_limit:Number(e.target.value)}))} style={inputSt}/></F>
              <div style={{display:"flex",gap:16}}>
                <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:"var(--text)",cursor:"pointer"}}>
                  <input type="checkbox" checked={form.is_active} onChange={e=>setForm(p=>({...p,is_active:e.target.checked}))}/>
                  Active (visible to users)
                </label>
                <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:"var(--text)",cursor:"pointer"}}>
                  <input type="checkbox" checked={form.in_gallery} onChange={e=>setForm(p=>({...p,in_gallery:e.target.checked}))}/>
                  Include in Weekly Gallery
                </label>
              </div>
              <button onClick={saveGift} disabled={saving||!form.name} style={{height:44,borderRadius:12,border:"none",background:"#7c3aed",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>
                {saving?"Saving…":editId?"Update Gift":"Create Gift"}
              </button>
            </div>

            {/* Preview */}
            <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,padding:24}}>
              <p style={{fontSize:15,fontWeight:700,color:"var(--text)",marginBottom:20}}>Preview</p>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
                <div style={{width:80,height:80,borderRadius:20,background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,overflow:"hidden"}}>
                  {form.icon_url?<img src={form.icon_url} alt="" style={{width:"100%",height:"100%",objectFit:"contain"}}/>:"🎁"}
                </div>
                <div style={{fontSize:18,fontWeight:800,color:"var(--text)"}}>{form.name||"Gift Name"}</div>
                <div style={{fontSize:15,fontWeight:700,color:"#a78bfa"}}>{Number(form.coin_cost).toLocaleString()} coins</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"}}>
                  <span style={{fontSize:11,fontWeight:700,padding:"4px 12px",borderRadius:20,...(RARITY_STYLE[form.rarity]||RARITY_STYLE.common),textTransform:"capitalize"}}>{form.rarity}</span>
                  {form.in_gallery&&<span style={{fontSize:11,fontWeight:700,padding:"4px 12px",borderRadius:20,color:"#f59e0b",background:"rgba(245,158,11,0.1)"}}>In Gallery</span>}
                  {form.is_active&&<span style={{fontSize:11,fontWeight:700,padding:"4px 12px",borderRadius:20,color:"#10b981",background:"rgba(16,185,129,0.1)"}}>Active</span>}
                </div>
                {form.country_availability!=="global"&&<div style={{fontSize:11,color:"var(--muted)"}}>Available in: {form.country_availability.replace(/_/g," ").replace(/\b\w/g,(x:string)=>x.toUpperCase())}</div>}
              </div>
            </div>
          </div>
        )}

        {/* LEADERBOARD */}
        {tab==="leaderboard" && (
          <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,overflow:"hidden"}}>
            <div style={{padding:"14px 20px",borderBottom:"1px solid var(--border)"}}>
              <span style={{fontWeight:700,color:"var(--text)"}}>Top Gift Senders This Week</span>
            </div>
            {leaders.length===0?(
              <div style={{textAlign:"center",padding:"48px 0",color:"var(--muted)",fontSize:13}}>No gift data yet</div>
            ):(
              <div>
                {leaders.map((l,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 20px",borderBottom:"1px solid var(--border)"}}>
                    <span style={{width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,flexShrink:0,background:i===0?"rgba(245,158,11,0.15)":i===1?"rgba(255,255,255,0.08)":i===2?"rgba(234,88,12,0.1)":"rgba(255,255,255,0.04)",color:i===0?"#f59e0b":i===1?"rgba(240,242,255,0.5)":i===2?"#f97316":"rgba(240,242,255,0.2)"}}>
                      {i+1}
                    </span>
                    <div style={{width:32,height:32,borderRadius:"50%",background:"var(--bg)",overflow:"hidden",flexShrink:0}}>
                      {l.sender?.avatar_url&&<img src={l.sender.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>}
                    </div>
                    <span style={{flex:1,fontSize:13,fontWeight:600,color:"var(--text)"}}>@{l.sender?.username??"—"}</span>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:13,fontWeight:800,color:"#a78bfa"}}>{Number(l.coins??0).toLocaleString()} coins</div>
                      <div style={{fontSize:11,color:"var(--muted)"}}>{l.count??0} gifts</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CONFIG */}
        {tab==="config" && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,padding:24}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}>
                <RefreshCw size={16} style={{color:"#10b981"}}/>
                <span style={{fontSize:15,fontWeight:700,color:"var(--text)"}}>Weekly Gallery Reset</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div>
                  <label style={{display:"block",fontSize:12,fontWeight:600,color:"var(--muted)",marginBottom:8}}>Reset Day</label>
                  <select value={resetDay} onChange={e=>setResetDay(e.target.value)} style={{width:"100%",height:42,padding:"0 12px",borderRadius:10,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text)",fontSize:14,outline:"none"}}>
                    {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{display:"block",fontSize:12,fontWeight:600,color:"var(--muted)",marginBottom:8}}>Reset Time (WAT)</label>
                  <input type="time" value={resetTime} onChange={e=>setResetTime(e.target.value)} style={{width:"100%",height:42,padding:"0 12px",borderRadius:10,border:"1px solid var(--border)",background:"var(--bg)",color:"var(--text)",fontSize:14,outline:"none"}}/>
                </div>
                <div style={{padding:12,borderRadius:10,background:"rgba(124,58,237,0.08)",border:"1px solid rgba(124,58,237,0.2)"}}>
                  <p style={{fontSize:12,color:"#a78bfa"}}>Gallery resets and shows new featured gifts at the scheduled time. Mark gifts as "In Gallery" in the catalog to include them.</p>
                </div>
              </div>
            </div>

            <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,padding:24}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}>
                <Gift size={16} style={{color:"#f59e0b"}}/>
                <span style={{fontSize:15,fontWeight:700,color:"var(--text)"}}>Gift Commission Split (%)</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                {[
                  {label:"Host Gets (%)",key:"host" as const,color:"#7c3aed"},
                  {label:"Platform Gets (%)",key:"platform" as const,color:"#3b82f6"},
                  {label:"Guest Gets (%)",key:"guest" as const,color:"#10b981"},
                ].map(f=>(
                  <div key={f.key}>
                    <label style={{display:"block",fontSize:12,fontWeight:600,color:f.color,marginBottom:6}}>{f.label}</label>
                    <input type="number" min={0} max={100} value={commission[f.key]}
                      onChange={e=>setCommission(p=>({...p,[f.key]:Number(e.target.value)}))}
                      style={{width:"100%",height:40,padding:"0 12px",borderRadius:10,border:`1px solid ${f.color}40`,background:"var(--bg)",color:"var(--text)",fontSize:14,outline:"none"}}/>
                  </div>
                ))}
                <div style={{padding:12,borderRadius:10,background:commission.host+commission.platform+commission.guest===100?"rgba(16,185,129,0.08)":"rgba(239,68,68,0.08)",border:`1px solid ${commission.host+commission.platform+commission.guest===100?"rgba(16,185,129,0.2)":"rgba(239,68,68,0.2)"}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:13,fontWeight:700}}>
                    <span style={{color:"var(--muted)"}}>Total</span>
                    <span style={{color:commission.host+commission.platform+commission.guest===100?"#10b981":"#ef4444"}}>{commission.host+commission.platform+commission.guest}% {commission.host+commission.platform+commission.guest===100?"✓":"(must equal 100%)"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
