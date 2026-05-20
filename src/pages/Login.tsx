import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) navigate("/");
    else setError("Invalid credentials. Try admin@soko.app / soko2026");
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-2xl font-black text-white mx-auto mb-3">S</div>
          <h1 className="text-[22px] font-black text-white">Soko Admin</h1>
          <p className="text-[12px] text-white/30 mt-1">Platform control center</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#12121c] border border-[#1e1e2e] rounded-2xl p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/25 rounded-xl px-3 py-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-[11px] text-red-300">{error}</p>
            </div>
          )}

          <div>
            <label className="text-[11px] text-white/40 font-bold uppercase tracking-wider block mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="admin@soko.app"
                className="w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded-xl pl-10 pr-4 py-3 text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-purple-500/60" />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-white/40 font-bold uppercase tracking-wider block mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••"
                className="w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded-xl pl-10 pr-10 py-3 text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-purple-500/60" />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-black text-[13px] text-white disabled:opacity-50 transition-all"
            style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-[10px] text-white/15 mt-4">
          Authorised personnel only · Soko Platform v2.0
        </p>
      </div>
    </div>
  );
}
