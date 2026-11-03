import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const outDir = path.join(rootDir, 'public', 'images', 'games');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const inventoryPath = path.join(__dirname, 'games_inventory.json');
const games = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));

console.log(`Starting authentic artwork pipeline for ${games.length} games...`);
