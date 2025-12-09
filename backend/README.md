# CineScope Backend API

Complete backend API for CineScope - AI-powered movie discovery and collaboration platform.

## Features

- ✅ JWT Authentication with bcrypt password hashing
- ✅ User Management (Profile, Watch History, Ratings)
- ✅ TMDB Integration (Movies, TV Shows, Search)
- ✅ Watchlist CRUD Operations
- ✅ Reviews & Blogs System
- ✅ AI Recommendation System (Deep Learning Model Integration)
- ✅ Analytics Dashboard with PDF Export
- ✅ Social Features (Friends, Notifications, Shared Watchlists)
- ✅ Error Handling & Validation

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (already created with your MongoDB credentials)

3. Install Python dependencies for AI models:
```bash
pip install tensorflow numpy pickle-mixin
```

4. Start the server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/watch-history` - Add to watch history
- `POST /api/users/rating` - Add/update movie rating

### Movies
- `GET /api/movies/search` - Search movies/TV/actors
- `GET /api/movies/popular` - Get popular movies
- `GET /api/movies/:id` - Get movie details
- `GET /api/movies/genres` - Get genres

### Watchlist
- `GET /api/watchlist` - Get user watchlist
- `POST /api/watchlist` - Add to watchlist
- `DELETE /api/watchlist/:id` - Remove from watchlist

### Reviews
- `GET /api/reviews` - Get reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `POST /api/reviews/:id/like` - Like review

### Analytics
- `GET /api/analytics` - Get user analytics
- `GET /api/analytics/pdf` - Export analytics as PDF

### Recommendations
- `GET /api/recommendations` - Get AI recommendations
- `GET /api/recommendations/content-based/:movieId` - Content-based recommendations

### Social
- `GET /api/social/friends` - Get friends
- `POST /api/social/friends/request` - Send friend request
- `GET /api/social/notifications` - Get notifications

## Environment Variables

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
TMDB_API_KEY=your_tmdb_api_key
OPENAI_API_KEY=your_openai_api_key
NODE_ENV=development
```

