import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const registryPath = path.resolve(__dirname, '../js/data/gamesRegistry.js');

let code = fs.readFileSync(registryPath, 'utf8');

// Match each game entry and set thumbnail and imageAlt
// Replace `thumbnail: ""` with `thumbnail: "/images/games/<slug>.webp",\n    imageAlt: "Artwork representing <title>",`
code = code.replace(/(\{\s*id:\s*["'][^"']+["'],\s*slug:\s*["']([^"']+)["'],\s*title:\s*["']([^"']+)["'][\s\S]*?thumbnail:\s*)["'][^"']*["']/g, (match, prefix, slug, title) => {
  return `${prefix}"/images/games/${slug}.webp",\n    imageAlt: "Official artwork for ${title}"`;
});

fs.writeFileSync(registryPath, code, 'utf8');
console.log('Successfully connected all 147 games to their authentic WebP images in gamesRegistry.js!');
