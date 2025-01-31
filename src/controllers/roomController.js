const FloorPlan = require('../models/FloorPlan');
const { getIo } = require('../websocket/socket');

const roomController = {
  // Update a room
  async updateRoom(req, res) {
    try {
      const { projectId, planId, roomId } = req.params;
      const roomData = req.body;

      const floorPlan = await FloorPlan.findOne({
        _id: planId,
        projectId: projectId
      });

      if (!floorPlan) {
        return res.status(404).json({ message: 'Floor plan not found' });
      }

      // Find and update the room
      const roomIndex = floorPlan.rooms.findIndex(room => room._id.toString() === roomId);
      if (roomIndex === -1) {
        return res.status(404).json({ message: 'Room not found' });
      }

      // Update room data
      floorPlan.rooms[roomIndex] = {
        ...floorPlan.rooms[roomIndex],
        ...roomData
      };

      // Save the changes
      await floorPlan.save();

      // Emit room update event
      const io = getIo();
      io.to(`project-${projectId}`).emit('room-updated', {
        projectId,
        planId,
        room: floorPlan.rooms[roomIndex]
      });

      res.json(floorPlan.rooms[roomIndex]);
    } catch (error) {
      console.error('Error updating room:', error);
      res.status(500).json({ message: 'Error updating room' });
    }
  },

  // Add a new room
  async addRoom(req, res) {
    try {
      const { projectId, planId } = req.params;
      const roomData = req.body;

      const floorPlan = await FloorPlan.findOne({
        _id: planId,
        projectId: projectId
      });

      if (!floorPlan) {
        return res.status(404).json({ message: 'Floor plan not found' });
      }

      // Validate room placement
      const isValid = await validateRoomPlacement(floorPlan, roomData);
      if (!isValid) {
        return res.status(400).json({ message: 'Invalid room placement' });
      }

      // Add new room
      floorPlan.rooms.push(roomData);
      await floorPlan.save();

      // Emit room added event
      const io = getIo();
      io.to(`project-${projectId}`).emit('room-added', {
        projectId,
        planId,
        room: roomData
      });

      res.status(201).json(roomData);
    } catch (error) {
      console.error('Error adding room:', error);
      res.status(500).json({ message: 'Error adding room' });
    }
  },

  // Delete a room
  async deleteRoom(req, res) {
    try {
      const { projectId, planId, roomId } = req.params;

      const floorPlan = await FloorPlan.findOne({
        _id: planId,
        projectId: projectId
      });

      if (!floorPlan) {
        return res.status(404).json({ message: 'Floor plan not found' });
      }

      // Remove the room
      floorPlan.rooms = floorPlan.rooms.filter(
        room => room._id.toString() !== roomId
      );

      await floorPlan.save();

      // Emit room deleted event
      const io = getIo();
      io.to(`project-${projectId}`).emit('room-deleted', {
        projectId,
        planId,
        roomId
      });

      res.json({ message: 'Room deleted successfully' });
    } catch (error) {
      console.error('Error deleting room:', error);
      res.status(500).json({ message: 'Error deleting room' });
    }
  },

  // Get room measurements
  async getMeasurements(req, res) {
    try {
      const { projectId, planId } = req.params;

      const floorPlan = await FloorPlan.findOne({
        _id: planId,
        projectId: projectId
      });

      if (!floorPlan) {
        return res.status(404).json({ message: 'Floor plan not found' });
      }

      const measurements = calculateMeasurements(floorPlan);
      res.json(measurements);
    } catch (error) {
      console.error('Error getting measurements:', error);
      res.status(500).json({ message: 'Error getting measurements' });
    }
  },

  // Validate room placement
  async validateRoomPlacement(req, res) {
    try {
      const { projectId, planId } = req.params;
      const roomData = req.body;

      const floorPlan = await FloorPlan.findOne({
        _id: planId,
        projectId: projectId
      });

      if (!floorPlan) {
        return res.status(404).json({ message: 'Floor plan not found' });
      }

      const isValid = await validateRoomPlacement(floorPlan, roomData);
      res.json({ valid: isValid });
    } catch (error) {
      console.error('Error validating room placement:', error);
      res.status(500).json({ message: 'Error validating room placement' });
    }
  }
};

// Helper function to calculate measurements
const calculateMeasurements = (floorPlan) => {
  const totalArea = floorPlan.dimensions.width * floorPlan.dimensions.length;
  const roomsArea = floorPlan.rooms.reduce((sum, room) => 
    sum + (room.dimensions.width * room.dimensions.length), 0);

  const areaByType = floorPlan.rooms.reduce((acc, room) => {
    const area = room.dimensions.width * room.dimensions.length;
    acc[room.type] = (acc[room.type] || 0) + area;
    return acc;
  }, {});

  return {
    totalArea,
    roomsArea,
    availableArea: totalArea - roomsArea,
    utilizationPercentage: (roomsArea / totalArea) * 100,
    areaByType
  };
};

// Helper function to validate room placement
const validateRoomPlacement = async (floorPlan, newRoom) => {
  // Check if room is within floor plan boundaries
  if (newRoom.position.x < 0 || 
      newRoom.position.y < 0 ||
      newRoom.position.x + newRoom.dimensions.width > floorPlan.dimensions.width ||
      newRoom.position.y + newRoom.dimensions.length > floorPlan.dimensions.length) {
    return false;
  }

  // Check for overlapping rooms
  for (const room of floorPlan.rooms) {
    if (checkRoomOverlap(room, newRoom)) {
      return false;
    }
  }

  return true;
};

// Helper function to check if two rooms overlap
const checkRoomOverlap = (room1, room2) => {
  return !(room1.position.x + room1.dimensions.width <= room2.position.x ||
           room2.position.x + room2.dimensions.width <= room1.position.x ||
           room1.position.y + room1.dimensions.length <= room2.position.y ||
           room2.position.y + room2.dimensions.length <= room1.position.y);
};

module.exports = roomController;