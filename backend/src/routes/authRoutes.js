import { Router } from 'express';
import {
  login,
  me,
  requestOrganizerPasswordReset,
  resetOrganizerPassword,
  signupParticipant
} from '../controllers/authController.js';
import { authorize, protect } from '../middlewares/authMiddleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.post('/signup', asyncHandler(signupParticipant));
router.post('/login', asyncHandler(login));
router.get('/me', protect, asyncHandler(me));

router.post(
  '/organizer-password-reset/request',
  protect,
  authorize(ROLES.ADMIN),
  asyncHandler(requestOrganizerPasswordReset)
);
router.post('/organizer-password-reset/confirm', asyncHandler(resetOrganizerPassword));

export default router;
