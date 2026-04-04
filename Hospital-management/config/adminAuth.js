const crypto = require('crypto');

const ADMIN_AUTH_COOKIE = 'admin_auth_token';
const ADMIN_LOGIN_PATH = '/admin/login';
const ADMIN_APPOINMENT_PATH = '/admin/appoinment';
const SERVER_BOOT_ID = crypto.randomUUID();
const ADMIN_AUTH_MAX_AGE_MS = 8 * 60 * 60 * 1000;

const getCookieSameSite = () => (process.env.NODE_ENV === 'production' ? 'none' : 'lax');
const getCookieSecure = () => process.env.NODE_ENV === 'production';

const getAdminAuthCookieBaseOptions = () => ({
  httpOnly: true,
  sameSite: getCookieSameSite(),
  secure: getCookieSecure()
});

const getAdminAuthCookieOptions = () => ({
  ...getAdminAuthCookieBaseOptions(),
  maxAge: ADMIN_AUTH_MAX_AGE_MS
});

module.exports = {
  ADMIN_AUTH_COOKIE,
  ADMIN_LOGIN_PATH,
  ADMIN_APPOINMENT_PATH,
  SERVER_BOOT_ID,
  ADMIN_AUTH_MAX_AGE_MS,
  getCookieSameSite,
  getCookieSecure,
  getAdminAuthCookieBaseOptions,
  getAdminAuthCookieOptions
};
