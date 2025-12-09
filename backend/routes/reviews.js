import express from 'express';
import { body, validationResult } from 'express-validator';
import Review from '../models/Review.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/reviews
// @desc    Get all reviews
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { movieId, userId, page = 1, limit = 10 } = req.query;
    const query = { isPublic: true };

    if (movieId) query.movieId = movieId;
    if (userId) query.user = userId;

    const reviews = await Review.find(query)
      .populate('user', 'fullName username photo')
      .populate('likes', 'fullName username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments(query);

    res.json({
      success: true,
      reviews,
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

// @route   POST /api/reviews
// @desc    Create a review
// @access  Private
router.post(
  '/',
  protect,
  [
    body('movieId').isNumeric().withMessage('Movie ID is required'),
    body('movieTitle').notEmpty().withMessage('Movie title is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('content').notEmpty().withMessage('Review content is required'),
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

      const { movieId, movieTitle, moviePoster, rating, title, content, isPublic } = req.body;

      const review = await Review.create({
        user: req.user._id,
        movieId,
        movieTitle,
        moviePoster,
        rating,
        title,
        content,
        isPublic: isPublic !== false,
      });

      const populatedReview = await Review.findById(review._id)
        .populate('user', 'fullName username photo');

      res.status(201).json({
        success: true,
        review: populatedReview,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'You have already reviewed this movie',
        });
      }
      next(error);
    }
  }
);

// @route   PUT /api/reviews/:id
// @desc    Update a review
// @access  Private
router.put(
  '/:id',
  protect,
  [
    body('rating').optional().isInt({ min: 1, max: 5 }),
    body('content').optional().notEmpty(),
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

      const review = await Review.findById(req.params.id);

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found',
        });
      }

      // Check ownership
      if (review.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this review',
        });
      }

      const { rating, title, content, isPublic } = req.body;
      if (rating) review.rating = rating;
      if (title) review.title = title;
      if (content) review.content = content;
      if (isPublic !== undefined) review.isPublic = isPublic;

      await review.save();

      const populatedReview = await Review.findById(review._id)
        .populate('user', 'fullName username photo');

      res.json({
        success: true,
        review: populatedReview,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   DELETE /api/reviews/:id
// @desc    Delete a review
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Check ownership
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review',
      });
    }

    await review.deleteOne();

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/reviews/:id/like
// @desc    Like/unlike a review
// @access  Private
router.post('/:id/like', protect, async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    const likeIndex = review.likes.findIndex(
      (id) => id.toString() === req.user._id.toString()
    );

    if (likeIndex >= 0) {
      // Unlike
      review.likes.splice(likeIndex, 1);
    } else {
      // Like
      review.likes.push(req.user._id);

      // Create notification if not own review
      if (review.user.toString() !== req.user._id.toString()) {
        await Notification.create({
          user: review.user,
          type: 'review_liked',
          title: 'Review Liked',
          message: `${req.user.fullName} liked your review of ${review.movieTitle}`,
          relatedUser: req.user._id,
          relatedReview: review._id,
        });
      }
    }

    await review.save();

    res.json({
      success: true,
      likes: review.likes.length,
      isLiked: likeIndex < 0,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/reviews/:id/comment
// @desc    Add comment to review
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

      const review = await Review.findById(req.params.id);

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found',
        });
      }

      review.comments.push({
        user: req.user._id,
        content: req.body.content,
      });

      await review.save();

      // Create notification if not own review
      if (review.user.toString() !== req.user._id.toString()) {
        await Notification.create({
          user: review.user,
          type: 'review_comment',
          title: 'New Comment',
          message: `${req.user.fullName} commented on your review`,
          relatedUser: req.user._id,
          relatedReview: review._id,
        });
      }

      const populatedReview = await Review.findById(review._id)
        .populate('user', 'fullName username photo')
        .populate('comments.user', 'fullName username photo');

      res.json({
        success: true,
        review: populatedReview,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

