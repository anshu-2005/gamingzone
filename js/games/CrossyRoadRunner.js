/* ====================================================
   CROSSY ROAD RUNNER — GAMINGZONE
   Authentic Voxel-Style Grid Hopper:
   Roads with Speeding Traffic, Train Tracks with Warning
   Signals, Rivers with Floating Logs & Drowning Physics!
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class CrossyRoadRunnerGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Crossy Road Runner',
      targetScore: 200,
      ...config
    });

    this.gridSize = 44;
    this.cols = 11;
    this.player = {
      gridX: 5,
      gridY: 0,
      animX: 5 * 44 + 22,
      animY: 540 - 22,
      targetX: 5 * 44 + 22,
      targetY: 540 - 22,
      isHopping: false,
      hopProgress: 0,
      facing: 'UP'
    };

    this.lanes = [];
    this.coins = [];
    this.particles = [];
    this.cameraY = 0;
    this.targetCameraY = 0;
    this.coinsCollected = 0;
    this.maxRowReached = 0;
    this.idleTimer = 0;

    this.createCanvas(484, 660);
    this.initWorld();
    this.initControls();

    this.attachTouchControls({
      showDpad: true,
      onDirection: (dir, pressed) => {
        if (!pressed) return;
        if (dir === 'UP') this.hop(0, 1);
        if (dir === 'DOWN') this.hop(0, -1);
        if (dir === 'LEFT') this.hop(-1, 0);
        if (dir === 'RIGHT') this.hop(1, 0);
      }
    });

    this.showStartCard({
      title: 'CROSSY ROAD RUNNER',
      icon: '🐔',
      objective: 'Hop forward across deadly highways, railroad tracks, and rapid rivers on floating logs! Don\'t get squished or drown!',
      controls: 'W/Up Arrow = Hop Forward, A/D = Hop Left/Right, S = Hop Back.',
      onStart: () => this.start()
    });
  }

  initWorld() {
    this.lanes = [];
    this.coins = [];
    this.particles = [];
    this.score = 0;
    this.coinsCollected = 0;
    this.maxRowReached = 0;
    this.idleTimer = 0;

    this.player.gridX = 5;
    this.player.gridY = 0;
    this.player.animX = 5 * this.gridSize + 22;
    this.player.animY = 560;
    this.player.targetX = this.player.animX;
    this.player.targetY = this.player.animY;
    this.player.isHopping = false;

    // Generate first 60 rows
    for (let r = -2; r <= 60; r++) {
      this.generateLane(r);
    }
  }

  generateLane(row) {
    if (row <= 1) {
      this.lanes.push({ row, type: 'grass', items: [] });
      return;
    }

    // Determine lane type
    const rand = Math.random();
    let type = 'grass';
    if (rand < 0.45) type = 'road';
    else if (rand < 0.75) type = 'river';
    else if (rand < 0.88) type = 'rail';
    else type = 'grass';

    const dir = Math.random() > 0.5 ? 1 : -1;
    const speed = (dir > 0 ? 1 : -1) * (1.2 + Math.random() * 2.2);
    const items = [];

    if (type === 'road') {
      const count = 1 + Math.floor(Math.random() * 2);
      for (let c = 0; c < count; c++) {
        items.push({
          x: c * 240 + Math.random() * 100,
          speed,
          width: 52,
          height: 30,
          color: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#ec4899'][Math.floor(Math.random() * 5)]
        });
      }
    } else if (type === 'river') {
      const count = 2;
      for (let c = 0; c < count; c++) {
        items.push({
          x: c * 260 + Math.random() * 80,
          speed: speed * 0.75,
          width: 72 + Math.random() * 30,
          height: 28,
          isLog: true
        });
      }
    } else if (type === 'rail') {
      items.push({
        state: 'clear', // 'clear', 'warning', 'train'
        timer: 1.5 + Math.random() * 4,
        trainX: -800,
        trainSpeed: 950
      });
    }

    // Spawn occasional coin on grass or logs
    if (Math.random() < 0.25) {
      this.coins.push({
        gridX: Math.floor(Math.random() * this.cols),
        gridY: row,
        collected: false
      });
    }

    this.lanes.push({ row, type, items, speed, dir });
  }

  initControls() {
    this.addListener(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        this.hop(0, 1);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        this.hop(0, -1);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        this.hop(-1, 0);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        this.hop(1, 0);
      }
    });

    // Touch swipe or tap on canvas
    let touchStartX = 0;
    let touchStartY = 0;
    this.addListener(this.canvas, 'touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    this.addListener(this.canvas, 'touchend', (e) => {
      if (this.state !== GameState.PLAYING) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.hypot(dx, dy) < 20) {
        // Tap = Hop forward
        this.hop(0, 1);
      } else if (Math.abs(dx) > Math.abs(dy)) {
        this.hop(dx > 0 ? 1 : -1, 0);
      } else {
        this.hop(0, dy > 0 ? -1 : 1);
      }
    });
  }

  hop(dx, dy) {
    if (this.player.isHopping) return;

    const newX = this.player.gridX + dx;
    const newY = this.player.gridY + dy;

    if (newX < 0 || newX >= this.cols) return;
    if (newY < this.player.gridY - 2) return; // Prevent going too far back

    this.player.gridX = newX;
    this.player.gridY = newY;
    this.player.targetX = newX * this.gridSize + 22;
    this.player.targetY = 560 - newY * this.gridSize;
    this.player.isHopping = true;
    this.player.hopProgress = 0;
    this.idleTimer = 0;

    if (dy > 0) this.player.facing = 'UP';
    else if (dy < 0) this.player.facing = 'DOWN';
    else if (dx > 0) this.player.facing = 'RIGHT';
    else if (dx < 0) this.player.facing = 'LEFT';

    sounds.playJump();

    if (newY > this.maxRowReached) {
      this.maxRowReached = newY;
      this.score = this.maxRowReached + this.coinsCollected * 5;

      // Ensure lanes ahead
      if (this.maxRowReached + 25 > this.lanes.length) {
        for (let r = this.lanes.length; r <= this.maxRowReached + 30; r++) {
          this.generateLane(r);
        }
      }
    }

    // Check coins
    for (const c of this.coins) {
      if (!c.collected && c.gridX === this.player.gridX && c.gridY === this.player.gridY) {
        c.collected = true;
        this.coinsCollected++;
        this.score += 5;
        sounds.playCoin();
      }
    }
  }

  update(dt) {
    if (this.state !== GameState.PLAYING) return;

    this.idleTimer += dt;
    if (this.idleTimer > 8) {
      // Hawk attack if lingering too long
      this.onCrushed('Caught by eagle for idling!');
      return;
    }

    // Hop interpolation
    if (this.player.isHopping) {
      this.player.hopProgress += dt * 6;
      if (this.player.hopProgress >= 1) {
        this.player.hopProgress = 1;
        this.player.isHopping = false;
        this.player.animX = this.player.targetX;
        this.player.animY = this.player.targetY;
      } else {
        const t = this.player.hopProgress;
        this.player.animX += (this.player.targetX - this.player.animX) * 0.35;
        this.player.animY += (this.player.targetY - this.player.animY) * 0.35;
      }
    }

    // Camera follow smoothly
    this.targetCameraY = Math.max(0, (this.player.gridY - 3) * this.gridSize);
    this.cameraY += (this.targetCameraY - this.cameraY) * 0.12;

    // Update Lanes
    const currentLane = this.lanes.find(l => l.row === this.player.gridY);

    for (const lane of this.lanes) {
      if (Math.abs(lane.row - this.player.gridY) > 8) continue;

      if (lane.type === 'road') {
        for (const car of lane.items) {
          car.x += car.speed * 60 * dt;
          if (car.speed > 0 && car.x > this.baseWidth + 80) car.x = -80;
          if (car.speed < 0 && car.x < -80) car.x = this.baseWidth + 80;

          // Check hit
          if (lane.row === this.player.gridY && !this.player.isHopping) {
            const playerScreenX = this.player.animX;
            if (playerScreenX >= car.x - car.width / 2 && playerScreenX <= car.x + car.width / 2) {
              this.onCrushed('Squashed by car!');
              return;
            }
          }
        }
      } else if (lane.type === 'river') {
        let onAnyLog = false;
        for (const log of lane.items) {
          log.x += log.speed * 60 * dt;
          if (log.speed > 0 && log.x > this.baseWidth + 100) log.x = -100;
          if (log.speed < 0 && log.x < -100) log.x = this.baseWidth + 100;

          if (lane.row === this.player.gridY) {
            const pX = this.player.animX;
            if (pX >= log.x - log.width / 2 && pX <= log.x + log.width / 2) {
              onAnyLog = true;
              // Ride log
              if (!this.player.isHopping) {
                this.player.animX += log.speed * 60 * dt;
                this.player.targetX = this.player.animX;
                this.player.gridX = Math.round((this.player.animX - 22) / this.gridSize);

                if (this.player.animX < 10 || this.player.animX > this.baseWidth - 10) {
                  this.onCrushed('Carried off screen!');
                  return;
                }
              }
            }
          }
        }

        // If player on river without log and not mid-hop -> DROWN!
        if (lane.row === this.player.gridY && !this.player.isHopping && !onAnyLog) {
          this.onCrushed('Fell into river!');
          return;
        }
      } else if (lane.type === 'rail') {
        for (const rail of lane.items) {
          rail.timer -= dt;
          if (rail.timer <= 0) {
            if (rail.state === 'clear') {
              rail.state = 'warning';
              rail.timer = 1.6;
              sounds.playLaser();
            } else if (rail.state === 'warning') {
              rail.state = 'train';
              rail.trainX = -800;
              rail.timer = 1.4;
            } else if (rail.state === 'train') {
              rail.state = 'clear';
              rail.timer = 3.5 + Math.random() * 4;
            }
          }

          if (rail.state === 'train') {
            rail.trainX += rail.trainSpeed * dt;
            if (lane.row === this.player.gridY) {
              if (this.player.animX >= rail.trainX - 200 && this.player.animX <= rail.trainX + 200) {
                this.onCrushed('Hit by express train!');
                return;
              }
            }
          }
        }
      }
    }
  }

  onCrushed(reason) {
    this.state = GameState.GAME_OVER;
    sounds.playHit();

    // Particle splash/burst
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: this.player.animX,
        y: this.player.animY,
        vx: (Math.random() - 0.5) * 200,
        vy: (Math.random() - 0.5) * 200,
        color: '#ffd166',
        radius: 4,
        alpha: 1,
        life: 0.6
      });
    }

    this.setTimeout(() => {
      this.gameOver(this.score);
    }, 700);
  }

  render() {
    this.ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    this.ctx.save();
    this.ctx.translate(0, this.cameraY);

    // Render Lanes
    for (const lane of this.lanes) {
      const laneY = 560 - lane.row * this.gridSize;
      if (laneY < -this.cameraY - 60 || laneY > -this.cameraY + this.baseHeight + 60) continue;

      if (lane.type === 'grass') {
        this.ctx.fillStyle = (lane.row % 2 === 0) ? '#4ade80' : '#22c55e';
        this.ctx.fillRect(0, laneY - 22, this.baseWidth, this.gridSize);
      } else if (lane.type === 'road') {
        this.ctx.fillStyle = '#334155';
        this.ctx.fillRect(0, laneY - 22, this.baseWidth, this.gridSize);

        // Dashed lane lines
        this.ctx.strokeStyle = '#64748b';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([12, 14]);
        this.ctx.beginPath();
        this.ctx.moveTo(0, laneY);
        this.ctx.lineTo(this.baseWidth, laneY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Render Cars
        for (const car of lane.items) {
          this.ctx.fillStyle = car.color;
          this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
          this.ctx.shadowBlur = 4;
          this.ctx.fillRect(car.x - car.width / 2, laneY - car.height / 2, car.width, car.height);
          // Headlights
          this.ctx.fillStyle = '#fef08a';
          const lightX = car.speed > 0 ? car.x + car.width / 2 - 4 : car.x - car.width / 2;
          this.ctx.fillRect(lightX, laneY - car.height / 2 + 3, 4, 6);
          this.ctx.fillRect(lightX, laneY + car.height / 2 - 9, 4, 6);
        }
      } else if (lane.type === 'river') {
        this.ctx.fillStyle = '#0284c7';
        this.ctx.fillRect(0, laneY - 22, this.baseWidth, this.gridSize);

        // Water ripple highlights
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.fillRect(0, laneY - 14, this.baseWidth, 4);

        // Render Logs
        for (const log of lane.items) {
          this.ctx.fillStyle = '#854d0e';
          this.ctx.beginPath();
          if (this.ctx.roundRect) {
            this.ctx.roundRect(log.x - log.width / 2, laneY - log.height / 2, log.width, log.height, 6);
          } else {
            this.ctx.rect(log.x - log.width / 2, laneY - log.height / 2, log.width, log.height);
          }
          this.ctx.fill();
          // Wood bark grain
          this.ctx.fillStyle = '#713f12';
          this.ctx.fillRect(log.x - 10, laneY - log.height / 2 + 4, 20, 4);
        }
      } else if (lane.type === 'rail') {
        this.ctx.fillStyle = '#475569';
        this.ctx.fillRect(0, laneY - 22, this.baseWidth, this.gridSize);

        // Steel rails
        this.ctx.strokeStyle = '#94a3b8';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, laneY - 8);
        this.ctx.lineTo(this.baseWidth, laneY - 8);
        this.ctx.moveTo(0, laneY + 8);
        this.ctx.lineTo(this.baseWidth, laneY + 8);
        this.ctx.stroke();

        const rail = lane.items[0];
        if (rail) {
          // Warning lights
          if (rail.state === 'warning') {
            const blink = Math.floor(Date.now() / 150) % 2 === 0;
            this.ctx.fillStyle = blink ? '#ef4444' : '#7f1d1d';
            this.ctx.shadowColor = '#ef4444';
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.arc(20, laneY, 8, 0, Math.PI * 2);
            this.ctx.arc(this.baseWidth - 20, laneY, 8, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
          } else if (rail.state === 'train') {
            // High-speed bullet train
            this.ctx.fillStyle = '#dc2626';
            this.ctx.fillRect(rail.trainX - 250, laneY - 18, 500, 36);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(rail.trainX - 230, laneY - 8, 460, 6);
          }
        }
      }
    }

    // Render Coins
    for (const c of this.coins) {
      if (c.collected) continue;
      const coinY = 560 - c.gridY * this.gridSize;
      const coinX = c.gridX * this.gridSize + 22;
      this.ctx.fillStyle = '#ffd166';
      this.ctx.shadowColor = '#ffd166';
      this.ctx.shadowBlur = 6;
      this.ctx.beginPath();
      this.ctx.arc(coinX, coinY, 7, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.shadowBlur = 0;

    // Render Player (Chicken Mascot)
    if (this.state === GameState.PLAYING) {
      const hopOffset = this.player.isHopping ? Math.sin(this.player.hopProgress * Math.PI) * 12 : 0;
      const pX = this.player.animX;
      const pY = this.player.animY - hopOffset;

      // Shadow
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      this.ctx.beginPath();
      this.ctx.ellipse(this.player.animX, this.player.animY + 12, 12, 5, 0, 0, Math.PI * 2);
      this.ctx.fill();

      // Body
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(pX, pY, 13, 0, Math.PI * 2);
      this.ctx.fill();

      // Comb (Red crown)
      this.ctx.fillStyle = '#ef4444';
      this.ctx.fillRect(pX - 3, pY - 18, 6, 6);

      // Beak (Yellow)
      this.ctx.fillStyle = '#f59e0b';
      let beakX = pX;
      let beakY = pY;
      if (this.player.facing === 'UP') beakY -= 13;
      else if (this.player.facing === 'DOWN') beakY += 13;
      else if (this.player.facing === 'LEFT') beakX -= 13;
      else if (this.player.facing === 'RIGHT') beakX += 13;
      this.ctx.beginPath();
      this.ctx.arc(beakX, beakY, 4, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();

    // HUD Top
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    this.ctx.fillRect(16, 16, 200, 48);

    this.ctx.font = '900 20px "Outfit", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`SCORE: ${this.score}`, 28, 46);

    this.ctx.fillStyle = '#ffd166';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`🪙 ${this.coinsCollected}`, 200, 46);
  }
}
