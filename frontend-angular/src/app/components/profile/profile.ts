import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Profile as ProfileService, ProfileData } from '../../services/profile';
import { InterestService, InterestCategory } from '../../services/interest';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  imports: [FormsModule, TranslateModule, CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class Profile implements OnInit {
  firstName = signal('');
  birthDate = signal('');
  gender = signal<'male' | 'female' | 'other'>('male');
  lookingFor = signal<'male' | 'female' | 'other' | 'all'>('female');
  bio = signal('');
  location = signal('');
  profilePhoto = signal('');

  // Interest selection
  interestCategories = signal<InterestCategory[]>([]);
  selectedInterestIds = signal<number[]>([]);

  errorMessage = signal('');
  successMessage = signal('');
  isLoading = signal(false);
  isNewProfile = signal(true);

  constructor(
    private profileService: ProfileService,
    private interestService: InterestService,
    private router: Router,
    private translate: TranslateService
  ) {}

  private get currentLanguage(): string {
    return this.translate.currentLang || 'en';
  }

  ngOnInit(): void {
    this.loadInterests();
    this.loadProfile();

    // Reload interests when language changes
    this.translate.onLangChange.subscribe(() => {
      this.loadInterests();
      if (!this.isNewProfile()) {
        this.loadMyInterests();
      }
    });
  }

  loadInterests(): void {
    this.interestService.getAllInterests(this.currentLanguage).subscribe({
      next: (categories) => {
        this.interestCategories.set(categories);
      },
      error: (error) => {
        console.error('Error loading interests:', error);
      }
    });
  }

  loadProfile(): void {
    this.profileService.getMyProfile().subscribe({
      next: (profile) => {
        this.isNewProfile.set(false);
        this.firstName.set(profile.first_name);
        this.birthDate.set(profile.birth_date);
        this.gender.set(profile.gender);
        this.lookingFor.set(profile.looking_for);
        this.bio.set(profile.bio || '');
        this.location.set(profile.location || '');
        this.profilePhoto.set(profile.profile_photo || '');

        // Load selected interests
        this.loadMyInterests();
      },
      error: () => {
        // Profile doesn't exist yet, that's okay
        this.isNewProfile.set(true);
      }
    });
  }

  loadMyInterests(): void {
    this.interestService.getMyInterests(this.currentLanguage).subscribe({
      next: (interests) => {
        const ids = interests.map(i => i.interest_id);
        this.selectedInterestIds.set(ids);
      },
      error: (error) => {
        console.error('Error loading my interests:', error);
      }
    });
  }

  toggleInterest(interestId: number): void {
    const current = this.selectedInterestIds();
    const index = current.indexOf(interestId);

    if (index > -1) {
      // Remove interest
      this.selectedInterestIds.set(current.filter(id => id !== interestId));
    } else {
      // Add interest
      this.selectedInterestIds.set([...current, interestId]);
    }
  }

  isInterestSelected(interestId: number): boolean {
    return this.selectedInterestIds().includes(interestId);
  }

  onSubmit(): void {
    if (!this.firstName() || !this.birthDate() || !this.gender() || !this.lookingFor()) {
      this.errorMessage.set('Please fill in all required fields');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const profileData: ProfileData = {
      first_name: this.firstName(),
      birth_date: this.birthDate(),
      gender: this.gender(),
      looking_for: this.lookingFor(),
      bio: this.bio(),
      location: this.location(),
      interests: '', // Keep empty for compatibility
      profile_photo: this.profilePhoto()
    };

    this.profileService.createOrUpdateProfile(profileData).subscribe({
      next: () => {
        // Save interests separately
        this.interestService.setMyInterests(this.selectedInterestIds()).subscribe({
          next: () => {
            this.successMessage.set('Profile saved successfully!');
            this.isLoading.set(false);
            setTimeout(() => {
              this.router.navigate(['/discover']);
            }, 1500);
          },
          error: (error) => {
            this.errorMessage.set(error.error?.error || 'Failed to save interests');
            this.isLoading.set(false);
          }
        });
      },
      error: (error) => {
        this.errorMessage.set(error.error?.error || 'Failed to save profile');
        this.isLoading.set(false);
      }
    });
  }

  getAge(): number {
    if (!this.birthDate()) return 0;
    const today = new Date();
    const birth = new Date(this.birthDate());
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }
}
