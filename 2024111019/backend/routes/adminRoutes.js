const express = require('express');
const {
  getOrganizers,
  createOrganizer,
  getResetRequests,
  updateResetRequest,
  reviewMerchOrder
} = require('../controllers/adminController');
const { auth, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(auth, authorize('admin'));

router.get('/organizers', getOrganizers);
router.post('/organizers', createOrganizer);
router.get('/reset-requests', getResetRequests);
router.put('/reset-requests/:organizerId', updateResetRequest);
router.put('/merch-orders/:ticketId', reviewMerchOrder);

module.exports = router;
