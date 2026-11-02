import fs from 'fs';
import { db, initDatabase } from '../server/db/database.js';

// 1. Update js/data/gamesRegistry.js
const registryPath = 'js/data/gamesRegistry.js';
let registry = fs.readFileSync(registryPath, 'utf8');

const infiniteArenaDef = `  // ♾️ Infinite Arena: Merge Without Limits (Vercel Edition)
  {
    id: 'game_infinite_arena',
    title: 'Infinite Arena: Merge Without Limits',
    slug: 'infinite-arena-merge',
    category: 'puzzle',
    tags: ['puzzle', '2048', 'strategy', 'arcade', 'brain', 'trending', 'new'],
    game_type: 'external',
    gameMode: 'highscore',
    icon: '♾️',
    rating: 4.9,
    plays: 62800,
    featured: true,
    is_new: true,
    is_trending: true,
    bannerColor: 'linear-gradient(135deg, #6366f1, #a855f7)',
    description: 'Enter the competitive puzzle arena! Swipe or use arrow keys to slide and merge number tiles, trigger multipliers, and climb forever in infinite mode.',
    controls: 'Desktop: Use [Arrow Keys] or [W, A, S, D] to slide and merge tiles. Mobile: Swipe left, right, up, or down.',
    instructions: 'Slide tiles across the board. When two tiles with the same number touch, they merge into one! Keep merging to reach the highest scores and climb forever in infinite mode.',
    external_url: 'https://infinite-arena-inky.vercel.app',
    entry_path: 'index.html',
    status: 'published'
  },
`;

if (!registry.includes('game_infinite_arena')) {
  registry = registry.replace(
    'export const DEFAULT_GAMES = [',
    `export const DEFAULT_GAMES = [\n${infiniteArenaDef}`
  );
  fs.writeFileSync(registryPath, registry, 'utf8');
  console.log('✅ Added Infinite Arena at position #1 in js/data/gamesRegistry.js');
} else {
  console.log('ℹ️ Infinite Arena already present in gamesRegistry.js');
}

// 2. Initialize and update SQLite database
initDatabase();

const now = Date.now() + 100000; // ensure newest timestamp so it stays #1

const existing = db.prepare('SELECT id FROM games WHERE id = ?').get('game_infinite_arena');
if (!existing) {
  db.prepare(`
    INSERT INTO games (
      id, slug, title, description, category, tags, thumbnail,
      bundle_url, external_url, entry_path, game_type, engine, controls, instructions,
      version, status, is_featured, is_trending, is_new,
      plays, rating, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'game_infinite_arena',
    'infinite-arena-merge',
    'Infinite Arena: Merge Without Limits',
    'Enter the competitive puzzle arena! Swipe or use arrow keys to slide and merge number tiles, trigger multipliers, and climb forever in infinite mode.',
    'puzzle',
    JSON.stringify(['puzzle', '2048', 'strategy', 'arcade', 'brain', 'trending', 'new']),
    '♾️',
    '',
    'https://infinite-arena-inky.vercel.app',
    'index.html',
    'external',
    '',
    'Desktop: Use [Arrow Keys] or [W, A, S, D] to slide and merge tiles. Mobile: Swipe left, right, up, or down.',
    'Slide tiles across the board. When two tiles with the same number touch, they merge into one! Keep merging to reach the highest scores and climb forever in infinite mode.',
    '1.0.0',
    'published',
    1,
    1,
    1,
    62800,
    4.9,
    now,
    now
  );
  console.log('✅ Inserted game_infinite_arena into SQLite games table');
} else {
  db.prepare(`
    UPDATE games SET
      title = ?,
      slug = ?,
      description = ?,
      category = ?,
      tags = ?,
      thumbnail = ?,
      external_url = ?,
      game_type = ?,
      controls = ?,
      instructions = ?,
      status = 'published',
      is_featured = 1,
      is_trending = 1,
      is_new = 1,
      created_at = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    'Infinite Arena: Merge Without Limits',
    'infinite-arena-merge',
    'Enter the competitive puzzle arena! Swipe or use arrow keys to slide and merge number tiles, trigger multipliers, and climb forever in infinite mode.',
    'puzzle',
    JSON.stringify(['puzzle', '2048', 'strategy', 'arcade', 'brain', 'trending', 'new']),
    '♾️',
    'https://infinite-arena-inky.vercel.app',
    'external',
    'Desktop: Use [Arrow Keys] or [W, A, S, D] to slide and merge tiles. Mobile: Swipe left, right, up, or down.',
    'Slide tiles across the board. When two tiles with the same number touch, they merge into one! Keep merging to reach the highest scores and climb forever in infinite mode.',
    now,
    now,
    'game_infinite_arena'
  );
  console.log('✅ Updated game_infinite_arena in SQLite games table');
}

// 3. Verify top games
const topGames = db.prepare(`
  SELECT id, title, slug, category, external_url, is_new
  FROM games
  WHERE status = 'published'
  ORDER BY is_new DESC, created_at DESC, updated_at DESC
  LIMIT 5
`).all();

console.log('\nTop 5 games in database:');
console.log(JSON.stringify(topGames, null, 2));

process.exit(0);

