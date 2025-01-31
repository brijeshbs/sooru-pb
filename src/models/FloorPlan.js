const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['bedroom', 'bathroom', 'kitchen', 'living', 'dining', 'study', 'other']
  },
  dimensions: {
    width: {
      type: Number,
      required: true
    },
    length: {
      type: Number,
      required: true
    }
  },
  position: {
    x: {
      type: Number,
      required: true
    },
    y: {
      type: Number,
      required: true
    }
  },
  aiGenerated: {
    type: Boolean,
    default: false
  }
});

const floorPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  dimensions: {
    width: {
      type: Number,
      required: true
    },
    length: {
      type: Number,
      required: true
    }
  },
  rooms: [roomSchema],
  status: {
    type: String,
    enum: ['draft', 'generating', 'completed', 'failed'],
    default: 'draft'
  },
  requirements: {
    bedrooms: {
      type: Number,
      required: true
    },
    bathrooms: {
      type: Number,
      required: true
    },
    hasKitchen: {
      type: Boolean,
      default: true
    },
    hasLivingRoom: {
      type: Boolean,
      default: true
    },
    hasDiningRoom: {
      type: Boolean,
      default: false
    },
    additionalRooms: [{
      type: String,
      enum: ['study', 'office', 'playroom', 'gym', 'other']
    }]
  },
  aiSettings: {
    style: {
      type: String,
      enum: ['modern', 'traditional', 'minimalist', 'flexible'],
      default: 'flexible'
    },
    optimizeFor: {
      type: String,
      enum: ['space', 'natural_light', 'accessibility', 'energy_efficiency'],
      default: 'space'
    },
    constraints: [{
      type: String
    }]
  },
  generatedLayout: {
    type: String  // Store SVG or JSON representation
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Add an index for efficient querying
floorPlanSchema.index({ projectId: 1, status: 1 });

module.exports = mongoose.model('FloorPlan', floorPlanSchema);