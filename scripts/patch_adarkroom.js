import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Patch notifications.js
const notifPath = path.join(rootDir, 'public', 'adarkroom', 'script', 'notifications.js');
let notifCode = fs.readFileSync(notifPath, 'utf8');

const enhancedPrintMessage = `	printMessage: function(t) {
		var lower = (t || '').toLowerCase();
		var extraClass = '';
		if (/fire|burning|roaring|warm|light|flame|ember/.test(lower)) {
			extraClass = ' notif-fire';
		} else if (/cold|freezing|chill|shiver|frost/.test(lower)) {
			extraClass = ' notif-cold';
		} else if (/wood|forest|trees|gather/.test(lower)) {
			extraClass = ' notif-wood';
		} else if (/stranger|wanderer|collapsed|stumbles|traveler|guest/.test(lower)) {
			extraClass = ' notif-stranger';
		} else if (/beast|attack|danger|dead|blood|ruined|sickness|plague|thief/.test(lower)) {
			extraClass = ' notif-danger';
		}

		var text = $('<div>').addClass('notification' + extraClass).css('opacity', '0').text(t).prependTo('div#notifications');
		text.animate({opacity: 1}, 500, 'linear', function() {
			Notifications.clearHidden();
		});
	},`;

notifCode = notifCode.replace(/printMessage:\s*function\(t\)\s*\{[\s\S]*?Notifications\.clearHidden\(\);\s*\}\);?\s*\},/, enhancedPrintMessage);
fs.writeFileSync(notifPath, notifCode, 'utf8');
console.log('✅ Patched notifications.js with vibrant story colors');

// 2. Patch engine.js
const enginePath = path.join(rootDir, 'public', 'adarkroom', 'script', 'engine.js');
let engineCode = fs.readFileSync(enginePath, 'utf8');

// SITE_URL
engineCode = engineCode.replace(
  /SITE_URL:\s*encodeURIComponent\([^)]+\)/,
  'SITE_URL: encodeURIComponent("https://game-ten-iota-67.vercel.app")'
);

// github link
engineCode = engineCode.replace(
  /https:\/\/github\.com\/doublespeakgames\/adarkroom/g,
  'https://github.com/anshu-2005'
);

// get the app
engineCode = engineCode.replace(
  /https:\/\/itunes\.apple\.com\/app\/apple-store\/id736683061\?[^'"]+/g,
  'https://game-ten-iota-67.vercel.app'
);
engineCode = engineCode.replace(
  /https:\/\/play\.google\.com\/store\/apps\/details\?id=com\.yourcompany\.adarkroom/g,
  'https://game-ten-iota-67.vercel.app'
);

// Turn lights off by default if not set
if (!engineCode.includes('// Force dark mode on first boot for GAMINGZONE')) {
  engineCode = engineCode.replace(
    /if\(\$SM\.get\('config\.lightsOff',\s*true\)\)\{/,
    `// Force dark mode on first boot for GAMINGZONE
      if($SM.get('config.lightsOff') === undefined) {
        $SM.set('config.lightsOff', true, true);
      }
      if($SM.get('config.lightsOff', true)){`
  );
}

fs.writeFileSync(enginePath, engineCode, 'utf8');
console.log('✅ Patched engine.js with user profile and site URLs');

// 3. Patch index.html
const indexPath = path.join(rootDir, 'public', 'adarkroom', 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

// Add gamingzone.css link if not present
if (!indexHtml.includes('gamingzone.css')) {
  indexHtml = indexHtml.replace(
    '</head>',
    '  <link rel="stylesheet" type="text/css" href="css/gamingzone.css" />\n</head>'
  );
}

// Remove old standalone gz-badge if present
indexHtml = indexHtml.replace(/<style>[\s\S]*?\.gz-badge[\s\S]*?<\/style>/, '');
indexHtml = indexHtml.replace(/<div class="gz-badge">[\s\S]*?<\/div>/, '');

// Update logo link to Anshu's GitHub
indexHtml = indexHtml.replace(
  /<a class="logo" href="https:\/\/www\.doublespeakgames\.com"[^>]*>/,
  '<a class="logo" href="https://github.com/anshu-2005" alt="Anshu Profile" title="Developer Profile: Anshu (GAMINGZONE)" target="_blank">'
);

// Insert Topbar and Instructions panel
const topbarAndInstructions = `
  <!-- GAMINGZONE Modern Topbar -->
  <div class="gz-topbar">
    <div class="gz-brand">
      <span>&#127918; GAMINGZONE</span>
      <span class="badge-tag">CYBER SURVIVAL</span>
    </div>
    <a href="https://github.com/anshu-2005" target="_blank" class="gz-profile-link" title="Visit Anshu's GitHub Profile">
      <span>&#128100; Anshu Profile &#8599;</span>
    </a>
  </div>

  <div id="wrapper">`;

indexHtml = indexHtml.replace(/<!-- GAMINGZONE Modern Topbar -->[\s\S]*?<div id="wrapper">/, topbarAndInstructions);

// Insert instructions panel before </body>
const instructionsPanel = `
  <!-- Bottom Instructions Panel -->
  <div id="gz-instructions-panel" class="gz-instructions-panel">
    <div class="gz-inst-header" onclick="toggleGzInstructions()">
      <span class="gz-inst-title">&#128214; KAISE KHELE (HOW TO PLAY)</span>
      <button id="gz-toggle-inst" class="gz-inst-toggle" type="button">Tips &amp; Guide &#9662;</button>
    </div>
    <div id="gz-inst-body" class="gz-inst-body">
      <div class="gz-inst-step">
        <span class="step-icon">&#128293;</span>
        <div><strong>1. Stoke Fire:</strong> Aag ko jalaye rakhein taaki kamra garm rahe aur bhatke hue travelers aapke paas aayein.</div>
      </div>
      <div class="gz-inst-step">
        <span class="step-icon">&#127794;</span>
        <div><strong>2. Gather Wood:</strong> Silent Forest se lakdi ikatthi karein (Stores me wood badhega).</div>
      </div>
      <div class="gz-inst-step">
        <span class="step-icon">&#128736;</span>
        <div><strong>3. Build &amp; Craft:</strong> Cart, traps, aur huts banayein taaki log aapki basti me sharan lekar kaam karein.</div>
      </div>
      <div class="gz-inst-step">
        <span class="step-icon">&#128506;</span>
        <div><strong>4. Explore World:</strong> Compass aur weapons craft karke andheri duniya ke raaz explore karein!</div>
      </div>
    </div>
  </div>
  <script>
    function toggleGzInstructions() {
      var b = document.getElementById('gz-inst-body');
      var btn = document.getElementById('gz-toggle-inst');
      if (b.style.display === 'none') {
        b.style.display = 'flex';
        btn.innerHTML = 'Close &#9652;';
      } else {
        b.style.display = 'none';
        btn.innerHTML = 'Tips &amp; Guide &#9662;';
      }
    }
  </script>
</body>`;

indexHtml = indexHtml.replace(/<!-- Bottom Instructions Panel -->[\s\S]*?<\/body>/, instructionsPanel);

fs.writeFileSync(indexPath, indexHtml, 'utf8');
console.log('✅ Patched index.html with topbar, instructions panel, and profile links');

// 4. Update gamesRegistry.js instructions
const regPath = path.join(rootDir, 'js', 'data', 'gamesRegistry.js');
let regContent = fs.readFileSync(regPath, 'utf8');
regContent = regContent.replace(
  /instructions:\s*'Start by stoking the fire to keep warm[^']*'/,
  "instructions: '1. Stoke Fire to keep the room warm and attract strangers. 2. Gather Wood in the Silent Forest to build up your stores. 3. Build & Craft carts, traps, and huts to grow your village population. 4. Explore the dark outer world with crafted weapons and compass!'"
);
fs.writeFileSync(regPath, regContent, 'utf8');
console.log('✅ Updated gamesRegistry.js instructions');
