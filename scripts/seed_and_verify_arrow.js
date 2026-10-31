import { db, initDatabase } from '../server/db/database.js';

console.log('Running initDatabase()...');
initDatabase();

const arrowGames = db.prepare(`
  SELECT id, slug, title, category, game_type, external_url, status, plays, rating
  FROM games
  WHERE slug LIKE '%arrow%' OR title LIKE '%Arrow%'
`).all();

console.log('Arrow games in database:');
console.log(JSON.stringify(arrowGames, null, 2));

const totalPublished = db.prepare("SELECT COUNT(*) as count FROM games WHERE status = 'published'").get();
console.log('Total published games:', totalPublished.count);

process.exit(0);

