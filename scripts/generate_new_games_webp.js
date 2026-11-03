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
  { id: 'game_star_fighter_ace', engine: 'StarFighterAce', slug: 'star-fighter-ace', title: 'Star Fighter: Deep Space Ace' },
  { id: 'game_terminal_breach', engine: 'TerminalBreach', slug: 'terminal-breach-decryptor', title: 'Terminal Breach: Fallout Decryptor' },
  { id: 'game_buses_from_hell', engine: 'BusesFromHell', slug: 'buses-from-hell-dodge', title: 'Buses From Hell: Dodging Mayhem' },
  { id: 'game_smash_copter', engine: 'SmashCopter', slug: 'smash-copter-hazard', title: 'Smash Copter: Falling Hazard' },
  { id: 'game_dude_adventure', engine: 'DudeAdventure', slug: 'dude-adventure-quest', title: 'Dude Adventure: Forest Quest' },
  { id: 'game_feed_the_flames', engine: 'FeedTheFlames', slug: 'feed-the-flames-idle', title: 'Feed The Flames: Idle Bonfire' },
  { id: 'game_factory_defense_rts', engine: 'FactoryDefenseRTS', slug: 'factory-defense-rts', title: 'Factory Defense RTS: Automata' },
  { id: 'game_rota_gravity_bend', engine: 'RotaGravityBend', slug: 'rota-gravity-bend', title: 'Rota: Gravity Bend Platformer' },
  { id: 'game_legend_wings', engine: 'LegendWings', slug: 'legend-wings-striker', title: 'Legend Wings: Sky Striker' },
  { id: 'game_binary_tetris', engine: 'BinaryTetris', slug: 'binary-tetris-matrix', title: 'Binary Tetris: Bit Matrix' },
  { id: 'game_armored_tanks_blitz', engine: 'ArmoredTanksBlitz', slug: 'armored-tanks-blitz', title: 'Armored Tanks Blitz: Steel War' },
  { id: 'game_fly_plane_sky', engine: 'FlyPlaneSky', slug: 'fly-plane-sky-obstacles', title: 'Fly Plane Fly: Sky Obstacles' }
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
  console.log(`All ${newGames.length} game webps successfully generated!`);
}

run();
