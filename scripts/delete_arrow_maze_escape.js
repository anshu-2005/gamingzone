import { db } from '../server/db/database.js';

console.log('Deleting game_arrow_maze_escape from database...');
const res = db.prepare("DELETE FROM games WHERE id = 'game_arrow_maze_escape' OR slug = 'arrow-maze-escape-tangled-puzzle'").run();
console.log('Deleted rows:', res.changes);

const remainingArrowGames = db.prepare(`
  SELECT id, slug, title, category, game_type, external_url, status
  FROM games
  WHERE slug LIKE '%arrow%' OR title LIKE '%Arrow%'
`).all();

console.log('Remaining Arrow games in database:');
console.log(JSON.stringify(remainingArrowGames, null, 2));

const totalPublished = db.prepare("SELECT COUNT(*) as count FROM games WHERE status = 'published'").get();
console.log('Total published games:', totalPublished.count);

process.exit(0);

