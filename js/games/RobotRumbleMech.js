/* ====================================================
   ROBOT RUMBLE: MECH ARENA — GLADIATOR ROBOT COMBAT
   Inspired by robot-rumble/logic (AI Robot Battle Arena)
   Rotating tracks, independent turret aiming, dual plasma cannons,
   missile strikes, hazard traps & destructible battle arenas!
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class RobotRumbleMechGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Robot Rumble: Mech Arena',
      targetScore: 4500,
      lives: 3,
      ...config
    });

    this.createCanvas(860, 520);

    this.mech = {
      x: 430,
      y: 260,
      hullAngle: 0,
      turretAngle: 0,
      speed: 170,
      hp: 120,
      maxHp: 120,
      shields: 80,
      maxShields: 80,
      cannonCooldown: 0,
      missileCooldown: 0
    };

    this.bullets = [];
    this.missiles = [];
    this.enemyMechs = [];
    this.particles = [];
    this.floatingTexts = [];
    this.keys = {};
    this.mouse = { x: 430, y: 260 };

    this.spawnEnemies(4);
    this.initControls();

    this.attachTouchControls({
      onDirection: (dir, pressed) => {
        if (dir === 'UP') this.keys['w'] = pressed;
        if (dir === 'DOWN') this.keys['s'] = pressed;
        if (dir === 'LEFT') this.keys['a'] = pressed;
        if (dir === 'RIGHT') this.keys['d'] = pressed;
      },
      onAction: (pressed) => {
        if (pressed) this.fireCannons();
      },
      actionLabel: '💥 CANNON',
      showDpad: true
    });

    this.showStartCard({
      title: 'ROBOT RUMBLE: MECH ARENA',
      icon: '🤖',
      objective: 'Pilot your heavy Battle-Mech, destroy rogue war-bots, and conquer the gladiatorial arena!',
      controls: 'WASD to Drive Mech Tracks • Mouse to Aim Turret • Click / Space to Fire • E for Missiles'
    });
  }

  spawnEnemies(count) {
    const types = [
      { name: 'Laser Stalker', color: '#ef4444', hp: 60, speed: 110, r: 18 },
      { name: 'Goliath Tank', color: '#f59e0b', hp: 120, speed: 70, r: 24 }
    ];

    for (let i = 0; i < count; i++) {
      const t = types[i % types.length];
      this.enemyMechs.push({
        ...t,
        id: Math.random(),
        x: 80 + Math.random() * (this.baseWidth - 160),
        y: 80 + Math.random() * (this.baseHeight - 160),
        angle: Math.random() * Math.PI * 2,
        maxHp: t.hp,
        fireTimer: 1 + Math.random() * 2
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
      this.keys[e.key] = true;
      this.keys[e.code] = true;

      if (e.code === 'Space') {
        e.preventDefault();
        this.fireCannons();
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        this.fireMissile();
      }
    });

    this.addEventListenerTracked(window, 'keyup', (e) => {
      this.keys[e.key] = false;
      this.keys[e.code] = false;
    });

    this.addEventListenerTracked(this.canvas, 'pointerdown', (e) => {
      e.preventDefault();
      this.fireCannons();
    });
  }

  fireCannons() {
    if (this.state !== GameState.PLAYING) return;
    if (this.mech.cannonCooldown > 0) return;

    this.mech.cannonCooldown = 0.22;
    sounds.playHit?.();

    this.bullets.push({
      x: this.mech.x + Math.cos(this.mech.turretAngle) * 28,
      y: this.mech.y + Math.sin(this.mech.turretAngle) * 28,
      vx: Math.cos(this.mech.turretAngle) * 620,
      vy: Math.sin(this.mech.turretAngle) * 620,
      r: 4,
      isPlayer: true,
      life: 1.6
    });
  }

  fireMissile() {
    if (this.state !== GameState.PLAYING) return;
    if (this.mech.missileCooldown > 0) return;

    this.mech.missileCooldown = 2.0;
    sounds.playJump?.();

    this.missiles.push({
      x: this.mech.x,
      y: this.mech.y,
      vx: Math.cos(this.mech.turretAngle) * 350,
      vy: Math.sin(this.mech.turretAngle) * 350,
      targetAngle: this.mech.turretAngle,
      life: 2.5
    });
  }

  addFloatingText(x, y, text, color = '#fff') {
    this.floatingTexts.push({ x, y, text, color, life: 1.0, maxLife: 1.0 });
  }

  update(dt) {
    if (this.state !== GameState.PLAYING) return;

    // Turret aiming at mouse
    this.mech.turretAngle = Math.atan2(this.mouse.y - this.mech.y, this.mouse.x - this.mech.x);

    // Track driving
    let moveForward = 0;
    if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) moveForward += 1;
    if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) moveForward -= 1;
    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) this.mech.hullAngle -= 3.2 * dt;
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) this.mech.hullAngle += 3.2 * dt;

    if (moveForward !== 0) {
      this.mech.x += Math.cos(this.mech.hullAngle) * moveForward * this.mech.speed * dt;
      this.mech.y += Math.sin(this.mech.hullAngle) * moveForward * this.mech.speed * dt;
    }

    this.mech.x = Math.max(30, Math.min(this.baseWidth - 30, this.mech.x));
    this.mech.y = Math.max(30, Math.min(this.baseHeight - 30, this.mech.y));

    if (this.mech.cannonCooldown > 0) this.mech.cannonCooldown -= dt;
    if (this.mech.missileCooldown > 0) this.mech.missileCooldown -= dt;

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

      if (b.isPlayer) {
        for (let j = this.enemyMechs.length - 1; j >= 0; j--) {
          const em = this.enemyMechs[j];
          if (Math.hypot(b.x - em.x, b.y - em.y) < em.r + b.r) {
            em.hp -= 25;
            this.bullets.splice(i, 1);
            sounds.playHit?.();

            if (em.hp <= 0) {
              this.score += 350;
              this.addFloatingText(em.x, em.y - 20, '+350 WAR-BOT DESTROYED', '#fbbf24');
              sounds.playLevelUp?.();
              this.enemyMechs.splice(j, 1);
            }
            break;
          }
        }
      } else {
        // Enemy bullet hits player
        if (Math.hypot(b.x - this.mech.x, b.y - this.mech.y) < 22) {
          if (this.mech.shields > 0) {
            this.mech.shields -= 15;
          } else {
            this.mech.hp -= 15;
          }
          this.bullets.splice(i, 1);
          sounds.playCrash?.();

          if (this.mech.hp <= 0) {
            this.finishGame(this.score, { reason: 'Mech Hull Breached in Combat' });
            return;
          }
        }
      }
    }

    // Missiles
    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const m = this.missiles[i];
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.life -= dt;

      // Blast enemies
      for (let j = this.enemyMechs.length - 1; j >= 0; j--) {
        const em = this.enemyMechs[j];
        if (Math.hypot(m.x - em.x, m.y - em.y) < em.r + 20) {
          em.hp -= 70;
          sounds.playCrash?.();
          this.missiles.splice(i, 1);
          break;
        }
      }
    }

    // Update Enemy Mechs AI
    for (const em of this.enemyMechs) {
      em.fireTimer -= dt;
      const angle = Math.atan2(this.mech.y - em.y, this.mech.x - em.x);
      em.angle = angle;
      em.x += Math.cos(angle) * em.speed * 0.7 * dt;
      em.y += Math.sin(angle) * em.speed * 0.7 * dt;

      if (em.fireTimer <= 0) {
        em.fireTimer = 1.8 + Math.random();
        this.bullets.push({
          x: em.x,
          y: em.y,
          vx: Math.cos(angle) * 380,
          vy: Math.sin(angle) * 380,
          r: 4,
          isPlayer: false,
          life: 1.8
        });
      }
    }

    // Respawn enemy wave
    if (this.enemyMechs.length === 0) {
      this.score += 1000;
      this.spawnEnemies(5);
      sounds.playLevelUp?.();
    }
  }

  render(ctx) {
    const w = this.baseWidth;
    const h = this.baseHeight;

    // Industrial Arena Grid
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, w, h);

    // Hazard Arena Perimeter
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    // Bullets
    for (const b of this.bullets) {
      ctx.fillStyle = b.isPlayer ? '#00e5ff' : '#ef4444';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Missiles
    for (const m of this.missiles) {
      ctx.fillStyle = '#f97316';
      ctx.fillRect(m.x - 6, m.y - 3, 12, 6);
    }

    // Enemy Mechs
    for (const em of this.enemyMechs) {
      ctx.save();
      ctx.translate(em.x, em.y);
      ctx.rotate(em.angle);
      ctx.fillStyle = em.color;
      ctx.fillRect(-em.r, -em.r, em.r * 2, em.r * 2);
      // Cannon
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, -3, em.r + 10, 6);
      ctx.restore();

      // HP Bar
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(em.x - 18, em.y - em.r - 8, 36, 4);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(em.x - 18, em.y - em.r - 8, 36 * (em.hp / em.maxHp), 4);
    }

    // Player Mech Hull
    ctx.save();
    ctx.translate(this.mech.x, this.mech.y);
    ctx.rotate(this.mech.hullAngle);
    // Tank Tracks
    ctx.fillStyle = '#334155';
    ctx.fillRect(-24, -20, 48, 8);
    ctx.fillRect(-24, 12, 48, 8);
    // Body
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-18, -12, 36, 24);
    ctx.restore();

    // Player Turret
    ctx.save();
    ctx.translate(this.mech.x, this.mech.y);
    ctx.rotate(this.mech.turretAngle);
    // Cannon Barrels
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(0, -6, 28, 4);
    ctx.fillRect(0, 2, 28, 4);
    // Turret Dome
    ctx.fillStyle = '#0369a1';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Floating text
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 14px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    // Top HUD
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(0, 0, w, 52);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 15px Outfit, sans-serif';
    ctx.fillText(`HULL: ${Math.round(this.mech.hp)}/${this.mech.maxHp}`, 24, 32);

    ctx.fillStyle = '#00e5ff';
    ctx.fillText(`SHIELDS: ${Math.round(this.mech.shields)}/${this.mech.maxShields}`, 180, 32);

    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`SCORE: ${this.score}`, 380, 32);

    ctx.fillStyle = this.mech.missileCooldown <= 0 ? '#10b981' : '#64748b';
    ctx.fillText(`[E] MISSILE: ${this.mech.missileCooldown <= 0 ? 'READY' : 'CHARGING'}`, w - 180, 32);
  }
}

export default RobotRumbleMechGame;
