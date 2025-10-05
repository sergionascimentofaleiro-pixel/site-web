import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

export interface User {
  id: number;
  email: string;
  preferred_language?: string;
  created_at: string;
  last_login: string | null;
  is_active: boolean;
}

export interface AuthResponse {
  message: string;
  userId: number;
  token: string;
  preferredLanguage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private readonly apiUrl = 'http://localhost:3000/api';
  private readonly tokenKey = 'auth_token';

  public currentUser = signal<User | null>(null);
  public isAuthenticated = signal<boolean>(false);
  private translate = inject(TranslateService);

  constructor(private http: HttpClient) {
    this.checkAuthStatus();
  }

  private checkAuthStatus(): void {
    const token = this.getToken();
    if (token) {
      this.getCurrentUser().subscribe({
        next: (user) => {
          this.currentUser.set(user);
          this.isAuthenticated.set(true);

          // Apply user's preferred language
          if (user.preferred_language) {
            this.translate.use(user.preferred_language);
            localStorage.setItem('language', user.preferred_language);
          }
        },
        error: () => {
          this.logout();
        }
      });
    }
  }

  register(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, { email, password })
      .pipe(
        tap(response => {
          this.setToken(response.token);
          this.isAuthenticated.set(true);
        })
      );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(response => {
          this.setToken(response.token);
          this.isAuthenticated.set(true);
          // Load user data to trigger the effect in app.ts
          this.getCurrentUser().subscribe();
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/auth/me`)
      .pipe(
        tap(user => this.currentUser.set(user))
      );
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  updateLanguage(language: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/auth/language`, { language });
  }
}
