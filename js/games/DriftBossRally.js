/* ====================================================
   DRIFT BOSS RALLY — GAMINGZONE
   Endless 3D Zigzag Highway with One-Tap Drift Mechanics,
   Tyre Skid Smoke, Hairpin Corner Coins & Fall Physics
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class DriftBossRallyGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Drift Boss Rally',
      targetScore: 2000,
      ...config
    });

    this.car = {
      x: 0,
      y: 0,
      width: 24,
      length: 42,
      dir: 'UP', // 'UP' (along Y) or 'RIGHT' (along X)
      speed: 320,
      isFallen: false,
      fallScale: 1
    };

    this.trackSegments = [];
    this.coins = [];
    this.skidMarks = [];
    this.particles = [];
    this.cameraY = 0;
    this.cameraX = 0;
    this.isDriftingRight = false;

    this.createCanvas(560, 640);
    this.initTrack();
    this.initDriftControls();

    this.attachTouchControls({
      showDpad: false,
      actionLabel: 'DRIFT (HOLD)',
      onAction: (pressed) => {
        this.isDriftingRight = pressed;
        if (pressed) sounds.playLaser();
      }
    });

    this.showStartCard({
      title: 'DRIFT BOSS RALLY',
      icon: '🏎️',
      objective: 'Hold to drift RIGHT, release to steer FORWARD! Time your turns on the narrow floating cyber highway.',
      controls: 'Tap & HOLD screen or Space / Mouse to turn RIGHT; release to steer FORWARD.',
      onStart: () => this.start()
    });
  }

  initTrack() {
    this.trackSegments = [];
    this.coins = [];
    this.skidMarks = [];

    // Starting platform
    let curX = 280;
    let curY = 500;
    const trackW = 75;

    this.car.x = curX;
    this.car.y = curY;
    this.car.dir = 'UP';
    this.car.isFallen = false;
    this.car.fallScale = 1;
    this.isDriftingRight = false;

    // Initial straight stretch
    this.trackSegments.push({ x: curX - trackW / 2, y: curY - 200, w: trackW, h: 400 });
    curY -= 200;

    // Generate 60 zigzag segments
    let goingRight = true;
    for (let i = 0; i < 60; i++) {
      const len = 140 + Math.random() * 90;
      if (goingRight) {
        this.trackSegments.push({ x: curX - trackW / 2, y: curY - trackW / 2, w: len + trackW, h: trackW });
        this.coins.push({ x: curX + len * 0.6, y: curY, collected: false });
        curX += len;
      } else {
        this.trackSegments.push({ x: curX - trackW / 2, y: curY - len - trackW / 2, w: trackW, h: len + trackW });
        this.coins.push({ x: curX, y: curY - len * 0.6, collected: false });
        curY -= len;
      }
      goingRight = !goingRight;
    }
  }

  initDriftControls() {
    const startDrift = () => {
      if (this.state !== GameState.PLAYING || this.car.isFallen) return;
      this.isDriftingRight = true;
      sounds.playLaser();
    };

    const stopDrift = () => {
      this.isDriftingRight = false;
    };

    this.addListener(this.canvas, 'pointerdown', startDrift);
    this.addListener(window, 'pointerup', stopDrift);

    this.addListener(window, 'keydown', (e) => {
      if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowRight' || e.key === 'd') {
        startDrift();
        e.preventDefault();
      }
    });

    this.addListener(window, 'keyup', (e) => {
      if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowRight' || e.key === 'd') {
        stopDrift();
      }
    });
  }

  update(dt) {
    if (this.car.isFallen) {
      this.car.fallScale = Math.max(0, this.car.fallScale - dt * 2.2);
      if (this.car.fallScale <= 0) {
        this.finishGame(this.score, { isVictory: this.score >= this.config.targetScore });
      }
      return;
    }

    // Car Direction: Hold turns RIGHT (along +X), Release goes UP (along -Y)
    const speed = this.car.speed;
    if (this.isDriftingRight) {
      this.car.x += speed * dt;
      this.car.dir = 'RIGHT';
      // Skid Smoke
      if (Math.random() < 0.4) {
        this.particles.push({
          x: this.car.x - 14,
          y: this.car.y,
          vx: -40,
          vy: (Math.random() - 0.5) * 20,
          color: '#00e5ff',
          life: 0.25
        });
      }
    } else {
      this.car.y -= speed * dt;
      this.car.dir = 'UP';
    }

    this.score += Math.round(15 * dt);

    // Camera smoothly follows car
    this.cameraX += (this.car.x - this.baseWidth / 2 - this.cameraX) * 0.1;
    this.cameraY += (this.car.y - this.baseHeight * 0.65 - this.cameraY) * 0.1;

    // Check Coin Pickups
    this.coins.forEach(c => {
      if (!c.collected && Math.hypot(this.car.x - c.x, this.car.y - c.y) < 28) {
        c.collected = true;
        this.score += 100;
        sounds.playCoin();
        this.spawnBurst(c.x, c.y, '#ffd166', 10);
      }
    });

    // Check Fall off Road
    const onRoad = this.trackSegments.some(seg =>
      this.car.x >= seg.x && this.car.x <= seg.x + seg.w &&
      this.car.y >= seg.y && this.car.y <= seg.y + seg.h
    );

    if (!onRoad) {
      this.car.isFallen = true;
      sounds.playHit();
      this.spawnBurst(this.car.x, this.car.y, '#ef4444', 18);
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  spawnBurst(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 180,
        vy: (Math.random() - 0.5) * 180,
        color,
        life: 0.35
      });
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Deep Neon Cyber Void Background
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    ctx.save();
    ctx.translate(-this.cameraX, -this.cameraY);

    // Draw Track Segments (Floating Neon Highway)
    this.trackSegments.forEach(seg => {
      // 3D Extrusion Side Wall (Depth shadow)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(seg.x, seg.y + seg.h, seg.w, 16);

      // Main Road Surface
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(seg.x, seg.y, seg.w, seg.h);

      // Cyan Border Glow
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(seg.x, seg.y, seg.w, seg.h);
    });

    // Draw Coins
    this.coins.forEach(c => {
      if (!c.collected) {
        ctx.fillStyle = '#ffd166';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#78350f';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', c.x, c.y);
      }
    });

    // Draw Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Drift Car
    ctx.save();
    ctx.translate(this.car.x, this.car.y);
    ctx.scale(this.car.fallScale, this.car.fallScale);

    if (this.car.dir === 'RIGHT') {
      ctx.rotate(Math.PI / 2);
    }

    // Car Body (Vibrant Red Sports Coupe)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(-this.car.width / 2, -this.car.length / 2, this.car.width, this.car.length, 6);
    ctx.fill();

    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Windshield
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(-this.car.width / 2 + 4, -8, this.car.width - 8, 10);

    // Rear Spoiler
    ctx.fillStyle = '#111827';
    ctx.fillRect(-this.car.width / 2, this.car.length / 2 - 4, this.car.width, 4);

    ctx.restore();

    ctx.restore();

    // Top HUD
    ctx.font = '900 20px "Lilita One", sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'left';
    ctx.fillText('🏎️ DRIFT BOSS', 24, 34);

    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.fillText(`SCORE: ${this.score}`, this.baseWidth / 2, 34);

    ctx.textAlign = 'right';
    ctx.fillStyle = this.isDriftingRight ? '#ff007f' : '#10b981';
    ctx.fillText(this.isDriftingRight ? 'DRIFTING ▶' : 'FORWARD ▲', this.baseWidth - 24, 34);
  }
}
