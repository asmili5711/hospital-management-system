var express = require('express');
var router = express.Router();
const csurf = require('csurf');

const doctorUpload = require('../middleware/doctorUpload');
const { requireAdminAuth } = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController');
const { adminLoginLimiter } = require('../middleware/rateLimit');

const adminCsrfProtection = csurf({
  cookie: {
    key: 'admin_csrf_secret',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  },
  value: (req) => {
    if (req.body && typeof req.body._csrf === 'string') return req.body._csrf;
    if (req.query && typeof req.query._csrf === 'string') return req.query._csrf;

    return (
      req.headers['csrf-token'] ||
      req.headers['xsrf-token'] ||
      req.headers['x-csrf-token'] ||
      req.headers['x-xsrf-token']
    );
  }
});

router.use(adminCsrfProtection);
router.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

router.get('/login', adminController.showLogin);
router.post('/login', adminLoginLimiter, adminController.login);

router.get('/logout', requireAdminAuth, adminController.showLogout);
router.post('/logout', requireAdminAuth, adminController.logout);

router.get('/doctors_management', requireAdminAuth, adminController.showDoctorsManagement);
router.get('/user_management', requireAdminAuth, adminController.showUserManagement);
router.get('/profile', requireAdminAuth, adminController.showProfile);
router.post('/profile/change-password', requireAdminAuth, adminController.changePassword);

router.get('/users/:patientId/bookings', requireAdminAuth, adminController.showUserBookings);
router.post('/users/:patientId/block', requireAdminAuth, adminController.blockUser);
router.post('/users/:patientId/unblock', requireAdminAuth, adminController.unblockUser);

router.post('/appointments/:patientId/:appointmentId/status', requireAdminAuth, adminController.updateAppointmentStatus);
router.get('/appoinment', requireAdminAuth, adminController.showAppointments);

['/appointment', '/appointments', '/appoiment'].forEach((path) => {
  router.get(path, requireAdminAuth, adminController.redirectToAppointments);
});

router.get('/reports', requireAdminAuth, adminController.showReports);

router.post('/doctors', requireAdminAuth, doctorUpload.single('imageFile'), adminController.createDoctor);
router.get('/doctors/:doctorId/edit', requireAdminAuth, adminController.showEditDoctorForm);
router.post('/doctors/:doctorId/update', requireAdminAuth, doctorUpload.single('imageFile'), adminController.updateDoctor);
router.post('/doctors/:doctorId/delete', requireAdminAuth, adminController.deleteDoctor);
router.get('/form', requireAdminAuth, adminController.showDoctorForm);

module.exports = router;
