const nodemailer = require('nodemailer');
const dns = require('dns');

if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const getMailConfig = () => {
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const rawPass = process.env.SMTP_PASS || '';
  // Gmail App Passwords are shown with spaces for readability; strip all whitespace.
  const smtpPass = rawPass.replace(/\s+/g, '');
  const secure = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE.toLowerCase() === 'true'
    : smtpPort === 465;
  return { smtpHost, smtpPort, smtpUser, smtpPass, secure };
};

const transporter = {
  async sendMail(mailOptions) {
    const { smtpHost, smtpPort, smtpUser, smtpPass, secure } = getMailConfig();
    const instance = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure,
      family: 4,
      lookup: (hostname, _options, callback) => dns.lookup(hostname, { family: 4, all: false }, callback),
      auth: { user: smtpUser, pass: smtpPass }
    });
    return instance.sendMail(mailOptions);
  }
};

const isMailConfigured = () => {
  const { smtpUser, smtpPass } = getMailConfig();
  return Boolean(smtpUser && smtpPass);
};

const getMailDebugConfig = () => {
  const { smtpHost, smtpPort, smtpUser, smtpPass, secure } = getMailConfig();
  return {
    SMTP_HOST: smtpHost,
    SMTP_PORT: smtpPort,
    SMTP_SECURE: secure,
    SMTP_USER_SET: Boolean(smtpUser),
    SMTP_PASS_SET: Boolean(smtpPass)
  };
};

const getSmtpUser = () => getMailConfig().smtpUser;

module.exports = {
  transporter,
  isMailConfigured,
  getMailDebugConfig,
  getSmtpUser
};
