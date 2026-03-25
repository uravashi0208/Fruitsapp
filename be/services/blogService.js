/**
 * services/blogService.js — In-memory filter/sort, no composite indexes.
 */
const { v4: uuidv4 }     = require('uuid');
const { db, FieldValue } = require('../config/firebase');
const { AppError }       = require('../middleware/errorHandler');
const { deleteFromFirebase } = require('../utils/upload');

const COL = 'blogs';
const toMs = (v) => v?.toMillis ? v.toMillis() : new Date(v || 0).getTime();
const makeSlug = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const listPublishedBlogs = async ({ page = 1, limit = 10, tag = '', search = '' } = {}) => {
  const snap = await db.collection(COL).get();
  let posts  = snap.docs.map(d => d.data()).filter(p => p.status === 'published');
  if (tag)    posts = posts.filter(p => p.tags?.includes(tag));
  if (search) { const s = search.toLowerCase(); posts = posts.filter(p => p.title?.toLowerCase().includes(s) || p.excerpt?.toLowerCase().includes(s)); }
  posts.sort((a, b) => toMs(b.publishedAt || b.createdAt) - toMs(a.publishedAt || a.createdAt));
  const total = posts.length;
  const start = (page - 1) * Number(limit);
  return { posts: posts.slice(start, start + Number(limit)), total, page: Number(page), limit: Number(limit) };
};

const listAllBlogs = async ({ page = 1, limit = 20, status = '', search = '', tag = '' } = {}) => {
  const snap = await db.collection(COL).get();
  let posts  = snap.docs.map(d => d.data());
  if (status) posts = posts.filter(p => p.status === status);
  if (tag)    posts = posts.filter(p => p.tags?.includes(tag));
  if (search) { const s = search.toLowerCase(); posts = posts.filter(p => p.title?.toLowerCase().includes(s)); }
  posts.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
  const total = posts.length;
  const start = (page - 1) * Number(limit);
  return { posts: posts.slice(start, start + Number(limit)), total, page: Number(page), limit: Number(limit) };
};

const getBlog = async (idOrSlug) => {
  let snap = await db.collection(COL).doc(idOrSlug).get();
  if (snap.exists) return snap.data();
  const q = await db.collection(COL).where('slug', '==', idOrSlug).limit(1).get();
  if (!q.empty) return q.docs[0].data();
  throw new AppError('Blog post not found.', 404);
};

const getAllTags = async () => {
  const snap = await db.collection(COL).get();
  const tagSet = new Set();
  snap.docs.forEach(d => { if (d.data().status === 'published') (d.data().tags || []).forEach(t => tagSet.add(t)); });
  return Array.from(tagSet).sort();
};

const createBlog = async (data, coverUrl = '') => {
  const id   = uuidv4();
  const slug = data.slug || makeSlug(data.title);
  const tags = Array.isArray(data.tags) ? data.tags : (data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : []);
  const doc  = {
    id, title: data.title, slug, excerpt: data.excerpt || '', content: data.content || '',
    cover: coverUrl, tags, status: data.status || 'draft',
    author: data.author || data.authorName || 'Admin',
    authorName: data.author || data.authorName || 'Admin',
    category: data.category || '',
    views: 0,
    publishedAt: data.status === 'published' ? new Date().toISOString() : null,
    createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  };
  await db.collection(COL).doc(id).set(doc);
  return { ...doc, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
};

const updateBlog = async (id, data, newCoverUrl = null) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Blog post not found.', 404);
  const old    = snap.data();
  const update = { ...data, updatedAt: FieldValue.serverTimestamp() };
  if (data.tags && !Array.isArray(data.tags)) update.tags = data.tags.split(',').map(t => t.trim()).filter(Boolean);
  if (data.title && !data.slug) update.slug = makeSlug(data.title);
  if (data.status === 'published' && old.status !== 'published') update.publishedAt = new Date().toISOString();
  if (data.author) update.authorName = data.author;
  if (newCoverUrl) { if (old.cover) await deleteFromFirebase(old.cover).catch(()=>{}); update.cover = newCoverUrl; }
  await db.collection(COL).doc(id).update(update);
  return { ...old, ...update };
};

const deleteBlog = async (id) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Blog post not found.', 404);
  const b = snap.data();
  if (b.cover) await deleteFromFirebase(b.cover).catch(()=>{});
  await db.collection(COL).doc(id).delete();
};

module.exports = { listPublishedBlogs, listAllBlogs, getBlog, getAllTags, createBlog, updateBlog, deleteBlog };
