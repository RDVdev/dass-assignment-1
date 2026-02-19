const express = require('express');
const {
  register, login, me, updateProfile, completeOnboarding,
  changePassword, requestReset, getOrganizers, getOrganizerById, followOrganizer,
  forgotPassword, resetPassword, googleAuth
} = require('../controllers/authController');
const { auth, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', auth, me);
router.put('/profile', auth, updateProfile);
router.post('/onboarding', auth, authorize('participant'), completeOnboarding);
router.put('/change-password', auth, changePassword);
router.post('/reset-request', auth, authorize('organizer'), requestReset);

// Public organizer listing
router.get('/organizers', getOrganizers);
router.get('/organizers/:id', getOrganizerById);
router.post('/organizers/:id/follow', auth, authorize('participant'), followOrganizer);

module.exports = router;
