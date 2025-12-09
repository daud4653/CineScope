import express from 'express';
import { body, validationResult } from 'express-validator';
import Friend from '../models/Friend.js';
import Notification from '../models/Notification.js';
import SharedWatchlist from '../models/SharedWatchlist.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/social/friends
// @desc    Get user's friends
// @access  Private
router.get('/friends', protect, async (req, res, next) => {
  try {
    const friends = await Friend.find({
      $or: [
        { requester: req.user._id, status: 'accepted' },
        { recipient: req.user._id, status: 'accepted' },
      ],
    })
      .populate('requester', 'fullName username photo favoriteGenres')
      .populate('recipient', 'fullName username photo favoriteGenres');

    const friendsList = friends.map((friend) => {
      const friendUser =
        friend.requester._id.toString() === req.user._id.toString()
          ? friend.recipient
          : friend.requester;
      return friendUser;
    });

    res.json({
      success: true,
      friends: friendsList,
      count: friendsList.length,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/social/friends/request
// @desc    Send friend request
// @access  Private
router.post(
  '/friends/request',
  protect,
  [body('userId').notEmpty().withMessage('User ID is required')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { userId } = req.body;

      if (userId === req.user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Cannot send friend request to yourself',
        });
      }

      // Check if request already exists
      const existingRequest = await Friend.findOne({
        $or: [
          { requester: req.user._id, recipient: userId },
          { requester: userId, recipient: req.user._id },
        ],
      });

      if (existingRequest) {
        return res.status(400).json({
          success: false,
          message: 'Friend request already exists',
        });
      }

      const friendRequest = await Friend.create({
        requester: req.user._id,
        recipient: userId,
        status: 'pending',
      });

      // Create notification
      await Notification.create({
        user: userId,
        type: 'friend_request',
        title: 'New Friend Request',
        message: `${req.user.fullName} sent you a friend request`,
        relatedUser: req.user._id,
      });

      res.status(201).json({
        success: true,
        friendRequest,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Friend request already exists',
        });
      }
      next(error);
    }
  }
);

// @route   PUT /api/social/friends/accept/:requestId
// @desc    Accept friend request
// @access  Private
router.put('/friends/accept/:requestId', protect, async (req, res, next) => {
  try {
    const friendRequest = await Friend.findById(req.params.requestId);

    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found',
      });
    }

    if (friendRequest.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to accept this request',
      });
    }

    friendRequest.status = 'accepted';
    await friendRequest.save();

    // Create notification
    await Notification.create({
      user: friendRequest.requester,
      type: 'friend_accepted',
      title: 'Friend Request Accepted',
      message: `${req.user.fullName} accepted your friend request`,
      relatedUser: req.user._id,
    });

    res.json({
      success: true,
      friendRequest,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/social/notifications
// @desc    Get user notifications
// @access  Private
router.get('/notifications', protect, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const notifications = await Notification.find({ user: req.user._id })
      .populate('relatedUser', 'fullName username photo')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      isRead: false,
    });

    res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/social/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/notifications/:id/read', protect, async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    if (notification.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      success: true,
      notification,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/social/watchlist/share
// @desc    Create shared watchlist
// @access  Private
router.post(
  '/watchlist/share',
  protect,
  [
    body('name').notEmpty().withMessage('Watchlist name is required'),
    body('members').optional().isArray(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { name, description, members = [], isPublic } = req.body;

      const sharedWatchlist = await SharedWatchlist.create({
        owner: req.user._id,
        name,
        description,
        isPublic: isPublic || false,
        members: [
          {
            user: req.user._id,
            role: 'owner',
          },
          ...members.map((memberId) => ({
            user: memberId,
            role: 'viewer',
          })),
        ],
      });

      // Create notifications for members
      for (const memberId of members) {
        await Notification.create({
          user: memberId,
          type: 'watchlist_shared',
          title: 'Shared Watchlist',
          message: `${req.user.fullName} shared a watchlist with you: ${name}`,
          relatedUser: req.user._id,
        });
      }

      res.status(201).json({
        success: true,
        sharedWatchlist,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/social/watchlist/shared
// @desc    Get shared watchlists
// @access  Private
router.get('/watchlist/shared', protect, async (req, res, next) => {
  try {
    const sharedWatchlists = await SharedWatchlist.find({
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id },
        { isPublic: true },
      ],
    })
      .populate('owner', 'fullName username photo')
      .populate('members.user', 'fullName username photo')
      .sort({ createdAt: -1 });

    // Add movie count to each watchlist
    const watchlistsWithCount = sharedWatchlists.map(wl => ({
      ...wl.toObject(),
      movieCount: wl.movies ? wl.movies.length : 0,
    }));

    res.json({
      success: true,
      sharedWatchlists: watchlistsWithCount,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/social/watchlist/shared/:id
// @desc    Get a specific shared watchlist with movies
// @access  Private
router.get('/watchlist/shared/:id', protect, async (req, res, next) => {
  try {
    const sharedWatchlist = await SharedWatchlist.findById(req.params.id)
      .populate('owner', 'fullName username photo')
      .populate('members.user', 'fullName username photo')
      .populate('movies.addedBy', 'fullName username photo');

    if (!sharedWatchlist) {
      return res.status(404).json({
        success: false,
        message: 'Shared watchlist not found',
      });
    }

    // Check access - handle both populated and non-populated owner
    const ownerId = typeof sharedWatchlist.owner === 'object' 
      ? sharedWatchlist.owner._id.toString() 
      : sharedWatchlist.owner.toString();
    const isOwner = ownerId === req.user._id.toString();
    
    const isMember = sharedWatchlist.members.some(
      m => {
        const userId = typeof m.user === 'object' ? (m.user._id ? m.user._id.toString() : m.user.toString()) : m.user;
        return userId === req.user._id.toString();
      }
    );
    const isPublic = sharedWatchlist.isPublic;

    if (!isOwner && !isMember && !isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this watchlist. You must be a member or the watchlist must be public.',
      });
    }

    res.json({
      success: true,
      sharedWatchlist: {
        ...sharedWatchlist.toObject(),
        movieCount: sharedWatchlist.movies ? sharedWatchlist.movies.length : 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/social/watchlist/shared/:id/movies
// @desc    Add movie to shared watchlist
// @access  Private
router.post(
  '/watchlist/shared/:id/movies',
  protect,
  [
    body('movieId').isNumeric().withMessage('Movie ID is required'),
    body('movieTitle').notEmpty().withMessage('Movie title is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const sharedWatchlist = await SharedWatchlist.findById(req.params.id);

      if (!sharedWatchlist) {
        return res.status(404).json({
          success: false,
          message: 'Shared watchlist not found',
        });
      }

      // Check permissions - allow owner, editors, and viewers to add
      const ownerId = typeof sharedWatchlist.owner === 'object' 
        ? sharedWatchlist.owner._id.toString() 
        : sharedWatchlist.owner.toString();
      const isOwner = ownerId === req.user._id.toString();
      
      const member = sharedWatchlist.members.find(
        m => {
          const userId = typeof m.user === 'object' ? (m.user._id ? m.user._id.toString() : m.user.toString()) : m.user;
          return userId === req.user._id.toString();
        }
      );
      const isMember = !!member;
      const isPublic = sharedWatchlist.isPublic;
      
      // Allow if owner, member (any role), or public watchlist
      const canEdit = isOwner || isMember || isPublic;

      if (!canEdit) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to add movies to this watchlist. You must be a member or the watchlist must be public.',
        });
      }

      const { movieId, movieTitle } = req.body;

      // Check if movie already exists
      const movieExists = sharedWatchlist.movies.some(
        m => m.movieId === parseInt(movieId)
      );

      if (movieExists) {
        return res.status(400).json({
          success: false,
          message: 'Movie already in watchlist',
        });
      }

      // Get movie details from TMDB
      const { getMovieDetails } = await import('../utils/tmdb.js');
      let movieDetails = {};
      try {
        const tmdbData = await getMovieDetails(movieId);
        movieDetails = {
          moviePoster: tmdbData.poster_path,
          movieBackdrop: tmdbData.backdrop_path,
          movieOverview: tmdbData.overview,
          movieReleaseDate: tmdbData.release_date ? new Date(tmdbData.release_date) : null,
          movieRating: tmdbData.vote_average,
        };
      } catch (error) {
        console.error('Error fetching movie details:', error);
      }

      // Add movie
      sharedWatchlist.movies.push({
        movieId: parseInt(movieId),
        movieTitle,
        addedBy: req.user._id,
        addedAt: new Date(),
        ...movieDetails,
      });

      await sharedWatchlist.save();

      res.status(201).json({
        success: true,
        message: 'Movie added to shared watchlist',
        sharedWatchlist: {
          ...sharedWatchlist.toObject(),
          movieCount: sharedWatchlist.movies.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   DELETE /api/social/watchlist/shared/:id/movies/:movieId
// @desc    Remove movie from shared watchlist
// @access  Private
router.delete('/watchlist/shared/:id/movies/:movieId', protect, async (req, res, next) => {
  try {
    const sharedWatchlist = await SharedWatchlist.findById(req.params.id);

    if (!sharedWatchlist) {
      return res.status(404).json({
        success: false,
        message: 'Shared watchlist not found',
      });
    }

    // Check permissions (owner or editor can remove)
    const ownerId = typeof sharedWatchlist.owner === 'object' 
      ? sharedWatchlist.owner._id.toString() 
      : sharedWatchlist.owner.toString();
    const isOwner = ownerId === req.user._id.toString();
    
    const member = sharedWatchlist.members.find(
      m => {
        const userId = typeof m.user === 'object' ? (m.user._id ? m.user._id.toString() : m.user.toString()) : m.user;
        return userId === req.user._id.toString();
      }
    );
    const canEdit = isOwner || (member && ['owner', 'editor'].includes(member.role));

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to remove movies from this watchlist',
      });
    }

    const movieId = parseInt(req.params.movieId);
    sharedWatchlist.movies = sharedWatchlist.movies.filter(
      m => m.movieId !== movieId
    );

    await sharedWatchlist.save();

    res.json({
      success: true,
      message: 'Movie removed from shared watchlist',
      sharedWatchlist: {
        ...sharedWatchlist.toObject(),
        movieCount: sharedWatchlist.movies.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/social/users/search
// @desc    Search users
// @access  Private
router.get('/users/search', protect, async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        users: [],
      });
    }

    // Get current user's friends to exclude them
    const friends = await Friend.find({
      $or: [
        { requester: req.user._id, status: 'accepted' },
        { recipient: req.user._id, status: 'accepted' },
      ],
    });

    const friendIds = friends.map(f => 
      f.requester.toString() === req.user._id.toString() 
        ? f.recipient.toString() 
        : f.requester.toString()
    );

    // Search users
    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } },
        { _id: { $nin: friendIds } },
        {
          $or: [
            { fullName: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } },
            { username: { $regex: q, $options: 'i' } },
          ],
        },
      ],
    })
      .select('fullName email username photo favoriteGenres')
      .limit(10);

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/social/friends/requests
// @desc    Get friend requests (sent and received)
// @access  Private
router.get('/friends/requests', protect, async (req, res, next) => {
  try {
    const requests = await Friend.find({
      $or: [
        { requester: req.user._id, status: 'pending' },
        { recipient: req.user._id, status: 'pending' },
      ],
    })
      .populate('requester', 'fullName username photo email')
      .populate('recipient', 'fullName username photo email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      requests,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/social/friends/reject/:requestId
// @desc    Reject friend request
// @access  Private
router.put('/friends/reject/:requestId', protect, async (req, res, next) => {
  try {
    const friendRequest = await Friend.findById(req.params.requestId);

    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found',
      });
    }

    if (friendRequest.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject this request',
      });
    }

    await Friend.findByIdAndDelete(req.params.requestId);

    res.json({
      success: true,
      message: 'Friend request rejected',
    });
  } catch (error) {
    next(error);
  }
});

export default router;

