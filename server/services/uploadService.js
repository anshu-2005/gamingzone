import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { config } from '../config.js';

const DISALLOWED_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.bash', '.zsh',
  '.php', '.phtml', '.php3', '.php4', '.php5', '.phps',
  '.cgi', '.pl', '.py', '.pyc', '.rb',
  '.asp', '.aspx', '.jsp', '.jspx',
  '.dll', '.so', '.dylib', '.bin',
  '.vbs', '.ps1', '.hta', '.jar',
  '.htaccess', '.htpasswd', '.env'
]);

const MAX_TOTAL_UNCOMPRESSED_BYTES = 250 * 1024 * 1024; // 250 MB
const MAX_ENTRIES_COUNT = 2500;

/**
 * Validate and Extract Game ZIP Archive
 */
export async function processGameZip({ fileBuffer, slug, version }) {
  if (!fileBuffer || fileBuffer.length < 4) {
    throw new Error('Invalid file: Empty or incomplete upload.');
  }

  // 1. Magic bytes check (PK\x03\x04)
  if (
    fileBuffer[0] !== 0x50 ||
    fileBuffer[1] !== 0x4B ||
    fileBuffer[2] !== 0x03 ||
    fileBuffer[3] !== 0x04
  ) {
    throw new Error('Invalid archive format: File is not a valid ZIP archive.');
  }

  // 2. Size limit check
  const maxBytes = config.maxUploadSizeMb * 1024 * 1024;
  if (fileBuffer.length > maxBytes) {
    throw new Error(`Archive exceeds maximum allowed size of ${config.maxUploadSizeMb} MB.`);
  }

  // 3. Parse ZIP archive
  let zip;
  try {
    zip = new AdmZip(fileBuffer);
  } catch (err) {
    throw new Error('Corrupted ZIP archive: ' + err.message);
  }

  const entries = zip.getEntries();
  if (entries.length === 0) {
    throw new Error('ZIP archive is empty.');
  }

  if (entries.length > MAX_ENTRIES_COUNT) {
    throw new Error(`Archive contains too many entries (Limit: ${MAX_ENTRIES_COUNT}).`);
  }

  // 4. Validate all entries (Zip-Slip and Disallowed extensions)
  let totalUncompressed = 0;
  let hasIndexHtml = false;
  let singleTopLevelDir = null;

  // Detect if archive has a single wrapping directory
  const topLevelNames = new Set();

  for (const entry of entries) {
    const rawName = entry.entryName;

    // Reject Path Traversal
    if (
      rawName.includes('..') ||
      rawName.includes('\0') ||
      rawName.startsWith('/') ||
      rawName.startsWith('\\') ||
      /^[a-zA-Z]:/.test(rawName)
    ) {
      throw new Error(`Security Violation: Unsafe path detected in archive: "${rawName}"`);
    }

    // Check size limit for zip-bomb protection
    totalUncompressed += entry.header.size;
    if (totalUncompressed > MAX_TOTAL_UNCOMPRESSED_BYTES) {
      throw new Error('Security Violation: Uncompressed size exceeds maximum safety limit (Zip bomb protection).');
    }

    if (!entry.isDirectory) {
      const ext = path.extname(rawName).toLowerCase();
      if (DISALLOWED_EXTENSIONS.has(ext)) {
        throw new Error(`Security Violation: Executable or server-side file type "${ext}" is not permitted: "${rawName}"`);
      }

      const basename = path.basename(rawName).toLowerCase();
      if (basename === 'index.html') {
        hasIndexHtml = true;
      }
    }

    const firstSegment = rawName.split(/[\/\\]/)[0];
    if (firstSegment) topLevelNames.add(firstSegment);
  }

  if (!hasIndexHtml) {
    throw new Error('Invalid game bundle: Archive must contain an "index.html" entry point.');
  }

  // Determine target directory
  const safeSlug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const safeVersion = (version || '1.0.0').replace(/[^a-z0-9._-]/gi, '');
  const targetDir = path.join(config.gamesUploadDir, safeSlug, `v${safeVersion}`);

  // Create clean target directory
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  fs.mkdirSync(targetDir, { recursive: true });

  // 5. Extract safely entry by entry
  // Check if we need to unwrap a single root directory
  const firstDir = topLevelNames.size === 1 ? Array.from(topLevelNames)[0] : null;
  const isWrapped = firstDir && entries.every(e => e.entryName.startsWith(firstDir + '/') || e.entryName === firstDir);

  for (const entry of entries) {
    let relativePath = entry.entryName;
    if (isWrapped && relativePath.startsWith(firstDir + '/')) {
      relativePath = relativePath.substring(firstDir.length + 1);
    } else if (isWrapped && relativePath === firstDir) {
      continue;
    }

    if (!relativePath) continue;

    const fullPath = path.resolve(targetDir, relativePath);
    if (!fullPath.startsWith(targetDir)) {
      throw new Error(`Security Violation: Target path escaping destination directory: "${relativePath}"`);
    }

    if (entry.isDirectory) {
      fs.mkdirSync(fullPath, { recursive: true });
    } else {
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, entry.getData());
    }
  }

  // 6. Final verification of index.html in targetDir
  const entryFilePath = path.join(targetDir, 'index.html');
  if (!fs.existsSync(entryFilePath)) {
    throw new Error('Verification failed: index.html could not be located at the root of the extracted bundle.');
  }

  const bundleUrl = `/uploads/games/${safeSlug}/v${safeVersion}/`;

  return {
    success: true,
    bundleUrl,
    entryPath: 'index.html',
    version: safeVersion,
    extractedFiles: entries.filter(e => !e.isDirectory).length,
    uncompressedSize: totalUncompressed
  };
}

/**
 * Save Uploaded Thumbnail Image
 */
export function saveThumbnailFile({ fileBuffer, originalName, slug, version }) {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error('Thumbnail file is empty.');
  }

  const ext = path.extname(originalName || '').toLowerCase();
  const allowed = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg']);
  if (!allowed.has(ext)) {
    throw new Error(`Invalid image type. Allowed: ${Array.from(allowed).join(', ')}`);
  }

  if (fileBuffer.length > 5 * 1024 * 1024) {
    throw new Error('Thumbnail exceeds maximum limit of 5 MB.');
  }

  const safeSlug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const filename = `${safeSlug}-v${version || '1.0.0'}-${Date.now()}${ext}`;
  const targetPath = path.join(config.thumbnailsUploadDir, filename);

  fs.mkdirSync(config.thumbnailsUploadDir, { recursive: true });
  fs.writeFileSync(targetPath, fileBuffer);

  return `/uploads/thumbnails/${filename}`;
}

/**
 * Save Uploaded Gameplay Preview Video (.mp4 / .webm)
 */
export function savePreviewVideoFile({ fileBuffer, originalName, slug, version }) {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error('Video file is empty.');
  }

  const ext = path.extname(originalName || '').toLowerCase();
  const allowed = new Set(['.mp4', '.webm', '.ogv']);
  if (!allowed.has(ext)) {
    throw new Error(`Invalid video format "${ext}". Allowed formats: ${Array.from(allowed).join(', ')}`);
  }

  const maxVideoBytes = 25 * 1024 * 1024; // 25 MB
  if (fileBuffer.length > maxVideoBytes) {
    throw new Error('Gameplay preview video exceeds maximum limit of 25 MB.');
  }

  const safeSlug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const filename = `${safeSlug}-preview-${Date.now()}${ext}`;
  const targetPath = path.join(config.previewsUploadDir, filename);

  fs.mkdirSync(config.previewsUploadDir, { recursive: true });
  fs.writeFileSync(targetPath, fileBuffer);

  return `/uploads/previews/${filename}`;
}


