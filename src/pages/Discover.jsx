import { useState, useEffect } from 'react';
import { Play, Heart, Sparkles, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api';

const Discover = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const genres = [
    { id: 'all', name: 'All Genres' },
    { id: 28, name: 'Action' },
    { id: 35, name: 'Comedy' },
    { id: 18, name: 'Drama' },
    { id: 27, name: 'Horror' },
    { id: 878, name: 'Sci-Fi' },
    { id: 53, name: 'Thriller' },
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    
    if (selectedGenre === 'all') {
      // Fetch popular movies
      fetch(`${API_BASE_URL}/movies/popular`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.results) {
            setMovies(data.results);
          } else if (data.results) {
            setMovies(data.results);
          } else {
            setMovies([]);
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching movies:', error);
          setMovies([]);
          setLoading(false);
        });
    } else {
      // Fetch movies by genre
      fetch(`${API_BASE_URL}/movies/genre/${selectedGenre}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.results) {
            setMovies(data.results);
          } else if (data.results) {
            setMovies(data.results);
          } else {
            setMovies([]);
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching movies by genre:', error);
          setMovies([]);
          setLoading(false);
        });
    }
  }, [selectedGenre, navigate]);

  const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/300x450/0a0a0a/ffffff?text=Movie';
    return `https://image.tmdb.org/t/p/w500${path}`;
  };

  const filteredMovies = movies.filter((movie) =>
    movie.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-cyan-400 text-lg font-mono">Discovering movies...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl sm:text-3xl lg:text-4xl font-black mb-2 tracking-tight">Discover</h1>
          <p className="text-gray-400 font-mono text-sm">AI-powered movie discovery</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search movies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-4 pr-4 bg-[#0a0a0a] border border-cyan-500/30 text-white placeholder:text-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-mono text-sm"
            style={{ boxShadow: 'inset 0 0 20px rgba(6, 182, 212, 0.05)' }}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2">
          {genres.map((genre) => (
            <button
              key={genre.id}
              onClick={() => setSelectedGenre(genre.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all border ${
                selectedGenre === genre.id
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                  : 'bg-[#0a0a0a] text-gray-400 border-cyan-500/20 hover:text-cyan-400 hover:border-cyan-500/40'
              }`}
            >
              {genre.name}
            </button>
          ))}
        </div>
      </div>

      {/* Movies Grid */}
      {filteredMovies.length === 0 ? (
        <div className="text-center py-16">
          <Sparkles className="w-16 h-16 text-cyan-400/20 mx-auto mb-4" />
          <h4 className="text-gray-400 text-xl mb-2">No movies found</h4>
          <p className="text-gray-500 text-sm">Try adjusting your filters or search query</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6">
          {filteredMovies.map((movie) => (
            <div
              key={movie.id}
              className="group cursor-pointer"
              onClick={() => navigate(`/dashboard/movie-details/${movie.id}`)}
            >
              <div className="relative h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px] rounded-xl overflow-hidden border border-cyan-500/10 hover:border-cyan-500/30 transition-all mb-3">
                <img
                  src={getImageUrl(movie.poster_path)}
                  alt={movie.title}
                  className="w-full h-full object-cover transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center gap-2 p-3">
                  <button className="h-8 w-8 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all flex items-center justify-center">
                    <Heart className="w-4 h-4" />
                  </button>
                  <button className="h-8 px-3 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-xs font-medium hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all flex items-center gap-1 border border-cyan-400/30">
                    <Play className="w-3 h-3" />
                    Watch
                  </button>
                </div>
              </div>
              <div className="mb-2">
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-2.5 h-2.5 sm:w-3 h-3 ${
                        star <= Math.round((movie.vote_average || 0) / 2)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-600'
                      }`}
                    />
                  ))}
                  <span className="text-gray-400 text-xs ml-1">{(movie.vote_average || 0).toFixed(1)}</span>
                </div>
              </div>
              <h3 className="text-white font-semibold text-xs sm:text-sm mb-1 line-clamp-1">{movie.title}</h3>
              <p className="text-gray-400 text-xs">{movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Discover;
