import { DEFAULT_GAMES, CATEGORIES } from '../data/gamesRegistry.js';
import { GAME_WORLDS_DATA, getGameWorldData } from '../data/gameLevels.js';

const STORAGE_KEY = 'gamingzone_portal_state_v1';
const LEGACY_STORAGE_KEY = 'pokirush_progression_portal_v6';

export const DEFAULT_HOMEPAGE_SECTIONS = [
  { id: 'hero_carousel', title: '⭐ FEATURED SPOTLIGHT', type: 'hero', enabled: true, order: 1 },
  { id: 'daily_challenges', title: '🔥 DAILY & WEEKLY QUESTS', type: 'daily_challenges', enabled: true, order: 2 },
  { id: 'ai_recommendations', title: '🤖 RECOMMENDED FOR YOU (AI DISCOVERY)', type: 'ai_recommendations', enabled: true, order: 3 },
  { id: 'recently_played', title: '🕒 CONTINUE PLAYING', type: 'recently_played', enabled: true, order: 4 },
  { id: 'trending_games', title: '⚡ TRENDING NOW', type: 'tag_filter', filter: 'trending', enabled: true, order: 5 },
  { id: 'two_player_games', title: '👥 2-PLAYER & MULTIPLAYER BATTLES', type: 'tag_filter', filter: '2player', enabled: true, order: 6 },
  { id: 'editors_choice', title: '🏆 EDITOR\'S CHOICE', type: 'tag_filter', filter: 'action', enabled: true, order: 7 },
  { id: 'all_popular_games', title: '🔥 ALL POPULAR GAMES', type: 'all_grid', enabled: true, order: 8 }
];

export const DEFAULT_ACHIEVEMENTS = [
  { id: 'first_play', title: 'First Steps', icon: '🎮', desc: 'Played your very first game on GAMINGZONE', reward: '100 XP' },
  { id: 'star_collector', title: 'Star Hunter', icon: '⭐', desc: 'Collected 10 Stars across game levels', reward: '300 XP' },
  { id: 'level_crusher', title: 'Level Crusher', icon: '🎖️', desc: 'Completed 5 different game levels with 3 Stars', reward: '500 XP' },
  { id: 'coin_hoarder', title: 'Treasure Master', icon: '🪙', desc: 'Accumulated 1,000+ Coins in your wallet', reward: '250 XP' },
  { id: 'quest_hero', title: 'Quest Champion', icon: '🔥', desc: 'Completed today\'s Daily Challenge', reward: '400 XP' },
  { id: 'explorer', title: 'Game Hopper', icon: '🧭', desc: 'Played 5 different games in one session', reward: '300 XP' }
];

export class PortalState {
  constructor() {
    this.state = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!raw) return this.getDefaults();
      const parsed = JSON.parse(raw);
      
      // Ensure default games exist and are strictly deduplicated by id, slug, and title
      const mergedGames = [];
      const seenTitles = new Set();
      const seenSlugs = new Set();
      const seenIds = new Set();

      const existingGames = Array.isArray(parsed.games) ? parsed.games : [];
      const existingById = new Map(existingGames.map(g => [g.id, g]));

      DEFAULT_GAMES.forEach(dg => {
        const normTitle = dg.title.toLowerCase().trim();
        const normSlug = (dg.slug || dg.id).toLowerCase().trim();
        const existing = existingById.get(dg.id);

        const merged = existing ? { ...existing, ...dg } : dg;
        mergedGames.push(merged);
        seenTitles.add(normTitle);
        seenSlugs.add(normSlug);
        seenIds.add(dg.id);
      });

      // Append custom or bundle games only if they are genuinely unique
      existingGames.forEach(customGame => {
        if (!customGame || !customGame.title) return;
        const normTitle = customGame.title.toLowerCase().trim();
        const normSlug = (customGame.slug || customGame.id).toLowerCase().trim();

        if (!seenIds.has(customGame.id) && !seenTitles.has(normTitle) && !seenSlugs.has(normSlug)) {
          mergedGames.push(customGame);
          seenTitles.add(normTitle);
          seenSlugs.add(normSlug);
          seenIds.add(customGame.id);
        }
      });

      parsed.games = mergedGames;

      if (!parsed.homepageSections || parsed.homepageSections.length === 0) {
        parsed.homepageSections = JSON.parse(JSON.stringify(DEFAULT_HOMEPAGE_SECTIONS));
      }

      if (!parsed.categories) {
        parsed.categories = JSON.parse(JSON.stringify(CATEGORIES));
      }

      if (!parsed.playerProfile) {
        parsed.playerProfile = this.getDefaultProfile();
      }

      if (!parsed.gameProgress) {
        parsed.gameProgress = this.getDefaultGameProgress();
      }

      if (!parsed.dailyQuests) {
        parsed.dailyQuests = this.getDefaultDailyQuests();
      }

      return parsed;
    } catch (e) {
      console.warn('PortalState: could not load storage, using defaults', e);
      return this.getDefaults();
    }
  }

  getDefaultProfile() {
    return {
      name: 'CyberChampion',
      avatar: '⚡',
      level: 1,
      xp: 150,
      xpToNextLevel: 500,
      coins: 300,
      totalStars: 6,
      rankTitle: 'Rookie Gamer'
    };
  }

  getDefaultGameProgress() {
    return {
      game_archery_master: {
        unlockedLevel: 3,
        selectedLevel: 1,
        levels: {
          1: { stars: 3, score: 520, completed: true },
          2: { stars: 3, score: 710, completed: true },
          3: { stars: 0, score: 0, completed: false }
        }
      },
      game_galaxy_shooter: {
        unlockedLevel: 2,
        selectedLevel: 1,
        levels: {
          1: { stars: 3, score: 1050, completed: true },
          2: { stars: 0, score: 0, completed: false }
        }
      },
      game_pixel_runner: {
        unlockedLevel: 2,
        selectedLevel: 1,
        levels: {
          1: { stars: 2, score: 620, completed: true },
          2: { stars: 0, score: 0, completed: false }
        }
      }
    };
  }

  getDefaultDailyQuests() {
    return {
      daily: {
        id: 'quest_daily_stars',
        title: 'Earn 3 Stars in Any Game Level',
        icon: '⭐',
        target: 3,
        current: 1,
        rewardCoins: 250,
        rewardXP: 300,
        completed: false,
        claimed: false,
        hoursLeft: 16
      },
      weekly: {
        id: 'quest_weekly_levels',
        title: 'Clear 6 Progressive Levels This Week',
        icon: '🏆',
        target: 6,
        current: 3,
        rewardCoins: 800,
        rewardXP: 1000,
        completed: false,
        claimed: false,
        daysLeft: 4
      }
    };
  }

  getDefaults() {
    return {
      games: JSON.parse(JSON.stringify(DEFAULT_GAMES)),
      categories: JSON.parse(JSON.stringify(CATEGORIES)),
      homepageSections: JSON.parse(JSON.stringify(DEFAULT_HOMEPAGE_SECTIONS)),
      playerProfile: this.getDefaultProfile(),
      gameProgress: this.getDefaultGameProgress(),
      dailyQuests: this.getDefaultDailyQuests(),
      favorites: ['game_archery_master', 'game_galaxy_shooter', 'game_neon_snake'],
      recentlyPlayed: ['game_archery_master', 'game_pixel_runner'],
      playedHistory: {},
      highScores: {
        game_archery_master: 1250,
        game_galaxy_shooter: 3400,
        game_pixel_runner: 980
      },
      likedGames: {},
      unlockedAchievements: ['first_play'],
      leaderboards: {
        game_archery_master: [
          { name: 'Robin_Hood', score: 2850, date: '2026-10-04' },
          { name: 'CyberArcher99', score: 2420, date: '2026-10-03' },
          { name: 'ApexSniper', score: 1980, date: '2026-10-02' },
          { name: 'CyberChampion', score: 1250, date: '2026-10-05' }
        ],
        game_galaxy_shooter: [
          { name: 'StarCommander', score: 9400, date: '2026-10-04' },
          { name: 'NovaViper', score: 6200, date: '2026-10-03' },
          { name: 'CosmicAce', score: 4800, date: '2026-10-02' },
          { name: 'CyberChampion', score: 3400, date: '2026-10-05' }
        ]
      },
      comments: {
        game_archery_master: [
          { author: 'SpeedyGamer', rating: 5, date: '2 hours ago', text: 'The level progression with wind and moving targets is insanely fun!' },
          { author: 'NeonRider', rating: 5, date: 'Yesterday', text: '3-starred world 1! On to world 2 now 🎯' }
        ],
        game_pixel_runner: [
          { author: 'DinoFan21', rating: 5, date: '5 hours ago', text: 'Night desert level is challenging and super rewarding!' }
        ]
      },
      pendingSubmissions: [
        {
          id: 'sub_demo_1',
          title: 'Quantum Drift 3D',
          developer: 'RetroNova Studios',
          category: 'arcade',
          tags: ['arcade', 'racing'],
          icon: '🌌',
          version: '1.0.2',
          engine: 'PixelRunner',
          description: 'A neon-lit futuristic endless drift challenge with anti-gravity physics.',
          controls: 'Arrow keys or touch to steer.',
          status: 'pending',
          submittedAt: '2026-10-04',
          qualityScore: 96,
          qualityReport: {
            packageIntegrity: 'Passed (No broken files)',
            responsiveDesign: 'Passed (Mobile & Desktop)',
            loadTime: '0.4s (Ultra Fast)',
            performanceScore: '60 FPS stable'
          }
        }
      ],
      announcement: {
        active: true,
        text: '🔥 LEVEL PROGRESSION IS LIVE! Conquer Worlds, Earn 3-Stars, Unlock Gear & Level Up! ⚡',
        link: ''
      },
      settings: {
        siteName: 'GAMINGZONE',
        maintenanceMode: false,
        developerSubmissionsOpen: true,
        defaultPin: '1234'
      },
      adminAuth: false
    };
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('PortalState: could not save storage', e);
    }
  }

  // --- Player Profile & Progression Engine ---
  getPlayerProfile() {
    return this.state.playerProfile;
  }

  addPlayerXP(amount) {
    const p = this.state.playerProfile;
    p.xp += amount;
    let leveledUp = false;

    while (p.xp >= p.xpToNextLevel) {
      p.xp -= p.xpToNextLevel;
      p.level += 1;
      p.xpToNextLevel = Math.round(p.xpToNextLevel * 1.35);
      p.coins += p.level * 100;
      leveledUp = true;
      this.updateRankTitle();
    }

    this.save();
    return { leveledUp, newLevel: p.level };
  }

  addPlayerCoins(amount) {
    this.state.playerProfile.coins += amount;
    if (this.state.playerProfile.coins >= 1000) {
      this.unlockAchievement('coin_hoarder');
    }
    this.save();
    return this.state.playerProfile.coins;
  }

  updateRankTitle() {
    const lvl = this.state.playerProfile.level;
    let title = 'Rookie Gamer';
    if (lvl >= 3) title = 'Arcade Specialist';
    if (lvl >= 6) title = 'Elite Competitor';
    if (lvl >= 10) title = 'Master Champion';
    if (lvl >= 15) title = 'Legendary Grandmaster';
    this.state.playerProfile.rankTitle = title;
  }

  // --- Level-Based Progression Engine (3-Star System & Unlocks) ---
  getGameProgress(gameId) {
    if (!this.state.gameProgress[gameId]) {
      this.state.gameProgress[gameId] = {
        unlockedLevel: 1,
        selectedLevel: 1,
        levels: {
          1: { stars: 0, score: 0, completed: false }
        }
      };
      this.save();
    }
    return this.state.gameProgress[gameId];
  }

  setSelectedLevel(gameId, levelNum) {
    const prog = this.getGameProgress(gameId);
    prog.selectedLevel = levelNum;
    this.save();
  }

  completeLevel(gameId, levelNum, score) {
    const game = this.getGameById(gameId);
    const worldData = getGameWorldData(game || { id: gameId, title: 'Game' });
    
    // Find level config
    let levelConfig = null;
    for (const world of worldData.worlds) {
      const found = world.levels.find(l => l.level === levelNum);
      if (found) {
        levelConfig = found;
        break;
      }
    }

    if (!levelConfig) {
      levelConfig = {
        targetScore: 300,
        starThresholds: [300, 600, 1000],
        coinsReward: 150,
        xpReward: 200,
        unlockReward: 'Champion Badge 🎖️'
      };
    }

    // Calculate stars: 1, 2, or 3 stars
    let starsEarned = 1;
    if (score >= levelConfig.starThresholds[2]) {
      starsEarned = 3;
    } else if (score >= levelConfig.starThresholds[1]) {
      starsEarned = 2;
    }

    const prog = this.getGameProgress(gameId);
    if (!prog.levels[levelNum]) {
      prog.levels[levelNum] = { stars: 0, score: 0, completed: false };
    }

    const prevStars = prog.levels[levelNum].stars || 0;
    const newStarsDiff = Math.max(0, starsEarned - prevStars);

    prog.levels[levelNum].completed = true;
    prog.levels[levelNum].score = Math.max(prog.levels[levelNum].score || 0, score);
    prog.levels[levelNum].stars = Math.max(prevStars, starsEarned);

    // Unlock next level
    let unlockedNext = false;
    const nextLevelNum = levelNum + 1;
    if (prog.unlockedLevel < nextLevelNum) {
      prog.unlockedLevel = nextLevelNum;
      if (!prog.levels[nextLevelNum]) {
        prog.levels[nextLevelNum] = { stars: 0, score: 0, completed: false };
      }
      unlockedNext = true;
    }

    // Update Player Profile
    const coinsEarned = levelConfig.coinsReward + (starsEarned === 3 ? 50 : 0);
    const xpEarned = levelConfig.xpReward + (starsEarned === 3 ? 100 : 0);
    this.addPlayerCoins(coinsEarned);
    const { leveledUp, newLevel } = this.addPlayerXP(xpEarned);

    // Update total stars
    this.recalculateTotalStars();

    // Update Quests
    this.updateDailyQuestsProgress(starsEarned, 1);

    this.save();

    return {
      levelNum,
      score,
      stars: starsEarned,
      newStarsDiff,
      coinsEarned,
      xpEarned,
      unlockedNext,
      nextLevelNum,
      leveledUp,
      newLevel,
      unlockReward: levelConfig.unlockReward || 'Next Level Unlocked 🔓'
    };
  }

  recalculateTotalStars() {
    let total = 0;
    let threeStarCount = 0;
    Object.values(this.state.gameProgress).forEach(gameProg => {
      Object.values(gameProg.levels || {}).forEach(lvl => {
        total += (lvl.stars || 0);
        if (lvl.stars === 3) threeStarCount++;
      });
    });
    this.state.playerProfile.totalStars = total;

    if (total >= 10) this.unlockAchievement('star_collector');
    if (threeStarCount >= 5) this.unlockAchievement('level_crusher');
    this.save();
  }

  updateDailyQuestsProgress(stars, levels) {
    const quests = this.state.dailyQuests;
    if (quests.daily && !quests.daily.completed) {
      quests.daily.current += stars;
      if (quests.daily.current >= quests.daily.target) {
        quests.daily.current = quests.daily.target;
        quests.daily.completed = true;
        this.unlockAchievement('quest_hero');
      }
    }
    if (quests.weekly && !quests.weekly.completed) {
      quests.weekly.current += levels;
      if (quests.weekly.current >= quests.weekly.target) {
        quests.weekly.current = quests.weekly.target;
        quests.weekly.completed = true;
      }
    }
    this.save();
  }

  claimQuestReward(questType) {
    const quest = this.state.dailyQuests[questType];
    if (quest && quest.completed && !quest.claimed) {
      quest.claimed = true;
      this.addPlayerCoins(quest.rewardCoins);
      this.addPlayerXP(quest.rewardXP);
      this.save();
      return true;
    }
    return false;
  }

  // --- Games Catalog (Strictly Deduplicated) ---
  getGames() {
    const seen = new Set();
    return (this.state.games || []).filter(g => {
      if (!g || !g.title) return false;
      const key = (g.slug || g.id || g.title).toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  getGameById(id) {
    return this.state.games.find(g => g.id === id);
  }

  getGameBySlug(slug) {
    return this.state.games.find(g => g.slug === slug);
  }

  isFavorite(gameId) {
    return this.state.favorites.includes(gameId);
  }

  toggleFavorite(gameId) {
    const idx = this.state.favorites.indexOf(gameId);
    if (idx >= 0) {
      this.state.favorites.splice(idx, 1);
    } else {
      this.state.favorites.push(gameId);
    }
    this.save();
    return this.isFavorite(gameId);
  }

  recordPlay(gameId) {
    const game = this.getGameById(gameId);
    if (game) {
      game.plays = (game.plays || 0) + 1;
      const targetSlug = game.slug || game.id;
      fetch(`/api/games/${targetSlug}/play`, { method: 'POST' }).catch(() => {});
    }
    
    if (!this.state.playedHistory[gameId]) {
      this.state.playedHistory[gameId] = { count: 0, lastPlayed: Date.now() };
    }
    this.state.playedHistory[gameId].count += 1;
    this.state.playedHistory[gameId].lastPlayed = Date.now();

    this.state.recentlyPlayed = this.state.recentlyPlayed.filter(id => id !== gameId);
    this.state.recentlyPlayed.unshift(gameId);
    if (this.state.recentlyPlayed.length > 10) {
      this.state.recentlyPlayed.pop();
    }

    const distinctCount = Object.keys(this.state.playedHistory).length;
    if (distinctCount >= 5) {
      this.unlockAchievement('explorer');
    }
    this.unlockAchievement('first_play');

    this.save();
  }

  getRecentlyPlayed(limit = 6) {
    const list = this.state.recentlyPlayed || [];
    return list
      .map(id => this.getGameById(id))
      .filter(Boolean)
      .slice(0, limit);
  }

  // --- AI Recommendations Engine ---
  getAIRecommendations(limit = 4) {
    const history = this.state.playedHistory || {};
    const playedGameIds = Object.keys(history);

    const genreAffinities = {};
    playedGameIds.forEach(id => {
      const g = this.getGameById(id);
      if (g) {
        genreAffinities[g.category] = (genreAffinities[g.category] || 0) + (history[id].count || 1);
        (g.tags || []).forEach(t => {
          genreAffinities[t] = (genreAffinities[t] || 0) + 1;
        });
      }
    });

    const scored = this.state.games.map(game => {
      let score = game.rating * 10 + (game.plays / 1000);
      const catMatch = genreAffinities[game.category] || 0;
      score += catMatch * 15;
      (game.tags || []).forEach(t => {
        score += (genreAffinities[t] || 0) * 8;
      });
      if (!history[game.id]) {
        score += 20;
      }
      return { game, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(s => s.game);
  }

  // --- Leaderboards ---
  getLeaderboard(gameId) {
    return this.state.leaderboards[gameId] || [];
  }

  submitScore(gameId, playerName, score) {
    if (!this.state.leaderboards[gameId]) {
      this.state.leaderboards[gameId] = [];
    }
    
    this.state.leaderboards[gameId].push({
      name: playerName || this.state.playerProfile.name,
      score: score,
      date: new Date().toISOString().split('T')[0]
    });

    this.state.leaderboards[gameId].sort((a, b) => b.score - a.score);
    this.state.leaderboards[gameId] = this.state.leaderboards[gameId].slice(0, 10);

    const prevBest = this.getHighScore(gameId);
    let isNewRecord = false;
    if (score > prevBest) {
      this.setHighScore(gameId, score);
      isNewRecord = true;
    }

    this.save();
    return isNewRecord;
  }

  getHighScore(gameId) {
    return this.state.highScores[gameId] || 0;
  }

  setHighScore(gameId, score) {
    this.state.highScores[gameId] = score;
    this.save();
  }

  // --- Achievements ---
  getAchievements() {
    return DEFAULT_ACHIEVEMENTS.map(ach => ({
      ...ach,
      unlocked: this.state.unlockedAchievements.includes(ach.id)
    }));
  }

  unlockAchievement(achId) {
    if (!this.state.unlockedAchievements.includes(achId)) {
      this.state.unlockedAchievements.push(achId);
      this.save();
      window.dispatchEvent(new CustomEvent('gamingzone:achievement', { detail: { id: achId } }));
      window.dispatchEvent(new CustomEvent('pokirush:achievement', { detail: { id: achId } }));
      return true;
    }
    return false;
  }

  // --- Comments & Ratings ---
  getComments(gameId) {
    return this.state.comments[gameId] || [];
  }

  addComment(gameId, author, rating, text) {
    if (!this.state.comments[gameId]) {
      this.state.comments[gameId] = [];
    }
    this.state.comments[gameId].unshift({
      author: author || this.state.playerProfile.name,
      rating: Number(rating) || 5,
      date: 'Just now',
      text: text.trim()
    });
    this.save();
  }

  // --- Reactions ---
  setReaction(gameId, type) {
    this.state.likedGames[gameId] = type;
    this.save();
  }

  getReaction(gameId) {
    return this.state.likedGames[gameId] || null;
  }

  // --- Homepage Sections ---
  getHomepageSections() {
    return [...this.state.homepageSections].sort((a, b) => a.order - b.order);
  }

  updateHomepageSection(id, updates) {
    const sec = this.state.homepageSections.find(s => s.id === id);
    if (sec) {
      Object.assign(sec, updates);
      this.save();
    }
  }

  reorderHomepageSection(id, direction) {
    const sections = this.getHomepageSections();
    const idx = sections.findIndex(s => s.id === id);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;

    const tempOrder = sections[idx].order;
    sections[idx].order = sections[targetIdx].order;
    sections[targetIdx].order = tempOrder;
    this.save();
  }

  async syncCatalog() {
    try {
      const res = await fetch('/api/games');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.games) && data.games.length > 0) {
          // Strictly deduplicate catalog from server
          const seen = new Set();
          this.state.games = data.games.filter(g => {
            if (!g || !g.title) return false;
            const key = (g.slug || g.id || g.title).toLowerCase().trim();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          this.save();
          window.dispatchEvent(new CustomEvent('gamingzone:catalog-updated', { detail: { games: this.state.games } }));
        }
      }
    } catch (e) {
      console.warn('PortalState: could not sync from backend API, using cached registry', e);
    }
  }

  // --- Super Admin Authentication Methods ---
  getAdminToken() {
    return localStorage.getItem('gz_admin_token') || sessionStorage.getItem('gz_admin_token') || this.adminToken || '';
  }

  async loginAdmin(username, password) {
    try {
      const cleanUsername = String(username || '').trim();
      const cleanPassword = String(password || '').trim();

      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password: cleanPassword })
      });
      const data = await res.json();
      if (res.ok && data.success && data.token) {
        this.adminToken = data.token;
        localStorage.setItem('gz_admin_token', data.token);
        sessionStorage.setItem('gz_admin_token', data.token);
        this.state.adminAuth = true;
        this.save();
        return { success: true, token: data.token, user: data.user };
      }
      return { success: false, error: data.error || data.message || 'Invalid username or password.' };
    } catch (err) {
      return { success: false, error: 'Network error: could not connect to authentication server.' };
    }
  }

  async logoutAdmin() {
    const token = this.getAdminToken();
    if (token) {
      try {
        await fetch('/api/admin/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (_) {}
    }
    this.adminToken = '';
    localStorage.removeItem('gz_admin_token');
    sessionStorage.removeItem('gz_admin_token');
    this.state.adminAuth = false;
    this.save();
  }

  isAdmin() {
    return Boolean(this.getAdminToken());
  }

  updateGame(id, updates) {
    const g = this.getGameById(id);
    if (g) {
      Object.assign(g, updates);
      this.save();
    }
  }

  deleteGame(id) {
    this.state.games = this.state.games.filter(g => g.id !== id);
    this.state.favorites = this.state.favorites.filter(fId => fId !== id);
    this.state.recentlyPlayed = this.state.recentlyPlayed.filter(rId => rId !== id);
    this.save();
  }

  updateAnnouncement(text, active = true) {
    this.state.announcement = { active, text };
    this.save();
  }
}

export const portalState = new PortalState();
