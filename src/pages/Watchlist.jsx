import { useState, useEffect } from 'react';
import { Play, Trash2, Check, Plus, Star, Edit2, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { message } from 'antd';

const API_BASE_URL = 'http://localhost:5000/api';

const Watchlist = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sharedId = searchParams.get('shared');
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({ priority: 'medium', notes: '' });
  const [isShared, setIsShared] = useState(false);
  const [sharedWatchlistInfo, setSharedWatchlistInfo] = useState(null);

  useEffect(() => {
    fetchWatchlist();
  }, [sharedId]);

  const fetchWatchlist = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      if (sharedId) {
        // Fetch shared watchlist
        const response = await fetch(`${API_BASE_URL}/social/watchlist/shared/${sharedId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        
        if (data.success && data.sharedWatchlist) {
          setIsShared(true);
          setSharedWatchlistInfo(data.sharedWatchlist);
          // Convert shared watchlist movies to watchlist format
          const movies = (data.sharedWatchlist.movies || []).map((movie, idx) => ({
            _id: movie._id || `shared-${movie.movieId}-${idx}`,
            movieId: movie.movieId,
            movieTitle: movie.movieTitle,
            moviePoster: movie.moviePoster,
            movieBackdrop: movie.movieBackdrop,
            movieOverview: movie.movieOverview,
            movieReleaseDate: movie.movieReleaseDate,
            movieRating: movie.movieRating,
            addedAt: movie.addedAt,
          }));
          setWatchlist(movies);
        } else {
          message.error(data.message || 'Failed to load shared watchlist');
          console.error('Shared watchlist error:', data);
        }
      } else {
        // Fetch personal watchlist
        const response = await fetch(`${API_BASE_URL}/watchlist`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        
        if (data.success) {
          setIsShared(false);
          setWatchlist(data.watchlist || []);
        } else {
          message.error(data.message || 'Failed to load watchlist');
        }
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      message.error('Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatchlist = async (watchlistId, movieId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      if (isShared && sharedWatchlistInfo) {
        // Remove from shared watchlist
        const response = await fetch(`${API_BASE_URL}/social/watchlist/shared/${sharedWatchlistInfo._id}/movies/${movieId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        
        if (data.success) {
          message.success('Removed from shared watchlist');
          fetchWatchlist(); // Refresh the list
        } else {
          message.error(data.message || 'Failed to remove from watchlist');
        }
      } else {
        // Remove from personal watchlist
        const response = await fetch(`${API_BASE_URL}/watchlist/${watchlistId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        
        if (data.success) {
          message.success('Removed from watchlist');
          fetchWatchlist(); // Refresh the list
        } else {
          message.error(data.message || 'Failed to remove from watchlist');
        }
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      message.error('Failed to remove from watchlist');
    }
  };

  const markAsWatched = async (watchlistId, movieId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Add to watch history
      await fetch(`${API_BASE_URL}/users/watch-history`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          movieId: movieId,
          movieTitle: watchlist.find(w => w._id === watchlistId)?.movieTitle || 'Movie',
          progress: 100,
        }),
      });

      // Remove from watchlist
      const item = watchlist.find(w => w._id === watchlistId);
      if (item) {
        await removeFromWatchlist(watchlistId, item.movieId);
        message.success('Marked as watched and removed from watchlist');
      }
    } catch (error) {
      console.error('Error marking as watched:', error);
      message.error('Failed to mark as watched');
    }
  };

  const updateWatchlistItem = async (watchlistId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/watchlist/${watchlistId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });
      const data = await response.json();
      
      if (data.success) {
        message.success('Watchlist item updated');
        setEditingItem(null);
        fetchWatchlist();
      } else {
        message.error(data.message || 'Failed to update watchlist item');
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
      message.error('Failed to update watchlist item');
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item._id);
    setEditForm({
      priority: item.priority || 'medium',
      notes: item.notes || '',
    });
  };

  const getImageUrl = (path, size = 'w500') => {
    if (!path) return 'https://via.placeholder.com/500/0a0a0a/ffffff?text=Movie';
    return `https://image.tmdb.org/t/p/${size}${path}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-cyan-400 text-lg font-mono">Loading watchlist...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-white text-xl sm:text-2xl font-bold mb-2">
          {isShared && sharedWatchlistInfo ? sharedWatchlistInfo.name : 'Watchlist'}
        </h1>
        <p className="text-gray-400 text-sm">
          {isShared && sharedWatchlistInfo 
            ? `${sharedWatchlistInfo.description || 'Shared watchlist'} • ${watchlist.length} ${watchlist.length === 1 ? 'movie' : 'movies'}`
            : `Your saved movies to watch later ${watchlist.length > 0 && `(${watchlist.length} ${watchlist.length === 1 ? 'movie' : 'movies'})`}`
          }
        </p>
      </div>

      {watchlist.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 border-2 border-cyan-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-cyan-400/20" />
          </div>
          <h4 className="text-gray-400 text-xl mb-2">
            {isShared ? 'This shared watchlist is empty' : 'Your watchlist is empty'}
          </h4>
          <p className="text-gray-500 text-sm mb-4">
            {isShared ? 'Start adding movies to this shared watchlist!' : 'Start adding movies to watch later!'}
          </p>
          {isShared && (
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-cyan-500 to-purple-500 text-white flex items-center gap-2 mx-auto border border-cyan-400/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all"
            >
              <Plus className="w-5 h-5" />
              Browse Movies
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
          {watchlist.map((item) => (
            <div
              key={item._id}
              className="group cursor-pointer"
              onClick={() => navigate(`/dashboard/movie-details/${item.movieId}`)}
            >
              <div className="relative h-[350px] sm:h-[400px] rounded-xl overflow-hidden border border-cyan-500/10 hover:border-cyan-500/30 transition-all mb-3">
                <img
                  src={getImageUrl(item.moviePoster, 'w500')}
                  alt={item.movieTitle}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center gap-2 p-3 sm:p-4">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/dashboard/movie-details/${item.movieId}`);
                    }}
                    className="h-9 sm:h-10 px-3 sm:px-4 rounded-lg bg-[#0f0f0f] border-2 border-cyan-500/50 text-cyan-400 font-mono font-medium hover:bg-cyan-500/10 hover:border-cyan-400 transition-all flex items-center gap-2 text-xs sm:text-sm uppercase"
                  >
                    <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                    Watch
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(item);
                    }}
                    className="h-9 sm:h-10 w-9 sm:w-10 rounded-lg bg-[#0f0f0f] border-2 border-gray-600/50 text-gray-300 hover:border-gray-500 hover:bg-gray-900/30 transition-all flex items-center justify-center"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {!isShared && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsWatched(item._id, item.movieId);
                      }}
                      className="h-9 sm:h-10 w-9 sm:w-10 rounded-lg bg-[#0f0f0f] border-2 border-green-500/50 text-green-400 hover:bg-green-500/10 hover:border-green-400 transition-all flex items-center justify-center"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromWatchlist(item._id, item.movieId);
                    }}
                    className="h-9 sm:h-10 w-9 sm:w-10 rounded-lg bg-[#0f0f0f] border-2 border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-400 transition-all flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-white font-semibold text-sm mb-1 line-clamp-1">{item.movieTitle}</h3>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-mono">
                    {item.movieReleaseDate ? new Date(item.movieReleaseDate).getFullYear() : 'N/A'}
                  </span>
                  {item.movieRating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-cyan-400 font-mono">{item.movieRating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f0f] border-2 border-cyan-500/50 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-xl font-bold font-mono uppercase">UPDATE WATCHLIST</h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm font-mono mb-2 block">Priority</label>
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                  className="w-full h-10 px-4 bg-[#0a0a0a] border-2 border-cyan-500/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-mono"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-sm font-mono mb-2 block">Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Add notes about this movie..."
                  rows={3}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border-2 border-cyan-500/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all resize-none font-mono"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => updateWatchlistItem(editingItem)}
                  className="flex-1 h-10 px-6 rounded-lg bg-[#0f0f0f] border-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all flex items-center justify-center gap-2 font-mono uppercase text-sm"
                >
                  UPDATE
                </button>
                <button
                  onClick={() => setEditingItem(null)}
                  className="px-6 h-10 rounded-lg bg-[#0a0a0a] border-2 border-gray-600/50 text-gray-400 hover:text-white hover:bg-gray-900/30 transition-all font-mono uppercase text-sm"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Watchlist;
