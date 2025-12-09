import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/profiles');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `profile-${req.user._id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  },
});

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    // Get reviews count
    const Review = (await import('../models/Review.js')).default;
    const reviewsCount = await Review.countDocuments({ userId: req.user._id });
    
    // Get friends count
    const Friend = (await import('../models/Friend.js')).default;
    const friendsCount = await Friend.countDocuments({
      $or: [
        { requester: req.user._id, status: 'accepted' },
        { recipient: req.user._id, status: 'accepted' },
      ],
    });
    
    const stats = {
      moviesWatched: user.watchHistory?.length || 0,
      reviewsWritten: reviewsCount,
      friends: friendsCount,
    };
    
    res.json({
      success: true,
      user,
      stats,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put(
  '/profile',
  protect,
  [
    body('fullName').optional().trim().notEmpty(),
    body('email').optional().isEmail(),
    body('bio').optional().isLength({ max: 500 }),
    body('favoriteGenres').optional(),
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

      const { fullName, email, bio, favoriteGenres, privacy } = req.body;
      const updateData = {};

      if (fullName) updateData.fullName = fullName;
      if (email) updateData.email = email;
      if (bio !== undefined) updateData.bio = bio;
      if (favoriteGenres) {
        try {
          updateData.favoriteGenres = Array.isArray(favoriteGenres) ? favoriteGenres : JSON.parse(favoriteGenres);
        } catch (e) {
          updateData.favoriteGenres = favoriteGenres;
        }
      }
      if (privacy) {
        try {
          updateData.privacy = typeof privacy === 'object' ? privacy : JSON.parse(privacy);
        } catch (e) {
          updateData.privacy = privacy;
        }
      }

      const user = await User.findByIdAndUpdate(req.user._id, updateData, {
        new: true,
        runValidators: true,
      });

      res.json({
        success: true,
        user,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/users/profile/photo
// @desc    Upload profile photo
// @access  Private
router.post(
  '/profile/photo',
  protect,
  upload.single('photo'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
      }

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { photo: `/uploads/profiles/${req.file.filename}` },
        { new: true }
      );

      res.json({
        success: true,
        user,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check privacy settings
    if (user.privacy.profileVisibility === 'private' && user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Profile is private',
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/users/watch-history
// @desc    Add to watch history
// @access  Private
router.post(
  '/watch-history',
  protect,
  [
    body('movieId').isNumeric().withMessage('Movie ID is required'),
    body('movieTitle').notEmpty().withMessage('Movie title is required'),
    body('progress').optional().isInt({ min: 0, max: 100 }),
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

      const { movieId, movieTitle, progress } = req.body;
      const user = await User.findById(req.user._id);

      // Check if already in history
      const existingIndex = user.watchHistory.findIndex(
        (item) => item.movieId === movieId
      );

      if (existingIndex >= 0) {
        // Update existing
        user.watchHistory[existingIndex].progress = progress || 100;
        user.watchHistory[existingIndex].watchedAt = new Date();
      } else {
        // Add new
        user.watchHistory.push({
          movieId,
          movieTitle,
          progress: progress || 100,
          watchedAt: new Date(),
        });
      }

      await user.save();

      res.json({
        success: true,
        watchHistory: user.watchHistory,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/users/rating
// @desc    Add or update movie rating
// @access  Private
router.post(
  '/rating',
  protect,
  [
    body('movieId').isNumeric().withMessage('Movie ID is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
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

      const { movieId, rating } = req.body;
      const user = await User.findById(req.user._id);

      // Check if rating exists
      const existingIndex = user.ratings.findIndex((r) => r.movieId === movieId);

      if (existingIndex >= 0) {
        // Update existing
        user.ratings[existingIndex].rating = rating;
        user.ratings[existingIndex].createdAt = new Date();
      } else {
        // Add new
        user.ratings.push({
          movieId,
          rating,
          createdAt: new Date(),
        });
      }

      await user.save();

      res.json({
        success: true,
        ratings: user.ratings,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

