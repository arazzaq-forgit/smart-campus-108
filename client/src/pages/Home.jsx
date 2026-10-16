import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import ServiceCard from '../components/ServiceCard';
import { CAT, CATEGORIES } from '../components/ui';

const board = [['09:00', 'taken'], ['10:00', 'free'], ['11:00', 'free'], ['12:00', 'taken'], ['14:00', 'free'], ['15:00', 'mine']];

export default function Home() {
  const [q, setQ] = useState('');
  const [top, setTop] = useState([]);
  const nav = useNavigate();
  useEffect(() => { api.get('/services', { params: { limit: 4 } }).then(r => setTop(r.data.data)).catch(() => {}); }, []);
  return (
    <>
      <section className="hero">
        <div className="wrap hero-in">
          <div className="hero-copy">
            <h1>Book a hall, lab or court before the queue forms.</h1>
            <p>One place to reserve campus services, pay, and follow your booking from request to confirmation.</p>
            <form className="search" onSubmit={e => { e.preventDefault(); nav(`/services?q=${encodeURIComponent(q)}`); }}>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Try “seminar hall” or “badminton”" aria-label="Search services" />
              <button className="btn">Search</button>
            </form>
            <div className="chips">
              {CATEGORIES.slice(0, 6).map(c => <Link key={c} to={`/services?category=${c}`} className="chip" style={{ '--c': CAT[c].color }}>{CAT[c].icon} {c}</Link>)}
            </div>
          </div>
          <div className="board" aria-hidden="true">
            <div className="board-head"><b>Seminar Hall A</b><span>Tomorrow</span></div>
            <div className="board-grid">
              {board.map(([t, s]) => <div key={t} className={`bslot ${s}`}><b>{t}</b><small>{s === 'taken' ? 'Booked' : s === 'mine' ? 'You' : 'Free'}</small></div>)}
            </div>
            <div className="board-foot"><span>₹500 per slot</span><span className="pill">Confirmed in one tap</span></div>
          </div>
        </div>
      </section>

      <section className="wrap steps">
        {[['Pick a service', 'Search by name, category or price and see free slots for the day you need.'],
          ['Choose your slot', 'Taken slots are greyed out, so you can’t double book.'],
          ['Pay and track', 'Pay online, then follow the status on your booking ticket.']].map(([t, d], i) => (
          <div className="step" key={t}><span className="step-n">{i + 1}</span><h3>{t}</h3><p>{d}</p></div>
        ))}
      </section>

      <section className="wrap section">
        <div className="section-head"><h2>Popular on campus</h2><Link to="/services" className="link">See all services</Link></div>
        <div className="grid">{top.map(s => <ServiceCard key={s._id} s={s} />)}</div>
      </section>
      <footer className="footer"><div className="wrap">Campus Desk · Smart Campus Service Booking and Management System</div></footer>
    </>
  );
}
