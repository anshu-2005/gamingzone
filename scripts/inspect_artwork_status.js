import { DEFAULT_GAMES } from '../js/data/gamesRegistry.js';
import { getGameThumbnailSVG } from '../js/utils/gameThumbnails.js';
import fs from 'fs';

console.log('Total DEFAULT_GAMES:', DEFAULT_GAMES.length);

const categories = {};
const gamesWithoutExplicitThumb = [];
const gamesWithBundledImages = [];

DEFAULT_GAMES.forEach(g => {
  categories[g.category] = (categories[g.category] || 0) + 1;
  const svg = getGameThumbnailSVG(g);
  // Check if svg is the generic template
  const isGeneric = svg.includes('GENERIC') || svg.includes('PLAY NOW') || svg.includes('ARCADE GAME') || svg.includes('CLASSIC');
  if (isGeneric || !g.thumbnail) {
    gamesWithoutExplicitThumb.push({
      id: g.id,
      slug: g.slug,
      title: g.title,
      category: g.category,
      type: g.type,
      isGenericSvg: isGeneric
    });
  }
});

console.log('Categories distribution:', categories);
console.log('Games needing artwork:', gamesWithoutExplicitThumb.length);

// Also check existing images in public/
if (fs.existsSync('public/images')) {
  console.log('Existing in public/images:', fs.readdirSync('public/images'));
} else {
  console.log('public/images does not exist yet');
}
