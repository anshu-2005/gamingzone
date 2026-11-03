import React, { useState, useEffect } from 'react';
import { sounds } from '../../js/core/soundFX.js';
import { getGameThumbnailSVG } from '../../js/utils/gameThumbnails.js';

function BentoArtwork({ game, className, altText }) {
  const [error, setError] = useState(false);

  const isValidThumbnail =
    typeof game?.thumbnail === 'string' &&
    game.thumbnail.length > 4 &&
    (game.thumbnail.startsWith('/') ||
     game.thumbnail.startsWith('http://') ||
     game.thumbnail.startsWith('https://') ||
     game.thumbnail.startsWith('data:image/'));

  const canonicalWebp = game?.slug ? `/images/games/${game.slug}.webp` : null;
  const initialSrc = isValidThumbnail ? game.thumbnail : canonicalWebp;
  const [currentSrc, setCurrentSrc] = useState(initialSrc);

  useEffect(() => {
    const nextSrc = isValidThumbnail ? game.thumbnail : canonicalWebp;
    setCurrentSrc(nextSrc);
    setError(false);
  }, [game?.id, game?.slug, game?.thumbnail]);

  const handleImgError = () => {
    if (currentSrc !== canonicalWebp && canonicalWebp) {
      setCurrentSrc(canonicalWebp);
    } else {
      setError(true);
    }
  };

  if (error || !currentSrc) {
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: getGameThumbnailSVG(game) }}
      />
    );
  }

  return (
    <div className={className}>
      <img
        src={currentSrc}
        alt={altText || game?.imageAlt || game?.title || 'Featured Game'}
        loading="lazy"
        decoding="async"
        onError={handleImgError}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </div>
  );
}

export function BentoHero({ games, onSelectGame }) {
  if (!games || games.length === 0) return null;

  // Select top featured candidates
  const mainSpotlight =
    games.find((g) => g.slug === 'arrow-maze-escape-tangled-puzzle' || g.slug === 'mario-bros-infinite' || g.featured || g.is_featured) ||
    games[0];

  const secondaryCandidates = games
    .filter((g) => g.id !== mainSpotlight.id)
    .filter((g) => g.featured || g.is_featured || g.plays > 25000 || g.is_new)
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
          <BentoArtwork
            game={mainSpotlight}
            className="gz-bento-spotlight-art"
            altText={`#1 Trending: ${mainSpotlight.title}`}
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
                <BentoArtwork
                  game={game}
                  className="gz-bento-tile-art"
                  altText={game.title}
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
