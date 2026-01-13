const express = require('express');
const { body, validationResult } = require('express-validator');
const Site = require('../models/Site');
const { auth, adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const cloudinary = require('../config/cloudinary');

const router = express.Router();

// Upload image to Cloudinary
const uploadImage = (file, folder = 'sp-city/sites') => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    ).end(file.buffer);
  });
};

// @route   GET /api/sites
// @desc    Get all sites
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    const sites = await Site.find(query)
      .populate('project', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Site.countDocuments(query);

    res.json({
      success: true,
      data: sites,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/sites
// @desc    Create new site
// @access  Private (Admin)
router.post('/', [
  auth,
  adminAuth,
  upload.single('image'),
  body('name').notEmpty().withMessage('Site name is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('state').notEmpty().withMessage('State is required'),
  body('pincode').notEmpty().withMessage('Pincode is required'),
  body('area').isNumeric().withMessage('Area must be a number'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('type').isIn(['Plot', 'Villa', 'Apartment', 'Commercial']).withMessage('Valid type is required'),
  body('project').notEmpty().withMessage('Project is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const siteData = { ...req.body, createdBy: req.user.id };
    
    if (req.file) {
      siteData.image = await uploadImage(req.file);
    }

    const site = new Site(siteData);
    await site.save();

    const populatedSite = await Site.findById(site._id).populate('project', 'name');
    res.status(201).json({ success: true, message: 'Site created successfully', data: populatedSite });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/sites/:id
// @desc    Update site
// @access  Private (Admin)
router.put('/:id', [
  auth,
  adminAuth,
  upload.single('image'),
  body('name').optional().notEmpty().withMessage('Site name cannot be empty'),
  body('address').optional().notEmpty().withMessage('Address cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const updateData = { ...req.body };
    
    if (req.file) {
      updateData.image = await uploadImage(req.file);
    }

    const site = await Site.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).populate('project', 'name');
    if (!site) {
      return res.status(404).json({ success: false, message: 'Site not found' });
    }

    res.json({ success: true, message: 'Site updated successfully', data: site });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/sites/:id
// @desc    Delete site
// @access  Private (Admin)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const site = await Site.findByIdAndDelete(req.params.id);
    if (!site) {
      return res.status(404).json({ success: false, message: 'Site not found' });
    }

    res.json({ success: true, message: 'Site deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/sites/:id
// @desc    Get single site
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const site = await Site.findById(req.params.id).populate('project', 'name');
    if (!site) {
      return res.status(404).json({ success: false, message: 'Site not found' });
    }

    res.json({ success: true, data: site });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
