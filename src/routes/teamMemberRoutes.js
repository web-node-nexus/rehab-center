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

// All logged-in roles can view; admin + staff can add/edit/delete
router.get('/team-members', authenticate, listTeamMembers);
router.get('/team-members/:id', authenticate, getTeamMember);
router.post(
  '/team-members',
  authenticate,
  requireRoles('admin', 'staff'),
  uploadTeamPhoto,
  createTeamMember
);
router.put(
  '/team-members/:id',
  authenticate,
  requireRoles('admin', 'staff'),
  uploadTeamPhoto,
  updateTeamMember
);
router.delete(
  '/team-members/:id',
  authenticate,
  requireRoles('admin', 'staff'),
  deleteTeamMember
);

module.exports = router;
