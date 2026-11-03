import { DatabaseSync } from 'node:sqlite';
import { DEFAULT_GAMES } from '../js/data/gamesRegistry.js';

const db = new DatabaseSync('data/gamingzone.db');

// Map of slug to thumbnail from DEFAULT_GAMES
const map = new Map(DEFAULT_GAMES.map(g => [g.slug, g.thumbnail || `/images/games/${g.slug}.webp`]));
const idMap = new Map(DEFAULT_GAMES.map(g => [g.id, g.thumbnail || `/images/games/${g.slug}.webp`]));

const rows = db.prepare('SELECT id, slug, thumbnail FROM games').all();
console.log(`Found ${rows.length} total rows in database.`);

const updateStmt = db.prepare('UPDATE games SET thumbnail = ? WHERE id = ?');

let updated = 0;
for (const r of rows) {
  const correctThumb = map.get(r.slug) || idMap.get(r.id) || `/images/games/${r.slug}.webp`;
  if (r.thumbnail !== correctThumb) {
    updateStmt.run(correctThumb, r.id);
    updated++;
  }
}

console.log(`Successfully updated ${updated} game thumbnails in data/gamingzone.db.`);

const sample = db.prepare('SELECT id, slug, thumbnail FROM games LIMIT 5').all();
console.log('Sample rows:', sample);

