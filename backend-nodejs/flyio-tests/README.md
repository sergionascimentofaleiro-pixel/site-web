# Backend API Tests for Fly.io Deployment

Ce répertoire contient une suite de tests Python pour vérifier toutes les APIs du backend de l'application de rencontres.

## 📋 Prérequis

### Python et dépendances

```bash
# Python 3.7+
python3 --version

# Installer les dépendances
pip3 install requests colorama psycopg2-binary

# OU avec requirements.txt (si créé)
pip3 install -r requirements.txt
```

### Base de données

Les tests nécessitent que la base de données soit initialisée avec les données de test de `full-reset.sh` :

```bash
cd ../database
./full-reset.sh
```

Cela créera 400 utilisateurs de test (femme1@test.fr à femme200@test.fr, homme1@test.fr à homme200@test.fr) avec le mot de passe `password123`.

## 🚀 Utilisation

### Tester le backend local

```bash
# Démarrer le backend (dans un autre terminal)
cd /workspace/site-web/backend-nodejs
npm run dev

# Exécuter tous les tests
cd /workspace/site-web/backend-nodejs/flyio-tests
python3 run_all_tests.py

# OU exécuter un test spécifique
python3 test_auth.py
python3 test_profile.py
python3 test_matches.py
python3 test_messages.py
python3 test_interests.py
python3 test_locations.py
```

### Tester le backend sur Fly.io

```bash
# Définir l'URL du backend Fly.io
export BACKEND_URL=https://curvy-backend.fly.dev

# Exécuter tous les tests
python3 run_all_tests.py

# OU pour un test spécifique
BACKEND_URL=https://curvy-backend.fly.dev python3 test_auth.py
```

### Nettoyer les données de test

**IMPORTANT** : Après avoir exécuté les tests, nettoyez les données créées pour restaurer la base de données à son état initial (données de `full-reset.sh` uniquement) :

```bash
# Nettoyer les données de test
python3 cleanup.py

# Le script demandera confirmation avant de supprimer les données
# Répondre "yes" pour confirmer
```

Le script de nettoyage supprimera :
- Les utilisateurs créés pendant les tests (ex: test_new_user@test.fr)
- Les likes créés pendant les tests
- Les matches créés pendant les tests
- Les messages créés pendant les tests

**Les données d'origine de `full-reset.sh` (400 utilisateurs de test) ne seront PAS supprimées.**

## 📁 Structure des tests

```
flyio-tests/
├── config.py              # Configuration et utilitaires partagés
├── test_auth.py           # Tests d'authentification (/api/auth/*)
├── test_profile.py        # Tests de profils (/api/profile/*)
├── test_matches.py        # Tests de matches (/api/matches/*)
├── test_messages.py       # Tests de messages (/api/messages/*)
├── test_interests.py      # Tests d'intérêts (/api/interests/*)
├── test_locations.py      # Tests de localisation (/api/locations/*)
├── run_all_tests.py       # Script principal (lance tous les tests)
├── cleanup.py             # Script de nettoyage des données de test
└── README.md              # Cette documentation
```

## 🧪 Tests couverts

### Authentication (`test_auth.py`)
- ✅ Inscription d'un nouvel utilisateur
- ✅ Inscription avec email existant (erreur attendue)
- ✅ Inscription avec mots de passe non correspondants (erreur)
- ✅ Connexion avec identifiants valides
- ✅ Connexion avec mot de passe invalide (erreur)
- ✅ Connexion avec email non existant (erreur)
- ✅ Récupération de l'utilisateur courant (authentifié)
- ✅ Récupération sans token (erreur)
- ✅ Mise à jour des préférences utilisateur
- ✅ Vérification de la persistance des préférences

### Profile (`test_profile.py`)
- ✅ Récupération de son propre profil
- ✅ Mise à jour du profil
- ✅ Récupération des matchs potentiels (discover)
- ✅ Swipe right (like)
- ✅ Swipe left (pass)
- ✅ Récupération d'un profil par ID
- ✅ Swipe invalide (erreur)
- ✅ Swipe sur utilisateur non existant (erreur)

### Matches (`test_matches.py`)
- ✅ Récupération de la liste des matches
- ✅ Création d'un match (like mutuel)
- ✅ Vérification du match dans la liste
- ✅ Unmatch
- ✅ Vérification de la suppression du match
- ✅ Unmatch d'un utilisateur non existant (erreur)
- ✅ Récupération des matches depuis l'autre utilisateur

### Messages (`test_messages.py`)
- ✅ Envoi d'un message
- ✅ Envoi de message vide (erreur)
- ✅ Envoi à un utilisateur non matché (erreur)
- ✅ Récupération d'une conversation
- ✅ Envoi d'une réponse
- ✅ Vérification de la conversation mise à jour
- ✅ Récupération de toutes les conversations
- ✅ Comptage des messages non lus
- ✅ Marquage des messages comme lus
- ✅ Vérification du compteur après lecture

### Interests (`test_interests.py`)
- ✅ Récupération de toutes les catégories d'intérêts
- ✅ Récupération avec traduction française
- ✅ Récupération avec traduction espagnole
- ✅ Récupération des intérêts de l'utilisateur
- ✅ Définition des intérêts de l'utilisateur
- ✅ Vérification de la mise à jour
- ✅ Définition d'une liste vide
- ✅ Vérification de la suppression
- ✅ Définition d'IDs invalides (erreur)

### Locations (`test_locations.py`)
- ✅ Récupération de tous les pays
- ✅ Récupération des pays en français
- ✅ Récupération des états pour les USA
- ✅ Récupération des états pour la France (vide)
- ✅ Récupération des villes pour la France
- ✅ Recherche de villes par nom (Paris)
- ✅ Recherche avec requête courte (2 caractères)
- ✅ Recherche avec requête vide (erreur)
- ✅ Recherche avec caractères accentués (São Paulo)
- ✅ Récupération des villes pour un pays inexistant
- ✅ Recherche avec filtre par pays

## 📊 Format de sortie

Les tests affichent :
- ✅ Succès en vert
- ❌ Erreurs en rouge
- ⚠️  Avertissements en jaune
- ℹ️  Informations en bleu

### Exemple de sortie

```
========================================
  Authentication Tests
========================================

🧪 Register new user
✅ Register: Status 201 ✓
✅ Register response: All fields present ✓
✅ Created test user ID: 401

🧪 Login with valid credentials
✅ Login: Status 200 ✓
✅ Login response: All fields present ✓
✅ Token saved for authenticated requests

...

========================================
  FINAL TEST SUMMARY
========================================

✅ Authentication        :  10/ 10 (100.0%)
✅ Profile              :   8/  8 (100.0%)
✅ Matches              :   7/  7 (100.0%)
✅ Messages             :  10/ 10 (100.0%)
✅ Interests            :   9/  9 (100.0%)
✅ Locations            :  11/ 11 (100.0%)

Total tests run: 55
Passed: 55
Failed: 0
Overall success rate: 100.0%

✅ 🎉 All tests passed!
```

## 🔧 Configuration

### Variables d'environnement

Les tests utilisent les variables d'environnement suivantes :

```bash
# URL du backend (défaut: http://localhost:3000)
export BACKEND_URL=https://curvy-backend.fly.dev

# Type de base de données (défaut: postgres)
export DB_TYPE=postgres

# Configuration PostgreSQL (pour cleanup.py)
export DATABASE_URL="postgres://user:pass@localhost:5432/dating_app"
# OU
export DB_USER=postgres
export DB_PASSWORD=postgres
export DB_NAME=dating_app
```

### Utilisateurs de test

Les tests utilisent les utilisateurs créés par `full-reset.sh` :

| Email               | Mot de passe  | Genre  |
|---------------------|---------------|--------|
| femme1@test.fr      | password123   | female |
| femme2@test.fr      | password123   | female |
| homme1@test.fr      | password123   | male   |
| homme2@test.fr      | password123   | male   |

## 📝 Fichier de suivi des données de test

Les tests créent un fichier `/tmp/flyio_test_data.json` qui contient les IDs de toutes les données créées pendant les tests :

```json
{
  "users": [401, 402],
  "likes": [1523, 1524, 1525],
  "matches": [312, 313],
  "messages": [4521, 4522, 4523]
}
```

Ce fichier est utilisé par `cleanup.py` pour supprimer uniquement les données de test.

## 🐛 Dépannage

### Tests échouent avec "Connection refused"

```bash
# Vérifier que le backend est en cours d'exécution
cd /workspace/site-web/backend-nodejs
npm run dev

# OU vérifier que l'URL Fly.io est correcte
curl https://curvy-backend.fly.dev/api/health
```

### Erreur "Module not found"

```bash
# Installer les dépendances manquantes
pip3 install requests colorama psycopg2-binary
```

### Tests échouent avec "User not found"

```bash
# Réinitialiser la base de données
cd /workspace/site-web/backend-nodejs/database
./full-reset.sh
```

### Cleanup échoue avec "Permission denied"

```bash
# Vérifier que DATABASE_URL est défini (mode distant)
echo $DATABASE_URL

# OU vérifier les identifiants locaux
export DB_USER=postgres
export DB_PASSWORD=postgres
export DB_NAME=dating_app
```

## 🔄 Workflow recommandé

1. **Initialiser la base de données**
   ```bash
   cd /workspace/site-web/backend-nodejs/database
   ./full-reset.sh
   ```

2. **Démarrer le backend**
   ```bash
   cd /workspace/site-web/backend-nodejs
   npm run dev
   ```

3. **Exécuter les tests**
   ```bash
   cd /workspace/site-web/backend-nodejs/flyio-tests
   python3 run_all_tests.py
   ```

4. **Nettoyer les données de test**
   ```bash
   python3 cleanup.py
   ```

5. **Répéter au besoin**

## 📚 Ressources

- Documentation backend : `/workspace/site-web/backend-nodejs/README.md`
- Documentation database : `/workspace/site-web/backend-nodejs/database/README.md`
- Guide de déploiement : `/workspace/site-web/DEPLOYMENT-FLYIO-VERCEL.md`

---

✅ **Suite de tests complète pour validation du backend avant et après déploiement !**
