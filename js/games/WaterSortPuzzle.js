import { GameEngineBase } from '../core/GameEngineBase.js';

export class WaterSortPuzzle extends GameEngineBase {
  constructor(container, options = {}) {
    super(container, {
      ...options,
      aspectRatio: 16 / 9,
      baseWidth: 1000,
      baseHeight: 562
    });

    this.title = 'Water Sort Puzzle: Color Tubes';
    this.level = 1;
    this.moves = 0;
    this.history = [];
    this.selectedTube = null;
    this.tubes = [];
    this.isWon = false;
    this.confetti = [];

    this.colors = [
      '#ef4444', // Red
      '#3b82f6', // Blue
      '#10b981', // Green
      '#f59e0b', // Amber
      '#a855f7', // Purple
      '#06b6d4', // Cyan
      '#ec4899'  // Pink
    ];

    this.statusMessage = 'Tap a tube to select, then tap another tube to pour!';
  }

  onInit() {
    this.createCanvas();
    this.setupLevel(this.level);

    this.addEventListenerTracked(this.canvas, 'click', (e) => this.handleClick(e));

    this.showStartCard(
      'WATER SORT PUZZLE',
      'The viral liquid sorting brain teaser! Sort the colored liquids until each test tube contains only one uniform color. Tap a tube to select, then tap another to pour!',
      'START SORTING'
    );
  }

  setupLevel(lvl) {
    this.level = lvl;
    this.moves = 0;
    this.history = [];
    this.selectedTube = null;
    this.isWon = false;
    this.confetti = [];

    const numColors = Math.min(6, 3 + Math.floor((lvl - 1) / 2));
    const numTubes = numColors + 2; // 2 empty tubes

    // Create segments
    const allSegments = [];
    for (let c = 0; c < numColors; c++) {
      for (let s = 0; s < 4; s++) {
        allSegments.push(this.colors[c]);
      }
    }

    // Shuffle segments
    for (let i = allSegments.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allSegments[i], allSegments[j]] = [allSegments[j], allSegments[i]];
    }

    // Fill tubes
    this.tubes = [];
    for (let t = 0; t < numColors; t++) {
      this.tubes.push(allSegments.slice(t * 4, (t + 1) * 4));
    }
    // Add empty tubes
    for (let e = 0; e < numTubes - numColors; e++) {
      this.tubes.push([]);
    }

    this.statusMessage = `Level ${this.level} — Sort ${numColors} colors into uniform tubes!`;
  }

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    // Reset button
    if (mx >= 800 && mx <= 950 && my >= 20 && my <= 60) {
      this.setupLevel(this.level);
      return;
    }

    // Next Level button (when won)
    if (this.isWon && mx >= 420 && mx <= 580 && my >= 470 && my <= 520) {
      this.setupLevel(this.level + 1);
      return;
    }

    if (this.isWon) return;

    // Check tube clicks
    const tubePositions = this.getTubePositions();
    for (let i = 0; i < tubePositions.length; i++) {
      const pos = tubePositions[i];
      if (mx >= pos.x && mx <= pos.x + pos.w && my >= pos.y - 20 && my <= pos.y + pos.h) {
        this.handleTubeClick(i);
        return;
      }
    }
  }

  getTubePositions() {
    const total = this.tubes.length;
    const cols = total <= 5 ? total : Math.ceil(total / 2);
    const rows = total <= 5 ? 1 : 2;
    const tubeW = 54;
    const tubeH = 170;
    const spacingX = Math.min(110, (880 / cols));

    const positions = [];
    const startX = (1000 - (cols - 1) * spacingX - tubeW) / 2;

    for (let i = 0; i < total; i++) {
      let r = 0;
      let c = i;
      if (rows === 2) {
        r = i < cols ? 0 : 1;
        c = i < cols ? i : i - cols;
      }
      const y = rows === 1 ? 210 : (r === 0 ? 120 : 320);
      const isSelected = this.selectedTube === i;
      positions.push({
        x: startX + c * spacingX,
        y: isSelected ? y - 25 : y,
        w: tubeW,
        h: tubeH
      });
    }
    return positions;
  }

  handleTubeClick(idx) {
    if (this.selectedTube === null) {
      if (this.tubes[idx].length > 0) {
        this.selectedTube = idx;
        this.statusMessage = `Tube #${idx + 1} selected. Select destination tube!`;
      }
    } else if (this.selectedTube === idx) {
      // Deselect
      this.selectedTube = null;
      this.statusMessage = 'Deselected tube.';
    } else {
      // Pour from selectedTube to idx
      this.tryPour(this.selectedTube, idx);
      this.selectedTube = null;
    }
  }

  tryPour(fromIdx, toIdx) {
    const fromTube = this.tubes[fromIdx];
    const toTube = this.tubes[toIdx];

    if (fromTube.length === 0) return;
    if (toTube.length >= 4) {
      this.statusMessage = 'Destination tube is already full!';
      return;
    }

    const pourColor = fromTube[fromTube.length - 1];

    if (toTube.length > 0 && toTube[toTube.length - 1] !== pourColor) {
      this.statusMessage = 'Color mismatch! Can only pour into empty or matching color.';
      return;
    }

    // Save history for undo
    this.history.push(this.tubes.map(t => [...t]));

    // Transfer matching color blocks up to destination capacity
    while (fromTube.length > 0 &&
           fromTube[fromTube.length - 1] === pourColor &&
           toTube.length < 4) {
      toTube.push(fromTube.pop());
    }

    this.moves++;
    this.statusMessage = `Poured color into Tube #${toIdx + 1}! (Moves: ${this.moves})`;
    this.checkWin();
  }

  checkWin() {
    let won = true;
    for (const tube of this.tubes) {
      if (tube.length === 0) continue;
      if (tube.length !== 4) {
        won = false;
        break;
      }
      const firstCol = tube[0];
      if (!tube.every(c => c === firstCol)) {
        won = false;
        break;
      }
    }

    if (won) {
      this.isWon = true;
      this.statusMessage = `🎉 LEVEL ${this.level} COMPLETED IN ${this.moves} MOVES!`;
      // Spawn confetti
      for (let i = 0; i < 70; i++) {
        this.confetti.push({
          x: 100 + Math.random() * 800,
          y: Math.random() * 200,
          vx: (Math.random() - 0.5) * 6,
          vy: 2 + Math.random() * 5,
          color: this.colors[Math.floor(Math.random() * this.colors.length)],
          size: 6 + Math.random() * 6,
          life: 3.0
        });
      }
    }
  }

  onUpdate(dt) {
    if (this.confetti.length > 0) {
      for (let i = this.confetti.length - 1; i >= 0; i--) {
        const p = this.confetti[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= dt;
        if (p.life <= 0) this.confetti.splice(i, 1);
      }
    }
  }

  onRender(ctx) {
    // Elegant Dark Glass Laboratory Background
    const bgGrad = ctx.createLinearGradient(0, 0, 1000, 562);
    bgGrad.addColorStop(0, '#090d16');
    bgGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1000, 562);

    // Top Header
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1000, 70);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 1000, 70);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🧪 WATER SORT PUZZLE', 30, 44);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px sans-serif';
    ctx.fillText(`LEVEL: ${this.level}  |  MOVES: ${this.moves}`, 320, 44);

    // Reset button
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(830, 18, 120, 36, 6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('↺ RESTART', 890, 41);

    // Tube Positions
    const tubePositions = this.getTubePositions();

    tubePositions.forEach((pos, idx) => {
      const tube = this.tubes[idx];
      const isSelected = this.selectedTube === idx;

      // Glow if selected
      if (isSelected) {
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 18;
      }

      // Draw Test Tube Liquid Segments (bottom up)
      const segH = (pos.h - 15) / 4;
      const innerW = pos.w - 8;
      const innerX = pos.x + 4;
      const bottomY = pos.y + pos.h - 6;

      for (let s = 0; s < tube.length; s++) {
        const col = tube[s];
        const segY = bottomY - (s + 1) * segH;
        ctx.fillStyle = col;

        if (s === 0) {
          // Rounded bottom
          ctx.beginPath();
          ctx.roundRect(innerX, segY, innerW, segH, [0, 0, 18, 18]);
          ctx.fill();
        } else {
          ctx.fillRect(innerX, segY, innerW, segH);
        }

        // Liquid surface meniscus
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(innerX, segY, innerW, 3);
      }

      // Draw Glass Test Tube Outer Border
      ctx.strokeStyle = isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = isSelected ? 4 : 3;
      ctx.beginPath();
      // Left rim, bottom curve, right rim
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(pos.x, pos.y + pos.h - 20);
      ctx.arcTo(pos.x, pos.y + pos.h, pos.x + pos.w / 2, pos.y + pos.h, 24);
      ctx.arcTo(pos.x + pos.w, pos.y + pos.h, pos.x + pos.w, pos.y + pos.h - 20, 24);
      ctx.lineTo(pos.x + pos.w, pos.y);
      ctx.stroke();

      // Top Glass Lip
      ctx.beginPath();
      ctx.ellipse(pos.x + pos.w / 2, pos.y, pos.w / 2 + 3, 5, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.shadowBlur = 0;

      // Tube label
      ctx.fillStyle = '#64748b';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`#${idx + 1}`, pos.x + pos.w / 2, pos.y + pos.h + 20);
    });

    // Confetti
    this.confetti.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Bottom Status & Controls Bar
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 485, 1000, 77);

    ctx.fillStyle = this.isWon ? '#10b981' : '#f8fafc';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.statusMessage, 500, 528);

    // If won, render Next Level button
    if (this.isWon) {
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.roundRect(420, 470, 160, 45, 8);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('NEXT LEVEL ▶', 500, 498);
    }
  }
}
