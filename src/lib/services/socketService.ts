import { io, Socket } from 'socket.io-client';
import { ChatMessage } from '../types';
import { config } from '../config';

class SocketService {
  private socket: Socket | null = null;
  private messageHandlers: ((message: ChatMessage) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect() {
    if (!this.socket) {
      console.log('Connecting to Socket.IO server at:', config.socketUrl);
      
      this.socket = io(config.socketUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        timeout: 20000
      });

      this.socket.on('connect', () => {
        console.log('Connected to Socket.IO server with ID:', this.socket?.id);
        this.reconnectAttempts = 0;
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('Max reconnection attempts reached');
          this.socket?.disconnect();
        }
      });

      this.socket.on('message-received', (message: ChatMessage) => {
        console.log('Received message:', message);
        this.messageHandlers.forEach(handler => handler(message));
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Disconnected from Socket.IO server:', reason);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      console.log('Disconnecting from Socket.IO server');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinChat(chatId: string) {
    if (this.socket?.connected) {
      console.log('Joining chat room:', chatId);
      this.socket.emit('join-chat', chatId);
    } else {
      console.error('Socket not connected, cannot join chat');
    }
  }

  leaveChat(chatId: string) {
    if (this.socket?.connected) {
      console.log('Leaving chat room:', chatId);
      this.socket.emit('leave-chat', chatId);
    }
  }

  sendMessage(chatId: string, message: ChatMessage) {
    if (this.socket?.connected) {
      console.log('Sending message to chat:', chatId, message);
      this.socket.emit('new-message', chatId, message);
    } else {
      console.error('Socket not connected, cannot send message');
    }
  }

  onMessage(handler: (message: ChatMessage) => void) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

// Export a singleton instance
export const socketService = new SocketService(); 