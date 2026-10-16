import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api, { errMsg } from '../api';
import { CATEGORIES, Empty, Modal, Spinner, StatusBadge, fmtDate, inr, useToast } from '../components/ui';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SCOL = { Pending: '#E79A0B', Confirmed: '#5B4BFF', Completed: '#14B87A', Cancelled: '#94A3B8', Rejected: '#F2594B' };

function Overview() {
  const [s, setS] = useState(null);
  useEffect(() => { api.get('/admin/stats').then(r => setS(r.data)).catch(() => setS({ byStatus: [], byService: [], monthly: [], revenue: 0, users: 0, totalBookings: 0 })); }, []);
  if (!s) return <Spinner />;
  const pending = s.byStatus.find(x => x._id === 'Pending')?.count || 0;
  const tiles = [['Total bookings', s.totalBookings], ['Revenue', inr(s.revenue)], ['Students', s.users], ['Awaiting action', pending]];
  return (
    <>
      <div className="tiles">{tiles.map(([k, v]) => <div className="tile" key={k}><small>{k}</small><b>{v}</b></div>)}</div>
      <div className="charts">
        <div className="panel"><h3>Most booked services</h3>
          {s.byService.length ? <ResponsiveContainer width="100%" height={260}><BarChart data={s.byService}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E2F7" /><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" name="Bookings" fill="#5B4BFF" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer> : <p className="muted">No bookings yet.</p>}</div>
        <div className="panel"><h3>Booking status</h3>
          {s.byStatus.length ? <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={s.byStatus} dataKey="count" nameKey="_id" innerRadius={55} outerRadius={90} paddingAngle={3}>{s.byStatus.map(x => <Cell key={x._id} fill={SCOL[x._id]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer> : <p className="muted">No bookings yet.</p>}
          <div className="legend">{s.byStatus.map(x => <span key={x._id}><i style={{ background: SCOL[x._id] }} />{x._id} {x.count}</span>)}</div></div>
        <div className="panel wide2"><h3>Revenue by month (₹)</h3>
          {s.monthly.length ? <ResponsiveContainer width="100%" height={240}><BarChart data={s.monthly.map(m => ({ month: MONTHS[m._id - 1], revenue: m.revenue }))}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E2F7" /><XAxis dataKey="month" /><YAxis /><Tooltip formatter={v => inr(v)} /><Bar dataKey="revenue" fill="#14B87A" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer> : <p className="muted">Revenue appears after the first paid booking.</p>}</div>
      </div>
    </>
  );
}

const blank = { name: '', category: 'Hall', price: 0, capacity: 1, description: '', slots: '09:00-10:00, 10:00-11:00, 11:00-12:00, 12:00-13:00, 14:00-15:00, 15:00-16:00', isActive: true };
function Services() {
  const toast = useToast();
  const [list, setList] = useState(null), [form, setForm] = useState(null);
  const load = () => api.get('/services', { params: { limit: 100 } }).then(r => setList(r.data.data)).catch(() => setList([]));
  useEffect(() => { load(); }, []);
  const save = async e => {
    e.preventDefault();
    const body = { name: form.name, category: form.category, description: form.description, price: +form.price, capacity: +form.capacity, isActive: form.isActive,
      slots: form.slots.split(',').map(x => x.trim()).filter(Boolean) };
    try {
      form._id ? await api.put(`/services/${form._id}`, body) : await api.post('/services', body);
      toast(form._id ? 'Service updated.' : 'Service added.'); setForm(null); load();
    } catch (er) { toast(errMsg(er), 'error'); }
  };
  const remove = async s => { if (!confirm(`Delete ${s.name}?`)) return; try { await api.delete(`/services/${s._id}`); toast('Service deleted.'); load(); } catch (e) { toast(errMsg(e), 'error'); } };
  const on = k => e => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  if (!list) return <Spinner />;
  return (
    <>
      <div className="bar"><span>{list.length} services</span><button className="btn sm" onClick={() => setForm(blank)}>Add service</button></div>
      <div className="table-wrap"><table>
        <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Rating</th><th></th></tr></thead>
        <tbody>{list.map(s => <tr key={s._id}><td><b>{s.name}</b></td><td>{s.category}</td><td>{inr(s.price)}</td><td>{s.ratingCount ? s.avgRating.toFixed(1) : '-'}</td>
          <td className="acts"><button className="btn ghost sm" onClick={() => setForm({ ...s, slots: s.slots.join(', ') })}>Edit</button><button className="btn danger sm" onClick={() => remove(s)}>Delete</button></td></tr>)}</tbody>
      </table></div>
      {form && <Modal title={form._id ? 'Edit service' : 'Add service'} onClose={() => setForm(null)} wide>
        <form onSubmit={save} className="form-grid">
          <label>Name<input required value={form.name} onChange={on('name')} /></label>
          <label>Category<select value={form.category} onChange={on('category')}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></label>
          <label>Price per slot (₹)<input type="number" min="0" required value={form.price} onChange={on('price')} /></label>
          <label>Capacity<input type="number" min="1" value={form.capacity} onChange={on('capacity')} /></label>
          <label className="full">Description<textarea rows="3" value={form.description} onChange={on('description')} /></label>
          <label className="full">Time slots <small>(comma separated)</small><input value={form.slots} onChange={on('slots')} /></label>
          <label className="check full"><input type="checkbox" checked={form.isActive} onChange={on('isActive')} /> Visible to students</label>
          <div className="modal-foot full"><button type="button" className="btn ghost" onClick={() => setForm(null)}>Cancel</button><button className="btn">Save service</button></div>
        </form></Modal>}
    </>
  );
}

function Bookings() {
  const toast = useToast();
  const [list, setList] = useState(null), [status, setStatus] = useState('');
  const load = () => api.get('/bookings', { params: status ? { status } : {} }).then(r => setList(r.data)).catch(() => setList([]));
  useEffect(() => { setList(null); load(); }, [status]);
  const act = async (b, st) => { try { await api.patch(`/bookings/${b._id}/status`, { status: st }); toast(`Booking ${st.toLowerCase()}.`); load(); } catch (e) { toast(errMsg(e), 'error'); } };
  return (
    <>
      <div className="bar"><select value={status} onChange={e => setStatus(e.target.value)} aria-label="Filter status"><option value="">All statuses</option>{Object.keys(SCOL).map(s => <option key={s}>{s}</option>)}</select></div>
      {!list ? <Spinner /> : list.length === 0 ? <Empty icon="📭" title="No bookings" hint="Nothing matches this filter." /> :
        <div className="table-wrap"><table>
          <thead><tr><th>Student</th><th>Service</th><th>When</th><th>Amount</th><th>Status</th><th></th></tr></thead>
          <tbody>{list.map(b => <tr key={b._id}><td><b>{b.user?.name}</b><br /><small>{b.user?.email}</small></td><td>{b.service?.name}</td><td>{fmtDate(b.date)}<br /><small>{b.slot}</small></td>
            <td>{inr(b.amount)}<br /><small>{b.paymentStatus}</small></td><td><StatusBadge status={b.status} /></td>
            <td className="acts">
              {b.status === 'Pending' && <><button className="btn sm" onClick={() => act(b, 'Confirmed')}>Approve</button><button className="btn danger sm" onClick={() => act(b, 'Rejected')}>Reject</button></>}
              {b.status === 'Confirmed' && <button className="btn sm" onClick={() => act(b, 'Completed')}>Mark completed</button>}
            </td></tr>)}</tbody>
        </table></div>}
    </>
  );
}

function Users() {
  const toast = useToast();
  const [list, setList] = useState(null);
  const load = () => api.get('/admin/users').then(r => setList(r.data)).catch(() => setList([]));
  useEffect(() => { load(); }, []);
  const toggle = async u => { try { await api.patch(`/admin/users/${u._id}/block`); toast(u.isBlocked ? 'User unblocked.' : 'User blocked.'); load(); } catch (e) { toast(errMsg(e), 'error'); } };
  if (!list) return <Spinner />;
  return <div className="table-wrap"><table>
    <thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Role</th><th></th></tr></thead>
    <tbody>{list.map(u => <tr key={u._id}><td><b>{u.name}</b></td><td>{u.email}</td><td>{u.department || '-'}</td><td>{u.role}{u.isBlocked && <span className="badge b-Rejected"> Blocked</span>}</td>
      <td className="acts">{u.role !== 'admin' && <button className={`btn sm ${u.isBlocked ? '' : 'danger'}`} onClick={() => toggle(u)}>{u.isBlocked ? 'Unblock' : 'Block'}</button>}</td></tr>)}</tbody>
  </table></div>;
}

export default function Admin() {
  const [tab, setTab] = useState('Overview');
  const tabs = { Overview, Services, Bookings, Users };
  const View = tabs[tab];
  return (
    <div className="wrap page">
      <div className="page-head"><h1>Admin dashboard</h1><p>Manage services, bookings and students.</p></div>
      <div className="tabs">{Object.keys(tabs).map(t => <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>)}</div>
      <View />
    </div>
  );
}
