import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Match as MatchService, MatchData } from '../../services/match';
import { Message as MessageService } from '../../services/message';
import { SocketService } from '../../services/socket';
import { TranslateModule } from '@ngx-translate/core';

interface ConversationPreview extends MatchData {
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

@Component({
  selector: 'app-messages',
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './messages.html',
  styleUrl: './messages.scss'
})
export class Messages implements OnInit {
  conversations = signal<ConversationPreview[]>([]);
  isLoading = signal(true);

  constructor(
    private matchService: MatchService,
    private messageService: MessageService,
    private socketService: SocketService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Connect to WebSocket
    this.socketService.connect();

    // Listen for new message notifications
    this.socketService.onMessageNotification((data) => {
      // Update the conversation with new message
      this.updateConversationWithNewMessage(data.matchId, data.message);
    });

    this.loadConversations();
  }

  loadConversations(): void {
    this.isLoading.set(true);

    this.matchService.getMatches().subscribe({
      next: async (matches) => {
        // Get unread counts for all matches
        let unreadCounts: { [matchId: number]: number } = {};
        try {
          unreadCounts = await firstValueFrom(this.messageService.getUnreadCounts());
        } catch (error) {
          console.error('Error loading unread counts:', error);
        }

        // For each match, get the last message
        const conversationsWithMessages: ConversationPreview[] = [];

        for (const match of matches) {
          try {
            const messages = await firstValueFrom(this.messageService.getConversation(match.matchId, 1));
            const lastMessage = messages && messages.length > 0 ? messages[0] : null;

            conversationsWithMessages.push({
              ...match,
              lastMessage: lastMessage?.message,
              lastMessageTime: lastMessage?.created_at,
              unreadCount: unreadCounts[match.matchId] || 0
            });
          } catch (error) {
            console.error(`Error loading messages for match ${match.matchId}:`, error);
            conversationsWithMessages.push({
              ...match,
              unreadCount: unreadCounts[match.matchId] || 0
            });
          }
        }

        // Sort by last message time (most recent first)
        conversationsWithMessages.sort((a, b) => {
          if (!a.lastMessageTime) return 1;
          if (!b.lastMessageTime) return -1;
          return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
        });

        this.conversations.set(conversationsWithMessages);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading matches:', error);
        this.isLoading.set(false);
      }
    });
  }

  updateConversationWithNewMessage(matchId: number, message: any): void {
    this.conversations.update(convs => {
      const index = convs.findIndex(c => c.matchId === matchId);
      if (index !== -1) {
        const updated = [...convs];
        updated[index] = {
          ...updated[index],
          lastMessage: message.message,
          lastMessageTime: message.created_at,
          unreadCount: (updated[index].unreadCount || 0) + 1
        };

        // Move to top
        const [conversation] = updated.splice(index, 1);
        updated.unshift(conversation);

        return updated;
      }
      return convs;
    });
  }

  openChat(matchId: number): void {
    // Reset unread count for this conversation
    this.conversations.update(convs => {
      const index = convs.findIndex(c => c.matchId === matchId);
      if (index !== -1) {
        const updated = [...convs];
        updated[index] = {
          ...updated[index],
          unreadCount: 0
        };
        return updated;
      }
      return convs;
    });

    this.router.navigate(['/chat', matchId]);
  }

  getTimeAgo(timestamp?: string): string {
    if (!timestamp) return '';

    const now = new Date();
    const messageDate = new Date(timestamp);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `${diffDays}j`;
    return messageDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  }

  getPreviewText(message?: string): string {
    if (!message) return 'Aucun message';
    return message.length > 50 ? message.substring(0, 50) + '...' : message;
  }
}
