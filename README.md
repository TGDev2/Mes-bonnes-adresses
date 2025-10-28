# Mes Bonnes Adresses

Application mobile (Expo/React Native) pour **sauvegarder, gérer et partager** ses adresses favorites, avec **carte centrée automatiquement** sur la position, **adresses publiques/privées**, **commentaires** (avec photos) et **authentification Firebase**.

> **Stack** : Expo SDK 54, React Native 0.81, React 19, Firebase Web SDK 10/12, `react-native-maps`, Jest/Testing Library.  
> **Node requis** : **v20.18.0** (cf. `.nvmrc`)

---

## ✨ Fonctionnalités

- **Authentification** : inscription, connexion, déconnexion.
- **Profil** : upload de **photo de profil** (Storage) et mise à jour du `photoURL`.
- **Carte** : `MapView` centré sur la **localisation** de l’utilisateur, affichage de **mes adresses** et des **adresses publiques** des autres.
- **Adresses** : création (nom, description, **photo**, **public/privé**), suppression (propriétaire).
- **Social** : **commentaires** sur une adresse (texte + photo), suppression de ses propres commentaires, compteur de commentaires.
- **Sécurité** : règles **Firestore** & **Storage** alignées avec le modèle d’autorisations.
- **Tests** : base de tests unitaires/fonctionnels (Jest + Testing Library).

---

## 📦 Prérequis

- **Node.js** `v20.18.0` (recommandé via `nvm`)
- **npm** (ou `pnpm`/`yarn`, les scripts ci-dessous utilisent `npm`)
- **Expo CLI** (fourni par `npx expo`)
- **Compte Firebase** (Firestore & Storage activés) ou variables `EXPO_PUBLIC_*` renseignées

```bash
# Activer la version Node du projet
nvm use

# Installer les dépendances
npm install

```

----------

## 🔧 Configuration Firebase

Le projet lit la configuration via **variables d’environnement** `EXPO_PUBLIC_*` (compatibles Expo).  
Aucune autre configuration n’est nécessaire dans le code.

### Variables requises

Variable

Exemple

`EXPO_PUBLIC_FIREBASE_API_KEY`

`AIza...`

`EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`

`your-project.firebaseapp.com`

`EXPO_PUBLIC_FIREBASE_PROJECT_ID`

`your-project`

`EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`

`your-project.appspot.com`

`EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`

`0123456789`

`EXPO_PUBLIC_FIREBASE_APP_ID`

`1:0123456789:web:abc123`

> Sans ces variables, l’app démarre **en mode dégradé** : les écrans affichent une **bannière** et les opérations Firebase sont **désactivées** (comportement géré par `isFirebaseConfigured`).

### Définir les variables (exemples)

**macOS/Linux (bash/zsh)**

```bash
export EXPO_PUBLIC_FIREBASE_API_KEY=...
export EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
export EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
export EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
export EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
export EXPO_PUBLIC_FIREBASE_APP_ID=...

npm start

```

**Windows PowerShell**

```powershell
$env:EXPO_PUBLIC_FIREBASE_API_KEY="..."
$env:EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
$env:EXPO_PUBLIC_FIREBASE_PROJECT_ID="..."
$env:EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
$env:EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
$env:EXPO_PUBLIC_FIREBASE_APP_ID="..."

npm start

```

----------

## ▶️ Lancer l’application

```bash
# Démarrer Expo (dev server)
npm start

# Raccourcis Expo :
# - 'a' pour Android (émulateur)    - 'i' pour iOS (simulateur)
# - 'w' pour Web (limité pour la carte)

```

> **Permissions** : la première ouverture demandera la permission **Localisation** (centrage carte) et, lors d’un upload, la permission **Photothèque**/**Caméra**.  
> Les descripteurs iOS (NSLocationWhenInUse, NSPhotoLibrary, NSCamera) sont déjà définis dans `app.json`.  
> Android requiert `ACCESS_FINE_LOCATION`/`ACCESS_COARSE_LOCATION` (déclaré).

----------

## 🔐 Sécurité & Règles Firebase

-   **Firestore** : `firestore.rules`
    
    -   Lecture d’une adresse si **publique** ou **propriétaire**.
        
    -   Création/édition/suppression strictement par le **propriétaire** (validations types et champs).
        
    -   Commentaires : lecture si adresse publique ou propriétaire ; création par **utilisateur connecté** (auteur == `auth.uid`) ; suppression par l’**auteur**.
        
-   **Storage** : `storage.rules`
    
    -   Photo **profil** : lecture publique via URL tokenisée ; écriture/suppression par **propriétaire**.
        
    -   Photos **adresses** : lecture réservée aux **utilisateurs connectés** ; écriture/suppression par **propriétaire**.
        
    -   Photos **commentaires** : idem, avec arborescence `addressComments/{addressId}/{userId}/...`.
        

### Déploiement des règles (optionnel)

```bash
# Prérequis : installer et se connecter à Firebase CLI
npm run firebase:login

# Déployer uniquement les règles Firestore & Storage
npm run firebase:deploy:rules

# (La configuration du projet Firebase local peut nécessiter:)
# firebase use --add

```

----------

## 🗺️ Architecture du code

```
tgdev2-mes-bonnes-adresses/
├─ App.tsx                     # Providers (Auth, Navigation) & thème
├─ app.json                    # Expo app config (permissions, EAS placeholder)
├─ firebase.json               # Cible des règles
├─ firestore.rules / storage.rules
├─ src/
│  ├─ context/
│  │  └─ AuthContext.tsx       # État utilisateur + helpers (signIn/up/out)
│  ├─ hooks/
│  │  └─ useUserLocation.ts    # Localisation + permissions
│  ├─ lib/
│  │  └─ firebase.ts           # Initialisation app/auth/db/storage + flag config
│  ├─ navigation/
│  │  └─ RootNavigator.tsx     # Auth flow vs App tabs (Carte/Profil)
│  ├─ screens/
│  │  ├─ MapScreen.tsx         # Carte + markers + fiche overlay
│  │  ├─ AddAddressScreen.tsx  # Création adresse (nom/desc/photo/visibilité)
│  │  ├─ AddressDetailScreen.tsx# Détails + commentaires (CRUD auteur)
│  │  ├─ ProfileScreen.tsx     # Profil + upload photo
│  │  ├─ SignIn/SignUpScreen.tsx
│  │  └─ __tests__/...         # Tests unitaires/fonctionnels
│  ├─ services/
│  │  ├─ addressService.ts     # Firestore/Storage pour adresses
│  │  ├─ commentService.ts     # Firestore/Storage pour commentaires
│  │  └─ userService.ts        # Upload photo profil
│  └─ types/
│     ├─ env.d.ts              # Déclaration process.env pour Expo
│     └─ models.ts             # Types Address/Comment

```

### Modèle de données (TypeScript)

```ts
type Address = {
  id: string; userId: string;
  name: string; description?: string;
  isPublic: boolean; photoUrl?: string | null;
  latitude: number; longitude: number;
  createdAt?: number;
};

type Comment = {
  id: string; addressId: string; userId: string;
  authorEmail?: string | null;
  text: string; photoUrl?: string | null;
  createdAt?: number;
};

```

----------

## 🧪 Tests

### Unitaires/Fonctionnels (Jest + Testing Library)

```bash
npm test

```

-   Fichiers de test : `src/screens/__tests__/...`
    
    -   `SignInScreen.test.tsx` : appelle `signIn`, bannière config manquante
        
    -   `MapScreen.test.tsx` : affiche message permission refusée
        
    -   `AddAddressScreen.test.tsx` : activation bouton & payload `createAddress`
        
-   Setup : `jest-expo`, `jest.setup.ts` (mocks Expo ImagePicker, react-native-maps)
    

> **TypeScript & Qualité**

```bash
npm run typecheck
npm run lint

```

----------

## 🚀 Utilisation (parcours type)

1.  **Créer un compte** (ou se connecter)
    
2.  Accorder la **permission de localisation** → la carte se centre automatiquement
    
3.  Appuyer sur le **FAB** pour **Ajouter une adresse** :
    
    -   Renseigner **Nom**, optionnellement **Description**
        
    -   Choisir **Public/Privé**
        
    -   **Photo** (galerie/caméra)
        
4.  Appuyer sur un **marqueur** → **fiche** → **Commentaires** :
    
    -   Ajouter un **commentaire** (texte + photo)
        
    -   Supprimer **ses propres** commentaires
        
5.  **Supprimer** une adresse dont on est **propriétaire** (depuis la fiche)