const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const db = require('../config/db');
const { generateOtp, getExpiry, toMySQLDateTime } = require('../utils/otpUtils');
const { sendOtpEmail } = require('../services/emailService');

// --- HELPER DE PROTECTION DES LOGS ---
// @note: Ne pas exposer de données sensibles ici (RGPD)
async function dispatchSecurityAudit(uid, evtType, status, req) {
  try {
    const context = {
        agent: req.headers['user-agent'] || 'unknown',
        ip: req.ip || '0.0.0.0',
        ts: Date.now()
    };
    await db.query(
      'INSERT INTO auth_logs (user_id, action, success, ip_address, user_agent, details) VALUES (?, ?, ?, ?, ?, ?)',
      [uid, evtType, status ? 1 : 0, context.ip, context.agent, JSON.stringify({ meta: context })]
    );
  } catch (auditErr) {
    process.stderr.write(`[Audit_Err]: ${auditErr.message}\n`);
  }
}

// Validation du contexte de session (Interceptor-like)
const resolveAuthContext = async (sHeader) => {
  if (!sHeader) return null;
  try {
    const claims = jwt.verify(sHeader, process.env.SESSION_JWT_SECRET);
    const [matches] = await db.query(
      'SELECT * FROM auth_sessions WHERE session_token = ? AND expires_at > ?',
      [sHeader, toMySQLDateTime(new Date())]
    );
    return matches.length ? { record: matches[0], owner: claims.userId } : null;
  } catch (jwtErr) {
    return null;
  }
};

/* --- FLOW: IDENTIFICATION --- */
router.post('/login', async (req, res) => {
  const { email: rawEmail, password: rawPassword } = req.body;
  if (!rawEmail || !rawPassword) return res.status(400).json({ error: 'FIELDS_REQUIRED' });

  try {
    const [candidates] = await db.query('SELECT * FROM users WHERE email = ?', [rawEmail]);
    if (!candidates.length) {
      console.warn(`[Login] Échec: Compte introuvable pour ${rawEmail}`);
      return res.status(401).json({ message: 'Compte introuvable' });
    }

    const identity = candidates[0];
    const validHash = await bcrypt.compare(rawPassword, identity.password);
    
    if (!validHash) {
      console.warn(`[Login] Échec: Mot de passe incorrect pour ${rawEmail}`);
      await dispatchSecurityAudit(identity.id, 'AUTH_PASSWORD_FAIL', false, req);
      return res.status(401).json({ message: 'Mot de passe incorrect' });
    }

    console.log(`[Login] Succès étape 1 pour ${rawEmail}. Envoi OTP.`);

    // On prépare le tunnel OTP
    const challengeCode = generateOtp(6);
    const sessionKey = jwt.sign({ userId: identity.id, step: 1 }, process.env.SESSION_JWT_SECRET, { expiresIn: '15m' });

    await db.query('DELETE FROM auth_sessions WHERE user_id = ?', [identity.id]);
    await db.query(
      'INSERT INTO auth_sessions (session_token, user_id, step, email_otp, email_otp_exp, expires_at) VALUES (?, ?, 1, ?, ?, ?)',
      [sessionKey, identity.id, challengeCode, toMySQLDateTime(getExpiry(3)), toMySQLDateTime(getExpiry(15))]
    );

    await sendOtpEmail(identity.email, challengeCode);
    res.json({ session_id: sessionKey });

  } catch (err) {
    res.status(500).json({ error: 'CORE_AUTH_FAILURE' });
  }
});

/* --- FLOW: MAIL VALIDATION --- */
router.post('/verify-email-otp', async (req, res) => {
  const { sessionToken, otp } = req.body;
  try {
    const session = await resolveAuthContext(sessionToken);
    if (!session) {
      console.warn(`[OTP] Échec: Session invalide ou expirée.`);
      return res.status(401).json({ error: 'SESSION_INVALID_OR_EXPIRED' });
    }

    if (session.record.email_otp !== otp?.trim()) {
      console.error(`[OTP] Code incorrect fourni pour l'utilisateur ID ${session.owner}`);
      return res.status(401).json({ message: 'Code incorrect' });
    }

    console.log(`[OTP] Code validé pour l'utilisateur ID ${session.owner}. Passage étape PIN.`);

    const nextTunnelKey = jwt.sign({ userId: session.owner, step: 2 }, process.env.SESSION_JWT_SECRET, { expiresIn: '15m' });
    await db.query('UPDATE auth_sessions SET step = 2, session_token = ? WHERE id = ?', [nextTunnelKey, session.record.id]);

    res.json({ session_id: nextTunnelKey });
  } catch (e) {
    res.status(500).json({ error: 'OTP_PROCESS_FAIL' });
  }
});

/* --- FLOW: FINAL PIN ACCESS --- */
router.post('/verify-pin', async (req, res) => {
  const { sessionToken, pin } = req.body;
  try {
    const session = await resolveAuthContext(sessionToken);
    if (!session || session.record.step !== 2) {
      console.warn(`[PIN] Échec: Rupture de séquence ou session expirée.`);
      return res.status(401).json({ error: 'FLOW_SEQUENCE_BREAK' });
    }

    const [u] = await db.query('SELECT pin, email FROM users WHERE id = ?', [session.owner]);
    if (!u.length) return res.status(404).json({ error: 'USER_NOT_FOUND' });
    
    const target = u[0];

    // Vérification du PIN (doit être déjà défini lors de l'inscription)
    if (!target.pin || target.pin !== pin) {
      console.warn(`[PIN] Tentative PIN invalide pour ${target.email}`);
      return res.status(401).json({ message: 'Code PIN invalide' });
    }

    console.log(`[PIN] Accès complet autorisé pour ${target.email}`);

    await db.query('DELETE FROM auth_sessions WHERE id = ?', [session.record.id]);
    const finalToken = jwt.sign({ uid: session.owner, tag: target.email }, process.env.JWT_SECRET, { expiresIn: '8h' });

    await dispatchSecurityAudit(session.owner, 'FULL_COMPLIANCE_SUCCESS', true, req);
    res.json({ authToken: finalToken });
  } catch (err) {
    res.status(500).json({ error: 'FINAL_STAGE_ERROR' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const auth = req.headers.authorization?.split(' ')[1];
    const claims = jwt.verify(auth, process.env.JWT_SECRET);
    
    const [u] = await db.query('SELECT id, email FROM users WHERE id = ?', [claims.uid]);
    const [devices] = await db.query('SELECT COUNT(DISTINCT ip_address) as num FROM auth_logs WHERE user_id = ? AND success = 1', [claims.uid]);
    const [alerts] = await db.query('SELECT COUNT(*) as num FROM auth_logs WHERE user_id = ? AND success = 0', [claims.uid]);
    const [latest] = await db.query('SELECT created_at FROM auth_logs WHERE user_id = ? AND success = 1 ORDER BY created_at DESC LIMIT 1', [claims.uid]);

    res.json({ 
      account: u[0], 
      telemetry: {
        devCount: devices[0].num,
        alertCount: alerts[0].num,
        lastConnection: latest.length ? latest[0].created_at : null
      }
    });
  } catch (e) {
    console.warn(`[Session] Jeton révoqué ou expiré.`);
    res.status(401).json({ error: 'SESSION_REVOKED' });
  }
});

router.get('/my-logs', async (req, res) => {
  try {
    const auth = req.headers.authorization?.split(' ')[1];
    const claims = jwt.verify(auth, process.env.JWT_SECRET);
    
    const [logs] = await db.query(
      'SELECT id, action, success, ip_address, created_at FROM auth_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [claims.uid]
    );
    res.json(logs);
  } catch (e) {
    res.status(401).json({ error: 'SESSION_REVOKED' });
  }
});

router.post('/register', async (req, res) => {
  const { email, password, pin } = req.body;
  if (!email || !password || !pin) return res.status(400).json({ error: 'FIELDS_REQUIRED' });
  
  try {
    const hash = await bcrypt.hash(password, 12);
    // On insère l'email, le mot de passe hashé et le PIN (on pourrait hasher le PIN mais ici on garde la logique précédente d'égalité directe)
    await db.query('INSERT INTO users (email, password, pin) VALUES (?, ?, ?)', [email, hash, pin]);
    
    console.log(`[Register] Nouvel utilisateur créé: ${email}`);
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error(`[Register] Erreur lors de l'inscription de ${email}: ${e.message}`);
    res.status(400).json({ message: 'Identifiant déjà enregistré ou erreur interne' });
  }
});



module.exports = router;
