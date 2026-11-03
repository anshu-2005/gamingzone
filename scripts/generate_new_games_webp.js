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
  { id: 'game_water_sort_puzzle', engine: 'WaterSortPuzzle', slug: 'water-sort-puzzle-tubes', title: 'Water Sort Puzzle: Color Tubes' },
  { id: 'game_queens_crown_logic', engine: 'QueensCrownLogic', slug: 'queens-crown-logic', title: 'Queens Crown: Grid Logic' },
  { id: 'game_pipe_flow_connect', engine: 'PipeFlowConnect', slug: 'pipe-flow-connect', title: 'Pipe Flow Connect: Hydro Maze' },
  { id: 'game_fifteen_slide_puzzle', engine: 'FifteenSlidePuzzle', slug: 'fifteen-slide-puzzle', title: 'Fifteen Sliding Puzzle' },
  { id: 'game_capybara_catch_frenzy', engine: 'CapybaraCatchFrenzy', slug: 'capybara-catch-frenzy', title: 'Capybara Catch Frenzy' },
  { id: 'game_speed_cube_rush', engine: 'SpeedCubeRush', slug: 'speed-cube-neon-rush', title: 'Speed Cube: Neon Obstacle Rush' },
  { id: 'game_missile_escape_pilot', engine: 'MissileEscapePilot', slug: 'missile-escape-stunt-pilot', title: 'Missile Escape: Stunt Pilot' },
  { id: 'game_tiny_crate_platformer', engine: 'TinyCratePlatformer', slug: 'tiny-crate-box-toss', title: 'Tiny Crate: Box Toss Platformer' },
  { id: 'game_sunset_cyberspace', engine: 'SunsetCyberspace', slug: 'sunset-cyberspace-runner', title: 'Sunset Cyberspace: Retro Runner' },
  { id: 'game_astro_loop_orbital', engine: 'AstroLoopOrbital', slug: 'astro-loop-orbital', title: 'Astro Loop: Orbital Roguelike' }
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
