const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const SiteVisit = require('../models/SiteVisit');

// Get all site visits for logged-in associate
router.get('/', protect, async (req, res) => {
  try {
    const visits = await SiteVisit.find({ associate: req.user._id })
      .populate('project', 'name')
      .sort({ date: -1 });
    res.json({ success: true, data: visits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new site visit
router.post('/', protect, async (req, res) => {
  try {
    const visit = await SiteVisit.create({
      ...req.body,
      associate: req.user._id
    });
    const populatedVisit = await SiteVisit.findById(visit._id).populate('project', 'name');
    res.status(201).json({ success: true, data: populatedVisit });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Update site visit
router.put('/:id', protect, async (req, res) => {
  try {
    const visit = await SiteVisit.findOneAndUpdate(
      { _id: req.params.id, associate: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('project', 'name');
    
    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }
    res.json({ success: true, data: visit });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete site visit
router.delete('/:id', protect, async (req, res) => {
  try {
    const visit = await SiteVisit.findOneAndDelete({ 
      _id: req.params.id, 
      associate: req.user._id 
    });
    
    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }
    res.json({ success: true, message: 'Visit deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
