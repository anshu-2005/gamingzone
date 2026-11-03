import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { getGameThumbnailSVG } from '../js/utils/gameThumbnails.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'public', 'images', 'games');

const newGames = [
  { id: 'game_swordbattle_io', engine: 'SwordBattleIO', slug: 'swordbattle-io', title: 'SwordBattle IO' },
  { id: 'game_civis_4x_strategy', engine: 'Civis4XStrategy', slug: 'civis-4x-strategy', title: 'Civis 4X Strategy' },
  { id: 'game_westward_bounty_rpg', engine: 'WestwardBounty', slug: 'westward-bounty-rpg', title: 'Westward Bounty RPG' },
  { id: 'game_set_match_trio', engine: 'SetMatchTrio', slug: 'set-match-trio', title: 'Set Match Trio' },
  { id: 'game_hacker_feud_cyber', engine: 'HackerFeudCyber', slug: 'hacker-feud-cyber', title: 'Hacker Feud: Cyber Breach' }
];

async function run() {
  for (const g of newGames) {
    const rawSvg = getGameThumbnailSVG(g);
    const svg640 = rawSvg.replace('viewBox="0 0 320 200"', 'width="640" height="400" viewBox="0 0 320 200"');
    const dest = path.join(outDir, `${g.slug}.webp`);
    try {
      await sharp(Buffer.from(svg640))
        .resize(640, 400)
        .webp({ quality: 90 })
        .toFile(dest);
      console.log(`Generated: ${dest}`);
    } catch (err) {
      console.error(`Failed ${g.slug}:`, err);
    }
  }
}

run();
