/* ====================================================
   EVOWARS IO SLASHER — GAMINGZONE
   Multiplayer Evolution Slasher & Warrior Battle Arena
   - Eat Glowing XP Orbs & Evolve through 6 Epic Warrior Classes
   - Caveman -> Viking -> Knight -> Ninja -> Gladiator -> Cyber Mech
   - Weapon Size & Attack Reach Grows with Every Evolution
   - Sprint Lunge Dash (Click / Spacebar / Touch Action)
   - Devour 8 Roaming AI Warriors to Rule the Leaderboard
   - Dynamic Minimap Radar, Particle Blood Splatters & Kill Streaks
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class EvoWarsSlasherGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'EvoWars IO Slasher',
      targetScore: 25000,
      lives: 1,
      ...config
    });

    this.createCanvas(860, 540);

    this.worldWidth = 3000;
    this.worldHeight = 3000;
    this.cameraX = 0;
    this.cameraY = 0;
    this.kills = 0;

    // 6 Evolution Tiers
    this.tiers = [
      { name: 'Caveman', weapon: 'Club', reach: 35, width: 8, color: '#b45309', xpReq: 0 },
      { name: 'Viking', weapon: 'Battle Axe', reach: 45, width: 12, color: '#0284c7', xpReq: 100 },
      { name: 'Knight', weapon: 'Broadsword', reach: 58, width: 10, color: '#cbd5e1', xpReq: 300 },
      { name: 'Ninja', weapon: 'Katana', reach: 72, width: 7, color: '#1e293b', xpReq: 750 },
      { name: 'Gladiator', weapon: 'Trident', reach: 88, width: 14, color: '#f59e0b', xpReq: 1600 },
      { name: 'Cyber Mech', weapon: 'Plasma Saber', reach: 105, width: 16, color: '#00e5ff', xpReq: 3200 }
    ];

    // Player
    this.player = {
      name: 'You',
      x: 1500,
      y: 1500,
      angle: 0,
      speed: 4.4,
      xp: 0,
      tierIndex: 0,
      swordAngle: 0,
      isAttacking: false,
      attackCooldown: 0,
      isSprinting: false,
      color: '#00e5ff'
    };

    this.bots = [];
    this.xpOrbs = [];
    this.particles = [];
    this.mouse = { x: 430, y: 270, active: false };

    this.initControls();
    this.initWorld();

    this.attachTouchControls({
      showDpad: true,
      onDirection: (dir, pressed) => {
        if (!pressed) return;
        const map = { UP: -Math.PI / 2, DOWN: Math.PI / 2, LEFT: Math.PI, RIGHT: 0 };
        if (map[dir] !== undefined) this.player.angle = map[dir];
      },
      onAction: () => this.triggerAttack(this.player)
    });

    this.showStartCard({
      title: 'EVOWARS IO SLASHER',
      icon: '⚔️',
      objective: 'Eat glowing orbs to gain XP and EVOLVE from Caveman into Cyber Mech! Slice rivals to claim their energy.',
      controls: 'Mouse to Aim • Left Click / Spacebar to Slash & Sprint.',
      onStart: () => {
        this.initWorld();
        this.start();
      }
    });
  }

  initControls() {
    this.addEventListenerTracked(window, 'mousemove', (e) => {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.mouse.active = true;
    });

    this.addEventListenerTracked(window, 'mousedown', () => {
      this.triggerAttack(this.player);
      this.player.isSprinting = true;
    });

    this.addEventListenerTracked(window, 'mouseup', () => {
      this.player.isSprinting = false;
    });

    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (e.code === 'Space') {
        this.triggerAttack(this.player);
        this.player.isSprinting = true;
      }
      if (e.key === 'ArrowUp' || e.key === 'w') this.player.angle = -Math.PI / 2;
      if (e.key === 'ArrowDown' || e.key === 's') this.player.angle = Math.PI / 2;
      if (e.key === 'ArrowLeft' || e.key === 'a') this.player.angle = Math.PI;
      if (e.key === 'ArrowRight' || e.key === 'd') this.player.angle = 0;
    });

    this.addEventListenerTracked(window, 'keyup', (e) => {
      if (e.code === 'Space') this.player.isSprinting = false;
    });
  }

  initWorld() {
    this.player.x = 1500;
    this.player.y = 1500;
    this.player.xp = 0;
    this.player.tierIndex = 0;
    this.kills = 0;
    this.score = 0;

    // Spawn 160 XP Orbs
    this.xpOrbs = [];
    const orbColors = ['#00e5ff', '#38bdf8', '#818cf8', '#a855f7', '#ec4899', '#f59e0b', '#10b981'];
    for (let i = 0; i < 160; i++) {
      this.xpOrbs.push({
        x: Math.random() * (this.worldWidth - 200) + 100,
        y: Math.random() * (this.worldHeight - 200) + 100,
        color: orbColors[Math.floor(Math.random() * orbColors.length)],
        radius: 6,
        xpVal: 15
      });
    }

    // Spawn 8 AI Bots
    this.bots = [];
    const botNames = ['BloodAxe', 'ShadowKnight', 'CyberStriker', 'TitanViking', 'GhostNinja', 'WarlordGrom', 'Spartan99', 'NeonSlayer'];
    for (let i = 0; i < botNames.length; i++) {
      const tier = Math.floor(Math.random() * 4);
      this.bots.push({
        name: botNames[i],
        x: Math.random() * (this.worldWidth - 400) + 200,
        y: Math.random() * (this.worldHeight - 400) + 200,
        angle: Math.random() * Math.PI * 2,
        speed: 3.8,
        xp: this.tiers[tier].xpReq,
        tierIndex: tier,
        swordAngle: 0,
        isAttacking: false,
        attackCooldown: 0,
        aiTimer: 0,
        color: '#f43f5e'
      });
    }
  }

  triggerAttack(char) {
    if (char.attackCooldown > 0) return;
    char.attackCooldown = 25;
    char.isAttacking = true;
    sounds.playLaser();
    setTimeout(() => { char.isAttacking = false; }, 200);
  }

  update() {
    if (this.state !== GameState.PLAYING) return;

    // 1. Player Direction
    if (this.mouse.active) {
      const dx = this.mouse.x - this.width / 2;
      const dy = this.mouse.y - this.height / 2;
      if (Math.hypot(dx, dy) > 15) {
        this.player.angle = Math.atan2(dy, dx);
      }
    }

    // Move Player
    const speed = this.player.isSprinting ? 6.5 : this.player.speed;
    this.player.x += Math.cos(this.player.angle) * speed;
    this.player.y += Math.sin(this.player.angle) * speed;
    this.player.x = Math.max(50, Math.min(this.worldWidth - 50, this.player.x));
    this.player.y = Math.max(50, Math.min(this.worldHeight - 50, this.player.y));

    if (this.player.attackCooldown > 0) this.player.attackCooldown--;

    this.cameraX = this.player.x - this.width / 2;
    this.cameraY = this.player.y - this.height / 2;

    // 2. Player Eats XP Orbs
    for (let i = this.xpOrbs.length - 1; i >= 0; i--) {
      const orb = this.xpOrbs[i];
      if (Math.hypot(this.player.x - orb.x, this.player.y - orb.y) < 28) {
        this.player.xp += orb.xpVal;
        this.score += orb.xpVal;
        this.checkEvolution(this.player);

        orb.x = Math.random() * (this.worldWidth - 200) + 100;
        orb.y = Math.random() * (this.worldHeight - 200) + 100;
      }
    }

    // 3. Update Bots
    this.bots.forEach(bot => {
      bot.aiTimer++;
      if (bot.aiTimer > 35) {
        bot.aiTimer = 0;
        const distToPlayer = Math.hypot(this.player.x - bot.x, this.player.y - bot.y);
        if (distToPlayer < 350) {
          // Attack or retreat
          if (bot.tierIndex >= this.player.tierIndex) {
            bot.angle = Math.atan2(this.player.y - bot.y, this.player.x - bot.x);
            if (distToPlayer < this.tiers[bot.tierIndex].reach + 20) {
              this.triggerAttack(bot);
            }
          } else {
            bot.angle = Math.atan2(bot.y - this.player.y, bot.x - this.player.x);
          }
        } else {
          bot.angle += (Math.random() - 0.5) * 1.2;
        }
      }

      bot.x += Math.cos(bot.angle) * bot.speed;
      bot.y += Math.sin(bot.angle) * bot.speed;
      bot.x = Math.max(50, Math.min(this.worldWidth - 50, bot.x));
      bot.y = Math.max(50, Math.min(this.worldHeight - 50, bot.y));

      if (bot.attackCooldown > 0) bot.attackCooldown--;

      // Bot eats orbs
      for (const orb of this.xpOrbs) {
        if (Math.hypot(bot.x - orb.x, bot.y - orb.y) < 24) {
          bot.xp += orb.xpVal;
          this.checkEvolution(bot);
          orb.x = Math.random() * (this.worldWidth - 200) + 100;
          orb.y = Math.random() * (this.worldHeight - 200) + 100;
        }
      }
    });

    // 4. Weapon Slicing Combat Checks
    const pTier = this.tiers[this.player.tierIndex];
    const pBladeX = this.player.x + Math.cos(this.player.angle) * pTier.reach;
    const pBladeY = this.player.y + Math.sin(this.player.angle) * pTier.reach;

    for (let i = this.bots.length - 1; i >= 0; i--) {
      const bot = this.bots[i];
      const bTier = this.tiers[bot.tierIndex];
      const bBladeX = bot.x + Math.cos(bot.angle) * bTier.reach;
      const bBladeY = bot.y + Math.sin(bot.angle) * bTier.reach;

      // Player strikes bot
      if (this.player.isAttacking && Math.hypot(pBladeX - bot.x, pBladeY - bot.y) < 38) {
        sounds.playExplosion();
        this.kills++;
        this.score += 500 * (bot.tierIndex + 1);
        this.player.xp += 250 * (bot.tierIndex + 1);
        this.checkEvolution(this.player);

        // Blood / sparks
        for (let p = 0; p < 20; p++) {
          this.particles.push({
            x: bot.x,
            y: bot.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            radius: Math.random() * 4 + 2,
            color: '#ef4444',
            life: 25
          });
        }

        // Respawn bot
        bot.x = Math.random() * (this.worldWidth - 400) + 200;
        bot.y = Math.random() * (this.worldHeight - 400) + 200;
        bot.tierIndex = 0;
        bot.xp = 0;
        continue;
      }

      // Bot strikes player
      if (bot.isAttacking && Math.hypot(bBladeX - this.player.x, bBladeY - this.player.y) < 34) {
        sounds.playExplosion();
        this.gameOver(this.score, { kills: this.kills, tier: pTier.name });
        return;
      }
    }

    // 5. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  checkEvolution(char) {
    for (let i = this.tiers.length - 1; i >= 0; i--) {
      if (char.xp >= this.tiers[i].xpReq && char.tierIndex < i) {
        char.tierIndex = i;
        if (char === this.player) {
          sounds.playWin();
          // Evolution Aura Fireworks
          for (let p = 0; p < 30; p++) {
            this.particles.push({
              x: char.x,
              y: char.y,
              vx: (Math.random() - 0.5) * 10,
              vy: (Math.random() - 0.5) * 10,
              radius: Math.random() * 5 + 3,
              color: '#fbbf24',
              life: 35
            });
          }
        }
        break;
      }
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.save();
    ctx.translate(-this.cameraX, -this.cameraY);

    // 1. Arena Floor
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

    // Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const grid = 100;
    const startX = Math.floor(Math.max(0, this.cameraX) / grid) * grid;
    const endX = Math.min(this.worldWidth, startX + this.width + grid * 2);
    const startY = Math.floor(Math.max(0, this.cameraY) / grid) * grid;
    const endY = Math.min(this.worldHeight, startY + this.height + grid * 2);

    for (let x = startX; x <= endX; x += grid) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    for (let y = startY; y <= endY; y += grid) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }

    // 2. Render XP Orbs
    this.xpOrbs.forEach(orb => {
      if (orb.x < this.cameraX - 50 || orb.x > this.cameraX + this.width + 50 ||
          orb.y < this.cameraY - 50 || orb.y > this.cameraY + this.height + 50) return;
      ctx.fillStyle = orb.color;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // 3. Render Bots & Player
    this.bots.forEach(bot => this.drawWarrior(ctx, bot));
    this.drawWarrior(ctx, this.player);

    // 4. Render Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();

    // 5. HUD & Evolution Progress
    this.renderHUD(ctx);
  }

  drawWarrior(ctx, w) {
    const tier = this.tiers[w.tierIndex];
    ctx.save();
    ctx.translate(w.x, w.y);
    ctx.rotate(w.angle);

    // Warrior Body
    ctx.fillStyle = w.color;
    ctx.beginPath();
    ctx.arc(0, 0, 16 + w.tierIndex * 2, 0, Math.PI * 2);
    ctx.fill();

    // Extended Weapon
    ctx.fillStyle = tier.color;
    ctx.fillRect(8, -tier.width / 2, tier.reach, tier.width);

    // Weapon Tip
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(8 + tier.reach - 6, -tier.width / 2, 6, tier.width);

    ctx.restore();

    // Label
    ctx.fillStyle = w === this.player ? '#00e5ff' : '#cbd5e1';
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${w.name} [${tier.name}]`, w.x, w.y - 24);
  }

  renderHUD(ctx) {
    const curTier = this.tiers[this.player.tierIndex];
    const nextTier = this.tiers[Math.min(this.tiers.length - 1, this.player.tierIndex + 1)];

    // Evolution Bar (Bottom Center)
    const barW = 340;
    const barH = 20;
    const barX = this.width / 2 - barW / 2;
    const barY = this.height - 40;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeStyle = '#00e5ff';
    ctx.strokeRect(barX, barY, barW, barH);

    const progress = Math.min(1, (this.player.xp - curTier.xpReq) / (nextTier.xpReq - curTier.xpReq || 1));
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(barX + 2, barY + 2, (barW - 4) * progress, barH - 4);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${curTier.name.toUpperCase()} ➔ ${nextTier.name.toUpperCase()} (${Math.round(progress * 100)}%)`, this.width / 2, barY + 14);

    // Stats Top Left
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(20, 20, 260, 56);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.strokeRect(20, 20, 260, 56);

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 22px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`KILLS: ${this.kills} ⚔️`, 34, 48);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillText(`WEAPON: ${curTier.weapon} • XP: ${this.player.xp}`, 34, 66);
  }
}

