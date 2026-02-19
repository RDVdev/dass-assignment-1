const express = require('express');
const {
  createEvent, getEvents, getEventById, updateEvent, deleteEvent,
  registerForEvent, orderMerchandise, myTickets, getTicketById, addComment,
  getOrganizerEvents, getEventStats, exportParticipants, getOrganizerAnalytics, markAttendance,
  scanQR, submitFeedback, getFeedback, deleteComment, pinComment, toggleReaction, getCalendar
} = require('../controllers/eventController');
const { auth, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/tickets/my-tickets', auth, myTickets);
router.get('/tickets/:ticketId', auth, getTicketById);
router.get('/organizer/my-events', auth, authorize('organizer', 'admin'), getOrganizerEvents);
router.get('/organizer/analytics', auth, authorize('organizer'), getOrganizerAnalytics);
router.get('/organizer/:organizerId', getOrganizerEvents);

router.get('/', getEvents);
router.get('/:id', getEventById);
router.get('/:id/stats', auth, authorize('organizer', 'admin'), getEventStats);
router.get('/:id/export', auth, authorize('organizer', 'admin'), exportParticipants);
router.get('/:id/feedback', getFeedback);
router.get('/:id/calendar', getCalendar);
router.post('/', auth, authorize('organizer', 'admin'), createEvent);
router.put('/:id', auth, authorize('organizer', 'admin'), updateEvent);
router.delete('/:id', auth, authorize('organizer', 'admin'), deleteEvent);

router.post('/:id/register', auth, authorize('participant'), registerForEvent);
router.post('/:id/merch-order', auth, authorize('participant'), upload.single('paymentProof'), orderMerchandise);
router.post('/:id/comments', auth, addComment);
router.delete('/:id/comments/:commentId', auth, authorize('organizer', 'admin'), deleteComment);
router.put('/:id/comments/:commentId/pin', auth, authorize('organizer', 'admin'), pinComment);
router.post('/:id/comments/:commentId/react', auth, toggleReaction);
router.post('/:id/feedback', auth, authorize('participant'), submitFeedback);
router.put('/tickets/:ticketId/attend', auth, authorize('organizer', 'admin'), markAttendance);
router.post('/scan-qr', auth, authorize('organizer', 'admin'), scanQR);

module.exports = router;
