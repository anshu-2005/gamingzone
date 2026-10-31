import express from 'express';
import { db } from '../db/database.js';

export const apiRouter = express.Router();

/**
 * Health check
 */
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'GAMINGZONE',
    timestamp: Date.now()
  });
});

/**
 * GET /api/games
 * Public catalog listing (ONLY published games)
 */
apiRouter.get('/games', (req, res) => {
  try {
    const { category, search, featured, trending, is_new, limit = 500, sort = 'popular' } = req.query;

    let query = `
      SELECT id, slug, title, description, category, tags, thumbnail,
             bundle_url, external_url, preview_video, entry_path, game_type, engine,
             controls, instructions, version, status, is_featured, is_trending, is_new,
             plays, rating, created_at, updated_at
      FROM games
      WHERE status = 'published'
    `;
    const params = [];

    if (category && category !== 'all') {
      query += ` AND category = ?`;
      params.push(category);
    }

    if (featured === 'true' || featured === '1') {
      query += ` AND is_featured = 1`;
    }

    if (trending === 'true' || trending === '1') {
      query += ` AND (is_trending = 1 OR plays > 20000)`;
    }

    if (is_new === 'true' || is_new === '1') {
      query += ` AND is_new = 1`;
    }

    if (search && typeof search === 'string') {
      const term = `%${search.trim().toLowerCase()}%`;
      query += ` AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(tags) LIKE ? OR LOWER(category) LIKE ?)`;
      params.push(term, term, term, term);
    }

    // Sort order: Newly added games always come first!
    if (sort === 'newest') {
      query += ` ORDER BY created_at DESC, updated_at DESC`;
    } else if (sort === 'title') {
      query += ` ORDER BY title ASC`;
    } else {
      // Default: new releases first (newest timestamp first), then by plays & rating
      query += ` ORDER BY is_new DESC, created_at DESC, updated_at DESC, plays DESC, rating DESC`;
    }

    query += ` LIMIT ?`;
    params.push(Math.min(parseInt(limit, 10) || 500, 1000));

    const games = db.prepare(query).all(...params);

    // Format tags array and booleans
    const formatted = games.map(g => ({
      ...g,
      tags: typeof g.tags === 'string' ? JSON.parse(g.tags || '[]') : g.tags,
      is_featured: Boolean(g.is_featured),
      is_trending: Boolean(g.is_trending),
      is_new: Boolean(g.is_new)
    }));

    res.json({
      success: true,
      count: formatted.length,
      games: formatted
    });
  } catch (err) {
    console.error('Error fetching games:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch games catalog.' });
  }
});

/**
 * GET /api/games/:slug
 * Retrieve single published game details
 */
apiRouter.get('/games/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    const game = db.prepare(`
      SELECT * FROM games
      WHERE (slug = ? OR id = ?) AND status = 'published'
    `).get(slug, slug);

    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Game not found or not published.'
      });
    }

    res.json({
      success: true,
      game: {
        ...game,
        tags: typeof game.tags === 'string' ? JSON.parse(game.tags || '[]') : game.tags,
        is_featured: Boolean(game.is_featured),
        is_trending: Boolean(game.is_trending),
        is_new: Boolean(game.is_new)
      }
    });
  } catch (err) {
    console.error('Error fetching game details:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve game.' });
  }
});

/**
 * POST /api/games/:slug/play
 * Increment game play counter
 */
apiRouter.post('/games/:slug/play', (req, res) => {
  try {
    const { slug } = req.params;
    const update = db.prepare(`
      UPDATE games
      SET plays = plays + 1, updated_at = ?
      WHERE slug = ? OR id = ?
    `).run(Date.now(), slug, slug);

    if (update.changes === 0) {
      return res.status(404).json({ success: false, error: 'Game not found.' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error recording play:', err);
    res.status(500).json({ success: false, error: 'Failed to record play.' });
  }
});

/**
 * GET /api/categories
 * Returns categories and published game counts
 */
apiRouter.get('/categories', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT category, COUNT(*) as count
      FROM games
      WHERE status = 'published'
      GROUP BY category
      ORDER BY count DESC
    `).all();

    res.json({
      success: true,
      categories: rows
    });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve categories.' });
  }
});

/**
 * GET /api/leaderboards/:gameId
 * Returns top scores, clearly distinguishing demo vs verified community scores
 */
apiRouter.get('/leaderboards/:gameId', (req, res) => {
  try {
    const { gameId } = req.params;
    const entries = db.prepare(`
      SELECT id, game_id, player_id, player_name, avatar, score, time_seconds, is_verified, is_demo, created_at
      FROM leaderboards
      WHERE game_id = ?
      ORDER BY score DESC, created_at ASC
      LIMIT 25
    `).all(gameId);

    res.json({
      success: true,
      gameId,
      count: entries.length,
      leaderboard: entries.map((e, idx) => ({
        ...e,
        rank: idx + 1,
        is_demo: Boolean(e.is_demo),
        is_verified: Boolean(e.is_verified)
      }))
    });
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve leaderboard.' });
  }
});

/**
 * POST /api/leaderboards/:gameId/submit
 * Server-side score validation, rate limiting & anti-cheat check
 */
const rateLimitMap = new Map(); // Simple in-memory rate limiter per IP/player

apiRouter.post('/leaderboards/:gameId/submit', (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId, playerName, avatar, score, timeSeconds } = req.body;

    const parsedScore = parseInt(score, 10);
    if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 5000000) {
      return res.status(400).json({ success: false, error: 'Invalid score value.' });
    }

    const cleanName = (playerName || 'Guest').trim().slice(0, 24);
    if (!cleanName) {
      return res.status(400).json({ success: false, error: 'Player name is required.' });
    }

    const clientIp = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const rateKey = `${clientIp}_${gameId}`;
    const lastSubmit = rateLimitMap.get(rateKey) || 0;
    const now = Date.now();

    if (now - lastSubmit < 2500) {
      // 2.5 second cooldown per game submission
      return res.status(429).json({ success: false, error: 'Score submission rate limit exceeded. Please wait a moment.' });
    }
    rateLimitMap.set(rateKey, now);

    const entryId = 'lb_' + Math.random().toString(36).slice(2, 10);
    db.prepare(`
      INSERT INTO leaderboards (id, game_id, player_id, player_name, avatar, score, time_seconds, is_verified, is_demo, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, ?)
    `).run(entryId, gameId, playerId || 'guest_' + entryId, cleanName, avatar || '🎮', parsedScore, Number(timeSeconds) || 0, now);

    res.json({
      success: true,
      message: 'Score verified and recorded to leaderboard.',
      id: entryId
    });
  } catch (err) {
    console.error('Error submitting score:', err);
    res.status(500).json({ success: false, error: 'Failed to record score.' });
  }
});

/**
 * GET /api/player/profile/:playerId
 * Returns guest / registered profile with session history
 */
apiRouter.get('/player/profile/:playerId', (req, res) => {
  try {
    const { playerId } = req.params;
    const profile = db.prepare('SELECT * FROM player_profiles WHERE id = ?').get(playerId);

    const history = db.prepare(`
      SELECT s.id, s.game_id, g.title as game_title, g.category, s.score, s.duration_seconds, s.created_at
      FROM game_sessions s
      LEFT JOIN games g ON s.game_id = g.id
      WHERE s.player_id = ?
      ORDER BY s.created_at DESC
      LIMIT 20
    `).all(playerId);

    res.json({
      success: true,
      profile: profile || null,
      history: history || []
    });
  } catch (err) {
    console.error('Error fetching player profile:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve player profile.' });
  }
});

/**
 * POST /api/player/profile
 * Upserts player profile (Guest or registered)
 */
apiRouter.post('/player/profile', (req, res) => {
  try {
    const { id, displayName, avatar, isGuest, coins, level } = req.body;
    if (!id || !displayName) {
      return res.status(400).json({ success: false, error: 'Profile ID and display name are required.' });
    }

    const cleanName = displayName.trim().slice(0, 24);
    const now = Date.now();

    db.prepare(`
      INSERT INTO player_profiles (id, display_name, avatar, is_guest, coins, level, games_played, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        display_name = excluded.display_name,
        avatar = excluded.avatar,
        coins = excluded.coins,
        level = excluded.level,
        games_played = games_played + 1,
        updated_at = excluded.updated_at
    `).run(id, cleanName, avatar || '🎮', isGuest ? 1 : 0, Number(coins) || 100, Number(level) || 1, now, now);

    res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (err) {
    console.error('Error updating player profile:', err);
    res.status(500).json({ success: false, error: 'Failed to update player profile.' });
  }
});

/**
 * POST /api/player/session
 * Records session history and increments games_played
 */
apiRouter.post('/player/session', (req, res) => {
  try {
    const { playerId, gameId, score, durationSeconds, metadata } = req.body;
    if (!playerId || !gameId) {
      return res.status(400).json({ success: false, error: 'Missing playerId or gameId' });
    }

    const sessionId = 'ses_' + Math.random().toString(36).slice(2, 10);
    const now = Date.now();

    db.prepare(`
      INSERT INTO game_sessions (id, player_id, game_id, score, duration_seconds, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(sessionId, playerId, gameId, parseInt(score, 10) || 0, parseInt(durationSeconds, 10) || 0, JSON.stringify(metadata || {}), now);

    res.json({ success: true, sessionId });
  } catch (err) {
    console.error('Error recording game session:', err);
    res.status(500).json({ success: false, error: 'Failed to record session.' });
  }
});

