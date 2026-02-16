const express = require('express');
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  registerForEvent,
  orderMerchandise,
  myTickets,
  addComment
} = require('../controllers/eventController');
const { auth, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/tickets/my-tickets', auth, myTickets);
router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/', auth, authorize('organizer', 'admin'), createEvent);
router.put('/:id', auth, authorize('organizer', 'admin'), updateEvent);
router.delete('/:id', auth, authorize('organizer', 'admin'), deleteEvent);

router.post('/:id/register', auth, authorize('participant'), registerForEvent);
router.post('/:id/merch-order', auth, authorize('participant'), upload.single('paymentProof'), orderMerchandise);
router.post('/:id/comments', auth, addComment);

module.exports = router;
