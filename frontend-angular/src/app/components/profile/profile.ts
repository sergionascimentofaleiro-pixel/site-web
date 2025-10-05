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
  isNewProfile = signal(true);

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
    if (!this.firstName() || !this.birthDate() || !this.gender() || !this.lookingFor()) {
      this.errorMessage.set('Please fill in all required fields');
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
}
