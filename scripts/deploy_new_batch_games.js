import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === '.gitattributes') continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const gzBadgeSnippet = `
<style>
  .gz-top-badge {
    position: fixed;
    top: 14px;
    right: 18px;
    z-index: 99999;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(3, 7, 18, 0.88);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(56, 189, 248, 0.4);
    padding: 7px 16px;
    border-radius: 9999px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 11px;
    font-weight: 700;
    color: #38bdf8;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.6), 0 0 10px rgba(56, 189, 248, 0.2);
    pointer-events: auto;
    user-select: none;
    animation: gzPulse 3s ease-in-out infinite alternate;
  }
  @keyframes gzPulse {
    0% { border-color: rgba(56, 189, 248, 0.35); box-shadow: 0 4px 18px rgba(0,0,0,0.6), 0 0 8px rgba(56, 189, 248, 0.15); }
    100% { border-color: rgba(147, 51, 234, 0.55); box-shadow: 0 4px 22px rgba(0,0,0,0.7), 0 0 16px rgba(147, 51, 234, 0.3); }
  }
</style>
<div class="gz-top-badge">
  <span style="font-size: 14px;">🎮</span> GAMINGZONE EDITION
</div>
`;

console.log('1. Copying Green Mahjong...');
const mahjongDest = path.join(rootDir, 'public', 'green-mahjong');
copyDir('scratch_new/green-mahjong/GreenMahjong/www', mahjongDest);
const mahjongIndex = path.join(mahjongDest, 'index.html');
if (fs.existsSync(mahjongIndex)) {
  let h = fs.readFileSync(mahjongIndex, 'utf8');
  h = h.replace('manifest="greenmahjong.appcache"', '');
  if (!h.includes('gz-top-badge')) {
    h = h.replace('<body>', `<body>\n${gzBadgeSnippet}`);
  }
  fs.writeFileSync(mahjongIndex, h, 'utf8');
}

console.log('2. Copying Gladiator 3D...');
const gladiatorDest = path.join(rootDir, 'public', 'gladiator-3d');
copyDir('scratch_new/gladiator-3d/examples/game_demo', gladiatorDest);
// Copy engine file
fs.copyFileSync('scratch_new/gladiator-3d/src/gladiator.js', path.join(gladiatorDest, 'js', 'gladiator.js'));
// Process main.html to index.html
const gladMain = path.join(gladiatorDest, 'main.html');
let gladHtml = fs.readFileSync(gladMain, 'utf8');
gladHtml = gladHtml.replace('../../src/gladiator.js', 'js/gladiator.js');
gladHtml = gladHtml.replace('<body>', `<body style="background: #030712; color: #fff; margin: 0; padding: 20px; text-align: center; font-family: sans-serif;">\n${gzBadgeSnippet}`);
fs.writeFileSync(path.join(gladiatorDest, 'index.html'), gladHtml, 'utf8');

console.log('3. Copying Cell Mates...');
const cellmatesDest = path.join(rootDir, 'public', 'cellmates');
copyDir('scratch_new/cellmates', cellmatesDest);
const cellIndex = path.join(cellmatesDest, 'index.html');
if (fs.existsSync(cellIndex)) {
  let h = fs.readFileSync(cellIndex, 'utf8');
  if (!h.includes('gz-top-badge')) {
    h = h.replace('<body>', `<body>\n${gzBadgeSnippet}`);
  }
  fs.writeFileSync(cellIndex, h, 'utf8');
}

console.log('4. Copying Marble Soccer...');
const marbleDest = path.join(rootDir, 'public', 'marblesoccer');
copyDir('scratch_new/marblesoccer', marbleDest);
const marbleIndex = path.join(marbleDest, 'index.html');
if (fs.existsSync(marbleIndex)) {
  let h = fs.readFileSync(marbleIndex, 'utf8');
  h = h.replace(/<script[\s\S]*?google-analytics\.com[\s\S]*?<\/script>/gi, '');
  h = h.replace(/<link rel="chrome-webstore-item"[\s\S]*?\/>/gi, '');
  if (!h.includes('gz-top-badge')) {
    h = h.replace('<body>', `<body>\n${gzBadgeSnippet}`);
  }
  fs.writeFileSync(marbleIndex, h, 'utf8');
}

console.log('5. Copying Pixel Platformer...');
const pixelDest = path.join(rootDir, 'public', 'pixelplatformer');
copyDir('scratch_new/pixelplatformer', pixelDest);
const pixelHtmlPath = path.join(pixelDest, 'pixelplatformer.html');
let pixHtml = fs.readFileSync(pixelHtmlPath, 'utf8');
pixHtml = pixHtml.replace('language="javscript"', 'language="javascript"');
if (!pixHtml.includes('gz-top-badge')) {
  pixHtml = pixHtml.replace('<body>', `<body style="background: #030712; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0;">\n${gzBadgeSnippet}`);
}
fs.writeFileSync(path.join(pixelDest, 'index.html'), pixHtml, 'utf8');

// Games data for registry
const newGames = [
  {
    id: 'game_green_mahjong',
    title: 'Green Mahjong: Solitaire Zen',
    slug: 'green-mahjong-solitaire-zen',
    category: 'puzzle',
    tags: ['puzzle', 'mahjong', 'casual', 'board', 'zen', 'trending', 'new'],
    game_type: 'bundle',
    bundle_url: '/green-mahjong/',
    entry_path: 'index.html',
    icon: '🀄',
    rating: 4.9,
    plays: 91200,
    featured: true,
    is_new: true,
    is_trending: true,
    bannerColor: 'linear-gradient(135deg, #15803d, #047857)',
    description: 'Relaxing and beautiful solitaire Mahjong puzzle game! Match matching traditional tiles to clear the pyramid board.',
    controls: 'Mouse/Touch: Click or tap uncovered matching tiles to pair and clear them.',
    instructions: 'Find free tiles with matching symbols to remove them. Clear the entire board to achieve high score masteries!'
  },
  {
    id: 'game_gladiator_3d',
    title: 'Gladiator 3D: Raycast Dungeon',
    slug: 'gladiator-3d-raycast-dungeon',
    category: 'action',
    tags: ['action', '3d', 'fps', 'retro', 'raycast', 'dungeon', 'new'],
    game_type: 'bundle',
    bundle_url: '/gladiator-3d/',
    entry_path: 'index.html',
    icon: '🗡️',
    rating: 4.8,
    plays: 87400,
    featured: true,
    is_new: true,
    is_trending: true,
    bannerColor: 'linear-gradient(135deg, #b91c1c, #991b1b)',
    description: 'Fast-paced Wolfenstein-style pseudo-3D raycast FPS dungeon crawler! Navigate stone labyrinths and eliminate gladiators.',
    controls: 'Desktop: [WASD / Arrow Keys] to move & turn, [Space] to interact/attack.',
    instructions: 'Search dark stone labyrinths, use your minimap radar, and eliminate arena enemies before they strike.'
  },
  {
    id: 'game_cellmates_breakout',
    title: 'Cell Mates: Prison Break Rush',
    slug: 'cell-mates-prison-break',
    category: 'arcade',
    tags: ['arcade', 'stealth', 'pixel', 'action', 'new'],
    game_type: 'bundle',
    bundle_url: '/cellmates/',
    entry_path: 'index.html',
    icon: '⛓️',
    rating: 4.7,
    plays: 72600,
    featured: true,
    is_new: true,
    is_trending: true,
    bannerColor: 'linear-gradient(135deg, #475569, #334155)',
    description: 'Stealth prison breakout action game! Sneak past laser surveillance and guards to help your fellow inmate escape.',
    controls: 'Desktop: [Arrow Keys] to creep, navigate corridors, and dodge security cameras.',
    instructions: 'Evade spotlights, coordinate timing with your partner, and reach the safe exit hatch.'
  },
  {
    id: 'game_marblesoccer_3d',
    title: 'Marble Soccer: 3D Physics Arena',
    slug: 'marble-soccer-3d-physics',
    category: 'sports',
    tags: ['sports', '3d', 'marble', 'soccer', 'physics', 'new'],
    game_type: 'bundle',
    bundle_url: '/marblesoccer/',
    entry_path: 'index.html',
    icon: '⚽',
    rating: 4.8,
    plays: 85900,
    featured: true,
    is_new: true,
    is_trending: true,
    bannerColor: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    description: '3D real-time physics arcade soccer! Steer your rolling marble to dribble balls into the goal zones.',
    controls: 'Desktop: [Arrow Keys / WASD] to steer marble velocity and push the ball.',
    instructions: 'Dribble the soccer ball past obstacles and score clean goals into the red square net zones!'
  },
  {
    id: 'game_pixelplatformer_jump',
    title: 'Pixel Platformer: Retro Jump',
    slug: 'pixel-platformer-retro-jump',
    category: 'arcade',
    tags: ['arcade', 'platformer', 'retro', 'pixel', 'new'],
    game_type: 'bundle',
    bundle_url: '/pixelplatformer/',
    entry_path: 'index.html',
    icon: '🏃',
    rating: 4.7,
    plays: 69800,
    featured: true,
    is_new: true,
    is_trending: true,
    bannerColor: 'linear-gradient(135deg, #0284c7, #0369a1)',
    description: 'Classic pixelated side-scrolling platformer! Leap over pits, dodge spike hazards, and collect golden gems.',
    controls: 'Desktop: [Left/Right Arrow] to run, [Spacebar / Up Arrow] to jump.',
    instructions: 'Time your jumps precisely between platforms and dodge hazards to reach the level exit.'
  }
];

// Register in gamesRegistry.js
const registryPath = path.join(rootDir, 'js', 'data', 'gamesRegistry.js');
let registryContent = fs.readFileSync(registryPath, 'utf8');

for (let i = newGames.length - 1; i >= 0; i--) {
  const g = newGames[i];
  if (!registryContent.includes(g.id)) {
    const defaultGamesMarker = 'export const DEFAULT_GAMES = [';
    const gameStr = `  ${JSON.stringify(g, null, 2)},\n`;
    registryContent = registryContent.replace(defaultGamesMarker, `${defaultGamesMarker}\n${gameStr}`);
    console.log(`✅ Registered ${g.title} in gamesRegistry.js`);
  }
}
fs.writeFileSync(registryPath, registryContent, 'utf8');

console.log('Done bundling and registering new batch!');

