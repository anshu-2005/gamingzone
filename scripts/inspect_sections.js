import fs from 'fs';

const content = fs.readFileSync('gist_full.md', 'utf8');

// List all headings
const headings = content.match(/^#+ .+/gm);
console.log('Headings:', headings);

// Find games in Racing, Puzzle, Arcade, Strategy under Browser-Based
const lines = content.split('\n');
let currentH = '';
const gamesBySection = {};

for (const line of lines) {
  if (line.startsWith('#')) {
    currentH = line.trim();
    if (!gamesBySection[currentH]) gamesBySection[currentH] = [];
  } else if (line.trim().startsWith('* [')) {
    if (!gamesBySection[currentH]) gamesBySection[currentH] = [];
    gamesBySection[currentH].push(line.trim());
  }
}

for (const [sec, items] of Object.entries(gamesBySection)) {
  if (items.length > 0 && sec.toLowerCase().includes('browser') || sec.toLowerCase().includes('arcade') || sec.toLowerCase().includes('racing') || sec.toLowerCase().includes('puzzle')) {
    console.log(`\n=== ${sec} (${items.length} games) ===`);
    items.forEach(it => console.log('  ' + it.slice(0, 100)));
  }
}
