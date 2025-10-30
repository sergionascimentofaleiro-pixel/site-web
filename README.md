# Application de Rencontres (Dating App)

Application full-stack similaire à Tinder, développée avec Angular 20 et Node.js/Express + **PostgreSQL** ou **MariaDB/MySQL**.

## 🏗️ Architecture

```
vscode-workspace/
├── frontend-angular/    # Application Angular 20 (standalone components)
├── backend-nodejs/      # API Express.js + PostgreSQL/MariaDB (dual support)
└── CLAUDE.md           # Instructions pour Claude Code
```

Le frontend et le backend sont des applications séparées qui communiquent via HTTP.

## 🚀 Quick Start

### 1. Base de données (PostgreSQL ou MariaDB)

**Configuration** - Éditer `backend-nodejs/.env` :
```env
DB_TYPE=postgres   # ou 'mysql' pour MariaDB/MySQL
DB_PORT=5432       # 3306 pour MySQL
```

**Initialisation** :
```bash
cd backend-nodejs/database
./full-reset.sh
```

**Le script détecte automatiquement `DB_TYPE`** et crée (1-2 minutes):
- Tables (users, profiles, matches, messages, interests, locations)
- 400 comptes de test français (200 hommes, 200 femmes) avec photos
- Données géographiques mondiales (252 pays, 305 états, 224k villes avec GPS)
- Traductions i18n (fr, en, es, pt)
- 100 intérêts répartis en 10 catégories

**Credentials** :
- PostgreSQL : `devuser` / `Manuela2011!`
- MariaDB root : `Manuela2011`
- MariaDB dev : `devuser` / `Manuela2011!`
- Database : `dating_app`

### 2. Backend (Port 3000)

```bash
cd backend-nodejs
npm install
npm run dev
```

### 3. Frontend (Port 4200)

```bash
cd frontend-angular
npm install
npm start
```

**Accès:** http://localhost:4200

## 🧪 Comptes de test

- **Hommes:** `homme1@test.fr` à `homme200@test.fr`
- **Femmes:** `femme1@test.fr` à `femme200@test.fr`
- **Mot de passe:** `password123`

**Distribution:**
- homme1-20: Orléans
- homme21-200: Villes aléatoires en France
- femme1-50: Paris
- femme51-65: Orléans
- femme66-200: Villes aléatoires en France

## 📦 Fonctionnalités

- ✅ Authentification JWT
- ✅ Profils utilisateurs avec photos
- ✅ Système de swipe (like/pass)
- ✅ Matching algorithmique (âge, distance GPS, intérêts communs)
- ✅ Chat en temps réel (WebSocket Socket.io)
- ✅ Localisation GPS mondiale (224k villes)
- ✅ Système d'intérêts (100 intérêts, 10 catégories)
- ✅ Internationalisation complète (fr, en, es, pt)
- ✅ Abonnements PayPal (24h, mensuel, annuel)
- ✅ Limite de conversations gratuites (5 gratuites)

## 🛠️ Configuration

### Backend `.env`

```env
# Database
DB_TYPE=postgres              # 'postgres' ou 'mysql'
DB_HOST=localhost
DB_USER=devuser
DB_PASSWORD=Manuela2011!
DB_NAME=dating_app
DB_PORT=5432                  # 5432 pour PostgreSQL, 3306 pour MySQL

# JWT
JWT_SECRET=your_jwt_secret_change_in_production_2024

# URLs
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:4200

# PayPal (Sandbox pour développement)
PAYPAL_CLIENT_ID=Af93iVs15blSEniyWhaS4iU7Id4hT0-GasnKzHA30YL_OeprInfVRJRCuADpLx7couOQ79ifg8rZRmfe
PAYPAL_CLIENT_SECRET=ECP3AqzRWaOnZLR2qrb4c0hQU5iceEpP4IAEhC9fuHeapSzhRX8VIDVO3a-xZkrUP8FYmiNp8SXv9zeR

# Conversations
FREE_CONVERSATION_LIMIT=5
PRICE_24H=5.00
PRICE_MONTHLY=12.00
PRICE_YEARLY=100.00

# Photos de test (chemins absolus)
PHOTOS_SOURCE_DIR_WOMEN=/chemin/vers/photos-femmes
PHOTOS_SOURCE_DIR_MEN=/chemin/vers/photos-hommes
```

**Note** : L'application détecte automatiquement le type de base et adapte toutes les requêtes SQL.

### Frontend

Le proxy API est configuré automatiquement dans `proxy.conf.json`.

## 📚 Documentation détaillée

- **Frontend:** `frontend-angular/README.md`
- **Backend:** `backend-nodejs/README.md`
- **Claude Code:** `CLAUDE.md` (instructions pour l'assistant IA)

## 🔌 API Endpoints (JWT requis)

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Utilisateur actuel
- `PUT /api/auth/preferences` - Préférences (langue)

### Profils
- `POST /api/profile` - Créer/MAJ profil
- `GET /api/profile/me` - Mon profil
- `GET /api/profile/potential-matches` - Profils à swiper
- `POST /api/profile/swipe` - Liker/passer un profil

### Matchs & Messages
- `GET /api/matches` - Liste des matchs
- `DELETE /api/matches/:id` - Unmatch
- `POST /api/messages` - Envoyer un message
- `GET /api/messages/:matchId` - Conversation
- `GET /api/messages/conversations` - Toutes les conversations
- `GET /api/messages/unread-count` - Messages non lus

### Intérêts
- `GET /api/interests` - Liste avec traductions
- `GET /api/interests/user` - Intérêts de l'utilisateur
- `POST /api/interests/user` - Définir intérêts

### Localisation
- `GET /api/locations/countries` - Pays
- `GET /api/locations/states/:countryId` - États/provinces
- `GET /api/locations/cities/:countryId` - Villes
- `GET /api/locations/cities/search` - Recherche ville

### Abonnements
- `GET /api/subscription/plans` - Liste des plans disponibles (public)
- `POST /api/subscription/create-order` - Créer commande PayPal
- `POST /api/subscription/capture-order` - Capturer paiement
- `GET /api/subscription/status` - Statut abonnement et conversations
- `GET /api/subscription/can-access/:matchId` - Vérifier accès conversation
- `GET /api/subscription/payment-history` - Historique paiements
- `POST /api/subscription/cancel` - Annuler abonnement
- `POST /api/subscription/webhook` - Webhook PayPal (interne)

## 🗄️ Base de données

Schéma complet dans `backend-nodejs/database/`:
- **users** - Authentification
- **profiles** - Profils utilisateurs
- **likes** - Swipes (like/pass)
- **matches** - Matchs mutuels
- **messages** - Messagerie
- **interest_categories** - Catégories d'intérêts
- **interests** - 100 intérêts prédéfinis
- **interest_translations** - Traductions (fr, en, es, pt)
- **profile_interests** - Association profil-intérêts
- **countries** - 252 pays avec traductions
- **states** - 305 états/provinces
- **cities** - 224k villes avec GPS (population > 500)
- **subscriptions** - Abonnements PayPal
- **payment_history** - Historique paiements
- **user_conversations** - Suivi conversations gratuites

## 💳 Configuration PayPal (Sandbox)

### Clés API déjà configurées

Les clés PayPal Sandbox sont déjà dans `.env` :

```env
PAYPAL_CLIENT_ID=Af93iVs15blSEniyWhaS4iU7Id4hT0-GasnKzHA30YL_OeprInfVRJRCuADpLx7couOQ79ifg8rZRmfe
PAYPAL_CLIENT_SECRET=ECP3AqzRWaOnZLR2qrb4c0hQU5iceEpP4IAEhC9fuHeapSzhRX8VIDVO3a-xZkrUP8FYmiNp8SXv9zeR
```

**Mode** : Sandbox (test)
**URL API** : `https://api-m.sandbox.paypal.com`

### Obtenir vos propres clés (optionnel)

Si vous voulez utiliser vos propres clés :

1. **Créer un compte développeur** : https://developer.paypal.com
2. **Dashboard** → **Apps & Credentials** → Onglet **Sandbox**
3. **Create App** → Nom : "Dating App Test" → Type : "Merchant"
4. Copier **Client ID** (~80 caractères commençant par `A`)
5. Cliquer **Show** pour révéler **Client Secret** (~80 caractères)
6. Remplacer dans `.env` et dans `frontend-angular/src/app/components/subscription/subscription.ts` (ligne 55)

### Comptes de test PayPal

Pour tester les paiements, utilisez les comptes sandbox générés automatiquement :

1. **Dashboard PayPal** → **Sandbox** → **Accounts**
2. Vous verrez 2 comptes :
   - **Business Account** (marchand - reçoit les paiements)
   - **Personal Account** (acheteur - fait les paiements)

**Pour tester un paiement** :
1. Dans l'app, créez 5 conversations (limite gratuite)
2. À la 6ème, choisissez un abonnement
3. Cliquez "S'abonner avec PayPal"
4. Connectez-vous avec le **Personal Account** de test
5. Complétez le paiement sandbox
6. L'abonnement sera activé

### Tarifs configurés

- **24 heures** : 5,00 €
- **Mensuel** : 12,00 €
- **Annuel** : 100,00 €

Modifiables dans `.env` :
```env
PRICE_24H=5.00
PRICE_MONTHLY=12.00
PRICE_YEARLY=100.00
```

### Ressources PayPal

- **Dashboard** : https://developer.paypal.com/dashboard
- **Documentation API** : https://developer.paypal.com/docs/api/orders/v2/
- **Sandbox Testing** : https://developer.paypal.com/tools/sandbox/
- **Webhooks** : https://developer.paypal.com/api/rest/webhooks/

## 📄 Licence

Projet privé de développement.
