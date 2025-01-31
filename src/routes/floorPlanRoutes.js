const express = require('express');
const router = express.Router();
const floorPlanController = require('../controllers/floorPlanController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Floor plan routes
router.post('/generate', floorPlanController.generate);
router.get('/', floorPlanController.getAll);
router.get('/:id', floorPlanController.getById);
router.put('/:id', floorPlanController.update);
router.delete('/:id', floorPlanController.delete);

// Room-specific routes
router.post('/:id/rooms', floorPlanController.addRoom);
router.put('/:id/rooms/:roomId', floorPlanController.updateRoom);
router.delete('/:id/rooms/:roomId', floorPlanController.deleteRoom);

module.exports = router;