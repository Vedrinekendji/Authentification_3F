const crypto = require('crypto');


function generateOtp(length = 6) {
  return crypto.randomInt(10 ** (length - 1), 10 ** length).toString();
}


function getExpiry(minutes = 3) {
  return new Date(Date.now() + minutes * 60 * 1000);
}


function toMySQLDateTime(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

module.exports = { generateOtp, getExpiry, toMySQLDateTime };
