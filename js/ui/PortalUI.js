/* ====================================================
   GAMINGZONE PORTAL UI (PortalUI.js)
   CrazyGames-Level Modern Browser Gaming Experience:
   - High-Speed Categorized Game Discovery
   - Interactive Horizontal Shelves with Scroll Buttons
   - Reusable GameCards with Inline Gameplay Hover Video Previews
   - Curated Spotlight Hero & Genre Showcase
   - Live Search, Category Filters, Favorites & Recent Playlists
   ==================================================== */

import { portalState } from '../core/portalState.js';
import { sounds } from '../core/soundFX.js';
import { icons, getCategoryIcon } from '../utils/icons.js';
import { getGameThumbnailSVG } from '../utils/gameThumbnails.js';
import { GameCard } from './GameCard.js';
import { spatialUI } from './SpatialUI.js';

export class PortalUI {
  constructor(onGameSelect) {
    this.onGameSelect = onGameSelect;
    this.currentCategory = 'all';
    this.searchQuery = '';
    this.currentSort = 'popular'; // popular, rating, title, new
    this.pageSize = 24;
    this.currentPage = 1;
    this.activeCards = [];
    this.init();
  }

  init() {
    // 1. Sidebar Toggle Button & Mobile Backdrop
    const toggleBtn = document.getElementById('btn-sidebar-toggle');
    const sidebar = document.getElementById('crazy-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');

    const toggleSidebar = () => {
      sounds.playClick();
      if (window.innerWidth <= 900) {
        const isOpen = sidebar?.classList.toggle('open');
        backdrop?.classList.toggle('active', isOpen);
      } else {
        sidebar?.classList.toggle('collapsed');
      }
    };

    const closeMobileSidebar = () => {
      sidebar?.classList.remove('open');
      backdrop?.classList.remove('active');
    };

    toggleBtn?.addEventListener('click', toggleSidebar);
    backdrop?.addEventListener('click', closeMobileSidebar);

    // 2. CrazyGames "Surprise Me 🎲" Randomizer
    document.getElementById('btn-surprise-me')?.addEventListener('click', () => {
      sounds.playClick();
      const allGames = portalState.getGames();
      if (!allGames.length) return;
      const randomGame = allGames[Math.floor(Math.random() * allGames.length)];
      if (randomGame && this.onGameSelect) {
        window.location.hash = `#game/${randomGame.slug}`;
        this.onGameSelect(randomGame);
      }
    });

    // 3. Sidebar Navigation Links
    document.querySelectorAll('.sidebar-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        sounds.playClick();
        closeMobileSidebar();
        document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
        e.currentTarget.classList.add('active');

        const nav = e.currentTarget.getAttribute('data-nav');
        const cat = e.currentTarget.getAttribute('data-cat');

        if (cat) {
          this.currentCategory = cat;
        } else if (nav === 'recent') {
          this.currentCategory = 'recent';
        } else if (nav === 'trending' || nav === 'hot') {
          this.currentCategory = 'trending';
        } else if (nav === 'new') {
          this.currentCategory = 'new';
        } else if (nav === '2player') {
          this.currentCategory = '2player';
        } else if (nav === 'favorites') {
          this.currentCategory = 'favorites';
        } else {
          this.currentCategory = 'all';
        }

        this.searchQuery = '';
        const searchInput = document.getElementById('portal-search-input');
        if (searchInput) searchInput.value = '';
        document.getElementById('btn-search-clear')?.classList.add('hidden');

        document.getElementById('screen-game-player')?.classList.add('hidden');
        document.getElementById('portal-main-view')?.classList.remove('hidden');
        this.currentPage = 1;
        this.render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    // 4. Live Search Input
    const searchInput = document.getElementById('portal-search-input');
    const searchClearBtn = document.getElementById('btn-search-clear');

    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.trim().toLowerCase();
      if (searchClearBtn) {
        searchClearBtn.classList.toggle('hidden', !this.searchQuery);
      }
      this.currentPage = 1;
      this.render();
    });

    searchClearBtn?.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      this.searchQuery = '';
      searchClearBtn.classList.add('hidden');
      this.currentPage = 1;
      this.render();
    });

    // 5. Logo Link
    document.getElementById('portal-logo-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      sounds.playClick();
      closeMobileSidebar();
      this.resetToHome();
    });

    // 6. Sound Toggle
    document.getElementById('btn-portal-sound')?.addEventListener('click', (e) => {
      const isMuted = sounds.toggleMute();
      e.currentTarget.innerHTML = isMuted ? icons.volumeOff : icons.volumeOn;
    });

    // 7. Favorites Header Button
    document.getElementById('btn-header-favs')?.addEventListener('click', () => {
      sounds.playClick();
      closeMobileSidebar();
      this.currentCategory = 'favorites';
      document.getElementById('screen-game-player')?.classList.add('hidden');
      document.getElementById('portal-main-view')?.classList.remove('hidden');
      this.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // 8. Profile Strip Click
    document.getElementById('header-player-profile-strip')?.addEventListener('click', () => {
      sounds.playClick();
      document.getElementById('screen-profile-modal')?.classList.remove('hidden');
      this.updateProfileModal();
    });

    document.getElementById('btn-close-profile-modal')?.addEventListener('click', () => {
      sounds.playClick();
      document.getElementById('screen-profile-modal')?.classList.add('hidden');
    });

    // 9. Footer Navigation Links
    document.getElementById('btn-footer-home')?.addEventListener('click', (e) => {
      e.preventDefault();
      sounds.playClick();
      this.resetToHome();
    });

    document.getElementById('btn-footer-games')?.addEventListener('click', (e) => {
      e.preventDefault();
      sounds.playClick();
      this.currentCategory = 'all';
      this.searchQuery = '';
      this.currentPage = 1;
      this.render();
      const mount = document.getElementById('all-games-grid-mount');
      mount?.scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('btn-footer-popular')?.addEventListener('click', (e) => {
      e.preventDefault();
      sounds.playClick();
      this.currentCategory = 'trending';
      this.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.getElementById('btn-footer-new')?.addEventListener('click', (e) => {
      e.preventDefault();
      sounds.playClick();
      this.currentCategory = 'new';
      this.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.querySelectorAll('.footer-col-nav a[data-cat]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        sounds.playClick();
        const cat = e.currentTarget.getAttribute('data-cat');
        this.currentCategory = cat;
        this.renderCategoryPills();
        this.render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    const showAboutToast = (msg) => {
      const toast = document.createElement('div');
      toast.className = 'gz-toast-bubble';
      toast.textContent = msg;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2500);
    };

    document.getElementById('btn-footer-about')?.addEventListener('click', (e) => {
      e.preventDefault();
      showAboutToast('GAMINGZONE — Play 65+ instant, free HTML5 browser games on any device!');
    });

    document.getElementById('btn-footer-privacy')?.addEventListener('click', (e) => {
      e.preventDefault();
      showAboutToast('GAMINGZONE respects your privacy. All game progress is stored safely in your browser.');
    });

    document.getElementById('btn-footer-terms')?.addEventListener('click', (e) => {
      e.preventDefault();
      showAboutToast('GAMINGZONE terms: Free for personal browser gaming and non-commercial entertainment.');
    });
  }

  resetToHome() {
    this.currentCategory = 'all';
    this.searchQuery = '';
    this.currentPage = 1;
    const searchInput = document.getElementById('portal-search-input');
    if (searchInput) searchInput.value = '';
    const searchClearBtn = document.getElementById('btn-search-clear');
    if (searchClearBtn) searchClearBtn.classList.add('hidden');
    window.location.hash = '';
    document.querySelectorAll('.sidebar-item').forEach(i => {
      i.classList.toggle('active', i.getAttribute('data-nav') === 'home');
    });
    document.getElementById('screen-game-player')?.classList.add('hidden');
    document.getElementById('portal-main-view')?.classList.remove('hidden');
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  render() {
    this.destroyActiveCards();
    this.renderHeaderProfile();
    this.renderCategoryPills();

    const mainView = document.getElementById('portal-main-view');
    if (!mainView) return;

    mainView.classList.remove('hidden');
    mainView.innerHTML = '';

    if (this.searchQuery || (this.currentCategory !== 'all' && this.currentCategory !== 'home')) {
      this.renderFilteredView(mainView);
    } else {
      this.renderGamingZoneHome(mainView);
    }
  }

  destroyActiveCards() {
    this.activeCards.forEach(c => {
      if (typeof c.destroy === 'function') c.destroy();
    });
    this.activeCards = [];
  }

  renderHeaderProfile() {
    const strip = document.getElementById('header-player-profile-strip');
    if (!strip) return;

    const profile = portalState.getPlayerProfile();
    strip.innerHTML = `
      <span style="font-size: 1.1rem; color: var(--brand-cyan);">⚡</span>
      <span style="color: #ffd166; font-weight: 800;">${(profile.coins || 0).toLocaleString()} 🪙</span>
      <span style="background: rgba(0, 229, 255, 0.15); color: var(--brand-cyan); padding: 2px 8px; border-radius: 6px; font-size: 0.76rem; font-weight: 800; border: 1px solid rgba(0, 229, 255, 0.3);">LVL ${profile.level || 1}</span>
    `;
  }

  renderCategoryPills() {
    const container = document.getElementById('category-pills-container');
    if (!container) return;
    container.innerHTML = '';

    const categories = portalState.state.categories || [];
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = `cat-pill ${this.currentCategory === cat.id ? 'active' : ''}`;
      btn.innerHTML = `<span class="pill-icon">${getCategoryIcon(cat.id)}</span> <span class="pill-title">${cat.name}</span>`;
      btn.addEventListener('click', () => {
        sounds.playClick();
        this.currentCategory = cat.id;
        this.searchQuery = '';
        this.currentPage = 1;
        const searchInput = document.getElementById('portal-search-input');
        if (searchInput) searchInput.value = '';
        this.renderCategoryPills();
        this.render();
      });
      container.appendChild(btn);
    });
  }

  renderGamingZoneHome(container) {
    const allGames = portalState.getGames();
    const gameArrow = portalState.getGameById('game_arrow_maze_escape') || allGames[0];
    const gameCricket = portalState.getGameById('game_cricket_premier_league') || allGames[2];
    const gameDrift = portalState.getGameById('game_cyber_car_drift') || allGames[5];

    // 1. Welcoming Hero Banner
    const heroSection = document.createElement('section');
    heroSection.className = 'gz-hero-banner';
    heroSection.innerHTML = `
      <span class="gz-hero-tag">⚡ GAMINGZONE • INSTANT BROWSER PLAY</span>
      <h1 class="gz-hero-title">Your Next Favorite Game Starts Here.</h1>
      <p class="gz-hero-subtitle">
        Play ${allGames.length}+ premier free HTML5 games with zero downloads or installs. Hover over any game card with a preview badge for real gameplay footage, or click to start playing right away!
      </p>
      <div class="gz-hero-chips">
        <span style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); margin-right: 4px;">Top Genres:</span>
        <button class="gz-chip-btn" data-cat="puzzle">🏹 Puzzle</button>
        <button class="gz-chip-btn" data-cat="cricket">🏏 Cricket</button>
        <button class="gz-chip-btn" data-cat="racing">🏎️ Racing</button>
        <button class="gz-chip-btn" data-cat="action">⚔️ Action</button>
        <button class="gz-chip-btn" data-cat="2player">👥 2-Player</button>
        <button class="gz-chip-btn" data-cat="arcade">🕹️ Arcade</button>
        <button class="gz-chip-btn" data-cat="sports">⚽ Sports</button>
      </div>
    `;

    heroSection.querySelectorAll('.gz-chip-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        sounds.playClick();
        const cat = e.currentTarget.getAttribute('data-cat');
        this.currentCategory = cat;
        this.renderCategoryPills();
        this.render();
      });
    });

    container.appendChild(heroSection);

    // 2. Standout Featured Spotlight (3 Premium Interactive Cards)
    const featuredSection = document.createElement('section');
    featuredSection.className = 'shelf-section';
    featuredSection.innerHTML = `
      <div class="shelf-header-row">
        <div>
          <h2 class="shelf-title">⭐ Standout Featured Games</h2>
          <p class="shelf-subtitle">Handpicked top-rated browser hits ready for instant action</p>
        </div>
      </div>
      <div class="gz-featured-grid">
        <!-- Card 1: Arrow Maze Escape -->
        <div class="gz-featured-card" data-slug="${gameArrow.slug}">
          <div class="gz-featured-thumb-wrap">
            ${getGameThumbnailSVG(gameArrow)}
          </div>
          <div class="gz-featured-overlay">
            <div class="gz-featured-header-row">
              <span class="gz-featured-tag">🔥 Trending #1</span>
              <span class="gz-featured-plays">${(gameArrow.plays || 28400).toLocaleString()} plays</span>
            </div>
            <h3 class="gz-featured-title">${gameArrow.title}</h3>
            <p class="gz-featured-desc">${gameArrow.description || 'Tap or click to launch arrows and clear every path without collisions!'}</p>
            <button class="gz-featured-play-btn">Play Now ➔</button>
          </div>
        </div>

        <!-- Card 2: Cricket Premier League -->
        <div class="gz-featured-card" data-slug="${gameCricket.slug}">
          <div class="gz-featured-thumb-wrap">
            ${getGameThumbnailSVG(gameCricket)}
          </div>
          <div class="gz-featured-overlay">
            <div class="gz-featured-header-row">
              <span class="gz-featured-tag" style="color: #10b981; background: rgba(16, 185, 129, 0.1);">🏏 3D Tournament</span>
              <span class="gz-featured-plays">${(gameCricket.plays || 42100).toLocaleString()} plays</span>
            </div>
            <h3 class="gz-featured-title">${gameCricket.title}</h3>
            <p class="gz-featured-desc">${gameCricket.description || 'Step up to the crease, time your shots, smash sixes, and lift the trophy!'}</p>
            <button class="gz-featured-play-btn" style="background: #10b981; color: #fff;">Play Now ➔</button>
          </div>
        </div>

        <!-- Card 3: Cyber Car Drift -->
        <div class="gz-featured-card" data-slug="${gameDrift.slug}">
          <div class="gz-featured-thumb-wrap">
            ${getGameThumbnailSVG(gameDrift)}
          </div>
          <div class="gz-featured-overlay">
            <div class="gz-featured-header-row">
              <span class="gz-featured-tag" style="color: #8b5cf6; background: rgba(139, 92, 246, 0.1);">🏎️ High Speed</span>
              <span class="gz-featured-plays">${(gameDrift.plays || 31500).toLocaleString()} plays</span>
            </div>
            <h3 class="gz-featured-title">${gameDrift.title}</h3>
            <p class="gz-featured-desc">${gameDrift.description || 'Drift through futuristic neon circuits, manage tire slip, and set lap records!'}</p>
            <button class="gz-featured-play-btn" style="background: #8b5cf6; color: #fff;">Play Now ➔</button>
          </div>
        </div>
      </div>
    `;

    featuredSection.querySelectorAll('.gz-featured-card').forEach(card => {
      spatialUI.bind(card);
      card.addEventListener('click', (e) => {
        sounds.playClick();
        const slug = e.currentTarget.getAttribute('data-slug');
        const g = portalState.getGameBySlug(slug) || portalState.getGameById(slug);
        if (g && this.onGameSelect) {
          window.location.hash = `#game/${g.slug}`;
          this.onGameSelect(g);
        }
      });
    });

    container.appendChild(featuredSection);

    // 3. Jump Back In (Recently Played)
    const recentGames = portalState.getRecentlyPlayed(8);
    if (recentGames && recentGames.length > 0) {
      container.appendChild(this.createShelfSection({
        title: '🕒 Jump Back In (Recently Played)',
        subtitle: 'Pick up right where you left off',
        games: recentGames
      }));
    }

    // 4. Popular Games
    const popularGames = [...allGames].sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 10);
    container.appendChild(this.createShelfSection({
      title: '🔥 Popular Games',
      subtitle: 'Most played by players around the world',
      games: popularGames
    }));

    // 5. New & Trending Games
    const trendingGames = allGames.filter(g => g.featured || (g.tags && (g.tags.includes('trending') || g.tags.includes('new')))).slice(0, 10);
    if (trendingGames.length > 0) {
      container.appendChild(this.createShelfSection({
        title: '🚀 New & Trending',
        subtitle: 'Fresh releases and viral browser hits',
        games: trendingGames
      }));
    }

    // 6. Cricket & Sports Champions
    const sportsGames = allGames.filter(g => g.category === 'cricket' || g.category === 'sports').slice(0, 10);
    if (sportsGames.length > 0) {
      container.appendChild(this.createShelfSection({
        title: '🏏 Cricket & Sports Arena',
        subtitle: 'Tournaments, chases, and athletic showdowns',
        games: sportsGames
      }));
    }

    // 7. Brain & Puzzle Challenges
    const puzzleGames = allGames.filter(g => g.category === 'puzzle').slice(0, 10);
    if (puzzleGames.length > 0) {
      container.appendChild(this.createShelfSection({
        title: '🧩 Brain & Puzzle Challenges',
        subtitle: 'Sharp logic, maze escapes, and optical puzzles',
        games: puzzleGames
      }));
    }

    // 8. 2-Player & Multiplayer Battles
    const multiplayerGames = allGames.filter(g => g.category === '2player' || g.gameMode === 'versus' || (g.tags && g.tags.includes('2player'))).slice(0, 10);
    if (multiplayerGames.length > 0) {
      container.appendChild(this.createShelfSection({
        title: '👥 2-Player & Action Battles',
        subtitle: 'Challenge friends or test your combat reflexes',
        games: multiplayerGames
      }));
    }

    // 9. Full Responsive Catalog with Sort Controls
    const allSection = document.createElement('section');
    allSection.className = 'shelf-section';
    allSection.innerHTML = `
      <div class="shelf-header-row" style="flex-wrap: wrap; gap: 12px;">
        <div>
          <h2 class="shelf-title">⚡ All ${allGames.length}+ Free Games</h2>
          <p class="shelf-subtitle">Click any game to launch and play immediately</p>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 0.82rem; color: var(--text-muted); font-weight: 600;">Sort:</span>
          <select id="catalog-sort-select" style="
            background: var(--surface-card);
            border: 1px solid var(--border-subtle);
            color: #ffffff;
            font-family: var(--font-body);
            font-size: 0.82rem;
            font-weight: 600;
            padding: 6px 12px;
            border-radius: var(--radius-sm);
            cursor: pointer;
            outline: none;
          ">
            <option value="popular" ${this.currentSort === 'popular' ? 'selected' : ''}>🔥 Most Popular</option>
            <option value="rating" ${this.currentSort === 'rating' ? 'selected' : ''}>⭐ Highest Rated</option>
            <option value="title" ${this.currentSort === 'title' ? 'selected' : ''}>🔤 Name (A-Z)</option>
            <option value="new" ${this.currentSort === 'new' ? 'selected' : ''}>✨ Newest First</option>
          </select>
        </div>
      </div>
      <div class="games-grid-layout" id="all-games-grid-mount"></div>
    `;

    const sortSelect = allSection.querySelector('#catalog-sort-select');
    sortSelect?.addEventListener('change', (e) => {
      this.currentSort = e.target.value;
      this.render();
      const mount = document.getElementById('all-games-grid-mount');
      mount?.scrollIntoView({ behavior: 'smooth' });
    });

    const allGridMount = allSection.querySelector('#all-games-grid-mount');
    const sortedGames = this.getSortedGames(allGames);
    sortedGames.forEach(g => {
      const cardInstance = new GameCard(g, (selected) => {
        if (this.onGameSelect) this.onGameSelect(selected);
      });
      this.activeCards.push(cardInstance);
      allGridMount.appendChild(cardInstance.element);
    });

    container.appendChild(allSection);
  }

  getSortedGames(gamesList) {
    const list = [...gamesList];
    if (this.currentSort === 'rating') {
      return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (this.currentSort === 'title') {
      return list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (this.currentSort === 'new') {
      return list.sort((a, b) => (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0));
    }
    // Default popular
    return list.sort((a, b) => (b.plays || 0) - (a.plays || 0));
  }

  createShelfSection({ title, subtitle = '', games }) {
    const section = document.createElement('section');
    section.className = 'shelf-section';

    section.innerHTML = `
      <div class="shelf-header-row">
        <div class="shelf-title-wrap">
          <h2 class="shelf-title">${title}</h2>
          ${subtitle ? `<p class="shelf-subtitle">${subtitle}</p>` : ''}
        </div>
      </div>
      <div class="shelf-track-wrapper">
        <button class="shelf-nav-btn prev" aria-label="Scroll Left">◀</button>
        <div class="shelf-carousel-track"></div>
        <button class="shelf-nav-btn next" aria-label="Scroll Right">▶</button>
      </div>
    `;

    const track = section.querySelector('.shelf-carousel-track');
    const prevBtn = section.querySelector('.shelf-nav-btn.prev');
    const nextBtn = section.querySelector('.shelf-nav-btn.next');

    // Smooth Desktop Scroll Navigation
    prevBtn?.addEventListener('click', () => {
      sounds.playClick();
      track.scrollBy({ left: -track.clientWidth * 0.75, behavior: 'smooth' });
    });

    nextBtn?.addEventListener('click', () => {
      sounds.playClick();
      track.scrollBy({ left: track.clientWidth * 0.75, behavior: 'smooth' });
    });

    games.forEach(g => {
      const card = new GameCard(g, (selected) => {
        if (this.onGameSelect) this.onGameSelect(selected);
      });
      this.activeCards.push(card);
      track.appendChild(card.element);
    });

    return section;
  }

  renderFilteredView(container) {
    let games = portalState.getGames();

    if (this.currentCategory === 'favorites') {
      games = games.filter(g => portalState.isFavorite(g.id));
    } else if (this.currentCategory === 'recent') {
      const recents = portalState.getRecentlyPlayed(24);
      games = recents.length > 0 ? recents : games.slice(0, 8);
    } else if (this.currentCategory === 'trending' || this.currentCategory === 'new') {
      games = games.filter(g => g.featured || (g.tags && (g.tags.includes('trending') || g.tags.includes('action') || g.tags.includes('puzzle'))));
    } else if (this.currentCategory === '2player') {
      games = games.filter(g => g.category === '2player' || g.gameMode === 'versus' || (g.tags && g.tags.includes('2player')));
    } else if (this.currentCategory !== 'all') {
      games = games.filter(g => g.category === this.currentCategory || (g.tags && g.tags.includes(this.currentCategory)));
    }

    if (this.searchQuery) {
      games = games.filter(g => {
        const t = (g.title || '').toLowerCase().includes(this.searchQuery);
        const d = (g.description || '').toLowerCase().includes(this.searchQuery);
        const tags = (g.tags || []).some(tag => tag.toLowerCase().includes(this.searchQuery));
        const cat = (g.category || '').toLowerCase().includes(this.searchQuery);
        return t || d || tags || cat;
      });
    }

    // Category Hero Banner
    let categoryIcon = '🎮';
    let categoryTitle = 'All Games';
    if (this.currentCategory === 'favorites') {
      categoryIcon = '❤️';
      categoryTitle = 'Favorite Games';
    } else if (this.currentCategory === 'recent') {
      categoryIcon = '🕒';
      categoryTitle = 'Recently Played Games';
    } else if (this.currentCategory === 'trending') {
      categoryIcon = '🔥';
      categoryTitle = 'Hot & Trending Games';
    } else if (this.currentCategory === 'new') {
      categoryIcon = '✨';
      categoryTitle = 'New Releases';
    } else if (this.currentCategory === '2player') {
      categoryIcon = '👥';
      categoryTitle = '2-Player & Multiplayer Battles';
    } else if (this.searchQuery) {
      categoryIcon = '🔍';
      categoryTitle = `Search Results: "${this.searchQuery}"`;
    } else {
      categoryIcon = getCategoryIcon(this.currentCategory);
      const catObj = (portalState.state.categories || []).find(c => c.id === this.currentCategory);
      if (catObj) categoryTitle = catObj.name;
    }

    const banner = document.createElement('div');
    banner.className = 'category-hero-banner';
    banner.innerHTML = `
      <div class="category-hero-info">
        <div class="category-hero-icon">${categoryIcon}</div>
        <div>
          <h2 class="category-hero-title">${categoryTitle}</h2>
          <span class="category-hero-count">${games.length} game${games.length !== 1 ? 's' : ''} available to play</span>
        </div>
      </div>
      <button class="btn-reset-filter" id="btn-banner-reset">✕ Reset Filter</button>
    `;

    banner.querySelector('#btn-banner-reset')?.addEventListener('click', () => {
      sounds.playClick();
      this.resetToHome();
    });

    container.appendChild(banner);

    // Grid section
    const section = document.createElement('section');
    section.className = 'shelf-section';
    section.innerHTML = `<div class="games-grid-layout" id="filtered-grid-mount"></div>`;

    const mount = section.querySelector('#filtered-grid-mount');

    if (games.length === 0) {
      mount.innerHTML = `
        <div class="search-empty-box">
          <div class="search-empty-icon">🔍</div>
          <h3 class="search-empty-title">No matching games found</h3>
          <p class="search-empty-desc">Try checking out popular categories or tap one of the suggested tags below:</p>
          <div class="search-suggestions-row">
            <button class="btn-search-suggest" data-term="arrow">🏹 Arrow Escape</button>
            <button class="btn-search-suggest" data-term="cricket">🏏 Cricket 3D</button>
            <button class="btn-search-suggest" data-term="subway">🛹 Subway Runner</button>
            <button class="btn-search-suggest" data-term="drift">🏎️ Drift Racing</button>
            <button class="btn-search-suggest" data-term="candy">🍬 Candy Match</button>
            <button class="btn-search-suggest" data-term="combat">⚔️ Shadow Combat</button>
          </div>
        </div>
      `;

      mount.querySelectorAll('.btn-search-suggest').forEach(btn => {
        btn.addEventListener('click', (e) => {
          sounds.playClick();
          const term = e.currentTarget.getAttribute('data-term');
          const searchInput = document.getElementById('portal-search-input');
          if (searchInput) searchInput.value = term;
          this.searchQuery = term;
          this.render();
        });
      });
    } else {
      games.forEach(g => {
        const card = new GameCard(g, (selected) => {
          if (this.onGameSelect) this.onGameSelect(selected);
        });
        this.activeCards.push(card);
        mount.appendChild(card.element);
      });
    }

    container.appendChild(section);
  }

  updateProfileModal() {
    const profile = portalState.getPlayerProfile();
    const nameEl = document.getElementById('modal-profile-name');
    const lvlEl = document.getElementById('modal-profile-level');
    const xpTextEl = document.getElementById('modal-profile-xp-text');
    const xpBarEl = document.getElementById('modal-profile-xp-bar');
    const coinsEl = document.getElementById('modal-profile-coins');
    const starsEl = document.getElementById('modal-profile-stars');

    if (nameEl) nameEl.textContent = profile.name || 'Player 1';
    if (lvlEl) lvlEl.textContent = `LEVEL ${profile.level || 1}`;
    if (xpTextEl) xpTextEl.textContent = `${profile.xp || 0} / ${profile.xpToNextLevel || 500} XP`;
    if (xpBarEl) {
      const pct = Math.min(100, Math.round(((profile.xp || 0) / (profile.xpToNextLevel || 500)) * 100));
      xpBarEl.style.width = `${pct}%`;
    }
    if (coinsEl) coinsEl.textContent = (profile.coins || 0).toLocaleString();
    if (starsEl) starsEl.textContent = (profile.totalStars || 0).toLocaleString();
  }
}
