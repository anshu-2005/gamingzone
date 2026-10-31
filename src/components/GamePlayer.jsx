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
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [submittedScore, setSubmittedScore] = useState(null);
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState('all');
  const viewportRef = useRef(null);

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
    restart();
  };

  const handleToggleFullscreen = () => {
    sounds.playClick();
    if (!document.fullscreenElement) {
      viewportRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
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

  return (
    <div className="game-shell-container">
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
            <h2 className="game-title-text">{game.title}</h2>
            <span className="genre-badge">{game.category}</span>
          </div>
        </div>

        <div className="header-right">
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
          <button className="btn-icon" onClick={handleToggleFullscreen} title="Fullscreen Mode">
            <span>⛶</span>
          </button>
        </div>
      </header>

      {/* Main Viewport Stage with Ambient Backlight Glow */}
      <div className="game-stage-viewport" ref={viewportRef}>
        {isBundle ? (
          <iframe
            src={game.bundle_url || game.bundleUrl || game.external_url}
            className="game-bundle-iframe"
            title={game.title}
            sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms"
            allow="fullscreen; autoplay; gamepad"
            allowFullScreen
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

      {/* Game Details & Controls Box */}
      <div className="game-details-box" style={{
        marginTop: '20px',
        background: 'rgba(24, 26, 36, 0.72)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <h3 style={{ color: '#fff', fontFamily: 'var(--font-heading)', fontSize: '1.2rem' }}>About {game.title}</h3>
        <p style={{ color: '#94a3b8', lineHeight: 1.6, fontSize: '0.92rem' }}>
          {game.description || 'Enjoy this fast, high-performance HTML5 browser game directly on GAMINGZONE.'}
        </p>
        <div style={{
          background: 'rgba(255, 87, 51, 0.08)',
          border: '1px solid rgba(255, 87, 51, 0.2)',
          borderRadius: '10px',
          padding: '12px 16px',
          marginTop: '6px'
        }}>
          <strong style={{ color: 'var(--brand-coral)', fontSize: '0.86rem' }}>🎮 Controls & Instructions:</strong>
          <p style={{ color: '#cbd5e1', fontSize: '0.84rem', marginTop: '4px' }}>
            {game.controls || 'Keyboard / Touch controls supported.'}
          </p>
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

