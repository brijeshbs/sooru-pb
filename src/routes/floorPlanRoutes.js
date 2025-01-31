const express = require('express');
const router = express.Router();
const floorPlanController = require('../controllers/floorPlanController');

// Create a new floor plan
router.post('/', floorPlanController.create);

// Generate AI floor plan
router.post('/generate', floorPlanController.generate);

// Get all floor plans
router.get('/', floorPlanController.getAll);

// Get specific floor plan
router.get('/:id', floorPlanController.getById);

// Update floor plan
router.put('/:id', floorPlanController.update);

// Delete floor plan
router.delete('/:id', floorPlanController.delete);

module.exports = router;