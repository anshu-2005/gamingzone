import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { db } from '../db/database.js';
import {
  authenticateAdmin,
  requireAdmin,
  revokeSessionToken
} from '../services/authService.js';
import {
  processGameZip,
  saveThumbnailFile,
  savePreviewVideoFile
} from '../services/uploadService.js';
import { config } from '../config.js';

export const adminRouter = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 55 * 1024 * 1024 // 55 MB memory buffer limit
  }
});

/**
 * POST /api/admin/auth/login
 */
adminRouter.post('/auth/login', (req, res) => {
  let { username, password, pin } = req.body || {};
  if (pin && !password) {
    password = pin;
    username = username || config.adminUsername;
  }
  const result = authenticateAdmin(username, password);

  if (!result.success) {
    return res.status(401).json({ success: false, error: result.error });
  }

  res.json({
    success: true,
    token: result.token,
    user: result.user
  });
});

/**
 * POST /api/admin/auth/logout
 */
adminRouter.post('/auth/logout', requireAdmin, (req, res) => {
  if (req.admin?.token) {
    revokeSessionToken(req.admin.token);
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

/**
 * GET /api/admin/auth/verify
 */
adminRouter.get('/auth/verify', requireAdmin, (req, res) => {
  res.json({
    success: true,
    user: {
      username: req.admin.username
    }
  });
});

/**
 * GET /api/admin/stats
 */
adminRouter.get('/stats', requireAdmin, (req, res) => {
  try {
    const totalRow = db.prepare('SELECT COUNT(*) as count FROM games').get();
    const publishedRow = db.prepare("SELECT COUNT(*) as count FROM games WHERE status = 'published'").get();
    const draftsRow = db.prepare("SELECT COUNT(*) as count FROM games WHERE status = 'draft'").get();
    const archivedRow = db.prepare("SELECT COUNT(*) as count FROM games WHERE status = 'archived'").get();
    const bundleGamesRow = db.prepare("SELECT COUNT(*) as count FROM games WHERE game_type = 'bundle'").get();
    const playsRow = db.prepare('SELECT SUM(plays) as totalPlays FROM games').get();
    const catRows = db.prepare('SELECT COUNT(DISTINCT category) as count FROM games').get();

    res.json({
      success: true,
      stats: {
        totalGames: totalRow.count,
        publishedGames: publishedRow.count,
        draftGames: draftsRow.count,
        archivedGames: archivedRow.count,
        bundleGames: bundleGamesRow.count,
        totalPlays: playsRow.totalPlays || 0,
        totalCategories: catRows.count
      }
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve stats.' });
  }
});

/**
 * GET /api/admin/games
 * List games with filters (including drafts & archived)
 */
adminRouter.get('/games', requireAdmin, (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 50 } = req.query;

    let countQuery = 'SELECT COUNT(*) as total FROM games WHERE 1=1';
    let dataQuery = `
      SELECT id, slug, title, description, category, tags, thumbnail,
             bundle_url, external_url, preview_video, entry_path, game_type, engine,
             controls, instructions, version, status, is_featured, is_trending, is_new,
             plays, rating, created_at, updated_at
      FROM games
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      countQuery += ' AND status = ?';
      dataQuery += ' AND status = ?';
      params.push(status);
    }

    if (category && category !== 'all') {
      countQuery += ' AND category = ?';
      dataQuery += ' AND category = ?';
      params.push(category);
    }

    if (search && typeof search === 'string') {
      const term = `%${search.trim().toLowerCase()}%`;
      const searchClause = ' AND (LOWER(title) LIKE ? OR LOWER(slug) LIKE ? OR LOWER(category) LIKE ?)';
      countQuery += searchClause;
      dataQuery += searchClause;
      params.push(term, term, term);
    }

    const totalRow = db.prepare(countQuery).get(...params);
    const total = totalRow.total;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    dataQuery += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    const games = db.prepare(dataQuery).all(...params, limitNum, offset);

    const formatted = games.map(g => ({
      ...g,
      tags: typeof g.tags === 'string' ? JSON.parse(g.tags || '[]') : g.tags,
      is_featured: Boolean(g.is_featured),
      is_trending: Boolean(g.is_trending),
      is_new: Boolean(g.is_new)
    }));

    res.json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      games: formatted
    });
  } catch (err) {
    console.error('Error fetching admin games:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch games list.' });
  }
});

/**
 * GET /api/admin/games/:id
 */
adminRouter.get('/games/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const game = db.prepare('SELECT * FROM games WHERE id = ? OR slug = ?').get(id, id);

    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found.' });
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
 * Helper to generate URL-safe unique slug
 */
function makeSlug(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * POST /api/admin/games
 * Create a new game entry (draft or published)
 */
adminRouter.post('/games', requireAdmin, (req, res) => {
  try {
    const {
      title,
      slug: customSlug,
      description = '',
      category = 'action',
      tags = [],
      controls = 'Mouse & Keyboard controls',
      instructions = 'Follow on-screen objectives to win.',
      version = '1.0.0',
      status = 'draft',
      is_featured = false,
      is_trending = false,
      is_new = true,
      game_type: reqGameType,
      external_url = '',
      preview_video = '',
      thumbnail = '🎮',
      bundle_url = ''
    } = req.body || {};

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Game title is required.' });
    }

    // Check duplicate title collision against active catalog
    const normalizedTitle = title.trim().toLowerCase();
    const existingTitle = db.prepare("SELECT id, title FROM games WHERE LOWER(TRIM(title)) = ? AND status != 'archived'").get(normalizedTitle);
    if (existingTitle) {
      return res.status(400).json({
        success: false,
        error: `A game with the title "${title}" already exists in the catalog (ID: ${existingTitle.id}).`
      });
    }

    let slug = makeSlug(customSlug || title);
    if (!slug) {
      slug = 'game-' + Date.now();
    }

    // Check slug uniqueness
    const existingSlug = db.prepare('SELECT id FROM games WHERE slug = ?').get(slug);
    if (existingSlug) {
      return res.status(400).json({
        success: false,
        error: `A game with the slug "${slug}" already exists.`
      });
    }

    const id = 'game_' + crypto.randomBytes(6).toString('hex');
    const now = Date.now();
    const finalGameType = external_url ? 'external' : (reqGameType || 'bundle');

    const insert = db.prepare(`
      INSERT INTO games (
        id, slug, title, description, category, tags, thumbnail,
        bundle_url, external_url, preview_video, entry_path, game_type, engine,
        controls, instructions, version, status, is_featured, is_trending, is_new,
        plays, rating, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      id,
      slug,
      title.trim(),
      description.trim(),
      category.toLowerCase().trim(),
      JSON.stringify(Array.isArray(tags) ? tags : [category]),
      thumbnail || '🎮',
      bundle_url || '',
      external_url ? external_url.trim() : null,
      preview_video ? preview_video.trim() : null,
      'index.html',
      finalGameType,
      '',
      controls.trim(),
      instructions.trim(),
      version.trim() || '1.0.0',
      ['draft', 'published', 'archived'].includes(status) ? status : 'draft',
      is_featured ? 1 : 0,
      is_trending ? 1 : 0,
      is_new ? 1 : 0,
      0,
      5.0,
      now,
      now
    );

    const created = db.prepare('SELECT * FROM games WHERE id = ?').get(id);

    res.status(201).json({
      success: true,
      message: `Game "${title}" created successfully.`,
      game: created
    });
  } catch (err) {
    console.error('Error creating game:', err);
    res.status(500).json({ success: false, error: 'Failed to create game: ' + err.message });
  }
});

/**
 * PUT /api/admin/games/:id
 * Update game metadata
 */
adminRouter.put('/games/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM games WHERE id = ?').get(id);

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Game not found.' });
    }

    const {
      title,
      slug: newSlug,
      description,
      category,
      tags,
      controls,
      instructions,
      external_url,
      preview_video,
      thumbnail,
      bundle_url,
      version,
      status,
      is_featured,
      is_trending,
      is_new
    } = req.body || {};

    let safeSlug = existing.slug;
    if (newSlug && newSlug !== existing.slug) {
      safeSlug = makeSlug(newSlug);
      // Check collision
      const checkCollision = db.prepare('SELECT id FROM games WHERE slug = ? AND id != ?').get(safeSlug, id);
      if (checkCollision) {
        return res.status(400).json({ success: false, error: `Slug "${safeSlug}" is already in use by another game.` });
      }
    }

    // Check title collision if changed
    if (title && title.trim().toLowerCase() !== existing.title.trim().toLowerCase()) {
      const normalizedTitle = title.trim().toLowerCase();
      const existingTitle = db.prepare("SELECT id FROM games WHERE LOWER(TRIM(title)) = ? AND id != ? AND status != 'archived'").get(normalizedTitle, id);
      if (existingTitle) {
        return res.status(400).json({ success: false, error: `Another game with the title "${title}" already exists in the catalog.` });
      }
    }

    const update = db.prepare(`
      UPDATE games SET
        title = COALESCE(?, title),
        slug = ?,
        description = COALESCE(?, description),
        category = COALESCE(?, category),
        tags = COALESCE(?, tags),
        controls = COALESCE(?, controls),
        instructions = COALESCE(?, instructions),
        external_url = COALESCE(?, external_url),
        preview_video = COALESCE(?, preview_video),
        thumbnail = COALESCE(?, thumbnail),
        bundle_url = COALESCE(?, bundle_url),
        game_type = CASE WHEN ? IS NOT NULL AND ? != '' THEN 'external' ELSE game_type END,
        version = COALESCE(?, version),
        status = COALESCE(?, status),
        is_featured = COALESCE(?, is_featured),
        is_trending = COALESCE(?, is_trending),
        is_new = COALESCE(?, is_new),
        updated_at = ?
      WHERE id = ?
    `);

    update.run(
      title ? title.trim() : null,
      safeSlug,
      description !== undefined ? description.trim() : null,
      category ? category.toLowerCase().trim() : null,
      tags !== undefined ? JSON.stringify(tags) : null,
      controls !== undefined ? controls.trim() : null,
      instructions !== undefined ? instructions.trim() : null,
      external_url !== undefined ? external_url.trim() : null,
      preview_video !== undefined ? preview_video.trim() : null,
      thumbnail !== undefined ? thumbnail.trim() : null,
      bundle_url !== undefined ? bundle_url.trim() : null,
      external_url !== undefined ? external_url.trim() : null,
      external_url !== undefined ? external_url.trim() : null,
      version !== undefined ? version.trim() : null,
      status !== undefined ? status : null,
      is_featured !== undefined ? (is_featured ? 1 : 0) : null,
      is_trending !== undefined ? (is_trending ? 1 : 0) : null,
      is_new !== undefined ? (is_new ? 1 : 0) : null,
      Date.now(),
      id
    );

    const updated = db.prepare('SELECT * FROM games WHERE id = ?').get(id);

    res.json({
      success: true,
      message: 'Game updated successfully.',
      game: updated
    });
  } catch (err) {
    console.error('Error updating game:', err);
    res.status(500).json({ success: false, error: 'Failed to update game: ' + err.message });
  }
});

/**
 * POST /api/admin/games/:id/upload
 * Upload game bundle (ZIP archive)
 */
adminRouter.post('/games/:id/upload', requireAdmin, upload.single('bundle'), async (req, res) => {
  try {
    const { id } = req.params;
    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(id);

    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found.' });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, error: 'No ZIP file uploaded.' });
    }

    const targetVersion = req.body?.version || game.version || '1.0.0';

    // Process and validate ZIP
    const result = await processGameZip({
      fileBuffer: req.file.buffer,
      slug: game.slug,
      version: targetVersion
    });

    // Update game record in database
    db.prepare(`
      UPDATE games SET
        bundle_url = ?,
        entry_path = ?,
        game_type = 'bundle',
        version = ?,
        updated_at = ?
      WHERE id = ?
    `).run(result.bundleUrl, result.entryPath, result.version, Date.now(), id);

    const updated = db.prepare('SELECT * FROM games WHERE id = ?').get(id);

    res.json({
      success: true,
      message: `Bundle for "${game.title}" extracted and verified successfully (${result.extractedFiles} files).`,
      bundleUrl: result.bundleUrl,
      entryPath: result.entryPath,
      game: updated
    });
  } catch (err) {
    console.error('Error uploading game bundle:', err);
    res.status(400).json({
      success: false,
      error: err.message || 'Failed to process game bundle upload.'
    });
  }
});

/**
 * POST /api/admin/games/:id/thumbnail
 * Upload thumbnail image for game
 */
adminRouter.post('/games/:id/thumbnail', requireAdmin, upload.single('thumbnail'), (req, res) => {
  try {
    const { id } = req.params;
    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(id);

    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found.' });
    }

    let thumbUrl = '';

    if (req.file && req.file.buffer) {
      thumbUrl = saveThumbnailFile({
        fileBuffer: req.file.buffer,
        originalName: req.file.originalname,
        slug: game.slug,
        version: game.version
      });
    } else if (req.body?.svgMarkup) {
      // Direct SVG or icon
      thumbUrl = req.body.svgMarkup;
    } else {
      return res.status(400).json({ success: false, error: 'No thumbnail file or SVG markup provided.' });
    }

    db.prepare(`
      UPDATE games SET
        thumbnail = ?,
        updated_at = ?
      WHERE id = ?
    `).run(thumbUrl, Date.now(), id);

    res.json({
      success: true,
      thumbnail: thumbUrl,
      message: 'Thumbnail updated successfully.'
    });
  } catch (err) {
    console.error('Error uploading thumbnail:', err);
    res.status(400).json({ success: false, error: err.message || 'Failed to upload thumbnail.' });
  }
});

/**
 * POST /api/admin/games/:id/video
 * Upload gameplay preview video (.mp4/.webm)
 */
adminRouter.post('/games/:id/video', requireAdmin, upload.single('video'), (req, res) => {
  try {
    const { id } = req.params;
    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(id);

    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found.' });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, error: 'No video file provided.' });
    }

    const videoUrl = savePreviewVideoFile({
      fileBuffer: req.file.buffer,
      originalName: req.file.originalname,
      slug: game.slug,
      version: game.version
    });

    db.prepare(`
      UPDATE games SET
        preview_video = ?,
        updated_at = ?
      WHERE id = ?
    `).run(videoUrl, Date.now(), id);

    const updated = db.prepare('SELECT * FROM games WHERE id = ?').get(id);

    res.json({
      success: true,
      previewVideo: videoUrl,
      message: 'Gameplay preview video updated successfully.',
      game: updated
    });
  } catch (err) {
    console.error('Error uploading video preview:', err);
    res.status(400).json({ success: false, error: err.message || 'Failed to upload preview video.' });
  }
});

/**
 * POST /api/admin/games/publish-with-assets
 * Unified 1-step atomic endpoint to upload bundle, cover image, and video preview together
 */
adminRouter.post(
  '/games/publish-with-assets',
  requireAdmin,
  upload.fields([
    { name: 'bundle', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
    { name: 'previewVideo', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const {
        title,
        slug: customSlug,
        description = '',
        category = 'action',
        tags = '[]',
        controls = 'Keyboard & Mouse controls',
        instructions = 'Follow on-screen instructions.',
        version = '1.0.0',
        status = 'published',
        is_featured = 'false',
        is_trending = 'false',
        is_new = 'true',
        external_url = '',
        game_id = '' // If provided, updates existing game!
      } = req.body || {};

      if (!title || !title.trim()) {
        return res.status(400).json({ success: false, error: 'Game title is required.' });
      }

      let parsedTags = [];
      try {
        parsedTags = typeof tags === 'string' ? (tags.startsWith('[') ? JSON.parse(tags) : tags.split(',').map(t => t.trim())) : tags;
      } catch (_) {
        parsedTags = [category];
      }

      let safeSlug = makeSlug(customSlug || title);
      if (!safeSlug) safeSlug = 'game-' + Date.now();

      let targetId = game_id;
      let existing = null;
      if (targetId) {
        existing = db.prepare('SELECT * FROM games WHERE id = ?').get(targetId);
      }

      // Check slug collision
      const checkSlug = db.prepare('SELECT id FROM games WHERE slug = ?' + (targetId ? ' AND id != ?' : '')).get(...(targetId ? [safeSlug, targetId] : [safeSlug]));
      if (checkSlug) {
        return res.status(400).json({ success: false, error: `Slug "${safeSlug}" is already taken.` });
      }

      // Handle Cover Image
      let thumbUrl = existing?.thumbnail || '🎮';
      if (req.files?.thumbnail?.[0]) {
        thumbUrl = saveThumbnailFile({
          fileBuffer: req.files.thumbnail[0].buffer,
          originalName: req.files.thumbnail[0].originalname,
          slug: safeSlug,
          version
        });
      }

      // Handle Preview Video
      let videoUrl = existing?.preview_video || null;
      if (req.files?.previewVideo?.[0]) {
        videoUrl = savePreviewVideoFile({
          fileBuffer: req.files.previewVideo[0].buffer,
          originalName: req.files.previewVideo[0].originalname,
          slug: safeSlug,
          version
        });
      }

      // Handle Bundle ZIP
      let bundleUrl = existing?.bundle_url || '';
      let entryPath = existing?.entry_path || 'index.html';
      let gameType = external_url ? 'external' : (existing?.game_type || 'bundle');

      if (req.files?.bundle?.[0]) {
        const bundleResult = await processGameZip({
          fileBuffer: req.files.bundle[0].buffer,
          slug: safeSlug,
          version
        });
        bundleUrl = bundleResult.bundleUrl;
        entryPath = bundleResult.entryPath;
        gameType = 'bundle';
      }

      const now = Date.now();

      if (targetId && existing) {
        // Update existing
        db.prepare(`
          UPDATE games SET
            title = ?,
            slug = ?,
            description = ?,
            category = ?,
            tags = ?,
            controls = ?,
            instructions = ?,
            thumbnail = ?,
            bundle_url = ?,
            external_url = ?,
            preview_video = ?,
            entry_path = ?,
            game_type = ?,
            version = ?,
            status = ?,
            is_featured = ?,
            is_trending = ?,
            is_new = ?,
            updated_at = ?
          WHERE id = ?
        `).run(
          title.trim(),
          safeSlug,
          description.trim(),
          category.toLowerCase().trim(),
          JSON.stringify(parsedTags),
          controls.trim(),
          instructions.trim(),
          thumbUrl,
          bundleUrl,
          external_url ? external_url.trim() : null,
          videoUrl,
          entryPath,
          gameType,
          version.trim(),
          ['published', 'draft', 'archived'].includes(status) ? status : 'published',
          is_featured === 'true' || is_featured === true ? 1 : 0,
          is_trending === 'true' || is_trending === true ? 1 : 0,
          is_new === 'true' || is_new === true ? 1 : 0,
          now,
          targetId
        );
      } else {
        // Insert new
        targetId = 'game_' + crypto.randomBytes(6).toString('hex');
        db.prepare(`
          INSERT INTO games (
            id, slug, title, description, category, tags, thumbnail,
            bundle_url, external_url, preview_video, entry_path, game_type, engine,
            controls, instructions, version, status, is_featured, is_trending, is_new,
            plays, rating, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          targetId,
          safeSlug,
          title.trim(),
          description.trim(),
          category.toLowerCase().trim(),
          JSON.stringify(parsedTags),
          thumbUrl,
          bundleUrl,
          external_url ? external_url.trim() : null,
          videoUrl,
          entryPath,
          gameType,
          '',
          controls.trim(),
          instructions.trim(),
          version.trim(),
          ['published', 'draft', 'archived'].includes(status) ? status : 'published',
          is_featured === 'true' || is_featured === true ? 1 : 0,
          is_trending === 'true' || is_trending === true ? 1 : 0,
          is_new === 'true' || is_new === true ? 1 : 0,
          0,
          5.0,
          now,
          now
        );
      }

      const savedGame = db.prepare('SELECT * FROM games WHERE id = ?').get(targetId);

      res.status(existing ? 200 : 201).json({
        success: true,
        message: `Game "${title}" successfully saved and ${savedGame.status === 'published' ? 'published to live catalog' : 'saved as draft'}.`,
        game: {
          ...savedGame,
          tags: typeof savedGame.tags === 'string' ? JSON.parse(savedGame.tags || '[]') : savedGame.tags,
          is_featured: Boolean(savedGame.is_featured),
          is_trending: Boolean(savedGame.is_trending),
          is_new: Boolean(savedGame.is_new)
        }
      });
    } catch (err) {
      console.error('Error publishing game with assets:', err);
      res.status(400).json({ success: false, error: err.message || 'Failed to process game upload.' });
    }
  }
);

/**
 * PATCH /api/admin/games/:id/status
 * Quickly publish, unpublish (draft), or archive game
 */
adminRouter.patch('/games/:id/status', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!['published', 'draft', 'archived'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status. Must be "published", "draft", or "archived".' });
    }

    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(id);
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found.' });
    }

    // If publishing, ensure bundle, external URL, or builtin engine is present
    if (status === 'published') {
      if (game.game_type === 'bundle' && !game.bundle_url && !game.external_url) {
        return res.status(400).json({
          success: false,
          error: 'Cannot publish game: No game bundle (ZIP) or external URL has been uploaded yet.'
        });
      }
    }

    db.prepare(`
      UPDATE games SET status = ?, updated_at = ? WHERE id = ?
    `).run(status, Date.now(), id);

    res.json({
      success: true,
      status,
      message: `Game status changed to "${status}".`
    });
  } catch (err) {
    console.error('Error updating game status:', err);
    res.status(500).json({ success: false, error: 'Failed to update game status.' });
  }
});

/**
 * DELETE /api/admin/games/:id
 * Delete or permanently archive a game
 */
adminRouter.delete('/games/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(id);

    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found.' });
    }

    // Permanently remove from DB
    db.prepare('DELETE FROM games WHERE id = ?').run(id);

    res.json({
      success: true,
      message: `Game "${game.title}" has been deleted.`
    });
  } catch (err) {
    console.error('Error deleting game:', err);
    res.status(500).json({ success: false, error: 'Failed to delete game.' });
  }
});

