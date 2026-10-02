import React, { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { useLocation, useNavigate } from "react-router-dom";
import { useFeedback } from "../feedback/FeedbackProvider";
export function Login() {
  const {login,isAuthenticated}=useAuth();
  const navigate=useNavigate();
  const location=useLocation();
  const [email,setEmail]=useState("admin@chemora.com");
  const [password,setPassword]=useState("Admin@123");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);

  useEffect(()=>{if(isAuthenticated) navigate("/dashboard",{replace:true})},[isAuthenticated,navigate]);

  async function submit(e) {
    e.preventDefault(); setBusy(true); setError("");
    try { await login(email,password); navigate(location.state?.from?.pathname||"/dashboard",{replace:true}); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Login failed"); }
    finally { setBusy(false); }
  }

  return <div className="login-page">
    <div className="login-visual">
      <div className="visual-brand">CHEMORA</div>
      <div className="visual-copy">
        <p>THE CHEMICAL INDUSTRY CRM</p>
        <h1>Stronger Relationships<br/>Create a Cleaner <em>Tomorrow.</em></h1>
        <span>Sales, customers, products and operations — connected in one platform.</span>
      </div>
    </div>
    <div className="login-panel">
      <div className="login-card">
        <div className="mini-brand">CHEMORA</div>
        <p className="eyebrow">WELCOME BACK</p>
        <h2>Sign in to your workspace</h2>
        <p className="muted">Manage your chemical business from one place.</p>
        <form onSubmit={submit}>
          <label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/>
          <label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/>
          {error && <div className="form-error">{error}</div>}
          <button className="primary-btn full" disabled={busy}>{busy?"Signing in...":"Sign In"}<ArrowRight size={17}/></button>
        </form>
        <div className="secure-note"><ShieldCheck size={16}/> Protected by Chemora authentication & RBAC</div>
      </div>
    </div>
  </div>;
}
