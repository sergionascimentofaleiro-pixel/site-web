import { Component, OnInit, signal, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Profile as ProfileService, PotentialMatch } from '../../services/profile';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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

  private currentImage: HTMLImageElement | null = null;

  constructor(
    private profileService: ProfileService,
    private translate: TranslateService
  ) {}

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.currentImage) {
      this.updateWatermarkPosition(this.currentImage);
    }
  }

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
    // If it's a relative URL (uploaded file), prepend backend URL
    if (url.startsWith('/uploads/')) {
      return `http://localhost:3000${url}`;
    }
    return url;
  }

  onImageLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    this.currentImage = img;
    this.updateWatermarkPosition(img);
  }

  private updateWatermarkPosition(img: HTMLImageElement): void {
    const watermark = img.nextElementSibling as HTMLElement;

    if (!watermark) return;

    // Get the container and image dimensions
    const container = img.parentElement;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Get the natural dimensions of the image
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    // Calculate the displayed size when using object-fit: contain/cover
    const containerRatio = containerWidth / containerHeight;
    const imageRatio = naturalWidth / naturalHeight;

    let displayedWidth: number;
    let displayedHeight: number;
    let offsetX = 0;
    let offsetY = 0;

    // Check if image uses object-fit: contain (in media queries)
    const objectFit = window.getComputedStyle(img).objectFit;

    if (objectFit === 'contain') {
      // Image is contained, calculate actual displayed size
      if (imageRatio > containerRatio) {
        // Image is wider, limited by width
        displayedWidth = containerWidth;
        displayedHeight = containerWidth / imageRatio;
        offsetY = (containerHeight - displayedHeight) / 2;
      } else {
        // Image is taller, limited by height
        displayedHeight = containerHeight;
        displayedWidth = containerHeight * imageRatio;
        offsetX = (containerWidth - displayedWidth) / 2;
      }
    } else {
      // object-fit: cover - image fills container
      displayedWidth = containerWidth;
      displayedHeight = containerHeight;
    }

    // Position watermark at bottom-right of the actual image
    watermark.style.bottom = `${offsetY}px`;
    watermark.style.right = `${offsetX}px`;
  }
}
