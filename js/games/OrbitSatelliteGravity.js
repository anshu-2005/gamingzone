import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class OrbitSatelliteGravityGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, { title: 'Orbit Satellite Gravity', ...config });
    this.createCanvas(860, 520);
    this.sat = { x: 300, y: 150, vx: 2, vy: 0 };
    this.planet = { x: 430, y: 260, mass: 600 };
    this.initControls();
    this.showStartCard({ title: 'ORBIT SATELLITE GRAVITY', icon: '🛰️', objective: 'Maintain orbital equilibrium around a massive star!', controls: 'Click / Space to ignite thruster.' });
  }
  initControls() {
    const thrust = () => {
      sounds.playPowerup?.();
      this.sat.vy -= 1.5;
    };
    this.addEventListenerTracked(window, 'keydown', (e) => { if (e.code === 'Space') thrust(); });
    if (this.canvas) this.addEventListenerTracked(this.canvas, 'pointerdown', thrust);
  }
  update() {
    if (this.state !== GameState.PLAYING) return;
    const dx = this.planet.x - this.sat.x, dy = this.planet.y - this.sat.y;
    const dSq = Math.max(900, dx * dx + dy * dy);
    const f = this.planet.mass / dSq;
    const dist = Math.sqrt(dSq);
    this.sat.vx += (dx / dist) * f;
    this.sat.vy += (dy / dist) * f;
    this.sat.x += this.sat.vx;
    this.sat.y += this.sat.vy;
    this.score += 1;
  }
  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#030712'; ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(this.planet.x, this.planet.y, 40, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#00e5ff'; ctx.beginPath(); ctx.arc(this.sat.x, this.sat.y, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Outfit, sans-serif'; ctx.fillText('ORBIT DURATION: ' + this.score + 's', 30, 40);
  }
}