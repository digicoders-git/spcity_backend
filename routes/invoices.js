const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');
const { check } = require('express-validator');

// Validation rules
const invoiceValidation = [
  check('customerName', 'Customer Name is required').not().isEmpty(),
];

// All routes require authentication
router.use(protect);

router.route('/')
  .get(invoiceController.getAllInvoices)
  .post(invoiceValidation, invoiceController.createInvoice);

router.route('/:id')
  .get(invoiceController.getInvoiceById)
  .put(invoiceValidation, invoiceController.updateInvoice)
  .delete(invoiceController.deleteInvoice);

module.exports = router;
