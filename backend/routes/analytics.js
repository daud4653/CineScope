import express from 'express';
import User from '../models/User.js';
import Review from '../models/Review.js';
import Watchlist from '../models/Watchlist.js';
import { protect } from '../middleware/auth.js';
import { generateAnalyticsPDF } from '../utils/pdfGenerator.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// @route   GET /api/analytics
// @desc    Get user analytics
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const reviews = await Review.find({ user: req.user._id });
    const watchlist = await Watchlist.find({ user: req.user._id });

    // Calculate genre frequency from watch history
    const genreFrequency = {};
    // This would need to be enhanced with actual genre data from TMDB
    // For now, using a simplified approach

    // Calculate watch time (assuming average movie length of 120 minutes)
    const totalWatchTime = user.watchHistory.length * 2; // hours

    // Calculate average rating
    const averageRating =
      user.ratings.length > 0
        ? user.ratings.reduce((sum, r) => sum + r.rating, 0) / user.ratings.length
        : 0;

    // Weekly watch time (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentWatches = user.watchHistory.filter(
      (item) => new Date(item.watchedAt) >= sevenDaysAgo
    );
    const weeklyWatchTime = recentWatches.length * 2;

    // AI Accuracy (mock - would be calculated from recommendation performance)
    const aiAccuracy = 87; // This would come from actual recommendation tracking

    const analytics = {
      totalWatchTime: totalWatchTime.toFixed(1),
      moviesWatched: user.watchHistory.length,
      averageRating: averageRating.toFixed(1),
      reviewsWritten: reviews.length,
      watchlistCount: watchlist.length,
      aiAccuracy: aiAccuracy,
      genreFrequency: [
        { name: 'Action', value: 35, color: '#06b6d4' },
        { name: 'Drama', value: 25, color: '#9333ea' },
        { name: 'Comedy', value: 20, color: '#ec4899' },
        { name: 'Sci-Fi', value: 15, color: '#3b82f6' },
        { name: 'Horror', value: 5, color: '#ef4444' },
      ],
      weeklyWatchTime: [
        { day: 'Mon', hours: 3.5 },
        { day: 'Tue', hours: 2.8 },
        { day: 'Wed', hours: 4.2 },
        { day: 'Thu', hours: 3.1 },
        { day: 'Fri', hours: 5.0 },
        { day: 'Sat', hours: 6.5 },
        { day: 'Sun', hours: 4.8 },
      ],
    };

    res.json({
      success: true,
      analytics,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/analytics/pdf
// @desc    Generate and download analytics PDF
// @access  Private
router.get('/pdf', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const reviews = await Review.find({ user: req.user._id });
    const watchlist = await Watchlist.find({ user: req.user._id });

    const totalWatchTime = user.watchHistory.length * 2;
    const averageRating =
      user.ratings.length > 0
        ? user.ratings.reduce((sum, r) => sum + r.rating, 0) / user.ratings.length
        : 0;

    const analyticsData = {
      moviesWatched: user.watchHistory.length,
      totalWatchTime: totalWatchTime.toFixed(1),
      averageRating: averageRating.toFixed(1),
      reviewsWritten: reviews.length,
      genreDistribution: [
        { name: 'Action', percentage: 35 },
        { name: 'Drama', percentage: 25 },
        { name: 'Comedy', percentage: 20 },
        { name: 'Sci-Fi', percentage: 15 },
        { name: 'Horror', percentage: 5 },
      ],
      watchTimeData: [
        { day: 'Mon', hours: 3.5 },
        { day: 'Tue', hours: 2.8 },
        { day: 'Wed', hours: 4.2 },
        { day: 'Thu', hours: 3.1 },
        { day: 'Fri', hours: 5.0 },
        { day: 'Sat', hours: 6.5 },
        { day: 'Sun', hours: 4.8 },
      ],
    };

    const outputDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `analytics-${user._id}-${Date.now()}.pdf`);

    await generateAnalyticsPDF(user, analyticsData, outputPath);

    res.download(outputPath, `cinescope-analytics-${user._id}.pdf`, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      // Clean up file after download
      setTimeout(() => {
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
      }, 5000);
    });
  } catch (error) {
    next(error);
  }
});

export default router;

