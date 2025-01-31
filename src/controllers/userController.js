const User = require('../models/User');
const jwt = require('jsonwebtoken');

const userController = {
  register: async (req, res) => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ 
          message: 'Please provide all required fields' 
        });
      }

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ 
          message: 'User already exists' 
        });
      }

      // Create new user
      const user = new User({
        name,
        email,
        password
      });

      await user.save();

      // Generate token
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          userId: user.userId,
          name: user.name,
          email: user.email
        },
        token
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ 
        message: error.message || 'Error during registration' 
      });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ 
          message: 'Please provide email and password' 
        });
      }

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ 
          message: 'Invalid credentials' 
        });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ 
          message: 'Invalid credentials' 
        });
      }

      // Generate token
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '24h' }
      );

      res.json({
        user: {
          userId: user.userId,
          name: user.name,
          email: user.email
        },
        token
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ 
        message: error.message || 'Error during login' 
      });
    }
  },

  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.user._id)
        .select('-password')
        .populate('projects');
      
      if (!user) {
        return res.status(404).json({ 
          message: 'User not found' 
        });
      }

      res.json(user);
    } catch (error) {
      console.error('Profile error:', error);
      res.status(400).json({ 
        message: error.message || 'Error fetching profile' 
      });
    }
  }
};

module.exports = userController;