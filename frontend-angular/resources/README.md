# Resources - Icônes et Splash Screens

Ce dossier contient les assets source pour générer les icônes et splash screens de l'application mobile.

## Fichiers Requis

### icon.png
- **Taille** : 1024x1024 pixels
- **Format** : PNG avec transparence (canal alpha)
- **Contenu** : Logo de l'application centré
- **Marges** : Laisser 20% de marge sur les bords (l'icône sera recadrée différemment selon les plateformes)

### splash.png
- **Taille** : 2732x2732 pixels (ou minimum 2048x2048)
- **Format** : PNG
- **Contenu** : Logo centré sur fond coloré
- **Background** : Utiliser la couleur `#FF69B4` (rose Curvy) comme défini dans capacitor.config.ts

## Génération Automatique

Une fois que vous avez placé `icon.png` et `splash.png` dans ce dossier, exécutez :

```bash
# Installer l'outil (une seule fois)
npm install -g @capacitor/assets

# Générer toutes les icônes et splash screens
npx capacitor-assets generate
```

Cela va automatiquement générer :
- Toutes les tailles d'icônes pour Android (hdpi, mdpi, xhdpi, xxhdpi, xxxhdpi)
- Toutes les tailles d'icônes pour iOS (20x20 à 1024x1024)
- Tous les splash screens adaptés à chaque plateforme

## Vérification

Après génération, vérifiez :
- `android/app/src/main/res/mipmap-*/` - Icônes Android
- `ios/App/App/Assets.xcassets/AppIcon.appiconset/` - Icônes iOS
- `android/app/src/main/res/drawable*/` - Splash screens Android
- `ios/App/App/Assets.xcassets/Splash.imageset/` - Splash screens iOS

## Conseils de Design

### Icône
- Simple et reconnaissable
- Éviter le texte (illisible en petite taille)
- Contraste élevé
- Tester en différentes tailles

### Splash Screen
- Cohérent avec la charte graphique de l'app
- Logo centré, pas trop grand (max 40% de l'écran)
- Éviter trop de détails ou de texte
- Prévoir le "safe area" pour les écrans avec encoche

## Outils de Design

- [Figma](https://figma.com) - Design collaboratif
- [Adobe Illustrator](https://adobe.com/illustrator) - Design vectoriel
- [Canva](https://canva.com) - Templates d'icônes
- [App Icon Generator](https://appicon.co/) - Générateur en ligne

## Couleurs Curvy

- **Primary**: #FF69B4 (HotPink)
- **Background**: #FFFFFF (White)
- **Text**: #333333 (Dark Gray)
