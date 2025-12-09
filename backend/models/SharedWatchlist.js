import mongoose from 'mongoose';

const sharedWatchlistSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      maxlength: [100, 'Watchlist name cannot exceed 100 characters'],
    },
    description: String,
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['owner', 'editor', 'viewer'],
          default: 'viewer',
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    movies: [
      {
        movieId: { type: Number, required: true },
        movieTitle: String,
        moviePoster: String,
        movieBackdrop: String,
        movieOverview: String,
        movieReleaseDate: Date,
        movieRating: Number,
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for movie count
sharedWatchlistSchema.virtual('movieCount').get(function() {
  return this.movies ? this.movies.length : 0;
});

// Ensure virtuals are included in JSON
sharedWatchlistSchema.set('toJSON', { virtuals: true });
sharedWatchlistSchema.set('toObject', { virtuals: true });

const SharedWatchlist = mongoose.model('SharedWatchlist', sharedWatchlistSchema);

export default SharedWatchlist;

