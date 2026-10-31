import { db } from '../server/db/database.js';

// Query directly using the exact same logic as apiRouter.get('/games')
function getGames({ category, search, featured, trending, is_new, limit = 500, sort = 'popular' } = {}) {
  let query = `
    SELECT id, slug, title, description, category, tags, thumbnail,
           bundle_url, external_url, preview_video, entry_path, game_type, engine,
           controls, instructions, version, status, is_featured, is_trending, is_new,
           plays, rating, created_at, updated_at
    FROM games
    WHERE status = 'published'
  `;
  const params = [];

  if (category && category !== 'all') {
    query += ` AND category = ?`;
    params.push(category);
  }

  if (featured === 'true' || featured === '1') {
    query += ` AND is_featured = 1`;
  }

  if (trending === 'true' || trending === '1') {
    query += ` AND (is_trending = 1 OR plays > 20000)`;
  }

  if (is_new === 'true' || is_new === '1') {
    query += ` AND is_new = 1`;
  }

  if (search && typeof search === 'string') {
    const term = `%${search.trim().toLowerCase()}%`;
    query += ` AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(tags) LIKE ? OR LOWER(category) LIKE ?)`;
    params.push(term, term, term, term);
  }

  if (sort === 'newest') {
    query += ` ORDER BY created_at DESC`;
  } else if (sort === 'title') {
    query += ` ORDER BY title ASC`;
  } else {
    query += ` ORDER BY plays DESC, rating DESC`;
  }

  query += ` LIMIT ?`;
  params.push(Math.min(parseInt(limit, 10) || 500, 1000));

  const games = db.prepare(query).all(...params);
  return games.map(g => ({
    ...g,
    tags: typeof g.tags === 'string' ? JSON.parse(g.tags || '[]') : g.tags,
    is_featured: Boolean(g.is_featured),
    is_trending: Boolean(g.is_trending),
    is_new: Boolean(g.is_new)
  }));
}

console.log('--- Testing Catalog Queries ---');

// 1. All games
const all = getGames();
console.log(`1. Total published games returned: ${all.length}`);
const flutterGameInAll = all.find(g => g.slug === 'arrow-escape-flutter');
console.log('   Arrow Escape in All games:', !!flutterGameInAll, flutterGameInAll?.title, flutterGameInAll?.external_url);

// 2. Puzzle Category
const puzzle = getGames({ category: 'puzzle' });
console.log(`2. Total puzzle games: ${puzzle.length}`);
const flutterGameInPuzzle = puzzle.find(g => g.slug === 'arrow-escape-flutter');
console.log('   Arrow Escape in Puzzle category:', !!flutterGameInPuzzle);

// 3. Search "arrow"
const searchArrow = getGames({ search: 'arrow' });
console.log(`3. Search "arrow" returned ${searchArrow.length} games:`);
searchArrow.forEach(g => {
  console.log(`   - [${g.id}] "${g.title}" (slug: ${g.slug}, type: ${g.game_type}, external_url: ${g.external_url})`);
});

// 4. Search "escape"
const searchEscape = getGames({ search: 'escape' });
console.log(`4. Search "escape" returned ${searchEscape.length} games:`);
searchEscape.forEach(g => {
  console.log(`   - "${g.title}" (slug: ${g.slug})`);
});

process.exit(0);
