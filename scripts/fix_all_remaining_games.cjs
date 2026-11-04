const fs = require('fs');

console.log('=== FIXING ALL REMAINING GAME PROBLEMS ===');

// 1. Fix public/command-and-conquer/index.html
console.log('1. Fixing Command & Conquer...');
const cncPath = 'public/command-and-conquer/index.html';
if (fs.existsSync(cncPath)) {
  let cnc = fs.readFileSync(cncPath, 'utf8');

  // Fix mixed content: use local js/jquery.min.js instead of http://
  cnc = cnc.replace(/<script src="http:\/\/ajax\.googleapis\.com\/[^"]*"><\/script>/gi, '<script src="js/jquery.min.js"></script>');

  // Remove PayPal donate form
  cnc = cnc.replace(/<form action="https:\/\/www\.paypal\.com[\s\S]*?<\/form>/gi, '');
  cnc = cnc.replace(/If you enjoyed playing this game and would like to support[\s\S]*?free for everyone to enjoy\.\s*/gi, '');

  // Remove Facebook comments and Google+
  cnc = cnc.replace(/<div class="fb-comments"[\s\S]*?<\/div>/gi, '');
  cnc = cnc.replace(/<div class="fb-like"[\s\S]*?<\/div>/gi, '');
  cnc = cnc.replace(/<script[^>]*plus\.google\.com[^>]*><\/script>/gi, '');
  cnc = cnc.replace(/<script[^>]*plusone\.js[^>]*><\/script>/gi, '');
  cnc = cnc.replace(/<div class="g-plusone"[\s\S]*?<\/div>/gi, '');
  cnc = cnc.replace(/<script[^>]*facebook-jssdk[\s\S]*?<\/script>/gi, '');

  // Remove Amazon flash widget
  cnc = cnc.replace(/<OBJECT[\s\S]*?Amazon\.com Widgets<\/A><\/NOSCRIPT><\/p>/gi, '');

  // Center the game canvas and clean the cluttered two-column float layout
  const cncPatch = `
<style id="cnc-centering-override">
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    height: 100% !important;
    overflow: hidden !important;
    background: #030712 !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
  }
  #leftcontent {
    display: none !important;
  }
  #rightcontent {
    float: none !important;
    width: auto !important;
    padding: 0 !important;
    margin: 0 auto !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
  }
  canvas#canvas {
    display: block !important;
    margin: 0 auto !important;
    border: 2px solid rgba(56, 189, 248, 0.4) !important;
    border-radius: 8px !important;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.9) !important;
    max-width: 95vw !important;
    max-height: 90vh !important;
  }
  #specialcontrols, #debugger, #featuresdiv {
    display: none !important;
  }
</style>
`;
  if (!cnc.includes('id="cnc-centering-override"')) {
    cnc = cnc.replace('</head>', cncPatch + '\n</head>');
  }

  fs.writeFileSync(cncPath, cnc, 'utf8');
  console.log('✓ Command & Conquer fixed and centered');
}

// 2. Fix public/marblesoccer/index.html & js/pageLandingMain.js
console.log('2. Fixing Marble Soccer...');
const marbleHtmlPath = 'public/marblesoccer/index.html';
if (fs.existsSync(marbleHtmlPath)) {
  let marble = fs.readFileSync(marbleHtmlPath, 'utf8');

  // Fix duplicate <body> tag
  marble = marble.replace(/<body>\s*<!-- \*{10,}/, '<!-- **********');
  marble = marble.replace(/<\/body>\s*<\/body>/, '</body>');

  // Remove imgur screenshot window
  marble = marble.replace(/<!-- screenshotWindow -->[\s\S]*?<!-- \*{10,}\s*LandingContainer/i, '<!-- *****************************************************************************\n\t\t\tLandingContainer');

  // Clean about dialog blog links
  marble = marble.replace(/<p>\s*<a href="http:\/\/marblesoccer\.com">[\s\S]*?<\/p>/i, '<p>Roll your marble and guide the ball onto the red goal squares!</p>');

  // Clean no-webgl dialog
  marble = marble.replace(/<div class="nowebglDialog[\s\S]*?<\/div>/i, '<div class="nowebglDialog jqmWindow"><h3>WebGL Required</h3><p>Please use a browser with WebGL enabled to play Marble Soccer.</p></div>');

  fs.writeFileSync(marbleHtmlPath, marble, 'utf8');
  console.log('✓ Marble Soccer index.html cleaned');
}

const marbleJsPath = 'public/marblesoccer/js/pageLandingMain.js';
if (fs.existsSync(marbleJsPath)) {
  let marbleJs = fs.readFileSync(marbleJsPath, 'utf8');
  // Disable chrome webstore install call
  marbleJs = marbleJs.replace(/this\._chromeWebStoreCtor\(\);/g, '// this._chromeWebStoreCtor();');
  // Disable youtube embed in nowebglShow
  marbleJs = marbleJs.replace(/var youtubeUrl[\s\S]*?jQuery\(dialogSel\+ ' \.youtube'\)\.html\(youtubeHtml\);/g, '');
  fs.writeFileSync(marbleJsPath, marbleJs, 'utf8');
  console.log('✓ Marble Soccer pageLandingMain.js updated');
}

// 3. Fix public/zed-invaders/
console.log('3. Fixing ZED Invaders...');
const zedIndexPath = 'public/zed-invaders/index.html';
if (fs.existsSync(zedIndexPath)) {
  let zedIndex = fs.readFileSync(zedIndexPath, 'utf8');
  // Auto redirect immediately to game.html to bypass splash text with external links
  if (!zedIndex.includes('window.location.replace("game.html")')) {
    zedIndex = zedIndex.replace('<head>', '<head>\n<script>window.location.replace("game.html");</script>');
  }
  // Also clean the personal links text from the splash
  zedIndex = zedIndex.replace(/Hi, Salvatore here![\s\S]*?<\/div>/i, '</div>');
  fs.writeFileSync(zedIndexPath, zedIndex, 'utf8');
  console.log('✓ ZED Invaders index.html redirect & clean complete');
}

const zedGamePath = 'public/zed-invaders/game.html';
if (fs.existsSync(zedGamePath)) {
  let zedGame = fs.readFileSync(zedGamePath, 'utf8');
  // Clean broken closing tags from previous share_box removal
  zedGame = zedGame.replace(/<body>\s*<\/div>/i, '<body>');

  // Inject gamingzone styles
  const zedPatch = `
<style id="gz-dark-theater-patch">
  html, body {
    background-color: #030712 !important;
    background: #030712 !important;
    color: #f8fafc !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
  }
  #console {
    margin: 0 auto !important;
  }
</style>
<link rel="stylesheet" href="/gamingzone-embedded.css">
`;
  if (!zedGame.includes('id="gz-dark-theater-patch"')) {
    zedGame = zedGame.replace('</head>', zedPatch + '\n</head>');
  }
  fs.writeFileSync(zedGamePath, zedGame, 'utf8');
  console.log('✓ ZED Invaders game.html styled and cleaned');
}

// 4. Fix public/cube-engine/index.html
console.log('4. Fixing Cube Engine...');
const cubePath = 'public/cube-engine/index.html';
if (fs.existsSync(cubePath)) {
  let cube = fs.readFileSync(cubePath, 'utf8');
  cube = cube.replace(/<li><a href="https:\/\/github\.com\/Nurgak\/Cube-engine">Download the source<\/a><\/li>/gi, '');
  fs.writeFileSync(cubePath, cube, 'utf8');
  console.log('✓ Cube Engine index.html cleaned');
}

// 5. Fix public/diablo-js/index.html
console.log('5. Fixing Diablo JS...');
const diabloPath = 'public/diablo-js/index.html';
if (fs.existsSync(diabloPath)) {
  let diablo = fs.readFileSync(diabloPath, 'utf8');
  diablo = diablo.replace(/<p>See more at <a href="https:\/\/github\.com\/mitallast\/diablo-js">github<\/a><\/p>/gi, '');
  // Make .page responsive
  diablo = diablo.replace(/width:\s*980px;/, 'width: 980px; max-width: 100vw;');
  fs.writeFileSync(diabloPath, diablo, 'utf8');
  console.log('✓ Diablo JS cleaned and responsive');
}

// 6. Fix public/survivor-1982/
console.log('6. Fixing Survivor 1982...');
const survPath = 'public/survivor-1982/index.html';
if (fs.existsSync(survPath)) {
  let surv = fs.readFileSync(survPath, 'utf8');
  surv = surv.replace(/Background music:\s*<a href="http:\/\/www\.youtube\.com[^"]*"[^>]*>.*?<\/a>/gi, '');
  fs.writeFileSync(survPath, surv, 'utf8');
  console.log('✓ Survivor index.html cleaned');
}
const survEditPath = 'public/survivor-1982/editor.html';
if (fs.existsSync(survEditPath)) {
  let survEdit = fs.readFileSync(survEditPath, 'utf8');
  survEdit = survEdit.replace(/<a href="http:\/\/www\.youtube\.com[^"]*"[^>]*>.*?<\/a>/gi, '');
  fs.writeFileSync(survEditPath, survEdit, 'utf8');
  console.log('✓ Survivor editor.html cleaned');
}

console.log('=== ALL REMAINING GAME PROBLEMS FIXED SUCCESSFULLY! ===');
