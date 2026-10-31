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

// Expose io instance to express controllers for instant database triggers
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

// WebRTC & Broadcast Signaling via Socket.io
io.on('connection', (socket) => {
  console.log('Client connected to WebRTC signaling:', socket.id);

  // Host Phone Pairing Room
  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
    socket.to(room).emit('peer-joined', socket.id);
  });

  // Episode Room for Speakers & Audience
  socket.on('join-audience', (episodeId) => {
    const roomId = episodeId.toString();
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined episode room: ${roomId}`);
  });

  // Core P2P Host Signals
  socket.on('offer', ({ room, offer }) => {
    socket.to(room).emit('offer', offer);
  });

  socket.on('answer', ({ room, answer }) => {
    socket.to(room).emit('answer', answer);
  });

  socket.on('ice-candidate', ({ room, candidate }) => {
    socket.to(room).emit('ice-candidate', candidate);
  });

  // Guest Speaker Multi-Peer WebRTC Signaling
  socket.on('speaker-offer', ({ speakerId, offer, episodeId }) => {
    socket.to(episodeId.toString()).emit('speaker-offer', { speakerId, offer });
  });

  socket.on('speaker-answer', ({ speakerId, answer, episodeId }) => {
    socket.to(episodeId.toString()).emit('speaker-answer', { speakerId, answer });
  });

  socket.on('speaker-ice-candidate', ({ speakerId, candidate, episodeId, target }) => {
    if (target === 'studio') {
      socket.to(episodeId.toString()).emit('speaker-ice-candidate', { speakerId, candidate });
    } else {
      socket.to(speakerId.toString()).emit('speaker-ice-candidate', { candidate });
    }
  });

  // Public Audience Stream Relay Signaling
  socket.on('request-broadcast-stream', (episodeId) => {
    socket.to(episodeId.toString()).emit('request-broadcast-stream', socket.id);
  });

  socket.on('broadcast-offer', ({ audienceSocketId, offer }) => {
    io.to(audienceSocketId).emit('broadcast-offer', offer);
  });

  socket.on('broadcast-answer', ({ episodeId, answer }) => {
    socket.to(episodeId.toString()).emit('broadcast-answer', answer);
  });

  socket.on('broadcast-ice', ({ episodeId, candidate, audienceSocketId }) => {
    if (audienceSocketId) {
      io.to(audienceSocketId).emit('broadcast-ice', candidate);
    } else {
      socket.to(episodeId.toString()).emit('broadcast-ice', candidate);
    }
  });

  // Real-time Audience Chat Signals
  socket.on('send-comment', (commentData) => {
    io.to(commentData.episode_id.toString()).emit('new-comment', commentData);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`OffScript Backend & Socket.io running on port ${PORT}`);
});

module.exports = app;