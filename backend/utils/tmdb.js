import axios from 'axios';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// Get API key lazily - check it when function is called, not at module load time
const getApiKey = () => {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    console.error('⚠️  TMDB_API_KEY is not set in environment variables!');
    console.error('Please make sure your .env file contains: TMDB_API_KEY=your_api_key');
    console.error('Current process.env keys:', Object.keys(process.env).filter(k => k.includes('TMDB')));
    throw new Error('TMDB API key is not configured. Please check your .env file.');
  }
  return apiKey;
};

export const tmdbRequest = async (endpoint, params = {}) => {
  const TMDB_API_KEY = getApiKey();

  try {
    const response = await axios.get(`${TMDB_BASE_URL}${endpoint}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        ...params,
      },
      timeout: 10000, // 10 second timeout
    });
    return response.data;
  } catch (error) {
    // More detailed error logging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('TMDB API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        endpoint: endpoint,
      });
      
      if (error.response.status === 401) {
        throw new Error('TMDB API key is invalid. Please check your API key in .env file.');
      } else if (error.response.status === 404) {
        throw new Error('TMDB endpoint not found. Please check the endpoint.');
      } else {
        throw new Error(`TMDB API Error: ${error.response.status} - ${error.response.statusText}`);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('TMDB API Request Error:', {
        message: error.message,
        endpoint: endpoint,
        code: error.code,
      });
      throw new Error('No response from TMDB API. Please check your internet connection.');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('TMDB API Setup Error:', error.message);
      throw new Error(`Failed to fetch from TMDB API: ${error.message}`);
    }
  }
};

export const searchMovies = async (query, page = 1) => {
  return await tmdbRequest('/search/movie', { query, page });
};

export const searchTV = async (query, page = 1) => {
  return await tmdbRequest('/search/tv', { query, page });
};

export const searchPerson = async (query, page = 1) => {
  return await tmdbRequest('/search/person', { query, page });
};

export const getMovieDetails = async (movieId) => {
  return await tmdbRequest(`/movie/${movieId}`, {
    append_to_response: 'credits,videos,recommendations',
  });
};

export const getTVDetails = async (tvId) => {
  return await tmdbRequest(`/tv/${tvId}`, {
    append_to_response: 'credits,videos,recommendations',
  });
};

export const getPopularMovies = async (page = 1) => {
  return await tmdbRequest('/movie/popular', { page });
};

export const getTopRatedMovies = async (page = 1) => {
  return await tmdbRequest('/movie/top_rated', { page });
};

export const getUpcomingMovies = async (page = 1) => {
  return await tmdbRequest('/movie/upcoming', { page });
};

export const getPopularTV = async (page = 1) => {
  return await tmdbRequest('/tv/popular', { page });
};

export const getPopularAnime = async (page = 1) => {
  // Anime genre ID in TMDB is 16
  // Get popular anime movies and TV shows
  try {
    const [movies, tv] = await Promise.all([
      tmdbRequest('/discover/movie', { 
        page, 
        with_genres: '16',
        sort_by: 'popularity.desc'
      }),
      tmdbRequest('/discover/tv', { 
        page, 
        with_genres: '16',
        sort_by: 'popularity.desc'
      })
    ]);
    
    // Combine results
    const combinedResults = [
      ...(movies.results || []).map(m => ({ ...m, media_type: 'movie' })),
      ...(tv.results || []).map(t => ({ ...t, media_type: 'tv' }))
    ];
    
    return {
      results: combinedResults.slice(0, 20), // Limit to 20 items
      total_results: combinedResults.length,
      page: 1,
      total_pages: 1,
    };
  } catch (error) {
    console.error('Error fetching anime:', error);
    // Fallback to popular movies if anime fails
    return await getPopularMovies(page);
  }
};

export const getMoviesByGenre = async (genreId, page = 1) => {
  return await tmdbRequest('/discover/movie', {
    with_genres: genreId,
    page,
  });
};

export const getImageUrl = (path, size = 'w500') => {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
};

export const getGenres = async () => {
  const movieGenres = await tmdbRequest('/genre/movie/list');
  const tvGenres = await tmdbRequest('/genre/tv/list');
  return {
    movie: movieGenres.genres,
    tv: tvGenres.genres,
  };
};

