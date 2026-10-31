import { db, initDatabase } from '../server/db/database.js';

console.log('Running initDatabase()...');
initDatabase();

const subwayGames = db.prepare(`
  SELECT id, slug, title, category, game_type, external_url, status, plays, rating
  FROM games
  WHERE slug LIKE '%subway%' OR title LIKE '%Subway%'
`).all();

console.log('Subway games in database:');
console.log(JSON.stringify(subwayGames, null, 2));

const totalPublished = db.prepare("SELECT COUNT(*) as count FROM games WHERE status = 'published'").get();
console.log('Total published games:', totalPublished.count);

process.exit(0);
