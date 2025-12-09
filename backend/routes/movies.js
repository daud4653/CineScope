import express from 'express';
import {
  searchMovies,
  searchTV,
  searchPerson,
  getMovieDetails,
  getTVDetails,
  getPopularMovies,
  getTopRatedMovies,
  getUpcomingMovies,
  getMoviesByGenre,
  getGenres,
} from '../utils/tmdb.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/movies/search
// @desc    Search movies, TV shows, and actors
// @access  Private
router.get('/search', protect, async (req, res, next) => {
  try {
    const { query, type = 'multi', page = 1 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    let results = {};

    if (type === 'movie' || type === 'multi') {
      try {
        const movieResults = await searchMovies(query, page);
        results.movies = movieResults;
      } catch (error) {
        console.error('Error searching movies:', error.message);
        results.movies = { results: [], total_results: 0 };
      }
    }

    if (type === 'tv' || type === 'multi') {
      try {
        const tvResults = await searchTV(query, page);
        results.tv = tvResults;
      } catch (error) {
        console.error('Error searching TV:', error.message);
        results.tv = { results: [], total_results: 0 };
      }
    }

    if (type === 'person' || type === 'multi') {
      try {
        const personResults = await searchPerson(query, page);
        results.persons = personResults;
      } catch (error) {
        console.error('Error searching persons:', error.message);
        results.persons = { results: [], total_results: 0 };
      }
    }

    res.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Search route error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to perform search',
    });
  }
});

// @route   GET /api/movies/popular
// @desc    Get popular movies
// @access  Private
router.get('/popular', protect, async (req, res, next) => {
  try {
    const { page = 1 } = req.query;
    const results = await getPopularMovies(page);
    res.json({
      success: true,
      ...results,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/movies/popular-tv
// @desc    Get popular TV shows
// @access  Private
router.get('/popular-tv', protect, async (req, res, next) => {
  try {
    const { page = 1 } = req.query;
    const { getPopularTV } = await import('../utils/tmdb.js');
    const results = await getPopularTV(page);
    res.json({
      success: true,
      ...results,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/movies/popular-anime
// @desc    Get popular anime (movies and TV)
// @access  Private
router.get('/popular-anime', protect, async (req, res, next) => {
  try {
    const { page = 1 } = req.query;
    const { getPopularAnime } = await import('../utils/tmdb.js');
    const results = await getPopularAnime(page);
    res.json({
      success: true,
      ...results,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/movies/top-rated
// @desc    Get top rated movies
// @access  Private
router.get('/top-rated', protect, async (req, res, next) => {
  try {
    const { page = 1 } = req.query;
    const results = await getTopRatedMovies(page);
    res.json({
      success: true,
      ...results,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/movies/upcoming
// @desc    Get upcoming movies
// @access  Private
router.get('/upcoming', protect, async (req, res, next) => {
  try {
    const { page = 1 } = req.query;
    const results = await getUpcomingMovies(page);
    res.json({
      success: true,
      ...results,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/movies/genres
// @desc    Get movie and TV genres
// @access  Private
router.get('/genres', protect, async (req, res, next) => {
  try {
    const genres = await getGenres();
    res.json({
      success: true,
      genres,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/movies/genre/:genreId
// @desc    Get movies by genre
// @access  Private
router.get('/genre/:genreId', protect, async (req, res, next) => {
  try {
    const { genreId } = req.params;
    const { page = 1 } = req.query;
    const results = await getMoviesByGenre(genreId, page);
    res.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('Error fetching movies by genre:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch movies by genre',
      results: [],
    });
  }
});

// @route   GET /api/movies/:id
// @desc    Get movie details
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type = 'movie' } = req.query;

    let details;
    if (type === 'tv') {
      details = await getTVDetails(id);
    } else {
      details = await getMovieDetails(id);
    }

    res.json({
      success: true,
      movie: details,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

