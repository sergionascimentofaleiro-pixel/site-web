import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Auth } from './auth';

export interface MessageData {
  id: number;
  match_id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  sender_photo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;
  private isConnected = signal(false);

  constructor(private authService: Auth) {}

  connect(): void {
    if (this.socket) {
      console.log('WebSocket already connected or connecting');
      return; // Already connected
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.warn('No token available, cannot connect to WebSocket');
      return;
    }

    console.log('Attempting to connect to WebSocket...');

    this.socket = io('http://localhost:3000', {
      auth: {
        token
      },
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected successfully');
      this.isConnected.set(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.isConnected.set(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
      this.isConnected.set(false);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected.set(false);
    }
  }

  joinConversation(matchId: number): void {
    if (this.socket) {
      this.socket.emit('join:conversation', matchId);
    }
  }

  leaveConversation(matchId: number): void {
    if (this.socket) {
      this.socket.emit('leave:conversation', matchId);
    }
  }

  sendMessage(matchId: number, receiverId: number, message: string): void {
    if (this.socket) {
      this.socket.emit('message:send', { matchId, receiverId, message });
    }
  }

  onNewMessage(callback: (message: MessageData) => void): void {
    if (this.socket) {
      this.socket.on('message:new', callback);
    }
  }

  onMessageError(callback: (error: any) => void): void {
    if (this.socket) {
      this.socket.on('message:error', callback);
    }
  }

  onMessageNotification(callback: (data: { matchId: number; message: MessageData }) => void): void {
    if (this.socket) {
      this.socket.on('message:notification', callback);
    }
  }

  startTyping(matchId: number, receiverId: number): void {
    if (this.socket) {
      this.socket.emit('typing:start', { matchId, receiverId });
    }
  }

  stopTyping(matchId: number, receiverId: number): void {
    if (this.socket) {
      this.socket.emit('typing:stop', { matchId, receiverId });
    }
  }

  onTyping(callback: (data: { matchId: number; userId: number }) => void): void {
    if (this.socket) {
      this.socket.on('typing:user', callback);
    }
  }

  onStopTyping(callback: (data: { matchId: number; userId: number }) => void): void {
    if (this.socket) {
      this.socket.on('typing:stop', callback);
    }
  }

  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected();
  }
}
