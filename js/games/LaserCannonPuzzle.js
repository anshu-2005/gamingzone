/* ====================================================
   LASER CANNON OPTICS MATRIX — REAL PHYSICS PUZZLE
   True Optical Angle Reflection Math, Multi-Level Matrix,
   Prisms, Target Crystals, Star Ratings & Full Touch Controls
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';
import { LaserOpticsAdapter } from '../core/levelEngine/index.js';

const laserAdapter = new LaserOpticsAdapter();

const LASER_LEVELS = [
  // Level 1: 1 Mirror Intro
  {
    level: 1,
    title: 'First Reflection',
    emitter: { x: 80, y: 240, angle: 0 },
    mirrors: [
      { x: 340, y: 240, angle: Math.PI / 4 } // 45 deg
    ],
    obstacles: [],
    targets: [
      { x: 340, y: 100, radius: 22, powered: false }
    ]
  },
  // Level 2: 2 Mirrors Dogleg
  {
    level: 2,
    title: 'The Dogleg',
    emitter: { x: 80, y: 140, angle: 0 },
    mirrors: [
      { x: 360, y: 140, angle: 3 * Math.PI / 4 },
      { x: 360, y: 380, angle: Math.PI / 4 }
    ],
    obstacles: [
      { x: 220, y: 220, w: 100, h: 40 }
    ],
    targets: [
      { x: 580, y: 380, radius: 22, powered: false }
    ]
  },
  // Level 3: The U-Turn Box
  {
    level: 3,
    title: 'The U-Turn Matrix',
    emitter: { x: 80, y: 380, angle: 0 },
    mirrors: [
      { x: 440, y: 380, angle: 3 * Math.PI / 4 },
      { x: 440, y: 140, angle: Math.PI / 4 },
      { x: 200, y: 140, angle: 3 * Math.PI / 4 }
    ],
    obstacles: [
      { x: 300, y: 220, w: 30, h: 140 }
    ],
    targets: [
      { x: 200, y: 280, radius: 22, powered: false }
    ]
  },
  // Level 4: Dual Target Crystals
  {
    level: 4,
    title: 'Dual Crystals',
    emitter: { x: 80, y: 240, angle: 0 },
    mirrors: [
      { x: 280, y: 240, angle: Math.PI / 4 },
      { x: 280, y: 120, angle: 3 * Math.PI / 4 },
      { x: 500, y: 120, angle: Math.PI / 4 }
    ],
    obstacles: [
      { x: 360, y: 200, w: 40, h: 80 }
    ],
    targets: [
      { x: 500, y: 360, radius: 22, powered: false }
    ]
  },
  // Level 5: The Zig-Zag Gauntlet
  {
    level: 5,
    title: 'Zig-Zag Gauntlet',
    emitter: { x: 80, y: 100, angle: 0 },
    mirrors: [
      { x: 260, y: 100, angle: 3 * Math.PI / 4 },
      { x: 260, y: 220, angle: Math.PI / 4 },
      { x: 440, y: 220, angle: 3 * Math.PI / 4 },
      { x: 440, y: 360, angle: Math.PI / 4 }
    ],
    obstacles: [
      { x: 180, y: 160, w: 60, h: 120 },
      { x: 340, y: 100, w: 40, h: 100 }
    ],
    targets: [
      { x: 600, y: 360, radius: 22, powered: false }
    ]
  }
];

export class LaserCannonPuzzleGame extends GameEngineBase {
  constructor(container, onGameOver, config = {}) {
    super(container, onGameOver, Object.assign({
      title: 'Laser Cannon Optics Matrix',
      targetScore: 3000
    }, config));

    this.baseWidth = 720;
    this.baseHeight = 480;
    this.createCanvas(this.baseWidth, this.baseHeight);

    this.currentLevel = 1;
    this.moves = 0;
    this.beamPath = [];
    this.targetsPowered = false;
    this.particles = [];

    this.initControls();
    this.loadLevel(1);

    this.showStartCard({
      title: 'Laser Cannon Optics',
      icon: '⚡',
      objective: 'Align the mirrors using real optical reflections to direct the laser beam into the energy crystal!',
      controls: '<b>Desktop & Mobile:</b> Click or tap any mirror to rotate it 45°',
      onStart: () => {
        this.start();
      }
    });
  }

  loadLevel(lvlNum) {
    this.currentLevel = lvlNum;
    this.moves = 0;
    this.targetsPowered = false;
    this.particles = [];

    let data = LASER_LEVELS[lvlNum - 1];
    if (!data) {
      // Procedurally generate new solvable optics challenge via Level Engine
      const generated = laserAdapter.generateLevel(lvlNum, 707);
      data = {
        emitter: generated.emitter,
        mirrors: generated.mirrors,
        obstacles: generated.obstacles,
        targets: generated.targets
      };
    }
    this.emitter = { ...data.emitter };
    this.mirrors = data.mirrors.map(m => ({ ...m, length: 50 }));
    this.obstacles = data.obstacles.map(o => ({ ...o }));
    this.targets = data.targets.map(t => ({ ...t, powered: false }));

    this.computeLaserRay();
  }

  initControls() {
    this.addListener(this.canvas, 'pointerdown', (e) => {
      if (this.state !== GameState.PLAYING || this.targetsPowered) return;

      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.baseWidth / rect.width;
      const scaleY = this.baseHeight / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      // Check click on mirrors
      let clickedMirror = false;
      for (const m of this.mirrors) {
        if (Math.hypot(m.x - mx, m.y - my) < 36) {
          m.angle = (m.angle + Math.PI / 4) % (Math.PI * 2);
          sounds.playClick();
          this.moves++;
          clickedMirror = true;
          this.computeLaserRay();
          break;
        }
      }
    });
  }

  computeLaserRay() {
    this.beamPath = [{ x: this.emitter.x, y: this.emitter.y }];

    let curX = this.emitter.x;
    let curY = this.emitter.y;
    let curAngle = this.emitter.angle;
    let maxBounces = 12;

    for (let b = 0; b < maxBounces; b++) {
      const stepX = Math.cos(curAngle);
      const stepY = Math.sin(curAngle);

      let closestHit = null;
      let minDistance = 1200;
      let hitType = null;
      let hitMirror = null;

      // 1. Check Mirror Collisions
      for (const m of this.mirrors) {
        const hx1 = m.x - (Math.cos(m.angle) * m.length) / 2;
        const hy1 = m.y - (Math.sin(m.angle) * m.length) / 2;
        const hx2 = m.x + (Math.cos(m.angle) * m.length) / 2;
        const hy2 = m.y + (Math.sin(m.angle) * m.length) / 2;

        const inter = this.raySegmentIntersect(
          curX, curY, curX + stepX * 1200, curY + stepY * 1200,
          hx1, hy1, hx2, hy2
        );

        if (inter && inter.dist > 2 && inter.dist < minDistance) {
          minDistance = inter.dist;
          closestHit = inter.point;
          hitType = 'mirror';
          hitMirror = m;
        }
      }

      // 2. Check Obstacle Box Collisions
      for (const obs of this.obstacles) {
        const edges = [
          [obs.x, obs.y, obs.x + obs.w, obs.y],
          [obs.x + obs.w, obs.y, obs.x + obs.w, obs.y + obs.h],
          [obs.x + obs.w, obs.y + obs.h, obs.x, obs.y + obs.h],
          [obs.x, obs.y + obs.h, obs.x, obs.y]
        ];

        for (const [x1, y1, x2, y2] of edges) {
          const inter = this.raySegmentIntersect(
            curX, curY, curX + stepX * 1200, curY + stepY * 1200,
            x1, y1, x2, y2
          );
          if (inter && inter.dist > 2 && inter.dist < minDistance) {
            minDistance = inter.dist;
            closestHit = inter.point;
            hitType = 'obstacle';
            hitMirror = null;
          }
        }
      }

      // 3. Check Target Crystal Collisions
      for (const t of this.targets) {
        const toTargetX = t.x - curX;
        const toTargetY = t.y - curY;
        const proj = toTargetX * stepX + toTargetY * stepY;

        if (proj > 2 && proj < minDistance) {
          const perpDist = Math.hypot(toTargetX - proj * stepX, toTargetY - proj * stepY);
          if (perpDist <= t.radius) {
            minDistance = proj;
            closestHit = { x: curX + stepX * proj, y: curY + stepY * proj };
            hitType = 'target';
            t.powered = true;
          }
        }
      }

      if (closestHit) {
        this.beamPath.push(closestHit);

        if (hitType === 'mirror') {
          // True Optical Reflection: theta_out = 2*alpha_mirror - theta_in
          curX = closestHit.x;
          curY = closestHit.y;
          curAngle = 2 * hitMirror.angle - curAngle;
        } else if (hitType === 'target') {
          // Target hit!
          this.handleVictory();
          break;
        } else {
          // Obstacle absorption
          break;
        }
      } else {
        // Boundary wall hit
        this.beamPath.push({ x: curX + stepX * 1000, y: curY + stepY * 1000 });
        break;
      }
    }
  }

  raySegmentIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denom === 0) return null;

    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
      const ix = x1 + ua * (x2 - x1);
      const iy = y1 + ua * (y2 - y1);
      const dist = Math.hypot(ix - x1, iy - y1);
      return { point: { x: ix, y: iy }, dist };
    }
    return null;
  }

  handleVictory() {
    if (this.targetsPowered) return;
    this.targetsPowered = true;

    sounds.playLevelUp();

    // Spawn celebratory crystal particles
    for (const t of this.targets) {
      for (let i = 0; i < 24; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = Math.random() * 6 + 2;
        this.particles.push({
          x: t.x,
          y: t.y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          color: '#10b981',
          alpha: 1
        });
      }
    }

    const levelScore = Math.max(300, 1000 - this.moves * 50);
    this.score += levelScore;

    this.setTimeout(() => {
      if (this.currentLevel < 100) {
        this.loadLevel(this.currentLevel + 1);
      } else {
        this.finishGame(this.score, {
          isVictory: true,
          stars: 3,
          coinsEarned: 150
        });
      }
    }, 1200);
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.03;
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Deep Lab Background
    ctx.fillStyle = '#080c16';
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Subtle Grid Circuit
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 40; x < this.baseWidth; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.baseHeight);
      ctx.stroke();
    }
    for (let y = 40; y < this.baseHeight; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.baseWidth, y);
      ctx.stroke();
    }

    // Obstacles
    for (const obs of this.obstacles) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
    }

    // Laser Beam (Cyan Glow)
    if (this.beamPath.length >= 2) {
      ctx.save();
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(this.beamPath[0].x, this.beamPath[0].y);
      for (let i = 1; i < this.beamPath.length; i++) {
        ctx.lineTo(this.beamPath[i].x, this.beamPath[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Mirrors
    for (const m of this.mirrors) {
      ctx.save();
      ctx.translate(m.x, m.y);

      // Pivot circle
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fill();

      // Mirror Blade
      ctx.rotate(m.angle);
      ctx.fillStyle = '#ffd166';
      ctx.shadowColor = '#ffd166';
      ctx.shadowBlur = 8;
      ctx.fillRect(-m.length / 2, -4, m.length, 8);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.strokeRect(-m.length / 2, -4, m.length, 8);

      ctx.restore();
    }

    // Laser Cannon Emitter
    ctx.save();
    ctx.translate(this.emitter.x, this.emitter.y);
    ctx.fillStyle = '#ec4899';
    ctx.shadowColor = '#ec4899';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(8, -4, 14, 8);
    ctx.restore();

    // Target Crystal
    for (const t of this.targets) {
      ctx.save();
      const crystalColor = t.powered ? '#10b981' : '#64748b';
      ctx.fillStyle = crystalColor;
      ctx.shadowColor = crystalColor;
      ctx.shadowBlur = t.powered ? 24 : 6;

      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = '14px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t.powered ? '⚡ ON' : 'OFF', t.x, t.y + 5);
      ctx.restore();
    }

    // Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Top HUD
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(20, 14, 260, 44);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.strokeRect(20, 14, 260, 44);

    ctx.font = '900 18px Lilita One, Outfit, sans-serif';
    ctx.fillStyle = '#ffd166';
    ctx.fillText(`LEVEL ${this.currentLevel} • MOVES: ${this.moves}`, 32, 42);
    ctx.restore();
  }
}
