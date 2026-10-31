# 🎮 GAMINGZONE — 3D & 2D Web Gaming Platform

A modern, high-performance browser gaming platform featuring 100+ playable games, interactive 3D WebGL experiences, responsive single-file casual games, an integrated database-backed game publishing system, and automated level generation.

Live Production URL: [https://game-ten-iota-67.vercel.app](https://game-ten-iota-67.vercel.app)

---

## 🌟 Featured Games Spotlight

- **🏏 Cricket Champions Kids** (`/cricket_champions_kids.html`)
  - Full-featured, child-friendly cartoon cricket game with 3D coin toss, shot timing meter, batting/bowling controls, live scoreboard, Web Audio API sound synthesis, and Day/Night stadium themes.
- **🏹 Arrow Escape** (`/arrow_escape.html`)
  - Minimalist zen path puzzle inspired by tap-to-slide arrow games. Features 100+ reverse-constructed solvable levels, undo, hint system, lives mechanic, multiple color palettes, and daily challenge.
- **🏎️ Traffic Racer** (`/traffic_racer.html`)
  - High-octane highway racing game with Canvas 2D pseudo-3D perspective road engine, 10 original tuneable cars, Endless, Career (30 stages), Time Trial, and Free Drive modes.
- **⚡ Neon Laser Reflector & 3D Action Games**
  - WebGL / Three.js and Canvas physics games with deterministic level generators and responsive touch/keyboard controls.

---

## 🚀 Key Features

- **Extensive Game Catalog**: Over 100+ games categorized across 3D, Cricket, Arcade, Action, Racing, Sports, and Puzzle.
- **Autonomous Level Engine**: Deterministic seed-based procedural level generation across multiple game genres, ensuring infinite non-repeating progression.
- **Self-Contained Offline Play**: Standalone single-file HTML5 games that run offline without external dependencies or heavy asset bundles.
- **Full-Stack Admin Publishing System**: Database-backed administration panel for uploading ZIP game bundles, managing drafts, publishing, and real-time edits without site redeploys.
- **Security-First Architecture**: Path traversal detection, executable rejection, PBKDF2 with SHA-512 authentication, and sanitized archive extraction.
- **Audio Synthesizer Engine**: 100% procedural sound effects and dynamic music powered by the Web Audio API (no external MP3/WAV assets required).

---

## 🛠️ Tech Stack

- **Frontend**: Vite, Vanilla Modern JavaScript (ES Modules), Three.js / Canvas 2D / SVG, CSS3 Glassmorphism.
- **Backend**: Node.js, Express, SQLite (`node:sqlite` DatabaseSync) with WAL mode.
- **Deployment**: Vercel Serverless Functions (`api/index.js`) with `/tmp` SQLite persistence and dynamic static routing.
- **Testing**: Automated QA test suite covering platform security, level adapters, duplicate detection, and game lifecycles.

---

## 📦 Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher recommended)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/gamingzone.git

# Navigate to project directory
cd gamingzone

# Install dependencies
npm install
```

### Running Locally

```bash
# Start Vite development server
npm run dev

# Or start the full production server
npm start
```

Visit `http://localhost:8080` (or the port specified in console) in your web browser.

### Running Tests

```bash
npm test
```

---

## 🌐 Deployment to Vercel

The project is preconfigured for zero-config deployment to Vercel:

```bash
npx vercel --prod
```

Configuration files:
- `vercel.json`: Handles build commands, output directory, and API rewrites.
- `api/index.js`: Serverless entry point for backend APIs.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
