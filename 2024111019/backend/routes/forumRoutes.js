const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/authMiddleware');
const forumController = require('../controllers/forumController');

// Get messages for an event
router.get('/:eventId/messages', auth, forumController.getMessages);

// Post a message
router.post('/:eventId/messages', auth, forumController.postMessage);

// Toggle reaction on a message
router.post('/:eventId/messages/:messageId/react', auth, forumController.toggleReaction);

// Delete a message (organizer/admin only)
router.delete('/:eventId/messages/:messageId', auth, authorize('organizer', 'admin'), forumController.deleteMessage);

// Pin/unpin a message (organizer/admin only)
router.put('/:eventId/messages/:messageId/pin', auth, authorize('organizer', 'admin'), forumController.pinMessage);

module.exports = router;
