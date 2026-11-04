const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Imports
if (!code.includes("import { SITE_CONFIG }")) {
  code = code.replace(
    "import { getGameThumbnailSVG } from '../js/utils/gameThumbnails.js';",
    "import { getGameThumbnailSVG } from '../js/utils/gameThumbnails.js';\nimport { AdBanner } from './components/AdBanner.jsx';\nimport { SITE_CONFIG } from './config/site.js';"
  );
}

// 2. Dynamic SEO domain replacement
code = code.replace(
  /const pageUrl = `https:\/\/game-ten-iota-67\.vercel\.app\/#game\/\$\{activeGame\.id\}`;/,
  'const baseUrl = SITE_CONFIG.domain || "https://game-ten-iota-67.vercel.app";\n      const pageUrl = `${baseUrl}/#game/${activeGame.id}`;'
);
code = code.replace(
  /const pageUrl = `https:\/\/game-ten-iota-67\.vercel\.app\/#category\/\$\{encodeURIComponent\(currentCategory\)\}`;/,
  'const baseUrl = SITE_CONFIG.domain || "https://game-ten-iota-67.vercel.app";\n      const pageUrl = `${baseUrl}/#category/${encodeURIComponent(currentCategory)}`;'
);
code = code.replace(
  /const defaultUrl = 'https:\/\/game-ten-iota-67\.vercel\.app\/';/,
  'const baseUrl = SITE_CONFIG.domain || "https://game-ten-iota-67.vercel.app";\n      const defaultUrl = baseUrl + "/";'
);

// 3. Footer Links: replace buttons with real crawlable anchors
const oldPolicyButtons = `              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem' }}>
                <button
                  type="button"
                  onClick={() => setPolicyModal({ isOpen: true, tab: 'about' })}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', textAlign: 'left', padding: 0, cursor: 'pointer', font: 'inherit' }}
                >
                  📖 About Us &amp; Mission
                </button>
                <button
                  type="button"
                  onClick={() => setPolicyModal({ isOpen: true, tab: 'privacy' })}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', textAlign: 'left', padding: 0, cursor: 'pointer', font: 'inherit' }}
                >
                  🔒 Privacy &amp; Cookie Policy
                </button>
                <button
                  type="button"
                  onClick={() => setPolicyModal({ isOpen: true, tab: 'terms' })}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', textAlign: 'left', padding: 0, cursor: 'pointer', font: 'inherit' }}
                >
                  📜 Terms of Service
                </button>
                <button
                  type="button"
                  onClick={() => setPolicyModal({ isOpen: true, tab: 'disclaimer' })}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', textAlign: 'left', padding: 0, cursor: 'pointer', font: 'inherit' }}
                >
                  ⚖️ Legal Disclaimer &amp; DMCA
                </button>
                <button
                  type="button"
                  onClick={() => setPolicyModal({ isOpen: true, tab: 'contact' })}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', textAlign: 'left', padding: 0, cursor: 'pointer', font: 'inherit' }}
                >
                  ✉️ Contact Support &amp; DMCA
                </button>`;

const newPolicyAnchors = `              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem' }}>
                <a
                  href="#about"
                  onClick={(e) => { e.preventDefault(); window.location.hash = 'about'; setPolicyModal({ isOpen: true, tab: 'about' }); }}
                  style={{ color: '#94a3b8', textDecoration: 'none' }}
                >
                  📖 About Us &amp; Mission
                </a>
                <a
                  href="#privacy"
                  onClick={(e) => { e.preventDefault(); window.location.hash = 'privacy'; setPolicyModal({ isOpen: true, tab: 'privacy' }); }}
                  style={{ color: '#94a3b8', textDecoration: 'none' }}
                >
                  🔒 Privacy &amp; Cookie Policy
                </a>
                <a
                  href="#terms"
                  onClick={(e) => { e.preventDefault(); window.location.hash = 'terms'; setPolicyModal({ isOpen: true, tab: 'terms' }); }}
                  style={{ color: '#94a3b8', textDecoration: 'none' }}
                >
                  📜 Terms of Service
                </a>
                <a
                  href="#disclaimer"
                  onClick={(e) => { e.preventDefault(); window.location.hash = 'disclaimer'; setPolicyModal({ isOpen: true, tab: 'disclaimer' }); }}
                  style={{ color: '#94a3b8', textDecoration: 'none' }}
                >
                  ⚖️ Legal Disclaimer &amp; DMCA
                </a>
                <a
                  href="#contact"
                  onClick={(e) => { e.preventDefault(); window.location.hash = 'contact'; setPolicyModal({ isOpen: true, tab: 'contact' }); }}
                  style={{ color: '#94a3b8', textDecoration: 'none' }}
                >
                  ✉️ Contact Support &amp; DMCA
                </a>`;

if (code.includes(oldPolicyButtons)) {
  code = code.replace(oldPolicyButtons, newPolicyAnchors);
  console.log('Replaced policy buttons with crawlable anchor links');
} else {
  console.log('oldPolicyButtons not found in code');
}

// 4. Add AdBanner above footer
const footerTag = '      {/* Enhanced AdSense-Compliant SEO Footer */}';
if (code.includes(footerTag) && !code.includes('slot="homepage-bottom"')) {
  code = code.replace(
    footerTag,
    '      <AdBanner slot="homepage-bottom" format="horizontal" />\n\n' + footerTag
  );
  console.log('Added homepage AdBanner above footer');
}

fs.writeFileSync('src/App.jsx', code, 'utf8');
console.log('src/App.jsx updated successfully!');
