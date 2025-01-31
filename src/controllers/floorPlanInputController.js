const FloorPlanInputService = require('../services/floorPlanInputService');
const AIService = require('../services/aiService');
const FloorPlan = require('../models/FloorPlan');

const floorPlanInputController = {
  // Get suggested room dimensions based on plot size
  async getSuggestions(req, res) {
    try {
      const { plotWidth, plotLength } = req.query;
      
      const suggestions = FloorPlanInputService.suggestRoomDimensions(
        parseFloat(plotWidth),
        parseFloat(plotLength)
      );

      res.json({ suggestions });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Initialize floor plan creation with plot dimensions
  async initializePlan(req, res) {
    try {
      const { plotWidth, plotLength, projectId } = req.body;

      // Validate plot dimensions
      const dimensions = FloorPlanInputService.validatePlotDimensions(
        parseFloat(plotWidth),
        parseFloat(plotLength)
      );

      // Create initial floor plan record
      const floorPlan = new FloorPlan({
        name: `Floor Plan - ${new Date().toLocaleDateString()}`,
        projectId,
        dimensions,
        status: 'draft',
        createdBy: req.user._id
      });

      await floorPlan.save();

      res.json({
        floorPlanId: floorPlan._id,
        suggestions: FloorPlanInputService.suggestRoomDimensions(plotWidth, plotLength)
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Add rooms to the plan
  async addRooms(req, res) {
    try {
      const { floorPlanId } = req.params;
      const { rooms } = req.body;

      const floorPlan = await FloorPlan.findById(floorPlanId);
      if (!floorPlan) {
        return res.status(404).json({ message: 'Floor plan not found' });
      }

      // Process and validate rooms
      const processedInput = await FloorPlanInputService.processUserInput({
        plotWidth: floorPlan.dimensions.width,
        plotLength: floorPlan.dimensions.length,
        rooms
      });

      // Generate floor plan using AI
      const { rooms: generatedRooms, layout } = await AIService.generateFloorPlan(
        processedInput.requirements,
        processedInput.dimensions,
        { optimizeFor: 'space' }
      );

      // Update floor plan with generated layout
      floorPlan.rooms = generatedRooms;
      floorPlan.generatedLayout = layout;
      floorPlan.status = 'completed';
      await floorPlan.save();

      res.json(floorPlan);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
};

module.exports = floorPlanInputController;