/**
 * utils/upload.js
 * Firebase Storage — persistent, CDN-backed image storage.
 * Files are saved to  <folder>/<uuid><ext>  in your Storage bucket
 * and served via a permanent public download URL (no expiry).
 *
 * Public URL shape:
 *   https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<encoded-path>?alt=media
 *
 * Drop-in replacement — uploadToFirebase / deleteFromFirebase signatures
 * are identical to the old local-disk version.
 */

const multer         = require('multer');
const path           = require('path');
const { v4: uuidv4 } = require('uuid');
const { storage }    = require('../config/firebase');   // admin.storage() instance

// ── Multer — keep memory storage (buffer passed straight to Firebase) ─────────
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|pdf/;
  const extOk   = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk  = allowed.test(file.mimetype);
  if (extOk && mimeOk) return cb(null, true);
  cb(new Error('Only image files (jpeg, jpg, png, gif, webp) and PDFs are allowed'));
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 },   // 5 MB
  fileFilter,
});

// ── Upload buffer → Firebase Storage, return permanent public URL ─────────────
const uploadToFirebase = async (buffer, originalname, mimetype, folder = 'uploads') => {
  const ext        = path.extname(originalname) || '.jpg';
  const filename   = `${uuidv4()}${ext}`;
  const storagePath = `${folder}/${filename}`;           // e.g. "products/abc-123.jpg"

  const bucket = storage.bucket();
  const file   = bucket.file(storagePath);

  await file.save(buffer, {
    metadata: {
      contentType: mimetype,
      cacheControl: 'public, max-age=31536000',          // 1-year CDN cache
    },
    public: true,                                        // make object world-readable
  });

  // Permanent public URL — no token, no expiry
  const encodedPath = encodeURIComponent(storagePath);
  const publicUrl   = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;

  return publicUrl;
};

// ── Delete file from Firebase Storage ────────────────────────────────────────
const deleteFromFirebase = async (url) => {
  try {
    if (!url || !url.includes('firebasestorage.googleapis.com')) return;

    // Extract the storage path from the URL
    // URL shape: .../o/<encoded-path>?alt=media
    const match = url.match(/\/o\/([^?]+)/);
    if (!match) return;

    const storagePath = decodeURIComponent(match[1]);
    await storage.bucket().file(storagePath).delete({ ignoreNotFound: true });
  } catch (_) {
    // silently ignore — file may already be gone
  }
};

module.exports = { upload, uploadToFirebase, deleteFromFirebase };