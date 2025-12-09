import { useState } from 'react';
import { Star, Heart, MessageCircle, Send, User } from 'lucide-react';

const Reviews = () => {
  const [reviews, setReviews] = useState([
    {
      id: 1,
      author: 'Alex Chen',
      movie: 'Inception',
      rating: 5,
      text: 'Mind-bending masterpiece! Christopher Nolan at his finest. The visual effects and storytelling are absolutely incredible.',
      likes: 42,
      comments: 8,
      time: '2 hours ago',
    },
    {
      id: 2,
      author: 'Sarah Johnson',
      movie: 'The Dark Knight',
      rating: 5,
      text: 'Heath Ledger\'s Joker is legendary. This is not just a superhero movie, it\'s a crime epic.',
      likes: 89,
      comments: 15,
      time: '5 hours ago',
    },
    {
      id: 3,
      author: 'Mike Rodriguez',
      movie: 'Interstellar',
      rating: 4,
      text: 'Emotional and visually stunning. The science might be complex, but the heart of the story is what matters.',
      likes: 67,
      comments: 12,
      time: '1 day ago',
    },
  ]);

  const [newReview, setNewReview] = useState('');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-4xl font-black mb-2 tracking-tight">Reviews & Blogs</h1>
        <p className="text-gray-400 font-mono text-sm">Share your thoughts and discover reviews</p>
      </div>

      {/* Write Review */}
      <div className="p-6 rounded-xl bg-[#0f0f0f] border border-cyan-500/20" style={{ boxShadow: '0 0 30px rgba(6, 182, 212, 0.1)' }}>
        <h2 className="text-white text-xl font-bold mb-4">Write a Review</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Movie title..."
            className="w-full h-12 px-4 bg-[#0a0a0a] border border-cyan-500/30 text-cyan-400 placeholder:text-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-mono"
          />
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} className="text-yellow-400 hover:text-yellow-300 transition-colors">
                <Star className="w-6 h-6 fill-current" />
              </button>
            ))}
          </div>
          <textarea
            placeholder="Write your review..."
            value={newReview}
            onChange={(e) => setNewReview(e.target.value)}
            className="w-full h-32 px-4 py-3 bg-[#0a0a0a] border border-cyan-500/30 text-white placeholder:text-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all resize-none"
          />
          <button className="px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-cyan-500 to-purple-500 text-white flex items-center gap-2 border border-cyan-400/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all">
            <Send className="w-5 h-5" />
            Publish Review
          </button>
        </div>
      </div>

      {/* Reviews Feed */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="p-6 rounded-xl bg-[#0f0f0f] border border-cyan-500/20 hover:border-cyan-500/40 transition-all"
            style={{ boxShadow: '0 0 20px rgba(6, 182, 212, 0.1)' }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                {review.author[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-white font-bold">{review.author}</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-cyan-400 font-mono text-sm">{review.movie}</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400 text-xs font-mono">{review.time}</span>
                </div>
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-gray-300 mb-4 leading-relaxed">{review.text}</p>
                <div className="flex items-center gap-6">
                  <button className="flex items-center gap-2 text-gray-400 hover:text-pink-400 transition-colors">
                    <Heart className="w-4 h-4" />
                    <span className="text-sm font-mono">{review.likes}</span>
                  </button>
                  <button className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm font-mono">{review.comments}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reviews;

