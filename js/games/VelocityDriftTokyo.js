import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class VelocityDriftTokyoGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, { title: 'Velocity Drift Tokyo', ...config });
    this.createCanvas(860, 520);
    this.car = { x: 430, y: 380, angle: 0, speed: 7.0 };
    this.initControls();
    this.showStartCard({ title: 'VELOCITY DRIFT TOKYO', icon: '🏎️', objective: 'Steer and drift through neon hairpin turns!', controls: 'Left / Right Arrow or A/D to steer.' });
  }
  initControls() {
    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.car.angle -= 0.15;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.car.angle += 0.15;
    });
  }
  update(delta) {
    if (this.state !== GameState.PLAYING) return;
    this.car.x += Math.sin(this.car.angle) * this.car.speed;
    this.car.x = Math.max(80, Math.min(this.width - 80, this.car.x));
    this.score += 2;
  }
  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = '#1e293b'; ctx.fillRect(100, 0, this.width - 200, this.height);
    ctx.save(); ctx.translate(this.car.x, this.car.y); ctx.rotate(this.car.angle);
    ctx.fillStyle = '#ff5733'; ctx.fillRect(-15, -28, 30, 56);
    ctx.restore();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Outfit, sans-serif'; ctx.fillText('DRIFT SCORE: ' + this.score, 30, 40);
  }
}