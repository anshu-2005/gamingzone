import { PortalUI } from './ui/PortalUI.js';
import { GamePlayerUI } from './ui/GamePlayerUI.js';
import { AdminUI } from './ui/AdminUI.js';
import { DeveloperStudioUI } from './ui/DeveloperStudioUI.js';
import { portalState } from './core/portalState.js';
import { sounds } from './core/soundFX.js';

class GamingZoneApp {
  constructor() {
    this.playerUI = new GamePlayerUI(() => {
      this.portalUI.render();
    });

    this.portalUI = new PortalUI((game) => {
      this.onOpenGame(game);
    });

    this.adminUI = new AdminUI(() => {
      this.portalUI.render();
    });

    this.devStudioUI = new DeveloperStudioUI(() => {
      this.portalUI.render();
    });

    this.initGlobalEvents();
    this.portalUI.render();
    this.handleRoute();

    // Dynamically sync games from central database
    portalState.syncCatalog();
    window.addEventListener('gamingzone:catalog-updated', () => {
      if (!window.location.hash.startsWith('#game/')) {
        this.portalUI.render();
      }
    });

    window.addEventListener('hashchange', () => {
      this.handleRoute();
    });
  }

  initGlobalEvents() {
    // Unlock Audio Context on first interaction
    window.addEventListener('click', () => {
      sounds.init();
    }, { once: true });

    // Header & Footer Admin / Dev buttons
    document.getElementById('btn-portal-admin')?.addEventListener('click', () => {
      sounds.playClick();
      this.adminUI.open();
    });

    document.getElementById('btn-portal-dev')?.addEventListener('click', () => {
      sounds.playClick();
      this.devStudioUI.open();
    });

    document.getElementById('btn-footer-admin')?.addEventListener('click', (e) => {
      e.preventDefault();
      sounds.playClick();
      this.adminUI.open();
    });

    document.getElementById('btn-footer-dev')?.addEventListener('click', (e) => {
      e.preventDefault();
      sounds.playClick();
      this.devStudioUI.open();
    });

    document.getElementById('btn-footer-games')?.addEventListener('click', (e) => {
      e.preventDefault();
      sounds.playClick();
      window.location.hash = '';
      this.portalUI.currentCategory = 'all';
      this.portalUI.searchQuery = '';
      const sInput = document.getElementById('portal-search-input');
      if (sInput) sInput.value = '';
      document.getElementById('screen-game-player')?.classList.add('hidden');
      document.getElementById('portal-main-view')?.classList.remove('hidden');
      this.portalUI.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  onOpenGame(game) {
    if (!game) return;
    this.playerUI.loadGame(game);
  }

  handleRoute() {
    const path = window.location.pathname;
    const hash = window.location.hash.replace('#', '').trim();

    if (path === '/admin' || path.startsWith('/admin/') || hash === 'admin') {
      this.adminUI.open();
      return;
    } else if (path === '/developer' || path.startsWith('/developer/') || hash === 'developer') {
      this.devStudioUI.open();
      return;
    }

    if (hash.startsWith('game/')) {
      const slug = hash.replace('game/', '').trim();
      const game = portalState.getGameBySlug(slug) || portalState.getGameById(slug);
      if (game) {
        if (this.playerUI.currentGame?.id !== game.id) {
          this.onOpenGame(game);
        }
        return;
      } else {
        // Fetch published game dynamically from backend database
        fetch(`/api/games/${slug}`)
          .then(r => r.json())
          .then(data => {
            if (data.success && data.game) {
              this.onOpenGame(data.game);
            }
          })
          .catch(console.warn);
        return;
      }
    }

    // Default: Return to Portal Home & Render
    this.playerUI.destroyActiveGame();
    document.getElementById('screen-game-player')?.classList.add('hidden');
    document.getElementById('portal-main-view')?.classList.remove('hidden');
    this.portalUI.render();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.portalApp = new GamingZoneApp();
});
