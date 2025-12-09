import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Plus, Heart, Star, ArrowLeft, MessageSquare, ThumbsUp, X, Bookmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';

const API_BASE_URL = 'http://localhost:5000/api';

const MovieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', content: '' });
  const [userReview, setUserReview] = useState(null);
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);
  const [sharedWatchlists, setSharedWatchlists] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    if (id) {
      // Fetch movie details from backend
      fetch(`${API_BASE_URL}/movies/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.movie) {
            setMovie(data.movie);
          } else {
            setMovie(null);
          }
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });

      // Check if movie is in watchlist
      fetch(`${API_BASE_URL}/watchlist`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.watchlist) {
            const isInList = data.watchlist.some(item => item.movieId === parseInt(id));
            setInWatchlist(isInList);
          }
        })
        .catch(() => {});

      // Fetch shared watchlists
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

      // Fetch reviews
      fetch(`${API_BASE_URL}/reviews?movieId=${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.reviews) {
            setReviews(data.reviews);
            // Check if user has already reviewed
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const existingReview = data.reviews.find(r => r.user?._id === currentUser._id);
            if (existingReview) {
              setUserReview(existingReview);
              setReviewForm({
                rating: existingReview.rating,
                title: existingReview.title || '',
                content: existingReview.content,
              });
            }
          }
        })
        .catch(() => {});
    }
  }, [id, navigate]);

  const addToWatchlist = async (watchlistId = null) => {
    const token = localStorage.getItem('token');
    if (!token || !movie) return;

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
            movieId: movie.id,
            movieTitle: movie.title,
          }),
        });
        const data = await response.json();
        
        if (data.success) {
          message.success('Added to shared watchlist!');
          setShowWatchlistModal(false);
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
            movieId: movie.id,
            movieTitle: movie.title,
          }),
        });
        const data = await response.json();
        
        if (data.success) {
          message.success('Added to watchlist!');
          setInWatchlist(true);
          setShowWatchlistModal(false);
        } else {
          message.error(data.message || 'Failed to add to watchlist');
        }
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      message.error('Failed to add to watchlist');
    }
  };

  const handleAddToWatchlistClick = () => {
    if (inWatchlist) {
      removeFromWatchlist();
    } else {
      // Fetch shared watchlists when opening modal to ensure we have the latest
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
            }
          })
          .catch(() => {});
      }
      setShowWatchlistModal(true);
    }
  };

  const removeFromWatchlist = async () => {
    const token = localStorage.getItem('token');
    if (!token || !movie) return;

    try {
      const response = await fetch(`${API_BASE_URL}/watchlist/movie/${movie.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        message.success('Removed from watchlist');
        setInWatchlist(false);
      } else {
        message.error(data.message || 'Failed to remove from watchlist');
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      message.error('Failed to remove from watchlist');
    }
  };

  const getImageUrl = (path, size = 'w500') => {
    if (!path) return 'https://via.placeholder.com/500/0a0a0a/ffffff?text=Movie';
    return `https://image.tmdb.org/t/p/${size}${path}`;
  };

  const submitReview = async () => {
    const token = localStorage.getItem('token');
    if (!token || !movie) return;

    if (!reviewForm.content.trim()) {
      message.error('Please write a review');
      return;
    }

    try {
      const url = userReview 
        ? `${API_BASE_URL}/reviews/${userReview._id}`
        : `${API_BASE_URL}/reviews`;
      const method = userReview ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          movieId: movie.id,
          movieTitle: movie.title,
          moviePoster: movie.poster_path,
          rating: reviewForm.rating,
          title: reviewForm.title,
          content: reviewForm.content,
        }),
      });

      const data = await response.json();
      if (data.success) {
        message.success(userReview ? 'Review updated!' : 'Review submitted!');
        setShowReviewForm(false);
        // Refresh reviews
        fetch(`${API_BASE_URL}/reviews?movieId=${movie.id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              setReviews(data.reviews);
              const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
              const existingReview = data.reviews.find(r => r.user?._id === currentUser._id);
              setUserReview(existingReview || null);
            }
          });
      } else {
        message.error(data.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      message.error('Failed to submit review');
    }
  };

  const likeReview = async (reviewId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        // Update review in list
        setReviews(reviews.map(r => 
          r._id === reviewId 
            ? { ...r, likes: data.likes, isLiked: data.isLiked }
            : r
        ));
      }
    } catch (error) {
      console.error('Error liking review:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-cyan-400 text-lg font-mono">Loading movie details...</div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <h2 className="text-white text-2xl font-bold mb-4">Movie not found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0f0f0f] border-2 border-gray-600/50 text-gray-300 hover:border-gray-500 hover:bg-gray-900/30 transition-all mb-6 font-mono uppercase text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>BACK</span>
      </button>

      {/* Hero Section */}
      <div className="relative h-[400px] sm:h-[500px] md:h-[600px] rounded-2xl overflow-hidden border border-cyan-500/20 mb-8">
        <img
          src={getImageUrl(movie.backdrop_path || movie.poster_path, 'w1280')}
          alt={movie.title}
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/40"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
          <h1 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-4 tracking-tight line-clamp-2">{movie.title}</h1>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${
                    star <= Math.round((movie.vote_average || 0) / 2)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-600'
                  }`}
                />
              ))}
              <span className="text-white ml-2 font-semibold text-sm sm:text-base">{(movie.vote_average || 0).toFixed(1)}</span>
            </div>
            {movie.release_date && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-gray-400 text-sm sm:text-base">{new Date(movie.release_date).getFullYear()}</span>
              </>
            )}
            {movie.runtime && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-gray-400 text-sm sm:text-base">{movie.runtime} min</span>
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button 
              className="h-10 sm:h-11 md:h-12 px-4 sm:px-6 md:px-8 rounded-lg font-mono font-semibold bg-[#0f0f0f] border-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all flex items-center gap-2 text-xs sm:text-sm md:text-base uppercase tracking-wider"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              WATCH NOW
            </button>
            <button 
              onClick={handleAddToWatchlistClick}
              className={`h-10 sm:h-11 md:h-12 px-4 sm:px-6 rounded-lg border-2 transition-all flex items-center gap-2 text-xs sm:text-sm md:text-base font-mono uppercase ${
                inWatchlist
                  ? 'bg-[#0f0f0f] border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-400'
                  : 'bg-[#0f0f0f] border-gray-600/50 text-gray-300 hover:border-gray-500 hover:bg-gray-900/30'
              }`}
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              {inWatchlist ? 'REMOVE FROM WATCHLIST' : 'ADD TO WATCHLIST'}
            </button>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-white text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Overview</h2>
            <p className="text-gray-300 leading-relaxed text-sm sm:text-base lg:text-lg">{movie.overview || 'No overview available.'}</p>
          </div>

          {movie.genres && movie.genres.length > 0 && (
            <div>
              <h2 className="text-white text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Genres</h2>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {movie.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 font-medium text-xs sm:text-sm"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className="p-4 sm:p-6 rounded-xl bg-[#0f0f0f] border border-cyan-500/20">
            <h3 className="text-white font-bold mb-3 sm:mb-4 text-sm sm:text-base">Movie Info</h3>
            <div className="space-y-2 sm:space-y-3">
              {movie.release_date && (
                <div>
                  <span className="text-gray-400 text-xs sm:text-sm">Release Date</span>
                  <p className="text-white font-semibold text-sm sm:text-base">{new Date(movie.release_date).toLocaleDateString()}</p>
                </div>
              )}
              {movie.runtime && (
                <div>
                  <span className="text-gray-400 text-xs sm:text-sm">Runtime</span>
                  <p className="text-white font-semibold text-sm sm:text-base">{movie.runtime} minutes</p>
                </div>
              )}
              {movie.budget && movie.budget > 0 && (
                <div>
                  <span className="text-gray-400 text-xs sm:text-sm">Budget</span>
                  <p className="text-white font-semibold text-sm sm:text-base">${movie.budget.toLocaleString()}</p>
                </div>
              )}
              {movie.revenue && movie.revenue > 0 && (
                <div>
                  <span className="text-gray-400 text-xs sm:text-sm">Revenue</span>
                  <p className="text-white font-semibold text-sm sm:text-base">${movie.revenue.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          {movie.production_companies && movie.production_companies.length > 0 && (
            <div className="p-4 sm:p-6 rounded-xl bg-[#0f0f0f] border border-cyan-500/20">
              <h3 className="text-white font-bold mb-3 sm:mb-4 text-sm sm:text-base">Production Companies</h3>
              <div className="space-y-2">
                {movie.production_companies.slice(0, 3).map((company) => (
                  <p key={company.id} className="text-gray-300 text-xs sm:text-sm">
                    {company.name}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-xl sm:text-2xl font-bold font-mono uppercase">REVIEWS</h2>
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="px-4 py-2 rounded-lg bg-[#0f0f0f] border-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all flex items-center gap-2 font-mono uppercase text-sm"
          >
            <MessageSquare className="w-4 h-4" />
            {userReview ? 'EDIT REVIEW' : 'WRITE REVIEW'}
          </button>
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <div className="mb-6 p-6 rounded-xl bg-[#0f0f0f] border-2 border-cyan-500/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold font-mono uppercase">{userReview ? 'EDIT REVIEW' : 'WRITE REVIEW'}</h3>
              <button
                onClick={() => setShowReviewForm(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm font-mono mb-2 block">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className="text-2xl"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewForm.rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-sm font-mono mb-2 block">Title (Optional)</label>
                <input
                  type="text"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                  placeholder="Review title..."
                  className="w-full h-10 px-4 bg-[#0a0a0a] border-2 border-cyan-500/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-mono"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm font-mono mb-2 block">Review</label>
                <textarea
                  value={reviewForm.content}
                  onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                  placeholder="Write your review..."
                  rows={4}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border-2 border-cyan-500/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all resize-none font-mono"
                />
              </div>
              <button
                onClick={submitReview}
                className="w-full h-10 px-6 rounded-lg bg-[#0f0f0f] border-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all flex items-center justify-center gap-2 font-mono uppercase"
              >
                {userReview ? 'UPDATE REVIEW' : 'SUBMIT REVIEW'}
              </button>
            </div>
          </div>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-cyan-400/20 mx-auto mb-4" />
            <p className="text-gray-400 text-sm font-mono">NO REVIEWS YET. BE THE FIRST TO REVIEW!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review._id} className="p-6 rounded-xl bg-[#0f0f0f] border-2 border-cyan-500/20">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {review.user?.photo ? (
                      <img
                        src={`http://localhost:5000${review.user.photo}`}
                        alt={review.user.fullName}
                        className="w-10 h-10 rounded-lg object-cover border-2 border-cyan-500/30"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm ${review.user?.photo ? 'hidden' : ''}`}>
                      {review.user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                    </div>
                    <div>
                      <div className="text-white font-semibold">{review.user?.fullName || review.user?.username || 'Anonymous'}</div>
                      <div className="text-gray-400 text-xs font-mono">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {review.title && (
                  <h4 className="text-white font-bold mb-2">{review.title}</h4>
                )}
                <p className="text-gray-300 mb-3 leading-relaxed">{review.content}</p>
                <button
                  onClick={() => likeReview(review._id)}
                  className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors font-mono text-sm"
                >
                  <ThumbsUp className={`w-4 h-4 ${review.isLiked ? 'fill-current text-cyan-400' : ''}`} />
                  <span>{review.likes?.length || 0} likes</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Watchlist Selection Modal */}
      {showWatchlistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f0f0f] border border-cyan-500/30 rounded-xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white text-xl font-bold">Add to Watchlist</h3>
              <button
                onClick={() => setShowWatchlistModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              {/* Personal Watchlist */}
              <button
                onClick={() => addToWatchlist(null)}
                className="w-full p-4 rounded-lg bg-[#0a0a0a] border border-cyan-500/30 hover:border-cyan-500/50 transition-all text-left flex items-center gap-3"
              >
                <Bookmark className="w-5 h-5 text-cyan-400" />
                <div>
                  <div className="text-white font-semibold">My Watchlist</div>
                  <div className="text-gray-400 text-sm">Personal watchlist</div>
                </div>
              </button>

              {/* Shared Watchlists */}
              <div className="text-gray-400 text-sm font-mono uppercase mt-4 mb-2">Shared Watchlists</div>
              {sharedWatchlists.length > 0 ? (
                sharedWatchlists.map((watchlist) => (
                  <button
                    key={watchlist._id}
                    onClick={() => addToWatchlist(watchlist._id)}
                    className="w-full p-4 rounded-lg bg-[#0a0a0a] border border-purple-500/30 hover:border-purple-500/50 transition-all text-left flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Bookmark className="w-5 h-5 text-purple-400" />
                      <div>
                        <div className="text-white font-semibold">{watchlist.name}</div>
                        <div className="text-gray-400 text-sm">
                          {watchlist.movieCount || watchlist.movies?.length || 0} movies
                        </div>
                      </div>
                    </div>
                    {watchlist.isPublic && (
                      <span className="px-2 py-1 bg-purple-500/10 border border-purple-500/30 rounded text-purple-400 text-xs font-mono">
                        Public
                      </span>
                    )}
                  </button>
                ))
              ) : (
                <div className="text-center py-4 text-gray-400 text-sm border border-gray-800 rounded-lg p-4">
                  <p className="mb-2">No shared watchlists available</p>
                  <p className="text-xs text-gray-500">Create a shared watchlist from the Shared Watchlists page</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieDetails;
