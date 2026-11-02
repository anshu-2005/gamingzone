import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const newGames = [
  {
    id: 'game_cnc_tiberian_dawn',
    slug: 'command-and-conquer-rts',
    title: 'Command & Conquer: Tiberian Dawn RTS',
    description: 'Legendary RTS strategy classic rebuilt in HTML5! Mine Tiberium, build bases, produce infantry and tanks, and dominate the battlefield.',
    category: 'action',
    type: 'bundled_html5',
    bundle_url: '/command-and-conquer/',
    thumbnail: '',
    rating: 4.9,
    plays: 41280,
    is_featured: 1,
    is_trending: 1,
    badge: 'HOT RTS',
    controls: 'Mouse: Select & Move, Scroll: Pan Map, Left Click: Attack & Build',
    instructions: '1. Harvest Tiberium green crystals with Harvester. 2. Build Power Plants and Barracks. 3. Train soldiers, tanks, and destroy enemy bases.',
    tags: JSON.stringify(['rts', 'strategy', 'classic', 'war', 'tiberium']),
    bg_gradient: 'from-amber-900 to-red-950',
    primary_color: '#d97706',
    created_at: new Date().toISOString()
  },
  {
    id: 'game_tower_defense_3d',
    slug: 'tower-defense-3d-tactics',
    title: 'Tower Defense 3D: Tactical Kingdom',
    description: 'Intense 3D Tower Defense built with Three.js. Construct basic, advanced, and badass towers to defend against waves of UFOs and enemy invaders.',
    category: '3d',
    type: 'bundled_html5',
    bundle_url: '/tower-defense-3d/',
    thumbnail: '',
    rating: 4.8,
    plays: 35900,
    is_featured: 1,
    is_trending: 1,
    badge: '3D EPIC',
    controls: 'Mouse: Rotate Camera & Place Towers, Scroll: Zoom',
    instructions: '1. Place defensive towers along the path. 2. Upgrade towers for higher damage. 3. Stop all enemy waves before they reach the base!',
    tags: JSON.stringify(['tower defense', 'strategy', '3d', 'threejs', 'aliens']),
    bg_gradient: 'from-blue-900 to-indigo-950',
    primary_color: '#3b82f6',
    created_at: new Date().toISOString()
  },
  {
    id: 'game_orbium_puzzle',
    slug: 'orbium-marble-rotator',
    title: 'Orbium: Marble Rotator Puzzle',
    description: 'Fast-paced arcade marble matching puzzle inspired by 90s classic Log!cal. Rotate dials and fill slots with matching colored marbles!',
    category: 'puzzle',
    type: 'bundled_html5',
    bundle_url: '/orbium/',
    thumbnail: '',
    rating: 4.7,
    plays: 28400,
    is_featured: 1,
    is_trending: 0,
    badge: 'PUZZLE HIT',
    controls: 'Mouse / Touch: Click dials to rotate, Space: Drop marble',
    instructions: '1. Marbles roll into dials. 2. Click a dial to rotate and align colors. 3. Fill a dial with 4 matching marbles to explode and score points!',
    tags: JSON.stringify(['puzzle', 'marbles', 'rotator', 'arcade', 'retro']),
    bg_gradient: 'from-emerald-900 to-teal-950',
    primary_color: '#10b981',
    created_at: new Date().toISOString()
  },
  {
    id: 'game_diablo_js_rpg',
    slug: 'diablo-js-isometric-rpg',
    title: 'Diablo JS: Isometric Canvas RPG',
    description: 'Classic isometric dark fantasy action RPG dungeon crawler in HTML5 Canvas. Explore dungeons, fight monsters, and unleash attacks!',
    category: 'action',
    type: 'bundled_html5',
    bundle_url: '/diablo-js/',
    thumbnail: '',
    rating: 4.8,
    plays: 38900,
    is_featured: 1,
    is_trending: 1,
    badge: 'RETRO RPG',
    controls: 'Click / Touch: Move & Attack, Keys: Spells',
    instructions: '1. Click on the ground to move your hero. 2. Click on monsters to slash and cast spells. 3. Clear dungeon levels to survive!',
    tags: JSON.stringify(['rpg', 'diablo', 'action', 'dungeon', 'isometric']),
    bg_gradient: 'from-red-950 to-orange-950',
    primary_color: '#ea580c',
    created_at: new Date().toISOString()
  },
  {
    id: 'game_heartline_pulse',
    slug: 'heartline-pulse-platformer',
    title: 'HeartLine: Pulse Platformer',
    description: 'Atmospheric indie puzzle platformer created for Global Game Jam. Navigate dangerous obstacles synced to your heartbeat!',
    category: 'arcade',
    type: 'bundled_html5',
    bundle_url: '/heartline/',
    thumbnail: '',
    rating: 4.6,
    plays: 21500,
    is_featured: 0,
    is_trending: 0,
    badge: 'INDIE JAM',
    controls: 'Arrow Keys / WASD: Move & Jump, Space: Action',
    instructions: '1. Use Arrow keys to move and jump across hazards. 2. Collect hearts and unlock passage doors to reach the goal.',
    tags: JSON.stringify(['platformer', 'pulse', 'indie', 'pixel', 'retro']),
    bg_gradient: 'from-rose-900 to-pink-950',
    primary_color: '#f43f5e',
    created_at: new Date().toISOString()
  },
  {
    id: 'game_cube_engine_3d',
    slug: 'cube-engine-3d-sandbox',
    title: 'Cube Engine: 3D Voxel Sandbox',
    description: 'Lightweight pure HTML5 3D voxel sandbox world. Explore procedural block terrain, jump with physics gravity, and inspect voxel architecture.',
    category: '3d',
    type: 'bundled_html5',
    bundle_url: '/cube-engine/',
    thumbnail: '',
    rating: 4.7,
    plays: 32400,
    is_featured: 1,
    is_trending: 0,
    badge: '3D SANDBOX',
    controls: 'WASD: Movement, Space: Jump, Arrows: Look / Rotate, PgUp/PgDn: Elevation',
    instructions: '1. Use WASD to walk through the 3D voxel realm. 2. Space to jump over obstacles. 3. Toggle gravity, collision, and HUD in the sidebar.',
    tags: JSON.stringify(['sandbox', 'voxel', '3d', 'minecraft-style', 'cubes']),
    bg_gradient: 'from-cyan-900 to-slate-950',
    primary_color: '#06b6d4',
    created_at: new Date().toISOString()
  }
];

// 1. Update js/data/gamesRegistry.js
const regPath = path.join(rootDir, 'js', 'data', 'gamesRegistry.js');
let regContent = fs.readFileSync(regPath, 'utf8');

const newGameStrings = newGames.map(g => `  {
    id: ${JSON.stringify(g.id)},
    slug: ${JSON.stringify(g.slug)},
    title: ${JSON.stringify(g.title)},
    description: ${JSON.stringify(g.description)},
    category: ${JSON.stringify(g.category)},
    type: ${JSON.stringify(g.type)},
    bundle_url: ${JSON.stringify(g.bundle_url)},
    thumbnail: ${JSON.stringify(g.thumbnail)},
    rating: ${g.rating},
    plays: ${g.plays},
    is_featured: ${g.is_featured},
    is_trending: ${g.is_trending},
    badge: ${JSON.stringify(g.badge)},
    controls: ${JSON.stringify(g.controls)},
    instructions: ${JSON.stringify(g.instructions)},
    tags: ${g.tags},
    bg_gradient: ${JSON.stringify(g.bg_gradient)},
    primary_color: ${JSON.stringify(g.primary_color)},
    created_at: ${JSON.stringify(g.created_at)}
  }`).join(',\n');

regContent = regContent.replace(
  'export const DEFAULT_GAMES = [',
  `export const DEFAULT_GAMES = [\n${newGameStrings},`
);

fs.writeFileSync(regPath, regContent, 'utf8');
console.log('✅ Added 6 games to js/data/gamesRegistry.js');

// 2. Sync to SQLite database
const dbModule = await import('../server/db/database.js');
const db = dbModule.db;

const insertStmt = db.prepare(`
  INSERT OR REPLACE INTO games (
    id, slug, title, description, category, type, bundle_url, thumbnail,
    rating, plays, is_featured, is_trending, badge, controls, instructions,
    tags, bg_gradient, primary_color, created_at
  ) VALUES (
    @id, @slug, @title, @description, @category, @type, @bundle_url, @thumbnail,
    @rating, @plays, @is_featured, @is_trending, @badge, @controls, @instructions,
    @tags, @bg_gradient, @primary_color, @created_at
  )
`);

for (const g of newGames) {
  insertStmt.run(g);
}

const total = db.prepare('SELECT count(*) as count FROM games').get();
console.log(`✅ SQLite Database synchronized! Total games in database: ${total.count}`);

