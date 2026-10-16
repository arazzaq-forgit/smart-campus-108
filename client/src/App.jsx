import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Auth from './pages/Auth';
import MyBookings from './pages/MyBookings';
import Admin from './pages/Admin';
import Receipt from './pages/Receipt';
import { Empty } from './components/ui';

function Private({ role, children }) {
  const { user } = useAuth(), loc = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}
export default function App() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:id" element={<ServiceDetail />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/register" element={<Auth mode="register" />} />
          <Route path="/my-bookings" element={<Private><MyBookings /></Private>} />
          <Route path="/receipt/:id" element={<Private><Receipt /></Private>} />
          <Route path="/admin" element={<Private role="admin"><Admin /></Private>} />
          <Route path="*" element={<div className="wrap page"><Empty icon="🧭" title="Page not found" /></div>} />
        </Routes>
      </main>
    </>
  );
}
