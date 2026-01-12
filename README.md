# 💣 Démineur - Farcaster Mini App

Un jeu de démineur classique en tant que Mini App Farcaster avec classement des meilleurs scores.

## 🎮 Fonctionnalités

- **3 niveaux de difficulté** : Facile (8x8, 10 mines), Moyen (12x12, 30 mines), Difficile (16x16, 60 mines)
- **Contrôles tactiles** : Tap pour révéler, long press pour placer un drapeau
- **Timer** : Chronométrez votre partie
- **Classement** : Compétition avec les autres joueurs Farcaster
- **Sauvegarde des meilleurs scores** : Seul votre meilleur temps par difficulté est conservé

## 🚀 Installation

```bash
# Cloner le projet
cd minesweeper-farcaster

# Installer les dépendances
npm install

# Lancer le serveur
npm start
```

Le serveur démarre sur `http://localhost:3001`

## 📁 Structure du projet

```
minesweeper-farcaster/
├── public/
│   ├── index.html      # Interface du jeu
│   ├── styles.css      # Styles et animations
│   └── app.js          # Logique du jeu + SDK Farcaster
├── server/
│   ├── server.js       # Serveur Express
│   ├── db/
│   │   └── database.js # Base de données SQLite
│   └── routes/
│       ├── scores.js   # API des scores
│       └── manifest.js # Manifest Farcaster
├── package.json
└── README.md
```

## 🔌 API Endpoints

### Scores

- `GET /api/scores/:difficulty` - Récupérer le top 10 d'une difficulté
- `GET /api/scores/user/:fid` - Récupérer les scores d'un utilisateur
- `POST /api/scores` - Sauvegarder un score
  ```json
  {
    "userFid": 12345,
    "username": "alice",
    "difficulty": "easy",
    "time": 42
  }
  ```

### Manifest Farcaster

- `GET /.well-known/farcaster.json` - Manifest de la Mini App

## 🎯 Comment jouer

1. **Révéler une case** : Cliquez ou tapez sur une case
2. **Placer un drapeau** : Clic droit (desktop) ou long press (mobile)
3. **Les chiffres** : Indiquent le nombre de mines dans les 8 cases adjacentes
4. **Gagner** : Révélez toutes les cases sans mines
5. **Perdre** : Cliquez sur une mine 💥

## 🏆 Système de scores

- Seul votre meilleur temps par niveau de difficulté est sauvegardé
- Le classement affiche les 10 meilleurs joueurs par difficulté
- Votre FID Farcaster est utilisé pour l'identification

## 🛠️ Déploiement

### Variables d'environnement

- `PORT` - Port du serveur (défaut: 3001)
- `APP_URL` - URL publique de l'app (pour le manifest)

### Déployer sur Vercel/Railway

1. Connectez votre repo GitHub
2. Configurez la variable `APP_URL`
3. Déployez !

## 📱 Enregistrer la Mini App sur Farcaster

1. Déployez l'application
2. Modifiez le manifest dans `server/routes/manifest.js` avec vos vraies credentials
3. Utilisez le [Farcaster Developer Portal](https://warpcast.com/~/developers) pour enregistrer votre app

## 📄 License

MIT
