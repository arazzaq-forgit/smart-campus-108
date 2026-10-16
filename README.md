# Smart Campus Service Booking and Management System (MERN)
Roll No: 108

## Run the backend
cd server
cp .env.example .env      # set MONGO_URI and JWT_SECRET
npm install
npm run seed              # admin@campus.edu / Admin@123 ; student@campus.edu / Student@123
npm run dev               # http://localhost:5000/api/health
npm test

PAYMENT_MODE=mock works without any Razorpay keys (demo payment). Switch to razorpay and add keys for test-mode checkout.

## Phases
1. Backend API (done)   2. React frontend   3. Admin dashboard   4. Testing   5. Deployment
