const express = require('express');
const { body } = require('express-validator');
const associateController = require('../controllers/associateController');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Admin routes for associate management
router.get('/', auth, adminAuth, associateController.getAllAssociates);
router.post('/', [
  auth,
  adminAuth,
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('username').notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').notEmpty().withMessage('Phone is required')
], associateController.createAssociate);

router.put('/:id', [
  auth,
  adminAuth,
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().notEmpty().withMessage('Phone cannot be empty')
], associateController.updateAssociate);

router.put('/:id/password', [
  auth,
  adminAuth,
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], associateController.changeAssociatePassword);

router.put('/:id/status', auth, adminAuth, associateController.updateAssociateStatus);

router.delete('/:id', auth, adminAuth, associateController.deleteAssociate);

// Associate routes for profile management
router.get('/profile', auth, associateController.getAssociateProfile);
router.put('/profile', auth, associateController.updateAssociateProfile);

module.exports = router;