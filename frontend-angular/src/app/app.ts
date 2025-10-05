import { Component, OnInit, effect, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from './services/auth';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule, TranslateModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  availableLanguages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'es', name: 'Español', flag: '🇪🇸' }
  ];

  currentLanguage = 'en';

  constructor(
    public authService: Auth,
    private router: Router,
    public translate: TranslateService
  ) {
    // Configure available languages
    translate.addLangs(['en', 'fr', 'pt', 'es']);
    translate.setDefaultLang('en');

    // Initialize language from localStorage (will be overridden by user preference if authenticated)
    const savedLang = localStorage.getItem('language');
    if (savedLang && ['en', 'fr', 'pt', 'es'].includes(savedLang)) {
      translate.use(savedLang);
      this.currentLanguage = savedLang;
    } else {
      const browserLang = translate.getBrowserLang();
      const lang = browserLang && ['en', 'fr', 'pt', 'es'].includes(browserLang) ? browserLang : 'en';
      translate.use(lang);
      localStorage.setItem('language', lang);
      this.currentLanguage = lang;
    }

    // React to user changes - when user is loaded, apply their preferred language
    effect(() => {
      const user = this.authService.currentUser();
      if (user?.preferred_language) {
        translate.use(user.preferred_language);
        localStorage.setItem('language', user.preferred_language);
        this.currentLanguage = user.preferred_language;
      }
    });
  }

  ngOnInit(): void {
    // Component initialized
  }

  changeLanguage(lang: string): void {
    this.translate.use(lang);
    localStorage.setItem('language', lang);
    this.currentLanguage = lang;

    // Save to backend if user is logged in
    if (this.authService.isAuthenticated()) {
      this.authService.updateLanguage(lang).subscribe({
        error: (error) => console.error('Failed to update language preference:', error)
      });
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
