import { db, initDatabase } from '../server/db/database.js';

console.log('Running initDatabase()...');
initDatabase();

const metroGames = db.prepare(`
  SELECT id, slug, title, category, game_type, external_url, status, plays, rating
  FROM games
  WHERE slug LIKE '%metro%' OR title LIKE '%Metro%'
`).all();

console.log('Metro games in database:');
console.log(JSON.stringify(metroGames, null, 2));

const totalPublished = db.prepare("SELECT COUNT(*) as count FROM games WHERE status = 'published'").get();
console.log('Total published games:', totalPublished.count);

process.exit(0);

