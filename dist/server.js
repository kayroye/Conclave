"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const next_1 = __importDefault(require("next"));
const socket_io_1 = require("socket.io");
const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);
const app = (0, next_1.default)({ dev, hostname, port });
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
            origin: '*',
            methods: ['GET', 'POST']
        }
    });
    // Socket.IO connection handling
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);
        // Join a chat room
        socket.on('join-chat', (chatId) => {
            socket.join(chatId);
            console.log(`Client ${socket.id} joined chat ${chatId}`);
        });
        // Leave a chat room
        socket.on('leave-chat', (chatId) => {
            socket.leave(chatId);
            console.log(`Client ${socket.id} left chat ${chatId}`);
        });
        // Handle new messages
        socket.on('new-message', (chatId, message) => {
            // Broadcast the message to all clients in the chat room except the sender
            socket.to(chatId).emit('message-received', message);
        });
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });
    server.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
    });
};
startServer().catch(err => {
    console.error('Error starting server:', err);
    process.exit(1);
});
