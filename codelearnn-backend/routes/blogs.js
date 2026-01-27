const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getBlogs,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog,
  toggleLike,
  getMyBlogs,
  getCategories
} = require('../controllers/blogController');

// Public routes
router.get('/', getBlogs);
router.get('/categories', getCategories);
router.get('/:slug', getBlogBySlug);

// Protected routes
router.post('/', protect, createBlog);
router.get('/user/my-blogs', protect, getMyBlogs);
router.put('/:id', protect, updateBlog);
router.delete('/:id', protect, deleteBlog);
router.post('/:id/like', protect, toggleLike);

module.exports = router;
