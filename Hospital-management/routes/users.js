var express = require('express');
var router = express.Router();

const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/userAuth');
const {
  userLoginLimiter,
  bookingLimiter
} = require('../middleware/rateLimit');

router.post('/signup', userController.signup);
router.post('/login', userLoginLimiter, userController.login);
router.get('/session', verifyToken, userController.getSession);
router.post('/book-appointment', verifyToken, bookingLimiter, userController.bookAppointment);
router.get('/booking-history', verifyToken, userController.getBookingHistory);
router.put('/appointments/:appointmentId/cancel', verifyToken, userController.cancelAppointment);
router.get('/profile', verifyToken, userController.getProfile);
router.put('/profile', verifyToken, userController.updateProfile);
router.post('/profile/change-password', verifyToken, userController.changePassword);
router.post('/logout', verifyToken, userController.logout);

module.exports = router;
