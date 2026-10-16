import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const close = () => setOpen(false);
  return (
    <header className="nav no-print">
      <div className="wrap nav-in">
        <Link to="/" className="brand" onClick={close}><span className="brand-mark">🎟️</span>Campus Desk</Link>
        <button className="burger" onClick={() => setOpen(o => !o)} aria-label="Menu" aria-expanded={open}>{open ? '✕' : '☰'}</button>
        <nav className={`links ${open ? 'open' : ''}`} onClick={close}>
          <NavLink to="/services">Services</NavLink>
          {user && user.role !== 'admin' && <NavLink to="/my-bookings">My bookings</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
          <span className="grow" />
          {user ? (
            <>
              <span className="who"><i>{user.name[0].toUpperCase()}</i>{user.name.split(' ')[0]}</span>
              <button className="btn ghost sm" onClick={() => { logout(); nav('/'); }}>Log out</button>
            </>
          ) : (
            <>
              <Link className="btn ghost sm" to="/login">Log in</Link>
              <Link className="btn sm" to="/register">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
