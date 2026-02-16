const express = require('express');
const { register, login, me, requestReset } = require('../controllers/authController');
const { auth, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, me);
router.post('/reset-request', auth, authorize('organizer'), requestReset);

module.exports = router;
