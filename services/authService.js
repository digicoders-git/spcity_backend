const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthService {
  // Login user
  async loginUser(identifier, password) {
    try {
      // Find user by email or username
      const user = await User.findOne({ 
        $or: [
          { email: identifier },
          { username: identifier }
        ]
      }).select('+password');
      
      if (!user) {
        return {
          success: false,
          message: 'Invalid credentials'
        };
      }

      // Check if user is active
      if (user.status !== 'Active') {
        return {
          success: false,
          message: 'Account is inactive. Please contact admin.'
        };
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return {
          success: false,
          message: 'Invalid credentials'
        };
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return {
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            username: user.username,
            role: user.role,
            permissions: user.permissions,
            department: user.department,
            status: user.status
          }
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Get user profile
  async getUserProfile(userId) {
    try {
      const user = await User.findById(userId).select('-password');
      return user;
    } catch (error) {
      throw error;
    }
  }

  // Update user profile
  async updateUserProfile(userId, updateData) {
    try {
      const allowedFields = ['name', 'phone', 'address', 'bio'];
      const updates = {};
      
      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
          updates[key] = updateData[key];
        }
      });

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      return {
        success: true,
        message: 'Profile updated successfully',
        data: user
      };
    } catch (error) {
      throw error;
    }
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId).select('+password');

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return {
          success: false,
          message: 'Current password is incorrect'
        };
      }

      user.password = newPassword;
      await user.save();

      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  // Verify JWT token
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return null;
      }

      return user;
    } catch (error) {
      return null;
    }
  }
}

module.exports = new AuthService();