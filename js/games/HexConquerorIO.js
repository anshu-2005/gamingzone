/* ====================================================
   HEX CONQUEROR IO — GAMINGZONE
   Addictive Fast-Paced Territory Expansion .IO Game
   - Leave Your Safe Zone to Draw Territory Boundary Trails
   - Enclose Regions to Capture & Paint the Hex Arena
   - Cut Opponent Trails to Eliminate Rival AI Conquerors
   - Live Arena Leaderboard & Percentage Map Dominance
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class HexConquerorIOGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Hex Conqueror IO',
      targetScore: 3500,
      ...config
    });

    this.createCanvas(800, 560);

    this.cols = 50;
    this.rows = 35;
    this.cellW = this.baseWidth / this.cols;
    this.cellH = this.baseHeight / this.rows;

    // Grid: 0 = neutral, 1 = player, 2 = bot1, 3 = bot2, 4 = bot3
    this.grid = new Uint8Array(this.cols * this.rows);

    this.player = {
      id: 1,
      x: 12,
      y: 12,
      dirX: 1,
      dirY: 0,
      nextDirX: 1,
      nextDirY: 0,
      trail: [],
      isAlive: true,
      color: '#00e5ff',
      territoryColor: 'rgba(0, 229, 255, 0.28)',
      trailColor: '#00e5ff',
      pct: 0
    };

    this.bots = [
      { id: 2, x: 38, y: 10, dirX: -1, dirY: 0, trail: [], isAlive: true, name: 'ViperBot', color: '#ef4444', territoryColor: 'rgba(239, 68, 68, 0.25)', trailColor: '#ef4444', pct: 0 },
      { id: 3, x: 38, y: 25, dirX: 0, dirY: -1, trail: [], isAlive: true, name: 'CyberTitan', color: '#a855f7', territoryColor: 'rgba(168, 85, 247, 0.25)', trailColor: '#a855f7', pct: 0 },
      { id: 4, x: 12, y: 25, dirX: 0, dirY: 1, trail: [], isAlive: true, name: 'NeonBlade', color: '#ffd166', territoryColor: 'rgba(255, 209, 102, 0.25)', trailColor: '#ffd166', pct: 0 }
    ];

    this.tickTimer = 0;
    this.initTerritory();
    this.initControls();

    this.attachTouchControls({
      showDpad: true,
      onDirection: (dir, pressed) => {
        if (!pressed) return;
        if (dir === 'UP' && this.player.dirY !== 1) { this.player.nextDirX = 0; this.player.nextDirY = -1; }
        if (dir === 'DOWN' && this.player.dirY !== -1) { this.player.nextDirX = 0; this.player.nextDirY = 1; }
        if (dir === 'LEFT' && this.player.dirX !== 1) { this.player.nextDirX = -1; this.player.nextDirY = 0; }
        if (dir === 'RIGHT' && this.player.dirX !== -1) { this.player.nextDirX = 1; this.player.nextDirY = 0; }
      }
    });

    this.showStartCard({
      title: 'HEX CONQUEROR IO',
      icon: '🌐',
      objective: 'Capture the arena! Leave your base, draw a loop to claim new land, and cut through rival trails. Reach 35% map control to win!',
      controls: 'Arrow Keys / WASD or Virtual D-Pad to steer.',
      onStart: () => this.start()
    });
  }

  initTerritory() {
    this.grid.fill(0);
    // Seed starter 4x4 zones
    const seed = (cx, cy, id) => {
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          const gx = cx + c;
          const gy = cy + r;
          if (gx >= 0 && gx < this.cols && gy >= 0 && gy < this.rows) {
            this.grid[gy * this.cols + gx] = id;
          }
        }
      }
    };

    seed(this.player.x, this.player.y, this.player.id);
    this.bots.forEach(b => seed(b.x, b.y, b.id));
    this.updateTerritoryCounts();
  }

  initControls() {
    this.addEventListenerTracked(window, 'keydown', (e) => {
      const k = e.key.toLowerCase();
      if ((k === 'arrowup' || k === 'w') && this.player.dirY !== 1) {
        this.player.nextDirX = 0; this.player.nextDirY = -1;
      } else if ((k === 'arrowdown' || k === 's') && this.player.dirY !== -1) {
        this.player.nextDirX = 0; this.player.nextDirY = 1;
      } else if ((k === 'arrowleft' || k === 'a') && this.player.dirX !== 1) {
        this.player.nextDirX = -1; this.player.nextDirY = 0;
      } else if ((k === 'arrowright' || k === 'd') && this.player.dirX !== -1) {
        this.player.nextDirX = 1; this.player.nextDirY = 0;
      }
    });
  }

  update(dt) {
    if (this.state !== GameState.PLAYING) return;

    this.tickTimer += dt || 0.016;
    if (this.tickTimer >= 0.1) {
      this.tickTimer = 0;
      this.stepSimulation();
    }
  }

  stepSimulation() {
    // 1. Move Player
    if (this.player.isAlive) {
      this.player.dirX = this.player.nextDirX;
      this.player.dirY = this.player.nextDirY;
      const nextX = this.player.x + this.player.dirX;
      const nextY = this.player.y + this.player.dirY;

      // Arena Wall Check
      if (nextX < 0 || nextX >= this.cols || nextY < 0 || nextY >= this.rows) {
        this.eliminatePlayer('Crashed into the arena boundary!');
        return;
      }

      this.player.x = nextX;
      this.player.y = nextY;
      this.processEntityMove(this.player);
    }

    // 2. Move Bots
    this.bots.forEach(bot => {
      if (!bot.isAlive) return;
      this.decideBotDirection(bot);
      const nextX = bot.x + bot.dirX;
      const nextY = bot.y + bot.dirY;

      if (nextX < 0 || nextX >= this.cols || nextY < 0 || nextY >= this.rows) {
        this.eliminateEntity(bot);
        return;
      }

      bot.x = nextX;
      bot.y = nextY;
      this.processEntityMove(bot);
    });

    // 3. Update scores & win check
    this.updateTerritoryCounts();
    this.score = Math.floor(this.player.pct * 100);

    if (this.player.pct >= 35) {
      sounds.playVictory();
      this.gameOver(true);
    }
  }

  processEntityMove(entity) {
    const idx = entity.y * this.cols + entity.x;
    const cellOwner = this.grid[idx];

    // Check if cutting opponent's trail
    const allEntities = [this.player, ...this.bots];
    for (const other of allEntities) {
      if (!other.isAlive) continue;
      for (let i = 0; i < other.trail.length; i++) {
        const pt = other.trail[i];
        if (pt.x === entity.x && pt.y === entity.y) {
          if (other.id === entity.id) {
            // Self-crash
            this.eliminateEntity(entity);
            return;
          } else {
            // Cut other's trail!
            sounds.playExplode();
            this.eliminateEntity(other);
          }
        }
      }
    }

    if (cellOwner === entity.id) {
      // Returned home! Capture territory
      if (entity.trail.length > 0) {
        sounds.playScore();
        this.captureEnclosedTerritory(entity);
        entity.trail = [];
      }
    } else {
      // Outside home territory, add to trail
      entity.trail.push({ x: entity.x, y: entity.y });
    }
  }

  decideBotDirection(bot) {
    const moves = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 }
    ];

    // Filter out reverse
    const validMoves = moves.filter(m => !(m.dx === -bot.dirX && m.dy === -bot.dirY));

    // Prefer returning home if trail gets long
    if (bot.trail.length > 6) {
      let bestMove = null;
      let minHomeDist = Infinity;
      for (const m of validMoves) {
        const nx = bot.x + m.dx;
        const ny = bot.y + m.dy;
        if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows) {
          if (this.grid[ny * this.cols + nx] === bot.id) {
            bestMove = m;
            break;
          }
        }
      }
      if (bestMove) {
        bot.dirX = bestMove.dx;
        bot.dirY = bestMove.dy;
        return;
      }
    }

    // Otherwise random step within bounds
    const safeMoves = validMoves.filter(m => {
      const nx = bot.x + m.dx;
      const ny = bot.y + m.dy;
      return nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows;
    });

    if (safeMoves.length > 0 && (Math.random() < 0.25 || bot.trail.length === 0)) {
      const chosen = safeMoves[Math.floor(Math.random() * safeMoves.length)];
      bot.dirX = chosen.dx;
      bot.dirY = chosen.dy;
    }
  }

  captureEnclosedTerritory(entity) {
    if (entity.trail.length === 0) return;

    // Convert trail to territory
    entity.trail.forEach(pt => {
      this.grid[pt.y * this.cols + pt.x] = entity.id;
    });

    // Fill bounding box of trail
    let minX = this.cols, maxX = 0, minY = this.rows, maxY = 0;
    entity.trail.forEach(pt => {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    });

    // Simple fill for enclosed zone
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (Math.random() < 0.85) {
          this.grid[y * this.cols + x] = entity.id;
        }
      }
    }
  }

  eliminateEntity(entity) {
    entity.isAlive = false;
    entity.trail = [];
    // Clear territory
    for (let i = 0; i < this.grid.length; i++) {
      if (this.grid[i] === entity.id) this.grid[i] = 0;
    }
    if (entity.id === this.player.id) {
      this.eliminatePlayer('Your trail was intersected!');
    }
  }

  eliminatePlayer(reason) {
    sounds.playHit();
    this.player.isAlive = false;
    this.gameOver(false);
  }

  updateTerritoryCounts() {
    const total = this.cols * this.rows;
    const counts = [0, 0, 0, 0, 0];
    for (let i = 0; i < this.grid.length; i++) {
      counts[this.grid[i]]++;
    }
    this.player.pct = Number(((counts[1] / total) * 100).toFixed(1));
    this.bots.forEach(b => {
      b.pct = Number(((counts[b.id] / total) * 100).toFixed(1));
    });
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Dark grid background
    ctx.fillStyle = '#080d1a';
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Draw territory
    const entities = [this.player, ...this.bots];
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const ownerId = this.grid[y * this.cols + x];
        if (ownerId > 0) {
          const ent = entities.find(e => e.id === ownerId);
          if (ent) {
            ctx.fillStyle = ent.territoryColor;
            ctx.fillRect(x * this.cellW, y * this.cellH, this.cellW + 0.5, this.cellH + 0.5);
          }
        }
      }
    }

    // Draw Grid Lines (Subtle)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < this.cols; x++) {
      ctx.beginPath();
      ctx.moveTo(x * this.cellW, 0);
      ctx.lineTo(x * this.cellW, this.baseHeight);
      ctx.stroke();
    }
    for (let y = 0; y < this.rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * this.cellH);
      ctx.lineTo(this.baseWidth, y * this.cellH);
      ctx.stroke();
    }

    // Draw Trails
    entities.forEach(ent => {
      if (!ent.isAlive || ent.trail.length === 0) return;
      ctx.fillStyle = ent.trailColor;
      ctx.shadowColor = ent.trailColor;
      ctx.shadowBlur = 8;
      ent.trail.forEach(pt => {
        ctx.fillRect(pt.x * this.cellW + 2, pt.y * this.cellH + 2, this.cellW - 4, this.cellH - 4);
      });
      ctx.shadowBlur = 0;
    });

    // Draw Heads
    entities.forEach(ent => {
      if (!ent.isAlive) return;
      ctx.fillStyle = ent.color;
      ctx.shadowColor = ent.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(ent.x * this.cellW + this.cellW / 2, ent.y * this.cellH + this.cellH / 2, this.cellW * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Top-Right Live Leaderboard
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.roundRect(this.baseWidth - 210, 15, 195, 145, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 13px "Outfit", sans-serif';
    ctx.fillText('👑 MAP LEADERBOARD', this.baseWidth - 195, 38);

    const sorted = [this.player, ...this.bots].sort((a, b) => b.pct - a.pct);
    sorted.forEach((item, idx) => {
      const topY = 62 + idx * 24;
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(this.baseWidth - 190, topY - 4, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = item.id === 1 ? '#00e5ff' : '#cbd5e1';
      ctx.font = `${item.id === 1 ? '700' : '500'} 12px "Inter", sans-serif`;
      const name = item.id === 1 ? 'You (Player)' : item.name;
      ctx.fillText(`${name}: ${item.pct}%`, this.baseWidth - 180, topY);
    });

    // Top-Left Status
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 20px "Outfit", sans-serif';
    ctx.fillText(`🗺️ Land: ${this.player.pct}% / 35%`, 25, 40);
  }
}

