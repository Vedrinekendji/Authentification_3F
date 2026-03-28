require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('./services/logger');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');

// --- PROFESSIONAL LOGGING SYSTEM ---
// Rediriger console vers winston
console.log = (...args) => logger.info(args.join(' '));
console.warn = (...args) => logger.warn(args.join(' '));
console.error = (...args) => logger.error(args.join(' '));

const app = express();

// Log des requêtes HTTP (Morgan)
app.use(morgan(':method :url :status :res[content-length] - :response-time ms', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter, authRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route introuvable.' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Erreur serveur interne.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🛡  Sentinel Sanctuary Backend`);
  console.log(`📡 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`🔧 Mode: ${process.env.DEV_MODE === 'true' ? 'DÉVELOPPEMENT (OTP: ' + process.env.DEV_OTP + ')' : 'PRODUCTION'}`);
});
