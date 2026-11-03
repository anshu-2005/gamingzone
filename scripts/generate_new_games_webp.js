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
  { id: 'game_phaserquest_fantasy', engine: 'PhaserQuestFantasy', slug: 'phaserquest-fantasy-realm', title: 'PhaserQuest: Fantasy Realm' },
  { id: 'game_horsepaste_spymaster', engine: 'HorsePasteSpymaster', slug: 'horsepaste-spymaster-agent', title: 'HorsePaste: Spymaster Agent' },
  { id: 'game_gowog_cell_battle', engine: 'GowogCellBattle', slug: 'gowog-cell-battle-io', title: 'Gowog: Cell Battle IO' },
  { id: 'game_csgo_aim_strike', engine: 'CsgoAimStrike', slug: 'csgo-aim-reflex-strike', title: 'CS:GO Aim Reflex & Strike' },
  { id: 'game_racing_world_3d', engine: 'RacingWorld3D', slug: 'racing-world-3d-turbo', title: 'Racing World 3D Turbo' },
  { id: 'game_robot_rumble_mech', engine: 'RobotRumbleMech', slug: 'robot-rumble-mech-arena', title: 'Robot Rumble: Mech Arena' },
  { id: 'game_neon_cyber_casino', engine: 'NeonCyberCasino', slug: 'neon-cyber-casino', title: 'Neon Cyber Casino: Crash & Gems' },
  { id: 'game_karaoke_beat_master', engine: 'KaraokeBeatMaster', slug: 'karaoke-beat-master', title: 'Karaoke Beat Master' },
  { id: 'game_legends_future_past', engine: 'LegendsFuturePast', slug: 'legends-future-past', title: 'Legends of Future Past: Cyber MUD' },
  { id: 'game_billiards_3d_pro', engine: 'Billiards3DPro', slug: 'billiards-3d-pro', title: 'Billiards 3D Pro: Master Pool' }
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
  console.log('All 10 game webps successfully generated!');
}

run();
