import express from 'express';
import { body, validationResult } from 'express-validator';
import Watchlist from '../models/Watchlist.js';
import { protect } from '../middleware/auth.js';
import { getMovieDetails } from '../utils/tmdb.js';

const router = express.Router();

// @route   GET /api/watchlist
// @desc    Get user's watchlist
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const watchlist = await Watchlist.find({ user: req.user._id })
      .sort({ addedAt: -1 })
      .populate('user', 'fullName username photo');

    res.json({
      success: true,
      count: watchlist.length,
      watchlist,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/watchlist
// @desc    Add movie to watchlist
// @access  Private
router.post(
  '/',
  protect,
  [
    body('movieId').isNumeric().withMessage('Movie ID is required'),
    body('movieTitle').notEmpty().withMessage('Movie title is required'),
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

      const { movieId, movieTitle, priority, notes } = req.body;

      // Check if already in watchlist
      const existing = await Watchlist.findOne({
        user: req.user._id,
        movieId: parseInt(movieId),
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Movie already in watchlist',
        });
      }

      // Get movie details from TMDB
      let movieDetails = {};
      try {
        const tmdbData = await getMovieDetails(movieId);
        movieDetails = {
          moviePoster: tmdbData.poster_path,
          movieBackdrop: tmdbData.backdrop_path,
          movieOverview: tmdbData.overview,
          movieReleaseDate: tmdbData.release_date ? new Date(tmdbData.release_date) : null,
          movieRating: tmdbData.vote_average,
        };
      } catch (error) {
        console.error('Error fetching movie details:', error);
      }

      const watchlistItem = await Watchlist.create({
        user: req.user._id,
        movieId: parseInt(movieId),
        movieTitle,
        priority: priority || 'medium',
        notes,
        ...movieDetails,
      });

      res.status(201).json({
        success: true,
        watchlistItem,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Movie already in watchlist',
        });
      }
      next(error);
    }
  }
);

// @route   DELETE /api/watchlist/movie/:movieId
// @desc    Remove movie from watchlist by movieId
// @access  Private
router.delete('/movie/:movieId', protect, async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const watchlistItem = await Watchlist.findOne({
      user: req.user._id,
      movieId: parseInt(movieId),
    });

    if (!watchlistItem) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found in watchlist',
      });
    }

    await watchlistItem.deleteOne();

    res.json({
      success: true,
      message: 'Movie removed from watchlist',
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/watchlist/:id
// @desc    Remove movie from watchlist by watchlist item ID
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const watchlistItem = await Watchlist.findById(req.params.id);

    if (!watchlistItem) {
      return res.status(404).json({
        success: false,
        message: 'Watchlist item not found',
      });
    }

    // Check ownership
    if (watchlistItem.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this item',
      });
    }

    await watchlistItem.deleteOne();

    res.json({
      success: true,
      message: 'Movie removed from watchlist',
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/watchlist/:id
// @desc    Update watchlist item
// @access  Private
router.put(
  '/:id',
  protect,
  [body('priority').optional().isIn(['low', 'medium', 'high'])],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { priority, notes } = req.body;
      const watchlistItem = await Watchlist.findById(req.params.id);

      if (!watchlistItem) {
        return res.status(404).json({
          success: false,
          message: 'Watchlist item not found',
        });
      }

      // Check ownership
      if (watchlistItem.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this item',
        });
      }

      if (priority) watchlistItem.priority = priority;
      if (notes !== undefined) watchlistItem.notes = notes;

      await watchlistItem.save();

      res.json({
        success: true,
        watchlistItem,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

