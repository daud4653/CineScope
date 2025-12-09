import express from 'express';
import { body, validationResult } from 'express-validator';
import Blog from '../models/Blog.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/blogs
// @desc    Get all blogs
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { category, tag, author, page = 1, limit = 10 } = req.query;
    const query = { isPublished: true };

    if (category) query.category = category;
    if (tag) query.tags = tag;
    if (author) query.author = author;

    const blogs = await Blog.find(query)
      .populate('author', 'fullName username photo')
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Blog.countDocuments(query);

    res.json({
      success: true,
      blogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/blogs/:slug
// @desc    Get blog by slug
// @access  Private
router.get('/:slug', protect, async (req, res, next) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug })
      .populate('author', 'fullName username photo bio')
      .populate('likes', 'fullName username')
      .populate('comments.user', 'fullName username photo');

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found',
      });
    }

    // Increment views
    blog.views += 1;
    await blog.save();

    res.json({
      success: true,
      blog,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/blogs
// @desc    Create a blog
// @access  Private
router.post(
  '/',
  protect,
  [
    body('title').notEmpty().withMessage('Blog title is required'),
    body('content').notEmpty().withMessage('Blog content is required'),
    body('category').optional().isIn(['Reviews', 'Trends', 'News', 'Analysis', 'Interviews', 'Other']),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { title, content, excerpt, coverImage, tags, category, isPublished } = req.body;

      const blog = await Blog.create({
        author: req.user._id,
        title,
        content,
        excerpt,
        coverImage,
        tags: Array.isArray(tags) ? tags : tags ? [tags] : [],
        category: category || 'Other',
        isPublished: isPublished !== false,
        publishedAt: isPublished !== false ? new Date() : null,
      });

      const populatedBlog = await Blog.findById(blog._id)
        .populate('author', 'fullName username photo');

      res.status(201).json({
        success: true,
        blog: populatedBlog,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   PUT /api/blogs/:id
// @desc    Update a blog
// @access  Private
router.put(
  '/:id',
  protect,
  [body('title').optional().notEmpty()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const blog = await Blog.findById(req.params.id);

      if (!blog) {
        return res.status(404).json({
          success: false,
          message: 'Blog not found',
        });
      }

      // Check ownership
      if (blog.author.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this blog',
        });
      }

      const { title, content, excerpt, coverImage, tags, category, isPublished } = req.body;
      if (title) blog.title = title;
      if (content) blog.content = content;
      if (excerpt) blog.excerpt = excerpt;
      if (coverImage) blog.coverImage = coverImage;
      if (tags) blog.tags = Array.isArray(tags) ? tags : [tags];
      if (category) blog.category = category;
      if (isPublished !== undefined) {
        blog.isPublished = isPublished;
        if (isPublished && !blog.publishedAt) {
          blog.publishedAt = new Date();
        }
      }

      await blog.save();

      const populatedBlog = await Blog.findById(blog._id)
        .populate('author', 'fullName username photo');

      res.json({
        success: true,
        blog: populatedBlog,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   DELETE /api/blogs/:id
// @desc    Delete a blog
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found',
      });
    }

    // Check ownership
    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this blog',
      });
    }

    await blog.deleteOne();

    res.json({
      success: true,
      message: 'Blog deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/blogs/:id/like
// @desc    Like/unlike a blog
// @access  Private
router.post('/:id/like', protect, async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found',
      });
    }

    const likeIndex = blog.likes.findIndex(
      (id) => id.toString() === req.user._id.toString()
    );

    if (likeIndex >= 0) {
      blog.likes.splice(likeIndex, 1);
    } else {
      blog.likes.push(req.user._id);
    }

    await blog.save();

    res.json({
      success: true,
      likes: blog.likes.length,
      isLiked: likeIndex < 0,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/blogs/:id/comment
// @desc    Add comment to blog
// @access  Private
router.post(
  '/:id/comment',
  protect,
  [body('content').notEmpty().withMessage('Comment content is required')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const blog = await Blog.findById(req.params.id);

      if (!blog) {
        return res.status(404).json({
          success: false,
          message: 'Blog not found',
        });
      }

      blog.comments.push({
        user: req.user._id,
        content: req.body.content,
      });

      await blog.save();

      const populatedBlog = await Blog.findById(blog._id)
        .populate('author', 'fullName username photo')
        .populate('comments.user', 'fullName username photo');

      res.json({
        success: true,
        blog: populatedBlog,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

