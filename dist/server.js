"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const next_1 = __importDefault(require("next"));
const socket_io_1 = require("socket.io");
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
const app = (0, next_1.default)({
    dev,
    hostname,
    port
});
const handle = app.getRequestHandler();
const startServer = async () => {
    await app.prepare();
    const server = (0, http_1.createServer)(async (req, res) => {
        try {
            await handle(req, res);
        }
        catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('Internal Server Error');
        }
    });
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: [appUrl, 'http://localhost:3000'],
            methods: ['GET', 'POST'],
            credentials: true
        },
        transports: ['websocket', 'polling'],
        pingTimeout: 60000,
        pingInterval: 25000
    });
    // Track active users in rooms
    const activeRooms = new Map();
    io.on('connection', (socket) => {
        const clientId = socket.id;
        /*console.log('Client connected:', {
          id: clientId,
          transport: socket.conn.transport.name,
          address: socket.handshake.address,
          url: socket.handshake.url,
          query: socket.handshake.query
        });*/
        socket.on('join-chat', (chatId, callback) => {
            try {
                // Add user to room tracking
                if (!activeRooms.has(chatId)) {
                    activeRooms.set(chatId, new Set());
                }
                activeRooms.get(chatId)?.add(clientId);
                socket.join(chatId);
                console.log('Client joined chat:', {
                    clientId,
                    chatId,
                    rooms: Array.from(socket.rooms),
                    activeUsers: Array.from(activeRooms.get(chatId) || [])
                });
                // Send acknowledgment of successful join
                if (callback)
                    callback();
            }
            catch (error) {
                console.error('Error joining chat:', error);
                if (callback)
                    callback(error instanceof Error ? error.message : 'Failed to join chat');
            }
        });
        socket.on('leave-chat', (chatId) => {
            // Remove user from room tracking
            activeRooms.get(chatId)?.delete(clientId);
            if (activeRooms.get(chatId)?.size === 0) {
                activeRooms.delete(chatId);
            }
            socket.leave(chatId);
            console.log('Client left chat:', {
                clientId,
                chatId,
                rooms: Array.from(socket.rooms),
                remainingUsers: Array.from(activeRooms.get(chatId) || [])
            });
        });
        socket.on('new-message', (chatId, message) => {
            // Verify the sender is in the room
            if (!socket.rooms.has(chatId)) {
                console.warn('Client tried to send message to room they are not in:', {
                    clientId,
                    chatId,
                    message
                });
                return;
            }
            /*console.log('Broadcasting message:', {
              from: clientId,
              to: chatId,
              message,
              activeUsers: Array.from(activeRooms.get(chatId) || [])
            });*/
            // Broadcast to all clients in the room except sender
            socket.to(chatId).emit('message-received', message);
        });
        socket.on('disconnect', (reason) => {
            // Clean up room tracking
            for (const [roomId, users] of activeRooms.entries()) {
                if (users.has(clientId)) {
                    users.delete(clientId);
                    if (users.size === 0) {
                        activeRooms.delete(roomId);
                    }
                }
            }
            console.log('Client disconnected:', {
                id: clientId,
                reason,
                rooms: Array.from(socket.rooms),
                activeRooms: Array.from(activeRooms.entries())
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
