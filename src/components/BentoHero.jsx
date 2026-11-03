import React from 'react';
import { sounds } from '../../js/core/soundFX.js';
import { getGameThumbnailSVG } from '../../js/utils/gameThumbnails.js';

export function BentoHero({ games, onSelectGame }) {
  if (!games || games.length === 0) return null;

  // Select top featured candidates
  const mainSpotlight =
    games.find((g) => g.slug === 'arrow-maze-puzzle' || g.slug === 'mario-html5' || g.featured) ||
    games[0];

  const secondaryCandidates = games
    .filter((g) => g.id !== mainSpotlight.id)
    .filter((g) => g.featured || g.plays > 25000 || g.is_new)
    .slice(0, 4);

  // Fallback to first 4 if needed
  const secondaryList =
    secondaryCandidates.length >= 4
      ? secondaryCandidates
      : games.filter((g) => g.id !== mainSpotlight.id).slice(0, 4);

  return (
    <section className="gz-bento-hero-section" aria-label="Featured & Trending Games">
      <div className="gz-bento-container">
        {/* Left Column: Big Spotlight Card */}
        <div
          className="gz-bento-spotlight"
          onClick={() => {
            sounds.playClick();
            onSelectGame(mainSpotlight);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              sounds.playClick();
              onSelectGame(mainSpotlight);
            }
          }}
        >
          <div
            className="gz-bento-spotlight-art"
            dangerouslySetInnerHTML={{ __html: getGameThumbnailSVG(mainSpotlight) }}
          />
          <div className="gz-bento-spotlight-overlay">
            <div className="gz-bento-tag-row">
              <span className="gz-bento-badge-live">
                <span className="live-pulse-dot" />
                🔥 #1 TRENDING SPOTLIGHT
              </span>
              <span className="gz-bento-plays">
                {(mainSpotlight.plays || 89000).toLocaleString()} plays
              </span>
            </div>

            <h2 className="gz-bento-spotlight-title">{mainSpotlight.title}</h2>
            <p className="gz-bento-spotlight-desc">
              {mainSpotlight.description ||
                'Jump directly into high-octane instant browser action. Zero downloads, zero wait time.'}
            </p>

            <div className="gz-bento-bottom-row">
              <button className="gz-bento-play-cta">
                <span>Play Now</span>
                <span className="play-arrow">➔</span>
              </button>
              <div className="gz-bento-meta-pills">
                <span className="gz-meta-pill genre">{mainSpotlight.category?.toUpperCase() || 'ACTION'}</span>
                <span className="gz-meta-pill rating">⭐ {mainSpotlight.rating || '4.9'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: 2x2 Bento Tiles */}
        <div className="gz-bento-grid-quad">
          {secondaryList.map((game, idx) => {
            const badgeTag =
              idx === 0
                ? '⚡ POPULAR'
                : idx === 1
                ? '🏎️ 3D SPEED'
                : idx === 2
                ? '⚔️ RTS STRATEGY'
                : '✨ NEW HIT';

            return (
              <div
                key={game.id}
                className="gz-bento-tile"
                onClick={() => {
                  sounds.playClick();
                  onSelectGame(game);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    sounds.playClick();
                    onSelectGame(game);
                  }
                }}
              >
                <div
                  className="gz-bento-tile-art"
                  dangerouslySetInnerHTML={{ __html: getGameThumbnailSVG(game) }}
                />
                <div className="gz-bento-tile-overlay">
                  <div className="gz-bento-tile-top">
                    <span className="gz-bento-tile-badge">{badgeTag}</span>
                    <span className="gz-bento-tile-rating">⭐ {game.rating || '4.8'}</span>
                  </div>
                  <div className="gz-bento-tile-bottom">
                    <h3 className="gz-bento-tile-title">{game.title}</h3>
                    <div className="gz-bento-tile-sub">
                      <span className="tile-category">{game.category || 'Arcade'}</span>
                      <span className="tile-play-btn">Play ➔</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
