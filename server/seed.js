require('dotenv').config();
const bcrypt = require('bcryptjs'), mongoose = require('mongoose');
const User = require('./models/User'), Service = require('./models/Service');
(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([User.deleteMany({}), Service.deleteMany({})]);
  await User.create([
    { name: 'Admin', email: 'admin@campus.edu', role: 'admin', passwordHash: await bcrypt.hash('Admin@123', 10) },
    { name: 'Student 108', email: 'student@campus.edu', department: 'CSE', passwordHash: await bcrypt.hash('Student@123', 10) }
  ]);
  await Service.create([
    { name: 'Seminar Hall A', category: 'Hall', price: 500, capacity: 200, description: 'AC hall with projector and sound system.' },
    { name: 'Computer Lab 3', category: 'Lab', price: 300, capacity: 60, description: '60 systems with high-speed internet.' },
    { name: 'Badminton Court', category: 'Sports', price: 100, capacity: 4, description: 'Indoor wooden court.' },
    { name: 'Library Study Room', category: 'Library', price: 50, capacity: 8, description: 'Silent group study room.' },
    { name: 'College Bus (Day Trip)', category: 'Transport', price: 1500, capacity: 40, description: 'For academic visits and events.' },
    { name: 'Projector Rental', category: 'Equipment', price: 150, capacity: 1, description: 'Portable HD projector.' }
  ]);
  console.log('Seeded. Admin: admin@campus.edu / Admin@123 | User: student@campus.edu / Student@123');
  process.exit(0);
})();
