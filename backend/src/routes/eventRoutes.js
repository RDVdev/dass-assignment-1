import { Router } from 'express';
import {
  createEvent,
  getEventById,
  listEvents,
  listMyEvents,
  organizerAnalytics,
  publishEvent,
  updateEvent
} from '../controllers/eventController.js';
import { authorize, protect } from '../middlewares/authMiddleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.get('/', asyncHandler(listEvents));
router.get(
  '/organizer/analytics/summary',
  protect,
  authorize(ROLES.ORGANIZER),
  asyncHandler(organizerAnalytics)
);
router.get('/mine', protect, authorize(ROLES.ORGANIZER), asyncHandler(listMyEvents));
router.get('/:id', asyncHandler(getEventById));

router.post('/', protect, authorize(ROLES.ORGANIZER), asyncHandler(createEvent));
router.patch('/:id', protect, authorize(ROLES.ORGANIZER), asyncHandler(updateEvent));
router.patch('/:id/publish', protect, authorize(ROLES.ORGANIZER), asyncHandler(publishEvent));

export default router;
