const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const Admin = require('../models/admin');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const {
  ADMIN_AUTH_COOKIE,
  ADMIN_LOGIN_PATH,
  ADMIN_APPOINMENT_PATH,
  SERVER_BOOT_ID
} = require('../config/adminAuth');
const { getAdminTokenFromRequest, clearAdminAuthCookie } = require('../middleware/adminAuth');
const {
  validateAdminLoginPayload,
  validateAdminPasswordChangePayload,
  validateDoctorPayload
} = require('../utils/validators');
const { sendInternalServerError } = require('../utils/apiResponse');

const ADMIN_ALLOWED_APPOINTMENT_STATUSES = new Set(['Confirmed', 'Cancelled', 'Completed']);
const ADMIN_LOCKED_APPOINTMENT_STATUSES = new Set(['Completed', 'Cancelled', 'Cancelled by User']);

const renderLoginPage = (res, options = {}) =>
  res.status(options.statusCode || 200).render('login', {
    showNavbar: false,
    pageCss: 'login.css',
    errorMessage: options.errorMessage || '',
    emailValue: options.emailValue || ''
  });

const invalidCredentialsResponse = (res, emailValue = '') =>
  renderLoginPage(res, {
    statusCode: 401,
    errorMessage: 'Invalid email or password',
    emailValue
  });

const isBcryptHash = (password = '') =>
  password.startsWith('$2a$') || password.startsWith('$2b$') || password.startsWith('$2y$');

const getUploadedImagePath = (file) => {
  if (!file || !file.filename) return '';
  return `/images/${file.filename}`;
};

const removeDoctorImageIfLocal = (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string') return;
  if (!imagePath.startsWith('/images/')) return;

  const absolutePath = path.join(__dirname, '..', 'public', imagePath.replace(/^\//, ''));
  const imagesRoot = path.join(__dirname, '..', 'public', 'images');

  if (!absolutePath.startsWith(imagesRoot)) return;

  fs.unlink(absolutePath, (error) => {
    if (error && error.code !== 'ENOENT') {
      console.error('Error removing doctor image file:', error);
    }
  });
};

const getSafeReturnTo = (returnTo) => {
  if (typeof returnTo !== 'string') return ADMIN_APPOINMENT_PATH;
  return returnTo.startsWith(ADMIN_APPOINMENT_PATH) ? returnTo : ADMIN_APPOINMENT_PATH;
};

const getSafeAdminReturnTo = (returnTo) => {
  if (typeof returnTo !== 'string') return ADMIN_APPOINMENT_PATH;
  return returnTo.startsWith('/admin/') ? returnTo : ADMIN_APPOINMENT_PATH;
};

const getDoctorFormFeedback = (code) => {
  const messages = {
    file_too_large: 'Image must be 5 MB or smaller.',
    invalid_file_type: 'Only JPG, PNG, WEBP, and AVIF images are allowed.',
    invalid_file_content: 'Uploaded file content is not a valid image.',
    upload_failed: 'Unable to process the uploaded image right now.'
  };

  if (!code || !messages[code]) return null;
  return {
    type: 'error',
    message: messages[code]
  };
};

const getAdminAppointmentActions = ({ status, isUpcoming }) => {
  if (ADMIN_LOCKED_APPOINTMENT_STATUSES.has(status)) {
    return {
      canAdminApprove: false,
      canAdminCancel: false,
      canAdminComplete: false
    };
  }

  if (status === 'Pending') {
    return {
      canAdminApprove: isUpcoming,
      canAdminCancel: isUpcoming,
      canAdminComplete: false
    };
  }

  if (status === 'Confirmed') {
    return {
      canAdminApprove: false,
      canAdminCancel: isUpcoming,
      canAdminComplete: !isUpcoming
    };
  }

  return {
    canAdminApprove: false,
    canAdminCancel: false,
    canAdminComplete: false
  };
};

const getAdminAppointmentStatusError = (targetStatus, { status, isUpcoming }) => {
  const actions = getAdminAppointmentActions({ status, isUpcoming });

  if (targetStatus === 'Confirmed' && !actions.canAdminApprove) {
    if (!isUpcoming) {
      return 'Past appointments cannot be approved';
    }

    return 'This appointment cannot be approved by admin';
  }

  if (targetStatus === 'Cancelled' && !actions.canAdminCancel) {
    if (!isUpcoming) {
      return 'Past appointments cannot be cancelled by admin';
    }

    return 'This appointment cannot be cancelled by admin';
  }

  if (targetStatus === 'Completed' && !actions.canAdminComplete) {
    if (status !== 'Confirmed') {
      return 'Only confirmed appointments can be marked as completed';
    }

    return 'Appointments can only be marked completed after the scheduled time';
  }

  return '';
};

const renderUserManagementPage = async (req, res, next) => {
  try {
    const patients = await Patient.find()
      .select('name isBlocked appointments')
      .sort({ createdAt: -1 });

    const users = patients.map((patient) => ({
      id: patient._id,
      name: patient.name,
      isBlocked: Boolean(patient.isBlocked),
      appointmentCount: Array.isArray(patient.appointments) ? patient.appointments.length : 0
    }));

    return res.render('user_management', {
      title: 'User Management',
      showNavbar: true,
      pageCss: 'userManagement.css',
      activePage: 'users',
      users
    });
  } catch (error) {
    console.error('Error rendering user management page:', error);
    return next(error);
  }
};

const renderDoctorsManagementPage = async (req, res, next) => {
  try {
    const doctors = await Doctor.find()
      .select('name department')
      .sort({ createdAt: -1 });

    return res.render('doctors', {
      title: 'Doctors Management',
      showNavbar: true,
      pageCss: 'doctors.css',
      activePage: 'doctors',
      doctors
    });
  } catch (error) {
    console.error('Error rendering doctors management page:', error);
    return next(error);
  }
};

exports.showLogin = (req, res) => {
  const token = getAdminTokenFromRequest(req);

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.serverBootId !== SERVER_BOOT_ID) {
        clearAdminAuthCookie(res);
        return renderLoginPage(res);
      }

      return res.redirect(ADMIN_APPOINMENT_PATH);
    } catch (error) {
      clearAdminAuthCookie(res);
    }
  }

  return renderLoginPage(res);
};

exports.login = async (req, res) => {
  try {
    const validation = validateAdminLoginPayload(req.body);
    if (!validation.ok) {
      return renderLoginPage(res, {
        statusCode: 400,
        errorMessage: validation.message,
        emailValue: req.body && req.body.email ? req.body.email : ''
      });
    }

    const { email, password } = validation.data;

    if (!process.env.JWT_SECRET) {
      return renderLoginPage(res, {
        statusCode: 500,
        errorMessage: 'Server configuration error: JWT secret is missing',
        emailValue: email
      });
    }

    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      return invalidCredentialsResponse(res, email);
    }

    const storedPassword = admin.password || '';
    const isPasswordValid =
      isBcryptHash(storedPassword) && await bcrypt.compare(password, storedPassword);

    if (!isPasswordValid) {
      return invalidCredentialsResponse(res, email);
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: 'admin', serverBootId: SERVER_BOOT_ID },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.cookie(ADMIN_AUTH_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000
    });

    return res.redirect(ADMIN_APPOINMENT_PATH);
  } catch (error) {
    console.error('Admin login error:', error);
    return renderLoginPage(res, {
      statusCode: 500,
      errorMessage: 'Error during login',
      emailValue: req.body && req.body.email ? req.body.email : ''
    });
  }
};

exports.showLogout = (req, res) =>
  res.render('logout', {
    title: 'Logout',
    showNavbar: true,
    pageCss: 'login.css',
    activePage: 'logout'
  });

exports.logout = (req, res) => {
  res.clearCookie(ADMIN_AUTH_COOKIE);
  return res.redirect(ADMIN_LOGIN_PATH);
};

exports.showDoctorsManagement = (req, res, next) => renderDoctorsManagementPage(req, res, next);

exports.showUserManagement = (req, res, next) => renderUserManagementPage(req, res, next);

exports.showProfile = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.adminId).select('email createdAt');

    if (!admin) {
      clearAdminAuthCookie(res);
      return res.redirect(ADMIN_LOGIN_PATH);
    }

    const returnTo = getSafeAdminReturnTo(req.query.returnTo);
    const status = typeof req.query.status === 'string' ? req.query.status : '';
    const code = typeof req.query.code === 'string' ? req.query.code : '';

    let feedback = null;
    if (status === 'success' && code === 'password-updated') {
      feedback = { type: 'success', message: 'Password updated successfully.' };
    } else if (status === 'error') {
      const errorMessages = {
        missing_fields: 'Please fill in all password fields.',
        password_mismatch: 'New password and confirm password must match.',
        password_too_short: 'New password must be at least 6 characters.',
        password_same_as_old: 'New password cannot be the same as the current password.',
        incorrect_password: 'Current password is incorrect.',
        admin_not_found: 'Admin account not found.',
        update_failed: 'Unable to update password right now.'
      };

      feedback = {
        type: 'error',
        message: errorMessages[code] || 'Unable to process your request.'
      };
    }

    return res.render('admin_profile', {
      title: 'Admin Profile',
      showNavbar: true,
      pageCss: 'adminProfile.css',
      activePage: 'profile',
      admin: {
        email: admin.email,
        role: 'Admin',
        createdAt: admin.createdAt
      },
      returnTo,
      feedback
    });
  } catch (error) {
    console.error('Error rendering admin profile page:', error);
    return next(error);
  }
};

exports.changePassword = async (req, res) => {
  try {
    const returnTo = getSafeAdminReturnTo(req.body.returnTo);
    const validation = validateAdminPasswordChangePayload(req.body);
    if (!validation.ok) {
      return res.redirect(`/admin/profile?status=error&code=${encodeURIComponent(validation.code || 'update_failed')}&returnTo=${encodeURIComponent(returnTo)}`);
    }

    const { currentPassword, newPassword } = validation.data;

    const admin = await Admin.findById(req.adminId).select('+password');
    if (!admin) {
      clearAdminAuthCookie(res);
      return res.redirect(`/admin/profile?status=error&code=admin_not_found&returnTo=${encodeURIComponent(returnTo)}`);
    }

    const storedPassword = admin.password || '';
    const isPasswordValid =
      isBcryptHash(storedPassword) && await bcrypt.compare(currentPassword, storedPassword);

    if (!isPasswordValid) {
      return res.redirect(`/admin/profile?status=error&code=incorrect_password&returnTo=${encodeURIComponent(returnTo)}`);
    }

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    return res.redirect(`/admin/profile?status=success&code=password-updated&returnTo=${encodeURIComponent(returnTo)}`);
  } catch (error) {
    console.error('Error changing admin password:', error);
    return res.redirect('/admin/profile?status=error&code=update_failed');
  }
};

exports.showUserBookings = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(404).render('error', { message: 'Patient not found', error: {} });
    }

    const patient = await Patient.findById(patientId)
      .select('name email phone age gender address appointments')
      .populate('appointments.doctor', 'name department');

    if (!patient) {
      return res.status(404).render('error', { message: 'Patient not found', error: {} });
    }

    const appointments = [...(patient.appointments || [])]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map((appt) => ({
        id: appt._id,
        doctorName: appt.doctor ? appt.doctor.name : 'N/A',
        department: appt.doctor ? appt.doctor.department : 'N/A',
        date: appt.date,
        reason: appt.reason,
        status: appt.status,
        createdAt: appt.createdAt
      }));

    return res.render('user_booking_details', {
      title: `${patient.name} Booking Details`,
      showNavbar: true,
      pageCss: 'bookingDetails.css',
      activePage: 'users',
      patient: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        age: patient.age,
        gender: patient.gender,
        address: patient.address
      },
      appointments
    });
  } catch (error) {
    console.error('Error rendering patient booking details page:', error);
    return next(error);
  }
};

exports.blockUser = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const patient = await Patient.findByIdAndUpdate(
      patientId,
      { $set: { isBlocked: true } },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    return res.redirect('/admin/user_management');
  } catch (error) {
    console.error('Error blocking patient:', error);
    return next(error);
  }
};

exports.unblockUser = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const patient = await Patient.findByIdAndUpdate(
      patientId,
      { $set: { isBlocked: false } },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    return res.redirect('/admin/user_management');
  } catch (error) {
    console.error('Error unblocking patient:', error);
    return next(error);
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { patientId, appointmentId } = req.params;
    const { status, returnTo } = req.body;

    if (!mongoose.Types.ObjectId.isValid(patientId) || !mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.redirect(getSafeReturnTo(returnTo));
    }

    if (!ADMIN_ALLOWED_APPOINTMENT_STATUSES.has(status)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment status' });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const appointment = patient.appointments.id(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const appointmentTime = new Date(appointment.date).getTime();
    const isUpcoming = appointmentTime > Date.now();

    if (ADMIN_LOCKED_APPOINTMENT_STATUSES.has(appointment.status)) {
      return res.status(400).json({ success: false, message: 'This appointment can no longer be updated by admin' });
    }

    const statusError = getAdminAppointmentStatusError(status, {
      status: appointment.status,
      isUpcoming
    });

    if (statusError) {
      return res.status(400).json({
        success: false,
        message: statusError
      });
    }

    appointment.status = status;
    await patient.save();

    return res.redirect(getSafeReturnTo(returnTo));
  } catch (error) {
    console.error('Error updating appointment status:', error);
    return sendInternalServerError(res, 'Error updating appointment status');
  }
};

exports.showAppointments = async (req, res, next) => {
  try {
    const selectedDate = typeof req.query.date === 'string' ? req.query.date : '';
    const viewFilter = typeof req.query.view === 'string' ? req.query.view : 'all';
    const statusFilter = typeof req.query.status === 'string' ? req.query.status : 'all';
    const now = Date.now();
    const patients = await Patient.find()
      .select('name appointments')
      .populate('appointments.doctor', 'name department');

    const appointments = [];
    patients.forEach((patient) => {
      patient.appointments.forEach((appt) => {
        const appointmentTime = new Date(appt.date).getTime();
        const isUpcoming = appointmentTime > now;
        const isLocked = ADMIN_LOCKED_APPOINTMENT_STATUSES.has(appt.status);

        appointments.push({
          id: appt._id,
          patientId: patient._id,
          patientName: patient.name,
          doctorName: appt.doctor ? appt.doctor.name : 'N/A',
          department: appt.doctor ? appt.doctor.department : 'N/A',
          date: appt.date,
          status: appt.status,
          isUpcoming,
          ...getAdminAppointmentActions({
            status: appt.status,
            isUpcoming
          })
        });
      });
    });

    appointments.sort((a, b) => new Date(b.date) - new Date(a.date));

    let filteredAppointments = appointments;
    if (selectedDate) {
      filteredAppointments = filteredAppointments.filter((appt) => {
        const apptDate = new Date(appt.date);
        if (Number.isNaN(apptDate.getTime())) return false;
        const y = apptDate.getFullYear();
        const m = String(apptDate.getMonth() + 1).padStart(2, '0');
        const d = String(apptDate.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}` === selectedDate;
      });
    }

    if (viewFilter === 'upcoming') {
      filteredAppointments = filteredAppointments.filter((appt) => appt.isUpcoming);
    } else if (viewFilter === 'past') {
      filteredAppointments = filteredAppointments.filter((appt) => !appt.isUpcoming);
    }

    if (statusFilter !== 'all') {
      filteredAppointments = filteredAppointments.filter((appt) => {
        if (statusFilter === 'cancelled') {
          return appt.status === 'Cancelled' || appt.status === 'Cancelled by User';
        }

        return String(appt.status).toLowerCase() === statusFilter;
      });
    }

    return res.render('appoinment', {
      title: 'Appointments',
      showNavbar: true,
      pageCss: 'reports.css',
      activePage: 'appointments',
      appointments: filteredAppointments,
      selectedDate,
      viewFilter,
      statusFilter
    });
  } catch (error) {
    console.error('Error rendering appointments page:', error);
    return next(error);
  }
};

exports.redirectToAppointments = (req, res) => res.redirect(ADMIN_APPOINMENT_PATH);

exports.showReports = async (req, res, next) => {
  try {
    const doctors = await Doctor.find().select('name department');
    const patients = await Patient.find()
      .select('appointments')
      .populate('appointments.doctor', 'name department');

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const reportMap = new Map();

    doctors.forEach((doctor) => {
      reportMap.set(String(doctor._id), {
        _id: doctor._id,
        name: doctor.name,
        department: doctor.department,
        bookingCount: 0
      });
    });

    patients.forEach((patient) => {
      patient.appointments.forEach((appointment) => {
        const appointmentDate = new Date(appointment.date);
        const isInCurrentMonth =
          appointmentDate.getTime() >= startOfMonth.getTime() &&
          appointmentDate.getTime() < endOfMonth.getTime();
        const shouldCount =
          appointment.doctor &&
          isInCurrentMonth &&
          !['Cancelled', 'Cancelled by User'].includes(appointment.status);

        if (!shouldCount) return;

        const doctorId = String(appointment.doctor._id || appointment.doctor.id);
        const reportDoctor = reportMap.get(doctorId);
        if (reportDoctor) {
          reportDoctor.bookingCount += 1;
        }
      });
    });

    const reportDoctors = [...reportMap.values()].sort((a, b) => {
      if (b.bookingCount !== a.bookingCount) return b.bookingCount - a.bookingCount;
      return a.name.localeCompare(b.name);
    });

    return res.render('reports.ejs', {
      title: 'Reports',
      showNavbar: true,
      pageCss: 'reports.css',
      activePage: 'reports',
      doctors: reportDoctors
    });
  } catch (error) {
    console.error('Error rendering reports page:', error);
    return next(error);
  }
};

exports.createDoctor = async (req, res, next) => {
  try {
    if (req.uploadErrorCode) {
      return res.redirect(`/admin/form?uploadError=${encodeURIComponent(req.uploadErrorCode)}`);
    }

    const validation = validateDoctorPayload(req.body);
    if (!validation.ok) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const { name, department, age, experience, description } = validation.data;

    const uploadedImage = getUploadedImagePath(req.file);

    await Doctor.create({
      name: String(name).trim(),
      department: String(department).trim(),
      age: Number(age),
      experience: experience === undefined || experience === null || experience === '' ? 0 : Number(experience),
      image: uploadedImage,
      description: String(description).trim()
    });

    return res.redirect('/admin/doctors_management');
  } catch (error) {
    console.error('Error creating doctor:', error);
    return next(error);
  }
};

exports.showEditDoctorForm = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).render('error', { message: 'Doctor not found', error: {} });
    }

    return res.render('form', {
      title: 'Edit Doctor',
      showNavbar: false,
      pageCss: 'form.css',
      isEdit: true,
      doctor,
      feedback: getDoctorFormFeedback(req.query.uploadError),
      formAction: `/admin/doctors/${doctor._id}/update`,
      submitLabel: 'Update'
    });
  } catch (error) {
    console.error('Error loading doctor edit form:', error);
    return next(error);
  }
};

exports.updateDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.params;

    if (req.uploadErrorCode) {
      return res.redirect(`/admin/doctors/${doctorId}/edit?uploadError=${encodeURIComponent(req.uploadErrorCode)}`);
    }

    const validation = validateDoctorPayload(req.body);
    if (!validation.ok) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const { name, department, age, experience, description } = validation.data;

    const existingDoctor = await Doctor.findById(doctorId);
    if (!existingDoctor) {
      return res.status(404).render('error', { message: 'Doctor not found', error: {} });
    }

    const uploadedImage = getUploadedImagePath(req.file);
    const imagePath = uploadedImage || existingDoctor.image || '';

    await Doctor.findByIdAndUpdate(
      doctorId,
      {
        $set: {
          name: String(name).trim(),
          department: String(department).trim(),
          age: Number(age),
          experience: experience === undefined || experience === null || experience === '' ? 0 : Number(experience),
          image: imagePath,
          description: String(description).trim()
        }
      },
      { new: true }
    );

    return res.redirect('/admin/doctors_management');
  } catch (error) {
    console.error('Error updating doctor:', error);
    return next(error);
  }
};

exports.deleteDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const doctor = await Doctor.findByIdAndDelete(doctorId);

    if (!doctor) {
      return res.status(404).render('error', { message: 'Doctor not found', error: {} });
    }

    removeDoctorImageIfLocal(doctor.image);
    return res.redirect('/admin/doctors_management');
  } catch (error) {
    console.error('Error deleting doctor:', error);
    return next(error);
  }
};

exports.showDoctorForm = (req, res) =>
  res.render('form', {
    title: 'Doctor Form',
    showNavbar: false,
    pageCss: 'form.css',
    isEdit: false,
    doctor: null,
    feedback: getDoctorFormFeedback(req.query.uploadError),
    formAction: '/admin/doctors',
    submitLabel: 'Submit'
  });
