import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const registryPath = path.join(rootDir, 'js', 'data', 'gamesRegistry.js');
let registryContent = fs.readFileSync(registryPath, 'utf8');

const gistGames = [
  {
    id: 'game_alien_invasion',
    title: 'Alien Invasion: Space Arcade Combat',
    slug: 'alien-invasion-space-combat',
    category: 'arcade',
    tags: ['arcade', 'action', 'shooter', 'space', 'retro', 'trending', 'new'],
    game_type: 'bundle',
    bundle_url: '/alien-invasion/',
    entry_path: 'index.html',
    icon: '👾',
    rating: 4.9,
    plays: 128400,
    featured: true,
    is_new: true,
    is_trending: true,
    bannerColor: 'linear-gradient(135deg, #0284c7, #6366f1)',
    description: "Legendary HTML5 space invaders combat! Defend earth from waves of extraterrestrial invaders, dodge enemy fire, and unleash tactical missile barrages.",
    controls: 'Desktop: [Arrow Keys] to steer fighter ship, [Spacebar] to fire plasma cannons, [P] to pause. Mobile: On-screen touch controls.',
    instructions: "Destroy invading alien fleets before they reach Earth's atmosphere. Protect your shields and maintain firepower!",
    status: 'published'
  },
  {
    id: 'game_coil_reflex',
    title: 'Coil: Neon Particle Reflex',
    slug: 'coil-neon-particle-reflex',
    category: 'arcade',
    tags: ['arcade', 'reflex', 'casual', 'puzzle', 'neon', 'trending', 'new'],
    game_type: 'bundle',
    bundle_url: '/coil/',
    entry_path: 'index.html',
    icon: '💫',
    rating: 4.8,
    plays: 98700,
    featured: true,
    is_new: true,
    is_trending: true,
    bannerColor: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
    description: 'Addictive and hypnotic neon reflex game! Enclose glowing energy orbs in your luminous particle trail before they explode.',
    controls: 'Mouse/Touch: Move your cursor or finger to steer your light ribbon and encircle energy orbs.',
    instructions: 'Circle orbs completely to enclose and detonate them. Trap multiple orbs in a single loop to score huge combo points!',
    status: 'published'
  },
  {
    id: 'game_sorades_galaga',
    title: 'Starship Sorades: Galaga 13K',
    slug: 'starship-sorades-galaga',
    category: 'action',
    tags: ['action', 'arcade', 'shooter', 'space', 'shmup', 'retro', 'new'],
    game_type: 'bundle',
    bundle_url: '/sorades/',
    entry_path: 'index.html',
    icon: '🚀',
    rating: 4.9,
    plays: 104200,
    featured: true,
    is_new: true,
    is_trending: true,
    bannerColor: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    description: 'High-octane retro vertical scrolling shmup! Battle 13 intense waves of alien armada, power up your weapons, and conquer colossal bosses.',
    controls: 'Desktop: [Arrow Keys] to navigate, [X] to fire weapon batteries, [F] for Fullscreen.',
    instructions: 'Maneuver through bullet storms, eliminate hostile formations, collect energy cores, and survive all 13 waves!',
    status: 'published'
  },
  {
    id: 'game_skifree_alpine',
    title: 'SkiFree: Classic Alpine Rush',
    slug: 'skifree-classic-alpine-rush',
    category: 'arcade',
    tags: ['arcade', 'sports', 'retro', 'runner', 'winter', 'classic', 'new'],
    game_type: 'bundle',
    bundle_url: '/skifree/',
    entry_path: 'index.html',
    icon: '⛷️',
    rating: 4.8,
    plays: 115000,
    featured: true,
    is_new: true,
    is_trending: true,
    bannerColor: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
    description: 'The authentic retro SkiFree experience! Slalom downhill through pines, conquer jumps, avoid snowboarders, and outrun the legendary Abominable Snow Monster.',
    controls: 'Desktop: [Left/Right Arrows] to carve, [Down Arrow] to accelerate, [Up Arrow] to brake, [Spacebar] to jump ramps.',
    instructions: 'Navigate safely past hazards and trees. Once you ski past 2,000 meters, be ready to sprint before the Yeti chases you!',
    status: 'published'
  }
];

// Add games to top of DEFAULT_GAMES array in reverse so the first one stays first
for (let i = gistGames.length - 1; i >= 0; i--) {
  const game = gistGames[i];
  if (!registryContent.includes(game.id)) {
    const defaultGamesMarker = 'export const DEFAULT_GAMES = [';
    const gameStr = `  ${JSON.stringify(game, null, 2)},\n`;
    registryContent = registryContent.replace(defaultGamesMarker, `${defaultGamesMarker}\n${gameStr}`);
    console.log(`✅ Added ${game.title} to top of gamesRegistry.js`);
  } else {
    console.log(`ℹ️ ${game.title} already exists in gamesRegistry.js`);
  }
}
fs.writeFileSync(registryPath, registryContent, 'utf8');

// Update SQLite DB
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

      for (const g of gistGames) {
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
        console.log(`✅ Database synced: ${g.title}`);
      }
      db.close();
      console.log('🎉 Database sync complete!');
    } catch (err) {
      console.error('Database sync error:', err);
    }
  });
}

