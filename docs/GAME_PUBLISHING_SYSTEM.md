# GAMINGZONE — Database-Backed Game Publishing & Administration System

This document outlines the architecture, security guarantees, API specifications, and operational workflows of the GAMINGZONE dynamic game publishing system.

---

## 1. System Overview & Architecture

GAMINGZONE features a **production-ready, database-backed game publishing engine**. After website deployment, platform administrators can add new browser games, upload game ZIP builds or external game URLs, upload cover images and gameplay video previews, edit game details, and publish/unpublish games instantly **without changing application code, restarting servers, or redeploying the frontend**.

```
+-----------------------------------------------------------------------------------+
|                           GAMINGZONE CLIENT (React)                               |
|                                                                                   |
|  +---------------------------+             +-----------------------------------+  |
|  |  Public Visitor Feed      |             |  Admin Management Modal           |  |
|  |  - Only status='published'|             |  - Token Session Auth             |  |
|  |  - Hover Video Previews   |             |  - Add / Edit Game Forms          |  |
|  |  - Sandboxed Game Player  |             |  - 1-Click Status Toggles         |  |
|  +-------------^-------------+             +-----------------+-----------------+  |
+----------------|---------------------------------------------|--------------------+
                 | GET /api/games                              | POST/PUT/PATCH/DELETE
                 |                                             | Authorization: Bearer <token>
+----------------v---------------------------------------------v--------------------+
|                           EXPRESS & NODE BACKEND                                  |
|                                                                                   |
|  +---------------------------+             +-----------------------------------+  |
|  |  API Router (/api/games)  |             |  Admin Router (/api/admin/...)    |  |
|  +-------------+-------------+             +-----------------+-----------------+  |
|                |                                             |                    |
|                +----------------------+----------------------+                    |
|                                       |                                           |
|                +----------------------v----------------------+                    |
|                |  Upload Service (Security & Validation)     |                    |
|                |  - PK Zip Magic Byte Check                  |                    |
|                |  - Zip-Slip / Path Traversal Rejection      |                    |
|                |  - Executable (.php/.exe/.sh) Rejection     |                    |
|                |  - index.html Entry Point Enforcement       |                    |
|                |  - Video (.mp4/.webm) & Image Validation    |                    |
|                +----------------------+----------------------+                    |
+---------------------------------------|-------------------------------------------+
                                        |
           +----------------------------+----------------------------+
           |                                                         |
+----------v-----------+                                 +-----------v----------+
|  SQLite Database     |                                 |  Isolated Storage    |
|  (data/gamingzone.db)|                                 |  (uploads/)          |
|  - Games Metadata    |                                 |  - games/<slug>/v... |
|  - Admin Users       |                                 |  - previews/*.mp4    |
|  - Active Sessions   |                                 |  - thumbnails/*.svg  |
+----------------------+                                 +----------------------+
```

---

## 2. Security Implementations

1. **Server-Side Token Authentication (`server/services/authService.js`)**:
   - Privileged operations strictly require a valid cryptographically secure session token (`gz_adm_<64-hex>`) passed via `Authorization: Bearer <token>`.
   - Admin passwords and PINs are stored as PBKDF2 hashes (100,000 iterations, SHA-512) with unique cryptographic salts.
   - Client-side code contains **zero** hardcoded passwords.
2. **Untrusted Game Build Isolation (`server/services/uploadService.js`)**:
   - Uploaded archives are inspected in memory prior to disk extraction.
   - Files are extracted strictly into isolated runtime folders (`uploads/games/<slug>/v<version>/`), never inside source code directories (`src/`, `server/`, `js/`).
   - Strict Zip-Slip mitigation rejects any entry containing `..`, absolute Windows drive roots, null bytes, or leading slashes.
   - Executable, shell, and server-side script file extensions (`.exe`, `.bat`, `.cmd`, `.sh`, `.php`, `.py`, `.jsp`, `.asp`, `.dll`, `.ps1`, `.htaccess`, `.env`) are blocked with security violation errors.
3. **Restricted Sandboxed Iframe (`src/components/GamePlayer.jsx`)**:
   - Bundles and external game URLs are rendered in an isolated iframe with `sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms"`.
   - Restrictive Content Security Policy (CSP) is applied on the `/uploads/games` static mount:
     `Content-Security-Policy: default-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data:; ...`

---

## 3. Database Schema (`data/gamingzone.db`)

Table `games`:
| Column | Type | Description |
|---|---|---|
| `id` | `TEXT PRIMARY KEY` | Unique identifier (e.g. `game_a1b2c3d4e5f6`) |
| `slug` | `TEXT UNIQUE` | URL-safe slug for routing (e.g. `neon-hyper-drift`) |
| `title` | `TEXT NOT NULL` | Human-readable title |
| `description` | `TEXT` | Game synopsis |
| `category` | `TEXT NOT NULL` | Genre (e.g. `action`, `racing`, `puzzle`, etc.) |
| `tags` | `TEXT` | JSON array of search tags |
| `thumbnail` | `TEXT` | Cover image URL or SVG markup |
| `bundle_url` | `TEXT` | Relative path to extracted bundle root |
| `external_url` | `TEXT` | External embed URL (if external game) |
| `preview_video` | `TEXT` | Relative path to gameplay preview video (`.mp4`, `.webm`) |
| `entry_path` | `TEXT` | Entry point file (defaults to `index.html`) |
| `game_type` | `TEXT` | `builtin`, `bundle`, or `external` |
| `controls` | `TEXT` | Control instructions (e.g. `WASD to move, Space to jump`) |
| `instructions`| `TEXT` | Objective and gameplay guide |
| `version` | `TEXT` | Semantic version string |
| `status` | `TEXT` | `published`, `draft`, or `archived` |
| `is_featured` | `INTEGER` | `1` if highlighted in top featured grid |
| `is_trending` | `INTEGER` | `1` if listed in trending feeds |
| `is_new` | `INTEGER` | `1` if highlighted with new badge |
| `plays` | `INTEGER` | Live play count counter |
| `rating` | `REAL` | Rating (default 4.8 - 5.0) |

---

## 4. API Endpoints Reference

### Public APIs
- `GET /api/games`: Lists all `published` games with optional `?category=`, `?search=`, and `?sort=popular|newest|title`.
- `GET /api/games/:slug`: Retrieves single published game details.
- `POST /api/games/:slug/play`: Increments play counter for a game.

### Protected Admin APIs (`Authorization: Bearer <token>`)
- `POST /api/admin/auth/login`: Accepts `{ pin: "..." }` or `{ username: "...", password: "..." }`. Returns session token.
- `GET /api/admin/auth/verify`: Verifies current session token validity.
- `GET /api/admin/games`: Lists all games including drafts and archived items.
- `POST /api/admin/games/publish-with-assets`: Atomic multipart endpoint to create or update games with bundle ZIP, cover image, and preview video in a single request.
- `POST /api/admin/games/:id/upload`: Uploads and unpacks a replacement game bundle ZIP.
- `POST /api/admin/games/:id/thumbnail`: Uploads a replacement cover image.
- `POST /api/admin/games/:id/video`: Uploads a replacement gameplay hover video (`.mp4`, `.webm`).
- `PUT /api/admin/games/:id`: Updates game metadata (title, slug, category, controls, instructions, description, tags, external_url).
- `PATCH /api/admin/games/:id/status`: Toggles publication status between `published` and `draft`.
- `DELETE /api/admin/games/:id`: Permanently deletes a game from the registry.

---

## 5. Deployment Guidelines

For containerized or cloud deployments (Docker, AWS ECS, GCP Cloud Run, DigitalOcean, Render):
1. **Persistent Volume**: Mount a persistent volume at `uploads/` (`UPLOADS_DIR`) and `data/` (`DB_PATH`).
2. **Environment Variables**:
   - `PORT=8080`
   - `NODE_ENV=production`
   - `ADMIN_USERNAME=<your_admin_user>`
   - `ADMIN_PASSWORD=<strong_random_password>`
   - `JWT_SECRET=<strong_random_secret>`
   - `UPLOADS_DIR=/data/uploads`
   - `DB_PATH=/data/gamingzone.db`

