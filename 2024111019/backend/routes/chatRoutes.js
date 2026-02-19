const express = require('express');
const { getMessages, sendMessage } = require('../controllers/chatController');
const { auth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:teamId/messages', auth, getMessages);
router.post('/:teamId/messages', auth, sendMessage);

module.exports = router;
