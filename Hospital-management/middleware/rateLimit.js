const rateLimit = require('express-rate-limit');

const buildJsonMessage = (message) => ({
  success: false,
  message
});

const buildLimiter = ({ windowMs, max, message, skipSuccessfulRequests = false }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    message: buildJsonMessage(message)
  });

const userLoginLimiter = buildLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts. Please try again in 10 minutes.',
  skipSuccessfulRequests: true
});

const adminLoginLimiter = buildLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: 'Too many admin login attempts. Please try again in 10 minutes.',
  skipSuccessfulRequests: true
});

const bookingLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many booking requests. Please try again later.'
});

module.exports = {
  userLoginLimiter,
  adminLoginLimiter,
  bookingLimiter
};
