import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Profile as ProfileService, PotentialMatch } from '../../services/profile';
import { TranslateModule } from '@ngx-translate/core';

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

  constructor(private profileService: ProfileService) {}

  ngOnInit(): void {
    this.loadProfiles();
  }

  loadProfiles(): void {
    this.isLoading.set(true);
    this.profileService.getPotentialMatches(10).subscribe({
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
    this.profileService.getPotentialMatches(10).subscribe({
      next: (newProfiles) => {
        const current = this.profiles();
        this.profiles.set([...current, ...newProfiles]);
      },
      error: (error) => {
        console.error('Error loading more profiles:', error);
      }
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
}
