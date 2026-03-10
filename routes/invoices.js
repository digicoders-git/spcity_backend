const express = require('express');
const router = express.Router();
const { protect, adminAuth } = require('../middleware/auth');

const {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  updateStatus
} = require('../controllers/invoiceController');

router.use(protect);

router.route('/')
  .get(getInvoices)
  .post(adminAuth, createInvoice);

router.route('/:id')
  .get(getInvoice)
  .put(adminAuth, updateInvoice)
  .delete(adminAuth, deleteInvoice);

router.put('/:id/status', adminAuth, updateStatus);

module.exports = router;
