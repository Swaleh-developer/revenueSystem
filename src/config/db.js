const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { format } = require('date-fns');

// Singleton connection state
let cachedConnection = null;

// Connection retry configuration
const RETRY_CONFIG = {
  maxRetries: 5,
  initialDelay: 1000,  // 1 second
  maxDelay: 10000,     // 10 seconds
  factor: 2            // Exponential backoff
};

// Connection options based on environment
const getOptions = () => {
  const commonOptions = {
    autoIndex: false,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4
  };

  if (process.env.NODE_ENV === 'production') {
    return {
      ...commonOptions,
      ssl: true,
      sslValidate: true,
      sslCA: process.env.MONGO_SSL_CA || '/path/to/ca.pem',
      authMechanism: 'SCRAM-SHA-512',
      readPreference: 'primaryPreferred',
      retryWrites: true
    };
  }

  return {
    ...commonOptions,
    ssl: false,
    retryWrites: false
  };
};

// Exponential backoff retry utility
const retryWithBackoff = async (fn, retries = RETRY_CONFIG.maxRetries, delay = RETRY_CONFIG.initialDelay) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    
    logger.warn(`Connection attempt failed. Retrying in ${delay}ms... (${retries} left)`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return retryWithBackoff(fn, retries - 1, Math.min(delay * RETRY_CONFIG.factor, RETRY_CONFIG.maxDelay));
  }
};

// Connection health monitor
const startHealthMonitor = () => {
  const checkConnection = () => {
    if (mongoose.connection.readyState !== 1) {
      logger.error('MongoDB connection lost! Attempting reconnect...');
      connectDB().catch(err => {
        logger.fatal(`Failed to reconnect: ${err.message}`);
      });
    }
  };

  setInterval(checkConnection, 30000); // Check every 30 seconds
};

// Main connection handler
const connectDB = async () => {
  // Singleton: return existing connection
  if (cachedConnection) {
    logger.info('Using cached MongoDB connection');
    return cachedConnection;
  }

  // Validate environment
  if (!process.env.MONGO_URI) {
    logger.fatal('MONGO_URI not defined in environment variables');
    throw new Error('Missing MONGO_URI');
  }

  try {
    // Configure connection
    const options = getOptions();
    
    // Establish connection with retry logic
    await retryWithBackoff(async () => {
      await mongoose.connect(process.env.MONGO_URI, options);
      logger.info(`MongoDB connected successfully [${process.env.NODE_ENV || 'development'}]`);
    });

    // Cache connection
    cachedConnection = mongoose.connection;

    // Setup event listeners
    setupEventListeners(cachedConnection);

    // Start health monitoring
    if (process.env.NODE_ENV !== 'test') {
      startHealthMonitor();
    }

    return cachedConnection;
  } catch (error) {
    logger.fatal(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

// Event listener setup
const setupEventListeners = (connection) => {
  connection.on('connected', () => {
    logger.info(`Mongoose connected to DB at ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
  });

  connection.on('disconnected', () => {
    logger.warn(`Mongoose disconnected at ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
  });

  connection.on('reconnected', () => {
    logger.info(`Mongoose reconnected at ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
  });

  connection.on('error', (err) => {
    logger.error(`MongoDB connection error: ${err.message}`);
  });

  connection.on('timeout', () => {
    logger.warn('MongoDB connection timeout detected');
  });

  connection.on('close', () => {
    logger.info(`Mongoose connection closed at ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
  });
};

// Graceful shutdown
const setupGracefulShutdown = () => {
  const handleShutdown = async (signal) => {
    if (cachedConnection) {
      await cachedConnection.close();
      logger.info(`MongoDB connection closed via ${signal}`);
    }
    process.exit(0);
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGHUP', () => handleShutdown('SIGHUP'));
};

// Initialize shutdown handlers
setupGracefulShutdown();

module.exports = connectDB;