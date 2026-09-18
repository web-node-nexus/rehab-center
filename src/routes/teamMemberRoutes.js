const express = require('express');
const {
  listTeamMembers,
  getTeamMember,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
} = require('../controllers/teamMemberController');
const { authenticate } = require('../middlewares/auth');
const { requireRoles } = require('../middlewares/authorize');
const { uploadTeamPhoto } = require('../middlewares/upload');

const router = express.Router();

// All logged-in roles can view; only admin can add/edit/delete
router.get('/team-members', authenticate, listTeamMembers);
router.get('/team-members/:id', authenticate, getTeamMember);
router.post(
  '/team-members',
  authenticate,
  requireRoles('admin'),
  uploadTeamPhoto,
  createTeamMember
);
router.put(
  '/team-members/:id',
  authenticate,
  requireRoles('admin'),
  uploadTeamPhoto,
  updateTeamMember
);
router.delete(
  '/team-members/:id',
  authenticate,
  requireRoles('admin'),
  deleteTeamMember
);

module.exports = router;
