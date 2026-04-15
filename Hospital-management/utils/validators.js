const mongoose = require('mongoose');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_GENDERS = new Set(['Male', 'Female', 'Other']);

const normalizeWhitespace = (value) => String(value || '').trim().replace(/\s+/g, ' ');
const digitCount = (value) => String(value || '').replace(/\D/g, '').length;

const fail = (message, code = '') => ({ ok: false, message, code });
const pass = (data) => ({ ok: true, data });

const validateEmail = (email) => EMAIL_REGEX.test(email);

const validatePasswordPair = (currentPassword, nextPassword) => {
  if (!currentPassword || !nextPassword) {
    return fail('Please provide both current and new passwords', 'missing_fields');
  }

  if (String(nextPassword).length < 6 || String(nextPassword).length > 128) {
    return fail('Password must be between 6 and 128 characters', 'password_invalid_length');
  }

  if (currentPassword === nextPassword) {
    return fail('New password cannot be the same as the current password', 'password_same_as_old');
  }

  return pass({
    currentPassword: String(currentPassword),
    newPassword: String(nextPassword)
  });
};

const validateUserSignupPayload = (body = {}) => {
  const name = normalizeWhitespace(body.name);
  const email = normalizeWhitespace(body.email).toLowerCase();
  const phone = normalizeWhitespace(body.phone);
  const password = String(body.password || '');
  const gender = body.gender ? normalizeWhitespace(body.gender) : 'Other';
  const address = body.address === undefined ? '' : normalizeWhitespace(body.address);
  const rawAge = body.age;

  if (!name || name.length < 2 || name.length > 80) {
    return fail('Name must be between 2 and 80 characters');
  }

  if (!validateEmail(email)) {
    return fail('Please provide a valid email address');
  }

  if (digitCount(phone) < 7 || digitCount(phone) > 15) {
    return fail('Phone number must contain 7 to 15 digits');
  }

  if (password.length < 6 || password.length > 128) {
    return fail('Password must be between 6 and 128 characters');
  }

  if (!ALLOWED_GENDERS.has(gender)) {
    return fail('Gender must be Male, Female, or Other');
  }

  if (address.length > 300) {
    return fail('Address must be 300 characters or fewer');
  }

  let age;
  if (rawAge !== undefined && rawAge !== null && rawAge !== '') {
    const parsedAge = Number(rawAge);
    if (!Number.isInteger(parsedAge) || parsedAge < 1 || parsedAge > 120) {
      return fail('Age must be a whole number between 1 and 120');
    }

    age = parsedAge;
  }

  return pass({
    name,
    email,
    phone,
    password,
    gender,
    address,
    age
  });
};

const validateUserLoginPayload = (body = {}) => {
  const email = normalizeWhitespace(body.email).toLowerCase();
  const password = String(body.password || '');

  if (!validateEmail(email)) {
    return fail('Please provide a valid email address');
  }

  if (!password) {
    return fail('Password is required');
  }

  return pass({ email, password });
};

const validateEmailAddressPayload = (body = {}) => {
  const email = normalizeWhitespace(body.email).toLowerCase();

  if (!validateEmail(email)) {
    return fail('Please provide a valid email address');
  }

  return pass({ email });
};

const validateBookingPayload = (body = {}) => {
  const doctorId = normalizeWhitespace(body.doctorId);
  const reason = body.reason === undefined ? '' : normalizeWhitespace(body.reason);
  const date = body.date;

  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    return fail('Please provide a valid doctor');
  }

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return fail('Please provide a valid appointment date and time');
  }

  if (reason && (reason.length < 5 || reason.length > 300)) {
    return fail('Reason must be between 5 and 300 characters when provided');
  }

  return pass({
    doctorId,
    date: parsedDate,
    reason
  });
};

const validateProfileUpdatePayload = (body = {}) => {
  const payload = {};

  if (body.name !== undefined) {
    const name = normalizeWhitespace(body.name);
    if (!name || name.length < 2 || name.length > 80) {
      return fail('Name must be between 2 and 80 characters');
    }
    payload.name = name;
  }

  if (body.phone !== undefined) {
    const phone = normalizeWhitespace(body.phone);
    if (digitCount(phone) < 7 || digitCount(phone) > 15) {
      return fail('Phone number must contain 7 to 15 digits');
    }
    payload.phone = phone;
  }

  if (body.age !== undefined) {
    if (body.age === '' || body.age === null) {
      payload.age = undefined;
    } else {
      const parsedAge = Number(body.age);
      if (!Number.isInteger(parsedAge) || parsedAge < 1 || parsedAge > 120) {
        return fail('Age must be a whole number between 1 and 120');
      }
      payload.age = parsedAge;
    }
  }

  if (body.gender !== undefined) {
    const gender = normalizeWhitespace(body.gender);
    if (!ALLOWED_GENDERS.has(gender)) {
      return fail('Gender must be Male, Female, or Other');
    }
    payload.gender = gender;
  }

  if (body.address !== undefined) {
    const address = normalizeWhitespace(body.address);
    if (address.length > 300) {
      return fail('Address must be 300 characters or fewer');
    }
    payload.address = address;
  }

  if (Object.keys(payload).length === 0) {
    return fail('Please provide at least one profile field to update');
  }

  return pass(payload);
};

const validateUserPasswordChangePayload = (body = {}) =>
  validatePasswordPair(body.oldPassword, body.newPassword);

const validateAdminLoginPayload = (body = {}) => {
  const email = normalizeWhitespace(body.email).toLowerCase();
  const password = String(body.password || '');

  if (!validateEmail(email)) {
    return fail('Please provide a valid email address');
  }

  if (!password) {
    return fail('Password is required');
  }

  return pass({ email, password });
};

const validateAdminPasswordChangePayload = (body = {}) => {
  const currentPassword = String(body.currentPassword || '');
  const newPassword = String(body.newPassword || '');
  const confirmPassword = String(body.confirmPassword || '');

  if (!currentPassword || !newPassword || !confirmPassword) {
    return fail('Please fill in all password fields', 'missing_fields');
  }

  if (newPassword !== confirmPassword) {
    return fail('New password and confirm password must match', 'password_mismatch');
  }

  const result = validatePasswordPair(currentPassword, newPassword);
  if (!result.ok) {
    if (result.code === 'password_invalid_length') {
      return fail(result.message, 'password_too_short');
    }

    return result;
  }

  return result;
};

const validateDoctorPayload = (body = {}) => {
  const name = normalizeWhitespace(body.name);
  const department = normalizeWhitespace(body.department);
  const description = normalizeWhitespace(body.description);
  const rawAge = body.age;
  const rawExperience = body.experience;

  if (!name || name.length < 2 || name.length > 100) {
    return fail('Doctor name must be between 2 and 100 characters');
  }

  if (!department || department.length < 2 || department.length > 80) {
    return fail('Department must be between 2 and 80 characters');
  }

  const age = Number(rawAge);
  if (!Number.isInteger(age) || age < 18 || age > 100) {
    return fail('Doctor age must be a whole number between 18 and 100');
  }

  let experience = 0;
  if (rawExperience !== undefined && rawExperience !== null && rawExperience !== '') {
    experience = Number(rawExperience);
    if (!Number.isInteger(experience) || experience < 0 || experience > 80) {
      return fail('Experience must be a whole number between 0 and 80');
    }
  }

  if (!description || description.length < 20 || description.length > 2000) {
    return fail('Description must be between 20 and 2000 characters');
  }

  return pass({
    name,
    department,
    age,
    experience,
    description
  });
};

module.exports = {
  validateAdminLoginPayload,
  validateAdminPasswordChangePayload,
  validateBookingPayload,
  validateDoctorPayload,
  validateEmailAddressPayload,
  validateProfileUpdatePayload,
  validateUserLoginPayload,
  validateUserPasswordChangePayload,
  validateUserSignupPayload
};
