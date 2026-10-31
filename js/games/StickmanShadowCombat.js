/* ====================================================
   STICKMAN SHADOW COMBAT — GAMINGZONE
   High-Octane Stickman Martial Arts Fighter with Katana Slashes,
   Shadow Shurikens, Combo Strings, Dragon Rage & Touch Controls
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class StickmanShadowCombatGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Stickman Shadow Combat',
      targetScore: 2500,
      lives: 100, // P1 HP
      ...config
    });

    this.groundY = 380;

    // Player (Shadow Ninja)
    this.p1 = {
      name: 'SHADOW NINJA',
      x: 180,
      y: this.groundY,
      hp: 100,
      maxHp: 100,
      energy: 50,
      state: 'idle', // idle, walk, punch, kick, katana, hurt, block
      facing: 1,
      animTimer: 0,
      combo: 0
    };

    // AI Enemy (Cyber Ronin)
    this.p2 = {
      name: 'CYBER RONIN',
      x: 540,
      y: this.groundY,
      hp: 100,
      maxHp: 100,
      energy: 30,
      state: 'idle',
      facing: -1,
      animTimer: 0,
      aiTimer: 0
    };

    this.projectiles = [];
    this.sparks = [];
    this.slashes = [];
    this.shake = 0;
    this.round = 1;

    this.keys = { left: false, right: false, punch: false, kick: false, special: false, block: false };

    this.createCanvas(740, 500);
    this.initCombatControls();

    this.attachTouchControls({
      showDpad: true,
      onDirection: (dir, pressed) => {
        if (dir === 'LEFT') this.keys.left = pressed;
        if (dir === 'RIGHT') this.keys.right = pressed;
        if (dir === 'DOWN') this.keys.block = pressed;
      },
      actionLabel: 'ATTACK',
      onAction: (pressed) => {
        if (pressed) this.performAction(this.p1, 'punch');
      }
    });

    this.showStartCard({
      title: 'STICKMAN SHADOW COMBAT',
      icon: '⚔️',
      objective: 'Defeat the Cyber Ronin using lightning Katana strikes, roundhouse kicks, and Shadow Shurikens!',
      controls: 'A/D or Left/Right to advance. J = Punch, K = Kick, L = Katana Slash, S = Block.',
      onStart: () => this.start()
    });
  }

  initCombatControls() {
    this.addListener(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') this.keys.left = true;
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') this.keys.right = true;
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
        this.p1.state = 'block';
        this.keys.block = true;
      }
      if (e.key === 'j' || e.key === 'J' || e.key === 'z' || e.key === 'Z') this.performAction(this.p1, 'punch');
      if (e.key === 'k' || e.key === 'K' || e.key === 'x' || e.key === 'X') this.performAction(this.p1, 'kick');
      if (e.key === 'l' || e.key === 'L' || e.key === 'c' || e.key === 'C') this.performAction(this.p1, 'katana');
    });

    this.addListener(window, 'keyup', (e) => {
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') this.keys.left = false;
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') this.keys.right = false;
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
        this.keys.block = false;
        if (this.p1.state === 'block') this.p1.state = 'idle';
      }
    });
  }

  performAction(fighter, action) {
    if (fighter.state !== 'idle' && fighter.state !== 'walk') return;

    fighter.state = action;
    fighter.animTimer = 0.22;

    const target = fighter === this.p1 ? this.p2 : this.p1;
    const dist = Math.abs(fighter.x - target.x);
    const inRange = dist < (action === 'katana' ? 115 : 85);
    const isFacing = (target.x - fighter.x) * fighter.facing > 0;

    if (action === 'punch') sounds.playClick();
    if (action === 'kick') sounds.playPowerup();
    if (action === 'katana') {
      sounds.playLaser();
      this.slashes.push({
        x: fighter.x + fighter.facing * 45,
        y: fighter.y - 35,
        facing: fighter.facing,
        life: 0.2
      });
    }

    if (inRange && isFacing) {
      if (target.state === 'block') {
        // Blocked attack
        target.hp -= 3;
        sounds.playClick();
        this.spawnSparks((fighter.x + target.x) / 2, fighter.y - 40, '#ffffff', 5);
      } else {
        // Direct Hit!
        const damage = action === 'katana' ? 22 : (action === 'kick' ? 14 : 9);
        target.hp -= damage;
        target.state = 'hurt';
        target.animTimer = 0.18;
        target.x += fighter.facing * 20; // Knockback

        sounds.playHit();
        this.spawnSparks((fighter.x + target.x) / 2, fighter.y - 40, '#00e5ff', 12);

        if (fighter === this.p1) {
          this.score += damage * 20;
          fighter.energy = Math.min(100, fighter.energy + 15);
        }

        // Check Round Knockout
        if (target.hp <= 0) {
          target.hp = 0;
          sounds.playWin();

          this.setTimeout(() => {
            const isP1Win = (this.p1.hp > 0);
            this.finishGame(this.score, { isVictory: isP1Win });
          }, 900);
        }
      }
    }
  }

  update(dt) {
    // Face each other
    this.p1.facing = this.p1.x < this.p2.x ? 1 : -1;
    this.p2.facing = this.p2.x < this.p1.x ? 1 : -1;

    // Player 1 Movement
    if (this.p1.state === 'idle' || this.p1.state === 'walk') {
      if (this.keys.left) {
        this.p1.x = Math.max(40, this.p1.x - 240 * dt);
        this.p1.state = 'walk';
      } else if (this.keys.right) {
        this.p1.x = Math.min(this.baseWidth - 40, this.p1.x + 240 * dt);
        this.p1.state = 'walk';
      } else {
        this.p1.state = 'idle';
      }
    }

    // AI Ronin Logic
    if (this.p2.state === 'idle' || this.p2.state === 'walk') {
      const dist = Math.abs(this.p1.x - this.p2.x);
      this.p2.aiTimer -= dt;

      if (dist > 90) {
        // Walk closer
        this.p2.x += (this.p1.x < this.p2.x ? -1 : 1) * 160 * dt;
        this.p2.state = 'walk';
      } else {
        this.p2.state = 'idle';
        if (this.p2.aiTimer <= 0) {
          this.p2.aiTimer = 0.7 + Math.random() * 0.8;
          const r = Math.random();
          if (r < 0.45) this.performAction(this.p2, 'punch');
          else if (r < 0.8) this.performAction(this.p2, 'kick');
          else this.performAction(this.p2, 'katana');
        }
      }
    }

    // Update Action Animation Timers
    [this.p1, this.p2].forEach(f => {
      if (f.state !== 'idle' && f.state !== 'walk' && f.state !== 'block') {
        f.animTimer -= dt;
        if (f.animTimer <= 0) {
          f.state = 'idle';
        }
      }
    });

    // Update Slashes
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      this.slashes[i].life -= dt;
      if (this.slashes[i].life <= 0) this.slashes.splice(i, 1);
    }

    // Update Sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const sp = this.sparks[i];
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.life -= dt;
      if (sp.life <= 0) this.sparks.splice(i, 1);
    }
  }

  spawnSparks(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      this.sparks.push({
        x, y,
        vx: (Math.random() - 0.5) * 260,
        vy: (Math.random() - 0.5) * 260,
        color,
        life: 0.35
      });
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Dark Dojo Arena Background
    const bg = ctx.createLinearGradient(0, 0, 0, this.baseHeight);
    bg.addColorStop(0, '#0f172a');
    bg.addColorStop(0.7, '#1e1b4b');
    bg.addColorStop(1, '#020617');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Dojo Tatami Arena Floor
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, this.groundY, this.baseWidth, this.baseHeight - this.groundY);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, this.groundY);
    ctx.lineTo(this.baseWidth, this.groundY);
    ctx.stroke();

    // Health Bars Top
    // P1 Health (Left)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(24, 24, 260, 20);
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(24, 24, 260 * (this.p1.hp / 100), 20);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(24, 24, 260, 20);

    ctx.font = '900 13px "Lilita One", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(`${this.p1.name} (${Math.round(this.p1.hp)}%)`, 24, 18);

    // VS Center Badge
    ctx.font = '900 24px "Lilita One", sans-serif';
    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.fillText('VS', this.baseWidth / 2, 40);

    // P2 Health (Right)
    const p2BarX = this.baseWidth - 284;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(p2BarX, 24, 260, 20);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(p2BarX + 260 * (1 - this.p2.hp / 100), 24, 260 * (this.p2.hp / 100), 20);
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(p2BarX, 24, 260, 20);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.fillText(`${this.p2.name} (${Math.round(this.p2.hp)}%)`, this.baseWidth - 24, 18);

    // Draw Slashes Arc
    this.slashes.forEach(sl => {
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 5;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(sl.x, sl.y, 35, sl.facing === 1 ? -0.8 : Math.PI - 0.8, sl.facing === 1 ? 0.8 : Math.PI + 0.8);
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // Draw Sparks
    this.sparks.forEach(sp => {
      ctx.fillStyle = sp.color;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Fighters
    this.drawFighter(ctx, this.p1, '#00e5ff');
    this.drawFighter(ctx, this.p2, '#ef4444');
  }

  drawFighter(ctx, f, color) {
    ctx.save();
    ctx.translate(f.x, f.y);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    // Head
    ctx.beginPath();
    ctx.arc(0, -68, 12, 0, Math.PI * 2);
    ctx.fill();

    // Torso
    ctx.beginPath();
    ctx.moveTo(0, -56);
    ctx.lineTo(0, -22);
    ctx.stroke();

    // Arms & Attacks
    if (f.state === 'punch') {
      ctx.beginPath();
      ctx.moveTo(0, -44);
      ctx.lineTo(f.facing * 34, -44);
      ctx.stroke();
    } else if (f.state === 'kick') {
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(f.facing * 38, -36);
      ctx.stroke();
    } else if (f.state === 'katana') {
      ctx.beginPath();
      ctx.moveTo(0, -44);
      ctx.lineTo(f.facing * 44, -30);
      ctx.stroke();
      // Katana Blade
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(f.facing * 20, -52);
      ctx.lineTo(f.facing * 52, -20);
      ctx.stroke();
    } else if (f.state === 'block') {
      ctx.beginPath();
      ctx.moveTo(0, -44);
      ctx.lineTo(f.facing * 14, -54);
      ctx.lineTo(f.facing * 14, -34);
      ctx.stroke();
    } else {
      // Idle arms
      ctx.beginPath();
      ctx.moveTo(0, -44);
      ctx.lineTo(f.facing * 16, -30);
      ctx.stroke();
    }

    // Legs
    if (f.state !== 'kick') {
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(-14, 0);
      ctx.moveTo(0, -22);
      ctx.lineTo(14, 0);
      ctx.stroke();
    }

    ctx.restore();
  }
}
