import { DEFAULT_GAMES } from '../js/data/gamesRegistry.js';
import fs from 'fs';
import path from 'path';

const inventory = DEFAULT_GAMES.map((g, index) => {
  return {
    index: index + 1,
    id: g.id,
    slug: g.slug,
    title: g.title,
    category: g.category,
    type: g.type,
    bundle_url: g.bundle_url,
    engine: g.engine,
    tags: g.tags || []
  };
});

fs.writeFileSync('scripts/games_inventory.json', JSON.stringify(inventory, null, 2), 'utf8');
console.log(`Inventory saved for ${inventory.length} games to scripts/games_inventory.json`);
