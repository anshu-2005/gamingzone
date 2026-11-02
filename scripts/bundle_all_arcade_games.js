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

const gamesToBundle = [
  {
    id: 'game_asteroids_vector',
    slug: 'asteroids-vector-classic',
    title: 'Asteroids: Vector Arcade Classic',
    dir: 'asteroids',
    src: 'scratch_arcade/html5-asteroids',
    entry: 'index.html',
    category: 'arcade',
    tags: ['arcade', 'retro', 'space', 'vector', 'trending', 'new'],
    icon: '🚀',
    rating: 4.8,
    plays: 89400,
    bannerColor: 'linear-gradient(135deg, #0284c7, #2563eb)',
    description: 'Classic vector-graphics Asteroids in pure HTML5 Canvas. Rotate, thrust, and blast cosmic space rocks with precision lasers.',
    controls: 'Desktop: [Left/Right] Rotate, [Up Arrow] Thrust, [Space] Fire, [Down] Hyperspace.',
    instructions: 'Destroy all tumbling asteroids while avoiding collisions. Split large rocks into smaller faster fragments!'
  },
  {
    id: 'game_digger_boulderdash',
    slug: 'digger-boulder-dash',
    title: 'Digger: Boulder Dash Remake',
    dir: 'digger',
    src: 'scratch_arcade/digger',
    entry: 'index.html',
    category: 'arcade',
    tags: ['arcade', 'puzzle', 'retro', 'digger', 'new'],
    icon: '⛏️',
    rating: 4.8,
    plays: 78500,
    bannerColor: 'linear-gradient(135deg, #d97706, #b45309)',
    description: 'HTML5 recreation of classic Boulderdash. Dig subterranean tunnels, dodge falling boulders, and collect glowing emerald gems.',
    controls: 'Desktop: [Arrow Keys] to dig and move around subterranean caverns.',
    instructions: 'Dig carefully under boulders without letting them crush you. Collect the required number of diamonds to unlock the portal.'
  },
  {
    id: 'game_draconas_3d',
    slug: 'draconas-3d-shmup',
    title: 'Draconas: 3D Space Shmup',
    dir: 'draconas',
    src: 'scratch_arcade/drakonas',
    entry: 'index.html',
    category: 'action',
    tags: ['action', 'arcade', '3d', 'shooter', 'space', 'new'],
    icon: '🐲',
    rating: 4.9,
    plays: 93200,
    bannerColor: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    description: 'Classic shoot em up space combat built with Three.js 3D graphics and high-speed laser dogfights.',
    controls: 'Desktop: [Arrow Keys / WASD] to steer starfighter, [Space] to fire blasters.',
    instructions: 'Blast enemy squadrons out of the sky, dodge laser trajectories, and upgrade your weaponry in the hangar.'
  },
  {
    id: 'game_hurry_shooter',
    slug: 'hurry-speedy-arcade',
    title: 'Hurry! Speedy Arcade Shooter',
    dir: 'hurry-shooter',
    src: 'scratch_arcade/ludum-dare-27',
    entry: 'index.html',
    category: 'arcade',
    tags: ['arcade', 'action', 'retro', 'speed', 'new'],
    icon: '⚡',
    rating: 4.7,
    plays: 67300,
    bannerColor: 'linear-gradient(135deg, #e11d48, #be123c)',
    description: 'Fast, intense, speed-focused arcade shooter. Dodge enemy volleys and clear rounds against the ticking clock.',
    controls: 'Desktop: [Arrow Keys] to steer, [X / Space] to shoot rapidly.',
    instructions: 'Hurry! Defeat all waves before the timer counts down to zero. Chain hits for speed bonuses.'
  },
  {
    id: 'game_mario_html5',
    slug: 'mario-bros-infinite',
    title: 'Mario Bros HTML5: Infinite Run',
    dir: 'mario-html5',
    src: 'scratch_arcade/mariohtml5',
    entry: 'main.html',
    category: 'arcade',
    tags: ['arcade', 'platformer', 'mario', 'retro', 'trending', 'new'],
    icon: '🍄',
    rating: 4.9,
    plays: 145000,
    bannerColor: 'linear-gradient(135deg, #ef4444, #f59e0b)',
    description: 'Infinite procedural Mario platformer in HTML5 Canvas. Jump on Goombas, smash mystery blocks, and collect gold coins.',
    controls: 'Desktop: [Left/Right] Run, [S] Jump, [A] Run Fast / Fireball.',
    instructions: 'Stomp on enemy creatures, collect super mushrooms and fire flowers, and reach the flagpole at each castle!'
  },
  {
    id: 'game_duck_hunt_retro',
    slug: 'duck-hunt-retro-target',
    title: 'Duck Hunt: Retro Arcade Target',
    dir: 'duck-hunt',
    src: 'scratch_arcade/duckhunt-js/dist',
    entry: 'index.html',
    category: 'arcade',
    tags: ['arcade', 'retro', 'shooter', 'nostalgia', 'new'],
    icon: '🦆',
    rating: 4.9,
    plays: 118000,
    bannerColor: 'linear-gradient(135deg, #10b981, #06b6d4)',
    description: 'Nostalgic retro Duck Hunt shooter faithfully recreated in HTML5 and Canvas with sound effects and precision crosshairs.',
    controls: 'Mouse/Touch: Aim crosshair and [Left Click] or Tap to shoot.',
    instructions: 'Shoot the ducks as they fly out of the grass before they fly away. 3 shots per wave!'
  },
  {
    id: 'game_onslaught_arena',
    slug: 'onslaught-arena-combat',
    title: 'Onslaught Arena: Medieval Combat',
    dir: 'onslaught-arena',
    src: 'scratch_arcade/onslaught_arena/htdocs',
    entry: 'index.html',
    category: 'action',
    tags: ['action', 'arcade', 'combat', 'medieval', 'trending', 'new'],
    icon: '⚔️',
    rating: 4.9,
    plays: 132000,
    bannerColor: 'linear-gradient(135deg, #854d0e, #a16207)',
    description: 'Fast-paced medieval arena combat! Slay hordes of ogres, bats, and castle monsters with battle axes and crossbows.',
    controls: 'Desktop: [WASD / Arrows] Move, [Mouse Aim + Left Click] Attack.',
    instructions: 'Survive incoming waves of castle beasts in the gladiator ring. Collect weapon drops and heart pickups.'
  },
  {
    id: 'game_hotfix_rush',
    slug: 'hotfix-stargazer-dash',
    title: 'HotFix: Git Stargazer Dash',
    dir: 'hotfix-rush',
    src: 'scratch_arcade/hotfix',
    entry: 'index.html',
    category: 'arcade',
    tags: ['arcade', 'runner', 'retro', 'coder', 'new'],
    icon: '💻',
    rating: 4.7,
    plays: 62400,
    bannerColor: 'linear-gradient(135deg, #1e293b, #334155)',
    description: 'Collect commits and stargazers while dodging pesky production bugs in this clever coder arcade runner.',
    controls: 'Desktop: [Arrow Keys] to steer the developer ship, avoid critical production bugs.',
    instructions: 'Collect stars, commit patches, and deploy hotfixes before crashing into fatal errors.'
  },
  {
    id: 'game_coffee_snake',
    slug: 'coffee-snake-retro',
    title: 'Coffee Snake: Retro Slither',
    dir: 'coffee-snake',
    src: 'scratch_arcade/coffee-snake',
    entry: 'index.html',
    category: 'arcade',
    tags: ['arcade', 'snake', 'retro', 'casual', 'new'],
    icon: '🐍',
    rating: 4.7,
    plays: 74100,
    bannerColor: 'linear-gradient(135deg, #15803d, #166534)',
    description: 'Clean, responsive HTML5 retro snake game. Slither, gobble energy pellets, and beat your personal record.',
    controls: 'Desktop: [Arrow Keys] to change slither direction.',
    instructions: 'Eat coffee beans and food to grow longer. Don’t bite your own tail or crash into boundaries.'
  },
  {
    id: 'game_survivor_1982',
    slug: 'survivor-1982-arcade',
    title: 'Survivor 1982: Space Arcade',
    dir: 'survivor-1982',
    src: 'scratch_arcade/survivor',
    entry: 'index.html',
    category: 'arcade',
    tags: ['arcade', 'retro', 'space', 'classic', 'new'],
    icon: '🛸',
    rating: 4.7,
    plays: 58900,
    bannerColor: 'linear-gradient(135deg, #0f172a, #1e293b)',
    description: 'Faithful remake of the 1982 Atari and Commodore 64 space shooter with orbital defense systems.',
    controls: 'Desktop: [Arrow Keys] Move, [Space] Fire, [Esc] Pause.',
    instructions: 'Destroy hostile space forts and avoid roaming orbital turrets.'
  },
  {
    id: 'game_zed_invaders',
    slug: 'zed-invaders-comic',
    title: 'ZED Invaders: Comic Arcade Defense',
    dir: 'zed-invaders',
    src: 'scratch_arcade/zedinvaders',
    entry: 'index.html',
    category: 'arcade',
    tags: ['arcade', 'shooter', 'retro', 'comic', 'new'],
    icon: '👾',
    rating: 4.8,
    plays: 71200,
    bannerColor: 'linear-gradient(135deg, #701a75, #4a044e)',
    description: 'Original comic book styled Space Invaders arcade defense game with explosive particle feedback.',
    controls: 'Desktop: [Left/Right Arrows] Move turret, [Space] Fire.',
    instructions: 'Defend earth from the Comic ZED invasion forces before they touch down!'
  },
  {
    id: 'game_crappy_bird_2d',
    slug: 'crappy-bird-2d-canvas',
    title: 'Crappy Bird: 2D Flappy Challenge',
    dir: 'crappy-bird',
    src: 'scratch_arcade/crappybird',
    entry: 'index.html',
    category: 'arcade',
    tags: ['arcade', 'flappy', 'casual', 'retro', 'new'],
    icon: '🐥',
    rating: 4.6,
    plays: 81400,
    bannerColor: 'linear-gradient(135deg, #0284c7, #0369a1)',
    description: 'Pure lightweight 2D Canvas Flappy Bird arcade rush. Navigate tight pipes and aim for high scores.',
    controls: 'Desktop/Mobile: [Space] or [Tap/Click] to flap wings.',
    instructions: 'Maintain altitude and fly through green pipe gaps without brushing them.'
  },
  {
    id: 'game_ekg_runner',
    slug: 'ekg-runner-rhythm',
    title: 'EKG Runner: Rhythm Pulse',
    dir: 'ekg-runner',
    src: 'scratch_arcade/ekgrunner',
    entry: 'index.html',
    category: 'arcade',
    tags: ['arcade', 'runner', 'rhythm', 'minimalist', 'new'],
    icon: '💓',
    rating: 4.7,
    plays: 54300,
    bannerColor: 'linear-gradient(135deg, #991b1b, #7f1d1d)',
    description: 'Fast rhythmic pulse runner where you surf electric heartbeats and leap through audio spikes.',
    controls: 'Desktop: [Spacebar / Up Arrow] to jump over cardiogram spikes.',
    instructions: 'Keep the rhythm going and jump cleanly across electrical spikes without flatlining.'
  },
  {
    id: 'game_polybranch_3d',
    slug: 'polybranch-3d-reflex',
    title: 'Polybranch: Minimalist 3D Reflex',
    dir: 'polybranch-3d',
    src: 'scratch_arcade/polybranch/polybranchweb',
    entry: 'index.html',
    category: 'arcade',
    tags: ['arcade', '3d', 'reflex', 'minimalist', 'new'],
    icon: '🌲',
    rating: 4.8,
    plays: 68900,
    bannerColor: 'linear-gradient(135deg, #059669, #047857)',
    description: 'Hypnotic 3D obstacle dodger. Weave between geometric tree branches at supersonic terminal velocities.',
    controls: 'Desktop: [Arrow Keys] to dodge branching geometric limbs.',
    instructions: 'React rapidly to upcoming branch forks and weave through clear openings.'
  }
];

console.log('Copying and patching game bundles...');

for (const game of gamesToBundle) {
  const destDir = path.join(rootDir, 'public', game.dir);
  console.log(`Copying ${game.src} -> ${destDir}...`);
  copyDir(game.src, destDir);

  // If entry is main.html, copy it to index.html
  if (game.entry !== 'index.html') {
    const origEntry = path.join(destDir, game.entry);
    const targetEntry = path.join(destDir, 'index.html');
    if (fs.existsSync(origEntry)) {
      fs.copyFileSync(origEntry, targetEntry);
    }
  }

  // Patch index.html
  const indexPath = path.join(destDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, 'utf8');

    // Remove any Google Analytics or tracking scripts
    html = html.replace(/<script[\s\S]*?google-analytics\.com[\s\S]*?<\/script>/gi, '');
    html = html.replace(/<script[\s\S]*?googletagmanager\.com[\s\S]*?<\/script>/gi, '');
    html = html.replace(/<iframe[\s\S]*?facebook\.com[\s\S]*?<\/iframe>/gi, '');
    html = html.replace(/<script[\s\S]*?platform\.twitter\.com[\s\S]*?<\/script>/gi, '');

    // Inject GAMINGZONE badge if not present
    if (!html.includes('gz-top-badge')) {
      if (html.includes('<body>')) {
        html = html.replace('<body>', `<body>\n${gzBadgeSnippet}`);
      } else if (html.includes('<BODY>')) {
        html = html.replace('<BODY>', `<BODY>\n${gzBadgeSnippet}`);
      } else {
        html = `${gzBadgeSnippet}\n${html}`;
      }
    }

    fs.writeFileSync(indexPath, html, 'utf8');
    console.log(`  -> Patched index.html for ${game.title}`);
  }
}

// Register in gamesRegistry.js
const registryPath = path.join(rootDir, 'js', 'data', 'gamesRegistry.js');
let registryContent = fs.readFileSync(registryPath, 'utf8');

for (let i = gamesToBundle.length - 1; i >= 0; i--) {
  const g = gamesToBundle[i];
  if (!registryContent.includes(g.id)) {
    const regObj = {
      id: g.id,
      title: g.title,
      slug: g.slug,
      category: g.category,
      tags: g.tags,
      game_type: 'bundle',
      bundle_url: `/${g.dir}/`,
      entry_path: 'index.html',
      icon: g.icon,
      rating: g.rating,
      plays: g.plays,
      featured: true,
      is_new: true,
      is_trending: true,
      bannerColor: g.bannerColor,
      description: g.description,
      controls: g.controls,
      instructions: g.instructions,
      status: 'published'
    };
    const defaultGamesMarker = 'export const DEFAULT_GAMES = [';
    const gameStr = `  ${JSON.stringify(regObj, null, 2)},\n`;
    registryContent = registryContent.replace(defaultGamesMarker, `${defaultGamesMarker}\n${gameStr}`);
    console.log(`✅ Registered ${g.title} in gamesRegistry.js`);
  }
}
fs.writeFileSync(registryPath, registryContent, 'utf8');

console.log('Finished bundling and registering all arcade games!');

