# 🔐 Extension Chrome - Keylogger avec Historique

Extension Chrome qui enregistre en temps réel toutes les touches cliquées par l'utilisateur ainsi que les sites visités pour fournir un historique complet.

## ⚠️ Avertissement Important

**Cette extension enregistre TOUTES les frappes clavier, y compris les mots de passe et informations sensibles.**

- ✅ Usage personnel uniquement
- ✅ Les données sont stockées localement dans votre navigateur
- ❌ Ne partagez jamais cette extension publiquement
- ❌ N'utilisez pas sur des ordinateurs partagés sans autorisation

## ✨ Fonctionnalités

- ⌨️ **Capture en temps réel** : Enregistre toutes les touches cliquées
- 🌐 **Suivi des sites** : Associe chaque frappe au site visité
- 🔍 **Recherche et filtres** : Recherchez dans l'historique par site ou texte
- 📊 **Interface élégante** : Design moderne avec thème sombre
- 📥 **Export des données** : Exportez votre historique en JSON
- 🗑️ **Gestion des données** : Effacez l'historique à tout moment
- 💾 **Stockage local** : Toutes les données restent sur votre machine

## 📦 Installation

### Mode Développeur (Recommandé)

1. **Téléchargez l'extension** :
   - Clonez ou téléchargez ce dossier sur votre ordinateur

2. **Ouvrez Chrome** :
   - Naviguez vers `chrome://extensions/`
   - Ou Menu → Plus d'outils → Extensions

3. **Activez le mode développeur** :
   - Activez le bouton "Mode développeur" en haut à droite

4. **Chargez l'extension** :
   - Cliquez sur "Charger l'extension non empaquetée"
   - Sélectionnez le dossier `keylogger-extension`

5. **Vérifiez l'installation** :
   - L'icône de l'extension devrait apparaître dans la barre d'outils
   - Épinglez-la pour un accès facile

## 🚀 Utilisation

### Démarrage

L'extension commence automatiquement à enregistrer dès qu'elle est installée. Aucune configuration nécessaire !

### Visualiser l'historique

1. Cliquez sur l'icône de l'extension dans la barre d'outils
2. Une popup s'ouvre avec l'historique complet
3. Les touches sont regroupées par site web

### Filtrer l'historique

- **Tout** : Affiche tout l'historique
- **Aujourd'hui** : Affiche uniquement les touches d'aujourd'hui
- **1 heure** : Affiche uniquement la dernière heure

### Rechercher

Utilisez la barre de recherche pour filtrer par :
- Nom du site
- URL
- Touche spécifique

### Exporter les données

1. Cliquez sur le bouton "📥 Exporter"
2. Un fichier JSON sera téléchargé avec toutes vos données
3. Le fichier contient :
   - Toutes les frappes enregistrées
   - Tous les sites visités
   - Statistiques d'utilisation

### Effacer l'historique

1. Cliquez sur le bouton "🗑️ Effacer tout"
2. Confirmez l'action
3. Toutes les données seront supprimées définitivement

## 📁 Structure du Projet

```
keylogger-extension/
├── manifest.json       # Configuration de l'extension (Manifest V3)
├── content.js          # Script de capture des événements clavier
├── background.js       # Service worker pour la gestion des données
├── popup.html          # Interface utilisateur
├── popup.css           # Styles de l'interface
├── popup.js            # Logique de l'interface
├── icon16.png          # Icône 16x16
├── icon48.png          # Icône 48x48
├── icon128.png         # Icône 128x128
└── README.md           # Ce fichier
```

## 🔧 Détails Techniques

### Permissions

L'extension nécessite les permissions suivantes :

- `activeTab` : Pour suivre l'onglet actif
- `tabs` : Pour accéder aux URLs des sites visités
- `storage` : Pour sauvegarder l'historique localement
- `<all_urls>` : Pour injecter le script de capture sur tous les sites

### Stockage

- Les données sont stockées dans `chrome.storage.local`
- Limite : 10 000 entrées maximum (configurable dans `background.js`)
- Les anciennes entrées sont automatiquement supprimées quand la limite est atteinte

### Captures

L'extension capture :
- La touche pressée
- Le code de la touche
- Les modificateurs (Shift, Ctrl, Alt, Cmd)
- L'URL de la page
- Le titre de la page
- L'horodatage précis

## 🛡️ Confidentialité et Sécurité

### Ce que l'extension fait :

✅ Stocke les données **uniquement localement** dans votre navigateur  
✅ Ne transmet **aucune donnée** à des serveurs externes  
✅ Fonctionne **entièrement hors ligne**  
✅ Vous permet d'**exporter et supprimer** vos données à tout moment

### Ce que l'extension ne fait PAS :

❌ N'envoie pas de données sur Internet  
❌ Ne partage pas vos informations  
❌ N'utilise pas de services tiers  
❌ Ne contient pas de publicités ou de trackers

### Recommandations :

- Utilisez cette extension uniquement sur votre ordinateur personnel
- Effacez régulièrement l'historique si vous capturez des informations sensibles
- Ne laissez pas d'autres personnes accéder à votre navigateur avec cette extension active
- Exportez vos données dans un endroit sûr si vous souhaitez les conserver

## 🐛 Dépannage

### L'extension n'enregistre pas les touches

1. Vérifiez que l'extension est activée dans `chrome://extensions/`
2. Rechargez la page web où vous tapez
3. Vérifiez les permissions de l'extension

### L'historique ne s'affiche pas

1. Ouvrez la console de développement (F12)
2. Vérifiez s'il y a des erreurs
3. Essayez de recharger l'extension

### L'extension ralentit le navigateur

1. Effacez l'historique pour libérer de la mémoire
2. Réduisez la limite MAX_ENTRIES dans `background.js`

## 📝 Licence

Ce projet est fourni "tel quel" à des fins éducatives et personnelles uniquement.

## 🤝 Contribution

N'hésitez pas à modifier le code selon vos besoins. Quelques idées d'amélioration :

- Ajouter un mode pause/reprise
- Implémenter des filtres par type de touche
- Ajouter des graphiques de statistiques
- Créer une liste noire de sites à ne pas enregistrer
- Ajouter un chiffrement des données sensibles

## 📧 Support

Pour toute question ou problème, consultez la documentation de Chrome sur les extensions :
https://developer.chrome.com/docs/extensions/

---

**Rappel** : Utilisez cette extension de manière responsable et éthique. Respectez toujours la vie privée des autres.
