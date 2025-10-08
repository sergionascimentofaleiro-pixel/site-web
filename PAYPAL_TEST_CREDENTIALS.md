# Identifiants de Test PayPal

## Compte de Test Sandbox

Utilisez ces identifiants pour tester les paiements en mode Sandbox.

**Nom d'utilisateur** : _[Ajoutez votre nom d'utilisateur de test ici]_

**Mot de passe** : _[Ajoutez votre mot de passe de test ici]_

## Comment utiliser

1. Lancez l'application (backend + frontend)
2. Créez un compte utilisateur dans l'application
3. Créez 5 conversations pour atteindre la limite gratuite
4. Tentez de créer une 6ème conversation
5. Sélectionnez une formule d'abonnement
6. Vous serez redirigé vers PayPal
7. **Connectez-vous avec les identifiants ci-dessus**
8. Complétez le paiement
9. Vous serez redirigé vers l'application
10. L'abonnement sera activé automatiquement

## Configuration des Clés API

N'oubliez pas de configurer vos clés API PayPal :

### Backend (.env)
```env
PAYPAL_CLIENT_ID=votre_client_id_sandbox
PAYPAL_CLIENT_SECRET=votre_client_secret_sandbox
```

### Frontend (subscription.ts ligne 72)
```typescript
clientId: 'VOTRE_CLIENT_ID_SANDBOX'
```

## Ressources

- Dashboard PayPal : https://developer.paypal.com/dashboard
- Documentation : https://developer.paypal.com/docs
