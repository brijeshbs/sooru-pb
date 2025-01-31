const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const userController = {
  // Register new user
  register: async (req, res) => {
    try {
      const { name, email, password } = req.body;

      // Validate input
      if (!name || !email || !password) {
        return res.status(400).json({ 
          message: 'Please provide all required fields' 
        });
      }

      // Check if user already exists
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

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || 'your-secret-key',
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
      res.status(500).json({ 
        message: 'Registration failed', 
        error: error.message 
      });
    }
  },

  // Login user
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate token
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || 'your-secret-key',
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
      res.status(500).json({ 
        message: 'Login failed', 
        error: error.message 
      });
    }
  },

  // Get user profile
  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ 
        message: 'Error fetching profile', 
        error: error.message 
      });
    }
  },

  // Update user profile
  updateProfile: async (req, res) => {
    try {
      const { name, email } = req.body;
      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update fields
      if (name) user.name = name;
      if (email) user.email = email;

      await user.save();

      res.json({
        message: 'Profile updated successfully',
        user: {
          userId: user.userId,
          name: user.name,
          email: user.email
        }
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Error updating profile', 
        error: error.message 
      });
    }
  },

  // Forgot password
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      
      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // In a real application, you would:
      // 1. Generate a password reset token
      // 2. Save it to the user document with an expiry
      // 3. Send an email with the reset link

      res.json({ 
        message: 'If an account exists with that email, you will receive password reset instructions.' 
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Error processing request', 
        error: error.message 
      });
    }
  }
};

module.exports = userController;