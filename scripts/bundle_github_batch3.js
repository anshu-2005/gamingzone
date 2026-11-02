import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === '.git') continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const badgeHtml = `
  <!-- GAMINGZONE Badge -->
  <div style="position: fixed; top: 12px; left: 12px; z-index: 999999; font-family: 'Exo 2', -apple-system, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #38bdf8; background: rgba(15, 23, 42, 0.92); backdrop-filter: blur(8px); padding: 6px 14px; border-radius: 999px; border: 1px solid rgba(56, 189, 248, 0.4); box-shadow: 0 4px 15px rgba(0,0,0,0.5); text-transform: uppercase; display: flex; align-items: center; gap: 6px; pointer-events: auto;">
    <span style="font-size: 14px;">🎮</span> GAMINGZONE EDITION
    <a href="https://github.com/anshu-2005" target="_blank" style="color: #c084fc; text-decoration: none; margin-left: 6px; font-weight: 600;">• Anshu ↗</a>
  </div>
`;

// 1. Process Command & Conquer
console.log('Copying Command & Conquer...');
const cncDest = path.join(rootDir, 'public', 'command-and-conquer');
copyDirRecursive(path.join(rootDir, 'temp_repos', 'command-and-conquer'), cncDest);
let cncIndex = fs.readFileSync(path.join(cncDest, 'index.html'), 'utf8');
cncIndex = cncIndex.replace(/<title>[\s\S]*?<\/title>/i, '<title>Command & Conquer: Tiberian Dawn RTS | GAMINGZONE</title>');
cncIndex = cncIndex.replace(/<meta property='fb:app_id'[\s\S]*?\/>/g, '');
cncIndex = cncIndex.replace(/<link href="http:\/\/www\.adityaravishankar\.com[\s\S]*?\/>/g, '');
if (!cncIndex.includes('GAMINGZONE EDITION')) {
  cncIndex = cncIndex.replace('<body>', '<body>\n' + badgeHtml);
}
fs.writeFileSync(path.join(cncDest, 'index.html'), cncIndex, 'utf8');

// 2. Process Tower Defense 3D
console.log('Copying Tower Defense 3D...');
const tdDest = path.join(rootDir, 'public', 'tower-defense-3d');
copyDirRecursive(path.join(rootDir, 'temp_repos', 'tower-defense'), tdDest);
let tdIndex = fs.readFileSync(path.join(tdDest, 'index.html'), 'utf8');
tdIndex = tdIndex.replace(/<title>[\s\S]*?<\/title>/i, '<title>Tower Defense 3D: Tactical Kingdom | GAMINGZONE</title>');
if (!tdIndex.includes('GAMINGZONE EDITION')) {
  tdIndex = tdIndex.replace('<body>', '<body>\n' + badgeHtml);
}
fs.writeFileSync(path.join(tdDest, 'index.html'), tdIndex, 'utf8');

// 3. Process Orbium
console.log('Copying Orbium...');
const orbDest = path.join(rootDir, 'public', 'orbium');
copyDirRecursive(path.join(rootDir, 'temp_repos', 'orbium'), orbDest);
let orbIndex = fs.readFileSync(path.join(orbDest, 'index.html'), 'utf8');
orbIndex = orbIndex.replace(/<title>[\s\S]*?<\/title>/i, '<title>Orbium: Marble Rotator Puzzle | GAMINGZONE</title>');
if (!orbIndex.includes('GAMINGZONE EDITION')) {
  orbIndex = orbIndex.replace('<body>', '<body>\n' + badgeHtml);
}
fs.writeFileSync(path.join(orbDest, 'index.html'), orbIndex, 'utf8');

// 4. Process Diablo JS
console.log('Copying Diablo JS...');
const diabloDest = path.join(rootDir, 'public', 'diablo-js');
copyDirRecursive(path.join(rootDir, 'temp_repos', 'diablo-js'), diabloDest);
let diabloIndex = fs.readFileSync(path.join(diabloDest, 'index.html'), 'utf8');
diabloIndex = diabloIndex.replace(/<head>/i, '<head><title>Diablo JS: Isometric Hack & Slash RPG | GAMINGZONE</title>');
if (!diabloIndex.includes('GAMINGZONE EDITION')) {
  diabloIndex = diabloIndex.replace('<body>', '<body>\n' + badgeHtml);
}
fs.writeFileSync(path.join(diabloDest, 'index.html'), diabloIndex, 'utf8');

// 5. Process Heartline
console.log('Copying Heartline...');
const heartDest = path.join(rootDir, 'public', 'heartline');
copyDirRecursive(path.join(rootDir, 'temp_repos', 'heartline'), heartDest);
let heartIndex = fs.readFileSync(path.join(heartDest, 'index.html'), 'utf8');
heartIndex = heartIndex.replace(/<head>/i, '<head><title>HeartLine: Pulse Platformer | GAMINGZONE</title>');
if (!heartIndex.includes('GAMINGZONE EDITION')) {
  heartIndex = heartIndex.replace('<body>', '<body>\n' + badgeHtml);
}
fs.writeFileSync(path.join(heartDest, 'index.html'), heartIndex, 'utf8');

// 6. Process Cube Engine
console.log('Copying Cube Engine...');
const cubeDest = path.join(rootDir, 'public', 'cube-engine');
copyDirRecursive(path.join(rootDir, 'temp_repos', 'cube-engine'), cubeDest);
if (fs.existsSync(path.join(cubeDest, 'play.htm'))) {
  let cubeIndex = fs.readFileSync(path.join(cubeDest, 'play.htm'), 'utf8');
  cubeIndex = cubeIndex.replace(/<title>[\s\S]*?<\/title>/i, '<title>Cube Engine: 3D Voxel Sandbox | GAMINGZONE</title>');
  if (!cubeIndex.includes('GAMINGZONE EDITION')) {
    cubeIndex = cubeIndex.replace('<body>', '<body>\n' + badgeHtml);
  }
  fs.writeFileSync(path.join(cubeDest, 'index.html'), cubeIndex, 'utf8');
}

console.log('✅ Successfully copied and branded all 6 games into public/');
