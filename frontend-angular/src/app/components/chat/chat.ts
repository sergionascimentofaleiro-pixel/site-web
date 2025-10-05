import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Message as MessageService, MessageData } from '../../services/message';
import { Match as MatchService, MatchData } from '../../services/match';
import { Auth } from '../../services/auth';
import { SocketService } from '../../services/socket';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
  templateUrl: './chat.html',
  styleUrl: './chat.scss'
})
export class Chat implements OnInit, OnDestroy {
  matchId = signal<number | null>(null);
  match = signal<MatchData | null>(null);
  messages = signal<MessageData[]>([]);
  newMessage = signal('');
  isLoading = signal(true);
  isSending = signal(false);
  currentUserId = signal<number | null>(null);
  isTyping = signal(false);

  private typingTimeout: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService,
    private matchService: MatchService,
    private authService: Auth,
    private socketService: SocketService
  ) {
    // Get current user ID
    const user = this.authService.currentUser();
    if (user) {
      this.currentUserId.set(user.id);
    }
  }

  ngOnInit(): void {
    // Connect to WebSocket
    this.socketService.connect();

    // Setup WebSocket event listeners
    this.socketService.onNewMessage((message) => {
      // Add message to list if it belongs to this conversation
      if (message.match_id === this.matchId()) {
        // Check if message already exists to avoid duplicates
        this.messages.update(messages => {
          const exists = messages.some(m => m.id === message.id);
          if (exists) {
            return messages; // Don't add duplicate
          }
          return [...messages, message];
        });
        setTimeout(() => this.scrollToBottom(), 100);
        this.isSending.set(false);
      }
    });

    this.socketService.onMessageError((error) => {
      console.error('Message error:', error);
      alert('Erreur lors de l\'envoi du message');
      this.isSending.set(false);
    });

    this.socketService.onTyping((data) => {
      if (data.matchId === this.matchId() && data.userId !== this.currentUserId()) {
        this.isTyping.set(true);
      }
    });

    this.socketService.onStopTyping((data) => {
      if (data.matchId === this.matchId()) {
        this.isTyping.set(false);
      }
    });

    // Get matchId from route
    this.route.params.subscribe(params => {
      const matchId = parseInt(params['matchId']);
      if (matchId) {
        this.matchId.set(matchId);
        this.loadMatch();
        this.loadMessages();

        // Join the conversation room via WebSocket
        this.socketService.joinConversation(matchId);
      }
    });
  }

  ngOnDestroy(): void {
    // Leave conversation room
    const matchId = this.matchId();
    if (matchId) {
      this.socketService.leaveConversation(matchId);
    }

    // Clean up typing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Remove listeners
    this.socketService.removeAllListeners();
  }

  loadMatch(): void {
    this.matchService.getMatches().subscribe({
      next: (matches) => {
        const match = matches.find(m => m.matchId === this.matchId());
        if (match) {
          this.match.set(match);
        } else {
          // Match not found, redirect to matches page
          this.router.navigate(['/matches']);
        }
      },
      error: (error) => {
        console.error('Error loading match:', error);
        this.router.navigate(['/matches']);
      }
    });
  }

  loadMessages(silent: boolean = false): void {
    if (!silent) {
      this.isLoading.set(true);
    }

    const matchId = this.matchId();
    if (!matchId) return;

    this.messageService.getConversation(matchId).subscribe({
      next: (messages) => {
        this.messages.set(messages);
        this.isLoading.set(false);

        // Scroll to bottom after messages load
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        this.isLoading.set(false);
      }
    });
  }

  sendMessage(): void {
    const message = this.newMessage().trim();
    if (!message || this.isSending()) return;

    const matchId = this.matchId();
    const match = this.match();
    if (!matchId || !match) return;

    this.isSending.set(true);
    const messageText = message;
    this.newMessage.set('');

    // Check if WebSocket is connected
    if (this.socketService.getConnectionStatus()) {
      // Send via WebSocket
      this.socketService.sendMessage(matchId, match.otherUser.id, messageText);

      // Stop typing indicator
      this.socketService.stopTyping(matchId, match.otherUser.id);

      // Set timeout to fallback to HTTP if WebSocket doesn't respond
      setTimeout(() => {
        if (this.isSending()) {
          console.warn('WebSocket timeout, falling back to HTTP');
          this.sendViaHttp(matchId, match.otherUser.id, messageText);
        }
      }, 3000);
    } else {
      // Fallback to HTTP if WebSocket not connected
      console.log('WebSocket not connected, using HTTP');
      this.sendViaHttp(matchId, match.otherUser.id, messageText);
    }
  }

  private sendViaHttp(matchId: number, receiverId: number, message: string): void {
    this.messageService.sendMessage(matchId, receiverId, message).subscribe({
      next: () => {
        this.isSending.set(false);
        this.loadMessages(true);
      },
      error: (error) => {
        console.error('Error sending message:', error);
        alert('Erreur lors de l\'envoi du message');
        this.isSending.set(false);
      }
    });
  }

  onInput(): void {
    const matchId = this.matchId();
    const match = this.match();
    if (!matchId || !match) return;

    // Send typing indicator
    this.socketService.startTyping(matchId, match.otherUser.id);

    // Clear previous timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Stop typing after 2 seconds of inactivity
    this.typingTimeout = setTimeout(() => {
      this.socketService.stopTyping(matchId, match.otherUser.id);
    }, 2000);
  }

  isMyMessage(message: MessageData): boolean {
    return message.sender_id === this.currentUserId();
  }

  getTimeString(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const diffMins = Math.floor(diff / 60000);
    const diffHours = Math.floor(diff / 3600000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  private scrollToBottom(): void {
    const messagesContainer = document.querySelector('.messages-list');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}
