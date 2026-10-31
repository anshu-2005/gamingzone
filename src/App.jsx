import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { GameCard } from './components/GameCard.jsx';
import { GameShelf } from './components/GameShelf.jsx';
import { GamePlayer } from './components/GamePlayer.jsx';
import { AdminModal } from './components/AdminModal.jsx';
import { ProfileModal } from './components/ProfileModal.jsx';
import { DEFAULT_GAMES, CATEGORIES } from '../js/data/gamesRegistry.js';
import { sounds } from '../js/core/soundFX.js';
import { getGameThumbnailSVG } from '../js/utils/gameThumbnails.js';

export function App() {
  const [games, setGames] = useState(DEFAULT_GAMES);
  const [currentCategory, setCurrentCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSort, setCurrentSort] = useState('popular');
  const [activeGame, setActiveGame] = useState(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(sounds.muted);

  // Local storage state
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('gz_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [recentlyPlayed, setRecentlyPlayed] = useState(() => {
    try {
      const saved = localStorage.getItem('gz_recent');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('gz_player_profile');
      return saved ? JSON.parse(saved) : { name: 'Player', avatar: '🥷', coins: 1450, level: 3, gamesPlayed: 8 };
    } catch (e) {
      return { name: 'Player', avatar: '🥷', coins: 1450, level: 3, gamesPlayed: 8 };
    }
  });

  // Fetch games from live backend
  const fetchLiveGames = () => {
    fetch('/api/games?limit=500')
      .then((r) => r.json())
      .then((d) => {
        if (d.games && d.games.length > 0) {
          setGames(d.games);
        }
      })
      .catch((err) => {
        console.warn('Backend API unavailable, using builtin registry:', err);
      });
  };

  useEffect(() => {
    fetchLiveGames();
  }, []);

  // Hash Routing Listener
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#game/')) {
        const slug = hash.replace('#game/', '');
        const found = games.find((g) => g.slug === slug || g.id === slug);
        if (found) {
          setActiveGame(found);
          addRecentlyPlayed(found.id);
        }
      } else if (hash.startsWith('#category/')) {
        const cat = hash.replace('#category/', '');
        setCurrentCategory(cat);
        setActiveGame(null);
      } else if (hash === '#admin') {
        setIsAdminOpen(true);
      } else if (hash === '#home' || !hash) {
        setActiveGame(null);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [games]);

  const addRecentlyPlayed = (gameId) => {
    setRecentlyPlayed((prev) => {
      const updated = [gameId, ...prev.filter((id) => id !== gameId)].slice(0, 10);
      try {
        localStorage.setItem('gz_recent', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleToggleFavorite = (gameId) => {
    setFavorites((prev) => {
      const exists = prev.includes(gameId);
      const updated = exists ? prev.filter((id) => id !== gameId) : [...prev, gameId];
      try {
        localStorage.setItem('gz_favorites', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleRecordScore = (gameId, score) => {
    const game = games.find((g) => g.id === gameId);
    const gameTitle = game?.title || gameId;

    // Update player profile
    setProfile((prev) => {
      const earnedCoins = Math.max(10, Math.floor(score * 0.1));
      const updated = {
        ...prev,
        coins: (prev.coins || 0) + earnedCoins,
        gamesPlayed: (prev.gamesPlayed || 0) + 1,
        level: Math.floor(((prev.coins || 0) + earnedCoins) / 500) + 1
      };
      try {
        localStorage.setItem('gz_player_profile', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Update local personal bests
    try {
      const bests = JSON.parse(localStorage.getItem('gz_personal_bests') || '{}');
      if (!bests[gameId] || score > (bests[gameId].score || 0)) {
        bests[gameId] = {
          gameTitle,
          score,
          date: new Date().toISOString()
        };
        localStorage.setItem('gz_personal_bests', JSON.stringify(bests));
      }

      // Record game session
      const sessions = JSON.parse(localStorage.getItem('gz_game_sessions') || '[]');
      sessions.unshift({
        gameId,
        gameTitle,
        score,
        date: new Date().toISOString()
      });
      localStorage.setItem('gz_game_sessions', JSON.stringify(sessions.slice(0, 30)));
    } catch (e) {}

    // Asynchronously ping server to record session if API available
    fetch('/api/player/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: profile?.id || 'guest_local',
        gameId,
        score,
        durationSeconds: 30
      })
    }).catch(() => {});
  };

  const handleUpdateName = (newName) => {
    setProfile((prev) => {
      const updated = { ...prev, name: newName };
      try {
        localStorage.setItem('gz_player_profile', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleUpdateAvatar = (newAvatar) => {
    setProfile((prev) => {
      const updated = { ...prev, avatar: newAvatar };
      try {
        localStorage.setItem('gz_player_profile', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleSelectGame = (game) => {
    window.location.hash = `#game/${game.slug || game.id}`;
    setActiveGame(game);
    addRecentlyPlayed(game.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRandomGame = () => {
    if (games.length === 0) return;
    const random = games[Math.floor(Math.random() * games.length)];
    handleSelectGame(random);
  };

  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  // Filtered & Sorted Games Catalog
  const filteredGames = useMemo(() => {
    let result = [...games];

    // Category filter
    if (currentCategory === 'trending') {
      result = result.filter((g) => g.featured || (g.tags && (g.tags.includes('trending') || g.tags.includes('new'))));
    } else if (currentCategory === 'recent') {
      result = recentlyPlayed.map((id) => games.find((g) => g.id === id)).filter(Boolean);
    } else if (currentCategory === 'favorites') {
      result = favorites.map((id) => games.find((g) => g.id === id)).filter(Boolean);
    } else if (currentCategory !== 'all') {
      result = result.filter((g) => g.category === currentCategory);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.category?.toLowerCase().includes(q) ||
          (g.tags && g.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    // Sorting: Newly added games always come first!
    if (currentSort === 'popular') {
      result.sort((a, b) => {
        if (Boolean(b.is_new) !== Boolean(a.is_new)) {
          return (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0);
        }
        if (b.is_new && a.is_new) {
          const timeB = b.created_at || b.updated_at || 0;
          const timeA = a.created_at || a.updated_at || 0;
          if (timeB !== timeA) return timeB - timeA;
        }
        return (b.plays || 0) - (a.plays || 0);
      });
    } else if (currentSort === 'rating') {
      result.sort((a, b) => {
        if (Boolean(b.is_new) !== Boolean(a.is_new)) {
          return (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0);
        }
        return (b.rating || 0) - (a.rating || 0);
      });
    } else if (currentSort === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (currentSort === 'new') {
      result.sort((a, b) => {
        const timeB = b.created_at || b.updated_at || 0;
        const timeA = a.created_at || a.updated_at || 0;
        return timeB - timeA;
      });
    }

    return result;
  }, [games, currentCategory, searchQuery, currentSort, favorites, recentlyPlayed]);

  // Featured Spotlight Trio
  const gameArrow = games.find((g) => g.slug?.includes('arrow-maze')) || games[0];
  const gameCricket = games.find((g) => g.slug?.includes('cricket-premier')) || games[1];
  const gameDrift = games.find((g) => g.slug?.includes('cyber-car-drift')) || games[2];

  const recentList = recentlyPlayed.map((id) => games.find((g) => g.id === id)).filter(Boolean);
  const popularList = [...games].sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 10);
  const cricketList = games.filter((g) => g.category === 'cricket');
  const actionList = games.filter((g) => g.category === 'action');
  const puzzleList = games.filter((g) => g.category === 'puzzle');

  // Freshly Added Releases List (Newest first)
  const newList = useMemo(() => {
    return [...games]
      .filter((g) => g.is_new || (g.tags && g.tags.includes('new')))
      .sort((a, b) => {
        const timeB = b.created_at || b.updated_at || 0;
        const timeA = a.created_at || a.updated_at || 0;
        return timeB - timeA;
      });
  }, [games]);

  // Dynamic Personalized Recommendations
  const recommendedList = useMemo(() => {
    const interactedIds = new Set([...recentlyPlayed, ...favorites]);
    const interactedGames = games.filter((g) => interactedIds.has(g.id));
    const catCounts = {};
    interactedGames.forEach((g) => {
      if (g.category) catCounts[g.category] = (catCounts[g.category] || 0) + 1;
    });
    const preferredCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).map((e) => e[0]);

    if (preferredCats.length > 0) {
      const recs = games.filter(
        (g) => preferredCats.includes(g.category) && !recentlyPlayed.includes(g.id)
      );
      if (recs.length >= 3) return recs.slice(0, 10);
    }
    // Fallback: top-rated games with rating >= 4.8
    return [...games].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 10);
  }, [games, recentlyPlayed, favorites]);

  return (
    <div className="crazy-portal-body">
      {/* Top Navbar */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleSidebar={() => {
          if (window.innerWidth <= 900) {
            setIsSidebarOpen(!isSidebarOpen);
          } else {
            setIsSidebarCollapsed(!isSidebarCollapsed);
          }
        }}
        onRandomGame={handleRandomGame}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        profile={profile}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onHomeClick={() => {
          window.location.hash = '#home';
          setActiveGame(null);
          setCurrentCategory('all');
          setSearchQuery('');
        }}
      />

      <div className="crazy-app-layout">
        {/* Collapsible Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          isCollapsed={isSidebarCollapsed}
          currentCategory={currentCategory}
          onSelectCategory={(cat) => {
            setCurrentCategory(cat);
            setActiveGame(null);
            setSearchQuery('');
            setIsSidebarOpen(false);
          }}
          onCloseMobile={() => setIsSidebarOpen(false)}
        />

        {/* Central Content Area */}
        <main className="crazy-main-content">
          {/* Category Horizontal Pills Dock */}
          {!activeGame && (
            <div className="crazy-pills-bar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  className={`cat-pill ${currentCategory === cat.id ? 'active' : ''}`}
                  onClick={() => {
                    sounds.playClick();
                    setCurrentCategory(cat.id);
                    setSearchQuery('');
                  }}
                >
                  <span className="pill-icon">{cat.icon}</span>
                  <span className="pill-title">{cat.name.replace(/\(.*\)/, '').trim()}</span>
                </button>
              ))}
            </div>
          )}

          {activeGame ? (
            /* Active Theater Game Player */
            <GamePlayer
              game={activeGame}
              onBack={() => {
                window.location.hash = '#home';
                setActiveGame(null);
              }}
              onSelectRelated={handleSelectGame}
              relatedGames={games.filter((g) => g.category === activeGame.category && g.id !== activeGame.id).slice(0, 8)}
              isFavorite={favorites.includes(activeGame.id)}
              onToggleFavorite={handleToggleFavorite}
              onRecordScore={handleRecordScore}
              profile={profile}
            />
          ) : searchQuery || currentCategory !== 'all' ? (
            /* Filtered / Search View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ color: '#fff', fontFamily: 'var(--font-heading)', fontSize: '1.4rem' }}>
                  {searchQuery ? `Search Results for "${searchQuery}"` : `Category: ${currentCategory.toUpperCase()}`}
                  <span style={{ color: 'var(--brand-coral)', fontSize: '1rem', marginLeft: '10px' }}>({filteredGames.length} games)</span>
                </h2>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setCurrentCategory('all');
                    setSearchQuery('');
                  }}
                >
                  Reset Filters
                </button>
              </div>

              {filteredGames.length === 0 ? (
                <div className="search-empty-box">
                  <div className="search-empty-icon">🔍</div>
                  <h3 style={{ color: '#fff' }}>No matching games found</h3>
                  <p style={{ color: '#94a3b8' }}>Try searching another term or browse all 65+ games.</p>
                </div>
              ) : (
                <div className="games-grid-layout">
                  {filteredGames.map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      onSelect={handleSelectGame}
                      isFavorite={favorites.includes(game.id)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Default Home View - Games immediately visible right in front! */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Standout Featured Cards (3D Tilt - Immediately Above Fold) */}
              <section className="shelf-section" style={{ marginTop: '2px' }}>
                <div className="shelf-header-row">
                  <div>
                    <h2 className="shelf-title">⭐ Featured Games</h2>
                    <p className="shelf-subtitle">Handpicked instant hits • Zero downloads or installs</p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ fontSize: '0.76rem', color: 'var(--brand-coral)', background: 'rgba(255, 87, 51, 0.1)', padding: '4px 10px', borderRadius: '12px', fontWeight: 700, border: '1px solid rgba(255, 87, 51, 0.25)' }}>
                      ⚡ {games.length}+ Free Online Games
                    </span>
                  </div>
                </div>

                <div className="gz-featured-grid">
                  {gameArrow && (
                    <div className="gz-featured-card" onClick={() => handleSelectGame(gameArrow)}>
                      <div className="gz-featured-thumb-wrap" dangerouslySetInnerHTML={{ __html: getGameThumbnailSVG(gameArrow) }} />
                      <div className="gz-featured-overlay">
                        <div className="gz-featured-header-row">
                          <span className="gz-featured-tag">🔥 Trending #1</span>
                          <span className="gz-featured-plays">{(gameArrow.plays || 68900).toLocaleString()} plays</span>
                        </div>
                        <h3 className="gz-featured-title">{gameArrow.title}</h3>
                        <p className="gz-featured-desc">{gameArrow.description}</p>
                        <button className="gz-featured-play-btn">Play Now ➔</button>
                      </div>
                    </div>
                  )}

                  {gameCricket && (
                    <div className="gz-featured-card" onClick={() => handleSelectGame(gameCricket)}>
                      <div className="gz-featured-thumb-wrap" dangerouslySetInnerHTML={{ __html: getGameThumbnailSVG(gameCricket) }} />
                      <div className="gz-featured-overlay">
                        <div className="gz-featured-header-row">
                          <span className="gz-featured-tag" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>🏏 3D Tournament</span>
                          <span className="gz-featured-plays">{(gameCricket.plays || 58400).toLocaleString()} plays</span>
                        </div>
                        <h3 className="gz-featured-title">{gameCricket.title}</h3>
                        <p className="gz-featured-desc">{gameCricket.description}</p>
                        <button className="gz-featured-play-btn" style={{ background: '#10b981', color: '#fff' }}>Play Now ➔</button>
                      </div>
                    </div>
                  )}

                  {gameDrift && (
                    <div className="gz-featured-card" onClick={() => handleSelectGame(gameDrift)}>
                      <div className="gz-featured-thumb-wrap" dangerouslySetInnerHTML={{ __html: getGameThumbnailSVG(gameDrift) }} />
                      <div className="gz-featured-overlay">
                        <div className="gz-featured-header-row">
                          <span className="gz-featured-tag" style={{ color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)' }}>🏎️ High Speed</span>
                          <span className="gz-featured-plays">{(gameDrift.plays || 31500).toLocaleString()} plays</span>
                        </div>
                        <h3 className="gz-featured-title">{gameDrift.title}</h3>
                        <p className="gz-featured-desc">{gameDrift.description}</p>
                        <button className="gz-featured-play-btn" style={{ background: '#8b5cf6', color: '#fff' }}>Play Now ➔</button>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* ✨ New & Recent Releases Shelf (Always First!) */}
              {newList.length > 0 && (
                <GameShelf
                  title="✨ New & Recent Releases"
                  subtitle="Freshly added games • Be the first to play and set high scores!"
                  games={newList}
                  onSelectGame={handleSelectGame}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                />
              )}

              {/* Jump Back In (Recently Played) */}
              {recentList.length > 0 && (
                <GameShelf
                  title="🕒 Jump Back In (Recently Played)"
                  subtitle="Pick up right where you left off"
                  games={recentList}
                  onSelectGame={handleSelectGame}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                />
              )}

              {/* Recommended For You */}
              {recommendedList.length > 0 && (
                <GameShelf
                  title="🎯 Recommended For You"
                  subtitle="Curated picks tuned to your gaming tastes and play history"
                  games={recommendedList}
                  onSelectGame={handleSelectGame}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                />
              )}

              {/* Popular Games Shelf */}
              <GameShelf
                title="🔥 Most Popular Worldwide"
                subtitle="Player favorites with millions of rounds played"
                games={popularList}
                onSelectGame={handleSelectGame}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
              />

              {/* Cricket & Sports Arena Shelf */}
              <GameShelf
                title="🏏 Cricket & Sports Arena"
                subtitle="Championship tournaments, chases, and athletic showdowns"
                games={cricketList}
                onSelectGame={handleSelectGame}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
              />

              {/* Action Battles Shelf */}
              <GameShelf
                title="⚔️ Action & Combat Swarms"
                subtitle="Horde survival, stickman brawlers, and territory conquest"
                games={actionList}
                onSelectGame={handleSelectGame}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
              />

              {/* Brain & Puzzle Shelf */}
              <GameShelf
                title="🧩 Brain & Logic Challenges"
                subtitle="Maze escapes, 1010 polyominos, physics lines, and solitaire"
                games={puzzleList}
                onSelectGame={handleSelectGame}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
              />

              {/* Full Responsive Catalog (All 65+ Games) */}
              <section className="shelf-section">
                <div className="shelf-header-row" style={{ flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h2 className="shelf-title">⚡ All {games.length}+ Free Browser Games</h2>
                    <p className="shelf-subtitle">Click any game to launch and play immediately</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sort:</span>
                    <select
                      value={currentSort}
                      onChange={(e) => setCurrentSort(e.target.value)}
                      style={{
                        background: 'var(--surface-card)',
                        border: '1px solid var(--border-subtle)',
                        color: '#ffffff',
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="popular">🔥 Most Popular</option>
                      <option value="rating">⭐ Highest Rated</option>
                      <option value="title">🔤 Name (A-Z)</option>
                      <option value="new">✨ Newest First</option>
                    </select>
                  </div>
                </div>

                <div className="games-grid-layout">
                  {filteredGames.map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      onSelect={handleSelectGame}
                      isFavorite={favorites.includes(game.id)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="crazy-footer">
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ color: '#fff', fontWeight: 800 }}>GAMINGZONE</span>
            <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '4px' }}>
              High-performance instant HTML5 browser games platform with 65+ free games.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.82rem' }}>
            <a
              href="#admin"
              onClick={(e) => {
                e.preventDefault();
                setIsAdminOpen(true);
              }}
              style={{ color: 'var(--brand-coral)', cursor: 'pointer' }}
            >
              ⚙️ Admin Portal
            </a>
            <a href="#home" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ color: '#94a3b8' }}>
              Top ↑
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => {
          setIsAdminOpen(false);
          if (window.location.hash === '#admin') window.location.hash = '#home';
        }}
        onCatalogChanged={fetchLiveGames}
        onPreviewGame={(previewGame) => {
          setActiveGame(previewGame);
          setIsAdminOpen(false);
        }}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profile}
        onUpdateName={handleUpdateName}
        onUpdateAvatar={handleUpdateAvatar}
        favoriteGames={favorites.map((id) => games.find((g) => g.id === id)).filter(Boolean)}
        onSelectGame={handleSelectGame}
      />
    </div>
  );
}

