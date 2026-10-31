# 🎮 GAMINGZONE — Game Development & Publishing Guide

GAMINGZONE is an extensible, modular online browser gaming platform. You can develop any HTML5 game independently using vanilla JavaScript, Canvas, Phaser, Godot HTML5, Three.js, Construct, or PixiJS, package it as a ZIP archive, and publish it through the secure Admin Console without editing platform source code or rebuilding the website.

---

## 🏗️ 1. Game Architecture & Independence Principles

1. **Loosely Coupled**: Each game is an autonomous web application contained in its own folder.
2. **Self-Contained Assets**: All scripts, styles, sounds, and textures must use relative paths (e.g. `./assets/hero.png` or `assets/sound.mp3`, NOT `/assets/...`).
3. **Sandboxed Security**: The platform runs uploaded game bundles inside an isolated, sandboxed `<iframe>` (`sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms"` with `allow="fullscreen; autoplay"`).
   - Games cannot access parent platform cookies, admin tokens, or `localStorage`.
   - Games can use their own isolated `localStorage` or `sessionStorage` for local high scores and game settings.

---

## 📦 2. Standard Game Bundle Structure

Your game build must be packaged as a `.zip` archive with an `index.html` entry point at the root (or in a single top-level folder):

```
my-game.zip
├── index.html          # Required main entry point
├── game.js             # Game logic and loop
├── style.css           # Styling
└── assets/             # Textures, audio, fonts
    ├── sprites.png
    ├── music.mp3
    └── font.woff2
```

### ✅ Entry Point Checklist (`index.html`)
- Must contain responsive viewport meta tag:
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  ```
- Canvas or viewport should scale responsively to 100% width and height of the window.
- All `<script src="...">` and `<link href="...">` tags must use relative paths.
- Avoid absolute URLs (`/js/...`) that assume root hosting.

---

## 🚀 3. Step-by-Step Publishing Workflow

### Step 1: Develop & Test Standalone
Develop your game locally. Run a local server (e.g., `python -m http.server 3000` or `npx serve .`) and verify:
- Smooth 60 FPS gameplay on desktop and mobile touch devices.
- Keyboard controls (Arrow keys, WASD, Space) and touch/pointer controls.
- Audio synthesis or sound effects resume on user interaction.

### Step 2: Package the Build
Zip all game files into a standard `.zip` archive:
```bash
# On Windows PowerShell
Compress-Archive -Path ./my-game/* -DestinationPath ./my-game.zip

# On Linux / macOS
cd my-game && zip -r ../my-game.zip .
```

### Step 3: Access the Admin Console
1. Navigate to `http://localhost:8080/#admin` or click **Admin Dashboard** in the site footer.
2. Sign in with your administrator credentials:
   - **Username**: `admin`
   - **Password**: configured in `.env` (`ADMIN_PASSWORD`)

### Step 4: Create Game Entry
1. In the **Games Registry** tab, click **➕ Create New Game**.
2. Enter the game metadata:
   - **Title**: *Cosmic Galaxy Defender*
   - **URL Slug**: *cosmic-galaxy-defender* (auto-generated, URL-safe)
   - **Category**: *Arcade*
   - **Version**: *1.0.0*
   - **Tags**: *arcade, space, shooter, 2d*
   - **Description**: Short exciting overview of gameplay and objectives.
   - **Controls**: *Arrow keys to steer, Space to shoot, Touch on mobile*.
   - **Status**: Start as *Draft* (private) or *Published* (public).
   - **Featured**: Check if you want the game showcased in the homepage spotlight.

### Step 5: Upload ZIP Bundle
1. In the **Game Bundle Archive (ZIP)** section, choose your `.zip` archive.
2. Click **⬆️ Upload ZIP Bundle**.
3. The platform validates:
   - Valid ZIP magic bytes (`PK\x03\x04`).
   - Archive size limit (default 50 MB).
   - Zero path traversal attempts (`..` or escaping paths).
   - Zero prohibited server-side file types (`.php`, `.exe`, `.bat`, etc.).
   - Existence of `index.html`.
4. The verified bundle is unpacked into:
   `/uploads/games/<slug>/v<version>/`

### Step 6: Preview in Sandbox
1. In the Games Registry table, locate your game and click **👁️ Preview**.
2. An isolated sandboxed preview modal launches your game live.
3. Test audio, touch, keyboard controls, and game over loops.

### Step 7: Publish & Verify
1. If satisfied, toggle status to **🚀 Publish** (or select Published in Edit Game).
2. The game immediately appears in:
   - Public homepage featured highlights & curated shelves
   - Search results and category filters
   - Live URL: `http://localhost:8080/#game/cosmic-galaxy-defender`
   - Reusable Game Theater player with Fullscreen, Mute, and Related Games shelf.

---

## 🔄 4. Version Updates & Rollback

To update an existing game:
1. Open Admin Console -> Edit Game.
2. Increment the version (e.g. `1.1.0`).
3. Upload the new ZIP archive.
4. The previous version (`v1.0.0`) remains intact on disk at `/uploads/games/<slug>/v1.0.0/`.
5. The live database pointer immediately updates to the new version.
6. To roll back, simply set the version back to `1.0.0` and save.

