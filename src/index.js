const express = require('express');
const { Octokit } = require('@octokit/rest');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});

// Función para convertir bytes a unidades legibles
function formatBytes(bytes) {
    if (bytes >= 1e9) return (bytes / 1e9).toFixed(2) + ' GB';
    if (bytes >= 1e6) return (bytes / 1e6).toFixed(2) + ' MB';
    if (bytes >= 1e3) return (bytes / 1e3).toFixed(2) + ' KB';
    return bytes + ' Bytes';
}

app.get("/stats/:username", async (req, res) => {
    const username = req.params.username;
    const themeName = req.query.theme || 'default';
    const columns = parseInt(req.query.columns) || 2;

    try {
        // 1. Obtener todos los repos públicos
        const reposResponse = await octokit.request("GET /users/{username}/repos", {
            username,
            headers: { "X-GitHub-Api-Version": "2022-11-28" },
        });

        const repos = reposResponse.data;
        const languageCount = {};

        // 2. Sumar bytes por lenguaje
        for (const repo of repos) {
            const langResponse = await octokit.request("GET /repos/{owner}/{repo}/languages", {
                owner: username,
                repo: repo.name,
                headers: { "X-GitHub-Api-Version": "2022-11-28" },
            });

            const languages = langResponse.data;

            for (const [lang, bytes] of Object.entries(languages)) {
                languageCount[lang] = (languageCount[lang] || 0) + bytes;
            }
        }

        // 3. Formatear los bytes
        const languageBytes = {};
        for (const [lang, bytes] of Object.entries(languageCount)) {
            languageBytes[lang] = formatBytes(bytes);
        }

        // 4. Renderizar la tarjeta SVG
        const { renderCard } = require("../style/renderCard.js");

        const svg = renderCard({
            username,
            languageBytes,
            themeName,
            columns
        });

        res.setHeader('Content-Type', 'image/svg+xml');
        res.send(svg);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching data from GitHub.' });
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
