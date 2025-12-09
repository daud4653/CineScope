import { useState, useEffect } from 'react';
import { Play, Plus, ChevronLeft, ChevronRight, Star, Cpu, Bookmark, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { message } from 'antd';

const API_BASE_URL = 'http://localhost:5000/api';

const Home = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'Movies';
  const [movies, setMovies] = useState([]);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);
  const [sharedWatchlists, setSharedWatchlists] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch content based on active tab
    const fetchContent = async () => {
      setLoading(true);
      try {
        let endpoint = `${API_BASE_URL}/movies/popular`;
        if (activeTab === 'TV Shows') {
          endpoint = `${API_BASE_URL}/movies/popular-tv`;
        } else if (activeTab === 'Anime') {
          endpoint = `${API_BASE_URL}/movies/popular-anime`;
        }

        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        
        if (data.success && data.results) {
          setMovies(data.results);
          // Immediately set shuffled recommendations from popular movies
          const shuffled = [...data.results]
            .sort(() => Math.random() - 0.5)
            .slice(0, 12)
            .map(movie => ({
              movieId: movie.id,
              title: movie.title,
              posterPath: movie.poster_path,
              voteAverage: movie.vote_average,
              reason: 'Popular recommendation'
            }));
          setAiRecommendations(shuffled);
        } else if (data.results) {
          setMovies(data.results);
          // Set recommendations immediately
          const shuffled = [...data.results]
            .sort(() => Math.random() - 0.5)
            .slice(0, 12)
            .map(movie => ({
              movieId: movie.id,
              title: movie.title,
              posterPath: movie.poster_path,
              voteAverage: movie.vote_average,
              reason: 'Popular recommendation'
            }));
          setAiRecommendations(shuffled);
        }
      } catch (error) {
        console.error(`Error fetching ${activeTab}:`, error);
        // Fallback to movies if other endpoints don't exist
        if (activeTab !== 'Movies') {
          try {
            const fallback = await fetch(`${API_BASE_URL}/movies/popular`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            const fallbackData = await fallback.json();
            if (fallbackData.success && fallbackData.results) {
              setMovies(fallbackData.results);
            } else if (fallbackData.results) {
              setMovies(fallbackData.results);
            }
          } catch (fallbackError) {
            console.error('Error fetching fallback:', fallbackError);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchContent();

    // Recommendations already set from popular movies above
    // Skip AI API call to avoid flickering
  }, [navigate, activeTab]);

  // Auto-rotate featured movies
  useEffect(() => {
    if (movies.length > 0) {
      const interval = setInterval(() => {
        setFeaturedIndex((prev) => (prev < movies.length - 1 ? prev + 1 : 0));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [movies.length]);

  const getImageUrl = (path, size = 'w500') => {
    if (!path) return 'https://via.placeholder.com/500/0a0a0a/ffffff?text=Movie';
    return `https://image.tmdb.org/t/p/${size}${path}`;
  };

  const getBackdropUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/1920x1080/0a0a0a/ffffff?text=Movie';
    return `https://image.tmdb.org/t/p/w1280${path}`;
  };

  const handleAddToWatchlistClick = (movieId, movieTitle) => {
    setSelectedMovie({ movieId, movieTitle });
    // Fetch shared watchlists when opening modal
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_BASE_URL}/social/watchlist/shared`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.sharedWatchlists) {
            setSharedWatchlists(data.sharedWatchlists || []);
          } else {
            console.error('Failed to fetch shared watchlists:', data);
            setSharedWatchlists([]);
          }
        })
        .catch((error) => {
          console.error('Error fetching shared watchlists:', error);
          setSharedWatchlists([]);
        });
    }
    setShowWatchlistModal(true);
  };

  const addToWatchlist = async (watchlistId = null) => {
    const token = localStorage.getItem('token');
    if (!token || !selectedMovie) return;

    try {
      if (watchlistId) {
        // Add to shared watchlist
        const response = await fetch(`${API_BASE_URL}/social/watchlist/shared/${watchlistId}/movies`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            movieId: selectedMovie.movieId,
            movieTitle: selectedMovie.movieTitle,
          }),
        });
        const data = await response.json();
        
        if (data.success) {
          message.success('Added to shared watchlist!');
          setShowWatchlistModal(false);
          setSelectedMovie(null);
          // Refresh shared watchlists to update counts
          fetch(`${API_BASE_URL}/social/watchlist/shared`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.success && data.sharedWatchlists) {
                setSharedWatchlists(data.sharedWatchlists || []);
              }
            })
            .catch(() => {});
        } else {
          message.error(data.message || 'Failed to add to watchlist');
          console.error('Add to shared watchlist error:', data);
        }
      } else {
        // Add to personal watchlist
        const response = await fetch(`${API_BASE_URL}/watchlist`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            movieId: selectedMovie.movieId,
            movieTitle: selectedMovie.movieTitle,
          }),
        });
        const data = await response.json();
        
        if (data.success) {
          message.success('Added to watchlist!');
          setShowWatchlistModal(false);
          setSelectedMovie(null);
        } else {
          message.error(data.message || 'Failed to add to watchlist');
        }
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      message.error('Failed to add to watchlist');
    }
  };

  const featuredMovie = movies[featuredIndex];
  const popularMovies = movies.slice(1, 20); // Show more popular movies

  const nextFeatured = () => {
    setFeaturedIndex((prev) => (prev < movies.length - 1 ? prev + 1 : 0));
  };

  const prevFeatured = () => {
    setFeaturedIndex((prev) => (prev > 0 ? prev - 1 : movies.length - 1));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-cyan-400 text-lg font-mono">Loading AI recommendations...</div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-6 sm:space-y-8 lg:space-y-12 w-full max-w-full overflow-x-hidden">
      {/* Hero Banner - Featured Movie */}
      {featuredMovie && (
        <div className="relative h-[240px] sm:h-[320px] md:h-[400px] lg:h-[500px] xl:h-[550px] rounded-xl sm:rounded-2xl overflow-hidden border border-cyan-500/20 group w-[90%] max-w-7xl mx-auto">
          <img
            src={getBackdropUrl(featuredMovie.backdrop_path || featuredMovie.poster_path)}
            alt={featuredMovie.title}
            className="w-full h-full object-cover object-center"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/30"></div>
          
          {/* Navigation Arrows */}
          <button
            onClick={prevFeatured}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white hover:bg-black/80 hover:border-cyan-400/50 transition-all flex items-center justify-center z-10 shadow-lg"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </button>
          <button
            onClick={nextFeatured}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white hover:bg-black/80 hover:border-cyan-400/50 transition-all flex items-center justify-center z-10 shadow-lg"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </button>

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-6 lg:p-8">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <span className="text-cyan-400 text-[10px] sm:text-xs font-mono">FEATURED</span>
            </div>
            <h1 className="text-white text-base sm:text-xl md:text-2xl lg:text-4xl font-black mb-1 sm:mb-2 md:mb-3 tracking-tight leading-tight line-clamp-2 max-w-4xl">
              {featuredMovie.title}
            </h1>
            <p className="text-gray-300 mb-2 sm:mb-3 md:mb-4 text-xs sm:text-sm md:text-base max-w-3xl line-clamp-1 sm:line-clamp-2 leading-relaxed hidden sm:block">
              {featuredMovie.overview}
            </p>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3">
              <button 
                onClick={() => navigate(`/dashboard/movie-details/${featuredMovie.id}`)}
                className="h-8 sm:h-9 md:h-11 px-3 sm:px-4 md:px-6 rounded-md sm:rounded-lg font-mono font-semibold bg-[#0f0f0f] border-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs md:text-sm uppercase tracking-wide"
              >
                <Play className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                <span className="hidden xs:inline">Watch</span>
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToWatchlistClick(featuredMovie.id, featuredMovie.title);
                }}
                className="h-8 sm:h-9 md:h-11 px-2 sm:px-3 md:px-4 rounded-md sm:rounded-lg bg-[#0f0f0f] border-2 border-gray-600/50 text-gray-300 hover:border-gray-500 hover:bg-gray-900/30 transition-all flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs md:text-sm font-mono"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Add</span>
              </button>
            </div>
            {/* Carousel Dots */}
            <div className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-4">
              {movies.slice(0, 5).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setFeaturedIndex(idx)}
                  className={`transition-all rounded-full ${
                    idx === featuredIndex
                      ? 'bg-cyan-400 w-4 sm:w-6 md:w-8 h-1 sm:h-1.5 md:h-2 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                      : 'bg-white/30 w-1 sm:w-1.5 md:w-2 h-1 sm:h-1.5 md:h-2 hover:bg-white/50'
                  }`}
                ></button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Popular Section */}
      <div className="w-full max-w-full">
        <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
          <h2 className="text-white text-sm sm:text-lg md:text-xl lg:text-2xl font-bold font-mono uppercase tracking-wider">
            POPULAR {activeTab.toUpperCase()}
          </h2>
        </div>
        {popularMovies.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-gray-400 text-xs sm:text-sm font-mono">LOADING...</p>
          </div>
        ) : (
          <div className="flex gap-2 sm:gap-3 md:gap-4 overflow-x-auto custom-scrollbar pb-3 sm:pb-4 scrollbar-hide w-full -mx-3 px-3 sm:-mx-4 sm:px-4 md:mx-0 md:px-0">
            {popularMovies.map((movie) => (
            <div
              key={movie.id}
              className="flex-shrink-0 w-32 xs:w-36 sm:w-40 md:w-48 lg:w-56 group cursor-pointer"
              onClick={() => navigate(`/dashboard/movie-details/${movie.id}`)}
            >
              <div className="relative h-[180px] xs:h-[200px] sm:h-[240px] md:h-[300px] lg:h-[350px] rounded-lg sm:rounded-xl overflow-hidden border border-cyan-500/10 hover:border-cyan-500/30 transition-all mb-2 sm:mb-3">
                <img
                  src={getImageUrl(movie.poster_path, 'w500')}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center gap-1.5 sm:gap-2 p-2 sm:p-3">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToWatchlistClick(movie.id, movie.title);
                    }}
                    className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all flex items-center justify-center"
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                  <button className="h-7 sm:h-8 px-2 sm:px-3 rounded-lg bg-[#0f0f0f] border-2 border-cyan-500/50 text-cyan-400 font-mono font-medium hover:bg-cyan-500/10 hover:border-cyan-400 transition-all flex items-center gap-1 text-[10px] sm:text-xs uppercase">
                    <Play className="w-3 h-3" />
                    <span className="hidden sm:inline">Watch</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-0.5 sm:gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 ${
                      star <= Math.round(movie.vote_average / 2)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-600'
                    }`}
                  />
                ))}
                <span className="text-gray-400 text-[10px] sm:text-xs ml-0.5 sm:ml-1">{movie.vote_average.toFixed(1)}</span>
              </div>
              <h3 className="text-white font-semibold text-[11px] sm:text-xs md:text-sm mb-0.5 sm:mb-1 line-clamp-1">{movie.title}</h3>
              <p className="text-gray-400 text-[10px] sm:text-xs font-mono line-clamp-1">
                {movie.genres?.[0]?.name || 'Movie'} • {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
              </p>
            </div>
          ))}
          </div>
        )}
      </div>

      {/* Recommendations Section */}
      <div className="w-full max-w-full">
        <div className="flex items-center gap-2 mb-3 sm:mb-4 md:mb-6">
          <h2 className="text-white text-sm sm:text-lg md:text-xl lg:text-2xl font-bold font-mono uppercase tracking-wider">AI RECOMMENDATIONS</h2>
        </div>
        {aiRecommendations.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-gray-400 text-xs sm:text-sm font-mono">BASED ON YOUR VIEWING HISTORY</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4 w-full">
            {aiRecommendations.map((movie, idx) => (
              <div
                key={movie.movieId || idx}
                className="group cursor-pointer w-full"
                onClick={() => navigate(`/dashboard/movie-details/${movie.movieId}`)}
              >
                <div className="relative h-[180px] xs:h-[200px] sm:h-[240px] md:h-[280px] lg:h-[320px] rounded-lg sm:rounded-xl overflow-hidden border border-cyan-500/10 hover:border-cyan-500/30 transition-all mb-2">
                  <img
                    src={getImageUrl(movie.posterPath, 'w500')}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center gap-1.5 sm:gap-2 p-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToWatchlistClick(movie.movieId, movie.title);
                      }}
                      className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all flex items-center justify-center"
                    >
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    <button className="h-7 sm:h-8 px-2 sm:px-3 rounded-lg bg-[#0f0f0f] border-2 border-cyan-500/50 text-cyan-400 font-mono text-[10px] sm:text-xs font-medium hover:bg-cyan-500/10 hover:border-cyan-400 transition-all flex items-center gap-1 uppercase">
                      <Play className="w-3 h-3" />
                      <span className="hidden sm:inline">Watch</span>
                    </button>
                  </div>
                </div>
                <div className="mb-1">
                  <div className="flex items-center gap-0.5 sm:gap-1 mb-0.5 sm:mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-2 h-2 sm:w-2.5 sm:h-2.5 ${
                          star <= Math.round((movie.voteAverage || 0) / 2)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-600'
                        }`}
                      />
                    ))}
                    <span className="text-gray-400 text-[10px] sm:text-xs ml-0.5">{(movie.voteAverage || 0).toFixed(1)}</span>
                  </div>
                  {movie.reason && (
                    <div className="text-[9px] sm:text-xs text-gray-500 font-mono mb-0.5 line-clamp-1">
                      MATCHED
                    </div>
                  )}
                </div>
                <h3 className="text-white font-semibold text-[11px] sm:text-xs md:text-sm line-clamp-2">{movie.title}</h3>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Watchlist Selection Modal */}
      {showWatchlistModal && selectedMovie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0f0f0f] border border-cyan-500/30 rounded-xl p-4 sm:p-6 max-w-md w-full max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-white text-lg sm:text-xl font-bold">Add to Watchlist</h3>
              <button
                onClick={() => {
                  setShowWatchlistModal(false);
                  setSelectedMovie(null);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              {/* Personal Watchlist */}
              <button
                onClick={() => addToWatchlist(null)}
                className="w-full p-3 sm:p-4 rounded-lg bg-[#0a0a0a] border border-cyan-500/30 hover:border-cyan-500/50 transition-all text-left flex items-center gap-2 sm:gap-3"
              >
                <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-white font-semibold text-sm sm:text-base">My Watchlist</div>
                  <div className="text-gray-400 text-xs sm:text-sm">Personal watchlist</div>
                </div>
              </button>

              {/* Shared Watchlists */}
              <div className="text-gray-400 text-xs sm:text-sm font-mono uppercase mt-3 sm:mt-4 mb-2">Shared Watchlists</div>
              {sharedWatchlists.length > 0 ? (
                sharedWatchlists.map((watchlist) => (
                  <button
                    key={watchlist._id}
                    onClick={() => addToWatchlist(watchlist._id)}
                    className="w-full p-3 sm:p-4 rounded-lg bg-[#0a0a0a] border border-purple-500/30 hover:border-purple-500/50 transition-all text-left flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-white font-semibold text-sm sm:text-base truncate">{watchlist.name}</div>
                        <div className="text-gray-400 text-xs sm:text-sm">
                          {watchlist.movieCount || watchlist.movies?.length || 0} movies
                        </div>
                      </div>
                    </div>
                    {watchlist.isPublic && (
                      <span className="px-2 py-1 bg-purple-500/10 border border-purple-500/30 rounded text-purple-400 text-[10px] sm:text-xs font-mono flex-shrink-0">
                        Public
                      </span>
                    )}
                  </button>
                ))
              ) : (
                <div className="text-center py-3 sm:py-4 text-gray-400 text-xs sm:text-sm border border-gray-800 rounded-lg p-3 sm:p-4">
                  <p className="mb-1 sm:mb-2">No shared watchlists</p>
                  <p className="text-[10px] sm:text-xs text-gray-500">Create one from Shared Watchlists</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
