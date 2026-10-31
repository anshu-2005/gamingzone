/* ====================================================
   ROOFTOP SNIPERS DUEL — GAMINGZONE
   High-Stakes 2-Button Physics Ragdoll Sniper Duel
   - 1-Player vs Ragdoll AI & 2-Player Local Versus
   - Realistic Knockback Momentum, Bullet Physics & Recoil
   - Dynamic Rooftops: Highrise, Construction Crane, Bullet Train & Snow Castle
   - Environmental Modifiers: Beach Balls, Wind Gusts & Low Gravity
   - First to 5 Points Claims Match Victory
   - Mobile Touch Controls & Keyboard (P1: W/E, P2: I/O or Up/Enter)
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class RooftopSnipersDuelGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Rooftop Snipers Duel',
      targetScore: 5,
      lives: 5,
      ...config
    });

    this.createCanvas(840, 520);

    // Game Mode: 'vs_ai' or '2player'
    this.mode = 'vs_ai';
    this.scoreP1 = 0;
    this.scoreP2 = 0;
    this.winningScore = 5;

    // Environmental Arenas
    this.arenas = [
      { name: 'Downtown Skyline', roofWidth: 500, roofY: 380, friction: 0.88, theme: 'city' },
      { name: 'Construction Crane', roofWidth: 420, roofY: 360, friction: 0.92, theme: 'crane' },
      { name: 'High-Speed Train', roofWidth: 460, roofY: 390, friction: 0.85, theme: 'train' },
      { name: 'Snowy Peak Castle', roofWidth: 440, roofY: 370, friction: 0.97, theme: 'snow' }
    ];
    this.currentArenaIndex = 0;

    // Modifiers
    this.activeModifier = 'Normal';
    this.gravity = 0.48;
    this.wind = 0;

    // Entities
    this.p1 = null;
    this.p2 = null;
    this.bullets = [];
    this.particles = [];
    this.props = [];
    this.roundOver = false;
    this.roundWinner = null;
    this.roundResetTimer = 0;

    this.keys = {};

    this.initControls();
    this.resetMatch();

    this.attachTouchControls({
      showDpad: false,
      onAction: () => {
        // Touch default fires P1 jump or shoot
        if (this.p1) this.jumpPlayer(this.p1);
      }
    });

    this.showStartCard({
      title: 'ROOFTOP SNIPERS DUEL',
      icon: '🎯',
      objective: 'Knock your opponent off the roof! First sniper to 5 points wins the championship.',
      controls: 'P1: [W] Jump & Lean • [E] Shoot\nP2: [I] Jump & Lean • [O] Shoot (or Arrow Up & Enter)',
      onStart: () => {
        this.resetMatch();
        this.start();
      }
    });
  }

  initControls() {
    this.addEventListenerTracked(window, 'keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      this.keys[e.code] = true;

      if (this.state !== GameState.PLAYING) return;

      // Player 1 controls
      if (e.key === 'w' || e.key === 'W') {
        this.jumpPlayer(this.p1);
      }
      if (e.key === 'e' || e.key === 'E') {
        this.shootPlayer(this.p1);
      }

      // Player 2 controls
      if (this.mode === '2player') {
        if (e.key === 'i' || e.key === 'I' || e.key === 'ArrowUp') {
          this.jumpPlayer(this.p2);
        }
        if (e.key === 'o' || e.key === 'O' || e.key === 'Enter') {
          this.shootPlayer(this.p2);
        }
      }

      // Quick toggle mode: [M]
      if (e.key === 'm' || e.key === 'M') {
        this.mode = this.mode === 'vs_ai' ? '2player' : 'vs_ai';
        sounds.playClick();
      }
    });

    this.addEventListenerTracked(window, 'keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
      this.keys[e.code] = false;
    });

    // Touch custom buttons for dual player mobile touch
    this.setupDualTouchButtons();
  }

  setupDualTouchButtons() {
    if (typeof document === 'undefined' || !this.container) return;

    const bar = document.createElement('div');
    bar.style.position = 'absolute';
    bar.style.bottom = '12px';
    bar.style.left = '12px';
    bar.style.right = '12px';
    bar.style.display = 'flex';
    bar.style.justifyContent = 'space-between';
    bar.style.pointerEvents = 'none';
    bar.style.zIndex = '50';

    const p1Box = document.createElement('div');
    p1Box.style.display = 'flex';
    p1Box.style.gap = '8px';
    p1Box.style.pointerEvents = 'auto';

    const btnP1Jump = this.makeTouchBtn('P1 JUMP (W)', '#00e5ff');
    btnP1Jump.ontouchstart = (e) => { e.preventDefault(); this.jumpPlayer(this.p1); };
    btnP1Jump.onmousedown = () => this.jumpPlayer(this.p1);

    const btnP1Shoot = this.makeTouchBtn('P1 SHOOT (E)', '#ff0055');
    btnP1Shoot.ontouchstart = (e) => { e.preventDefault(); this.shootPlayer(this.p1); };
    btnP1Shoot.onmousedown = () => this.shootPlayer(this.p1);

    p1Box.appendChild(btnP1Jump);
    p1Box.appendChild(btnP1Shoot);

    const p2Box = document.createElement('div');
    p2Box.style.display = 'flex';
    p2Box.style.gap = '8px';
    p2Box.style.pointerEvents = 'auto';

    const btnP2Jump = this.makeTouchBtn('P2 JUMP (I)', '#a855f7');
    btnP2Jump.ontouchstart = (e) => { e.preventDefault(); if (this.mode === '2player') this.jumpPlayer(this.p2); };
    btnP2Jump.onmousedown = () => { if (this.mode === '2player') this.jumpPlayer(this.p2); };

    const btnP2Shoot = this.makeTouchBtn('P2 SHOOT (O)', '#eab308');
    btnP2Shoot.ontouchstart = (e) => { e.preventDefault(); if (this.mode === '2player') this.shootPlayer(this.p2); };
    btnP2Shoot.onmousedown = () => { if (this.mode === '2player') this.shootPlayer(this.p2); };

    p2Box.appendChild(btnP2Jump);
    p2Box.appendChild(btnP2Shoot);

    bar.appendChild(p1Box);
    bar.appendChild(p2Box);
    this.container.appendChild(bar);
  }

  makeTouchBtn(label, color) {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.style.padding = '8px 12px';
    btn.style.borderRadius = '8px';
    btn.style.background = 'rgba(15, 23, 42, 0.85)';
    btn.style.border = `2px solid ${color}`;
    btn.style.color = '#fff';
    btn.style.fontWeight = 'bold';
    btn.style.fontSize = '11px';
    btn.style.cursor = 'pointer';
    btn.style.touchAction = 'manipulation';
    return btn;
  }

  resetMatch() {
    this.scoreP1 = 0;
    this.scoreP2 = 0;
    this.currentArenaIndex = Math.floor(Math.random() * this.arenas.length);
    this.initRound();
  }

  initRound() {
    const arena = this.arenas[this.currentArenaIndex];
    const roofLeft = (this.width - arena.roofWidth) / 2;
    const roofRight = roofLeft + arena.roofWidth;

    // Environmental Modifier
    const mods = ['Normal', 'Low Gravity', 'Bouncy Balls', 'Windy Storm'];
    this.activeModifier = mods[Math.floor(Math.random() * mods.length)];
    this.gravity = this.activeModifier === 'Low Gravity' ? 0.24 : 0.48;
    this.wind = this.activeModifier === 'Windy Storm' ? (Math.random() > 0.5 ? 0.12 : -0.12) : 0;

    // Player 1 (Left)
    this.p1 = {
      id: 1,
      name: 'Player 1',
      color: '#00e5ff',
      suit: '#0284c7',
      x: roofLeft + 90,
      y: arena.roofY - 60,
      vx: 0,
      vy: 0,
      angle: 0,
      vAngle: 0,
      armAngle: 0,
      armDir: 1,
      facing: 1, // 1: right, -1: left
      isGrounded: false,
      recoilCooldown: 0,
      sniperLength: 32
    };

    // Player 2 (Right)
    this.p2 = {
      id: 2,
      name: this.mode === 'vs_ai' ? 'Bot Sniper' : 'Player 2',
      color: '#f43f5e',
      suit: '#be123c',
      x: roofRight - 90,
      y: arena.roofY - 60,
      vx: 0,
      vy: 0,
      angle: 0,
      vAngle: 0,
      armAngle: 0,
      armDir: -1,
      facing: -1,
      isGrounded: false,
      recoilCooldown: 0,
      sniperLength: 32,
      aiTimer: 0,
      aiReaction: Math.random() * 25 + 25
    };

    this.bullets = [];
    this.particles = [];
    this.props = [];
    this.roundOver = false;
    this.roundWinner = null;
    this.roundResetTimer = 0;

    // Spawn beach balls if modifier active
    if (this.activeModifier === 'Bouncy Balls') {
      for (let i = 0; i < 3; i++) {
        this.props.push({
          x: roofLeft + 120 + i * 110,
          y: arena.roofY - 30,
          vx: (Math.random() - 0.5) * 3,
          vy: -4,
          radius: 18,
          bounciness: 0.85
        });
      }
    }
  }

  jumpPlayer(p) {
    if (!p) return;
    sounds.playJump();
    // Leans back while hopping with angular momentum
    p.vy = -9.2;
    p.vx += p.facing * -2.4;
    p.vAngle += p.facing * -0.16;
    p.isGrounded = false;

    // Dust particles
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: p.x,
        y: p.y + 30,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 2,
        radius: 3,
        color: '#94a3b8',
        life: 20
      });
    }
  }

  shootPlayer(p) {
    if (!p || p.recoilCooldown > 0) return;
    p.recoilCooldown = 28;
    sounds.playLaser();

    // Muzzle position
    const cos = Math.cos(p.armAngle);
    const sin = Math.sin(p.armAngle);
    const muzzleX = p.x + cos * (p.sniperLength + 10);
    const muzzleY = p.y - 10 + sin * (p.sniperLength + 10);

    const bSpeed = 22;
    this.bullets.push({
      owner: p.id,
      x: muzzleX,
      y: muzzleY,
      vx: cos * bSpeed + p.vx * 0.3,
      vy: sin * bSpeed,
      life: 80,
      color: p.color
    });

    // Intense Recoil Knockback
    p.vx -= cos * 4.5;
    p.vy -= sin * 2.5;
    p.vAngle -= p.facing * 0.12;

    // Muzzle Flash Particles
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: muzzleX,
        y: muzzleY,
        vx: cos * (Math.random() * 6 + 2) + (Math.random() - 0.5) * 3,
        vy: sin * (Math.random() * 6 + 2) + (Math.random() - 0.5) * 3,
        radius: Math.random() * 3 + 2,
        color: '#fbbf24',
        life: 15
      });
    }
  }

  updateAI() {
    if (this.mode !== 'vs_ai' || !this.p2 || this.roundOver) return;

    this.p2.aiTimer++;

    // AI Aiming & Jump Logic
    const dx = this.p1.x - this.p2.x;
    const dy = (this.p1.y - 10) - (this.p2.y - 10);
    const targetAngle = Math.atan2(dy, dx);

    // Smoothly track towards target angle
    const diff = targetAngle - this.p2.armAngle;
    if (Math.abs(diff) < 0.28 && this.p2.aiTimer > this.p2.aiReaction) {
      this.shootPlayer(this.p2);
      this.p2.aiTimer = 0;
      this.p2.aiReaction = Math.random() * 20 + 20;
    }

    // AI Jumps when opponent shoots or to dodge incoming bullets
    for (const b of this.bullets) {
      if (b.owner === 1 && Math.hypot(b.x - this.p2.x, b.y - this.p2.y) < 140) {
        if (this.p2.isGrounded && Math.random() < 0.6) {
          this.jumpPlayer(this.p2);
        }
      }
    }

    // AI recovers if leaning dangerously off roof
    const arena = this.arenas[this.currentArenaIndex];
    const roofLeft = (this.width - arena.roofWidth) / 2;
    const roofRight = roofLeft + arena.roofWidth;
    if (this.p2.x > roofRight - 50 && this.p2.isGrounded) {
      this.jumpPlayer(this.p2);
    }
  }

  update() {
    if (this.state !== GameState.PLAYING) return;

    const arena = this.arenas[this.currentArenaIndex];
    const roofLeft = (this.width - arena.roofWidth) / 2;
    const roofRight = roofLeft + arena.roofWidth;
    const roofY = arena.roofY;

    if (this.roundOver) {
      this.roundResetTimer++;
      if (this.roundResetTimer > 90) {
        if (this.scoreP1 >= this.winningScore || this.scoreP2 >= this.winningScore) {
          const p1Wins = this.scoreP1 >= this.winningScore;
          sounds.playWin();
          this.gameOver(p1Wins ? 1000 : 300, {
            winner: p1Wins ? 'Player 1' : (this.mode === 'vs_ai' ? 'Bot' : 'Player 2'),
            p1Score: this.scoreP1,
            p2Score: this.scoreP2
          });
        } else {
          // Next round with changing arena!
          this.currentArenaIndex = (this.currentArenaIndex + 1) % this.arenas.length;
          this.initRound();
        }
      }
      return;
    }

    this.updateAI();

    // Update Players
    [this.p1, this.p2].forEach((p) => {
      if (!p) return;

      // Arm auto-oscillates up and down for sniper rhythm
      p.armAngle += 0.05 * p.armDir;
      if (p.facing === 1) {
        if (p.armAngle > 0.8) p.armDir = -1;
        if (p.armAngle < -0.8) p.armDir = 1;
      } else {
        if (p.armAngle < Math.PI - 0.8) p.armDir = 1;
        if (p.armAngle > Math.PI + 0.8) p.armDir = -1;
      }

      // Physics integration
      p.vy += this.gravity;
      p.vx += this.wind;
      p.x += p.vx;
      p.y += p.vy;

      // Angular physics & wobble
      p.angle += p.vAngle;
      p.vAngle *= 0.94;
      p.angle *= 0.92; // upright stabilization

      if (p.recoilCooldown > 0) p.recoilCooldown--;

      // Rooftop Collision
      if (p.x >= roofLeft && p.x <= roofRight && p.y + 32 >= roofY && p.y + 32 <= roofY + 28 && p.vy >= 0) {
        p.y = roofY - 32;
        p.vy = 0;
        p.vx *= arena.friction;
        p.isGrounded = true;
      } else {
        p.isGrounded = false;
      }

      // Fall off roof check
      if (p.y > this.height + 80) {
        this.triggerRoundEnd(p.id === 1 ? 2 : 1);
      }
    });

    // Update Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.life--;

      // Hit opponent player
      const target = b.owner === 1 ? this.p2 : this.p1;
      if (target && Math.hypot(b.x - target.x, b.y - (target.y - 6)) < 26) {
        // Massive Ragdoll Knockback!
        sounds.playExplosion();
        target.vx += b.vx * 0.45;
        target.vy += b.vy * 0.25 - 3;
        target.vAngle += (Math.random() - 0.5) * 0.6;

        // Spark blood/shield particles
        for (let p = 0; p < 14; p++) {
          this.particles.push({
            x: b.x,
            y: b.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            radius: Math.random() * 4 + 2,
            color: b.color,
            life: 25
          });
        }

        this.bullets.splice(i, 1);
        continue;
      }

      // Bullet hit roof
      if (b.x >= roofLeft && b.x <= roofRight && b.y >= roofY && b.y <= roofY + 20) {
        sounds.playHit();
        for (let p = 0; p < 6; p++) {
          this.particles.push({
            x: b.x,
            y: roofY,
            vx: (Math.random() - 0.5) * 4,
            vy: -Math.random() * 3,
            radius: 2,
            color: '#cbd5e1',
            life: 15
          });
        }
        this.bullets.splice(i, 1);
        continue;
      }

      if (b.life <= 0 || b.x < -100 || b.x > this.width + 100) {
        this.bullets.splice(i, 1);
      }
    }

    // Update Bouncy Props (Beach Balls)
    this.props.forEach((ball) => {
      ball.vy += this.gravity;
      ball.x += ball.vx;
      ball.y += ball.vy;

      if (ball.x >= roofLeft && ball.x <= roofRight && ball.y + ball.radius >= roofY) {
        ball.y = roofY - ball.radius;
        ball.vy = -ball.vy * ball.bounciness;
        ball.vx *= 0.98;
      }

      // Knock players if hit by ball
      [this.p1, this.p2].forEach((p) => {
        if (!p) return;
        if (Math.hypot(p.x - ball.x, p.y - ball.y) < ball.radius + 20) {
          p.vx += ball.vx * 1.2;
          p.vy -= 2;
          ball.vx = -ball.vx;
        }
      });
    });

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  triggerRoundEnd(winnerId) {
    if (this.roundOver) return;
    this.roundOver = true;
    this.roundWinner = winnerId;
    this.roundResetTimer = 0;

    sounds.playSuccess();
    if (winnerId === 1) {
      this.scoreP1++;
    } else {
      this.scoreP2++;
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const arena = this.arenas[this.currentArenaIndex];
    const roofLeft = (this.width - arena.roofWidth) / 2;
    const roofRight = roofLeft + arena.roofWidth;
    const roofY = arena.roofY;

    // 1. Dynamic Atmosphere Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    if (arena.theme === 'city') {
      skyGrad.addColorStop(0, '#0f172a');
      skyGrad.addColorStop(0.6, '#312e81');
      skyGrad.addColorStop(1, '#f43f5e');
    } else if (arena.theme === 'crane') {
      skyGrad.addColorStop(0, '#020617');
      skyGrad.addColorStop(0.7, '#1e293b');
      skyGrad.addColorStop(1, '#0284c7');
    } else if (arena.theme === 'train') {
      skyGrad.addColorStop(0, '#111827');
      skyGrad.addColorStop(0.5, '#374151');
      skyGrad.addColorStop(1, '#10b981');
    } else {
      skyGrad.addColorStop(0, '#0f172a');
      skyGrad.addColorStop(0.7, '#38bdf8');
      skyGrad.addColorStop(1, '#e2e8f0');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Skyline Buildings Silhouettes
    ctx.fillStyle = 'rgba(10, 15, 29, 0.65)';
    for (let i = 0; i < 9; i++) {
      const bx = i * 105;
      const bw = 70;
      const bh = 140 + ((i * 37) % 120);
      ctx.fillRect(bx, this.height - bh, bw, bh);
    }

    // 2. Rooftop Platform
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(roofLeft, roofY, arena.roofWidth, this.height - roofY);

    // Glowing Platform Edge
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(roofLeft, roofY);
    ctx.lineTo(roofRight, roofY);
    ctx.stroke();

    // 3. Render Props (Beach Balls)
    this.props.forEach((ball) => {
      ctx.save();
      ctx.translate(ball.x, ball.y);
      ctx.beginPath();
      ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    });

    // 4. Render Ragdoll Players
    [this.p1, this.p2].forEach((p) => {
      if (!p) return;
      this.drawRagdollPlayer(ctx, p);
    });

    // 5. Render Bullets
    this.bullets.forEach((b) => {
      ctx.save();
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 6. Render Particles
    this.particles.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // 7. Modern Scoreboard & HUD
    this.renderHUD(ctx, arena);
  }

  drawRagdollPlayer(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);

    // Head
    ctx.fillStyle = '#fde047'; // Skin
    ctx.beginPath();
    ctx.arc(0, -22, 10, 0, Math.PI * 2);
    ctx.fill();

    // Headband / Cap
    ctx.fillStyle = p.color;
    ctx.fillRect(-10, -30, 20, 6);

    // Torso (Suit)
    ctx.fillStyle = p.suit;
    ctx.fillRect(-8, -12, 16, 26);

    // Legs
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-7, 14, 5, 18);
    ctx.fillRect(2, 14, 5, 18);

    // Arms & Sniper Gun (Rotates with armAngle)
    ctx.save();
    ctx.translate(0, -4);
    ctx.rotate(p.armAngle - p.angle);

    // Sniper Body
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, -4, p.sniperLength, 6);
    // Sniper Scope
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(6, -8, 12, 3);
    // Sniper Grip
    ctx.fillStyle = '#64748b';
    ctx.fillRect(4, 2, 4, 6);

    ctx.restore();

    ctx.restore();
  }

  renderHUD(ctx, arena) {
    // Top Scoreboard Bar
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(this.width / 2 - 160, 16, 320, 54);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.strokeRect(this.width / 2 - 160, 16, 320, 54);

    // P1 Score (Left)
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 22px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`P1: ${this.scoreP1}`, this.width / 2 - 140, 50);

    // P2 Score (Right)
    ctx.fillStyle = '#f43f5e';
    ctx.textAlign = 'right';
    ctx.fillText(`${this.mode === 'vs_ai' ? 'BOT' : 'P2'}: ${this.scoreP2}`, this.width / 2 + 140, 50);

    // Center VS / Target
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`FIRST TO 5`, this.width / 2, 36);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`ARENA: ${arena.name.toUpperCase()}`, this.width / 2, 54);

    // Active Modifier Tag
    if (this.activeModifier !== 'Normal') {
      ctx.fillStyle = '#ec4899';
      ctx.font = 'bold 12px Outfit, sans-serif';
      ctx.fillText(`⚠️ MODIFIER: ${this.activeModifier}`, this.width / 2, 92);
    }

    // Round Win Banner
    if (this.roundOver) {
      ctx.fillStyle = 'rgba(5, 8, 15, 0.82)';
      ctx.fillRect(this.width / 2 - 200, this.height / 2 - 40, 400, 80);
      ctx.strokeStyle = this.roundWinner === 1 ? '#00e5ff' : '#f43f5e';
      ctx.lineWidth = 2;
      ctx.strokeRect(this.width / 2 - 200, this.height / 2 - 40, 400, 80);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px Outfit, sans-serif';
      ctx.textAlign = 'center';
      const winnerName = this.roundWinner === 1 ? 'PLAYER 1' : (this.mode === 'vs_ai' ? 'BOT SNIPER' : 'PLAYER 2');
      ctx.fillText(`🏆 ${winnerName} SCORES!`, this.width / 2, this.height / 2);

      ctx.font = '14px Outfit, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`Next round loading...`, this.width / 2, this.height / 2 + 24);
    }
  }
}

