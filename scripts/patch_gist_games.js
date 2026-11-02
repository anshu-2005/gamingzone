import fs from 'fs';

const gzBadgeHtml = `
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
  .gz-controls-bar {
    position: fixed;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 99990;
    display: flex;
    align-items: center;
    gap: 16px;
    background: rgba(3, 7, 18, 0.85);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    padding: 8px 20px;
    border-radius: 9999px;
    color: #94a3b8;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 12px;
    font-weight: 500;
    box-shadow: 0 8px 25px rgba(0,0,0,0.6);
    pointer-events: none;
  }
  .gz-controls-bar strong {
    color: #f1f5f9;
  }
  @media (max-width: 600px) {
    .gz-controls-bar {
      font-size: 10px;
      gap: 10px;
      padding: 6px 14px;
      bottom: 8px;
    }
  }
</style>
<div class="gz-top-badge">
  <span style="font-size: 14px;">🎮</span> GAMINGZONE EDITION
</div>
`;

// 1. PATCH ALIEN INVASION
console.log('Patching Alien Invasion...');
const aiHtml = `<!DOCTYPE HTML>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Alien Invasion - GAMINGZONE</title>
  <link rel="stylesheet" href="base.css" type="text/css" />
  <link href="https://fonts.googleapis.com/css2?family=Bangers&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <meta name="viewport" content="width=device-width, user-scalable=0, minimum-scale=1.0, maximum-scale=1.0"/>
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <style>
    body {
      background: radial-gradient(circle at 50% 30%, #0b1528 0%, #030712 100%);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      font-family: 'Inter', sans-serif;
    }
    #container {
      padding-top: 0 !important;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    canvas#game {
      border: 2px solid rgba(56, 189, 248, 0.4);
      border-radius: 12px;
      box-shadow: 0 0 35px rgba(56, 189, 248, 0.25), 0 15px 40px rgba(0, 0, 0, 0.8);
      background-color: #020617;
    }
  </style>
</head>
<body>
  ${gzBadgeHtml}
  <div id='container'>
    <canvas id='game' width='320' height='480'></canvas>
  </div>
  <div class="gz-controls-bar">
    <span>🕹️ <strong>ARROWS:</strong> Move</span>
    <span>💥 <strong>SPACE:</strong> Fire</span>
    <span>⏸️ <strong>P:</strong> Pause</span>
  </div>
  <script src='engine.js'></script>
  <script src='game.js'></script>
</body>
</html>
`;
fs.writeFileSync('public/alien-invasion/index.html', aiHtml, 'utf8');

// 2. PATCH COIL
console.log('Patching Coil...');
let coilHtml = fs.readFileSync('public/coil/index.html', 'utf8');
// Strip http fonts and replace with https
coilHtml = coilHtml.replace(/http:\/\/fonts\.googleapis\.com/g, 'https://fonts.googleapis.com');
// Strip social share section
coilHtml = coilHtml.replace(/<section id="share">[\s\S]*?<\/section>\s*<\/section>/, `
  <section id="share">
    <h3>Portal</h3>
    <p style="font-size: 13px; color: #38bdf8; line-height: 1.5;">
      Official <a href="https://game-ten-iota-67.vercel.app/" target="_top" style="color: #38bdf8; font-weight: bold; text-decoration: underline;">GAMINGZONE</a> Release<br>
      Profile: <a href="https://github.com/anshu-2005" target="_blank" style="color: #a855f7;">@anshu-2005</a>
    </p>
  </section>
`);
// Remove flattr script
coilHtml = coilHtml.replace(/<script type="text\/javascript">\s*\/\* <!\[CDATA\[ \*\/[\s\S]*?\/\* \]\]>\*\/[\s\S]*?<\/script>/, '');
// Replace credits
coilHtml = coilHtml.replace(/Created by <a href="http:\/\/hakim\.se\/">Hakim El Hattab<\/a> \| <a href="http:\/\/twitter\.com\/hakimel">@hakimel<\/a>/, 
  'Enhanced for <a href="https://game-ten-iota-67.vercel.app/" target="_top">GAMINGZONE</a> | <a href="https://github.com/anshu-2005" target="_blank">@anshu-2005</a>');
// Inject GAMINGZONE badge
coilHtml = coilHtml.replace('<body>', `<body>\n${gzBadgeHtml}`);
fs.writeFileSync('public/coil/index.html', coilHtml, 'utf8');

// 3. PATCH SKIFREE
console.log('Patching SkiFree...');
const skifreeHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>SkiFree - GAMINGZONE</title>
    <meta name="description" content="Classic SkiFree HTML5 Arcade Game on GAMINGZONE">
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=0">
    <link rel="stylesheet" href="css/normalize.css">
    <link rel="stylesheet" href="css/main.css">
    <link rel="stylesheet" href="css/skifree.css">
    <style>
      body {
        background: #030712;
        margin: 0;
        overflow: hidden;
      }
      canvas#skifree-canvas {
        display: block;
      }
    </style>
</head>
<body>
    ${gzBadgeHtml}
    <canvas id="skifree-canvas" tabindex="0"></canvas>
    <div class="gz-controls-bar">
      <span>⛷️ <strong>ARROWS:</strong> Steer / Speed</span>
      <span>🏂 <strong>SPACE:</strong> Jump</span>
      <span>👾 <strong>WARNING:</strong> Watch out for the Monster!</span>
    </div>
    <script src="dist/skifree.js"></script>
</body>
</html>
`;
fs.writeFileSync('public/skifree/index.html', skifreeHtml, 'utf8');

// 4. PATCH SORADES 13K
console.log('Patching Sorades 13K...');
let soradesHtml = fs.readFileSync('public/sorades/index.html', 'utf8');
// Remove tweet element
soradesHtml = soradesHtml.replace(/<p id="tweet">[\s\S]*?<\/p>/, '');
// Inject badge
soradesHtml = soradesHtml.replace('<body>', `<body>\n${gzBadgeHtml}`);
// Replace description links
soradesHtml = soradesHtml.replace(/<p id="desc">[\s\S]*?<\/p>/, `
  <p id="desc" style="background: rgba(16, 22, 28, 0.95); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 8px; padding: 12px 18px; color: #94a3b8; font-family: system-ui, sans-serif;">
    <a href="https://game-ten-iota-67.vercel.app/" style="color: #38bdf8; font-weight: 700; text-decoration: none;">SORADES 13K</a>
    - Arcade Galaga Shooter on <a href="https://game-ten-iota-67.vercel.app/" style="color: #38bdf8;">GAMINGZONE</a>.
    <span class="note" style="display: block; margin-top: 4px; color: #cbd5e1;">Developer: <a href="https://github.com/anshu-2005" target="_blank" style="color: #a855f7;">@anshu-2005</a></span>
    <span class="note" style="display: block; margin-top: 4px; color: #38bdf8;">🎮 Controls: <strong>Arrow Keys</strong> to steer • <strong>X</strong> to fire • <strong>F</strong> for fullscreen.</span>
  </p>
`);
// Remove external Gramambo logo SVG link
soradesHtml = soradesHtml.replace(/<a href="http:\/\/www\.gramambo\.de\/"[\s\S]*?<\/a>/, '');
fs.writeFileSync('public/sorades/index.html', soradesHtml, 'utf8');

console.log('Successfully patched all 4 games!');

