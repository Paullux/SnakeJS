# Snake JS — Nokia 3310

> 🎮 Jeu Snake style Nokia 3310, hébergé sur GitHub Pages avec tableau des meilleurs scores sur GitHub Gist.

**[▶ Jouer maintenant](https://YOUR_USERNAME.github.io/SnakeJS)**

---

## Contrôles

| Clavier | Action |
|---------|--------|
| `↑ ↓ ← →` ou `W A S D` | Déplacer le serpent |
| `Entrée` / `OK` | Démarrer / Valider |
| `Echap` / `P` | Pause |
| `🏆` (bouton) | Leaderboard |

---

## Configuration du Leaderboard

Le tableau des scores est stocké dans un **GitHub Gist**. Le token d'accès est injecté à la compilation, jamais exposé dans le code source.

### 1. Créer le Gist

1. Aller sur [gist.github.com](https://gist.github.com)
2. Créer un nouveau Gist **public** nommé `snake_scores.json` avec le contenu :
   ```json
   []
   ```
3. Copier l'**ID du Gist** depuis l'URL (ex: `a1b2c3d4e5f6...`)

### 2. Créer un Personal Access Token (PAT)

1. Aller dans **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens**
2. Créer un token avec :
   - **Scope** : `gist` uniquement (pas d'accès au repo)
   - **Expiration** : selon vos préférences
3. Copier le token généré

### 3. Ajouter les variables dans GitHub Actions

Dans votre repo GitHub → **Settings → Secrets and variables → Actions → Variables** :

| Nom | Valeur |
|-----|--------|
| `GIST_TOKEN` | Le PAT créé à l'étape 2 |
| `GIST_ID` | L'ID du Gist créé à l'étape 1 |

> [!NOTE]
> Ces valeurs sont des **Variables** (non des Secrets). Le token PAT avec scope `gist` uniquement ne donne accès à aucune donnée sensible de votre compte.

### 4. Activer GitHub Pages

Dans **Settings → Pages** :
- Source : **GitHub Actions**

Poussez sur `main` — le workflow déploiera automatiquement le jeu.

---

## Architecture

```
SnakeJS/
├── index.html          # Shell Nokia 3310 + Canvas
├── style.css           # Design LCD, joystick, corps téléphone
├── game.js             # Logique Snake (grille 42×36)
├── leaderboard.js      # Lecture/écriture GitHub Gist
└── .github/
    └── workflows/
        └── deploy.yml  # Inject token + deploy GitHub Pages
```

---

## Développement local

```bash
npx -y serve .
```

Ouvrir `http://localhost:3000` — le leaderboard affichera des données mock (aucun token requis).
