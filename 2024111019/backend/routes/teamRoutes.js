const express = require('express');
const { createTeam, joinTeam, getMyTeams, getTeamById, registerTeam, leaveTeam, deleteTeam } = require('../controllers/teamController');
const { auth, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', auth, authorize('participant'), createTeam);
router.post('/join', auth, authorize('participant'), joinTeam);
router.get('/mine', auth, authorize('participant'), getMyTeams);
router.get('/:teamId', auth, getTeamById);
router.post('/:teamId/register', auth, authorize('participant'), registerTeam);
router.post('/:teamId/leave', auth, authorize('participant'), leaveTeam);
router.delete('/:teamId', auth, authorize('participant'), deleteTeam);

module.exports = router;
