import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class SkyIslandHopperGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, { title: 'Sky Island Hopper', ...config });
    this.createCanvas(860, 520);
    this.player = { x: 430, y: 200, vy: 0 };
    this.initControls();
    this.showStartCard({ title: 'SKY ISLAND HOPPER', icon: '🏝️', objective: 'Bounce upward across floating sky islands!', controls: 'Left / Right to move.' });
  }
  initControls() {
    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (e.code === 'ArrowLeft') this.player.x -= 30;
      if (e.code === 'ArrowRight') this.player.x += 30;
    });
  }
  update(delta) {
    if (this.state !== GameState.PLAYING) return;
    this.player.vy += 0.5;
    this.player.y += this.player.vy;
    if (this.player.y > 420) { this.player.vy = -14; sounds.playJump?.(); this.score += 50; }
  }
  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0369a1'; ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = '#facc15'; ctx.fillRect(this.player.x - 15, this.player.y - 15, 30, 30);
    ctx.fillStyle = '#22c55e'; ctx.fillRect(350, 440, 160, 24);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Outfit, sans-serif'; ctx.fillText('ALTITUDE: ' + this.score + 'm', 30, 40);
  }
}