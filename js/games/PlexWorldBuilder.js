/* ====================================================
   PLEX — RETRO WORLD BUILDER & LABYRINTH
   Inspired by design1online/PLEX (Allegro 2D Engine)
   Dual Modes: Labyrinth Escape Adventure & Real-time Tile Sandbox.
   Collect energy data-chips, dodge cyber drones & build custom realms.
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class PlexWorldBuilderGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'PLEX: Retro World & Labyrinth',
      targetScore: 2500,
      lives: 3,
      ...config
    });

    this.createCanvas(860, 520);

    this.mode = 'STORY'; // 'STORY' or 'BUILD'
    this.selectedBlock = 4; // Stone by default
    this.cols = 20;
    this.rows = 12;
    this.tileSize = 40;
    this.offsetX = 30;
    this.offsetY = 30;

    // Block definitions matching classic PLEX Allegro types
    this.blockTypes = [
      { id: 0, name: 'Empty', color: '#090d16', solid: false },
      { id: 1, name: 'Dirt', color: '#78350f', solid: true },
      { id: 2, name: 'Grass', color: '#15803d', solid: false },
      { id: 3, name: 'Water', color: '#0284c7', solid: true },
      { id: 4, name: 'Stone Wall', color: '#475569', solid: true },
      { id: 5, name: 'Wood Planks', color: '#b45309', solid: false },
      { id: 6, name: 'Glass Window', color: '#38bdf8', solid: true },
      { id: 7, name: 'Door', color: '#f59e0b', solid: false }
    ];

    this.hero = {
      gridX: 2,
      gridY: 2,
      x: 110,
      y: 110,
      energy: 0,
      maxEnergy: 8,
      speed: 160
    };

    this.chips = [];
    this.drones = [];
    this.particles = [];
    this.keys = {};

    this.initMap();
    this.initControls();

    this.attachTouchControls({
      onDirection: (dir, pressed) => {
        if (!pressed) return;
        if (dir === 'UP') this.moveHero(0, -1);
        if (dir === 'DOWN') this.moveHero(0, 1);
        if (dir === 'LEFT') this.moveHero(-1, 0);
        if (dir === 'RIGHT') this.moveHero(1, 0);
      },
      onAction: (pressed) => {
        if (pressed) this.toggleMode();
      },
      actionLabel: '🔨 BUILD/PLAY',
      showDpad: true
    });

    this.showStartCard({
      title: 'PLEX: RETRO WORLD & LABYRINTH',
      icon: '👾',
      objective: 'Collect all 8 cyber energy chips, dodge rogue security bots, or press B to build custom maps!',
      controls: 'WASD / Arrows to Move • B Key to Toggle Builder Mode • Click to place tiles in Builder'
    });
  }

  initMap() {
    this.map = [];
    for (let y = 0; y < this.rows; y++) {
      this.map[y] = [];
      for (let x = 0; x < this.cols; x++) {
        if (x === 0 || y === 0 || x === this.cols - 1 || y === this.rows - 1) {
          this.map[y][x] = 4; // Stone wall perimeter
        } else if ((x === 6 || x === 13) && y > 2 && y < 9) {
          this.map[y][x] = 4; // Inner maze partition
        } else if (y === 6 && (x < 5 || x > 14)) {
          this.map[y][x] = 4;
        } else {
          this.map[y][x] = 0; // Empty
        }
      }
    }

    // Place exit warp gate
    this.exitGate = { x: this.cols - 2, y: this.rows - 2 };

    // Scatter 8 energy chips
    this.chips = [];
    const chipLocations = [
      { x: 3, y: 3 }, { x: 4, y: 8 }, { x: 9, y: 2 }, { x: 10, y: 8 },
      { x: 16, y: 3 }, { x: 17, y: 9 }, { x: 2, y: 9 }, { x: 12, y: 5 }
    ];
    for (const loc of chipLocations) {
      this.chips.push({ x: loc.x, y: loc.y, collected: false });
    }

    // Patrol Drones
    this.drones = [
      { x: 9, y: 4, vx: 1, vy: 0, timer: 0 },
      { x: 15, y: 7, vx: 0, vy: 1, timer: 0 }
    ];

    this.hero.gridX = 2;
    this.hero.gridY = 2;
    this.hero.energy = 0;
  }

  initControls() {
    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING) return;

      if (e.code === 'KeyB') {
        e.preventDefault();
        this.toggleMode();
      } else if (e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        this.moveHero(0, -1);
      } else if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        this.moveHero(0, 1);
      } else if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        this.moveHero(-1, 0);
      } else if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        this.moveHero(1, 0);
      }
    });

    this.addEventListenerTracked(this.canvas, 'pointerdown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width / (window.devicePixelRatio || 1);
      const scaleY = this.canvas.height / rect.height / (window.devicePixelRatio || 1);
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      // Palette selector in build mode
      if (this.mode === 'BUILD' && clickY < 32) {
        const palIdx = Math.floor(clickX / 80);
        if (palIdx >= 0 && palIdx < this.blockTypes.length) {
          this.selectedBlock = palIdx;
          sounds.playClick?.();
          return;
        }
      }

      // Tile placement in build mode
      if (this.mode === 'BUILD') {
        const gx = Math.floor((clickX - this.offsetX) / this.tileSize);
        const gy = Math.floor((clickY - this.offsetY) / this.tileSize);
        if (gx >= 0 && gx < this.cols && gy >= 0 && gy < this.rows) {
          this.map[gy][gx] = this.selectedBlock;
          sounds.playHit?.();
        }
      }
    });
  }

  toggleMode() {
    this.mode = this.mode === 'STORY' ? 'BUILD' : 'STORY';
    sounds.playLevelUp?.();
  }

  moveHero(dx, dy) {
    if (this.mode === 'BUILD') return;

    const nx = this.hero.gridX + dx;
    const ny = this.hero.gridY + dy;

    if (nx < 0 || nx >= this.cols || ny < 0 || ny >= this.rows) return;

    const blockId = this.map[ny][nx];
    const block = this.blockTypes[blockId];
    if (block && block.solid) {
      sounds.playHit?.();
      return;
    }

    this.hero.gridX = nx;
    this.hero.gridY = ny;
    sounds.playJump?.();

    // Check Energy Chip Pickup
    const chip = this.chips.find((c) => c.x === nx && c.y === ny && !c.collected);
    if (chip) {
      chip.collected = true;
      this.hero.energy++;
      this.score += 250;
      sounds.playScore?.();
    }

    // Check Exit Gate
    if (nx === this.exitGate.x && ny === this.exitGate.y) {
      if (this.hero.energy >= this.chips.length) {
        this.score += 1500;
        sounds.playLevelUp?.();
        this.finishGame(this.score, { reason: 'Labyrinth Conquered!' });
      } else {
        sounds.playCrash?.();
      }
    }
  }

  update(dt) {
    // Interpolate hero coords
    const tx = this.offsetX + this.hero.gridX * this.tileSize;
    const ty = this.offsetY + this.hero.gridY * this.tileSize;
    this.hero.x += (tx - this.hero.x) * 14 * dt;
    this.hero.y += (ty - this.hero.y) * 14 * dt;

    if (this.mode === 'STORY') {
      // Drone patrols
      for (const drone of this.drones) {
        drone.timer += dt;
        if (drone.timer > 0.6) {
          drone.timer = 0;
          let nx = drone.x + drone.vx;
          let ny = drone.y + drone.vy;

          if (nx <= 1 || nx >= this.cols - 2 || (this.map[ny] && this.map[ny][nx] !== 0)) {
            drone.vx = -drone.vx;
          } else {
            drone.x = nx;
          }

          if (ny <= 1 || ny >= this.rows - 2 || (this.map[ny] && this.map[ny][drone.x] !== 0)) {
            drone.vy = -drone.vy;
          } else {
            drone.y = ny;
          }

          // Drone collision check
          if (drone.x === this.hero.gridX && drone.y === this.hero.gridY) {
            sounds.playCrash?.();
            this.finishGame(this.score, { reason: 'Intercepted by Security Drone' });
            return;
          }
        }
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  render(ctx) {
    const w = this.baseWidth;
    const h = this.baseHeight;

    // Dark cyberpunk background
    ctx.fillStyle = '#050811';
    ctx.fillRect(0, 0, w, h);

    // Top Mode Bar & Palette
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, 32);

    if (this.mode === 'BUILD') {
      for (let i = 0; i < this.blockTypes.length; i++) {
        const bt = this.blockTypes[i];
        ctx.fillStyle = bt.color;
        ctx.fillRect(i * 80 + 4, 4, 72, 24);
        if (this.selectedBlock === i) {
          ctx.strokeStyle = '#00e5ff';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(i * 80 + 4, 4, 72, 24);
        }
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Outfit';
        ctx.fillText(bt.name, i * 80 + 8, 20);
      }
    } else {
      ctx.fillStyle = '#00e5ff';
      ctx.font = 'bold 14px Outfit, sans-serif';
      ctx.fillText(`🎮 STORY MODE: ENERGY CHIPS [${this.hero.energy}/${this.chips.length}]`, 20, 21);
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`SCORE: ${this.score}`, w - 180, 21);
      ctx.fillStyle = '#a855f7';
      ctx.fillText('PRESS [B] TO BUILD', w - 340, 21);
    }

    // Render Grid & Tiles
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const px = this.offsetX + x * this.tileSize;
        const py = this.offsetY + y * this.tileSize;
        const bId = this.map[y][x];
        const block = this.blockTypes[bId] || this.blockTypes[0];

        ctx.fillStyle = block.color;
        ctx.fillRect(px, py, this.tileSize, this.tileSize);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.strokeRect(px, py, this.tileSize, this.tileSize);
      }
    }

    // Render Exit Gate
    const egx = this.offsetX + this.exitGate.x * this.tileSize;
    const egy = this.offsetY + this.exitGate.y * this.tileSize;
    ctx.fillStyle = this.hero.energy >= this.chips.length ? '#22c55e' : '#ef4444';
    ctx.fillRect(egx + 4, egy + 4, this.tileSize - 8, this.tileSize - 8);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Outfit';
    ctx.fillText('⚡', egx + 12, egy + 26);

    // Render Energy Chips
    for (const chip of this.chips) {
      if (!chip.collected) {
        const cx = this.offsetX + chip.x * this.tileSize + this.tileSize / 2;
        const cy = this.offsetY + chip.y * this.tileSize + this.tileSize / 2;
        ctx.fillStyle = '#00e5ff';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(cx, cy, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Render Patrol Drones
    if (this.mode === 'STORY') {
      for (const drone of this.drones) {
        const dx = this.offsetX + drone.x * this.tileSize + this.tileSize / 2;
        const dy = this.offsetY + drone.y * this.tileSize + this.tileSize / 2;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(dx, dy, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // Render Hero (Alex)
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(this.hero.x + 6, this.hero.y + 6, this.tileSize - 12, this.tileSize - 12);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.hero.x + 6, this.hero.y + 6, this.tileSize - 12, this.tileSize - 12);
  }
}

export default PlexWorldBuilderGame;

