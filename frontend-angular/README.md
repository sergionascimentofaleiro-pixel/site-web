# Frontend Angular - Dating App

Application Angular 20 avec architecture standalone components et reactive programming avec Signals.

## 🚀 Démarrage

```bash
npm install
npm start          # Démarre le serveur de développement sur http://localhost:4200
```

## 📦 Commandes disponibles

```bash
npm start          # Serveur dev (ng serve)
npm run build      # Build production (dist/)
npm run watch      # Build + watch mode
npm test           # Tests Karma
ng generate component nom    # Générer un composant
ng generate --help           # Liste des schematics
```

## 🏗️ Architecture

### Structure des composants

```
src/app/
├── components/
│   ├── login/           # Authentification
│   ├── register/        # Inscription
│   ├── profile/         # Profil utilisateur
│   ├── discover/        # Swipe (Tinder-like)
│   ├── matches/         # Liste des matchs
│   ├── chat/            # Messagerie
│   ├── subscription/    # Abonnements PayPal
│   └── language-selector/  # Sélecteur de langue
├── services/
│   ├── auth.ts          # Authentification
│   ├── profile.ts       # Gestion profils
│   ├── match.ts         # Matchs
│   ├── message.ts       # Messagerie
│   ├── interest.ts      # Intérêts
│   ├── location.ts      # Localisation
│   └── subscription.ts  # Abonnements
├── interceptors/
│   └── auth.interceptor.ts  # Injection JWT automatique
├── guards/
│   ├── auth.guard.ts    # Protection routes authentifiées
│   └── profile.guard.ts # Redirection si profil incomplet
├── app.routes.ts        # Configuration routing
└── app.config.ts        # Configuration application
```

### Technologies utilisées

- **Angular 20** - Framework
- **Standalone Components** - Architecture moderne sans NgModules
- **Signals** - Gestion d'état réactive
- **RxJS** - Programmation réactive
- **SCSS** - Styling
- **ngx-translate** - Internationalisation (fr, en, es, pt)
- **Socket.io-client** - WebSocket pour chat temps réel

## 🌐 Internationalisation

4 langues supportées:
- **Français (fr)** - Langue par défaut
- **Anglais (en)**
- **Espagnol (es)**
- **Portugais (pt)**

Fichiers de traduction dans `public/assets/i18n/`:
- `fr.json`
- `en.json`
- `es.json`
- `pt.json`

Le sélecteur de langue est disponible dans la barre de navigation.

## 🔒 Authentification

- **JWT tokens** stockés en localStorage
- **HTTP Interceptor** injecte automatiquement le token dans les requêtes
- **Auth Guard** protège les routes nécessitant une connexion
- **Profile Guard** redirige vers création de profil si incomplet

## 🎨 Styling

- **SCSS** configuré globalement
- **Variables CSS** dans `src/styles.scss`
- **Composants stylés** avec `.scss` par composant
- **Design responsive**

## 🔌 Services API

Tous les services communiquent avec le backend via HTTP:

### AuthService
```typescript
login(email, password)
register(email, password)
getCurrentUser()
updateLanguagePreference(language)
logout()
```

### ProfileService
```typescript
getMyProfile()
createOrUpdateProfile(data)
getPotentialMatches(limit, language)
swipe(targetUserId, action)  // 'like' ou 'pass'
```

### MatchService
```typescript
getMatches()
unmatch(matchId)
```

### MessageService
```typescript
getConversations()
getMessages(matchId)
sendMessage(matchId, receiverId, message)
getUnreadCount()
```

### InterestService
```typescript
getAllInterests(language)
getUserInterests()
setUserInterests(interestIds)
```

### LocationService
```typescript
getCountries(language)
getStates(countryId)
getCities(countryId)
searchCities(countryId, query, limit)
```

## 📱 Pages principales

### Login & Register
Authentification JWT avec validation de formulaires.

### Profile
- Création/édition profil
- Upload photo (URL ou local)
- Sélection intérêts (100 disponibles)
- Localisation (pays, état, ville avec autocomplete)
- Informations personnelles (nom, date naissance, genre, préférences)

### Discover
- Interface de swipe type Tinder
- Affichage profils recommandés
- Like / Pass avec animations
- Popup de match instantané
- Rechargement automatique des profils

### Matches
- Liste des matchs mutuels
- Accès rapide au chat
- Option unmatch

### Chat
- Messagerie en temps réel (WebSocket)
- Historique des conversations
- Compteur messages non lus
- Indicateur de saisie

### Subscription
- Sélection abonnement (24h, mensuel, annuel)
- Paiement PayPal intégré
- Gestion abonnements actifs
- Annulation d'abonnement

## 🛡️ Guards

### AuthGuard
Protège les routes nécessitant une authentification.

### ProfileGuard
Redirige vers `/profile` si l'utilisateur n'a pas complété son profil.

## ⚙️ Configuration

### proxy.conf.json
Proxy pour rediriger les appels API vers le backend:
```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false
  }
}
```

### app.config.ts
Configuration globale:
- Providers (router, HTTP client, i18n)
- Zone detection
- Error listeners

## 🧪 Tests

```bash
npm test           # Lance Karma
```

Tests configurés avec Jasmine et Karma (Chrome headless).

## 🏭 Build Production

```bash
npm run build      # Génère dans dist/
```

Optimisations incluses:
- Tree-shaking
- Minification
- AOT compilation
- Lazy loading des routes

## 📝 Code Style

**Prettier** configuré avec:
- Print width: 100 caractères
- Single quotes
- Trailing commas: all

## 🤖 Angular CLI

Génération de code:
```bash
ng generate component nom
ng generate service nom
ng generate guard nom
ng generate interceptor nom
ng generate --help
```

## 📚 Ressources

- [Angular Documentation](https://angular.dev)
- [Angular CLI](https://angular.dev/tools/cli)
- [RxJS](https://rxjs.dev)
- [ngx-translate](https://github.com/ngx-translate/core)
