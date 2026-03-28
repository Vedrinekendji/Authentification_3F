const twilio = require('twilio');
require('dotenv').config();

async function sendOtpSms(to, otp) {
  if (process.env.DEV_MODE === 'true') {
    console.log(`[DEV] SMS OTP pour ${to}: ${otp}`);
    return;
  }

  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  await client.messages.create({
    body: ` Votre code Sentinel Sanctuary : ${otp}\nExpire dans 10 minutes. Ne partagez jamais ce code.`,
    from: process.env.TWILIO_PHONE,
    to,
  });
}

module.exports = { sendOtpSms };
