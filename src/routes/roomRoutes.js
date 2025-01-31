const express = require('express');
const router = express.Router({ mergeParams: true }); // Enable access to params from parent router
const roomController = require('../controllers/roomController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Room operations
router.put('/:roomId', roomController.updateRoom);
router.post('/', roomController.addRoom);
router.delete('/:roomId', roomController.deleteRoom);

// Measurements
router.get('/measurements', roomController.getMeasurements);

// Validation
router.post('/validate', roomController.validateRoomPlacement);

module.exports = router;