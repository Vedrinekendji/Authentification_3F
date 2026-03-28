const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter = null;

if (process.env.DEV_MODE === 'false' || process.env.DEV_MODE === false) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  transporter.verify()
    .then(() => console.log(' Connexion SMTP Gmail OK'))
    .catch(err => console.error(' Erreur SMTP Gmail:', err.message));
}

async function sendOtpEmail(to, otp) {
  const html = `
    <div style="font-family: Arial; padding: 20px; text-align: center;">
      <h2 style="color: #1e3a8a;">🛡 authentification</h2>
      <p style="font-size: 16px; color: #555;">Votre code de vérification est :</p>
      <h1 style="color: #1e3a8a; font-size: 40px; letter-spacing: 5px; margin: 20px 0;">${otp}</h1>
      <p style="font-size: 12px; color: #999;">Expire dans 3 minutes.</p>
    </div>
  `;

  if (process.env.DEV_MODE === 'true' || process.env.DEV_MODE === true || !transporter) {
    console.log('\n----------------------------------------');
    console.log(` [SIMULATION] Code pour ${to} : ${otp}`);
    console.log('----------------------------------------\n');
    return true;
  }

  try {
    await transporter.sendMail({
      from: `"authentification 🛡" <${process.env.EMAIL_USER}>`,
      to,
      subject: ` Code de vérification : ${otp}`,
      html,
    });
    console.log(` Email envoyé à ${to}`);
    return true;
  } catch (err) {
    console.error(` Échec envoi email à ${to}:`, err.message);
    throw new Error("Impossible d'envoyer l'email.");
  }
}

module.exports = { sendOtpEmail };
