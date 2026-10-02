import { useId, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { Button } from '../components/ui/Button';

export function LoginPage() {
  const { signIn, loading, error } = useAuth();
  const identifierId = useId();
  const passwordId = useId();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [validation, setValidation] = useState<{ identifier?: string; password?: string }>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: typeof validation = {};
    const value = identifier.trim();
    if (!value) next.identifier = 'Enter your email or username.';
    else if (value.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) next.identifier = 'Enter a valid email address.';
    if (!password) next.password = 'Enter your password.';
    setValidation(next);
    if (Object.keys(next).length) return;
    await signIn(value, password);
  }

  return <main className="login-page"><section className="login-art" aria-label="NeoCRM workspace introduction"><Link className="login-brand" to="/login"><span className="brand-mark">N</span><span>Neo<span className="brand-light">CRM</span></span></Link><div className="login-art-content"><p className="eyebrow">A CLEARER VIEW OF YOUR CHEMICAL BUSINESS</p><h1>Stronger relationships.<br/>A cleaner tomorrow.</h1><p>One considered workspace for every connection across the chemical value chain.</p></div><div className="login-art-footer"><span>CHEMORA GROUP</span><span>BUILT FOR THE CHEMICAL INDUSTRY</span></div></section><section className="login-panel"><div className="login-form-wrap"><div className="login-mobile-brand"><span className="brand-mark">N</span><span>Neo<span className="brand-light">CRM</span></span></div><p className="eyebrow">WELCOME TO YOUR WORKSPACE</p><h2>Good to see you.</h2><p className="login-subtitle">Sign in with your work account to continue.</p><form className="login-form" onSubmit={handleSubmit} noValidate>
      <div className="form-field"><label htmlFor={identifierId}>Email or username</label><input id={identifierId} name="identifier" type="text" autoComplete="username" placeholder="you@company.com" value={identifier} onChange={event=>{setIdentifier(event.target.value);setValidation(current=>({...current,identifier:undefined}));}} aria-invalid={Boolean(validation.identifier)} aria-describedby={validation.identifier?`${identifierId}-error`:undefined}/>{validation.identifier&&<span className="field-error" id={`${identifierId}-error`}>{validation.identifier}</span>}</div>
      <div className="form-field"><label htmlFor={passwordId}>Password</label><input id={passwordId} name="password" type="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={event=>{setPassword(event.target.value);setValidation(current=>({...current,password:undefined}));}} aria-invalid={Boolean(validation.password)} aria-describedby={validation.password?`${passwordId}-error`:undefined}/>{validation.password&&<span className="field-error" id={`${passwordId}-error`}>{validation.password}</span>}</div>
      {error&&<div className="auth-error" role="alert"><span aria-hidden="true">!</span><span>{error}</span></div>}
      <Button type="submit" className="login-submit" disabled={loading}>{loading?<><span className="button-spinner"/>Signing in…</>:'Sign in'}{!loading&&<span aria-hidden="true">→</span>}</Button>
    </form><p className="login-help">Authentication is not connected yet. Your team’s sign-in service will be available here once integrated.</p><div className="login-bottom"><span>NeoCRM <i>·</i> Chemora Group</span><span>FRONTEND PREVIEW</span></div></div></section></main>;
}
