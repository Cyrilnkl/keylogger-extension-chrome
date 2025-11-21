// Configuration du serveur
const SERVER_CONFIG = {
    enabled: true, // Mettre à false pour désactiver l'envoi au serveur
    url: 'http://localhost:4000',
    endpoints: {
        keystroke: '/keystroke',
        pageVisit: '/page-visit'
    }
};
