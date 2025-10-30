import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Auth } from './auth';
import { Subject, Observable } from 'rxjs';
import { environment } from '../config/environment';

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
  private listenersInitialized = false;

  // Subjects for broadcasting events (only one instance per event)
  private newMessageSubject = new Subject<MessageData>();
  private messageErrorSubject = new Subject<any>();
  private messageNotificationSubject = new Subject<{ matchId: number; message: MessageData }>();
  private typingSubject = new Subject<{ matchId: number; userId: number }>();
  private stopTypingSubject = new Subject<{ matchId: number; userId: number }>();

  // Public observables that components can subscribe to
  public newMessage$: Observable<MessageData> = this.newMessageSubject.asObservable();
  public messageError$: Observable<any> = this.messageErrorSubject.asObservable();
  public messageNotification$: Observable<{ matchId: number; message: MessageData }> =
    this.messageNotificationSubject.asObservable();
  public typing$: Observable<{ matchId: number; userId: number }> = this.typingSubject.asObservable();
  public stopTyping$: Observable<{ matchId: number; userId: number }> = this.stopTypingSubject.asObservable();

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

    this.socket = io(environment.socketUrl, {
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

    // Initialize event listeners ONCE
    this.initializeListeners();
  }

  private initializeListeners(): void {
    if (this.listenersInitialized || !this.socket) {
      return;
    }

    console.log('Initializing WebSocket listeners (once)');
    this.listenersInitialized = true;

    // Setup listeners that emit to Subjects
    this.socket.on('message:new', (message: MessageData) => {
      this.newMessageSubject.next(message);
    });

    this.socket.on('message:error', (error: any) => {
      this.messageErrorSubject.next(error);
    });

    this.socket.on('message:notification', (data: { matchId: number; message: MessageData }) => {
      this.messageNotificationSubject.next(data);
    });

    this.socket.on('typing:user', (data: { matchId: number; userId: number }) => {
      this.typingSubject.next(data);
    });

    this.socket.on('typing:stop', (data: { matchId: number; userId: number }) => {
      this.stopTypingSubject.next(data);
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

  getConnectionStatus(): boolean {
    return this.isConnected();
  }
}
