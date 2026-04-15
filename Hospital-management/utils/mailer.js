const nodemailer = require('nodemailer');

let cachedTransporter;

const createTransporter = () => {
  if (process.env.NODE_ENV === 'test') {
    return nodemailer.createTransport({
      jsonTransport: true
    });
  }

  const host = String(process.env.SMTP_HOST || '').trim();
  const port = Number(process.env.SMTP_PORT || 0);
  const user = String(process.env.SMTP_USER || '').trim();
  const pass = String(process.env.SMTP_PASS || '').trim();

  if (!host || !port || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    }
  });
};

const getTransporter = () => {
  if (cachedTransporter === undefined) {
    cachedTransporter = createTransporter();
  }

  return cachedTransporter;
};

const getSenderAddress = () =>
  String(process.env.MAIL_FROM_ADDRESS || process.env.SMTP_USER || '').trim();

const sendVerificationEmail = async ({ email, name, verificationUrl }) => {
  const transporter = getTransporter();
  const from = getSenderAddress();

  if (!transporter || !from) {
    throw new Error(
      'Email transport is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and MAIL_FROM_ADDRESS.'
    );
  }

  const displayName = String(name || '').trim() || 'there';

  await transporter.sendMail({
    from,
    to: email,
    subject: 'Verify your email address',
    text: [
      `Hello ${displayName},`,
      '',
      'Please verify your email address to activate your account.',
      `Verification link: ${verificationUrl}`,
      '',
      'If you did not create this account, you can ignore this email.'
    ].join('\n'),
    html: [
      `<p>Hello ${displayName},</p>`,
      '<p>Please verify your email address to activate your account.</p>',
      `<p><a href="${verificationUrl}">Verify Email</a></p>`,
      '<p>If you did not create this account, you can ignore this email.</p>'
    ].join('')
  });
};

module.exports = {
  sendVerificationEmail
};
