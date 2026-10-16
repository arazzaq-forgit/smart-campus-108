import { createContext, useContext, useState, useCallback } from 'react';

export const CAT = {
  Hall: { icon: '🏛️', color: '#5B4BFF' }, Lab: { icon: '💻', color: '#0E9F9A' }, Sports: { icon: '🏸', color: '#F2594B' },
  Transport: { icon: '🚌', color: '#E79A0B' }, Library: { icon: '📚', color: '#B02BC4' }, Equipment: { icon: '🎥', color: '#0A7FC2' },
  Other: { icon: '✨', color: '#64748B' }
};
export const CATEGORIES = Object.keys(CAT);
export const inr = n => '₹' + Number(n || 0).toLocaleString('en-IN');
export const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
export const tomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 1); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };

export function StatusBadge({ status }) { return <span className={`badge b-${status}`}>{status}</span>; }

export function Stars({ value = 0, onChange, size = 18 }) {
  return (
    <span className="stars" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map(n => (
        <button type="button" key={n} disabled={!onChange} onClick={() => onChange?.(n)} style={{ fontSize: size }}
          className={n <= Math.round(value) ? 'on' : ''} aria-label={`${n} star`}>★</button>
      ))}
    </span>
  );
}

export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose} aria-label="Close">✕</button></div>
        {children}
      </div>
    </div>
  );
}

export function Empty({ icon = '🔎', title, hint, action }) {
  return <div className="empty"><div className="empty-ico">{icon}</div><h3>{title}</h3>{hint && <p>{hint}</p>}{action}</div>;
}
export const Spinner = () => <div className="spinner" role="status" aria-label="Loading" />;

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((msg, type = 'ok') => {
    const id = Math.random();
    setItems(i => [...i, { id, msg, type }]);
    setTimeout(() => setItems(i => i.filter(t => t.id !== id)), 4000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite">{items.map(t => <div key={t.id} className={`toast t-${t.type}`}>{t.msg}</div>)}</div>
    </ToastCtx.Provider>
  );
}
