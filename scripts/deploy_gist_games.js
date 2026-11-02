import fs from 'fs';
import path from 'path';

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === '.gitignore' || entry.name === '.gitattributes') continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('Copying games to public directory...');
copyDir('scratch/alien-invasion', 'public/alien-invasion');
copyDir('scratch/coil', 'public/coil');
copyDir('scratch/skifree', 'public/skifree');
copyDir('scratch/sorades', 'public/sorades');

console.log('Finished copying game assets.');

