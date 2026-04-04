const jwt = require('jsonwebtoken');
const {
  ADMIN_AUTH_COOKIE,
  ADMIN_LOGIN_PATH,
  SERVER_BOOT_ID,
  getAdminAuthCookieBaseOptions
} = require('../config/adminAuth');

function getAdminTokenFromRequest(req) {
  if (req.cookies) {
    return req.cookies[ADMIN_AUTH_COOKIE];
  } else {
    return null;
  }
}

const clearAdminAuthCookie = (res) => {
  res.clearCookie(ADMIN_AUTH_COOKIE, getAdminAuthCookieBaseOptions());
};

const requireAdminAuth = (req, res, next) => {
  const token = getAdminTokenFromRequest(req);

  if (!token) {
    return res.redirect(ADMIN_LOGIN_PATH);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.serverBootId !== SERVER_BOOT_ID) {
      clearAdminAuthCookie(res);
      return res.redirect(ADMIN_LOGIN_PATH);
    }

    req.adminId = decoded.id;
    return next();
  } catch (error) {
    clearAdminAuthCookie(res);
    return res.redirect(ADMIN_LOGIN_PATH);
  }
};

module.exports = {
  getAdminTokenFromRequest,
  clearAdminAuthCookie,
  requireAdminAuth
};
