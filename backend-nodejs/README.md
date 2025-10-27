# Backend Node.js - Dating App

API REST Express.js avec MariaDB pour une application de rencontres.

## 🚀 Démarrage

```bash
npm install
npm run dev        # Démarre le serveur sur http://localhost:3000
```

## 📦 Commandes disponibles

```bash
npm run dev        # Serveur dev avec nodemon (auto-reload)
npm start          # Serveur production
```

## 🗄️ Base de données

### Setup complet (recommandé)

```bash
cd database
./full-reset.sh
```

**Ce script crée** (1-2 minutes):
- Base de données `dating_app`
- Tables complètes (users, profiles, matches, messages, interests, locations, subscriptions)
- 400 comptes de test français (200 hommes, 200 femmes) avec photos uniques
- Données géographiques mondiales (252 pays, 305 états, 224k villes avec GPS)
- 100 intérêts en 10 catégories avec traductions (fr, en, es, pt)

### Setup manuel

```bash
cd database
mysql -u root -p
source setup.sql
source schema.sql
source interests-schema.sql
source interests-seed.sql
```

## 🏗️ Architecture

### Structure du projet

```
backend-nodejs/
├── src/
│   ├── config/
│   │   └── database.js      # Configuration MariaDB
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── profileController.js
│   │   ├── matchController.js
│   │   ├── messageController.js
│   │   ├── interestController.js
│   │   ├── locationController.js
│   │   └── subscriptionController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Profile.js
│   │   ├── Like.js
│   │   ├── Match.js
│   │   ├── Message.js
│   │   ├── Interest.js
│   │   ├── Location.js
│   │   └── Subscription.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── profile.js
│   │   ├── match.js
│   │   ├── message.js
│   │   ├── interest.js
│   │   ├── location.js
│   │   └── subscription.js
│   ├── middleware/
│   │   └── authMiddleware.js   # JWT verification
│   ├── scheduler.js            # Tâches planifiées (abonnements)
│   └── server.js               # Point d'entrée
├── database/
│   ├── *.sql                   # Fichiers SQL
│   ├── *.sh                    # Scripts bash
│   └── generate-french-test-data.py  # Génération données test
├── uploads/
│   └── profiles/               # Photos uploadées
└── .env                        # Configuration
```

### Architecture MVC

- **Models** - Logique métier et requêtes DB
- **Controllers** - Handlers de requêtes HTTP
- **Routes** - Définition des endpoints API
- **Middleware** - Authentification JWT

## 🔌 API Endpoints

Toutes les routes sauf `/api/auth/register` et `/api/auth/login` nécessitent un token JWT.

### Authentification (`/api/auth/*`)

```
POST   /register          - Créer un compte
POST   /login             - Se connecter (retourne JWT)
GET    /me                - Utilisateur actuel
PUT    /preferences       - MAJ préférences (langue)
```

### Profils (`/api/profile/*`)

```
POST   /                  - Créer/MAJ profil
GET    /me                - Mon profil
GET    /potential-matches - Profils à swiper (avec score de compatibilité)
POST   /swipe             - Liker/passer un profil
POST   /upload-photo      - Upload photo locale
POST   /photo-url         - Définir photo par URL
```

### Matchs (`/api/matches/*`)

```
GET    /                  - Liste des matchs
DELETE /:id               - Unmatch
```

### Messages (`/api/messages/*`)

```
POST   /                  - Envoyer un message
GET    /:matchId          - Conversation avec un match
GET    /conversations     - Toutes les conversations
GET    /unread-count      - Nombre de messages non lus
```

### Intérêts (`/api/interests/*`)

```
GET    /                  - Tous les intérêts avec traductions
GET    /user              - Intérêts de l'utilisateur
POST   /user              - Définir intérêts utilisateur
```

### Localisation (`/api/locations/*`)

```
GET    /countries         - Liste des pays (avec traductions)
GET    /states/:countryId - États/provinces d'un pays
GET    /cities/:countryId - Villes d'un pays
GET    /cities/search     - Recherche ville (autocomplete)
```

### Abonnements (`/api/subscription/*`)

```
GET    /plans             - Liste des plans (public)
POST   /create-order      - Créer commande PayPal
POST   /capture-order     - Capturer paiement PayPal
GET    /status            - Statut abonnement et conversations
GET    /can-access/:matchId - Vérifier accès conversation
GET    /payment-history   - Historique paiements utilisateur
POST   /cancel            - Annuler abonnement
POST   /webhook           - Webhook PayPal (interne)
```

## 🔐 Authentification

- **JWT** tokens avec secret configurable
- Middleware `authMiddleware.js` vérifie le token
- Token passé dans header: `Authorization: Bearer <token>`

## 💬 WebSocket (Socket.io)

Chat temps réel sur le même port que l'API REST:
- Authentification par token JWT
- Rooms par match_id
- Événements: `message:send`, `message:new`, `typing:start`, `typing:stop`

## 💳 Abonnements PayPal

3 types d'abonnements:
- **24h** - 5,00 €
- **Mensuel** - 12,00 €
- **Annuel** - 100,00 €

Limite conversations gratuites: 5

## 🗺️ Système de matching algorithmique

Score de compatibilité (0-100) basé sur:
- **Genre** (20 points) - Correspond aux préférences
- **Âge** (20 points) - Similarité d'âge (±5 ans = max)
- **Intérêts** (35 points) - Intérêts communs (5 pts par intérêt commun)
- **Distance GPS** (25 points) - Proximité géographique (<20km = 20 pts)

Profils triés par score décroissant.

## 🗄️ Schéma de base de données

### Tables principales

- **users** - Authentification (email, password, langue, is_active)
- **profiles** - Profils (nom, date naissance, genre, looking_for, bio, photo, localisation)
- **likes** - Swipes (from_user, to_user, like_type)
- **matches** - Matchs mutuels (user1, user2, matched_at)
- **messages** - Messagerie (match_id, sender, receiver, message, is_read)

### Tables intérêts

- **interest_categories** - 10 catégories
- **interests** - 100 intérêts prédéfinis
- **interest_translations** - Traductions (fr, en, es, pt)
- **profile_interests** - Association profil-intérêts

### Tables localisation

- **countries** - 252 pays avec traductions
- **states** - 305 états/provinces
- **cities** - 224k villes avec coordonnées GPS (population > 500)

### Tables abonnements

- **subscriptions** - Abonnements actifs/expirés
- **payment_history** - Historique paiements PayPal
- **user_conversations** - Suivi limite conversations gratuites

## ⚙️ Configuration (.env)

```env
# Server
PORT=3000

# Database
DB_HOST=localhost
DB_USER=devuser
DB_PASSWORD=Manuela2011!
DB_NAME=dating_app
DB_PORT=3306

# JWT
JWT_SECRET=your_jwt_secret_change_in_production_2024

# PayPal
PAYPAL_CLIENT_ID=votre_client_id
PAYPAL_CLIENT_SECRET=votre_client_secret

# URLs
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:4200

# Conversations & Pricing
FREE_CONVERSATION_LIMIT=5
PRICE_24H=5.00
PRICE_MONTHLY=12.00
PRICE_YEARLY=100.00

# Scheduler
RUN_SCHEDULER_ON_STARTUP=true

# Photos de test (chemins absolus)
PHOTOS_SOURCE_DIR_WOMEN=/chemin/vers/photos-femmes
PHOTOS_SOURCE_DIR_MEN=/chemin/vers/photos-hommes
```

## 📁 Scripts Database

### `full-reset.sh`
Réinitialisation complète + données de test (400 comptes).

### `generate-french-test-data.py`
Génère 400 profils français réalistes avec:
- Noms français aléatoires
- Dates de naissance (18-45 ans)
- Villes françaises aléatoires
- 3-8 intérêts par profil
- Photos uniques (locales + randomuser.me + UI Avatars)
- Bios en français

### Configuration

Éditer `.env` pour définir les répertoires de photos:
```env
PHOTOS_SOURCE_DIR_WOMEN=/votre/chemin/photos-femmes
PHOTOS_SOURCE_DIR_MEN=/votre/chemin/photos-hommes
```

Le script:
1. Détecte et supprime les doublons photos (hash MD5)
2. Copie les photos uniques vers `uploads/profiles/`
3. Génère les profils avec photos sans aucun doublon

## 🕒 Tâches planifiées (Scheduler)

Tâche quotidienne à 00:00:
- Vérification expiration abonnements
- Mise à jour statut (active → expired)
- Exécution immédiate au démarrage si `RUN_SCHEDULER_ON_STARTUP=true`

## 🧪 Tests

Comptes de test après `./full-reset.sh`:
- `homme1@test.fr` à `homme200@test.fr`
- `femme1@test.fr` à `femme200@test.fr`
- Mot de passe: `password123`

## 📦 Dépendances principales

```json
{
  "express": "^5.x",
  "mysql2": "^3.x",
  "bcryptjs": "^2.x",
  "jsonwebtoken": "^9.x",
  "socket.io": "^4.x",
  "cors": "^2.x",
  "dotenv": "^16.x",
  "multer": "^1.x",
  "node-cron": "^3.x"
}
```

## 🛡️ Sécurité

- **bcryptjs** - Hachage mots de passe (salt rounds: 10)
- **JWT** - Tokens signés avec secret
- **CORS** - Configuré pour frontend autorisé
- **SQL injection** - Requêtes préparées (mysql2)
- **Validation** - Validation des entrées utilisateur

## 📚 Ressources

- [Express.js](https://expressjs.com/)
- [MySQL2](https://github.com/sidorares/node-mysql2)
- [Socket.io](https://socket.io/)
- [PayPal API](https://developer.paypal.com/)

## 💳 Configuration PayPal Détaillée

### Clés API Sandbox (pré-configurées)

Les clés dans `.env` sont déjà valides pour le mode Sandbox :

```env
PAYPAL_CLIENT_ID=Af93iVs15blSEniyWhaS4iU7Id4hT0-GasnKzHA30YL_OeprInfVRJRCuADpLx7couOQ79ifg8rZRmfe
PAYPAL_CLIENT_SECRET=ECP3AqzRWaOnZLR2qrb4c0hQU5iceEpP4IAEhC9fuHeapSzhRX8VIDVO3a-xZkrUP8FYmiNp8SXv9zeR
```

**Environnement** : Sandbox (test)
**URL API** : `https://api-m.sandbox.paypal.com`
**Status** : ✅ Fonctionnel

### Obtenir vos propres clés PayPal

#### Étape 1 : Compte Développeur

1. Créer un compte sur https://developer.paypal.com
2. Se connecter avec un compte PayPal personnel (ou en créer un)

#### Étape 2 : Créer une Application

1. **Dashboard** → **Apps & Credentials**
2. Sélectionner l'onglet **Sandbox** (pas Live)
3. Cliquer **Create App**
4. Remplir :
   - **App Name** : `Dating App Test` (ou autre nom)
   - **App Type** : `Merchant`
5. Cliquer **Create App**

#### Étape 3 : Récupérer les Clés

Après création, vous verrez :

**Client ID** :
- Chaîne de ~80 caractères
- Commence généralement par `A`
- Exemple : `AeA1QIZXiflr8eSYCEmYYdD8FYmNrGQjxzDKjEofeMdKx9Z-HVKzYqYPxuiQgYD3xzyBDJ8e5V6v8Yjp`
- **Copier intégralement**

**Client Secret** :
- Caché par défaut derrière `••••••••`
- Cliquer **Show** pour révéler
- Chaîne de ~80 caractères
- Exemple : `ELV7z8bUk7xMGwxU8REkqYkjPJIGQ0HJQRKQxQ5aVTYGEQ0eErh1Q8QQfTMQxKxPQQQ1kxQQxQMQ8HJK`
- **Copier intégralement**

⚠️ **Important** : Les exemples ci-dessus sont fictifs, utilisez vos vraies clés !

#### Étape 4 : Configuration

**Backend** - Mettre à jour `.env` :
```env
PAYPAL_CLIENT_ID=votre_vrai_client_id
PAYPAL_CLIENT_SECRET=votre_vrai_client_secret
```

**Frontend** - Mettre à jour `frontend-angular/src/app/components/subscription/subscription.ts` :
```typescript
// Ligne ~72
clientId: 'votre_vrai_client_id'  // Même ID que le backend
```

#### Vérification

Test rapide pour vérifier que les clés fonctionnent :

```bash
curl -X POST https://api-m.sandbox.paypal.com/v1/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -u "VOTRE_CLIENT_ID:VOTRE_CLIENT_SECRET" \
  -d "grant_type=client_credentials"
```

**Réponse attendue** :
```json
{
  "access_token": "A21AALxxx...",
  "token_type": "Bearer",
  "expires_in": 32400
}
```

### Comptes de Test Sandbox

PayPal génère automatiquement 2 comptes de test pour chaque application :

#### Trouver vos comptes

1. **Dashboard PayPal** → Menu **Sandbox** → **Accounts**
2. Vous verrez 2 comptes :

**Business Account** (Marchand) :
- Email : `sb-xxxxx@business.example.com`
- Reçoit les paiements
- Utilisé côté backend

**Personal Account** (Acheteur) :
- Email : `sb-yyyyy@personal.example.com`
- Effectue les paiements
- Utilisé pour tester l'achat

#### Récupérer les mots de passe

1. Dans la liste des comptes, cliquer sur les `...` (trois points)
2. Sélectionner **View/Edit Account**
3. Le mot de passe est visible dans la popup
4. Copier le mot de passe (généralement 11 caractères)

#### Tester un paiement complet

1. **Backend** : Démarrer avec `npm run dev`
2. **Frontend** : Démarrer avec `npm start`
3. **S'inscrire** dans l'app avec un nouveau compte
4. **Créer un profil** complet
5. **Créer 5 conversations** avec des matchs (limite gratuite)
6. **Essayer une 6ème conversation** → Message "Limite atteinte"
7. **Cliquer "S'abonner"** → Redirection vers PayPal
8. **Se connecter** avec le **Personal Account** de test
   - Email : `sb-yyyyy@personal.example.com`
   - Mot de passe : (récupéré à l'étape précédente)
9. **Compléter le paiement** dans l'interface PayPal sandbox
10. **Retour automatique** vers l'app
11. **Vérification** : L'abonnement est activé, conversations illimitées

### Implémentation Technique

#### Workflow PayPal Orders API

```
1. Frontend → POST /api/subscription/create-order
   ↓
2. Backend → PayPal Orders API (create order)
   ↓
3. Backend → Retourne order.id au frontend
   ↓
4. Frontend → Affiche popup PayPal avec order.id
   ↓
5. Utilisateur → Paie dans la popup PayPal
   ↓
6. PayPal → Callback vers frontend avec order.id
   ↓
7. Frontend → POST /api/subscription/capture-order
   ↓
8. Backend → PayPal Orders API (capture payment)
   ↓
9. Backend → Enregistre subscription en DB
   ↓
10. Frontend → Affiche confirmation
```

#### Fichiers concernés

**Backend** :
- `src/controllers/subscriptionController.js` - Logique PayPal
- `src/models/Subscription.js` - Modèle abonnement
- `src/routes/subscription.js` - Routes API
- `src/scheduler.js` - Vérification expiration quotidienne

**Frontend** :
- `src/app/components/subscription/subscription.ts` - Composant
- `src/app/services/subscription.ts` - Service API

### Tarifs et Configuration

Configurés dans `.env` :

```env
FREE_CONVERSATION_LIMIT=5       # Conversations gratuites
PRICE_24H=5.00                  # Prix 24h en euros
PRICE_MONTHLY=12.00             # Prix mensuel en euros
PRICE_YEARLY=100.00             # Prix annuel en euros
```

**Types d'abonnements** :
- `24h` : Accès illimité pendant 24 heures
- `monthly` : Accès illimité pendant 30 jours
- `yearly` : Accès illimité pendant 365 jours

### Scheduler - Vérification Expiration

Tâche CRON quotidienne à 00:00 :

```javascript
// src/scheduler.js
cron.schedule('0 0 * * *', async () => {
  await Subscription.processExpirations();
});
```

**Actions** :
- Vérifie tous les abonnements `status = 'active'`
- Compare `end_date` avec date actuelle
- Si expiré → `status = 'expired'`
- Utilisateur repasse en limite gratuite (5 conversations)

**Test immédiat** au démarrage si `RUN_SCHEDULER_ON_STARTUP=true`

### Webhooks PayPal (TODO - Non implémenté)

Pour production, il faudrait implémenter les webhooks PayPal :

**Événements utiles** :
- `PAYMENT.SALE.COMPLETED` - Paiement confirmé
- `BILLING.SUBSCRIPTION.CANCELLED` - Abonnement annulé
- `BILLING.SUBSCRIPTION.EXPIRED` - Abonnement expiré

**Configuration** :
1. Dashboard PayPal → App → Webhooks
2. URL : `https://votre-domaine.com/api/webhooks/paypal`
3. Créer endpoint dans `src/routes/webhooks.js`
4. Vérifier signature PayPal pour sécurité

### Mode Production

Pour passer en production (Live) :

1. **Dashboard** → Passer de **Sandbox** à **Live**
2. Récupérer nouvelles clés **Live**
3. Mettre à jour `.env` :
```env
PAYPAL_CLIENT_ID=votre_live_client_id
PAYPAL_CLIENT_SECRET=votre_live_client_secret
```
4. Frontend : Mettre à jour `subscription.ts` avec Live Client ID
5. URL API change automatiquement : `https://api-m.paypal.com`
6. **Implémenter webhooks** pour notifications temps réel
7. **Tester** avec de vrais paiements (petits montants d'abord)

### Ressources PayPal

- **Dashboard** : https://developer.paypal.com/dashboard
- **Documentation Orders API** : https://developer.paypal.com/docs/api/orders/v2/
- **Sandbox Testing Guide** : https://developer.paypal.com/tools/sandbox/
- **Webhooks** : https://developer.paypal.com/api/rest/webhooks/
- **SDK Node.js** : https://github.com/paypal/Checkout-NodeJS-SDK
- **Support** : https://developer.paypal.com/support/

### Dépannage

**Erreur : "invalid_client"**
→ Clés incorrectes. Vérifier longueur (~80 chars) et copier/coller complet

**Erreur : "ORDER_NOT_APPROVED"**
→ Utilisateur a annulé le paiement dans la popup PayPal

**Erreur : "RESOURCE_NOT_FOUND"**
→ Order ID invalide ou déjà capturé

**Popup PayPal ne s'ouvre pas**
→ Vérifier Client ID dans `subscription.ts` (frontend)

**Abonnement pas activé après paiement**
→ Vérifier logs backend, capture order a peut-être échoué

