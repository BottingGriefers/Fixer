const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Basic security
app.use(express.static(path.join(__dirname, 'public')));

// CORS configuration for Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  maxHttpBufferSize: 1e7 // 10MB max file size
});

// Store online users
const onlineUsers = new Map();
const messageHistory = [];
const MAX_HISTORY = 100;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    onlineUsers: onlineUsers.size,
    uptime: process.uptime()
  });
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle user joining
  socket.on('join', (userData) => {
    const { username } = userData;
    
    // Check for duplicate usernames
    const existingUser = Array.from(onlineUsers.values())
      .find(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (existingUser) {
      socket.emit('join_error', 'Username already taken');
      return;
    }

    onlineUsers.set(socket.id, {
      username,
      joinedAt: new Date(),
      socketId: socket.id
    });

    // Send message history to new user
    socket.emit('message_history', messageHistory.slice(-MAX_HISTORY));
    
    // Broadcast user joined
    io.emit('user_joined', {
      username,
      onlineCount: onlineUsers.size,
      timestamp: Date.now()
    });

    // Update online users list
    io.emit('online_users', Array.from(onlineUsers.values()).map(u => u.username));
    
    console.log(`${username} joined. Online: ${onlineUsers.size}`);
  });

  // Handle chat messages
  socket.on('chat_message', (messageData) => {
    const user = onlineUsers.get(socket.id);
    if (!user) return;

    const message = {
      ...messageData,
      sender: user.username,
      timestamp: Date.now(),
      messageId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    // Store in history
    messageHistory.push(message);
    if (messageHistory.length > MAX_HISTORY) {
      messageHistory.shift();
    }

    // Broadcast to all clients
    io.emit('chat_message', message);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const user = onlineUsers.get(socket.id);
    if (user) {
      onlineUsers.delete(socket.id);
      
      io.emit('user_left', {
        username: user.username,
        onlineCount: onlineUsers.size,
        timestamp: Date.now()
      });
      
      io.emit('online_users', Array.from(onlineUsers.values()).map(u => u.username));
      console.log(`${user.username} left. Online: ${onlineUsers.size}`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MarketChat server running on port ${PORT}`);
});