import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class VortexOrbiterGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, { title: 'Vortex Orbiter', ...config });
    this.createCanvas(860, 520);
    this.orbitRadius = 120;
    this.orbAngle = 0;
    this.currentRing = 1;
    this.rings = [80, 130, 180];
    this.hazards = [];
    this.initControls();
    this.showStartCard({ title: 'VORTEX ORBITER', icon: '🌀', objective: 'Hop between concentric orbital rings to avoid orbiting anomalies!', controls: 'Spacebar / Tap to switch ring.' });
  }
  initControls() {
    const hop = () => {
      if (this.state === GameState.MENU) { this.start(); return; }
      if (this.state !== GameState.PLAYING) return;
      sounds.playJump?.();
      this.currentRing = (this.currentRing + 1) % this.rings.length;
      this.score += 5;
    };
    this.addEventListenerTracked(window, 'keydown', (e) => { if (e.code === 'Space') hop(); });
    if (this.canvas) this.addEventListenerTracked(this.canvas, 'pointerdown', hop);
  }
  update(delta) {
    if (this.state !== GameState.PLAYING) return;
    this.orbAngle += 2.5 * delta;
    this.orbitRadius = this.rings[this.currentRing];
    if (Math.random() < 0.04) {
      this.hazards.push({ ring: Math.floor(Math.random() * this.rings.length), angle: this.orbAngle + Math.PI });
    }
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i];
      h.angle -= 1.8 * delta;
      if (h.ring === this.currentRing && Math.abs(Math.sin(h.angle - this.orbAngle)) < 0.1) {
        sounds.playGameOver?.();
        this.gameOver(this.score);
        return;
      }
    }
  }
  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#060814'; ctx.fillRect(0, 0, this.width, this.height);
    const cx = this.width / 2, cy = this.height / 2;
    ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2;
    for (const r of this.rings) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = '#00e5ff';
    const ox = cx + Math.cos(this.orbAngle) * this.orbitRadius;
    const oy = cy + Math.sin(this.orbAngle) * this.orbitRadius;
    ctx.beginPath(); ctx.arc(ox, oy, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f43f5e';
    for (const h of this.hazards) {
      const hx = cx + Math.cos(h.angle) * this.rings[h.ring];
      const hy = cy + Math.sin(h.angle) * this.rings[h.ring];
      ctx.beginPath(); ctx.arc(hx, hy, 8, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Outfit, sans-serif'; ctx.fillText('SCORE: ' + this.score, 30, 40);
  }
}