import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config.js';
import { DEFAULT_GAMES } from '../../js/data/gamesRegistry.js';

// Ensure data directory exists
const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// In Vercel serverless environment, copy pre-seeded SQLite database to writable /tmp
if (config.isVercel && !fs.existsSync(config.dbPath)) {
  const seedDb = path.resolve(config.rootDir, 'data', 'gamingzone.db');
  if (fs.existsSync(seedDb)) {
    try {
      fs.copyFileSync(seedDb, config.dbPath);
    } catch (e) {
      console.warn('Could not copy seed DB to /tmp, will initialize fresh:', e);
    }
  }
}

// Open SQLite database
export const db = new DatabaseSync(config.dbPath);

// Enable WAL mode for high performance and concurrency
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

/**
 * Hash password using PBKDF2 with SHA-512
 */
export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify password against stored salt:hash
 */
export function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, originalHash] = storedHash.split(':');
  const computedHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(originalHash, 'hex'));
}

/**
 * Initialize Tables & Migrations
 */
export function initDatabase() {
  // 1. Games Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      tags TEXT,
      thumbnail TEXT,
      bundle_url TEXT,
      external_url TEXT,
      preview_video TEXT,
      entry_path TEXT DEFAULT 'index.html',
      game_type TEXT NOT NULL DEFAULT 'bundle',
      engine TEXT,
      controls TEXT,
      instructions TEXT,
      version TEXT NOT NULL DEFAULT '1.0.0',
      status TEXT NOT NULL DEFAULT 'published',
      is_featured INTEGER DEFAULT 0,
      is_trending INTEGER DEFAULT 0,
      is_new INTEGER DEFAULT 0,
      plays INTEGER DEFAULT 0,
      rating REAL DEFAULT 4.8,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_games_slug ON games(slug);
    CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
    CREATE INDEX IF NOT EXISTS idx_games_category ON games(category);

    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      token TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_token ON admin_sessions(token);

    -- Player Profiles (Guest and Registered Accounts)
    CREATE TABLE IF NOT EXISTS player_profiles (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      avatar TEXT DEFAULT '🎮',
      is_guest INTEGER DEFAULT 1,
      coins INTEGER DEFAULT 100,
      level INTEGER DEFAULT 1,
      games_played INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- Game Sessions & History
    CREATE TABLE IF NOT EXISTS game_sessions (
      id TEXT PRIMARY KEY,
      player_id TEXT NOT NULL,
      game_id TEXT NOT NULL,
      score INTEGER DEFAULT 0,
      duration_seconds INTEGER DEFAULT 0,
      metadata TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_player ON game_sessions(player_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_game ON game_sessions(game_id);

    -- Verified Competitive Leaderboards
    CREATE TABLE IF NOT EXISTS leaderboards (
      id TEXT PRIMARY KEY,
      game_id TEXT NOT NULL,
      player_id TEXT NOT NULL,
      player_name TEXT NOT NULL,
      avatar TEXT DEFAULT '🎮',
      score INTEGER NOT NULL,
      time_seconds REAL,
      is_verified INTEGER DEFAULT 1,
      is_demo INTEGER DEFAULT 0,
      ip_hash TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_leaderboard_game_score ON leaderboards(game_id, score DESC);
  `);

  // Run idempotent migrations for newly added columns
  try { db.exec('ALTER TABLE games ADD COLUMN preview_video TEXT;'); } catch (_) {}
  try { db.exec('ALTER TABLE games ADD COLUMN instructions TEXT;'); } catch (_) {}
  try { db.exec('ALTER TABLE games ADD COLUMN external_url TEXT;'); } catch (_) {}

  // 2. Ensure Default Admin User Exists and Sync Password
  const checkAdmin = db.prepare('SELECT id, password_hash FROM admin_users WHERE username = ?');
  const adminUser = checkAdmin.get(config.adminUsername);

  if (!adminUser) {
    const insertAdmin = db.prepare(`
      INSERT INTO admin_users (id, username, password_hash, role, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    const passwordHash = hashPassword(config.adminPassword);
    insertAdmin.run(
      'admin_' + crypto.randomBytes(8).toString('hex'),
      config.adminUsername,
      passwordHash,
      'superadmin',
      Date.now()
    );
    console.log(`[Database] Initialized default admin user: "${config.adminUsername}"`);
  } else {
    // Keep password_hash up to date with config.adminPassword if config changed
    const newHash = hashPassword(config.adminPassword);
    db.prepare('UPDATE admin_users SET password_hash = ? WHERE username = ?').run(newHash, config.adminUsername);
  }

  // 3. Catalog Deduplication Check & Migration
  try {
    const duplicateRows = db.prepare(`
      SELECT LOWER(TRIM(title)) as norm_title, COUNT(*) as cnt
      FROM games
      GROUP BY norm_title
      HAVING cnt > 1
    `).all();

    if (duplicateRows.length > 0) {
      console.log(`[Database] Found ${duplicateRows.length} duplicated game titles. Deduplicating...`);
      for (const row of duplicateRows) {
        const matches = db.prepare(`
          SELECT id, slug, status, updated_at
          FROM games
          WHERE LOWER(TRIM(title)) = ?
          ORDER BY updated_at DESC, created_at DESC
        `).all(row.norm_title);

        // Keep the newest/primary entry; archive any older duplicates
        const [primary, ...duplicates] = matches;
        for (const dup of duplicates) {
          db.prepare("UPDATE games SET status = 'archived', slug = slug || '-archived-' || id WHERE id = ?").run(dup.id);
          console.log(`[Database] Archived duplicate game ID: ${dup.id} in favor of primary ${primary.id}`);
        }
      }
    }
  } catch (dupErr) {
    console.warn('[Database] Error during deduplication check:', dupErr);
  }

  // 4. Seed or Synchronize Default Games from gamesRegistry
  const insertGame = db.prepare(`
    INSERT OR IGNORE INTO games (
      id, slug, title, description, category, tags, thumbnail,
      bundle_url, entry_path, game_type, engine, controls,
      version, status, is_featured, is_trending, is_new,
      plays, rating, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const checkGame = db.prepare('SELECT id FROM games WHERE id = ?');
  const now = Date.now();
  let newSeededCount = 0;

  for (const g of DEFAULT_GAMES) {
    const existing = checkGame.get(g.id);
    if (!existing) {
      insertGame.run(
        g.id,
        g.slug || g.id.replace(/^game_/, '').replace(/_/g, '-'),
        g.title,
        g.description || '',
        g.category || 'action',
        JSON.stringify(g.tags || [g.category]),
        g.icon || '🎮',
        '', // bundle_url is empty for builtins
        'index.html',
        'builtin',
        g.engine || '',
        g.controls || 'Keyboard / Touch controls',
        '1.0.0',
        'published',
        g.featured ? 1 : 0,
        (g.tags && g.tags.includes('trending')) ? 1 : 0,
        (g.tags && g.tags.includes('new')) ? 1 : 0,
        g.plays || 1200,
        g.rating || 4.8,
        now,
        now
      );
      newSeededCount++;
    }
  }

  if (newSeededCount > 0) {
    console.log(`[Database] Synchronized ${newSeededCount} newly added builtin games from gamesRegistry.`);
  }

  // 5. Seed Demo Identities for Leaderboards (Clearly Labeled is_demo = 1)
  try {
    const demoCount = db.prepare('SELECT COUNT(*) as cnt FROM leaderboards WHERE is_demo = 1').get().cnt;
    if (demoCount === 0) {
      const demoProfiles = [
        { name: 'PixelNinja', avatar: '🥷', score: 18500, game: 'game_arrow_maze_escape' },
        { name: 'NeonRacer', avatar: '🏎️', score: 16200, game: 'game_cyber_car_drift' },
        { name: 'ShadowFox', avatar: '🦊', score: 14800, game: 'game_stack_tower_builder' },
        { name: 'TurboTurtle', avatar: '🐢', score: 12900, game: 'game_helix_jump_neon' },
        { name: 'CosmicPanda', avatar: '🐼', score: 11400, game: 'game_run_tunnel_gravity' }
      ];

      const insDemo = db.prepare(`
        INSERT INTO leaderboards (id, game_id, player_id, player_name, avatar, score, time_seconds, is_verified, is_demo, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, ?)
      `);

      for (const d of demoProfiles) {
        insDemo.run(
          'demo_' + crypto.randomBytes(6).toString('hex'),
          d.game,
          'guest_demo_' + d.name.toLowerCase(),
          d.name,
          d.avatar,
          d.score,
          45.2,
          now - Math.floor(Math.random() * 86400000)
        );
      }
      console.log('[Database] Initialized 5 clearly labeled demo leaderboard entries.');
    }
  } catch (demoErr) {
    console.warn('[Database] Error seeding demo profiles:', demoErr);
  }
}

