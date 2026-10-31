import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootDir, '.env') });

const isVercel = Boolean(process.env.VERCEL);

export const config = {
  port: parseInt(process.env.PORT, 10) || 8080,
  nodeEnv: process.env.NODE_ENV || 'development',
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'gamingzone2026!',
  jwtSecret: process.env.JWT_SECRET || 'gz_default_secret_key_change_in_production_2026',
  maxUploadSizeMb: parseInt(process.env.MAX_UPLOAD_SIZE_MB, 10) || 50,
  rootDir,
  isVercel,
  dbPath: isVercel 
    ? path.join('/tmp', 'gamingzone.db') 
    : path.resolve(rootDir, process.env.DB_PATH || 'data/gamingzone.db'),
  uploadsDir: isVercel 
    ? path.join('/tmp', 'uploads') 
    : path.resolve(rootDir, process.env.UPLOADS_DIR || 'uploads'),
  gamesUploadDir: isVercel 
    ? path.join('/tmp', 'uploads', 'games') 
    : path.resolve(rootDir, (process.env.UPLOADS_DIR || 'uploads'), 'games'),
  thumbnailsUploadDir: isVercel 
    ? path.join('/tmp', 'uploads', 'thumbnails') 
    : path.resolve(rootDir, (process.env.UPLOADS_DIR || 'uploads'), 'thumbnails'),
  previewsUploadDir: isVercel 
    ? path.join('/tmp', 'uploads', 'previews') 
    : path.resolve(rootDir, (process.env.UPLOADS_DIR || 'uploads'), 'previews')
};

