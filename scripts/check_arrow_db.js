import { db } from '../server/db/database.js';

console.log('--- Inspecting Database for Arrow Games & External URLs ---');
const total = db.prepare('SELECT COUNT(*) as count FROM games').get();
console.log('Total games in database:', total.count);

const allArrow = db.prepare(`
  SELECT id, slug, title, category, status, game_type, external_url, plays, created_at, updated_at
  FROM games
  WHERE LOWER(title) LIKE '%arrow%' OR LOWER(slug) LIKE '%arrow%' OR (external_url IS NOT NULL AND external_url != '')
`).all();

console.log('Matching games found (' + allArrow.length + '):');
allArrow.forEach(g => {
  console.log(JSON.stringify(g, null, 2));
});

const recentAdded = db.prepare(`
  SELECT id, slug, title, status, game_type, external_url, plays, created_at
  FROM games
  ORDER BY created_at DESC
  LIMIT 10
`).all();

console.log('\n--- 10 Most Recently Created Games ---');
recentAdded.forEach(g => console.log(`[${g.id}] "${g.title}" (slug: ${g.slug}, status: ${g.status}, type: ${g.game_type}, url: ${g.external_url})`));

