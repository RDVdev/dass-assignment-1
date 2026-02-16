const express = require('express');
const { createTeam, joinTeam, getMyTeams } = require('../controllers/teamController');
const { auth, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', auth, authorize('participant'), createTeam);
router.post('/join', auth, authorize('participant'), joinTeam);
router.get('/mine', auth, authorize('participant'), getMyTeams);

module.exports = router;
