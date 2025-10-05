# 💕 Dating App - Full Stack Application

Une application de rencontres moderne construite avec **Angular 20** et **Node.js/Express**, inspirée de Tinder.

## 🚀 Technologies

### Frontend
- **Angular 20** avec standalone components
- **Signals** pour la gestion d'état
- **RxJS** pour la programmation réactive
- **SCSS** pour le styling
- **JWT** pour l'authentification

### Backend
- **Node.js** + **Express 5**
- **MariaDB/MySQL** pour la base de données
- **bcryptjs** pour le hachage de mots de passe
- **jsonwebtoken** pour l'authentification
- Architecture **MVC**

## 📋 Fonctionnalités

✅ **Authentification complète**
- Inscription et connexion avec JWT
- Sessions persistantes
- Déconnexion

✅ **Gestion de profils**
- Création et modification de profil
- Photo de profil (URL)
- Bio, centres d'intérêt, localisation
- Préférences de recherche (genre recherché)

✅ **Système de matching**
- Swipe (like/pass) sur des profils
- Détection automatique de match mutuel
- Liste des matchs

✅ **Messagerie**
- Chat en temps réel avec les matchs
- Historique des conversations
- Compteur de messages non lus

## 🎯 Pages

| Page | Description | Statut |
|------|-------------|--------|
| Login/Register | Authentification | ✅ Complète |
| Profile | Création/édition profil | ✅ Complète |
| Discover | Swipe des profils (Tinder-like) | 🔨 À implémenter |
| Matches | Liste des matchs | 🔨 À implémenter |
| Chat | Messagerie | 🔨 À implémenter |

## 📦 Installation

Voir le fichier [SETUP.md](./SETUP.md) pour les instructions détaillées.

### Quick Start

```bash
# 1. Initialiser la base de données
cd backend-nodejs/database
./init-db.sh
./seed-db.sh  # Optionnel : 40 profils de test

# 2. Démarrer le backend
cd ../
npm run dev

# 3. Démarrer le frontend (nouveau terminal)
cd ../../frontend-angular
npm start
```

Ouvrez http://localhost:4200

## 🧪 Comptes de test

Après avoir exécuté `seed-db.sh`, vous avez accès à 40 profils de test.

Voir [TEST-ACCOUNTS.md](./TEST-ACCOUNTS.md) pour la liste complète.

**Exemples :**
- 👨 Hommes : `john.smith@test.com`, `michael.jones@test.com`
- 👩 Femmes : `emma.johnson@test.com`, `olivia.williams@test.com`
- 🔑 Mot de passe pour tous : `Test123!`

## 📁 Structure du projet

```
├── backend-nodejs/
│   ├── src/
│   │   ├── config/        # Configuration DB
│   │   ├── controllers/   # Logique métier
│   │   ├── models/        # Modèles de données
│   │   ├── routes/        # Routes API
│   │   ├── middleware/    # Auth JWT
│   │   └── server.js      # Point d'entrée
│   └── database/
│       ├── schema.sql     # Schéma DB
│       ├── seed-data.sql  # Données de test
│       ├── init-db.sh     # Script d'initialisation
│       ├── reset-db.sh    # Script de réinitialisation
│       └── seed-db.sh     # Script d'injection de données
│
└── frontend-angular/
    └── src/app/
        ├── components/    # Composants Angular
        ├── services/      # Services API
        ├── interceptors/  # HTTP interceptor JWT
        └── app.routes.ts  # Configuration routing
```

## 🔌 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Utilisateur actuel

### Profils
- `POST /api/profile` - Créer/MAJ profil
- `GET /api/profile/me` - Mon profil
- `GET /api/profile/potential-matches` - Profils à swiper
- `POST /api/profile/swipe` - Liker/passer un profil

### Matchs
- `GET /api/matches` - Liste des matchs
- `DELETE /api/matches/:id` - Unmatch

### Messages
- `POST /api/messages` - Envoyer un message
- `GET /api/messages/:matchId` - Conversation
- `GET /api/messages/conversations` - Toutes les conversations
- `GET /api/messages/unread-count` - Messages non lus

## 🗄️ Schéma de base de données

- **users** : Authentification
- **profiles** : Informations profil
- **photos** : Photos de profil
- **likes** : Swipes (like/pass)
- **matches** : Matchs mutuels
- **messages** : Messagerie

## 🎨 Design

- Palette de couleurs : Rose (#e94560) et Bleu (#0f3460)
- Design responsive
- Inspiré des applications de rencontres modernes

## 📝 TODO / Améliorations futures

- [ ] Implémenter les pages Discover, Matches et Chat
- [ ] Upload de photos réel (Multer)
- [ ] WebSocket pour messagerie temps réel
- [ ] Filtres de recherche (distance, âge, etc.)
- [ ] Système de notifications
- [ ] Vérification email
- [ ] Photos multiples par profil
- [ ] Tests unitaires et E2E

## 📖 Documentation

- [SETUP.md](./SETUP.md) - Guide d'installation complet
- [TEST-ACCOUNTS.md](./TEST-ACCOUNTS.md) - Liste des comptes de test
- [CLAUDE.md](./CLAUDE.md) - Documentation pour Claude Code

## 🤝 Contribution

Projet personnel d'apprentissage. N'hésitez pas à forker et expérimenter !

## 📄 Licence

MIT
