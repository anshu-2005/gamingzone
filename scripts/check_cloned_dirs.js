import fs from 'fs';

for (const name of ['alien-invasion', 'coil', 'skifree', 'sorades']) {
  console.log(`\n=== Directory: ${name} ===`);
  try {
    const files = fs.readdirSync(`scratch/${name}`);
    console.log(files);
  } catch (e) {
    console.error(e.message);
  }
}

