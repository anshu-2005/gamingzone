import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Patch A Dark Room
const adrIndexPath = path.join(rootDir, 'public', 'adarkroom', 'index.html');
let adrHtml = fs.readFileSync(adrIndexPath, 'utf8');

if (!adrHtml.includes('css/dark.css')) {
  adrHtml = adrHtml.replace(
    '<link rel="stylesheet" type="text/css" href="css/gamingzone.css" />',
    '<link rel="stylesheet" type="text/css" href="css/dark.css" />\r\n    <link rel="stylesheet" type="text/css" href="css/gamingzone.css" />'
  );
  fs.writeFileSync(adrIndexPath, adrHtml, 'utf8');
  console.log('✅ Added dark.css link to A Dark Room');
}

// Ensure A Dark Room CSS forces dark styles and campfire colors
const adrCssPath = path.join(rootDir, 'public', 'adarkroom', 'css', 'gamingzone.css');
let adrCss = fs.readFileSync(adrCssPath, 'utf8');
const darkForceOverrides = `
/* Force deep dark backgrounds and warm campfire colors across all scenes */
body, #wrapper, #content, #main, #header, #stores, div#roomPanel, #village, .location, #notifications {
  background-color: #030712 !important;
  color: #f1f5f9 !important;
}

div.button, button {
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%) !important;
  border: 1px solid rgba(56, 189, 248, 0.5) !important;
  color: #f8fafc !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 14px rgba(0,0,0,0.6) !important;
}

div.button:hover:not(.disabled) {
  border-color: #38bdf8 !important;
  box-shadow: 0 0 16px rgba(56, 189, 248, 0.5) !important;
  color: #38bdf8 !important;
}

/* Stoke fire warm campfire orange accent */
#lightButton, #stokeButton {
  border-color: rgba(249, 115, 22, 0.7) !important;
  color: #fed7aa !important;
  background: linear-gradient(180deg, #431407 0%, #1f0802 100%) !important;
  box-shadow: 0 0 18px rgba(249, 115, 22, 0.35) !important;
}

#lightButton:hover, #stokeButton:hover {
  border-color: #f97316 !important;
  color: #fff !important;
  box-shadow: 0 0 24px rgba(249, 115, 22, 0.6) !important;
}

/* Links and menu in bottom bar */
.menu, .menu span {
  color: #94a3b8 !important;
}

.menu span:hover {
  color: #38bdf8 !important;
  text-shadow: 0 0 8px rgba(56, 189, 248, 0.4);
}
`;

if (!adrCss.includes('Force deep dark backgrounds')) {
  adrCss += darkForceOverrides;
  fs.writeFileSync(adrCssPath, adrCss, 'utf8');
  console.log('✅ Injected dark force overrides in A Dark Room gamingzone.css');
}

// 2. Patch Hextris - remove any DOM elements or scripts related to facebook, twitter, app stores
const hextrisIndexPath = path.join(rootDir, 'public', 'hextris', 'index.html');
let hextrisHtml = fs.readFileSync(hextrisIndexPath, 'utf8');

// Ensure buttonCont, badges, and store images are purged or styled none
const hextrisCssFix = `
<style>
  #buttonCont, #badges, .rrssb-buttons, #socialShare, #androidBadge, #iOSBadge, .rrssb-facebook, .rrssb-twitter, img[src*="btn_facebook"], img[src*="btn_twitter"], img[src*="android"], img[src*="appstore"] {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    height: 0 !important;
    width: 0 !important;
    pointer-events: none !important;
    position: absolute !important;
    left: -9999px !important;
  }
</style>
`;

if (!hextrisHtml.includes('img[src*="btn_facebook"]')) {
  hextrisHtml = hextrisHtml.replace('</head>', `${hextrisCssFix}\r\n</head>`);
  fs.writeFileSync(hextrisIndexPath, hextrisHtml, 'utf8');
  console.log('✅ Injected strict purge styles in Hextris index.html');
}

console.log('All game style & branding patches applied successfully!');

