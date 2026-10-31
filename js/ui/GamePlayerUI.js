/* ====================================================
   GAMINGZONE GAME PLAYER UI — THEATER MODE
   Coordinates GameShell, Engines, Direct Play & Related Games
   ==================================================== */

import { portalState } from '../core/portalState.js';
import { sounds } from '../core/soundFX.js';
import { GameShell } from './GameShell.js';
import { LevelSelectUI } from './LevelSelectUI.js';
import { CricketModeSelectUI } from './CricketModeSelectUI.js';
import { VersusModeSelectUI } from './VersusModeSelectUI.js';
import { getGameWorldData } from '../data/gameLevels.js';

export class GamePlayerUI {
  constructor(onBackToPortal) {
    this.onBackToPortal = onBackToPortal;
    this.currentGame = null;
    this.gameInstance = null;
    this.gameShell = null;
    this.currentLevelConfig = null;
    this.currentLevelNum = 1;
    this.loadTimeoutId = null;

    this.levelSelectUI = new LevelSelectUI((selectedLevelConfig) => {
      this.startLevel(selectedLevelConfig);
    });

    this.cricketModeSelectUI = new CricketModeSelectUI((matchConfig) => {
      this.startCricketMatch(matchConfig);
    });

    this.versusModeSelectUI = new VersusModeSelectUI((versusConfig) => {
      this.startVersusMatch(versusConfig);
    });
  }

  async loadGame(gameOrSlug) {
    if (!gameOrSlug) return;
    
    let game = typeof gameOrSlug === 'string' ? portalState.getGameBySlug(gameOrSlug) || portalState.getGameById(gameOrSlug) : gameOrSlug;

    if (!game && typeof gameOrSlug === 'string') {
      try {
        const res = await fetch(`/api/games/${gameOrSlug}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.game) {
            game = data.game;
          }
        }
      } catch (e) {
        console.warn('Could not fetch game from API:', e);
      }
    }

    if (!game) {
      console.error('Game not found:', gameOrSlug);
      return;
    }

    this.currentGame = game;
    portalState.recordPlay(game.id || game.slug);

    if (window.location.hash !== `#game/${game.slug}`) {
      window.location.hash = `#game/${game.slug}`;
    }

    // Show Game Player Screen and hide portal main view
    document.getElementById('portal-main-view')?.classList.add('hidden');
    const playerScreen = document.getElementById('screen-game-player');
    if (playerScreen) {
      playerScreen.classList.remove('hidden');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Open Hub or direct game based on mode
    this.showGameModeHub();
  }

  showGameModeHub() {
    this.destroyActiveGame();

    const stage = document.getElementById('game-embed-stage');
    if (!stage || !this.currentGame) return;
    stage.innerHTML = '';

    const mode = this.currentGame.gameMode || 'levels';

    if (mode === 'cricket') {
      if (this.currentGame.id === 'game_cricket_world_cup_chase') {
        // Direct launch into 50-over chase
        this.startCricketMatch({ mode: '50overs', targetScore: 285, title: 'World Cup 50-Over Chase' });
      } else {
        this.cricketModeSelectUI.render(stage, this.currentGame);
      }
    } else if (mode === 'versus') {
      this.versusModeSelectUI.render(stage, this.currentGame);
    } else if (mode === 'highscore') {
      // Endless High Score Chasing - Launch directly inside GameShell!
      this.startLevel({ level: 1, title: 'Endless High Score Chase', isHighscore: true });
    } else {
      // Poki-style instant gameplay: launch unlocked level directly!
      const progress = portalState.getGameProgress(this.currentGame.id);
      const lvlNum = progress.unlockedLevel || 1;
      const worldData = getGameWorldData(this.currentGame);
      let lvlConfig = { level: lvlNum, title: `Level ${lvlNum}` };

      if (worldData?.worlds) {
        for (const w of worldData.worlds) {
          const found = w.levels.find(l => l.level === lvlNum);
          if (found) {
            lvlConfig = found;
            break;
          }
        }
      }
      this.startLevel(lvlConfig);
    }
  }

  showLevelSelectMap() {
    const stage = document.getElementById('game-embed-stage');
    if (!stage || !this.currentGame) return;
    this.destroyActiveGame();
    this.levelSelectUI.render(stage, this.currentGame);
  }

  startCricketMatch(matchConfig) {
    this.startLevel({
      level: 1,
      title: matchConfig.title || 'Cricket Match',
      ...matchConfig
    });
  }

  startVersusMatch(versusConfig) {
    this.startLevel({
      level: 1,
      title: 'Versus Battle',
      ...versusConfig
    });
  }

  startLevel(levelConfig) {
    this.currentLevelConfig = levelConfig;
    this.currentLevelNum = levelConfig.level || 1;

    const stage = document.getElementById('game-embed-stage');
    if (!stage) return;
    stage.innerHTML = '';

    this.destroyActiveGame();

    // Create GameShell wrapper with related games and level map integration
    this.gameShell = new GameShell({
      game: this.currentGame,
      container: stage,
      onBackToGames: () => this.closeGame(),
      onReplay: () => this.handleReplayLevel(),
      onNextLevel: () => this.handleNextLevel(),
      onOpenRelatedGame: (relGame) => this.loadGame(relGame),
      onOpenLevelSelect: () => this.showLevelSelectMap()
    });

    const mountNode = this.gameShell.getMountNode();

    // Safety Loading Timeout (4.5s max before error boundary)
    if (this.loadTimeoutId) clearTimeout(this.loadTimeoutId);
    this.loadTimeoutId = setTimeout(() => {
      if (this.gameShell && this.gameShell.state === 'loading') {
        console.warn('Game load safety timeout fired for:', this.currentGame.id);
        this.gameShell.showError(new Error('Game load timed out'));
      }
    }, 4500);

    // Check if uploaded bundle game or custom URL
    if ((this.currentGame.game_type === 'bundle' || this.currentGame.bundle_url) && this.currentGame.bundle_url) {
      if (this.loadTimeoutId) clearTimeout(this.loadTimeoutId);
      const entryUrl = `${this.currentGame.bundle_url}${this.currentGame.entry_path || 'index.html'}`;
      mountNode.innerHTML = `
        <iframe
          id="game-bundle-iframe"
          class="game-bundle-iframe"
          src="${entryUrl}"
          sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms"
          allow="fullscreen; autoplay"
          loading="lazy"
          title="${this.currentGame.title}"
        ></iframe>
      `;
      this.gameShell.hideLoading();
      return;
    }

    if (this.currentGame.engine === 'custom_url' && this.currentGame.embedUrl) {
      if (this.loadTimeoutId) clearTimeout(this.loadTimeoutId);
      mountNode.innerHTML = `<iframe src="${this.currentGame.embedUrl}" class="game-bundle-iframe" allowfullscreen></iframe>`;
      this.gameShell.hideLoading();
      return;
    }

    const engineName = this.currentGame.engine || 'ArcheryMaster';
    import(`../games/${engineName}.js`)
      .then(module => {
        if (this.loadTimeoutId) clearTimeout(this.loadTimeoutId);
        const EngineClass = module[`${engineName}Game`] || Object.values(module)[0];
        if (EngineClass) {
          try {
            this.gameInstance = new EngineClass(mountNode, (score, extraData) => {
              this.handleLevelFinished(score, extraData);
            }, levelConfig);
            this.gameShell.hideLoading();
          } catch (initErr) {
            console.error('Error during engine instantiation:', initErr);
            this.gameShell.showError(initErr);
          }
        } else {
          this.gameShell.showError(new Error(`Class ${engineName} not found in module`));
        }
      })
      .catch(err => {
        if (this.loadTimeoutId) clearTimeout(this.loadTimeoutId);
        console.error('Failed to dynamically import game engine:', engineName, err);
        this.gameShell.showError(err);
      });
  }

  handleLevelFinished(score, extraData = null) {
    if (!this.currentGame) return;

    const parsedScore = (typeof score === 'object' && score !== null) ? (Number(score.score) || 0) : (Number(score) || 0);
    const resolvedExtra = (typeof score === 'object' && score !== null && !extraData) ? score : extraData;

    // Record completion in portalState
    const result = portalState.completeLevel(this.currentGame.id, this.currentLevelNum, parsedScore);
    portalState.submitScore(this.currentGame.id, portalState.state.playerProfile.name, parsedScore);

    // Cricket handles its own in-game presentation overlay
    if (this.currentGame.gameMode === 'cricket') {
      return;
    }

    const isHighscore = this.currentGame.gameMode === 'highscore';
    const isVictory = !isHighscore && (parsedScore > 0) && (resolvedExtra?.isGameOver !== true);

    const worldData = getGameWorldData(this.currentGame);
    const hasNextLevel = !isHighscore && (this.currentLevelNum < (worldData?.totalLevels || 10));

    if (this.gameShell) {
      this.gameShell.showResult({
        score: parsedScore,
        isVictory,
        isGameOver: resolvedExtra?.isGameOver || (parsedScore === 0),
        hasNextLevel,
        levelNum: this.currentLevelNum,
        unlockReward: result.unlockReward
      });
    }
  }

  handleNextLevel() {
    if (this.currentGame.gameMode === 'cricket' || this.currentGame.gameMode === 'versus' || this.currentGame.gameMode === 'highscore') {
      this.showGameModeHub();
      return;
    }

    const worldData = getGameWorldData(this.currentGame);
    const nextLevelNum = this.currentLevelNum + 1;

    let nextLvlConfig = null;
    for (const world of (worldData?.worlds || [])) {
      const found = world.levels.find(l => l.level === nextLevelNum);
      if (found) {
        nextLvlConfig = found;
        break;
      }
    }

    if (nextLvlConfig) {
      this.startLevel(nextLvlConfig);
    } else {
      this.showGameModeHub();
    }
  }

  handleReplayLevel() {
    if (this.currentLevelConfig) {
      this.startLevel(this.currentLevelConfig);
    } else if (this.gameInstance && typeof this.gameInstance.reset === 'function') {
      this.gameInstance.reset();
    } else {
      this.showGameModeHub();
    }
  }

  destroyActiveGame() {
    if (this.loadTimeoutId) {
      clearTimeout(this.loadTimeoutId);
      this.loadTimeoutId = null;
    }

    if (this.gameShell) {
      this.gameShell.destroy();
    }

    if (this.gameInstance && typeof this.gameInstance.destroy === 'function') {
      try {
        this.gameInstance.destroy();
      } catch (e) {
        console.warn('Error during game destroy:', e);
      }
      this.gameInstance = null;
    }
  }

  closeGame() {
    this.destroyActiveGame();
    this.gameShell = null;

    document.getElementById('screen-game-player')?.classList.add('hidden');
    document.getElementById('portal-main-view')?.classList.remove('hidden');
    window.location.hash = '';
    this.onBackToPortal();
  }
}
