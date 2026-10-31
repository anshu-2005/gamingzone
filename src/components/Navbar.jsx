import React from 'react';
import { sounds } from '../../js/core/soundFX.js';

export function Navbar({
  searchQuery,
  onSearchChange,
  onToggleSidebar,
  onRandomGame,
  onOpenProfile,
  onOpenAdmin,
  profile,
  isMuted,
  onToggleMute,
  onHomeClick
}) {
  return (
    <header className="crazy-top-header">
      <div className="header-left-zone">
        <button
          className="btn-sidebar-toggle"
          onClick={() => {
            sounds.playClick();
            onToggleSidebar();
          }}
          title="Toggle Sidebar"
          aria-label="Toggle Navigation"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <a
          href="#home"
          className="crazy-brand-logo"
          onClick={(e) => {
            e.preventDefault();
            sounds.playClick();
            onHomeClick();
          }}
        >
          <div className="brand-logo-icon">G</div>
          <span className="brand-logo-text">GAMING<span>ZONE</span></span>
        </a>
      </div>

      {/* Center Search Input */}
      <div className="crazy-search-wrapper">
        <div className="crazy-search-bar">
          <span className="search-lens-icon">🔍</span>
          <input
            type="text"
            className="crazy-search-input"
            placeholder="Search 65+ games, tags, and genres..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            autoComplete="off"
          />
          {searchQuery && (
            <button
              className="btn-search-clear"
              onClick={() => onSearchChange('')}
              title="Clear Search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Right Action Icons */}
      <div className="header-right-zone">
        <button
          className="btn-surprise-me"
          onClick={() => {
            sounds.playClick();
            onRandomGame();
          }}
          title="Surprise Me! (Random Game)"
        >
          <span>🎲</span>
          <span className="surprise-text">Surprise Me</span>
        </button>

        <button
          className="btn-header-icon"
          onClick={() => {
            onToggleMute();
          }}
          title={isMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
        >
          <span>{isMuted ? '🔇' : '🔊'}</span>
        </button>

        {/* Player Profile Strip */}
        <div
          className="header-profile-strip"
          onClick={() => {
            sounds.playClick();
            onOpenProfile();
          }}
          title="View Player Profile & Achievements"
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span style={{ fontSize: '1.25rem' }}>{profile?.avatar || '🥷'}</span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.86rem', display: 'inline-block', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {profile?.name || 'Player'}
          </span>
          <span style={{ color: '#ffd166', fontWeight: 800, fontSize: '0.84rem' }}>{(profile?.coins || 0).toLocaleString()} 🪙</span>
          <span style={{
            background: 'rgba(0, 229, 255, 0.15)',
            color: '#00e5ff',
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontWeight: 800,
            border: '1px solid rgba(0, 229, 255, 0.3)'
          }}>
            LVL {profile?.level || 1}
          </span>
        </div>

        {/* Admin Login Subtle Icon */}
        <button
          className="btn-header-admin-subtle"
          onClick={() => {
            sounds.playClick();
            onOpenAdmin();
          }}
          title="Admin Dashboard Portal"
        >
          <span>⚙️</span>
        </button>
      </div>
    </header>
  );
}

