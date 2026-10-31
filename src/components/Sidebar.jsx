import React from 'react';
import { sounds } from '../../js/core/soundFX.js';
import { CATEGORIES } from '../../js/data/gamesRegistry.js';

export function Sidebar({
  isOpen,
  isCollapsed,
  currentCategory,
  onSelectCategory,
  onCloseMobile
}) {
  const sidebarClasses = [
    'crazy-sidebar',
    isOpen ? 'open' : '',
    isCollapsed ? 'collapsed' : ''
  ].filter(Boolean).join(' ');

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-backdrop active"
          onClick={onCloseMobile}
        />
      )}

      <aside className={sidebarClasses}>
        <nav className="sidebar-nav-list">
          <div className="sidebar-divider">DISCOVER</div>
          <a
            href="#home"
            className={`sidebar-item ${currentCategory === 'all' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              sounds.playClick();
              onSelectCategory('all');
            }}
          >
            <span className="nav-icon">🔥</span>
            <span className="nav-label">All Games</span>
          </a>

          <a
            href="#trending"
            className={`sidebar-item ${currentCategory === 'trending' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              sounds.playClick();
              onSelectCategory('trending');
            }}
          >
            <span className="nav-icon">⚡</span>
            <span className="nav-label">Trending Now</span>
          </a>

          <a
            href="#recent"
            className={`sidebar-item ${currentCategory === 'recent' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              sounds.playClick();
              onSelectCategory('recent');
            }}
          >
            <span className="nav-icon">🕒</span>
            <span className="nav-label">Recently Played</span>
          </a>

          <a
            href="#favorites"
            className={`sidebar-item ${currentCategory === 'favorites' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              sounds.playClick();
              onSelectCategory('favorites');
            }}
          >
            <span className="nav-icon">❤️</span>
            <span className="nav-label">Favorites</span>
          </a>

          {/* Categories Group */}
          <div className="sidebar-divider" style={{ marginTop: '16px' }}>GENRES & ARENAS</div>
          {CATEGORIES.filter(c => c.id !== 'all' && c.id !== 'trending' && c.id !== 'favorites').map((cat) => (
            <a
              key={cat.id}
              href={`#category/${cat.id}`}
              className={`sidebar-item ${currentCategory === cat.id ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                sounds.playClick();
                onSelectCategory(cat.id);
              }}
            >
              <span className="nav-icon">{cat.icon}</span>
              <span className="nav-label">{cat.name.replace(/\(.*\)/, '').trim()}</span>
            </a>
          ))}
        </nav>
      </aside>
    </>
  );
}
