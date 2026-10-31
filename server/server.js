import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { initDatabase, db } from './db/database.js';
import { apiRouter } from './routes/apiRoutes.js';
import { adminRouter } from './routes/adminRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Initialize persistent database
initDatabase();

// 2. Initialize Express application
const app = express();

// Security and CORS
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// 3. Static Hosting for Uploaded Game Builds & Thumbnails
// Apply restrictive Content-Security-Policy specifically on uploaded games
app.use('/uploads/games', (req, res, next) => {
  // Allow the game to run in sandboxed iframe without escaping or compromising parent app
  res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data:; img-src 'self' data: blob: *; media-src 'self' data: blob: *; connect-src 'self' *;");
  next();
});
app.use('/uploads', express.static(config.uploadsDir, {
  dotfiles: 'deny',
  index: ['index.html']
}));

// 4. Mount API Routes
app.use('/api', apiRouter);
app.use('/api/admin', adminRouter);

// 5. Static Hosting for Frontend Assets & React Dist
const distDir = path.join(rootDir, 'dist');
const hasDist = fs.existsSync(path.join(distDir, 'index.html'));

// SEO Endpoints: robots.txt & dynamic sitemap.xml
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nDisallow: /uploads/temp/\n\nSitemap: https://gamingzone.com/sitemap.xml\n`);
});

app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  try {
    const games = db.prepare("SELECT slug, updated_at FROM games WHERE status = 'published'").all();
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    xml += `  <url><loc>https://gamingzone.com/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;
    for (const g of games) {
      xml += `  <url><loc>https://gamingzone.com/#game/${g.slug}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
    }
    xml += `</urlset>`;
    res.send(xml);
  } catch (err) {
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
});

if (hasDist) {
  app.use(express.static(distDir));
}

app.use('/css', express.static(path.join(rootDir, 'css')));
app.use('/js', express.static(path.join(rootDir, 'js')));
app.use('/favicon.ico', express.static(path.join(rootDir, 'favicon.ico')));
app.use('/favicon.svg', express.static(path.join(rootDir, 'favicon.svg')));

// Direct HTML Entry
app.get('/', (req, res) => {
  if (hasDist) {
    return res.sendFile(path.join(distDir, 'index.html'));
  }
  res.sendFile(path.join(rootDir, 'index.html'));
});

// Single Page Application Fallback (Express 5 compatible)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  if (req.method === 'GET') {
    if (hasDist) {
      return res.sendFile(path.join(distDir, 'index.html'));
    }
    return res.sendFile(path.join(rootDir, 'index.html'));
  }
  next();
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: config.nodeEnv === 'development' ? err.message : 'An unexpected error occurred.'
  });
});

// Start listening if run directly
export function startServer(port = config.port) {
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`\n====================================================`);
      console.log(`🚀 GAMINGZONE Platform Server is running!`);
      console.log(`📡 URL: http://localhost:${port}`);
      console.log(`🎮 Public Catalog API: http://localhost:${port}/api/games`);
      console.log(`🔐 Admin API: http://localhost:${port}/api/admin/games`);
      console.log(`📁 Uploads Directory: ${config.uploadsDir}`);
      console.log(`====================================================\n`);
      resolve(server);
    });
  });
}

// Auto-run if executed as main process
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  startServer();
}

export { app };
