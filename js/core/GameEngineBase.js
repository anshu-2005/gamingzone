/* ====================================================
   GAMINGZONE UNIFIED GAME ENGINE BASE & LIFECYCLE
   Standardized State Machine, Loop Cleanup, Listener
   Tracking, Responsive Canvas, Touch D-Pad & HUD Overlays
   ==================================================== */

import { sounds } from './soundFX.js';

export const GameState = {
  IDLE: 'IDLE',
  LOADING: 'LOADING',
  READY: 'READY',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  GAME_OVER: 'GAME_OVER',
  ERROR: 'ERROR'
};

export class GameEngineBase {
  constructor(container, onGameOver, config = {}) {
    this.container = container;
    this.onGameOverCallback = onGameOver;
    this.config = Object.assign({
      level: 1,
      title: 'Game',
      targetScore: 1000,
      timeLimit: 0,
      lives: 3
    }, config);

    this.state = GameState.IDLE;
    this.score = 0;
    this.highScore = 0;
    this.level = this.config.level || 1;
    this.lives = this.config.lives || 3;
    this.timeLeft = this.config.timeLimit || 0;

    // Tracked resources for leak-free cleanup
    this.animId = null;
    this.timers = [];
    this.intervals = [];
    this.trackedListeners = [];
    this.isDestroyed = false;

    // Canvas & Context setup
    this.canvas = null;
    this.ctx = null;
    this.baseWidth = 800;
    this.baseHeight = 540;
    this.width = 800;
    this.height = 540;
    this.virtualControlsContainer = null;
  }

  // Setup responsive high-DPI canvas
  createCanvas(width = 800, height = 540) {
    this.canvas = document.createElement('canvas');
    this.baseWidth = width;
    this.baseHeight = height;
    this.width = width;
    this.height = height;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = '100%';
    this.canvas.style.maxWidth = `${width}px`;
    this.canvas.style.height = 'auto';
    this.canvas.style.display = 'block';
    this.canvas.style.margin = '0 auto';
    this.canvas.style.borderRadius = '14px';
    this.canvas.style.touchAction = 'none';

    this.ctx = this.canvas.getContext('2d');
    this.ctx.scale(dpr, dpr);

    this.container.appendChild(this.canvas);
    return this.canvas;
  }

  // Tracked Event Listener that guarantees automatic removal on destroy
  addListener(target, event, handler, options = false) {
    if (!target) return;
    target.addEventListener(event, handler, options);
    this.trackedListeners.push({ target, event, handler, options });
  }

  addEventListenerTracked(target, event, handler, options = false) {
    return this.addListener(target, event, handler, options);
  }

  // Tracked Timers
  setTimeout(fn, ms) {
    const id = window.setTimeout(() => {
      if (!this.isDestroyed) fn();
    }, ms);
    this.timers.push(id);
    return id;
  }

  setInterval(fn, ms) {
    const id = window.setInterval(() => {
      if (!this.isDestroyed && this.state === GameState.PLAYING) fn();
    }, ms);
    this.intervals.push(id);
    return id;
  }

  addInterval(fn, ms) {
    return this.setInterval(fn, ms);
  }

  // Virtual On-Screen Mobile Touch Controls (D-pad & Buttons)
  attachTouchControls({ onDirection, onAction, actionLabel = 'ACTION', showDpad = true }) {
    // Only mount if on touch device or small screen
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 900);
    if (!isTouch || this.virtualControlsContainer) return;

    const overlay = document.createElement('div');
    overlay.className = 'gz-touch-controls-overlay';
    overlay.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      max-width: ${this.baseWidth || 800}px;
      margin: 10px auto 0;
      padding: 8px 12px;
      box-sizing: border-box;
      user-select: none;
      -webkit-user-select: none;
      touch-action: none;
    `;

    if (showDpad) {
      const dpad = document.createElement('div');
      dpad.style.cssText = `
        display: grid;
        grid-template-columns: repeat(3, 44px);
        grid-template-rows: repeat(3, 44px);
        gap: 4px;
      `;
      dpad.innerHTML = `
        <div></div>
        <button data-dir="UP" class="gz-touch-btn" style="grid-column: 2; grid-row: 1;">▲</button>
        <div></div>
        <button data-dir="LEFT" class="gz-touch-btn" style="grid-column: 1; grid-row: 2;">◀</button>
        <div></div>
        <button data-dir="RIGHT" class="gz-touch-btn" style="grid-column: 3; grid-row: 2;">▶</button>
        <div></div>
        <button data-dir="DOWN" class="gz-touch-btn" style="grid-column: 2; grid-row: 3;">▼</button>
        <div></div>
      `;

      const bindDir = (btn, dir) => {
        let active = false;
        const trigger = (pressed) => {
          active = pressed;
          btn.style.background = pressed ? 'rgba(0, 229, 255, 0.45)' : 'rgba(255, 255, 255, 0.12)';
          if (typeof onDirection === 'function') onDirection(dir, pressed);
        };
        btn.addEventListener('pointerdown', (e) => { e.preventDefault(); trigger(true); });
        btn.addEventListener('pointerup', (e) => { e.preventDefault(); trigger(false); });
        btn.addEventListener('pointercancel', (e) => { e.preventDefault(); trigger(false); });
      };

      dpad.querySelectorAll('.gz-touch-btn').forEach(btn => {
        btn.style.cssText += `
          width: 44px; height: 44px; border-radius: 10px;
          background: rgba(255, 255, 255, 0.12); color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.2); font-size: 1.1rem;
          display: flex; align-items: center; justify-content: center;
          touch-action: none; cursor: pointer;
        `;
        const dir = btn.getAttribute('data-dir');
        bindDir(btn, dir);
      });

      overlay.appendChild(dpad);
    }

    if (onAction) {
      const actionBtn = document.createElement('button');
      actionBtn.textContent = actionLabel;
      actionBtn.style.cssText = `
        height: 60px; min-width: 80px; padding: 0 16px; border-radius: 30px;
        background: linear-gradient(135deg, #00e5ff, #0284c7); color: #0a0e17;
        font-weight: 800; font-size: 1rem; border: none; box-shadow: 0 4px 14px rgba(0, 229, 255, 0.4);
        touch-action: none; cursor: pointer;
      `;
      actionBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        actionBtn.style.transform = 'scale(0.94)';
        onAction(true);
      });
      const releaseAction = (e) => {
        e.preventDefault();
        actionBtn.style.transform = 'scale(1)';
        onAction(false);
      };
      actionBtn.addEventListener('pointerup', releaseAction);
      actionBtn.addEventListener('pointercancel', releaseAction);

      overlay.appendChild(actionBtn);
    }

    this.container.appendChild(overlay);
    this.virtualControlsContainer = overlay;
  }

  // In-Game Start Overlay (Instructions, Objectives, Big Play Button)
  showStartCard({ title, icon = '🎮', objective = '', controls = '', onStart }) {
    const card = document.createElement('div');
    card.className = 'gz-ingame-start-card';
    card.style.cssText = `
      position: absolute; inset: 0;
      background: rgba(10, 14, 23, 0.88);
      backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
      border-radius: 14px; z-index: 20;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 24px; text-align: center; color: #fff;
    `;

    card.innerHTML = `
      <div style="font-size: 3.5rem; margin-bottom: 8px; animation: bounce 0.6s ease;">${icon}</div>
      <h2 style="font-size: 2rem; font-weight: 900; margin: 0 0 6px; color: #00e5ff; letter-spacing: 0.5px;">${title || this.config.title}</h2>
      ${objective ? `<p style="color: #cbd5e1; max-width: 440px; font-size: 0.95rem; margin: 4px 0 14px; line-height: 1.4;">${objective}</p>` : ''}
      ${controls ? `
        <div style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 12px; padding: 10px 18px; margin-bottom: 20px; font-size: 0.86rem; color: #ffd166;">
          ${controls}
        </div>
      ` : ''}
      <button class="btn-start-play" style="
        background: linear-gradient(135deg, #00e5ff, #0284c7);
        color: #0a0e17; font-weight: 900; font-size: 1.15rem;
        border: none; padding: 12px 36px; border-radius: 14px;
        cursor: pointer; box-shadow: 0 6px 20px rgba(0, 229, 255, 0.4);
        transition: transform 0.15s ease;
      ">▶ START PLAYING</button>
    `;

    const btn = card.querySelector('.btn-start-play');
    btn.addEventListener('click', () => {
      sounds.playClick();
      if (card.parentNode) card.parentNode.removeChild(card);
      if (typeof onStart === 'function') onStart();
      else this.start();
    });

    const mount = this.canvas?.parentNode || this.container;
    if (getComputedStyle(mount).position === 'static') {
      mount.style.position = 'relative';
    }
    mount.appendChild(card);
  }

  // State transitions
  start() {
    if (this.state === GameState.PLAYING || this.isDestroyed) return;
    this.state = GameState.PLAYING;
    this.lastFrameTime = performance.now();
    this.startLoop();
  }

  pause() {
    if (this.state === GameState.PLAYING) {
      this.state = GameState.PAUSED;
      this.stopLoop();
    }
  }

  resume() {
    if (this.state === GameState.PAUSED) {
      this.state = GameState.PLAYING;
      this.lastFrameTime = performance.now();
      this.startLoop();
    }
  }

  restart() {
    this.score = 0;
    this.level = this.config.level || 1;
    this.lives = this.config.lives || 3;
    this.timeLeft = this.config.timeLimit || 0;
    this.state = GameState.PLAYING;
    this.isDestroyed = false;

    // Call game-specific reset or init hooks if defined by subclass
    if (typeof this.resetState === 'function') {
      this.resetState();
    } else if (typeof this.resetGame === 'function') {
      this.resetGame();
    } else if (typeof this.initGame === 'function') {
      this.initGame();
    } else if (typeof this.initArena === 'function') {
      this.initArena();
    } else if (typeof this.initBoard === 'function') {
      this.initBoard();
    } else if (typeof this.setupNewGame === 'function') {
      this.setupNewGame();
    } else if (typeof this.resetBall === 'function') {
      this.resetBall();
    } else if (typeof this.initLevel === 'function') {
      this.initLevel(this.level);
    }

    this.lastFrameTime = performance.now();
    this.startLoop();
  }

  startLoop() {
    this.stopLoop();
    const tick = (now) => {
      if (this.state !== GameState.PLAYING || this.isDestroyed) return;
      const dt = Math.min(0.1, (now - (this.lastFrameTime || now)) / 1000);
      this.lastFrameTime = now;

      try {
        this.update(dt);
        this.render(this.ctx);
      } catch (err) {
        console.error('GameEngine loop error:', err);
        this.finishGame(this.score, { error: err });
        return;
      }

      this.animId = requestAnimationFrame(tick);
    };
    this.animId = requestAnimationFrame(tick);
  }

  stopLoop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  update(dt) {}
  render(ctx) {}

  // Safe End-Game triggers
  finishGame(score, extraData = {}) {
    if (this.state === GameState.COMPLETED || this.state === GameState.GAME_OVER) return;
    
    this.score = score;
    const isVictory = extraData.isVictory !== undefined ? extraData.isVictory : (score >= (this.config.targetScore || 100));
    this.state = isVictory ? GameState.COMPLETED : GameState.GAME_OVER;
    this.stopLoop();

    if (isVictory) {
      sounds.playLevelUp();
    } else {
      sounds.playHit();
    }

    if (typeof this.onGameOverCallback === 'function') {
      this.onGameOverCallback(score, {
        isVictory,
        isGameOver: !isVictory,
        level: this.level,
        ...extraData
      });
    }
  }

  gameOver(score, extraData = {}) {
    return this.finishGame(score, { isVictory: false, ...extraData });
  }

  // Complete clean up of all resources
  destroy() {
    this.isDestroyed = true;
    this.state = GameState.IDLE;
    this.stopLoop();

    // Clear all timeouts & intervals
    this.timers.forEach(id => clearTimeout(id));
    this.timers = [];
    this.intervals.forEach(id => clearInterval(id));
    this.intervals = [];

    // Remove all tracked DOM event listeners
    this.trackedListeners.forEach(({ target, event, handler, options }) => {
      try {
        target.removeEventListener(event, handler, options);
      } catch (e) {
        // ignore
      }
    });
    this.trackedListeners = [];

    // Remove virtual touch controls
    if (this.virtualControlsContainer && this.virtualControlsContainer.parentNode) {
      this.virtualControlsContainer.parentNode.removeChild(this.virtualControlsContainer);
      this.virtualControlsContainer = null;
    }

    // Remove canvas from DOM
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
      this.canvas = null;
      this.ctx = null;
    }
  }
}
