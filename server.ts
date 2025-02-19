import { createServer } from 'http';
import next from 'next';
import { Server } from 'socket.io';
import { ChatMessage } from './src/lib/types';

const dev = process.env.NODE_ENV !== 'production';
const hostname = dev ? 'localhost' : '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);
const appUrl = process.env.NEXT_PUBLIC_APP_URL || `http://${hostname}:${port}`;

console.log('Starting server with config:', {
  dev,
  hostname,
  port,
  appUrl
});

const app = next({ 
  dev,
  hostname,
  port
});
const handle = app.getRequestHandler();

const startServer = async () => {
  await app.prepare();

  const server = createServer(async (req, res) => {
    try {
      await handle(req, res);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  const io = new Server(server, {
    cors: {
      origin: [appUrl, 'http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    const clientId = socket.id;
    console.log('Client connected:', {
      id: clientId,
      transport: socket.conn.transport.name,
      address: socket.handshake.address,
      url: socket.handshake.url
    });

    socket.on('join-chat', (chatId: string) => {
      socket.join(chatId);
      console.log('Client joined chat:', {
        clientId,
        chatId,
        rooms: Array.from(socket.rooms)
      });
    });

    socket.on('leave-chat', (chatId: string) => {
      socket.leave(chatId);
      console.log('Client left chat:', {
        clientId,
        chatId,
        rooms: Array.from(socket.rooms)
      });
    });

    socket.on('new-message', (chatId: string, message: ChatMessage) => {
      console.log('Broadcasting message:', {
        from: clientId,
        to: chatId,
        message
      });
      socket.to(chatId).emit('message-received', message);
    });

    socket.on('disconnect', (reason) => {
      console.log('Client disconnected:', {
        id: clientId,
        reason,
        rooms: Array.from(socket.rooms)
      });
    });
  });

  server.listen(port, hostname, () => {
    console.log(`> Ready on ${appUrl}`);
  });
};

startServer().catch(err => {
  console.error('Error starting server:', err);
  process.exit(1);
}); 