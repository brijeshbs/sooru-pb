const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const floorPlanRoutes = require('./routes/floorPlanRoutes');
const { initializeSocket } = require('./websocket/socket');
const Project = require('./models/Project');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initializeSocket(server);

// CORS Configuration
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global error handler for async routes
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Basic health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/floorplans', floorPlanRoutes);
app.use('api/projects', projectRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Function to start server
const startServer = async (retryCount = 0) => {
    const MAX_RETRIES = 3;
    const PORT = process.env.PORT || 5000 + retryCount;

    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sooru', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('Connected to MongoDB');

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.log(`Port ${PORT} is busy, trying port ${PORT + 1}...`);
                if (retryCount < MAX_RETRIES) {
                    server.close();
                    startServer(retryCount + 1);
                } else {
                    console.error('No available ports found after maximum retries');
                    process.exit(1);
                }
            } else {
                console.error('Server error:', error);
                process.exit(1);
            }
        });

    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    server.close(() => process.exit(1));
});

// Start the server
if (require.main === module) {
    startServer();
}

module.exports = app;