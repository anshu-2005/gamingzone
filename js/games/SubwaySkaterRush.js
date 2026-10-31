/* ====================================================
   SUBWAY SURFERS 3D RUNNER (SubwaySkaterRush)
   High-speed 3-lane endless railway dash with trains,
   hurdles, coin magnets, hoverboards, jumps & slides!
   ==================================================== */

import { sounds } from '../core/soundFX.js';

export class SubwaySkaterRushGame {
  constructor(container, onGameOver, levelConfig = null) {
    this.container = container;
    this.onGameOver = onGameOver;
    this.levelConfig = levelConfig || {
      level: 1,
      title: 'Grand Central Metro',
      targetScore: 1000,
      starThresholds: [500, 1000, 2000]
    };

    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);

    this.width = this.canvas.width = 760;
    this.height = this.canvas.height = 540;
    this.canvas.style.width = '100%';
    this.canvas.style.maxWidth = '760px';
    this.canvas.style.height = 'auto';
    this.canvas.style.borderRadius = '16px';
    this.canvas.style.boxShadow = '0 12px 32px rgba(0,0,0,0.5)';
    this.canvas.style.display = 'block';
    this.canvas.style.margin = '0 auto';

    this.running = false;
    this.score = 0;
    this.coins = 0;
    this.multiplier = 1;
    this.distance = 0;

    // Lanes: -1 (Left), 0 (Center), 1 (Right)
    this.currentLane = 0;
    this.targetLane = 0;
    this.playerX = 0;

    // Player State
    this.player = {
      y: 0,
      jumpV: 0,
      isJumping: false,
      isSliding: false,
      slideTimer: 0,
      hasHoverboard: false,
      hoverboardTimer: 0,
      hasMagnet: false,
      magnetTimer: 0
    };

    this.obstacles = [];
    this.coinItems = [];
    this.powerups = [];
    this.particles = [];
    this.speed = 7;
    this.baseSpeed = 7;

    // 3D Perspective Parameters
    this.vanishingY = 160;
    this.horizonX = this.width / 2;

    this.initControls();
    this.reset();
    this.start();
  }

  initControls() {
    this.onKey = (e) => {
      if (!this.running) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.switchLane(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.switchLane(1);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.code === 'Space') {
        this.jump();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        this.slide();
      } else if (e.key === 'h' || e.key === 'H') {
        this.activateHoverboard();
      }
    };

    // Touch / Swipe
    let touchStartX = 0;
    let touchStartY = 0;

    this.onTouchStart = (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    this.onTouchEnd = (e) => {
      const diffX = e.changedTouches[0].clientX - touchStartX;
      const diffY = e.changedTouches[0].clientY - touchStartY;

      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 30) this.switchLane(1);
        if (diffX < -30) this.switchLane(-1);
      } else {
        if (diffY < -30) this.jump();
        if (diffY > 30) this.slide();
      }
    };

    window.addEventListener('keydown', this.onKey);
    this.canvas.addEventListener('touchstart', this.onTouchStart, { passive: true });
    this.canvas.addEventListener('touchend', this.onTouchEnd);
  }

  switchLane(dir) {
    const next = Math.max(-1, Math.min(1, this.targetLane + dir));
    if (next !== this.targetLane) {
      this.targetLane = next;
      sounds.playClick();
    }
  }

  jump() {
    if (!this.player.isJumping) {
      this.player.isJumping = true;
      this.player.jumpV = -13;
      this.player.isSliding = false;
      sounds.playPowerup();
    }
  }

  slide() {
    this.player.isSliding = true;
    this.player.slideTimer = 35;
    if (this.player.isJumping) {
      this.player.jumpV = 12; // Fast fall
    }
    sounds.playClick();
  }

  activateHoverboard() {
    this.player.hasHoverboard = true;
    this.player.hoverboardTimer = 300;
    sounds.playLevelUp();
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  reset() {
    this.score = 0;
    this.coins = 0;
    this.distance = 0;
    this.speed = this.baseSpeed;
    this.targetLane = 0;
    this.currentLane = 0;
    this.playerX = 0;
    this.player.y = 0;
    this.player.isJumping = false;
    this.player.isSliding = false;
    this.player.hasHoverboard = false;
    this.player.hasMagnet = false;
    this.obstacles = [];
    this.coinItems = [];
    this.particles = [];
  }

  spawnEntities() {
    if (Math.random() < 0.04) {
      const lane = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
      const rand = Math.random();
      let type = 'barrier_jump'; // low hurdle to jump
      if (rand < 0.4) type = 'train'; // oncoming subway train
      else if (rand < 0.7) type = 'barrier_slide'; // high hurdle to duck under

      this.obstacles.push({
        lane,
        z: 1000,
        type,
        width: type === 'train' ? 110 : 80,
        height: type === 'train' ? 90 : 35
      });

      // Spawn coins in neighboring lanes
      const coinLane = lane === 0 ? (Math.random() > 0.5 ? 1 : -1) : 0;
      for (let i = 0; i < 4; i++) {
        this.coinItems.push({
          lane: coinLane,
          z: 1000 + i * 80,
          collected: false
        });
      }

      // Random Powerup (Magnet / Hoverboard)
      if (Math.random() < 0.15) {
        this.coinItems.push({
          lane: (lane + 1 > 1 ? -1 : lane + 1),
          z: 1300,
          isPowerup: true,
          powerType: Math.random() > 0.5 ? 'magnet' : 'board'
        });
      }
    }
  }

  loop(now) {
    if (!this.running) return;
    this.update();
    this.render();
    requestAnimationFrame(this.loop);
  }

  update() {
    this.distance += this.speed * 0.5;
    this.score = Math.floor(this.distance * this.multiplier) + this.coins * 10;
    this.speed = Math.min(15, this.baseSpeed + (this.distance / 1200));

    // Lane interpolation
    const targetX = this.targetLane * 150;
    this.playerX += (targetX - this.playerX) * 0.2;

    // Jump physics
    if (this.player.isJumping) {
      this.player.y += this.player.jumpV;
      this.player.jumpV += 0.8;
      if (this.player.y >= 0) {
        this.player.y = 0;
        this.player.isJumping = false;
        this.player.jumpV = 0;
      }
    }

    // Slide timer
    if (this.player.isSliding) {
      this.player.slideTimer--;
      if (this.player.slideTimer <= 0) {
        this.player.isSliding = false;
      }
    }

    // Hoverboard timer
    if (this.player.hasHoverboard) {
      this.player.hoverboardTimer--;
      if (this.player.hoverboardTimer <= 0) {
        this.player.hasHoverboard = false;
      }
    }

    // Magnet timer
    if (this.player.hasMagnet) {
      this.player.magnetTimer--;
      if (this.player.magnetTimer <= 0) {
        this.player.hasMagnet = false;
      }
    }

    this.spawnEntities();

    // Update Obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.z -= this.speed * 1.5;

      // Check Collision with player (player is around z = 120)
      if (obs.z > 80 && obs.z < 180) {
        if (Math.abs(this.targetLane - obs.lane) < 0.6) {
          let hit = false;
          if (obs.type === 'train') {
            hit = true;
          } else if (obs.type === 'barrier_jump') {
            if (!this.player.isJumping || this.player.y > -25) hit = true;
          } else if (obs.type === 'barrier_slide') {
            if (!this.player.isSliding) hit = true;
          }

          if (hit) {
            if (this.player.hasHoverboard) {
              // Hoverboard shield absorbs hit!
              this.player.hasHoverboard = false;
              sounds.playHit();
              this.obstacles.splice(i, 1);
              continue;
            } else {
              this.handleGameOver();
              return;
            }
          }
        }
      }

      if (obs.z < 0) {
        this.obstacles.splice(i, 1);
      }
    }

    // Update Coins
    for (let i = this.coinItems.length - 1; i >= 0; i--) {
      const coin = this.coinItems[i];
      coin.z -= this.speed * 1.5;

      // Magnet pull
      if (this.player.hasMagnet && coin.z > 50 && coin.z < 500) {
        const targetCoinX = this.targetLane;
        coin.lane += (targetCoinX - coin.lane) * 0.15;
      }

      // Collect check
      if (!coin.collected && coin.z > 60 && coin.z < 180) {
        if (Math.abs(this.targetLane - coin.lane) < 0.6) {
          coin.collected = true;
          if (coin.isPowerup) {
            sounds.playLevelUp();
            if (coin.powerType === 'magnet') {
              this.player.hasMagnet = true;
              this.player.magnetTimer = 350;
            } else {
              this.activateHoverboard();
            }
          } else {
            this.coins++;
            sounds.playPowerup();
          }
          this.coinItems.splice(i, 1);
          continue;
        }
      }

      if (coin.z < 0) {
        this.coinItems.splice(i, 1);
      }
    }
  }

  handleGameOver() {
    this.running = false;
    sounds.playExplosion();
    if (this.onGameOver) {
      this.onGameOver(this.score, { isGameOver: true, coins: this.coins });
    }
  }

  render() {
    // 1. Sky & Metro Skyline Backdrop
    const gradSky = this.ctx.createLinearGradient(0, 0, 0, this.vanishingY);
    gradSky.addColorStop(0, '#0d1b2a');
    gradSky.addColorStop(1, '#1b263b');
    this.ctx.fillStyle = gradSky;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // City Silhouette
    this.ctx.fillStyle = '#0a1118';
    this.ctx.beginPath();
    this.ctx.rect(50, 80, 80, 80);
    this.ctx.rect(160, 60, 110, 100);
    this.ctx.rect(300, 90, 70, 70);
    this.ctx.rect(400, 50, 120, 110);
    this.ctx.rect(550, 70, 90, 90);
    this.ctx.fill();

    // 2. Ground & Track Surface
    const gradGround = this.ctx.createLinearGradient(0, this.vanishingY, 0, this.height);
    gradGround.addColorStop(0, '#2d3748');
    gradGround.addColorStop(1, '#1a202c');
    this.ctx.fillStyle = gradGround;
    this.ctx.fillRect(0, this.vanishingY, this.width, this.height - this.vanishingY);

    // 3. Draw Perspective 3-Lane Railway Tracks
    const lanesOffset = [-150, 0, 150];
    lanesOffset.forEach(off => {
      this.ctx.strokeStyle = '#4a5568';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(this.horizonX + off * 0.1, this.vanishingY);
      this.ctx.lineTo(this.horizonX + off * 2.2, this.height);
      this.ctx.stroke();
    });

    // Railway Ties (moving effect)
    const tieOffset = (this.distance % 40);
    for (let d = 0; d < 400; d += 35) {
      const z = d + tieOffset;
      const t = z / 400;
      const y = this.vanishingY + t * (this.height - this.vanishingY);
      const span = 40 + t * 440;
      this.ctx.strokeStyle = '#334155';
      this.ctx.lineWidth = 2 + t * 4;
      this.ctx.beginPath();
      this.ctx.moveTo(this.horizonX - span / 2, y);
      this.ctx.lineTo(this.horizonX + span / 2, y);
      this.ctx.stroke();
    }

    // 4. Render 3D Obstacles & Trains (sorted by z depth)
    const allRenderables = [
      ...this.obstacles.map(o => ({ ...o, isObs: true })),
      ...this.coinItems.map(c => ({ ...c, isCoin: true }))
    ].sort((a, b) => b.z - a.z);

    allRenderables.forEach(item => {
      const t = (1000 - item.z) / 1000;
      if (t < 0 || t > 1.1) return;

      const scale = 0.2 + t * 0.9;
      const y = this.vanishingY + t * (this.height - this.vanishingY);
      const laneSpread = 150 * 2.2 * t;
      const x = this.horizonX + (item.lane * (laneSpread / 2));

      if (item.isObs) {
        this.renderObstacle(item, x, y, scale);
      } else if (item.isCoin) {
        this.renderCoin(item, x, y, scale);
      }
    });

    // 5. Render Player Character
    this.renderPlayer();

    // 6. HUD & Score Overlay
    this.renderHUD();
  }

  renderObstacle(obs, x, y, scale) {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.scale(scale, scale);

    if (obs.type === 'train') {
      // 3D Subway Train Car
      this.ctx.fillStyle = '#dc2626';
      this.ctx.fillRect(-45, -90, 90, 90);
      // Windshield
      this.ctx.fillStyle = '#60a5fa';
      this.ctx.fillRect(-35, -80, 70, 30);
      // Train Headlights
      this.ctx.fillStyle = '#fef08a';
      this.ctx.beginPath();
      this.ctx.arc(-25, -30, 8, 0, Math.PI * 2);
      this.ctx.arc(25, -30, 8, 0, Math.PI * 2);
      this.ctx.fill();
    } else if (obs.type === 'barrier_jump') {
      // Wooden Low Hurdle
      this.ctx.fillStyle = '#f59e0b';
      this.ctx.fillRect(-35, -30, 70, 20);
      this.ctx.fillStyle = '#000000';
      // Caution stripes
      this.ctx.fillRect(-20, -30, 10, 20);
      this.ctx.fillRect(10, -30, 10, 20);
    } else if (obs.type === 'barrier_slide') {
      // High Overhead Clearance Barrier
      this.ctx.fillStyle = '#0284c7';
      this.ctx.fillRect(-40, -65, 80, 25);
      // Poles
      this.ctx.fillStyle = '#94a3b8';
      this.ctx.fillRect(-38, -40, 6, 40);
      this.ctx.fillRect(32, -40, 6, 40);
    }
    this.ctx.restore();
  }

  renderCoin(coin, x, y, scale) {
    this.ctx.save();
    this.ctx.translate(x, y - 20);
    this.ctx.scale(scale, scale);

    if (coin.isPowerup) {
      if (coin.powerType === 'magnet') {
        this.ctx.fillStyle = '#ef4444';
        this.ctx.font = '24px sans-serif';
        this.ctx.fillText('🧲', -12, 10);
      } else {
        this.ctx.fillStyle = '#00f2fe';
        this.ctx.font = '24px sans-serif';
        this.ctx.fillText('🛹', -12, 10);
      }
    } else {
      // Spinning Gold Coin
      this.ctx.fillStyle = '#ffd166';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 12, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.strokeStyle = '#d97706';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 12px Outfit';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('🪙', 0, 0);
    }
    this.ctx.restore();
  }

  renderPlayer() {
    const px = this.horizonX + this.playerX * 1.1;
    const py = 450 + this.player.y;

    this.ctx.save();
    this.ctx.translate(px, py);

    // Hoverboard Glow
    if (this.player.hasHoverboard) {
      this.ctx.fillStyle = 'rgba(0, 242, 254, 0.4)';
      this.ctx.beginPath();
      this.ctx.ellipse(0, 12, 35, 12, 0, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 10 - this.player.y * 0.4, 26, 8, 0, 0, Math.PI * 2);
    this.ctx.fill();

    if (this.player.isSliding) {
      // Sliding Kid
      this.ctx.fillStyle = '#f97316';
      this.ctx.fillRect(-22, -15, 44, 20);
      this.ctx.fillStyle = '#fbbf24';
      this.ctx.beginPath();
      this.ctx.arc(16, -10, 10, 0, Math.PI * 2);
      this.ctx.fill();
    } else {
      // Runner Body
      this.ctx.fillStyle = '#3b82f6';
      this.ctx.fillRect(-14, -40, 28, 32); // Torso/Hoodie
      // Head / Cap
      this.ctx.fillStyle = '#f87171';
      this.ctx.beginPath();
      this.ctx.arc(0, -48, 12, 0, Math.PI * 2);
      this.ctx.fill();
      // Cap Brim
      this.ctx.fillStyle = '#dc2626';
      this.ctx.fillRect(-4, -54, 18, 6);
      // Legs
      this.ctx.fillStyle = '#1e293b';
      const legOffset = Math.sin(this.distance * 0.3) * 8;
      this.ctx.fillRect(-12, -8, 8, 16 + legOffset);
      this.ctx.fillRect(4, -8, 8, 16 - legOffset);
    }

    this.ctx.restore();
  }

  renderHUD() {
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    this.ctx.roundRect ? this.ctx.roundRect(16, 16, 260, 60, 12) : this.ctx.fillRect(16, 16, 260, 60);
    this.ctx.fill();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 18px Outfit';
    this.ctx.fillText(`SCORE: ${this.score}`, 30, 42);

    this.ctx.fillStyle = '#ffd166';
    this.ctx.fillText(`🪙 COINS: ${this.coins}`, 30, 65);

    if (this.player.hasHoverboard) {
      this.ctx.fillStyle = '#00f2fe';
      this.ctx.fillText(`🛹 HOVERBOARD ACTIVE`, 300, 42);
    }
    if (this.player.hasMagnet) {
      this.ctx.fillStyle = '#ef4444';
      this.ctx.fillText(`🧲 MAGNET ON`, 300, 65);
    }
  }

  destroy() {
    this.running = false;
    window.removeEventListener('keydown', this.onKey);
    this.canvas.removeEventListener('touchstart', this.onTouchStart);
    this.canvas.removeEventListener('touchend', this.onTouchEnd);
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}
