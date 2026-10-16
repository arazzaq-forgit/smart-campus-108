import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext';
import PayModal from '../components/PayModal';
import { CAT, Empty, Spinner, Stars, fmtDate, inr, tomorrow, useToast } from '../components/ui';

export default function ServiceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate(), toast = useToast();
  const [s, setS] = useState(null), [missing, setMissing] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [date, setDate] = useState(tomorrow());
  const [slots, setSlots] = useState([]), [slot, setSlot] = useState('');
  const [busy, setBusy] = useState(false), [booking, setBooking] = useState(null);

  useEffect(() => {
    api.get(`/services/${id}`).then(r => setS(r.data)).catch(() => setMissing(true));
    api.get(`/feedback/service/${id}`).then(r => setReviews(r.data)).catch(() => {});
  }, [id]);
  const loadSlots = () => api.get(`/services/${id}/availability`, { params: { date } }).then(r => setSlots(r.data)).catch(() => setSlots([]));
  useEffect(() => { setSlot(''); loadSlots(); }, [id, date]);

  if (missing) return <div className="wrap page"><Empty icon="🧭" title="Service not found" action={<Link className="btn" to="/services">Browse services</Link>} /></div>;
  if (!s) return <div className="wrap page"><Spinner /></div>;
  const c = CAT[s.category] || CAT.Other;

  const book = async () => {
    if (!user) return nav('/login', { state: { from: `/services/${id}` } });
    if (user.role === 'admin') return toast('Admins manage bookings from the admin panel.', 'error');
    if (!slot) return toast('Pick a time slot first.', 'error');
    setBusy(true);
    try { const { data } = await api.post('/bookings', { service: id, date, slot }); setBooking(data); toast('Slot reserved. Complete payment to confirm.'); }
    catch (e) { toast(errMsg(e), 'error'); loadSlots(); }
    setBusy(false);
  };

  return (
    <div className="wrap page detail">
      <div className="detail-main">
        <div className="detail-hero" style={{ '--c': c.color }}>
          <span className="detail-ico">{c.icon}</span>
          <div><span className="scard-cat">{s.category}</span><h1>{s.name}</h1>
            <div className="row"><Stars value={s.avgRating} /><small>{s.ratingCount ? `${s.avgRating.toFixed(1)} from ${s.ratingCount} reviews` : 'No reviews yet'}</small></div></div>
        </div>
        <p className="lead">{s.description || 'Available for booking on campus.'}</p>
        <div className="facts"><div><small>Price</small><b>{inr(s.price)}</b><small>per slot</small></div><div><small>Capacity</small><b>{s.capacity}</b><small>people</small></div><div><small>Slots a day</small><b>{s.slots.length}</b><small>bookable</small></div></div>
        <h2>Reviews</h2>
        {reviews.length === 0 ? <p className="muted">No reviews yet. Reviews appear after a completed booking.</p>
          : reviews.map(r => <div className="review" key={r._id}><div className="row"><b>{r.user?.name || 'Student'}</b><Stars value={r.rating} size={14} /></div>{r.comment && <p>{r.comment}</p>}</div>)}
      </div>

      <aside className="booker">
        <h3>Reserve a slot</h3>
        <label>Date<input type="date" min={tomorrow()} value={date} onChange={e => e.target.value && setDate(e.target.value)} /></label>
        <div className="slot-grid">
          {slots.map(x => <button key={x.slot} disabled={!x.available} className={`slot ${slot === x.slot ? 'sel' : ''}`} onClick={() => setSlot(x.slot)}>{x.slot}{!x.available && <small>Booked</small>}</button>)}
        </div>
        <div className="sum"><span>{slot ? `${fmtDate(date)} · ${slot}` : 'No slot selected'}</span><b>{inr(s.price)}</b></div>
        <button className="btn block" onClick={book} disabled={busy}>{busy ? 'Reserving…' : user ? 'Reserve and pay' : 'Log in to book'}</button>
      </aside>

      {booking && <PayModal booking={booking} title={`${s.name} · ${fmtDate(date)} · ${slot}`}
        onClose={() => { setBooking(null); nav('/my-bookings'); }}
        onPaid={() => { toast('Payment received. Booking confirmed.'); setBooking(null); nav('/my-bookings'); }} />}
    </div>
  );
}
