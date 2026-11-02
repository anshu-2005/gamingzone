import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Update clumsy-bird UI
const clumsyPath = path.join(rootDir, 'public', 'clumsy-bird', 'index.html');
if (fs.existsSync(clumsyPath)) {
  let clumsyHtml = fs.readFileSync(clumsyPath, 'utf8');
  if (!clumsyHtml.includes('GAMINGZONE ARCADE')) {
    clumsyHtml = clumsyHtml.replace(
      '<title>Clumsy Bird</title>',
      '<title>Clumsy Bird: Flappy Arcade Rush | GAMINGZONE</title>'
    );
    const styleAndBadge = `
    <style>
      body {
        background: radial-gradient(circle at center, #0f172a 0%, #020617 100%) !important;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        margin: 0;
        overflow: hidden;
      }
      #screen {
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(34, 197, 94, 0.25);
        border-radius: 8px;
        overflow: hidden;
      }
      .gz-badge {
        position: fixed;
        top: 12px;
        left: 12px;
        z-index: 9999;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 11px;
        letter-spacing: 1.5px;
        font-weight: 700;
        color: #22c55e;
        background: rgba(15, 23, 42, 0.88);
        backdrop-filter: blur(8px);
        padding: 6px 14px;
        border-radius: 999px;
        border: 1px solid rgba(34, 197, 94, 0.4);
        box-shadow: 0 0 15px rgba(34, 197, 94, 0.25);
        text-transform: uppercase;
        pointer-events: none;
        display: flex;
        align-items: center;
        gap: 6px;
      }
    </style>
  </head>
  <body>
    <div class="gz-badge">🎮 GAMINGZONE ARCADE</div>`;
    clumsyHtml = clumsyHtml.replace(/<\/head>\s*<body>/, styleAndBadge);
    fs.writeFileSync(clumsyPath, clumsyHtml, 'utf8');
    console.log('✅ Updated Clumsy Bird UI');
  }
}

// 2. Update adarkroom UI
const adrPath = path.join(rootDir, 'public', 'adarkroom', 'index.html');
if (fs.existsSync(adrPath)) {
  let adrHtml = fs.readFileSync(adrPath, 'utf8');
  if (!adrHtml.includes('GAMINGZONE EDITION')) {
    adrHtml = adrHtml.replace(
      '<title>A Dark Room</title>',
      '<title>A Dark Room: Minimalist Survival | GAMINGZONE</title>'
    );
    const adrStyleAndBadge = `
    <style>
      .gz-badge {
        position: fixed;
        top: 12px;
        left: 12px;
        z-index: 9999;
        font-family: monospace, sans-serif;
        font-size: 11px;
        letter-spacing: 1.5px;
        font-weight: 700;
        color: #e2e8f0;
        background: rgba(15, 23, 42, 0.9);
        backdrop-filter: blur(8px);
        padding: 6px 14px;
        border-radius: 999px;
        border: 1px solid rgba(226, 232, 240, 0.3);
        box-shadow: 0 0 15px rgba(226, 232, 240, 0.15);
        text-transform: uppercase;
        pointer-events: none;
      }
    </style>
  </head>
  <body>
    <div class="gz-badge">🎮 GAMINGZONE EDITION</div>`;
    adrHtml = adrHtml.replace(/<\/head>\s*<body>/, adrStyleAndBadge);
    fs.writeFileSync(adrPath, adrHtml, 'utf8');
    console.log('✅ Updated A Dark Room UI');
  }
}

// 3. Register in js/data/gamesRegistry.js
const registryPath = path.join(rootDir, 'js', 'data', 'gamesRegistry.js');
let registryContent = fs.readFileSync(registryPath, 'utf8');

const newGames = [
  {
    id: 'game_hextris_blitz',
    title: 'Hextris: Hexagonal Puzzle Blitz',
    slug: 'hextris-hexagonal-blitz',
    category: 'puzzle',
    tags: ['puzzle', 'arcade', 'strategy', 'hexagonal', 'trending', 'new'],
    game_type: 'bundle',
    bundle_url: '/hextris/',
    entry_path: 'index.html',
    icon: '⬡',
    rating: 4.9,
    plays: 86400,
    featured: true,
    is_new: true,
    is_trending: true,
    bannerColor: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
    description: 'Fast-paced hexagonal puzzle challenge! Rotate the central hexagon to match 3 or more blocks of the same color before the grey boundary is breached.',
    controls: 'Desktop: [Left/Right Arrow] or [A/D] keys to rotate hexagon. Mobile: Tap left/right side of screen.',
    instructions: 'Match 3+ blocks of identical color to clear them. Clear lines consecutively to rack up combo multipliers and climb the leaderboards!',
    status: 'published'
  },
  {
    id: 'game_clumsy_bird',
    title: 'Clumsy Bird: Flappy Arcade Rush',
    slug: 'clumsy-bird-flappy-rush',
    category: 'arcade',
    tags: ['arcade', 'retro', 'flappy', 'casual', 'trending', 'new'],
    game_type: 'bundle',
    bundle_url: '/clumsy-bird/',
    entry_path: 'index.html',
    icon: '🐦',
    rating: 4.8,
    plays: 94100,
    featured: true,
    is_new: true,
    is_trending: true,
    bannerColor: 'linear-gradient(135deg, #22c55e, #10b981)',
    description: 'The beloved classic Flappy Bird reimagined in HTML5 with MelonJS engine! Flap through tricky pipe obstacles and aim for the legendary crown score.',
    controls: 'Desktop: [Spacebar] or [Click] to flap. Mobile: Tap screen to flap.',
    instructions: 'Tap or press Space to keep your bird airborne. Navigate between pipes without colliding to score points!',
    status: 'published'
  },
  {
    id: 'game_adarkroom_adventure',
    title: 'A Dark Room: Minimalist Survival',
    slug: 'a-dark-room-survival',
    category: 'adventure',
    tags: ['adventure', 'rpg', 'survival', 'minimalist', 'story', 'new'],
    game_type: 'bundle',
    bundle_url: '/adarkroom/',
    entry_path: 'index.html',
    icon: '🔥',
    rating: 4.9,
    plays: 112500,
    featured: true,
    is_new: true,
    is_trending: true,
    bannerColor: 'linear-gradient(135deg, #64748b, #334155)',
    description: 'The award-winning, hypnotic text adventure and atmospheric survival game. Awaken in a cold, dark room, light a fire, gather wood, and discover what lies outside.',
    controls: 'Mouse/Touch: Click buttons and options to interact, build, and explore.',
    instructions: 'Start by stoking the fire to keep warm. As the room warms up, strangers will visit and a deep world of survival and exploration will unfold.',
    status: 'published'
  }
];

// Check if already in gamesRegistry.js
for (const game of newGames) {
  if (!registryContent.includes(game.id)) {
    // Add to top of DEFAULT_GAMES array
    const defaultGamesMarker = 'export const DEFAULT_GAMES = [';
    const gameStr = `  ${JSON.stringify(game, null, 2)},\n`;
    registryContent = registryContent.replace(defaultGamesMarker, `${defaultGamesMarker}\n${gameStr}`);
    console.log(`✅ Added ${game.title} to gamesRegistry.js`);
  } else {
    console.log(`ℹ️ ${game.title} already in gamesRegistry.js`);
  }
}
fs.writeFileSync(registryPath, registryContent, 'utf8');

// 4. Update SQLite database
const dbFile = path.join(rootDir, 'data', 'gamingzone.db');
if (fs.existsSync(dbFile)) {
  import('node:sqlite').then(({ DatabaseSync }) => {
    try {
      const db = new DatabaseSync(dbFile);
      const insertStmt = db.prepare(`
        INSERT OR REPLACE INTO games (
          id, title, slug, category, tags, game_type, bundle_url, entry_path,
          icon, rating, plays, featured, is_new, is_trending, bannerColor,
          description, controls, instructions, status, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, datetime('now'), datetime('now')
        )
      `);

      for (const g of newGames) {
        insertStmt.run(
          g.id,
          g.title,
          g.slug,
          g.category,
          JSON.stringify(g.tags),
          g.game_type,
          g.bundle_url,
          g.entry_path,
          g.icon,
          g.rating,
          g.plays,
          g.featured ? 1 : 0,
          g.is_new ? 1 : 0,
          g.is_trending ? 1 : 0,
          g.bannerColor,
          g.description,
          g.controls,
          g.instructions,
          g.status
        );
        console.log(`✅ Seeded ${g.title} into SQLite DB`);
      }
      db.close();
      console.log('✅ SQLite DB updated successfully!');
    } catch (err) {
      console.warn('SQLite sync error (will continue):', err.message);
    }
  }).catch(() => {
    console.log('Skipping DatabaseSync (fallback)');
  });
}

