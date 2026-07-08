const { Op, fn, col } = require('sequelize');
const { Store, Rating } = require('../models');
const { validateRatingValue } = require('../utils/validators');

// List all stores with overall rating + this user's own submitted rating (if any).
exports.listStores = async (req, res) => {
  try {
    const { name, address, sortBy, sortOrder } = req.query;
    const where = {};
    if (name) where.name = { [Op.like]: `%${name}%` };
    if (address) where.address = { [Op.like]: `%${address}%` };

    const allowedSort = ['name', 'address', 'createdAt'];
    const sortField = allowedSort.includes(sortBy) ? sortBy : 'name';
    const order = sortOrder && sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const stores = await Store.findAll({
      where,
      attributes: [
        'id',
        'name',
        'email',
        'address',
        [fn('COALESCE', fn('AVG', col('ratings.value')), 0), 'averageRating'],
      ],
      include: [{ model: Rating, as: 'ratings', attributes: [] }],
      group: ['Store.id'],
      order: [[sortField, order]],
      subQuery: false,
    });

    const storeIds = stores.map((s) => s.id);
    const myRatings = await Rating.findAll({
      where: { userId: req.user.id, storeId: storeIds },
    });
    const myRatingMap = {};
    myRatings.forEach((r) => {
      myRatingMap[r.storeId] = r.value;
    });

    const formatted = stores.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      address: s.address,
      averageRating: Number(s.get('averageRating')).toFixed(2),
      myRating: myRatingMap[s.id] || null,
    }));

    res.json({ stores: formatted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch stores' });
  }
};

// Create a new rating, or update it if the user already rated this store (upsert).
exports.submitRating = async (req, res) => {
  try {
    const { storeId, value } = req.body;
    const ratingErr = validateRatingValue(value);
    if (ratingErr) return res.status(400).json({ message: ratingErr });

    const store = await Store.findByPk(storeId);
    if (!store) return res.status(404).json({ message: 'Store not found' });

    const [rating, created] = await Rating.findOrCreate({
      where: { userId: req.user.id, storeId },
      defaults: { value },
    });

    if (!created) {
      rating.value = Number(value);
      await rating.save();
    }

    res.status(created ? 201 : 200).json({ rating });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to submit rating' });
  }
};
