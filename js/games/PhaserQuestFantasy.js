/* ====================================================
   PHASERQUEST — FANTASY REALM ACTION RPG
   Inspired by Jerenaux/phaserquest (Phaser & BrowserQuest)
   Explore medieval kingdoms, battle skeleton legions, upgrade armor,
   collect health elixirs, and defeat dungeon overlords.
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class PhaserQuestFantasyGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'PhaserQuest: Fantasy Realm',
      targetScore: 4000,
      lives: 3,
      ...config
    });

    this.createCanvas(860, 520);

    this.worldWidth = 1500;
    this.worldHeight = 1100;

    this.hero = {
      x: 750,
      y: 550,
      speed: 195,
      r: 18,
      hp: 100,
      maxHp: 100,
      armorLevel: 1, // 1: Bronze, 2: Silver, 3: Golden
      atk: 25,
      isAttacking: false,
      attackCooldown: 0,
      angle: 0,
      potions: 3,
      gold: 0,
      enemiesSlayed: 0
    };

    this.monsters = [];
    this.particles = [];
    this.floatingTexts = [];
    this.chests = [];
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
        if (pressed) this.attack();
      },
      actionLabel: '⚔️ SWORD',
      showDpad: true
    });

    this.showStartCard({
      title: 'PHASERQUEST: FANTASY REALM',
      icon: '🛡️',
      objective: 'Vanquish roaming goblin warriors, unlock golden armor, and defeat the dungeon king!',
      controls: 'WASD / Arrow Keys to Move • SPACE / Click to Sword Slash • H for Potion'
    });
  }

  initWorld() {
    this.trees = [];
    for (let i = 0; i < 28; i++) {
      this.trees.push({
        x: Math.random() * (this.worldWidth - 120) + 60,
        y: Math.random() * (this.worldHeight - 120) + 60,
        r: 22 + Math.random() * 14
      });
    }

    // Spawn 8 chests
    for (let i = 0; i < 8; i++) {
      this.chests.push({
        x: Math.random() * (this.worldWidth - 120) + 60,
        y: Math.random() * (this.worldHeight - 120) + 60,
        opened: false
      });
    }

    this.spawnMonsters(9);
  }

  spawnMonsters(count) {
    const types = [
      { name: 'Goblin Scout', color: '#10b981', hp: 45, atk: 12, speed: 100, r: 15 },
      { name: 'Skeleton Knight', color: '#94a3b8', hp: 70, atk: 18, speed: 85, r: 17 },
      { name: 'Dark Sorcerer', color: '#a855f7', hp: 50, atk: 22, speed: 75, r: 16 }
    ];

    for (let i = 0; i < count; i++) {
      const t = types[Math.floor(Math.random() * types.length)];
      this.monsters.push({
        ...t,
        id: Math.random(),
        x: Math.random() * (this.worldWidth - 140) + 70,
        y: Math.random() * (this.worldHeight - 140) + 70,
        maxHp: t.hp,
        changeTimer: 0
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
        this.attack();
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        this.drinkPotion();
      }
    });

    this.addEventListenerTracked(window, 'keyup', (e) => {
      this.keys[e.key] = false;
      this.keys[e.code] = false;
    });

    this.addEventListenerTracked(this.canvas, 'pointerdown', (e) => {
      e.preventDefault();
      this.attack();
    });
  }

  attack() {
    if (this.state !== GameState.PLAYING) return;
    if (this.hero.attackCooldown > 0) return;

    this.hero.isAttacking = true;
    this.hero.attackCooldown = 0.32;
    sounds.playHit?.();

    const w = this.baseWidth;
    const h = this.baseHeight;
    this.hero.angle = Math.atan2(this.mouse.y - h / 2, this.mouse.x - w / 2);

    // Slash swing reach
    const reach = 60;
    const slashX = this.hero.x + Math.cos(this.hero.angle) * 36;
    const slashY = this.hero.y + Math.sin(this.hero.angle) * 36;

    // Swing sparks
    for (let p = 0; p < 7; p++) {
      this.particles.push({
        x: slashX,
        y: slashY,
        vx: (Math.random() - 0.5) * 120,
        vy: (Math.random() - 0.5) * 120,
        life: 0.25,
        maxLife: 0.25,
        color: '#00e5ff',
        r: 3
      });
    }

    // Hit monsters
    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const m = this.monsters[i];
      if (Math.hypot(m.x - slashX, m.y - slashY) < m.r + reach / 2) {
        const dmg = this.hero.atk + Math.floor(Math.random() * 10);
        m.hp -= dmg;
        this.addFloatingText(m.x, m.y - 18, `-${dmg}`, '#00e5ff');
        sounds.playScore?.();

        if (m.hp <= 0) {
          this.hero.enemiesSlayed++;
          this.score += 250;
          this.hero.gold += 30;
          this.monsters.splice(i, 1);

          // Check armor upgrades
          if (this.hero.enemiesSlayed === 4 && this.hero.armorLevel === 1) {
            this.hero.armorLevel = 2;
            this.hero.atk = 38;
            this.hero.maxHp = 140;
            this.hero.hp = 140;
            this.addFloatingText(this.hero.x, this.hero.y - 35, '🛡️ UPGRADED: SILVER ARMOR!', '#38bdf8');
            sounds.playLevelUp?.();
          } else if (this.hero.enemiesSlayed === 10 && this.hero.armorLevel === 2) {
            this.hero.armorLevel = 3;
            this.hero.atk = 55;
            this.hero.maxHp = 180;
            this.hero.hp = 180;
            this.addFloatingText(this.hero.x, this.hero.y - 35, '👑 LEGENDARY: GOLDEN PALADIN!', '#fbbf24');
            sounds.playLevelUp?.();
          }
        }
      }
    }

    // Respawn monsters if low
    if (this.monsters.length < 5) {
      this.spawnMonsters(4);
    }
  }

  drinkPotion() {
    if (this.hero.potions > 0 && this.hero.hp < this.hero.maxHp) {
      this.hero.potions--;
      this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + 50);
      this.addFloatingText(this.hero.x, this.hero.y - 20, '+50 HP', '#10b981');
      sounds.playScore?.();
    }
  }

  addFloatingText(x, y, text, color = '#fff') {
    this.floatingTexts.push({ x, y, text, color, life: 1.0, maxLife: 1.0 });
  }

  update(dt) {
    if (this.state !== GameState.PLAYING) return;

    if (this.hero.attackCooldown > 0) {
      this.hero.attackCooldown -= dt;
      if (this.hero.attackCooldown <= 0.1) this.hero.isAttacking = false;
    }

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

    // Update Monsters
    for (const m of this.monsters) {
      const dist = Math.hypot(this.hero.x - m.x, this.hero.y - m.y);
      if (dist < 260) {
        // Agro towards hero
        const angle = Math.atan2(this.hero.y - m.y, this.hero.x - m.x);
        m.x += Math.cos(angle) * m.speed * dt;
        m.y += Math.sin(angle) * m.speed * dt;

        if (dist < this.hero.r + m.r) {
          const dmg = Math.max(4, m.atk - (this.hero.armorLevel - 1) * 6);
          this.hero.hp -= dmg * dt * 3.5;
          if (this.hero.hp <= 0) {
            this.finishGame(this.score, { reason: `Fallen to ${m.name}` });
            return;
          }
        }
      }
    }

    // Chest pickups
    for (const c of this.chests) {
      if (!c.opened && Math.hypot(this.hero.x - c.x, this.hero.y - c.y) < 32) {
        c.opened = true;
        this.hero.gold += 75;
        this.hero.potions++;
        this.score += 350;
        this.addFloatingText(c.x, c.y - 20, '+75 GOLD & 🧪 POTION', '#fbbf24');
        sounds.playScore?.();
      }
    }

    // Particles & Texts
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
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, w, h);

    ctx.translate(-camX, -camY);

    // Grid Floor
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= this.worldWidth; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.worldHeight);
      ctx.stroke();
    }
    for (let y = 0; y <= this.worldHeight; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.worldWidth, y);
      ctx.stroke();
    }

    // Trees
    for (const t of this.trees) {
      ctx.fillStyle = '#022c22';
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.arc(t.x, t.y - 4, t.r * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Chests
    for (const c of this.chests) {
      ctx.fillStyle = c.opened ? '#475569' : '#eab308';
      ctx.fillRect(c.x - 12, c.y - 10, 24, 20);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(c.x - 12, c.y - 10, 24, 20);
    }

    // Monsters
    for (const m of this.monsters) {
      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // HP Bar
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(m.x - 16, m.y - m.r - 8, 32, 4);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(m.x - 16, m.y - m.r - 8, 32 * (m.hp / m.maxHp), 4);
    }

    // Hero Knight
    ctx.save();
    const armorColors = ['#94a3b8', '#e2e8f0', '#fbbf24'];
    ctx.fillStyle = armorColors[this.hero.armorLevel - 1];
    ctx.beginPath();
    ctx.arc(this.hero.x, this.hero.y, this.hero.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Sword
    if (this.hero.isAttacking) {
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(this.hero.x, this.hero.y, 44, this.hero.angle - 0.8, this.hero.angle + 0.8);
      ctx.stroke();
    }
    ctx.restore();

    // Particles & Texts
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
    ctx.fillStyle = 'rgba(10, 14, 23, 0.85)';
    ctx.fillRect(16, 12, 300, 56);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.strokeRect(16, 12, 300, 56);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.fillText('HP', 26, 32);
    ctx.fillStyle = '#334155';
    ctx.fillRect(50, 22, 160, 12);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(50, 22, 160 * (this.hero.hp / this.hero.maxHp), 12);

    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`ARMOR: LVL ${this.hero.armorLevel}  •  POTIONS: 🧪 ${this.hero.potions}  •  🪙 ${this.hero.gold}`, 26, 54);

    ctx.fillStyle = 'rgba(10, 14, 23, 0.85)';
    ctx.fillRect(w - 200, 12, 184, 56);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.strokeRect(w - 200, 12, 184, 56);

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 16px Outfit, sans-serif';
    ctx.fillText(`SCORE: ${this.score}`, w - 184, 34);
    ctx.fillStyle = '#34d399';
    ctx.font = '12px Outfit, sans-serif';
    ctx.fillText(`SLAYED: ⚔️ ${this.hero.enemiesSlayed}`, w - 184, 54);
  }
}

export default PhaserQuestFantasyGame;
