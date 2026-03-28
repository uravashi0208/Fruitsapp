/**
 * utils/upload.js  ← REPLACED: now uses Cloudinary (free tier) instead of Firebase Storage
 * Cloudinary — free-tier image storage (25 GB bandwidth/month).
 * Drop-in replacement: uploadToFirebase / deleteFromFirebase signatures unchanged.
 *
 * Required env vars (add on Render → Environment):
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 *
 * Get values from https://cloudinary.com → Dashboard (free account).
 */

const multer         = require('multer');
const path           = require('path');
const { v4: uuidv4 } = require('uuid');
const cloudinary     = require('cloudinary').v2;

// ── Configure Cloudinary ──────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

// ── Multer — keep files in memory (buffer passed straight to Cloudinary) ──────
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const extOk   = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk  = allowed.test(file.mimetype);
  if (extOk && mimeOk) return cb(null, true);
  cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed'));
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 },   // 5 MB
  fileFilter,
});

// ── Upload buffer → Cloudinary, return permanent public URL ──────────────────
const uploadToCloudinary = (buffer, folder = 'uploads') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder:        folder,       // organises in Cloudinary Media Library
        unique_filename: true,
        overwrite:     false,
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) return reject(new Error(`Cloudinary upload failed: ${error.message}`));
        resolve(result.secure_url);  // permanent HTTPS URL, no expiry
      }
    );
    stream.end(buffer);
  });
};

// ── Public API — same names as before so NO other file needs to change ────────
const uploadToFirebase = (buffer, originalname, mimetype, folder = 'uploads') =>
  uploadToCloudinary(buffer, folder);

// ── Delete image from Cloudinary ──────────────────────────────────────────────
const deleteFromFirebase = async (url) => {
  try {
    if (!url) return;
    if (url.includes('res.cloudinary.com')) {
      // Extract public_id: strip version segment and file extension
      // URL shape: https://res.cloudinary.com/<cloud>/image/upload/v123/<folder>/<id>.<ext>
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i);
      if (match) {
        await cloudinary.uploader.destroy(match[1], { resource_type: 'image' });
      }
    }
    // Old Firebase Storage URLs are silently skipped
  } catch (_) { /* silently ignore */ }
};

module.exports = { upload, uploadToFirebase, deleteFromFirebase };
