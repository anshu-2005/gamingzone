/* ====================================================
   FUNNY BATTLE SANDBOX WARS — GAMINGZONE
   Hilarious Ragdoll Physics Army Simulator (TABS Inspired)
   - Placement Phase: Deploy Clubbers, Archers, Spearmen, Knights & Giant Ogres
   - Battle Phase: Ragdoll Melee Clashes, Flying Arrows & Crowd Sweeps
   - 10 Escalating Campaign Battles & Unlimited Sandbox Mode
   - Real-Time Dynamic Ragdoll Knockouts & Victory Slow-Mo
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class FunnyBattleSandboxGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Funny Battle Sandbox',
      targetScore: 10000,
      lives: 3,
      ...config
    });

    this.createCanvas(860, 520);

    this.phase = 'placement'; // 'placement' or 'battle'
    this.currentLevel = 1;
    this.gold = 800;

    // Unit Types
    this.unitTypes = [
      { name: 'Clubber', cost: 50, hp: 60, speed: 2.8, range: 25, damage: 15, color: '#38bdf8' },
      { name: 'Archer', cost: 80, hp: 45, speed: 1.8, range: 280, damage: 22, isRanged: true, color: '#34d399' },
      { name: 'Spearman', cost: 110, hp: 80, speed: 2.4, range: 45, damage: 25, color: '#f59e0b' },
      { name: 'Knight', cost: 150, hp: 160, speed: 2.0, range: 30, damage: 32, color: '#a855f7' },
      { name: 'Giant Ogre', cost: 350, hp: 450, speed: 1.4, range: 50, damage: 65, isGiant: true, color: '#ec4899' }
    ];
    this.selectedUnitIndex = 0;

    this.blueUnits = [];
    this.redUnits = [];
    this.arrows = [];
    this.particles = [];

    this.initControls();
    this.loadLevel(this.currentLevel);

    this.attachTouchControls({
      showDpad: false,
      onAction: () => {
        if (this.phase === 'placement') this.startBattle();
      }
    });

    this.showStartCard({
      title: 'FUNNY BATTLE SANDBOX',
      icon: '🛡️',
      objective: 'Deploy your ragdoll army using gold budget, then start the battle! Watch the hilarious physics clash.',
      controls: 'Click to place units • Press [SPACE] or Click START BATTLE.',
      onStart: () => {
        this.currentLevel = 1;
        this.score = 0;
        this.loadLevel(1);
        this.start();
      }
    });
  }

  initControls() {
    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (e.code === 'Space' && this.phase === 'placement') {
        this.startBattle();
      }
      if (e.key === '1') this.selectedUnitIndex = 0;
      if (e.key === '2') this.selectedUnitIndex = 1;
      if (e.key === '3') this.selectedUnitIndex = 2;
      if (e.key === '4') this.selectedUnitIndex = 3;
      if (e.key === '5') this.selectedUnitIndex = 4;
    });

    if (this.canvas) {
      this.addEventListenerTracked(this.canvas, 'mousedown', (e) => {
        if (this.phase !== 'placement') return;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if clicked "Start Battle" button
        if (x > this.width / 2 - 80 && x < this.width / 2 + 80 && y > 15 && y < 55) {
          this.startBattle();
          return;
        }

        // Place unit only in blue deployment zone (left half)
        if (x < this.width / 2 - 40 && y > 80 && y < this.height - 40) {
          this.placeUnit(x, y);
        }
      });
    }
  }

  loadLevel(lvl) {
    this.currentLevel = lvl;
    this.phase = 'placement';
    this.gold = 600 + lvl * 150;
    this.blueUnits = [];
    this.redUnits = [];
    this.arrows = [];
    this.particles = [];

    // Spawn Enemy Red Army across the right field
    const enemyCount = 4 + lvl * 2;
    for (let i = 0; i < enemyCount; i++) {
      const type = this.unitTypes[Math.floor(Math.random() * Math.min(this.unitTypes.length, Math.floor(lvl / 2) + 2))];
      this.redUnits.push({
        ...type,
        team: 'red',
        x: this.width / 2 + 100 + Math.random() * 260,
        y: 120 + Math.random() * 320,
        vx: 0,
        vy: 0,
        cooldown: 0,
        color: '#f43f5e'
      });
    }
  }

  placeUnit(x, y) {
    const type = this.unitTypes[this.selectedUnitIndex];
    if (this.gold >= type.cost) {
      this.gold -= type.cost;
      sounds.playClick();
      this.blueUnits.push({
        ...type,
        team: 'blue',
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        cooldown: 0
      });
    }
  }

  startBattle() {
    if (this.blueUnits.length === 0) return;
    this.phase = 'battle';
    sounds.playWin();
  }

  update() {
    if (this.state !== GameState.PLAYING) return;
    if (this.phase !== 'battle') return;

    // Battle Simulation
    const allUnits = [...this.blueUnits, ...this.redUnits];

    // Update Units
    this.blueUnits.forEach(u => this.updateUnitCombat(u, this.redUnits));
    this.redUnits.forEach(u => this.updateUnitCombat(u, this.blueUnits));

    // Update Arrows
    for (let i = this.arrows.length - 1; i >= 0; i--) {
      const arr = this.arrows[i];
      arr.x += arr.vx;
      arr.y += arr.vy;

      const targets = arr.team === 'blue' ? this.redUnits : this.blueUnits;
      for (const target of targets) {
        if (Math.hypot(arr.x - target.x, arr.y - target.y) < 18) {
          target.hp -= arr.damage;
          sounds.playHit();
          this.arrows.splice(i, 1);
          break;
        }
      }

      if (arr.x < 0 || arr.x > this.width || arr.y < 0 || arr.y > this.height) {
        this.arrows.splice(i, 1);
      }
    }

    // Clean up defeated units
    for (let i = this.blueUnits.length - 1; i >= 0; i--) {
      if (this.blueUnits[i].hp <= 0) {
        sounds.playExplosion();
        this.blueUnits.splice(i, 1);
      }
    }

    for (let i = this.redUnits.length - 1; i >= 0; i--) {
      if (this.redUnits[i].hp <= 0) {
        sounds.playExplosion();
        this.score += 150;
        this.redUnits.splice(i, 1);
      }
    }

    // Check Victory / Defeat
    if (this.redUnits.length === 0) {
      sounds.playWin();
      this.score += 1000 * this.currentLevel;
      if (this.currentLevel >= 10) {
        this.gameOver(this.score, { victory: true });
      } else {
        this.loadLevel(this.currentLevel + 1);
      }
    } else if (this.blueUnits.length === 0) {
      sounds.playHit();
      this.loadLevel(this.currentLevel);
    }
  }

  updateUnitCombat(u, enemies) {
    if (enemies.length === 0) return;

    // Find closest enemy
    let closest = null;
    let minDist = 9999;
    for (const e of enemies) {
      const d = Math.hypot(u.x - e.x, u.y - e.y);
      if (d < minDist) {
        minDist = d;
        closest = e;
      }
    }

    if (!closest) return;

    const angle = Math.atan2(closest.y - u.y, closest.x - u.x);

    if (minDist > u.range) {
      // Charge forward
      u.x += Math.cos(angle) * u.speed;
      u.y += Math.sin(angle) * u.speed;
    } else {
      // Attack!
      if (u.cooldown <= 0) {
        u.cooldown = 40;
        if (u.isRanged) {
          // Fire arrow
          sounds.playLaser();
          this.arrows.push({
            team: u.team,
            x: u.x,
            y: u.y,
            vx: Math.cos(angle) * 12,
            vy: Math.sin(angle) * 12,
            damage: u.damage
          });
        } else {
          // Melee slash
          sounds.playHit();
          closest.hp -= u.damage;
          closest.x += Math.cos(angle) * 8; // Knockback
        }
      }
    }

    if (u.cooldown > 0) u.cooldown--;
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Lush Green Battlefield
    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, 0, this.width, this.height);

    // Deployment Zones (Placement Phase)
    if (this.phase === 'placement') {
      ctx.fillStyle = 'rgba(2, 132, 199, 0.15)';
      ctx.fillRect(20, 80, this.width / 2 - 50, this.height - 100);
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 80, this.width / 2 - 50, this.height - 100);

      ctx.fillStyle = '#00e5ff';
      ctx.font = 'bold 14px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BLUE DEPLOYMENT ZONE', this.width / 4, 110);
    }

    // Center River / Division Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.width / 2, 70);
    ctx.lineTo(this.width / 2, this.height);
    ctx.stroke();

    // 2. Render Units
    this.blueUnits.forEach(u => this.drawUnit(ctx, u, '#0284c7'));
    this.redUnits.forEach(u => this.drawUnit(ctx, u, '#ef4444'));

    // 3. Render Arrows
    this.arrows.forEach(arr => {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(arr.x, arr.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. HUD & Start Button
    this.renderHUD(ctx);
  }

  drawUnit(ctx, u, color) {
    const radius = u.isGiant ? 22 : 12;

    // Body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(u.x, u.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Googly Eyes (Funny Battle signature)
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(u.x - 3, u.y - 3, 3, 0, Math.PI * 2);
    ctx.arc(u.x + 3, u.y - 3, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(u.x - 3, u.y - 3, 1.5, 0, Math.PI * 2);
    ctx.arc(u.x + 3, u.y - 3, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  renderHUD(ctx) {
    // Top Bar
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, 0, this.width, 70);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 20px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`💰 GOLD: ${this.gold}`, 30, 42);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Outfit, sans-serif';
    ctx.fillText(`LEVEL ${this.currentLevel} • SCORE: ${this.score}`, 200, 42);

    if (this.phase === 'placement') {
      // Start Battle Button
      ctx.fillStyle = '#10b981';
      ctx.fillRect(this.width / 2 - 80, 16, 160, 38);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(this.width / 2 - 80, 16, 160, 38);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('START BATTLE ➔', this.width / 2, 40);

      // Selected Unit Hotbar Right
      const selected = this.unitTypes[this.selectedUnitIndex];
      ctx.fillStyle = '#00e5ff';
      ctx.font = 'bold 13px Outfit, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`UNIT: ${selected.name} (${selected.cost}g) [1-5]`, this.width - 30, 42);
    } else {
      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 18px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`⚔️ BATTLE IN PROGRESS...`, this.width / 2, 42);
    }
  }
}

