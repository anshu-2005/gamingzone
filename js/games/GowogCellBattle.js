/* ====================================================
   GOWOG: CELL BATTLE IO — MULTI-CELL AGAR ARENA
   Inspired by giongto35/gowog (Golang Web Multiplayer Game)
   Eat nutrient pellets, grow cellular mass, split cells to snare rivals,
   avoid green spiked virus thorns, and rule the petri dish leaderboard!
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class GowogCellBattleGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Gowog: Cell Battle IO',
      targetScore: 5000,
      lives: 1,
      ...config
    });

    this.createCanvas(860, 520);

    this.worldSize = 1800;
    this.cells = [
      { x: 900, y: 900, mass: 40, r: 24, vx: 0, vy: 0 }
    ];

    this.pellets = [];
    this.viruses = [];
    this.bots = [];
    this.particles = [];
    this.mouse = { x: 430, y: 260 };
    this.keys = {};

    this.initWorld();
    this.initControls();

    this.attachTouchControls({
      onDirection: () => {},
      onAction: (pressed) => {
        if (pressed) this.splitCell();
      },
      actionLabel: '💥 SPLIT',
      showDpad: false
    });

    this.showStartCard({
      title: 'GOWOG: CELL BATTLE IO',
      icon: '🦠',
      objective: 'Absorb food pellets and smaller cells to grow massive! Press SPACE to split forward.',
      controls: 'Move Mouse / Touch to Guide • SPACE to Split Cell • W to Eject Mass'
    });
  }

  initWorld() {
    // 250 food pellets
    this.pellets = [];
    const colors = ['#00e5ff', '#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#a855f7'];
    for (let i = 0; i < 250; i++) {
      this.pellets.push({
        x: Math.random() * (this.worldSize - 60) + 30,
        y: Math.random() * (this.worldSize - 60) + 30,
        color: colors[Math.floor(Math.random() * colors.length)],
        r: 4
      });
    }

    // 8 Spiked Green Viruses
    this.viruses = [];
    for (let i = 0; i < 8; i++) {
      this.viruses.push({
        x: Math.random() * (this.worldSize - 160) + 80,
        y: Math.random() * (this.worldSize - 160) + 80,
        r: 36
      });
    }

    // 10 AI Bot Cells
    const botNames = ['ApexCell', 'ViperMicrobe', 'MegaBacterium', 'BioHazard', 'AmoebaX', 'HydraCell', 'CyberSpore'];
    this.bots = [];
    for (let i = 0; i < botNames.length; i++) {
      const mass = 30 + Math.random() * 80;
      this.bots.push({
        name: botNames[i],
        x: Math.random() * (this.worldSize - 160) + 80,
        y: Math.random() * (this.worldSize - 160) + 80,
        mass: mass,
        r: Math.sqrt(mass) * 4,
        color: colors[i % colors.length],
        angle: Math.random() * Math.PI * 2
      });
    }
  }

  initControls() {
    this.addEventListenerTracked(window, 'mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      if (e.code === 'Space') {
        e.preventDefault();
        this.splitCell();
      }
    });

    this.addEventListenerTracked(this.canvas, 'pointerdown', (e) => {
      e.preventDefault();
      this.splitCell();
    });
  }

  splitCell() {
    if (this.cells.length >= 8) return;
    const newCells = [];
    for (const c of this.cells) {
      if (c.mass >= 35) {
        c.mass /= 2;
        c.r = Math.sqrt(c.mass) * 4;

        const w = this.baseWidth;
        const h = this.baseHeight;
        const angle = Math.atan2(this.mouse.y - h / 2, this.mouse.x - w / 2);

        newCells.push({
          x: c.x + Math.cos(angle) * (c.r + 15),
          y: c.y + Math.sin(angle) * (c.r + 15),
          mass: c.mass,
          r: c.r,
          vx: Math.cos(angle) * 400,
          vy: Math.sin(angle) * 400
        });
        sounds.playJump?.();
      }
    }
    this.cells.push(...newCells);
  }

  update(dt) {
    if (this.state !== GameState.PLAYING) return;

    const w = this.baseWidth;
    const h = this.baseHeight;
    const angleToMouse = Math.atan2(this.mouse.y - h / 2, this.mouse.x - w / 2);

    // Update Player Cells
    let totalMass = 0;
    for (let i = 0; i < this.cells.length; i++) {
      const c = this.cells[i];
      const speed = Math.max(70, 220 - c.r * 1.5);

      c.x += Math.cos(angleToMouse) * speed * dt + (c.vx || 0) * dt;
      c.y += Math.sin(angleToMouse) * speed * dt + (c.vy || 0) * dt;

      if (c.vx) c.vx *= 0.92;
      if (c.vy) c.vy *= 0.92;

      c.x = Math.max(c.r, Math.min(this.worldSize - c.r, c.x));
      c.y = Math.max(c.r, Math.min(this.worldSize - c.r, c.y));

      totalMass += c.mass;

      // Eat Pellets
      for (let p = this.pellets.length - 1; p >= 0; p--) {
        const pel = this.pellets[p];
        if (Math.hypot(c.x - pel.x, c.y - pel.y) < c.r) {
          c.mass += 1;
          c.r = Math.sqrt(c.mass) * 4;
          this.score += 10;
          this.pellets.splice(p, 1);
          // Respawn pellet
          this.pellets.push({
            x: Math.random() * (this.worldSize - 60) + 30,
            y: Math.random() * (this.worldSize - 60) + 30,
            color: pel.color,
            r: 4
          });
          sounds.playScore?.();
        }
      }

      // Check Virus Collision (shatters large cells)
      for (const v of this.viruses) {
        if (Math.hypot(c.x - v.x, c.y - v.y) < c.r + v.r && c.r > v.r) {
          this.splitCell();
          sounds.playCrash?.();
          break;
        }
      }
    }

    // Merge multi-cells slowly back
    if (this.cells.length > 1 && Math.random() < 0.01) {
      this.cells[0].mass += this.cells[1].mass;
      this.cells[0].r = Math.sqrt(this.cells[0].mass) * 4;
      this.cells.splice(1, 1);
    }

    // Update Bots
    for (let b = this.bots.length - 1; b >= 0; b--) {
      const bot = this.bots[b];
      const botSpeed = Math.max(50, 180 - bot.r * 1.2);

      bot.x += Math.cos(bot.angle) * botSpeed * dt;
      bot.y += Math.sin(bot.angle) * botSpeed * dt;
      bot.x = Math.max(bot.r, Math.min(this.worldSize - bot.r, bot.x));
      bot.y = Math.max(bot.r, Math.min(this.worldSize - bot.r, bot.y));

      if (Math.random() < 0.02) bot.angle += (Math.random() - 0.5) * 1.5;

      // Bot Eats Pellets
      for (let p = this.pellets.length - 1; p >= 0; p--) {
        const pel = this.pellets[p];
        if (Math.hypot(bot.x - pel.x, bot.y - pel.y) < bot.r) {
          bot.mass += 0.8;
          bot.r = Math.sqrt(bot.mass) * 4;
          this.pellets.splice(p, 1);
          break;
        }
      }

      // Check Player eats Bot or Bot eats Player
      const leadCell = this.cells[0];
      const dist = Math.hypot(leadCell.x - bot.x, leadCell.y - bot.y);
      if (dist < Math.max(leadCell.r, bot.r)) {
        if (leadCell.r > bot.r * 1.15) {
          // Player eats bot
          leadCell.mass += bot.mass;
          leadCell.r = Math.sqrt(leadCell.mass) * 4;
          this.score += Math.round(bot.mass * 20);
          sounds.playLevelUp?.();
          this.bots.splice(b, 1);
        } else if (bot.r > leadCell.r * 1.15) {
          // Bot eats player!
          sounds.playCrash?.();
          this.finishGame(this.score, { reason: `Absorbed by ${bot.name}` });
          return;
        }
      }
    }
  }

  render(ctx) {
    const w = this.baseWidth;
    const h = this.baseHeight;

    const lead = this.cells[0] || { x: 900, y: 900 };
    const camX = lead.x - w / 2;
    const camY = lead.y - h / 2;

    ctx.save();
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, w, h);

    ctx.translate(-camX, -camY);

    // Petri Dish Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= this.worldSize; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.worldSize);
      ctx.stroke();
    }
    for (let y = 0; y <= this.worldSize; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.worldSize, y);
      ctx.stroke();
    }

    // Border
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, this.worldSize, this.worldSize);

    // Food Pellets
    for (const p of this.pellets) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Green Spiked Viruses
    for (const v of this.viruses) {
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(v.x, v.y, v.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Bots
    for (const b of this.bots) {
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Outfit';
      ctx.textAlign = 'center';
      ctx.fillText(b.name, b.x, b.y + 4);
    }

    // Player Cells
    for (const c of this.cells) {
      ctx.fillStyle = '#00e5ff';
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#0a0e17';
      ctx.font = 'bold 12px Outfit';
      ctx.textAlign = 'center';
      ctx.fillText('YOU', c.x, c.y + 4);
    }

    ctx.restore();

    // HUD Glass
    ctx.fillStyle = 'rgba(10, 14, 23, 0.88)';
    ctx.fillRect(16, 12, 280, 50);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.strokeRect(16, 12, 280, 50);

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 16px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${this.score}`, 26, 34);
    ctx.fillStyle = '#fef08a';
    ctx.font = '12px Outfit, sans-serif';
    ctx.fillText(`MASS: ${Math.round(this.cells.reduce((a, b) => a + b.mass, 0))}  •  CELLS: ${this.cells.length}`, 26, 50);
  }
}

export default GowogCellBattleGame;
