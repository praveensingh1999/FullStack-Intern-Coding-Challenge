const bcrypt = require('bcryptjs');
const { Op, fn, col } = require('sequelize');
const { User, Store, Rating, sequelize } = require('../models');
const {
  validateName,
  validateEmail,
  validateAddress,
  validatePassword,
} = require('../utils/validators');

const SORTABLE_USER_FIELDS = ['name', 'email', 'address', 'role', 'createdAt'];
const SORTABLE_STORE_FIELDS = ['name', 'email', 'address', 'createdAt'];

exports.dashboard = async (req, res) => {
  try {
    const [totalUsers, totalStores, totalRatings] = await Promise.all([
      User.count(),
      Store.count(),
      Rating.count(),
    ]);
    res.json({ totalUsers, totalStores, totalRatings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load dashboard stats' });
  }
};

// Admin can create ADMIN, NORMAL_USER, or STORE_OWNER accounts.
exports.addUser = async (req, res) => {
  try {
    const { name, email, password, address, role } = req.body;
    const allowedRoles = ['ADMIN', 'NORMAL_USER', 'STORE_OWNER'];
    const finalRole = allowedRoles.includes(role) ? role : 'NORMAL_USER';

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
    const user = await User.create({ name, email, address, password: hashed, role: finalRole });

    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, address: user.address, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add user' });
  }
};

// Admin adds a store, optionally assigning an existing STORE_OWNER user as owner.
exports.addStore = async (req, res) => {
  try {
    const { name, email, address, ownerId } = req.body;
    const errors = {};
    if (!name || name.trim().length === 0 || name.length > 60) {
      errors.name = 'Store name is required and must be at most 60 characters';
    }
    const emailErr = validateEmail(email);
    const addressErr = validateAddress(address);
    if (emailErr) errors.email = emailErr;
    if (addressErr) errors.address = addressErr;

    if (ownerId) {
      const owner = await User.findByPk(ownerId);
      if (!owner) errors.ownerId = 'Owner user not found';
      else if (owner.role !== 'STORE_OWNER') errors.ownerId = 'Selected user is not a Store Owner';
    }

    if (Object.keys(errors).length) return res.status(400).json({ errors });

    const existing = await Store.findOne({ where: { email } });
    if (existing) return res.status(409).json({ message: 'A store with this email already exists' });

    const store = await Store.create({ name, email, address, ownerId: ownerId || null });
    res.status(201).json({ store });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add store' });
  }
};

function buildSort(field, order, allowed, fallback) {
  const sortField = allowed.includes(field) ? field : fallback;
  const sortOrder = order && order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  return [[sortField, sortOrder]];
}

// List normal + admin users (Store Owners are managed via the stores list per spec,
// but are still visible here since "list of normal and admin users" — role filter covers this).
exports.listUsers = async (req, res) => {
  try {
    const { name, email, address, role, sortBy, sortOrder } = req.query;
    const where = {};
    if (name) where.name = { [Op.like]: `%${name}%` };
    if (email) where.email = { [Op.like]: `%${email}%` };
    if (address) where.address = { [Op.like]: `%${address}%` };
    if (role) where.role = role;

    const users = await User.findAll({
      where,
      attributes: ['id', 'name', 'email', 'address', 'role', 'createdAt'],
      order: buildSort(sortBy, sortOrder, SORTABLE_USER_FIELDS, 'name'),
    });

    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

exports.getUserDetail = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'name', 'email', 'address', 'role', 'createdAt'],
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

    let rating = null;
    if (user.role === 'STORE_OWNER') {
      const store = await Store.findOne({ where: { ownerId: user.id } });
      if (store) {
        const result = await Rating.findOne({
          where: { storeId: store.id },
          attributes: [[fn('AVG', col('value')), 'avgRating']],
          raw: true,
        });
        rating = result && result.avgRating ? Number(result.avgRating).toFixed(2) : null;
      }
    }

    res.json({ user, rating });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch user details' });
  }
};

// List stores with computed overall rating, with filters + sorting.
exports.listStores = async (req, res) => {
  try {
    const { name, email, address, sortBy, sortOrder } = req.query;
    const where = {};
    if (name) where.name = { [Op.like]: `%${name}%` };
    if (email) where.email = { [Op.like]: `%${email}%` };
    if (address) where.address = { [Op.like]: `%${address}%` };

    const stores = await Store.findAll({
      where,
      attributes: [
        'id',
        'name',
        'email',
        'address',
        'createdAt',
        [fn('COALESCE', fn('AVG', col('ratings.value')), 0), 'averageRating'],
        [fn('COUNT', col('ratings.id')), 'ratingCount'],
      ],
      include: [{ model: Rating, as: 'ratings', attributes: [] }],
      group: ['Store.id'],
      order: buildSort(sortBy, sortOrder, SORTABLE_STORE_FIELDS, 'name'),
      subQuery: false,
    });

    const formatted = stores.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      address: s.address,
      averageRating: Number(s.get('averageRating')).toFixed(2),
      ratingCount: Number(s.get('ratingCount')),
    }));

    res.json({ stores: formatted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch stores' });
  }
};

// Utility for populating "assign owner" dropdowns on the frontend.
exports.listStoreOwners = async (req, res) => {
  try {
    const owners = await User.findAll({
      where: { role: 'STORE_OWNER' },
      attributes: ['id', 'name', 'email'],
      order: [['name', 'ASC']],
    });
    res.json({ owners });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch store owners' });
  }
};
