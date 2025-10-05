import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Message as MessageService, MessageData } from '../../services/message';
import { Match as MatchService, MatchData } from '../../services/match';
import { Auth } from '../../services/auth';
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

  private refreshInterval: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService,
    private matchService: MatchService,
    private authService: Auth
  ) {
    // Get current user ID
    const user = this.authService.currentUser();
    if (user) {
      this.currentUserId.set(user.id);
    }
  }

  ngOnInit(): void {
    // Get matchId from route
    this.route.params.subscribe(params => {
      const matchId = parseInt(params['matchId']);
      if (matchId) {
        this.matchId.set(matchId);
        this.loadMatch();
        this.loadMessages();

        // Refresh messages every 3 seconds
        this.refreshInterval = setInterval(() => {
          this.loadMessages(true);
        }, 3000);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
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

    this.messageService.sendMessage(matchId, match.otherUser.id, message).subscribe({
      next: () => {
        this.newMessage.set('');
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
