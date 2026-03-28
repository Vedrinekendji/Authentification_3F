const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend/.env') });
const db = require('./backend/src/config/db');

async function check() {
  try {
    const [cols] = await db.query('SHOW COLUMNS FROM users');
    console.log('Columns:', cols.map(c => c.Field));
    const [users] = await db.query('SELECT id, email, is_admin FROM users LIMIT 5');
    console.log('Users:', users);
    process.exit(0);
  } catch (err) {
    console.error('Database Check Result:', err.message);
    process.exit(1);
  }
}
check();
