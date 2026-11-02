import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Patch public/hextris/index.html
const indexPath = path.join(rootDir, 'public', 'hextris', 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

// Update .gz-badge style to top-right to avoid overlapping the '?' help button at top-left
indexHtml = indexHtml.replace(
  /\.gz-badge\s*\{[\s\S]*?\}/,
  `.gz-badge {
				position: fixed;
				top: 14px;
				right: 18px;
				z-index: 9999;
				font-family: 'Exo 2', sans-serif;
				font-size: 11px;
				letter-spacing: 1.5px;
				font-weight: 700;
				color: #38bdf8;
				background: rgba(15, 23, 42, 0.9);
				backdrop-filter: blur(8px);
				padding: 6px 14px;
				border-radius: 999px;
				border: 1px solid rgba(56, 189, 248, 0.4);
				box-shadow: 0 0 15px rgba(56, 189, 248, 0.25);
				text-transform: uppercase;
				pointer-events: none;
				display: flex;
				align-items: center;
				gap: 6px;
			}
			#buttonCont, #badges, .rrssb-buttons, #socialShare, #androidBadge, #iOSBadge {
				display: none !important;
				visibility: hidden !important;
				height: 0 !important;
				width: 0 !important;
				overflow: hidden !important;
				pointer-events: none !important;
			}`
);

// Remove the socialShare block and buttons from HTML
indexHtml = indexHtml.replace(/<div id='socialShare'>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, "<div id='socialShare' style='display:none;'></div>\n\t\t\t\t<div id='buttonCont' style='display:none;'></div>");

// Remove any remaining badges block
indexHtml = indexHtml.replace(/<div id='badges'>[\s\S]*?<\/div>/, '');

// Remove Russian social share script
indexHtml = indexHtml.replace(/<script type="text\/javascript">\s*\(function addRussianSocialShare[\s\S]*?<\/script>/, '');

// Remove all twitter:app and store meta tags
indexHtml = indexHtml.replace(/<meta property="twitter:app:[^"]+"[^>]+>\s*/g, '');

fs.writeFileSync(indexPath, indexHtml, 'utf8');
console.log('✅ Cleaned up index.html (removed Facebook, Twitter, Google Play, App Store buttons)');

// 2. Patch public/hextris/style/style.css
const cssPath = path.join(rootDir, 'public', 'hextris', 'style', 'style.css');
let cssCode = fs.readFileSync(cssPath, 'utf8');

const hideRules = `
#buttonCont, #badges, .rrssb-buttons, #socialShare, #androidBadge, #iOSBadge, .rrssb-facebook, .rrssb-twitter {
	display: none !important;
	visibility: hidden !important;
	height: 0 !important;
	width: 0 !important;
	overflow: hidden !important;
	pointer-events: none !important;
}
`;
if (!cssCode.includes('#buttonCont, #badges')) {
  cssCode += hideRules;
}
// Fix canvas & body colors
cssCode = cssCode.replace(/body\s*\{[\s\S]*?background-color:[^;]+;/i, 'body {\n\tbackground-color: #030712 !important;');
fs.writeFileSync(cssPath, cssCode, 'utf8');
console.log('✅ Patched style.css to hide social & app store buttons completely');

// 3. Patch public/hextris/js/initialization.js
const initPath = path.join(rootDir, 'public', 'hextris', 'js', 'initialization.js');
let initCode = fs.readFileSync(initPath, 'utf8');
initCode = initCode.replace(/window\.hexagonBackgroundColor\s*=\s*'[^']+'/, "window.hexagonBackgroundColor = '#0f172a'");
initCode = initCode.replace(/window\.hexagonBackgroundColorClear\s*=\s*'[^']+'/, "window.hexagonBackgroundColorClear = 'rgba(15, 23, 42, 0.6)'");
initCode = initCode.replace(/window\.centerBlue\s*=\s*'[^']+'/, "window.centerBlue = '#38bdf8'");
fs.writeFileSync(initPath, initCode, 'utf8');
console.log('✅ Patched initialization.js with cyber dark colors');

// 4. Patch public/hextris/js/render.js
const renderPath = path.join(rootDir, 'public', 'hextris', 'js', 'render.js');
let renderCode = fs.readFileSync(renderPath, 'utf8');

// Replace light grey overlay on start screen
renderCode = renderCode.replace(
  /if\s*\(gameState\s*==\s*-1\)\s*\{\s*ctx\.globalAlpha\s*=\s*0\.9;\s*ctx\.fillStyle\s*=\s*'rgb\(236,240,241\)';/g,
  "if (gameState == -1) {\n\t\tctx.globalAlpha = 0.95;\n\t\tctx.fillStyle = '#090d16';"
);

// Replace beginning text color '#2c3e50' with vibrant '#38bdf8' / '#f8fafc'
renderCode = renderCode.replace(/'#2c3e50'/g, "'#38bdf8'");

fs.writeFileSync(renderPath, renderCode, 'utf8');
console.log('✅ Patched render.js with dark overlay & bright text');

// 5. Patch public/hextris/js/view.js
const viewPath = path.join(rootDir, 'public', 'hextris', 'js', 'view.js');
let viewCode = fs.readFileSync(viewPath, 'utf8');

// Update Hextris & Play! text colors
viewCode = viewCode.replace(/"#2c3e50",\s*"Hextris"/g, '"#38bdf8", "Hextris"');
viewCode = viewCode.replace(/"rgb\(44,62,80\)",\s*'Play!'/g, '"#f8fafc", "Play!"');

// Clean up pause screen text
viewCode = viewCode.replace(
  /'pausedAndroid':\s*"[^"]+"/,
  `'pausedAndroid': "<div class='centeredHeader unselectable'>Game Paused</div><div class='unselectable centeredSubHeader' style='margin-top:12px;text-align:center;'><span style='color:#38bdf8;font-weight:700;'>GAMINGZONE EDITION</span></div>"`
);
viewCode = viewCode.replace(
  /'pausediOS':\s*"[^"]+"/,
  `'pausediOS': "<div class='centeredHeader unselectable'>Game Paused</div><div class='unselectable centeredSubHeader' style='margin-top:12px;text-align:center;'><span style='color:#38bdf8;font-weight:700;'>GAMINGZONE EDITION</span></div>"`
);
viewCode = viewCode.replace(
  /'pausedOther':\s*"[^"]+"/,
  `'pausedOther': "<div class='centeredHeader unselectable'>Game Paused</div><div class='unselectable centeredSubHeader' style='margin-top:12px;text-align:center;'><span style='color:#38bdf8;font-weight:700;'>GAMINGZONE EDITION</span></div>"`
);

fs.writeFileSync(viewPath, viewCode, 'utf8');
console.log('✅ Patched view.js (Hextris colors and removed pause ads)');

// 6. Patch public/hextris/js/main.js
const mainPath = path.join(rootDir, 'public', 'hextris', 'js', 'main.js');
let mainCode = fs.readFileSync(mainPath, 'utf8');

// Remove external tracking script
mainCode = mainCode.replace(/script\.src\s*=\s*'http:\/\/hextris\.io\/a\.js';/, '// tracker removed');

// Clean up instructions modal to link to user profile
mainCode = mainCode.replace(
  /By <a href='http:\/\/loganengstrom\.com'[\s\S]*?Hextris Website<\/a>/,
  "GAMINGZONE EDITION &bull; Developer: <a href='https://github.com/anshu-2005' target='_blank' style='color:#38bdf8;font-weight:bold;'>Anshu</a>"
);

fs.writeFileSync(mainPath, mainCode, 'utf8');
console.log('✅ Patched main.js (removed tracking & linked instructions to Anshu profile)');
