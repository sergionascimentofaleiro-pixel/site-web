# Configuration PayPal - Dating App

## Vue d'Ensemble

L'application utilise **PayPal** pour gérer les paiements d'abonnement. PayPal permet d'accepter des paiements par carte bancaire et compte PayPal.

## Système d'Abonnement

### Limite Gratuite

- **5 conversations gratuites** par utilisateur
- À partir de la 6ème conversation, un abonnement est requis
- Les utilisateurs peuvent continuer à échanger avec leurs 5 premières conversations

### Formules d'Abonnement

| Formule | Prix | Durée | Description |
|---------|------|-------|-------------|
| 24 heures | 5€ | 24h | Accès complet pour 24 heures |
| Mensuel | 12€ | 30 jours | Conversations illimitées pendant 1 mois |
| Annuel | 100€ | 365 jours | Conversations illimitées pendant 1 an |

## Prérequis

### 1. Compte PayPal Business

1. Créez un compte PayPal Business sur https://www.paypal.com/bizsignup
2. Vérifiez votre identité (KYC)
3. Ajoutez un compte bancaire pour recevoir les paiements

**Note** : Un compte PayPal Business est requis pour accepter des paiements.

### 2. Clés API PayPal

#### Mode Sandbox (Tests)

1. Allez sur https://developer.paypal.com
2. Connectez-vous avec votre compte PayPal
3. Allez dans **Dashboard** → **My Apps & Credentials**
4. Section **Sandbox** :
   - Créez une application (Create App)
   - Notez le **Client ID** et le **Secret**

#### Mode Production

1. Dans **My Apps & Credentials**
2. Section **Live** :
   - Créez une application (Create App)
   - Notez le **Client ID** et le **Secret**

## Configuration

### Backend

#### 1. Variables d'Environnement

Éditez `backend-nodejs/.env` :

```env
# PayPal Configuration
PAYPAL_CLIENT_ID=votre_client_id_ici
PAYPAL_CLIENT_SECRET=votre_client_secret_ici

# URLs
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:4200

# Abonnement
FREE_CONVERSATION_LIMIT=5
PRICE_24H=5.00
PRICE_MONTHLY=12.00
PRICE_YEARLY=100.00
```

**Important** :
- En **développement** : Utilisez les clés Sandbox
- En **production** : Utilisez les clés Live

#### 2. Base de Données

La base de données a déjà été mise à jour avec le script :

```bash
cd backend-nodejs/database
mysql -u root -p < update_payment_history_for_paypal.sql
```

Modifications appliquées :
- Colonne `paypal_order_id` ajoutée
- `payment_method` supporte maintenant 'paypal'
- Colonne `subscription_type` pour stocker le type d'abonnement

#### 3. Webhooks PayPal

Les webhooks permettent à PayPal de notifier votre backend des paiements.

**URL du webhook** : `https://votre-domaine.com/api/subscription/webhook`

**Configuration** :

1. Allez sur https://developer.paypal.com/dashboard
2. Sélectionnez votre application
3. Section **Webhooks**
4. Cliquez sur **Add Webhook**
5. Entrez l'URL : `https://votre-domaine.com/api/subscription/webhook`
6. Sélectionnez les événements :
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.CAPTURE.DECLINED`

**Pour développement local** :

Utilisez ngrok pour exposer votre serveur local :

```bash
# Installez ngrok
npm install -g ngrok

# Exposez votre serveur local
ngrok http 3000

# Utilisez l'URL HTTPS générée + /api/subscription/webhook
# Exemple: https://abc123.ngrok.io/api/subscription/webhook
```

### Frontend

#### 1. Configuration du Client ID

Le Client ID PayPal doit être configuré dans le frontend.

Éditez `frontend-angular/src/app/components/subscription/subscription.ts` :

```typescript
async loadPayPalSdk() {
  try {
    const paypal = await loadScript({
      clientId: 'VOTRE_CLIENT_ID_ICI', // Remplacez par votre Client ID
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

**Note** : En production, utilisez une variable d'environnement Angular pour le Client ID.

## Fonctionnement

### Flux de Paiement

```
1. Utilisateur atteint la limite (5 conversations)
   ↓
2. Clique sur "S'abonner"
   ↓
3. Choisit une formule (24h/mensuel/annuel)
   ↓
4. Backend crée une commande PayPal
   ↓
5. Utilisateur redirigé vers PayPal
   ↓
6. Utilisateur se connecte et paie
   ↓
7. PayPal redirige vers l'application
   ↓
8. Backend capture le paiement
   ↓
9. Backend active l'abonnement
   ↓
10. Utilisateur peut accéder aux conversations
```

### Réception des Paiements

Les paiements sont reçus directement sur votre compte PayPal Business.

**Conversion en euros** :
- Les paiements en EUR restent en EUR
- Les paiements en autres devises sont convertis automatiquement
- Frais de conversion : ~3-4%

**Retrait vers compte bancaire** :
- Gratuit dans la zone SEPA
- Délai : 1-3 jours ouvrés

## Test en Mode Sandbox

### Identifiants de Test PayPal

Vous disposez d'un compte de test PayPal pour effectuer des paiements :

**Compte de Test** :
- **Nom d'utilisateur** : [VOS_IDENTIFIANTS_ICI]
- **Mot de passe** : [VOTRE_MOT_DE_PASSE_ICI]

Utilisez ces identifiants lorsque vous êtes redirigé vers la page de paiement PayPal lors des tests.

### Scénario de Test Complet

1. Démarrez le backend :
```bash
cd backend-nodejs
npm run dev
```

2. Démarrez le frontend :
```bash
cd frontend-angular
npm start
```

3. Testez le flux :
   - Créez un compte
   - Matchez avec 5 utilisateurs
   - Démarrez 5 conversations
   - Essayez une 6ème conversation → Prompt de souscription
   - Choisissez une formule
   - Vous serez redirigé vers PayPal Sandbox
   - Connectez-vous avec le compte test Personnel
   - Complétez le paiement
   - Vous serez redirigé vers l'application
   - Vérifiez l'activation de l'abonnement

## API Endpoints

### GET `/api/subscription/status`
Récupère le statut d'abonnement de l'utilisateur.

**Réponse** :
```json
{
  "hasSubscription": false,
  "conversationCount": 3,
  "freeLimit": 5,
  "conversationsRemaining": 2,
  "canAccessNewConversations": true,
  "userConversations": [1, 2, 3]
}
```

### GET `/api/subscription/can-access/:matchId`
Vérifie si l'utilisateur peut accéder à une conversation.

**Réponse** :
```json
{
  "canAccess": true,
  "reason": "free"
}
```

### GET `/api/subscription/plans`
Récupère la liste des formules disponibles.

### POST `/api/subscription/create-order`
Crée une commande PayPal.

**Body** :
```json
{
  "planId": "24h"
}
```

**Réponse** :
```json
{
  "orderId": "5O190127TN364715T"
}
```

### POST `/api/subscription/capture-order`
Capture un paiement PayPal après approbation.

**Body** :
```json
{
  "orderId": "5O190127TN364715T"
}
```

**Réponse** :
```json
{
  "success": true,
  "orderId": "5O190127TN364715T"
}
```

### POST `/api/subscription/webhook`
Endpoint pour recevoir les notifications de PayPal (paiement réussi, échoué, etc.)

## Événements Webhook

PayPal envoie ces événements à votre backend :

- `PAYMENT.CAPTURE.COMPLETED` : Paiement réussi (abonnement activé)
- `PAYMENT.CAPTURE.DENIED` : Paiement refusé
- `PAYMENT.CAPTURE.DECLINED` : Paiement décliné

Seul `PAYMENT.CAPTURE.COMPLETED` active l'abonnement.

## Frais PayPal

**Tarifs pour la France** :
- Paiements nationaux : 1,2% + 0,35€
- Paiements européens : 3,4% + 0,35€
- Paiements internationaux : 4,4% + 0,35€

**Exemple** :
- Abonnement 12€ (France) : 12€ - (12€ × 1,2% + 0,35€) = **11,50€ net**

## Sécurité

### Bonnes Pratiques

1. **Clés API** : Ne partagez JAMAIS vos clés secrètes
2. **HTTPS** : Utilisez toujours HTTPS en production
3. **Webhooks** : Vérifiez toujours la signature des webhooks
4. **Logs** : Surveillez les logs pour détecter les anomalies

### Validation des Webhooks

Le backend vérifie automatiquement les webhooks PayPal. Ne désactivez pas cette vérification.

## Dépannage

### Le paiement ne s'ouvre pas

Vérifiez :
- Client ID correct dans le frontend
- Backend accessible
- Console navigateur pour erreurs JavaScript

### Webhook non reçu

Vérifiez :
- URL webhook correcte dans Dashboard PayPal
- Endpoint accessible publiquement (utilisez ngrok en dev)
- Logs backend pour voir les requêtes
- Événements sélectionnés dans la configuration webhook

### Abonnement non activé après paiement

Vérifiez :
- Logs backend pour erreurs webhook
- Table `payment_history` contient l'entrée
- Table `subscriptions` mise à jour
- Statut de la commande dans Dashboard PayPal

### Erreur "Client ID invalide"

Vérifiez :
- Vous utilisez le bon Client ID (Sandbox vs Live)
- Le Client ID est bien configuré dans le frontend
- L'application PayPal est activée

## Support

- **Documentation PayPal** : https://developer.paypal.com/docs
- **Dashboard** : https://developer.paypal.com/dashboard
- **Support** : https://www.paypal.com/businesshelp

## Checklist de Mise en Production

- [ ] Compte PayPal Business créé et vérifié
- [ ] Compte bancaire ajouté à PayPal
- [ ] Application PayPal créée (mode Live)
- [ ] Clés Live configurées dans `.env`
- [ ] Client ID Live configuré dans le frontend
- [ ] Base de données mise à jour
- [ ] Webhooks configurés avec URL HTTPS
- [ ] Tests en production réussis (petite somme)
- [ ] Monitoring des webhooks actif
- [ ] Logs de paiement configurés

## Passage en Production

1. **Créez une application Live** dans le Dashboard PayPal
2. **Remplacez** les clés Sandbox par les clés Live dans `.env`
3. **Configurez** le Client ID Live dans le frontend
4. **Testez** avec un paiement réel de faible montant
5. **Surveillez** les premiers paiements dans Dashboard PayPal
6. **Vérifiez** que les webhooks fonctionnent correctement

## FAQ

**Q: Puis-je utiliser PayPal sans compte Business ?**
R: Non, un compte Business est obligatoire pour accepter des paiements.

**Q: Les utilisateurs doivent-ils avoir un compte PayPal ?**
R: Non, PayPal permet de payer par carte sans créer de compte.

**Q: Combien de temps pour recevoir les fonds ?**
R: Les fonds sont disponibles immédiatement sur votre compte PayPal. Le retrait vers votre banque prend 1-3 jours.

**Q: PayPal supporte-t-il les abonnements récurrents ?**
R: Oui, mais l'implémentation actuelle utilise des paiements uniques. Les abonnements récurrents nécessitent l'API PayPal Subscriptions.

**Q: Comment gérer les remboursements ?**
R: Connectez-vous au Dashboard PayPal et gérez les remboursements manuellement dans la section Transactions.
