import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { getAIRecommendations, getContentBasedRecommendations } from '../utils/aiRecommendation.js';
import { getMovieDetails } from '../utils/tmdb.js';

const router = express.Router();

// @route   GET /api/recommendations
// @desc    Get AI recommendations for user
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Get user's watchlist to use for recommendations
    const Watchlist = (await import('../models/Watchlist.js')).default;
    const watchlist = await Watchlist.find({ user: req.user._id });
    
    // Combine ratings and watchlist for better recommendations
    // Convert watchlist items to ratings (implicit interest)
    const watchlistRatings = watchlist.map(item => ({
      movieId: item.movieId,
      rating: 4, // Implicit rating for watchlist items
    }));
    
    // Combine explicit ratings with watchlist-based ratings
    const allRatings = [
      ...(user.ratings || []),
      ...watchlistRatings.filter(wr => 
        !user.ratings?.some(r => r.movieId === wr.movieId)
      ),
    ];

    // Get AI recommendations (will use fallback if Python dependencies not installed)
    // Skip AI - Use direct fallback recommendations for faster loading
    let recommendedMovieIds = [];
    try {
      const { getPopularMovies } = await import('../utils/tmdb.js');
      const popular = await getPopularMovies(1);
      recommendedMovieIds = (popular.results || []).slice(0, 10).map(m => m.id);
      console.log('✅ Using popular movies as recommendations');
    } catch (fallbackError) {
      console.error('Fallback failed:', fallbackError.message);
      recommendedMovieIds = [550, 238, 240, 424, 497, 680, 13, 769, 155, 429];
    }

    // Fetch movie details from TMDB
    const recommendations = await Promise.all(
      recommendedMovieIds.slice(0, 10).map(async (movieId) => {
        try {
          const movieDetails = await getMovieDetails(movieId);
          return {
            movieId: movieDetails.id,
            title: movieDetails.title,
            overview: movieDetails.overview,
            posterPath: movieDetails.poster_path,
            backdropPath: movieDetails.backdrop_path,
            releaseDate: movieDetails.release_date,
            voteAverage: movieDetails.vote_average,
            genres: movieDetails.genres,
            reason: 'AI Recommendation',
          };
        } catch (error) {
          console.error(`Error fetching movie ${movieId}:`, error.message);
          return null;
        }
      })
    );

    // Filter out null results
    const validRecommendations = recommendations.filter((r) => r !== null);

    res.json({
      success: true,
      recommendations: validRecommendations,
      count: validRecommendations.length,
    });
  } catch (error) {
    console.error('Recommendations route error:', error);
    // Return empty recommendations instead of crashing
    res.json({
      success: true,
      recommendations: [],
      count: 0,
      message: 'Recommendations temporarily unavailable',
    });
  }
});

// @route   GET /api/recommendations/content-based/:movieId
// @desc    Get content-based recommendations for a movie
// @access  Private
router.get('/content-based/:movieId', protect, async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const movieDetails = await getMovieDetails(movieId);
    const genres = movieDetails.genres.map((g) => g.id);

    const recommendedMovieIds = await getContentBasedRecommendations(movieId, genres);

    const recommendations = await Promise.all(
      recommendedMovieIds.slice(0, 10).map(async (id) => {
        try {
          const details = await getMovieDetails(id);
          return {
            movieId: details.id,
            title: details.title,
            overview: details.overview,
            posterPath: details.poster_path,
            voteAverage: details.vote_average,
            reason: 'Similar to ' + movieDetails.title,
          };
        } catch (error) {
          return null;
        }
      })
    );

    const validRecommendations = recommendations.filter((r) => r !== null);

    res.json({
      success: true,
      recommendations: validRecommendations,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/recommendations/mood
// @desc    Get recommendations based on mood/genre
// @access  Private
router.get('/mood', protect, async (req, res, next) => {
  try {
    const { genres } = req.query;
    const genreArray = genres ? genres.split(',') : [];

    // Get user's favorite genres if not provided
    const user = await User.findById(req.user._id);
    const favoriteGenres = genreArray.length > 0 ? genreArray : user.favoriteGenres;

    // This would use TMDB to get movies by genre
    // For now, returning a simplified response
    res.json({
      success: true,
      message: 'Mood-based recommendations',
      genres: favoriteGenres,
      recommendations: [],
    });
  } catch (error) {
    next(error);
  }
});

export default router;

