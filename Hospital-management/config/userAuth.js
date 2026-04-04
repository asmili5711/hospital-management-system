const USER_AUTH_COOKIE = 'user_auth_token';
const USER_AUTH_MAX_AGE_MS = 30 * 60 * 1000;

const getUserAuthCookieBaseOptions = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production'
});

const getUserAuthCookieOptions = () => ({
  ...getUserAuthCookieBaseOptions(),
  maxAge: USER_AUTH_MAX_AGE_MS
});

module.exports = {
  USER_AUTH_COOKIE,
  USER_AUTH_MAX_AGE_MS,
  getUserAuthCookieBaseOptions,
  getUserAuthCookieOptions
};
