import { useState } from 'react';
import api, { errMsg } from '../api';
import { Modal, inr, useToast } from './ui';

const loadRzp = () => new Promise((res, rej) => {
  if (window.Razorpay) return res();
  const s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js';
  s.onload = res; s.onerror = () => rej(new Error('Could not load payment gateway')); document.body.appendChild(s);
});

export default function PayModal({ booking, title, onClose, onPaid }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const pay = async () => {
    setBusy(true);
    try {
      const { data: o } = await api.post('/payments/order', { bookingId: booking._id });
      if (o.mode === 'razorpay') {
        await loadRzp();
        new window.Razorpay({
          key: o.key, amount: o.amount, currency: 'INR', order_id: o.orderId, name: 'Campus Desk', description: title,
          handler: async r => {
            try {
              await api.post('/payments/verify', { bookingId: booking._id, orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature });
              onPaid();
            } catch (e) { toast(errMsg(e), 'error'); setBusy(false); }
          },
          modal: { ondismiss: () => setBusy(false) }
        }).open();
        return;
      }
      await new Promise(r => setTimeout(r, 900));
      await api.post('/payments/verify', { bookingId: booking._id, orderId: o.orderId });
      onPaid();
    } catch (e) { toast(errMsg(e), 'error'); setBusy(false); }
  };
  return (
    <Modal title="Complete payment" onClose={busy ? () => {} : onClose}>
      <div className="paybox">
        <div className="pay-amt"><small>You pay</small><b>{inr(booking.amount)}</b></div>
        <p className="muted">{title}</p>
        <div className="demo-card"><span>Demo payment</span><code>4111 1111 1111 1111</code><small>No real money is charged in demo mode.</small></div>
      </div>
      <div className="modal-foot">
        <button className="btn ghost" onClick={onClose} disabled={busy}>Pay later</button>
        <button className="btn" onClick={pay} disabled={busy}>{busy ? 'Processing…' : `Pay ${inr(booking.amount)}`}</button>
      </div>
    </Modal>
  );
}
