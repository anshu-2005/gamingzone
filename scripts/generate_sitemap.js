import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEFAULT_GAMES, CATEGORIES } from '../js/data/gamesRegistry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const sitemapPath = path.join(rootDir, 'public', 'sitemap.xml');

const BASE_URL = 'https://game-ten-iota-67.vercel.app';
const TODAY = new Date().toISOString().split('T')[0];

const staticPages = [
  { url: `${BASE_URL}/`, priority: '1.0', changefreq: 'daily', comment: 'Homepage' },
  { url: `${BASE_URL}/#about`, priority: '0.8', changefreq: 'monthly', comment: 'About Us' },
  { url: `${BASE_URL}/#privacy`, priority: '0.8', changefreq: 'monthly', comment: 'Privacy Policy' },
  { url: `${BASE_URL}/#terms`, priority: '0.8', changefreq: 'monthly', comment: 'Terms of Service' },
  { url: `${BASE_URL}/#contact`, priority: '0.8', changefreq: 'monthly', comment: 'Contact Us & DMCA' },
  { url: `${BASE_URL}/#disclaimer`, priority: '0.8', changefreq: 'monthly', comment: 'Disclaimer & Legal Notice' }
];

const categoryPages = CATEGORIES
  .filter(c => c.id !== 'favorites' && c.id !== 'recent')
  .map(c => ({
    url: `${BASE_URL}/#category/${c.id}`,
    priority: '0.85',
    changefreq: 'weekly',
    comment: `Category: ${c.name}`
  }));

// Additional genre categories represented in games
const extraGenres = ['strategy', 'casual', 'adventure'];
extraGenres.forEach(genre => {
  if (!categoryPages.some(cp => cp.url.endsWith(genre))) {
    categoryPages.push({
      url: `${BASE_URL}/#category/${genre}`,
      priority: '0.8',
      changefreq: 'weekly',
      comment: `Category: ${genre.toUpperCase()} Games`
    });
  }
});

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
`;

// Static Core Pages
staticPages.forEach(p => {
  xml += `  <!-- ${p.comment} -->\n`;
  xml += `  <url>\n`;
  xml += `    <loc>${p.url}</loc>\n`;
  xml += `    <lastmod>${TODAY}</lastmod>\n`;
  xml += `    <changefreq>${p.changefreq}</changefreq>\n`;
  xml += `    <priority>${p.priority}</priority>\n`;
  xml += `  </url>\n`;
});

// Category Pages
xml += `\n  <!-- Category Hub Pages -->\n`;
categoryPages.forEach(p => {
  xml += `  <!-- ${p.comment} -->\n`;
  xml += `  <url>\n`;
  xml += `    <loc>${p.url}</loc>\n`;
  xml += `    <lastmod>${TODAY}</lastmod>\n`;
  xml += `    <changefreq>${p.changefreq}</changefreq>\n`;
  xml += `    <priority>${p.priority}</priority>\n`;
  xml += `  </url>\n`;
});

// All 190 Game Pages
xml += `\n  <!-- All ${DEFAULT_GAMES.length} Individual Game Pages -->\n`;
DEFAULT_GAMES.forEach(g => {
  const safeTitle = (g.title || g.slug).replace(/&/g, '&amp;');
  const priority = g.featured ? '0.9' : (g.is_new ? '0.85' : '0.75');
  xml += `  <!-- Game: ${safeTitle} -->\n`;
  xml += `  <url>\n`;
  xml += `    <loc>${BASE_URL}/#game/${g.slug}</loc>\n`;
  xml += `    <lastmod>${TODAY}</lastmod>\n`;
  xml += `    <changefreq>weekly</changefreq>\n`;
  xml += `    <priority>${priority}</priority>\n`;
  xml += `  </url>\n`;
});

xml += `</urlset>\n`;

fs.writeFileSync(sitemapPath, xml, 'utf8');
console.log(`Generated sitemap with ${staticPages.length + categoryPages.length + DEFAULT_GAMES.length} URLs at ${sitemapPath}`);

