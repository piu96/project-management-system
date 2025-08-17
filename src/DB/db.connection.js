const mongoose = require('mongoose');
require('dotenv').config();

const environment = process.env.NODE_ENV || 'development';

// MongoDB connection configuration
const getMongoURI = () => {
  if (environment === 'test') {
    return process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/project_management_test';
  }
  return process.env.MONGODB_URI || 'mongodb://localhost:27017/project_management_dev';
};

const connectDB = async () => {
  try {
    const mongoURI = getMongoURI();
    
    // MongoDB connection options (compatible with latest MongoDB driver)
    const options = {
      // Connection pool settings
      maxPoolSize: 10,              // Maximum number of connections
      minPoolSize: 2,               // Minimum number of connections
      maxIdleTimeMS: 30000,         // Close connections after 30 seconds of inactivity
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000,       // Close sockets after 45 seconds of inactivity
    };

    // Connect to MongoDB
    await mongoose.connect(mongoURI, options);
    
    console.log(`✅ MongoDB connected successfully!`);
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🌍 Environment: ${environment}`);
    console.log(`🔗 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
    
    // Import all models to register them
    require('../models');
    console.log('📋 All models registered successfully');
    
  } catch (error) {
    console.error('❌ Unable to connect to MongoDB:', error.message);
    console.error('🔍 Full error:', error);
    
    // Exit process with failure in production
    if (environment === 'production') {
      process.exit(1);
    }
  }
};

// Connection event listeners
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('🔄 MongoDB connection closed through app termination');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
});

// Health check function
const checkDBHealth = async () => {
  try {
    const state = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected', 
      2: 'connecting',
      3: 'disconnecting'
    };
    
    return {
      status: states[state],
      database: mongoose.connection.name,
      host: mongoose.connection.host,
      port: mongoose.connection.port
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
};

// Initialize connection
connectDB();

module.exports = {
  mongoose,
  connectDB,
  checkDBHealth
};
