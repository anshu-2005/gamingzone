import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class LaserReflexDashGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, { title: 'Laser Reflex Dash', targetScore: 1000, ...config });
    this.createCanvas(860, 520);
    this.player = { x: 430, y: 440, vx: 0, speed: 7.5, size: 28 };
    this.lasers = [];
    this.spawnTimer = 0;
    this.initControls();
    this.showStartCard({ title: 'LASER REFLEX DASH', icon: '⚡', objective: 'Dodge descending laser beams! Steer left/right or tap sides to dash.', controls: 'A/D or Left/Right Arrow Keys.' });
  }
  initControls() {
    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.player.vx = -this.player.speed;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.player.vx = this.player.speed;
    });
    this.addEventListenerTracked(window, 'keyup', () => this.player.vx = 0);
  }
  update(delta) {
    if (this.state !== GameState.PLAYING) return;
    this.player.x += this.player.vx;
    this.player.x = Math.max(30, Math.min(this.width - 30, this.player.x));
    this.score += 1;
    this.spawnTimer += delta;
    if (this.spawnTimer > 0.4) {
      this.spawnTimer = 0;
      this.lasers.push({ x: Math.random() * (this.width - 60) + 30, y: -20, vy: 6 + Math.random() * 4, len: 40 });
    }
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const l = this.lasers[i];
      l.y += l.vy;
      if (Math.hypot(l.x - this.player.x, l.y - this.player.y) < this.player.size) {
        sounds.playGameOver?.();
        this.gameOver(this.score, { hits: 1 });
        return;
      }
      if (l.y > this.height) this.lasers.splice(i, 1);
    }
  }
  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#060913'; ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = '#00e5ff'; ctx.shadowColor = '#00e5ff'; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(this.player.x, this.player.y, this.player.size / 2, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 4;
    for (const l of this.lasers) {
      ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(l.x, l.y + l.len); ctx.stroke();
    }
    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Outfit, sans-serif'; ctx.fillText('SCORE: ' + this.score, 30, 40);
  }
}