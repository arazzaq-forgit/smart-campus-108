import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext';

export default function Auth({ mode }) {
  const reg = mode === 'register';
  const { login } = useAuth();
  const nav = useNavigate(), loc = useLocation();
  const [f, setF] = useState({ name: '', email: '', password: '', department: '' });
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const on = k => e => setF({ ...f, [k]: e.target.value });
  const submit = async e => {
    e.preventDefault(); setErr('');
    if (reg && !/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(f.password)) return setErr('Password needs 8+ characters with letters and numbers.');
    setBusy(true);
    try {
      const { data } = await api.post(reg ? '/auth/register' : '/auth/login', reg ? f : { email: f.email, password: f.password });
      login(data);
      nav(data.user.role === 'admin' ? '/admin' : loc.state?.from || '/services', { replace: true });
    } catch (e) { setErr(errMsg(e)); }
    setBusy(false);
  };
  return (
    <div className="auth">
      <div className="auth-art">
        <h2>{reg ? 'Your campus, one login away.' : 'Welcome back.'}</h2>
        <p>Reserve halls, labs, courts and more. Pay online and watch your booking move from pending to confirmed.</p>
        <div className="ticket-mini"><b>Seminar Hall A</b><span>Tomorrow · 10:00-11:00</span><em>Confirmed</em></div>
      </div>
      <form className="auth-form" onSubmit={submit}>
        <h1>{reg ? 'Create your account' : 'Log in'}</h1>
        {err && <div className="alert" role="alert">{err}</div>}
        {reg && <label>Full name<input required value={f.name} onChange={on('name')} autoComplete="name" /></label>}
        <label>College email<input type="email" required value={f.email} onChange={on('email')} autoComplete="email" /></label>
        {reg && <label>Department <small>(optional)</small><input value={f.department} onChange={on('department')} /></label>}
        <label>Password<input type="password" required value={f.password} onChange={on('password')} autoComplete={reg ? 'new-password' : 'current-password'} /></label>
        <button className="btn block" disabled={busy}>{busy ? 'Please wait…' : reg ? 'Create account' : 'Log in'}</button>
        <p className="muted center">{reg ? <>Already registered? <Link to="/login">Log in</Link></> : <>New here? <Link to="/register">Create an account</Link></>}</p>
        {!reg && <p className="hint">Demo student: student@campus.edu / Student@123<br />Demo admin: admin@campus.edu / Admin@123</p>}
      </form>
    </div>
  );
}
