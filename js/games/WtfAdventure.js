/* ====================================================
   WTF?! ADVENTURE — RETRO 2D ACTION MMORPG
   Inspired by design1online/WTF-Adventure & BrowserQuest
   Real-time combat, open-world fantasy exploration,
   spellcasting, loot collection, quest progression & boss battles.
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class WtfAdventureGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'WTF?! Adventure RPG',
      targetScore: 2500,
      lives: 3,
      ...config
    });

    this.createCanvas(860, 520);

    // Hero state
    this.hero = {
      x: 430,
      y: 260,
      vx: 0,
      vy: 0,
      speed: 180,
      width: 28,
      height: 36,
      direction: 'down',
      hp: 100,
      maxHp: 100,
      mp: 60,
      maxMp: 60,
      xp: 0,
      level: 1,
      gold: 0,
      isAttacking: false,
      attackTimer: 0,
      attackCooldown: 0,
      magicCooldown: 0,
      invulnerableTimer: 0
    };

    this.keys = {};
    this.monsters = [];
    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];
    this.items = [];
    this.boss = null;
    this.monstersDefeated = 0;
    this.questGoal = 10;
    this.bossSpawned = false;

    this.initWorld();
    this.initControls();

    this.attachTouchControls({
      onDirection: (dir, pressed) => {
        if (dir === 'UP') this.keys['ArrowUp'] = pressed;
        if (dir === 'DOWN') this.keys['ArrowDown'] = pressed;
        if (dir === 'LEFT') this.keys['ArrowLeft'] = pressed;
        if (dir === 'RIGHT') this.keys['ArrowRight'] = pressed;
      },
      onAction: (pressed) => {
        if (pressed) this.performMeleeAttack();
      },
      actionLabel: '⚔️ STRIKE',
      showDpad: true
    });

    this.showStartCard({
      title: 'WTF?! ADVENTURE RPG',
      icon: '⚔️',
      objective: 'Explore the enchanted realm, slay skeletons & bats, collect loot, and conquer the Dungeon Minotaur!',
      controls: 'WASD / Arrow Keys to Move • SPACE / Click to Sword Slash • F key for Fireball'
    });
  }

  initWorld() {
    this.worldWidth = 1400;
    this.worldHeight = 1000;

    // Static scenery & ruins
    this.trees = [];
    for (let i = 0; i < 24; i++) {
      this.trees.push({
        x: Math.floor(Math.random() * (this.worldWidth - 100)) + 50,
        y: Math.floor(Math.random() * (this.worldHeight - 100)) + 50,
        r: 22 + Math.random() * 12
      });
    }

    // Spawn initial monsters
    this.monsters = [];
    this.spawnMonsters(8);
  }

  spawnMonsters(count) {
    const types = [
      { name: 'Forest Slime', hp: 30, speed: 60, color: '#10b981', exp: 25, atk: 8, r: 14 },
      { name: 'Skeletal Warrior', hp: 55, speed: 85, color: '#94a3b8', exp: 45, atk: 14, r: 16 },
      { name: 'Dungeon Bat', hp: 25, speed: 120, color: '#a855f7', exp: 30, atk: 10, r: 12 }
    ];

    for (let i = 0; i < count; i++) {
      const t = types[Math.floor(Math.random() * types.length)];
      // Spawn away from hero
      let mx = Math.random() * (this.worldWidth - 120) + 60;
      let my = Math.random() * (this.worldHeight - 120) + 60;
      if (Math.hypot(mx - this.hero.x, my - this.hero.y) < 200) {
        mx += 300;
      }

      this.monsters.push({
        ...t,
        id: Math.random(),
        maxHp: t.hp,
        x: mx,
        y: my,
        vx: 0,
        vy: 0,
        attackCooldown: 0,
        stateTime: 0
      });
    }
  }

  spawnBoss() {
    this.boss = {
      name: 'Infernal Minotaur Boss',
      x: this.worldWidth / 2,
      y: this.worldHeight / 2,
      r: 32,
      hp: 350,
      maxHp: 350,
      speed: 95,
      atk: 25,
      attackCooldown: 0,
      color: '#ef4444'
    };
    this.bossSpawned = true;
    sounds.playLevelUp?.();
    this.addFloatingText(this.hero.x, this.hero.y - 40, '⚠️ BOSS SPAWNED: MINOTAUR!', '#ef4444');
  }

  initControls() {
    this.addEventListenerTracked(window, 'keydown', (e) => {
      this.keys[e.key] = true;
      this.keys[e.code] = true;

      if (e.code === 'Space') {
        e.preventDefault();
        this.performMeleeAttack();
      }
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        this.castFireball();
      }
    });

    this.addEventListenerTracked(window, 'keyup', (e) => {
      this.keys[e.key] = false;
      this.keys[e.code] = false;
    });

    this.addEventListenerTracked(this.canvas, 'pointerdown', (e) => {
      e.preventDefault();
      // Calculate angle from canvas center to click
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const midX = rect.width / 2;
      const midY = rect.height / 2;

      // Right click or click far away triggers fireball if MP available
      if (e.button === 2 || e.shiftKey) {
        this.castFireball(Math.atan2(clickY - midY, clickX - midX));
      } else {
        this.performMeleeAttack();
      }
    });

    // Disable canvas context menu
    this.addEventListenerTracked(this.canvas, 'contextmenu', (e) => e.preventDefault());
  }

  performMeleeAttack() {
    if (this.state !== GameState.PLAYING) return;
    if (this.hero.attackCooldown > 0) return;

    this.hero.isAttacking = true;
    this.hero.attackTimer = 0.22;
    this.hero.attackCooldown = 0.35;
    sounds.playHit?.();

    // Damage arc
    const reach = 55;
    let attackX = this.hero.x;
    let attackY = this.hero.y;

    if (this.hero.direction === 'up') attackY -= reach / 2;
    else if (this.hero.direction === 'down') attackY += reach / 2;
    else if (this.hero.direction === 'left') attackX -= reach / 2;
    else if (this.hero.direction === 'right') attackX += reach / 2;

    // Swing particles
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: attackX + (Math.random() - 0.5) * 20,
        y: attackY + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 80,
        vy: (Math.random() - 0.5) * 80,
        life: 0.25,
        maxLife: 0.25,
        color: '#00e5ff',
        r: 3
      });
    }

    // Check hit monsters
    const checkTarget = (target) => {
      const dist = Math.hypot(target.x - attackX, target.y - attackY);
      if (dist < reach + target.r) {
        const isCrit = Math.random() < 0.25;
        const dmg = (18 + Math.floor(Math.random() * 12) + this.hero.level * 4) * (isCrit ? 1.8 : 1);
        const finalDmg = Math.round(dmg);
        target.hp -= finalDmg;

        // Knockback
        const angle = Math.atan2(target.y - this.hero.y, target.x - this.hero.x);
        target.x += Math.cos(angle) * 24;
        target.y += Math.sin(angle) * 24;

        this.addFloatingText(target.x, target.y - 15, (isCrit ? 'CRIT -' : '-') + finalDmg, isCrit ? '#f59e0b' : '#ff4d4f');
        sounds.playScore?.();

        for (let p = 0; p < 8; p++) {
          this.particles.push({
            x: target.x,
            y: target.y,
            vx: (Math.random() - 0.5) * 120,
            vy: (Math.random() - 0.5) * 120,
            life: 0.35,
            maxLife: 0.35,
            color: '#ef4444',
            r: 3.5
          });
        }
      }
    };

    this.monsters.forEach(checkTarget);
    if (this.boss) checkTarget(this.boss);
  }

  castFireball(customAngle = null) {
    if (this.state !== GameState.PLAYING) return;
    if (this.hero.mp < 15 || this.hero.magicCooldown > 0) return;

    this.hero.mp -= 15;
    this.hero.magicCooldown = 0.5;
    sounds.playJump?.();

    let angle = customAngle;
    if (angle === null) {
      if (this.hero.direction === 'up') angle = -Math.PI / 2;
      else if (this.hero.direction === 'down') angle = Math.PI / 2;
      else if (this.hero.direction === 'left') angle = Math.PI;
      else angle = 0;
    }

    this.projectiles.push({
      x: this.hero.x,
      y: this.hero.y,
      vx: Math.cos(angle) * 320,
      vy: Math.sin(angle) * 320,
      r: 7,
      damage: 35 + this.hero.level * 6,
      life: 2.2
    });

    this.addFloatingText(this.hero.x, this.hero.y - 25, '🔥 FIREBALL!', '#f97316');
  }

  addFloatingText(x, y, text, color = '#fff') {
    this.floatingTexts.push({ x, y, text, color, life: 0.9, maxLife: 0.9 });
  }

  update(dt) {
    if (this.state !== GameState.PLAYING) return;

    // Hero movement
    let moveX = 0;
    let moveY = 0;
    if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) moveY -= 1;
    if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) moveY += 1;
    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) moveX -= 1;
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) moveX += 1;

    if (moveX !== 0 || moveY !== 0) {
      const len = Math.hypot(moveX, moveY);
      moveX /= len;
      moveY /= len;

      this.hero.x += moveX * this.hero.speed * dt;
      this.hero.y += moveY * this.hero.speed * dt;

      if (Math.abs(moveX) > Math.abs(moveY)) {
        this.hero.direction = moveX > 0 ? 'right' : 'left';
      } else {
        this.hero.direction = moveY > 0 ? 'down' : 'up';
      }
    }

    // World clamp
    this.hero.x = Math.max(30, Math.min(this.worldWidth - 30, this.hero.x));
    this.hero.y = Math.max(30, Math.min(this.worldHeight - 30, this.hero.y));

    // Hero timers & MP regen
    if (this.hero.attackCooldown > 0) this.hero.attackCooldown -= dt;
    if (this.hero.magicCooldown > 0) this.hero.magicCooldown -= dt;
    if (this.hero.invulnerableTimer > 0) this.hero.invulnerableTimer -= dt;
    if (this.hero.attackTimer > 0) this.hero.attackTimer -= dt;
    else this.hero.isAttacking = false;

    // Passive MP regen
    this.hero.mp = Math.min(this.hero.maxMp, this.hero.mp + 8 * dt);

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      // Flame trail
      if (Math.random() < 0.6) {
        this.particles.push({
          x: p.x,
          y: p.y,
          vx: (Math.random() - 0.5) * 30,
          vy: (Math.random() - 0.5) * 30,
          life: 0.25,
          maxLife: 0.25,
          color: '#f97316',
          r: 3
        });
      }

      // Check hit monsters
      let hit = false;
      const checkHit = (m) => {
        if (Math.hypot(m.x - p.x, m.y - p.y) < m.r + p.r) {
          m.hp -= p.damage;
          this.addFloatingText(m.x, m.y - 15, `-${p.damage}`, '#f97316');
          sounds.playHit?.();
          hit = true;
        }
      };

      this.monsters.forEach(checkHit);
      if (this.boss) checkHit(this.boss);

      if (hit || p.life <= 0) {
        this.projectiles.splice(i, 1);
      }
    }

    // Update Monsters
    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const m = this.monsters[i];
      const dist = Math.hypot(this.hero.x - m.x, this.hero.y - m.y);

      // Agro behavior
      if (dist < 280) {
        const angle = Math.atan2(this.hero.y - m.y, this.hero.x - m.x);
        m.x += Math.cos(angle) * m.speed * dt;
        m.y += Math.sin(angle) * m.speed * dt;

        // Attack hero
        if (dist < m.r + 18 && this.hero.invulnerableTimer <= 0) {
          this.hero.hp -= m.atk;
          this.hero.invulnerableTimer = 0.6;
          this.addFloatingText(this.hero.x, this.hero.y - 20, `-${m.atk}`, '#ef4444');
          sounds.playCrash?.();

          if (this.hero.hp <= 0) {
            this.finishGame(this.score, { reason: 'Fallen in Battle' });
            return;
          }
        }
      }

      // Monster death
      if (m.hp <= 0) {
        this.score += m.exp * 4;
        this.hero.xp += m.exp;
        this.monstersDefeated++;

        // Drop item
        if (Math.random() < 0.6) {
          this.items.push({
            x: m.x,
            y: m.y,
            type: Math.random() < 0.4 ? 'hp' : 'gold',
            amount: 25
          });
        }

        // Level up check
        if (this.hero.xp >= this.hero.level * 100) {
          this.hero.level++;
          this.hero.maxHp += 20;
          this.hero.hp = this.hero.maxHp;
          this.hero.maxMp += 15;
          this.hero.mp = this.hero.maxMp;
          this.addFloatingText(this.hero.x, this.hero.y - 35, `🌟 LEVEL UP! (LVL ${this.hero.level})`, '#38bdf8');
          sounds.playLevelUp?.();
        }

        this.monsters.splice(i, 1);
      }
    }

    // Respawn regular monsters if low
    if (this.monsters.length < 5 && !this.bossSpawned) {
      this.spawnMonsters(4);
    }

    // Trigger Boss after quest goal
    if (this.monstersDefeated >= this.questGoal && !this.bossSpawned) {
      this.spawnBoss();
    }

    // Update Boss
    if (this.boss) {
      const dist = Math.hypot(this.hero.x - this.boss.x, this.hero.y - this.boss.y);
      const angle = Math.atan2(this.hero.y - this.boss.y, this.hero.x - this.boss.x);
      this.boss.x += Math.cos(angle) * this.boss.speed * dt;
      this.boss.y += Math.sin(angle) * this.boss.speed * dt;

      if (dist < this.boss.r + 20 && this.hero.invulnerableTimer <= 0) {
        this.hero.hp -= this.boss.atk;
        this.hero.invulnerableTimer = 0.8;
        this.addFloatingText(this.hero.x, this.hero.y - 25, `CRUSH! -${this.boss.atk}`, '#ff1744');
        sounds.playCrash?.();

        if (this.hero.hp <= 0) {
          this.finishGame(this.score, { reason: 'Crushed by Minotaur' });
          return;
        }
      }

      if (this.boss.hp <= 0) {
        this.score += 2000;
        this.addFloatingText(this.boss.x, this.boss.y - 30, '🏆 BOSS VANQUISHED!', '#fbbf24');
        sounds.playLevelUp?.();
        this.boss = null;
        this.finishGame(this.score, { reason: 'Quest Completed: Champion of WTF Realm' });
        return;
      }
    }

    // Item pickup
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      if (Math.hypot(this.hero.x - it.x, this.hero.y - it.y) < 28) {
        if (it.type === 'hp') {
          this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + 30);
          this.addFloatingText(this.hero.x, this.hero.y - 20, '+30 HP', '#10b981');
        } else {
          this.score += 150;
          this.hero.gold += 50;
          this.addFloatingText(this.hero.x, this.hero.y - 20, '+50 GOLD', '#fbbf24');
        }
        sounds.playScore?.();
        this.items.splice(i, 1);
      }
    }

    // Particles & Floating texts
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 30 * dt;
      ft.life -= dt;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  render(ctx) {
    const w = this.baseWidth;
    const h = this.baseHeight;

    // Camera offset centered on Hero
    const camX = this.hero.x - w / 2;
    const camY = this.hero.y - h / 2;

    ctx.save();
    ctx.fillStyle = '#064e3b'; // Lush deep forest ground
    ctx.fillRect(0, 0, w, h);

    ctx.translate(-camX, -camY);

    // World Grid Tiles
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const tileSize = 64;
    for (let x = 0; x <= this.worldWidth; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.worldHeight);
      ctx.stroke();
    }
    for (let y = 0; y <= this.worldHeight; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.worldWidth, y);
      ctx.stroke();
    }

    // Trees & Ancient scenery
    for (const tree of this.trees) {
      ctx.fillStyle = '#022c22';
      ctx.beginPath();
      ctx.arc(tree.x, tree.y, tree.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.arc(tree.x, tree.y - 4, tree.r * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dropped Items
    for (const it of this.items) {
      ctx.save();
      if (it.type === 'hp') {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(it.x, it.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '10px Outfit';
        ctx.fillText('✚', it.x - 4, it.y + 4);
      } else {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(it.x, it.y, 7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Regular Monsters
    for (const m of this.monsters) {
      ctx.save();
      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#fff';
      ctx.stroke();

      // Monster Health Bar
      const bw = 28;
      const bh = 4;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(m.x - bw / 2, m.y - m.r - 8, bw, bh);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(m.x - bw / 2, m.y - m.r - 8, bw * (m.hp / m.maxHp), bh);
      ctx.restore();
    }

    // Boss Minotaur
    if (this.boss) {
      ctx.save();
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.arc(this.boss.x, this.boss.y, this.boss.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Horns
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(this.boss.x - 20, this.boss.y - 20);
      ctx.lineTo(this.boss.x - 36, this.boss.y - 42);
      ctx.lineTo(this.boss.x - 12, this.boss.y - 28);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(this.boss.x + 20, this.boss.y - 20);
      ctx.lineTo(this.boss.x + 36, this.boss.y - 42);
      ctx.lineTo(this.boss.x + 12, this.boss.y - 28);
      ctx.fill();

      // Boss HP Bar
      const bbw = 70;
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(this.boss.x - bbw / 2, this.boss.y - this.boss.r - 16, bbw, 7);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(this.boss.x - bbw / 2, this.boss.y - this.boss.r - 16, bbw * (this.boss.hp / this.boss.maxHp), 7);
      ctx.restore();
    }

    // Projectiles
    for (const p of this.projectiles) {
      ctx.save();
      ctx.fillStyle = '#f97316';
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Particles
    for (const pt of this.particles) {
      ctx.save();
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = pt.life / pt.maxLife;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Hero Render
    ctx.save();
    if (this.hero.invulnerableTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // Hero Body
    ctx.fillStyle = '#3b82f6'; // Knight armor
    ctx.fillRect(this.hero.x - 14, this.hero.y - 18, 28, 36);

    // Hero Helmet
    ctx.fillStyle = '#93c5fd';
    ctx.fillRect(this.hero.x - 12, this.hero.y - 26, 24, 16);

    // Sword Slash Arc
    if (this.hero.isAttacking) {
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 5;
      ctx.beginPath();
      let sa = 0;
      if (this.hero.direction === 'up') sa = -Math.PI / 2;
      else if (this.hero.direction === 'down') sa = Math.PI / 2;
      else if (this.hero.direction === 'left') sa = Math.PI;
      else sa = 0;

      ctx.arc(this.hero.x, this.hero.y, 44, sa - 0.7, sa + 0.7);
      ctx.stroke();
    }
    ctx.restore();

    // Floating text popups
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 15px Outfit, sans-serif';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, ft.x - 14, ft.y);
      ctx.restore();
    }

    ctx.restore(); // Restore camera translation

    // Fixed Screen HUD
    this.renderHUD(ctx, w, h);
  }

  renderHUD(ctx, w, h) {
    // Top HUD Bar Glass
    ctx.fillStyle = 'rgba(10, 14, 23, 0.78)';
    ctx.fillRect(16, 14, 300, 68);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.strokeRect(16, 14, 300, 68);

    // HP Bar
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.fillText('HP', 26, 32);
    ctx.fillStyle = '#334155';
    ctx.fillRect(50, 22, 160, 12);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(50, 22, 160 * (this.hero.hp / this.hero.maxHp), 12);
    ctx.fillStyle = '#fff';
    ctx.fillText(`${Math.round(this.hero.hp)}/${this.hero.maxHp}`, 216, 32);

    // MP Bar
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('MP', 26, 52);
    ctx.fillStyle = '#334155';
    ctx.fillRect(50, 42, 160, 12);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(50, 42, 160 * (this.hero.mp / this.hero.maxMp), 12);
    ctx.fillStyle = '#fff';
    ctx.fillText(`${Math.round(this.hero.mp)}/${this.hero.maxMp}`, 216, 52);

    // Level & Gold
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`LVL ${this.hero.level}  •  🪙 ${this.hero.gold} GOLD`, 26, 72);

    // Top Right Score & Quest
    ctx.fillStyle = 'rgba(10, 14, 23, 0.78)';
    ctx.fillRect(w - 240, 14, 224, 68);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.strokeRect(w - 240, 14, 224, 68);

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 15px Outfit, sans-serif';
    ctx.fillText(`SCORE: ${this.score}`, w - 224, 34);

    ctx.fillStyle = '#ffd166';
    ctx.font = '12px Outfit, sans-serif';
    ctx.fillText(`QUEST: Slayed ${this.monstersDefeated}/${this.questGoal}`, w - 224, 52);

    if (this.bossSpawned && this.boss) {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px Outfit, sans-serif';
      ctx.fillText('🔥 MINOTAUR BOSS ACTIVE!', w - 224, 70);
    }
  }
}

export default WtfAdventureGame;
