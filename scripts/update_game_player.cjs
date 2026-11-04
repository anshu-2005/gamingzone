const fs = require('fs');

let code = fs.readFileSync('src/components/GamePlayer.jsx', 'utf8');

// 1. Ensure SITE_CONFIG and ErrorBoundary and AdBanner imports exist
if (!code.includes("import { SITE_CONFIG }")) {
  code = code.replace(
    "import { sounds } from '../../js/core/soundFX.js';",
    "import { sounds } from '../../js/core/soundFX.js';\nimport { AdBanner } from './AdBanner.jsx';\nimport { ErrorBoundary } from './ErrorBoundary.jsx';\nimport { SITE_CONFIG } from '../config/site.js';"
  );
}

// 2. Update canonical domain in JSON-LD
code = code.replace(
  /const gameUrl = `https:\/\/game-ten-iota-67\.vercel\.app\/#game\/\$\{game\.id\}`;/,
  'const baseUrl = SITE_CONFIG.domain || "https://game-ten-iota-67.vercel.app";\n    const gameUrl = `${baseUrl}/#game/${game.id}`;'
);
code = code.replace('"item": "https://game-ten-iota-67.vercel.app/"', '"item": baseUrl + "/"');
code = code.replace(
  /"item": `https:\/\/game-ten-iota-67\.vercel\.app\/#category\//g,
  '"item": `${baseUrl}/#category/'
);

// 3. Replace ad slot with AdBanner component
const oldAdSlot = `      {/* Non-intrusive Safe Ad Banner Slot */}
      <div className="gz-ad-slot-container">
        <span className="gz-ad-slot-label">ADVERTISEMENT • GAMINGZONE SAFE</span>
        <div className="gz-ad-slot-banner">
          <div className="gz-ad-placeholder-text">
            <span>🎮 GamingZone High-Performance Browser Gaming Network</span>
            <span style={{ fontSize: '0.74rem', opacity: 0.8 }}>Over 190+ free instant titles. Fast, ad-safe, zero downloads.</span>
          </div>
        </div>
      </div>`;

if (code.includes(oldAdSlot)) {
  code = code.replace(oldAdSlot, '      <AdBanner slot="game-player-bottom" format="horizontal" />');
}

// 4. Wrap viewport in ErrorBoundary
if (!code.includes('<ErrorBoundary context="game_viewport"')) {
  code = code.replace(
    '{/* Main Viewport Stage with Ambient Backlight Glow */}',
    '{/* Main Viewport Stage with Ambient Backlight Glow */}\n      <ErrorBoundary context="game_viewport" isGameArea={true}>'
  );
  code = code.replace(
    '        {/* Game Over / Victory Result Overlay */}',
    '        {/* Game Over / Victory Result Overlay */}'
  );
  // Place </ErrorBoundary> right after the viewport closing tag
  const vpClose = '        )}\n      </div>\n\n      <AdBanner slot="game-player-bottom"';
  const vpCloseWithEb = '        )}\n      </div>\n      </ErrorBoundary>\n\n      <AdBanner slot="game-player-bottom"';
  code = code.replace(vpClose, vpCloseWithEb);
}

// 5. Add footer AdBanner after Related Games shelf
if (!code.includes('slot="game-player-footer"')) {
  const shelfEnd = '        </div>\n      )}\n    </div>\n  );';
  const shelfEndWithAd = '        </div>\n      )}\n      <AdBanner slot="game-player-footer" format="horizontal" />\n    </div>\n  );';
  code = code.replace(shelfEnd, shelfEndWithAd);
}

fs.writeFileSync('src/components/GamePlayer.jsx', code, 'utf8');
console.log('GamePlayer.jsx updated successfully!');
