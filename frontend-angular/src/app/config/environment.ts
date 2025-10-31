/**
 * Environment configuration for Curvy Dating App
 *
 * Automatically detects local vs production environment
 * Supports web browser and native mobile (Android/iOS via Capacitor)
 */

// Détecte si on est sur une plateforme native (Android/iOS) via Capacitor
const isNativePlatform = () => {
  // Check if Capacitor is available (most reliable method)
  if (typeof (window as any).Capacitor !== 'undefined') {
    return (window as any).Capacitor.isNativePlatform();
  }

  // Fallback: check protocol
  if (window.location.protocol === 'capacitor:' || window.location.protocol === 'ionic:') {
    return true;
  }

  // Fallback: check for Capacitor classes
  if (document.body?.classList?.contains('plt-capacitor') ||
      document.body?.classList?.contains('plt-cordova')) {
    return true;
  }

  return false;
};

// Détecte si on est en développement local (navigateur web uniquement, pas les apps mobiles)
const isLocalhost = !isNativePlatform() && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === '10.0.2.2'  // Émulateur Android (mais ne devrait jamais arriver car isNativePlatform est true)
);

// Debug logging
console.log('[Environment] Platform detection:');
console.log('[Environment] - window.location.protocol:', window.location.protocol);
console.log('[Environment] - window.location.hostname:', window.location.hostname);
console.log('[Environment] - isNativePlatform:', isNativePlatform());
console.log('[Environment] - isLocalhost:', isLocalhost);
console.log('[Environment] - Capacitor available:', typeof (window as any).Capacitor !== 'undefined');

export const environment = {
  production: !isLocalhost,

  // API URLs
  // Sur mobile natif: toujours utiliser Fly.io (HTTPS)
  // Sur navigateur local: utiliser backend local
  // Sur navigateur déployé: utiliser Fly.io (HTTPS)
  apiUrl: isLocalhost
    ? 'http://localhost:3000/api'
    : 'https://curvy-backend.fly.dev/api',

  // WebSocket URL (for Socket.io)
  socketUrl: isLocalhost
    ? 'http://localhost:3000'
    : 'https://curvy-backend.fly.dev',

  // App name
  appName: 'Curvy'
};
