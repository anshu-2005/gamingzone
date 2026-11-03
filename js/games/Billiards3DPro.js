import { GameEngineBase } from '../core/GameEngineBase.js';

export class Billiards3DPro extends GameEngineBase {
  constructor(container, options = {}) {
    super(container, {
      ...options,
      aspectRatio: 16 / 9,
      baseWidth: 1000,
      baseHeight: 562
    });

    this.title = 'Billiards 3D Pro: Master Pool';
    this.score = 0;
    this.pottedBalls = [];
    this.state = 'aiming'; // 'aiming', 'shooting', 'moving'
    this.cueAngle = 0;
    this.cuePower = 0;
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };

    // Table bounds
    this.table = {
      x: 100,
      y: 70,
      w: 800,
      h: 400,
      cushion: 28,
      pocketRadius: 24
    };

    this.pockets = [];
    this.balls = [];
    this.cueBall = null;
    this.statusMessage = 'Aim with mouse, click & pull back cue stick to shoot!';
  }

  onInit() {
    this.createCanvas();
    this.setupTable();
    this.setupBalls();

    this.addEventListenerTracked(this.canvas, 'mousemove', (e) => this.handleMouseMove(e));
    this.addEventListenerTracked(this.canvas, 'mousedown', (e) => this.handleMouseDown(e));
    this.addEventListenerTracked(this.canvas, 'mouseup', (e) => this.handleMouseUp(e));

    this.showStartCard(
      'BILLIARDS 3D PRO: MASTER POOL',
      'Realistic pocket pool simulation with precision cue physics! Aim with mouse, pull back cue stick to control shot power, and sink all balls into the pockets.',
      'START GAME'
    );
  }

  setupTable() {
    const t = this.table;
    const l = t.x + t.cushion;
    const r = t.x + t.w - t.cushion;
    const top = t.y + t.cushion;
    const b = t.y + t.h - t.cushion;
    const midX = (l + r) / 2;

    this.pockets = [
      { x: l, y: top },
      { x: midX, y: top - 4 },
      { x: r, y: top },
      { x: l, y: b },
      { x: midX, y: b + 4 },
      { x: r, y: b }
    ];
  }

  setupBalls() {
    this.balls = [];
    const r = 12;

    // Cue ball
    this.cueBall = {
      id: 0,
      x: this.table.x + 220,
      y: this.table.y + this.table.h / 2,
      vx: 0,
      vy: 0,
      radius: r,
      color: '#ffffff',
      num: 0,
      potted: false
    };
    this.balls.push(this.cueBall);

    // Triangle rack setup
    const rackStartX = this.table.x + 580;
    const rackStartY = this.table.y + this.table.h / 2;
    const ballColors = [
      '#eab308', '#3b82f6', '#ef4444', '#a855f7', '#f97316', '#10b981', '#991b1b', // solids 1-7
      '#1e293b', // 8 ball
      '#fde047', '#60a5fa', '#f87171', '#c084fc', '#fb923c', '#34d399', '#f43f5e'  // stripes 9-15
    ];

    let bIdx = 0;
    const rows = 5;
    for (let col = 0; col < rows; col++) {
      const colX = rackStartX + col * (r * 1.75);
      const rowStartY = rackStartY - col * r;
      for (let row = 0; row <= col; row++) {
        if (bIdx >= 15) break;
        const colY = rowStartY + row * (r * 2.05);
        this.balls.push({
          id: bIdx + 1,
          x: colX,
          y: colY,
          vx: 0,
          vy: 0,
          radius: r,
          color: ballColors[bIdx],
          num: bIdx + 1,
          potted: false
        });
        bIdx++;
      }
    }
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    if (this.state === 'aiming' && !this.isDragging) {
      if (this.cueBall && !this.cueBall.potted) {
        this.cueAngle = Math.atan2(my - this.cueBall.y, mx - this.cueBall.x);
      }
    } else if (this.isDragging) {
      const dist = Math.hypot(mx - this.dragStart.x, my - this.dragStart.y);
      this.cuePower = Math.min(100, Math.max(0, dist * 0.8));
    }
  }

  handleMouseDown(e) {
    if (this.state !== 'aiming' || this.cueBall.potted) return;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    this.isDragging = true;
    this.dragStart = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
    this.cuePower = 0;
  }

  handleMouseUp() {
    if (!this.isDragging) return;
    this.isDragging = false;

    if (this.cuePower > 5) {
      // Shoot cue ball
      const speed = this.cuePower * 0.28;
      this.cueBall.vx = Math.cos(this.cueAngle) * speed;
      this.cueBall.vy = Math.sin(this.cueAngle) * speed;
      this.state = 'moving';
      this.statusMessage = 'Shot in motion...';
    }
    this.cuePower = 0;
  }

  onUpdate(dt) {
    const t = this.table;
    const minX = t.x + t.cushion;
    const maxX = t.x + t.w - t.cushion;
    const minY = t.y + t.cushion;
    const maxY = t.y + t.h - t.cushion;

    let anyMoving = false;

    // Physics step
    for (const b of this.balls) {
      if (b.potted) continue;

      if (Math.hypot(b.vx, b.vy) > 0.05) {
        anyMoving = true;
        b.x += b.vx;
        b.y += b.vy;

        // Friction damping
        b.vx *= 0.985;
        b.vy *= 0.985;

        // Cushion collisions
        if (b.x - b.radius < minX) { b.x = minX + b.radius; b.vx = -b.vx * 0.85; }
        if (b.x + b.radius > maxX) { b.x = maxX - b.radius; b.vx = -b.vx * 0.85; }
        if (b.y - b.radius < minY) { b.y = minY + b.radius; b.vy = -b.vy * 0.85; }
        if (b.y + b.radius > maxY) { b.y = maxY - b.radius; b.vy = -b.vy * 0.85; }

        // Pocket checking
        for (const p of this.pockets) {
          if (Math.hypot(b.x - p.x, b.y - p.y) < t.pocketRadius) {
            b.potted = true;
            b.vx = 0;
            b.vy = 0;
            if (b.num === 0) {
              // Scratch!
              this.statusMessage = 'SCRATCH! Cue ball pocketed.';
              setTimeout(() => {
                this.cueBall.potted = false;
                this.cueBall.x = this.table.x + 220;
                this.cueBall.y = this.table.y + this.table.h / 2;
                this.cueBall.vx = 0;
                this.cueBall.vy = 0;
              }, 1200);
            } else {
              this.pottedBalls.push(b);
              this.score += b.num === 8 ? 500 : 100;
              this.statusMessage = `Ball #${b.num} pocketed! (+100 PTS)`;
            }
            break;
          }
        }
      } else {
        b.vx = 0;
        b.vy = 0;
      }
    }

    // Ball-to-ball collisions
    for (let i = 0; i < this.balls.length; i++) {
      const b1 = this.balls[i];
      if (b1.potted) continue;
      for (let j = i + 1; j < this.balls.length; j++) {
        const b2 = this.balls[j];
        if (b2.potted) continue;

        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const dist = Math.hypot(dx, dy);
        const minDist = b1.radius + b2.radius;

        if (dist < minDist && dist > 0) {
          // Overlap resolution
          const overlap = (minDist - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;

          b1.x -= nx * overlap;
          b1.y -= ny * overlap;
          b2.x += nx * overlap;
          b2.y += ny * overlap;

          // Elastic collision exchange
          const kx = b1.vx - b2.vx;
          const ky = b1.vy - b2.vy;
          const p = 2 * (nx * kx + ny * ky) / 2;

          b1.vx -= p * nx * 0.95;
          b1.vy -= p * ny * 0.95;
          b2.vx += p * nx * 0.95;
          b2.vy += p * ny * 0.95;
        }
      }
    }

    if (this.state === 'moving' && !anyMoving) {
      this.state = 'aiming';
      this.statusMessage = 'Your turn! Aim and shoot.';
    }
  }

  onRender(ctx) {
    // Background Room
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, 1000, 562);

    // Header bar
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1000, 55);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🎱 BILLIARDS 3D PRO: MASTER POOL', 30, 36);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${this.score}  |  POTTED: ${this.pottedBalls.length}/15`, 970, 36);

    const t = this.table;

    // Pool Table Outer Wood Frame
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.roundRect(t.x, t.y, t.w, t.h, 24);
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Table Green Felt Bed
    const innerX = t.x + t.cushion;
    const innerY = t.y + t.cushion;
    const innerW = t.w - t.cushion * 2;
    const innerH = t.h - t.cushion * 2;

    const feltGrad = ctx.createLinearGradient(innerX, innerY, innerX, innerY + innerH);
    feltGrad.addColorStop(0, '#065f46');
    feltGrad.addColorStop(0.5, '#047857');
    feltGrad.addColorStop(1, '#065f46');
    ctx.fillStyle = feltGrad;
    ctx.fillRect(innerX, innerY, innerW, innerH);

    // Headstring line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(t.x + 220, innerY);
    ctx.lineTo(t.x + 220, innerY + innerH);
    ctx.stroke();

    // Draw Pockets
    for (const p of this.pockets) {
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.arc(p.x, p.y, t.pocketRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Aim Guide Line
    if (this.state === 'aiming' && !this.cueBall.potted) {
      const guideLen = 200;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(this.cueBall.x, this.cueBall.y);
      ctx.lineTo(
        this.cueBall.x + Math.cos(this.cueAngle) * guideLen,
        this.cueBall.y + Math.sin(this.cueAngle) * guideLen
      );
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Cue Stick
      const stickDist = 25 + this.cuePower * 0.7;
      const stickLen = 220;
      const cueStartX = this.cueBall.x - Math.cos(this.cueAngle) * stickDist;
      const cueStartY = this.cueBall.y - Math.sin(this.cueAngle) * stickDist;
      const cueEndX = this.cueBall.x - Math.cos(this.cueAngle) * (stickDist + stickLen);
      const cueEndY = this.cueBall.y - Math.sin(this.cueAngle) * (stickDist + stickLen);

      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(cueStartX, cueStartY);
      ctx.lineTo(cueEndX, cueEndY);
      ctx.stroke();

      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cueStartX, cueStartY);
      ctx.lineTo(cueStartX - Math.cos(this.cueAngle) * 20, cueStartY - Math.sin(this.cueAngle) * 20);
      ctx.stroke();
    }

    // Render Balls
    for (const b of this.balls) {
      if (b.potted) continue;
      // Ball 3D shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.arc(b.x + 2, b.y + 3, b.radius, 0, Math.PI * 2);
      ctx.fill();

      // Ball body
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();

      // Ball highlight
      const hl = ctx.createRadialGradient(b.x - 3, b.y - 3, 1, b.x, b.y, b.radius);
      hl.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
      hl.addColorStop(0.5, 'transparent');
      ctx.fillStyle = hl;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();

      // Ball number circle
      if (b.num > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Bottom Status & Power Bar
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 495, 1000, 67);

    // Status message
    ctx.fillStyle = '#f8fafc';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(this.statusMessage, 40, 532);

    // Power gauge
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText('SHOT POWER:', 600, 532);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(700, 518, 250, 18);
    ctx.fillStyle = this.cuePower > 70 ? '#ef4444' : (this.cuePower > 40 ? '#f59e0b' : '#10b981');
    ctx.fillRect(700, 518, (this.cuePower / 100) * 250, 18);
    ctx.strokeStyle = '#475569';
    ctx.strokeRect(700, 518, 250, 18);
  }
}
