/* ====================================================
   HELIX JUMP NEON 3D — GAMINGZONE
   High-Performance 3D Cylindrical Neon Tower Physics:
   Rotating 3D Spiral Disc Platforms, Squash-and-Stretch Ball Physics,
   Hazard Death Sectors, Fireball Smash Mode & Dynamic Paint Splatters
   ==================================================== */

import * as THREE from 'three';
import { ThreeGameEngineBase } from '../core/ThreeGameEngineBase.js';
import { GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class HelixJumpNeonGame extends ThreeGameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, Object.assign({
      title: 'Helix Jump Neon 3D',
      fov: 55,
      clearColor: 0x090c13,
      fogColor: 0x090c13,
      fogNear: 20,
      fogFar: 80,
      shadows: true
    }, config));

    this.towerGroup = null;
    this.pillarMesh = null;
    this.floors = [];
    this.splatters = [];

    // Ball Physics
    this.ball = null;
    this.ballY = 4.0;
    this.ballVy = 0;
    this.gravity = 28;
    this.bounceForce = 10.5;
    this.comboCount = 0;
    this.isFireball = false;

    // Tower Rotation State
    this.towerRotation = 0;
    this.targetRotation = 0;
    this.isDragging = false;
    this.lastPointerX = 0;

    this.cameraTargetY = 4.0;
    this.tierHeight = 4.2;
    this.totalTiers = 25;

    if (this.isWebGLAvailable) {
      this.initWorld();
      this.initTower();
      this.initControls();
      this.showStartCard({
        title: 'HELIX JUMP NEON 3D',
        icon: '🌀',
        objective: 'Rotate the 3D tower to drop the bouncing ball through the gaps! Avoid red hazard sectors. Drop 3+ floors to unleash Fireball Smash!',
        controls: 'Drag mouse / swipe screen or use A / D / Arrow Keys to rotate the tower.'
      });
      this.startLoop();
    }
  }

  initWorld() {
    this.towerGroup = new THREE.Group();
    this.scene.add(this.towerGroup);

    // Camera Setup
    if (this.camera) {
      this.camera.position.set(0, 7, 13);
      this.camera.lookAt(0, 4, 0);
    }
  }

  initTower() {
    // 1. Central Cylinder Pillar
    const pillarHeight = this.totalTiers * this.tierHeight + 10;
    const pillarGeo = new THREE.CylinderGeometry(1.2, 1.2, pillarHeight, 24);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.3,
      metalness: 0.8
    });
    this.pillarMesh = new THREE.Mesh(pillarGeo, pillarMat);
    this.pillarMesh.position.y = -pillarHeight / 2 + 10;
    this.pillarMesh.receiveShadow = true;
    this.towerGroup.add(this.pillarMesh);

    // 2. Generate Ring Platforms
    const innerRadius = 1.25;
    const outerRadius = 4.4;
    const sectorCount = 8; // 8 segments per ring (45 deg each)

    for (let i = 0; i < this.totalTiers; i++) {
      const tierY = -i * this.tierHeight;
      const tierGroup = new THREE.Group();
      tierGroup.position.y = tierY;

      // Decide gap and hazards
      const gapIndex = Math.floor(Math.random() * sectorCount);
      const hazardCount = Math.min(Math.floor(i / 5) + 1, 3);
      const hazardIndices = new Set();
      while (hazardIndices.size < hazardCount) {
        const rand = Math.floor(Math.random() * sectorCount);
        if (rand !== gapIndex) hazardIndices.add(rand);
      }

      const sectors = [];

      for (let s = 0; s < sectorCount; s++) {
        if (s === gapIndex) continue; // Gap where ball falls

        const isHazard = hazardIndices.has(s);
        const startAngle = (s / sectorCount) * Math.PI * 2;
        const arcLength = (1 / sectorCount) * Math.PI * 2 - 0.05;

        // Create curved platform sector
        const sectorGeo = new THREE.CylinderGeometry(
          outerRadius, outerRadius, 0.4, 8, 1, false, startAngle, arcLength
        );
        const sectorMat = new THREE.MeshStandardMaterial({
          color: isHazard ? 0xef4444 : (i % 2 === 0 ? 0x06b6d4 : 0x8b5cf6),
          emissive: isHazard ? 0x991b1b : 0x000000,
          emissiveIntensity: isHazard ? 0.4 : 0,
          roughness: 0.4,
          metalness: 0.2
        });

        const sectorMesh = new THREE.Mesh(sectorGeo, sectorMat);
        sectorMesh.castShadow = true;
        sectorMesh.receiveShadow = true;
        tierGroup.add(sectorMesh);

        sectors.push({
          mesh: sectorMesh,
          startAngle,
          endAngle: startAngle + arcLength,
          isHazard
        });
      }

      this.towerGroup.add(tierGroup);
      this.floors.push({
        y: tierY,
        group: tierGroup,
        gapIndex,
        sectors
      });
    }

    // 3. Bouncing Ball (At position x=0, z=2.8)
    const ballGeo = new THREE.SphereGeometry(0.35, 18, 16);
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.3,
      roughness: 0.2,
      metalness: 0.4
    });
    this.ball = new THREE.Mesh(ballGeo, ballMat);
    this.ball.position.set(0, 4.0, 2.8);
    this.ball.castShadow = true;
    this.scene.add(this.ball);
  }

  initControls() {
    // Mouse / Touch Drag to Rotate
    const onPointerDown = (e) => {
      if (this.state === GameState.MENU) {
        this.start();
        return;
      }
      this.isDragging = true;
      this.lastPointerX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    };

    const onPointerMove = (e) => {
      if (!this.isDragging) return;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const deltaX = clientX - this.lastPointerX;
      this.lastPointerX = clientX;
      this.targetRotation += deltaX * 0.008;
    };

    const onPointerUp = () => {
      this.isDragging = false;
    };

    if (this.canvas) {
      this.addEventListenerTracked(this.canvas, 'pointerdown', onPointerDown);
      this.addEventListenerTracked(window, 'pointermove', onPointerMove);
      this.addEventListenerTracked(window, 'pointerup', onPointerUp);
    }

    // Keyboard rotation
    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (this.state === GameState.MENU) {
        this.start();
        return;
      }
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        this.targetRotation += 0.14;
      } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        this.targetRotation -= 0.14;
      }
    });
  }

  updateGame(delta) {
    if (this.state !== GameState.PLAYING) return;

    // 1. Smooth Tower Rotation
    this.towerRotation = THREE.MathUtils.lerp(this.towerRotation, this.targetRotation, 0.2);
    if (this.towerGroup) {
      this.towerGroup.rotation.y = this.towerRotation;
    }

    // 2. Ball Gravity & Fall Physics
    this.ballVy -= this.gravity * delta;
    this.ballY += this.ballVy * delta;

    // Check collision against tower floors
    const ballAngle = (Math.atan2(this.ball.position.x, this.ball.position.z) - this.towerRotation) % (Math.PI * 2);
    const normalizedAngle = (ballAngle + Math.PI * 2) % (Math.PI * 2);

    for (let i = 0; i < this.floors.length; i++) {
      const floor = this.floors[i];
      const floorTop = floor.y + 0.2;

      // Check if ball intersects platform plane
      if (this.ballY <= floorTop + 0.35 && this.ballY >= floorTop - 0.4 && this.ballVy <= 0) {
        // Find which sector the ball is above
        let hitSector = null;
        for (const sec of floor.sectors) {
          if (normalizedAngle >= sec.startAngle && normalizedAngle <= sec.endAngle) {
            hitSector = sec;
            break;
          }
        }

        if (hitSector) {
          if (this.isFireball) {
            // Smashes through platform!
            sounds.playThud?.();
            this.createParticleBurst(this.ball.position, 20, 0xf97316, 0.3);
            this.scene.remove(hitSector.mesh);
            hitSector.mesh.geometry.dispose();
            floor.sectors = floor.sectors.filter(s => s !== hitSector);
            this.score += 25;
            this.isFireball = false;
            this.ballVy = -2.0; // Continue downward
          } else if (hitSector.isHazard) {
            // Hit hazard zone!
            sounds.playGameOver?.();
            this.createParticleBurst(this.ball.position, 25, 0xef4444, 0.4);
            this.gameOver(this.score, { floor: i + 1 });
            return;
          } else {
            // Safe bounce
            this.ballY = floorTop + 0.35;
            this.ballVy = this.bounceForce;
            sounds.playClick?.();

            // Squash effect
            this.ball.scale.set(1.3, 0.7, 1.3);

            // Add paint splatter
            this.addPaintSplatter(floor.group, this.ball.position);

            this.comboCount = 0;
            this.isFireball = false;
            this.ball.material.emissive.setHex(0xd97706);
          }
        } else {
          // Ball is in the gap! Dropping through floor!
          this.comboCount++;
          this.score += 5 * this.comboCount;
          sounds.playCoin?.();

          if (this.comboCount >= 3) {
            this.isFireball = true;
            this.ball.material.emissive.setHex(0xef4444);
            this.ball.material.emissiveIntensity = 0.8;
          }
        }
      }
    }

    // Ball Recovery from squash
    this.ball.scale.lerp(new THREE.Vector3(1, 1, 1), 0.15);
    this.ball.position.y = this.ballY;

    // Check Victory (Reached Bottom)
    const bottomY = -this.totalTiers * this.tierHeight;
    if (this.ballY <= bottomY + 2) {
      sounds.playLevelUp?.();
      this.victory({ score: this.score + 500 });
      return;
    }

    // 3. Camera Tracking (Follows downward)
    if (this.camera) {
      this.cameraTargetY = THREE.MathUtils.lerp(this.cameraTargetY, this.ballY, 0.08);
      this.camera.position.y = this.cameraTargetY + 3.0;
      this.camera.lookAt(0, this.cameraTargetY, 0);
    }
  }

  addPaintSplatter(tierGroup, worldPos) {
    const geo = new THREE.CircleGeometry(0.45, 12);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.85
    });
    const splat = new THREE.Mesh(geo, mat);
    splat.position.set(0, 0.22, 2.8);
    tierGroup.add(splat);
    this.splatters.push(splat);
  }

  destroy() {
    this.floors.forEach(f => {
      f.sectors.forEach(s => {
        s.mesh.geometry?.dispose();
        s.mesh.material?.dispose();
      });
    });
    this.splatters.forEach(s => {
      s.geometry?.dispose();
      s.material?.dispose();
    });
    if (this.ball) {
      this.ball.geometry?.dispose();
      this.ball.material?.dispose();
    }
    super.destroy();
  }
}
