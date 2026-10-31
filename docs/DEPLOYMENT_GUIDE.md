# 🚀 GAMINGZONE — Production Deployment & Operations Guide

This guide describes how to deploy GAMINGZONE to public production environments (VPS, Cloud Instances, Docker, Railway, Render, DigitalOcean, AWS, etc.).

---

## 📋 1. Prerequisites

- **Node.js**: v22.x or v24.x LTS
- **Storage**: Persistent volume/disk mounted at `/data` and `/uploads`
- **Reverse Proxy**: Nginx, Caddy, Cloudflare, or AWS ALB handling SSL/TLS

---

## ⚙️ 2. Environment Variables

Configure environment variables in your hosting dashboard or `.env` file:

| Variable | Description | Example / Recommended |
|---|---|---|
| `PORT` | HTTP port the server listens on | `8080` or `3000` |
| `NODE_ENV` | Runtime environment | `production` |
| `ADMIN_USERNAME` | Master administrator username | `superadmin` |
| `ADMIN_PASSWORD` | Strong administrative password | `GenerateAStrongSecretPassword!` |
| `JWT_SECRET` | Cryptographic session signing secret | `64+ char random hex string` |
| `MAX_UPLOAD_SIZE_MB` | Maximum ZIP archive size in megabytes | `50` (or `100`) |
| `DB_PATH` | Path to persistent SQLite database | `data/gamingzone.db` |
| `UPLOADS_DIR` | Path to persistent game builds and thumbnails | `uploads` |

---

## 💾 3. Persistent Volumes

GAMINGZONE stores:
1. **Database**: `data/gamingzone.db` (SQLite with WAL mode)
2. **Game Builds**: `uploads/games/<slug>/v<version>/`
3. **Thumbnails**: `uploads/thumbnails/`

Ensure your container or server mounts persistent volumes for `./data` and `./uploads` so game updates survive restarts and container redeploys.

---

## 🛠️ 4. Deployment Methods

### Method A: PM2 on Ubuntu / Debian VPS

```bash
# 1. Clone repository
git clone https://github.com/your-username/gamingzone.git /var/www/gamingzone
cd /var/www/gamingzone

# 2. Install dependencies
npm ci --omit=dev

# 3. Create production .env
cp .env.example .env
nano .env

# 4. Run automated test suite
npm test

# 5. Start with PM2
npm install -g pm2
pm2 start server/server.js --name "gamingzone-platform"
pm2 save
pm2 startup
```

---

### Method B: Docker & Docker Compose

Create a `Dockerfile`:
```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN mkdir -p data uploads/games uploads/thumbnails
VOLUME ["/app/data", "/app/uploads"]
EXPOSE 8080
CMD ["node", "server/server.js"]
```

And `docker-compose.yml`:
```yaml
version: '3.8'
services:
  gamingzone:
    build: .
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - PORT=8080
      - NODE_ENV=production
      - ADMIN_USERNAME=admin
      - ADMIN_PASSWORD=your_production_password_here
      - JWT_SECRET=random_64_character_crypto_key
      - MAX_UPLOAD_SIZE_MB=50
    volumes:
      - gamingzone_data:/app/data
      - gamingzone_uploads:/app/uploads

volumes:
  gamingzone_data:
  gamingzone_uploads:
```

---

## 🔒 5. Nginx Reverse Proxy & SSL Configuration

```nginx
server {
    server_name gamingzone.example.com;

    client_max_body_size 60M; # Matches MAX_UPLOAD_SIZE_MB

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/gamingzone.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gamingzone.example.com/privkey.pem;
}
```

---

## 🛡️ 6. Security & Sandboxing Architecture

1. **Sandboxed Iframes**:
   Uploaded games execute inside an iframe configured with:
   `sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms"` and `allow="fullscreen; autoplay"`.
   Games cannot navigate top-level frames, access administrator sessions, or compromise the host portal.
2. **Path Traversal Shield**:
   Every uploaded ZIP entry is analyzed before extraction; any entry with `..`, absolute paths, or special characters is rejected.
3. **Executable Quarantine**:
   Server-side scripts (`.php`, `.sh`, `.exe`, `.py`, `.jsp`, etc.) are blocked during upload inspection.
4. **Rate Limiting & Admin Auth**:
   All `/api/admin/*` administrative endpoints require valid cryptographic bearer tokens issued by `/api/admin/auth/login`.

