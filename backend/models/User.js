import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Please provide a full name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    photo: {
      type: String,
      default: '',
    },
    favoriteGenres: [
      {
        type: String,
      },
    ],
    watchHistory: [
      {
        movieId: { type: Number, required: true },
        movieTitle: String,
        watchedAt: { type: Date, default: Date.now },
        progress: { type: Number, default: 0 }, // 0-100
      },
    ],
    ratings: [
      {
        movieId: { type: Number, required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    privacy: {
      profileVisibility: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },
      showWatchHistory: { type: Boolean, default: true },
      showRatings: { type: Boolean, default: true },
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    premiumExpiresAt: Date,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Generate username from email if not provided
userSchema.pre('save', async function (next) {
  if (!this.username && this.email) {
    this.username = this.email.split('@')[0] + '_' + Date.now().toString().slice(-6);
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get user stats
userSchema.methods.getStats = function () {
  return {
    moviesWatched: this.watchHistory.length,
    reviewsWritten: 0, // Will be populated from reviews collection
    totalWatchTime: this.watchHistory.reduce((sum, item) => sum + (item.progress || 0), 0),
    averageRating: this.ratings.length > 0
      ? this.ratings.reduce((sum, r) => sum + r.rating, 0) / this.ratings.length
      : 0,
  };
};

const User = mongoose.model('User', userSchema);

export default User;

