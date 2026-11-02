import fs from 'fs';
import { execSync } from 'child_process';

const newRepos = [
  { slug: 'green-mahjong', url: 'https://github.com/danbeck/green-mahjong.git' },
  { slug: 'gladiator-3d', url: 'https://github.com/krotik/gladiator_3d.git' },
  { slug: 'cellmates', url: 'https://github.com/gamebytes/cellmates.git' },
  { slug: 'marblesoccer', url: 'https://github.com/jeromeetienne/marbleSoccer.git' },
  { slug: 'emberwind', url: 'https://github.com/operasoftware/Emberwind.git' },
  { slug: 'pixelplatformer', url: 'https://github.com/bendangelo/PixelPlatformer.git' }
];

if (!fs.existsSync('scratch_new')) {
  fs.mkdirSync('scratch_new');
}

for (const repo of newRepos) {
  const dest = `scratch_new/${repo.slug}`;
  if (fs.existsSync(dest)) {
    console.log(`Directory ${dest} already exists, skipping clone.`);
    continue;
  }
  console.log(`Cloning ${repo.slug} from ${repo.url}...`);
  try {
    execSync(`git clone --depth 1 ${repo.url} ${dest}`, { stdio: 'inherit', timeout: 60000 });
    console.log(`Cloned ${repo.slug} successfully.`);
  } catch (e) {
    console.error(`Failed ${repo.slug}:`, e.message);
  }
}

