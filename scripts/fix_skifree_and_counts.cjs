const fs = require('fs');

console.log('=== APPLYING SKIFREE SNOW & UI CONSISTENCY FIXES ===');

// 1. Fix SkiFree canvas background to authentic snow white
const skifreeHtmlPath = 'public/skifree/index.html';
if (fs.existsSync(skifreeHtmlPath)) {
  let html = fs.readFileSync(skifreeHtmlPath, 'utf8');
  // Add canvas white background override for snow slope
  const patch = `
<style id="skifree-snow-fix">
  canvas#skifree-canvas {
    background-color: #ffffff !important;
    background: #ffffff !important;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.7) !important;
  }
</style>
`;
  if (!html.includes('id="skifree-snow-fix"')) {
    html = html.replace('</head>', patch + '\n</head>');
    fs.writeFileSync(skifreeHtmlPath, html, 'utf8');
    console.log('✓ SkiFree index.html updated with white snow background');
  }
}

// 2. Remove @basicallydan Twitter / creator link from skifree.js and ensure dark text
const skifreeJsPath = 'public/skifree/dist/skifree.js';
if (fs.existsSync(skifreeJsPath)) {
  let js = fs.readFileSync(skifreeJsPath, 'utf8');

  // Remove creator promo / twitter link from HUD lines
  js = js.replace(/,"Created by Dan Hough \(@basicallydan\)"/g, '');
  js = js.replace(/"Created by Dan Hough \(@basicallydan\)",?/g, '');

  // Ensure HUD text renders with dark readable text on white snow
  js = js.replace(/draw\(t\)\{t\.font="11px monospace";/, 'draw(t){t.fillStyle="#1e293b";t.font="11px monospace";');

  fs.writeFileSync(skifreeJsPath, js, 'utf8');
  console.log('✓ SkiFree dist/skifree.js cleaned of Twitter handle and font color set to #1e293b');
}

// 3. Fix category count in js/data/gamesRegistry.js ("All 70+ Games" -> "All 190+ Games")
const regPath = 'js/data/gamesRegistry.js';
if (fs.existsSync(regPath)) {
  let reg = fs.readFileSync(regPath, 'utf8');
  reg = reg.replace(/"name": "All 70\+ Games"/g, '"name": "All 190+ Games"');
  fs.writeFileSync(regPath, reg, 'utf8');
  console.log('✓ gamesRegistry.js category updated to All 190+ Games');
}

// 4. Fix Navbar search placeholder ("Search 140+..." -> "Search 190+...")
const navPath = 'src/components/Navbar.jsx';
if (fs.existsSync(navPath)) {
  let nav = fs.readFileSync(navPath, 'utf8');
  nav = nav.replace(/placeholder="Search 140\+ games, categories, or tags\.\.\."/g, 'placeholder="Search 190+ games, categories, or tags..."');
  fs.writeFileSync(navPath, nav, 'utf8');
  console.log('✓ Navbar.jsx placeholder updated to 190+');
}

// 5. Fix App.jsx text ("all 65+ games" -> "all 190+ games")
const appPath = 'src/App.jsx';
if (fs.existsSync(appPath)) {
  let app = fs.readFileSync(appPath, 'utf8');
  app = app.replace(/browse all 65\+ games/g, 'browse all 190+ games');
  fs.writeFileSync(appPath, app, 'utf8');
  console.log('✓ App.jsx browse text updated to 190+');
}

console.log('=== ALL FIXES APPLIED SUCCESSFULLY! ===');
