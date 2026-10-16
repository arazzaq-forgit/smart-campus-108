require('dotenv').config();
const app = require('./app'), connectDB = require('./config/db');
connectDB().then(() => app.listen(process.env.PORT || 5000, () => console.log('API running on port ' + (process.env.PORT || 5000))))
  .catch(e => { console.error('DB connection failed', e.message); process.exit(1); });
