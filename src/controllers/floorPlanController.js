const FloorPlan = require('../models/FloorPlan');
const { getIo } = require('../websocket/socket');

const floorPlanController = {
  // Generate a new floor plan
  generate: async (req, res) => {
    try {
      const { dimensions, requirements } = req.body;
      
      // Create a new floor plan
      const floorPlan = new FloorPlan({
        dimensions,
        requirements,
        createdBy: req.user._id,
        status: 'generating'
      });

      await floorPlan.save();

      // Generate rooms based on requirements (placeholder for AI logic)
      const generatedRooms = generateBasicRooms(dimensions, requirements);
      
      // Update floor plan with generated rooms
      floorPlan.rooms = generatedRooms;
      floorPlan.status = 'completed';
      await floorPlan.save();

      // Notify clients about the new floor plan
      const io = getIo();
      io.to(`user-${req.user._id}`).emit('floorplan-generated', floorPlan);

      res.status(201).json(floorPlan);
    } catch (error) {
      console.error('Generation error:', error);
      res.status(500).json({ message: 'Error generating floor plan' });
    }
  },

  // Get all floor plans
  getAll: async (req, res) => {
    try {
      const floorPlans = await FloorPlan.find({ createdBy: req.user._id });
      res.json(floorPlans);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching floor plans' });
    }
  },

  // Get specific floor plan
  getById: async (req, res) => {
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
      res.status(500).json({ message: 'Error fetching floor plan' });
    }
  },

  // Update floor plan
  update: async (req, res) => {
    try {
      const floorPlan = await FloorPlan.findOneAndUpdate(
        {
          _id: req.params.id,
          createdBy: req.user._id
        },
        req.body,
        { new: true }
      );

      if (!floorPlan) {
        return res.status(404).json({ message: 'Floor plan not found' });
      }

      // Notify clients about the update
      const io = getIo();
      io.to(`floorplan-${req.params.id}`).emit('floorplan-updated', floorPlan);

      res.json(floorPlan);
    } catch (error) {
      res.status(500).json({ message: 'Error updating floor plan' });
    }
  },

  // Delete floor plan
  delete: async (req, res) => {
    try {
      const floorPlan = await FloorPlan.findOneAndDelete({
        _id: req.params.id,
        createdBy: req.user._id
      });

      if (!floorPlan) {
        return res.status(404).json({ message: 'Floor plan not found' });
      }

      // Notify clients about the deletion
      const io = getIo();
      io.to(`floorplan-${req.params.id}`).emit('floorplan-deleted', req.params.id);

      res.json({ message: 'Floor plan deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting floor plan' });
    }
  },

  // Add room to floor plan
  addRoom: async (req, res) => {
    try {
      const floorPlan = await FloorPlan.findOne({
        _id: req.params.id,
        createdBy: req.user._id
      });

      if (!floorPlan) {
        return res.status(404).json({ message: 'Floor plan not found' });
      }

      const newRoom = {
        ...req.body,
        id: Date.now().toString() // Simple ID generation
      };

      floorPlan.rooms.push(newRoom);
      await floorPlan.save();

      // Notify clients about the new room
      const io = getIo();
      io.to(`floorplan-${req.params.id}`).emit('room-added', {
        floorPlanId: req.params.id,
        room: newRoom
      });

      res.status(201).json(newRoom);
    } catch (error) {
      res.status(500).json({ message: 'Error adding room' });
    }
  },

  // Update room in floor plan
  updateRoom: async (req, res) => {
    try {
      const floorPlan = await FloorPlan.findOne({
        _id: req.params.id,
        createdBy: req.user._id
      });

      if (!floorPlan) {
        return res.status(404).json({ message: 'Floor plan not found' });
      }

      const roomIndex = floorPlan.rooms.findIndex(
        room => room.id === req.params.roomId
      );

      if (roomIndex === -1) {
        return res.status(404).json({ message: 'Room not found' });
      }

      floorPlan.rooms[roomIndex] = {
        ...floorPlan.rooms[roomIndex],
        ...req.body
      };

      await floorPlan.save();

      // Notify clients about the room update
      const io = getIo();
      io.to(`floorplan-${req.params.id}`).emit('room-updated', {
        floorPlanId: req.params.id,
        room: floorPlan.rooms[roomIndex]
      });

      res.json(floorPlan.rooms[roomIndex]);
    } catch (error) {
      res.status(500).json({ message: 'Error updating room' });
    }
  },

  // Delete room from floor plan
  deleteRoom: async (req, res) => {
    try {
      const floorPlan = await FloorPlan.findOne({
        _id: req.params.id,
        createdBy: req.user._id
      });

      if (!floorPlan) {
        return res.status(404).json({ message: 'Floor plan not found' });
      }

      floorPlan.rooms = floorPlan.rooms.filter(
        room => room.id !== req.params.roomId
      );

      await floorPlan.save();

      // Notify clients about the room deletion
      const io = getIo();
      io.to(`floorplan-${req.params.id}`).emit('room-deleted', {
        floorPlanId: req.params.id,
        roomId: req.params.roomId
      });

      res.json({ message: 'Room deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting room' });
    }
  }
};

// Helper function to generate basic rooms (placeholder for AI logic)
const generateBasicRooms = (dimensions, requirements) => {
  const rooms = [];
  let currentX = 0;
  let currentY = 0;

  // Add bedrooms
  for (let i = 0; i < requirements.bedrooms; i++) {
    rooms.push({
      id: `bedroom-${i + 1}`,
      name: `Bedroom ${i + 1}`,
      type: 'bedroom',
      dimensions: { width: 12, length: 12 },
      position: { x: currentX, y: currentY }
    });
    currentX += 14; // Add some spacing between rooms
  }

  // Add other rooms based on requirements
  // This is a simplified version - you'll want to make this more sophisticated
  return rooms;
};

module.exports = floorPlanController;