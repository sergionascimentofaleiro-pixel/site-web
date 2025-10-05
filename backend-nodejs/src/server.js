const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
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

// Middleware
app.use(cors());
app.use(express.json());

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
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
  console.log(`User ${userId} connected via WebSocket`);

  // Join user to their own room for direct messages
  socket.join(`user:${userId}`);

  // Handle joining a conversation room
  socket.on('join:conversation', (matchId) => {
    socket.join(`match:${matchId}`);
    console.log(`User ${userId} joined conversation ${matchId}`);
  });

  // Handle leaving a conversation room
  socket.on('leave:conversation', (matchId) => {
    socket.leave(`match:${matchId}`);
    console.log(`User ${userId} left conversation ${matchId}`);
  });

  // Handle sending a message
  socket.on('message:send', async (data) => {
    const { matchId, receiverId, message } = data;

    try {
      console.log(`[WebSocket] User ${userId} sending message to match ${matchId}`);

      // Import Message model
      const Message = require('./models/Message');

      // Save message to database
      const messageId = await Message.create(matchId, userId, receiverId, message);

      // Get the full message data
      const savedMessage = await Message.getById(messageId);

      console.log(`[WebSocket] Message saved, emitting to match:${matchId} and user:${receiverId}`);

      // Emit to both sender and receiver in the conversation room
      io.to(`match:${matchId}`).emit('message:new', savedMessage);

      // Also emit to receiver's personal room in case they're not in conversation
      io.to(`user:${receiverId}`).emit('message:notification', {
        matchId,
        message: savedMessage
      });

      // Also emit directly to sender to confirm receipt
      socket.emit('message:new', savedMessage);

      console.log(`[WebSocket] Message emitted successfully`);
    } catch (error) {
      console.error('Error sending message:', error);
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
    console.log(`User ${userId} disconnected`);
  });
});

// Make io accessible to routes
app.set('io', io);

// Start server
server.listen(PORT, () => {
  console.log(`Dating app server is running on port ${PORT}`);
  console.log(`WebSocket server is ready`);
});