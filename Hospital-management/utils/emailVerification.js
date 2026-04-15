const crypto = require('crypto');

const EMAIL_VERIFICATION_TOKEN_BYTES = 32;
const DEFAULT_EMAIL_VERIFICATION_TTL_MINUTES = 30;

const normalizeDomain = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/^@/, '');

const getTrustedEmailDomains = () =>
  String(process.env.TRUSTED_EMAIL_DOMAINS || '')
    .split(',')
    .map((domain) => normalizeDomain(domain))
    .filter(Boolean);

const getEmailDomain = (email = '') => normalizeDomain(String(email).split('@')[1] || '');

const isTrustedEmail = (email = '') => {
  const trustedDomains = getTrustedEmailDomains();
  if (trustedDomains.length === 0) {
    return true;
  }

  return trustedDomains.includes(getEmailDomain(email));
};

const getEmailVerificationTtlMinutes = () => {
  const ttlMinutes = Number(process.env.EMAIL_VERIFICATION_TTL_MINUTES);

  if (!Number.isFinite(ttlMinutes) || ttlMinutes <= 0) {
    return DEFAULT_EMAIL_VERIFICATION_TTL_MINUTES;
  }

  return ttlMinutes;
};

const hashEmailVerificationToken = (token) =>
  crypto.createHash('sha256').update(String(token || '')).digest('hex');

const createEmailVerificationToken = () => {
  const token = crypto.randomBytes(EMAIL_VERIFICATION_TOKEN_BYTES).toString('hex');
  const expiresAt = new Date(Date.now() + getEmailVerificationTtlMinutes() * 60 * 1000);

  return {
    token,
    tokenHash: hashEmailVerificationToken(token),
    expiresAt
  };
};

module.exports = {
  createEmailVerificationToken,
  getEmailDomain,
  getTrustedEmailDomains,
  hashEmailVerificationToken,
  isTrustedEmail
};
