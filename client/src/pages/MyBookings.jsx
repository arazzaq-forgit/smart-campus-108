import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import PayModal from '../components/PayModal';
import { CAT, Empty, Modal, Spinner, Stars, StatusBadge, fmtDate, inr, useToast } from '../components/ui';

const FLOW = ['Pending', 'Confirmed', 'Completed'];

function Track({ b }) {
  if (['Cancelled', 'Rejected'].includes(b.status)) return <div className="track dead"><span>{b.status === 'Rejected' ? 'Rejected by admin' : 'Cancelled'}{b.paymentStatus === 'Refunded' ? ' · refund issued' : ''}</span></div>;
  const at = FLOW.indexOf(b.status);
  return <div className="track">{FLOW.map((st, i) => <div key={st} className={i <= at ? 'done' : ''}><i />{st}</div>)}</div>;
}

export default function MyBookings() {
  const toast = useToast();
  const [list, setList] = useState(null), [filter, setFilter] = useState('All');
  const [pay, setPay] = useState(null), [rate, setRate] = useState(null);
  const [stars, setStars] = useState(5), [comment, setComment] = useState('');
  const load = () => api.get('/bookings/mine').then(r => setList(r.data)).catch(e => { toast(errMsg(e), 'error'); setList([]); });
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

  const cancel = async b => {
    if (!confirm('Cancel this booking?')) return;
    try { await api.patch(`/bookings/${b._id}/cancel`); toast('Booking cancelled.'); load(); } catch (e) { toast(errMsg(e), 'error'); }
  };
  const sendRating = async () => {
    try { await api.post('/feedback', { booking: rate._id, rating: stars, comment }); toast('Thanks for your feedback.'); setRate(null); setComment(''); setStars(5); load(); }
    catch (e) { toast(errMsg(e), 'error'); }
  };
  if (!list) return <div className="wrap page"><Spinner /></div>;
  const shown = list.filter(b => filter === 'All' || b.status === filter);

  return (
    <div className="wrap page">
      <div className="page-head"><h1>My bookings</h1><p>Statuses refresh every 30 seconds.</p></div>
      <div className="chips">{['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled', 'Rejected'].map(f => <button key={f} className={`chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>)}</div>
      {shown.length === 0 ? <Empty icon="🎟️" title="No bookings here yet" hint="Reserve a slot and your ticket will show up on this page." action={<Link className="btn" to="/services">Find a service</Link>} /> :
        <div className="tickets">
          {shown.map(b => {
            const c = CAT[b.service?.category] || CAT.Other;
            return (
              <article className="ticket" key={b._id} style={{ '--c': c.color }}>
                <div className="t-main">
                  <div className="t-top"><span className="t-ico">{c.icon}</span><div><h3>{b.service?.name || 'Removed service'}</h3><p>{fmtDate(b.date)} · {b.slot}</p></div><StatusBadge status={b.status} /></div>
                  <Track b={b} />
                </div>
                <div className="t-stub">
                  <b>{inr(b.amount)}</b>
                  <span className={`pay p-${b.paymentStatus}`}>{b.paymentStatus}</span>
                  <small>#{b._id.slice(-6).toUpperCase()}</small>
                  <div className="t-actions">
                    {b.status === 'Pending' && b.paymentStatus === 'Unpaid' && <button className="btn sm" onClick={() => setPay(b)}>Pay now</button>}
                    {['Pending', 'Confirmed'].includes(b.status) && <button className="btn ghost sm" onClick={() => cancel(b)}>Cancel</button>}
                    {b.status === 'Completed' && <button className="btn sm" onClick={() => setRate(b)}>Rate</button>}
                    {b.paymentStatus !== 'Unpaid' && <Link className="btn ghost sm" to={`/receipt/${b._id}`}>Receipt</Link>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>}
      {pay && <PayModal booking={pay} title={`${pay.service?.name} · ${fmtDate(pay.date)} · ${pay.slot}`} onClose={() => setPay(null)} onPaid={() => { toast('Payment received. Booking confirmed.'); setPay(null); load(); }} />}
      {rate && <Modal title={`Rate ${rate.service?.name}`} onClose={() => setRate(null)}>
        <div className="rate"><Stars value={stars} onChange={setStars} size={34} />
          <textarea rows="4" maxLength="500" placeholder="What went well? What could be better?" value={comment} onChange={e => setComment(e.target.value)} /></div>
        <div className="modal-foot"><button className="btn ghost" onClick={() => setRate(null)}>Cancel</button><button className="btn" onClick={sendRating}>Send feedback</button></div>
      </Modal>}
    </div>
  );
}
