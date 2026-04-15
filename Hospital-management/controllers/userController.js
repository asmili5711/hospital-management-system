const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const {
  createUserSession,
  deleteUserSession,
  deleteUserSessionsForPatient,
  clearUserAuthCookie
} = require('../middleware/userAuth');
const {
  USER_AUTH_COOKIE,
  getUserAuthCookieOptions
} = require('../config/userAuth');
const { sendInternalServerError } = require('../utils/apiResponse');
const {
  createEmailVerificationToken,
  hashEmailVerificationToken,
  isTrustedEmail
} = require('../utils/emailVerification');
const { sendVerificationEmail } = require('../utils/mailer');
const {
  validateBookingPayload,
  validateEmailAddressPayload,
  validateProfileUpdatePayload,
  validateUserLoginPayload,
  validateUserPasswordChangePayload,
  validateUserSignupPayload
} = require('../utils/validators');

const USER_CANCELLATION_STATUS = 'Cancelled by User';
const APPOINTMENT_NON_BLOCKING_STATUSES = ['Cancelled', USER_CANCELLATION_STATUS];

const normalizeBaseUrl = (value = '') => String(value).trim().replace(/\/+$/, '');

const getVerificationUrl = (req, token) =>
  `${req.protocol}://${req.get('host')}/users/verify-email?token=${encodeURIComponent(token)}`;

const getFrontendLoginUrl = (params = {}) => {
  const baseUrl = normalizeBaseUrl(process.env.FRONTEND_ORIGIN || 'http://localhost:5173');
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return `${baseUrl}/login${queryString ? `?${queryString}` : ''}`;
};

const sendVerificationEmailForPatient = async (req, patient, token) => {
  await sendVerificationEmail({
    email: patient.email,
    name: patient.name,
    verificationUrl: getVerificationUrl(req, token)
  });
};

exports.signup = async (req, res) => {
  try {
    const validation = validateUserSignupPayload(req.body);
    if (!validation.ok) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const { name, email, phone, age, gender, address, password } = validation.data;

    if (!isTrustedEmail(email)) {
      return res.status(403).json({
        success: false,
        message: 'Please sign up with a trusted email address'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verification = createEmailVerificationToken();

    const existingPatient = await Patient.findOne({ email }).select(
      'name email phone age gender address isEmailVerified +emailVerificationTokenHash +emailVerificationExpiresAt'
    );

    if (existingPatient && existingPatient.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    let patient;
    let statusCode = 201;
    let message = 'Patient registered successfully. Please verify your email before logging in.';

    if (existingPatient) {
      existingPatient.name = name;
      existingPatient.phone = phone;
      existingPatient.age = age;
      existingPatient.gender = gender || 'Other';
      existingPatient.address = address || '';
      existingPatient.password = hashedPassword;
      existingPatient.isEmailVerified = false;
      existingPatient.emailVerificationTokenHash = verification.tokenHash;
      existingPatient.emailVerificationExpiresAt = verification.expiresAt;

      patient = existingPatient;
      statusCode = 200;
      message = 'Account exists but is not verified. A new verification email has been sent.';
    } else {
      patient = new Patient({
        name,
        email,
        phone,
        age,
        gender: gender || 'Other',
        address: address || '',
        password: hashedPassword,
        isEmailVerified: false,
        emailVerificationTokenHash: verification.tokenHash,
        emailVerificationExpiresAt: verification.expiresAt
      });
    }

    await patient.save();
    await sendVerificationEmailForPatient(req, patient, verification.token);

    return res.status(statusCode).json({
      success: true,
      message,
      requiresEmailVerification: true,
      patient: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        age: patient.age,
        gender: patient.gender,
        address: patient.address,
        isEmailVerified: patient.isEmailVerified
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return sendInternalServerError(res, 'Error registering patient');
  }
};

exports.login = async (req, res) => {
  try {
    const validation = validateUserLoginPayload(req.body);
    if (!validation.ok) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const { email, password } = validation.data;

    const patient = await Patient.findOne({ email }).select(
      'name email phone age gender address isEmailVerified isBlocked +password'
    );
    if (!patient) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (patient.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Account is blocked by admin'
      });
    }

    if (!isTrustedEmail(patient.email)) {
      return res.status(403).json({
        success: false,
        message: 'This email domain is not allowed to access the website'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, patient.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!patient.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in'
      });
    }

    const session = await createUserSession(patient._id);

    res.cookie(USER_AUTH_COOKIE, session.token, getUserAuthCookieOptions());

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      patient: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        age: patient.age,
        gender: patient.gender,
        address: patient.address
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return sendInternalServerError(res, 'Error during login');
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const token = String(req.query.token || req.body.token || '').trim();
    const isBrowserRequest = req.method === 'GET';

    const redirectToLogin = (params) => res.redirect(getFrontendLoginUrl(params));

    if (!token) {
      if (isBrowserRequest) {
        return redirectToLogin({
          verification: 'failed',
          reason: 'missing_token'
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    const patient = await Patient.findOne({
      emailVerificationTokenHash: hashEmailVerificationToken(token),
      emailVerificationExpiresAt: { $gt: new Date() }
    }).select('+emailVerificationTokenHash +emailVerificationExpiresAt');

    if (!patient) {
      if (isBrowserRequest) {
        return redirectToLogin({
          verification: 'failed',
          reason: 'invalid_or_expired'
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Verification link is invalid or has expired'
      });
    }

    patient.isEmailVerified = true;
    patient.emailVerificationTokenHash = undefined;
    patient.emailVerificationExpiresAt = undefined;
    await patient.save();

    if (isBrowserRequest) {
      return redirectToLogin({
        verification: 'success',
        email: patient.email
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now log in.'
    });
  } catch (error) {
    console.error('Verify email error:', error);
    return sendInternalServerError(res, 'Error verifying email');
  }
};

exports.resendVerificationEmail = async (req, res) => {
  try {
    const validation = validateEmailAddressPayload(req.body);
    if (!validation.ok) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const { email } = validation.data;
    const patient = await Patient.findOne({ email }).select(
      'name email isEmailVerified +emailVerificationTokenHash +emailVerificationExpiresAt'
    );

    if (!patient) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists for this email, a verification link has been sent.'
      });
    }

    if (!isTrustedEmail(patient.email)) {
      return res.status(403).json({
        success: false,
        message: 'This email domain is not allowed to access the website'
      });
    }

    if (patient.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    const verification = createEmailVerificationToken();
    patient.emailVerificationTokenHash = verification.tokenHash;
    patient.emailVerificationExpiresAt = verification.expiresAt;
    await patient.save();
    await sendVerificationEmailForPatient(req, patient, verification.token);

    return res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    console.error('Resend verification email error:', error);
    return sendInternalServerError(res, 'Error sending verification email');
  }
};

exports.getSession = async (req, res) => {
  try {
    const patient = await Patient.findById(req.userId).select('name email');

    if (!patient) {
      clearUserAuthCookie(res);
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    return res.status(200).json({
      success: true,
      authenticated: true,
      session: {
        expiresAt: req.userSessionExpiresAt
      },
      patient: {
        id: patient._id,
        name: patient.name,
        email: patient.email
      }
    });
  } catch (error) {
    console.error('Get session error:', error);
    return sendInternalServerError(res, 'Error retrieving session');
  }
};

exports.bookAppointment = async (req, res) => {
  try {
    const patientId = req.userId;
    const validation = validateBookingPayload(req.body);
    if (!validation.ok) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const { doctorId, date: apptDate, reason } = validation.data;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    if (apptDate.getTime() <= Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Appointments must be booked for a future date and time'
      });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const patientHasConflict = patient.appointments.some((appointment) => {
      const sameSlot = new Date(appointment.date).getTime() === apptDate.getTime();
      const isBlockingStatus = !APPOINTMENT_NON_BLOCKING_STATUSES.includes(appointment.status);
      return sameSlot && isBlockingStatus;
    });

    if (patientHasConflict) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active appointment booked for this time slot'
      });
    }

    const doctorHasConflict = await Patient.findOne({
      appointments: {
        $elemMatch: {
          doctor: doctor._id,
          date: apptDate,
          status: { $nin: APPOINTMENT_NON_BLOCKING_STATUSES }
        }
      }
    }).select('_id');

    if (doctorHasConflict) {
      return res.status(400).json({
        success: false,
        message: 'This doctor is already booked for the selected time slot'
      });
    }

    patient.appointments.push({
      doctor: doctor._id,
      date: apptDate,
      reason: reason || ''
    });

    await patient.save();

    const populatedPatient = await Patient.findById(patientId).populate('appointments.doctor');
    const createdAppointment = populatedPatient.appointments[populatedPatient.appointments.length - 1];

    return res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointment: createdAppointment
    });
  } catch (error) {
    console.error('Book appointment error:', error);
    return sendInternalServerError(res, 'Error booking appointment');
  }
};

exports.getBookingHistory = async (req, res) => {
  try {
    const patient = await Patient.findById(req.userId).populate('appointments.doctor');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const sortedAppointments = patient.appointments.sort((a, b) => b.date - a.date);

    const appointmentsWithDoctorName = sortedAppointments.map((appt) => ({
      id: appt._id,
      doctorSummary: appt.doctor ? {
        id: appt.doctor._id || appt.doctor.id,
        name: appt.doctor.name,
        department: appt.doctor.department
      } : null,
      doctorName: appt.doctor ? appt.doctor.name : null,
      date: appt.date,
      reason: appt.reason,
      status: appt.status,
      createdAt: appt.createdAt,
      updatedAt: appt.updatedAt
    }));

    return res.status(200).json({
      success: true,
      message: 'Booking history retrieved successfully',
      patientName: patient.name,
      appointments: appointmentsWithDoctorName,
      totalBookings: appointmentsWithDoctorName.length
    });
  } catch (error) {
    console.error('Booking history error:', error);
    return sendInternalServerError(res, 'Error retrieving booking history');
  }
};

exports.cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment id' });
    }

    const patient = await Patient.findById(req.userId).populate('appointments.doctor');
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const appointment = patient.appointments.id(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.status === 'Cancelled' || appointment.status === USER_CANCELLATION_STATUS) {
      return res.status(200).json({ success: true, message: 'Appointment already cancelled', appointment });
    }

    if (appointment.status === 'Completed') {
      return res.status(400).json({ success: false, message: 'Completed appointments cannot be cancelled' });
    }

    if (new Date(appointment.date).getTime() <= Date.now()) {
      return res.status(400).json({ success: false, message: 'Only upcoming appointments can be cancelled' });
    }

    appointment.status = appointment.status === 'Confirmed' ? USER_CANCELLATION_STATUS : 'Cancelled';
    await patient.save();

    return res.status(200).json({
      success: true,
      message: 'Appointment cancelled',
      appointment
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    return sendInternalServerError(res, 'Error cancelling appointment');
  }
};

exports.getProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.userId).populate('appointments.doctor');

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    return res.status(200).json({
      success: true,
      profile: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        age: patient.age,
        gender: patient.gender,
        address: patient.address,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
        totalAppointments: patient.appointments.length
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return sendInternalServerError(res, 'Error retrieving profile');
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const validation = validateProfileUpdatePayload(req.body);
    if (!validation.ok) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const { name, phone, age, gender, address } = validation.data;

    const patient = await Patient.findById(req.userId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    if (name !== undefined) patient.name = name;
    if (phone !== undefined) patient.phone = phone;
    if (age !== undefined) patient.age = age;
    if (gender !== undefined) patient.gender = gender;
    if (address !== undefined) patient.address = address;

    await patient.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated',
      profile: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        age: patient.age,
        gender: patient.gender,
        address: patient.address,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
        totalAppointments: patient.appointments.length
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return sendInternalServerError(res, 'Error updating profile');
  }
};

exports.changePassword = async (req, res) => {
  try {
    const validation = validateUserPasswordChangePayload(req.body);
    if (!validation.ok) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const { currentPassword: oldPassword, newPassword } = validation.data;

    const patient = await Patient.findById(req.userId).select('+password');
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const isMatch = await bcrypt.compare(oldPassword, patient.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Old password is incorrect' });
    }

    patient.password = await bcrypt.hash(newPassword, 10);
    await patient.save();

    await deleteUserSessionsForPatient(req.userId);
    clearUserAuthCookie(res);

    return res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return sendInternalServerError(res, 'Error changing password');
  }
};

exports.logout = async (req, res) => {
  try {
    await deleteUserSession(req.userSessionId);
    clearUserAuthCookie(res);
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return sendInternalServerError(res, 'Error during logout');
  }
};
