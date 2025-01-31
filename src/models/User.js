const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true,
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  }
}, {
  timestamps: true
});

// Generate userId before saving
userSchema.pre('save', async function(next) {
  try {
    if (this.isNew) {
      // Generate userId
      const prefix = this.name.substring(0, 3).toUpperCase();
      const User = this.constructor;
      
      const latestUser = await User.findOne({
        userId: new RegExp(`^${prefix}\\d{3}$`)
      }).sort({ userId: -1 });

      let number = 1;
      if (latestUser) {
        const lastNumber = parseInt(latestUser.userId.slice(-3));
        number = lastNumber + 1;
      }

      this.userId = `${prefix}${String(number).padStart(3, '0')}`;
    }

    // Hash password if modified
    if (this.isModified('password')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('User', userSchema);