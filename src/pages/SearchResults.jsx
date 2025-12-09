import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Film, Tv, User, Star, Play, Plus, Loader2 } from 'lucide-react';
import { message } from 'antd';

const API_BASE_URL = 'http://localhost:5000/api';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'multi';
  
  const [results, setResults] = useState({
    movies: [],
    tv: [],
    persons: [],
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (query.trim()) {
      performSearch();
    } else {
      setResults({ movies: [], tv: [], persons: [] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, type]);

  const performSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/movies/search?query=${encodeURIComponent(query)}&type=${type}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      console.log('Search response:', data); // Debug log
      
      if (data.success && data.results) {
        // Handle different response structures
        const movies = data.results.movies?.results || data.results.movies || [];
        const tv = data.results.tv?.results || data.results.tv || [];
        const persons = data.results.persons?.results || data.results.persons || [];
        
        setResults({
          movies: Array.isArray(movies) ? movies : [],
          tv: Array.isArray(tv) ? tv : [],
          persons: Array.isArray(persons) ? persons : [],
        });
      } else {
        console.error('Search failed:', data.message || 'Unknown error');
        message.error(data.message || 'Search failed. Please try again.');
        setResults({ movies: [], tv: [], persons: [] });
      }
    } catch (error) {
      console.error('Search error:', error);
      message.error('Failed to search. Please check if backend is running.');
      setResults({ movies: [], tv: [], persons: [] });
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (path, size = 'w500') => {
    if (!path) return 'https://via.placeholder.com/500/0a0a0a/ffffff?text=No+Image';
    return `https://image.tmdb.org/t/p/${size}${path}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).getFullYear();
  };

  const totalResults = results.movies.length + results.tv.length + results.persons.length;

  const displayResults = () => {
    if (activeTab === 'movies') return results.movies;
    if (activeTab === 'tv') return results.tv;
    if (activeTab === 'persons') return results.persons;
    return [...results.movies, ...results.tv, ...results.persons];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <div className="text-cyan-400 text-lg font-mono">Searching...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-white text-2xl sm:text-3xl lg:text-4xl font-black mb-2 tracking-tight">
          Search Results
        </h1>
        <p className="text-gray-400 font-mono text-sm">
          {query ? `Found ${totalResults} results for "${query}"` : 'Enter a search query'}
        </p>
      </div>

      {/* Add custom scrollbar styles */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 15, 15, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.5);
        }
      `}</style>

      {!query.trim() ? (
        <div className="text-center py-16">
          <Film className="w-16 h-16 text-cyan-400/20 mx-auto mb-4" />
          <h4 className="text-gray-400 text-xl mb-2">No search query</h4>
          <p className="text-gray-500 text-sm">Enter a search term in the search bar above</p>
        </div>
      ) : totalResults === 0 ? (
        <div className="text-center py-16">
          <Film className="w-16 h-16 text-cyan-400/20 mx-auto mb-4" />
          <h4 className="text-gray-400 text-xl mb-2">No results found</h4>
          <p className="text-gray-500 text-sm">Try a different search term</p>
        </div>
      ) : (
        <>
          {/* Section Title */}
          <div className="mb-4">
            <h2 className="text-white text-sm sm:text-lg md:text-xl lg:text-2xl font-bold font-mono uppercase tracking-wider">
              {activeTab === 'all' ? `ALL RESULTS (${totalResults})` : 
               activeTab === 'movies' ? `MOVIES (${results.movies.length})` : 
               activeTab === 'tv' ? `TV SHOWS (${results.tv.length})` : `PEOPLE (${results.persons.length})`}
            </h2>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-hide pb-3 mb-4">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap transition-all ${
                activeTab === 'all'
                  ? 'bg-cyan-500/20 text-cyan-400 border-2 border-cyan-500/50'
                  : 'text-gray-400 border-2 border-transparent hover:text-white hover:bg-white/5'
              }`}
            >
              All
            </button>
            {results.movies.length > 0 && (
              <button
                onClick={() => setActiveTab('movies')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap transition-all ${
                  activeTab === 'movies'
                    ? 'bg-cyan-500/20 text-cyan-400 border-2 border-cyan-500/50'
                    : 'text-gray-400 border-2 border-transparent hover:text-white hover:bg-white/5'
                }`}
              >
                Movies
              </button>
            )}
            {results.tv.length > 0 && (
              <button
                onClick={() => setActiveTab('tv')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap transition-all ${
                  activeTab === 'tv'
                    ? 'bg-cyan-500/20 text-cyan-400 border-2 border-cyan-500/50'
                    : 'text-gray-400 border-2 border-transparent hover:text-white hover:bg-white/5'
                }`}
              >
                TV Shows
              </button>
            )}
            {results.persons.length > 0 && (
              <button
                onClick={() => setActiveTab('persons')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap transition-all ${
                  activeTab === 'persons'
                    ? 'bg-cyan-500/20 text-cyan-400 border-2 border-cyan-500/50'
                    : 'text-gray-400 border-2 border-transparent hover:text-white hover:bg-white/5'
                }`}
              >
                People
              </button>
            )}
          </div>

          {/* Results - Horizontal Scroll Layout (matching Popular Movies) */}
          <div className="flex gap-2 sm:gap-3 md:gap-4 overflow-x-auto custom-scrollbar pb-3 sm:pb-4 scrollbar-hide w-full -mx-3 px-3 sm:-mx-4 sm:px-4 md:mx-0 md:px-0">
            {displayResults().map((item) => {
              // Movie or TV Show
              if (item.media_type === 'movie' || item.media_type === 'tv' || item.title || item.name) {
                const isMovie = item.media_type === 'movie' || item.title;
                const title = item.title || item.name;
                const releaseDate = item.release_date || item.first_air_date;
                
                return (
                  <div
                    key={item.id}
                    className="flex-shrink-0 w-32 xs:w-36 sm:w-40 md:w-48 lg:w-56 group cursor-pointer"
                    onClick={() => navigate(`/dashboard/movie-details/${item.id}?type=${isMovie ? 'movie' : 'tv'}`)}
                  >
                    <div className="relative h-[180px] xs:h-[200px] sm:h-[240px] md:h-[300px] lg:h-[350px] rounded-lg sm:rounded-xl overflow-hidden border border-cyan-500/10 hover:border-cyan-500/30 transition-all mb-2 sm:mb-3">
                      <img
                        src={getImageUrl(item.poster_path, 'w500')}
                        alt={title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center gap-1.5 sm:gap-2 p-2 sm:p-3">
                        <button 
                          onClick={(e) => e.stopPropagation()}
                          className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button className="h-7 sm:h-8 px-2 sm:px-3 rounded-lg bg-[#0f0f0f] border-2 border-cyan-500/50 text-cyan-400 font-mono font-medium hover:bg-cyan-500/10 hover:border-cyan-400 transition-all flex items-center gap-1 text-[10px] sm:text-xs uppercase">
                          <Play className="w-3 h-3" />
                          <span className="hidden sm:inline">Watch</span>
                        </button>
                      </div>
                      {isMovie ? (
                        <Film className="absolute top-2 right-2 w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
                      ) : (
                        <Tv className="absolute top-2 right-2 w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 sm:gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 ${
                            star <= Math.round((item.vote_average || 0) / 2)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-600'
                          }`}
                        />
                      ))}
                      <span className="text-gray-400 text-[10px] sm:text-xs ml-0.5 sm:ml-1">{(item.vote_average || 0).toFixed(1)}</span>
                    </div>
                    <h3 className="text-white font-semibold text-[11px] sm:text-xs md:text-sm mb-0.5 sm:mb-1 line-clamp-1">{title}</h3>
                    <p className="text-gray-400 text-[10px] sm:text-xs font-mono line-clamp-1">
                      {isMovie ? 'Movie' : 'TV'} • {formatDate(releaseDate)}
                    </p>
                  </div>
                );
              }
              
              // Person
              if (item.media_type === 'person' || item.profile_path) {
                return (
                  <div
                    key={item.id}
                    className="flex-shrink-0 w-32 xs:w-36 sm:w-40 md:w-48 lg:w-56 group cursor-pointer"
                    onClick={() => navigate(`/dashboard/person/${item.id}`)}
                  >
                    <div className="relative h-[180px] xs:h-[200px] sm:h-[240px] md:h-[300px] lg:h-[350px] rounded-lg sm:rounded-xl overflow-hidden border border-cyan-500/10 hover:border-cyan-500/30 transition-all mb-2 sm:mb-3">
                      <img
                        src={getImageUrl(item.profile_path, 'w500')}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-2 sm:p-3">
                        <User className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
                      </div>
                      <User className="absolute top-2 right-2 w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
                    </div>
                    <h3 className="text-white font-semibold text-[11px] sm:text-xs md:text-sm line-clamp-1 mb-0.5 sm:mb-1">{item.name}</h3>
                    <p className="text-gray-400 text-[10px] sm:text-xs font-mono">{item.known_for_department || 'Actor'}</p>
                  </div>
                );
              }
              
              return null;
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default SearchResults;

