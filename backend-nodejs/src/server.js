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
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 3000;

// Security Middleware
// Configure helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:4200'],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Allow embedding images from external sources
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration - restrict to frontend origin only
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Serve static files (uploaded photos)
app.use('/uploads', express.static('uploads'));

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