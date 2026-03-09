const Payment = require('../models/Payment');

const RANKS = [
  { name: 'CUSTOM', min: 0, max: 500000, rate: 5 },
  { name: 'STAR', min: 500000, max: 5000000, rate: 6 },
  { name: 'GOLD', min: 4000000, max: 10000000, rate: 7 },
  { name: 'PLATINUM', min: 10000000, max: 20000000, rate: 8 },
  { name: 'RUBY', min: 20000000, max: 50000000, rate: 9 },
  { name: 'EMERALD', min: 50000000, max: 100000000, rate: 10 },
  { name: 'DOUBLE DIAMOND', min: 100000000, max: 150000000, rate: 11 },
  { name: 'CROWN', min: 150000000, max: 200000000, rate: 12 },
  { name: 'EX CROWN', min: 200000000, max: 300000000, rate: 13 },
  { name: 'SUPER CROWN', min: 300000000, max: 500000000, rate: 14 },
  { name: 'ROYAL CROWN', min: 500000000, max: Infinity, rate: 15 }
];

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

      // 🔥 Automatically generate commissions if payment received during creation
      if (payment.status === 'Received') {
        const CommissionService = require('./commissionService');
        await CommissionService.generateCommissionFromPayment(payment._id);
      }

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

      // 🔥 Automatically generate commissions if payment received
      if (status === 'Received') {
        const CommissionService = require('./commissionService');
        await CommissionService.generateCommissionFromPayment(paymentId);
      }

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
      const Commission = require('../models/Commission');
      const User = require('../models/User');

      const user = await User.findById(associateId);
      
      const commissions = await Commission.find({ associate: associateId });
      
      const totalEarned = commissions.reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
      
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyCommission = commissions
        .filter(c => new Date(c.createdAt) >= firstDayOfMonth)
        .reduce((sum, c) => sum + (c.commissionAmount || 0), 0);

      // Pending (based on Payment status)
      const pendingPayments = await Payment.find({ associate: associateId, status: 'Pending' });
      const currentRankRate = user ? (RANKS.find(r => r.name === user.rank)?.rate || 5) : 5;
      const pendingCommission = pendingPayments.reduce((sum, p) => sum + (p.amount * currentRankRate / 100), 0);

      const commissionHistory = await Commission.find({ associate: associateId })
        .populate('project', 'name')
        .populate('payment', 'customerName amount')
        .sort({ createdAt: -1 })
        .limit(10);

      return {
        success: true,
        data: {
          totalCommission: totalEarned,
          pendingCommission: pendingCommission,
          monthlyCommission: monthlyCommission,
          currentRank: user ? user.rank : 'STAR',
          totalSales: user ? user.totalSales : 0,
          history: commissionHistory.map(c => ({
            id: c._id,
            customerName: c.payment?.customerName || 'N/A',
            project: c.project?.name || 'N/A',
            amount: c.saleAmount,
            commission: c.commissionAmount,
            rate: c.commissionRate,
            earnedDate: c.createdAt
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