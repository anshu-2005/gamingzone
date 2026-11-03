import React, { useState, useRef, useEffect } from 'react';
import { sounds } from '../../js/core/soundFX.js';
import { getGameThumbnailSVG } from '../../js/utils/gameThumbnails.js';
import { getGamePreviewMeta } from '../../js/data/previewManifest.js';

export function GameCard({
  game,
  onSelect,
  isFavorite,
  onToggleFavorite
}) {
  const cardRef = useRef(null);
  const hoverTimerRef = useRef(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [tiltStyle, setTiltStyle] = useState({});
  const [glareStyle, setGlareStyle] = useState({ opacity: 0 });

  // Thumbnail URL resolution & validation
  const isValidThumbnail =
    typeof game?.thumbnail === 'string' &&
    game.thumbnail.length > 4 &&
    (game.thumbnail.startsWith('/') ||
     game.thumbnail.startsWith('http://') ||
     game.thumbnail.startsWith('https://') ||
     game.thumbnail.startsWith('data:image/'));

  const canonicalWebp = game?.slug ? `/images/games/${game.slug}.webp` : '';
  const initialSrc = isValidThumbnail ? game.thumbnail : canonicalWebp;

  const [currentSrc, setCurrentSrc] = useState(initialSrc);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Sync state when game data or thumbnail changes (e.g. after API fetch)
  useEffect(() => {
    const nextSrc = isValidThumbnail ? game.thumbnail : canonicalWebp;
    setCurrentSrc(nextSrc);
    setImgError(false);
  }, [game?.id, game?.thumbnail, game?.slug]);

  const handleImgError = () => {
    // If a custom or external thumbnail fails, fallback to canonical local webp once
    if (currentSrc !== canonicalWebp && canonicalWebp) {
      setCurrentSrc(canonicalWebp);
    } else {
      setImgError(true);
    }
  };

  const previewMeta = getGamePreviewMeta(game);
  const activePreviewVideo = game?.preview_video || (previewMeta?.hasPreview ? previewMeta.previewVideo : null);

  // 3D Perspective Tilt & Glare Math
  const handleMouseMove = (e) => {
    if (!cardRef.current || window.innerWidth <= 768) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;

    const maxTilt = 10;
    const rotX = -y * maxTilt;
    const rotY = x * maxTilt;

    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.035, 1.035, 1.035)`
    });

    const glareX = ((e.clientX - rect.left) / rect.width) * 100;
    const glareY = ((e.clientY - rect.top) / rect.height) * 100;
    setGlareStyle({
      opacity: 1,
      background: `radial-gradient(circle at ${glareX.toFixed(1)}% ${glareY.toFixed(1)}%, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.05) 45%, transparent 70%)`
    });
  };

  const handleMouseEnter = () => {
    // 280ms debounce for gameplay video preview
    if (activePreviewVideo) {
      hoverTimerRef.current = setTimeout(() => {
        setIsVideoPlaying(true);
      }, 280);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setIsVideoPlaying(false);
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.45s ease'
    });
    setGlareStyle({ opacity: 0 });
    setTimeout(() => {
      setTiltStyle({});
    }, 450);
  };

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  // Badges
  let badgeText = null;
  let badgeClass = null;
  if (game?.featured || game?.is_featured) {
    badgeText = '⭐ Featured';
    badgeClass = 'badge-featured';
  } else if (game?.tags?.includes('new') || game?.is_new) {
    badgeText = '✨ New';
    badgeClass = 'badge-new';
  } else if (game?.plays > 35000 || game?.tags?.includes('trending') || game?.is_trending) {
    badgeText = '🔥 Hot';
    badgeClass = 'badge-trending';
  }

  return (
    <article
      ref={cardRef}
      className={`game-card-item gz-game-card ${isVideoPlaying ? 'preview-active' : ''}`}
      style={tiltStyle}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => {
        sounds.playClick();
        onSelect(game);
      }}
      tabIndex={0}
      role="button"
      aria-label={`Play ${game?.title || 'Game'}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          sounds.playClick();
          onSelect(game);
        }
      }}
    >
      {/* Dynamic Specular Surface Glare */}
      <div className="gz-spatial-glare" style={glareStyle} />

      <div className="card-thumbnail-box gz-card-thumbnail">
        {/* Skeleton Shimmer Loading Placeholder */}
        {!imgLoaded && !imgError && (
          <div className="gz-card-skeleton" aria-hidden="true" />
        )}

        {/* Primary Artwork: Authentic Landscape WebP Artwork with SVG Fallback */}
        {!imgError && currentSrc ? (
          <img
            src={currentSrc}
            alt={game?.imageAlt || `${game?.title || 'Game'} - Free Online Game`}
            loading="lazy"
            decoding="async"
            className={`gz-card-img ${imgLoaded ? 'loaded' : ''}`}
            style={{
              opacity: isVideoPlaying ? 0 : imgLoaded ? 1 : 0,
              visibility: isVideoPlaying ? 'hidden' : 'visible'
            }}
            onLoad={() => setImgLoaded(true)}
            onError={handleImgError}
          />
        ) : (
          <div
            className="gz-card-cover-art"
            style={{ opacity: isVideoPlaying ? 0 : 1 }}
            dangerouslySetInnerHTML={{ __html: getGameThumbnailSVG(game) }}
          />
        )}

        {/* Inline Gameplay Video Slot */}
        {activePreviewVideo && isVideoPlaying && (
          <div className="gz-card-video-slot">
            <video
              className="gz-preview-video"
              src={activePreviewVideo}
              autoPlay
              muted
              loop
              playsInline
              style={{ opacity: 1 }}
            />
          </div>
        )}

        {/* Badges */}
        {badgeText && (
          <span className={`gz-card-badge ${badgeClass}`}>{badgeText}</span>
        )}

        {/* Video Preview Indicator */}
        {previewMeta?.hasPreview && !isVideoPlaying && (
          <div className="gz-preview-pill" title="Hover for gameplay video preview">
            <span className="preview-dot" />
            <span className="preview-text">Preview</span>
          </div>
        )}

        {/* Subtle Play Overlay with Icon */}
        <div className="card-hover-overlay gz-hover-overlay">
          <span className="btn-hover-play" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </span>
        </div>
      </div>

      {/* Favorite Toggle Button */}
      <button
        className={`btn-card-fav ${isFavorite ? 'active' : ''}`}
        title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
        aria-label={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
        onClick={(e) => {
          e.stopPropagation();
          sounds.playClick();
          onToggleFavorite(game?.id);
        }}
      >
        <span>{isFavorite ? '❤️' : '🤍'}</span>
      </button>

      {/* Card Info Box */}
      <div className="card-info-box gz-card-meta">
        <h4 className="card-title gz-card-title">{game?.title}</h4>
        <div className="card-meta-row">
          <span className="genre-badge">{game?.category || 'Arcade'}</span>
          <span className="card-plays-text">{(game?.plays || 1200).toLocaleString()} plays</span>
        </div>
      </div>
    </article>
  );
}
