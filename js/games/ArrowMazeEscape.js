/* ====================================================
   ARROW MAZE ESCAPE — PREMIUM PUZZLE GAME ENGINE
   Authoritative Grid Mechanics, Continuous Arrow Flow,
   60 Verified Solvable Levels, Dynamic Solver & Themes
   ==================================================== */

import { sounds } from '../core/soundFX.js';
import { ARROW_MAZE_LEVELS } from '../data/arrowMazeLevels.js';
import { ArrowMazeAdapter } from '../core/levelEngine/index.js';

const arrowMazeAdapter = new ArrowMazeAdapter();

const DIRS = {
  UP: { dr: -1, dc: 0, angle: -Math.PI / 2, name: 'UP' },
  DOWN: { dr: 1, dc: 0, angle: Math.PI / 2, name: 'DOWN' },
  LEFT: { dr: 0, dc: -1, angle: Math.PI, name: 'LEFT' },
  RIGHT: { dr: 0, dc: 1, angle: 0, name: 'RIGHT' }
};

const THEMES = [
  {
    id: 'zen',
    name: 'Zen Cream',
    icon: '🍵',
    bg: '#fcfbf7',
    card: '#ffffff',
    text: '#2d2822',
    textMuted: '#7c7267',
    gridCell: 'rgba(92, 72, 56, 0.06)',
    gridBorder: 'rgba(92, 72, 56, 0.12)',
    wall: '#e6ded3',
    boardShadow: '0 20px 48px -12px rgba(92, 72, 56, 0.25)',
    arrowShadow: 'rgba(0, 0, 0, 0.18)',
    accent: '#0284c7',
    hintGlow: '#f59e0b',
    blockerGlow: '#ef4444'
  },
  {
    id: 'cyber',
    name: 'Cyber Slate',
    icon: '⚡',
    bg: '#0a0f1d',
    card: '#121a2f',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    gridCell: 'rgba(255, 255, 255, 0.03)',
    gridBorder: 'rgba(255, 255, 255, 0.08)',
    wall: '#1e293b',
    boardShadow: '0 24px 56px -12px rgba(0, 0, 0, 0.65)',
    arrowShadow: 'rgba(0, 0, 0, 0.45)',
    accent: '#00e5ff',
    hintGlow: '#ffd166',
    blockerGlow: '#f43f5e'
  },
  {
    id: 'velvet',
    name: 'Sunset Velvet',
    icon: '🌅',
    bg: '#181226',
    card: '#241b38',
    text: '#f8fafc',
    textMuted: '#cbd5e1',
    gridCell: 'rgba(255, 255, 255, 0.035)',
    gridBorder: 'rgba(255, 255, 255, 0.09)',
    wall: '#34264e',
    boardShadow: '0 24px 56px -12px rgba(24, 18, 38, 0.7)',
    arrowShadow: 'rgba(0, 0, 0, 0.4)',
    accent: '#ec4899',
    hintGlow: '#fbbf24',
    blockerGlow: '#f43f5e'
  }
];

export class ArrowSolver {
  static solve(gridR, gridC, arrows) {
    let remaining = arrows.map(a => ({
      id: a.id,
      cells: [...a.cells],
      headDir: a.headDir
    }));

    const sequence = [];

    while (remaining.length > 0) {
      const occ = new Map();
      for (const a of remaining) {
        for (const c of a.cells) {
          occ.set(`${c.r},${c.c}`, a.id);
        }
      }

      const free = [];
      for (const a of remaining) {
        const head = a.cells[a.cells.length - 1];
        const d = DIRS[a.headDir];
        let r = head.r + d.dr;
        let c = head.c + d.dc;
        let blocked = false;

        while (r >= 0 && r < gridR && c >= 0 && c < gridC) {
          const occupier = occ.get(`${r},${c}`);
          if (occupier && occupier !== a.id) {
            blocked = true;
            break;
          }
          r += d.dr;
          c += d.dc;
        }

        if (!blocked) {
          free.push(a);
        }
      }

      if (free.length === 0) {
        return { solvable: false, sequence, remaining: remaining.length };
      }

      const pick = free[0];
      sequence.push(pick.id);
      remaining = remaining.filter(a => a.id !== pick.id);
    }

    return { solvable: true, sequence };
  }

  static findFirstLegalMove(gridR, gridC, arrows) {
    const occ = new Map();
    for (const a of arrows) {
      for (const c of a.cells) {
        occ.set(`${c.r},${c.c}`, a.id);
      }
    }

    for (const a of arrows) {
      const head = a.cells[a.cells.length - 1];
      const d = DIRS[a.headDir];
      let r = head.r + d.dr;
      let c = head.c + d.dc;
      let blocked = false;

      while (r >= 0 && r < gridR && c >= 0 && c < gridC) {
        const occupier = occ.get(`${r},${c}`);
        if (occupier && occupier !== a.id) {
          blocked = true;
          break;
        }
        r += d.dr;
        c += d.dc;
      }

      if (!blocked) return a;
    }

    return null;
  }
}

export class ArrowMazeEscapeGame {
  constructor(container, onGameOver, levelConfig = null) {
    this.container = container;
    this.onGameOver = onGameOver;
    this.levelConfig = levelConfig || { level: 1, title: 'Arrow Escape Lvl 1' };

    // Persistent storage for level progress
    this.storageKey = 'gamingzone_arrow_maze_v2';
    this.progress = this.loadProgress();

    this.currentLevel = Math.max(1, this.levelConfig.level || this.progress.unlockedLevel || 1);
    this.themeIndex = this.progress.themeIndex || 0;
    this.mistakes = 0;
    this.score = 0;
    this.levelScore = 0;
    this.startTime = Date.now();

    // Game State
    this.arrows = []; // Active on-board arrows
    this.escapingArrows = []; // Currently animating off-screen
    this.blockedArrow = null; // Currently nudging/shaking arrow
    this.blockerArrow = null; // Arrow that blocked the move
    this.hintArrow = null; // Arrow being highlighted by hint
    this.particles = []; // Celebratory / exit particles

    // Layout & DPR Scaling
    this.boardWidth = 540;
    this.boardHeight = 520;
    this.cellSize = 64;
    this.gridOriginX = 0;
    this.gridOriginY = 0;

    this.running = true;
    this.isVictory = false;

    this.initDOM();
    this.setupCanvas();
    this.loadLevel(this.currentLevel);
    this.bindEvents();

    // Start 60 FPS Render & Animation Loop
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  loadProgress() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return {
      unlockedLevel: 1,
      levelStars: {},
      themeIndex: 0,
      totalEscaped: 0
    };
  }

  saveProgress() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.progress));
    } catch (_) {}
  }

  initDOM() {
    this.container.innerHTML = '';

    this.wrapper = document.createElement('div');
    this.wrapper.className = 'arrow-maze-game-root';
    this.wrapper.style.cssText = `
      width: 100%;
      max-width: 660px;
      margin: 0 auto;
      border-radius: 24px;
      padding: 18px 20px 24px;
      font-family: 'Outfit', sans-serif;
      position: relative;
      box-sizing: border-box;
      user-select: none;
      -webkit-user-select: none;
      transition: background 0.3s ease, color 0.3s ease;
    `;
    this.container.appendChild(this.wrapper);

    this.applyThemeStyles();

    // Top Header & HUD
    this.wrapper.innerHTML = `
      <!-- Top HUD Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <button id="btn-arrow-back" class="ame-btn-icon" title="Return to Portal" style="font-size: 1.25rem;">←</button>
          <div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <h2 id="ame-lvl-title" style="font-size: 1.35rem; font-weight: 800; margin: 0; line-height: 1.2;">Level 1</h2>
              <span id="ame-lvl-stars" style="font-size: 0.95rem; letter-spacing: 2px;">⭐⭐⭐</span>
            </div>
            <span id="ame-lvl-diff" style="font-size: 0.76rem; font-weight: 700; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.5px;">Tutorial Warmup</span>
          </div>
        </div>

        <!-- Right Action Icons -->
        <div style="display: flex; align-items: center; gap: 6px;">
          <button id="btn-arrow-levels" class="ame-btn" title="Level Map" style="padding: 6px 10px; font-size: 0.82rem; font-weight: 700;">
            🗺️ <span class="hide-mobile">Levels</span>
          </button>
          <button id="btn-arrow-hint" class="ame-btn" title="Get Hint" style="padding: 6px 10px; font-size: 0.82rem; font-weight: 700;">
            💡 <span class="hide-mobile">Hint</span>
          </button>
          <button id="btn-arrow-restart" class="ame-btn-icon" title="Restart Level (R)">🔄</button>
          <button id="btn-arrow-theme" class="ame-btn-icon" title="Switch Theme (T)">🎨</button>
        </div>
      </div>

      <!-- Secondary Info Bar (Remaining, Mistakes, Tutorial) -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 0.88rem; font-weight: 700; padding: 0 4px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="display: inline-flex; align-items: center; gap: 5px; background: rgba(0,0,0,0.06); padding: 4px 10px; border-radius: 999px;">
            <span>🏹</span> <span id="ame-count-left" style="font-weight: 800; color: var(--ame-accent);">0</span> remaining
          </span>
          <span id="ame-mistakes-pill" style="display: inline-flex; align-items: center; gap: 4px; opacity: 0.7; font-size: 0.82rem;">
            <span>💥</span> <span id="ame-mistakes-text">0 blocks</span>
          </span>
        </div>
        <div id="ame-quick-objective" style="font-size: 0.82rem; opacity: 0.75; text-align: right;">
          Tap arrows with clear exits
        </div>
      </div>

      <!-- Tutorial Banner (Contextual) -->
      <div id="ame-tutorial-banner" style="display: none; background: rgba(0, 229, 255, 0.12); border: 1px solid rgba(0, 229, 255, 0.35); border-radius: 12px; padding: 8px 14px; margin-bottom: 12px; font-size: 0.84rem; font-weight: 600; text-align: center; color: var(--ame-text);">
        <!-- Injected dynamically -->
      </div>

      <!-- Canvas Stage -->
      <div id="ame-canvas-mount" style="display: flex; justify-content: center; align-items: center; position: relative; width: 100%; border-radius: 20px; overflow: hidden;">
        <canvas id="arrow-maze-canvas" style="display: block; width: 100%; max-width: 540px; touch-action: none; cursor: pointer;"></canvas>
      </div>

      <!-- Level Complete Victory Modal Overlay (In-Engine) -->
      <div id="ame-victory-modal" style="display: none; position: absolute; inset: 0; background: rgba(10, 15, 29, 0.85); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border-radius: 24px; z-index: 100; flex-direction: column; align-items: center; justify-content: center; padding: 24px; text-align: center; color: #ffffff;">
        <div style="font-size: 3.5rem; margin-bottom: 4px; animation: bounce 0.6s ease;">🎉</div>
        <h2 id="ame-vic-title" style="font-size: 2rem; font-weight: 900; margin: 0 0 6px; color: #ffd166;">LEVEL COMPLETE!</h2>
        <div id="ame-vic-stars" style="font-size: 2.2rem; margin-bottom: 14px; letter-spacing: 4px;">⭐⭐⭐</div>
        
        <div style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 16px; padding: 14px 20px; width: 100%; max-width: 340px; margin-bottom: 20px; display: flex; justify-content: space-around;">
          <div>
            <div style="font-size: 0.75rem; opacity: 0.7;">FINAL SCORE</div>
            <div id="ame-vic-score" style="font-size: 1.4rem; font-weight: 800; color: #00e5ff;">+550</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; opacity: 0.7;">COINS EARNED</div>
            <div id="ame-vic-coins" style="font-size: 1.4rem; font-weight: 800; color: #ffd166;">+60 🪙</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; opacity: 0.7;">MISTAKES</div>
            <div id="ame-vic-mistakes" style="font-size: 1.4rem; font-weight: 800; color: #10b981;">0</div>
          </div>
        </div>

        <div style="display: flex; gap: 12px; width: 100%; max-width: 340px;">
          <button id="btn-ame-vic-next" style="flex: 2; background: #00e5ff; color: #0a0e17; font-weight: 800; border: none; padding: 12px 18px; border-radius: 12px; font-size: 1.05rem; cursor: pointer; box-shadow: 0 4px 16px rgba(0, 229, 255, 0.4);">
            NEXT LEVEL ➔
          </button>
          <button id="btn-ame-vic-replay" style="flex: 1; background: rgba(255, 255, 255, 0.12); color: #fff; font-weight: 700; border: 1px solid rgba(255, 255, 255, 0.2); padding: 12px 14px; border-radius: 12px; font-size: 0.95rem; cursor: pointer;">
            🔄 Replay
          </button>
        </div>
      </div>

      <!-- Level Select Drawer Modal -->
      <div id="ame-levels-modal" style="display: none; position: absolute; inset: 0; background: rgba(10, 15, 29, 0.92); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-radius: 24px; z-index: 100; flex-direction: column; padding: 20px; color: #ffffff;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div>
            <h3 style="margin: 0; font-size: 1.3rem; font-weight: 800;">SELECT LEVEL</h3>
            <span style="font-size: 0.8rem; opacity: 0.7;">60 Verified Solvable Levels</span>
          </div>
          <button id="btn-ame-close-levels" style="background: none; border: none; color: #fff; font-size: 1.6rem; cursor: pointer; padding: 4px 8px;">✕</button>
        </div>
        <div id="ame-levels-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(54px, 1fr)); gap: 10px; overflow-y: auto; padding-right: 4px; max-height: 440px;">
          <!-- Dynamically populated -->
        </div>
      </div>
    `;

    this.canvas = this.wrapper.querySelector('#arrow-maze-canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  applyThemeStyles() {
    const th = THEMES[this.themeIndex];
    this.wrapper.style.background = th.bg;
    this.wrapper.style.color = th.text;
    this.wrapper.style.boxShadow = th.boardShadow;
    this.wrapper.style.setProperty('--ame-accent', th.accent);
    this.wrapper.style.setProperty('--ame-text', th.text);

    // Apply inline icon and button aesthetics
    const styleEl = document.getElementById('ame-dynamic-styles') || document.createElement('style');
    styleEl.id = 'ame-dynamic-styles';
    styleEl.textContent = `
      .ame-btn, .ame-btn-icon {
        background: ${th.card};
        color: ${th.text};
        border: 1px solid ${th.gridBorder};
        border-radius: 10px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.15s ease, background 0.15s ease;
      }
      .ame-btn:hover, .ame-btn-icon:hover {
        transform: translateY(-1px);
        background: ${th.wall};
      }
      .ame-btn-icon {
        width: 36px;
        height: 36px;
        padding: 0;
      }
      @media (max-width: 520px) {
        .hide-mobile { display: none !important; }
      }
    `;
    const targetHead = document.head || document.getElementsByTagName?.('head')?.[0] || document.body;
    if (targetHead && !document.getElementById('ame-dynamic-styles')) {
      targetHead.appendChild(styleEl);
    }
  }

  setupCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.boardWidth = 540;
    this.boardHeight = 520;

    this.canvas.width = this.boardWidth * dpr;
    this.canvas.height = this.boardHeight * dpr;
    this.ctx.scale(dpr, dpr);
  }

  bindEvents() {
    this.wrapper.querySelector('#btn-arrow-back')?.addEventListener('click', () => {
      sounds.playClick();
      if (this.onGameOver) this.onGameOver(this.score, { isGameOver: true });
    });

    this.wrapper.querySelector('#btn-arrow-restart')?.addEventListener('click', () => {
      sounds.playClick();
      this.loadLevel(this.currentLevel);
    });

    this.wrapper.querySelector('#btn-arrow-theme')?.addEventListener('click', () => {
      sounds.playClick();
      this.themeIndex = (this.themeIndex + 1) % THEMES.length;
      this.progress.themeIndex = this.themeIndex;
      this.saveProgress();
      this.applyThemeStyles();
    });

    this.wrapper.querySelector('#btn-arrow-hint')?.addEventListener('click', () => {
      this.triggerHint();
    });

    this.wrapper.querySelector('#btn-arrow-levels')?.addEventListener('click', () => {
      sounds.playClick();
      this.openLevelSelect();
    });

    this.wrapper.querySelector('#btn-ame-close-levels')?.addEventListener('click', () => {
      sounds.playClick();
      this.closeLevelSelect();
    });

    this.wrapper.querySelector('#btn-ame-vic-next')?.addEventListener('click', () => {
      sounds.playClick();
      this.closeVictoryModal();
      this.loadLevel(this.currentLevel + 1);
    });

    this.wrapper.querySelector('#btn-ame-vic-replay')?.addEventListener('click', () => {
      sounds.playClick();
      this.closeVictoryModal();
      this.loadLevel(this.currentLevel);
    });

    // Pointer events on canvas
    const handlePointerDown = (e) => {
      if (this.isVictory) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.boardWidth / rect.width;
      const scaleY = this.boardHeight / rect.height;

      const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;

      this.handleBoardClick(x, y);
    };

    this.canvas.addEventListener('mousedown', handlePointerDown);
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handlePointerDown(e);
    }, { passive: false });

    // Keyboard Shortcuts
    this.keyHandler = (e) => {
      if (e.key === 'r' || e.key === 'R') this.loadLevel(this.currentLevel);
      if (e.key === 'h' || e.key === 'H') this.triggerHint();
      if (e.key === 't' || e.key === 'T') {
        this.themeIndex = (this.themeIndex + 1) % THEMES.length;
        this.progress.themeIndex = this.themeIndex;
        this.saveProgress();
        this.applyThemeStyles();
      }
      if (e.key === 'Escape') {
        this.closeLevelSelect();
        this.closeVictoryModal();
      }
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  loadLevel(lvlNum) {
    this.currentLevel = Math.max(1, lvlNum);
    this.mistakes = 0;
    this.isVictory = false;
    this.escapingArrows = [];
    this.blockedArrow = null;
    this.blockerArrow = null;
    this.hintArrow = null;
    this.particles = [];
    this.startTime = Date.now();

    // Retrieve level from verified 60 levels or procedural Level Engine adapter for 61+
    let lvlData = ARROW_MAZE_LEVELS[this.currentLevel - 1];
    if (!lvlData) {
      // Procedural generation through shared Level Engine adapter (guarantees uniqueness & non-repetition)
      const generated = arrowMazeAdapter.generateLevel(this.currentLevel, 2002);
      lvlData = {
        level: this.currentLevel,
        grid: { rows: generated.gridSize, cols: generated.gridSize },
        arrows: generated.elements.map((e, idx) => ({
          id: `arr_gen_${this.currentLevel}_${idx}`,
          cells: [{ r: e.y, c: e.x }],
          headDir: e.val ? e.val.replace(/_.*/, '') : 'UP',
          color: '#00e5ff'
        }))
      };
    }

    this.gridRows = lvlData.grid.rows;
    this.gridCols = lvlData.grid.cols;

    // Calculate optimal cell size and grid offset
    const maxGridWidth = this.boardWidth - 80;
    const maxGridHeight = this.boardHeight - 80;
    this.cellSize = Math.floor(Math.min(maxGridWidth / this.gridCols, maxGridHeight / this.gridRows, 72));

    const totalGridW = this.gridCols * this.cellSize;
    const totalGridH = this.gridRows * this.cellSize;
    this.gridOriginX = Math.round((this.boardWidth - totalGridW) / 2);
    this.gridOriginY = Math.round((this.boardHeight - totalGridH) / 2);

    // Deep clone arrow objects
    this.arrows = lvlData.arrows.map(a => ({
      id: a.id,
      cells: a.cells.map(c => ({ r: c.r, c: c.c })),
      headDir: a.headDir,
      color: a.color || '#00e5ff',
      isEscaping: false,
      nudgeOffset: 0
    }));

    // Update HUD
    const titleEl = this.wrapper.querySelector('#ame-lvl-title');
    const diffEl = this.wrapper.querySelector('#ame-lvl-diff');
    const countEl = this.wrapper.querySelector('#ame-count-left');
    const starsEl = this.wrapper.querySelector('#ame-lvl-stars');
    const mistakesText = this.wrapper.querySelector('#ame-mistakes-text');
    const tutBanner = this.wrapper.querySelector('#ame-tutorial-banner');

    if (titleEl) titleEl.textContent = `Level ${this.currentLevel}`;
    if (diffEl) diffEl.textContent = lvlData.difficulty || 'Puzzle';
    if (countEl) countEl.textContent = this.arrows.length;
    if (mistakesText) mistakesText.textContent = '0 blocks';

    const savedStars = this.progress.levelStars[this.currentLevel] || 0;
    if (starsEl) starsEl.textContent = savedStars > 0 ? '⭐'.repeat(savedStars) : '☆☆☆';

    if (tutBanner) {
      if (lvlData.tutorial) {
        tutBanner.textContent = `💡 ${lvlData.tutorial}`;
        tutBanner.style.display = 'block';
      } else {
        tutBanner.style.display = 'none';
      }
    }
  }

  handleBoardClick(clickX, clickY) {
    if (this.arrows.length === 0) return;

    // Find which arrow was clicked
    let clickedArrow = null;
    let minDistance = this.cellSize * 0.55;

    for (let i = this.arrows.length - 1; i >= 0; i--) {
      const arr = this.arrows[i];
      if (arr.isEscaping) continue;

      // Check distance to all its segments
      const poly = this.getArrowScreenPolyline(arr);
      for (let s = 0; s < poly.length - 1; s++) {
        const dist = this.distToSegment({ x: clickX, y: clickY }, poly[s], poly[s + 1]);
        if (dist < minDistance) {
          minDistance = dist;
          clickedArrow = arr;
        }
      }

      // Also check distance to head explicitly
      const headPt = poly[poly.length - 1];
      const headDist = Math.hypot(clickX - headPt.x, clickY - headPt.y);
      if (headDist < minDistance) {
        minDistance = headDist;
        clickedArrow = arr;
      }
    }

    if (!clickedArrow) return;

    this.attemptArrowEscape(clickedArrow);
  }

  attemptArrowEscape(arrow) {
    if (arrow.isEscaping) return;

    // Determine exit trajectory & check for blockers
    const head = arrow.cells[arrow.cells.length - 1];
    const d = DIRS[arrow.headDir];

    let r = head.r + d.dr;
    let c = head.c + d.dc;
    let blocker = null;

    // Check cells along exit ray to grid edge
    while (r >= 0 && r < this.gridRows && c >= 0 && c < this.gridCols) {
      for (const other of this.arrows) {
        if (other.id === arrow.id || other.isEscaping) continue;
        for (const cell of other.cells) {
          if (cell.r === r && cell.c === c) {
            blocker = other;
            break;
          }
        }
        if (blocker) break;
      }
      if (blocker) break;
      r += d.dr;
      c += d.dc;
    }

    if (!blocker) {
      // CLEAR TO ESCAPE!
      this.executeArrowEscape(arrow);
    } else {
      // BLOCKED MOVE!
      this.executeBlockedMove(arrow, blocker);
    }
  }

  executeArrowEscape(arrow) {
    sounds.playPowerup();

    arrow.isEscaping = true;
    this.hintArrow = null;

    // Build the complete motion track: from tail -> body -> head -> exit outside board
    const poly = this.getArrowScreenPolyline(arrow);
    const head = poly[poly.length - 1];
    const d = DIRS[arrow.headDir];

    // Calculate exit point well outside canvas bounds
    const exitPt = {
      x: head.x + d.dc * (this.boardWidth + 100),
      y: head.y + d.dr * (this.boardHeight + 100)
    };

    const fullTrack = [...poly, exitPt];

    // Compute cumulative track lengths
    const cumLens = [0];
    for (let i = 0; i < fullTrack.length - 1; i++) {
      const segLen = Math.hypot(fullTrack[i + 1].x - fullTrack[i].x, fullTrack[i + 1].y - fullTrack[i].y);
      cumLens.push(cumLens[i] + segLen);
    }
    const arrowRestLen = cumLens[poly.length - 1];

    this.escapingArrows.push({
      arrow,
      track: fullTrack,
      cumLens,
      arrowLen: arrowRestLen,
      currentDist: 0,
      speed: Math.max(16, this.cellSize * 0.38)
    });

    // Remove arrow from active board state so newly freed space is instantly available!
    const idx = this.arrows.findIndex(a => a.id === arrow.id);
    if (idx !== -1) {
      this.arrows.splice(idx, 1);
    }

    // Update remaining count HUD
    const countEl = this.wrapper.querySelector('#ame-count-left');
    if (countEl) countEl.textContent = this.arrows.length;

    // Small particle burst at exit boundary
    this.spawnExitParticles(head, d, arrow.color);
  }

  executeBlockedMove(arrow, blocker) {
    sounds.playHit();
    this.mistakes++;

    const mistakesText = this.wrapper.querySelector('#ame-mistakes-text');
    if (mistakesText) mistakesText.textContent = `${this.mistakes} blocks`;

    // Nudge animation
    this.blockedArrow = {
      arrow,
      startTime: Date.now(),
      duration: 220,
      maxOffset: this.cellSize * 0.22,
      dir: DIRS[arrow.headDir]
    };

    // Blocker flash warning
    this.blockerArrow = {
      arrow: blocker,
      expireTime: Date.now() + 380
    };
  }

  triggerHint() {
    sounds.playClick();

    const freeArrow = ArrowSolver.findFirstLegalMove(this.gridRows, this.gridCols, this.arrows);
    if (freeArrow) {
      this.hintArrow = {
        arrow: freeArrow,
        expireTime: Date.now() + 3200
      };
    }
  }

  spawnExitParticles(headPt, dir, color) {
    for (let i = 0; i < 8; i++) {
      const angle = dir.angle + (Math.random() - 0.5) * 1.2;
      const speed = Math.random() * 5 + 3;
      this.particles.push({
        x: headPt.x,
        y: headPt.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 3,
        color,
        alpha: 1,
        life: 0.85
      });
    }
  }

  spawnVictoryConfetti() {
    const cx = this.boardWidth / 2;
    const cy = this.boardHeight / 2;
    const colors = ['#00e5ff', '#ffd166', '#10b981', '#f43f5e', '#a855f7'];

    for (let i = 0; i < 45; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 4;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: Math.random() * 6 + 4,
        color: colors[i % colors.length],
        alpha: 1,
        life: 0.94
      });
    }
  }

  onLevelCompleted() {
    if (this.isVictory) return;
    this.isVictory = true;

    sounds.playLevelComplete();
    this.spawnVictoryConfetti();

    // Calculate Stars
    let stars = 3;
    if (this.mistakes >= 4) stars = 1;
    else if (this.mistakes >= 2) stars = 2;

    // Calculate Score & Coins
    const timeTakenSec = Math.max(1, Math.round((Date.now() - this.startTime) / 1000));
    const baseScore = 200 + this.currentLevel * 50;
    const speedBonus = Math.max(0, 150 - timeTakenSec * 5);
    const accuracyBonus = Math.max(0, 100 - this.mistakes * 25);
    const finalScore = baseScore + speedBonus + accuracyBonus;
    const coinsEarned = 50 + stars * 15;

    this.score += finalScore;

    // Update local progress
    if (stars > (this.progress.levelStars[this.currentLevel] || 0)) {
      this.progress.levelStars[this.currentLevel] = stars;
    }
    if (this.currentLevel >= this.progress.unlockedLevel) {
      this.progress.unlockedLevel = this.currentLevel + 1;
    }
    this.progress.totalEscaped = (this.progress.totalEscaped || 0) + 1;
    this.saveProgress();

    // Notify GAMINGZONE platform
    if (this.onGameOver) {
      this.onGameOver(finalScore, {
        stars,
        coinsEarned,
        isVictory: true,
        level: this.currentLevel
      });
    }

    // Show Victory Screen after brief delay
    setTimeout(() => {
      this.showVictoryModal(stars, finalScore, coinsEarned, this.mistakes);
    }, 450);
  }

  showVictoryModal(stars, score, coins, mistakes) {
    const modal = this.wrapper.querySelector('#ame-victory-modal');
    if (!modal) return;

    modal.querySelector('#ame-vic-title').textContent = `LEVEL ${this.currentLevel} COMPLETE!`;
    modal.querySelector('#ame-vic-stars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    modal.querySelector('#ame-vic-score').textContent = `+${score}`;
    modal.querySelector('#ame-vic-coins').textContent = `+${coins} 🪙`;
    modal.querySelector('#ame-vic-mistakes').textContent = `${mistakes}`;

    modal.style.display = 'flex';
  }

  closeVictoryModal() {
    const modal = this.wrapper.querySelector('#ame-victory-modal');
    if (modal) modal.style.display = 'none';
  }

  openLevelSelect() {
    const modal = this.wrapper.querySelector('#ame-levels-modal');
    const grid = this.wrapper.querySelector('#ame-levels-grid');
    if (!modal || !grid) return;

    grid.innerHTML = '';
    const unlocked = this.progress.unlockedLevel || 1;

    for (let i = 1; i <= ARROW_MAZE_LEVELS.length; i++) {
      const btn = document.createElement('button');
      const isUnlocked = i <= unlocked;
      const stars = this.progress.levelStars[i] || 0;
      const isCurrent = i === this.currentLevel;

      btn.style.cssText = `
        aspect-ratio: 1;
        border-radius: 12px;
        background: ${isCurrent ? '#00e5ff' : (isUnlocked ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)')};
        color: ${isCurrent ? '#0a0e17' : (isUnlocked ? '#fff' : '#64748b')};
        border: 1px solid ${isCurrent ? '#00e5ff' : (isUnlocked ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)')};
        font-weight: 800;
        font-size: 0.95rem;
        cursor: ${isUnlocked ? 'pointer' : 'not-allowed'};
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        transition: transform 0.15s ease;
      `;

      if (isUnlocked) {
        btn.innerHTML = `<span>${i}</span><span style="font-size: 0.65rem; color: #ffd166;">${stars > 0 ? '⭐'.repeat(stars) : ''}</span>`;
        btn.addEventListener('click', () => {
          sounds.playClick();
          this.closeLevelSelect();
          this.loadLevel(i);
        });
      } else {
        btn.innerHTML = `<span style="font-size: 0.9rem;">🔒</span>`;
      }

      grid.appendChild(btn);
    }

    modal.style.display = 'flex';
  }

  closeLevelSelect() {
    const modal = this.wrapper.querySelector('#ame-levels-modal');
    if (modal) modal.style.display = 'none';
  }

  // --- Polyline & Geometric Projection Math ---
  cellToScreen(r, c) {
    return {
      x: this.gridOriginX + c * this.cellSize + this.cellSize / 2,
      y: this.gridOriginY + r * this.cellSize + this.cellSize / 2
    };
  }

  getArrowScreenPolyline(arrow) {
    return arrow.cells.map(c => this.cellToScreen(c.r, c.c));
  }

  distToSegment(p, v, w) {
    const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
  }

  // --- Main Animation & Render Loop ---
  loop() {
    if (!this.running) return;

    this.update();
    this.render();

    requestAnimationFrame(this.loop);
  }

  update() {
    // 1. Update Escaping Arrows Animation
    for (let i = this.escapingArrows.length - 1; i >= 0; i--) {
      const anim = this.escapingArrows[i];
      anim.currentDist += anim.speed;

      const totalTrackLen = anim.cumLens[anim.cumLens.length - 1];
      // Tail has completely exited board
      if (anim.currentDist >= totalTrackLen) {
        this.escapingArrows.splice(i, 1);

        // Check Victory when last arrow leaves
        if (this.arrows.length === 0 && this.escapingArrows.length === 0) {
          this.onLevelCompleted();
        }
      }
    }

    // 2. Update Nudge/Blocked Animation
    if (this.blockedArrow) {
      const elapsed = Date.now() - this.blockedArrow.startTime;
      if (elapsed >= this.blockedArrow.duration) {
        this.blockedArrow.arrow.nudgeOffset = 0;
        this.blockedArrow = null;
      } else {
        const t = elapsed / this.blockedArrow.duration;
        // Elastic sine bump: 0 -> maxOffset -> 0
        this.blockedArrow.arrow.nudgeOffset = Math.sin(t * Math.PI) * this.blockedArrow.maxOffset;
      }
    }

    // 3. Update Blocker Warning Expiry
    if (this.blockerArrow && Date.now() > this.blockerArrow.expireTime) {
      this.blockerArrow = null;
    }

    // 4. Update Hint Expiry
    if (this.hintArrow && Date.now() > this.hintArrow.expireTime) {
      this.hintArrow = null;
    }

    // 5. Update Particles
    for (let p = this.particles.length - 1; p >= 0; p--) {
      const pt = this.particles[p];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vx *= pt.life;
      pt.vy *= pt.life;
      pt.alpha -= 0.025;
      if (pt.alpha <= 0) {
        this.particles.splice(p, 1);
      }
    }
  }

  render() {
    const th = THEMES[this.themeIndex];
    this.ctx.clearRect(0, 0, this.boardWidth, this.boardHeight);

    // Draw Grid Board Background
    this.drawGridBackground(th);

    // Draw Static & Blocked Arrows
    for (const arr of this.arrows) {
      this.drawArrow(arr, th);
    }

    // Draw Escaping Arrows (Snaking along track)
    for (const anim of this.escapingArrows) {
      this.drawEscapingArrow(anim, th);
    }

    // Draw Hint Overlay
    if (this.hintArrow) {
      this.drawHintOverlay(this.hintArrow.arrow, th);
    }

    // Draw Particles
    this.drawParticles();
  }

  drawGridBackground(theme) {
    const totalW = this.gridCols * this.cellSize;
    const totalH = this.gridRows * this.cellSize;

    // Outer board card
    this.ctx.save();
    this.ctx.fillStyle = theme.card;
    this.ctx.strokeStyle = theme.gridBorder;
    this.ctx.lineWidth = 2;

    this.roundRect(
      this.ctx,
      this.gridOriginX - 10,
      this.gridOriginY - 10,
      totalW + 20,
      totalH + 20,
      18
    );
    this.ctx.fill();
    this.ctx.stroke();

    // Subtle individual grid cells
    this.ctx.fillStyle = theme.gridCell;
    this.ctx.strokeStyle = theme.gridBorder;
    this.ctx.lineWidth = 1;

    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        const cellX = this.gridOriginX + c * this.cellSize;
        const cellY = this.gridOriginY + r * this.cellSize;

        this.roundRect(this.ctx, cellX + 3, cellY + 3, this.cellSize - 6, this.cellSize - 6, 8);
        this.ctx.fill();
        this.ctx.stroke();
      }
    }

    this.ctx.restore();
  }

  drawArrow(arrow, theme) {
    const poly = this.getArrowScreenPolyline(arrow);
    if (poly.length === 0) return;

    this.ctx.save();

    // Nudge offset if currently blocked
    let ox = 0;
    let oy = 0;
    if (arrow.nudgeOffset) {
      const d = DIRS[arrow.headDir];
      ox = d.dc * arrow.nudgeOffset;
      oy = d.dr * arrow.nudgeOffset;
    }
    this.ctx.translate(ox, oy);

    const isBlocker = this.blockerArrow && this.blockerArrow.arrow.id === arrow.id;
    const strokeColor = isBlocker ? theme.blockerGlow : arrow.color;
    const lineWidth = Math.max(8, this.cellSize * 0.26);

    // Blocker pulsing aura
    if (isBlocker) {
      this.ctx.shadowColor = theme.blockerGlow;
      this.ctx.shadowBlur = 18;
    } else {
      this.ctx.shadowColor = theme.arrowShadow;
      this.ctx.shadowBlur = 8;
      this.ctx.shadowOffsetY = 3;
    }

    // 1. Draw Body Polyline
    this.ctx.beginPath();
    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i++) {
      this.ctx.lineTo(poly[i].x, poly[i].y);
    }
    this.ctx.stroke();

    // 2. Draw Arrowhead
    const headPt = poly[poly.length - 1];
    const angle = DIRS[arrow.headDir].angle;
    this.drawArrowHead(headPt.x, headPt.y, angle, lineWidth * 1.55, strokeColor);

    // 3. Draw Tail Accent Dot
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(poly[0].x, poly[0].y, lineWidth * 0.28, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  drawEscapingArrow(anim, theme) {
    const sStart = anim.currentDist;
    const sEnd = anim.currentDist + anim.arrowLen;

    const sub = this.getSubPolyline(anim.track, anim.cumLens, sStart, sEnd);
    if (!sub || sub.points.length < 2) return;

    this.ctx.save();
    const lineWidth = Math.max(8, this.cellSize * 0.26);

    this.ctx.shadowColor = anim.arrow.color;
    this.ctx.shadowBlur = 14;

    // Draw moving body
    this.ctx.beginPath();
    this.ctx.strokeStyle = anim.arrow.color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.moveTo(sub.points[0].x, sub.points[0].y);
    for (let i = 1; i < sub.points.length; i++) {
      this.ctx.lineTo(sub.points[i].x, sub.points[i].y);
    }
    this.ctx.stroke();

    // Draw moving head
    const headPt = sub.points[sub.points.length - 1];
    this.drawArrowHead(headPt.x, headPt.y, sub.headAngle, lineWidth * 1.55, anim.arrow.color);

    this.ctx.restore();
  }

  drawArrowHead(x, y, angle, size, color) {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(angle);

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(size * 0.55, 0);
    this.ctx.lineTo(-size * 0.5, -size * 0.52);
    this.ctx.lineTo(-size * 0.2, 0);
    this.ctx.lineTo(-size * 0.5, size * 0.52);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.restore();
  }

  drawHintOverlay(arrow, theme) {
    const poly = this.getArrowScreenPolyline(arrow);
    const head = poly[poly.length - 1];
    const d = DIRS[arrow.headDir];

    this.ctx.save();
    this.ctx.strokeStyle = theme.hintGlow;
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([6, 6]);
    this.ctx.shadowColor = theme.hintGlow;
    this.ctx.shadowBlur = 12;

    // Dashed exit ray
    this.ctx.beginPath();
    this.ctx.moveTo(head.x, head.y);
    this.ctx.lineTo(head.x + d.dc * (this.boardWidth * 0.7), head.y + d.dr * (this.boardHeight * 0.7));
    this.ctx.stroke();

    this.ctx.restore();
  }

  drawParticles() {
    for (const pt of this.particles) {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, pt.alpha);
      this.ctx.fillStyle = pt.color;
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  getSubPolyline(track, cumLens, sStart, sEnd) {
    const totalLen = cumLens[cumLens.length - 1];
    if (sStart >= totalLen) return null;

    const clampedStart = Math.max(0, sStart);
    const clampedEnd = Math.min(totalLen, sEnd);
    if (clampedStart >= clampedEnd) return null;

    function getPointAt(s) {
      if (s <= 0) {
        return {
          pt: track[0],
          angle: Math.atan2(track[1].y - track[0].y, track[1].x - track[0].x)
        };
      }
      if (s >= totalLen) {
        const n = track.length;
        return {
          pt: track[n - 1],
          angle: Math.atan2(track[n - 1].y - track[n - 2].y, track[n - 1].x - track[n - 2].x)
        };
      }
      for (let i = 0; i < cumLens.length - 1; i++) {
        if (s >= cumLens[i] && s <= cumLens[i + 1]) {
          const segLen = cumLens[i + 1] - cumLens[i];
          const t = segLen > 0 ? (s - cumLens[i]) / segLen : 0;
          return {
            pt: {
              x: track[i].x + t * (track[i + 1].x - track[i].x),
              y: track[i].y + t * (track[i + 1].y - track[i].y)
            },
            angle: Math.atan2(track[i + 1].y - track[i].y, track[i + 1].x - track[i].x)
          };
        }
      }
      return { pt: track[track.length - 1], angle: 0 };
    }

    const pts = [];
    const startInfo = getPointAt(clampedStart);
    pts.push(startInfo.pt);

    for (let i = 0; i < cumLens.length; i++) {
      if (cumLens[i] > clampedStart && cumLens[i] < clampedEnd) {
        pts.push(track[i]);
      }
    }

    const endInfo = getPointAt(clampedEnd);
    pts.push(endInfo.pt);

    return { points: pts, headAngle: endInfo.angle };
  }

  roundRect(ctx, x, y, width, height, radius = 8) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  destroy() {
    this.running = false;
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
    }
    if (this.wrapper && this.wrapper.parentNode) {
      this.wrapper.parentNode.removeChild(this.wrapper);
    }
  }
}
