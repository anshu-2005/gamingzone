import React, { useRef } from 'react';
import { GameCard } from './GameCard.jsx';
import { sounds } from '../../js/core/soundFX.js';

export function GameShelf({
  title,
  subtitle,
  games,
  onSelectGame,
  favorites,
  onToggleFavorite
}) {
  const trackRef = useRef(null);

  const scroll = (direction) => {
    sounds.playClick();
    if (trackRef.current) {
      const offset = direction === 'left' ? -380 : 380;
      trackRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  if (!games || games.length === 0) return null;

  return (
    <section className="shelf-section">
      <div className="shelf-header-row">
        <div>
          <h2 className="shelf-title">{title}</h2>
          {subtitle && <p className="shelf-subtitle">{subtitle}</p>}
        </div>
      </div>

      <div className="shelf-track-wrapper">
        <button
          className="shelf-nav-btn prev"
          onClick={() => scroll('left')}
          title="Scroll Left"
          aria-label="Previous Games"
        >
          ◀
        </button>

        <div className="shelf-carousel-track" ref={trackRef}>
          {games.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onSelect={onSelectGame}
              isFavorite={favorites.includes(game.id)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>

        <button
          className="shelf-nav-btn next"
          onClick={() => scroll('right')}
          title="Scroll Right"
          aria-label="Next Games"
        >
          ▶
        </button>
      </div>
    </section>
  );
}

