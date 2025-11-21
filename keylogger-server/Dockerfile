FROM node:20-alpine

WORKDIR /app

# Copier package files
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY . .

# Créer les dossiers nécessaires
RUN mkdir -p logs data

# Exposer le port
EXPOSE 4000

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=4000

# Démarrer le serveur
CMD ["node", "server.js"]
