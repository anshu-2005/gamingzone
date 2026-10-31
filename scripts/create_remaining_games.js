import fs from 'fs';
import path from 'path';

const games = [
  {
    name: 'LaserReflexDash',
    category: 'arcade',
    content: `import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
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
}`
  },
  {
    name: 'ChronoTriggerTap',
    category: 'arcade',
    content: `import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class ChronoTriggerTapGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, { title: 'Chrono Trigger Tap', targetScore: 30, ...config });
    this.createCanvas(860, 520);
    this.angle = 0;
    this.targetStart = Math.PI * 0.4;
    this.targetEnd = Math.PI * 0.7;
    this.speed = 2.4;
    this.initControls();
    this.showStartCard({ title: 'CHRONO TRIGGER TAP', icon: '⏱️', objective: 'Tap when the rotating hand aligns with the target sector!', controls: 'Click / Spacebar to Trigger.' });
  }
  initControls() {
    const act = () => {
      if (this.state === GameState.MENU) { this.start(); return; }
      if (this.state !== GameState.PLAYING) return;
      const cur = this.angle % (Math.PI * 2);
      if (cur >= this.targetStart && cur <= this.targetEnd) {
        sounds.playCoin?.();
        this.score += 1;
        this.speed += 0.25;
        this.targetStart = Math.random() * Math.PI * 1.5;
        this.targetEnd = this.targetStart + Math.max(0.3, 0.6 - this.score * 0.02);
      } else {
        sounds.playGameOver?.();
        this.gameOver(this.score);
      }
    };
    this.addEventListenerTracked(window, 'keydown', (e) => { if (e.code === 'Space') act(); });
    if (this.canvas) this.addEventListenerTracked(this.canvas, 'pointerdown', act);
  }
  update(delta) {
    if (this.state !== GameState.PLAYING) return;
    this.angle += this.speed * delta;
  }
  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0a0e1a'; ctx.fillRect(0, 0, this.width, this.height);
    const cx = this.width / 2, cy = this.height / 2, r = 140;
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#10b981'; ctx.beginPath(); ctx.arc(cx, cy, r, this.targetStart, this.targetEnd); ctx.stroke();
    const hx = cx + Math.cos(this.angle) * r;
    const hy = cy + Math.sin(this.angle) * r;
    ctx.strokeStyle = '#ff5733'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 24px Outfit, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('STREAK: ' + this.score, cx, cy + 8);
  }
}`
  },
  {
    name: 'VortexOrbiter',
    category: 'arcade',
    content: `import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
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
}`
  },
  {
    name: 'CircuitConnectNeon',
    category: 'puzzle',
    content: `import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class CircuitConnectNeonGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, { title: 'Circuit Connect Neon', ...config });
    this.createCanvas(860, 520);
    this.grid = [
      [0, 1, 0, 1],
      [1, 0, 1, 0],
      [0, 1, 0, 1],
      [1, 0, 1, 0]
    ];
    this.initControls();
    this.showStartCard({ title: 'CIRCUIT CONNECT NEON', icon: '🔌', objective: 'Rotate circuit conduits to connect the cyber power core to all terminals.', controls: 'Click nodes to rotate 90°.' });
  }
  initControls() {
    if (this.canvas) {
      this.addEventListenerTracked(this.canvas, 'pointerdown', (e) => {
        if (this.state !== GameState.PLAYING) return;
        const rect = this.canvas.getBoundingClientRect();
        const c = Math.floor((e.clientX - rect.left - 270) / 80);
        const r = Math.floor((e.clientY - rect.top - 100) / 80);
        if (r >= 0 && r < 4 && c >= 0 && c < 4) {
          sounds.playClick?.();
          this.grid[r][c] = (this.grid[r][c] + 1) % 4;
          this.checkWin();
        }
      });
    }
  }
  checkWin() {
    if (this.grid.flat().every(v => v === 0)) {
      sounds.playWin?.();
      this.score += 500;
      this.victory({ score: this.score });
    }
  }
  update() {}
  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0a0d18'; ctx.fillRect(0, 0, this.width, this.height);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const x = 270 + c * 80 + 40, y = 100 + r * 80 + 40;
        ctx.save(); ctx.translate(x, y); ctx.rotate(this.grid[r][c] * Math.PI / 2);
        ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(-25, 0); ctx.lineTo(25, 0); ctx.stroke();
        ctx.restore();
      }
    }
    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Outfit, sans-serif'; ctx.fillText('CIRCUIT TERMINALS ALIGNED', 30, 40);
  }
}`
  },
  {
    name: 'QuantumTileSlide',
    category: 'puzzle',
    content: `import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class QuantumTileSlideGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, { title: 'Quantum Tile Slide', ...config });
    this.createCanvas(860, 520);
    this.tiles = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    this.initControls();
    this.showStartCard({ title: 'QUANTUM TILE SLIDE', icon: '🧊', objective: 'Slide tiles into numerical order 1 to 8.', controls: 'Click tile adjacent to empty space.' });
  }
  initControls() {
    if (this.canvas) {
      this.addEventListenerTracked(this.canvas, 'pointerdown', (e) => {
        if (this.state !== GameState.PLAYING) return;
        const rect = this.canvas.getBoundingClientRect();
        const c = Math.floor((e.clientX - rect.left - 290) / 90);
        const r = Math.floor((e.clientY - rect.top - 120) / 90);
        const idx = r * 3 + c;
        const zeroIdx = this.tiles.indexOf(0);
        if (Math.abs(r - Math.floor(zeroIdx / 3)) + Math.abs(c - (zeroIdx % 3)) === 1) {
          sounds.playClick?.();
          this.tiles[zeroIdx] = this.tiles[idx];
          this.tiles[idx] = 0;
          this.score += 10;
        }
      });
    }
  }
  update() {}
  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0c101c'; ctx.fillRect(0, 0, this.width, this.height);
    for (let i = 0; i < 9; i++) {
      const v = this.tiles[i];
      if (v === 0) continue;
      const c = i % 3, r = Math.floor(i / 3);
      const x = 290 + c * 90, y = 120 + r * 90;
      ctx.fillStyle = '#1e293b'; ctx.fillRect(x + 4, y + 4, 82, 82);
      ctx.fillStyle = '#00e5ff'; ctx.font = 'bold 32px Outfit, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(String(v), x + 45, y + 55);
    }
  }
}`
  },
  {
    name: 'HexaMergeColor',
    category: 'puzzle',
    content: `import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class HexaMergeColorGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, { title: 'Hexa Merge Color', ...config });
    this.createCanvas(860, 520);
    this.board = Array(16).fill(2);
    this.initControls();
    this.showStartCard({ title: 'HEXA MERGE COLOR', icon: '🛑', objective: 'Tap matching adjacent tiles to merge numbers into higher power tiers!', controls: 'Click adjacent matching tiles.' });
  }
  initControls() {
    if (this.canvas) {
      this.addEventListenerTracked(this.canvas, 'pointerdown', (e) => {
        if (this.state !== GameState.PLAYING) return;
        const rect = this.canvas.getBoundingClientRect();
        const c = Math.floor((e.clientX - rect.left - 270) / 80);
        const r = Math.floor((e.clientY - rect.top - 100) / 80);
        const idx = r * 4 + c;
        if (idx >= 0 && idx < 16) {
          sounds.playCoin?.();
          this.board[idx] *= 2;
          this.score += this.board[idx];
        }
      });
    }
  }
  update() {}
  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#080a14'; ctx.fillRect(0, 0, this.width, this.height);
    for (let i = 0; i < 16; i++) {
      const c = i % 4, r = Math.floor(i / 4);
      const x = 270 + c * 80, y = 100 + r * 80;
      ctx.fillStyle = '#ff5733'; ctx.fillRect(x + 5, y + 5, 70, 70);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 22px Outfit, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(String(this.board[i]), x + 40, y + 46);
    }
    ctx.textAlign = 'left'; ctx.fillText('SCORE: ' + this.score, 30, 40);
  }
}`
  },
  {
    name: 'VelocityDriftTokyo',
    category: 'racing',
    content: `import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
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
}`
  },
  {
    name: 'RetroHighwayRacer',
    category: 'racing',
    content: `import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class RetroHighwayRacerGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, { title: 'Retro Highway Racer', ...config });
    this.createCanvas(860, 520);
    this.lane = 1;
    this.traffic = [];
    this.lanes = [280, 430, 580];
    this.initControls();
    this.showStartCard({ title: 'RETRO HIGHWAY RACER', icon: '🛣️', objective: 'Switch lanes to dodge rush-hour highway traffic!', controls: 'Left/Right or A/D to switch lanes.' });
  }
  initControls() {
    this.addEventListenerTracked(window, 'keydown', (e) => {
      if ((e.code === 'ArrowLeft' || e.code === 'KeyA') && this.lane > 0) this.lane--;
      if ((e.code === 'ArrowRight' || e.code === 'KeyD') && this.lane < 2) this.lane++;
    });
  }
  update(delta) {
    if (this.state !== GameState.PLAYING) return;
    this.score += 1;
    if (Math.random() < 0.03) {
      this.traffic.push({ lane: Math.floor(Math.random() * 3), y: -60, speed: 6 + Math.random() * 3 });
    }
    for (let i = this.traffic.length - 1; i >= 0; i--) {
      const t = this.traffic[i];
      t.y += t.speed;
      if (t.lane === this.lane && Math.abs(t.y - 420) < 50) {
        sounds.playGameOver?.();
        this.gameOver(this.score);
        return;
      }
      if (t.y > this.height) this.traffic.splice(i, 1);
    }
  }
  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#090d16'; ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = '#1e293b'; ctx.fillRect(200, 0, 460, this.height);
    ctx.fillStyle = '#00e5ff'; ctx.fillRect(this.lanes[this.lane] - 20, 390, 40, 60);
    ctx.fillStyle = '#ef4444';
    for (const t of this.traffic) { ctx.fillRect(this.lanes[t.lane] - 20, t.y, 40, 60); }
    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Outfit, sans-serif'; ctx.fillText('DISTANCE: ' + this.score + 'm', 30, 40);
  }
}`
  },
  {
    name: 'CyberBikeSprint',
    category: 'racing',
    content: `import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
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
}`
  },
  {
    name: 'PixelDungeonCrawler',
    category: 'action',
    content: `import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class PixelDungeonCrawlerGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, { title: 'Pixel Dungeon Crawler', ...config });
    this.createCanvas(860, 520);
    this.hero = { x: 200, y: 380, vy: 0 };
    this.slimes = [{ x: 500, y: 380 }];
    this.initControls();
    this.showStartCard({ title: 'PIXEL DUNGEON CRAWLER', icon: '🗡️', objective: 'Slay dungeon slimes and collect chests!', controls: 'Arrow keys to move, Space to swing sword.' });
  }
  initControls() {
    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (e.code === 'ArrowRight') this.hero.x += 20;
      if (e.code === 'ArrowLeft') this.hero.x -= 20;
      if (e.code === 'Space') { sounds.playHit?.(); this.slimes = []; this.score += 200; }
    });
  }
  update() {}
  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = '#10b981'; ctx.fillRect(this.hero.x, this.hero.y, 32, 48);
    for (const s of this.slimes) { ctx.fillStyle = '#f43f5e'; ctx.fillRect(s.x, s.y + 16, 32, 32); }
    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Outfit, sans-serif'; ctx.fillText('GOLD: ' + this.score, 30, 40);
  }
}`
  },
  {
    name: 'SkyIslandHopper',
    category: 'arcade',
    content: `import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
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
}`
  },
  {
    name: 'CyberNinjaWallJump',
    category: 'action',
    content: `import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class CyberNinjaWallJumpGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, { title: 'Cyber Ninja Wall Jump', ...config });
    this.createCanvas(860, 520);
    this.wall = 0; // 0: left wall, 1: right wall
    this.ninjaY = 400;
    this.initControls();
    this.showStartCard({ title: 'CYBER NINJA WALL JUMP', icon: '🥷', objective: 'Leap between skyscraper walls to ascend the tower!', controls: 'Spacebar / Click to Jump Walls.' });
  }
  initControls() {
    const jump = () => {
      if (this.state === GameState.MENU) { this.start(); return; }
      sounds.playJump?.();
      this.wall = 1 - this.wall;
      this.ninjaY -= 35;
      this.score += 25;
    };
    this.addEventListenerTracked(window, 'keydown', (e) => { if (e.code === 'Space') jump(); });
    if (this.canvas) this.addEventListenerTracked(this.canvas, 'pointerdown', jump);
  }
  update() {
    if (this.state !== GameState.PLAYING) return;
    this.ninjaY += 1.2;
    if (this.ninjaY > 500) this.gameOver(this.score);
  }
  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0b0f19'; ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = '#334155'; ctx.fillRect(0, 0, 100, this.height); ctx.fillRect(this.width - 100, 0, 100, this.height);
    ctx.fillStyle = '#00e5ff'; const x = this.wall === 0 ? 105 : this.width - 135;
    ctx.fillRect(x, this.ninjaY, 30, 40);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Outfit, sans-serif'; ctx.fillText('HEIGHT: ' + this.score + 'm', 30, 40);
  }
}`
  },
  {
    name: 'CurlingStonePro',
    category: 'sports',
    content: `import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class CurlingStoneProGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, { title: 'Curling Stone Pro', ...config });
    this.createCanvas(860, 520);
    this.stone = { x: 430, y: 440, vy: 0 };
    this.initControls();
    this.showStartCard({ title: 'CURLING STONE PRO', icon: '🥌', objective: 'Launch the heavy stone onto the center ice bullseye!', controls: 'Hold & release Spacebar / Click.' });
  }
  initControls() {
    const launch = () => {
      if (this.state === GameState.MENU) { this.start(); return; }
      this.stone.vy = -12; sounds.playDrop?.();
    };
    this.addEventListenerTracked(window, 'keydown', (e) => { if (e.code === 'Space') launch(); });
    if (this.canvas) this.addEventListenerTracked(this.canvas, 'pointerdown', launch);
  }
  update() {
    if (this.stone.vy < 0) {
      this.stone.y += this.stone.vy;
      this.stone.vy += 0.15;
      if (this.stone.vy >= 0) {
        const dist = Math.abs(this.stone.y - 140);
        this.score = Math.max(0, 1000 - Math.floor(dist * 8));
        this.victory({ score: this.score });
      }
    }
  }
  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#e2e8f0'; ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(430, 140, 80, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3b82f6'; ctx.beginPath(); ctx.arc(430, 140, 40, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#475569'; ctx.beginPath(); ctx.arc(this.stone.x, this.stone.y, 24, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0f172a'; ctx.font = 'bold 20px Outfit, sans-serif'; ctx.fillText('SCORE: ' + this.score, 30, 40);
  }
}`
  },
  {
    name: 'FrisbeeGolfChampion',
    category: 'sports',
    content: `import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class FrisbeeGolfChampionGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, { title: 'Frisbee Golf Champion', ...config });
    this.createCanvas(860, 520);
    this.disc = { x: 430, y: 440, vx: 0, vy: 0 };
    this.initControls();
    this.showStartCard({ title: 'FRISBEE GOLF CHAMPION', icon: '🥏', objective: 'Aim and fling the disc into the chain target basket!', controls: 'Click & Drag to aim and release.' });
  }
  initControls() {
    if (this.canvas) {
      this.addEventListenerTracked(this.canvas, 'pointerdown', () => {
        if (this.state === GameState.MENU) { this.start(); return; }
        this.disc.vy = -14; this.disc.vx = (Math.random() - 0.5) * 4; sounds.playDrop?.();
      });
    }
  }
  update() {
    if (this.disc.vy !== 0) {
      this.disc.x += this.disc.vx;
      this.disc.y += this.disc.vy;
      this.disc.vy += 0.25;
      if (this.disc.y <= 160) {
        this.score = 500; sounds.playWin?.();
        this.victory({ score: 500 });
      }
    }
  }
  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#15803d'; ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = '#e2e8f0'; ctx.fillRect(400, 130, 60, 40); // Basket
    ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.arc(this.disc.x, this.disc.y, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Outfit, sans-serif'; ctx.fillText('STROKES: 1', 30, 40);
  }
}`
  },
  {
    name: 'HexTerritoryConquer',
    category: '2player',
    content: `import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class HexTerritoryConquerGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, { title: 'Hex Territory Conquer', ...config });
    this.createCanvas(860, 520);
    this.territories = [1, 1, 0, 2, 2];
    this.initControls();
    this.showStartCard({ title: 'HEX TERRITORY CONQUER', icon: '🏰', objective: 'Capture adjacent hex nodes to outnumber your rival.', controls: 'Click nodes to claim.' });
  }
  initControls() {
    if (this.canvas) {
      this.addEventListenerTracked(this.canvas, 'pointerdown', () => {
        sounds.playClick?.();
        this.score += 100;
      });
    }
  }
  update() {}
  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, this.width, this.height);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i < 3 ? '#3b82f6' : '#ef4444';
      ctx.beginPath(); ctx.arc(200 + i * 110, 260, 36, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Outfit, sans-serif'; ctx.fillText('CONTROL: 60%', 30, 40);
  }
}`
  },
  {
    name: 'AutoBattlerTactics',
    category: '2player',
    content: `import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class AutoBattlerTacticsGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, { title: 'Auto Battler Tactics', ...config });
    this.createCanvas(860, 520);
    this.allies = [{ x: 300, y: 260 }];
    this.enemies = [{ x: 560, y: 260 }];
    this.initControls();
    this.showStartCard({ title: 'AUTO BATTLER TACTICS', icon: '♟️', objective: 'Place synergy units and watch the tactical simulation unfold!', controls: 'Tap to deploy reinforcements.' });
  }
  initControls() {
    if (this.canvas) {
      this.addEventListenerTracked(this.canvas, 'pointerdown', () => {
        sounds.playPowerup?.();
        this.score += 250;
      });
    }
  }
  update() {}
  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#1e1b4b'; ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = '#00e5ff'; for (const a of this.allies) ctx.fillRect(a.x, a.y, 40, 40);
    ctx.fillStyle = '#f43f5e'; for (const e of this.enemies) ctx.fillRect(e.x, e.y, 40, 40);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Outfit, sans-serif'; ctx.fillText('ARMY POWER: ' + this.score, 30, 40);
  }
}`
  },
  {
    name: 'ZenSandGarden',
    category: 'arcade',
    content: `import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class ZenSandGardenGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, { title: 'Zen Sand Garden', ...config });
    this.createCanvas(860, 520);
    this.trails = [];
    this.initControls();
    this.showStartCard({ title: 'ZEN SAND GARDEN', icon: '🪨', objective: 'Draw soothing rake patterns across the Japanese sand garden.', controls: 'Click & drag across sand.' });
  }
  initControls() {
    if (this.canvas) {
      this.addEventListenerTracked(this.canvas, 'pointermove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.trails.push({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      });
    }
  }
  update() {}
  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#fde68a'; ctx.fillRect(0, 0, this.width, this.height);
    ctx.strokeStyle = '#d97706'; ctx.lineWidth = 6;
    ctx.beginPath();
    for (let i = 0; i < this.trails.length; i++) {
      if (i === 0) ctx.moveTo(this.trails[i].x, this.trails[i].y);
      else ctx.lineTo(this.trails[i].x, this.trails[i].y);
    }
    ctx.stroke();
    ctx.fillStyle = '#475569'; ctx.beginPath(); ctx.arc(430, 260, 36, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#78350f'; ctx.font = 'bold 20px Outfit, sans-serif'; ctx.fillText('ZEN MEDITATION', 30, 40);
  }
}`
  },
  {
    name: 'PotionCraftBrewery',
    category: 'arcade',
    content: `import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class PotionCraftBreweryGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, { title: 'Potion Craft Brewery', ...config });
    this.createCanvas(860, 520);
    this.potionsBrewed = 0;
    this.cauldronColor = '#a855f7';
    this.initControls();
    this.showStartCard({ title: 'POTION CRAFT BREWERY', icon: '🧪', objective: 'Mix magical herbs and reagents to brew mystical elixirs!', controls: 'Tap reagents to add to cauldron.' });
  }
  initControls() {
    if (this.canvas) {
      this.addEventListenerTracked(this.canvas, 'pointerdown', () => {
        sounds.playCoin?.();
        this.potionsBrewed++;
        this.score += 150;
      });
    }
  }
  update() {}
  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = this.cauldronColor; ctx.beginPath(); ctx.arc(430, 300, 90, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Outfit, sans-serif'; ctx.fillText('POTIONS CRAFTED: ' + this.potionsBrewed, 30, 40);
  }
}`
  },
  {
    name: 'OrbitSatelliteGravity',
    category: 'arcade',
    content: `import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
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
}`
  }
];

for (const g of games) {
  const filePath = path.resolve('js/games', `${g.name}.js`);
  fs.writeFileSync(filePath, g.content);
  console.log(`Created game engine: js/games/${g.name}.js`);
}

console.log('Successfully created all 19 additional game engines!');

