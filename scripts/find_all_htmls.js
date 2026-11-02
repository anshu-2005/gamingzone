import fs from 'fs';
import path from 'path';

function findHtml(dir, maxDepth = 3, currentDepth = 0) {
  if (currentDepth > maxDepth) return [];
  let found = [];
  try {
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of list) {
      if (item.name === '.git' || item.name === 'node_modules') continue;
      const full = path.join(dir, item.name);
      if (item.isDirectory()) {
        found = found.concat(findHtml(full, maxDepth, currentDepth + 1));
      } else if (item.name.toLowerCase().endsWith('.html')) {
        found.push(full);
      }
    }
  } catch (e) {}
  return found;
}

const dirs = fs.readdirSync('scratch_arcade');
console.log(`Checking ${dirs.length} folders in scratch_arcade:`);

const playable = [];

for (const d of dirs) {
  const fullDir = path.join('scratch_arcade', d);
  const htmls = findHtml(fullDir);
  console.log(`\nFolder: ${d}`);
  if (htmls.length > 0) {
    console.log(`  Found HTML files:`, htmls);
    playable.push({ dir: d, htmls });
  } else {
    console.log(`  No HTML files found.`);
  }
}

fs.writeFileSync('playable_summary.json', JSON.stringify(playable, null, 2));
console.log(`\nTotal playable arcade games found: ${playable.length}`);

