const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('./utils/logger');
require('dotenv').config();

// Import database connection (initializes connection)
require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const matchRoutes = require('./routes/match');
const messageRoutes = require('./routes/message');
const interestRoutes = require('./routes/interest');
const locationRoutes = require('./routes/location');
const subscriptionRoutes = require('./routes/subscription');
const imageRoutes = require('./routes/imageRoutes');

const app = express();
const server = http.createServer(app);

// Allowed origins for CORS (web + mobile apps)
const allowedOrigins = [
  'http://localhost:4200',              // Dev local web
  'https://curvy-wine.vercel.app',      // Production web (Vercel)
  'capacitor://localhost',               // iOS Capacitor
  'http://localhost',                    // Android Capacitor (HTTP)
  'https://localhost',                   // Android Capacitor (HTTPS)
  'ionic://localhost',                   // Alternative Capacitor scheme
  'http://192.168.1.1'                   // Placeholder for dev with IP (will match regex below)
];

// Socket.io CORS configuration
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps)
      if (!origin) {
        return callback(null, true);
      }
      // Allow whitelisted origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Allow local network IPs for development (192.168.x.x, 10.x.x.x)
      if (origin.match(/^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/)) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 3000;

// Trust proxy - REQUIRED for Fly.io and other reverse proxies
// This allows Express to correctly identify client IPs from X-Forwarded-For headers
app.set('trust proxy', true);

// Security Middleware
// Configure helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "http:", "http://localhost:3000", "https://curvy-backend.fly.dev"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:4200', "http://localhost:3000", "https://curvy-backend.fly.dev"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Allow embedding images from external sources
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration - allow web and mobile apps
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) {
      return callback(null, true);
    }
    // Allow whitelisted origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Allow local network IPs for development (192.168.x.x, 10.x.x.x)
    if (origin.match(/^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/)) {
      return callback(null, true);
    }
    // Reject other origins
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Limit request body size to prevent DoS attacks
app.use(express.json({ limit: '1mb' }));

// REMOVED: Direct static file serving - use /api/images/secure instead
// app.use('/uploads', express.static('uploads'));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Dating app backend is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/interests', interestRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/images', imageRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid token'));
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  const userId = socket.userId;
  logger.info(`User ${userId} connected via WebSocket`);

  // Join user to their own room for direct messages
  socket.join(`user:${userId}`);

  // Handle joining a conversation room
  socket.on('join:conversation', (matchId) => {
    socket.join(`match:${matchId}`);
    logger.debug(`User ${userId} joined conversation ${matchId}`);
  });

  // Handle leaving a conversation room
  socket.on('leave:conversation', (matchId) => {
    socket.leave(`match:${matchId}`);
    logger.debug(`User ${userId} left conversation ${matchId}`);
  });

  // Handle sending a message
  socket.on('message:send', async (data) => {
    const { matchId, receiverId, message } = data;

    try {
      logger.debug(`[WebSocket] User ${userId} sending message to match ${matchId}`);

      // Import models and sanitizer
      const Message = require('./models/Message');
      const Subscription = require('./models/Subscription');
      const { sanitizeMessage } = require('./utils/sanitizer');

      // Sanitize message to prevent XSS
      const sanitizedMessage = sanitizeMessage(message);
      if (!sanitizedMessage || sanitizedMessage.length === 0) {
        socket.emit('message:error', { error: 'Invalid message content' });
        return;
      }

      // Check if user can access this conversation
      const canAccessResult = await Subscription.canAccessConversation(userId, matchId);
      if (!canAccessResult.canAccess) {
        socket.emit('message:error', {
          error: 'Conversation limit reached',
          conversationCount: canAccessResult.conversationCount,
          limit: canAccessResult.limit,
          requiresSubscription: true
        });
        return;
      }

      // Save message to database with sanitized content
      const messageId = await Message.create(matchId, userId, receiverId, sanitizedMessage);

      // Add conversation to user's list (if not already there)
      await Subscription.addConversation(userId, matchId);

      // Get the full message data
      const savedMessage = await Message.getById(messageId);

      logger.debug(`[WebSocket] Message saved, emitting to match:${matchId} and user:${receiverId}`);

      // Emit to both sender and receiver in the conversation room
      io.to(`match:${matchId}`).emit('message:new', savedMessage);

      // Also emit to receiver's personal room in case they're not in conversation
      io.to(`user:${receiverId}`).emit('message:notification', {
        matchId,
        message: savedMessage
      });

      // Also emit directly to sender to confirm receipt
      socket.emit('message:new', savedMessage);

      logger.debug(`[WebSocket] Message emitted successfully`);
    } catch (error) {
      logger.error('Error sending message via WebSocket:', { error: error.message, userId, matchId });
      socket.emit('message:error', { error: 'Failed to send message' });
    }
  });

  // Handle typing indicator
  socket.on('typing:start', (data) => {
    const { matchId, receiverId } = data;
    socket.to(`user:${receiverId}`).emit('typing:user', { matchId, userId });
  });

  socket.on('typing:stop', (data) => {
    const { matchId, receiverId } = data;
    socket.to(`user:${receiverId}`).emit('typing:stop', { matchId, userId });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    logger.info(`User ${userId} disconnected`);
  });
});

// Make io accessible to routes
app.set('io', io);

// Setup scheduled tasks
const { setupScheduler } = require('./scheduler');

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    logger.info(`Dating app server is running on port ${PORT}`);
    logger.info(`WebSocket server is ready`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

    // Initialize scheduler
    setupScheduler();
  });
}

// Export app and server for testing
module.exports = app;
module.exports.server = server;