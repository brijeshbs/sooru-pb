const FloorPlan = require('../models/FloorPlan');
const AIService = require('../services/aiService');

const floorPlanController = {
  async generate(req, res) {
    try {
      const { projectId } = req.params;
      const { requirements, dimensions, aiSettings } = req.body;

      // Create initial floor plan
      const floorPlan = new FloorPlan({
        name: `Floor Plan - ${new Date().toLocaleDateString()}`,
        projectId,
        dimensions,
        requirements,
        aiSettings,
        status: 'generating',
        createdBy: req.user._id
      });

      await floorPlan.save();

      try {
        // Generate floor plan using AI
        const { rooms, layout } = await AIService.generateFloorPlan(
          requirements,
          dimensions,
          aiSettings
        );

        // Update floor plan with generated results
        floorPlan.rooms = rooms;
        floorPlan.generatedLayout = layout;
        floorPlan.status = 'completed';
        await floorPlan.save();

        res.json(floorPlan);
      } catch (error) {
        // Update status if generation fails
        floorPlan.status = 'failed';
        await floorPlan.save();
        throw error;
      }
    } catch (error) {
      console.error('Floor Plan Generation Error:', error);
      res.status(500).json({ 
        message: error.message || 'Error generating floor plan' 
      });
    }
  },

  async getAll(req, res) {
    try {
      const { projectId } = req.params;
      const floorPlans = await FloorPlan.find({ 
        projectId,
        createdBy: req.user._id 
      }).sort({ createdAt: -1 });

      res.json(floorPlans);
    } catch (error) {
      res.status(500).json({ 
        message: error.message || 'Error fetching floor plans' 
      });
    }
  },

  async getById(req, res) {
    try {
      const floorPlan = await FloorPlan.findOne({
        _id: req.params.id,
        createdBy: req.user._id
      });

      if (!floorPlan) {
        return res.status(404).json({ message: 'Floor plan not found' });
      }

      res.json(floorPlan);
    } catch (error) {
      res.status(500).json({ 
        message: error.message || 'Error fetching floor plan' 
      });
    }
  },

  async update(req, res) {
    try {
      const { name, requirements, dimensions, aiSettings } = req.body;
      
      const floorPlan = await FloorPlan.findOneAndUpdate(
        {
          _id: req.params.id,
          createdBy: req.user._id
        },
        { name, requirements, dimensions, aiSettings },
        { new: true }
      );

      if (!floorPlan) {
        return res.status(404).json({ message: 'Floor plan not found' });
      }

      res.json(floorPlan);
    } catch (error) {
      res.status(500).json({ 
        message: error.message || 'Error updating floor plan' 
      });
    }
  },

  async delete(req, res) {
    try {
      const floorPlan = await FloorPlan.findOneAndDelete({
        _id: req.params.id,
        createdBy: req.user._id
      });

      if (!floorPlan) {
        return res.status(404).json({ message: 'Floor plan not found' });
      }

      res.json({ message: 'Floor plan deleted successfully' });
    } catch (error) {
      res.status(500).json({ 
        message: error.message || 'Error deleting floor plan' 
      });
    }
  }
};

module.exports = floorPlanController;