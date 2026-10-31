/* ====================================================
   RUN 3 TUNNEL GRAVITY 3D — GAMINGZONE
   High-Performance 3D Rotating Deep-Space Tunnel Platformer:
   Full 3D Polygonal Octagonal Tube, Wall-Running Gravity Shifts,
   Cosmic Void Tile Hazards, Alien Runner Leaps & Endless Starfields
   ==================================================== */

import * as THREE from 'three';
import { ThreeGameEngineBase } from '../core/ThreeGameEngineBase.js';
import { GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class RunTunnelGravityGame extends ThreeGameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, Object.assign({
      title: 'Run 3 Tunnel Gravity 3D',
      fov: 65,
      clearColor: 0x050811,
      fogColor: 0x050811,
      fogNear: 30,
      fogFar: 140,
      shadows: true
    }, config));

    this.tunnelRadius = 5.2;
    this.wallCount = 8; // Octagonal tunnel
    this.segmentLength = 6.0;
    this.totalSegments = 24;
    this.tunnelSegments = [];

    // Player State
    this.playerMesh = null;
    this.playerY = -this.tunnelRadius + 0.8;
    this.playerVy = 0;
    this.isJumping = false;
    this.jumpForce = 13.5;
    this.gravity = 32;

    // Tunnel Steering & Rotation
    this.tunnelRotation = 0;
    this.targetRotation = 0;
    this.turnSpeed = 3.6;

    this.runSpeed = 16.0;
    this.distance = 0;
    this.speed = 16.0;

    if (this.isWebGLAvailable) {
      this.initWorld();
      this.initPlayer();
      this.initControls();
      this.showStartCard({
        title: 'RUN 3 TUNNEL GRAVITY 3D',
        icon: '🌌',
        objective: 'Run through the endless space tunnel! Steer A/D or Left/Right to rotate the entire tube and avoid missing floor tiles! Jump over gaps with Spacebar.',
        controls: 'A / D or Arrow Keys to rotate tunnel • SPACE / Up Arrow to Jump.'
      });
      this.startLoop();
    }
  }

  initWorld() {
    // Starfield Background Particles
    const starCount = 300;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 160;
      starPos[i + 1] = (Math.random() - 0.5) * 160;
      starPos[i + 2] = (Math.random() - 0.5) * 200;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.8 });
    this.stars = new THREE.Points(starGeo, starMat);
    this.scene.add(this.stars);

    // Camera inside tunnel
    if (this.camera) {
      this.camera.position.set(0, -this.tunnelRadius + 3.2, 5.5);
      this.camera.lookAt(0, -this.tunnelRadius + 2.0, -25);
    }

    // Tunnel Ring Generation
    for (let z = 0; z < this.totalSegments; z++) {
      this.spawnTunnelRing(-z * this.segmentLength, z < 4);
    }
  }

  spawnTunnelRing(zPos, isSafe = false) {
    const ringGroup = new THREE.Group();
    ringGroup.position.z = zPos;

    const angleStep = (Math.PI * 2) / this.wallCount;
    const wallWidth = 2 * this.tunnelRadius * Math.tan(Math.PI / this.wallCount) * 1.05;
    const walls = [];

    // Pick 1-2 void gaps if not safe intro
    const gapIndex = isSafe ? -1 : Math.floor(Math.random() * this.wallCount);

    for (let w = 0; w < this.wallCount; w++) {
      if (w === gapIndex) continue; // Gap / cosmic void tile!

      const angle = w * angleStep;
      const wallGeo = new THREE.BoxGeometry(wallWidth, 0.35, this.segmentLength);
      const isAlt = (Math.floor(zPos / this.segmentLength) + w) % 2 === 0;
      const wallMat = new THREE.MeshStandardMaterial({
        color: isAlt ? 0x1e293b : 0x0f172a,
        roughness: 0.5,
        metalness: 0.3
      });

      const wallMesh = new THREE.Mesh(wallGeo, wallMat);
      wallMesh.position.set(
        Math.sin(angle) * this.tunnelRadius,
        -Math.cos(angle) * this.tunnelRadius,
        0
      );
      wallMesh.rotation.z = angle;
      wallMesh.receiveShadow = true;
      ringGroup.add(wallMesh);

      // Glowing Neon Rail Strip
      const railGeo = new THREE.BoxGeometry(0.12, 0.08, this.segmentLength);
      const railMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(wallWidth / 2, 0.2, 0);
      wallMesh.add(rail);

      walls.push({ mesh: wallMesh, angle, wallIdx: w });
    }

    this.scene.add(ringGroup);
    this.tunnelSegments.push({
      group: ringGroup,
      z: zPos,
      gapIndex,
      walls
    });
  }

  initPlayer() {
    // Stylized Little Space Alien Runner
    const alienGroup = new THREE.Group();

    // Body
    const bodyGeo = new THREE.SphereGeometry(0.45, 12, 10);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.4 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.6;
    alienGroup.add(body);

    // Large Cyclops Eye
    const eyeGeo = new THREE.SphereGeometry(0.18, 10, 10);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(0, 0.65, -0.35);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshBasicMaterial({ color: 0x06b6d4 }));
    pupil.position.set(0, 0, -0.12);
    eye.add(pupil);
    alienGroup.add(eye);

    // Running antenna
    const antGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 6);
    const ant = new THREE.Mesh(antGeo, bodyMat);
    ant.position.set(0, 1.1, 0);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
    tip.position.set(0, 0.2, 0);
    ant.add(tip);
    alienGroup.add(ant);

    alienGroup.position.set(0, -this.tunnelRadius + 0.4, 0);
    this.playerMesh = alienGroup;
    this.scene.add(alienGroup);
  }

  initControls() {
    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (this.state === GameState.MENU) {
        this.start();
        return;
      }
      if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
        e.preventDefault();
        this.jump();
      }
    });

    if (this.canvas) {
      this.addEventListenerTracked(this.canvas, 'pointerdown', (e) => {
        if (this.state === GameState.MENU) {
          this.start();
          return;
        }
        this.jump();
      });
    }
  }

  jump() {
    if (!this.isJumping) {
      this.isJumping = true;
      this.playerVy = this.jumpForce;
      sounds.playThud?.();
    }
  }

  updateGame(delta) {
    if (this.state !== GameState.PLAYING) return;

    // 1. Steering & Tunnel Rotation
    let steer = 0;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) steer += 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) steer -= 1;

    // Virtual Touch Vector Blend
    if (Math.abs(this.touchVector.x) > 0.05) {
      steer = -this.touchVector.x;
    }

    this.targetRotation += steer * this.turnSpeed * delta;
    this.tunnelRotation = THREE.MathUtils.lerp(this.tunnelRotation, this.targetRotation, 0.15);

    // 2. Player Jump & Gravity
    if (this.isJumping) {
      this.playerVy -= this.gravity * delta;
      this.playerY += this.playerVy * delta;

      const floorY = -this.tunnelRadius + 0.4;
      if (this.playerY <= floorY) {
        this.playerY = floorY;
        this.playerVy = 0;
        this.isJumping = false;
      }
    } else {
      this.playerY = -this.tunnelRadius + 0.4;
    }

    if (this.playerMesh) {
      this.playerMesh.position.y = this.playerY;
      // Slight running bob
      if (!this.isJumping) {
        this.playerMesh.position.y += Math.sin(this.distance * 0.8) * 0.08;
      }
    }

    // 3. Move Tunnel Segments Towards Player (Endless Runner)
    const moveZ = this.runSpeed * delta;
    this.distance += moveZ;
    this.score = Math.floor(this.distance);

    // Identify current active floor wall directly under player (bottom center)
    const normalizedRot = ((-this.tunnelRotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const bottomWallIdx = Math.floor((normalizedRot / (Math.PI * 2)) * this.wallCount) % this.wallCount;

    for (let i = 0; i < this.tunnelSegments.length; i++) {
      const seg = this.tunnelSegments[i];
      seg.z += moveZ;
      seg.group.position.z = seg.z;
      seg.group.rotation.z = this.tunnelRotation;

      // Check collision if segment is right at player position (z around 0)
      if (seg.z >= -1.0 && seg.z <= 2.5 && !this.isJumping) {
        if (seg.gapIndex === bottomWallIdx) {
          // Fell through cosmic gap!
          sounds.playGameOver?.();
          this.createParticleBurst(this.playerMesh.position, 30, 0xa855f7, 0.4);
          this.gameOver(this.score, { distance: this.score });
          return;
        }
      }

      // Recycle segment to the far end
      if (seg.z > this.segmentLength * 2) {
        const furthestZ = Math.min(...this.tunnelSegments.map(s => s.z));
        seg.z = furthestZ - this.segmentLength;
        seg.group.position.z = seg.z;

        // Reposition gap
        seg.gapIndex = Math.floor(Math.random() * this.wallCount);
        seg.walls.forEach(w => {
          w.mesh.visible = w.wallIdx !== seg.gapIndex;
        });
      }
    }
  }

  destroy() {
    this.tunnelSegments.forEach(seg => {
      seg.walls.forEach(w => {
        w.mesh.geometry?.dispose();
        w.mesh.material?.dispose();
      });
      this.scene?.remove(seg.group);
    });
    if (this.playerMesh) {
      this.playerMesh.traverse(obj => {
        obj.geometry?.dispose();
        obj.material?.dispose();
      });
      this.scene?.remove(this.playerMesh);
    }
    if (this.stars) {
      this.stars.geometry?.dispose();
      this.stars.material?.dispose();
      this.scene?.remove(this.stars);
    }
    super.destroy();
  }
}
