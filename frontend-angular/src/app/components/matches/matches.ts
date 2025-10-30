import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Match as MatchService, MatchData } from '../../services/match';
import { Message as MessageService } from '../../services/message';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../config/environment';

interface MatchWithUnread extends MatchData {
  unreadCount?: number;
}

@Component({
  selector: 'app-matches',
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './matches.html',
  styleUrl: './matches.scss'
})
export class Matches implements OnInit {
  matches = signal<MatchWithUnread[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');

  constructor(
    private matchService: MatchService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadMatches();
  }

  loadMatches(): void {
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

        // Add unread count to each match
        const matchesWithUnread: MatchWithUnread[] = matches.map(match => ({
          ...match,
          unreadCount: unreadCounts[match.matchId] || 0
        }));

        this.matches.set(matchesWithUnread);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading matches:', error);
        this.errorMessage.set('matches.errorLoading');
        this.isLoading.set(false);
      }
    });
  }

  unmatch(matchId: number, matchedUserName: string): void {
    if (!confirm(`Voulez-vous vraiment supprimer le match avec ${matchedUserName} ?`)) {
      return;
    }

    this.matchService.unmatch(matchId).subscribe({
      next: () => {
        // Remove the match from the list
        this.matches.update(matches => matches.filter(m => m.matchId !== matchId));
      },
      error: (error) => {
        console.error('Error unmatching:', error);
        alert('Erreur lors de la suppression du match');
      }
    });
  }

  getTimeAgo(matchedAt: string): string {
    const now = new Date();
    const matchDate = new Date(matchedAt);
    const diffMs = now.getTime() - matchDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return matchDate.toLocaleDateString('fr-FR');
  }

  getPhotoUrl(url: string): string {
    // If it's a relative URL (uploaded file), prepend backend URL
    if (url && url.startsWith('/uploads/')) {
      return `${environment.socketUrl}${url}`;
    }
    return url;
  }

  getAge(birthDate: string | undefined): number | null {
    if (!birthDate) return null;

    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  }

  getLocation(city: string | undefined, country: string | undefined): string {
    if (city && country) {
      return `${city}, ${country}`;
    } else if (city) {
      return city;
    } else if (country) {
      return country;
    }
    return '';
  }
}
