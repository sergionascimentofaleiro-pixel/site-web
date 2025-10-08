# Testing Guide

## Backend Tests (Node.js/Express)

### Commandes disponibles

```bash
cd backend-nodejs

# Exécuter tous les tests une fois (sortie propre)
npm test

# Exécuter les tests en mode watch (re-run automatique)
npm run test:watch

# Exécuter les tests avec coverage
npm run test:coverage

# Exécuter les tests en mode verbose (avec détails de debugging)
npm run test:verbose
```

**Note** : `NODE_ENV=test` empêche le serveur de démarrer automatiquement pendant les tests.

### Structure des tests

- `src/__tests__/integration/` - Tests d'intégration API
- `src/__tests__/controllers/` - Tests des contrôleurs
- `src/__tests__/models/` - Tests des modèles

### Tests inclus

- ✅ PayPal integration (création d'ordres, webhooks)
- ✅ Subscription API (plans, statuts, annulation)
- ✅ Message limits (limites de conversations)
- ✅ Controllers (message, subscription)
- ✅ Models (Subscription)

**Total : 53 tests**

---

## Frontend Tests (Angular 20)

### Commandes disponibles

```bash
cd frontend-angular

# Exécuter les tests avec Chrome UI (une fois, puis ferme)
npm test

# Exécuter les tests en mode watch avec Chrome UI (reste ouvert)
npm run test:watch

# Exécuter les tests en mode headless (sans UI, plus rapide)
npm run test:headless
```

**Note** :
- `npm test` : Lance Chrome, exécute les tests, puis ferme automatiquement
- `npm run test:watch` : Lance Chrome et reste en mode surveillance (Ctrl+C pour quitter)
- `npm run test:headless` : Le plus rapide, sans interface graphique

### Configuration

- **Browser** : ChromeHeadless (Chromium)
- **Framework** : Jasmine + Karma
- **Coverage** : Disponible via Karma

### Structure des tests

- `src/app/app.spec.ts` - Tests du composant principal
- `src/app/components/*/**.spec.ts` - Tests des composants
- `src/app/services/*/**.spec.ts` - Tests des services

### Tests inclus

- ✅ App component (initialisation, router)
- ✅ Chat component (messages, WebSocket, access control)
- ✅ Subscription component (PayPal SDK, plans, statuts)
- ✅ Services (Auth, Subscription, Match, Message)

**Total : 38 tests**

---

## Résumé Global

| Projet | Tests | Status |
|--------|-------|--------|
| Backend | 53 ✅ | Tous passent |
| Frontend | 38 ✅ | Tous passent |
| **TOTAL** | **91** | ✅ **100%** |

---

## CI/CD

### GitHub Actions (exemple)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd backend-nodejs && npm ci
      - run: cd backend-nodejs && npm test

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd frontend-angular && npm ci
      - run: cd frontend-angular && npm run test:headless
```

---

## Troubleshooting

### Backend

**Problème** : Tests timeout
- **Solution** : Vérifier que MariaDB est démarré
- **Solution** : Vérifier le fichier `.env.test`

### Frontend

**Problème** : `No binary for Chrome browser`
- **Solution** : Utiliser `npm run test:headless` qui configure automatiquement ChromeHeadless

**Problème** : Tests lents
- **Solution** : Utiliser `--include` pour exécuter un seul fichier de test
  ```bash
  npm test -- --include='**/subscription.spec.ts' --watch=false
  ```

---

## Notes

- Les tests backend utilisent une base de données de test séparée (`.env.test`)
- Les tests frontend mockent tous les services et APIs
- 1 test est skippé (test complexe de gestion d'erreur PayPal)
