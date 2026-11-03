/* ====================================================
   WESTWARD BOUNTY — WILD WEST ACTION RPG
   Inspired by Jerenaux/westward (Javascript MMORPG)
   Desert canyons, cowboy gunslingers, revolver shootouts,
   bandit bosses, dynamite sticks & gold nugget bounties.
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class WestwardBountyGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Westward Bounty RPG',
      targetScore: 3500,
      lives: 3,
      ...config
    });

    this.createCanvas(860, 520);

    this.worldWidth = 1400;
    this.worldHeight = 1000;

    this.hero = {
      x: 700,
      y: 500,
      speed: 190,
      r: 16,
      hp: 100,
      maxHp: 100,
      ammo: 6,
      maxAmmo: 6,
      angle: 0,
      gold: 0,
      bountiesClaimed: 0
    };

    this.bullets = [];
    this.dynamites = [];
    this.bandits = [];
    this.boss = null;
    this.nuggets = [];
    this.particles = [];
    this.floatingTexts = [];
    this.keys = {};
    this.mouse = { x: 430, y: 260 };

    this.initWorld();
    this.initControls();

    this.attachTouchControls({
      onDirection: (dir, pressed) => {
        if (dir === 'UP') this.keys['w'] = pressed;
        if (dir === 'DOWN') this.keys['s'] = pressed;
        if (dir === 'LEFT') this.keys['a'] = pressed;
        if (dir === 'RIGHT') this.keys['d'] = pressed;
      },
      onAction: (pressed) => {
        if (pressed) this.shootRevolver();
      },
      actionLabel: '💥 SHOOT',
      showDpad: true
    });

    this.showStartCard({
      title: 'WESTWARD BOUNTY RPG',
      icon: '🤠',
      objective: 'Hunt down desert outlaws, collect gold nuggets, throw dynamite, and claim Black Bart\'s bounty!',
      controls: 'WASD / Arrows to Move • Click / Space to Shoot Revolver • R to Reload • E for Dynamite'
    });
  }

  initWorld() {
    this.cacti = [];
    for (let i = 0; i < 20; i++) {
      this.cacti.push({
        x: Math.random() * (this.worldWidth - 100) + 50,
        y: Math.random() * (this.worldHeight - 100) + 50
      });
    }

    this.spawnBandits(7);
  }

  spawnBandits(count) {
    for (let i = 0; i < count; i++) {
      this.bandits.push({
        id: Math.random(),
        x: Math.random() * (this.worldWidth - 100) + 50,
        y: Math.random() * (this.worldHeight - 100) + 50,
        hp: 40,
        maxHp: 40,
        speed: 95,
        r: 15,
        color: '#dc2626',
        shootTimer: 1 + Math.random() * 2
      });
    }
  }

  spawnBlackBart() {
    this.boss = {
      name: 'Black Bart (Wanted)',
      x: this.worldWidth / 2,
      y: this.worldHeight / 2,
      hp: 300,
      maxHp: 300,
      speed: 110,
      r: 26,
      color: '#7f1d1d',
      shootTimer: 1.2
    };
    sounds.playLevelUp?.();
    this.addFloatingText(this.hero.x, this.hero.y - 40, '⚠️ WANTED: BLACK BART HAS ENTERED TOWN!', '#ef4444');
  }

  initControls() {
    this.addEventListenerTracked(window, 'mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    this.addEventListenerTracked(window, 'keydown', (e) => {
      this.keys[e.key] = true;
      this.keys[e.code] = true;

      if (e.code === 'Space') {
        e.preventDefault();
        this.shootRevolver();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        this.reloadRevolver();
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        this.throwDynamite();
      }
    });

    this.addEventListenerTracked(window, 'keyup', (e) => {
      this.keys[e.key] = false;
      this.keys[e.code] = false;
    });

    this.addEventListenerTracked(this.canvas, 'pointerdown', (e) => {
      e.preventDefault();
      this.shootRevolver();
    });
  }

  shootRevolver() {
    if (this.state !== GameState.PLAYING) return;
    if (this.hero.ammo <= 0) {
      this.reloadRevolver();
      return;
    }

    this.hero.ammo--;
    sounds.playHit?.();

    const w = this.baseWidth;
    const h = this.baseHeight;
    const angle = Math.atan2(this.mouse.y - h / 2, this.mouse.x - w / 2);
    this.hero.angle = angle;

    this.bullets.push({
      x: this.hero.x,
      y: this.hero.y,
      vx: Math.cos(angle) * 650,
      vy: Math.sin(angle) * 650,
      r: 3,
      isPlayer: true,
      life: 1.5
    });

    // Muzzle flash particle
    this.particles.push({
      x: this.hero.x + Math.cos(angle) * 20,
      y: this.hero.y + Math.sin(angle) * 20,
      vx: Math.cos(angle) * 40,
      vy: Math.sin(angle) * 40,
      life: 0.15,
      maxLife: 0.15,
      color: '#fef08a',
      r: 5
    });
  }

  reloadRevolver() {
    this.hero.ammo = this.hero.maxAmmo;
    sounds.playClick?.();
    this.addFloatingText(this.hero.x, this.hero.y - 20, 'RELOADED (6/6)', '#fbbf24');
  }

  throwDynamite() {
    if (this.state !== GameState.PLAYING) return;
    const w = this.baseWidth;
    const h = this.baseHeight;
    const angle = Math.atan2(this.mouse.y - h / 2, this.mouse.x - w / 2);

    this.dynamites.push({
      x: this.hero.x,
      y: this.hero.y,
      vx: Math.cos(angle) * 220,
      vy: Math.sin(angle) * 220,
      timer: 1.2
    });
    sounds.playJump?.();
  }

  addFloatingText(x, y, text, color = '#fff') {
    this.floatingTexts.push({ x, y, text, color, life: 1.0, maxLife: 1.0 });
  }

  update(dt) {
    if (this.state !== GameState.PLAYING) return;

    // Movement
    let mx = 0;
    let my = 0;
    if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) my -= 1;
    if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) my += 1;
    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) mx -= 1;
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) mx += 1;

    if (mx !== 0 || my !== 0) {
      const len = Math.hypot(mx, my);
      this.hero.x += (mx / len) * this.hero.speed * dt;
      this.hero.y += (my / len) * this.hero.speed * dt;
    }

    this.hero.x = Math.max(30, Math.min(this.worldWidth - 30, this.hero.x));
    this.hero.y = Math.max(30, Math.min(this.worldHeight - 30, this.hero.y));

    // Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      if (b.life <= 0) {
        this.bullets.splice(i, 1);
        continue;
      }

      // If player bullet, hit bandits
      if (b.isPlayer) {
        for (let j = this.bandits.length - 1; j >= 0; j--) {
          const bd = this.bandits[j];
          if (Math.hypot(b.x - bd.x, b.y - bd.y) < bd.r + b.r) {
            bd.hp -= 25;
            this.bullets.splice(i, 1);
            sounds.playHit?.();

            if (bd.hp <= 0) {
              this.score += 200;
              this.hero.bountiesClaimed++;
              this.nuggets.push({ x: bd.x, y: bd.y });
              this.bandits.splice(j, 1);
              sounds.playScore?.();
            }
            break;
          }
        }

        // Hit Boss
        if (this.boss && Math.hypot(b.x - this.boss.x, b.y - this.boss.y) < this.boss.r + b.r) {
          this.boss.hp -= 20;
          this.bullets.splice(i, 1);
          sounds.playHit?.();

          if (this.boss.hp <= 0) {
            this.score += 2000;
            this.finishGame(this.score, { reason: 'Black Bart Captured! Frontier Pacified!' });
            return;
          }
        }
      } else {
        // Bandit bullet hits hero
        if (Math.hypot(b.x - this.hero.x, b.y - this.hero.y) < this.hero.r + b.r) {
          this.hero.hp -= 15;
          this.bullets.splice(i, 1);
          sounds.playCrash?.();

          if (this.hero.hp <= 0) {
            this.finishGame(this.score, { reason: 'Slain in a Frontier Shootout' });
            return;
          }
        }
      }
    }

    // Dynamites
    for (let i = this.dynamites.length - 1; i >= 0; i--) {
      const d = this.dynamites[i];
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vx *= 0.94;
      d.vy *= 0.94;
      d.timer -= dt;

      if (d.timer <= 0) {
        sounds.playCrash?.();
        // Explosion damage
        const blastR = 110;
        for (let j = this.bandits.length - 1; j >= 0; j--) {
          const bd = this.bandits[j];
          if (Math.hypot(d.x - bd.x, d.y - bd.y) < blastR) {
            bd.hp -= 80;
            if (bd.hp <= 0) {
              this.score += 200;
              this.bandits.splice(j, 1);
            }
          }
        }

        // Explosion particles
        for (let p = 0; p < 18; p++) {
          this.particles.push({
            x: d.x,
            y: d.y,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200,
            life: 0.4,
            maxLife: 0.4,
            color: '#f97316',
            r: 5
          });
        }
        this.dynamites.splice(i, 1);
      }
    }

    // Update Bandits
    for (const bd of this.bandits) {
      const dist = Math.hypot(this.hero.x - bd.x, this.hero.y - bd.y);
      if (dist < 340) {
        bd.shootTimer -= dt;
        if (bd.shootTimer <= 0) {
          bd.shootTimer = 2.0;
          const angle = Math.atan2(this.hero.y - bd.y, this.hero.x - bd.x);
          this.bullets.push({
            x: bd.x,
            y: bd.y,
            vx: Math.cos(angle) * 380,
            vy: Math.sin(angle) * 380,
            r: 3,
            isPlayer: false,
            life: 2.0
          });
        }
      }
    }

    // Boss Spawn Trigger
    if (this.hero.bountiesClaimed >= 5 && !this.boss) {
      this.spawnBlackBart();
    }

    // Update Gold Nuggets
    for (let i = this.nuggets.length - 1; i >= 0; i--) {
      const ng = this.nuggets[i];
      if (Math.hypot(this.hero.x - ng.x, this.hero.y - ng.y) < 26) {
        this.hero.gold += 50;
        this.score += 150;
        this.addFloatingText(this.hero.x, this.hero.y - 20, '+50 GOLD NUGGET', '#fbbf24');
        sounds.playScore?.();
        this.nuggets.splice(i, 1);
      }
    }

    // Particles & Text
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 25 * dt;
      ft.life -= dt;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  render(ctx) {
    const w = this.baseWidth;
    const h = this.baseHeight;

    const camX = this.hero.x - w / 2;
    const camY = this.hero.y - h / 2;

    ctx.save();
    ctx.fillStyle = '#78350f'; // Desert sand ground
    ctx.fillRect(0, 0, w, h);

    ctx.translate(-camX, -camY);

    // Desert Sand Pattern
    ctx.fillStyle = '#92400e';
    ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

    // Cacti
    for (const c of this.cacti) {
      ctx.fillStyle = '#15803d';
      ctx.fillRect(c.x, c.y - 24, 8, 24);
      ctx.fillRect(c.x - 6, c.y - 18, 20, 6);
    }

    // Gold Nuggets
    for (const ng of this.nuggets) {
      ctx.fillStyle = '#facc15';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(ng.x, ng.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Bullets
    for (const b of this.bullets) {
      ctx.fillStyle = b.isPlayer ? '#fef08a' : '#ef4444';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dynamites
    for (const d of this.dynamites) {
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(d.x - 8, d.y - 4, 16, 8);
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(d.x + 8, d.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bandits
    for (const bd of this.bandits) {
      ctx.fillStyle = bd.color;
      ctx.beginPath();
      ctx.arc(bd.x, bd.y, bd.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // HP
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(bd.x - 14, bd.y - 24, 28, 4);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(bd.x - 14, bd.y - 24, 28 * (bd.hp / bd.maxHp), 4);
    }

    // Boss Black Bart
    if (this.boss) {
      ctx.fillStyle = this.boss.color;
      ctx.beginPath();
      ctx.arc(this.boss.x, this.boss.y, this.boss.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3.5;
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 12px Outfit';
      ctx.fillText(this.boss.name, this.boss.x - 45, this.boss.y - 36);
    }

    // Hero Cowboy
    ctx.save();
    ctx.fillStyle = '#d97706'; // Stetson Hat
    ctx.beginPath();
    ctx.arc(this.hero.x, this.hero.y, this.hero.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Revolver gun tip in angle
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(this.hero.x, this.hero.y);
    ctx.lineTo(this.hero.x + Math.cos(this.hero.angle) * 26, this.hero.y + Math.sin(this.hero.angle) * 26);
    ctx.stroke();
    ctx.restore();

    // Particles & Text
    for (const p of this.particles) {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 14px Outfit, sans-serif';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, ft.x - 10, ft.y);
      ctx.restore();
    }

    ctx.restore();

    // HUD Glass
    ctx.fillStyle = 'rgba(10, 14, 23, 0.88)';
    ctx.fillRect(16, 12, 280, 56);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.strokeRect(16, 12, 280, 56);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 14px Outfit, sans-serif';
    ctx.fillText(`AMMO: ${'💥'.repeat(this.hero.ammo)} (${this.hero.ammo}/${this.hero.maxAmmo})`, 26, 32);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.fillText('HP', 26, 52);
    ctx.fillStyle = '#334155';
    ctx.fillRect(50, 42, 140, 12);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(50, 42, 140 * (this.hero.hp / this.hero.maxHp), 12);

    ctx.fillStyle = 'rgba(10, 14, 23, 0.88)';
    ctx.fillRect(w - 200, 12, 184, 56);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.strokeRect(w - 200, 12, 184, 56);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 16px Outfit, sans-serif';
    ctx.fillText(`SCORE: ${this.score}`, w - 184, 34);
    ctx.fillStyle = '#facc15';
    ctx.font = '12px Outfit, sans-serif';
    ctx.fillText(`GOLD: 🪙 ${this.hero.gold}`, w - 184, 54);
  }
}

export default WestwardBountyGame;

