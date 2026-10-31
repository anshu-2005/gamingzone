import { portalState } from '../core/portalState.js';
import { sounds } from '../core/soundFX.js';
import { formatNumber } from '../utils/helpers.js';
import { getGameThumbnailSVG } from '../utils/gameThumbnails.js';

export class AdminUI {
  constructor(onUpdatePortal) {
    this.onUpdatePortal = onUpdatePortal;
    this.currentTab = 'catalog';
    this.filterStatus = 'all';
    this.filterCategory = 'all';
    this.searchQuery = '';
    this.currentPage = 1;
    this.activeEditGameId = null;
    this.init();
  }

  init() {
    // 1. Admin Login Submit
    document.getElementById('btn-admin-login-submit')?.addEventListener('click', () => {
      this.handleLogin();
    });

    document.getElementById('admin-password-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleLogin();
    });

    // 2. Admin Logout
    document.getElementById('btn-admin-logout')?.addEventListener('click', async () => {
      sounds.playClick();
      await portalState.logoutAdmin();
      this.closeDashboard();
      this.onUpdatePortal();
    });

    // 3. Close Modals
    document.querySelectorAll('.btn-close-admin-modal').forEach(b => {
      b.addEventListener('click', () => {
        sounds.playClick();
        this.closeLoginModal();
        this.closeDashboard();
        this.closeEditModal();
        this.closePreviewModal();
      });
    });

    // 4. Admin Nav Tabs
    document.querySelectorAll('.admin-nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        sounds.playClick();
        const tabTarget = e.currentTarget.getAttribute('data-tab');
        this.switchTab(tabTarget);
      });
    });

    // 5. Filter Controls in Catalog
    document.getElementById('admin-filter-search')?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.trim();
      this.currentPage = 1;
      this.renderGamesTable();
    });

    document.getElementById('admin-filter-status')?.addEventListener('change', (e) => {
      this.filterStatus = e.target.value;
      this.currentPage = 1;
      this.renderGamesTable();
    });

    document.getElementById('admin-filter-category')?.addEventListener('change', (e) => {
      this.filterCategory = e.target.value;
      this.currentPage = 1;
      this.renderGamesTable();
    });

    // 6. "Create Game" Button in Catalog
    document.getElementById('btn-admin-open-create')?.addEventListener('click', () => {
      sounds.playClick();
      this.openEditModal(null); // null = new game
    });

    // 7. Edit/Create Form Submit
    document.getElementById('form-admin-edit-game')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSaveGame();
    });

    // 8. Auto-generate slug from title
    document.getElementById('edit-game-title')?.addEventListener('input', (e) => {
      const slugInput = document.getElementById('edit-game-slug');
      if (slugInput && (!this.activeEditGameId || !slugInput.value)) {
        slugInput.value = e.target.value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }
    });

    // 9. ZIP Upload Handler in Edit Modal
    document.getElementById('btn-admin-upload-zip')?.addEventListener('click', () => {
      this.handleUploadZip();
    });

    // 10. Close Preview Modal
    document.getElementById('btn-close-preview')?.addEventListener('click', () => {
      this.closePreviewModal();
    });
  }

  getAuthHeaders() {
    const token = portalState.getAdminToken();
    return {
      'Authorization': `Bearer ${token}`
    };
  }

  async handleLogin() {
    const userInput = document.getElementById('admin-username-input');
    const passInput = document.getElementById('admin-password-input');
    const feedback = document.getElementById('admin-login-error');

    const username = userInput ? userInput.value.trim() : 'admin';
    const password = passInput ? passInput.value.trim() : '';

    if (!password) {
      if (feedback) feedback.textContent = 'Please enter password.';
      return;
    }

    if (feedback) feedback.textContent = 'Authenticating...';

    const res = await portalState.loginAdmin(username, password);
    if (res.success) {
      sounds.playWin();
      if (feedback) feedback.textContent = '';
      if (passInput) passInput.value = '';
      this.closeLoginModal();
      this.openDashboard();
    } else {
      sounds.playHit();
      if (feedback) feedback.textContent = `❌ ${res.error || 'Authentication failed.'}`;
    }
  }

  open() {
    if (portalState.isAdmin()) {
      this.openDashboard();
    } else {
      this.openLoginModal();
    }
  }

  openLoginModal() {
    const modal = document.getElementById('screen-admin-login');
    if (modal) modal.classList.remove('hidden');
    document.getElementById('admin-password-input')?.focus();
  }

  closeLoginModal() {
    const modal = document.getElementById('screen-admin-login');
    if (modal) modal.classList.add('hidden');
    if (window.location.hash === '#admin') {
      window.location.hash = '';
    }
  }

  openDashboard() {
    if (window.location.hash !== '#admin') {
      window.location.hash = '#admin';

      this.switchTab(this.currentTab || 'catalog');
      const modal = document.getElementById('screen-admin-dashboard');
      if (modal) modal.classList.remove('hidden');
    }

    closeDashboard() {
      const modal = document.getElementById('screen-admin-dashboard');
      if (modal) modal.classList.add('hidden');
      if (window.location.hash === '#admin') {
        window.location.hash = '';
      }
    }

    switchTab(tabName) {
      this.currentTab = tabName;
      document.querySelectorAll('.admin-nav-tab').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
      });

      document.querySelectorAll('.admin-tab-pane').forEach(pane => {
        pane.classList.toggle('hidden', pane.getAttribute('id') !== `admin-pane-${tabName}`);
      });

      if (tabName === 'catalog') this.renderGamesTable();
      if (tabName === 'analytics') this.renderStats();
    }

  async renderStats() {
      try {
        const res = await fetch('/api/admin/stats', { headers: this.getAuthHeaders() });
        if (!res.ok) {
          if (res.status === 401) {
            await portalState.logoutAdmin();
            this.closeDashboard();
            this.openLoginModal();
            const feedback = document.getElementById('admin-login-error');
            if (feedback) feedback.textContent = 'Session expired. Please sign in again.';
          }
          return;
        }
        const data = await res.json();
        if (data.success && data.stats) {
          const s = data.stats;
          document.getElementById('admin-stat-games').textContent = s.totalGames;
          document.getElementById('admin-stat-plays').textContent = formatNumber(s.totalPlays);
          document.getElementById('admin-stat-published').textContent = s.publishedGames;
          document.getElementById('admin-stat-drafts').textContent = s.draftGames;
        }
      } catch (err) {
        console.warn('Could not fetch admin stats:', err);
      }
    }

  async renderGamesTable() {
      const tbody = document.getElementById('admin-games-tbody');
      if (!tbody) return;
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #94a3b8; padding: 24px;">Loading games from database...</td></tr>`;

      try {
        const params = new URLSearchParams({
          status: this.filterStatus,
          category: this.filterCategory,
          search: this.searchQuery,
          page: this.currentPage,
          limit: 50
        });

        const res = await fetch(`/api/admin/games?${params.toString()}`, {
          headers: this.getAuthHeaders()
        });

        if (!res.ok) {
          if (res.status === 401) {
            portalState.logoutAdmin();
            this.closeDashboard();
            this.openLoginModal();
            return;
          }
          throw new Error('Failed to fetch games.');
        }

        const data = await res.json();
        const games = data.games || [];

        if (games.length === 0) {
          tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #94a3b8; padding: 28px;">No games match your current filter criteria.</td></tr>`;
          return;
        }

        tbody.innerHTML = '';
        games.forEach(g => {
          const tr = document.createElement('tr');
          const isPublished = g.status === 'published';
          const isDraft = g.status === 'draft';
          const isBundle = g.game_type === 'bundle';

          tr.innerHTML = `
          <td>
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 44px; height: 30px; border-radius: 6px; overflow: hidden; background: #060911; flex-shrink: 0;">
                ${getGameThumbnailSVG(g)}
              </div>
              <div>
                <b>${g.title}</b>
                <div style="font-size: 0.72rem; color: #94a3b8;">/${g.slug}</div>
              </div>
            </div>
          </td>
          <td>
            <span class="badge-type ${isBundle ? 'badge-type-bundle' : 'badge-type-builtin'}">
              ${isBundle ? '📦 BUNDLE' : '⚡ BUILTIN'}
            </span>
          </td>
          <td><span class="admin-cat-badge">${g.category.toUpperCase()}</span></td>
          <td><span style="font-size: 0.78rem; color: #cbd5e1;">v${g.version || '1.0.0'}</span></td>
          <td>
            <span class="badge-status badge-status-${g.status}">
              ${g.status.toUpperCase()}
            </span>
          </td>
          <td>${formatNumber(g.plays || 0)}</td>
          <td>
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              <button class="btn-table-action btn-act-preview" title="Preview Game">👁️ Preview</button>
              <button class="btn-table-action btn-act-edit" title="Edit Metadata">✏️ Edit</button>
              <button class="btn-table-action ${isPublished ? 'btn-act-unpub' : 'btn-act-pub'}" title="${isPublished ? 'Unpublish (Make Draft)' : 'Publish to Portal'}">
                ${isPublished ? '🚫 Unpublish' : '🚀 Publish'}
              </button>
              <button class="btn-table-action btn-act-del" title="Delete Game">🗑️</button>
            </div>
          </td>
        `;

          // 1. Preview
          tr.querySelector('.btn-act-preview').addEventListener('click', () => {
            sounds.playClick();
            this.openPreviewModal(g);
          });

          // 2. Edit
          tr.querySelector('.btn-act-edit').addEventListener('click', () => {
            sounds.playClick();
            this.openEditModal(g);
          });

          // 3. Toggle Publish / Draft
          tr.querySelector(isPublished ? '.btn-act-unpub' : '.btn-act-pub').addEventListener('click', async () => {
            sounds.playClick();
            const targetStatus = isPublished ? 'draft' : 'published';
            await this.updateGameStatus(g.id, targetStatus);
          });

          // 4. Delete Game
          tr.querySelector('.btn-act-del').addEventListener('click', async () => {
            if (confirm(`Are you sure you want to permanently delete "${g.title}"?`)) {
              sounds.playHit();
              await this.deleteGame(g.id);
            }
          });

          tbody.appendChild(tr);
        });
      } catch (err) {
        console.error('Error rendering games table:', err);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #ef4444; padding: 24px;">Failed to load games: ${err.message}</td></tr>`;
      }
    }

  async updateGameStatus(id, newStatus) {
      try {
        const res = await fetch(`/api/admin/games/${id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeaders()
          },
          body: JSON.stringify({ status: newStatus })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          alert(`❌ ${data.error || 'Failed to update status.'}`);
          return;
        }
        sounds.playWin();
        await portalState.syncCatalog();
        this.renderGamesTable();
        this.renderStats();
        this.onUpdatePortal();
      } catch (err) {
        alert(`❌ Error: ${err.message}`);
      }
    }

  async deleteGame(id) {
      try {
        const res = await fetch(`/api/admin/games/${id}`, {
          method: 'DELETE',
          headers: this.getAuthHeaders()
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          alert(`❌ ${data.error || 'Failed to delete game.'}`);
          return;
        }
        sounds.playClick();
        await portalState.syncCatalog();
        this.renderGamesTable();
        this.renderStats();
        this.onUpdatePortal();
      } catch (err) {
        alert(`❌ Error: ${err.message}`);
      }
    }

    // --- Create & Edit Game Modal ---
    openEditModal(game = null) {
      this.activeEditGameId = game ? game.id : null;
      const modal = document.getElementById('screen-admin-edit-modal');
      if (!modal) return;

      document.getElementById('edit-modal-title').textContent = game ? `✏️ Edit: ${game.title}` : '➕ Create New Game';
      document.getElementById('edit-game-title').value = game ? game.title : '';
      document.getElementById('edit-game-slug').value = game ? game.slug : '';
      document.getElementById('edit-game-category').value = game ? game.category : 'arcade';
      document.getElementById('edit-game-tags').value = game ? (Array.isArray(game.tags) ? game.tags.join(', ') : game.tags) : '';
      document.getElementById('edit-game-version').value = game ? (game.version || '1.0.0') : '1.0.0';
      document.getElementById('edit-game-desc').value = game ? game.description : '';
      document.getElementById('edit-game-controls').value = game ? game.controls : 'Arrow keys or touch to play';
      document.getElementById('edit-game-status').value = game ? game.status : 'draft';
      document.getElementById('edit-game-featured').checked = game ? Boolean(game.is_featured) : false;

      // Bundle upload section
      const bundleSection = document.getElementById('edit-bundle-upload-section');
      const bundleStatus = document.getElementById('edit-bundle-status');
      const zipInput = document.getElementById('edit-game-zip-file');
      if (zipInput) zipInput.value = '';

      if (bundleSection) {
        bundleSection.style.display = 'block';
      }
      if (bundleStatus) {
        if (game && game.bundle_url) {
          bundleStatus.innerHTML = `<span style="color: #10b981;">✅ Game bundle installed: <code>${game.bundle_url}</code></span>`;
        } else if (game && game.game_type === 'builtin') {
          bundleStatus.innerHTML = `<span style="color: #38bdf8;">⚡ Built-in engine game: <code>${game.engine || 'Built-in Canvas'}</code></span>`;
        } else {
          bundleStatus.innerHTML = `<span style="color: #f59e0b;">⚠️ No ZIP bundle uploaded yet. Game cannot be published until a bundle is uploaded.</span>`;
        }
      }

      const feedback = document.getElementById('edit-upload-feedback');
      if (feedback) {
        feedback.textContent = '';
        feedback.className = 'upload-feedback hidden';
      }

      modal.classList.remove('hidden');
    }

    closeEditModal() {
      const modal = document.getElementById('screen-admin-edit-modal');
      if (modal) modal.classList.add('hidden');
      this.activeEditGameId = null;
    }

  async handleSaveGame() {
      const title = document.getElementById('edit-game-title')?.value.trim();
      const slug = document.getElementById('edit-game-slug')?.value.trim();
      const category = document.getElementById('edit-game-category')?.value;
      const rawTags = document.getElementById('edit-game-tags')?.value.trim();
      const version = document.getElementById('edit-game-version')?.value.trim() || '1.0.0';
      const description = document.getElementById('edit-game-desc')?.value.trim();
      const controls = document.getElementById('edit-game-controls')?.value.trim();
      const status = document.getElementById('edit-game-status')?.value || 'draft';
      const is_featured = document.getElementById('edit-game-featured')?.checked || false;

      if (!title) {
        alert('Please enter game title.');
        return;
      }

      const tags = rawTags ? rawTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [category];

      const payload = {
        title,
        slug,
        category,
        tags,
        version,
        description,
        controls,
        status,
        is_featured
      };

      try {
        let res;
        if (this.activeEditGameId) {
          // Update
          res = await fetch(`/api/admin/games/${this.activeEditGameId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...this.getAuthHeaders()
            },
            body: JSON.stringify(payload)
          });
        } else {
          // Create
          res = await fetch('/api/admin/games', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...this.getAuthHeaders()
            },
            body: JSON.stringify(payload)
          });
        }

        const data = await res.json();
        if (!res.ok || !data.success) {
          alert(`❌ ${data.error || 'Failed to save game.'}`);
          return;
        }

        sounds.playWin();
        const savedGame = data.game;
        this.activeEditGameId = savedGame.id;

        // Check if a ZIP file was selected for upload
        const fileInput = document.getElementById('edit-game-zip-file');
        if (fileInput && fileInput.files && fileInput.files[0]) {
          await this.handleUploadZip(savedGame.id);
        }

        await portalState.syncCatalog();
        this.closeEditModal();
        this.renderGamesTable();
        this.renderStats();
        this.onUpdatePortal();
      } catch (err) {
        alert(`❌ Error: ${err.message}`);
      }
    }

  async handleUploadZip(gameId = this.activeEditGameId) {
      if (!gameId) {
        alert('Please save game details before uploading the ZIP bundle.');
        return;
      }

      const fileInput = document.getElementById('edit-game-zip-file');
      const feedback = document.getElementById('edit-upload-feedback');
      const progressBar = document.getElementById('edit-upload-progress');
      const version = document.getElementById('edit-game-version')?.value.trim() || '1.0.0';

      if (!fileInput || !fileInput.files || !fileInput.files[0]) {
        alert('Please select a .zip game archive file.');
        return;
      }

      const file = fileInput.files[0];
      if (!file.name.toLowerCase().endsWith('.zip')) {
        alert('Selected file must be a .zip archive.');
        return;
      }

      const formData = new FormData();
      formData.append('bundle', file);
      formData.append('version', version);

      if (feedback) {
        feedback.textContent = `Uploading and validating "${file.name}" (${(file.size / 1024).toFixed(1)} KB)...`;
        feedback.className = 'upload-feedback upload-loading';
        feedback.classList.remove('hidden');
      }
      if (progressBar) {
        progressBar.style.width = '60%';
      }

      try {
        const res = await fetch(`/api/admin/games/${gameId}/upload`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: formData
        });

        const data = await res.json();
        if (progressBar) progressBar.style.width = '100%';

        if (!res.ok || !data.success) {
          sounds.playHit();
          if (feedback) {
            feedback.textContent = `❌ ${data.error || 'Upload failed.'}`;
            feedback.className = 'upload-feedback upload-error';
          }
          return;
        }

        sounds.playWin();
        if (feedback) {
          feedback.innerHTML = `✅ <b>Success!</b> ${data.message} Bundle live at: <code>${data.bundleUrl}</code>`;
          feedback.className = 'upload-feedback upload-success';
        }

        const bundleStatus = document.getElementById('edit-bundle-status');
        if (bundleStatus) {
          bundleStatus.innerHTML = `<span style="color: #10b981;">✅ Verified bundle installed: <code>${data.bundleUrl}</code></span>`;
        }

        await portalState.syncCatalog();
        this.renderGamesTable();
        this.onUpdatePortal();
      } catch (err) {
        sounds.playHit();
        if (feedback) {
          feedback.textContent = `❌ Upload error: ${err.message}`;
          feedback.className = 'upload-feedback upload-error';
        }
      }
    }

    // --- Sandboxed Game Preview Modal ---
    openPreviewModal(game) {
      const modal = document.getElementById('screen-admin-preview');
      const container = document.getElementById('admin-preview-stage');
      const titleEl = document.getElementById('admin-preview-title');
      if (!modal || !container) return;

      if (titleEl) titleEl.textContent = `🎮 Preview Sandbox: ${game.title} (v${game.version || '1.0.0'})`;
      container.innerHTML = '';

      if (game.bundle_url) {
        const entryUrl = `${game.bundle_url}${game.entry_path || 'index.html'}`;
        container.innerHTML = `
        <iframe
          src="${entryUrl}"
          sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms"
          allow="fullscreen; autoplay"
          style="width: 100%; height: 560px; border: none; background: #000; border-radius: 12px;"
          title="${game.title}"
        ></iframe>
      `;
      } else {
        container.innerHTML = `
        <div style="padding: 40px; text-align: center; color: #94a3b8;">
          <div style="font-size: 2rem; margin-bottom: 8px;">⚡</div>
          <h3>Built-in Engine Game</h3>
          <p style="margin-top: 6px;">This game uses the built-in JavaScript canvas engine (<code>${game.engine}</code>). You can launch it directly on the live player.</p>
          <a href="#game/${game.slug}" class="btn btn-primary" style="display: inline-block; margin-top: 14px; text-decoration: none;">Launch on Live Theater</a>
        </div>
      `;
      }

      modal.classList.remove('hidden');
    }

    closePreviewModal() {
      const modal = document.getElementById('screen-admin-preview');
      const container = document.getElementById('admin-preview-stage');
      if (container) container.innerHTML = '';
      if (modal) modal.classList.add('hidden');
    }
  }
