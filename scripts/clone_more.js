import { execSync } from 'child_process';
import fs from 'fs';

const repos = [
  { name: 'skifree', url: 'https://github.com/basicallydan/skifree.js.git' },
  { name: 'sorades', url: 'https://github.com/maettig/starship-sorades-13k.git' }
];

for (const repo of repos) {
  const targetDir = `scratch/${repo.name}`;
  if (fs.existsSync(targetDir)) continue;
  try {
    execSync(`git clone --depth 1 ${repo.url} ${targetDir}`, { stdio: 'inherit' });
    console.log(`Cloned ${repo.name} successfully.`);
  } catch (e) {
    console.error(`Failed ${repo.name}:`, e.message);
  }
}
