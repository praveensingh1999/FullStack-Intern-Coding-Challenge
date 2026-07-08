const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// 8-16 chars, at least one uppercase letter and one special character
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>_\-+=~`[\]/\\;']).{8,16}$/;

function validateName(name) {
  if (typeof name !== 'string') return 'Name is required';
  const len = name.trim().length;
  if (len < 20 || len > 60) return 'Name must be between 20 and 60 characters';
  return null;
}

function validateEmail(email) {
  if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
    return 'A valid email address is required';
  }
  return null;
}

function validateAddress(address) {
  if (typeof address !== 'string' || address.trim().length === 0) {
    return 'Address is required';
  }
  if (address.length > 400) return 'Address must be at most 400 characters';
  return null;
}

function validatePassword(password) {
  if (typeof password !== 'string' || !PASSWORD_REGEX.test(password)) {
    return 'Password must be 8-16 characters and include at least one uppercase letter and one special character';
  }
  return null;
}

function validateRatingValue(value) {
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1 || num > 5) {
    return 'Rating must be an integer between 1 and 5';
  }
  return null;
}

module.exports = {
  validateName,
  validateEmail,
  validateAddress,
  validatePassword,
  validateRatingValue,
};
