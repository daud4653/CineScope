import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'friend_request',
        'friend_accepted',
        'review_liked',
        'review_comment',
        'watchlist_shared',
        'movie_recommended',
        'blog_published',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    relatedMovie: Number,
    relatedReview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review',
    },
    relatedBlog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;

