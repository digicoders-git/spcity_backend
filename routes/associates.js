const express = require('express');
const { body } = require('express-validator');
const associateController = require('../controllers/associateController');
const { auth, adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Admin and Associate routes for associate management
router.get('/', auth, associateController.getAllAssociates);
router.post('/', [
  auth,
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('username').notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').notEmpty().withMessage('Phone is required')
], associateController.createAssociate);

// Associate routes for profile management
router.get('/profile', auth, associateController.getAssociateProfile);
router.put('/profile', auth, (req, res, next) => {
  upload.fields([
    { name: 'panCard', maxCount: 1 },
    { name: 'aadhaarCard', maxCount: 1 }
  ])(req, res, (err) => {
    if (err) {
      console.error('Multer upload error:', err);
      return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
        success: false,
        message: err.message || 'File upload failed'
      });
    }
    next();
  });
}, associateController.updateAssociateProfile);

router.put('/:id', [
  auth,
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().notEmpty().withMessage('Phone cannot be empty')
], associateController.updateAssociate);

router.put('/:id/password', [
  auth,
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], associateController.changeAssociatePassword);

router.put('/:id/status', auth, associateController.updateAssociateStatus);

router.delete('/:id', auth, associateController.deleteAssociate);

module.exports = router;