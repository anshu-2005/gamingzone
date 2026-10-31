/* ====================================================
   GAMINGZONE — REUSABLE PREMIUM GAMECARD COMPONENT
   CrazyGames-Level Interactive Discovery Card with:
   - Aspect ratio 16:10 & High-DPI Vector Artwork
   - Single-Active Gameplay Video Preview Manager
   - 280ms Hover Debounce & Smooth Inline Video Playback
   - Layout-Shift-Free Crossfade Transitions
   - Reduced-Motion & Touch/Mobile Awareness
   - Accessible ARIA Navigation & Favorite Toggle
   ==================================================== */

import { portalState } from '../core/portalState.js';
import { sounds } from '../core/soundFX.js';
import { icons } from '../utils/icons.js';
import { getGameThumbnailSVG } from '../utils/gameThumbnails.js';
import { getGamePreviewMeta } from '../data/previewManifest.js';
import { spatialUI } from './SpatialUI.js';

/**
 * Singleton Preview Manager: Ensures only ONE video plays at any time
 */
class GlobalPreviewManager {
  constructor() {
    this.activeCard = null;
    this.prefersReducedMotion = false;

    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.prefersReducedMotion = mediaQuery.matches;
      mediaQuery.addEventListener?.('change', (e) => {
        this.prefersReducedMotion = e.matches;
      });
    }
  }

  requestPlay(card) {
    if (this.prefersReducedMotion) return;
    if (this.activeCard && this.activeCard !== card) {
      this.activeCard.stopPreview();
    }
    this.activeCard = card;
  }

  release(card) {
    if (this.activeCard === card) {
      this.activeCard = null;
    }
  }
}

export const previewManager = new GlobalPreviewManager();

export class GameCard {
  constructor(game, onSelect = null) {
    this.game = game;
    this.onSelect = onSelect;
    this.previewMeta = getGamePreviewMeta(game);

    this.element = null;
    this.videoEl = null;
    this.hoverTimer = null;
    this.isPlaying = false;
    this.isTouchDevice = false;

    this.checkTouchEnvironment();
    this.render();
    this.bindEvents();
  }

  checkTouchEnvironment() {
    if (typeof window !== 'undefined') {
      this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 768);
    }
  }

  render() {
    const isFav = portalState.isFavorite(this.game.id);
    const card = document.createElement('article');
    card.className = 'game-card-item gz-game-card';
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Play ${this.game.title}`);
    card.dataset.gameId = this.game.id;
    card.dataset.slug = this.game.slug;

    // Badges based on genuine metadata
    let badgeHtml = '';
    if (this.game.featured) {
      badgeHtml = `<span class="gz-card-badge badge-featured">⭐ Featured</span>`;
    } else if (this.game.tags?.includes('new') || this.game.is_new) {
      badgeHtml = `<span class="gz-card-badge badge-new">✨ New</span>`;
    } else if (this.game.plays > 35000 || this.game.is_trending) {
      badgeHtml = `<span class="gz-card-badge badge-trending">🔥 Hot</span>`;
    }

    // Video preview indicator pill (desktop only)
    const previewIndicator = this.previewMeta.hasPreview ? `
      <div class="gz-preview-pill" title="Hover for gameplay preview">
        <span class="preview-dot"></span>
        <span class="preview-text">Preview</span>
      </div>
    ` : '';

    card.innerHTML = `
      <div class="card-thumbnail-box gz-card-thumbnail">
        <!-- Static Cover Artwork (SVG / Image) -->
        <div class="gz-card-cover-art" id="cover-${this.game.id}">
          ${getGameThumbnailSVG(this.game)}
        </div>

        <!-- Inline Video Preview Container (Mounted Lazy) -->
        <div class="gz-card-video-slot" id="video-slot-${this.game.id}"></div>

        <!-- Badges & Indicators -->
        ${badgeHtml}
        ${previewIndicator}

        <!-- Hover Subtle Overlay -->
        <div class="card-hover-overlay gz-hover-overlay">
          <span class="btn-hover-play">${icons.play}</span>
        </div>
      </div>

      <!-- Quick Favorite Toggle -->
      <button class="btn-card-fav ${isFav ? 'active' : ''}" title="${isFav ? 'Remove from favorites' : 'Add to favorites'}" aria-label="Favorite">
        ${isFav ? icons.heartFilled : icons.heart}
      </button>

      <!-- Card Title & Metadata Bar -->
      <div class="card-info-box gz-card-meta">
        <h4 class="card-title gz-card-title">${this.game.title}</h4>
        <div class="card-meta-row">
          <span class="genre-badge">${this.game.category || 'Arcade'}</span>
          <span class="card-plays-text">${(this.game.plays || 1200).toLocaleString()} plays</span>
        </div>
      </div>
    `;

    this.element = card;
    return card;
  }

  bindEvents() {
    if (!this.element) return;

    // Spatial UI 3D Tilt & Specular Physics
    spatialUI.bind(this.element);

    // Click to Play
    this.element.addEventListener('click', (e) => {
      if (e.target.closest('.btn-card-fav')) return;
      sounds.playClick();
      this.stopPreview();

      if (this.onSelect) {
        window.location.hash = `#game/${this.game.slug}`;
        this.onSelect(this.game);
      }
    });

    // Keyboard Access (Enter or Space to play)
    this.element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        sounds.playClick();
        this.stopPreview();
        if (this.onSelect) {
          window.location.hash = `#game/${this.game.slug}`;
          this.onSelect(this.game);
        }
      }
    });

    // Favorite Button
    const favBtn = this.element.querySelector('.btn-card-fav');
    favBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      sounds.playClick();
      const updated = portalState.toggleFavorite(this.game.id);
      favBtn.classList.toggle('active', updated);
      favBtn.innerHTML = updated ? icons.heartFilled : icons.heart;
      favBtn.setAttribute('title', updated ? 'Remove from favorites' : 'Add to favorites');
    });

    // Desktop Hover Interactions for Gameplay Preview
    if (!this.isTouchDevice && this.previewMeta.hasPreview) {
      this.element.addEventListener('mouseenter', () => this.onMouseEnter());
      this.element.addEventListener('mouseleave', () => this.onMouseLeave());
    }
  }

  onMouseEnter() {
    // 280ms debounce delay before preview starts
    this.clearHoverTimer();
    this.hoverTimer = setTimeout(() => {
      this.startPlayback();
    }, 280);
  }

  onMouseLeave() {
    this.clearHoverTimer();
    this.stopPreview();
  }

  clearHoverTimer() {
    if (this.hoverTimer) {
      clearTimeout(this.hoverTimer);
      this.hoverTimer = null;
    }
  }

  startPlayback() {
    if (!this.previewMeta.hasPreview || !this.previewMeta.previewVideo) return;
    if (previewManager.prefersReducedMotion) return;

    // Notify global manager to stop any previous card's video
    previewManager.requestPlay(this);

    const slot = this.element.querySelector(`#video-slot-${this.game.id}`);
    if (!slot) return;

    // Lazy instantiate video element if not already created
    if (!this.videoEl) {
      this.videoEl = document.createElement('video');
      this.videoEl.className = 'gz-preview-video';
      this.videoEl.muted = true;
      this.videoEl.autoplay = true;
      this.videoEl.loop = true;
      this.videoEl.playsInline = true;
      this.videoEl.preload = 'auto';
      this.videoEl.setAttribute('muted', '');
      this.videoEl.setAttribute('playsinline', '');

      const source = document.createElement('source');
      source.src = this.previewMeta.previewVideo;
      source.type = this.previewMeta.format || 'video/webm';
      this.videoEl.appendChild(source);

      slot.appendChild(this.videoEl);
    }

    this.videoEl.currentTime = 0;
    const playPromise = this.videoEl.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.isPlaying = true;
          this.element.classList.add('preview-active');
        })
        .catch((err) => {
          // Autoplay policy or media load restriction — fail silently to static cover
          console.debug('Preview video autoplay deferred:', err?.message || err);
        });
    }
  }

  stopPreview() {
    this.clearHoverTimer();
    previewManager.release(this);

    if (this.videoEl) {
      try {
        this.videoEl.pause();
        this.videoEl.currentTime = 0;
      } catch (e) {}
    }

    this.isPlaying = false;
    this.element?.classList.remove('preview-active');
  }

  destroy() {
    this.clearHoverTimer();
    this.stopPreview();
    if (this.videoEl) {
      this.videoEl.src = '';
      this.videoEl.load();
      this.videoEl.remove();
      this.videoEl = null;
    }
    this.element = null;
  }
}

