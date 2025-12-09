import { useState, useEffect } from 'react';
import { Play, Heart, Trash2 } from 'lucide-react';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://api.themoviedb.org/3/movie/popular?api_key=1f54bd990f1cdfb230adb312546d765d&language=en-US&page=1')
      .then((res) => res.json())
      .then((data) => {
        setFavorites(data.results?.slice(0, 12) || []);
        setLoading(false);
      })
      .catch(() => {
        setFavorites([]);
        setLoading(false);
      });
  }, []);

  const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/300x450/0a0a0a/ffffff?text=Movie';
    return `https://image.tmdb.org/t/p/w500${path}`;
  };

  const removeFavorite = (id) => {
    setFavorites(favorites.filter((movie) => movie.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-cyan-400 text-lg font-mono">Loading favorites...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-4xl font-black mb-2 tracking-tight">Favorites</h1>
        <p className="text-gray-400 font-mono text-sm">Your favorite movies collection</p>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="w-16 h-16 text-cyan-400/20 mx-auto mb-4" />
          <h4 className="text-gray-400 text-xl mb-2">No favorites yet</h4>
          <p className="text-gray-500 text-sm">Start adding movies to your favorites!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {favorites.map((movie) => (
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFavorite(movie.id);
                    }}
                    className="h-10 w-10 rounded-lg bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
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

export default Favorites;
