const Invoice = require('../models/Invoice');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

/* ================= GET ALL ================= */
exports.getInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, projectId } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'all') query.status = status;
    if (projectId) query.project = projectId;
    
    // Authorization: associate can only see their own
    if (req.user.role === 'associate') {
      query.associate = req.user.id;
    } else if (req.query.associateId) {
      query.associate = req.query.associateId;
    }

    const invoices = await Invoice.find(query)
      .populate('project', 'name')
      .populate('associate', 'name email phone')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((page - 1) * limit);

    const count = await Invoice.countDocuments(query);

    res.status(200).json({
      success: true,
      data: invoices,
      page: Number(page),
      pages: Math.ceil(count / limit),
      total: count
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

/* ================= GET ONE ================= */
exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('project', 'name')
      .populate('associate', 'name email phone')
      .populate('createdBy', 'name');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (req.user.role === 'associate' && invoice.associate?._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.status(200).json({ success: true, data: invoice });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

/* ================= CREATE ================= */
exports.createInvoice = async (req, res) => {
  try {
    let invoiceData = { ...req.body };

    if (!invoiceData.invoiceNumber) {
      const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const r = Math.floor(1000 + Math.random() * 9000);
      invoiceData.invoiceNumber = `INV-${d}-${r}`;
    }

    if (!invoiceData.associate) {
      delete invoiceData.associate;
    } else {
      const associate = await User.findById(invoiceData.associate);
      if (associate) {
        if (!invoiceData.customerName) invoiceData.customerName = associate.name;
        if (!invoiceData.customerPhone) invoiceData.customerPhone = associate.phone || 'N/A';
        if (!invoiceData.customerEmail) invoiceData.customerEmail = associate.email;
      }
    }

    const items = invoiceData.items.map(i => ({
      ...i,
      amount: i.quantity * i.unitPrice
    }));

    const subtotal = items.reduce((s, i) => s + i.amount, 0);
    const taxAmount = (subtotal * (invoiceData.taxRate || 0)) / 100;

    const invoice = await Invoice.create({
      ...invoiceData,
      items,
      subtotal,
      taxAmount,
      total: subtotal + taxAmount,
      createdBy: req.user.id
    });

    res.status(201).json({ success: true, data: invoice });

    // Dynamic Notification
    createNotification({
      userId: invoiceData.associate || null,
      role: invoiceData.associate ? 'associate' : 'admin',
      title: 'New Invoice Generated',
      message: `Invoice #${invoice.invoiceNumber} has been generated for ${invoice.customerName}.`,
      type: 'success',
      link: '/admin/invoices' // generic link base
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

/* ================= UPDATE ================= */
exports.updateInvoice = async (req, res) => {
  try {
    let updateData = { ...req.body };

    if (!updateData.associate) {
      updateData.$unset = { associate: 1 };
      delete updateData.associate;
    } else {
      const associate = await User.findById(updateData.associate);
      if (associate) {
        if (!updateData.customerName) updateData.customerName = associate.name;
        if (!updateData.customerPhone) updateData.customerPhone = associate.phone || 'N/A';
        if (!updateData.customerEmail) updateData.customerEmail = associate.email;
      }
    }

    if (updateData.items) {
      updateData.items = updateData.items.map(i => ({
        ...i,
        amount: i.quantity * i.unitPrice
      }));

      updateData.subtotal = updateData.items.reduce(
        (s, i) => s + i.amount,
        0
      );
      updateData.taxAmount =
        (updateData.subtotal * (updateData.taxRate || 0)) / 100;
      updateData.total = updateData.subtotal + updateData.taxAmount;
    }

    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.status(200).json({ success: true, data: invoice });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

/* ================= DELETE ================= */
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.status(200).json({ success: true });
  } catch {
    res.status(500).json({ message: 'Server Error' });
  }
};

/* ================= STATUS ================= */
exports.updateStatus = async (req, res) => {
  const { status } = req.body;

  if (!['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const invoice = await Invoice.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  res.status(200).json({ success: true, data: invoice });
};
