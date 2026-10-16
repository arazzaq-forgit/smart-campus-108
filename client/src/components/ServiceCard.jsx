import { Link } from 'react-router-dom';
import { CAT, inr, Stars } from './ui';

export default function ServiceCard({ s }) {
  const c = CAT[s.category] || CAT.Other;
  return (
    <Link to={`/services/${s._id}`} className="scard" style={{ '--c': c.color }}>
      <div className="scard-top"><span className="scard-ico">{c.icon}</span><span className="scard-cat">{s.category}</span></div>
      <div className="scard-body">
        <h3>{s.name}</h3>
        <p>{s.description || 'Available for booking on campus.'}</p>
        <div className="scard-meta">
          <span><Stars value={s.avgRating} size={14} /> <small>{s.ratingCount ? `(${s.ratingCount})` : 'New'}</small></span>
          <span>Up to {s.capacity}</span>
        </div>
      </div>
      <div className="scard-foot"><b>{inr(s.price)}</b><small>per slot</small><span className="go">Book</span></div>
    </Link>
  );
}
