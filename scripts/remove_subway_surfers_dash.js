import { db } from '../server/db/database.js';

console.log('Deleting game_subway_surfers_dash from database...');
const res = db.prepare("DELETE FROM games WHERE id = 'game_subway_surfers_dash' OR slug = 'subway-surfers-track-dash-3d'").run();
console.log('Deleted rows:', res.changes);

const subwayGames = db.prepare(`
  SELECT id, slug, title, category, game_type, external_url, status
  FROM games
  WHERE slug LIKE '%subway%' OR title LIKE '%Subway%'
`).all();

console.log('Remaining Subway games in database:');
console.log(JSON.stringify(subwayGames, null, 2));

const totalPublished = db.prepare("SELECT COUNT(*) as count FROM games WHERE status = 'published'").get();
console.log('Total published games:', totalPublished.count);

process.exit(0);

