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
router.use(adminAuth);

router.route('/')
  .get(getInvoices)
  .post(createInvoice);

router.route('/:id')
  .get(getInvoice)
  .put(updateInvoice)
  .delete(deleteInvoice);

router.put('/:id/status', updateStatus);

module.exports = router;
