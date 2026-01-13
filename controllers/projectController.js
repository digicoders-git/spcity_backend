const projectService = require('../services/projectService');
const CommissionService = require('../services/commissionService');
const { validationResult } = require('express-validator');

class ProjectController {

  // ================= GET ALL PROJECTS =================
  async getAllProjects(req, res) {
    try {
      const { page = 1, limit = 10, search = '', status = '', type = '' } = req.query;

      const result = await projectService.getAllProjects(
        page,
        limit,
        search,
        status,
        type
      );

      res.json(result);
    } catch (error) {
      console.error('Get projects error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // ================= CREATE PROJECT =================
  async createProject(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const projectData = {
        ...req.body,
        createdBy: req.user.id
      };

      // 🔥 image req.file ke saath service ko pass karo
      const result = await projectService.createProject(
        projectData,
        req.file
      );

      res.status(201).json(result);
    } catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Server error'
      });
    }
  }

  // ================= UPDATE PROJECT =================
  async updateProject(req, res) {
    try {
      console.log('📝 Update request received for:', req.params.id);
      console.log('📁 File:', req.file ? 'Yes' : 'No');
      console.log('📄 Body:', req.body);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      // 🔥 image + data dono pass karo
      const result = await projectService.updateProject(
        req.params.id,
        req.body,
        req.file
      );

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('❌ Update project error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Server error'
      });
    }
  }

  // ================= DELETE PROJECT =================
  async deleteProject(req, res) {
    try {
      const result = await projectService.deleteProject(req.params.id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Delete project error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // ================= GET PROJECT BY ID =================
  async getProjectById(req, res) {
    try {
      const result = await projectService.getProjectById(req.params.id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Get project by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // ================= ASSOCIATE PROJECTS =================
  async getAssociateProjects(req, res) {
    try {
      const result = await projectService.getAssociateProjects(req.user.id);
      res.json(result);
    } catch (error) {
      console.error('Get associate projects error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // ================= COMPLETE PROJECT & GENERATE COMMISSIONS =================
  async completeProject(req, res) {
    try {
      const projectId = req.params.id; // Use 'id' from route params
      
      const result = await CommissionService.approveProjectCompletion(
        projectId,
        req.user.id
      );
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      res.json({
        success: true,
        message: 'Project completed successfully and commissions generated',
        data: result.data
      });
    } catch (error) {
      console.error('Complete project error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
}

module.exports = new ProjectController();
