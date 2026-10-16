import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import ServiceCard from '../components/ServiceCard';
import { CAT, CATEGORIES, Empty, Spinner } from '../components/ui';

export default function Services() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '', category = params.get('category') || '', sort = params.get('sort') || '-avgRating';
  const maxPrice = params.get('maxPrice') || '', page = +(params.get('page') || 1);
  const [text, setText] = useState(q);
  const [data, setData] = useState({ data: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const set = (k, v) => { const p = new URLSearchParams(params); v ? p.set(k, v) : p.delete(k); if (k !== 'page') p.delete('page'); setParams(p); };

  useEffect(() => {
    setLoading(true);
    api.get('/services', { params: { q, category, sort, maxPrice, page, limit: 9 } })
      .then(r => setData(r.data)).catch(() => setData({ data: [], total: 0, pages: 1 })).finally(() => setLoading(false));
  }, [q, category, sort, maxPrice, page]);

  return (
    <div className="wrap page">
      <div className="page-head"><h1>Campus services</h1><p>{data.total} available to book</p></div>
      <div className="filters">
        <form onSubmit={e => { e.preventDefault(); set('q', text.trim()); }} className="search sm">
          <input value={text} onChange={e => setText(e.target.value)} placeholder="Search services" aria-label="Search" />
          <button className="btn sm">Search</button>
        </form>
        <select value={sort} onChange={e => set('sort', e.target.value)} aria-label="Sort">
          <option value="-avgRating">Top rated</option><option value="price">Price: low to high</option>
          <option value="-price">Price: high to low</option><option value="-createdAt">Newest</option>
        </select>
        <select value={maxPrice} onChange={e => set('maxPrice', e.target.value)} aria-label="Max price">
          <option value="">Any price</option><option value="200">Up to ₹200</option><option value="500">Up to ₹500</option><option value="1000">Up to ₹1,000</option>
        </select>
      </div>
      <div className="chips">
        <button className={`chip ${!category ? 'active' : ''}`} onClick={() => set('category', '')}>All</button>
        {CATEGORIES.map(c => <button key={c} style={{ '--c': CAT[c].color }} className={`chip ${category === c ? 'active' : ''}`} onClick={() => set('category', c)}>{CAT[c].icon} {c}</button>)}
      </div>
      {loading ? <Spinner /> : data.data.length === 0
        ? <Empty title="No services match" hint="Try a different word or clear the filters." action={<button className="btn" onClick={() => { setText(''); setParams({}); }}>Clear filters</button>} />
        : <div className="grid">{data.data.map(s => <ServiceCard key={s._id} s={s} />)}</div>}
      {data.pages > 1 && (
        <div className="pager">
          <button className="btn ghost sm" disabled={page <= 1} onClick={() => set('page', page - 1)}>Previous</button>
          <span>Page {page} of {data.pages}</span>
          <button className="btn ghost sm" disabled={page >= data.pages} onClick={() => set('page', page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
