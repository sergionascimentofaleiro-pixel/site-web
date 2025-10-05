# Test Accounts

Après avoir exécuté `./seed-db.sh`, vous pouvez vous connecter avec ces comptes de test.

**Mot de passe pour tous les comptes : `Test123!`**

## 👨 Hommes (20 profils)

| Email | Prénom | Âge | Ville | Profession/Bio |
|-------|--------|-----|-------|----------------|
| john.smith@test.com | John | 30 | Paris | Software engineer - Hiking & Photography |
| michael.jones@test.com | Michael | 33 | Lyon | Personal trainer - Fitness enthusiast |
| david.wilson@test.com | David | 35 | Marseille | Music producer |
| james.brown@test.com | James | 31 | Bordeaux | Chef passionate about gastronomy |
| robert.taylor@test.com | Robert | 37 | Nice | Entrepreneur - 30+ countries visited |
| william.anderson@test.com | William | 29 | Paris | Graphic designer |
| thomas.martin@test.com | Thomas | 32 | Lille | Architect |
| charles.garcia@test.com | Charles | 34 | Toulouse | Doctor |
| daniel.martinez@test.com | Daniel | 36 | Strasbourg | Lawyer |
| matthew.rodriguez@test.com | Matthew | 30 | Grenoble | Professional cyclist |
| christopher.lee@test.com | Christopher | 33 | Nantes | Teacher |
| andrew.clark@test.com | Andrew | 31 | Brest | Marine biologist |
| joshua.lewis@test.com | Joshua | 35 | Paris | Video game developer |
| ryan.walker@test.com | Ryan | 32 | Lyon | Pilot |
| brandon.hall@test.com | Brandon | 29 | Paris | Fashion photographer |
| kevin.young@test.com | Kevin | 34 | Bordeaux | Sommelier |
| justin.king@test.com | Justin | 31 | Marseille | Firefighter |
| benjamin.wright@test.com | Benjamin | 36 | Nice | Veterinarian |
| samuel.scott@test.com | Samuel | 30 | Paris | Marketing manager |
| alexander.green@test.com | Alexander | 33 | Lyon | Historian |

## 👩 Femmes (20 profils)

| Email | Prénom | Âge | Ville | Profession/Bio |
|-------|--------|-----|-------|----------------|
| emma.johnson@test.com | Emma | 31 | Paris | Yoga instructor |
| olivia.williams@test.com | Olivia | 32 | Lyon | Travel blogger - 40+ countries |
| sophia.davis@test.com | Sophia | 34 | Marseille | Pediatrician |
| isabella.miller@test.com | Isabella | 30 | Paris | Fashion designer |
| mia.wilson@test.com | Mia | 33 | Nice | Professional dancer |
| charlotte.moore@test.com | Charlotte | 35 | Grenoble | Environmental scientist |
| amelia.taylor@test.com | Amelia | 29 | Paris | Baker |
| harper.anderson@test.com | Harper | 31 | Bordeaux | Journalist |
| evelyn.thomas@test.com | Evelyn | 32 | Toulouse | Psychologist |
| abigail.jackson@test.com | Abigail | 36 | Paris | Interior designer |
| emily.white@test.com | Emily | 30 | Lyon | Musician (piano & violin) |
| madison.harris@test.com | Madison | 34 | Marseille | Marine photographer |
| elizabeth.martin@test.com | Elizabeth | 31 | Paris | Software developer |
| sofia.garcia@test.com | Sofia | 33 | Nice | Flight attendant |
| avery.martinez@test.com | Avery | 35 | Bordeaux | Yoga instructor |
| ella.robinson@test.com | Ella | 29 | Paris | Florist |
| scarlett.clark@test.com | Scarlett | 32 | Lyon | Event planner |
| grace.rodriguez@test.com | Grace | 34 | Grenoble | Renewable energy researcher |
| chloe.lewis@test.com | Chloe | 30 | Bordeaux | Sommelier |
| victoria.lee@test.com | Victoria | 33 | Paris | Art curator |

## 🧪 Scénarios de test

1. **Créer un nouveau compte** : Utilisez n'importe quel email non listé ci-dessus
2. **Tester le matching** :
   - Connectez-vous avec un compte homme
   - Allez sur "Discover" et likez des profils femmes
   - Connectez-vous avec un compte femme
   - Likez le même profil homme → Match !
3. **Tester la messagerie** :
   - Après avoir créé un match, allez sur "Matches"
   - Cliquez sur le match pour ouvrir le chat
   - Envoyez des messages

## 📸 Photos

Les profils utilisent des avatars de [Pravatar.cc](https://pravatar.cc/) - un service d'avatars de démonstration.

## 🔄 Réinitialiser les données

Pour effacer et recréer toutes les données :

```bash
cd backend-nodejs/database
./reset-db.sh
./seed-db.sh
```
