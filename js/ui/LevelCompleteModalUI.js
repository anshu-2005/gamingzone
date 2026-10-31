import { sounds } from '../core/soundFX.js';

export class LevelCompleteModalUI {
  constructor(onNextLevel, onReplay, onLevelMap, onBackToPortal) {
    this.onNextLevel = onNextLevel;
    this.onReplay = onReplay;
    this.onLevelMap = onLevelMap;
    this.onBackToPortal = onBackToPortal;
    this.init();
  }

  init() {
    document.getElementById('btn-modal-lvl-next')?.addEventListener('click', () => {
      sounds.playClick();
      this.close();
      this.onNextLevel();
    });

    document.getElementById('btn-modal-lvl-replay')?.addEventListener('click', () => {
      sounds.playClick();
      this.close();
      this.onReplay();
    });

    document.getElementById('btn-modal-lvl-map')?.addEventListener('click', () => {
      sounds.playClick();
      this.close();
      this.onLevelMap();
    });

    document.getElementById('btn-modal-lvl-portal')?.addEventListener('click', () => {
      sounds.playClick();
      this.close();
      this.onBackToPortal();
    });
  }

  show(result) {
    const modal = document.getElementById('screen-level-complete-modal');
    if (!modal) return;

    const isFailure = result.score === 0 || result.failed === true || result.isGameOver === true;
    const isHighScoreMode = result.isHighscore === true || result.gameMode === 'highscore';

    if (isFailure) {
      sounds.playHit();
    } else {
      sounds.playLevelComplete();
    }

    // Fill Modal Data
    const iconEl = modal.querySelector('.level-complete-dialog > div:first-child');
    if (iconEl) iconEl.textContent = isFailure ? '💀' : '🎉';

    let titleText = 'LEVEL COMPLETE!';
    if (isFailure) {
      titleText = 'GAME OVER';
    } else if (isHighScoreMode) {
      titleText = 'NEW SCORE SET!';
    } else if (result.gameTitle) {
      titleText = `${result.gameTitle.toUpperCase()}!`;
    }

    document.getElementById('modal-lvl-title').textContent = titleText;
    document.getElementById('modal-lvl-title').style.color = isFailure ? '#ff4d6d' : '#ffd166';
    document.getElementById('modal-lvl-score').textContent = (result.score || 0).toLocaleString();
    document.getElementById('modal-lvl-coins').textContent = `+${result.coinsEarned || 50} 🪙`;
    document.getElementById('modal-lvl-xp').textContent = `+${result.xpEarned || 100} XP`;
    document.getElementById('modal-lvl-unlock').textContent = isFailure ? 'Don\'t give up! Try again!' : (result.unlockReward || 'Score Recorded 🏆');

    // Button visibility
    const nextBtn = document.getElementById('btn-modal-lvl-next');
    const mapBtn = document.getElementById('btn-modal-lvl-map');
    const replayBtn = document.getElementById('btn-modal-lvl-replay');

    if (isFailure || isHighScoreMode) {
      if (nextBtn) nextBtn.style.display = 'none';
      if (mapBtn) mapBtn.style.display = 'none';
      if (replayBtn) {
        replayBtn.style.flex = '2';
        replayBtn.textContent = '🔄 PLAY AGAIN';
        replayBtn.className = 'btn btn-green-glow';
      }
    } else {
      if (nextBtn) {
        nextBtn.style.display = 'block';
        nextBtn.style.flex = '2';
      }
      if (mapBtn) mapBtn.style.display = 'block';
      if (replayBtn) {
        replayBtn.style.flex = '1';
        replayBtn.textContent = '🔄 REPLAY';
        replayBtn.className = 'btn btn-blue';
      }
    }

    // Level Up banner
    const lvlUpBanner = document.getElementById('modal-lvl-levelup-banner');
    if (lvlUpBanner) {
      if (result.leveledUp) {
        lvlUpBanner.classList.remove('hidden');
        document.getElementById('modal-lvl-newlevel').textContent = `PLAYER LEVEL UP! REACHED LEVEL ${result.newLevel} 🚀`;
      } else {
        lvlUpBanner.classList.add('hidden');
      }
    }

    // Animated Star Popups
    const starsContainer = document.getElementById('modal-lvl-stars-row');
    starsContainer.innerHTML = '';
    
    for (let i = 1; i <= 3; i++) {
      const starSpan = document.createElement('span');
      starSpan.className = 'modal-star-icon empty';
      starSpan.textContent = isFailure ? '🖤' : '⭐';
      starsContainer.appendChild(starSpan);
    }

    modal.classList.remove('hidden');

    // Trigger star pop animations
    const starsToShow = isFailure ? 0 : (result.stars || 1);
    const starElements = starsContainer.querySelectorAll('.modal-star-icon');
    for (let i = 0; i < starsToShow; i++) {
      setTimeout(() => {
        if (starElements[i]) {
          starElements[i].classList.remove('empty');
          starElements[i].classList.add('popped');
          sounds.playStar(i + 1);
        }
      }, 300 + i * 250);
    }
  }

  close() {
    const modal = document.getElementById('screen-level-complete-modal');
    if (modal) modal.classList.add('hidden');
  }
}
