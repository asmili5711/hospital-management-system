const sendInternalServerError = (res, message = 'Internal server error') =>
  res.status(500).json({
    success: false,
    message
  });

module.exports = {
  sendInternalServerError
};
