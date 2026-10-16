const nodemailer = require('nodemailer');
const User = require('../models/User'), Service = require('../models/Service');

let transporter;
const configured = () => process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
const mailer = () => (transporter ||= nodemailer.createTransport({
  host: process.env.SMTP_HOST, port: +(process.env.SMTP_PORT || 587), secure: process.env.SMTP_PORT === '465',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
}));

const TEXT = {
  created: ['Booking received', 'We have reserved your slot. Pay online to confirm it.'],
  paid: ['Payment received, booking confirmed', 'Your payment was successful and the booking is confirmed.'],
  confirmed: ['Booking confirmed', 'Your booking has been approved.'],
  completed: ['Booking completed', 'Thanks for using the service. You can now rate it from My bookings.'],
  cancelled: ['Booking cancelled', 'Your booking was cancelled. Paid amounts are marked for refund.'],
  rejected: ['Booking rejected', 'Sorry, the administrator could not accept this booking. Paid amounts are marked for refund.']
};

exports.notify = async (booking, event) => {
  try {
    const [user, service] = await Promise.all([User.findById(booking.user), Service.findById(booking.service)]);
    const t = TEXT[event];
    if (!user || !t) return;
    const when = new Date(booking.date).toISOString().slice(0, 10) + ' ' + booking.slot;
    const subject = `Campus Desk: ${t[0]}`;
    const text = `Hi ${user.name},\n\n${t[1]}\n\nService: ${service?.name}\nWhen: ${when}\nAmount: Rs ${booking.amount}\nStatus: ${booking.status} (${booking.paymentStatus})\n\nCampus Desk`;
    if (!configured()) return console.log(`[mail not configured] to ${user.email}: ${subject}`);
    await mailer().sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to: user.email, subject, text });
  } catch (e) { console.error('Email failed:', e.message); }
};
