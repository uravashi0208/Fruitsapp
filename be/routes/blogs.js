/**
 * routes/blogs.js
 *
 * PUBLIC:
 *   GET /api/blogs                  published posts (filter: tag, search, page)
 *   GET /api/blogs/tags             all unique tags
 *   GET /api/blogs/:idOrSlug        single post
 *
 * ADMIN:
 *   GET    /api/admin/blogs
 *   GET    /api/admin/blogs/:id
 *   POST   /api/admin/blogs          multipart: cover image
 *   PUT    /api/admin/blogs/:id
 *   DELETE /api/admin/blogs/:id
 */
const { Router }   = require('express');
const blogService  = require('../services/blogService');
const asyncHandler = require('../utils/asyncHandler');
const { success, created, paginated, noContent } = require('../utils/response');
const { authenticate, requireEditor }            = require('../middleware/auth');
const { upload, uploadToFirebase }               = require('../utils/upload');
const { blogSchema, paginationSchema, validate } = require('../validations/schemas');

const publicRouter = Router();

publicRouter.get('/tags', asyncHandler(async (req, res) => {
  success(res, await blogService.getAllTags());
}));

publicRouter.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, tag = '', search = '' } = req.query;
  const result = await blogService.listPublishedBlogs({ page: Number(page), limit: Number(limit), tag, search });
  paginated(res, result.posts, { page: result.page, limit: result.limit, total: result.total });
}));

publicRouter.get('/:idOrSlug', asyncHandler(async (req, res) => {
  success(res, await blogService.getBlog(req.params.idOrSlug));
}));

const adminRouter = Router();
adminRouter.use(authenticate, requireEditor);

adminRouter.get('/', asyncHandler(async (req, res) => {
  const q      = validate(paginationSchema, req.query);
  const result = await blogService.listAllBlogs({ ...q });
  paginated(res, result.posts, { page: result.page, limit: result.limit, total: result.total });
}));

adminRouter.get('/:id', asyncHandler(async (req, res) => {
  success(res, await blogService.getBlog(req.params.id));
}));

adminRouter.post('/', upload.single('cover'), asyncHandler(async (req, res) => {
  const data     = validate(blogSchema, req.body);
  let coverUrl   = '';
  if (req.file) coverUrl = await uploadToFirebase(req.file.buffer, req.file.originalname, req.file.mimetype, 'blogs');
  created(res, await blogService.createBlog(data, coverUrl), 'Blog post created');
}));

adminRouter.put('/:id', upload.single('cover'), asyncHandler(async (req, res) => {
  const data     = validate(blogSchema, req.body);
  let coverUrl   = null;
  if (req.file) coverUrl = await uploadToFirebase(req.file.buffer, req.file.originalname, req.file.mimetype, 'blogs');
  success(res, await blogService.updateBlog(req.params.id, data, coverUrl), 'Blog post updated');
}));


adminRouter.patch('/:id', asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (status && !['published', 'draft', 'archived'].includes(status))
    return res.status(422).json({ success: false, message: 'Invalid status.' });
  success(res, await blogService.updateBlog(req.params.id, req.body, null), 'Blog post updated');
}));

adminRouter.delete('/:id', asyncHandler(async (req, res) => {
  await blogService.deleteBlog(req.params.id);
  noContent(res, 'Blog post deleted');
}));

module.exports = { publicRouter, adminRouter };
