import React, { useState, useEffect } from 'react';
import { sounds } from '../../js/core/soundFX.js';

const DEMO_PRESETS = ['PixelNinja', 'NeonRacer', 'ShadowFox', 'TurboTurtle', 'CosmicPanda'];
const AVATAR_OPTIONS = ['🥷', '🏎️', '🦊', '🐢', '🐼', '⚡', '🎮', '🚀', '👑', '💎'];

export function ProfileModal({
  isOpen,
  onClose,
  profile,
  onUpdateName,
  onUpdateAvatar,
  favoriteGames,
  onSelectGame
}) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'history' | 'bests' | 'badges'
  const [name, setName] = useState(profile?.name || 'Player');
  const [selectedAvatar, setSelectedAvatar] = useState(profile?.avatar || '🥷');
  const [history, setHistory] = useState([]);
  const [personalBests, setPersonalBests] = useState({});

  useEffect(() => {
    if (isOpen) {
      setName(profile?.name || 'Player');
      setSelectedAvatar(profile?.avatar || '🥷');

      // Load local history & personal bests
      try {
        const savedHistory = localStorage.getItem('gz_game_sessions');
        if (savedHistory) setHistory(JSON.parse(savedHistory));
        const savedBests = localStorage.getItem('gz_personal_bests');
        if (savedBests) setPersonalBests(JSON.parse(savedBests));
      } catch (e) {}
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    sounds.playClick();
    if (name.trim()) {
      onUpdateName(name.trim());
    }
    if (onUpdateAvatar) {
      onUpdateAvatar(selectedAvatar);
    }
    onClose();
  };

  const handlePresetSelect = (preset) => {
    sounds.playClick();
    setName(preset);
  };

  const handleAvatarSelect = (av) => {
    sounds.playClick();
    setSelectedAvatar(av);
  };

  const achievements = [
    { id: 'first_play', name: 'First Steps', icon: '🎮', desc: 'Play your first GAMINGZONE title', unlocked: (profile?.gamesPlayed || 0) >= 1 },
    { id: 'coin_collector', name: 'Coin Hoarder', icon: '🪙', desc: 'Amass over 1,000 coins', unlocked: (profile?.coins || 0) >= 1000 },
    { id: 'level_5', name: 'Rising Star', icon: '⭐', desc: 'Reach Player Level 3 or higher', unlocked: (profile?.level || 1) >= 3 },
    { id: 'marathon', name: 'Game Master', icon: '🏆', desc: 'Complete 10 game sessions', unlocked: (profile?.gamesPlayed || 0) >= 10 }
  ];

  return (
    <div className="modal-backdrop active" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '2rem' }}>{selectedAvatar}</span>
            <div>
              <h2 style={{ color: '#fff', fontFamily: 'var(--font-heading)', fontSize: '1.25rem', margin: 0 }}>
                {name}
              </h2>
              <span style={{
                fontSize: '0.72rem',
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.1)',
                padding: '2px 8px',
                borderRadius: '10px',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                fontWeight: 700
              }}>
                🛡️ Local Guest Profile
              </span>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        {/* Guest Progress Notice */}
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: '10px',
          padding: '10px 14px',
          marginBottom: '16px',
          fontSize: '0.8rem',
          color: '#fbbf24',
          lineHeight: 1.4
        }}>
          💡 <strong>Guest Notice:</strong> Your progress, coins, and records are saved locally in this browser. To keep your scores safe, do not clear browser site data.
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '10px',
          marginBottom: '16px'
        }}>
          {[
            { id: 'profile', label: '👤 Profile' },
            { id: 'history', label: '📜 History' },
            { id: 'bests', label: '🏆 Personal Bests' },
            { id: 'badges', label: '🎖️ Badges' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { sounds.playClick(); setActiveTab(tab.id); }}
              style={{
                background: activeTab === tab.id ? 'var(--brand-coral)' : 'rgba(255, 255, 255, 0.06)',
                color: activeTab === tab.id ? '#fff' : '#94a3b8',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: PROFILE CUSTOMIZER */}
        {activeTab === 'profile' && (
          <div>
            {/* Stats Overview */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '14px',
              borderRadius: '12px',
              marginBottom: '18px',
              textAlign: 'center'
            }}>
              <div>
                <span style={{ fontSize: '1.4rem' }}>⚡</span>
                <div style={{ color: '#ffd166', fontWeight: 800, fontSize: '1.1rem' }}>{(profile?.coins || 0).toLocaleString()}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.74rem' }}>Coins Earned</div>
              </div>
              <div>
                <span style={{ fontSize: '1.4rem' }}>🎖️</span>
                <div style={{ color: '#00e5ff', fontWeight: 800, fontSize: '1.1rem' }}>LVL {profile?.level || 1}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.74rem' }}>Experience Tier</div>
              </div>
              <div>
                <span style={{ fontSize: '1.4rem' }}>🎮</span>
                <div style={{ color: '#10b981', fontWeight: 800, fontSize: '1.1rem' }}>{profile?.gamesPlayed || 0}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.74rem' }}>Total Sessions</div>
              </div>
            </div>

            {/* Avatar Picker */}
            <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.82rem', marginBottom: '8px', fontWeight: 600 }}>
              Choose Character Avatar
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {AVATAR_OPTIONS.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => handleAvatarSelect(av)}
                  style={{
                    fontSize: '1.4rem',
                    background: selectedAvatar === av ? 'rgba(255, 87, 51, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    border: selectedAvatar === av ? '2px solid var(--brand-coral)' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    width: '42px',
                    height: '42px',
                    cursor: 'pointer'
                  }}
                >
                  {av}
                </button>
              ))}
            </div>

            {/* Edit Name Form */}
            <form onSubmit={handleSave} style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.82rem', marginBottom: '6px', fontWeight: 600 }}>
                Player Tag / Alias
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="crazy-search-input"
                  value={name}
                  maxLength={24}
                  onChange={(e) => setName(e.target.value)}
                  style={{ flex: 1, height: '42px' }}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0 20px' }}>
                  Save Profile
                </button>
              </div>
            </form>

            {/* Presets */}
            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Quick Presets:
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {DEMO_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePresetSelect(p)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#cbd5e1',
                      padding: '4px 10px',
                      borderRadius: '14px',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GAME HISTORY */}
        {activeTab === 'history' && (
          <div>
            <h4 style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '10px' }}>Recent Play Sessions</h4>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>🕹️</span>
                No game sessions recorded yet. Launch any title to start your history log!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                {history.slice(0, 15).map((ses, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(255, 255, 255, 0.04)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    <div>
                      <strong style={{ color: '#fff', fontSize: '0.84rem' }}>{ses.gameTitle || ses.gameId}</strong>
                      <div style={{ color: '#64748b', fontSize: '0.72rem' }}>
                        {new Date(ses.timestamp || Date.now()).toLocaleTimeString()}
                      </div>
                    </div>
                    <span style={{ color: '#ffd166', fontWeight: 700, fontSize: '0.9rem' }}>
                      {ses.score ? `${ses.score.toLocaleString()} pts` : 'Played'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PERSONAL BESTS */}
        {activeTab === 'bests' && (
          <div>
            <h4 style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '10px' }}>Personal Bests & Records</h4>
            {Object.keys(personalBests).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>🏆</span>
                No high scores recorded yet. Beat a round to establish your personal records!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                {Object.entries(personalBests).map(([gid, bScore]) => (
                  <div
                    key={gid}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(255, 255, 255, 0.04)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    <span style={{ color: '#cbd5e1', fontSize: '0.84rem', fontWeight: 600 }}>{gid.replace(/^game_/, '').replace(/_/g, ' ')}</span>
                    <span style={{ color: '#10b981', fontWeight: 800, fontSize: '0.95rem' }}>{bScore.toLocaleString()} pts</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: BADGES & ACHIEVEMENTS */}
        {activeTab === 'badges' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {achievements.map((ach) => (
              <div
                key={ach.id}
                style={{
                  background: ach.unlocked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  border: ach.unlocked ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '12px',
                  borderRadius: '10px',
                  opacity: ach.unlocked ? 1 : 0.6
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '1.4rem' }}>{ach.icon}</span>
                  <strong style={{ color: ach.unlocked ? '#fff' : '#94a3b8', fontSize: '0.86rem' }}>
                    {ach.name}
                  </strong>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.74rem', margin: 0, lineHeight: 1.3 }}>
                  {ach.desc}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Favorite Games Shortcut */}
        {favoriteGames && favoriteGames.length > 0 && activeTab === 'profile' && (
          <div style={{ marginTop: '16px' }}>
            <h4 style={{ color: '#fff', fontSize: '0.86rem', marginBottom: '8px' }}>❤️ Favorite Titles ({favoriteGames.length})</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '100px', overflowY: 'auto' }}>
              {favoriteGames.map((g) => (
                <button
                  key={g.id}
                  onClick={() => { sounds.playClick(); onSelectGame(g); onClose(); }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#fff',
                    padding: '5px 10px',
                    borderRadius: '14px',
                    fontSize: '0.76rem',
                    cursor: 'pointer'
                  }}
                >
                  {g.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
