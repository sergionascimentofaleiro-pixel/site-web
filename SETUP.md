# Dating App Setup Guide

Ce guide explique comment mettre en place et démarrer l'application de rencontres.

## Prérequis

- Node.js (v18 ou supérieur)
- MariaDB/MySQL
- npm

## 1. Configuration de la Base de Données

### Créer la base de données

```bash
# Se connecter à MariaDB en tant que root
mysql -u root -p

# Dans le shell MySQL, exécuter :
source /media/nascimento/data/vscode-workspace/backend-nodejs/database/setup.sql
source /media/nascimento/data/vscode-workspace/backend-nodejs/database/schema.sql
```

### Ou utiliser les scripts automatiques :

```bash
cd backend-nodejs/database

# Initialisation complète (création DB + tables)
./init-db.sh

# Ou réinitialisation (supprime et recrée tout)
./reset-db.sh

# Puis injecter des données de test (optionnel)
./seed-db.sh
```

Le script `seed-db.sh` crée **40 profils de test** :
- 20 hommes (john.smith@test.com, michael.jones@test.com, etc.)
- 20 femmes (emma.johnson@test.com, olivia.williams@test.com, etc.)
- Mot de passe pour tous : **Test123!**

## 2. Configuration du Backend

```bash
cd backend-nodejs

# Les dépendances sont déjà installées, mais si nécessaire :
# npm install

# Vérifier le fichier .env
cat .env
# Doit contenir :
# PORT=3000
# DB_HOST=localhost
# DB_USER=devuser
# DB_PASSWORD=Manuela2011!
# DB_NAME=dating_app
# DB_PORT=3306
# JWT_SECRET=your_jwt_secret_change_in_production_2024

# Démarrer le serveur en mode développement
npm run dev
```

Le backend démarre sur http://localhost:3000

## 3. Configuration du Frontend

```bash
cd frontend-angular

# Les dépendances sont déjà installées, mais si nécessaire :
# npm install

# Démarrer le serveur de développement
npm start
```

Le frontend démarre sur http://localhost:4200

## 4. Tester l'Application

1. Ouvrir http://localhost:4200 dans votre navigateur
2. Créer un compte (Register)
3. Compléter votre profil
4. Explorer les profils (Discover)
5. Liker des profils pour créer des matchs
6. Envoyer des messages à vos matchs

## Structure de l'API

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Obtenir l'utilisateur actuel

### Profils
- `POST /api/profile` - Créer/Mettre à jour le profil
- `GET /api/profile/me` - Obtenir mon profil
- `GET /api/profile/potential-matches` - Obtenir des profils à swiper
- `POST /api/profile/swipe` - Liker ou passer un profil

### Matchs
- `GET /api/matches` - Obtenir tous mes matchs
- `DELETE /api/matches/:matchId` - Se dématcher

### Messages
- `POST /api/messages` - Envoyer un message
- `GET /api/messages/:matchId` - Obtenir la conversation
- `GET /api/messages/conversations` - Obtenir toutes les conversations
- `GET /api/messages/unread-count` - Nombre de messages non lus

## Fonctionnalités Implémentées

### Backend ✅
- Authentification JWT
- Gestion des utilisateurs
- Gestion des profils
- Système de likes/swipes
- Détection de matchs automatique
- Messagerie entre matchs
- Base de données MariaDB complète

### Frontend ✅
- Login/Register components
- Services pour toutes les API
- HTTP Interceptor pour JWT
- Routing configuré
- Architecture avec signals Angular 20

### À Compléter (si besoin)
Les composants suivants ont été générés mais nécessitent l'implémentation complète :
- `src/app/components/profile/` - Formulaire de profil
- `src/app/components/discover/` - Carte de swipe (Tinder-like)
- `src/app/components/matches/` - Liste des matchs
- `src/app/components/chat/` - Interface de chat

## Prochaines Étapes (Optionnel)

1. Ajouter l'upload d'images (multer côté backend)
2. Implémenter WebSocket pour la messagerie en temps réel
3. Ajouter des filtres de recherche (distance, âge, etc.)
4. Système de notifications
5. Tests unitaires et E2E

## Dépannage

### Erreur de connexion à la base de données
- Vérifier que MariaDB est démarré : `sudo systemctl status mariadb`
- Vérifier les credentials dans `.env`

### Port déjà utilisé
- Backend : changer le PORT dans `.env`
- Frontend : `ng serve --port 4201`

### CORS errors
- Vérifier que le backend autorise bien l'origin du frontend dans `server.js`
