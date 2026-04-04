const USER_AUTH_COOKIE = 'user_auth_token';
const USER_AUTH_MAX_AGE_MS = 30 * 60 * 1000;

const getCookieSameSite = () => (process.env.NODE_ENV === 'production' ? 'none' : 'lax');
const getCookieSecure = () => process.env.NODE_ENV === 'production';

const getUserAuthCookieBaseOptions = () => ({
  httpOnly: true,
  sameSite: getCookieSameSite(),
  secure: getCookieSecure()
});

const getUserAuthCookieOptions = () => ({
  ...getUserAuthCookieBaseOptions(),
  maxAge: USER_AUTH_MAX_AGE_MS
});

module.exports = {
  USER_AUTH_COOKIE,
  USER_AUTH_MAX_AGE_MS,
  getCookieSameSite,
  getCookieSecure,
  getUserAuthCookieBaseOptions,
  getUserAuthCookieOptions
};
