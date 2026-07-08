const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('ADMIN'));

router.get('/dashboard', adminController.dashboard);
router.post('/users', adminController.addUser);
router.get('/users', adminController.listUsers);
router.get('/users/:id', adminController.getUserDetail);
router.post('/stores', adminController.addStore);
router.get('/stores', adminController.listStores);
router.get('/store-owners', adminController.listStoreOwners);

module.exports = router;
