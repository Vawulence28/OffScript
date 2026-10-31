const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const episodeRoutes = require('./routes/episodeRoutes');
const pairingRoutes = require('./routes/pairingRoutes');
const speakerRoutes = require('./routes/speakerRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const lowerThirdRoutes = require('./routes/lowerThirdRoutes');
const recordingRoutes = require('./routes/recordingRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const youtubeRoutes = require('./routes/youtubeRoutes');
const commentRoutes = require('./routes/commentRoutes');
const submissionRoutes = require('./routes/submissionRoutes');

const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  }
});

// Expose io instance to express controllers
app.set('io', io);

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use('/api/auth', authRoutes);
app.use('/api/episodes', episodeRoutes);
app.use('/api/pairing', pairingRoutes);
app.use('/api', speakerRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api', lowerThirdRoutes);
app.use('/api', recordingRoutes);
app.use('/api', settingsRoutes);
app.use('/api', youtubeRoutes);
app.use('/api', commentRoutes);
app.use('/api', submissionRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

// WebRTC Signaling via Socket.io
io.on('connection', (socket) => {
  console.log('Client connected to WebRTC signaling:', socket.id);

  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
    socket.to(room).emit('peer-joined', socket.id);
  });

  socket.on('join-audience', (episodeId) => {
    socket.join(episodeId.toString());
  });

  socket.on('offer', ({ room, offer }) => {
    socket.to(room).emit('offer', offer);
  });

  socket.on('answer', ({ room, answer }) => {
    socket.to(room).emit('answer', answer);
  });

  socket.on('ice-candidate', ({ room, candidate }) => {
    socket.to(room).emit('ice-candidate', candidate);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  socket.on('send-comment', (commentData) => {
    io.to(commentData.episode_id.toString()).emit('new-comment', commentData);
  });

  socket.on('feature-comment', (data) => {
    io.to(data.episode_id.toString()).emit('featured-comment', data);
  });
});

server.listen(PORT, () => {
  console.log(`OffScript Backend & Socket.io running on port ${PORT}`);
});

module.exports = app;