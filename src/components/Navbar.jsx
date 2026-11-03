import React, { useState, useRef, useEffect } from 'react';
import { sounds } from '../../js/core/soundFX.js';
import { getGameThumbnailSVG } from '../../js/utils/gameThumbnails.js';

function DropdownThumb({ game }) {
  const [error, setError] = useState(false);
  const src = game?.thumbnail || (game?.slug ? `/images/games/${game.slug}.webp` : null);

  if (error || !src) {
    return (
      <div
        className="gz-dropdown-item-thumb"
        dangerouslySetInnerHTML={{ __html: getGameThumbnailSVG(game) }}
      />
    );
  }

  return (
    <div className="gz-dropdown-item-thumb">
      <img
        src={src}
        alt={game.title}
        loading="lazy"
        decoding="async"
        onError={() => setError(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }}
      />
    </div>
  );
}

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
  onHomeClick,
  games = [],
  onSelectGame
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchWrapperRef = useRef(null);

  // Filter matching games for autocomplete (up to 6)
  const matchingGames = React.useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return games
      .filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.category?.toLowerCase().includes(q) ||
          (g.tags && g.tags.some((t) => t.toLowerCase().includes(q)))
      )
      .slice(0, 6);
  }, [games, searchQuery]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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

      {/* Center Search Input with Instant Autocomplete Dropdown */}
      <div className="crazy-search-wrapper" ref={searchWrapperRef}>
        <div className="crazy-search-bar">
          <span className="search-lens-icon">🔍</span>
          <input
            type="text"
            className="crazy-search-input"
            placeholder="Search 140+ games, categories, or tags..."
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => {
              if (searchQuery.trim()) setIsDropdownOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsDropdownOpen(false);
              } else if (e.key === 'Enter' && matchingGames.length > 0 && typeof onSelectGame === 'function') {
                setIsDropdownOpen(false);
              }
            }}
            autoComplete="off"
          />
          {searchQuery && (
            <button
              className="btn-search-clear"
              onClick={() => {
                onSearchChange('');
                setIsDropdownOpen(false);
              }}
              title="Clear Search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Live Autocomplete Suggestions Dropdown */}
        {isDropdownOpen && searchQuery.trim().length > 0 && (
          <div className="gz-search-dropdown-menu">
            {matchingGames.length > 0 ? (
              <>
                <div className="gz-dropdown-header">
                  <span>Top Matches ({matchingGames.length})</span>
                  <span className="gz-hint-text">Press Enter for all results</span>
                </div>
                <div className="gz-dropdown-list">
                  {matchingGames.map((game) => (
                    <div
                      key={game.id}
                      className="gz-dropdown-item"
                      onClick={() => {
                        sounds.playClick();
                        setIsDropdownOpen(false);
                        if (typeof onSelectGame === 'function') {
                          onSelectGame(game);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <DropdownThumb game={game} />
                      <div className="gz-dropdown-item-info">
                        <div className="gz-dropdown-item-title">{game.title}</div>
                        <div className="gz-dropdown-item-meta">
                          <span className="gz-item-cat">{game.category || 'Arcade'}</span>
                          <span className="gz-item-plays">{(game.plays || 1200).toLocaleString()} plays</span>
                        </div>
                      </div>
                      <span className="gz-dropdown-play-icon">▶</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="gz-dropdown-empty">
                <span>No games found for "{searchQuery}"</span>
              </div>
            )}
          </div>
        )}
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
          className="btn-header-icon btn-header-admin-subtle"
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
