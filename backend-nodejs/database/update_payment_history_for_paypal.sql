-- Mise à jour de la table payment_history pour PayPal
USE dating_app;

-- Ajouter la colonne paypal_order_id
ALTER TABLE payment_history
ADD COLUMN IF NOT EXISTS paypal_order_id VARCHAR(255) UNIQUE AFTER stripe_payment_intent_id;

-- Ajouter la colonne subscription_type si elle n'existe pas
ALTER TABLE payment_history
ADD COLUMN IF NOT EXISTS subscription_type VARCHAR(50) AFTER currency;

-- Mettre à jour payment_method pour supporter PayPal
ALTER TABLE payment_history
MODIFY COLUMN payment_method ENUM('stripe', 'paypal', 'card', 'bank_transfer', 'other') DEFAULT 'paypal';

SELECT 'Table payment_history mise à jour pour PayPal' as message;
