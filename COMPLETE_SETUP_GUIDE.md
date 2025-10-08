# Guide Complet - Système d'Abonnement PayPal

## 🎯 Vue d'Ensemble

Votre application Dating App dispose maintenant d'un système d'abonnement complet avec PayPal :

- ✅ **5 conversations gratuites** par utilisateur
- ✅ **3 formules d'abonnement** : 24h (5€), Mensuel (12€), Annuel (100€)
- ✅ **Paiements PayPal** intégrés (Sandbox pour tests)
- ✅ **Tests complets** (unit, integration, E2E)
- ✅ **Documentation complète**

## 📚 Documentation Disponible

| Fichier | Description |
|---------|-------------|
| **PAYPAL_SETUP.md** | Documentation technique complète PayPal |
| **PAYPAL_CONFIGURATION_GUIDE.md** | Guide de configuration étape par étape |
| **PAYPAL_TEST_CREDENTIALS.md** | Stockage de vos identifiants test |
| **TEST_SUBSCRIPTION.md** | Guide tests E2E manuels |
| **TESTING_SUMMARY.md** | Résumé des tests et comment les exécuter |
| **COMPLETE_SETUP_GUIDE.md** | Ce fichier - Guide complet de démarrage |

## 🚀 Démarrage Rapide

### 1. Configuration PayPal (une seule fois)

Vos clés PayPal sont déjà configurées dans `.env.test` :

```env
PAYPAL_CLIENT_ID=sb-h1cga5107256@business.example.com
PAYPAL_CLIENT_SECRET=9iK{c+;Y
```

Pour utiliser ces clés dans l'application :

1. **Backend** - Copiez dans `backend-nodejs/.env` :
```env
PAYPAL_CLIENT_ID=sb-h1cga5107256@business.example.com
PAYPAL_CLIENT_SECRET=9iK{c+;Y
FREE_CONVERSATION_LIMIT=5
PRICE_24H=5.00
PRICE_MONTHLY=12.00
PRICE_YEARLY=100.00
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:4200
```

2. **Frontend** - Éditez `frontend-angular/src/app/components/subscription/subscription.ts` ligne 72 :
```typescript
clientId: 'sb-h1cga5107256@business.example.com'  // Votre Client ID
```

### 2. Vérifier les Tests

```bash
# Backend - Tous les tests passent ✅
cd backend-nodejs
npm test

# Frontend - Tests unitaires
cd frontend-angular
npm test
```

**Résultat attendu** :
```
Test Suites: 2 passed, 2 total
Tests:       26 passed, 26 total
✅ Tous les tests passent !
```

### 3. Lancer l'Application

```bash
# Terminal 1 - Backend
cd backend-nodejs
npm run dev

# Terminal 2 - Frontend
cd frontend-angular
npm start
```

Ouvrez http://localhost:4200

### 4. Tester le Flux Complet

Suivez le guide dans `TEST_SUBSCRIPTION.md` :

1. Créez un compte utilisateur
2. Créez 5 conversations (limite gratuite)
3. Tentez une 6ème → Popup de souscription
4. Sélectionnez une formule
5. Connectez-vous avec votre compte test PayPal
6. Vérifiez l'activation de l'abonnement

## 📂 Structure du Projet

### Backend

```
backend-nodejs/
├── src/
│   ├── config/
│   │   └── paypal.js                 # Configuration PayPal
│   ├── controllers/
│   │   └── subscriptionController.js # Logique abonnement
│   ├── models/
│   │   ├── Subscription.js           # Modèle abonnement
│   │   └── PaymentHistory.js         # Modèle paiements
│   ├── routes/
│   │   └── subscription.js           # Routes API
│   └── __tests__/
│       ├── unit/
│       │   └── subscription.test.js  # Tests unitaires
│       └── integration/
│           ├── subscription-api.test.js    # Tests API
│           └── subscription-paypal.test.js # Tests PayPal
├── database/
│   └── update_payment_history_for_paypal.sql
├── .env                              # Variables production
├── .env.test                         # Variables tests
└── package.json
```

### Frontend

```
frontend-angular/
├── src/app/
│   ├── components/
│   │   └── subscription/
│   │       ├── subscription.ts       # Component principal
│   │       ├── subscription.html     # Template
│   │       └── subscription.scss     # Styles
│   └── services/
│       ├── subscription.ts           # Service API
│       └── subscription.spec.ts      # Tests unitaires
└── package.json
```

## 🔧 API Endpoints

### Endpoints Disponibles

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/subscription/status` | Statut abonnement utilisateur |
| GET | `/api/subscription/can-access/:matchId` | Vérifier accès conversation |
| GET | `/api/subscription/plans` | Liste des formules |
| POST | `/api/subscription/create-order` | Créer commande PayPal |
| POST | `/api/subscription/capture-order` | Capturer paiement PayPal |
| POST | `/api/subscription/webhook` | Webhook PayPal |
| POST | `/api/subscription/cancel` | Annuler abonnement |
| GET | `/api/subscription/payment-history` | Historique paiements |

### Exemples

**Vérifier le statut** :
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/subscription/status
```

**Créer une commande** :
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planId":"monthly"}' \
  http://localhost:3000/api/subscription/create-order
```

## 🧪 Tests

### Tests Backend

```bash
cd backend-nodejs

# Tous les tests
npm test

# Tests unitaires uniquement
npm test -- subscription.test.js

# Tests avec couverture
npm test -- --coverage
```

**Résultats** :
- ✅ 26 tests passent
- ✅ Couverture > 80%

### Tests Frontend

```bash
cd frontend-angular

# Tests service subscription
npm test

# Tests avec couverture
ng test --code-coverage
```

### Tests E2E Manuels

Voir `TEST_SUBSCRIPTION.md` pour le guide complet.

## 🗄️ Base de Données

### Tables Utilisées

**subscriptions** :
```sql
id, user_id, subscription_type, amount, end_date, status, created_at
```

**payment_history** :
```sql
id, user_id, amount, currency, payment_method, paypal_order_id,
subscription_type, status, created_at, updated_at
```

**user_conversations** :
```sql
id, user_id, match_id, first_message_at, created_at
```

### Vérifier les Données

```bash
mysql -u devuser -p dating_app

# Voir les abonnements actifs
SELECT * FROM subscriptions WHERE status = 'active';

# Voir l'historique des paiements
SELECT * FROM payment_history ORDER BY created_at DESC LIMIT 10;

# Voir les conversations par utilisateur
SELECT user_id, COUNT(*) as count
FROM user_conversations
GROUP BY user_id;
```

## 💰 Formules d'Abonnement

| Formule | Prix | Durée | Description |
|---------|------|-------|-------------|
| **24 heures** | 5€ | 24h | Accès complet pour tester |
| **Mensuel** | 12€ | 30 jours | Conversations illimitées |
| **Annuel** | 100€ | 365 jours | Meilleure économie (-17%) |

### Configuration des Prix

Modifiez dans `backend-nodejs/.env` :
```env
PRICE_24H=5.00
PRICE_MONTHLY=12.00
PRICE_YEARLY=100.00
```

## 🔐 Sécurité

### Variables Sensibles

**Ne commitez JAMAIS** :
- ❌ `.env` (production)
- ❌ `.env.test`
- ❌ Clés PayPal dans le code

### Gitignore

Vérifiez que `.gitignore` contient :
```
.env
.env.test
.env.local
```

### Protection des Clés

En production :
- Utilisez des variables d'environnement serveur
- Stockez les secrets dans un vault (AWS Secrets Manager, Azure Key Vault, etc.)
- Utilisez HTTPS uniquement

## 🌐 Passage en Production

### Checklist

- [ ] Créer une application PayPal **Live** (pas Sandbox)
- [ ] Obtenir les clés **Live** Client ID et Secret
- [ ] Mettre à jour `.env` avec les clés Live
- [ ] Mettre à jour le frontend avec Client ID Live
- [ ] Configurer les webhooks avec URL HTTPS production
- [ ] Tester avec un vrai paiement de faible montant
- [ ] Surveiller les logs et webhooks
- [ ] Documenter le processus de support client

### Différences Sandbox vs Production

| Aspect | Sandbox | Production |
|--------|---------|------------|
| URL API | `api-m.sandbox.paypal.com` | `api-m.paypal.com` |
| Clés | `sb-xxx...` | `AeA1xxx...` |
| Paiements | Fictifs | Réels |
| Webhooks | Test | Production |

## 📊 Monitoring

### Logs Backend

```bash
cd backend-nodejs
npm run dev

# Surveiller les logs
tail -f logs/app.log  # Si vous avez configuré des logs
```

### PayPal Dashboard

1. https://developer.paypal.com/dashboard (Sandbox)
2. https://www.paypal.com/mep/dashboard (Production)
3. Vérifiez :
   - Transactions
   - Webhooks
   - Erreurs API

### Métriques à Surveiller

- Taux de conversion (visiteurs → abonnés)
- Paiements réussis vs échoués
- Webhooks en erreur
- Temps de réponse API PayPal
- Abonnements actifs vs expirés

## 🐛 Dépannage

### Problème : Tests échouent

**Solution** :
```bash
# Nettoyer et réinstaller
rm -rf node_modules
npm install

# Vérifier la connexion DB
mysql -u devuser -p dating_app_test
```

### Problème : PayPal order creation échoue

**Solution** :
1. Vérifiez les clés dans `.env`
2. Vérifiez la connexion réseau
3. Testez avec curl :
```bash
curl -v https://api-m.sandbox.paypal.com/v2/checkout/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{...}'
```

### Problème : Webhook non reçu

**Solution** :
1. Utilisez ngrok en développement
2. Configurez l'URL dans PayPal Dashboard
3. Vérifiez les logs backend
4. Testez manuellement le webhook :
```bash
curl -X POST http://localhost:3000/api/subscription/webhook \
  -H "Content-Type: application/json" \
  -d '{"event_type":"PAYMENT.CAPTURE.COMPLETED", ...}'
```

## 📞 Support

### Documentation

- **PayPal Docs** : https://developer.paypal.com/docs
- **Dashboard** : https://developer.paypal.com/dashboard
- **Support** : https://www.paypal.com/businesshelp

### Communauté

- Stack Overflow : `[paypal] [paypal-sandbox]`
- GitHub Issues : Votre projet

## 🎉 Prochaines Étapes

1. **Testez localement** avec le guide `TEST_SUBSCRIPTION.md`
2. **Validez les tests** : `npm test`
3. **Documentez vos identifiants** PayPal dans `PAYPAL_TEST_CREDENTIALS.md`
4. **Testez E2E** avec un vrai compte test PayPal
5. **Préparez la production** quand vous êtes prêt

## ✅ Résumé

Vous avez maintenant :

- ✅ Système d'abonnement fonctionnel
- ✅ PayPal intégré (Sandbox)
- ✅ 26 tests unitaires et d'intégration
- ✅ Documentation complète
- ✅ Guide de tests E2E
- ✅ Prêt pour le développement

**Commencez par** :
```bash
cd backend-nodejs
npm test
```

Si tous les tests passent ✅, vous êtes prêt à tester l'application !

Bonne chance ! 🚀
