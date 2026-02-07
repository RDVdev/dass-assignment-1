export const isIIITEmail = (email) => {
  const domain = process.env.IIIT_DOMAIN || 'iiit.ac.in';
  return String(email).toLowerCase().endsWith(`@${domain}`);
};
