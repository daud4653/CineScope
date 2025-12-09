import { useState, useEffect } from 'react';
import { Search, Play, Heart } from 'lucide-react';

const Movies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetch('https://api.themoviedb.org/3/movie/popular?api_key=1f54bd990f1cdfb230adb312546d765d&language=en-US&page=1')
      .then((res) => res.json())
      .then((data) => {
        setMovies(data.results || []);
        setLoading(false);
      })
      .catch(() => {
        setMovies([]);
        setLoading(false);
      });
  }, []);

  const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/300x450/1e3a5f/ffffff?text=Movie';
    return `https://image.tmdb.org/t/p/w500${path}`;
  };

  const filteredMovies = movies.filter((movie) => {
    return movie.title.toLowerCase().includes(searchText.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-cyan-400 text-lg font-mono">Loading movies...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-4xl font-black mb-2 tracking-tight">Browse Movies</h1>
          <p className="text-gray-400 font-mono text-sm">Explore our movie collection</p>
        </div>
      </div>

      <div className="relative max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400/60 w-5 h-5" />
        <input
          type="text"
          placeholder="Search movies..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full h-12 pl-12 pr-4 bg-[#0a0a0a] border border-cyan-500/30 text-cyan-400 placeholder:text-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-mono text-sm"
          style={{ boxShadow: 'inset 0 0 20px rgba(6, 182, 212, 0.05)' }}
        />
      </div>

      {filteredMovies.length === 0 ? (
        <div className="text-center py-16">
          <h4 className="text-gray-400 text-xl mb-2">No movies found</h4>
          <p className="text-gray-500 text-sm">Try adjusting your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredMovies.map((movie) => (
            <div
              key={movie.id}
              className="group cursor-pointer"
            >
              <div className="relative h-[450px] rounded-xl overflow-hidden border border-cyan-500/20 hover:border-cyan-500/50 transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                <img
                  src={getImageUrl(movie.poster_path)}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center gap-2 p-4">
                  <button className="h-10 px-4 rounded-lg font-semibold bg-gradient-to-r from-cyan-500 to-purple-500 text-white flex items-center gap-2 border border-cyan-400/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                    <Play className="w-4 h-4" />
                    Watch
                  </button>
                  <button className="h-10 w-10 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all flex items-center justify-center">
                    <Heart className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-white font-bold text-sm mb-1 line-clamp-1">{movie.title}</h3>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-mono">{new Date(movie.release_date).getFullYear()}</span>
                  <span className="text-cyan-400 font-mono">⭐ {movie.vote_average.toFixed(1)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Movies;
