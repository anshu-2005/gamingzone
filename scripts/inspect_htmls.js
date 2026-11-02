import fs from 'fs';

for (const name of ['alien-invasion', 'coil', 'skifree', 'sorades']) {
  const p = `scratch/${name}/index.html`;
  if (fs.existsSync(p)) {
    console.log(`\n=================== ${name}/index.html ===================`);
    console.log(fs.readFileSync(p, 'utf8'));
  }
}
