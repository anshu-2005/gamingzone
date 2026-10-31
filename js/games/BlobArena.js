/* ====================================================
   BLOB ARENA — GAMINGZONE 3D
   Soft-Looking, Expressive Squishy Blob Physics Brawler!
   Squash & stretch deformation, kinetic ball pushing & hazards!
   ==================================================== */

import * as THREE from 'three';
import { ThreeGameEngineBase } from '../core/ThreeGameEngineBase.js';
import { GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class BlobArenaGame extends ThreeGameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, Object.assign({
      title: 'Blob Arena',
      timeLimit: 75,
      clearColor: 0x111827,
      fogColor: 0x111827,
      fogNear: 30,
      fogFar: 100,
      cameraOffset: new THREE.Vector3(0, 14, 16)
    }, config));

    this.blob = null;
    this.blobMesh = null;
    this.blobVelocity = new THREE.Vector3();
    this.blobSquash = { x: 1, y: 1, z: 1, targetX: 1, targetY: 1, targetZ: 1 };
    this.moveSpeed = 16;
    this.arenaRadius = 16;

    // Physical Arena Props (Giant rolling spheres to push into goals)
    this.pushBalls = [];
    this.goals = [];
    this.crystals = [];
    this.hazardSpikes = [];
    this.round = 1;
    this.ballsScored = 0;
    this.targetBalls = 5;

    // HUD
    this.hudElement = null;

    if (this.isWebGLAvailable) {
      this.initArena();
      this.initBlob();
      this.spawnRoundEntities();
      this.createHUD();
      this.attach3DTouchControls();
      this.showStartCard({
        title: 'BLOB ARENA 3D',
        icon: '🫧',
        objective: 'Bounce, squash, and roll! Slam giant glowing energy balls into the glowing goal portals while collecting jelly crystals!',
        controls: 'WASD / Arrows to roll • SPACE to bounce-dash • Push 5 energy balls to win!'
      });
      this.startLoop();
    }
  }

  // 1. Build Circular Neon 3D Arena
  initArena() {
    // Arena Floor
    const floorGeo = new THREE.CylinderGeometry(this.arenaRadius, this.arenaRadius, 1, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.5,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Glowing Arena Perimeter Bumper Ring
    const ringGeo = new THREE.TorusGeometry(this.arenaRadius, 0.7, 16, 48);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x2dd4bf,
      emissive: 0x0f766e,
      emissiveIntensity: 0.6,
      roughness: 0.2
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.5;
    this.scene.add(ring);

    // 4 Goal Scoring Portals around the perimeter
    const goalAngles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
    goalAngles.forEach((angle, idx) => {
      const gGroup = new THREE.Group();
      const archGeo = new THREE.TorusGeometry(3, 0.5, 12, 24, Math.PI);
      const archMat = new THREE.MeshStandardMaterial({
        color: 0xff5733,
        emissive: 0xff5733,
        emissiveIntensity: 0.8
      });
      const arch = new THREE.Mesh(archGeo, archMat);
      arch.position.y = 0;
      gGroup.add(arch);

      const targetX = Math.cos(angle) * (this.arenaRadius - 1.5);
      const targetZ = Math.sin(angle) * (this.arenaRadius - 1.5);
      gGroup.position.set(targetX, 0.5, targetZ);
      gGroup.rotation.y = -angle + Math.PI / 2;

      this.scene.add(gGroup);
      this.goals.push({ position: new THREE.Vector3(targetX, 0.5, targetZ), radius: 3.2 });
    });

    // Center Rotating Hazard Bar
    this.centerSpinner = new THREE.Group();
    const barGeo = new THREE.BoxGeometry(14, 0.8, 0.8);
    const barMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0x9f1239,
      emissiveIntensity: 0.7
    });
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.position.y = 0.6;
    bar.castShadow = true;
    this.centerSpinner.add(bar);
    this.scene.add(this.centerSpinner);
  }

  // 2. Create Expressive Squishy 3D Blob Character
  initBlob() {
    this.blob = new THREE.Group();
    this.blob.position.set(0, 0, 5);

    // Deformable Blob Mesh
    const blobGeo = new THREE.SphereGeometry(1.2, 24, 20);
    const blobMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.25,
      roughness: 0.15,
      metalness: 0.1
    });
    this.blobMesh = new THREE.Mesh(blobGeo, blobMat);
    this.blobMesh.position.y = 1.1;
    this.blobMesh.castShadow = true;
    this.blob.add(this.blobMesh);

    // Big Googly Cartoon Eyes
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });

    this.blobEyes = [];
    [-0.38, 0.38].forEach((x) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 12), eyeWhiteMat);
      eye.position.set(x, 0.4, 0.95);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), pupilMat);
      pupil.position.set(0, 0, 0.22);
      eye.add(pupil);
      this.blobMesh.add(eye);
      this.blobEyes.push({ eye, pupil });
    });

    // Rosy Cheeks
    [-0.6, 0.6].forEach((x) => {
      const cheek = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.7 })
      );
      cheek.position.set(x, 0.1, 0.95);
      cheek.scale.set(1, 0.6, 0.4);
      this.blobMesh.add(cheek);
    });

    this.scene.add(this.blob);
  }

  // 3. Spawn Pushable Physics Balls & Sparkling Crystals
  spawnRoundEntities() {
    // 5 Giant Glowing Kinetic Balls
    const ballColors = [0x38bdf8, 0xfacc15, 0xa855f7, 0xf97316, 0xec4899];
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + 0.3;
      const dist = 7 + Math.random() * 4;
      const bGeo = new THREE.SphereGeometry(1.1, 18, 16);
      const bMat = new THREE.MeshStandardMaterial({
        color: ballColors[i],
        emissive: ballColors[i],
        emissiveIntensity: 0.4,
        roughness: 0.25,
        metalness: 0.3
      });
      const ball = new THREE.Mesh(bGeo, bMat);
      ball.position.set(Math.cos(angle) * dist, 1.1, Math.sin(angle) * dist);
      ball.castShadow = true;
      ball.velocity = new THREE.Vector3();
      ball.radius = 1.1;
      this.scene.add(ball);
      this.pushBalls.push(ball);
    }

    // 10 Sparkling Jelly Crystals
    const crystalGeo = new THREE.OctahedronGeometry(0.6, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0xfcd34d,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.5,
      metalness: 0.6,
      roughness: 0.2
    });

    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 3 + Math.random() * 10;
      const crystal = new THREE.Mesh(crystalGeo, crystalMat);
      crystal.position.set(Math.cos(angle) * dist, 1.0, Math.sin(angle) * dist);
      crystal.castShadow = true;
      this.scene.add(crystal);
      this.crystals.push(crystal);
    }
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
        <span style="color: #2dd4bf; font-weight: 800;">⚽ GOALS SCORED:</span>
        <span id="blob-balls-count" style="font-weight: 800; font-size: 1.1rem; margin-left: 6px;">0 / 5</span>
      </div>
      <div style="background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); color: #fff;">
        <span style="color: #facc15; font-weight: 800;">⏱️ TIME:</span>
        <span id="blob-timer" style="font-weight: 800; font-size: 1.1rem; margin-left: 6px;">75s</span>
      </div>
      <div style="background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); color: #fff;">
        <span style="color: #ff5733; font-weight: 800;">⭐ SCORE:</span>
        <span id="blob-score" style="font-weight: 800; font-size: 1.1rem; margin-left: 6px;">0</span>
      </div>
    `;
    this.container.appendChild(this.hudElement);
  }

  // 5. Update Game Loop
  updateGame(delta) {
    if (this.state !== GameState.PLAYING) return;

    this.timeLeft -= delta;
    const timerElem = document.getElementById('blob-timer');
    if (timerElem) timerElem.textContent = `${Math.max(0, Math.ceil(this.timeLeft))}s`;

    if (this.timeLeft <= 0) {
      this.state = GameState.GAME_OVER;
      sounds.playGameOver();
      this.showGameOverCard({
        title: 'ARENA TIME UP!',
        score: this.score,
        reason: 'You ran out of time! Try again to score all energy balls!'
      });
      return;
    }

    // Center Hazard Spinner Rotation
    if (this.centerSpinner) {
      this.centerSpinner.rotation.y += delta * 1.8;
      // Collision with player
      const distToCenter = Math.hypot(this.blob.position.x, this.blob.position.z);
      if (distToCenter < 7) {
        const barAngle = this.centerSpinner.rotation.y;
        const blobAngle = Math.atan2(this.blob.position.z, this.blob.position.x);
        let diff = Math.abs(blobAngle - barAngle) % Math.PI;
        if (diff > Math.PI / 2) diff = Math.PI - diff;
        if (diff < 0.25) {
          // Hit by spinning hazard bar!
          this.triggerBlobBonk();
        }
      }
    }

    // Player Blob Movement Input
    const input = this.getMovementInput();
    const targetVelX = input.x * this.moveSpeed;
    const targetVelZ = (input.z || 0) * this.moveSpeed;

    this.blobVelocity.x = THREE.MathUtils.lerp(this.blobVelocity.x, targetVelX, 0.16);
    this.blobVelocity.z = THREE.MathUtils.lerp(this.blobVelocity.z, targetVelZ, 0.16);

    // Dash / Bounce
    if (input.isJump && this.blob.position.y <= 0.1) {
      this.blobVelocity.y = 12;
      this.blobSquash.targetY = 1.4;
      this.blobSquash.targetX = 0.8;
      this.blobSquash.targetZ = 0.8;
      sounds.playJump();
      this.createParticleBurst(this.blob.position, 8, 0x10b981, 0.2);
    }

    // Gravity
    this.blobVelocity.y -= 28 * delta;
    this.blob.position.addScaledVector(this.blobVelocity, delta);

    if (this.blob.position.y <= 0) {
      if (this.blobVelocity.y < -5) {
        // Landing Squash
        this.blobSquash.targetY = 0.65;
        this.blobSquash.targetX = 1.35;
        this.blobSquash.targetZ = 1.35;
      }
      this.blob.position.y = 0;
      this.blobVelocity.y = 0;
    }

    // Keep Blob inside circular arena
    const distFromOrigin = Math.hypot(this.blob.position.x, this.blob.position.z);
    if (distFromOrigin > this.arenaRadius - 1.2) {
      const angle = Math.atan2(this.blob.position.z, this.blob.position.x);
      this.blob.position.x = Math.cos(angle) * (this.arenaRadius - 1.2);
      this.blob.position.z = Math.sin(angle) * (this.arenaRadius - 1.2);

      // Bounce back
      this.blobVelocity.x = -Math.cos(angle) * 8;
      this.blobVelocity.z = -Math.sin(angle) * 8;
      sounds.playHit();
      this.createParticleBurst(this.blob.position, 10, 0x2dd4bf, 0.25);
    }

    // Rotate blob to face roll direction
    if (Math.hypot(this.blobVelocity.x, this.blobVelocity.z) > 0.5) {
      const targetRot = Math.atan2(this.blobVelocity.x, this.blobVelocity.z);
      this.blob.rotation.y = THREE.MathUtils.lerp(this.blob.rotation.y, targetRot, 0.2);
    }

    // Squash & Stretch Spring Physics
    const speed = Math.hypot(this.blobVelocity.x, this.blobVelocity.z);
    if (speed > 1) {
      const stretch = 1 + (speed / this.moveSpeed) * 0.25;
      this.blobSquash.targetZ = stretch;
      this.blobSquash.targetX = 1 / Math.sqrt(stretch);
      this.blobSquash.targetY = 1 / Math.sqrt(stretch);
    } else {
      this.blobSquash.targetX = 1;
      this.blobSquash.targetY = 1;
      this.blobSquash.targetZ = 1;
    }

    this.blobSquash.x = THREE.MathUtils.lerp(this.blobSquash.x, this.blobSquash.targetX, 0.2);
    this.blobSquash.y = THREE.MathUtils.lerp(this.blobSquash.y, this.blobSquash.targetY, 0.2);
    this.blobSquash.z = THREE.MathUtils.lerp(this.blobSquash.z, this.blobSquash.targetZ, 0.2);
    this.blobMesh.scale.set(this.blobSquash.x, this.blobSquash.y, this.blobSquash.z);

    // Update Kinetic Physics Push Balls
    this.updatePushBalls(delta);

    // Crystal Collectibles
    for (let i = this.crystals.length - 1; i >= 0; i--) {
      const crystal = this.crystals[i];
      crystal.rotation.y += delta * 3;
      crystal.rotation.x += delta * 2;
      if (crystal.position.distanceTo(this.blob.position) < 1.8) {
        this.score += 200;
        sounds.playCoin();
        this.createParticleBurst(crystal.position, 14, 0xfcd34d, 0.25);
        this.scene.remove(crystal);
        crystal.geometry.dispose();
        crystal.material.dispose();
        this.crystals.splice(i, 1);
        const sElem = document.getElementById('blob-score');
        if (sElem) sElem.textContent = this.score;
      }
    }

    // Smooth Camera Follow
    this.updateCameraFollow(this.blob);
  }

  // 6. Push Balls Physics & Goal Detection
  updatePushBalls(delta) {
    for (let i = this.pushBalls.length - 1; i >= 0; i--) {
      const ball = this.pushBalls[i];

      // Collision with player Blob
      const dist = ball.position.distanceTo(this.blob.position);
      if (dist < ball.radius + 1.2) {
        const pushDir = ball.position.clone().sub(this.blob.position).normalize();
        ball.velocity.addScaledVector(pushDir, 16);
        this.blobVelocity.addScaledVector(pushDir, -4); // recoil
        sounds.playDrop();
        this.createParticleBurst(ball.position, 6, 0x38bdf8, 0.2);

        // Squash blob on hard push
        this.blobSquash.targetZ = 0.7;
        this.blobSquash.targetY = 1.3;
      }

      // Ball Velocity Integration & Friction
      ball.position.addScaledVector(ball.velocity, delta);
      ball.velocity.multiplyScalar(0.94); // Kinetic rolling friction

      // Ball Arena Boundary Bounce
      const ballDist = Math.hypot(ball.position.x, ball.position.z);
      if (ballDist > this.arenaRadius - ball.radius) {
        const angle = Math.atan2(ball.position.z, ball.position.x);
        ball.position.x = Math.cos(angle) * (this.arenaRadius - ball.radius);
        ball.position.z = Math.sin(angle) * (this.arenaRadius - ball.radius);
        ball.velocity.x = -Math.cos(angle) * Math.abs(ball.velocity.x) * 0.8;
        ball.velocity.z = -Math.sin(angle) * Math.abs(ball.velocity.z) * 0.8;
      }

      // Check if Ball entered any of the 4 Goal Portals!
      for (const goal of this.goals) {
        if (ball.position.distanceTo(goal.position) < goal.radius) {
          this.handleBallScored(ball, i);
          break;
        }
      }
    }
  }

  handleBallScored(ball, index) {
    sounds.playVictory();
    this.createParticleBurst(ball.position, 35, 0x2dd4bf, 0.4);

    this.scene.remove(ball);
    ball.geometry.dispose();
    ball.material.dispose();
    this.pushBalls.splice(index, 1);

    this.ballsScored++;
    this.score += 1000;

    const bElem = document.getElementById('blob-balls-count');
    if (bElem) bElem.textContent = `${this.ballsScored} / ${this.targetBalls}`;
    const sElem = document.getElementById('blob-score');
    if (sElem) sElem.textContent = this.score;

    // Victory Check!
    if (this.ballsScored >= this.targetBalls) {
      this.triggerVictory();
    }
  }

  triggerBlobBonk() {
    sounds.playHit();
    this.createParticleBurst(this.blob.position, 16, 0xf43f5e, 0.3);
    const knockDir = this.blob.position.clone().normalize();
    this.blobVelocity.copy(knockDir.multiplyScalar(22));
    this.blobVelocity.y = 8;
  }

  triggerVictory() {
    this.state = GameState.COMPLETED;
    sounds.playVictory();

    const timeBonus = Math.max(0, Math.round(this.timeLeft * 50));
    const finalScore = this.score + timeBonus;

    this.createParticleBurst(this.blob.position, 45, 0x10b981, 0.45);

    this.showVictoryCard({
      title: 'BLOB ARENA CHAMPION!',
      score: finalScore,
      stats: [
        { label: 'Energy Balls Scored', value: `${this.ballsScored} / ${this.targetBalls}` },
        { label: 'Time Remaining', value: `${Math.ceil(this.timeLeft)}s` },
        { label: 'Time Bonus', value: `+${timeBonus}` }
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
