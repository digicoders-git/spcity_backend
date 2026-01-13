const Lead = require('../models/Lead');

class LeadService {
  // Get all leads with filters
  async getAllLeads(page, limit, search, status, source, userId) {
    try {
      let query = {};
      
      // If user is associate, only show their leads
      if (userId) {
        query.assignedTo = userId;
      }

      // Add search filters
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      if (status) query.status = status;
      if (source) query.source = source;

      const leads = await Lead.find(query)
        .populate('assignedTo', 'name')
        .populate('addedBy', 'name')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Lead.countDocuments(query);

      return {
        success: true,
        data: leads,
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

  // Create new lead
  async createLead(leadData) {
    try {
      const lead = new Lead(leadData);
      await lead.save();

      const populatedLead = await Lead.findById(lead._id)
        .populate('assignedTo', 'name')
        .populate('addedBy', 'name');

      return {
        success: true,
        message: 'Lead created successfully',
        data: populatedLead
      };
    } catch (error) {
      throw error;
    }
  }

  // Update lead
  async updateLead(leadId, updateData, user) {
    try {
      let lead = await Lead.findById(leadId);
      if (!lead) {
        return {
          success: false,
          message: 'Lead not found'
        };
      }

      // Check if user has permission to update this lead
      if (user.role === 'associate' && lead.assignedTo.toString() !== user.id) {
        return {
          success: false,
          message: 'Not authorized to update this lead',
          statusCode: 403
        };
      }

      lead = await Lead.findByIdAndUpdate(
        leadId,
        updateData,
        { new: true, runValidators: true }
      ).populate('assignedTo', 'name').populate('addedBy', 'name');

      return {
        success: true,
        message: 'Lead updated successfully',
        data: lead
      };
    } catch (error) {
      throw error;
    }
  }

  // Delete lead
  async deleteLead(leadId, user) {
    try {
      const lead = await Lead.findById(leadId);
      if (!lead) {
        return {
          success: false,
          message: 'Lead not found'
        };
      }

      // Check if user has permission to delete this lead
      if (user.role === 'associate' && lead.assignedTo.toString() !== user.id) {
        return {
          success: false,
          message: 'Not authorized to delete this lead',
          statusCode: 403
        };
      }

      await Lead.findByIdAndDelete(leadId);

      return {
        success: true,
        message: 'Lead deleted successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  // Get lead statistics
  async getLeadStats(userId) {
    try {
      let matchQuery = {};
      if (userId) {
        matchQuery.assignedTo = userId;
      }

      const stats = await Lead.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const totalLeads = await Lead.countDocuments(matchQuery);

      return {
        success: true,
        data: {
          total: totalLeads,
          byStatus: stats
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Get single lead
  async getLeadById(leadId, user) {
    try {
      const lead = await Lead.findById(leadId)
        .populate('assignedTo', 'name')
        .populate('addedBy', 'name');

      if (!lead) {
        return {
          success: false,
          message: 'Lead not found'
        };
      }

      // Check if user has permission to view this lead
      if (user.role === 'associate' && lead.assignedTo._id.toString() !== user.id) {
        return {
          success: false,
          message: 'Not authorized to view this lead',
          statusCode: 403
        };
      }

      return {
        success: true,
        data: lead
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new LeadService();