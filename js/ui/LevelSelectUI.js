import { portalState } from '../core/portalState.js';
import { getGameWorldData } from '../data/gameLevels.js';
import { sounds } from '../core/soundFX.js';

export class LevelSelectUI {
  constructor(onStartLevel) {
    this.onStartLevel = onStartLevel;
    this.currentGame = null;
    this.worldData = null;
    this.selectedLevelNum = 1;
  }

  render(container, game) {
    this.currentGame = game;
    this.worldData = getGameWorldData(game);
    const progress = portalState.getGameProgress(game.id);
    this.selectedLevelNum = Math.min(progress.unlockedLevel || 1, progress.selectedLevel || 1);

    container.innerHTML = `
      <div class="level-select-dashboard">
        <!-- Game Themed Header -->
        <div class="level-select-header" style="background: ${this.worldData.themeColor};">
          <div class="header-info">
            <span class="game-badge">CAMPAIGN & LEVEL PROGRESSION</span>
            <h2>${this.worldData.title}</h2>
          </div>
          <div class="header-stars-badge">
            <span>⭐</span>
            <b id="game-total-stars-count">0 / 0</b>
          </div>
        </div>

        <!-- Worlds & Level Nodes -->
        <div class="level-worlds-container" id="level-worlds-container"></div>

        <!-- Mission Briefing & Start Deck -->
        <div class="mission-briefing-deck" id="mission-briefing-deck"></div>
      </div>
    `;

    this.renderWorldNodes(container);
    this.renderMissionBriefing(container);
  }

  renderWorldNodes(container) {
    const worldsContainer = container.querySelector('#level-worlds-container');
    if (!worldsContainer) return;
    worldsContainer.innerHTML = '';

    const progress = portalState.getGameProgress(this.currentGame.id);
    let totalStarsEarned = 0;
    let maxPossibleStars = 0;

    this.worldData.worlds.forEach(world => {
      const worldCard = document.createElement('div');
      worldCard.className = 'world-section-card';
      worldCard.innerHTML = `
        <div class="world-title-row">
          <span class="world-icon">${world.icon}</span>
          <h3>${world.name}</h3>
        </div>
        <div class="levels-track-row"></div>
      `;

      const trackRow = worldCard.querySelector('.levels-track-row');

      world.levels.forEach(lvl => {
        maxPossibleStars += 3;
        const lvlProg = progress.levels[lvl.level] || { stars: 0, completed: false };
        totalStarsEarned += (lvlProg.stars || 0);

        const isLocked = lvl.level > progress.unlockedLevel;
        const isSelected = lvl.level === this.selectedLevelNum;

        const node = document.createElement('div');
        node.className = `level-node-btn ${isLocked ? 'locked' : ''} ${isSelected ? 'selected' : ''} ${lvlProg.completed ? 'completed' : ''}`;
        
        let starsHtml = '';
        for (let i = 1; i <= 3; i++) {
          starsHtml += `<span class="star-icon ${i <= lvlProg.stars ? 'earned' : 'empty'}">⭐</span>`;
        }

        node.innerHTML = `
          <div class="node-number">${isLocked ? '🔒' : lvl.level}</div>
          <div class="node-stars">${starsHtml}</div>
          <span class="node-title">${lvl.title}</span>
        `;

        if (!isLocked) {
          node.addEventListener('click', () => {
            sounds.playClick();
            this.selectedLevelNum = lvl.level;
            portalState.setSelectedLevel(this.currentGame.id, lvl.level);
            this.render(container, this.currentGame);
          });
        }

        trackRow.appendChild(node);
      });

      worldsContainer.appendChild(worldCard);
    });

    const starsCounter = container.querySelector('#game-total-stars-count');
    if (starsCounter) {
      starsCounter.textContent = `${totalStarsEarned} / ${maxPossibleStars} STARS`;
    }
  }

  renderMissionBriefing(container) {
    const briefDeck = container.querySelector('#mission-briefing-deck');
    if (!briefDeck) return;

    // Find level config
    let selectedLvl = null;
    for (const world of this.worldData.worlds) {
      const found = world.levels.find(l => l.level === this.selectedLevelNum);
      if (found) {
        selectedLvl = found;
        break;
      }
    }

    if (!selectedLvl) return;

    const diffStars = '★'.repeat(selectedLvl.difficulty) + '☆'.repeat(5 - selectedLvl.difficulty);

    briefDeck.innerHTML = `
      <div class="briefing-card">
        <div class="briefing-top">
          <div>
            <span class="briefing-sub">LEVEL ${selectedLvl.level < 10 ? '0' + selectedLvl.level : selectedLvl.level} BRIEFING</span>
            <h3>${selectedLvl.title}</h3>
          </div>
          <div class="difficulty-indicator">
            <span>Difficulty</span>
            <b style="color: #ffd166;">${diffStars}</b>
          </div>
        </div>

        <p class="briefing-objective">🎯 <b>Objective:</b> ${selectedLvl.objective}</p>

        <div class="briefing-stars-target">
          <div class="star-target-col">
            <span>⭐ 1 Star</span>
            <b>${selectedLvl.starThresholds[0]} PTS</b>
          </div>
          <div class="star-target-col">
            <span>⭐⭐ 2 Stars</span>
            <b>${selectedLvl.starThresholds[1]} PTS</b>
          </div>
          <div class="star-target-col">
            <span>⭐⭐⭐ 3 Stars</span>
            <b>${selectedLvl.starThresholds[2]} PTS</b>
          </div>
        </div>

        <div class="briefing-rewards-row">
          <span>🎁 Level Rewards:</span>
          <b>🪙 +${selectedLvl.coinsReward} Coins</b>
          <b>⚡ +${selectedLvl.xpReward} XP</b>
          ${selectedLvl.unlockReward ? `<b style="color: #00f2fe;">🔓 ${selectedLvl.unlockReward}</b>` : ''}
        </div>

        <button id="btn-start-selected-level" class="btn btn-primary" style="width: 100%; margin-top: 14px; font-size: 1.2rem; padding: 14px 24px;">
          🎮 START LEVEL ${selectedLvl.level} ➔
        </button>
      </div>
    `;

    briefDeck.querySelector('#btn-start-selected-level')?.addEventListener('click', () => {
      sounds.playPowerup();
      this.onStartLevel(selectedLvl);
    });
  }
}
