/* ====================================================
   WOBBLY DELIVERY — GAMINGZONE 3D
   Hilarious Third-Person 3D Physics Delivery Simulator!
   Towering packages wobble, objects topple, and Bob stumbles!
   ==================================================== */

import * as THREE from 'three';
import { ThreeGameEngineBase } from '../core/ThreeGameEngineBase.js';
import { GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class WobblyDeliveryGame extends ThreeGameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, Object.assign({
      title: 'Wobbly Delivery',
      timeLimit: 90,
      clearColor: 0x87ceeb,
      fogColor: 0x87ceeb,
      fogNear: 40,
      fogFar: 180,
      cameraOffset: new THREE.Vector3(0, 5.5, 10.5)
    }, config));

    this.player = null;
    this.packageStack = [];
    this.packageSway = { angleX: 0, angleZ: 0, velX: 0, velZ: 0 };
    this.packagesCarried = 4;
    this.packagesDelivered = 0;

    // Movement & Physics
    this.velocity = new THREE.Vector3();
    this.isGrounded = true;
    this.moveSpeed = 11;
    this.jumpForce = 13.5;
    this.gravity = 32;
    this.isStumbling = false;
    this.stumbleTimer = 0;

    // Course Entities
    this.obstacles = [];
    this.checkpoints = [];
    this.currentCheckpointIdx = 0;
    this.finishZone = null;
    this.coins = [];
    this.dynamicProps = [];

    // HUD Elements
    this.hudElement = null;

    if (this.isWebGLAvailable) {
      this.initWorld();
      this.initPlayer();
      this.createHUD();
      this.attach3DTouchControls();
      this.showStartCard({
        title: 'WOBBLY DELIVERY 3D',
        icon: '📦',
        objective: 'Deliver 4 fragile packages to downtown! Watch your balance: sharp turns and obstacles make packages wobble and topple!',
        controls: 'WASD / Arrow Keys to move • SPACE to jump • Balance the stack!'
      });
      this.startLoop();
    }
  }

  // 1. Build 3D Town & Obstacle Course
  initWorld() {
    // Ground Street & Sidewalks
    const roadGeo = new THREE.BoxGeometry(16, 1, 320);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.position.set(0, -0.5, 140);
    road.receiveShadow = true;
    this.scene.add(road);

    // Sidewalks
    const walkGeo = new THREE.BoxGeometry(4, 1.2, 320);
    const walkMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6 });
    const leftWalk = new THREE.Mesh(walkGeo, walkMat);
    leftWalk.position.set(-10, -0.4, 140);
    leftWalk.receiveShadow = true;
    const rightWalk = new THREE.Mesh(walkGeo, walkMat);
    rightWalk.position.set(10, -0.4, 140);
    rightWalk.receiveShadow = true;
    this.scene.add(leftWalk, rightWalk);

    // Colorful Stylized Town Buildings
    const buildingColors = [0xf97316, 0x06b6d4, 0x10b981, 0x8b5cf6, 0xf43f5e, 0xfacc15];
    for (let z = 0; z < 300; z += 18) {
      // Left building
      const h1 = 12 + Math.random() * 16;
      const bGeo1 = new THREE.BoxGeometry(8, h1, 14);
      const bMat1 = new THREE.MeshStandardMaterial({
        color: buildingColors[Math.floor(Math.random() * buildingColors.length)],
        roughness: 0.6
      });
      const b1 = new THREE.Mesh(bGeo1, bMat1);
      b1.position.set(-17, h1 / 2, z);
      b1.castShadow = true;
      b1.receiveShadow = true;
      this.scene.add(b1);

      // Right building
      const h2 = 12 + Math.random() * 16;
      const bGeo2 = new THREE.BoxGeometry(8, h2, 14);
      const bMat2 = new THREE.MeshStandardMaterial({
        color: buildingColors[Math.floor(Math.random() * buildingColors.length)],
        roughness: 0.6
      });
      const b2 = new THREE.Mesh(bGeo2, bMat2);
      b2.position.set(17, h2 / 2, z);
      b2.castShadow = true;
      b2.receiveShadow = true;
      this.scene.add(b2);
    }

    // Street Obstacles (Barricades, swinging cranes, fire hydrants, bouncing balls)
    this.createStreetObstacles();

    // Checkpoints along the course
    this.createCheckpoints();

    // Finish Drop-off Zone at z = 290
    this.createFinishZone();
  }

  createStreetObstacles() {
    // 1. Fire Hydrants
    const hydrantGeo = new THREE.CylinderGeometry(0.35, 0.4, 1.2, 10);
    const hydrantMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
    [-4, 4].forEach((x, idx) => {
      [30, 80, 150, 220].forEach((z) => {
        const h = new THREE.Mesh(hydrantGeo, hydrantMat);
        h.position.set(x + (idx % 2 ? 1 : -1), 0.6, z);
        h.castShadow = true;
        this.scene.add(h);
        this.obstacles.push({ mesh: h, radius: 0.8, type: 'hydrant' });
      });
    });

    // 2. Moving Construction Sweeper Barricades (Z = 55, 120, 190, 250)
    [55, 120, 190, 250].forEach((z, idx) => {
      const barGroup = new THREE.Group();
      const beamGeo = new THREE.BoxGeometry(6.5, 0.8, 0.8);
      const stripeMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.4 });
      const beam = new THREE.Mesh(beamGeo, stripeMat);
      beam.position.y = 0.8;
      beam.castShadow = true;
      barGroup.add(beam);
      barGroup.position.set(0, 0, z);
      this.scene.add(barGroup);

      this.dynamicProps.push({
        group: barGroup,
        baseX: 0,
        speed: 2.2 + idx * 0.4,
        range: 4.5,
        type: 'moving_barricade'
      });
    });

    // 3. Golden Tip Coins
    const coinGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.15, 12);
    coinGeo.rotateX(Math.PI / 2);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffa500,
      emissiveIntensity: 0.3,
      metalness: 0.8,
      roughness: 0.2
    });

    for (let z = 15; z < 280; z += 12) {
      const coin = new THREE.Mesh(coinGeo, coinMat);
      coin.position.set((Math.sin(z) * 4), 1.2, z);
      this.scene.add(coin);
      this.coins.push(coin);
    }
  }

  createCheckpoints() {
    [70, 160, 230].forEach((z, idx) => {
      const archGroup = new THREE.Group();
      const pGeo = new THREE.CylinderGeometry(0.3, 0.3, 6, 8);
      const pMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });
      const p1 = new THREE.Mesh(pGeo, pMat);
      p1.position.set(-6, 3, 0);
      const p2 = new THREE.Mesh(pGeo, pMat);
      p2.position.set(6, 3, 0);

      const topGeo = new THREE.BoxGeometry(13, 0.8, 0.8);
      const topMat = new THREE.MeshStandardMaterial({ color: 0x60a5fa });
      const top = new THREE.Mesh(topGeo, topMat);
      top.position.set(0, 5.8, 0);

      archGroup.add(p1, p2, top);
      archGroup.position.set(0, 0, z);
      this.scene.add(archGroup);

      this.checkpoints.push({ z, passed: false, index: idx + 1 });
    });
  }

  createFinishZone() {
    const fGroup = new THREE.Group();
    fGroup.position.set(0, 0, 290);

    const padGeo = new THREE.CylinderGeometry(6, 6, 0.4, 24);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.4 });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.y = 0.2;
    pad.receiveShadow = true;
    fGroup.add(pad);

    // Finish Arch Banner
    const bannerGeo = new THREE.BoxGeometry(14, 2, 0.5);
    const bannerMat = new THREE.MeshStandardMaterial({ color: 0x10b981 });
    const banner = new THREE.Mesh(bannerGeo, bannerMat);
    banner.position.set(0, 6.5, 0);
    fGroup.add(banner);

    this.scene.add(fGroup);
    this.finishZone = { z: 290, radius: 5.5 };
  }

  // 2. Initialize Player & Balancing Package Stack
  initPlayer() {
    this.player = this.createStylizedCharacter({
      bodyColor: 0x0284c7, // Blue delivery uniform
      pantsColor: 0x1e293b,
      hatColor: 0x0284c7,
      characterType: 'guy'
    });
    this.player.position.set(0, 0, 5);
    this.scene.add(this.player);

    // Create Stack of 4 Cardboard Packages carried in hands
    this.packageRoot = new THREE.Group();
    this.packageRoot.position.set(0, 1.25, 0.55); // in front of chest
    this.player.add(this.packageRoot);

    const boxColors = [0xd97706, 0xb45309, 0xd97706, 0x92400e];
    const boxSizes = [
      [1.1, 0.55, 0.8],
      [0.95, 0.5, 0.75],
      [0.85, 0.45, 0.65],
      [0.7, 0.4, 0.55]
    ];

    let currentY = 0;
    for (let i = 0; i < 4; i++) {
      const [w, h, d] = boxSizes[i];
      const boxGeo = new THREE.BoxGeometry(w, h, d);
      const boxMat = new THREE.MeshStandardMaterial({ color: boxColors[i], roughness: 0.7 });
      const box = new THREE.Mesh(boxGeo, boxMat);
      box.position.y = currentY + h / 2;
      box.castShadow = true;
      this.packageRoot.add(box);
      this.packageStack.push(box);
      currentY += h + 0.04;
    }
  }

  // 3. Overlay HUD
  createHUD() {
    this.hudElement = document.createElement('div');
    this.hudElement.style.cssText = `
      position: absolute; top: 14px; left: 16px; right: 16px;
      display: flex; justify-content: space-between; align-items: center;
      pointer-events: none; z-index: 50; font-family: var(--font-heading, sans-serif);
    `;
    this.hudElement.innerHTML = `
      <div style="background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(8px); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); color: #fff;">
        <span style="color: var(--brand-coral, #ff5733); font-weight: 800;">📦 PACKAGES:</span>
        <span id="wobbly-pkg-count" style="font-weight: 800; font-size: 1.1rem; margin-left: 6px;">4 / 4</span>
      </div>
      <div style="background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(8px); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); color: #fff;">
        <span style="color: #ffd700; font-weight: 800;">⏱️ TIME:</span>
        <span id="wobbly-timer" style="font-weight: 800; font-size: 1.1rem; margin-left: 6px;">90s</span>
      </div>
      <div style="background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(8px); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); color: #fff;">
        <span style="color: #34d399; font-weight: 800;">⭐ SCORE:</span>
        <span id="wobbly-score" style="font-weight: 800; font-size: 1.1rem; margin-left: 6px;">0</span>
      </div>
    `;
    this.container.appendChild(this.hudElement);
  }

  // 4. Update Game Logic
  updateGame(delta) {
    if (this.state !== GameState.PLAYING) return;

    // Time limit countdown
    this.timeLeft -= delta;
    const timerElem = document.getElementById('wobbly-timer');
    if (timerElem) timerElem.textContent = `${Math.max(0, Math.ceil(this.timeLeft))}s`;

    if (this.timeLeft <= 0) {
      this.state = GameState.GAME_OVER;
      sounds.playGameOver();
      this.showGameOverCard({
        title: 'OUT OF TIME!',
        score: this.score,
        reason: 'The delivery window closed! Try again to deliver on time.'
      });
      return;
    }

    // Input & Horizontal Movement
    const input = this.getMovementInput();
    const isMoving = input.hasInput;

    if (this.isStumbling) {
      this.stumbleTimer -= delta;
      if (this.stumbleTimer <= 0) {
        this.isStumbling = false;
      }
      this.velocity.x *= 0.9;
      this.velocity.z *= 0.9;
    } else {
      // Accelerate towards input direction
      const targetVelX = input.x * this.moveSpeed;
      const targetVelZ = (input.z || 0) * this.moveSpeed;

      this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, targetVelX, 0.18);
      this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, targetVelZ, 0.18);

      // Rotate player to face movement direction
      if (Math.hypot(this.velocity.x, this.velocity.z) > 0.4) {
        const targetAngle = Math.atan2(this.velocity.x, this.velocity.z);
        this.player.rotation.y = THREE.MathUtils.lerp(this.player.rotation.y, targetAngle, 0.18);
      }

      // Jump
      if (input.isJump && this.isGrounded) {
        this.velocity.y = this.jumpForce;
        this.isGrounded = false;
        sounds.playJump();
        this.createParticleBurst(this.player.position, 6, 0xffffff, 0.15);
      }
    }

    // Gravity
    this.velocity.y -= this.gravity * delta;
    this.player.position.addScaledVector(this.velocity, delta);

    // Floor collision
    if (this.player.position.y <= 0) {
      this.player.position.y = 0;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    // Course boundaries
    this.player.position.x = THREE.MathUtils.clamp(this.player.position.x, -7.2, 7.2);

    // Dynamic Moving Barricades Update
    const time = this.getElapsedTime();
    for (const prop of this.dynamicProps) {
      if (prop.type === 'moving_barricade') {
        prop.group.position.x = Math.sin(time * prop.speed) * prop.range;

        // Collision with player
        const dist = prop.group.position.distanceTo(this.player.position);
        if (dist < 3.2 && Math.abs(this.player.position.z - prop.group.position.z) < 1.2) {
          this.triggerStumble(prop.group.position);
        }
      }
    }

    // Hydrant & Static Obstacles Collision
    for (const obs of this.obstacles) {
      const dist = obs.mesh.position.distanceTo(this.player.position);
      if (dist < obs.radius + 0.6) {
        this.triggerStumble(obs.mesh.position);
      }
    }

    // Coin Pickups
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      coin.rotation.z += delta * 4;
      if (coin.position.distanceTo(this.player.position) < 1.6) {
        this.score += 150;
        sounds.playCoin();
        this.createParticleBurst(coin.position, 12, 0xffd700, 0.22);
        this.scene.remove(coin);
        coin.geometry.dispose();
        coin.material.dispose();
        this.coins.splice(i, 1);
        const sElem = document.getElementById('wobbly-score');
        if (sElem) sElem.textContent = this.score;
      }
    }

    // Checkpoints Trigger
    for (const cp of this.checkpoints) {
      if (!cp.passed && this.player.position.z >= cp.z) {
        cp.passed = true;
        sounds.playMatch();
        this.createParticleBurst(new THREE.Vector3(0, 3, cp.z), 25, 0x3b82f6, 0.35);
        this.score += 500;
        const sElem = document.getElementById('wobbly-score');
        if (sElem) sElem.textContent = this.score;
      }
    }

    // Finish Zone Check
    if (this.player.position.z >= this.finishZone.z - 1.5) {
      this.triggerVictory();
      return;
    }

    // Dynamic Package Wobble Physics
    this.updatePackagePhysics(delta);

    // Procedural Character Animation
    const speedMagnitude = Math.hypot(this.velocity.x, this.velocity.z);
    this.updateCharacterAnimation(this.player, delta, isMoving, this.isGrounded, speedMagnitude / this.moveSpeed);

    // Smooth Camera Follow
    this.updateCameraFollow(this.player);
  }

  // 5. Package Wobble & Toppling Physics
  updatePackagePhysics(delta) {
    if (this.packageStack.length === 0) return;

    // Wobble inertia driven by horizontal acceleration
    const accelX = this.velocity.x * 0.12;
    const accelZ = this.velocity.z * 0.12;

    this.packageSway.velX += (-this.packageSway.angleX * 18 - accelX) * delta;
    this.packageSway.velZ += (-this.packageSway.angleZ * 18 - accelZ) * delta;

    this.packageSway.velX *= 0.88; // Damping
    this.packageSway.velZ *= 0.88;

    this.packageSway.angleX += this.packageSway.velX * delta;
    this.packageSway.angleZ += this.packageSway.velZ * delta;

    // Apply cumulative sway up the stack
    let cumulativeX = this.packageSway.angleX;
    let cumulativeZ = this.packageSway.angleZ;

    for (let i = 0; i < this.packageStack.length; i++) {
      const box = this.packageStack[i];
      box.rotation.z = cumulativeX * (1 + i * 0.35);
      box.rotation.x = cumulativeZ * (1 + i * 0.35);
      cumulativeX *= 1.2;
      cumulativeZ *= 1.2;
    }

    // Check if excessive wobble causes a package to topple off
    const maxTilt = 0.58;
    if (Math.hypot(this.packageSway.angleX, this.packageSway.angleZ) > maxTilt && this.packageStack.length > 1) {
      this.toppleTopPackage();
    }
  }

  toppleTopPackage() {
    if (this.packageStack.length <= 1) return;

    const droppedBox = this.packageStack.pop();
    this.packagesCarried--;
    sounds.playDrop();

    // Spawn falling physics prop in world
    const worldPos = new THREE.Vector3();
    droppedBox.getWorldPosition(worldPos);
    this.packageRoot.remove(droppedBox);

    droppedBox.position.copy(worldPos);
    this.scene.add(droppedBox);
    this.createParticleBurst(worldPos, 10, 0xd97706, 0.2);

    const countElem = document.getElementById('wobbly-pkg-count');
    if (countElem) countElem.textContent = `${this.packagesCarried} / 4`;
  }

  triggerStumble(impactPoint) {
    if (this.isStumbling) return;
    this.isStumbling = true;
    this.stumbleTimer = 0.7;

    sounds.playHit();
    this.createParticleBurst(this.player.position, 14, 0xef4444, 0.25);

    // Rebound velocity away from impact
    const dir = this.player.position.clone().sub(impactPoint).normalize();
    this.velocity.x = dir.x * 12;
    this.velocity.z = dir.z * 8;
    this.velocity.y = 6;
    this.isGrounded = false;

    // Topple one package on hard collision
    this.toppleTopPackage();
  }

  triggerVictory() {
    this.state = GameState.COMPLETED;
    sounds.playVictory();

    const packageBonus = this.packagesCarried * 1000;
    const timeBonus = Math.max(0, Math.round(this.timeLeft * 40));
    const finalScore = this.score + packageBonus + timeBonus;

    this.createParticleBurst(this.player.position, 40, 0x10b981, 0.4);

    this.showVictoryCard({
      title: 'SPECIAL DELIVERY SUCCESS!',
      score: finalScore,
      stats: [
        { label: 'Packages Delivered', value: `${this.packagesCarried} / 4` },
        { label: 'Time Remaining', value: `${Math.ceil(this.timeLeft)}s` },
        { label: 'Package Bonus', value: `+${packageBonus}` },
        { label: 'Speed Bonus', value: `+${timeBonus}` }
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
