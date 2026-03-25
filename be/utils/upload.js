/**
 * utils/upload.js
 * Local-disk image storage (replaces Firebase Storage).
 * Files are saved to  <project-root>/uploads/<folder>/<uuid><ext>
 * and served statically at  GET /uploads/<folder>/<file>
 */

const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { v4: uuidv4 } = require('uuid');

// ── Root uploads directory ────────────────────────────────────
const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_ROOT)) fs.mkdirSync(UPLOADS_ROOT, { recursive: true });

// ── Multer — memory storage (same API as before) ──────────────
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|pdf/;
  const extOk   = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk  = allowed.test(file.mimetype);
  if (extOk && mimeOk) return cb(null, true);
  cb(new Error('Only image files (jpeg, jpg, png, gif, webp) and PDFs are allowed'));
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

// ── Save buffer to disk, return public URL ────────────────────
const uploadToFirebase = async (buffer, originalname, mimetype, folder = 'uploads') => {
  const dir = path.join(UPLOADS_ROOT, folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const ext      = path.extname(originalname) || '.jpg';
  const filename = `${uuidv4()}${ext}`;
  const filepath = path.join(dir, filename);

  fs.writeFileSync(filepath, buffer);

  // Return a URL the frontend can use — served by Express static middleware
  return `/uploads/${folder}/${filename}`;
};

// ── Delete file from disk ─────────────────────────────────────
const deleteFromFirebase = async (url) => {
  try {
    if (!url || !url.startsWith('/uploads/')) return;
    const filepath = path.join(__dirname, '..', url);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  } catch (_) {
    // silently ignore — file may already be gone
  }
};

module.exports = { upload, uploadToFirebase, deleteFromFirebase };
