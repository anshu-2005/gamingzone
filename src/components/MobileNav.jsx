import React from 'react';
import { sounds } from '../../js/core/soundFX.js';

export function MobileNav({
  activeTab = 'home',
  onSelectTab,
  favoritesCount = 0
}) {
  return (
    <nav className="gz-mobile-bottom-bar" aria-label="Mobile Navigation">
      <button
        className={`gz-mob-btn ${activeTab === 'home' ? 'active' : ''}`}
        onClick={() => {
          sounds.playClick();
          onSelectTab('home');
        }}
      >
        <span className="mob-icon">🏠</span>
        <span className="mob-label">Home</span>
      </button>

      <button
        className={`gz-mob-btn ${activeTab === 'categories' ? 'active' : ''}`}
        onClick={() => {
          sounds.playClick();
          onSelectTab('categories');
        }}
      >
        <span className="mob-icon">🧭</span>
        <span className="mob-label">Categories</span>
      </button>

      <button
        className={`gz-mob-btn ${activeTab === 'search' ? 'active' : ''}`}
        onClick={() => {
          sounds.playClick();
          onSelectTab('search');
        }}
      >
        <span className="mob-icon">🔍</span>
        <span className="mob-label">Search</span>
      </button>

      <button
        className={`gz-mob-btn ${activeTab === 'favorites' ? 'active' : ''}`}
        onClick={() => {
          sounds.playClick();
          onSelectTab('favorites');
        }}
      >
        <span className="mob-icon">❤️</span>
        <span className="mob-label">Favorites</span>
        {favoritesCount > 0 && <span className="mob-badge">{favoritesCount}</span>}
      </button>

      <button
        className={`gz-mob-btn ${activeTab === 'profile' ? 'active' : ''}`}
        onClick={() => {
          sounds.playClick();
          onSelectTab('profile');
        }}
      >
        <span className="mob-icon">👤</span>
        <span className="mob-label">Profile</span>
      </button>
    </nav>
  );
}
