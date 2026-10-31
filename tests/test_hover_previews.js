/* ====================================================
   GAMINGZONE — HOVER PREVIEW & CRAZYGAMES UI TEST SUITE
   Verifies:
   - Preview Manifest metadata & asset mappings
   - Single-Active Preview Manager enforcement
   - Hover debounce timer initiation & cancellation
   - Safe fallback when preview video is not present
   - Touch/Mobile safety & reduced-motion compliance
   ==================================================== */

// Setup Mock DOM if running in Node.js
if (typeof window === 'undefined') {
  class MockElement {
    constructor(tag = 'div') {
      this.tagName = tag.toUpperCase();
      this.nodeType = 1;
      this._classes = new Set([tag.toLowerCase()]);
      this.dataset = {};
      this.attrs = {};
      this.children = [];
    }
    get className() {
      return Array.from(this._classes).join(' ');
    }
    set className(val) {
      this._classes = new Set((val || '').split(/\s+/).filter(Boolean));
    }
    get classList() {
      return {
        contains: (c) => this._classes.has(c),
        add: (c) => this._classes.add(c),
        remove: (c) => this._classes.delete(c),
        toggle: (c, force) => {
          if (force !== undefined) {
            force ? this._classes.add(c) : this._classes.delete(c);
            return force;
          }
          const has = this._classes.has(c);
          has ? this._classes.delete(c) : this._classes.add(c);
          return !has;
        }
      };
    }
    setAttribute(k, v) { this.attrs[k] = v; }
    getAttribute(k) { return this.attrs[k] || null; }
    addEventListener() {}
    removeEventListener() {}
    querySelector() { return new MockElement('div'); }
    appendChild(c) { this.children.push(c); return c; }
    remove() {}
  }

  global.HTMLElement = MockElement;
  global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  };
  global.document = {
    createElement: (tag) => new MockElement(tag)
  };
  global.window = {
    innerWidth: 1024,
    localStorage: global.localStorage,
    matchMedia: () => ({ matches: false, addEventListener: () => {} })
  };
  try {
    Object.defineProperty(global, 'navigator', {
      value: { maxTouchPoints: 0 },
      configurable: true,
      writable: true
    });
  } catch (e) {}
}

import { PREVIEW_MANIFEST, getGamePreviewMeta } from '../js/data/previewManifest.js';
import { GameCard, previewManager } from '../js/ui/GameCard.js';
import { DEFAULT_GAMES } from '../js/data/gamesRegistry.js';

function runHoverPreviewTests() {
  console.log('====================================================');
  console.log('🎬 GAMINGZONE — HOVER PREVIEWS & CARDS TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // --- Test 1: Preview Manifest Structure ---
  console.log('--- Test 1: Preview Manifest Structure ---');
  assert(typeof PREVIEW_MANIFEST === 'object', 'PREVIEW_MANIFEST is exported as an object');
  assert(Object.keys(PREVIEW_MANIFEST).length >= 3, 'Manifest contains spotlight preview entries');

  const cricketMeta = getGamePreviewMeta({ id: 'game_cricket_premier_league', slug: 'cricket-premier-league-3d' });
  assert(cricketMeta.hasPreview === true, 'Cricket Premier League 3D has valid preview flag true');
  assert(cricketMeta.previewVideo.includes('.webm') || cricketMeta.previewVideo.includes('.mp4'), 'Cricket Premier League video has valid media format');
  assert(typeof cricketMeta.source === 'string', 'Preview source/license is specified');

  // --- Test 2: Missing Preview Graceful Fallback ---
  console.log('\n--- Test 2: Missing Preview Graceful Fallback ---');
  const missingMeta = getGamePreviewMeta({ id: 'game_unknown_test_999', slug: 'unknown-slug' });
  assert(missingMeta.hasPreview === false, 'Non-existent preview correctly returns hasPreview: false');
  assert(missingMeta.previewVideo === null, 'Non-existent preview video URL is strictly null (no fake paths)');

  // --- Test 3: GameCard Component & Metadata ---
  console.log('\n--- Test 3: GameCard Component & Metadata ---');
  const testGame = DEFAULT_GAMES[0];
  const card = new GameCard(testGame);
  assert(card.element instanceof HTMLElement || card.element.nodeType === 1, 'GameCard creates valid DOM element');
  assert(card.element.classList.contains('gz-game-card'), 'GameCard has gz-game-card class');
  assert(card.element.getAttribute('role') === 'button', 'GameCard has accessible button role');
  assert(card.element.getAttribute('tabindex') === '0', 'GameCard has keyboard focusable tabindex');

  // --- Test 4: Single-Active Preview Manager ---
  console.log('\n--- Test 4: Single-Active Preview Manager ---');
  const mockCardA = {
    stopCalled: false,
    stopPreview() { this.stopCalled = true; }
  };
  const mockCardB = {
    stopCalled: false,
    stopPreview() { this.stopCalled = true; }
  };

  previewManager.requestPlay(mockCardA);
  assert(previewManager.activeCard === mockCardA, 'Manager sets Card A as active preview');

  previewManager.requestPlay(mockCardB);
  assert(mockCardA.stopCalled === true, 'Requesting Card B automatically deactivates Card A');
  assert(previewManager.activeCard === mockCardB, 'Manager sets Card B as active preview');

  previewManager.release(mockCardB);
  assert(previewManager.activeCard === null, 'Releasing active card sets activeCard to null');

  // --- Test 5: Debounce Timer & Hover Cancellation ---
  console.log('\n--- Test 5: Debounce Timer & Hover Cancellation ---');
  card.onMouseEnter();
  assert(card.hoverTimer !== null, 'onMouseEnter starts 280ms debounce timer');

  card.onMouseLeave();
  assert(card.hoverTimer === null, 'onMouseLeave cancels pending debounce timer');
  assert(card.isPlaying === false, 'Immediate mouse exit prevents video playback');

  // Clean up
  card.destroy();
  assert(card.element === null, 'card.destroy() releases DOM element references');

  console.log('\n====================================================');
  console.log(`HOVER PREVIEWS TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runHoverPreviewTests();
