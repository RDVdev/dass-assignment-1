const express = require('express');
const {
  getOrganizers, createOrganizer, disableOrganizer, deleteOrganizer,
  getResetRequests, updateResetRequest, reviewMerchOrder, getMerchOrders
} = require('../controllers/adminController');
const { auth, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(auth, authorize('admin', 'organizer'));

router.get('/organizers', auth, authorize('admin'), getOrganizers);
router.post('/organizers', auth, authorize('admin'), createOrganizer);
router.put('/organizers/:id/toggle', auth, authorize('admin'), disableOrganizer);
router.delete('/organizers/:id', auth, authorize('admin'), deleteOrganizer);
router.get('/reset-requests', auth, authorize('admin'), getResetRequests);
router.put('/reset-requests/:organizerId', auth, authorize('admin'), updateResetRequest);
router.get('/merch-orders', auth, authorize('organizer', 'admin'), getMerchOrders);
router.get('/merch-orders/:organizerId', auth, authorize('admin'), getMerchOrders);
router.put('/merch-orders/:ticketId', auth, authorize('organizer', 'admin'), reviewMerchOrder);

module.exports = router;
