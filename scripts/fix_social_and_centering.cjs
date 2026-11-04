const fs = require('fs');
const path = require('path');

// 1. Fix public/onslaught-arena/index.html
console.log('--- 1. Fixing onslaught-arena ---');
let onslaughtHtml = fs.readFileSync('public/onslaught-arena/index.html', 'utf8');

// Strip out nav (Blog, Twitter, Facebook) and tip (Enjoy the demo! Buy the full version...)
onslaughtHtml = onslaughtHtml.replace(/<div class="nav">[\s\S]*?<\/div>/i, '');
onslaughtHtml = onslaughtHtml.replace(/<div id="tip">[\s\S]*?<\/div>\s*<\/div>/i, '</div>');

// Inject dedicated centering and reset styles
const onslaughtStyles = `
<style id="gz-centering-override">
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    height: 100% !important;
    min-height: 100vh !important;
    overflow: hidden !important;
    background-color: #030712 !important;
    background: #030712 !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
  }
  .nav, #tip, .ad, #clay {
    display: none !important;
    visibility: hidden !important;
    pointer-events: none !important;
    height: 0 !important;
    width: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  #stage {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    overflow: hidden !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    background: transparent !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  #stage canvas {
    position: absolute !important;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.9) !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    border-radius: 4px !important;
  }
</style>
`;

if (!onslaughtHtml.includes('id="gz-centering-override"')) {
  onslaughtHtml = onslaughtHtml.replace('</head>', onslaughtStyles + '\n</head>');
}
fs.writeFileSync('public/onslaught-arena/index.html', onslaughtHtml, 'utf8');
console.log('Fixed public/onslaught-arena/index.html');

// 2. Fix onslaught-arena engine.js resizing & mouse.js aiming
const enginePath = 'public/onslaught-arena/js/engine.js';
let engineJs = fs.readFileSync(enginePath, 'utf8');

// Replace proto.resize to perfectly compute centered canvas
const oldResizeRegex = /proto\.resize\s*=\s*function\s*horde_Engine_proto_resize\s*\(\)\s*\{[\s\S]*?\n\};/;
const newResize = `proto.resize = function horde_Engine_proto_resize () {
	var windowWidth = window.innerWidth || document.documentElement.clientWidth || 800;
	var windowHeight = window.innerHeight || document.documentElement.clientHeight || 600;
	var stage = document.getElementById("stage");
	if (stage) {
		stage.style.width = windowWidth + "px";
		stage.style.height = windowHeight + "px";
		stage.style.top = "0px";
		stage.style.left = "0px";
	}
	
	// Aspect ratio scale for 640x480
	var scaleW = (windowWidth - 20) / 640;
	var scaleH = (windowHeight - 20) / 480;
	var scale = Math.min(scaleW, scaleH);
	if (scale < 0.6) scale = 0.6;
	if (scale > 2.0) scale = 2.0;

	var width = Math.round(640 * scale);
	var height = Math.round(480 * scale);

	var c = this.canvases ? this.canvases["display"] : null;
	if (c) {
		c.style.width = width + "px";
		c.style.height = height + "px";
		var gameLeft = Math.max(0, Math.round((windowWidth - width) / 2));
		var gameTop = Math.max(0, Math.round((windowHeight - height) / 2));
		c.style.left = gameLeft + "px";
		c.style.top = gameTop + "px";
		c.style.margin = "0";
	}
};`;

if (oldResizeRegex.test(engineJs)) {
  engineJs = engineJs.replace(oldResizeRegex, newResize);
  fs.writeFileSync(enginePath, engineJs, 'utf8');
  console.log('Fixed onslaught-arena engine.js resize math');
}

// Fix onslaught-arena mouse.js getBoundingClientRect
const mousePath = 'public/onslaught-arena/js/mouse.js';
let mouseJs = fs.readFileSync(mousePath, 'utf8');
const oldMouseRegex = /proto\.handleMouseMove\s*=\s*function\s*\(e\)\s*\{[\s\S]*?this\.hasMoved = true;\s*\};/;
const newMouseMove = `proto.handleMouseMove = function (e) {
	if (!this.canvas) return;
	var rect = this.canvas.getBoundingClientRect();
	var clientX = e.clientX;
	var clientY = e.clientY;
	if (clientX === undefined && e.touches && e.touches[0]) {
		clientX = e.touches[0].clientX;
		clientY = e.touches[0].clientY;
	}
	this.mouseX = Math.max(0, Math.min(640, ((clientX - rect.left) * 640) / (rect.width || 640)));
	this.mouseY = Math.max(0, Math.min(480, ((clientY - rect.top) * 480) / (rect.height || 480)));
	this.hasMoved = true;
};`;

if (oldMouseRegex.test(mouseJs)) {
  mouseJs = mouseJs.replace(oldMouseRegex, newMouseMove);
  fs.writeFileSync(mousePath, mouseJs, 'utf8');
  console.log('Fixed onslaught-arena mouse.js coordinate calculation');
}

// 3. Fix public/command-and-conquer/index.html
console.log('--- 2. Fixing command-and-conquer ---');
const cncPath = 'public/command-and-conquer/index.html';
if (fs.existsSync(cncPath)) {
  let cncHtml = fs.readFileSync(cncPath, 'utf8');
  // Remove facebook and twitter badges and scripts
  cncHtml = cncHtml.replace(/<div id="socialbadges"[\s\S]*?<\/div>/gi, '');
  cncHtml = cncHtml.replace(/<script[^>]*facebook-jssdk[\s\S]*?<\/script>/gi, '');
  cncHtml = cncHtml.replace(/<a[^>]*twitter-share-button[\s\S]*?<\/script>/gi, '');
  cncHtml = cncHtml.replace(/<a[^>]*twitter\.com\/share[\s\S]*?<\/a>/gi, '');
  // Remove blog / like / external feedback text
  cncHtml = cncHtml.replace(/<p[^>]*>You can read more about[\s\S]*?<\/p>/gi, '');
  cncHtml = cncHtml.replace(/<p[^>]*>If you liked this demo[\s\S]*?<\/p>/gi, '');
  cncHtml = cncHtml.replace(/<p[^>]*><u>BUGS and ISSUES:<\/u>[\s\S]*?<\/p>/gi, '');
  cncHtml = cncHtml.replace(/<p[^>]*>This is still a work in progress[\s\S]*?<\/p>/gi, '');
  cncHtml = cncHtml.replace(/<li>Special thanks to <a href="http:\/\/www\.nahklick\.de\/"[\s\S]*?<\/li>/gi, '');
  fs.writeFileSync(cncPath, cncHtml, 'utf8');
  console.log('Fixed command-and-conquer index.html');
}

// 4. Fix public/zed-invaders/game.html
console.log('--- 3. Fixing zed-invaders ---');
const zedPath = 'public/zed-invaders/game.html';
if (fs.existsSync(zedPath)) {
  let zedHtml = fs.readFileSync(zedPath, 'utf8');
  // Remove share_box with facebook iframe and twitter button
  zedHtml = zedHtml.replace(/<div class="share_box">[\s\S]*?<\/div>\s*<\/div>/gi, '');
  zedHtml = zedHtml.replace(/<!--facebook-->[\s\S]*?<!--twitter-->[\s\S]*?<\/script>/gi, '');
  fs.writeFileSync(zedPath, zedHtml, 'utf8');
  console.log('Fixed zed-invaders game.html');
}

// 5. Fix public/hotfix-rush/index.html
console.log('--- 4. Fixing hotfix-rush ---');
const hotfixPath = 'public/hotfix-rush/index.html';
if (fs.existsSync(hotfixPath)) {
  let hotfixHtml = fs.readFileSync(hotfixPath, 'utf8');
  hotfixHtml = hotfixHtml.replace(/<a[^>]*twitter-follow-button[^>]*>.*?<\/a>/gi, '');
  hotfixHtml = hotfixHtml.replace(/<script[^>]*platform\.twitter\.com[^>]*><\/script>/gi, '');
  fs.writeFileSync(hotfixPath, hotfixHtml, 'utf8');
  console.log('Fixed hotfix-rush index.html');
}

// 6. Fix public/coffee-snake/index.html & public/hurry-shooter/index.html (GitHub ribbons)
console.log('--- 5. Fixing GitHub ribbons in coffee-snake and hurry-shooter ---');
const coffeePath = 'public/coffee-snake/index.html';
if (fs.existsSync(coffeePath)) {
  let coffeeHtml = fs.readFileSync(coffeePath, 'utf8');
  coffeeHtml = coffeeHtml.replace(/<a[^>]*><img[^>]*s3\.amazonaws\.com\/github\/ribbons[^>]*><\/a>/gi, '');
  coffeeHtml = coffeeHtml.replace(/<a[^>]*github\.com\/dommmel\/coffee-snake[^>]*>[\s\S]*?<\/a>/gi, '');
  fs.writeFileSync(coffeePath, coffeeHtml, 'utf8');
  console.log('Fixed coffee-snake index.html');
}

const hurryPath = 'public/hurry-shooter/index.html';
if (fs.existsSync(hurryPath)) {
  let hurryHtml = fs.readFileSync(hurryPath, 'utf8');
  hurryHtml = hurryHtml.replace(/<a[^>]*><img[^>]*s3\.amazonaws\.com\/github\/ribbons[^>]*><\/a>/gi, '');
  hurryHtml = hurryHtml.replace(/<a[^>]*github\.com\/hughsk\/ludum-dare-27[^>]*>[\s\S]*?<\/a>/gi, '');
  fs.writeFileSync(hurryPath, hurryHtml, 'utf8');
  console.log('Fixed hurry-shooter index.html');
}

// 7. Fix public/marblesoccer/index.html
console.log('--- 6. Fixing marblesoccer ---');
const marblePath = 'public/marblesoccer/index.html';
if (fs.existsSync(marblePath)) {
  let marbleHtml = fs.readFileSync(marblePath, 'utf8');
  // Remove top info header with blog link
  marbleHtml = marbleHtml.replace(/<div class="info">[\s\S]*?<\/div>/gi, '');
  marbleHtml = marbleHtml.replace(/<div class="chromeWebstoreInstall"[\s\S]*?<\/div>/gi, '');
  marbleHtml = marbleHtml.replace(/<a[^>]*learningthreejs\.com\/blog[^>]*>.*?<\/a>/gi, '');
  fs.writeFileSync(marblePath, marbleHtml, 'utf8');
  console.log('Fixed marblesoccer index.html');
}

// 8. Fix public/survivor-1982/index.html
console.log('--- 7. Fixing survivor-1982 ---');
const survPath = 'public/survivor-1982/index.html';
if (fs.existsSync(survPath)) {
  let survHtml = fs.readFileSync(survPath, 'utf8');
  survHtml = survHtml.replace(/<a[^>]*class="[^"]*tweeter[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '');
  fs.writeFileSync(survPath, survHtml, 'utf8');
  console.log('Fixed survivor-1982 index.html');
}

// 9. Fix public/sorades/starship-sorades-13k.js
console.log('--- 8. Fixing sorades ---');
const soradesPath = 'public/sorades/starship-sorades-13k.js';
if (fs.existsSync(soradesPath)) {
  let soradesJs = fs.readFileSync(soradesPath, 'utf8');
  soradesJs = soradesJs.replace(/tweet\.style\.display\s*=\s*'inline-block';/g, "tweet.style.display = 'none';");
  soradesJs = soradesJs.replace(/tweet\.style\.display\s*=\s*'block';/g, "tweet.style.display = 'none';");
  fs.writeFileSync(soradesPath, soradesJs, 'utf8');
  console.log('Fixed sorades tweet button');
}

// 10. Update public/gamingzone-embedded.css
console.log('--- 9. Updating public/gamingzone-embedded.css with aggressive universal blocker ---');
const cssPath = 'public/gamingzone-embedded.css';
let css = fs.readFileSync(cssPath, 'utf8');

const universalBlocker = `
/* =========================================================
   UNIVERSAL SOCIAL, BLOG, FORK-ME & PROMO SUPPRESSION RULES
   Hides any lingering Twitter, Facebook, Blog, Store & Ribbon elements
   ========================================================= */
a[href*="twitter.com"],
a[href*="x.com"],
a[href*="facebook.com"],
a[href*="fb.com"],
a[href*="instagram.com"],
a[href*="plus.google.com"],
a[href*="t.co"],
a[href*="lostdecadegames.com"],
a[href*="learningthreejs.com"],
a[href*="github.com/ribbons"],
a[href*="s3.amazonaws.com/github/ribbons"],
img[src*="github/ribbons"],
img[alt*="Fork me"],
.twitter-share-button,
.twitter-follow-button,
.fb-like,
.fb-share-button,
.share_box,
.tweeter,
#socialbadges,
#socialShare,
.social-links,
.rrssb-buttons,
.rrssb-facebook,
.rrssb-twitter,
#badges,
#buttonCont,
.chromeWebstoreInstall,
.nav,
#tip,
#tip_message {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
  position: absolute !important;
  left: -9999px !important;
  width: 0 !important;
  height: 0 !important;
  overflow: hidden !important;
}
`;

if (!css.includes('UNIVERSAL SOCIAL, BLOG, FORK-ME & PROMO SUPPRESSION RULES')) {
  css += universalBlocker;
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('Updated gamingzone-embedded.css');
}

console.log('All requested changes applied successfully!');
