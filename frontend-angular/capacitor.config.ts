import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.curvy.app',
  appName: 'Curvy',
  webDir: 'dist/frontend-angular/browser',
  server: {
    // URL du backend API pour les tests en développement
    // Pour production, utiliser l'URL Fly.io
    // url: 'http://localhost:3000',
    // cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#FF69B4',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false
    }
  }
};

export default config;
