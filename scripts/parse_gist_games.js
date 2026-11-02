import fs from 'fs';

const content = fs.readFileSync('gist_full.md', 'utf8');

// Find the section between "# Browser-Based" and "# Native"
const startIdx = content.indexOf('# Browser-Based');
const endIdx = content.indexOf('# Native');

const browserSection = startIdx !== -1 && endIdx !== -1 
  ? content.slice(startIdx, endIdx) 
  : content.slice(startIdx);

console.log('--- BROWSER SECTION LENGTH:', browserSection.length);

// Extract markdown links [Title](https://github.com/...)
const regex = /\*\s+\[(.*?)\]\((https:\/\/github\.com\/[^\/)]+\/[^\/)]+)\)\s*(?:-\s*(.*))?/g;
let match;
const games = [];

while ((match = regex.exec(browserSection)) !== null) {
  games.push({
    title: match[1].trim(),
    repo: match[2].trim(),
    desc: (match[3] || '').trim()
  });
}

console.log(`Found ${games.length} browser games:`);
games.forEach((g, i) => {
  console.log(`${i + 1}. [${g.title}](${g.repo}) - ${g.desc}`);
});

