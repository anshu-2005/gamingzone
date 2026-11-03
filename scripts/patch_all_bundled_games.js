import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

const dirs = fs.readdirSync(publicDir, { withFileTypes: true })
  .filter(d => d.isDirectory() && d.name !== 'images')
  .map(d => d.name);

console.log(`Auditing and patching ${dirs.length} bundled games...`);

const darkStyleTag = `
<style id="gz-dark-theater-patch">
  html, body {
    background-color: #030712 !important;
    background: #030712 !important;
    color: #f8fafc !important;
  }
</style>
<link rel="stylesheet" href="/gamingzone-embedded.css">
`;

let patched = 0;

for (const dir of dirs) {
  const indexPath = path.join(publicDir, dir, 'index.html');
  if (!fs.existsSync(indexPath)) continue;

  let html = fs.readFileSync(indexPath, 'utf-8');

  // If already linked, skip
  if (html.includes('gamingzone-embedded.css')) {
    console.log(`Already patched: ${dir}`);
    continue;
  }

  // Inject into <head> or at top of file
  if (html.includes('</head>')) {
    html = html.replace('</head>', `${darkStyleTag}\n</head>`);
  } else if (html.includes('<body')) {
    html = html.replace('<body', `${darkStyleTag}\n<body`);
  } else {
    html = `${darkStyleTag}\n${html}`;
  }

  fs.writeFileSync(indexPath, html, 'utf-8');
  patched++;
  console.log(`✅ Patched: ${dir}`);
}

console.log(`Successfully patched ${patched} games with dark theater styling!`);

