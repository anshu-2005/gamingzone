/* ====================================================
   KNIFE HIT MASTER — GAMINGZONE
   Addictive Target Slicing Arcade Action:
   Spinning Log Physics, Angular Deflection Math,
   Apple Slices, Shattering Log Boss Stages & Mobile Tap
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class KnifeHitMasterGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Knife Hit Master',
      targetScore: 250,
      ...config
    });

    this.target = {
      x: 240,
      y: 190,
      radius: 75,
      angle: 0,
      rotSpeed: 0.035,
      rotAcc: 0,
      type: 'wood',
      embeddedKnives: [], // Array of relative angles
      apples: []          // Array of relative angles & collected flag
    };

    this.stage = 1;
    this.knivesLeft = 7;
    this.flyingKnives = [];
    this.readyKnifeY = 540;
    this.shatteredPieces = [];
    this.particles = [];
    this.applesCount = 0;

    this.createCanvas(480, 640);
    this.initStage(1);
    this.initControls();

    this.showStartCard({
      title: 'KNIFE HIT MASTER',
      icon: '🗡️',
      objective: 'Throw all knives into the spinning target without hitting any existing knives! Slice apples for bonus points.',
      controls: 'Tap screen or press Spacebar to throw a knife.',
      onStart: () => this.start()
    });
  }

  initStage(stageNum) {
    this.stage = stageNum;
    const isBoss = (stageNum % 4 === 0);

    this.target.radius = isBoss ? 85 : 75;
    this.target.type = isBoss ? 'boss' : (stageNum % 3 === 0 ? 'iron' : 'wood');
    this.target.angle = 0;
    this.target.rotSpeed = (stageNum % 2 === 0 ? -1 : 1) * (0.03 + Math.min(0.04, stageNum * 0.005));
    this.target.embeddedKnives = [];
    this.target.apples = [];

    // Pre-populate some obstacles/knives on higher stages
    const preKnives = Math.min(4, Math.floor((stageNum - 1) / 2));
    for (let i = 0; i < preKnives; i++) {
      this.target.embeddedKnives.push((i / preKnives) * Math.PI * 2);
    }

    // Apples on target
    const appleCount = 1 + (Math.random() > 0.5 ? 1 : 0);
    for (let i = 0; i < appleCount; i++) {
      this.target.apples.push({
        angle: Math.random() * Math.PI * 2,
        collected: false
      });
    }

    this.knivesLeft = 6 + Math.min(6, stageNum);
    this.flyingKnives = [];
    this.shatteredPieces = [];
  }

  initControls() {
    const throwKnife = () => {
      if (this.state !== GameState.PLAYING) return;
      if (this.knivesLeft <= 0 || this.flyingKnives.length > 0) return;

      this.knivesLeft--;
      this.flyingKnives.push({
        x: 240,
        y: this.readyKnifeY,
        vy: -24
      });
      sounds.playLaser();
    };

    this.addListener(this.canvas, 'pointerdown', (e) => {
      e.preventDefault();
      throwKnife();
    });

    this.addListener(window, 'keydown', (e) => {
      if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        throwKnife();
      }
    });
  }

  update(dt) {
    if (this.state !== GameState.PLAYING) return;

    // Target rotation dynamics (occasional speed twitch)
    this.target.angle += this.target.rotSpeed;
    if (Math.random() < 0.015) {
      this.target.rotSpeed = -this.target.rotSpeed * (0.8 + Math.random() * 0.5);
    }

    // Update flying knives
    for (let i = this.flyingKnives.length - 1; i >= 0; i--) {
      const knife = this.flyingKnives[i];
      knife.y += knife.vy;

      // Check impact with target surface
      const impactDist = knife.y - this.target.y;
      if (impactDist <= this.target.radius) {
        // Knife reached the log!
        this.flyingKnives.splice(i, 1);

        // Calculate relative angle on target (target bottom is Math.PI / 2)
        const hitAngle = Math.PI / 2;
        const relAngle = ((hitAngle - this.target.angle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);

        // Check collision against already embedded knives
        let deflected = false;
        const minAngleSeparation = 0.22; // ~12 degrees

        for (const existing of this.target.embeddedKnives) {
          const diff = Math.abs(this.normalizeAngle(relAngle - existing));
          if (diff < minAngleSeparation) {
            deflected = true;
            break;
          }
        }

        if (deflected) {
          // Deflection! Game Over
          this.onDeflection(knife.x, knife.y);
          return;
        }

        // Successfully embedded!
        this.target.embeddedKnives.push(relAngle);
        this.score += 2;
        sounds.playHit();

        // Check apple slice
        for (const apple of this.target.apples) {
          if (!apple.collected) {
            const diff = Math.abs(this.normalizeAngle(relAngle - apple.angle));
            if (diff < 0.28) {
              apple.collected = true;
              this.applesCount++;
              this.score += 10;
              sounds.playWin();

              // Apple juice particles
              for (let k = 0; k < 12; k++) {
                this.particles.push({
                  x: this.target.x + Math.cos(apple.angle + this.target.angle) * this.target.radius,
                  y: this.target.y + Math.sin(apple.angle + this.target.angle) * this.target.radius,
                  vx: (Math.random() - 0.5) * 140,
                  vy: (Math.random() - 0.5) * 140,
                  color: '#ef4444',
                  radius: 3,
                  alpha: 1,
                  life: 0.5
                });
              }
            }
          }
        }

        // Check Stage Clear
        if (this.knivesLeft === 0) {
          this.onStageClear();
        }
      }
    }

    // Update shattered pieces
    for (let i = this.shatteredPieces.length - 1; i >= 0; i--) {
      const sp = this.shatteredPieces[i];
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.vy += 400 * dt;
      sp.rot += sp.vRot;
      if (sp.y > 700) this.shatteredPieces.splice(i, 1);
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.alpha -= dt / pt.life;
      if (pt.alpha <= 0) this.particles.splice(i, 1);
    }
  }

  normalizeAngle(rad) {
    while (rad > Math.PI) rad -= Math.PI * 2;
    while (rad < -Math.PI) rad += Math.PI * 2;
    return rad;
  }

  onDeflection(x, y) {
    this.state = GameState.GAME_OVER;
    sounds.playHit();

    // Deflection sparks
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 200,
        vy: 50 + Math.random() * 150,
        color: '#facc15',
        radius: 3,
        alpha: 1,
        life: 0.6
      });
    }

    this.setTimeout(() => this.gameOver(this.score), 800);
  }

  onStageClear() {
    sounds.playWin();
    this.score += 20;

    // Shatter Target into 8 chunks
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      this.shatteredPieces.push({
        x: this.target.x + Math.cos(ang) * 30,
        y: this.target.y + Math.sin(ang) * 30,
        vx: Math.cos(ang) * 180,
        vy: Math.sin(ang) * 180 - 50,
        rot: 0,
        vRot: (Math.random() - 0.5) * 0.2,
        color: this.target.type === 'boss' ? '#e11d48' : '#78350f'
      });
    }

    this.setTimeout(() => {
      this.initStage(this.stage + 1);
    }, 700);
  }

  render() {
    this.ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Deep arcade slate
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.baseHeight);
    grad.addColorStop(0, '#090d16');
    grad.addColorStop(1, '#030712');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Render Target Log
    if (this.knivesLeft > 0 || this.shatteredPieces.length === 0) {
      this.ctx.save();
      this.ctx.translate(this.target.x, this.target.y);
      this.ctx.rotate(this.target.angle);

      // Log base
      this.ctx.fillStyle = this.target.type === 'boss' ? '#e11d48' : (this.target.type === 'iron' ? '#475569' : '#854d0e');
      this.ctx.beginPath();
      this.ctx.arc(0, 0, this.target.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Inner ring wood grain
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      this.ctx.lineWidth = 4;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, this.target.radius * 0.65, 0, Math.PI * 2);
      this.ctx.arc(0, 0, this.target.radius * 0.35, 0, Math.PI * 2);
      this.ctx.stroke();

      // Boss skull / emblem
      if (this.target.type === 'boss') {
        this.ctx.font = '28px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('💀', 0, 0);
      }

      // Render Embedded Knives
      for (const ang of this.target.embeddedKnives) {
        this.ctx.save();
        this.ctx.rotate(ang);

        // Blade stuck inside, handle protruding outside
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.fillRect(-3, this.target.radius - 12, 6, 20); // Blade
        this.ctx.fillStyle = '#f59e0b';
        this.ctx.fillRect(-4, this.target.radius + 8, 8, 22);  // Wooden handle
        this.ctx.restore();
      }

      // Render Apples
      for (const apple of this.target.apples) {
        if (apple.collected) continue;
        this.ctx.save();
        this.ctx.rotate(apple.angle);
        this.ctx.font = '22px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🍎', 0, this.target.radius + 14);
        this.ctx.restore();
      }

      this.ctx.restore();
    }

    // Render Shattered Pieces
    for (const sp of this.shatteredPieces) {
      this.ctx.save();
      this.ctx.translate(sp.x, sp.y);
      this.ctx.rotate(sp.rot);
      this.ctx.fillStyle = sp.color;
      this.ctx.fillRect(-15, -15, 30, 30);
      this.ctx.restore();
    }

    // Render Flying Knives
    for (const knife of this.flyingKnives) {
      this.ctx.fillStyle = '#cbd5e1';
      this.ctx.fillRect(knife.x - 3, knife.y, 6, 24);
      this.ctx.fillStyle = '#f59e0b';
      this.ctx.fillRect(knife.x - 4, knife.y + 24, 8, 18);
    }

    // Render Ready Knife at Bottom
    if (this.knivesLeft > 0 && this.state === GameState.PLAYING) {
      this.ctx.fillStyle = '#cbd5e1';
      this.ctx.fillRect(237, this.readyKnifeY, 6, 24);
      this.ctx.fillStyle = '#f59e0b';
      this.ctx.fillRect(236, this.readyKnifeY + 24, 8, 18);
    }

    // Render Particles
    for (const pt of this.particles) {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, pt.alpha);
      this.ctx.fillStyle = pt.color;
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // HUD
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    this.ctx.fillRect(16, 16, this.baseWidth - 32, 44);

    this.ctx.font = 'bold 18px "Outfit", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`STAGE ${this.stage}`, 30, 44);

    this.ctx.fillStyle = '#ffd166';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`SCORE: ${this.score}`, this.baseWidth / 2, 44);

    // Remaining Knives Icons on Left
    for (let k = 0; k < this.knivesLeft; k++) {
      this.ctx.fillStyle = '#f59e0b';
      this.ctx.fillRect(24, 520 - k * 16, 6, 12);
    }
  }
}
