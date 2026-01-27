const BlogPost = require('../models/BlogPost');

// @desc    Get all published blog posts
// @route   GET /api/blogs
// @access  Public
exports.getBlogs = async (req, res) => {
  try {
    const { 
      category, 
      search, 
      tag, 
      author,
      page = 1, 
      limit = 12,
      sort = '-publishedAt'
    } = req.query;

    // Build query
    const query = { status: 'published' };

    if (category) {
      query.category = category;
    }

    if (tag) {
      query.tags = { $in: [tag] };
    }

    if (author) {
      query.author = author;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const blogs = await BlogPost.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'name avatarUrl avatarIndex');

    const total = await BlogPost.countDocuments(query);

    res.status(200).json({
      success: true,
      data: blogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching blogs'
    });
  }
};

// @desc    Get single blog by slug or ID
// @route   GET /api/blogs/:slug
// @access  Public
exports.getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Try to find by slug first, then by ID
    let blog = await BlogPost.findOne({ slug, status: 'published' })
      .populate('author', 'name avatarUrl avatarIndex');
    
    if (!blog && slug.match(/^[0-9a-fA-F]{24}$/)) {
      blog = await BlogPost.findOne({ _id: slug, status: 'published' })
        .populate('author', 'name avatarUrl avatarIndex');
    }

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Increment view count
    blog.views += 1;
    await blog.save();

    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error('Get blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching blog'
    });
  }
};

// @desc    Create a new blog post
// @route   POST /api/blogs
// @access  Private
exports.createBlog = async (req, res) => {
  try {
    const { title, content, category, coverImage, tags, status } = req.body;

    const blog = await BlogPost.create({
      title,
      content,
      category: category || 'technology',
      coverImage: coverImage || '',
      tags: tags || [],
      status: status || 'published',
      author: req.user.id
    });

    await blog.populate('author', 'name avatarUrl avatarIndex');

    res.status(201).json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating blog'
    });
  }
};

// @desc    Update a blog post
// @route   PUT /api/blogs/:id
// @access  Private (author only)
exports.updateBlog = async (req, res) => {
  try {
    let blog = await BlogPost.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Check ownership
    if (blog.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this blog'
      });
    }

    const { title, content, category, coverImage, tags, status } = req.body;

    blog.title = title || blog.title;
    blog.content = content || blog.content;
    blog.category = category || blog.category;
    blog.coverImage = coverImage !== undefined ? coverImage : blog.coverImage;
    blog.tags = tags || blog.tags;
    blog.status = status || blog.status;

    await blog.save();
    await blog.populate('author', 'name avatarUrl avatarIndex');

    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error('Update blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating blog'
    });
  }
};

// @desc    Delete a blog post
// @route   DELETE /api/blogs/:id
// @access  Private (author only)
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await BlogPost.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Check ownership
    if (blog.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this blog'
      });
    }

    await blog.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting blog'
    });
  }
};

// @desc    Toggle like on a blog
// @route   POST /api/blogs/:id/like
// @access  Private
exports.toggleLike = async (req, res) => {
  try {
    const blog = await BlogPost.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    const userId = req.user.id;
    const likeIndex = blog.likes.indexOf(userId);

    if (likeIndex > -1) {
      // Unlike
      blog.likes.splice(likeIndex, 1);
    } else {
      // Like
      blog.likes.push(userId);
    }

    await blog.save();

    res.status(200).json({
      success: true,
      data: {
        liked: likeIndex === -1,
        likeCount: blog.likes.length
      }
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error toggling like'
    });
  }
};

// @desc    Get user's own blogs (including drafts)
// @route   GET /api/blogs/my-blogs
// @access  Private
exports.getMyBlogs = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = { author: req.user.id };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const blogs = await BlogPost.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'name avatarUrl avatarIndex');

    const total = await BlogPost.countDocuments(query);

    res.status(200).json({
      success: true,
      data: blogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get my blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching blogs'
    });
  }
};

// @desc    Get all categories with counts
// @route   GET /api/blogs/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const categories = await BlogPost.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: categories.map(c => ({
        name: c._id,
        count: c.count
      }))
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching categories'
    });
  }
};
