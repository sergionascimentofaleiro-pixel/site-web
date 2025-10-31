# Capacitor - Déploiement Mobile

Ce document explique comment builder et déployer l'application Curvy sur iOS et Android avec Capacitor.

## Installation et Configuration

Capacitor a été installé et configuré dans le projet. Les dossiers `android/` et `ios/` contiennent les projets natifs.

### Packages installés

```bash
@capacitor/core
@capacitor/cli
@capacitor/android
@capacitor/ios
@capacitor/splash-screen
```

### Configuration

Le fichier `capacitor.config.ts` contient la configuration principale :
- **App ID**: `com.curvy.app`
- **App Name**: Curvy
- **Web Dir**: `dist/frontend-angular/browser`

## Workflow de Développement

### 1. Build de l'application Angular

```bash
npm run build
```

Cela génère les fichiers dans `dist/frontend-angular/browser/`.

### 2. Synchroniser avec les plateformes natives

Après chaque build ou modification du code web :

```bash
# Copier les fichiers web vers les projets natifs
npx cap sync

# Ou synchroniser une plateforme spécifique
npx cap sync android
npx cap sync ios
```

### 3. Ouvrir les projets natifs

#### Android (Android Studio)

```bash
npx cap open android
```

Cela ouvre le projet dans Android Studio. Vous pouvez ensuite :
- Build l'APK ou l'AAB
- Tester sur émulateur ou appareil
- Publier sur Google Play Store

**Prérequis Android** :

### Installation sur Ubuntu

#### 1. Installer Java JDK 17+

```bash
# Mettre à jour les paquets
sudo apt update

# Installer OpenJDK 17
sudo apt install -y openjdk-17-jdk

# Vérifier l'installation
java -version
# Devrait afficher : openjdk version "17.x.x"
```

#### 2. Installer Android Studio

**Via Snap (Recommandé)** :
```bash
sudo snap install android-studio --classic

# Lancer Android Studio
android-studio
```

**Via Téléchargement Manuel** :
1. Télécharger depuis : https://developer.android.com/studio
2. Extraire : `sudo tar -xzf android-studio-*-linux.tar.gz -C /opt/`
3. Lancer : `/opt/android-studio/bin/studio.sh`

#### 3. Configuration Initiale Android Studio

Au premier lancement :
1. Choisir **"Standard"** installation
2. Accepter les licences Android SDK
3. Android Studio va télécharger les composants (5-15 min)

#### 4. Installer Android SDK 33+

Dans Android Studio → **More Actions** → **SDK Manager** :

**SDK Platforms** :
- ✅ Android 13.0 (Tiramisu) - API 33
- ✅ Android 14.0 (UpsideDownCake) - API 34 (recommandé)

**SDK Tools** :
- ✅ Android SDK Build-Tools 34
- ✅ Android SDK Command-line Tools
- ✅ Android Emulator
- ✅ Android SDK Platform-Tools

Cliquer **Apply** → **OK**

#### 5. Configurer Variables d'Environnement

```bash
# Ouvrir ~/.bashrc
nano ~/.bashrc

# Ajouter à la fin (adapter le chemin si installé via Snap) :
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin

# Si installé via Snap, utiliser :
# export ANDROID_HOME=$HOME/snap/android-studio/common/Android/Sdk

# Sauvegarder (Ctrl+X, Y, Entrée) et recharger
source ~/.bashrc

# Vérifier
echo $ANDROID_HOME
adb --version
```

#### 6. Accepter les Licences SDK

```bash
$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses
# Taper 'y' pour accepter toutes les licences
```

#### 7. Activer KVM (Accélération Émulateur - Optionnel)

```bash
# Installer KVM
sudo apt install -y qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils

# Ajouter user au groupe kvm
sudo adduser $USER kvm

# Redémarrer la session pour appliquer
```

#### 8. Vérifier l'Installation

```bash
java -version        # ✅ OpenJDK 17
echo $ANDROID_HOME   # ✅ Chemin SDK
adb version          # ✅ ADB installé
```

**✅ Prêt pour Android !**

#### iOS (Xcode)

```bash
npx cap open ios
```

Cela ouvre le projet dans Xcode. Vous pouvez ensuite :
- Build l'application
- Tester sur simulateur ou appareil
- Publier sur Apple App Store

**Prérequis iOS** :
- macOS avec Xcode (dernière version)
- CocoaPods : `sudo gem install cocoapods`
- Apple Developer Account (99$/an)

## Configuration des Icônes et Splash Screens

### Méthode Recommandée : @capacitor/assets

```bash
# Installer l'outil
npm install -g @capacitor/assets

# Placer vos images source dans resources/
# - icon.png (1024x1024, PNG avec transparence)
# - splash.png (2732x2732, PNG centré)

# Générer automatiquement toutes les icônes et splash screens
npx capacitor-assets generate
```

### Méthode Manuelle

Placez vos icônes dans :
- **Android** : `android/app/src/main/res/`
  - `mipmap-hdpi/` : 72x72
  - `mipmap-mdpi/` : 48x48
  - `mipmap-xhdpi/` : 96x96
  - `mipmap-xxhdpi/` : 144x144
  - `mipmap-xxxhdpi/` : 192x192

- **iOS** : `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
  - Multiples tailles de 20x20 à 1024x1024

## Permissions et Configuration Native

### Android - AndroidManifest.xml

Fichier : `android/app/src/main/AndroidManifest.xml`

Permissions importantes pour l'app de dating :

```xml
<!-- Internet (déjà inclus) -->
<uses-permission android:name="android.permission.INTERNET" />

<!-- Accès réseau -->
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- Notifications push (optionnel) -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<!-- Localisation (pour matching géographique) -->
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />

<!-- Appareil photo (upload de photos) -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" android:required="false" />

<!-- Accès aux photos -->
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
    android:maxSdkVersion="32" />
```

### iOS - Info.plist

Fichier : `ios/App/App/Info.plist`

Descriptions pour les permissions :

```xml
<!-- Appareil photo -->
<key>NSCameraUsageDescription</key>
<string>Curvy needs access to your camera to take profile photos.</string>

<!-- Galerie photo -->
<key>NSPhotoLibraryUsageDescription</key>
<string>Curvy needs access to your photo library to select profile photos.</string>

<!-- Localisation -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>Curvy uses your location to show you matches nearby.</string>

<key>NSLocationAlwaysUsageDescription</key>
<string>Curvy uses your location to show you matches nearby.</string>
```

## Configuration Backend pour Apps Mobiles

### ✅ Configuration CORS (Déjà Faite)

Le backend a été configuré pour accepter les requêtes des apps mobiles en plus du site web.

**Origines autorisées** (dans `backend-nodejs/src/server.js`) :
- `http://localhost:4200` - Développement web local
- `https://curvy-wine.vercel.app` - Site web production
- `capacitor://localhost` - Apps iOS
- `http://localhost` - Apps Android
- `ionic://localhost` - Alternative Capacitor
- IPs locales (192.168.x.x, 10.x.x.x) - Tests sur réseau local

**Comment ça fonctionne** :
```javascript
// Les apps mobiles font des requêtes HTTP depuis :
// - iOS: capacitor://localhost
// - Android: http://localhost

// Le backend valide l'origine et accepte la requête
// Pas besoin de configuration supplémentaire côté mobile !
```

### Architecture Mobile vs Web

```
┌─────────────────────────────────────────────────────────┐
│                    UTILISATEURS                         │
└─────────────────────────────────────────────────────────┘
           │                            │
           │                            │
    📱 Apps Mobiles              🌐 Site Web
    (iOS/Android)                (Navigateur)
           │                            │
           │                            │
    Code Angular                  Code Angular
    LOCAL dans l'app          chargé depuis Vercel
    (capacitor://localhost)   (https://curvy-wine.vercel.app)
           │                            │
           └────────────┬───────────────┘
                        │
                        │ HTTP/HTTPS API Calls
                        ↓
            ☁️ Backend Fly.io
            https://curvy-backend.fly.dev
                        │
                        ↓
                  🗄️ PostgreSQL
```

**Points Importants** :
- ✅ Les apps mobiles **ne contactent JAMAIS** Vercel
- ✅ Les apps mobiles contiennent le code Angular **embarqué localement**
- ✅ Tous (web + mobile) appellent le même backend Fly.io
- ✅ Le CORS backend accepte les deux types de requêtes

### Cleartext Traffic (Android)

**⚠️ Configuration Actuelle** : `android:usesCleartextTraffic="true"` dans `AndroidManifest.xml`

**Pourquoi activé** :
- Permet de tester avec backend local HTTP (`http://localhost:3000`)
- Utile pour développement et debug

**⚠️ AVANT PUBLICATION Google Play** :
```xml
<!-- RETIRER cette ligne en production -->
<application
    ...
    android:usesCleartextTraffic="true">  <!-- SUPPRIMER CETTE LIGNE -->
```

**Pourquoi le retirer** :
- Le backend Fly.io utilise déjà HTTPS
- Google Play Store préfère les apps sécurisées
- Pas nécessaire en production

### URLs Backend

L'app mobile détecte automatiquement l'environnement :

**Développement** : `http://localhost:3000/api`
- Quand l'app tourne sur émulateur/simulateur avec backend local

**Production** : `https://curvy-backend.fly.dev/api`
- Quand l'app est buildée et installée depuis les stores
- Détecté automatiquement dans `environment.ts`

Aucune configuration supplémentaire requise !

## Build pour Production

### Android - Google Play Store

1. **Build l'Android App Bundle (AAB)** :
   ```bash
   cd android
   ./gradlew bundleRelease
   ```

2. **Fichier généré** : `android/app/build/outputs/bundle/release/app-release.aab`

3. **Signer l'app** :
   - Créer un keystore : `keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000`
   - Configurer dans `android/app/build.gradle`

4. **Upload sur Google Play Console** :
   - https://play.google.com/console
   - Créer une nouvelle application
   - Upload l'AAB
   - Remplir les informations (descriptions, screenshots, etc.)
   - Soumettre pour review

**Coût** : 25$ (paiement unique) pour compte développeur Google Play

### iOS - Apple App Store

1. **Configurer le provisioning profile** dans Xcode :
   - Ouvrir le projet : `npx cap open ios`
   - Sélectionner l'équipe de développement
   - Configurer le Bundle Identifier : `com.curvy.app`

2. **Archive l'application** :
   - Dans Xcode : Product > Archive
   - Validate App
   - Distribute App > App Store Connect

3. **Upload sur App Store Connect** :
   - https://appstoreconnect.apple.com
   - Créer une nouvelle app
   - Remplir les métadonnées
   - Upload les screenshots (multiples tailles requises)
   - Soumettre pour review

**Coût** : 99$/an pour compte Apple Developer

## Live Reload (Développement)

Pour tester l'app sur appareil avec live reload :

1. **Démarrer le serveur Angular** :
   ```bash
   npm start
   ```

2. **Modifier capacitor.config.ts** :
   ```typescript
   server: {
     url: 'http://192.168.1.X:4200', // Votre IP locale
     cleartext: true
   }
   ```

3. **Sync et run** :
   ```bash
   npx cap sync
   npx cap run android --livereload
   # ou
   npx cap run ios --livereload
   ```

## Plugins Capacitor Utiles

### Déjà Installé
- `@capacitor/splash-screen` - Écran de démarrage

### À Considérer
```bash
# Appareil photo
npm install @capacitor/camera

# Géolocalisation
npm install @capacitor/geolocation

# Notifications push
npm install @capacitor/push-notifications

# File system (upload photos)
npm install @capacitor/filesystem

# App state (foreground/background)
npm install @capacitor/app

# Keyboard
npm install @capacitor/keyboard

# Status Bar
npm install @capacitor/status-bar

# Haptics (vibrations)
npm install @capacitor/haptics
```

## Scripts NPM Utiles

Ajouter dans `package.json` :

```json
{
  "scripts": {
    "cap:sync": "npx cap sync",
    "cap:android": "npm run build && npx cap sync android && npx cap open android",
    "cap:ios": "npm run build && npx cap sync ios && npx cap open ios",
    "cap:build": "npm run build && npx cap sync"
  }
}
```

## Problèmes Courants

### Android

**Erreur Gradle** :
```bash
cd android
./gradlew clean
./gradlew build
```

**Port 3000 déjà utilisé** : Vérifier que le backend local n'utilise pas le même port

### iOS

**CocoaPods** :
```bash
cd ios/App
pod install
```

**Code signing** : Configurer votre Apple Developer account dans Xcode

## Ressources

- [Documentation Capacitor](https://capacitorjs.com/)
- [Google Play Console](https://play.google.com/console)
- [App Store Connect](https://appstoreconnect.apple.com/)
- [Android Studio](https://developer.android.com/studio)
- [Xcode](https://developer.apple.com/xcode/)

## Checklist Avant Publication

### Android
- [ ] Tester sur multiples tailles d'écran
- [ ] Vérifier toutes les permissions
- [ ] Optimiser la taille de l'APK/AAB
- [ ] Préparer screenshots (phone, tablet, 7")
- [ ] Créer feature graphic (1024x500)
- [ ] Rédiger description (court + long)
- [ ] Définir catégorie et rating de contenu
- [ ] Politique de confidentialité (URL requise)

### iOS
- [ ] Tester sur simulateurs iPhone et iPad
- [ ] Vérifier tous les points de l'App Store Review Guidelines
- [ ] Préparer screenshots (6.5", 5.5", iPad Pro)
- [ ] Créer icône App Store (1024x1024)
- [ ] Rédiger description et keywords
- [ ] Définir catégorie et age rating
- [ ] Politique de confidentialité (URL requise)
- [ ] Support URL

## Notes Importantes

- **Backend API** : S'assurer que le backend Fly.io est accessible (CORS configuré)
- **HTTPS** : iOS nécessite HTTPS pour toutes les requêtes API (sauf configuration ATS)
- **Environnement** : Utiliser les variables d'environnement pour production vs développement
- **Versions** : Incrémenter `version` et `versionCode`/`versionNumber` à chaque release
