import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../services/auth';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink, TranslateModule],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {
  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  errorMessage = signal('');
  isLoading = signal(false);

  constructor(
    private authService: Auth,
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.email() || !this.password() || !this.confirmPassword()) {
      this.errorMessage.set('Please fill in all fields');
      return;
    }

    if (this.password() !== this.confirmPassword()) {
      this.errorMessage.set('Passwords do not match');
      return;
    }

    if (this.password().length < 6) {
      this.errorMessage.set('Password must be at least 6 characters');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.register(this.email(), this.password()).subscribe({
      next: () => {
        this.router.navigate(['/profile']);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.error || 'Registration failed');
        this.isLoading.set(false);
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }
}
