import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Profile as ProfileService, ProfileData } from '../../services/profile';

@Component({
  selector: 'app-profile',
  imports: [FormsModule],
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
  interests = signal('');
  profilePhoto = signal('');

  errorMessage = signal('');
  successMessage = signal('');
  isLoading = signal(false);
  isNewProfile = signal(true);

  constructor(
    private profileService: ProfileService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProfile();
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
        this.interests.set(profile.interests || '');
        this.profilePhoto.set(profile.profile_photo || '');
      },
      error: () => {
        // Profile doesn't exist yet, that's okay
        this.isNewProfile.set(true);
      }
    });
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
      interests: this.interests(),
      profile_photo: this.profilePhoto()
    };

    this.profileService.createOrUpdateProfile(profileData).subscribe({
      next: () => {
        this.successMessage.set('Profile saved successfully!');
        this.isLoading.set(false);
        setTimeout(() => {
          this.router.navigate(['/discover']);
        }, 1500);
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
