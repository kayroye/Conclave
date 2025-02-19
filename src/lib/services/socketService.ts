import { io, Socket } from 'socket.io-client';
import { ChatMessage } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private messageHandlers: ((message: ChatMessage) => void)[] = [];

  connect() {
    if (!this.socket) {
      this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000');

      this.socket.on('connect', () => {
        console.log('Connected to Socket.IO server');
      });

      this.socket.on('message-received', (message: ChatMessage) => {
        this.messageHandlers.forEach(handler => handler(message));
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from Socket.IO server');
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinChat(chatId: string) {
    if (this.socket) {
      this.socket.emit('join-chat', chatId);
    }
  }

  leaveChat(chatId: string) {
    if (this.socket) {
      this.socket.emit('leave-chat', chatId);
    }
  }

  sendMessage(chatId: string, message: ChatMessage) {
    if (this.socket) {
      this.socket.emit('new-message', chatId, message);
    }
  }

  onMessage(handler: (message: ChatMessage) => void) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }
}

// Export a singleton instance
export const socketService = new SocketService(); 