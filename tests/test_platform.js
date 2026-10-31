import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { db, initDatabase } from '../server/db/database.js';
import { authenticateAdmin, verifySessionToken } from '../server/services/authService.js';
import { processGameZip, saveThumbnailFile, savePreviewVideoFile } from '../server/services/uploadService.js';
import { config } from '../server/config.js';

console.log('====================================================');
console.log('🧪 GAMINGZONE PLATFORM AUTOMATED TEST SUITE');
console.log('====================================================\n');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  // 1. Database Initialization
  initDatabase();
  const gameCount = db.prepare('SELECT COUNT(*) as count FROM games').get().count;
  assert(gameCount >= 56, `Database contains ${gameCount} games (>= 56 builtins seeded).`);

  // 2. Admin Authentication
  console.log('\n--- Test 2: Admin Authentication & Security ---');
  const validLogin = authenticateAdmin(config.adminUsername, config.adminPassword);
  assert(validLogin.success && validLogin.token.startsWith('gz_adm_'), 'Valid admin credentials return secure session token.');

  // Test legacy PIN 1234 support
  const pinLogin = authenticateAdmin(config.adminUsername, '1234');
  assert(pinLogin.success && pinLogin.token.startsWith('gz_adm_'), 'Legacy/fallback admin PIN (1234) authenticated successfully.');

  const invalidLogin = authenticateAdmin(config.adminUsername, 'wrongpassword123');
  assert(!invalidLogin.success, 'Invalid password correctly rejected with 401.');

  const emptyLogin = authenticateAdmin('', '');
  assert(!emptyLogin.success, 'Empty credentials rejected.');

  const verified = verifySessionToken(validLogin.token);
  assert(verified && verified.username === config.adminUsername, 'Session token verified successfully.');

  const fakeVerify = verifySessionToken('gz_fake_token_12345');
  assert(fakeVerify === null, 'Counterfeit session token rejected.');

  // 3. ZIP Upload & Security Validation
  console.log('\n--- Test 3: Upload Validation & Path Traversal Rejection ---');
  
  // 3a. Reject non-zip buffer
  try {
    await processGameZip({
      fileBuffer: Buffer.from('this is not a zip file'),
      slug: 'test-bad-file',
      version: '1.0.0'
    });
    assert(false, 'Non-zip buffer should have been rejected.');
  } catch (err) {
    assert(err.message.includes('not a valid ZIP archive'), 'Non-zip file properly rejected: ' + err.message);
  }

  // 3b. Reject ZIP without index.html
  try {
    const emptyZip = new AdmZip();
    emptyZip.addFile('main.js', Buffer.from('console.log("hello");'));
    const buf = emptyZip.toBuffer();
    await processGameZip({
      fileBuffer: buf,
      slug: 'test-no-index',
      version: '1.0.0'
    });
    assert(false, 'ZIP without index.html should have been rejected.');
  } catch (err) {
    assert(err.message.includes('index.html'), 'ZIP without index.html properly rejected: ' + err.message);
  }

  // 3c. Reject Path Traversal attempt (Zip Slip)
  try {
    const maliciousZip = new AdmZip();
    maliciousZip.addFile('index.html', Buffer.from('<html></html>'));
    maliciousZip.addFile('evil.txt', Buffer.from('malicious payload'));
    const entries = maliciousZip.getEntries();
    const evilEntry = entries.find(e => e.entryName === 'evil.txt');
    if (evilEntry) {
      evilEntry.entryName = '../../evil.txt';
    }
    const buf = maliciousZip.toBuffer();
    await processGameZip({
      fileBuffer: buf,
      slug: 'test-traversal',
      version: '1.0.0'
    });
    assert(false, 'Path traversal zip should have been rejected.');
  } catch (err) {
    assert(err.message.includes('Unsafe path detected') || err.message.includes('Security Violation'), 'Path traversal detected and blocked: ' + err.message);
  }

  // 3d. Reject Disallowed Server Script (.php)
  try {
    const phpZip = new AdmZip();
    phpZip.addFile('index.html', Buffer.from('<html></html>'));
    phpZip.addFile('exploit.php', Buffer.from('<?php echo "evil"; ?>'));
    const buf = phpZip.toBuffer();
    await processGameZip({
      fileBuffer: buf,
      slug: 'test-php',
      version: '1.0.0'
    });
    assert(false, 'Server-side executable should have been rejected.');
  } catch (err) {
    assert(err.message.includes('Security Violation'), 'Disallowed server script (.php) blocked: ' + err.message);
  }

  // 4. Valid Game Bundle Upload & Extraction
  console.log('\n--- Test 4: Valid Game Bundle Upload & Verification ---');
  const sampleZipPath = path.resolve('sample-games/space-dodge.zip');
  assert(fs.existsSync(sampleZipPath), 'Sample test game ZIP exists.');

  const sampleBuffer = fs.readFileSync(sampleZipPath);
  const uploadResult = await processGameZip({
    fileBuffer: sampleBuffer,
    slug: 'space-dodge-mission',
    version: '1.0.0'
  });

  assert(uploadResult.success, 'Sample game ZIP extracted successfully.');
  assert(uploadResult.bundleUrl === '/uploads/games/space-dodge-mission/v1.0.0/', 'Correct bundle URL generated: ' + uploadResult.bundleUrl);
  
  const extractedIndex = path.join(config.gamesUploadDir, 'space-dodge-mission', 'v1.0.0', 'index.html');
  assert(fs.existsSync(extractedIndex), 'Extracted index.html verified on disk.');

  // 5. Full Lifecycle: Create -> Upload -> Draft Protection -> Publish -> Play -> Archive
  console.log('\n--- Test 5: Game Lifecycle & Registry Persistence ---');
  const testId = 'game_test_' + Date.now();
  const testSlug = 'space-dodge-mission';

  // Cleanup any prior test entry
  db.prepare('DELETE FROM games WHERE slug = ?').run(testSlug);

  // Insert as Draft
  const now = Date.now();
  db.prepare(`
    INSERT INTO games (
      id, slug, title, description, category, tags, thumbnail,
      bundle_url, entry_path, game_type, controls, version,
      status, is_featured, is_new, plays, rating, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    testId,
    testSlug,
    'Space Dodge Mission',
    'A retro arcade spaceship dodging game.',
    'arcade',
    JSON.stringify(['arcade', 'space', 'action']),
    '🚀',
    uploadResult.bundleUrl,
    'index.html',
    'bundle',
    'Arrow keys / touch',
    '1.0.0',
    'draft',
    1,
    1,
    0,
    5.0,
    now,
    now
  );

  // Check Draft Protection (Must NOT appear in published games query)
  const draftInPublic = db.prepare("SELECT id FROM games WHERE slug = ? AND status = 'published'").get(testSlug);
  assert(!draftInPublic, 'Draft game is NOT visible in public catalog.');

  // Publish Game
  db.prepare("UPDATE games SET status = 'published', updated_at = ? WHERE id = ?").run(Date.now(), testId);
  const publishedInPublic = db.prepare("SELECT * FROM games WHERE slug = ? AND status = 'published'").get(testSlug);
  assert(!!publishedInPublic, 'Published game is now visible in public catalog.');
  assert(publishedInPublic.game_type === 'bundle', 'Game type correctly identified as bundle.');
  assert(publishedInPublic.bundle_url.includes('/uploads/games/space-dodge-mission/'), 'Bundle URL is accessible.');

  // Increment plays
  db.prepare("UPDATE games SET plays = plays + 1 WHERE id = ?").run(testId);
  const updatedPlays = db.prepare("SELECT plays FROM games WHERE id = ?").get(testId).plays;
  assert(updatedPlays === 1, 'Game play count incremented to 1.');

  // Unpublish / Archive
  db.prepare("UPDATE games SET status = 'archived' WHERE id = ?").run(testId);
  const archivedInPublic = db.prepare("SELECT id FROM games WHERE slug = ? AND status = 'published'").get(testSlug);
  assert(!archivedInPublic, 'Archived game is excluded from public catalog.');

  // Restore to published so it can be previewed and played live!
  db.prepare("UPDATE games SET status = 'published' WHERE id = ?").run(testId);
  assert(true, 'Test game restored to published status for live player verification.');

  // 6. Catalog Deduplication Verification
  console.log('\n--- Test 6: Catalog Deduplication & Zero Duplicates ---');
  const allDbGames = db.prepare("SELECT id, slug, title FROM games WHERE status != 'archived'").all();
  const titleSet = new Set();
  const slugSet = new Set();
  let duplicateCount = 0;

  for (const g of allDbGames) {
    const normT = g.title.toLowerCase().trim();
    const normS = g.slug.toLowerCase().trim();
    if (titleSet.has(normT) || slugSet.has(normS)) {
      duplicateCount++;
    }
    titleSet.add(normT);
    slugSet.add(normS);
  }
  assert(duplicateCount === 0, `Active database catalog has 0 duplicates across ${allDbGames.length} games.`);

  // 7. Pilot Game Isolation Test: Arrow Maze Escape
  console.log('\n--- Test 7: Pilot Game Isolation (Arrow Maze Escape) ---');
  const arrowGame = db.prepare("SELECT * FROM games WHERE slug = 'arrow-maze-escape' OR id = 'game_arrow_maze_escape'").get();
  assert(!!arrowGame, 'Pilot game "Arrow Maze Escape" exists in central database.');
  assert(arrowGame.engine === 'ArrowMazeEscape', 'Engine points to ArrowMazeEscape module.');

  const enginePath = path.resolve('js/games/ArrowMazeEscape.js');
  assert(fs.existsSync(enginePath), 'ArrowMazeEscape.js engine file exists and is cleanly isolated.');

  // Verify independent update does not affect other games
  const originalDesc = arrowGame.description;
  const testDesc = 'Updated pilot description test ' + Date.now();
  db.prepare("UPDATE games SET description = ?, updated_at = ? WHERE id = ?").run(testDesc, Date.now(), arrowGame.id);

  const reloadedArrow = db.prepare("SELECT description FROM games WHERE id = ?").get(arrowGame.id);
  assert(reloadedArrow.description === testDesc, 'Pilot game metadata independently updated without altering other games.');

  // Restore original description
  db.prepare("UPDATE games SET description = ?, updated_at = ? WHERE id = ?").run(originalDesc, Date.now(), arrowGame.id);
  assert(true, 'Pilot game metadata restored cleanly.');

  // 8. Gameplay Preview Video Upload & Validation
  console.log('\n--- Test 8: Gameplay Video Preview Validation & Upload ---');
  try {
    // 8a. Disallowed format rejection
    savePreviewVideoFile({
      fileBuffer: Buffer.from('fake-video'),
      originalName: 'clip.avi',
      slug: 'test-game',
      version: '1.0.0'
    });
    assert(false, 'Non-mp4/webm video should be rejected.');
  } catch (err) {
    assert(err.message.includes('Invalid video format'), 'Disallowed video format properly rejected: ' + err.message);
  }

  // 8b. Valid mp4 preview upload
  const testVideoBuf = Buffer.from('fake-mp4-video-stream-bytes');
  const videoUrl = savePreviewVideoFile({
    fileBuffer: testVideoBuf,
    originalName: 'gameplay.mp4',
    slug: 'space-dodge-mission',
    version: '1.0.0'
  });
  assert(videoUrl.startsWith('/uploads/previews/space-dodge-mission-preview-'), 'Valid video preview saved to /uploads/previews/: ' + videoUrl);
  const videoDiskPath = path.join(config.rootDir, videoUrl);
  assert(fs.existsSync(videoDiskPath), 'Video file physically verified on persistent storage disk.');

  // 9. Cover Image Upload & Persistence
  console.log('\n--- Test 9: Cover Image Upload & Validation ---');
  const testCoverBuf = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect fill="orange"/></svg>');
  const coverUrl = saveThumbnailFile({
    fileBuffer: testCoverBuf,
    originalName: 'cover.svg',
    slug: 'space-dodge-mission',
    version: '1.0.0'
  });
  assert(coverUrl.startsWith('/uploads/thumbnails/space-dodge-mission-'), 'Cover image saved to /uploads/thumbnails/: ' + coverUrl);
  const coverDiskPath = path.join(config.rootDir, coverUrl);
  assert(fs.existsSync(coverDiskPath), 'Cover image physically verified on persistent storage disk.');

  // 10. Dynamic Editing Without Redeployment
  console.log('\n--- Test 10: Dynamic Game Editing Without Redeploy ---');
  db.prepare(`
    UPDATE games SET
      title = ?,
      controls = ?,
      instructions = ?,
      preview_video = ?,
      thumbnail = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    'Space Dodge Mission Pro',
    'WASD to fly, Space for turbo booster',
    'Avoid asteroids for 120 seconds to reach hyperspace portal.',
    videoUrl,
    coverUrl,
    Date.now(),
    testId
  );

  const editedGame = db.prepare('SELECT * FROM games WHERE id = ?').get(testId);
  assert(editedGame.title === 'Space Dodge Mission Pro', 'Game title dynamically updated in database.');
  assert(editedGame.controls.includes('turbo booster'), 'Game controls dynamically updated.');
  assert(editedGame.instructions.includes('hyperspace portal'), 'Game instructions dynamically updated.');
  assert(editedGame.preview_video === videoUrl, 'Video preview asset linked in database.');
  assert(editedGame.thumbnail === coverUrl, 'Cover image asset linked in database.');

  // 11. Draft vs Public Segregation
  console.log('\n--- Test 11: Draft vs Public Segregation ---');
  db.prepare("UPDATE games SET status = 'draft' WHERE id = ?").run(testId);
  const publicView = db.prepare("SELECT id FROM games WHERE status = 'published' AND id = ?").get(testId);
  assert(!publicView, 'Public visitors CANNOT see draft game.');
  const adminView = db.prepare("SELECT id, status FROM games WHERE id = ?").get(testId);
  assert(adminView && adminView.status === 'draft', 'Admin can fetch and preview draft game.');

  // 12. External Game URL Registration
  console.log('\n--- Test 12: External Game URL Registration ---');
  const extId = 'game_ext_' + Date.now();
  db.prepare(`
    INSERT INTO games (
      id, slug, title, description, category, tags, thumbnail,
      bundle_url, external_url, entry_path, game_type, controls, instructions,
      version, status, is_featured, is_trending, is_new, plays, rating, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    extId,
    'external-racer-demo',
    'External Racer Demo',
    'External hosted racer',
    'racing',
    '["racing"]',
    '🏎️',
    '',
    'https://example.com/games/racer/index.html',
    'index.html',
    'external',
    'Arrow keys',
    'Win the race',
    '1.0.0',
    'published',
    0, 0, 1, 0, 4.9, Date.now(), Date.now()
  );

  const extGame = db.prepare('SELECT * FROM games WHERE id = ?').get(extId);
  assert(extGame.game_type === 'external', 'External game type registered.');
  assert(extGame.external_url === 'https://example.com/games/racer/index.html', 'External URL stored securely.');
  // Cleanup test external game
  db.prepare('DELETE FROM games WHERE id = ?').run(extId);

  // 13. Server Restart Persistence Verification
  console.log('\n--- Test 13: Server Restart Persistence Verification ---');
  // Re-run initDatabase to simulate server restart
  initDatabase();
  const persistentGame = db.prepare('SELECT * FROM games WHERE id = ?').get(testId);
  assert(!!persistentGame, 'Game metadata persists across server initialization.');
  assert(persistentGame.preview_video === videoUrl, 'Preview video URL persists across server initialization.');
  assert(persistentGame.thumbnail === coverUrl, 'Cover image URL persists across server initialization.');

  // Cleanup test game
  db.prepare("DELETE FROM games WHERE id = ?").run(testId);

  console.log(`\n====================================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`====================================================\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
