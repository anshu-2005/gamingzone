import { sounds } from '../core/soundFX.js';

export class VersusModeSelectUI {
  constructor(onSelectMode) {
    this.onSelectMode = onSelectMode;
  }

  render(container, game) {
    container.innerHTML = '';

    const hub = document.createElement('div');
    hub.className = 'versus-hub-modal';
    hub.innerHTML = `
      <div class="cricket-hub-header">
        <div class="cricket-badge-ribbon">👥 HEAD-TO-HEAD BATTLE ARENA</div>
        <h2 class="cricket-hub-title">${game.title}</h2>
        <p class="cricket-hub-subtitle">Play solo against Smart AI or battle a friend in 2-Player Local Mode!</p>
      </div>

      <div class="versus-modes-grid">
        <!-- 1 Player vs CPU -->
        <div class="cricket-mode-card" data-mode="1p_cpu">
          <div class="mode-icon-tag">🤖 1 PLAYER</div>
          <h3>Solo vs Smart AI</h3>
          <p>Challenge our intelligent AI bot with dynamic adaptive difficulty and reaction reflexes.</p>
          <div class="mode-stats-row">
            <span>🏆 First to 7 Points</span>
            <span>⚡ Adaptive AI</span>
          </div>
          <button class="btn-launch-mode">PLAY VS CPU 🤖</button>
        </div>

        <!-- 2 Player Local -->
        <div class="cricket-mode-card featured-mode" data-mode="2p_local">
          <div class="mode-badge-hot">👥 2 PLAYERS</div>
          <div class="mode-icon-tag">🔥 LOCAL VERSUS</div>
          <h3>2-Player Local Battle</h3>
          <p>Split controls on one keyboard or touch screen! Player 1 (W/S) vs Player 2 (Up/Down).</p>
          <div class="mode-stats-row">
            <span>⚔️ Real-Time 1v1</span>
            <span>🏆 First to 10 Points</span>
          </div>
          <button class="btn-launch-mode">START 2-PLAYER BATTLE 🔥</button>
        </div>
      </div>
    `;

    hub.querySelectorAll('.cricket-mode-card').forEach((card) => {
      card.addEventListener('click', () => {
        sounds.playClick();
        const mode = card.getAttribute('data-mode');
        this.onSelectMode({ mode, isTwoPlayer: mode === '2p_local' });
      });
    });

    container.appendChild(hub);
  }
}
