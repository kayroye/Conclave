import { createServer } from 'http';
import next from 'next';
import { Server } from 'socket.io';
import { ChatMessage } from './src/lib/types';

const dev = process.env.NODE_ENV !== 'production';
const hostname = dev ? 'localhost' : '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ 
  dev,
  hostname,
  port
});
const handle = app.getRequestHandler();

const startServer = async () => {
  await app.prepare(); // Prepare the next.js app

  const server = createServer(async (req, res) => {
    try {
      await handle(req, res); // let next.js handle all http requests
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  // Socket.IO setup
  const io = new Server(server, {
    cors: {
      // In production, you should restrict this to your actual domain
      origin: dev ? '*' : process.env.NEXT_PUBLIC_APP_URL || '*',
      methods: ['GET', 'POST']
    }
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join a chat room
    socket.on('join-chat', (chatId: string) => {
      socket.join(chatId);
      console.log(`Client ${socket.id} joined chat ${chatId}`);
    });

    // Leave a chat room
    socket.on('leave-chat', (chatId: string) => {
      socket.leave(chatId);
      console.log(`Client ${socket.id} left chat ${chatId}`);
    });

    // Handle new messages
    socket.on('new-message', (chatId: string, message: ChatMessage) => {
      // Broadcast the message to all clients in the chat room except the sender
      socket.to(chatId).emit('message-received', message);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
};

startServer().catch(err => {
  console.error('Error starting server:', err);
  process.exit(1);
}); 