# CineScope API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### Register User
```
POST /api/auth/register
Body: {
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Login
```
POST /api/auth/login
Body: {
  "email": "john@example.com",
  "password": "password123"
}
Response: {
  "success": true,
  "token": "jwt_token_here",
  "user": { ... }
}
```

### Get Current User
```
GET /api/auth/me
Headers: Authorization: Bearer <token>
```

---

## User Endpoints

### Get Profile
```
GET /api/users/profile
```

### Update Profile
```
PUT /api/users/profile
Body: {
  "fullName": "John Doe",
  "bio": "Movie enthusiast",
  "favoriteGenres": ["Action", "Drama"]
}
```

### Add Watch History
```
POST /api/users/watch-history
Body: {
  "movieId": 550,
  "movieTitle": "Fight Club",
  "progress": 100
}
```

### Add Rating
```
POST /api/users/rating
Body: {
  "movieId": 550,
  "rating": 5
}
```

---

## Movie Endpoints

### Search
```
GET /api/movies/search?query=inception&type=movie&page=1
```

### Get Popular Movies
```
GET /api/movies/popular?page=1
```

### Get Movie Details
```
GET /api/movies/:id
```

### Get Genres
```
GET /api/movies/genres
```

---

## Watchlist Endpoints

### Get Watchlist
```
GET /api/watchlist
```

### Add to Watchlist
```
POST /api/watchlist
Body: {
  "movieId": 550,
  "movieTitle": "Fight Club",
  "priority": "high"
}
```

### Remove from Watchlist
```
DELETE /api/watchlist/:id
```

---

## Review Endpoints

### Get Reviews
```
GET /api/reviews?movieId=550&page=1
```

### Create Review
```
POST /api/reviews
Body: {
  "movieId": 550,
  "movieTitle": "Fight Club",
  "rating": 5,
  "content": "Amazing movie!",
  "title": "My Review"
}
```

### Like Review
```
POST /api/reviews/:id/like
```

---

## Analytics Endpoints

### Get Analytics
```
GET /api/analytics
```

### Export PDF
```
GET /api/analytics/pdf
```

---

## Recommendations

### Get AI Recommendations
```
GET /api/recommendations
```

### Content-Based Recommendations
```
GET /api/recommendations/content-based/:movieId
```

---

## Social Endpoints

### Get Friends
```
GET /api/social/friends
```

### Send Friend Request
```
POST /api/social/friends/request
Body: {
  "userId": "user_id_here"
}
```

### Get Notifications
```
GET /api/social/notifications
```

### Mark Notification as Read
```
PUT /api/social/notifications/:id/read
```

---

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "message": "Error message here"
}
```

## Success Responses

All success responses include:
```json
{
  "success": true,
  "data": { ... }
}
```

