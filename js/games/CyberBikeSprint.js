import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class CyberBikeSprintGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, { title: 'Cyber Bike Sprint', ...config });
    this.createCanvas(860, 520);
    this.x = 430;
    this.speed = 8;
    this.initControls();
    this.showStartCard({ title: 'CYBER BIKE SPRINT', icon: '🏍️', objective: 'Steer the high-speed light cycle through neon checkpoints.', controls: 'A/D or Arrows to Steer.' });
  }
  initControls() {
    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.x -= 25;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.x += 25;
    });
  }
  update() {
    if (this.state !== GameState.PLAYING) return;
    this.score += 2;
  }
  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#070a14'; ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = '#a855f7'; ctx.fillRect(this.x - 12, 400, 24, 50);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Outfit, sans-serif'; ctx.fillText('SPEED: 180 KM/H | ' + this.score, 30, 40);
  }
}