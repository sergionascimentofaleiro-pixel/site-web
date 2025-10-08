# Comment Obtenir vos Clés PayPal Sandbox

## ⚠️ Problème Actuel

Les clés dans `.env.test` ne sont pas valides :
```
PAYPAL_CLIENT_ID=sb-h1cga5107256@business.example.com  ❌ Ce n'est PAS un Client ID
PAYPAL_CLIENT_SECRET=9iK{c+;Y                          ❌ Trop court, incomplet
```

**Erreur obtenue** : `{"error":"invalid_client","error_description":"Client Authentication failed"}`

## ✅ Comment Obtenir les Vraies Clés

### Étape 1 : Créer un Compte Développeur PayPal

1. Allez sur https://developer.paypal.com
2. Cliquez sur **"Sign Up"** (ou **"Log In"** si vous avez déjà un compte PayPal)
3. Utilisez votre compte PayPal personnel (ou créez-en un gratuitement)

### Étape 2 : Créer une Application Sandbox

1. Une fois connecté, vous arrivez sur le **Dashboard**
2. En haut, vous verrez deux onglets : **Sandbox** et **Live**
3. **Restez sur "Sandbox"** (mode test)
4. Dans le menu de gauche, cliquez sur **"Apps & Credentials"**
5. Assurez-vous d'être bien sur l'onglet **"Sandbox"** en haut
6. Cliquez sur le bouton bleu **"Create App"**

### Étape 3 : Configurer l'Application

Dans le formulaire :
- **App Name** : Tapez `Dating App Test` (ou n'importe quel nom)
- **App Type** : Sélectionnez **"Merchant"**
- Cliquez sur **"Create App"**

### Étape 4 : Récupérer les Clés

Après la création, vous verrez une page avec :

#### Client ID
- En haut de la page, sous **"Client ID"**
- C'est une longue chaîne qui ressemble à :
  ```
  AeA1QIZXiflr8eSYCEmYYdD8FYmNrGQjxzDKjEofeMdKx9Z-HVKzYqYPxuiQgYD3xzyBDJ8e5V6v8Yjp
  ```
- **Copiez cette chaîne complète**

#### Client Secret
- Juste en dessous du Client ID
- Par défaut, il est caché derrière des étoiles `••••••••`
- Cliquez sur le bouton **"Show"** à côté
- Une longue chaîne apparaît, comme :
  ```
  ELV7z8bUk7xMGwxU8REkqYkjPJIGQ0HJQRKQxQ5aVTYGEQ0eErh1Q8QQfTMQxKxPQQQ1kxQQxQMQ8HJK
  ```
- **Copiez cette chaîne complète**

### Étape 5 : Mettre à Jour .env.test

Collez vos clés dans `backend-nodejs/.env.test` :

```env
# PayPal Configuration (Sandbox)
PAYPAL_CLIENT_ID=AeA1QIZXiflr8eSYCEmYYdD8FYmNrGQjxzDKjEofeMdKx9Z-HVKzYqYPxuiQgYD3xzyBDJ8e5V6v8Yjp
PAYPAL_CLIENT_SECRET=ELV7z8bUk7xMGwxU8REkqYkjPJIGQ0HJQRKQxQ5aVTYGEQ0eErh1Q8QQfTMQxKxPQQQ1kxQQxQMQ8HJK
```

⚠️ **Remplacez** avec vos vraies clés ! Les exemples ci-dessus sont fictifs.

### Étape 6 : Vérifier les Clés

#### Longueur Attendue
- **Client ID** : ~80 caractères, commence souvent par `A`
- **Client Secret** : ~80 caractères, mélange de lettres/chiffres

#### Test Rapide
Une fois les clés configurées, testez :

```bash
cd backend-nodejs
npm test -- subscription-paypal.test.js
```

**Résultat attendu** :
```
✅ Running PayPal integration tests with real Sandbox API
   Client ID: AeA1QIZXi...
✓ should create a PayPal order
✓ Order created: 5O190127TN364715T
```

## 📝 Obtenir les Identifiants de Test (pour payer)

### Comptes de Test Sandbox

PayPal crée automatiquement 2 comptes de test pour vous :

1. Dans le Dashboard, cliquez sur **"Sandbox"** dans le menu de gauche
2. Cliquez sur **"Accounts"**
3. Vous verrez 2 comptes :
   - **Business** (vendeur) - Reçoit les paiements
   - **Personal** (acheteur) - Effectue les paiements

### Récupérer les Identifiants Personal (Acheteur)

1. Trouvez le compte avec **"Type: PERSONAL"**
2. L'email ressemble à : `sb-xxx47@personal.example.com`
3. Cliquez sur les **3 points** (⋮) à droite de la ligne
4. Cliquez sur **"View/Edit account"**
5. Vous verrez :
   - **Email** : `sb-xxx47@personal.example.com`
   - **System Generated Password** : Cliquez sur l'icône 👁️ pour voir
   - Exemple de mot de passe : `V4X-YDxH`

### Mettre à Jour PAYPAL_TEST_CREDENTIALS.md

```markdown
**Nom d'utilisateur** : sb-xxx47@personal.example.com
**Mot de passe** : V4X-YDxH
```

## 🧪 Test Complet

### 1. Vérifier les Clés API

```bash
cd backend-nodejs
cat .env.test | grep PAYPAL
```

Doit afficher :
```
PAYPAL_CLIENT_ID=AeA1... (longue chaîne)
PAYPAL_CLIENT_SECRET=ELV7... (longue chaîne)
```

### 2. Exécuter les Tests

```bash
npm test -- subscription-paypal.test.js --verbose
```

**Si les clés sont correctes** :
```
✅ Running PayPal integration tests with real Sandbox API
   Client ID: AeA1QIZXi...

✓ should create a PayPal order (1234 ms)
✓ Order created: 5O190127TN364715T
  Approval URL: https://www.sandbox.paypal.com/checkoutnow?token=5O190127TN364715T

✓ should create orders for all plan types (5678 ms)
✓ 24h order created: 6P201238UO475826U
✓ monthly order created: 7Q312349VP586937V
✓ yearly order created: 8R423450WQ697048W

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
```

**Si les clés sont incorrectes** :
```
❌ {"error":"invalid_client","error_description":"Client Authentication failed"}
```

## 🔍 Dépannage

### Erreur "invalid_client"

**Cause** : Clés invalides ou incomplètes

**Solutions** :
1. Vérifiez que vous avez copié la **totalité** du Client ID et Secret
2. Vérifiez qu'il n'y a pas d'espaces avant/après
3. Vérifiez que vous êtes bien en mode **Sandbox** (pas Live)
4. Essayez de créer une nouvelle application

### Client ID commence par "sb-"

**Erreur** : Vous avez copié l'email du compte Sandbox au lieu du Client ID

**Solution** : Retournez dans Apps & Credentials → Votre App → Copiez le vrai Client ID

### Client Secret trop court

**Erreur** : Vous n'avez copié qu'une partie du secret

**Solution** : Cliquez sur "Show" et copiez toute la chaîne révélée

## 📞 Besoin d'Aide ?

Si vous avez des difficultés :

1. **Vidéo YouTube** : Cherchez "PayPal Sandbox API credentials tutorial"
2. **Documentation** : https://developer.paypal.com/api/rest/#link-getcredentials
3. **Support PayPal** : https://developer.paypal.com/support/

## ✅ Checklist

Avant de continuer :

- [ ] J'ai créé un compte sur developer.paypal.com
- [ ] J'ai créé une application Sandbox
- [ ] J'ai copié le Client ID complet (~80 caractères)
- [ ] J'ai copié le Client Secret complet (~80 caractères)
- [ ] J'ai mis à jour `.env.test` avec les vraies clés
- [ ] Les tests passent sans erreur "invalid_client"

Une fois ces étapes complétées, vos tests d'intégration PayPal fonctionneront ! 🚀
