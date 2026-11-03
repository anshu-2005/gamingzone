import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CATEGORIES, DEFAULT_GAMES } from '../js/data/gamesRegistry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const registryPath = path.resolve(__dirname, '../js/data/gamesRegistry.js');

const updatedGames = DEFAULT_GAMES.map((game) => {
  const slug = game.slug || game.id;
  return {
    ...game,
    thumbnail: `/images/games/${slug}.webp`,
    imageAlt: `Official artwork for ${game.title}`
  };
});

const fileContent = `export const CATEGORIES = ${JSON.stringify(CATEGORIES, null, 2)};\n\nexport const DEFAULT_GAMES = ${JSON.stringify(updatedGames, null, 2)};\n`;

fs.writeFileSync(registryPath, fileContent, 'utf8');
console.log(`Successfully updated all ${updatedGames.length} games in gamesRegistry.js with their authentic WebP thumbnails and imageAlt attributes!`);
