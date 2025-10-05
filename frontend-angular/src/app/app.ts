import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth } from './services/auth';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, TranslateModule],
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

  constructor(
    public authService: Auth,
    private router: Router,
    public translate: TranslateService
  ) {
    // Configure available languages
    translate.addLangs(['en', 'fr', 'pt', 'es']);
    translate.setDefaultLang('en');

    // Initialize language immediately in constructor
    const savedLang = localStorage.getItem('language');
    if (savedLang && ['en', 'fr', 'pt', 'es'].includes(savedLang)) {
      translate.use(savedLang);
    } else {
      const browserLang = translate.getBrowserLang();
      const lang = browserLang && ['en', 'fr', 'pt', 'es'].includes(browserLang) ? browserLang : 'en';
      translate.use(lang);
      localStorage.setItem('language', lang);
    }
  }

  ngOnInit(): void {
    // Component initialized
  }

  changeLanguage(lang: string): void {
    this.translate.use(lang);
    localStorage.setItem('language', lang);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
