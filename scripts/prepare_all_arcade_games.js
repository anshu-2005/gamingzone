import fs from 'fs';
import path from 'path';

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

const candidates = [
  { slug: 'asteroids', src: 'scratch_arcade/html5-asteroids', entry: 'index.html', title: 'Asteroids: Vector Arcade Classic', icon: '🚀', cat: 'arcade', desc: 'Classic vector-graphics Asteroids in pure HTML5 Canvas. Rotate, thrust, and blast cosmic space rocks.' },
  { slug: 'digger', src: 'scratch_arcade/digger', entry: 'index.html', title: 'Digger: Boulder Dash Remake', icon: '⛏️', cat: 'arcade', desc: 'HTML5 recreation of classic Boulderdash. Dig tunnels, dodge falling boulders, and collect glowing gems.' },
  { slug: 'draconas', src: 'scratch_arcade/drakonas', entry: 'index.html', title: 'Draconas: 3D Space Shmup', icon: '🐲', cat: 'action', desc: 'Classic shoot em up space combat built with Three.js 3D graphics and high-speed laser dogfights.' },
  { slug: 'hurry-shooter', src: 'scratch_arcade/ludum-dare-27', entry: 'index.html', title: 'Hurry! Speedy Arcade Shooter', icon: '⚡', cat: 'arcade', desc: 'Fast, intense, speed-focused arcade shooter. Dodge enemy volleys and clear rounds against the clock.' },
  { slug: 'mario-html5', src: 'scratch_arcade/mariohtml5', entry: 'main.html', title: 'Mario Bros HTML5: Infinite Run', icon: '🍄', cat: 'arcade', desc: 'Infinite procedural Mario platformer in HTML5 Canvas. Jump on Goombas, smash blocks, and collect coins.' },
  { slug: 'duck-hunt', src: 'scratch_arcade/duckhunt-js/dist', entry: 'index.html', title: 'Duck Hunt: Retro Arcade Target', icon: '🦆', cat: 'arcade', desc: 'Nostalgic retro Duck Hunt shooter faithfully recreated in HTML5 and Canvas with sound and precision aim.' },
  { slug: 'onslaught-arena', src: 'scratch_arcade/onslaught_arena/htdocs', entry: 'index.html', title: 'Onslaught Arena: Medieval Combat', icon: '⚔️', cat: 'action', desc: 'Fast-paced medieval arena combat! Slay hordes of ogres, bats, and castle monsters with axes and crossbows.' },
  { slug: 'hotfix-rush', src: 'scratch_arcade/hotfix', entry: 'index.html', title: 'HotFix: Git Stargazer Dash', icon: '💻', cat: 'arcade', desc: 'Collect commits and stargazers while dodging pesky production bugs in this clever coder arcade runner.' },
  { slug: 'coffee-snake', src: 'scratch_arcade/coffee-snake', entry: 'index.html', title: 'Coffee Snake: Retro Slither', icon: '🐍', cat: 'arcade', desc: 'Clean, responsive HTML5 retro snake game. Slither, gobble energy pellets, and beat your personal record.' },
  { slug: 'survivor-1982', src: 'scratch_arcade/survivor', entry: 'index.html', title: 'Survivor 1982: Space Arcade', icon: '🛸', cat: 'arcade', desc: 'Faithful remake of the 1982 Atari and Commodore 64 space shooter with orbital defense systems.' },
  { slug: 'zed-invaders', src: 'scratch_arcade/zedinvaders', entry: 'index.html', title: 'ZED Invaders: Comic Arcade Defense', icon: '👾', cat: 'arcade', desc: 'Original comic book styled Space Invaders arcade defense game with explosive particle feedback.' },
  { slug: 'crappy-bird', src: 'scratch_arcade/crappybird', entry: 'index.html', title: 'Crappy Bird: 2D Flappy Challenge', icon: '🐥', cat: 'arcade', desc: 'Pure lightweight 2D Canvas Flappy Bird arcade rush. Navigate tight pipes and aim for high scores.' },
  { slug: 'ekg-runner', src: 'scratch_arcade/ekgrunner', entry: 'index.html', title: 'EKG Runner: Rhythm Pulse', icon: '💓', cat: 'arcade', desc: 'Fast rhythmic pulse runner where you surf electric heartbeats and leap through audio spikes.' },
  { slug: 'polybranch-3d', src: 'scratch_arcade/polybranch/polybranchweb', entry: 'index.html', title: 'Polybranch: Minimalist 3D Reflex', icon: '🌲', cat: 'arcade', desc: 'Hypnotic 3D obstacle dodger. Weave between geometric tree branches at supersonic terminal velocities.' }
];

console.log(`Checking ${candidates.length} candidates...`);

const valid = [];
for (const cand of candidates) {
  if (fs.existsSync(cand.src)) {
    const entryPath = path.join(cand.src, cand.entry);
    if (fs.existsSync(entryPath)) {
      console.log(`✅ [FOUND] ${cand.title} -> ${cand.src}/${cand.entry}`);
      valid.push(cand);
    } else {
      console.log(`⚠️ [MISSING ENTRY] ${cand.title} (${entryPath})`);
    }
  } else {
    console.log(`❌ [MISSING DIR] ${cand.title} (${cand.src})`);
  }
}

fs.writeFileSync('valid_arcade_candidates.json', JSON.stringify(valid, null, 2));
console.log(`\nValid arcade games ready to bundle: ${valid.length}`);
