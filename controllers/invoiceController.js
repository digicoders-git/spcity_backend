const Invoice = require('../models/Invoice');
const { validationResult } = require('express-validator');

class InvoiceController {
  // Get all invoices with pagination and search
  async getAllInvoices(req, res) {
    try {
      const { page = 1, limit = 10, search = '', status = '' } = req.query;
      
      const query = {};
      
      if (search) {
        query.$or = [
          { invoiceNumber: { $regex: search, $options: 'i' } },
          { customerName: { $regex: search, $options: 'i' } },
          { customerPhone: { $regex: search, $options: 'i' } }
        ];
      }

      if (status && status !== 'all') {
        query.status = status;
      }

      // If user is associate, only show their invoices
      if (req.user && req.user.role === 'associate') {
        query.associate = req.user.id;
      }

      const invoices = await Invoice.find(query)
        .populate('project', 'name')
        .populate('associate', 'name username')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Invoice.countDocuments(query);

      res.json({
        success: true,
        data: invoices,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      });
    } catch (error) {
      console.error('Get invoices error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching invoices'
      });
    }
  }

  // Get invoice by ID
  async getInvoiceById(req, res) {
    try {
      const invoice = await Invoice.findById(req.params.id)
        .populate('project', 'name location type')
        .populate('associate', 'name email phone username');

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      // If associate, check permission
      if (req.user.role === 'associate' && invoice.associate._id.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this invoice'
        });
      }

      res.json({
        success: true,
        data: invoice
      });
    } catch (error) {
      console.error('Get invoice by id error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Create new invoice
  async createInvoice(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const invoiceData = {
        ...req.body,
        createdBy: req.user.id
      };

      const newInvoice = await Invoice.create(invoiceData);

      res.status(201).json({
        success: true,
        data: newInvoice,
        message: 'Invoice created successfully'
      });
    } catch (error) {
      console.error('Create invoice error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while creating invoice'
      });
    }
  }

  // Update invoice
  async updateInvoice(req, res) {
    try {
      let invoice = await Invoice.findById(req.params.id);

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      // Check permissions
      if (req.user.role === 'associate' && invoice.associate.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this invoice'
        });
      }

      invoice = await Invoice.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        data: invoice,
        message: 'Invoice updated successfully'
      });
    } catch (error) {
      console.error('Update invoice error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Delete invoice
  async deleteInvoice(req, res) {
    try {
      const invoice = await Invoice.findById(req.params.id);

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      // Check permissions
      if (req.user.role === 'associate' && invoice.associate.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this invoice'
        });
      }

      await invoice.deleteOne();

      res.json({
        success: true,
        message: 'Invoice deleted successfully'
      });
    } catch (error) {
      console.error('Delete invoice error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
}

module.exports = new InvoiceController();
