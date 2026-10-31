/* ====================================================
   PAC MAZE CLASSIC — GAMINGZONE
   Authentic Arcade Maze Action:
   4 Distinct AI Ghosts (Blinky, Pinky, Inky, Clyde),
   Power Pellets, Frightened Blue Mode, Ghost Eating,
   Fruit Spawns, Chomp Mouth Animation & Touch D-Pad
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class PacMazeClassicGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Pac Maze Classic',
      targetScore: 2000,
      lives: 3,
      ...config
    });

    this.gridSize = 28;
    this.cols = 20;
    this.rows = 20;

    // 0 = tunnel/empty, 1 = wall, 2 = dot, 3 = power pellet
    this.baseMaze = [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,3,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,3,1],
      [1,2,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,2,1],
      [1,2,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,2,1],
      [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
      [1,2,1,1,2,1,2,1,1,1,1,1,1,2,1,2,1,1,2,1],
      [1,2,2,2,2,1,2,2,2,1,1,2,2,2,1,2,2,2,2,1],
      [1,1,1,1,2,1,1,1,0,1,1,0,1,1,1,2,1,1,1,1],
      [0,0,0,1,2,1,0,0,0,0,0,0,0,0,1,2,1,0,0,0],
      [1,1,1,1,2,1,0,1,1,0,0,1,1,0,1,2,1,1,1,1],
      [0,0,0,0,2,0,0,1,0,0,0,0,1,0,0,2,0,0,0,0],
      [1,1,1,1,2,1,0,1,1,1,1,1,1,0,1,2,1,1,1,1],
      [0,0,0,1,2,1,0,0,0,0,0,0,0,0,1,2,1,0,0,0],
      [1,1,1,1,2,1,0,1,1,1,1,1,1,0,1,2,1,1,1,1],
      [1,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,1],
      [1,2,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,2,1],
      [1,3,2,1,2,2,2,2,2,0,0,2,2,2,2,2,1,2,3,1],
      [1,1,2,1,2,1,2,1,1,1,1,1,1,2,1,2,1,2,1,1],
      [1,2,2,2,2,1,2,2,2,1,1,2,2,2,1,2,2,2,2,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];

    this.pacman = {
      x: 9.5,
      y: 16,
      dirX: 0,
      dirY: 0,
      nextDirX: 0,
      nextDirY: 0,
      speed: 4.8,
      mouthAngle: 0.2
    };

    this.ghosts = [];
    this.frightenedTimer = 0;
    this.eatenGhostMultiplier = 1;
    this.fruit = null;
    this.fruitTimer = 15;
    this.dotsLeft = 0;
    this.particles = [];

    this.createCanvas(560, 620);
    this.initMaze();
    this.initControls();

    this.attachTouchControls({
      showDpad: true,
      onDirection: (dir, pressed) => {
        if (!pressed) return;
        if (dir === 'UP') { this.pacman.nextDirX = 0; this.pacman.nextDirY = -1; }
        if (dir === 'DOWN') { this.pacman.nextDirX = 0; this.pacman.nextDirY = 1; }
        if (dir === 'LEFT') { this.pacman.nextDirX = -1; this.pacman.nextDirY = 0; }
        if (dir === 'RIGHT') { this.pacman.nextDirX = 1; this.pacman.nextDirY = 0; }
      }
    });

    this.showStartCard({
      title: 'PAC MAZE CLASSIC',
      icon: '🟡',
      objective: 'Chomp all dots while evading Blinky, Pinky, Inky & Clyde! Power Pellets let you eat ghosts for massive bonus points!',
      controls: 'WASD or Arrow Keys to change direction.',
      onStart: () => this.start()
    });
  }

  initMaze() {
    this.maze = JSON.parse(JSON.stringify(this.baseMaze));
    this.dotsLeft = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.maze[r][c] === 2 || this.maze[r][c] === 3) {
          this.dotsLeft++;
        }
      }
    }

    this.resetPositions();
  }

  resetPositions() {
    this.pacman.x = 9.5;
    this.pacman.y = 16;
    this.pacman.dirX = -1;
    this.pacman.dirY = 0;
    this.pacman.nextDirX = -1;
    this.pacman.nextDirY = 0;

    this.ghosts = [
      { name: 'Blinky', x: 9.5, y: 7.5, color: '#ef4444', dirX: 1, dirY: 0, speed: 4.2, state: 'normal' },
      { name: 'Pinky', x: 9.5, y: 8.5, color: '#f472b6', dirX: -1, dirY: 0, speed: 4.0, state: 'normal' },
      { name: 'Inky', x: 8.5, y: 8.5, color: '#38bdf8', dirX: 0, dirY: -1, speed: 3.8, state: 'normal' },
      { name: 'Clyde', x: 10.5, y: 8.5, color: '#fb923c', dirX: 0, dirY: 1, speed: 3.6, state: 'normal' }
    ];

    this.frightenedTimer = 0;
  }

  initControls() {
    this.addListener(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        this.pacman.nextDirX = 0; this.pacman.nextDirY = -1;
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        this.pacman.nextDirX = 0; this.pacman.nextDirY = 1;
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.pacman.nextDirX = -1; this.pacman.nextDirY = 0;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.pacman.nextDirX = 1; this.pacman.nextDirY = 0;
      }
    });
  }

  isWall(gx, gy) {
    const c = Math.floor(gx);
    const r = Math.floor(gy);
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return false;
    return this.maze[r][c] === 1;
  }

  canMoveTo(gx, gy, dirX, dirY) {
    const nextX = gx + dirX * 0.55;
    const nextY = gy + dirY * 0.55;
    return !this.isWall(nextX, nextY);
  }

  update(dt) {
    if (this.state !== GameState.PLAYING) return;

    // Frightened mode timer
    if (this.frightenedTimer > 0) {
      this.frightenedTimer -= dt;
      if (this.frightenedTimer <= 0) {
        this.ghosts.forEach(g => {
          if (g.state === 'frightened') g.state = 'normal';
        });
      }
    }

    // Fruit spawner
    this.fruitTimer -= dt;
    if (this.fruitTimer <= 0 && !this.fruit) {
      this.fruit = { x: 9.5, y: 11, points: 100, active: true, duration: 9 };
      this.fruitTimer = 22;
    }
    if (this.fruit && this.fruit.active) {
      this.fruit.duration -= dt;
      if (this.fruit.duration <= 0) this.fruit.active = false;
    }

    // Try Pacman direction turn
    if (this.pacman.nextDirX !== this.pacman.dirX || this.pacman.nextDirY !== this.pacman.dirY) {
      // Allow turning if near cell center or reversing immediately
      const isOpposite = (this.pacman.nextDirX === -this.pacman.dirX && this.pacman.nextDirY === 0) ||
                         (this.pacman.nextDirY === -this.pacman.dirY && this.pacman.nextDirX === 0);
      const nearCenter = Math.abs((this.pacman.x % 1) - 0.5) < 0.25 && Math.abs((this.pacman.y % 1) - 0.5) < 0.25;

      if (isOpposite || (nearCenter && this.canMoveTo(this.pacman.x, this.pacman.y, this.pacman.nextDirX, this.pacman.nextDirY))) {
        this.pacman.dirX = this.pacman.nextDirX;
        this.pacman.dirY = this.pacman.nextDirY;
        if (nearCenter) {
          this.pacman.x = Math.floor(this.pacman.x) + 0.5;
          this.pacman.y = Math.floor(this.pacman.y) + 0.5;
        }
      }
    }

    // Move Pacman
    if (this.canMoveTo(this.pacman.x, this.pacman.y, this.pacman.dirX, this.pacman.dirY)) {
      this.pacman.x += this.pacman.dirX * this.pacman.speed * dt;
      this.pacman.y += this.pacman.dirY * this.pacman.speed * dt;
    }

    // Screen tunnel wrap
    if (this.pacman.x < 0) this.pacman.x = this.cols - 1;
    if (this.pacman.x >= this.cols) this.pacman.x = 0;

    // Chomp animation
    this.pacman.mouthAngle = 0.25 + Math.sin(Date.now() * 0.02) * 0.22;

    // Collect Dots / Power Pellets
    const curC = Math.floor(this.pacman.x);
    const curR = Math.floor(this.pacman.y);
    if (curR >= 0 && curR < this.rows && curC >= 0 && curC < this.cols) {
      if (this.maze[curR][curC] === 2) {
        // Dot
        this.maze[curR][curC] = 0;
        this.dotsLeft--;
        this.score += 10;
        sounds.playCoin();
      } else if (this.maze[curR][curC] === 3) {
        // Power Pellet
        this.maze[curR][curC] = 0;
        this.dotsLeft--;
        this.score += 50;
        this.frightenedTimer = 7.5;
        this.eatenGhostMultiplier = 1;
        sounds.playLaser();

        this.ghosts.forEach(g => {
          if (g.state !== 'eyes') g.state = 'frightened';
        });
      }
    }

    // Check Fruit Collection
    if (this.fruit && this.fruit.active) {
      if (Math.hypot(this.pacman.x - this.fruit.x, this.pacman.y - this.fruit.y) < 0.6) {
        this.score += this.fruit.points;
        this.fruit.active = false;
        sounds.playWin();
      }
    }

    // Win check
    if (this.dotsLeft <= 0) {
      this.levelComplete(this.score);
      return;
    }

    // Update Ghosts AI
    for (const g of this.ghosts) {
      this.updateGhost(g, dt);

      // Check collision with Pacman
      const dist = Math.hypot(this.pacman.x - g.x, this.pacman.y - g.y);
      if (dist < 0.65) {
        if (g.state === 'frightened') {
          // Eat Ghost!
          g.state = 'eyes';
          const bonus = 200 * this.eatenGhostMultiplier;
          this.score += bonus;
          this.eatenGhostMultiplier *= 2;
          sounds.playWin();

          for (let k = 0; k < 12; k++) {
            this.particles.push({
              x: g.x * this.gridSize + 14,
              y: g.y * this.gridSize + 14,
              vx: (Math.random() - 0.5) * 140,
              vy: (Math.random() - 0.5) * 140,
              color: '#38bdf8',
              radius: 3,
              alpha: 1,
              life: 0.5
            });
          }
        } else if (g.state === 'normal') {
          // Pacman hit!
          this.onPacmanDeath();
          return;
        }
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.alpha -= dt / pt.life;
      if (pt.alpha <= 0) this.particles.splice(i, 1);
    }
  }

  updateGhost(g, dt) {
    // Current speed
    let spd = g.speed;
    if (g.state === 'frightened') spd = 2.2;
    if (g.state === 'eyes') spd = 6.0;

    // Target position based on Ghost personality
    let targetX = this.pacman.x;
    let targetY = this.pacman.y;

    if (g.state === 'eyes') {
      targetX = 9.5;
      targetY = 8.5;
      if (Math.hypot(g.x - 9.5, g.y - 8.5) < 0.5) {
        g.state = 'normal';
      }
    } else if (g.state === 'frightened') {
      // Random wander
      targetX = Math.random() * this.cols;
      targetY = Math.random() * this.rows;
    } else {
      // Individual Ghost AI targets:
      if (g.name === 'Pinky') {
        // Ambusher: 3 tiles ahead of Pacman
        targetX = this.pacman.x + this.pacman.dirX * 3;
        targetY = this.pacman.y + this.pacman.dirY * 3;
      } else if (g.name === 'Inky') {
        // Flanker
        targetX = this.pacman.x - this.pacman.dirX * 2;
        targetY = this.pacman.y - this.pacman.dirY * 2;
      } else if (g.name === 'Clyde') {
        // If within 5 tiles of Pacman, retreat to bottom-left corner
        if (Math.hypot(g.x - this.pacman.x, g.y - this.pacman.y) < 5) {
          targetX = 1;
          targetY = 18;
        }
      }
    }

    // Grid intersection decision
    const nearCenterX = Math.abs((g.x % 1) - 0.5) < 0.15;
    const nearCenterY = Math.abs((g.y % 1) - 0.5) < 0.15;

    if (nearCenterX && nearCenterY) {
      g.x = Math.floor(g.x) + 0.5;
      g.y = Math.floor(g.y) + 0.5;

      // Available directions (excluding 180 reverse)
      const possibleDirs = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 }
      ].filter(d => !(d.dx === -g.dirX && d.dy === -g.dirY) && this.canMoveTo(g.x, g.y, d.dx, d.dy));

      if (possibleDirs.length > 0) {
        // Pick direction closest to target
        possibleDirs.sort((a, b) => {
          const distA = Math.hypot((g.x + a.dx) - targetX, (g.y + a.dy) - targetY);
          const distB = Math.hypot((g.x + b.dx) - targetX, (g.y + b.dy) - targetY);
          return distA - distB;
        });
        g.dirX = possibleDirs[0].dx;
        g.dirY = possibleDirs[0].dy;
      } else if (this.canMoveTo(g.x, g.y, -g.dirX, -g.dirY)) {
        // Dead end, reverse
        g.dirX = -g.dirX;
        g.dirY = -g.dirY;
      }
    }

    // Move ghost
    if (this.canMoveTo(g.x, g.y, g.dirX, g.dirY)) {
      g.x += g.dirX * spd * dt;
      g.y += g.dirY * spd * dt;
    }

    if (g.x < 0) g.x = this.cols - 1;
    if (g.x >= this.cols) g.x = 0;
  }

  onPacmanDeath() {
    this.lives--;
    sounds.playHit();

    if (this.lives <= 0) {
      this.state = GameState.GAME_OVER;
      this.setTimeout(() => this.gameOver(this.score), 800);
    } else {
      this.resetPositions();
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Dark Arcade Background
    this.ctx.fillStyle = '#05050f';
    this.ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    const padX = 0;
    const padY = 30;

    // Render Maze Walls & Pellets
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const val = this.maze[r][c];
        const cellX = padX + c * this.gridSize;
        const cellY = padY + r * this.gridSize;

        if (val === 1) {
          // Neon Blue Wall
          this.ctx.fillStyle = '#1e1b4b';
          this.ctx.strokeStyle = '#3b82f6';
          this.ctx.lineWidth = 2;
          this.ctx.fillRect(cellX, cellY, this.gridSize, this.gridSize);
          this.ctx.strokeRect(cellX + 1, cellY + 1, this.gridSize - 2, this.gridSize - 2);
        } else if (val === 2) {
          // Yellow Dot
          this.ctx.fillStyle = '#fde047';
          this.ctx.beginPath();
          this.ctx.arc(cellX + this.gridSize / 2, cellY + this.gridSize / 2, 3, 0, Math.PI * 2);
          this.ctx.fill();
        } else if (val === 3) {
          // Blinking Power Pellet
          const pulse = (Math.sin(Date.now() * 0.008) + 1) * 2 + 5;
          this.ctx.fillStyle = '#ffffff';
          this.ctx.shadowColor = '#00f2fe';
          this.ctx.shadowBlur = 8;
          this.ctx.beginPath();
          this.ctx.arc(cellX + this.gridSize / 2, cellY + this.gridSize / 2, pulse, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.shadowBlur = 0;
        }
      }
    }

    // Render Fruit
    if (this.fruit && this.fruit.active) {
      const fX = padX + this.fruit.x * this.gridSize;
      const fY = padY + this.fruit.y * this.gridSize;
      this.ctx.font = '20px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('🍒', fX, fY + 6);
    }

    // Render Pacman
    if (this.state === GameState.PLAYING) {
      const pX = padX + this.pacman.x * this.gridSize;
      const pY = padY + this.pacman.y * this.gridSize;

      let baseAngle = 0;
      if (this.pacman.dirX === 1) baseAngle = 0;
      else if (this.pacman.dirX === -1) baseAngle = Math.PI;
      else if (this.pacman.dirY === 1) baseAngle = Math.PI / 2;
      else if (this.pacman.dirY === -1) baseAngle = -Math.PI / 2;

      this.ctx.fillStyle = '#fde047';
      this.ctx.shadowColor = '#fde047';
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath();
      this.ctx.moveTo(pX, pY);
      this.ctx.arc(pX, pY, 11, baseAngle + this.pacman.mouthAngle, baseAngle + Math.PI * 2 - this.pacman.mouthAngle);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }

    // Render Ghosts
    for (const g of this.ghosts) {
      const gX = padX + g.x * this.gridSize;
      const gY = padY + g.y * this.gridSize;

      let ghostColor = g.color;
      if (g.state === 'frightened') {
        const flash = this.frightenedTimer < 2 && Math.floor(Date.now() / 150) % 2 === 0;
        ghostColor = flash ? '#ffffff' : '#38bdf8';
      }

      if (g.state !== 'eyes') {
        // Ghost Dome and skirt
        this.ctx.fillStyle = ghostColor;
        this.ctx.beginPath();
        this.ctx.arc(gX, gY - 2, 10, Math.PI, 0, false);
        this.ctx.lineTo(gX + 10, gY + 8);
        // Wavy tentacles
        this.ctx.lineTo(gX + 5, gY + 5);
        this.ctx.lineTo(gX, gY + 8);
        this.ctx.lineTo(gX - 5, gY + 5);
        this.ctx.lineTo(gX - 10, gY + 8);
        this.ctx.closePath();
        this.ctx.fill();
      }

      // Ghost Eyes
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(gX - 4, gY - 3, 3.5, 0, Math.PI * 2);
      this.ctx.arc(gX + 4, gY - 3, 3.5, 0, Math.PI * 2);
      this.ctx.fill();

      // Pupils looking in direction
      this.ctx.fillStyle = '#1e3a8a';
      const lookX = g.dirX * 1.5;
      const lookY = g.dirY * 1.5;
      this.ctx.beginPath();
      this.ctx.arc(gX - 4 + lookX, gY - 3 + lookY, 1.8, 0, Math.PI * 2);
      this.ctx.arc(gX + 4 + lookX, gY - 3 + lookY, 1.8, 0, Math.PI * 2);
      this.ctx.fill();
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

    // HUD Top
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    this.ctx.fillRect(10, 5, this.baseWidth - 20, 24);

    this.ctx.font = 'bold 15px "Outfit", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`SCORE: ${this.score}`, 20, 22);

    this.ctx.fillStyle = '#fde047';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`DOTS: ${this.dotsLeft}`, this.baseWidth / 2, 22);

    this.ctx.fillStyle = '#ef4444';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`LIVES: ${'💛 '.repeat(this.lives)}`, this.baseWidth - 20, 22);
  }
}
