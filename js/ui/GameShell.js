/* ====================================================
   GAMINGZONE GAMESHELL — THEATER MODE
   Unified, genre-aware game wrapper, keyboard shortcuts,
   game details, controls guide & related games shelf
   ==================================================== */

import { portalState } from '../core/portalState.js';
import { sounds } from '../core/soundFX.js';
import { icons } from '../utils/icons.js';
import { getGameThumbnailSVG } from '../utils/gameThumbnails.js';
import { GameCard } from './GameCard.js';

export class GameShell {
  constructor({
    game,
    container,
    onBackToGames,
    onReplay,
    onNextLevel,
    onOpenRelatedGame,
    onOpenLevelSelect
  }) {
    this.game = game;
    this.container = container;
    this.onBackToGames = onBackToGames;
    this.onReplay = onReplay;
    this.onNextLevel = onNextLevel;
    this.onOpenRelatedGame = onOpenRelatedGame;
    this.onOpenLevelSelect = onOpenLevelSelect;

    this.state = 'loading'; // loading, playing, paused, gameover, victory, error
    this.isMuted = sounds.muted;
    this.isFullscreen = false;
    this.isFavorited = portalState.isFavorite(game.id);

    this.render();
    this.bindEvents();
    this.bindKeyboardShortcuts();
  }

  render() {
    const isLevelMode = this.game.gameMode === 'levels' || !this.game.gameMode;
    const relatedGames = this.getRelatedGames();

    this.container.innerHTML = `
      <div class="game-shell-container" id="game-shell-root">
        <!-- Top Game Header Bar -->
        <header class="game-shell-header">
          <div class="header-left">
            <button class="btn btn-secondary btn-back-games" id="btn-shell-back" title="Back to Games Portal">
              ${icons.back}
              <span>All Games</span>
            </button>
            <div class="game-identity">
              <h2 class="game-title-text">${this.game.title}</h2>
              <span class="genre-badge">${this.game.category}</span>
            </div>
          </div>

          <div class="header-right">
            ${isLevelMode && this.onOpenLevelSelect ? `
              <button class="btn btn-secondary" id="btn-shell-levels" style="padding: 8px 14px; font-size: 0.84rem; border-radius: var(--radius-full);" title="Choose Level">
                <span>🗺️ Level Map</span>
              </button>
            ` : ''}

            <button class="btn-icon" id="btn-shell-share" title="Share Game Link">
              <span>🔗</span>
            </button>
            <button class="btn-icon ${this.isFavorited ? 'active' : ''}" id="btn-shell-fav" title="Favorite Game">
              ${this.isFavorited ? icons.heartFilled : icons.heart}
            </button>
            <button class="btn-icon" id="btn-shell-sound" title="Toggle Sound (M)">
              ${this.isMuted ? icons.volumeOff : icons.volumeOn}
            </button>
            <button class="btn-icon" id="btn-shell-pause" title="Pause Game (P)">
              ${icons.pause}
            </button>
            <button class="btn-icon" id="btn-shell-fullscreen" title="Fullscreen Mode (F)">
              ${icons.fullscreen}
            </button>
          </div>
        </header>

        <!-- Main Stage Viewport -->
        <div class="game-stage-viewport" id="game-stage-viewport">
          <!-- Active Engine Canvas Stage -->
          <div class="game-canvas-mount" id="game-canvas-mount"></div>

          <!-- Loading State Overlay -->
          <div class="game-overlay-screen" id="overlay-loading">
            <div class="overlay-card">
              <div class="spinner-ring"></div>
              <h3 style="font-family: var(--font-heading); margin-top: 18px; font-size: 1.35rem; color: #fff;">Loading ${this.game.title}...</h3>
              <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 8px;">
                ${this.formatControls(this.game.controls || 'Use touch or keyboard controls to play.')}
              </p>
            </div>
          </div>

          <!-- Paused State Overlay -->
          <div class="game-overlay-screen hidden" id="overlay-paused">
            <div class="overlay-card">
              <span style="font-size: 2.8rem; color: var(--brand-cyan);">⏸️</span>
              <h2 style="font-family: var(--font-display); font-size: 2rem; color: #fff; margin: 8px 0 20px;">GAME PAUSED</h2>
              
              <div class="overlay-actions-col">
                <button class="btn btn-primary" id="btn-pause-resume" style="width: 100%;">
                  ▶️ RESUME GAME
                </button>
                <button class="btn btn-secondary" id="btn-pause-restart" style="width: 100%;">
                  🔄 RESTART LEVEL
                </button>
                <button class="btn btn-secondary" id="btn-pause-quit" style="width: 100%;">
                  🏠 RETURN TO ALL GAMES
                </button>
              </div>
            </div>
          </div>

          <!-- Result / Game Over Overlay -->
          <div class="game-overlay-screen hidden" id="overlay-result">
            <div class="overlay-card result-card" id="result-card-box">
              <div class="result-badge" id="result-badge-tag">GAME OVER</div>
              <h2 class="result-title" id="result-title-text">WELL PLAYED!</h2>

              <div class="result-stats-row">
                <div class="stat-col">
                  <span class="stat-label">FINAL SCORE</span>
                  <b class="stat-value" id="result-score-val">0</b>
                </div>
                <div class="stat-col">
                  <span class="stat-label">HIGH SCORE</span>
                  <b class="stat-value" id="result-best-val" style="color: #ffd166;">0</b>
                </div>
                <div class="stat-col">
                  <span class="stat-label">REWARDS</span>
                  <b class="stat-value" id="result-xp-val" style="color: #10b981;">+100 XP</b>
                </div>
              </div>

              <div class="overlay-actions-col">
                <button class="btn btn-primary" id="btn-result-next" style="width: 100%; display: none;">
                  NEXT LEVEL ➔
                </button>
                <button class="btn btn-gold" id="btn-result-replay" style="width: 100%;">
                  🔄 PLAY AGAIN
                </button>
                <button class="btn btn-secondary" id="btn-result-back" style="width: 100%;">
                  🏠 BACK TO ALL GAMES
                </button>
              </div>
            </div>
          </div>

          <!-- Safety Error Fallback Overlay -->
          <div class="game-overlay-screen hidden" id="overlay-error">
            <div class="overlay-card">
              <span style="font-size: 2.8rem;">⚠️</span>
              <h2 style="font-family: var(--font-display); font-size: 1.8rem; color: #ef4444; margin: 8px 0;">GAME COULDN'T LOAD</h2>
              <p id="error-desc-text" style="color: var(--text-secondary); font-size: 0.92rem; margin-bottom: 20px;">
                Something went wrong while starting this game.
              </p>
              <div class="overlay-actions-col">
                <button class="btn btn-primary" id="btn-err-retry" style="width: 100%;">
                  🔄 TRY AGAIN
                </button>
                <button class="btn btn-secondary" id="btn-err-back" style="width: 100%;">
                  🏠 BACK TO ALL GAMES
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Poki Game Meta & Details Panel -->
        <section class="game-details-section">
          <div class="game-meta-card">
            <div class="game-meta-left">
              <div class="game-meta-icon">${this.game.icon || '🎮'}</div>
              <div>
                <h1 class="game-meta-title">${this.game.title}</h1>
                <div class="game-meta-badges">
                  <span class="genre-badge">${this.game.category}</span>
                  <span style="color: #ffd166; font-weight: 700; font-size: 0.85rem;">⭐ ${this.game.rating || 4.9}</span>
                  <span style="color: var(--text-muted); font-size: 0.85rem; font-weight: 600;">• ${(this.game.plays || 24500).toLocaleString()} plays</span>
                  <span style="background: rgba(255,255,255,0.08); padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; color: var(--text-secondary);">HTML5 Instant Play</span>
                </div>
              </div>
            </div>

            <div class="game-meta-right">
              <button class="btn btn-secondary" id="btn-meta-fav">
                <span>${this.isFavorited ? '❤️ Favorited' : '🤍 Add to Favorites'}</span>
              </button>
              <button class="btn btn-primary" id="btn-meta-fullscreen">
                <span>⛶ Play Fullscreen</span>
              </button>
            </div>
          </div>

          <div class="game-guide-grid">
            <div class="game-guide-card">
              <h3 class="game-guide-title">
                <span>📖 About ${this.game.title}</span>
              </h3>
              <p class="game-guide-text">
                ${this.game.description || 'Enjoy this high-performance instant HTML5 browser game on GAMINGZONE! Complete challenging levels, beat your high scores, and master the leaderboards.'}
              </p>
            </div>

            <div class="game-guide-card">
              <h3 class="game-guide-title">
                <span>🕹️ Controls & How to Play</span>
              </h3>
              <div class="game-guide-text">
                ${this.formatControls(this.game.controls || 'Use mouse or touch controls to play.')}
              </div>
            </div>
          </div>

          <!-- Related Games Shelf -->
          <div class="shelf-section related-games-shelf">
            <div class="shelf-header-row">
              <div class="shelf-title-wrap">
                <h2 class="shelf-title">🎮 More Games Like This</h2>
                <span class="shelf-subtitle">Jump straight into another game</span>
              </div>
            </div>
            <div class="shelf-carousel-track" id="related-carousel-track"></div>
          </div>
        </section>
      </div>

      <!-- Toast Feedback -->
      <div id="gz-toast" class="gz-toast">Link copied to clipboard!</div>
    `;

    // Populate Related Games Shelf
    const track = this.container.querySelector('#related-carousel-track');
    if (track && relatedGames.length > 0) {
      relatedGames.forEach(g => {
        track.appendChild(this.createRelatedCard(g));
      });
    }
  }

  getRelatedGames() {
    const allGames = portalState.getGames().filter(g => g.id !== this.game.id);
    // Find games in same category or matching tags
    const sameCat = allGames.filter(g => g.category === this.game.category);
    const otherGames = allGames.filter(g => g.category !== this.game.category);
    return [...sameCat, ...otherGames].slice(0, 8);
  }

  createRelatedCard(game) {
    const cardInstance = new GameCard(game, (selected) => {
      if (this.onOpenRelatedGame) {
        this.onOpenRelatedGame(selected);
      }
    });
    cardInstance.element.style.minWidth = '175px';
    return cardInstance.element;
  }

  formatControls(str) {
    if (!str) return 'Use mouse, keyboard, or touch controls.';
    return str
      .replace(/\[SPACE\]/gi, '<span class="kbd-key">SPACE</span>')
      .replace(/\[Arrow Keys\]/gi, '<span class="kbd-key">← ↑ → ↓</span>')
      .replace(/\[WASD\]/gi, '<span class="kbd-key">W A S D</span>')
      .replace(/\[P\]/gi, '<span class="kbd-key">P</span>')
      .replace(/\[F\]/gi, '<span class="kbd-key">F</span>')
      .replace(/\[M\]/gi, '<span class="kbd-key">M</span>');
  }

  bindEvents() {
    const root = this.container.querySelector('#game-shell-root');
    if (!root) return;

    // Back to portal button
    root.querySelector('#btn-shell-back')?.addEventListener('click', () => {
      sounds.playClick();
      this.onBackToGames();
    });

    // Level map button
    root.querySelector('#btn-shell-levels')?.addEventListener('click', () => {
      sounds.playClick();
      if (this.onOpenLevelSelect) this.onOpenLevelSelect();
    });

    // Share game link button
    root.querySelector('#btn-shell-share')?.addEventListener('click', () => {
      sounds.playClick();
      const url = `${window.location.origin}${window.location.pathname}#game/${this.game.slug}`;
      navigator.clipboard?.writeText(url).then(() => {
        this.showToast('Game link copied to clipboard! 📋');
      }).catch(() => {
        this.showToast('Link: ' + url);
      });
    });

    // Favorite toggle (in header and details panel)
    const toggleFav = () => {
      sounds.playClick();
      const updated = portalState.toggleFavorite(this.game.id);
      this.isFavorited = updated;

      const favBtn = root.querySelector('#btn-shell-fav');
      if (favBtn) {
        favBtn.classList.toggle('active', updated);
        favBtn.innerHTML = updated ? icons.heartFilled : icons.heart;
      }
      const metaFav = root.querySelector('#btn-meta-fav');
      if (metaFav) {
        metaFav.innerHTML = `<span>${updated ? '❤️ Favorited' : '🤍 Add to Favorites'}</span>`;
      }
      this.showToast(updated ? 'Added to Favorites! ❤️' : 'Removed from Favorites');
    };

    root.querySelector('#btn-shell-fav')?.addEventListener('click', toggleFav);
    root.querySelector('#btn-meta-fav')?.addEventListener('click', toggleFav);

    // Sound toggle
    const soundBtn = root.querySelector('#btn-shell-sound');
    soundBtn?.addEventListener('click', () => {
      this.isMuted = sounds.toggleMute();
      soundBtn.innerHTML = this.isMuted ? icons.volumeOff : icons.volumeOn;
      this.showToast(this.isMuted ? 'Sound Muted 🔇' : 'Sound Unmuted 🔊');
    });

    // Fullscreen toggle (in header and details panel)
    root.querySelector('#btn-shell-fullscreen')?.addEventListener('click', () => {
      this.toggleFullscreen();
    });
    root.querySelector('#btn-meta-fullscreen')?.addEventListener('click', () => {
      this.toggleFullscreen();
    });

    // Pause button
    root.querySelector('#btn-shell-pause')?.addEventListener('click', () => {
      this.togglePause();
    });

    // Pause overlay buttons
    root.querySelector('#btn-pause-resume')?.addEventListener('click', () => {
      sounds.playClick();
      this.resume();
    });

    root.querySelector('#btn-pause-restart')?.addEventListener('click', () => {
      sounds.playClick();
      this.resume();
      this.onReplay();
    });

    root.querySelector('#btn-pause-quit')?.addEventListener('click', () => {
      sounds.playClick();
      this.onBackToGames();
    });

    // Result overlay buttons
    root.querySelector('#btn-result-replay')?.addEventListener('click', () => {
      sounds.playClick();
      this.hideResult();
      this.onReplay();
    });

    root.querySelector('#btn-result-next')?.addEventListener('click', () => {
      sounds.playClick();
      this.hideResult();
      this.onNextLevel();
    });

    root.querySelector('#btn-result-back')?.addEventListener('click', () => {
      sounds.playClick();
      this.onBackToGames();
    });

    // Error overlay buttons
    root.querySelector('#btn-err-retry')?.addEventListener('click', () => {
      sounds.playClick();
      this.onReplay();
    });

    root.querySelector('#btn-err-back')?.addEventListener('click', () => {
      sounds.playClick();
      this.onBackToGames();
    });
  }

  bindKeyboardShortcuts() {
    this.keyHandler = (e) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      const key = e.key?.toLowerCase();
      if (key === 'f') {
        e.preventDefault();
        this.toggleFullscreen();
      } else if (key === 'm') {
        e.preventDefault();
        this.isMuted = sounds.toggleMute();
        const soundBtn = this.container.querySelector('#btn-shell-sound');
        if (soundBtn) soundBtn.innerHTML = this.isMuted ? icons.volumeOff : icons.volumeOn;
        this.showToast(this.isMuted ? 'Sound Muted 🔇' : 'Sound Unmuted 🔊');
      } else if (key === 'p') {
        e.preventDefault();
        this.togglePause();
      } else if (key === 'escape' && !document.fullscreenElement) {
        // Return to games if escape pressed while not in fullscreen
        this.onBackToGames();
      }
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  showToast(msg) {
    const toast = this.container.querySelector('#gz-toast') || document.getElementById('gz-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  }

  getMountNode() {
    return this.container.querySelector('#game-canvas-mount');
  }

  hideLoading() {
    const loader = this.container.querySelector('#overlay-loading');
    if (loader) loader.classList.add('hidden');
    this.state = 'playing';
  }

  showError(err) {
    this.state = 'error';
    const loader = this.container.querySelector('#overlay-loading');
    if (loader) loader.classList.add('hidden');

    const errOverlay = this.container.querySelector('#overlay-error');
    if (errOverlay) {
      errOverlay.classList.remove('hidden');
      const text = errOverlay.querySelector('#error-desc-text');
      if (text && err) {
        text.textContent = 'Could not start game. Tap Try Again or return to all games.';
      }
    }
  }

  togglePause() {
    const pauseOverlay = this.container.querySelector('#overlay-paused');
    if (!pauseOverlay) return;

    if (this.state === 'playing') {
      this.state = 'paused';
      pauseOverlay.classList.remove('hidden');
      sounds.playClick();
    } else if (this.state === 'paused') {
      this.resume();
    }
  }

  resume() {
    this.state = 'playing';
    const pauseOverlay = this.container.querySelector('#overlay-paused');
    if (pauseOverlay) pauseOverlay.classList.add('hidden');
  }

  showResult({
    score = 0,
    isVictory = false,
    isGameOver = false,
    hasNextLevel = false,
    levelNum = 1,
    unlockReward = null
  }) {
    this.state = isVictory ? 'victory' : 'gameover';
    const overlay = this.container.querySelector('#overlay-result');
    if (!overlay) return;

    const badge = overlay.querySelector('#result-badge-tag');
    const title = overlay.querySelector('#result-title-text');
    const scoreVal = overlay.querySelector('#result-score-val');
    const bestVal = overlay.querySelector('#result-best-val');
    const xpVal = overlay.querySelector('#result-xp-val');
    const nextBtn = overlay.querySelector('#btn-result-next');

    if (scoreVal) scoreVal.textContent = (score || 0).toLocaleString();
    if (bestVal) bestVal.textContent = (portalState.getHighScore(this.game.id) || score).toLocaleString();
    if (xpVal) xpVal.textContent = `+${Math.max(50, Math.floor(score * 0.1))} XP`;

    if (isVictory) {
      if (badge) {
        badge.textContent = 'VICTORY 🌟';
        badge.style.background = '#10b981';
      }
      if (title) title.textContent = unlockReward || 'LEVEL COMPLETE!';
    } else {
      if (badge) {
        badge.textContent = 'GAME OVER';
        badge.style.background = '#ef4444';
      }
      if (title) title.textContent = 'GOOD EFFORT!';
    }

    if (nextBtn) {
      nextBtn.style.display = (isVictory && hasNextLevel) ? 'block' : 'none';
    }

    overlay.classList.remove('hidden');
  }

  hideResult() {
    const overlay = this.container.querySelector('#overlay-result');
    if (overlay) overlay.classList.add('hidden');
  }

  toggleFullscreen() {
    const viewport = this.container.querySelector('#game-stage-viewport');
    if (!viewport) return;

    if (!document.fullscreenElement) {
      viewport.requestFullscreen?.().then(() => {
        this.isFullscreen = true;
        this.showToast('Fullscreen Mode (Press F or Esc to exit)');
      }).catch(e => console.warn(e));
    } else {
      document.exitFullscreen?.().then(() => {
        this.isFullscreen = false;
      }).catch(e => console.warn(e));
    }
  }

  destroy() {
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
    }
  }
}
