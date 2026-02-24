const nodemailer = require('nodemailer');
const dns = require('dns');

if (typeof dns.setDefaultResultOrder === 'function') dns.setDefaultResultOrder('ipv4first');

const getSmtpConfig = () => {
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

const getResendConfig = () => {
  const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
  const resendFrom = (process.env.RESEND_FROM || '').trim();
  return { resendApiKey, resendFrom };
};

const getProvider = () => {
  const forced = (process.env.MAIL_PROVIDER || '').trim().toLowerCase();
  if (forced === 'resend' || forced === 'smtp') return forced;

  const { resendApiKey, resendFrom } = getResendConfig();
  if (resendApiKey && resendFrom) return 'resend';
  return 'smtp';
};

const toStringArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return [value];
};

const toBase64 = (content) => {
  if (!content) return '';
  if (Buffer.isBuffer(content)) return content.toString('base64');
  return Buffer.from(String(content)).toString('base64');
};

const transporter = {
  async sendMail(mailOptions) {
    const provider = getProvider();

    if (provider === 'smtp') {
      const { smtpHost, smtpPort, smtpUser, smtpPass, secure } = getSmtpConfig();
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

    const { resendApiKey, resendFrom } = getResendConfig();
    let html = mailOptions.html || '';
    // Resend path: inline CID attachments into HTML data URIs for compatibility.
    for (const att of mailOptions.attachments || []) {
      if (!att || !att.cid || !att.content) continue;
      const b64 = toBase64(att.content);
      if (!b64) continue;
      const mime = att.contentType || 'image/png';
      html = html.replaceAll(`cid:${att.cid}`, `data:${mime};base64,${b64}`);
    }

    const payload = {
      from: mailOptions.from || resendFrom,
      to: toStringArray(mailOptions.to),
      cc: toStringArray(mailOptions.cc),
      bcc: toStringArray(mailOptions.bcc),
      subject: mailOptions.subject,
      html,
      text: mailOptions.text
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const err = new Error(data.message || `Resend API failed with status ${response.status}`);
      err.code = 'RESEND_API_ERROR';
      err.responseCode = response.status;
      err.response = JSON.stringify(data);
      throw err;
    }
    return data;
  }
};

const isMailConfigured = () => {
  const provider = getProvider();
  if (provider === 'smtp') {
    const { smtpUser, smtpPass } = getSmtpConfig();
    return Boolean(smtpUser && smtpPass);
  }
  const { resendApiKey, resendFrom } = getResendConfig();
  return Boolean(resendApiKey && resendFrom);
};

const getMailDebugConfig = () => {
  const provider = getProvider();
  const { smtpHost, smtpPort, smtpUser, smtpPass, secure } = getSmtpConfig();
  const { resendApiKey, resendFrom } = getResendConfig();
  return {
    MAIL_PROVIDER: provider,
    SMTP_HOST: smtpHost,
    SMTP_PORT: smtpPort,
    SMTP_SECURE: secure,
    SMTP_USER_SET: Boolean(smtpUser),
    SMTP_PASS_SET: Boolean(smtpPass),
    RESEND_API_KEY_SET: Boolean(resendApiKey),
    RESEND_FROM_SET: Boolean(resendFrom)
  };
};

const getMailFrom = () => {
  const provider = getProvider();
  if (provider === 'resend') {
    const { resendFrom } = getResendConfig();
    return resendFrom;
  }
  return getSmtpConfig().smtpUser;
};

module.exports = {
  transporter,
  isMailConfigured,
  getMailDebugConfig,
  getMailFrom
};
