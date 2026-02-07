import { Router } from 'express';
import { addPost, listPostsByEvent } from '../controllers/forumController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/events/:eventId/posts', asyncHandler(listPostsByEvent));
router.post('/events/:eventId/posts', protect, asyncHandler(addPost));

export default router;
