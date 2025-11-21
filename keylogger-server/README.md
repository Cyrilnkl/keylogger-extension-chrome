# Serveur Keylogger - Stockage en Fichiers TXT

Serveur Node.js qui reçoit les données de l'extension et crée des fichiers TXT lisibles par humain, organisés par site web.

## 🚀 Installation et Démarrage

```bash
cd keylogger-server
npm install
npm start
```

## 📁 Organisation des Fichiers

Les données sont stockées dans le dossier `logs/` avec un fichier TXT par session de navigation :

```
logs/
├── google.com_search_2025-11-21T10-30-00.txt
├── youtube.com_watch_2025-11-21T10-35-00.txt
└── github.com_repo_2025-11-21T10-40-00.txt
```

## 📄 Format des Fichiers TXT

Chaque fichier contient un tableau formaté avec :

1. **Informations de session** : Site, URL, durée, nombre de touches
2. **Texte reconstruit** : Ce qui a été tapé, lisible
3. **Tableau détaillé** : Chaque touche avec heure, input, modificateurs

## 📡 API Endpoints

### POST /batch-data
Reçoit une session complète de navigation
```json
{
  "url": "https://google.com",
  "title": "Google",
  "startTime": "2025-11-21T10:00:00Z",
  "endTime": "2025-11-21T10:05:00Z",
  "keystrokes": [...]
}
```

### GET /logs
Liste tous les fichiers de logs créés

### GET /stats
Statistiques : nombre de sessions, taille totale

## 🔄 Fonctionnement

1. L'extension envoie les données **à chaque changement d'URL**
2. Le serveur crée un **nouveau fichier TXT** pour chaque session
3. Les fichiers sont **lisibles directement** dans un éditeur de texte
4. Format **tableau** pour une lecture facile

## 📂 Exemple de Fichier Généré

```
═══════════════════════════════════════════════════════════
  HISTORIQUE DES TOUCHES CLIQUÉES
═══════════════════════════════════════════════════════════

┌─ INFORMATIONS DE LA SESSION ─────────────────────────────┐
│ Site Web    : Google
│ URL         : https://www.google.com
│ Début       : 21/11/2025 10:30:00
│ Durée       : 45 secondes
│ Touches     : 12 touches
└──────────────────────────────────────────────────────────┘

┌─ TEXTE SAISI ────────────────────────────────────────────┐
│ hello world
└──────────────────────────────────────────────────────────┘

┌─ DÉTAIL DES TOUCHES ─────────────────────────────────────┐
│ Heure      │ Touche  │ Input  │ Modificateurs │
├────────────┼─────────┼────────┼───────────────┤
│ 10:30:01   │ h       │ input  │ -             │
│ 10:30:02   │ e       │ input  │ -             │
...
└────────────┴─────────┴────────┴───────────────┘
```
