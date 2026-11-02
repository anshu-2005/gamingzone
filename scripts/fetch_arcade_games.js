import fs from 'fs';

async function main() {
  const res = await fetch('https://gist.githubusercontent.com/roachhd/d579b58148d7e36a6b72/raw');
  const text = await res.text();
  fs.writeFileSync('gist_arcade.md', text);

  // Extract from "## Arcade" under Browser-Based until the next "## " heading
  const browserStart = text.indexOf('# Browser-Based');
  const nativeStart = text.indexOf('# Native');
  const browserText = text.slice(browserStart, nativeStart);

  const arcadeStart = browserText.indexOf('## Arcade');
  const nextHeading = browserText.indexOf('## ', arcadeStart + 10);
  const arcadeSection = browserText.slice(arcadeStart, nextHeading);

  console.log('Arcade section:');
  console.log(arcadeSection);

  // Extract all github links
  const regex = /\*\s+\[(.*?)\]\((https?:\/\/github\.com\/[^\/)]+\/[^\/)]+)\)\s*(?:-\s*(.*))?/g;
  let match;
  const repos = [];
  while ((match = regex.exec(arcadeSection)) !== null) {
    repos.push({
      title: match[1].trim(),
      url: match[2].trim(),
      desc: (match[3] || '').trim()
    });
  }

  console.log(`\nFound ${repos.length} Arcade game repositories.`);
  fs.writeFileSync('arcade_repos.json', JSON.stringify(repos, null, 2));
}

main().catch(console.error);

