import React, { useState, useEffect, useMemo } from 'react';
import { sounds } from '../../js/core/soundFX.js';
import { CATEGORIES } from '../../js/data/gamesRegistry.js';
import { getGameThumbnailSVG } from '../../js/utils/gameThumbnails.js';

export function AdminModal({
  isOpen,
  onClose,
  onCatalogChanged,
  onPreviewGame
}) {
  const [token, setToken] = useState(() => localStorage.getItem('gz_admin_token') || '');
  const [activeTab, setActiveTab] = useState('manage'); // 'manage' | 'editor'
  
  // Auth Form State (Zero hardcoded credentials)
  const [authMode, setAuthMode] = useState('pin'); // 'pin' | 'password'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Catalog Table State
  const [games, setGames] = useState([]);
  const [tableSearch, setTableSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'published' | 'draft' | 'bundle'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [tableLoading, setTableLoading] = useState(false);
  const [deleteConfirmGame, setDeleteConfirmGame] = useState(null);

  // Form State for Add / Edit
  const [editingGameId, setEditingGameId] = useState(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEditedManually, setSlugEditedManually] = useState(false);
  const [category, setCategory] = useState('action');
  const [tagsInput, setTagsInput] = useState('action, popular');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [controls, setControls] = useState('WASD / Arrow keys to move, Space to action');
  const [version, setVersion] = useState('1.0.0');
  const [status, setStatus] = useState('published');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isTrending, setIsTrending] = useState(false);
  const [isNew, setIsNew] = useState(true);

  // Game Source Mode: 'bundle' (ZIP) or 'external' (URL)
  const [sourceMode, setSourceMode] = useState('bundle');
  const [bundleFile, setBundleFile] = useState(null);
  const [externalUrl, setExternalUrl] = useState('');

  // Asset Files
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);

  // Submission & Progress State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // On open, verify token
  useEffect(() => {
    if (isOpen && token) {
      verifyAndLoad();
    }
  }, [isOpen, token]);

  const verifyAndLoad = async () => {
    setTableLoading(true);
    try {
      const verifyRes = await fetch('/api/admin/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!verifyRes.ok) {
        setToken('');
        localStorage.removeItem('gz_admin_token');
        setTableLoading(false);
        return;
      }
      const verifyData = await verifyRes.json();
      setCurrentUser(verifyData.user);
      await fetchGamesList();
    } catch (err) {
      console.error('Session verify failed:', err);
      setToken('');
      localStorage.removeItem('gz_admin_token');
    } finally {
      setTableLoading(false);
    }
  };

  const fetchGamesList = async () => {
    try {
      const res = await fetch('/api/admin/games?limit=250', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGames(data.games || []);
      }
    } catch (e) {
      console.error('Failed to fetch admin games:', e);
    }
  };

  // Live auto-slug generation from title
  const handleTitleChange = (val) => {
    setTitle(val);
    if (!slugEditedManually) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generated);
    }
  };

  // Handle Cover Image file preview
  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  // Handle Video file preview
  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    sounds.playClick();
    setLoginError('');
    setAuthLoading(true);

    try {
      const payload = authMode === 'pin' ? { pin } : { username, password };
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.token) {
        setToken(data.token);
        localStorage.setItem('gz_admin_token', data.token);
        setCurrentUser(data.user);
        setUsername('');
        setPassword('');
        setPin('');
        await fetchGamesList();
      } else {
        setLoginError(data.error || 'Authentication rejected. Check credentials.');
      }
    } catch (err) {
      setLoginError(err.message || 'Network connection failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    sounds.playClick();
    if (token) {
      fetch('/api/admin/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});
    }
    setToken('');
    localStorage.removeItem('gz_admin_token');
    setCurrentUser(null);
  };

  // Switch to Create New Game Form
  const handleOpenCreateForm = () => {
    sounds.playClick();
    setEditingGameId(null);
    setTitle('');
    setSlug('');
    setSlugEditedManually(false);
    setCategory('action');
    setTagsInput('action, popular');
    setDescription('');
    setInstructions('Use keyboard controls or screen touch to complete missions.');
    setControls('WASD / Arrow keys to move, Space to action');
    setVersion('1.0.0');
    setStatus('published');
    setIsFeatured(false);
    setIsTrending(false);
    setIsNew(true);
    setSourceMode('bundle');
    setBundleFile(null);
    setExternalUrl('');
    setCoverFile(null);
    setCoverPreview(null);
    setVideoFile(null);
    setVideoPreview(null);
    setFeedback({ type: '', message: '' });
    setActiveTab('editor');
  };

  // Edit Existing Game Form
  const handleEditGame = (game) => {
    sounds.playClick();
    setEditingGameId(game.id);
    setTitle(game.title || '');
    setSlug(game.slug || '');
    setSlugEditedManually(true);
    setCategory(game.category || 'action');
    setTagsInput(Array.isArray(game.tags) ? game.tags.join(', ') : (game.tags || ''));
    setDescription(game.description || '');
    setInstructions(game.instructions || 'Follow on-screen instructions.');
    setControls(game.controls || 'Keyboard / Touch controls');
    setVersion(game.version || '1.0.0');
    setStatus(game.status || 'published');
    setIsFeatured(Boolean(game.is_featured));
    setIsTrending(Boolean(game.is_trending));
    setIsNew(Boolean(game.is_new));
    setSourceMode(game.external_url ? 'external' : 'bundle');
    setExternalUrl(game.external_url || '');
    setBundleFile(null);
    setCoverFile(null);
    setCoverPreview(game.thumbnail?.startsWith('/') || game.thumbnail?.startsWith('http') ? game.thumbnail : null);
    setVideoFile(null);
    setVideoPreview(game.preview_video || null);
    setFeedback({ type: '', message: '' });
    setActiveTab('editor');
  };

  // Toggle Publish / Unpublish instant action
  const handleToggleStatus = async (game) => {
    sounds.playClick();
    const nextStatus = game.status === 'published' ? 'draft' : 'published';
    try {
      const res = await fetch(`/api/admin/games/${game.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGames((prev) =>
          prev.map((g) => (g.id === game.id ? { ...g, status: nextStatus } : g))
        );
        if (typeof onCatalogChanged === 'function') onCatalogChanged();
      } else {
        alert(data.error || 'Failed to change game status.');
      }
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  // Delete Game handler
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmGame) return;
    sounds.playClick();
    try {
      const res = await fetch(`/api/admin/games/${deleteConfirmGame.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGames((prev) => prev.filter((g) => g.id !== deleteConfirmGame.id));
        setDeleteConfirmGame(null);
        if (typeof onCatalogChanged === 'function') onCatalogChanged();
      } else {
        alert(data.error || 'Failed to delete game.');
      }
    } catch (err) {
      alert('Error deleting game: ' + err.message);
    }
  };

  // Submit Game (Create or Edit with multipart bundle/cover/video)
  const handleSubmitGame = async (e) => {
    e.preventDefault();
    sounds.playClick();
    setFeedback({ type: '', message: '' });

    if (!title.trim()) {
      setFeedback({ type: 'error', message: 'Game title is required.' });
      return;
    }

    if (sourceMode === 'bundle' && !editingGameId && !bundleFile) {
      setFeedback({ type: 'error', message: 'Please select a ZIP bundle file containing index.html.' });
      return;
    }

    if (sourceMode === 'external' && !externalUrl.trim()) {
      setFeedback({ type: 'error', message: 'Please provide a valid external game URL.' });
      return;
    }

    setIsSubmitting(true);
    setSubmitProgress(25);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('slug', slug.trim());
      formData.append('category', category);
      formData.append('description', description.trim());
      formData.append('instructions', instructions.trim());
      formData.append('controls', controls.trim());
      formData.append('version', version.trim());
      formData.append('status', status);
      formData.append('is_featured', String(isFeatured));
      formData.append('is_trending', String(isTrending));
      formData.append('is_new', String(isNew));
      formData.append('tags', tagsInput);

      if (editingGameId) {
        formData.append('game_id', editingGameId);
      }

      if (sourceMode === 'external') {
        formData.append('external_url', externalUrl.trim());
      } else if (bundleFile) {
        formData.append('bundle', bundleFile);
      }

      if (coverFile) {
        formData.append('thumbnail', coverFile);
      }

      if (videoFile) {
        formData.append('previewVideo', videoFile);
      }

      setSubmitProgress(55);

      const res = await fetch('/api/admin/games/publish-with-assets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      setSubmitProgress(90);
      const data = await res.json();

      if (res.ok && data.success) {
        setSubmitProgress(100);
        setFeedback({
          type: 'success',
          message: data.message || `Game "${title}" successfully saved.`
        });

        await fetchGamesList();
        if (typeof onCatalogChanged === 'function') onCatalogChanged();

        setTimeout(() => {
          setActiveTab('manage');
        }, 1200);
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'Server validation error occurred.'
        });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to submit game.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered games table rows
  const filteredTableGames = useMemo(() => {
    return games.filter((g) => {
      if (statusFilter !== 'all') {
        if (statusFilter === 'published' && g.status !== 'published') return false;
        if (statusFilter === 'draft' && g.status !== 'draft') return false;
        if (statusFilter === 'bundle' && g.game_type !== 'bundle') return false;
        if (statusFilter === 'builtin' && g.game_type !== 'builtin') return false;
      }
      if (categoryFilter !== 'all' && g.category !== categoryFilter) return false;
      if (tableSearch.trim()) {
        const query = tableSearch.toLowerCase();
        const matchesTitle = g.title?.toLowerCase().includes(query);
        const matchesSlug = g.slug?.toLowerCase().includes(query);
        const matchesCat = g.category?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesSlug && !matchesCat) return false;
      }
      return true;
    });
  }, [games, statusFilter, categoryFilter, tableSearch]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop active" onClick={onClose} style={{ zIndex: 1000 }}>
      <div
        className="modal-card admin-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '1050px',
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          overflow: 'hidden',
          background: 'rgba(18, 20, 28, 0.96)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>⚙️</span>
            <div>
              <h2
                style={{
                  color: '#fff',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.25rem',
                  letterSpacing: '0.5px',
                  margin: 0
                }}
              >
                GAMINGZONE Platform Publisher & Admin
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: '2px 0 0' }}>
                Secure database-backed game publishing, zero redeployment required
              </p>
            </div>
          </div>
          <button
            className="btn-icon"
            onClick={onClose}
            title="Close"
            style={{ fontSize: '1.1rem', width: '36px', height: '36px' }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {!token ? (
            /* ==============================================
               1. SECURE ADMIN AUTHENTICATION SCREEN
               ============================================== */
            <div style={{ maxWidth: '440px', margin: '30px auto', textAlign: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'rgba(255, 87, 51, 0.12)',
                  border: '1px solid rgba(255, 87, 51, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem',
                  margin: '0 auto 16px'
                }}
              >
                🔒
              </div>
              <h3 style={{ color: '#fff', fontFamily: 'var(--font-heading)', fontSize: '1.3rem' }}>
                Admin Authentication Required
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.86rem', marginTop: '6px', marginBottom: '22px' }}>
                Enter your administrative PIN or master credentials to manage the platform catalog.
              </p>

              <div
                style={{
                  display: 'flex',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '10px',
                  padding: '4px',
                  marginBottom: '20px'
                }}
              >
                <button
                  type="button"
                  onClick={() => setAuthMode('pin')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: authMode === 'pin' ? 'var(--brand-coral)' : 'transparent',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Quick PIN Access
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('password')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: authMode === 'password' ? 'var(--brand-coral)' : 'transparent',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Username & Password
                </button>
              </div>

              <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
                {authMode === 'pin' ? (
                  <div style={{ marginBottom: '18px' }}>
                    <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.84rem', marginBottom: '6px' }}>
                      Security PIN
                    </label>
                    <input
                      type="password"
                      className="crazy-search-input"
                      placeholder="Enter 4-digit security PIN"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      style={{ width: '100%', height: '46px', textAlign: 'center', letterSpacing: '6px', fontSize: '1.2rem' }}
                      autoFocus
                      required
                    />
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.84rem', marginBottom: '6px' }}>
                        Admin Username
                      </label>
                      <input
                        type="text"
                        className="crazy-search-input"
                        placeholder="e.g. admin"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={{ width: '100%', height: '44px' }}
                        required
                      />
                    </div>
                    <div style={{ marginBottom: '18px' }}>
                      <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.84rem', marginBottom: '6px' }}>
                        Master Password
                      </label>
                      <input
                        type="password"
                        className="crazy-search-input"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ width: '100%', height: '44px' }}
                        required
                      />
                    </div>
                  </>
                )}

                {loginError && (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      marginBottom: '16px'
                    }}
                  >
                    ⚠️ {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={authLoading}
                  style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
                >
                  {authLoading ? 'Verifying...' : 'Authenticate & Unlock Publishing'}
                </button>
              </form>
            </div>
          ) : (
            /* ==============================================
               2. AUTHENTICATED PUBLISHING DASHBOARD
               ============================================== */
            <div>
              {/* User Strip & Navigation Tabs */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: '20px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className={`btn ${activeTab === 'manage' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => {
                      sounds.playClick();
                      setActiveTab('manage');
                    }}
                    style={{ padding: '8px 16px', fontSize: '0.88rem' }}
                  >
                    📋 Game Catalog ({games.length})
                  </button>
                  <button
                    className={`btn ${activeTab === 'editor' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={handleOpenCreateForm}
                    style={{ padding: '8px 16px', fontSize: '0.88rem' }}
                  >
                    ➕ Add New Game
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ color: 'var(--brand-mint)', fontSize: '0.82rem', fontWeight: 600 }}>
                    ● Admin: {currentUser?.username || 'admin'}
                  </span>
                  <button
                    className="btn btn-secondary"
                    onClick={handleLogout}
                    style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                  >
                    Log Out
                  </button>
                </div>
              </div>

              {activeTab === 'manage' ? (
                /* ==============================================
                   TAB 1: GAME CATALOG MANAGEMENT TABLE
                   ============================================== */
                <div>
                  {/* Table Controls */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(200px, 1fr) auto auto',
                      gap: '12px',
                      marginBottom: '16px'
                    }}
                  >
                    <input
                      type="text"
                      className="crazy-search-input"
                      placeholder="Search games by title, slug, or genre..."
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      style={{ height: '40px', fontSize: '0.86rem' }}
                    />

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      style={{
                        height: '40px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.14)',
                        borderRadius: '8px',
                        color: '#fff',
                        padding: '0 12px',
                        fontSize: '0.84rem'
                      }}
                    >
                      <option value="all">All Statuses</option>
                      <option value="published">🟢 Published Only</option>
                      <option value="draft">🟡 Drafts Only</option>
                      <option value="bundle">📦 Bundles Only</option>
                      <option value="builtin">⚡ Builtins Only</option>
                    </select>

                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      style={{
                        height: '40px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.14)',
                        borderRadius: '8px',
                        color: '#fff',
                        padding: '0 12px',
                        fontSize: '0.84rem'
                      }}
                    >
                      <option value="all">All Genres</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name.replace(/\(.*\)/, '').trim()}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Games Table */}
                  <div
                    style={{
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      maxHeight: '52vh',
                      overflowY: 'auto'
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                      <thead
                        style={{
                          background: 'rgba(12, 13, 18, 0.95)',
                          position: 'sticky',
                          top: 0,
                          zIndex: 2,
                          color: '#94a3b8'
                        }}
                      >
                        <tr>
                          <th style={{ padding: '12px 14px' }}>Game</th>
                          <th style={{ padding: '12px 14px' }}>Type</th>
                          <th style={{ padding: '12px 14px' }}>Genre</th>
                          <th style={{ padding: '12px 14px' }}>Plays</th>
                          <th style={{ padding: '12px 14px' }}>Status</th>
                          <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableLoading ? (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                              Loading games catalog...
                            </td>
                          </tr>
                        ) : filteredTableGames.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                              No matching games found.
                            </td>
                          </tr>
                        ) : (
                          filteredTableGames.map((g) => (
                            <tr
                              key={g.id}
                              style={{
                                borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                                background: g.status === 'draft' ? 'rgba(234, 179, 8, 0.03)' : 'transparent'
                              }}
                            >
                              <td style={{ padding: '10px 14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div
                                    style={{
                                      width: '36px',
                                      height: '24px',
                                      borderRadius: '4px',
                                      overflow: 'hidden',
                                      background: '#1a1c23',
                                      flexShrink: 0
                                    }}
                                    dangerouslySetInnerHTML={{ __html: getGameThumbnailSVG(g) }}
                                  />
                                  <div>
                                    <div style={{ color: '#fff', fontWeight: 600 }}>{g.title}</div>
                                    <div style={{ color: '#64748b', fontSize: '0.74rem' }}>/{g.slug}</div>
                                  </div>
                                </div>
                              </td>

                              <td style={{ padding: '10px 14px' }}>
                                <span
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    background:
                                      g.game_type === 'bundle'
                                        ? 'rgba(0, 229, 255, 0.12)'
                                        : g.game_type === 'external'
                                        ? 'rgba(168, 85, 247, 0.12)'
                                        : 'rgba(45, 212, 191, 0.12)',
                                    color:
                                      g.game_type === 'bundle'
                                        ? '#00e5ff'
                                        : g.game_type === 'external'
                                        ? '#c084fc'
                                        : 'var(--brand-mint)'
                                  }}
                                >
                                  {g.game_type.toUpperCase()}
                                </span>
                              </td>

                              <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>
                                {g.category}
                              </td>

                              <td style={{ padding: '10px 14px', color: '#ffd166', fontWeight: 600 }}>
                                {(g.plays || 0).toLocaleString()}
                              </td>

                              <td style={{ padding: '10px 14px' }}>
                                <span
                                  style={{
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    background:
                                      g.status === 'published'
                                        ? 'rgba(16, 185, 129, 0.15)'
                                        : 'rgba(234, 179, 8, 0.15)',
                                    color: g.status === 'published' ? '#34d399' : '#facc15'
                                  }}
                                >
                                  {g.status === 'published' ? '🟢 Live' : '🟡 Draft'}
                                </span>
                              </td>

                              <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                  {/* Test Preview Action */}
                                  <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                      sounds.playClick();
                                      if (typeof onPreviewGame === 'function') {
                                        onPreviewGame(g);
                                      } else {
                                        window.location.hash = `#game/${g.slug}`;
                                        onClose();
                                      }
                                    }}
                                    title="Play Preview"
                                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                  >
                                    👁️ Preview
                                  </button>

                                  {/* Publish / Unpublish Toggle */}
                                  <button
                                    className="btn btn-secondary"
                                    onClick={() => handleToggleStatus(g)}
                                    title={g.status === 'published' ? 'Unpublish to Draft' : 'Publish to Live'}
                                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                  >
                                    {g.status === 'published' ? 'Unpublish' : 'Publish'}
                                  </button>

                                  {/* Edit Action */}
                                  <button
                                    className="btn btn-secondary"
                                    onClick={() => handleEditGame(g)}
                                    title="Edit Game"
                                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                  >
                                    ✏️ Edit
                                  </button>

                                  {/* Delete Action (Confirm Dialog) */}
                                  <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                      sounds.playClick();
                                      setDeleteConfirmGame(g);
                                    }}
                                    title="Delete Game"
                                    style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#f87171' }}
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Delete Confirmation Modal */}
                  {deleteConfirmGame && (
                    <div
                      style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.75)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1100
                      }}
                    >
                      <div
                        style={{
                          background: '#181a24',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          borderRadius: '12px',
                          padding: '24px',
                          maxWidth: '420px',
                          width: '90%',
                          textAlign: 'center'
                        }}
                      >
                        <span style={{ fontSize: '2rem' }}>⚠️</span>
                        <h4 style={{ color: '#fff', fontSize: '1.1rem', margin: '10px 0 8px' }}>
                          Confirm Deletion
                        </h4>
                        <p style={{ color: '#94a3b8', fontSize: '0.86rem', marginBottom: '20px' }}>
                          Are you sure you want to permanently remove <strong>"{deleteConfirmGame.title}"</strong> from GAMINGZONE?
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <button
                            className="btn btn-secondary"
                            onClick={() => setDeleteConfirmGame(null)}
                          >
                            Cancel
                          </button>
                          <button
                            className="btn btn-primary"
                            onClick={handleDeleteConfirm}
                            style={{ background: '#ef4444' }}
                          >
                            Permanently Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* ==============================================
                   TAB 2: ADD / EDIT GAME COMPLETE FORM
                   ============================================== */
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <h3 style={{ color: '#fff', fontSize: '1.15rem', margin: 0 }}>
                      {editingGameId ? `✏️ Editing Game: "${title}"` : '➕ Publish New Browser Game'}
                    </h3>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setActiveTab('manage')}
                      style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                    >
                      ◀ Back to Catalog
                    </button>
                  </div>

                  <form onSubmit={handleSubmitGame} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {/* Basic Info Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 140px', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.82rem', marginBottom: '4px' }}>
                          Game Title *
                        </label>
                        <input
                          type="text"
                          className="crazy-search-input"
                          placeholder="e.g. Neon Horizon Racer"
                          value={title}
                          onChange={(e) => handleTitleChange(e.target.value)}
                          style={{ width: '100%', height: '42px' }}
                          required
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.82rem', marginBottom: '4px' }}>
                          URL Slug *
                        </label>
                        <input
                          type="text"
                          className="crazy-search-input"
                          placeholder="neon-horizon-racer"
                          value={slug}
                          onChange={(e) => {
                            setSlug(e.target.value);
                            setSlugEditedManually(true);
                          }}
                          style={{ width: '100%', height: '42px' }}
                          required
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.82rem', marginBottom: '4px' }}>
                          Genre *
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          style={{
                            width: '100%',
                            height: '42px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.14)',
                            borderRadius: '8px',
                            color: '#fff',
                            padding: '0 10px',
                            fontSize: '0.84rem'
                          }}
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name.replace(/\(.*\)/, '').trim()}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Description & Tags */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.82rem', marginBottom: '4px' }}>
                          Short Description
                        </label>
                        <textarea
                          className="crazy-search-input"
                          rows={3}
                          placeholder="Exciting 3D racing simulator through neon cyber city tracks..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          style={{ width: '100%', height: '76px', padding: '10px' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.82rem', marginBottom: '4px' }}>
                          Tags (comma separated)
                        </label>
                        <input
                          type="text"
                          className="crazy-search-input"
                          placeholder="racing, 3d, drift, speed, webgl"
                          value={tagsInput}
                          onChange={(e) => setTagsInput(e.target.value)}
                          style={{ width: '100%', height: '42px', marginBottom: '8px' }}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={isFeatured}
                              onChange={(e) => setIsFeatured(e.target.checked)}
                            />
                            ⭐ Featured
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={isTrending}
                              onChange={(e) => setIsTrending(e.target.checked)}
                            />
                            🔥 Trending
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={isNew}
                              onChange={(e) => setIsNew(e.target.checked)}
                            />
                            ✨ New
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Controls & Instructions */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.82rem', marginBottom: '4px' }}>
                          Controls
                        </label>
                        <input
                          type="text"
                          className="crazy-search-input"
                          placeholder="WASD or Arrow keys to steer, Space for handbrake"
                          value={controls}
                          onChange={(e) => setControls(e.target.value)}
                          style={{ width: '100%', height: '42px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.82rem', marginBottom: '4px' }}>
                          Instructions & Objective
                        </label>
                        <input
                          type="text"
                          className="crazy-search-input"
                          placeholder="Reach the finish line within 60 seconds without crashing"
                          value={instructions}
                          onChange={(e) => setInstructions(e.target.value)}
                          style={{ width: '100%', height: '42px' }}
                        />
                      </div>
                    </div>

                    {/* Source Selection (ZIP Bundle vs External URL) */}
                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        padding: '16px'
                      }}
                    >
                      <label style={{ display: 'block', color: '#fff', fontSize: '0.88rem', fontWeight: 600, marginBottom: '10px' }}>
                        Game Source & Build Type
                      </label>
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                        <button
                          type="button"
                          className={`btn ${sourceMode === 'bundle' ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => setSourceMode('bundle')}
                          style={{ flex: 1, padding: '8px' }}
                        >
                          📦 HTML5 ZIP Archive
                        </button>
                        <button
                          type="button"
                          className={`btn ${sourceMode === 'external' ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => setSourceMode('external')}
                          style={{ flex: 1, padding: '8px' }}
                        >
                          🌐 External Game URL
                        </button>
                      </div>

                      {sourceMode === 'bundle' ? (
                        <div>
                          <input
                            type="file"
                            accept=".zip"
                            onChange={(e) => setBundleFile(e.target.files?.[0] || null)}
                            style={{ color: '#94a3b8', fontSize: '0.85rem' }}
                          />
                          <p style={{ color: '#64748b', fontSize: '0.76rem', margin: '6px 0 0' }}>
                            Archive must contain <code>index.html</code>. Safe unpacking with Zip-Slip & malware protection.
                            {editingGameId && ' (Leave empty to keep existing build)'}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="url"
                            className="crazy-search-input"
                            placeholder="https://example.com/games/my-game/index.html"
                            value={externalUrl}
                            onChange={(e) => setExternalUrl(e.target.value)}
                            style={{ width: '100%', height: '42px' }}
                          />
                          <p style={{ color: '#64748b', fontSize: '0.76rem', margin: '6px 0 0' }}>
                            Embedded securely in sandboxed iframe with CSP restrictions.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Media Assets (Cover & Video Preview) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      {/* Cover Image Upload */}
                      <div
                        style={{
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '12px',
                          padding: '14px'
                        }}
                      >
                        <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.82rem', marginBottom: '6px' }}>
                          🖼️ Cover Image (.png, .jpg, .webp, .svg)
                        </label>
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg,.webp,.svg"
                          onChange={handleCoverChange}
                          style={{ color: '#94a3b8', fontSize: '0.82rem', width: '100%' }}
                        />
                        {coverPreview && (
                          <div style={{ marginTop: '10px', height: '60px', width: '100px', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <img src={coverPreview} alt="Cover preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}
                      </div>

                      {/* Video Preview Upload */}
                      <div
                        style={{
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '12px',
                          padding: '14px'
                        }}
                      >
                        <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.82rem', marginBottom: '6px' }}>
                          🎬 Gameplay Hover Video (.mp4, .webm)
                        </label>
                        <input
                          type="file"
                          accept=".mp4,.webm,.ogv"
                          onChange={handleVideoChange}
                          style={{ color: '#94a3b8', fontSize: '0.82rem', width: '100%' }}
                        />
                        {videoPreview && (
                          <div style={{ marginTop: '10px', height: '60px', width: '100px', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <video src={videoPreview} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Publishing Status Toggle */}
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                      <span style={{ color: '#cbd5e1', fontSize: '0.84rem' }}>Publication State:</span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontSize: '0.85rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="statusRadio"
                          value="published"
                          checked={status === 'published'}
                          onChange={() => setStatus('published')}
                        />
                        🟢 Publish Immediately (Visible in live catalog)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#facc15', fontSize: '0.85rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="statusRadio"
                          value="draft"
                          checked={status === 'draft'}
                          onChange={() => setStatus('draft')}
                        />
                        🟡 Save as Draft (Hidden from visitors)
                      </label>
                    </div>

                    {/* Feedback Alert & Progress Bar */}
                    {isSubmitting && (
                      <div>
                        <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${submitProgress}%`,
                              background: 'var(--brand-coral)',
                              transition: 'width 0.3s ease'
                            }}
                          />
                        </div>
                        <p style={{ color: '#94a3b8', fontSize: '0.8rem', textAlign: 'center', marginTop: '6px' }}>
                          Processing game assets and updating database...
                        </p>
                      </div>
                    )}

                    {feedback.message && (
                      <div
                        style={{
                          background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          border: `1px solid ${feedback.type === 'success' ? '#10b981' : '#ef4444'}`,
                          color: feedback.type === 'success' ? '#34d399' : '#f87171',
                          padding: '12px',
                          borderRadius: '8px',
                          fontSize: '0.86rem'
                        }}
                      >
                        {feedback.type === 'success' ? '✅ ' : '⚠️ '}
                        {feedback.message}
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSubmitting}
                      style={{ padding: '14px', fontSize: '1rem', marginTop: '4px' }}
                    >
                      {isSubmitting
                        ? 'Publishing Game Build...'
                        : editingGameId
                        ? '💾 Save Game Changes'
                        : '🚀 Publish Game to GAMINGZONE'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
