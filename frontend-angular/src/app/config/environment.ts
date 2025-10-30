/**
 * Environment configuration for Curvy Dating App
 *
 * Automatically detects local vs production environment
 */

const isLocalhost = window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1';

export const environment = {
  production: !isLocalhost,

  // API URLs
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
