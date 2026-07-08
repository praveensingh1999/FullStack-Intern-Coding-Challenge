const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const {
  validateName,
  validateEmail,
  validateAddress,
  validatePassword,
} = require('../utils/validators');

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// Public signup — always creates a NORMAL_USER account.
exports.signup = async (req, res) => {
  try {
    const { name, email, address, password } = req.body;

    const errors = {};
    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const addressErr = validateAddress(address);
    const passwordErr = validatePassword(password);
    if (nameErr) errors.name = nameErr;
    if (emailErr) errors.email = emailErr;
    if (addressErr) errors.address = addressErr;
    if (passwordErr) errors.password = passwordErr;
    if (Object.keys(errors).length) return res.status(400).json({ errors });

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email is already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      address,
      password: hashed,
      role: 'NORMAL_USER',
    });

    const token = signToken(user);
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to sign up' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid email or password' });

    const token = signToken(user);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to log in' });
  }
};

// Works for any authenticated role: Admin, Normal User, Store Owner.
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const passwordErr = validatePassword(newPassword);
    if (passwordErr) return res.status(400).json({ message: passwordErr });

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const match = await bcrypt.compare(currentPassword || '', user.password);
    if (!match) return res.status(401).json({ message: 'Current password is incorrect' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update password' });
  }
};

exports.me = async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: ['id', 'name', 'email', 'address', 'role'],
  });
  res.json({ user });
};
