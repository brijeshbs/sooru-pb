const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  projectId: {
    type: String,
    unique: true,
    required: true
  },
  projectName: {
    type: String,
    required: true,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  floorPlans: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FloorPlan'
  }]
}, {
  timestamps: true
});

// Generate ProjectId before saving
projectSchema.pre('save', async function(next) {
  if (!this.projectId) {
    const prefix = this.projectName.slice(0, 3).toUpperCase();
    const Project = this.constructor;
    
    // Find the latest project with this prefix
    const latestProject = await Project.findOne({
      projectId: new RegExp(`^${prefix}\\d{3}$`)
    }).sort({ projectId: -1 });

    let number = 1;
    if (latestProject) {
      const lastNumber = parseInt(latestProject.projectId.slice(-3));
      number = lastNumber + 1;
    }

    this.projectId = `${prefix}${String(number).padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);