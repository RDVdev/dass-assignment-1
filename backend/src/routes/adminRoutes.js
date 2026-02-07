import { Router } from 'express';
import {
  createOrganizer,
  deactivateOrganizer,
  listOrganizers
} from '../controllers/adminController.js';
import { authorize, protect } from '../middlewares/authMiddleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(protect, authorize(ROLES.ADMIN));

router.get('/organizers', asyncHandler(listOrganizers));
router.post('/organizers', asyncHandler(createOrganizer));
router.patch('/organizers/:id/deactivate', asyncHandler(deactivateOrganizer));

export default router;
