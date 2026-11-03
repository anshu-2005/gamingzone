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
  { id: 'game_wtf_adventure_rpg', engine: 'WtfAdventure', slug: 'wtf-adventure-rpg', title: 'WTF?! Adventure RPG' },
  { id: 'game_pits_of_doom_rpg', engine: 'PitsOfDoom', slug: 'pits-of-doom-rpg', title: 'Pits of Doom RPG' },
  { id: 'game_plex_world_builder', engine: 'PlexWorldBuilder', slug: 'plex-world-builder', title: 'PLEX: Retro World & Labyrinth' },
  { id: 'game_phaser_star_odyssey', engine: 'PhaserStarOdyssey', slug: 'phaser-star-odyssey', title: 'Phaser Star Odyssey' },
  { id: 'game_gallop_quest_derby', engine: 'GallopQuest', slug: 'gallop-quest-derby', title: 'GallopQuest: Horse Derby' },
  { id: 'game_hangman_wild_west', engine: 'HangmanWildWest', slug: 'hangman-wild-west', title: 'Hangman Wild West: Word Bounty' }
];

async function run() {
  for (const g of newGames) {
    const rawSvg = getGameThumbnailSVG(g);
    // Expand to 640x400 for high DPI
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
