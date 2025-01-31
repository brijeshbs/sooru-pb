const Project = require('../models/Project');
const User = require('../models/User');

const projectController = {
  // Create new project
  async create(req, res) {
    try {
      const { projectName } = req.body;
      
      const project = new Project({
        projectName,
        user: req.user._id
      });

      await project.save();

      // Add project to user's projects array
      await User.findByIdAndUpdate(
        req.user._id,
        { $push: { projects: project._id } }
      );

      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Get all projects for a user
  async getAllForUser(req, res) {
    try {
      const projects = await Project.find({ user: req.user._id })
        .populate('floorPlans');
      
      res.json(projects);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Get specific project
  async getById(req, res) {
    try {
      const project = await Project.findOne({
        _id: req.params.id,
        user: req.user._id
      }).populate('floorPlans');

      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      res.json(project);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Update project
  async update(req, res) {
    try {
      const { projectName } = req.body;

      const project = await Project.findOneAndUpdate(
        {
          _id: req.params.id,
          user: req.user._id
        },
        { projectName },
        { new: true }
      );

      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      res.json(project);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Delete project
  async delete(req, res) {
    try {
      const project = await Project.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id
      });

      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Remove project from user's projects array
      await User.findByIdAndUpdate(
        req.user._id,
        { $pull: { projects: project._id } }
      );

      res.json({ message: 'Project deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = projectController;