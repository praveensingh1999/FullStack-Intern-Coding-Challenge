const { fn, col } = require('sequelize');
const { Store, Rating, User } = require('../models');

exports.dashboard = async (req, res) => {
  try {
    const store = await Store.findOne({ where: { ownerId: req.user.id } });
    if (!store) {
      return res.status(404).json({ message: 'No store is associated with this account yet' });
    }

    const ratings = await Rating.findAll({
      where: { storeId: store.id },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']],
    });

    const avgResult = await Rating.findOne({
      where: { storeId: store.id },
      attributes: [[fn('AVG', col('value')), 'avgRating']],
      raw: true,
    });
    const averageRating = avgResult && avgResult.avgRating
      ? Number(avgResult.avgRating).toFixed(2)
      : '0.00';

    res.json({
      store: { id: store.id, name: store.name, email: store.email, address: store.address },
      averageRating,
      raters: ratings.map((r) => ({
        userId: r.user.id,
        name: r.user.name,
        email: r.user.email,
        rating: r.value,
        ratedAt: r.createdAt,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load store owner dashboard' });
  }
};
