const Project = require('../models/Project');
const cloudinary = require('../config/cloudinary');

/**
 * Upload image to Cloudinary (memory buffer)
 */
const uploadImage = (file, folder = 'sp-city/projects') => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image'
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    ).end(file.buffer);
  });
};

class ProjectService {

  // ================= GET ALL PROJECTS =================
  async getAllProjects(page, limit, search, status, type) {
    try {
      let query = {};

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } }
        ];
      }

      if (status) query.status = status;
      if (type) query.type = type;

      const projects = await Project.find(query)
        .populate('assignedTo', 'name')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Project.countDocuments(query);

      return {
        success: true,
        data: projects,
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

  // ================= CREATE PROJECT =================
  async createProject(projectData, file) {
    try {
      console.log('📁 File received:', file ? 'Yes' : 'No');
      if (file) {
        console.log('📁 File details:', { 
          fieldname: file.fieldname, 
          originalname: file.originalname, 
          mimetype: file.mimetype,
          size: file.size 
        });
      }

      // Available units default
      projectData.availableUnits = projectData.totalUnits;

      // 🔥 Cloudinary image upload
      if (file) {
        console.log('☁️ Uploading to Cloudinary...');
        projectData.image = await uploadImage(file);
        console.log('✅ Image uploaded:', projectData.image);
      }

      const project = await Project.create(projectData);

      const populatedProject = await Project.findById(project._id)
        .populate('assignedTo', 'name')
        .populate('createdBy', 'name');

      return {
        success: true,
        message: 'Project created successfully',
        data: populatedProject
      };
    } catch (error) {
      console.error('❌ Create project error:', error);
      throw error;
    }
  }

  // ================= UPDATE PROJECT =================
  async updateProject(projectId, updateData, file) {
    try {
      console.log('🔍 Finding project:', projectId);
      const project = await Project.findById(projectId);
      if (!project) {
        console.log('❌ Project not found');
        return {
          success: false,
          message: 'Project not found'
        };
      }

      console.log('✅ Project found:', project.name);
      console.log('📄 Update data:', updateData);

      // 🔥 Upload new image if provided
      if (file) {
        console.log('☁️ Uploading new image to Cloudinary...');
        updateData.image = await uploadImage(file);
        console.log('✅ New image uploaded:', updateData.image);
      }

      console.log('💾 Updating project in database...');
      const updatedProject = await Project.findByIdAndUpdate(
        projectId,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('assignedTo', 'name')
        .populate('createdBy', 'name');

      console.log('✅ Project updated successfully');
      return {
        success: true,
        message: 'Project updated successfully',
        data: updatedProject
      };
    } catch (error) {
      console.error('❌ Update project service error:', error);
      throw error;
    }
  }

  // ================= DELETE PROJECT =================
  async deleteProject(projectId) {
    try {
      const project = await Project.findById(projectId);
      if (!project) {
        return {
          success: false,
          message: 'Project not found'
        };
      }

      await Project.findByIdAndDelete(projectId);

      return {
        success: true,
        message: 'Project deleted successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  // ================= GET PROJECT BY ID =================
  async getProjectById(projectId) {
    try {
      const project = await Project.findById(projectId)
        .populate('assignedTo', 'name')
        .populate('createdBy', 'name');

      if (!project) {
        return {
          success: false,
          message: 'Project not found'
        };
      }

      return {
        success: true,
        data: project
      };
    } catch (error) {
      throw error;
    }
  }

  // ================= ASSOCIATE PROJECTS =================
  async getAssociateProjects(associateId) {
    try {
      const projects = await Project.find({
        assignedTo: { $in: [associateId] }
      })
        .populate('assignedTo', 'name')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 });

      return {
        success: true,
        data: projects
      };
    } catch (error) {
      throw error;
    }
  }

  // ================= PROJECT STATS =================
  async getProjectStats() {
    try {
      const totalProjects = await Project.countDocuments();

      const statusStats = await Project.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      const typeStats = await Project.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]);

      return {
        success: true,
        data: {
          total: totalProjects,
          byStatus: statusStats,
          byType: typeStats
        }
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ProjectService();
