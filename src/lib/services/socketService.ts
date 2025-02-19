import { io, Socket } from 'socket.io-client';
import { ChatMessage } from '../types';
import { config } from '../config';
import Cookies from 'js-cookie';

const USER_ID_COOKIE = 'user_id';

class SocketService {
  private socket: Socket | null = null;
  private messageHandlers: ((message: ChatMessage) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private joinedRooms: Set<string> = new Set();
  private isReconnecting = false;

  connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve(this.socket);
        return;
      }

      const userId = Cookies.get(USER_ID_COOKIE);
      console.log('Connecting to Socket.IO server at:', config.socketUrl, 'with user ID:', userId);
      
      this.socket = io(config.socketUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        timeout: 20000,
        query: { userId }
      });

      this.socket.on('connect', async () => {
        console.log('Connected to Socket.IO server with ID:', this.socket?.id);
        this.reconnectAttempts = 0;

        // If this was a reconnection, rejoin all rooms
        if (this.isReconnecting) {
          this.isReconnecting = false;
          const rooms = Array.from(this.joinedRooms);
          this.joinedRooms.clear(); // Clear so we can properly rejoin
          
          try {
            for (const room of rooms) {
              await this.joinChat(room);
            }
          } catch (error) {
            console.error('Error rejoining rooms after reconnect:', error);
          }
        }

        resolve(this.socket!);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        this.reconnectAttempts++;
        this.isReconnecting = true;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('Max reconnection attempts reached');
          this.socket?.disconnect();
          this.joinedRooms.clear();
          reject(error);
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Disconnected from Socket.IO server:', reason);
        this.isReconnecting = true;
        
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, need to manually reconnect
          this.socket?.connect();
        }
      });

      this.socket.on('message-received', (message: ChatMessage) => {
        const userId = Cookies.get(USER_ID_COOKIE);
        console.log('Received message:', message, 'current user:', userId);
        
        // Only process messages from other users
        if (message.senderId !== userId) {
          this.messageHandlers.forEach(handler => handler(message));
        }
      });
    });
  }

  disconnect() {
    if (this.socket) {
      console.log('Disconnecting from Socket.IO server');
      this.joinedRooms.clear();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinChat(chatId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      console.log('Joining chat room:', chatId);
      this.socket.emit('join-chat', chatId, (error?: string) => {
        if (error) {
          console.error('Failed to join chat room:', error);
          reject(new Error(error));
          return;
        }
        
        console.log('Successfully joined chat room:', chatId);
        this.joinedRooms.add(chatId);
        resolve();
      });
    });
  }

  leaveChat(chatId: string) {
    if (this.socket?.connected) {
      console.log('Leaving chat room:', chatId);
      this.socket.emit('leave-chat', chatId);
      this.joinedRooms.delete(chatId);
    }
  }

  sendMessage(chatId: string, message: ChatMessage) {
    if (!this.socket?.connected) {
      console.error('Socket not connected, cannot send message');
      return;
    }

    if (!this.joinedRooms.has(chatId)) {
      console.error('Not joined to chat room:', chatId);
      return;
    }

    console.log('Sending message to chat:', chatId, message);
    this.socket.emit('new-message', chatId, message);
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