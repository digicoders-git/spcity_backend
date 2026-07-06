const Payment = require('../models/Payment');

class PaymentService {
  // Get all payments with filters
  async getAllPayments(page, limit, search, status, paymentType, userId) {
    try {
      let query = {};

      // If user is associate, only show their payments
      if (userId) {
        query.associate = userId;
      }

      // Add search filters
      if (search) {
        query.$or = [
          { customerName: { $regex: search, $options: 'i' } },
          { customerPhone: { $regex: search, $options: 'i' } },
          { customerEmail: { $regex: search, $options: 'i' } }
        ];
      }

      if (status) query.status = status;
      if (paymentType) query.paymentType = paymentType;

      const payments = await Payment.find(query)
        .populate('project', 'name location')
        .populate('site', 'name address')
        .populate('associate', 'name')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Payment.countDocuments(query);

      return {
        success: true,
        data: payments,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Create new payment
  async createPayment(paymentData) {
    try {
      const payment = new Payment(paymentData);
      await payment.save();

      const populatedPayment = await Payment.findById(payment._id)
        .populate('project', 'name location')
        .populate('site', 'name address')
        .populate('associate', 'name')
        .populate('createdBy', 'name');

      return {
        success: true,
        message: 'Payment created successfully',
        data: populatedPayment
      };
    } catch (error) {
      throw error;
    }
  }

  // Update payment
  async updatePayment(paymentId, updateData, user) {
    try {
      let payment = await Payment.findById(paymentId);
      if (!payment) {
        return {
          success: false,
          message: 'Payment not found'
        };
      }

      // Check if user has permission to update this payment
      if (user.role === 'associate' && payment.associate.toString() !== user.id) {
        return {
          success: false,
          message: 'Not authorized to update this payment',
          statusCode: 403
        };
      }

      payment = await Payment.findByIdAndUpdate(
        paymentId,
        updateData,
        { new: true, runValidators: true }
      ).populate('project', 'name location')
       .populate('site', 'name address')
       .populate('associate', 'name')
       .populate('createdBy', 'name');

      return {
        success: true,
        message: 'Payment updated successfully',
        data: payment
      };
    } catch (error) {
      throw error;
    }
  }

  // Update payment status
  async updatePaymentStatus(paymentId, status) {
    try {
      let payment = await Payment.findById(paymentId);
      if (!payment) {
        return {
          success: false,
          message: 'Payment not found'
        };
      }

      const updateData = { status };
      if (status === 'Received') {
        updateData.receivedDate = new Date();
      }

      payment = await Payment.findByIdAndUpdate(
        paymentId,
        updateData,
        { new: true, runValidators: true }
      ).populate('project', 'name location')
       .populate('site', 'name address')
       .populate('associate', 'name')
       .populate('createdBy', 'name');

      return {
        success: true,
        message: 'Payment status updated successfully',
        data: payment
      };
    } catch (error) {
      throw error;
    }
  }

  // Delete payment
  async deletePayment(paymentId, user) {
    try {
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        return {
          success: false,
          message: 'Payment not found'
        };
      }

      // Check if user has permission to delete this payment
      if (user.role === 'associate' && payment.associate.toString() !== user.id) {
        return {
          success: false,
          message: 'Not authorized to delete this payment',
          statusCode: 403
        };
      }

      await Payment.findByIdAndDelete(paymentId);

      return {
        success: true,
        message: 'Payment deleted successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  // Get associate commission data
  async getAssociateCommission(associateId) {
    try {
      const commissionRate = 0.05; // 5% commission

      const totalCommission = await Payment.aggregate([
        { $match: { associate: associateId, status: 'Received' } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$amount', commissionRate] } } } }
      ]);

      const pendingCommission = await Payment.aggregate([
        { $match: { associate: associateId, status: 'Pending' } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$amount', commissionRate] } } } }
      ]);

      const monthlyCommission = await Payment.aggregate([
        {
          $match: {
            associate: associateId,
            status: 'Received',
            receivedDate: {
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        },
        { $group: { _id: null, total: { $sum: { $multiply: ['$amount', commissionRate] } } } }
      ]);

      const commissionHistory = await Payment.find({
        associate: associateId,
        status: 'Received'
      })
        .populate('project', 'name')
        .sort({ receivedDate: -1 })
        .limit(10);

      return {
        success: true,
        data: {
          totalCommission: totalCommission[0]?.total || 0,
          pendingCommission: pendingCommission[0]?.total || 0,
          monthlyCommission: monthlyCommission[0]?.total || 0,
          commissionRate: commissionRate * 100,
          history: commissionHistory.map(payment => ({
            id: payment._id,
            customerName: payment.customerName,
            project: payment.project.name,
            amount: payment.amount,
            commission: payment.amount * commissionRate,
            receivedDate: payment.receivedDate
          }))
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Get associate amounts data
  async getAssociateAmounts(associateId) {
    try {
      const totalAmount = await Payment.aggregate([
        { $match: { associate: associateId, status: 'Received' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const pendingAmount = await Payment.aggregate([
        { $match: { associate: associateId, status: 'Pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const advancePayments = await Payment.find({
        associate: associateId,
        paymentType: 'Booking'
      }).populate('project', 'name');

      const emiPayments = await Payment.find({
        associate: associateId,
        paymentType: 'Installment'
      }).populate('project', 'name');

      return {
        success: true,
        data: {
          totalAmount: totalAmount[0]?.total || 0,
          pendingAmount: pendingAmount[0]?.total || 0,
          advancePayments,
          emiPayments
        }
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new PaymentService();