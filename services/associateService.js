const User = require('../models/User');

class AssociateService {
  // Get all associates with pagination and search
  async getAllAssociates(page, limit, search, sponsorId) {
    try {
      const query = {
        role: 'associate',
        ...(sponsorId && { sponsor: sponsorId }),
        ...(search && {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } }
          ]
        })
      };

      const associates = await User.find(query)
        .select('-password')
        .populate('createdBy', 'name')
        .populate('sponsor', 'name')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await User.countDocuments(query);

      // If sponsorId is provided, we are viewing "My Network" - add financial stats
      let enhancedData = associates;
      if (sponsorId) {
        const Commission = require('../models/Commission');
        const Payment = require('../models/Payment');

        // 1. Get all commissions earned by the Sponsor (the viewer)
        const sponsorCommissions = await Commission.find({ associate: sponsorId, level: { $gt: 1 } })
          .populate({
            path: 'payment',
            select: 'associate amount'
          });

        // 2. Identify which direct referral each payment originated from
        // We'll cache the "branch owner" (direct child of Sponsor) for each associate in the subtree
        const branchCache = {};
        const getBranchOwner = async (targetId) => {
          if (branchCache[targetId]) return branchCache[targetId];
          
          let currentId = targetId;
          let lastId = null;
          
          while (currentId) {
            if (currentId.toString() === sponsorId.toString()) {
              branchCache[targetId] = lastId;
              return lastId;
            }
            const u = await User.findById(currentId).select('sponsor');
            if (!u || !u.sponsor) break;
            lastId = currentId;
            currentId = u.sponsor;
          }
          branchCache[targetId] = null;
          return null;
        };

        // 3. Process each associate in the list to calculate their stats
        enhancedData = await Promise.all(associates.map(async (assoc) => {
          const assocObj = assoc.toObject();
          const assocIdStr = assoc._id.toString();

          // A. Calculate what they earned (their own self + network earnings)
          const theirComms = await Commission.find({ associate: assoc._id });
          assocObj.totalEarnings = theirComms.reduce((sum, c) => sum + c.commissionAmount, 0);

          // B. Calculate what the Sponsor earned FROM this specific branch
          // Filter sponsor commissions where the branch owner matches this associate
          let myEarningsFromThisBranch = 0;
          let branchSales = 0;

          for (const comm of sponsorCommissions) {
            const paymentAssociateId = comm.payment?.associate;
            if (paymentAssociateId) {
              const ownerId = await getBranchOwner(paymentAssociateId);
              if (ownerId && ownerId.toString() === assocIdStr) {
                myEarningsFromThisBranch += comm.commissionAmount;
                // Since there might be multiple commissions on same payment, we only count sale once if we tracks unique payments
                // But simplified: sum commissions
              }
            }
          }
          
          assocObj.myEarningsFromReferral = myEarningsFromThisBranch;
          
          // C. Calculate their Total Network Sales (Team Business)
          // Total amount of payments where the associate is this R or anyone in their subtree
          // This is already tracked in user.totalSales? Let's check User model.
          // Yes, User model has totalSales which is updated for all ancestors.
          assocObj.networkSales = assoc.totalSales || 0;

          return assocObj;
        }));
      }

      return {
        success: true,
        data: enhancedData,
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

  // Create new associate
  async createAssociate(associateData) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email: associateData.email }, { username: associateData.username }]
      });

      if (existingUser) {
        return {
          success: false,
          message: 'User with this email or username already exists'
        };
      }

      // Generate unique username if not provided
      if (!associateData.username) {
        const baseName = associateData.name.toLowerCase().replace(/\s+/g, '');
        let username = baseName;
        let counter = 1;
        
        while (await User.findOne({ username })) {
          username = `${baseName}${counter}`;
          counter++;
        }
        associateData.username = username;
      }

      // Generate default password if not provided
      if (!associateData.password) {
        associateData.password = `${associateData.username}@123`;
      }

      // Store plain password before hashing
      const plainPassword = associateData.password;

      // Set default permissions based on department
      const defaultPermissions = ['leads'];
      if (associateData.department === 'Sales Manager') {
        defaultPermissions.push('projects', 'reports');
      } else if (associateData.department === 'Team Lead') {
        defaultPermissions.push('projects');
      }

      let level = 1;
      if (associateData.sponsor) {
        const sponsorObj = await User.findById(associateData.sponsor);
        if (sponsorObj && sponsorObj.level) {
          level = sponsorObj.level + 1;
        }
      }

      const associate = new User({
        ...associateData,
        plainPassword: plainPassword,
        role: 'associate',
        permissions: associateData.permissions || defaultPermissions,
        status: 'Active',
        level: level
      });

      await associate.save();

      return {
        success: true,
        message: 'Associate created successfully',
        data: {
          id: associate._id,
          name: associate.name,
          email: associate.email,
          username: associate.username,
          phone: associate.phone,
          role: associate.role,
          department: associate.department,
          permissions: associate.permissions,
          status: associate.status,
          loginCredentials: {
            username: associate.username,
            password: plainPassword
          }
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Update associate
  async updateAssociate(associateId, updateData, user) {
    try {
      const associate = await User.findById(associateId);
      if (!associate || associate.role !== 'associate') {
        return {
          success: false,
          message: 'Associate not found'
        };
      }

      // Authorization check
      if (user.role !== 'admin' && associate.sponsor?.toString() !== user.id) {
        return { success: false, message: 'Unauthorized: You can only update your direct downline' };
      }

      // Remove fields that shouldn't be updated via regular update
      delete updateData.password;
      delete updateData.username;
      delete updateData.confirmPassword;
      delete updateData.role; // Remove this line if role updates are allowed

      // Set role-based permissions if role is being updated
      if (updateData.role) {
        const rolePermissions = {
          'Sales Executive': ['leads'],
          'Team Lead': ['leads', 'projects'],
          'Sales Manager': ['leads', 'projects', 'reports']
        };
        updateData.permissions = updateData.permissions || rolePermissions[updateData.role] || [];
      }

      const updatedAssociate = await User.findByIdAndUpdate(
        associateId,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');

      return {
        success: true,
        message: 'Associate updated successfully',
        data: updatedAssociate
      };
    } catch (error) {
      console.error('Update associate error:', error);
      throw error;
    }
  }

  // Change associate password
  async changeAssociatePassword(associateId, newPassword, user) {
    try {
      const associate = await User.findById(associateId);
      if (!associate || associate.role !== 'associate') {
        return {
          success: false,
          message: 'Associate not found'
        };
      }

      // Authorization check
      if (user.role !== 'admin' && associate.sponsor?.toString() !== user.id) {
        return { success: false, message: 'Unauthorized: You can only edit your direct downline' };
      }

      associate.password = newPassword;
      await associate.save();

      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  // Delete associate
  async deleteAssociate(associateId, user) {
    try {
      const associate = await User.findById(associateId);
      if (!associate || associate.role !== 'associate') {
        return {
          success: false,
          message: 'Associate not found'
        };
      }

      // Authorization check
      if (user.role !== 'admin' && associate.sponsor?.toString() !== user.id) {
        return { success: false, message: 'Unauthorized: You can only delete your direct downline' };
      }

      await User.findByIdAndDelete(associateId);

      return {
        success: true,
        message: 'Associate deleted successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  // Get associate profile
  async getAssociateProfile(associateId) {
    try {
      const associate = await User.findById(associateId).select('-password');
      return {
        success: true,
        data: associate
      };
    } catch (error) {
      throw error;
    }
  }

  // Update associate status
  async updateAssociateStatus(associateId, status, user) {
    try {
      const associate = await User.findById(associateId);
      if (!associate || associate.role !== 'associate') {
        return {
          success: false,
          message: 'Associate not found'
        };
      }

      // Authorization check
      if (user.role !== 'admin' && associate.sponsor?.toString() !== user.id) {
        return { success: false, message: 'Unauthorized: You can only edit your direct downline' };
      }

      associate.status = status;
      await associate.save();

      return {
        success: true,
        message: `Associate ${status.toLowerCase()} successfully`,
        data: associate
      };
    } catch (error) {
      throw error;
    }
  }

  // Update associate profile
  async updateAssociateProfile(associateId, updateData, files) {
    try {
      console.log('Update profile requested for ID:', associateId);
      console.log('Update data:', updateData);
      
      const allowedFields = ['name', 'phone', 'address', 'bio', 'panNumber', 'aadhaarNumber'];
      const updates = {};
      
      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key) && updateData[key] !== 'undefined' && updateData[key] !== 'null') {
          updates[key] = updateData[key];
        }
      });

      // Handle nested bankDetails
      if (updateData.bankDetails) {
        try {
          const bankDetails = typeof updateData.bankDetails === 'string' 
            ? JSON.parse(updateData.bankDetails) 
            : updateData.bankDetails;
          
          if (bankDetails && typeof bankDetails === 'object') {
            Object.keys(bankDetails).forEach(key => {
              if (bankDetails[key] !== undefined && bankDetails[key] !== null) {
                updates[`bankDetails.${key}`] = bankDetails[key];
              }
            });
          }
        } catch (parseError) {
          console.error('Error parsing bankDetails:', parseError);
        }
      }

      // Handle document file uploads
      if (files) {
        if (files.panCard && files.panCard[0]) {
          updates['documents.panCard'] = files.panCard[0].path;
        }
        if (files.aadhaarCard && files.aadhaarCard[0]) {
          updates['documents.aadhaarCard'] = files.aadhaarCard[0].path;
        }
      }

      console.log('Final updates object:', updates);

      if (Object.keys(updates).length === 0) {
        return {
          success: true,
          message: 'No changes to update',
          data: await User.findById(associateId).select('-password')
        };
      }

      const updatedAssociate = await User.findByIdAndUpdate(
        associateId,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-password');

      return {
        success: true,
        message: 'Profile updated successfully',
        data: updatedAssociate
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AssociateService();