/* ====================================================
   STACK TOWER BUILDER 3D — GAMINGZONE
   Precision 3D Isometric Block Slicing Physics:
   Real 3D Mesh Slicing, Overhang Trimming, Falling 3D Offcuts,
   Perfect Chord Combos, Smooth Rising Camera & Dynamic Rainbow Hues
   ==================================================== */

import * as THREE from 'three';
import { ThreeGameEngineBase } from '../core/ThreeGameEngineBase.js';
import { GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class StackTowerBuilderGame extends ThreeGameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, Object.assign({
      title: 'Stack Tower Builder 3D',
      fov: 45,
      clearColor: 0x0c1017,
      fogColor: 0x0c1017,
      fogNear: 25,
      fogFar: 90,
      shadows: true
    }, config));

    this.blockHeight = 1.0;
    this.stack = [];
    this.fallingBlocks = [];
    this.currentBlock = null;
    this.currentAxis = 'x'; // Alternates between 'x' and 'z'
    this.moveSpeed = 7.5;
    this.moveDirection = 1;
    this.moveBounds = 7.5;
    this.combo = 0;

    this.cameraTargetY = 4;
    this.cameraBaseOffset = new THREE.Vector3(12, 14, 12);

    if (this.isWebGLAvailable) {
      this.initWorld();
      this.resetGame();
      this.initControls();
      this.showStartCard({
        title: 'STACK TOWER BUILDER 3D',
        icon: '🏗️',
        objective: 'Stack 3D blocks as high as you can! Overhangs will be cleanly sliced off. Get perfect alignments to earn combo points and expand the base!',
        controls: 'Click / Tap Screen or press Spacebar to slice & place the moving block.'
      });
      this.startLoop();
    }
  }

  getBlockColor(index) {
    const hue = ((index * 13 + 190) % 360) / 360;
    const color = new THREE.Color().setHSL(hue, 0.85, 0.55);
    return color;
  }

  initWorld() {
    // 3D Floor Grid
    const gridHelper = new THREE.GridHelper(30, 30, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -0.01;
    this.scene.add(gridHelper);

    // Soft Studio Lighting
    if (this.camera) {
      this.camera.position.set(12, 14, 12);
      this.camera.lookAt(0, 2, 0);
    }
  }

  resetGame() {
    // Clear previous meshes
    for (const item of this.stack) {
      this.scene.remove(item.mesh);
      item.mesh.geometry.dispose();
      item.mesh.material.dispose();
    }
    for (const fb of this.fallingBlocks) {
      this.scene.remove(fb.mesh);
      fb.mesh.geometry.dispose();
      fb.mesh.material.dispose();
    }

    this.stack = [];
    this.fallingBlocks = [];
    this.score = 0;
    this.combo = 0;
    this.currentAxis = 'x';
    this.moveDirection = 1;

    // Foundation Base Block (4x4)
    const baseWidth = 4.2;
    const baseDepth = 4.2;
    const baseGeo = new THREE.BoxGeometry(baseWidth, this.blockHeight, baseDepth);
    const baseMat = new THREE.MeshStandardMaterial({
      color: this.getBlockColor(0),
      roughness: 0.35,
      metalness: 0.15
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.set(0, this.blockHeight / 2, 0);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    this.scene.add(baseMesh);

    this.stack.push({
      mesh: baseMesh,
      x: 0,
      z: 0,
      width: baseWidth,
      depth: baseDepth,
      y: this.blockHeight / 2
    });

    this.cameraTargetY = 3.5;
    this.spawnNextBlock();
  }

  spawnNextBlock() {
    const prev = this.stack[this.stack.length - 1];
    const index = this.stack.length;
    this.currentAxis = index % 2 === 1 ? 'x' : 'z';
    this.moveDirection = 1;

    const geo = new THREE.BoxGeometry(prev.width, this.blockHeight, prev.depth);
    const mat = new THREE.MeshStandardMaterial({
      color: this.getBlockColor(index),
      roughness: 0.3,
      metalness: 0.2
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const posY = prev.y + this.blockHeight;
    const startOffset = -this.moveBounds;

    if (this.currentAxis === 'x') {
      mesh.position.set(startOffset, posY, prev.z);
    } else {
      mesh.position.set(prev.x, posY, startOffset);
    }

    this.scene.add(mesh);

    this.currentBlock = {
      mesh,
      width: prev.width,
      depth: prev.depth,
      y: posY,
      axis: this.currentAxis
    };

    this.cameraTargetY = posY + 3.0;
  }

  initControls() {
    const handleAction = () => {
      if (this.state === GameState.MENU) {
        this.start();
        return;
      }
      if (this.state !== GameState.PLAYING) return;
      this.placeBlock();
    };

    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (e.code === 'Space' || e.key === ' ' || e.code === 'ArrowDown') {
        e.preventDefault();
        handleAction();
      }
    });

    if (this.canvas) {
      this.addEventListenerTracked(this.canvas, 'pointerdown', (e) => {
        e.preventDefault();
        handleAction();
      });
    }
  }

  placeBlock() {
    if (!this.currentBlock) return;

    const prev = this.stack[this.stack.length - 1];
    const curr = this.currentBlock;
    const currPos = curr.mesh.position;
    const tolerance = 0.14; // Perfect alignment threshold

    let isGameOver = false;

    if (curr.axis === 'x') {
      const diff = currPos.x - prev.x;
      const absDiff = Math.abs(diff);

      if (absDiff > curr.width) {
        // Complete miss!
        this.dropFullBlock(curr);
        isGameOver = true;
      } else if (absDiff <= tolerance) {
        // Perfect Chord Alignment!
        currPos.x = prev.x;
        this.combo++;
        this.score += 2 * this.combo;
        sounds.playCoin?.();
        this.createParticleBurst(currPos, 16, 0xffd166, 0.2);
        this.stack.push({
          mesh: curr.mesh,
          x: prev.x,
          z: currPos.z,
          width: curr.width,
          depth: curr.depth,
          y: curr.y
        });
      } else {
        // Slicing Calculation
        this.combo = 0;
        this.score += 1;
        sounds.playClick?.();

        const newWidth = curr.width - absDiff;
        const newX = prev.x + (diff / 2);

        // Update current placed block
        this.scene.remove(curr.mesh);
        curr.mesh.geometry.dispose();

        const placedGeo = new THREE.BoxGeometry(newWidth, this.blockHeight, curr.depth);
        const placedMesh = new THREE.Mesh(placedGeo, curr.mesh.material);
        placedMesh.position.set(newX, curr.y, currPos.z);
        placedMesh.castShadow = true;
        placedMesh.receiveShadow = true;
        this.scene.add(placedMesh);

        this.stack.push({
          mesh: placedMesh,
          x: newX,
          z: currPos.z,
          width: newWidth,
          depth: curr.depth,
          y: curr.y
        });

        // Create falling offcut block
        const cutWidth = absDiff;
        const cutX = diff > 0 ? (newX + (newWidth / 2) + (cutWidth / 2)) : (newX - (newWidth / 2) - (cutWidth / 2));
        this.createFallingSlice(cutWidth, this.blockHeight, curr.depth, cutX, curr.y, currPos.z, curr.mesh.material.color);
      }
    } else {
      // Z-axis movement
      const diff = currPos.z - prev.z;
      const absDiff = Math.abs(diff);

      if (absDiff > curr.depth) {
        // Complete miss!
        this.dropFullBlock(curr);
        isGameOver = true;
      } else if (absDiff <= tolerance) {
        // Perfect Alignment!
        currPos.z = prev.z;
        this.combo++;
        this.score += 2 * this.combo;
        sounds.playCoin?.();
        this.createParticleBurst(currPos, 16, 0xffd166, 0.2);
        this.stack.push({
          mesh: curr.mesh,
          x: currPos.x,
          z: prev.z,
          width: curr.width,
          depth: curr.depth,
          y: curr.y
        });
      } else {
        // Slicing Calculation
        this.combo = 0;
        this.score += 1;
        sounds.playClick?.();

        const newDepth = curr.depth - absDiff;
        const newZ = prev.z + (diff / 2);

        // Update current placed block
        this.scene.remove(curr.mesh);
        curr.mesh.geometry.dispose();

        const placedGeo = new THREE.BoxGeometry(curr.width, this.blockHeight, newDepth);
        const placedMesh = new THREE.Mesh(placedGeo, curr.mesh.material);
        placedMesh.position.set(currPos.x, curr.y, newZ);
        placedMesh.castShadow = true;
        placedMesh.receiveShadow = true;
        this.scene.add(placedMesh);

        this.stack.push({
          mesh: placedMesh,
          x: currPos.x,
          z: newZ,
          width: curr.width,
          depth: newDepth,
          y: curr.y
        });

        // Create falling offcut block
        const cutDepth = absDiff;
        const cutZ = diff > 0 ? (newZ + (newDepth / 2) + (cutDepth / 2)) : (newZ - (newDepth / 2) - (cutDepth / 2));
        this.createFallingSlice(curr.width, this.blockHeight, cutDepth, currPos.x, curr.y, cutZ, curr.mesh.material.color);
      }
    }

    this.currentBlock = null;

    if (isGameOver) {
      sounds.playThud?.();
      this.gameOver(this.score, { combo: this.combo, height: this.stack.length });
    } else {
      this.spawnNextBlock();
    }
  }

  createFallingSlice(w, h, d, x, y, z, color) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.4,
      metalness: 0.1
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    this.scene.add(mesh);

    this.fallingBlocks.push({
      mesh,
      vy: 0,
      rotX: (Math.random() - 0.5) * 4,
      rotZ: (Math.random() - 0.5) * 4
    });
  }

  dropFullBlock(curr) {
    this.fallingBlocks.push({
      mesh: curr.mesh,
      vy: 0,
      rotX: (Math.random() - 0.5) * 5,
      rotZ: (Math.random() - 0.5) * 5
    });
  }

  updateGame(delta) {
    // 1. Move Active Block
    if (this.currentBlock && this.state === GameState.PLAYING) {
      const pos = this.currentBlock.mesh.position;
      const speed = (this.moveSpeed + Math.min(this.stack.length * 0.15, 6)) * delta * this.moveDirection;

      if (this.currentBlock.axis === 'x') {
        pos.x += speed;
        if (Math.abs(pos.x) >= this.moveBounds) {
          this.moveDirection *= -1;
          pos.x = Math.sign(pos.x) * this.moveBounds;
        }
      } else {
        pos.z += speed;
        if (Math.abs(pos.z) >= this.moveBounds) {
          this.moveDirection *= -1;
          pos.z = Math.sign(pos.z) * this.moveBounds;
        }
      }
    }

    // 2. Physics for Falling Slices
    const gravity = 24 * delta;
    for (let i = this.fallingBlocks.length - 1; i >= 0; i--) {
      const fb = this.fallingBlocks[i];
      fb.vy -= gravity;
      fb.mesh.position.y += fb.vy * delta;
      fb.mesh.rotation.x += fb.rotX * delta;
      fb.mesh.rotation.z += fb.rotZ * delta;

      if (fb.mesh.position.y < -15) {
        this.scene.remove(fb.mesh);
        fb.mesh.geometry.dispose();
        fb.mesh.material.dispose();
        this.fallingBlocks.splice(i, 1);
      }
    }

    // 3. Smooth Rising Camera Tracking
    if (this.camera) {
      const targetLookY = this.cameraTargetY - 1.5;
      const desiredCamPos = new THREE.Vector3(
        this.cameraBaseOffset.x,
        targetLookY + this.cameraBaseOffset.y,
        this.cameraBaseOffset.z
      );

      this.camera.position.lerp(desiredCamPos, 0.05);
      this.camera.lookAt(0, targetLookY, 0);
    }
  }

  destroy() {
    this.stack.forEach(s => {
      if (s.mesh) {
        this.scene?.remove(s.mesh);
        s.mesh.geometry?.dispose();
        s.mesh.material?.dispose();
      }
    });
    this.fallingBlocks.forEach(fb => {
      if (fb.mesh) {
        this.scene?.remove(fb.mesh);
        fb.mesh.geometry?.dispose();
        fb.mesh.material?.dispose();
      }
    });
    super.destroy();
  }
}
