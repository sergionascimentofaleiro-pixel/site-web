import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Profile as ProfileService, PotentialMatch } from '../../services/profile';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { environment } from '../../config/environment';

@Component({
  selector: 'app-discover',
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './discover.html',
  styleUrl: './discover.scss'
})
export class Discover implements OnInit {
  currentProfile = signal<PotentialMatch | null>(null);
  profiles = signal<PotentialMatch[]>([]);
  isLoading = signal(false);
  showMatchPopup = signal(false);
  matchedProfile = signal<PotentialMatch | null>(null);
  noMoreProfiles = signal(false);

  // Track retry attempts for each image URL
  private imageRetryCount = new Map<string, number>();
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  constructor(
    private profileService: ProfileService,
    private translate: TranslateService
  ) {}

  private get currentLanguage(): string {
    return localStorage.getItem('language') || this.translate.currentLang || 'fr';
  }

  ngOnInit(): void {
    this.loadProfiles();

    // Reload profiles when language changes
    this.translate.onLangChange.subscribe(() => {
      this.loadProfiles();
    });
  }

  loadProfiles(): void {
    this.isLoading.set(true);
    this.profileService.getPotentialMatches(10, this.currentLanguage).subscribe({
      next: (profiles) => {
        this.profiles.set(profiles);
        if (profiles.length > 0) {
          this.currentProfile.set(profiles[0]);
          this.noMoreProfiles.set(false);
        } else {
          this.noMoreProfiles.set(true);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading profiles:', error);
        this.isLoading.set(false);
      }
    });
  }

  like(): void {
    const profile = this.currentProfile();
    if (!profile) return;

    this.profileService.swipe(profile.user_id, 'like').subscribe({
      next: (response) => {
        if (response.isMatch) {
          this.matchedProfile.set(profile);
          this.showMatchPopup.set(true);
        }
        this.nextProfile();
      },
      error: (error) => {
        console.error('Error liking profile:', error);
      }
    });
  }

  pass(): void {
    const profile = this.currentProfile();
    if (!profile) return;

    this.profileService.swipe(profile.user_id, 'pass').subscribe({
      next: () => {
        this.nextProfile();
      },
      error: (error) => {
        console.error('Error passing profile:', error);
      }
    });
  }

  nextProfile(): void {
    const currentProfiles = this.profiles();
    const remaining = currentProfiles.slice(1);

    this.profiles.set(remaining);

    if (remaining.length > 0) {
      this.currentProfile.set(remaining[0]);
    } else {
      this.currentProfile.set(null);
      this.noMoreProfiles.set(true);
    }

    // Load more profiles when running low
    if (remaining.length <= 2) {
      this.loadMoreProfiles();
    }
  }

  loadMoreProfiles(): void {
    this.profileService.getPotentialMatches(10, this.currentLanguage).subscribe({
      next: (newProfiles) => {
        const current = this.profiles();
        // Filter out duplicates by checking user_id
        const currentUserIds = new Set(current.map(p => p.user_id));
        const uniqueNewProfiles = newProfiles.filter(p => !currentUserIds.has(p.user_id));

        // Only add profiles that are not already in the list
        if (uniqueNewProfiles.length > 0) {
          this.profiles.set([...current, ...uniqueNewProfiles]);
        }
      },
      error: (error) => {
        console.error('Error loading more profiles:', error);
      }
    });
  }

  getInterests(profile: PotentialMatch | null): { name: string; icon: string }[] {
    if (!profile?.interests_with_icons) return [];

    return profile.interests_with_icons
      .split('||')
      .filter(item => item.trim())
      .map(item => {
        const [name, icon] = item.split('|');
        return { name: name || '', icon: icon || '' };
      });
  }

  closeMatchPopup(): void {
    this.showMatchPopup.set(false);
    this.matchedProfile.set(null);
  }

  getAge(birthDate: string): number {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  getPhotoUrl(url: string | undefined): string {
    if (!url) return 'https://via.placeholder.com/400x500';

    // If it's a signed URL (starts with /api/images/secure), prepend backend URL
    if (url.startsWith('/api/images/secure')) {
      return `${environment.socketUrl}${url}`;
    }

    // If it's a relative URL (uploaded file), prepend backend URL
    if (url.startsWith('/uploads/')) {
      return `${environment.socketUrl}${url}`;
    }

    // External URL (e.g., from craiyon.ai)
    return url;
  }

  preventContextMenu(event: Event): void {
    event.preventDefault();
  }

  preventDrag(event: Event): void {
    event.preventDefault();
  }

  /**
   * Handle image loading errors with automatic retry
   * @param event - The error event from the img element
   * @param originalUrl - The original image URL
   */
  handleImageError(event: Event, originalUrl: string | undefined): void {
    if (!originalUrl) return;

    const imgElement = event.target as HTMLImageElement;
    const currentRetries = this.imageRetryCount.get(originalUrl) || 0;

    // If we haven't exceeded max retries, try again
    if (currentRetries < this.maxRetries) {
      this.imageRetryCount.set(originalUrl, currentRetries + 1);

      console.log(`Image failed to load (attempt ${currentRetries + 1}/${this.maxRetries}): ${originalUrl}`);

      // Retry after delay with cache busting
      setTimeout(() => {
        const photoUrl = this.getPhotoUrl(originalUrl);
        // Add timestamp to bust cache and force reload
        const cacheBuster = `${photoUrl}${photoUrl.includes('?') ? '&' : '?'}_retry=${Date.now()}`;
        imgElement.src = cacheBuster;
      }, this.retryDelay * currentRetries); // Exponential backoff: 1s, 2s, 3s
    } else {
      // Max retries exceeded, use fallback
      console.warn(`Image failed to load after ${this.maxRetries} attempts: ${originalUrl}`);
      imgElement.src = 'https://via.placeholder.com/400x500?text=Image+Not+Available';

      // Clear retry count for this URL
      this.imageRetryCount.delete(originalUrl);
    }
  }
}
