import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const primaryDomain = 'https://game-ten-iota-67.vercel.app';

// 1. Create public/ads.txt
const adsTxtContent = `# Google AdSense Authorized Digital Sellers (ads.txt) for GAMINGZONE
# Once your AdSense account is approved, replace 'pub-XXXXXXXXXXXXXXXX' with your AdSense Publisher ID.
# Example: google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0

google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
`;
fs.writeFileSync(path.join(rootDir, 'public', 'ads.txt'), adsTxtContent, 'utf8');
console.log('✅ Created public/ads.txt');

// 2. Create robots.txt (optimized for Googlebot, Mediapartners-Google for AdSense, Bingbot)
const robotsTxtContent = `# robots.txt for GAMINGZONE — https://game-ten-iota-67.vercel.app
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Disallow: /uploads/temp/

# Dedicated crawler access for Google AdSense
User-agent: Mediapartners-Google
Allow: /

# Dedicated crawler access for Googlebot
User-agent: Googlebot
Allow: /

# Dedicated crawler access for Googlebot-Image
User-agent: Googlebot-Image
Allow: /

Sitemap: ${primaryDomain}/sitemap.xml
`;
fs.writeFileSync(path.join(rootDir, 'public', 'robots.txt'), robotsTxtContent, 'utf8');
fs.writeFileSync(path.join(rootDir, 'robots.txt'), robotsTxtContent, 'utf8');
console.log('✅ Created public/robots.txt & root robots.txt');

// 3. Generate static public/sitemap.xml
const regModule = await import('../js/data/gamesRegistry.js');
const games = regModule.DEFAULT_GAMES;
const categories = regModule.CATEGORIES;

const today = new Date().toISOString().split('T')[0];

let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  <!-- Homepage -->
  <url>
    <loc>${primaryDomain}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Legal & AdSense Mandatory Policy Pages -->
  <url>
    <loc>${primaryDomain}/#about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${primaryDomain}/#privacy</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${primaryDomain}/#terms</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${primaryDomain}/#contact</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`;

// Add Category Pages
for (const cat of categories) {
  sitemapXml += `  <!-- Category: ${cat.name} -->
  <url>
    <loc>${primaryDomain}/#category/${cat.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>\n`;
}

// Add All Games
for (const g of games) {
  sitemapXml += `  <!-- Game: ${g.title} -->
  <url>
    <loc>${primaryDomain}/#game/${g.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>\n`;
}

sitemapXml += `</urlset>`;

fs.writeFileSync(path.join(rootDir, 'public', 'sitemap.xml'), sitemapXml, 'utf8');
console.log(`✅ Generated public/sitemap.xml with ${games.length} games and categories!`);
