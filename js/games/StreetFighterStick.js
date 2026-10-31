/* ====================================================
   STREET FIGHTER STICK — PREMIUM 2D 1v1 FIGHTING GAME
   Fluid Martial Arts Animation, Hadoken Fireballs, Combos,
   AI Opponent with Dynamic Tactics & Mobile Touch Controls
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class StreetFighterStickGame extends GameEngineBase {
  constructor(container, onGameOver, config = {}) {
    super(container, onGameOver, Object.assign({
      title: 'Stickman Street Fighter Dojo',
      roundsToWin: 2
    }, config));

    this.round = 1;
    this.playerWins = 0;
    this.aiWins = 0;
    this.roundTime = 60;
    this.roundTimerAcc = 0;
    this.matchOver = false;

    // Arena Dimensions
    this.arenaWidth = 800;
    this.arenaHeight = 480;
    this.groundY = 380;

    // Create responsive canvas
    this.createCanvas(this.arenaWidth, this.arenaHeight);

    // Initialize Fighters
    this.resetFighters();

    // Projectiles & FX
    this.projectiles = [];
    this.hitSparks = [];
    this.comboCount = 0;
    this.comboTimer = 0;
    this.screenShake = 0;

    // Input State
    this.keys = {
      left: false,
      right: false,
      jump: false,
      block: false,
      punch: false,
      kick: false,
      special: false
    };

    this.initControls();

    // Show Start Screen with Controls
    this.showStartCard({
      title: 'Stickman Street Fighter',
      icon: '🥊',
      objective: 'Defeat the Shadow Master in a best-of-3 martial arts tournament! Chain punches, kicks, and unleash the Cyber Fireball!',
      controls: '<b>Desktop:</b> [A/D] Walk • [W] Jump • [S] Block • [J] Punch • [K] Kick • [L/U] Special Fireball<br><b>Mobile:</b> Use Touch Buttons below',
      onStart: () => {
        this.startRound(1);
      }
    });
  }

  resetFighters() {
    this.player = {
      x: 220,
      y: this.groundY,
      vx: 0,
      vy: 0,
      facing: 1, // 1 = right, -1 = left
      hp: 100,
      maxHp: 100,
      energy: 0,
      state: 'idle', // idle, walk, jump, punch, kick, block, hit, ko
      stateTimer: 0,
      isGrounded: true,
      color: '#00e5ff',
      name: 'CYBER RYU'
    };

    this.ai = {
      x: 580,
      y: this.groundY,
      vx: 0,
      vy: 0,
      facing: -1,
      hp: 100,
      maxHp: 100,
      energy: 0,
      state: 'idle',
      stateTimer: 0,
      isGrounded: true,
      decisionTimer: 0,
      actionCooldown: 0,
      color: '#f43f5e',
      name: 'SHADOW KEN'
    };
  }

  startRound(roundNum) {
    this.round = roundNum;
    this.roundTime = 60;
    this.roundTimerAcc = 0;
    this.projectiles = [];
    this.hitSparks = [];
    this.comboCount = 0;
    this.resetFighters();
    this.start();
  }

  initControls() {
    // Keyboard Controls
    this.addListener(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      const k = e.key.toLowerCase();
      if (k === 'a' || e.key === 'ArrowLeft') this.keys.left = true;
      if (k === 'd' || e.key === 'ArrowRight') this.keys.right = true;
      if (k === 'w' || e.key === 'ArrowUp' || e.key === ' ') {
        this.keys.jump = true;
        this.triggerPlayerJump();
      }
      if (k === 's' || e.key === 'ArrowDown') this.keys.block = true;
      if (k === 'j' || k === 'z') this.triggerPlayerAttack('punch');
      if (k === 'k' || k === 'x') this.triggerPlayerAttack('kick');
      if (k === 'l' || k === 'c' || k === 'u') this.triggerPlayerSpecial();
    });

    this.addListener(window, 'keyup', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'a' || e.key === 'ArrowLeft') this.keys.left = false;
      if (k === 'd' || e.key === 'ArrowRight') this.keys.right = false;
      if (k === 'w' || e.key === 'ArrowUp' || e.key === ' ') this.keys.jump = false;
      if (k === 's' || e.key === 'ArrowDown') this.keys.block = false;
    });

    // Mobile Virtual Touch Controls
    this.attachTouchControls({
      showDpad: true,
      onDirection: (dir, pressed) => {
        if (dir === 'LEFT') this.keys.left = pressed;
        if (dir === 'RIGHT') this.keys.right = pressed;
        if (dir === 'UP' && pressed) this.triggerPlayerJump();
        if (dir === 'DOWN') this.keys.block = pressed;
      },
      actionLabel: 'PUNCH',
      onAction: (pressed) => {
        if (pressed) this.triggerPlayerAttack('punch');
      }
    });

    // Extra Touch Buttons for Kick and Special
    if (this.virtualControlsContainer) {
      const btnRow = document.createElement('div');
      btnRow.style.cssText = 'display: flex; gap: 8px;';

      const kickBtn = document.createElement('button');
      kickBtn.textContent = 'KICK';
      kickBtn.style.cssText = `
        height: 60px; min-width: 70px; padding: 0 12px; border-radius: 30px;
        background: linear-gradient(135deg, #ffd166, #f59e0b); color: #0a0e17;
        font-weight: 800; font-size: 0.95rem; border: none; cursor: pointer;
        box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4); touch-action: none;
      `;
      kickBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.triggerPlayerAttack('kick');
      });

      const spBtn = document.createElement('button');
      spBtn.textContent = 'FIRE!';
      spBtn.style.cssText = `
        height: 60px; min-width: 75px; padding: 0 12px; border-radius: 30px;
        background: linear-gradient(135deg, #ec4899, #f43f5e); color: #fff;
        font-weight: 800; font-size: 0.95rem; border: none; cursor: pointer;
        box-shadow: 0 4px 14px rgba(244, 63, 94, 0.4); touch-action: none;
      `;
      spBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.triggerPlayerSpecial();
      });

      btnRow.appendChild(kickBtn);
      btnRow.appendChild(spBtn);
      this.virtualControlsContainer.appendChild(btnRow);
    }
  }

  triggerPlayerJump() {
    if (this.player.isGrounded && this.player.state !== 'hit' && this.player.state !== 'ko') {
      this.player.vy = -16;
      this.player.isGrounded = false;
      this.player.state = 'jump';
      sounds.playClick();
    }
  }

  triggerPlayerAttack(type) {
    if (this.player.state === 'hit' || this.player.state === 'ko') return;
    if (this.player.state === 'punch' || this.player.state === 'kick') return;

    this.player.state = type;
    this.player.stateTimer = type === 'punch' ? 14 : 20;
    sounds.playClick();

    // Check hit immediately or mid-swing
    this.checkMeleeHit(this.player, this.ai, type === 'punch' ? 10 : 16);
  }

  triggerPlayerSpecial() {
    if (this.player.state === 'hit' || this.player.state === 'ko') return;
    if (this.player.energy < 30) {
      // Need at least 30 energy
      return;
    }

    this.player.energy -= 30;
    this.player.state = 'punch';
    this.player.stateTimer = 22;
    sounds.playPowerup();

    // Spawn Hadoken Fireball
    this.projectiles.push({
      x: this.player.x + this.player.facing * 45,
      y: this.player.y - 45,
      vx: this.player.facing * 12,
      vy: 0,
      radius: 18,
      owner: this.player,
      damage: 22,
      color: '#00e5ff'
    });
  }

  checkMeleeHit(attacker, defender, damage) {
    const range = attacker.state === 'kick' ? 70 : 55;
    const dx = defender.x - attacker.x;
    const sameDirection = (dx > 0 && attacker.facing > 0) || (dx < 0 && attacker.facing < 0);

    if (Math.abs(dx) <= range && Math.abs(defender.y - attacker.y) <= 40 && sameDirection) {
      if (defender.state === 'block') {
        // Blocked!
        defender.hp -= Math.floor(damage * 0.2);
        defender.x += attacker.facing * 8;
        sounds.playClick();
        this.spawnHitSparks(defender.x, defender.y - 45, '#ffd166');
      } else {
        // Direct Hit!
        defender.hp -= damage;
        defender.state = 'hit';
        defender.stateTimer = 16;
        defender.x += attacker.facing * 18;
        defender.vx = attacker.facing * 4;
        attacker.energy = Math.min(100, attacker.energy + 15);

        sounds.playHit();
        this.screenShake = 10;
        this.spawnHitSparks(defender.x, defender.y - 45, attacker.color);

        if (attacker === this.player) {
          this.comboCount++;
          this.comboTimer = 60;
          this.score += damage * 15 * Math.min(5, this.comboCount);
        }
      }

      if (defender.hp <= 0) {
        defender.hp = 0;
        defender.state = 'ko';
        defender.stateTimer = 100;
        this.handleRoundFinish(attacker === this.player);
      }
    }
  }

  spawnHitSparks(x, y, color) {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 8 + 3;
      this.hitSparks.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 1.0,
        decay: 0.05,
        color
      });
    }
  }

  updateAI(dt) {
    const ai = this.ai;
    const p = this.player;
    if (ai.state === 'hit' || ai.state === 'ko') return;

    ai.decisionTimer--;
    if (ai.decisionTimer <= 0) {
      ai.decisionTimer = Math.floor(Math.random() * 20) + 15;

      const dist = p.x - ai.x;
      ai.facing = dist > 0 ? 1 : -1;

      // Distance-based AI tactics
      const absDist = Math.abs(dist);
      if (absDist > 160) {
        // Approach or shoot fireball
        if (Math.random() < 0.3 && ai.energy >= 30) {
          ai.energy -= 30;
          ai.state = 'punch';
          ai.stateTimer = 22;
          sounds.playPowerup();
          this.projectiles.push({
            x: ai.x + ai.facing * 45,
            y: ai.y - 45,
            vx: ai.facing * 10,
            vy: 0,
            radius: 16,
            owner: ai,
            damage: 20,
            color: '#f43f5e'
          });
        } else {
          ai.vx = ai.facing * 3.8;
          ai.state = 'walk';
        }
      } else if (absDist > 65) {
        // In strike distance
        if (Math.random() < 0.6) {
          ai.state = 'kick';
          ai.stateTimer = 18;
          this.checkMeleeHit(ai, p, 15);
        } else {
          ai.vx = ai.facing * 2.5;
        }
      } else {
        // Close quarters: punch or block
        if (p.state === 'punch' || p.state === 'kick') {
          ai.state = Math.random() < 0.65 ? 'block' : 'punch';
          if (ai.state === 'punch') {
            ai.stateTimer = 14;
            this.checkMeleeHit(ai, p, 10);
          }
        } else {
          ai.state = 'punch';
          ai.stateTimer = 14;
          this.checkMeleeHit(ai, p, 10);
        }
      }
    }
  }

  handleRoundFinish(playerWon) {
    if (this.matchOver) return;

    if (playerWon) {
      this.playerWins++;
      sounds.playLevelUp();
    } else {
      this.aiWins++;
      sounds.playHit();
    }

    if (this.playerWins >= this.config.roundsToWin) {
      this.matchOver = true;
      this.setTimeout(() => {
        this.finishGame(this.score + 1000, {
          isVictory: true,
          stars: this.aiWins === 0 ? 3 : 2,
          coinsEarned: 150
        });
      }, 1400);
    } else if (this.aiWins >= this.config.roundsToWin) {
      this.matchOver = true;
      this.setTimeout(() => {
        this.finishGame(this.score, {
          isVictory: false,
          stars: 1
        });
      }, 1400);
    } else {
      // Next Round!
      this.setTimeout(() => {
        this.startRound(this.round + 1);
      }, 1800);
    }
  }

  update(dt) {
    if (this.state !== GameState.PLAYING) return;

    // Timer countdown
    this.roundTimerAcc += dt;
    if (this.roundTimerAcc >= 1.0) {
      this.roundTimerAcc -= 1.0;
      this.roundTime--;
      if (this.roundTime <= 0) {
        // Time Over: who has more HP?
        this.handleRoundFinish(this.player.hp >= this.ai.hp);
        return;
      }
    }

    // Screen Shake
    if (this.screenShake > 0) this.screenShake *= 0.85;

    // Combo Timer
    if (this.comboTimer > 0) {
      this.comboTimer--;
      if (this.comboTimer <= 0) this.comboCount = 0;
    }

    // Player Physics & Movement
    if (this.player.state !== 'hit' && this.player.state !== 'ko') {
      if (this.keys.block) {
        this.player.state = 'block';
        this.player.vx = 0;
      } else {
        if (this.keys.left) {
          this.player.vx = -4.5;
          if (this.player.isGrounded) this.player.state = 'walk';
        } else if (this.keys.right) {
          this.player.vx = 4.5;
          if (this.player.isGrounded) this.player.state = 'walk';
        } else {
          this.player.vx = 0;
          if (this.player.isGrounded && this.player.state === 'walk') {
            this.player.state = 'idle';
          }
        }
      }
    }

    // Update Player Animation State Timers
    if (this.player.stateTimer > 0) {
      this.player.stateTimer--;
      if (this.player.stateTimer <= 0 && this.player.isGrounded) {
        this.player.state = 'idle';
      }
    }

    // Gravity & Ground Bounds
    this.applyPhysics(this.player);
    this.applyPhysics(this.ai);

    // Face each other
    if (this.player.isGrounded && this.player.state !== 'hit' && this.player.state !== 'ko') {
      this.player.facing = this.player.x < this.ai.x ? 1 : -1;
    }

    // Update AI
    this.updateAI(dt);
    if (this.ai.stateTimer > 0) {
      this.ai.stateTimer--;
      if (this.ai.stateTimer <= 0 && this.ai.isGrounded) {
        this.ai.state = 'idle';
      }
    }

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.x += proj.vx;
      proj.y += proj.vy;

      const target = proj.owner === this.player ? this.ai : this.player;
      if (Math.hypot(proj.x - target.x, proj.y - (target.y - 45)) < proj.radius + 20) {
        // Hit target!
        const dmg = target.state === 'block' ? Math.floor(proj.damage * 0.3) : proj.damage;
        target.hp -= dmg;
        target.state = target.state === 'block' ? 'block' : 'hit';
        target.stateTimer = 18;
        target.vx = proj.vx * 0.4;

        sounds.playHit();
        this.screenShake = 12;
        this.spawnHitSparks(target.x, target.y - 45, proj.color);
        this.projectiles.splice(i, 1);

        if (target.hp <= 0) {
          target.hp = 0;
          target.state = 'ko';
          this.handleRoundFinish(proj.owner === this.player);
        }
        continue;
      }

      if (proj.x < 0 || proj.x > this.arenaWidth) {
        this.projectiles.splice(i, 1);
      }
    }

    // Update Hit Sparks
    for (let i = this.hitSparks.length - 1; i >= 0; i--) {
      const spk = this.hitSparks[i];
      spk.x += spk.vx;
      spk.y += spk.vy;
      spk.life -= spk.decay;
      if (spk.life <= 0) {
        this.hitSparks.splice(i, 1);
      }
    }
  }

  applyPhysics(f) {
    f.vy += 0.8; // Gravity
    f.y += f.vy;
    f.x += f.vx;

    if (f.y >= this.groundY) {
      f.y = this.groundY;
      f.vy = 0;
      f.isGrounded = true;
      if (f.state === 'jump') f.state = 'idle';
    }

    // Arena horizontal bounds
    f.x = Math.max(70, Math.min(this.arenaWidth - 70, f.x));
  }

  render(ctx) {
    ctx.save();

    // Screen Shake
    if (this.screenShake > 0.5) {
      ctx.translate((Math.random() - 0.5) * this.screenShake, (Math.random() - 0.5) * this.screenShake);
    }

    // 1. Dojo Arena Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.arenaHeight);
    bgGrad.addColorStop(0, '#0a101f');
    bgGrad.addColorStop(0.7, '#141d33');
    bgGrad.addColorStop(1, '#070a12');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.arenaWidth, this.arenaHeight);

    // Distant Dojo Silhouette & Torii Gate
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.strokeRect(320, 180, 160, 200);

    // Ground Floor
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, this.groundY, this.arenaWidth, this.arenaHeight - this.groundY);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, this.groundY);
    ctx.lineTo(this.arenaWidth, this.groundY);
    ctx.stroke();

    // 2. Fighters
    this.renderFighter(ctx, this.player);
    this.renderFighter(ctx, this.ai);

    // 3. Projectiles
    for (const proj of this.projectiles) {
      ctx.save();
      ctx.fillStyle = proj.color;
      ctx.shadowColor = proj.color;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 4. Hit Sparks
    for (const spk of this.hitSparks) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, spk.life);
      ctx.fillStyle = spk.color;
      ctx.beginPath();
      ctx.arc(spk.x, spk.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 5. HUD: Dual Health Bars & Timer
    this.renderHUD(ctx);

    ctx.restore();
  }

  renderFighter(ctx, f) {
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.scale(f.facing, 1);

    ctx.strokeStyle = f.color;
    ctx.fillStyle = f.color;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = f.color;
    ctx.shadowBlur = 10;

    // Head
    ctx.beginPath();
    ctx.arc(0, -75, 12, 0, Math.PI * 2);
    ctx.fill();

    // Torso
    ctx.beginPath();
    ctx.moveTo(0, -63);
    ctx.lineTo(0, -32);
    ctx.stroke();

    // Poses based on state
    if (f.state === 'punch') {
      // Punch extension
      ctx.beginPath();
      ctx.moveTo(0, -52);
      ctx.lineTo(16, -50);
      ctx.lineTo(38, -52); // Punch arm out!
      ctx.stroke();

      // Back arm
      ctx.beginPath();
      ctx.moveTo(0, -52);
      ctx.lineTo(-12, -45);
      ctx.stroke();

      // Legs in stance
      ctx.beginPath();
      ctx.moveTo(0, -32);
      ctx.lineTo(-16, 0);
      ctx.moveTo(0, -32);
      ctx.lineTo(18, 0);
      ctx.stroke();
    } else if (f.state === 'kick') {
      // Kick extension
      ctx.beginPath();
      ctx.moveTo(0, -32);
      ctx.lineTo(18, -25);
      ctx.lineTo(44, -30); // Kick leg out!
      ctx.stroke();

      // Support leg
      ctx.beginPath();
      ctx.moveTo(0, -32);
      ctx.lineTo(-12, 0);
      ctx.stroke();

      // Guard arms
      ctx.beginPath();
      ctx.moveTo(0, -52);
      ctx.lineTo(12, -60);
      ctx.stroke();
    } else if (f.state === 'block') {
      // Crossed block arms
      ctx.beginPath();
      ctx.moveTo(0, -52);
      ctx.lineTo(15, -60);
      ctx.lineTo(15, -45);
      ctx.stroke();

      // Legs bent
      ctx.beginPath();
      ctx.moveTo(0, -32);
      ctx.lineTo(-12, 0);
      ctx.moveTo(0, -32);
      ctx.lineTo(12, 0);
      ctx.stroke();
    } else if (f.state === 'hit') {
      // Recoil posture
      ctx.beginPath();
      ctx.moveTo(0, -63);
      ctx.lineTo(-15, -35); // Leaning back
      ctx.lineTo(-10, 0);
      ctx.stroke();
    } else if (f.state === 'ko') {
      // Fallen stickman
      ctx.restore();
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.strokeStyle = f.color;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(f.facing * 40, -10, 10, 0, Math.PI * 2);
      ctx.moveTo(0, 0);
      ctx.lineTo(f.facing * 30, -5);
      ctx.stroke();
      ctx.restore();
      return;
    } else {
      // Idle / Walk stance (breathing wave)
      const breath = Math.sin(Date.now() * 0.008) * 2;
      ctx.beginPath();
      ctx.moveTo(0, -52);
      ctx.lineTo(12, -45 + breath);
      ctx.lineTo(18, -35 + breath);
      ctx.moveTo(0, -52);
      ctx.lineTo(-10, -45);
      ctx.stroke();

      // Legs
      const walkSpread = f.state === 'walk' ? Math.sin(Date.now() * 0.015) * 12 : 10;
      ctx.beginPath();
      ctx.moveTo(0, -32);
      ctx.lineTo(-walkSpread, 0);
      ctx.moveTo(0, -32);
      ctx.lineTo(walkSpread, 0);
      ctx.stroke();
    }

    ctx.restore();
  }

  renderHUD(ctx) {
    const barW = 280;
    const barH = 18;

    // Player 1 Health Bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(40, 24, barW, barH);
    const p1HpW = (this.player.hp / this.player.maxHp) * barW;
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(40, 24, p1HpW, barH);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 24, barW, barH);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px Outfit, sans-serif';
    ctx.fillText(`${this.player.name}`, 40, 18);

    // Player 1 Energy Bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(40, 46, 160, 8);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(40, 46, (this.player.energy / 100) * 160, 8);

    // AI Health Bar
    const aiX = this.arenaWidth - 40 - barW;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(aiX, 24, barW, barH);
    const aiHpW = (this.ai.hp / this.ai.maxHp) * barW;
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(aiX + (barW - aiHpW), 24, aiHpW, barH);
    ctx.strokeRect(aiX, 24, barW, barH);

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    ctx.fillText(`${this.ai.name}`, this.arenaWidth - 40, 18);
    ctx.textAlign = 'left';

    // Center Round Timer & Round Counter
    ctx.fillStyle = '#ffd166';
    ctx.font = '900 28px Lilita One, Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.roundTime}`, this.arenaWidth / 2, 42);

    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText(`ROUND ${this.round}`, this.arenaWidth / 2, 60);

    // Combo Callout
    if (this.comboCount >= 2) {
      ctx.fillStyle = '#ffd166';
      ctx.font = '900 24px Lilita One, sans-serif';
      ctx.fillText(`${this.comboCount}x COMBO!`, 140, 100);
    }

    ctx.textAlign = 'left';
  }
}
