/* ====================================================
   SWORDBATTLE IO — MULTIPLAYER ARENA SWORD FIGHTER
   Inspired by codergautam/swordbattle.io-v1
   Dynamic sword swinging, dash attacks, XP gems,
   gladiator bots, live leaderboard & size growth.
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class SwordBattleIOGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'SwordBattle IO',
      targetScore: 5000,
      lives: 1,
      ...config
    });

    this.createCanvas(860, 520);

    this.worldSize = 1600;
    this.player = {
      x: 800,
      y: 800,
      vx: 0,
      vy: 0,
      angle: 0,
      speed: 210,
      r: 20,
      hp: 100,
      maxHp: 100,
      swordLen: 46,
      swordWidth: 10,
      swordAngle: 0,
      isDashing: false,
      dashCooldown: 0,
      dashTimer: 0,
      kills: 0,
      name: 'Gladiator You'
    };

    this.gems = [];
    this.bots = [];
    this.particles = [];
    this.floatingTexts = [];
    this.mouse = { x: 430, y: 260, isDown: false };
    this.keys = {};

    this.initArena();
    this.initControls();

    this.attachTouchControls({
      onDirection: (dir, pressed) => {
        if (dir === 'UP') this.keys['w'] = pressed;
        if (dir === 'DOWN') this.keys['s'] = pressed;
        if (dir === 'LEFT') this.keys['a'] = pressed;
        if (dir === 'RIGHT') this.keys['d'] = pressed;
      },
      onAction: (pressed) => {
        if (pressed) this.dash();
      },
      actionLabel: '⚡ DASH',
      showDpad: true
    });

    this.showStartCard({
      title: 'SWORDBATTLE IO',
      icon: '⚔️',
      objective: 'Collect XP gems to grow your sword, slice rival gladiators, and claim the #1 Arena Crown!',
      controls: 'Move Mouse / WASD to Steer • Click / Space to Sprint Dash • Cut with Sword'
    });
  }

  initArena() {
    // Spawn 120 XP gems
    this.gems = [];
    for (let i = 0; i < 120; i++) {
      this.spawnGem();
    }

    // Spawn 7 AI bot gladiators
    const botNames = ['ShadowBlade', 'RedBerserker', 'IronValkyrie', 'NeonTitan', 'GhostSlayer', 'ViperX', 'DragonLord'];
    const botColors = ['#ef4444', '#f97316', '#a855f7', '#ec4899', '#3b82f6', '#14b8a6', '#eab308'];

    this.bots = [];
    for (let i = 0; i < botNames.length; i++) {
      this.bots.push({
        id: Math.random(),
        name: botNames[i],
        color: botColors[i],
        x: Math.random() * (this.worldSize - 200) + 100,
        y: Math.random() * (this.worldSize - 200) + 100,
        vx: 0,
        vy: 0,
        angle: Math.random() * Math.PI * 2,
        speed: 160 + Math.random() * 50,
        r: 18 + Math.random() * 6,
        hp: 80,
        maxHp: 80,
        swordLen: 42 + Math.random() * 12,
        swordWidth: 9,
        swordAngle: 0,
        score: Math.floor(200 + Math.random() * 800),
        changeTimer: 0
      });
    }
  }

  spawnGem() {
    const colors = ['#00e5ff', '#a855f7', '#fbbf24', '#10b981', '#f43f5e'];
    this.gems.push({
      x: Math.random() * (this.worldSize - 80) + 40,
      y: Math.random() * (this.worldSize - 80) + 40,
      color: colors[Math.floor(Math.random() * colors.length)],
      r: 6
    });
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
        this.dash();
      }
    });

    this.addEventListenerTracked(window, 'keyup', (e) => {
      this.keys[e.key] = false;
      this.keys[e.code] = false;
    });

    this.addEventListenerTracked(this.canvas, 'pointerdown', (e) => {
      e.preventDefault();
      this.dash();
    });
  }

  dash() {
    if (this.state !== GameState.PLAYING) return;
    if (this.player.dashCooldown > 0) return;

    this.player.isDashing = true;
    this.player.dashTimer = 0.28;
    this.player.dashCooldown = 1.2;
    sounds.playJump?.();

    // Dash trail particles
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: this.player.x,
        y: this.player.y,
        vx: (Math.random() - 0.5) * 80,
        vy: (Math.random() - 0.5) * 80,
        life: 0.3,
        maxLife: 0.3,
        color: '#00e5ff',
        r: 4
      });
    }
  }

  addFloatingText(x, y, text, color = '#fff') {
    this.floatingTexts.push({ x, y, text, color, life: 1.0, maxLife: 1.0 });
  }

  update(dt) {
    if (this.state !== GameState.PLAYING) return;

    const w = this.baseWidth;
    const h = this.baseHeight;

    // Angle to mouse
    const angleToMouse = Math.atan2(this.mouse.y - h / 2, this.mouse.x - w / 2);
    this.player.angle = angleToMouse;

    // Movement: either keyboard or mouse following
    let mx = 0;
    let my = 0;
    if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) my -= 1;
    if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) my += 1;
    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) mx -= 1;
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) mx += 1;

    let moveSpeed = this.player.speed;
    if (this.player.isDashing) {
      moveSpeed *= 2.4;
      this.player.dashTimer -= dt;
      if (this.player.dashTimer <= 0) this.player.isDashing = false;
    }
    if (this.player.dashCooldown > 0) this.player.dashCooldown -= dt;

    if (mx !== 0 || my !== 0) {
      const len = Math.hypot(mx, my);
      this.player.x += (mx / len) * moveSpeed * dt;
      this.player.y += (my / len) * moveSpeed * dt;
    } else {
      // Follow mouse cursor drift
      const distFromCenter = Math.hypot(this.mouse.x - w / 2, this.mouse.y - h / 2);
      if (distFromCenter > 40) {
        this.player.x += Math.cos(this.player.angle) * moveSpeed * 0.85 * dt;
        this.player.y += Math.sin(this.player.angle) * moveSpeed * 0.85 * dt;
      }
    }

    // World bounds
    this.player.x = Math.max(30, Math.min(this.worldSize - 30, this.player.x));
    this.player.y = Math.max(30, Math.min(this.worldSize - 30, this.player.y));

    // Sword rotation physics
    const targetSwordAngle = this.player.angle + 0.35;
    this.player.swordAngle += (targetSwordAngle - this.player.swordAngle) * 16 * dt;

    // Sword Tip coordinates for Player
    const pTipX = this.player.x + Math.cos(this.player.swordAngle) * (this.player.r + this.player.swordLen);
    const pTipY = this.player.y + Math.sin(this.player.swordAngle) * (this.player.r + this.player.swordLen);

    // Gem Collection
    for (let i = this.gems.length - 1; i >= 0; i--) {
      const gem = this.gems[i];
      if (Math.hypot(this.player.x - gem.x, this.player.y - gem.y) < this.player.r + gem.r) {
        this.score += 25;
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 2);
        // Grow player slightly
        this.player.swordLen = Math.min(95, this.player.swordLen + 0.25);
        this.player.r = Math.min(36, this.player.r + 0.08);
        this.gems.splice(i, 1);
        this.spawnGem();
        sounds.playScore?.();
      }
    }

    // Update Bots
    for (let i = this.bots.length - 1; i >= 0; i--) {
      const bot = this.bots[i];
      bot.changeTimer -= dt;

      // AI decision making
      const distToPlayer = Math.hypot(this.player.x - bot.x, this.player.y - bot.y);
      if (distToPlayer < 240) {
        // Agro player
        bot.angle = Math.atan2(this.player.y - bot.y, this.player.x - bot.x);
      } else if (bot.changeTimer <= 0) {
        bot.changeTimer = 1.5 + Math.random() * 2;
        bot.angle += (Math.random() - 0.5) * 1.5;
      }

      bot.x += Math.cos(bot.angle) * bot.speed * dt;
      bot.y += Math.sin(bot.angle) * bot.speed * dt;
      bot.x = Math.max(40, Math.min(this.worldSize - 40, bot.x));
      bot.y = Math.max(40, Math.min(this.worldSize - 40, bot.y));

      bot.swordAngle = bot.angle + 0.35;

      // Bot Gem Pickup
      for (let g = this.gems.length - 1; g >= 0; g--) {
        const gem = this.gems[g];
        if (Math.hypot(bot.x - gem.x, bot.y - gem.y) < bot.r + gem.r) {
          bot.score += 25;
          bot.swordLen = Math.min(85, bot.swordLen + 0.2);
          this.gems.splice(g, 1);
          this.spawnGem();
        }
      }

      // Check Player Sword hitting Bot
      const bDistToSword = Math.hypot(bot.x - pTipX, bot.y - pTipY);
      if (bDistToSword < bot.r + 14) {
        const dmg = (this.player.isDashing ? 55 : 30);
        bot.hp -= dmg;
        this.addFloatingText(bot.x, bot.y - 15, `-${dmg}`, '#00e5ff');
        sounds.playHit?.();

        // Blood/sparks
        for (let p = 0; p < 8; p++) {
          this.particles.push({
            x: bot.x,
            y: bot.y,
            vx: (Math.random() - 0.5) * 140,
            vy: (Math.random() - 0.5) * 140,
            life: 0.3,
            maxLife: 0.3,
            color: '#ef4444',
            r: 3
          });
        }

        if (bot.hp <= 0) {
          // Bot killed!
          this.player.kills++;
          this.score += 500;
          this.addFloatingText(bot.x, bot.y - 30, `+500 SLAYED ${bot.name}!`, '#fbbf24');
          sounds.playLevelUp?.();

          // Drop gem burst
          for (let k = 0; k < 6; k++) {
            this.gems.push({
              x: bot.x + (Math.random() - 0.5) * 50,
              y: bot.y + (Math.random() - 0.5) * 50,
              color: '#fbbf24',
              r: 8
            });
          }

          this.bots.splice(i, 1);
          // Respawn new bot
          setTimeout(() => {
            if (this.state === GameState.PLAYING) {
              this.bots.push({
                id: Math.random(),
                name: 'Gladiator ' + Math.floor(Math.random() * 99),
                color: '#38bdf8',
                x: Math.random() * (this.worldSize - 200) + 100,
                y: Math.random() * (this.worldSize - 200) + 100,
                vx: 0,
                vy: 0,
                angle: Math.random() * Math.PI * 2,
                speed: 180,
                r: 20,
                hp: 90,
                maxHp: 90,
                swordLen: 46,
                swordWidth: 9,
                swordAngle: 0,
                score: 300,
                changeTimer: 0
              });
            }
          }, 3000);
          continue;
        }
      }

      // Check Bot Sword hitting Player
      const bTipX = bot.x + Math.cos(bot.swordAngle) * (bot.r + bot.swordLen);
      const bTipY = bot.y + Math.sin(bot.swordAngle) * (bot.r + bot.swordLen);
      const pDistToBotSword = Math.hypot(this.player.x - bTipX, this.player.y - bTipY);

      if (pDistToBotSword < this.player.r + 12) {
        this.player.hp -= 20;
        this.addFloatingText(this.player.x, this.player.y - 20, '-20 HP', '#ef4444');
        sounds.playCrash?.();

        if (this.player.hp <= 0) {
          this.finishGame(this.score, { reason: `Slain by ${bot.name}` });
          return;
        }
      }
    }

    // Particles & Floating Text
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

    // Camera focused on Player
    const camX = this.player.x - w / 2;
    const camY = this.player.y - h / 2;

    ctx.save();
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, w, h);

    ctx.translate(-camX, -camY);

    // Arena Floor Tiles
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= this.worldSize; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.worldSize);
      ctx.stroke();
    }
    for (let y = 0; y <= this.worldSize; y += 80) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.worldSize, y);
      ctx.stroke();
    }

    // Arena Outer Perimeter Walls
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 6;
    ctx.strokeRect(0, 0, this.worldSize, this.worldSize);

    // Gems
    for (const gem of this.gems) {
      ctx.save();
      ctx.fillStyle = gem.color;
      ctx.shadowColor = gem.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(gem.x, gem.y, gem.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Render Bots
    for (const bot of this.bots) {
      ctx.save();
      // Bot Sword
      ctx.save();
      ctx.translate(bot.x, bot.y);
      ctx.rotate(bot.swordAngle);
      ctx.fillStyle = '#e2e8f0';
      ctx.strokeStyle = bot.color;
      ctx.lineWidth = 2;
      ctx.fillRect(bot.r - 4, -bot.swordWidth / 2, bot.swordLen, bot.swordWidth);
      ctx.strokeRect(bot.r - 4, -bot.swordWidth / 2, bot.swordLen, bot.swordWidth);
      ctx.restore();

      // Bot Body
      ctx.fillStyle = bot.color;
      ctx.beginPath();
      ctx.arc(bot.x, bot.y, bot.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Name & HP
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(bot.name, bot.x, bot.y - bot.r - 10);

      // HP Bar
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(bot.x - 18, bot.y - bot.r - 6, 36, 4);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(bot.x - 18, bot.y - bot.r - 6, 36 * (bot.hp / bot.maxHp), 4);
      ctx.restore();
    }

    // Render Player
    ctx.save();
    // Player Sword
    ctx.save();
    ctx.translate(this.player.x, this.player.y);
    ctx.rotate(this.player.swordAngle);
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2.5;
    ctx.fillRect(this.player.r - 4, -this.player.swordWidth / 2, this.player.swordLen, this.player.swordWidth);
    ctx.strokeRect(this.player.r - 4, -this.player.swordWidth / 2, this.player.swordLen, this.player.swordWidth);
    ctx.restore();

    // Player Body
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, this.player.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Eyes in direction of angle
    const eyeDist = this.player.r * 0.45;
    const eyeAngle1 = this.player.angle - 0.4;
    const eyeAngle2 = this.player.angle + 0.4;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.player.x + Math.cos(eyeAngle1) * eyeDist, this.player.y + Math.sin(eyeAngle1) * eyeDist, 4, 0, Math.PI * 2);
    ctx.arc(this.player.x + Math.cos(eyeAngle2) * eyeDist, this.player.y + Math.sin(eyeAngle2) * eyeDist, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Floating text
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 14px Outfit, sans-serif';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, ft.x - 10, ft.y);
      ctx.restore();
    }

    ctx.restore(); // Restore camera translation

    // Fixed Screen HUD
    // Top Left Player Stats
    ctx.fillStyle = 'rgba(10, 14, 23, 0.85)';
    ctx.fillRect(16, 12, 260, 56);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.strokeRect(16, 12, 260, 56);

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 15px Outfit, sans-serif';
    ctx.fillText(`SCORE: ${this.score}  •  KILLS: ⚔️ ${this.player.kills}`, 26, 32);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.fillText('HP', 26, 52);
    ctx.fillStyle = '#334155';
    ctx.fillRect(50, 42, 140, 12);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(50, 42, 140 * (this.player.hp / this.player.maxHp), 12);

    // Top Right Arena Leaderboard
    const lbW = 180;
    const lbH = 150;
    ctx.fillStyle = 'rgba(10, 14, 23, 0.85)';
    ctx.fillRect(w - lbW - 16, 12, lbW, lbH);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.strokeRect(w - lbW - 16, 12, lbW, lbH);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillText('🏆 ARENA LEADERBOARD', w - lbW - 4, 30);

    const allScores = [
      { name: 'YOU', score: this.score, isYou: true },
      ...this.bots.map((b) => ({ name: b.name, score: b.score, isYou: false }))
    ].sort((a, b) => b.score - a.score).slice(0, 5);

    for (let i = 0; i < allScores.length; i++) {
      const s = allScores[i];
      ctx.fillStyle = s.isYou ? '#00e5ff' : '#94a3b8';
      ctx.font = s.isYou ? 'bold 11px Outfit, sans-serif' : '11px Outfit, sans-serif';
      ctx.fillText(`${i + 1}. ${s.name.slice(0, 11)}`, w - lbW - 6, 52 + i * 22);
      ctx.fillText(`${s.score}`, w - 50, 52 + i * 22);
    }
  }
}

export default SwordBattleIOGame;

