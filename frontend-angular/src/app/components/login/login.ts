import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../services/auth';
import { Profile as ProfileService } from '../../services/profile';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, TranslateModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  email = signal('');
  password = signal('');
  errorMessage = signal('');
  isLoading = signal(false);

  constructor(
    private authService: Auth,
    private profileService: ProfileService,
    private router: Router,
    private translate: TranslateService
  ) {}

  onSubmit(): void {
    if (!this.email() || !this.password()) {
      this.errorMessage.set('Please fill in all fields');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.email(), this.password()).subscribe({
      next: (response) => {
        // Set language preference from backend
        if (response.preferredLanguage) {
          this.translate.use(response.preferredLanguage);
          localStorage.setItem('language', response.preferredLanguage);
        }

        // Check if user has a complete profile
        this.profileService.getMyProfile().subscribe({
          next: (profile) => {
            // Profile exists, go to discover
            this.router.navigate(['/discover']);
            this.isLoading.set(false);
          },
          error: () => {
            // Profile doesn't exist, go to profile page
            this.router.navigate(['/profile']);
            this.isLoading.set(false);
          }
        });
      },
      error: (error) => {
        this.errorMessage.set(error.error?.error || 'Login failed');
        this.isLoading.set(false);
      }
    });
  }
}
