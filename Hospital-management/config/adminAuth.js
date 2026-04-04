const crypto = require('crypto');

const ADMIN_AUTH_COOKIE = 'admin_auth_token';
const ADMIN_LOGIN_PATH = '/admin/login';
const ADMIN_APPOINMENT_PATH = '/admin/appoinment';
const SERVER_BOOT_ID = crypto.randomUUID();

module.exports = {
  ADMIN_AUTH_COOKIE,
  ADMIN_LOGIN_PATH,
  ADMIN_APPOINMENT_PATH,
  SERVER_BOOT_ID
};
