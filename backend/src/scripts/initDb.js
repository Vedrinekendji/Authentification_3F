

require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function initDatabase() {
  console.log(' Initialisation de la base de données Sentinel Sanctuary...\n');

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  const dbName = process.env.DB_NAME || 'sentinel_auth';
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE \`${dbName}\``);
  console.log(` Base de données "${dbName}" prête.`);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      email       VARCHAR(255) NOT NULL UNIQUE,
      password    VARCHAR(255) NOT NULL,
      pin         VARCHAR(6),
      phone       VARCHAR(20),
      totp_secret VARCHAR(255),
      totp_setup  BOOLEAN DEFAULT FALSE,
      is_active   BOOLEAN DEFAULT TRUE,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log(' Table "users" créée.');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS auth_sessions (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      session_token VARCHAR(512) NOT NULL UNIQUE,
      user_id       INT NOT NULL,
      step          TINYINT DEFAULT 1,
      email_otp     VARCHAR(6),
      email_otp_exp DATETIME,
      sms_otp       VARCHAR(6),
      sms_otp_exp   DATETIME,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at    DATETIME NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log(' Table "auth_sessions" créée.');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS auth_logs (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      user_id     INT,
      action      VARCHAR(100) NOT NULL,
      success     BOOLEAN DEFAULT FALSE,
      ip_address  VARCHAR(45),
      user_agent  TEXT,
      details     JSON,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  console.log(' Table "auth_logs" créée.');
  
  // S'assurer que la colonne PIN existe (Migration)
  try {
    await conn.query('ALTER TABLE users ADD COLUMN pin VARCHAR(6) AFTER password');
    console.log(' Migration: Colonne "pin" ajoutée à "users".');
  } catch (err) {
    // Si la colonne existe déjà, on ignore
  }


  const indexes = [
    'CREATE INDEX idx_auth_sessions_token ON auth_sessions(session_token)',
    'CREATE INDEX idx_auth_sessions_user ON auth_sessions(user_id)',
    'CREATE INDEX idx_auth_sessions_expires ON auth_sessions(expires_at)',
    'CREATE INDEX idx_auth_logs_user ON auth_logs(user_id)',
  ];
  for (const sql of indexes) {
    try { await conn.query(sql); } catch { }
  }
  console.log(' Index créés.');

  const testEmail = 'admin@sentinel.com';
  const testPassword = 'Test1234!';
  const testPhone = '+33600000000';

  const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [testEmail]);
  if (existing.length === 0) {
    const hash = await bcrypt.hash(testPassword, 12);
    await conn.query(
      'INSERT INTO users (email, password, phone, pin, totp_setup) VALUES (?, ?, ?, ?, FALSE)',
      [testEmail, hash, testPhone, '123456']
    );
    console.log(`\nUtilisateur de test créé :`);
  } else {
    console.log(`\n Utilisateur de test déjà existant :`);
  }
  console.log(`    Email    : ${testEmail}`);
  console.log(`    Password : ${testPassword}`);
  console.log(`    Téléphone: ${testPhone}`);

  await conn.end();
  console.log('\n Initialisation terminée !\n');
  console.log(' Prochaines étapes :');
  console.log('   1. Lancez le backend : npm run dev');
  console.log('   2. Lancez le frontend : cd ../frontend && npm run dev');
  console.log('   3. Connectez-vous avec les identifiants de test');
  console.log('   4. En mode DEV, le code OTP est toujours : 123456');
}

initDatabase().catch(err => {
  console.error(' Erreur:', err.message);
  process.exit(1);
});
