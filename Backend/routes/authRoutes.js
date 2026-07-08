const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.put('/update-password', authenticate, authController.updatePassword);
router.get('/me', authenticate, authController.me);

module.exports = router;
