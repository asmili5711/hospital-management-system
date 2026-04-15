const request = require('supertest');

const mockPatientFindOne = jest.fn();
const mockPatientFindById = jest.fn();
const mockDoctorFindById = jest.fn();
const mockAdminFindOne = jest.fn();
const mockAdminFindById = jest.fn();
const mockBcryptCompare = jest.fn();
const mockBcryptHash = jest.fn();
const mockCreateUserSession = jest.fn();
const mockDeleteUserSession = jest.fn();
const mockDeleteUserSessionsForPatient = jest.fn();
const mockGetAdminTokenFromRequest = jest.fn(() => null);
const mockClearAdminAuthCookie = jest.fn((res) => {
  res.clearCookie('admin_auth_token');
});
const mockJwtSign = jest.fn(() => 'admin-jwt-token');
const mockJwtVerify = jest.fn();
const mockSendVerificationEmail = jest.fn();

jest.mock('../database/db', () => ({}));

jest.mock('../middleware/rateLimit', () => ({
  userLoginLimiter: (req, res, next) => next(),
  adminLoginLimiter: (req, res, next) => next(),
  bookingLimiter: (req, res, next) => next()
}));

jest.mock('../middleware/doctorUpload', () => ({
  single: () => (req, res, next) => next()
}));

jest.mock('../models/Patient', () => ({
  findOne: (...args) => mockPatientFindOne(...args),
  findById: (...args) => mockPatientFindById(...args)
}));

jest.mock('../models/Doctor', () => ({
  findById: (...args) => mockDoctorFindById(...args),
  find: jest.fn()
}));

jest.mock('../models/admin', () => ({
  findOne: (...args) => mockAdminFindOne(...args),
  findById: (...args) => mockAdminFindById(...args)
}));

jest.mock('bcrypt', () => ({
  compare: (...args) => mockBcryptCompare(...args),
  hash: (...args) => mockBcryptHash(...args)
}));

jest.mock('../middleware/userAuth', () => ({
  verifyToken: (req, res, next) => {
    if (req.get('x-test-user-auth') !== 'valid') {
      return res.status(401).json({ success: false, message: 'Unauthorized - Missing token' });
    }

    req.userId = '507f1f77bcf86cd799439011';
    req.userSessionId = 'session-1';
    req.userSessionExpiresAt = new Date('2030-01-01T00:00:00.000Z');
    return next();
  },
  createUserSession: (...args) => mockCreateUserSession(...args),
  deleteUserSession: (...args) => mockDeleteUserSession(...args),
  deleteUserSessionsForPatient: (...args) => mockDeleteUserSessionsForPatient(...args),
  clearUserAuthCookie: (res) =>
    res.clearCookie('user_auth_token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false
    })
}));

jest.mock('../middleware/adminAuth', () => ({
  getAdminTokenFromRequest: (...args) => mockGetAdminTokenFromRequest(...args),
  clearAdminAuthCookie: (...args) => mockClearAdminAuthCookie(...args),
  requireAdminAuth: (req, res, next) => {
    if (req.get('x-test-admin-auth') !== 'valid') {
      return res.redirect('/admin/login');
    }

    req.adminId = '507f1f77bcf86cd799439099';
    return next();
  }
}));

jest.mock('jsonwebtoken', () => ({
  sign: (...args) => mockJwtSign(...args),
  verify: (...args) => mockJwtVerify(...args)
}));

jest.mock('../utils/mailer', () => ({
  sendVerificationEmail: (...args) => mockSendVerificationEmail(...args)
}));

const app = require('../app');

const extractCsrfToken = (html) => {
  const match = html.match(/name="_csrf"\s+value="([^"]+)"/);
  return match ? match[1] : null;
};

describe('critical backend flows', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    console.error.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAdminTokenFromRequest.mockReturnValue(null);
    mockSendVerificationEmail.mockResolvedValue(undefined);
  });

  test('user login sets the auth cookie', async () => {
    const patient = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Test User',
      email: 'user@example.com',
      phone: '9876543210',
      age: 25,
      gender: 'Male',
      address: 'Test Address',
      password: '$2b$10$hashed',
      isEmailVerified: true
    };

    mockPatientFindOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(patient)
    });
    mockBcryptCompare.mockResolvedValue(true);
    mockCreateUserSession.mockResolvedValue({
      token: 'session-token',
      expiresAt: new Date('2030-01-01T00:00:00.000Z')
    });

    const response = await request(app)
      .post('/users/login')
      .send({ email: 'user@example.com', password: 'secret123' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('user_auth_token=session-token')])
    );
    expect(mockCreateUserSession).toHaveBeenCalledWith(patient._id);
  });

  test('user login rejects accounts with unverified emails', async () => {
    const patient = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Test User',
      email: 'user@example.com',
      password: '$2b$10$hashed',
      isEmailVerified: false
    };

    mockPatientFindOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(patient)
    });
    mockBcryptCompare.mockResolvedValue(true);

    const response = await request(app)
      .post('/users/login')
      .send({ email: 'user@example.com', password: 'secret123' });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: 'Please verify your email before logging in'
    });
    expect(mockCreateUserSession).not.toHaveBeenCalled();
  });

  test('email verification marks the account as verified and redirects to login', async () => {
    const patientDocument = {
      email: 'user@example.com',
      isEmailVerified: false,
      emailVerificationTokenHash: 'stored-hash',
      emailVerificationExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
      save: jest.fn().mockResolvedValue(undefined)
    };

    mockPatientFindOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(patientDocument)
    });

    const response = await request(app).get('/users/verify-email').query({ token: 'plain-token' });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(
      'http://localhost:5173/login?verification=success&email=user%40example.com'
    );
    expect(patientDocument.isEmailVerified).toBe(true);
    expect(patientDocument.emailVerificationTokenHash).toBeUndefined();
    expect(patientDocument.emailVerificationExpiresAt).toBeUndefined();
    expect(patientDocument.save).toHaveBeenCalled();
  });

  test('resend verification email issues a fresh link for unverified users', async () => {
    const patientDocument = {
      name: 'Test User',
      email: 'user@example.com',
      isEmailVerified: false,
      save: jest.fn().mockResolvedValue(undefined)
    };

    mockPatientFindOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(patientDocument)
    });

    const response = await request(app)
      .post('/users/resend-verification')
      .send({ email: 'user@example.com' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'Verification email sent successfully'
    });
    expect(patientDocument.emailVerificationTokenHash).toEqual(expect.any(String));
    expect(patientDocument.emailVerificationExpiresAt).toBeInstanceOf(Date);
    expect(patientDocument.save).toHaveBeenCalled();
    expect(mockSendVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@example.com',
        name: 'Test User',
        verificationUrl: expect.stringContaining('/users/verify-email?token=')
      })
    );
  });

  test('user logout clears the current session cookie', async () => {
    const response = await request(app)
      .post('/users/logout')
      .set('x-test-user-auth', 'valid');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'Logged out successfully'
    });
    expect(mockDeleteUserSession).toHaveBeenCalledWith('session-1');
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('user_auth_token=;')])
    );
  });

  test('password change invalidates all user sessions', async () => {
    const patientDocument = {
      password: '$2b$10$currentHash',
      save: jest.fn().mockResolvedValue(undefined)
    };

    mockPatientFindById.mockReturnValue({
      select: jest.fn().mockResolvedValue(patientDocument)
    });
    mockBcryptCompare.mockResolvedValue(true);
    mockBcryptHash.mockResolvedValue('$2b$10$newHash');

    const response = await request(app)
      .post('/users/profile/change-password')
      .set('x-test-user-auth', 'valid')
      .send({
        oldPassword: 'secret123',
        newPassword: 'newsecret123'
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'Password changed successfully'
    });
    expect(patientDocument.password).toBe('$2b$10$newHash');
    expect(patientDocument.save).toHaveBeenCalled();
    expect(mockDeleteUserSessionsForPatient).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('user_auth_token=;')])
    );
  });

  test('booking rejects past appointment times', async () => {
    const doctorId = '507f1f77bcf86cd799439012';

    mockDoctorFindById.mockResolvedValue({
      _id: doctorId,
      name: 'Dr. Test'
    });

    const response = await request(app)
      .post('/users/book-appointment')
      .set('x-test-user-auth', 'valid')
      .send({
        doctorId,
        date: new Date(Date.now() - 60 * 1000).toISOString(),
        reason: 'Follow up visit'
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: 'Appointments must be booked for a future date and time'
    });
    expect(mockPatientFindById).not.toHaveBeenCalled();
  });

  test('admin POST routes reject missing CSRF tokens', async () => {
    const response = await request(app)
      .post('/admin/login')
      .type('form')
      .send({
        email: 'admin@example.com',
        password: 'secret123'
      });

    expect(response.status).toBe(403);
    expect(response.text).toContain('Invalid or expired form token. Please refresh the page and try again.');
  });

  test('admin cannot cancel a past confirmed appointment', async () => {
    const agent = request.agent(app);
    const patientId = '507f1f77bcf86cd799439013';
    const appointmentId = '507f1f77bcf86cd799439014';
    const appointment = {
      _id: appointmentId,
      date: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      status: 'Confirmed'
    };
    const patientDocument = {
      appointments: {
        id: jest.fn().mockReturnValue(appointment)
      },
      save: jest.fn()
    };

    mockPatientFindById.mockResolvedValue(patientDocument);

    const loginPage = await agent.get('/admin/login');
    const csrfToken = extractCsrfToken(loginPage.text);

    expect(loginPage.status).toBe(200);
    expect(csrfToken).toBeTruthy();

    const response = await agent
      .post(`/admin/appointments/${patientId}/${appointmentId}/status`)
      .set('x-test-admin-auth', 'valid')
      .type('form')
      .send({
        _csrf: csrfToken,
        status: 'Cancelled',
        returnTo: '/admin/appoinment'
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: 'Past appointments cannot be cancelled by admin'
    });
    expect(patientDocument.save).not.toHaveBeenCalled();
  });

  test('admin can complete a past confirmed appointment', async () => {
    const agent = request.agent(app);
    const patientId = '507f1f77bcf86cd799439015';
    const appointmentId = '507f1f77bcf86cd799439016';
    const appointment = {
      _id: appointmentId,
      date: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      status: 'Confirmed'
    };
    const patientDocument = {
      appointments: {
        id: jest.fn().mockReturnValue(appointment)
      },
      save: jest.fn().mockResolvedValue(undefined)
    };

    mockPatientFindById.mockResolvedValue(patientDocument);

    const loginPage = await agent.get('/admin/login');
    const csrfToken = extractCsrfToken(loginPage.text);

    expect(loginPage.status).toBe(200);
    expect(csrfToken).toBeTruthy();

    const response = await agent
      .post(`/admin/appointments/${patientId}/${appointmentId}/status`)
      .set('x-test-admin-auth', 'valid')
      .type('form')
      .send({
        _csrf: csrfToken,
        status: 'Completed',
        returnTo: '/admin/appoinment'
      });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/admin/appoinment');
    expect(appointment.status).toBe('Completed');
    expect(patientDocument.save).toHaveBeenCalled();
  });
});
