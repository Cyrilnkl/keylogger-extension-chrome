const express = require('express');
const archiver = require('archiver');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname)));

// Route pour télécharger l'extension
app.get('/download-extension', (req, res) => {
    const extensionPath = path.join(__dirname, 'extension');
    
    // Vérifier que le dossier existe
    if (!fs.existsSync(extensionPath)) {
        return res.status(404).send('Extension folder not found');
    }

    // Créer un fichier ZIP
    const archive = archiver('zip', {
        zlib: { level: 9 } // Compression maximale
    });

    // Nom du fichier téléchargé
    res.attachment('taskflow-extension.zip');

    // Pipe l'archive dans la réponse
    archive.pipe(res);

    // Ajouter tout le contenu du dossier extension
    archive.directory(extensionPath, 'taskflow-extension');

    // Finaliser l'archive
    archive.finalize();

    archive.on('error', (err) => {
        console.error('Archive error:', err);
        res.status(500).send('Error creating archive');
    });
});

app.listen(PORT, () => {
    console.log(`Landing page server running at http://localhost:${PORT}`);
    console.log(`Visit http://localhost:${PORT}/index.html`);
});
