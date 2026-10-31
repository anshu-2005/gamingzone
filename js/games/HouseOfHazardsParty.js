/* ====================================================
   HOUSE OF HAZARDS PARTY — GAMINGZONE
   Chaotic Ragdoll House Hazards & Morning Chores Party
   - 4 Ragdoll Competitors Racing to Complete Household Tasks
   - Kitchen: Coffee Maker & Explosive Spring Toaster
   - Living Room: Falling Chandelier & Laser Robot Vacuum
   - Staircase: Rolling Bowling Balls & Flying Teapots
   - 1-Player vs 3 AI Bots or 2-Player Local Party Duel
   - Hilarious Ragdoll Bounces, Knockdowns & Trip Hazards
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class HouseOfHazardsPartyGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'House of Hazards Party',
      targetScore: 5,
      lives: 5,
      ...config
    });

    this.createCanvas(860, 520);

    this.tasks = [
      { name: 'Brew Coffee', room: 'Kitchen', x: 120, y: 390 },
      { name: 'Water Plants', room: 'Living Room', x: 430, y: 390 },
      { name: 'Fetch Newspaper', room: 'Front Porch', x: 740, y: 390 },
      { name: 'Brush Teeth', room: 'Bathroom', x: 260, y: 200 }
    ];
    this.currentTaskIndex = 0;

    // 4 Players
    this.players = [
      { id: 1, name: 'You', isPlayer: true, color: '#00e5ff', x: 80, y: 380, vx: 0, vy: 0, score: 0, grounded: false },
      { id: 2, name: 'Hazard Dave', isPlayer: false, color: '#f43f5e', x: 160, y: 380, vx: 0, vy: 0, score: 0, grounded: false, aiTimer: 0 },
      { id: 3, name: 'Clumsy Bob', isPlayer: false, color: '#f59e0b', x: 240, y: 380, vx: 0, vy: 0, score: 0, grounded: false, aiTimer: 0 },
      { id: 4, name: 'Slippery Sam', isPlayer: false, color: '#10b981', x: 320, y: 380, vx: 0, vy: 0, score: 0, grounded: false, aiTimer: 0 }
    ];

    this.hazards = [];
    this.particles = [];
    this.keys = {};

    this.initControls();
    this.initHouse();

    this.attachTouchControls({
      showDpad: true,
      onDirection: (dir, pressed) => {
        if (!pressed) {
          this.keys['a'] = false;
          this.keys['d'] = false;
          return;
        }
        if (dir === 'LEFT') this.keys['a'] = true;
        if (dir === 'RIGHT') this.keys['d'] = true;
      },
      onAction: () => this.jumpPlayer(this.players[0])
    });

    this.showStartCard({
      title: 'HOUSE OF HAZARDS PARTY',
      icon: '🏠',
      objective: 'Complete morning chores while dodging flying toast, falling chandeliers, and rolling bowling balls! First to 5 completed chores wins.',
      controls: 'A/D or Left/Right to Walk • [SPACE] or W to Jump.',
      onStart: () => {
        this.initHouse();
        this.start();
      }
    });
  }

  initControls() {
    this.addEventListenerTracked(window, 'keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      this.keys[e.code] = true;

      if ((e.code === 'Space' || e.key === 'w' || e.key === 'ArrowUp') && this.state === GameState.PLAYING) {
        this.jumpPlayer(this.players[0]);
      }
    });

    this.addEventListenerTracked(window, 'keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
      this.keys[e.code] = false;
    });
  }

  initHouse() {
    this.currentTaskIndex = 0;
    this.players.forEach(p => {
      p.score = 0;
      p.x = Math.random() * 200 + 80;
      p.y = 380;
      p.vx = 0;
      p.vy = 0;
    });

    this.hazards = [];
    this.particles = [];
  }

  jumpPlayer(p) {
    if (p.grounded) {
      sounds.playJump();
      p.vy = -10.5;
      p.grounded = false;
    }
  }

  spawnHazards() {
    if (Math.random() < 0.035) {
      // 1. Toaster Toast Cannon from Kitchen
      sounds.playLaser();
      this.hazards.push({
        type: 'toast',
        x: 120,
        y: 380,
        vx: (Math.random() * 4 + 4),
        vy: -9,
        radius: 12
      });
    }

    if (Math.random() < 0.02) {
      // 2. Chandelier Drop in Living Room
      sounds.playHit();
      this.hazards.push({
        type: 'chandelier',
        x: 430,
        y: 80,
        vx: 0,
        vy: 6.5,
        radius: 26
      });
    }

    if (Math.random() < 0.02) {
      // 3. Bowling Ball Roll from Stairs
      sounds.playHit();
      this.hazards.push({
        type: 'bowling',
        x: 780,
        y: 390,
        vx: -6.5,
        vy: 0,
        radius: 18
      });
    }
  }

  updateAI() {
    const task = this.tasks[this.currentTaskIndex];
    this.players.slice(1).forEach(bot => {
      bot.aiTimer++;
      const dx = task.x - bot.x;
      if (Math.abs(dx) > 20) {
        bot.vx = Math.sign(dx) * 3.4;
      } else {
        bot.vx = 0;
      }

      // Jump over obstacles or near task
      if (bot.grounded && Math.random() < 0.04) {
        this.jumpPlayer(bot);
      }
    });
  }

  update() {
    if (this.state !== GameState.PLAYING) return;

    // Player 1 controls
    const p1 = this.players[0];
    if (this.keys['a'] || this.keys['arrowleft']) p1.vx = -4.2;
    else if (this.keys['d'] || this.keys['arrowright']) p1.vx = 4.2;
    else p1.vx *= 0.8;

    this.updateAI();
    this.spawnHazards();

    const task = this.tasks[this.currentTaskIndex];

    // Update Players
    this.players.forEach(p => {
      p.vy += 0.52; // gravity
      p.x += p.vx;
      p.y += p.vy;

      // Floor collision
      if (p.y >= 390) {
        p.y = 390;
        p.vy = 0;
        p.grounded = true;
      }

      // Second floor mezzanine (x: 200 to 500, y: 220)
      if (p.x >= 180 && p.x <= 520 && p.y >= 210 && p.y <= 226 && p.vy >= 0) {
        p.y = 210;
        p.vy = 0;
        p.grounded = true;
      }

      // Task Completion Check
      if (Math.hypot(p.x - task.x, p.y - task.y) < 32) {
        sounds.playSuccess();
        p.score++;
        this.currentTaskIndex = (this.currentTaskIndex + 1) % this.tasks.length;

        if (p.score >= 5) {
          sounds.playWin();
          this.gameOver(p.isPlayer ? 1000 : 250, { winner: p.name });
          return;
        }
      }
    });

    // Update Hazards
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i];
      h.x += h.vx;
      h.y += h.vy;
      if (h.type === 'toast') h.vy += 0.4;

      // Check collision with players
      for (const p of this.players) {
        if (Math.hypot(h.x - p.x, h.y - p.y) < h.radius + 18) {
          sounds.playExplosion();
          // Ragdoll Knockback!
          p.vx = h.vx * 1.8;
          p.vy = -7;
          p.grounded = false;

          for (let pt = 0; pt < 10; pt++) {
            this.particles.push({
              x: h.x,
              y: h.y,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              radius: 3,
              color: '#ef4444',
              life: 20
            });
          }
          this.hazards.splice(i, 1);
          break;
        }
      }

      if (h.y > 500 || h.x < -50 || h.x > this.width + 50) {
        this.hazards.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life--;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Suburban Living House Wallpaper
    ctx.fillStyle = '#fef3c7'; // Warm cream wall
    ctx.fillRect(0, 0, this.width, this.height);

    // Hardwood Floor
    ctx.fillStyle = '#b45309';
    ctx.fillRect(0, 420, this.width, this.height - 420);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(0, 420, this.width, 8);

    // Second Floor Platform
    ctx.fillStyle = '#78350f';
    ctx.fillRect(180, 240, 340, 16);

    // Room Divider Walls
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(280, 240);
    ctx.lineTo(280, 420);
    ctx.moveTo(580, 0);
    ctx.lineTo(580, 420);
    ctx.stroke();

    // 2. Render Interactive Task Furniture
    const curTask = this.tasks[this.currentTaskIndex];
    // Coffee Machine (Kitchen)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(110, 385, 26, 35);
    // Flower Pot (Living Room)
    ctx.fillStyle = '#10b981';
    ctx.fillRect(420, 395, 24, 25);
    // Newspaper (Porch)
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(730, 410, 24, 10);
    // Bathroom Sink
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(250, 210, 28, 30);

    // Glowing Target Arrow over current chore
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(curTask.x, curTask.y - 45);
    ctx.lineTo(curTask.x - 10, curTask.y - 65);
    ctx.lineTo(curTask.x + 10, curTask.y - 65);
    ctx.closePath();
    ctx.fill();

    // 3. Render Hazards
    this.hazards.forEach(h => {
      if (h.type === 'toast') {
        ctx.fillStyle = '#d97706';
        ctx.fillRect(h.x - 10, h.y - 10, 20, 20);
      } else if (h.type === 'chandelier') {
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Bowling ball
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 4. Render Players
    this.players.forEach(p => {
      // Head
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(p.x, p.y - 20, 9, 0, Math.PI * 2);
      ctx.fill();

      // Shirt
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 8, p.y - 11, 16, 22);

      // Name & Score
      ctx.fillStyle = p.isPlayer ? '#0284c7' : '#475569';
      ctx.font = 'bold 11px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${p.name} (${p.score}/5)`, p.x, p.y - 34);
    });

    // 5. HUD
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(20, 20, 320, 56);
    ctx.strokeStyle = '#00e5ff';
    ctx.strokeRect(20, 20, 320, 56);

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 18px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`CURRENT TASK: ${curTask.name.toUpperCase()}`, 34, 46);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillText(`LOCATION: ${curTask.room} • FIRST TO 5 WINS`, 34, 64);
  }
}

