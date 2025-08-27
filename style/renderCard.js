const fs = require('fs');
const path = require('path');

function renderCard({ username, languageBytes, themeName = 'default' }) {
    const themes = JSON.parse(fs.readFileSync(path.join(__dirname, 'themes.json'), 'utf8'));
    const theme = themes[themeName] || themes['default'];

    // Convertir valores legibles a bytes reales para ordenarlos correctamente
    const parseBytes = (str) => {
        const num = parseFloat(str);
        if (str.includes('GB')) return num * 1e9;
        if (str.includes('MB')) return num * 1e6;
        if (str.includes('KB')) return num * 1e3;
        return num; // bytes
    };

    const entries = Object.entries(languageBytes).sort((a, b) => {
        return parseBytes(b[1]) - parseBytes(a[1]);
    });

    // Calcular columnas automáticamente
    const totalLanguages = entries.length;
    const columns = Math.ceil(totalLanguages / 4);
    const rows = Math.ceil(totalLanguages / columns);

    const columnWidth = 160;
    const startX = 20;
    const startY = 70;
    const lineHeight = 22;

    let svgRows = '';
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            const index = r + c * rows;
            if (entries[index]) {
                const [lang, value] = entries[index];
                const x = startX + c * columnWidth;
                const y = startY + r * lineHeight;
                svgRows += `<text x="${x}" y="${y}" fill="${theme.fore}" font-size="14" font-family="Fira Code, Roboto Mono, monospace">${lang}: ${value}</text>\n`;
            }
        }
    }

    const height = startY + rows * lineHeight + 20;

    return `
<svg width="${columns * columnWidth + 40}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${theme.back}" rx="10" />
  <text x="20" y="40" fill="${theme.username}" font-size="20" font-family="Open Sans, sans-serif">
    ${username}'s GitHub Code Size Stats
  </text>
  ${svgRows}
</svg>
    `.trim();
}

module.exports = { renderCard };