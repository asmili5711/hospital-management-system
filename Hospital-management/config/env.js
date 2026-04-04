const REQUIRED_ENV_VARS = ['MONGODB_URI', 'JWT_SECRET', 'FRONTEND_ORIGIN'];

const validateEnv = () => {
  const missing = REQUIRED_ENV_VARS.filter((key) => {
    const value = process.env[key];
    return value === undefined || value === null || String(value).trim() === '';
  });

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

module.exports = {
  REQUIRED_ENV_VARS,
  validateEnv
};
