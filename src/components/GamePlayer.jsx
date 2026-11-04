import React, { useState, useEffect, useRef } from 'react';
import { useGameEngine } from '../hooks/useGameEngine.js';
import { sounds } from '../../js/core/soundFX.js';
import { GameShelf } from './GameShelf.jsx';

export function GamePlayer({
  game,
  onBack,
  onSelectRelated,
  relatedGames,
  isFavorite,
  onToggleFavorite,
  onRecordScore,
  profile
}) {
  const [isPaused, setIsPaused] = useState(false);
  const [resultData, setResultData] = useState(null); // { score, isVictory }
  const [isMuted, setIsMuted] = useState(sounds.muted);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFallbackFullscreen, setIsFallbackFullscreen] = useState(false);
  const [showFsHud, setShowFsHud] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [submittedScore, setSubmittedScore] = useState(null);
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState('all');
  const [iframeKey, setIframeKey] = useState(0);
  const viewportRef = useRef(null);
  const iframeRef = useRef(null);
  const hudTimerRef = useRef(null);

  const isBundle = game.game_type === 'bundle' || game.game_type === 'external' || Boolean(game.bundle_url || game.bundleUrl || game.external_url);

  // Fetch leaderboard data
  const fetchLeaderboard = (gameId) => {
    if (!gameId) return;
    setLeaderboardLoading(true);
    fetch(`/api/leaderboards/${gameId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.leaderboard)) {
          setLeaderboard(d.leaderboard);
        }
      })
      .catch((err) => {
        console.warn('Leaderboard fetch failed:', err);
      })
      .finally(() => {
        setLeaderboardLoading(false);
      });
  };

  useEffect(() => {
    fetchLeaderboard(game.id);
  }, [game.id]);

  // Dynamic SEO Structured Data (JSON-LD) for Google Rich Snippets
  useEffect(() => {
    if (!game) return;
    const gameUrl = `https://game-ten-iota-67.vercel.app/#game/${game.id}`;
    const schemaScriptId = 'game-jsonld-schema';

    let scriptTag = document.getElementById(schemaScriptId);
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = schemaScriptId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    const structuredData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://game-ten-iota-67.vercel.app/"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": game.category || "Games",
              "item": `https://game-ten-iota-67.vercel.app/#category/${encodeURIComponent((game.category || 'arcade').toLowerCase())}`
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": game.title,
              "item": gameUrl
            }
          ]
        },
        {
          "@type": "VideoGame",
          "@id": gameUrl,
          "name": game.title,
          "description": game.description || `Play ${game.title} free online on GamingZone with no download needed.`,
          "url": gameUrl,
          "genre": [game.category || "Online Game", "Browser Game", "HTML5 Game"],
          "gamePlatform": ["Web Browser", "Desktop", "Mobile", "Tablet"],
          "applicationCategory": "Game",
          "operatingSystem": "Any modern web browser",
          "inLanguage": "en",
          "isAccessibleForFree": true,
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock"
          },
          "publisher": {
            "@type": "Organization",
            "name": "GamingZone",
            "url": "https://game-ten-iota-67.vercel.app"
          }
        }
      ]
    };

    scriptTag.textContent = JSON.stringify(structuredData);

    return () => {
      const existing = document.getElementById(schemaScriptId);
      if (existing) existing.remove();
    };
  }, [game]);

  const handleGameOver = (score, extra) => {
    const finalScore = typeof score === 'object' && score !== null ? (score.score || 0) : Number(score) || 0;
    const isVictory = extra?.isVictory || finalScore > 0;
    setResultData({ score: finalScore, isVictory });
    if (typeof onRecordScore === 'function') {
      onRecordScore(game.id, finalScore);
    }

    // Auto submit to leaderboard if score > 0
    if (finalScore > 0) {
      submitScoreToLeaderboard(finalScore);
    }
  };

  const submitScoreToLeaderboard = (score) => {
    const playerName = profile?.name || 'Player';
    const avatar = profile?.avatar || '🥷';
    const playerId = profile?.id || 'guest_' + (localStorage.getItem('gz_player_guest_id') || 'local');

    fetch(`/api/leaderboards/${game.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId,
        playerName,
        avatar,
        score,
        timeSeconds: 0
      })
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setSubmittedScore(score);
          fetchLeaderboard(game.id);
        }
      })
      .catch((err) => console.warn('Score submission error:', err));
  };

  const {
    mountRef,
    loading,
    error,
    pause,
    resume,
    restart
  } = useGameEngine(isBundle ? null : game.engine, handleGameOver);

  const handleTogglePause = () => {
    sounds.playClick();
    if (isPaused) {
      resume();
      setIsPaused(false);
    } else {
      pause();
      setIsPaused(true);
    }
  };

  const handleRestart = () => {
    sounds.playClick();
    setResultData(null);
    setIsPaused(false);
    if (isBundle) {
      setIframeKey((prev) => prev + 1);
    } else {
      restart();
    }
  };

  // Cross-browser Fullscreen Change & ESC key listener
  useEffect(() => {
    const onFullscreenChange = () => {
      const fsElement =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;

      const active = Boolean(
        fsElement &&
          (fsElement === viewportRef.current || viewportRef.current?.contains(fsElement))
      );
      setIsFullscreen(active);
      if (!active) {
        setIsFallbackFullscreen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (isFallbackFullscreen) {
          setIsFallbackFullscreen(false);
        }
      }
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('mozfullscreenchange', onFullscreenChange);
    document.addEventListener('MSFullscreenChange', onFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      document.removeEventListener('mozfullscreenchange', onFullscreenChange);
      document.removeEventListener('MSFullscreenChange', onFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
      if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
    };
  }, [isFallbackFullscreen]);

  // Autofocus game on fullscreen entry so keys immediately work
  useEffect(() => {
    if (isFullscreen || isFallbackFullscreen) {
      setShowFsHud(true);
      resetHudTimer();
      setTimeout(() => {
        const target =
          iframeRef.current ||
          mountRef.current?.querySelector('canvas') ||
          viewportRef.current;
        target?.focus?.();
      }, 100);
    }
  }, [isFullscreen, isFallbackFullscreen]);

  const resetHudTimer = () => {
    setShowFsHud(true);
    if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
    hudTimerRef.current = setTimeout(() => {
      setShowFsHud(false);
    }, 2800);
  };

  const handleToggleFullscreen = () => {
    sounds.playClick();
    const isCurrentlyFs = isFullscreen || isFallbackFullscreen;

    if (!isCurrentlyFs) {
      const elem = viewportRef.current;
      if (!elem) return;

      const requestMethod =
        elem.requestFullscreen ||
        elem.webkitRequestFullscreen ||
        elem.mozRequestFullScreen ||
        elem.msRequestFullscreen;

      if (requestMethod) {
        requestMethod.call(elem).catch((err) => {
          console.warn('Native requestFullscreen denied or unavailable, activating pure viewport mode:', err);
          setIsFallbackFullscreen(true);
        });
      } else {
        setIsFallbackFullscreen(true);
      }
    } else {
      if (isFallbackFullscreen) {
        setIsFallbackFullscreen(false);
      } else {
        const exitMethod =
          document.exitFullscreen ||
          document.webkitExitFullscreen ||
          document.mozCancelFullScreen ||
          document.msExitFullscreen;

        if (exitMethod) {
          exitMethod.call(document).catch((err) => console.warn('Exit fullscreen error:', err));
        }
      }
    }
  };

  const handleToggleTheater = () => {
    sounds.playClick();
    setIsTheaterMode(!isTheaterMode);
  };

  const handleShare = () => {
    sounds.playClick();
    navigator.clipboard?.writeText?.(window.location.href);
    alert('Game link copied to clipboard!');
  };

  const handleToggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  // Safe iframe auto-theme, social cleaner, and canvas centering
  const handleIframeLoad = (e) => {
    try {
      const iframe = e.target;
      const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
      if (doc) {
        doc.documentElement.style.backgroundColor = '#030712';
        doc.body.style.backgroundColor = '#030712';
        doc.body.style.margin = '0';
        doc.body.style.padding = '0';

        // Strip any third-party social / promotional / blog elements
        const socialSelectors = [
          'a[href*="twitter.com"]', 'a[href*="x.com"]',
          'a[href*="facebook.com"]', 'a[href*="fb.com"]',
          '.twitter-share-button', '.twitter-follow-button',
          '.fb-like', '.share_box', '.nav', '#tip', '#socialbadges',
          'img[alt*="Fork me"]', 'img[src*="github/ribbons"]', '.chromeWebstoreInstall'
        ];
        socialSelectors.forEach((sel) => {
          doc.querySelectorAll(sel).forEach((el) => {
            el.style.setProperty('display', 'none', 'important');
          });
        });

        const stage = doc.getElementById('stage') || doc.getElementById('game') || doc.getElementById('screen');
        if (stage) {
          stage.style.margin = '0 auto';
        }

        const canvas = doc.querySelector('canvas');
        if (canvas && canvas.parentElement === doc.body) {
          doc.documentElement.style.height = '100%';
          doc.body.style.height = '100%';
          doc.body.style.display = 'flex';
          doc.body.style.flexDirection = 'column';
          doc.body.style.justifyContent = 'center';
          doc.body.style.alignItems = 'center';
          doc.body.style.overflow = 'hidden';
          canvas.style.maxWidth = '100vw';
          canvas.style.maxHeight = '100vh';
          canvas.style.objectFit = 'contain';
          canvas.style.margin = 'auto';
        }
      }
    } catch (_) {
      // Cross-origin iframe if any
    }
  };

  return (
    <div className={`game-shell-container ${isTheaterMode ? 'theater-layout-active' : ''}`}>
      {/* Top Header Bar */}
      <header className="game-shell-header">
        <div className="header-left">
          <button
            className="btn btn-secondary btn-back-games"
            onClick={() => {
              sounds.playClick();
              onBack();
            }}
            title="Back to All Games"
          >
            <span>◀ All Games</span>
          </button>
          <div className="game-identity">
            <nav aria-label="Breadcrumb" className="gz-breadcrumb-nav" style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <a href="#all" onClick={(e) => { e.preventDefault(); onBack(); }} style={{ color: '#38bdf8', textDecoration: 'none' }}>Home</a>
              <span>/</span>
              <a href={`#category/${encodeURIComponent((game.category || 'arcade').toLowerCase())}`} onClick={(e) => { e.preventDefault(); onBack(); }} style={{ color: '#94a3b8', textDecoration: 'none' }}>{game.category || 'Arcade'}</a>
              <span>/</span>
              <span style={{ color: '#f8fafc', fontWeight: 600 }}>{game.title}</span>
            </nav>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 className="game-title-text" style={{ fontSize: '1.28rem', margin: 0, fontWeight: 800 }}>{game.title}</h1>
              <span className="genre-badge">{game.category}</span>
            </div>
          </div>
        </div>

        <div className="header-right">
          <button
            className={`btn-icon ${isTheaterMode ? 'active' : ''}`}
            onClick={handleToggleTheater}
            title={isTheaterMode ? 'Exit Cinema / Theater Mode' : 'Cinema / Theater Mode (Wide Display)'}
          >
            <span>{isTheaterMode ? '🔲 Standard' : '🎦 Theater'}</span>
          </button>
          <button className="btn-icon" onClick={handleRestart} title="Reload / Restart Game">
            <span>🔄 Reload</span>
          </button>
          <button className="btn-icon" onClick={handleShare} title="Share Game Link">
            <span>🔗</span>
          </button>
          <button
            className={`btn-icon ${isFavorite ? 'active' : ''}`}
            onClick={() => onToggleFavorite(game.id)}
            title="Favorite"
          >
            <span>{isFavorite ? '❤️' : '🤍'}</span>
          </button>
          <button className="btn-icon" onClick={handleToggleSound} title="Toggle Sound">
            <span>{isMuted ? '🔇' : '🔊'}</span>
          </button>
          {!isBundle && (
            <button className="btn-icon" onClick={handleTogglePause} title="Pause Game">
              <span>{isPaused ? '▶️' : '⏸️'}</span>
            </button>
          )}
          {(game.external_url || game.game_type === 'external') && (
            <a
              href={game.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-icon"
              title="Open Game in New Tab"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
            >
              <span>↗️</span>
            </a>
          )}
          <button
            className={`btn-icon ${isFullscreen || isFallbackFullscreen ? 'active' : ''}`}
            onClick={handleToggleFullscreen}
            title={isFullscreen || isFallbackFullscreen ? 'Exit Fullscreen (ESC)' : 'Expand to Fullscreen (Press ESC to exit)'}
            style={{ fontWeight: 700 }}
          >
            <span>{isFullscreen || isFallbackFullscreen ? '🗗 Exit' : '⛶ Fullscreen'}</span>
          </button>
        </div>
      </header>

      {/* Main Viewport Stage with Ambient Backlight Glow */}
      <div
        className={`game-stage-viewport ${isTheaterMode ? 'theater-viewport' : ''} ${
          isFullscreen ? 'gz-fullscreen-active' : ''
        } ${isFallbackFullscreen ? 'gz-viewport-fullscreen-fallback' : ''}`}
        ref={viewportRef}
        tabIndex={0}
        onMouseMove={resetHudTimer}
        onTouchStart={resetHudTimer}
      >
        {(isFullscreen || isFallbackFullscreen) && (
          <div className={`gz-fullscreen-hud ${showFsHud ? 'show-hud' : ''}`}>
            <span className="gz-fs-title-pill">🎮 {game.title}</span>
            <button
              className="btn-icon"
              onClick={handleToggleSound}
              title="Toggle Sound"
              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
            >
              <span>{isMuted ? '🔇' : '🔊'}</span>
            </button>
            <button
              className="btn-fs-exit"
              onClick={handleToggleFullscreen}
              title="Exit Fullscreen (ESC)"
            >
              <span>✕ Exit (ESC)</span>
            </button>
          </div>
        )}

        {isBundle ? (
          <iframe
            ref={iframeRef}
            key={iframeKey}
            src={game.game_type === 'external' ? (game.external_url || game.externalUrl) : (game.bundle_url || game.bundleUrl || game.external_url)}
            className="game-bundle-iframe"
            title={game.title}
            sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals"
            allow="fullscreen; autoplay; gamepad; clipboard-read; clipboard-write"
            allowFullScreen
            onLoad={handleIframeLoad}
          />
        ) : (
          <div ref={mountRef} className="game-canvas-mount" />
        )}

        {/* Loading Overlay */}
        {loading && !isBundle && (
          <div className="game-overlay-screen">
            <div className="overlay-card">
              <div className="spinner-ring" />
              <h3 style={{ color: '#fff', marginTop: '16px' }}>Loading {game.title}...</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '6px' }}>
                {game.controls || 'Use keyboard or touch to play.'}
              </p>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="game-overlay-screen">
            <div className="overlay-card">
              <span style={{ fontSize: '2.5rem' }}>⚠️</span>
              <h3 style={{ color: '#ef4444', marginTop: '10px' }}>Unable to load game</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{error.message}</p>
              <button className="btn btn-primary" onClick={onBack} style={{ marginTop: '15px' }}>
                Return to All Games
              </button>
            </div>
          </div>
        )}

        {/* Paused Overlay */}
        {isPaused && (
          <div className="game-overlay-screen">
            <div className="overlay-card">
              <span style={{ fontSize: '2.8rem', color: 'var(--brand-coral)' }}>⏸️</span>
              <h2 style={{ color: '#fff', margin: '8px 0 20px', fontFamily: 'var(--font-heading)' }}>
                GAME PAUSED
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                <button className="btn btn-primary" onClick={handleTogglePause}>
                  ▶️ RESUME
                </button>
                <button className="btn btn-secondary" onClick={handleRestart}>
                  🔄 RESTART
                </button>
                <button className="btn btn-secondary" onClick={onBack}>
                  🏠 ALL GAMES
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Game Over / Victory Result Overlay */}
        {resultData && (
          <div className="game-overlay-screen">
            <div className="overlay-card">
              <span style={{ fontSize: '3rem' }}>{resultData.isVictory ? '🏆' : '💀'}</span>
              <h2 style={{ color: '#fff', margin: '8px 0 10px', fontFamily: 'var(--font-heading)' }}>
                {resultData.isVictory ? 'LEVEL CLEARED!' : 'GAME OVER'}
              </h2>
              <p style={{ color: '#ffd166', fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px' }}>
                Score: {resultData.score.toLocaleString()}
              </p>
              <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                <button className="btn btn-primary" onClick={handleRestart} style={{ flex: 1 }}>
                  🔄 PLAY AGAIN
                </button>
                <button className="btn btn-secondary" onClick={onBack} style={{ flex: 1 }}>
                  🏠 ALL GAMES
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Non-intrusive Safe Ad Banner Slot */}
      <div className="gz-ad-slot-container">
        <span className="gz-ad-slot-label">ADVERTISEMENT • GAMINGZONE SAFE</span>
        <div className="gz-ad-slot-banner">
          <div className="gz-ad-placeholder-text">
            <span>🎮 GamingZone High-Performance Browser Gaming Network</span>
            <span style={{ fontSize: '0.74rem', opacity: 0.8 }}>Over 190+ free instant titles. Fast, ad-safe, zero downloads.</span>
          </div>
        </div>
      </div>

      {/* Visual Keyboard Controls & How to Play Guide */}
      <div className="gz-gameplay-guide-grid">
        {/* Box 1: About & Story */}
        <div className="gz-guide-card">
          <h3 className="gz-guide-title">
            <span>📖</span> About {game.title}
          </h3>
          <p className="gz-guide-desc">
            {game.description || 'Enjoy this fast, high-performance HTML5 browser game directly on GAMINGZONE.'}
          </p>
          {game.instructions && (
            <div className="gz-instructions-callout">
              <strong>💡 Strategy &amp; Objective:</strong>
              <p>{game.instructions}</p>
            </div>
          )}
        </div>

        {/* Box 2: Visual Control Keys */}
        <div className="gz-guide-card">
          <h3 className="gz-guide-title">
            <span>🎮</span> Visual Controls &amp; Hotkeys
          </h3>
          <div className="gz-keys-display-grid">
            <div className="gz-key-pair">
              <div className="gz-keycaps-cluster">
                <span className="gz-keycap">W</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <span className="gz-keycap">A</span>
                  <span className="gz-keycap">S</span>
                  <span className="gz-keycap">D</span>
                </div>
              </div>
              <span className="gz-key-label">or Arrow Keys to Move / Steer</span>
            </div>

            <div className="gz-key-pair">
              <span className="gz-keycap gz-keycap-wide">SPACE</span>
              <span className="gz-key-label">Jump / Fire / Action</span>
            </div>

            <div className="gz-key-pair">
              <span className="gz-keycap gz-keycap-wide">MOUSE / TAP</span>
              <span className="gz-key-label">Aim, Shoot, or Touch Control</span>
            </div>
          </div>

          <div className="gz-custom-controls-hint">
            <strong>Game specific note:</strong> {game.controls || 'WASD / Arrow keys to move, Space to action.'}
          </div>
        </div>
      </div>

      {/* Leaderboard & Hall of Fame Section */}
      <div className="game-leaderboard-box" style={{
        marginTop: '20px',
        background: 'rgba(24, 26, 36, 0.72)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ color: '#fff', fontFamily: 'var(--font-heading)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🏆</span> Hall of Fame & Leaderboard
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.84rem', marginTop: '2px' }}>
              Real-time competitive records for {game.title}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn ${activeLeaderboardTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
              onClick={() => setActiveLeaderboardTab('all')}
            >
              All Records ({leaderboard.length})
            </button>
            <button
              className={`btn ${activeLeaderboardTab === 'verified' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
              onClick={() => setActiveLeaderboardTab('verified')}
            >
              Verified Community
            </button>
          </div>
        </div>

        {submittedScore !== null && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            padding: '10px 16px',
            color: '#34d399',
            fontSize: '0.88rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>✅</span> Score of {submittedScore.toLocaleString()} pts successfully recorded on the leaderboard!
          </div>
        )}

        {leaderboardLoading ? (
          <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
            <div className="spinner-ring" style={{ margin: '0 auto 12px' }} />
            Loading high scores...
          </div>
        ) : leaderboard.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>🎮</span>
            No scores submitted yet. Be the first champion to claim #1 rank!
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: '360px',
            overflowY: 'auto',
            paddingRight: '4px'
          }}>
            {leaderboard
              .filter((entry) => activeLeaderboardTab === 'all' || !entry.is_demo)
              .map((entry, index) => {
                const rankBadge = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
                const isTop3 = index < 3;
                return (
                  <div
                    key={entry.id || index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 16px',
                      background: isTop3 ? 'rgba(255, 215, 0, 0.05)' : 'rgba(30, 41, 59, 0.4)',
                      border: isTop3 ? '1px solid rgba(255, 215, 0, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '10px',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        fontSize: isTop3 ? '1.3rem' : '0.9rem',
                        fontWeight: 800,
                        width: '32px',
                        textAlign: 'center',
                        color: isTop3 ? '#facc15' : '#94a3b8'
                      }}>
                        {rankBadge}
                      </span>
                      <span style={{ fontSize: '1.4rem' }}>{entry.avatar || '🎮'}</span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
                            {entry.player_name || 'Anonymous Player'}
                          </span>
                          {entry.is_demo ? (
                            <span style={{
                              fontSize: '0.68rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(148, 163, 184, 0.15)',
                              color: '#94a3b8',
                              border: '1px solid rgba(148, 163, 184, 0.25)',
                              fontWeight: 600
                            }}>
                              DEMO BOT
                            </span>
                          ) : (
                            <span style={{
                              fontSize: '0.68rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#34d399',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              fontWeight: 700
                            }}>
                              VERIFIED
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          {entry.created_at ? new Date(entry.created_at).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        color: isTop3 ? '#facc15' : '#38bdf8'
                      }}>
                        {entry.score.toLocaleString()}
                      </span>
                      <span style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8' }}>
                        pts
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Related Games Shelf */}
      {relatedGames && relatedGames.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <GameShelf
            title="🎯 More Games Like This"
            subtitle="Keep the fun going with handpicked titles"
            games={relatedGames}
            onSelectGame={onSelectRelated}
            favorites={isFavorite ? [game.id] : []}
            onToggleFavorite={onToggleFavorite}
          />
        </div>
      )}
    </div>
  );
}
