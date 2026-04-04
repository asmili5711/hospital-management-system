var express = require('express');
var router = express.Router();

const publicController = require('../controllers/publicController');

// Temporary compatibility redirects while admin routes move to /admin.
[
  ['/', '/admin/login'],
  ['/dashboard', '/admin/dashboard'],
  ['/login', '/admin/login'],
  ['/doctors_management', '/admin/doctors_management'],
  ['/form', '/admin/form'],
  ['/user_management', '/admin/user_management'],
  ['/appoinment', '/admin/appoinment'],
  ['/appointment', '/admin/appointment'],
  ['/appointments', '/admin/appointments'],
  ['/appoiment', '/admin/appoiment'],
  ['/reports', '/admin/reports'],
  ['/logout', '/admin/logout']
].forEach(([from, to]) => {
  router.get(from, (req, res) => res.redirect(to));
});

[
  ['/login', '/admin/login'],
  ['/logout', '/admin/logout']
].forEach(([from, to]) => {
  router.post(from, (req, res) => res.redirect(307, to));
});

router.get('/doctors', publicController.getDoctors);
router.get('/doctors/:id', publicController.getDoctorById);

module.exports = router;
