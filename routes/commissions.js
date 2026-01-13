const express = require('express');
const commissionController = require('../controllers/commissionController');
const CommissionService = require('../services/commissionService');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// ================= ASSOCIATE ROUTES =================

// Get all commissions for logged-in associate
router.get('/', auth, commissionController.getMyCommissions);

// Get commission stats
router.get('/stats', auth, commissionController.getMyStats);

// Get withdrawal history
router.get('/withdrawals', auth, commissionController.getMyWithdrawals);

// Request withdrawal
router.post('/withdrawals', auth, commissionController.requestWithdrawal);

// ================= ADMIN ROUTES =================

// Get dashboard stats (Admin only)
router.get('/admin/dashboard', auth, adminAuth, commissionController.getDashboardStats);

// Get all withdrawal requests (Admin only)
router.get('/admin/withdrawals', auth, adminAuth, commissionController.getAllWithdrawals);

// Process withdrawal request (Admin only)
router.put('/admin/withdrawals/:id', auth, adminAuth, commissionController.processWithdrawal);

// Generate commission from payment
router.post('/generate/:paymentId', auth, commissionController.generateCommission);

// Approve project completion (Admin only)
router.put('/approve-project/:projectId', auth, adminAuth, async (req, res) => {
  try {
    const result = await CommissionService.approveProjectCompletion(
      req.params.projectId,
      req.user.id
    );
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
