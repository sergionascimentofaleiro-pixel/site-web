import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Profile as ProfileService, ProfileData } from '../../services/profile';
import { InterestService, InterestCategory } from '../../services/interest';
import { LocationService, Country, State, City } from '../../services/location';
import { Auth } from '../../services/auth';
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
  lastName = signal('');
  email = signal('');
  phone = signal('');
  birthDate = signal('');
  gender = signal<'male' | 'female' | 'other'>('male');
  lookingFor = signal<'male' | 'female' | 'other' | 'all'>('female');
  bio = signal('');
  location = signal('');
  profilePhoto = signal('');

  // Interest selection
  interestCategories = signal<InterestCategory[]>([]);
  selectedInterestIds = signal<number[]>([]);

  // Location selection
  countries = signal<Country[]>([]);
  states = signal<State[]>([]);
  cities = signal<City[]>([]);
  selectedCountryId = signal<number | null>(null);
  selectedStateId = signal<number | null>(null);
  selectedCityId = signal<number | null>(null);
  countryHasStates = signal(false);
  citySearchTerm = signal('');
  selectedCityName = signal('');

  errorMessage = signal('');
  successMessage = signal('');
  isLoading = signal(false);

  // Photo upload
  showPhotoOptions = signal(false);
  photoMode = signal<'upload' | 'url'>('upload');
  selectedFile = signal<File | null>(null);
  photoUrlInput = signal('');
  isUploading = signal(false);
  uploadError = signal('');
  isNewProfile = signal(true);

  // Form validation
  formSubmitted = signal(false);

  isFieldInvalid(value: any): boolean {
    return this.formSubmitted() && !value;
  }

  constructor(
    private profileService: ProfileService,
    private interestService: InterestService,
    private locationService: LocationService,
    private authService: Auth,
    private router: Router,
    private translate: TranslateService
  ) {}

  private get currentLanguage(): string {
    return localStorage.getItem('language') || this.translate.currentLang || 'fr';
  }

  ngOnInit(): void {
    this.loadCountries();
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
        this.lastName.set(profile.last_name || '');
        this.email.set(profile.email || '');
        this.phone.set(profile.phone || '');
        this.birthDate.set(profile.birth_date);
        this.gender.set(profile.gender);
        this.lookingFor.set(profile.looking_for);
        this.bio.set(profile.bio || '');
        this.location.set(profile.location || '');
        this.profilePhoto.set(profile.profile_photo || '');

        // Load location data
        if (profile.country_id) {
          this.selectedCountryId.set(profile.country_id);
          this.onCountryChange(profile.country_id);

          if (profile.state_id) {
            setTimeout(() => {
              this.selectedStateId.set(profile.state_id!);
              this.onStateChange(profile.state_id!);

              if (profile.city_id) {
                setTimeout(() => {
                  this.loadCityName(profile.city_id!);
                }, 200);
              }
            }, 200);
          } else if (profile.city_id) {
            setTimeout(() => {
              this.loadCityName(profile.city_id!);
            }, 200);
          }
        }

        // Load selected interests
        this.loadMyInterests();
      },
      error: () => {
        // Profile doesn't exist yet, that's okay
        this.isNewProfile.set(true);

        // Load email from current user (for new profiles after registration)
        const currentUser = this.authService.currentUser();
        if (currentUser && currentUser.email) {
          this.email.set(currentUser.email);
        } else {
          // If currentUser is not loaded yet, fetch it
          this.authService.getCurrentUser().subscribe({
            next: (user) => {
              if (user && user.email) {
                this.email.set(user.email);
              }
            },
            error: (err) => {
              console.error('Error loading user email:', err);
            }
          });
        }
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

  loadCountries(): void {
    this.locationService.getAllCountries(this.currentLanguage).subscribe({
      next: (countries) => {
        this.countries.set(countries);
      },
      error: (error) => {
        console.error('Error loading countries:', error);
      }
    });
  }

  onCountryChange(countryId: number): void {
    this.selectedCountryId.set(countryId);
    this.selectedStateId.set(null);
    this.selectedCityId.set(null);
    this.citySearchTerm.set('');
    this.selectedCityName.set('');
    this.states.set([]);
    this.cities.set([]);

    const country = this.countries().find(c => c.id === countryId);
    this.countryHasStates.set(country?.has_states || false);

    if (country?.has_states) {
      // Load states for this country
      this.locationService.getStatesByCountry(countryId).subscribe({
        next: (states) => {
          this.states.set(states);
        },
        error: (error) => {
          console.error('Error loading states:', error);
        }
      });
    }
  }

  onStateChange(stateId: number): void {
    this.selectedStateId.set(stateId);
    this.selectedCityId.set(null);
    this.citySearchTerm.set('');
    this.selectedCityName.set('');
    this.cities.set([]);
  }

  onCitySearchChange(searchTerm: string): void {
    this.citySearchTerm.set(searchTerm);

    if (searchTerm.length < 2) {
      this.cities.set([]);
      return;
    }

    const countryId = this.selectedCountryId();
    const stateId = this.selectedStateId();

    if (!countryId) {
      return;
    }

    this.locationService.searchCities(searchTerm, countryId, stateId || undefined).subscribe({
      next: (cities) => {
        this.cities.set(cities);
      },
      error: (error) => {
        console.error('Error searching cities:', error);
      }
    });
  }

  onCitySelect(city: City): void {
    this.selectedCityId.set(city.id);
    this.selectedCityName.set(city.name);
    this.citySearchTerm.set(city.name);
    this.cities.set([]); // Hide dropdown
  }

  loadCityName(cityId: number): void {
    this.locationService.getCityDetails(cityId).subscribe({
      next: (cityDetails) => {
        this.selectedCityId.set(cityId);
        this.selectedCityName.set(cityDetails.city_name);
        this.citySearchTerm.set(cityDetails.city_name);
      },
      error: (error) => {
        console.error('Error loading city name:', error);
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
    this.formSubmitted.set(true);

    // Check if all fields are valid
    const hasInvalidFields = !this.firstName() || !this.birthDate() || !this.gender() || !this.lookingFor() || !this.phone() || !this.selectedCountryId() || !this.selectedCityId();
    const hasInvalidInterests = this.selectedInterestIds().length < 3;

    if (hasInvalidFields || hasInvalidInterests) {
      if (hasInvalidInterests) {
        this.errorMessage.set(this.translate.instant('profile.requiredFieldsErrorWithInterests'));
      } else {
        this.errorMessage.set(this.translate.instant('profile.requiredFieldsError'));
      }

      // Scroll to first invalid field
      setTimeout(() => {
        let firstInvalid;

        // If only interests are missing, scroll to interests section specifically
        if (!hasInvalidFields && hasInvalidInterests) {
          firstInvalid = document.querySelector('.interests-section.invalid');
        } else {
          // Otherwise scroll to first invalid input/select
          firstInvalid = document.querySelector('input.invalid, select.invalid');
        }

        if (firstInvalid) {
          const elementPosition = firstInvalid.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementPosition - 100; // 100px offset from top

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 100);

      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const profileData: ProfileData = {
      first_name: this.firstName(),
      last_name: this.lastName(),
      phone: this.phone(),
      birth_date: this.birthDate(),
      gender: this.gender(),
      looking_for: this.lookingFor(),
      bio: this.bio(),
      location: this.location(),
      country_id: this.selectedCountryId() || undefined,
      state_id: this.selectedStateId() || undefined,
      city_id: this.selectedCityId() || undefined,
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

  // Photo upload methods
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        this.uploadError.set('Le fichier doit faire moins de 5 MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        this.uploadError.set('Format invalide. Utilisez JPG, PNG ou WebP');
        return;
      }

      this.selectedFile.set(file);
      this.uploadError.set('');
    }
  }

  uploadFile(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.isUploading.set(true);
    this.uploadError.set('');

    this.profileService.uploadPhoto(file).subscribe({
      next: (response) => {
        this.profilePhoto.set(response.photoUrl);
        this.successMessage.set('Photo téléchargée avec succès !');
        this.selectedFile.set(null);
        this.showPhotoOptions.set(false);
        this.isUploading.set(false);
      },
      error: (error) => {
        this.uploadError.set(error.error?.error || 'Erreur lors du téléchargement');
        this.isUploading.set(false);
      }
    });
  }

  openPhotoOptions(): void {
    this.showPhotoOptions.set(true);

    // If current photo is an external URL (not uploaded), prefill the URL input
    const currentPhoto = this.profilePhoto();
    if (currentPhoto && !currentPhoto.startsWith('/uploads/')) {
      this.photoUrlInput.set(currentPhoto);
      this.photoMode.set('url');
    }
  }

  submitPhotoUrl(): void {
    const url = this.photoUrlInput();
    if (!url) {
      this.uploadError.set('Veuillez saisir une URL');
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      this.uploadError.set('URL invalide');
      return;
    }

    this.uploadError.set('');

    this.profileService.updatePhotoUrl(url).subscribe({
      next: (response) => {
        this.profilePhoto.set(response.photoUrl);
        this.successMessage.set('Photo mise à jour avec succès !');
        this.photoUrlInput.set('');
        this.showPhotoOptions.set(false);
      },
      error: (error) => {
        this.uploadError.set(error.error?.error || 'Erreur lors de la mise à jour');
      }
    });
  }

  getPhotoUrl(url: string): string {
    // If it's a relative URL (uploaded file), prepend backend URL
    if (url && url.startsWith('/uploads/')) {
      return `http://localhost:3000${url}`;
    }
    return url;
  }
}
