# Guide de Configuration PayPal - Étape par Étape

## Étape 1 : Créer un Compte Développeur PayPal

1. Allez sur https://developer.paypal.com
2. Cliquez sur **"Log in to Dashboard"** en haut à droite
3. Connectez-vous avec votre compte PayPal personnel (ou créez-en un)

## Étape 2 : Créer une Application Sandbox

1. Une fois connecté au Dashboard, allez dans **"Apps & Credentials"**
2. Assurez-vous d'être en mode **"Sandbox"** (onglet en haut)
3. Cliquez sur **"Create App"**
4. Remplissez les informations :
   - **App Name** : `Dating App Subscription Test` (ou le nom de votre choix)
   - **App Type** : `Merchant`
5. Cliquez sur **"Create App"**

## Étape 3 : Récupérer vos Clés API

Après la création de l'app, vous verrez :

### Client ID
- Copiez le **Client ID** (commence par quelque chose comme `AeA1...`)

### Secret
- Cliquez sur **"Show"** sous **Secret**
- Copiez le **Secret**

## Étape 4 : Configurer l'Application

### Backend

Éditez le fichier `backend-nodejs/.env` :

```env
# PayPal Configuration
PAYPAL_CLIENT_ID=COLLEZ_VOTRE_CLIENT_ID_ICI
PAYPAL_CLIENT_SECRET=COLLEZ_VOTRE_SECRET_ICI

# URLs
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:4200

# Abonnement
FREE_CONVERSATION_LIMIT=5
PRICE_24H=5.00
PRICE_MONTHLY=12.00
PRICE_YEARLY=100.00
```

### Frontend

Éditez le fichier `frontend-angular/src/app/components/subscription/subscription.ts` à la ligne 72 :

```typescript
async loadPayPalSdk() {
  try {
    const paypal = await loadScript({
      clientId: 'COLLEZ_VOTRE_CLIENT_ID_ICI', // ← Remplacez ceci
      currency: 'EUR'
    });

    if (paypal) {
      this.paypalLoaded.set(true);
    }
  } catch (error) {
    console.error('Failed to load PayPal SDK:', error);
    this.errorMessage.set('Failed to load PayPal');
  }
}
```

## Étape 5 : Récupérer les Identifiants de Test

1. Dans le Dashboard PayPal, allez dans **"Sandbox"** → **"Accounts"**
2. Vous verrez 2 comptes de test créés automatiquement :
   - Un compte **Business** (pour recevoir les paiements)
   - Un compte **Personal** (pour effectuer les paiements)

### Pour le Compte Personal (Acheteur)

1. Cliquez sur les **3 points** à droite du compte Personal
2. Cliquez sur **"View/Edit account"**
3. Notez :
   - **Email** : (quelque chose comme `sb-xxx@personal.example.com`)
   - **System Generated Password** : Cliquez sur l'icône 👁️ pour voir le mot de passe

### Enregistrez ces Identifiants

Éditez le fichier `PAYPAL_TEST_CREDENTIALS.md` :

```markdown
**Nom d'utilisateur** : sb-xxx@personal.example.com
**Mot de passe** : le_mot_de_passe_affiché
```

## Étape 6 : Vérification

Vérifiez que vous avez bien :
- ✅ Client ID dans `backend-nodejs/.env`
- ✅ Client Secret dans `backend-nodejs/.env`
- ✅ Client ID dans `frontend-angular/src/app/components/subscription/subscription.ts`
- ✅ Email et mot de passe du compte test dans `PAYPAL_TEST_CREDENTIALS.md`

## Étape 7 : Tester

```bash
# Terminal 1 - Backend
cd backend-nodejs
npm run dev

# Terminal 2 - Frontend
cd frontend-angular
npm start
```

Puis :
1. Ouvrez http://localhost:4200
2. Créez un compte
3. Créez 5 conversations
4. Tentez d'en créer une 6ème
5. Sélectionnez une formule
6. Connectez-vous sur PayPal avec vos identifiants de test
7. Complétez le paiement

## Dépannage

### "Client ID invalide"
- Vérifiez que vous êtes bien en mode **Sandbox** (pas Live)
- Vérifiez que le Client ID est bien copié sans espaces

### "Cannot connect to PayPal"
- Vérifiez votre connexion Internet
- Vérifiez que le SDK PayPal se charge (console navigateur)

### Le paiement ne redirige pas
- Vérifiez les URLs dans `.env` (BACKEND_URL et FRONTEND_URL)
- Vérifiez les logs backend pour erreurs

## Ressources

- Dashboard : https://developer.paypal.com/dashboard
- Documentation : https://developer.paypal.com/docs/api/overview
- Sandbox Accounts : https://developer.paypal.com/dashboard/accounts
