/* ====================================================
   TOWER DEFENSE KINGDOM — GAMINGZONE
   Tactical TD with Multiple Tower Classes (Archer, Cannon, Frost),
   Designated Build Plots, Creep Formations & Particle Explosions
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

const TOWER_TYPES = [
  { id: 'archer', name: '🏹 Archer', cost: 100, range: 120, rate: 0.5, damage: 15, color: '#10b981' },
  { id: 'cannon', name: '💣 Cannon', cost: 150, range: 100, rate: 1.2, damage: 45, splash: 50, color: '#ef4444' },
  { id: 'frost',  name: '❄️ Frost',  cost: 125, range: 90,  rate: 0.8, damage: 8,  slow: 0.5,  color: '#06b6d4' }
];

export class TowerDefenseKingdomGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Tower Defense Kingdom',
      targetScore: 2500,
      lives: 10,
      ...config
    });

    this.gold = 250;
    this.wave = 1;
    this.maxWaves = 50;
    this.selectedTowerType = TOWER_TYPES[0];
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.waveState = 'READY'; // READY, SPAWNING, DEFENDING, VICTORY

    // Pathway Waypoints (winding road)
    this.waypoints = [
      { x: -20, y: 160 },
      { x: 200, y: 160 },
      { x: 200, y: 360 },
      { x: 440, y: 360 },
      { x: 440, y: 180 },
      { x: 680, y: 180 },
      { x: 680, y: 460 },
      { x: 820, y: 460 }
    ];

    // Pre-designated build plot platforms (safe off-road spots)
    this.buildPlots = [
      { x: 100, y: 100, tower: null },
      { x: 100, y: 240, tower: null },
      { x: 300, y: 220, tower: null },
      { x: 320, y: 440, tower: null },
      { x: 540, y: 110, tower: null },
      { x: 540, y: 280, tower: null },
      { x: 560, y: 440, tower: null },
      { x: 740, y: 280, tower: null }
    ];

    this.enemies = [];
    this.projectiles = [];
    this.particles = [];

    this.createCanvas(760, 560);
    this.initTDControls();

    this.showStartCard({
      title: 'TOWER DEFENSE KINGDOM',
      icon: '🏰',
      objective: 'Defend your kingdom from 5 waves of invading orcs and goblins! Build Archer, Cannon, and Frost towers on marked plots.',
      controls: 'Tap a tower type at bottom, then tap a circular build plot on the field.',
      onStart: () => {
        this.start();
        this.startWave(1);
      }
    });
  }

  startWave(waveNum) {
    this.wave = waveNum;
    this.waveState = 'SPAWNING';
    sounds.playLevelUp();

    // Generate enemies for this wave
    const count = 6 + waveNum * 4;
    this.spawnQueue = [];
    for (let i = 0; i < count; i++) {
      const isBoss = (i === count - 1 && waveNum >= 3);
      this.spawnQueue.push({
        hp: isBoss ? (150 * waveNum) : (35 + waveNum * 20),
        maxHp: isBoss ? (150 * waveNum) : (35 + waveNum * 20),
        speed: isBoss ? 45 : (65 + Math.random() * 25),
        reward: isBoss ? 100 : 20,
        isBoss,
        color: isBoss ? '#e11d48' : '#eab308'
      });
    }
  }

  initTDControls() {
    this.addListener(this.canvas, 'pointerdown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.baseWidth / rect.width;
      const scaleY = this.baseHeight / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      // Check Bottom Tower Selector Bar (y: 495 - 545)
      if (my >= 495 && my <= 545) {
        TOWER_TYPES.forEach((tt, idx) => {
          const btnX = 30 + idx * 160;
          if (mx >= btnX && mx <= btnX + 145) {
            this.selectedTowerType = tt;
            sounds.playClick();
          }
        });
        return;
      }

      // Check Build Plots on map
      const clickedPlot = this.buildPlots.find(p => Math.hypot(p.x - mx, p.y - my) <= 28);
      if (clickedPlot) {
        if (!clickedPlot.tower) {
          // Build new tower
          if (this.gold >= this.selectedTowerType.cost) {
            this.gold -= this.selectedTowerType.cost;
            clickedPlot.tower = {
              ...this.selectedTowerType,
              x: clickedPlot.x,
              y: clickedPlot.y,
              cooldown: 0
            };
            sounds.playPowerup();
            this.spawnBurst(clickedPlot.x, clickedPlot.y, this.selectedTowerType.color);
          } else {
            sounds.playHit();
          }
        }
      }
    });
  }

  update(dt) {
    // Spawning logic
    if (this.waveState === 'SPAWNING') {
      this.spawnTimer += dt;
      if (this.spawnTimer >= 1.2 && this.spawnQueue.length > 0) {
        this.spawnTimer = 0;
        const creep = this.spawnQueue.shift();
        this.enemies.push({
          x: this.waypoints[0].x,
          y: this.waypoints[0].y,
          targetWp: 1,
          speed: creep.speed,
          baseSpeed: creep.speed,
          hp: creep.hp,
          maxHp: creep.maxHp,
          reward: creep.reward,
          isBoss: creep.isBoss,
          color: creep.color,
          slowDuration: 0
        });
      }
      if (this.spawnQueue.length === 0) {
        this.waveState = 'DEFENDING';
      }
    }

    // Update Enemies Movement along waypoints
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      // Handle frost slow duration
      if (e.slowDuration > 0) {
        e.slowDuration -= dt;
        if (e.slowDuration <= 0) e.speed = e.baseSpeed;
      }

      const wp = this.waypoints[e.targetWp];
      const dx = wp.x - e.x;
      const dy = wp.y - e.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 8) {
        e.targetWp++;
        if (e.targetWp >= this.waypoints.length) {
          // Breached castle gate!
          this.lives--;
          sounds.playHit();
          this.enemies.splice(i, 1);

          if (this.lives <= 0) {
            this.finishGame(this.score, { isVictory: false });
            return;
          }
          continue;
        }
      } else {
        e.x += (dx / dist) * e.speed * dt;
        e.y += (dy / dist) * e.speed * dt;
      }
    }

    // Towers Targeting & Firing
    this.buildPlots.forEach(p => {
      const t = p.tower;
      if (!t) return;

      t.cooldown -= dt;
      if (t.cooldown <= 0) {
        // Find closest enemy in range
        let target = null;
        let closestDist = t.range;

        this.enemies.forEach(e => {
          const d = Math.hypot(e.x - t.x, e.y - t.y);
          if (d <= closestDist) {
            closestDist = d;
            target = e;
          }
        });

        if (target) {
          t.cooldown = t.rate;
          this.projectiles.push({
            x: t.x,
            y: t.y,
            target,
            speed: 380,
            damage: t.damage,
            splash: t.splash || 0,
            slow: t.slow || 0,
            color: t.color
          });
          sounds.playLaser();
        }
      }
    });

    // Projectiles Homing & Impact
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const dx = p.target.x - p.x;
      const dy = p.target.y - p.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 12 || !this.enemies.includes(p.target)) {
        // Impact
        this.spawnBurst(p.x, p.y, p.color);

        if (p.splash > 0) {
          // Splash damage to all nearby
          this.enemies.forEach(e => {
            if (Math.hypot(e.x - p.x, e.y - p.y) <= p.splash) {
              e.hp -= p.damage;
            }
          });
        } else {
          p.target.hp -= p.damage;
          if (p.slow > 0) {
            p.target.speed = p.target.baseSpeed * (1 - p.slow);
            p.target.slowDuration = 2.0;
          }
        }

        // Clean dead enemies
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const deadCheck = this.enemies[j];
          if (deadCheck.hp <= 0) {
            this.gold += deadCheck.reward;
            this.score += deadCheck.reward * 2;
            this.spawnBurst(deadCheck.x, deadCheck.y, '#ffd166');
            this.enemies.splice(j, 1);
          }
        }

        this.projectiles.splice(i, 1);
      } else {
        p.x += (dx / dist) * p.speed * dt;
        p.y += (dy / dist) * p.speed * dt;
      }
    }

    // Check Wave Completion
    if (this.waveState === 'DEFENDING' && this.enemies.length === 0) {
      if (this.wave < this.maxWaves) {
        this.waveState = 'READY';
        this.setTimeout(() => {
          this.startWave(this.wave + 1);
        }, 1500);
      } else {
        sounds.playWin();
        this.score += 1500;
        this.finishGame(this.score, { isVictory: true });
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }
  }

  spawnBurst(x, y, color) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 160,
        vy: (Math.random() - 0.5) * 160,
        color,
        life: 0.4
      });
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Green Meadow Battlefield Background
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Stone Road Pathway
    ctx.strokeStyle = '#78716c';
    ctx.lineWidth = 42;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    this.waypoints.forEach((wp, idx) => {
      if (idx === 0) ctx.moveTo(wp.x, wp.y);
      else ctx.lineTo(wp.x, wp.y);
    });
    ctx.stroke();

    // Pathway Centerline Dash
    ctx.strokeStyle = '#a8a29e';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 8]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Build Plots
    this.buildPlots.forEach(p => {
      // Platform disc
      ctx.fillStyle = p.tower ? '#1e293b' : 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 24, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = p.tower ? p.tower.color : '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (p.tower) {
        // Draw Tower Emblem
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.tower.name.split(' ')[0], p.x, p.y + 7);
      } else {
        // Plus symbol for available build slot
        ctx.font = '900 18px "Lilita One", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('+', p.x, p.y + 6);
      }
    });

    // Draw Projectiles
    this.projectiles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Enemies
    this.enemies.forEach(e => {
      // Enemy Body
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.isBoss ? 18 : 12, 0, Math.PI * 2);
      ctx.fill();

      // Health bar above enemy
      const barW = e.isBoss ? 32 : 24;
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(e.x - barW / 2, e.y - (e.isBoss ? 28 : 20), barW, 4);

      const healthPct = Math.max(0, e.hp / e.maxHp);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(e.x - barW / 2, e.y - (e.isBoss ? 28 : 20), barW * healthPct, 4);
    });

    // Draw Particles
    this.particles.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Top HUD (Wave, Gold, Base HP)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, 0, this.baseWidth, 48);

    ctx.font = '900 18px "Lilita One", sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'left';
    ctx.fillText(`🏰 WAVE: ${this.wave}/${this.maxWaves}`, 24, 30);

    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.fillText(`💰 GOLD: ${this.gold}   •   SCORE: ${this.score}`, this.baseWidth / 2, 30);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff0055';
    ctx.fillText(`❤️ BASE HP: ${this.lives}`, this.baseWidth - 24, 30);

    // Bottom Tower Selection Bar
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 485, this.baseWidth, 75);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 485, this.baseWidth, 75);

    TOWER_TYPES.forEach((tt, idx) => {
      const btnX = 30 + idx * 160;
      const isSelected = this.selectedTowerType.id === tt.id;

      ctx.fillStyle = isSelected ? 'rgba(0, 229, 255, 0.2)' : '#1e293b';
      ctx.beginPath();
      ctx.roundRect(btnX, 495, 145, 52, 10);
      ctx.fill();

      ctx.strokeStyle = isSelected ? '#00e5ff' : '#475569';
      ctx.lineWidth = isSelected ? 2.5 : 1;
      ctx.stroke();

      ctx.font = '900 14px "Lilita One", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(tt.name, btnX + 12, 517);

      ctx.font = 'bold 12px "Outfit", sans-serif';
      ctx.fillStyle = this.gold >= tt.cost ? '#ffd166' : '#94a3b8';
      ctx.fillText(`🪙 ${tt.cost} Gold`, btnX + 12, 536);
    });
  }
}
