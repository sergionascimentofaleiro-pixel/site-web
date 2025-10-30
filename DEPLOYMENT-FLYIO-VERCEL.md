# Guide de déploiement sur Fly.io + Vercel

Ce guide vous montre comment déployer votre application de rencontres gratuitement sur **Fly.io** (backend + PostgreSQL) et **Vercel** (frontend Angular).

## 📋 Prérequis

1. Compte GitHub avec votre code poussé
2. Compte Fly.io (gratuit) : https://fly.io/app/sign-up
3. Compte Vercel (gratuit) : https://vercel.com/signup
4. CLI Fly.io installé localement : `curl -L https://fly.io/install.sh | sh`

---

## 🎯 Partie 1 : Déploiement Backend sur Fly.io

### Étape 1 : Installer et configurer Fly CLI

```bash
# Installer Fly CLI
m

# Se connecter
flyctl auth login
```

### Étape 2 : Créer l'application Fly.io (Backend)

```bash
cd backend-nodejs

# Lancer l'application (sans déployer immédiatement)
# Le nom 'curvy-backend' est déjà configuré dans fly.toml
flyctl launch --no-deploy

# Répondre aux questions :
# - App name: curvy-backend (déjà configuré dans fly.toml)
# - Region: cdg (Paris) ou autre proche de vos utilisateurs
# - PostgreSQL database: YES ✅
# - Redis: NO

# Fly.io va :
# 1. Utiliser fly.toml existant (avec app = 'curvy-backend')
# 2. Créer une base PostgreSQL gratuite
# 3. Configurer DATABASE_URL automatiquement

# Votre backend sera accessible sur : https://curvy-backend.fly.dev
```

### Étape 3 : Configuration des secrets/variables d'environnement

```bash
# Définir les variables d'environnement
flyctl secrets set \
  NODE_ENV=production \
  DB_TYPE=postgres \
  JWT_SECRET=$(openssl rand -hex 32) \
  IMAGE_SIGNATURE_SECRET=$(openssl rand -hex 32) \
  PAYPAL_CLIENT_ID=Af93iVs15blSEniyWhaS4iU7Id4hT0-GasnKzHA30YL_OeprInfVRJRCuADpLx7couOQ79ifg8rZRmfe \
  PAYPAL_CLIENT_SECRET=ECP3AqzRWaOnZLR2qrb4c0hQU5iceEpP4IAEhC9fuHeapSzhRX8VIDVO3a-xZkrUP8FYmiNp8SXv9zeR \
  FREE_CONVERSATION_LIMIT=5 \
  PRICE_24H=5.00 \
  PRICE_MONTHLY=12.00 \
  PRICE_YEARLY=100.00 \
  RUN_SCHEDULER_ON_STARTUP=false

# DATABASE_URL est déjà définie automatiquement par Fly.io

# Définir les URLs (à mettre à jour après déploiement)
flyctl secrets set \
  BACKEND_URL=https://curvy-backend.fly.dev \
  FRONTEND_URL=https://curvy.vercel.app
```

### Étape 4 : Créer un volume persistant pour les uploads

```bash
# Créer un volume pour stocker les photos uploadées (10 GB comme configuré dans fly.toml)
flyctl volumes create uploads_data --region cdg --size 10
```

### Étape 5 : Déployer le backend

```bash
# Déployer l'application
flyctl deploy

# Attendre le déploiement (~2-3 minutes)
# URL finale : https://curvy-backend.fly.dev
```

### Étape 6 : Initialiser la base de données PostgreSQL

```bash
# Se connecter à la machine Fly.io via SSH
flyctl ssh console

# Dans la console SSH, exécuter :
cd /app/database
export DATABASE_URL="postgres://curvy_backend:AZw7sA6Dcg8MZMd@curvy-backend-db.flycast:5432/curvy_backend?sslmode=disable"
./full-reset.sh

# Répondre "yes" pour confirmer
# Le script détectera DATABASE_URL et utilisera le mode cloud

# Sortir de la console
exit
```

**Alternative (depuis votre machine locale avec proxy - RECOMMANDÉ) :**

Cette méthode est plus fiable et plus rapide que SSH, surtout pour l'import des villes qui peut être très lent via SSH.

⚠️ **Note** : Le proxy est maintenant géré automatiquement par le script ! Plus besoin de l'ouvrir manuellement.

```bash
# Obtenir le DATABASE_URL depuis Fly.io (une seule fois)
flyctl secrets list | grep DATABASE_URL
# Résultat : postgres://curvy_backend:PASSWORD@curvy-backend-db.flycast:5432/curvy_backend?sslmode=disable

# Ajouter dans backend-nodejs/.env (décommenter la ligne)
DATABASE_URL="postgres://curvy_backend:AZw7sA6Dcg8MZMd@localhost:5432/curvy_backend?sslmode=disable"
FLYIO_APP_NAME=curvy-backend

# Exécuter le script d'initialisation complet
cd backend-nodejs/database
./full-reset.sh

# OU mode rapide pour les tests (sans import des villes - plus rapide)
./full-reset.sh --skip-cities

# Le script va automatiquement :
# - 🛑 Arrêter PostgreSQL local si en cours d'exécution (libère le port 5432)
# - 🔌 Démarrer le proxy Fly.io (flyctl proxy 5432:5432)
# - 💾 Détecter DATABASE_URL et utiliser le mode cloud
# - 🗄️  Recréer le schéma de la base de données
# - 🌍 Importer 252 pays, 305 états, ~225 000 villes (GeoNames) - SAUF avec --skip-cities
# - 🧹 Nettoyer les anciennes photos sur Fly.io
# - 📤 Uploader les photos locales vers le volume Fly.io (/app/uploads)
# - 👥 Créer 400 utilisateurs de test
# - 🔌 Arrêter le proxy à la fin
# - 🔄 Redémarrer PostgreSQL local s'il était actif
# Durée totale : 3-5 minutes avec villes + photos, ~1-2 minutes avec --skip-cities
```

**Note importante :** Le domaine `.flycast` est uniquement accessible depuis le réseau interne Fly.io. Pour accéder depuis votre machine locale, vous DEVEZ utiliser le proxy `flyctl proxy` et remplacer le hostname par `localhost` dans l'URL.

### Étape 7 : Vérifier le déploiement

```bash
# Ouvrir l'application dans le navigateur
flyctl open

# Vérifier les logs
flyctl logs

# Tester le health endpoint
curl https://curvy-backend.fly.dev/api/health
# Résultat attendu : {"status":"OK","message":"Dating app backend is running"}
```

---

## 🎨 Partie 2 : Déploiement Frontend sur Vercel

### Étape 1 : Préparer le frontend

Avant de déployer, nous devons configurer l'URL du backend en production.

**Créer le fichier de configuration** :

```bash
cd ../frontend-angular/src/app
mkdir -p config
```

Le fichier `config/environment.ts` a déjà été créé avec vos URLs :

```typescript
const isLocalhost = window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1';

export const environment = {
  production: !isLocalhost,

  apiUrl: isLocalhost
    ? 'http://localhost:3000/api'
    : 'https://curvy-backend.fly.dev/api',

  socketUrl: isLocalhost
    ? 'http://localhost:3000'
    : 'https://curvy-backend.fly.dev',

  appName: 'Curvy'
};
```

**Mettre à jour tous les services** pour utiliser `environment.apiUrl` au lieu de URLs codées en dur.

### Étape 2 : Déployer sur Vercel

#### Option A : Via l'interface web Vercel (Recommandé)

1. Aller sur https://vercel.com
2. Cliquer "Add New" → "Project"
3. Importer votre repository GitHub
4. Configurer le projet :
   - **Project Name** : `curvy` (pour avoir curvy.vercel.app)
   - **Framework Preset** : Angular
   - **Root Directory** : `frontend-angular`
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist/frontend-angular/browser`
5. Cliquer "Deploy"

Votre frontend sera accessible sur : **https://curvy.vercel.app**

#### Option B : Via Vercel CLI

```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# Déployer (depuis le dossier frontend-angular)
cd frontend-angular
vercel

# Répondre aux questions :
# - Set up and deploy? Yes
# - Which scope? Votre compte
# - Link to existing project? No
# - Project name? dating-app-frontend
# - Directory? ./
# - Override settings? No

# Déployer en production
vercel --prod
```

### Étape 3 : Configurer les budgets Angular (si erreur de build)

Si le build échoue avec "Budget exceeded", mettre à jour `angular.json` :

```json
{
  "budgets": [
    {
      "type": "initial",
      "maximumWarning": "1MB",
      "maximumError": "2MB"
    },
    {
      "type": "anyComponentStyle",
      "maximumWarning": "12kB",
      "maximumError": "15kB"
    }
  ]
}
```

### Étape 4 : Mettre à jour FRONTEND_URL dans Fly.io

```bash
# L'URL est déjà configurée : https://curvy.vercel.app
# Si besoin de la mettre à jour :
cd ../backend-nodejs
flyctl secrets set FRONTEND_URL=https://curvy.vercel.app

# L'app redémarrera automatiquement
```

### Étape 5 : Vérifier le déploiement

1. Ouvrir **https://curvy.vercel.app**
2. Tester l'inscription d'un utilisateur
3. Vérifier que l'API backend est accessible
4. Tester le login
5. Vérifier les WebSockets (chat en temps réel)

---

## 🔧 Configuration CORS

Le backend doit autoriser le frontend Vercel. Vérifier dans `backend-nodejs/src/server.js` :

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true
}));
```

---

## 📊 Surveillance et logs

### Fly.io (Backend)

```bash
# Logs en temps réel
flyctl logs

# Statut de l'application
flyctl status

# Métriques
flyctl metrics

# Se connecter à la machine
flyctl ssh console

# Redémarrer l'application
flyctl apps restart dating-app-backend
```

### Vercel (Frontend)

1. Aller sur https://vercel.com/dashboard
2. Sélectionner votre projet
3. Onglet "Deployments" : Voir l'historique
4. Onglet "Analytics" : Métriques de performance
5. Onglet "Logs" : Logs de build et runtime

---

## 🆓 Limites du plan gratuit

### Fly.io Gratuit
- **3 machines virtuelles partagées**
- **3 Go de stockage PostgreSQL**
- **160 Go de bande passante sortante/mois**
- ✅ **Pas de sleep** - toujours actif !
- ✅ **Base de données persistante**

### Vercel Gratuit
- **100 GB de bande passante/mois**
- **Déploiements illimités**
- **CDN global automatique**
- **HTTPS automatique**
- ✅ Parfait pour le frontend Angular

---

## 🚀 Déploiements futurs

### Backend (Fly.io)

```bash
# Depuis backend-nodejs/
git add .
git commit -m "Update backend"
git push

# Déployer
flyctl deploy
```

### Frontend (Vercel)

Vercel redéploie automatiquement à chaque `git push` sur la branche main !

Ou manuellement :
```bash
cd frontend-angular
vercel --prod
```

---

## 🛠️ Dépannage

### Backend ne démarre pas

```bash
# Vérifier les logs
flyctl logs

# Vérifier les secrets
flyctl secrets list

# Redémarrer
flyctl apps restart curvy-backend
```

### Frontend ne se connecte pas au backend

1. Vérifier que `environment.ts` pointe vers la bonne URL Fly.io
2. Vérifier CORS dans le backend
3. Vérifier `FRONTEND_URL` dans les secrets Fly.io

### Base de données vide ou besoin de réinitialiser

**Option A : Via SSH (simple mais lent)**
```bash
# Se connecter à Fly.io
flyctl ssh console

# Réexécuter le script d'initialisation
cd /app/database
./full-reset.sh
# ATTENTION : L'import des villes peut être TRÈS lent via SSH (15-30 minutes)
```

**Option B : Via proxy local (RECOMMANDÉ - beaucoup plus rapide)**

⚠️ **Note** : Le proxy est géré automatiquement, plus besoin de terminal séparé !

```bash
# S'assurer que DATABASE_URL est dans .env (décommenté)
# Le script démarrera et arrêtera le proxy automatiquement

cd backend-nodejs/database

# Import complet avec villes : 3-5 minutes
./full-reset.sh

# OU mode rapide pour tests (sans villes) : 1-2 minutes
./full-reset.sh --skip-cities
```

### Problèmes de build Angular

```bash
# Localement, tester le build
cd frontend-angular
npm run build

# Vérifier les erreurs
# Augmenter les budgets si nécessaire
```

---

## 📱 Domaine personnalisé (optionnel)

### Fly.io (Backend)

```bash
# Ajouter un domaine custom
flyctl certs add api.votredomaine.com

# Configurer DNS :
# Type: CNAME
# Name: api
# Value: curvy-backend.fly.dev
```

### Vercel (Frontend)

1. Dashboard Vercel → Projet → Settings → Domains
2. Ajouter "votredomaine.com"
3. Configurer DNS :
   - Type: A, Value: 76.76.21.21
   - Type: CNAME, Name: www, Value: cname.vercel-dns.com

---

## 💰 Coût total

**Plan gratuit :** 0€/mois
- Backend Fly.io : Gratuit (3 VMs)
- PostgreSQL Fly.io : Gratuit (3 Go)
- Frontend Vercel : Gratuit (illimité)

**Total : GRATUIT ! 🎉**

---

## ✅ Checklist de déploiement

- [ ] Fly CLI installé et authentifié
- [ ] Application backend créée sur Fly.io
- [ ] PostgreSQL provisionné sur Fly.io
- [ ] Secrets configurés (JWT, PayPal, etc.)
- [ ] Volume créé pour uploads
- [ ] Backend déployé sur Fly.io
- [ ] Base de données initialisée
- [ ] Health endpoint vérifié
- [ ] Frontend configuré avec URL backend
- [ ] Frontend déployé sur Vercel
- [ ] FRONTEND_URL mise à jour dans Fly.io
- [ ] Test inscription/login fonctionnel
- [ ] Chat WebSocket fonctionnel
- [ ] PayPal configuré (si utilisé)

---

## 📚 Ressources

- **Fly.io Docs** : https://fly.io/docs/
- **Vercel Docs** : https://vercel.com/docs
- **Angular Deployment** : https://angular.dev/tools/cli/deployment
- **PostgreSQL Fly.io** : https://fly.io/docs/postgres/

---

🎉 **Votre application est maintenant déployée gratuitement !**
