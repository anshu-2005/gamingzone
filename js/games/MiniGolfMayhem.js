/* ====================================================
   MINI GOLF MAYHEM — GAMINGZONE 3D
   Polished Low-Poly 3D Mini-Golf Experience!
   Physics rolling, trajectory aiming, ramps, bumpers & multi-courses!
   ==================================================== */

import * as THREE from 'three';
import { ThreeGameEngineBase } from '../core/ThreeGameEngineBase.js';
import { GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class MiniGolfMayhemGame extends ThreeGameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, Object.assign({
      title: 'Mini Golf Mayhem',
      timeLimit: 120,
      clearColor: 0x38bdf8,
      fogColor: 0x38bdf8,
      fogNear: 40,
      fogFar: 160,
      cameraOffset: new THREE.Vector3(0, 5, 8)
    }, config));

    // Golf Ball Physics
    this.ball = null;
    this.ballVelocity = new THREE.Vector3();
    this.isBallRolling = false;
    this.aimAngle = 0; // Radians
    this.power = 0;
    this.isChargingPower = false;
    this.powerChargeDir = 1;
    this.strokes = 0;
    this.currentHole = 1;
    this.totalHoles = 3;

    // Course Entities
    this.courseGroup = null;
    this.cup = { position: new THREE.Vector3(0, 0.1, 45), radius: 0.9 };
    this.aimLine = null;
    this.bumpers = [];
    this.movingObstacles = [];

    // HUD
    this.hudElement = null;

    if (this.isWebGLAvailable) {
      this.initBall();
      this.initAimGuide();
      this.loadHole(1);
      this.createHUD();
      this.attach3DTouchControls();
      this.showStartCard({
        title: 'MINI GOLF MAYHEM 3D',
        icon: '⛳',
        objective: 'Putt your way across 3 wild 3D courses! Aim your shot, charge stroke power, and sink the ball in as few strokes as possible!',
        controls: 'A / D or Left / Right to aim • Hold SPACE to charge power • Release to PUTT!'
      });
      this.startLoop();
    }
  }

  // 1. Initialize Golf Ball
  initBall() {
    const ballGeo = new THREE.SphereGeometry(0.42, 20, 16);
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.1
    });
    this.ball = new THREE.Mesh(ballGeo, ballMat);
    this.ball.position.set(0, 0.42, 0);
    this.ball.castShadow = true;
    this.scene.add(this.ball);
  }

  // 2. Trajectory Aim Guide
  initAimGuide() {
    const lineMat = new THREE.LineDashedMaterial({
      color: 0xffffff,
      dashSize: 0.5,
      gapSize: 0.3,
      linewidth: 3
    });
    const points = [new THREE.Vector3(0, 0.1, 0), new THREE.Vector3(0, 0.1, 8)];
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    this.aimLine = new THREE.Line(lineGeo, lineMat);
    this.aimLine.computeLineDistances();
    this.scene.add(this.aimLine);
  }

  // 3. Load Courses / Holes
  loadHole(holeNum) {
    this.currentHole = holeNum;
    this.strokes = 0;
    this.isBallRolling = false;
    this.ballVelocity.set(0, 0, 0);
    this.bumpers = [];
    this.movingObstacles = [];

    if (this.courseGroup) {
      this.scene.remove(this.courseGroup);
      this.courseGroup.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    }

    this.courseGroup = new THREE.Group();
    this.scene.add(this.courseGroup);

    const greenMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.6 });

    if (holeNum === 1) {
      // Hole 1: Sunny Meadow Ramps & Bank Turn
      this.ball.position.set(0, 0.42, 0);
      this.cup.position.set(0, 0.1, 46);

      // Main fairway
      const f1 = new THREE.Mesh(new THREE.BoxGeometry(8, 0.8, 52), greenMat);
      f1.position.set(0, -0.4, 24);
      f1.receiveShadow = true;
      this.courseGroup.add(f1);

      // Rails
      const rLeft = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 52), woodMat);
      rLeft.position.set(-4.2, 0.2, 24);
      const rRight = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 52), woodMat);
      rRight.position.set(4.2, 0.2, 24);
      this.courseGroup.add(rLeft, rRight);

      // Bumper Pins
      [-2, 2].forEach((x) => {
        [18, 30].forEach((z) => {
          this.createPinballBumper(x, z);
        });
      });
    } else if (holeNum === 2) {
      // Hole 2: Windmill Wonder
      this.ball.position.set(0, 0.42, 0);
      this.cup.position.set(0, 0.1, 55);

      const f = new THREE.Mesh(new THREE.BoxGeometry(9, 0.8, 62), greenMat);
      f.position.set(0, -0.4, 28);
      f.receiveShadow = true;
      this.courseGroup.add(f);

      // Windmill Blades at z = 28
      const millGroup = new THREE.Group();
      millGroup.position.set(0, 3.2, 28);

      for (let i = 0; i < 4; i++) {
        const bladeGeo = new THREE.BoxGeometry(0.8, 4.2, 0.2);
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.rotation.z = (i * Math.PI) / 2;
        millGroup.add(blade);
      }
      this.courseGroup.add(millGroup);
      this.movingObstacles.push({ group: millGroup, rotSpeed: 1.8 });
    } else {
      // Hole 3: The Volcano Bumpers
      this.ball.position.set(0, 0.42, 0);
      this.cup.position.set(0, 0.1, 58);

      const f = new THREE.Mesh(new THREE.BoxGeometry(10, 0.8, 65), greenMat);
      f.position.set(0, -0.4, 30);
      f.receiveShadow = true;
      this.courseGroup.add(f);

      // Pinball Bumpers
      [
        [-2.5, 16], [2.5, 16],
        [0, 26],
        [-2.8, 38], [2.8, 38]
      ].forEach(([x, z]) => this.createPinballBumper(x, z));
    }

    // Flag Pin in Hole Cup
    this.createFlagPin(this.cup.position.x, this.cup.position.z);

    this.updateHUDText();
  }

  createPinballBumper(x, z) {
    const geo = new THREE.CylinderGeometry(1.0, 1.2, 1.2, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xbe123c,
      emissiveIntensity: 0.5,
      roughness: 0.2
    });
    const bumper = new THREE.Mesh(geo, mat);
    bumper.position.set(x, 0.6, z);
    bumper.castShadow = true;
    this.courseGroup.add(bumper);
    this.bumpers.push({ position: new THREE.Vector3(x, 0.6, z), radius: 1.2 });
  }

  createFlagPin(x, z) {
    // Hole Cup
    const cupMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.9, 0.2, 20),
      new THREE.MeshBasicMaterial({ color: 0x0f172a })
    );
    cupMesh.position.set(x, 0.02, z);
    this.courseGroup.add(cupMesh);

    // Pole & Red Flag
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 5, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    pole.position.set(x, 2.5, z);
    const flag = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.0, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xef4444 })
    );
    flag.position.set(x + 0.8, 4.4, z);
    this.courseGroup.add(pole, flag);
  }

  // 4. Create HUD
  createHUD() {
    this.hudElement = document.createElement('div');
    this.hudElement.style.cssText = `
      position: absolute; top: 14px; left: 16px; right: 16px;
      display: flex; justify-content: space-between; align-items: center;
      pointer-events: none; z-index: 50; font-family: var(--font-heading, sans-serif);
    `;
    this.hudElement.innerHTML = `
      <div style="background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); color: #fff;">
        <span style="color: #38bdf8; font-weight: 800;">⛳ HOLE:</span>
        <span id="golf-hole-num" style="font-weight: 800; font-size: 1.1rem; margin-left: 6px;">1 / 3</span>
      </div>
      <div style="background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); color: #fff; width: 200px;">
        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px;">
          <span style="color: #facc15; font-weight: 800;">⚡ POWER:</span>
          <span id="golf-power-val" style="color: #fff; font-weight: 800;">0%</span>
        </div>
        <div style="height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
          <div id="golf-power-bar" style="width: 0%; height: 100%; background: #22c55e; transition: width 0.05s;"></div>
        </div>
      </div>
      <div style="background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); color: #fff;">
        <span style="color: #34d399; font-weight: 800;">🏌️ STROKES:</span>
        <span id="golf-stroke-count" style="font-weight: 800; font-size: 1.1rem; margin-left: 6px;">0</span>
      </div>
    `;
    this.container.appendChild(this.hudElement);
  }

  updateHUDText() {
    const hElem = document.getElementById('golf-hole-num');
    if (hElem) hElem.textContent = `${this.currentHole} / ${this.totalHoles}`;
    const sElem = document.getElementById('golf-stroke-count');
    if (sElem) sElem.textContent = this.strokes;
  }

  // 5. Update Golf Loop
  updateGame(delta) {
    if (this.state !== GameState.PLAYING) return;

    // Moving Obstacles (Windmills, etc.)
    for (const obs of this.movingObstacles) {
      obs.group.rotation.z += obs.rotSpeed * delta;
    }

    if (this.isBallRolling) {
      // 1. Ball Rolling Physics
      this.ball.position.addScaledVector(this.ballVelocity, delta);
      this.ball.rotation.x += this.ballVelocity.z * delta * 4;
      this.ball.rotation.z -= this.ballVelocity.x * delta * 4;

      // Friction
      this.ballVelocity.multiplyScalar(0.978);

      // Boundaries & Wall Bounces
      if (Math.abs(this.ball.position.x) > 3.6) {
        this.ball.position.x = Math.sign(this.ball.position.x) * 3.6;
        this.ballVelocity.x = -this.ballVelocity.x * 0.75; // Bounce off rails
        sounds.playHit();
        this.createParticleBurst(this.ball.position, 6, 0x92400e, 0.15);
      }

      // Pinball Bumper Collisions
      for (const bump of this.bumpers) {
        if (bump.position.distanceTo(this.ball.position) < bump.radius + 0.42) {
          const norm = this.ball.position.clone().sub(bump.position).normalize();
          this.ballVelocity.copy(norm.multiplyScalar(22));
          sounds.playHit();
          this.createParticleBurst(bump.position, 18, 0xf43f5e, 0.28);
          this.score += 250;
        }
      }

      // Check if Ball Entered Hole Cup!
      const distToCup = Math.hypot(
        this.ball.position.x - this.cup.position.x,
        this.ball.position.z - this.cup.position.z
      );

      if (distToCup < this.cup.radius) {
        this.handleHoleInCup();
        return;
      }

      // Ball stops when speed is very low
      if (this.ballVelocity.length() < 0.2) {
        this.ballVelocity.set(0, 0, 0);
        this.isBallRolling = false;
        this.aimLine.visible = true;
      }

      // Cinematic Follow Camera during roll
      this.camera.position.lerp(
        new THREE.Vector3(this.ball.position.x, this.ball.position.y + 6, this.ball.position.z - 11),
        0.08
      );
      this.camera.lookAt(this.ball.position);

    } else {
      // 2. Aiming & Power Charging Mode
      this.aimLine.visible = true;

      const input = this.getMovementInput();
      if (input.x !== 0) {
        this.aimAngle -= input.x * 2.5 * delta;
      }

      // Charge power while Jump / Action is held
      if (input.isJump) {
        this.isChargingPower = true;
        this.power += delta * 70 * this.powerChargeDir;
        if (this.power >= 100) {
          this.power = 100;
          this.powerChargeDir = -1;
        } else if (this.power <= 5) {
          this.power = 5;
          this.powerChargeDir = 1;
        }
      } else if (this.isChargingPower) {
        // Released! Strike the ball!
        this.strikeBall();
      }

      // Update Power Meter Bar
      const pBar = document.getElementById('golf-power-bar');
      const pVal = document.getElementById('golf-power-val');
      if (pBar) {
        pBar.style.width = `${this.power}%`;
        pBar.style.background = this.power > 70 ? '#ef4444' : this.power > 40 ? '#facc15' : '#22c55e';
      }
      if (pVal) pVal.textContent = `${Math.round(this.power)}%`;

      // Update Aim Guide Vector
      const guideLen = 9;
      const targetAimX = this.ball.position.x + Math.sin(this.aimAngle) * guideLen;
      const targetAimZ = this.ball.position.z + Math.cos(this.aimAngle) * guideLen;

      const positions = this.aimLine.geometry.attributes.position.array;
      positions[0] = this.ball.position.x;
      positions[1] = 0.15;
      positions[2] = this.ball.position.z;
      positions[3] = targetAimX;
      positions[4] = 0.15;
      positions[5] = targetAimZ;
      this.aimLine.geometry.attributes.position.needsUpdate = true;
      this.aimLine.computeLineDistances();

      // Camera behind ball facing target
      const camX = this.ball.position.x - Math.sin(this.aimAngle) * 9;
      const camZ = this.ball.position.z - Math.cos(this.aimAngle) * 9;
      this.camera.position.lerp(new THREE.Vector3(camX, 5.5, camZ), 0.12);
      this.camera.lookAt(new THREE.Vector3(targetAimX, 1, targetAimZ));
    }
  }

  strikeBall() {
    this.isChargingPower = false;
    this.isBallRolling = true;
    this.aimLine.visible = false;
    this.strokes++;
    sounds.playHit();

    const speed = (this.power / 100) * 26 + 4;
    this.ballVelocity.x = Math.sin(this.aimAngle) * speed;
    this.ballVelocity.z = Math.cos(this.aimAngle) * speed;

    this.createParticleBurst(this.ball.position, 12, 0xffffff, 0.18);
    this.power = 0;
    this.updateHUDText();
  }

  handleHoleInCup() {
    this.isBallRolling = false;
    sounds.playVictory();
    this.createParticleBurst(this.cup.position, 35, 0x10b981, 0.4);

    const holeScore = Math.max(100, 1500 - (this.strokes - 1) * 300);
    this.score += holeScore;

    if (this.currentHole < this.totalHoles) {
      // Next Hole!
      setTimeout(() => {
        this.loadHole(this.currentHole + 1);
      }, 1400);
    } else {
      // Game Complete!
      this.triggerTournamentVictory();
    }
  }

  triggerTournamentVictory() {
    this.state = GameState.COMPLETED;
    sounds.playVictory();

    this.createParticleBurst(this.cup.position, 50, 0x38bdf8, 0.45);

    this.showVictoryCard({
      title: 'MINI GOLF TOURNAMENT CHAMPION!',
      score: this.score,
      stats: [
        { label: 'Holes Completed', value: '3 / 3' },
        { label: 'Total Tournament Strokes', value: this.strokes },
        { label: 'Tournament Rating', value: 'Master Putter ⭐⭐⭐' }
      ]
    });
  }

  destroy() {
    if (this.hudElement && this.hudElement.parentNode) {
      this.hudElement.parentNode.removeChild(this.hudElement);
    }
    super.destroy();
  }
}
