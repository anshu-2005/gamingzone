import { DatabaseSync } from 'node:sqlite';
import { DEFAULT_GAMES } from '../js/data/gamesRegistry.js';

console.log('Top 6 games in DEFAULT_GAMES:');
DEFAULT_GAMES.slice(0, 6).forEach((g, idx) => {
  console.log(`${idx + 1}. [${g.icon}] ${g.title} (${g.bundle_url})`);
});

const db = new DatabaseSync('data/gamingzone.db');
const rows = db.prepare('SELECT id, title, bundle_url, status FROM games WHERE id IN (?, ?, ?, ?)').all(
  'game_alien_invasion',
  'game_coil_reflex',
  'game_sorades_galaga',
  'game_skifree_alpine'
);
console.log('\nDatabase rows:');
console.log(rows);
db.close();
