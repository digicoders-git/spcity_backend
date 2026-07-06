const express = require('express');
const { body } = require('express-validator');
const projectController = require('../controllers/projectController');
const { auth, adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload'); // 🔥 multer

const router = express.Router();

/**
 * @route   GET /api/projects
 * @desc    Get all projects
 * @access  Private
 */
router.get(
  '/',
  auth,
  projectController.getAllProjects
);

/**
 * @route   POST /api/projects
 * @desc    Create new project
 * @access  Private (Associates can also create)
 */
router.post(
  '/',
  auth,
  upload.single('image'), // 🔥 Cloudinary image
  [
    body('name').notEmpty().withMessage('Project name is required'),
    body('location').notEmpty().withMessage('Location is required'),
    body('type')
      .isIn(['Residential', 'Commercial', 'Industrial', 'Mixed Use'])
      .withMessage('Valid project type is required'),
    body('startDate').notEmpty().withMessage('Start date is required'),
    body('totalUnits')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Total units must be at least 1'),
    body('pricePerUnit')
      .optional()
      .isNumeric()
      .withMessage('Price per unit must be a number'),
    body('budget')
      .optional()
      .isNumeric()
      .withMessage('Budget must be a number')
  ],
  projectController.createProject
);

/**
 * @route   PUT /api/projects/:id
 * @desc    Update project
 * @access  Private (Associates can also update)
 */
router.put(
  '/:id',
  auth,
  upload.single('image'), // 🔥 Cloudinary image
  [
    body('name')
      .optional()
      .notEmpty()
      .withMessage('Project name cannot be empty'),
    body('location')
      .optional()
      .notEmpty()
      .withMessage('Location cannot be empty')
  ],
  projectController.updateProject
);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete project
 * @access  Private (Associates can also delete)
 */
router.delete(
  '/:id',
  auth,
  projectController.deleteProject
);

/**
 * @route   GET /api/projects/:id
 * @desc    Get single project
 * @access  Private
 */
router.get(
  '/:id',
  auth,
  projectController.getProjectById
);

/**
 * @route   GET /api/projects/associate/my
 * @desc    Get projects assigned to logged-in associate
 * @access  Private
 */
router.get(
  '/associate/my',
  auth,
  projectController.getAssociateProjects
);

/**
 * @route   PUT /api/projects/:id/complete
 * @desc    Mark project as complete and generate commissions
 * @access  Private (Admin only)
 */
router.put(
  '/:id/complete',
  auth,
  adminAuth,
  projectController.completeProject
);

module.exports = router;
