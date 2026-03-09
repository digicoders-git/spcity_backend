const express = require('express');
const { auth } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

router.get('/stats', auth, dashboardController.getDashboardStats);
router.get('/charts/leads-trend', auth, dashboardController.getLeadsTrend);
router.get('/charts/revenue-trend', auth, dashboardController.getRevenueTrend);
router.get('/charts/project-status', auth, dashboardController.getProjectStatus);
router.get('/charts/lead-sources', auth, dashboardController.getLeadSources);
router.get('/recent-activities', auth, dashboardController.getRecentActivities);
router.get('/associate-performance', auth, dashboardController.getAssociatePerformance);

module.exports = router;