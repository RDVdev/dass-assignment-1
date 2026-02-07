import { Router } from 'express';
import {
  checkInByQR,
  myTickets,
  registerForEvent,
  reviewPaymentProof,
  uploadPaymentProof
} from '../controllers/ticketController.js';
import { authorize, protect } from '../middlewares/authMiddleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.post('/register', protect, authorize(ROLES.PARTICIPANT), asyncHandler(registerForEvent));
router.get('/mine', protect, authorize(ROLES.PARTICIPANT), asyncHandler(myTickets));
router.patch('/payment-proof', protect, authorize(ROLES.PARTICIPANT), asyncHandler(uploadPaymentProof));

router.patch('/payment-review', protect, authorize(ROLES.ORGANIZER), asyncHandler(reviewPaymentProof));
router.post('/check-in-qr', protect, authorize(ROLES.ORGANIZER), asyncHandler(checkInByQR));

export default router;
