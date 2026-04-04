const crypto = require('crypto');
const Patient = require('../models/Patient');
const UserSession = require('../models/UserSession');
const {
  USER_AUTH_COOKIE,
  USER_AUTH_MAX_AGE_MS,
  getUserAuthCookieBaseOptions
} = require('../config/userAuth');

const getUserTokenFromRequest = (req) => {
  return req.cookies ? req.cookies[USER_AUTH_COOKIE] : null;
};

const hashUserSessionToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const createUserSession = async (patientId) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + USER_AUTH_MAX_AGE_MS);

  await UserSession.create({
    patient: patientId,
    tokenHash: hashUserSessionToken(token),
    expiresAt,
    lastSeenAt: new Date()
  });

  return {
    token,
    expiresAt
  };
};

const clearUserAuthCookie = (res) => {
  res.clearCookie(USER_AUTH_COOKIE, getUserAuthCookieBaseOptions());
};

const deleteUserSession = async (sessionId) => {
  if (!sessionId) return;
  await UserSession.findByIdAndDelete(sessionId);
};

const deleteUserSessionsForPatient = async (patientId) => {
  if (!patientId) return;
  await UserSession.deleteMany({ patient: patientId });
};

const verifyToken = async (req, res, next) => {
  const token = getUserTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized - Missing token' });
  }

  try {
    const tokenHash = hashUserSessionToken(token);
    const session = await UserSession.findOne({
      tokenHash,
      expiresAt: { $gt: new Date() }
    }).select('patient expiresAt');

    if (!session) {
      clearUserAuthCookie(res);
      return res.status(401).json({ success: false, message: 'Unauthorized - Invalid session' });
    }

    const patient = await Patient.findById(session.patient).select('isBlocked');
    if (!patient) {
      await deleteUserSession(session._id);
      clearUserAuthCookie(res);
      return res.status(401).json({ success: false, message: 'Unauthorized - Patient not found' });
    }

    if (patient.isBlocked) {
      await deleteUserSession(session._id);
      clearUserAuthCookie(res);
      return res.status(403).json({ success: false, message: 'Account is blocked by admin' });
    }

    req.userId = String(session.patient);
    req.userSessionId = session._id;
    req.userSessionExpiresAt = session.expiresAt;
    return next();
  } catch (error) {
    clearUserAuthCookie(res);
    return res.status(401).json({ success: false, message: 'Unauthorized - Invalid session' });
  }
};

module.exports = {
  verifyToken,
  createUserSession,
  deleteUserSession,
  deleteUserSessionsForPatient,
  getUserTokenFromRequest,
  hashUserSessionToken,
  clearUserAuthCookie
};
