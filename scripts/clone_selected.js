import { execSync } from 'child_process';
import fs from 'fs';

const repos = [
  { name: 'alien-invasion', url: 'https://github.com/cykod/AlienInvasion.git' },
  { name: 'pappu-pakia', url: 'https://github.com/mindd-it/pappu-pakia.git' },
  { name: 'coil', url: 'https://github.com/leereilly/Coil.git' }
];

if (!fs.existsSync('scratch')) {
  fs.mkdirSync('scratch');
}

for (const repo of repos) {
  const targetDir = `scratch/${repo.name}`;
  if (fs.existsSync(targetDir)) {
    console.log(`Directory ${targetDir} already exists, skipping clone.`);
    continue;
  }
  console.log(`Cloning ${repo.name} from ${repo.url}...`);
  try {
    execSync(`git clone --depth 1 ${repo.url} ${targetDir}`, { stdio: 'inherit' });
    console.log(`Cloned ${repo.name} successfully.`);
  } catch (e) {
    console.error(`Failed to clone ${repo.name}:`, e.message);
  }
}
