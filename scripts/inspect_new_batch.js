import fs from 'fs';
import path from 'path';

for (const name of ['green-mahjong', 'gladiator-3d', 'cellmates', 'marblesoccer', 'pixelplatformer']) {
  const p = `scratch_new/${name}`;
  if (fs.existsSync(p)) {
    console.log(`\n=== Directory: ${name} ===`);
    const files = fs.readdirSync(p);
    console.log(files.slice(0, 15));
    // check for index.html or *.html
    const htmls = files.filter(f => f.endsWith('.html'));
    console.log(`HTML files:`, htmls);
  }
}

