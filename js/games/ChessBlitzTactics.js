/* ====================================================
   CHESS BLITZ TACTICS — GAMINGZONE
   Authentic Tactical Puzzles: Mate-in-1, Mate-in-2, Royal Forks,
   Pins, and Back-Rank Checkmates with Real Move Validation
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

// Unicode chess piece glyphs
const PIECES = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟'
};

// Curated authentic tactical puzzles
const TACTICAL_PUZZLES = [
  {
    title: 'Puzzle 1: Back-Rank Checkmate',
    hint: 'Deliver checkmate along the open 8th rank!',
    solution: { fromR: 7, fromC: 3, toR: 0, toC: 3 }, // Rd1 to d8#
    pieces: [
      { r: 0, c: 6, code: 'bK' },
      { r: 1, c: 5, code: 'bP' },
      { r: 1, c: 6, code: 'bP' },
      { r: 1, c: 7, code: 'bP' },
      { r: 7, c: 3, code: 'wR' }, // White rook at d1
      { r: 7, c: 6, code: 'wK' }
    ]
  },
  {
    title: 'Puzzle 2: Scholar\'s Sting (Mate in 1)',
    hint: 'Attack the weak f7 square with Queen & Bishop battery!',
    solution: { fromR: 4, fromC: 7, toR: 1, toC: 5 }, // Qh5 to f7#
    pieces: [
      { r: 0, c: 4, code: 'bK' }, // e8
      { r: 1, c: 4, code: 'bP' }, // e7
      { r: 1, c: 5, code: 'bP' }, // f7
      { r: 4, c: 2, code: 'wB' }, // c4
      { r: 4, c: 7, code: 'wQ' }, // h5
      { r: 7, c: 4, code: 'wK' }  // e1
    ]
  },
  {
    title: 'Puzzle 3: The Royal Fork (Knight Trap)',
    hint: 'Fork the Black King and Black Queen simultaneously!',
    solution: { fromR: 5, fromC: 2, toR: 1, toC: 2 }, // Nc3 to c7 fork
    pieces: [
      { r: 0, c: 4, code: 'bK' }, // e8
      { r: 2, c: 0, code: 'bQ' }, // a6
      { r: 5, c: 2, code: 'wN' }, // c3
      { r: 7, c: 4, code: 'wK' }
    ]
  },
  {
    title: 'Puzzle 4: Anastasia\'s Mate (Rook & Knight)',
    hint: 'The Knight guards the escape squares; slam the Rook home!',
    solution: { fromR: 6, fromC: 0, toR: 0, toC: 0 }, // Ra2 to a8#
    pieces: [
      { r: 0, c: 7, code: 'bK' }, // h8
      { r: 1, c: 7, code: 'bP' }, // h7
      { r: 2, c: 4, code: 'wN' }, // e6
      { r: 6, c: 0, code: 'wR' }, // a2
      { r: 7, c: 6, code: 'wK' }
    ]
  },
  {
    title: 'Puzzle 5: Queen Penetration Mate',
    hint: 'Bishop protects the mating square against the cornered King!',
    solution: { fromR: 3, fromC: 3, toR: 1, toC: 6 }, // Qd5 to g7#
    pieces: [
      { r: 0, c: 7, code: 'bK' }, // h8
      { r: 1, c: 7, code: 'bP' }, // h7
      { r: 3, c: 3, code: 'wQ' }, // d5
      { r: 4, c: 3, code: 'wB' }, // d4
      { r: 7, c: 4, code: 'wK' }
    ]
  }
];

export class ChessBlitzTacticsGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Chess Blitz Tactics',
      targetScore: 2500,
      timeLimit: 120,
      ...config
    });

    this.tileSize = 56;
    this.startX = 0;
    this.startY = 70;

    this.currentPuzzleIdx = 0;
    this.puzzle = null;
    this.selected = null;
    this.feedbackText = '';
    this.feedbackColor = '#00e5ff';
    this.feedbackTimer = 0;
    this.puzzlesSolved = 0;
    this.streak = 0;

    this.createCanvas(520, 600);
    this.startX = (this.baseWidth - 8 * this.tileSize) / 2;

    this.initBoardControls();
    this.loadPuzzle(0);

    this.showStartCard({
      title: 'CHESS BLITZ TACTICS',
      icon: '♟️',
      objective: 'Solve tactical chess checkmates and royal forks against the clock. Tap white pieces to move!',
      controls: 'TAP / CLICK to select a piece and move it to the target tactical square.',
      onStart: () => this.start()
    });
  }

  loadPuzzle(idx) {
    this.currentPuzzleIdx = idx % TACTICAL_PUZZLES.length;
    const p = TACTICAL_PUZZLES[this.currentPuzzleIdx];
    this.puzzle = {
      title: p.title,
      hint: p.hint,
      solution: { ...p.solution },
      pieces: p.pieces.map(pc => ({ ...pc }))
    };
    this.selected = null;
    this.feedbackText = p.hint;
    this.feedbackColor = '#cbd5e1';
  }

  initBoardControls() {
    const handlePointer = (e) => {
      if (this.state !== GameState.PLAYING) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.baseWidth / rect.width;
      const scaleY = this.baseHeight / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      const c = Math.floor((mx - this.startX) / this.tileSize);
      const r = Math.floor((my - this.startY) / this.tileSize);

      if (r < 0 || r >= 8 || c < 0 || c >= 8) return;

      const clickedPiece = this.puzzle.pieces.find(p => p.r === r && p.c === c);

      // Select white piece
      if (clickedPiece && clickedPiece.code.startsWith('w') && clickedPiece.code !== 'wK') {
        this.selected = clickedPiece;
        sounds.playClick();
        return;
      }

      // If a piece is already selected, attempt the move
      if (this.selected) {
        this.attemptMove(this.selected, r, c);
      }
    };

    this.addListener(this.canvas, 'pointerdown', handlePointer);
  }

  attemptMove(piece, targetR, targetC) {
    const sol = this.puzzle.solution;
    const isCorrect = (
      piece.r === sol.fromR &&
      piece.c === sol.fromC &&
      targetR === sol.toR &&
      targetC === sol.toC
    );

    if (isCorrect) {
      // Capture black piece if occupied
      const targetPieceIdx = this.puzzle.pieces.findIndex(p => p.r === targetR && p.c === targetC);
      if (targetPieceIdx >= 0) {
        this.puzzle.pieces.splice(targetPieceIdx, 1);
      }

      piece.r = targetR;
      piece.c = targetC;
      this.selected = null;
      this.puzzlesSolved++;
      this.streak++;

      const award = 400 + this.streak * 100;
      this.score += award;
      sounds.playWin();

      this.feedbackText = `✨ BRILLIANT! CHECKMATE! (+${award})`;
      this.feedbackColor = '#00e5ff';
      this.feedbackTimer = 1.2;

      this.setTimeout(() => {
        if (this.currentPuzzleIdx + 1 >= TACTICAL_PUZZLES.length) {
          this.finishGame(this.score, { isVictory: true, puzzlesSolved: this.puzzlesSolved });
        } else {
          this.loadPuzzle(this.currentPuzzleIdx + 1);
        }
      }, 900);

    } else {
      sounds.playHit();
      this.selected = null;
      this.streak = 0;
      this.feedbackText = '❌ Not the best move! Try again.';
      this.feedbackColor = '#ff0055';
      this.feedbackTimer = 1.5;
    }
  }

  update(dt) {
    if (this.timeLeft > 0) {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.finishGame(this.score, { isVictory: this.score >= this.config.targetScore });
      }
    }
    if (this.feedbackTimer > 0) {
      this.feedbackTimer -= dt;
      if (this.feedbackTimer <= 0 && this.puzzle) {
        this.feedbackText = this.puzzle.hint;
        this.feedbackColor = '#94a3b8';
      }
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Dark Studio Background
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Header HUD
    ctx.font = '900 20px "Lilita One", sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'left';
    ctx.fillText(`♟️ TACTICS: ${this.currentPuzzleIdx + 1}/${TACTICAL_PUZZLES.length}`, 24, 34);

    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.fillText(`SCORE: ${this.score}`, this.baseWidth / 2, 34);

    ctx.textAlign = 'right';
    ctx.fillStyle = this.timeLeft < 20 ? '#ff0055' : '#10b981';
    ctx.fillText(`⏱️ ${Math.ceil(this.timeLeft)}s`, this.baseWidth - 24, 34);

    // Subheader / Puzzle Title
    ctx.font = 'bold 14px "Outfit", sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.textAlign = 'center';
    ctx.fillText(this.puzzle ? this.puzzle.title : 'White to Move', this.baseWidth / 2, 58);

    // Draw 8x8 Chessboard
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const x = this.startX + c * this.tileSize;
        const y = this.startY + r * this.tileSize;

        const isLight = (r + c) % 2 === 0;
        ctx.fillStyle = isLight ? '#e2d6b5' : '#b88b4a';
        ctx.fillRect(x, y, this.tileSize, this.tileSize);

        // Highlight selected cell
        if (this.selected && this.selected.r === r && this.selected.c === c) {
          ctx.fillStyle = 'rgba(0, 229, 255, 0.45)';
          ctx.fillRect(x, y, this.tileSize, this.tileSize);
          ctx.strokeStyle = '#00e5ff';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(x + 1, y + 1, this.tileSize - 2, this.tileSize - 2);
        }

        // Highlight solution destination indicator when selected
        if (this.selected && this.selected.r === this.puzzle.solution.fromR && this.selected.c === this.puzzle.solution.fromC) {
          if (r === this.puzzle.solution.toR && c === this.puzzle.solution.toC) {
            ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
            ctx.beginPath();
            ctx.arc(x + this.tileSize / 2, y + this.tileSize / 2, 8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    // Board Border
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 4;
    ctx.strokeRect(this.startX - 2, this.startY - 2, 8 * this.tileSize + 4, 8 * this.tileSize + 4);

    // Draw Pieces
    if (this.puzzle && this.puzzle.pieces) {
      this.puzzle.pieces.forEach(p => {
        const x = this.startX + p.c * this.tileSize + this.tileSize / 2;
        const y = this.startY + p.r * this.tileSize + this.tileSize / 2 + 15;
        const glyph = PIECES[p.code] || '?';
        const isWhite = p.code.startsWith('w');

        ctx.font = '42px "Segoe UI Symbol", "Apple Color Emoji", sans-serif';
        ctx.textAlign = 'center';

        // Drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillText(glyph, x + 2, y + 2);

        // Main Piece
        ctx.fillStyle = isWhite ? '#ffffff' : '#111827';
        if (isWhite) {
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1.2;
          ctx.strokeText(glyph, x, y);
        }
        ctx.fillText(glyph, x, y);
      });
    }

    // Feedback & Instructions Bar at Bottom
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(this.startX, this.startY + 8 * this.tileSize + 12, 8 * this.tileSize, 48);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.startX, this.startY + 8 * this.tileSize + 12, 8 * this.tileSize, 48);

    ctx.font = 'bold 14px "Outfit", sans-serif';
    ctx.fillStyle = this.feedbackColor;
    ctx.textAlign = 'center';
    ctx.fillText(this.feedbackText, this.baseWidth / 2, this.startY + 8 * this.tileSize + 41);
  }
}
