import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables FIRST, before importing any routes
// Specify the path explicitly to ensure .env is found
const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

// Verify critical environment variables
console.log('🔍 Checking environment variables...');
console.log('📁 .env file path:', envPath);
console.log('📁 .env file exists:', fs.existsSync(envPath));
console.log('🔑 TMDB_API_KEY loaded:', !!process.env.TMDB_API_KEY);
if (process.env.TMDB_API_KEY) {
  console.log('🔑 TMDB_API_KEY value:', process.env.TMDB_API_KEY.substring(0, 10) + '...');
}

if (!process.env.TMDB_API_KEY) {
  console.error('⚠️  WARNING: TMDB_API_KEY is not set in environment variables!');
  console.error('Please make sure your .env file contains: TMDB_API_KEY=your_api_key');
  console.error('Current working directory:', process.cwd());
  console.error('__dirname:', __dirname);
}

// Import Routes (after dotenv.config())
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import movieRoutes from './routes/movies.js';
import watchlistRoutes from './routes/watchlist.js';
import reviewRoutes from './routes/reviews.js';
import blogRoutes from './routes/blogs.js';
import analyticsRoutes from './routes/analytics.js';
import recommendationRoutes from './routes/recommendations.js';
import socialRoutes from './routes/social.js';

// Create necessary directories
const dirs = ['uploads/profiles', 'temp'];
dirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected Successfully');
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🌐 Host: ${conn.connection.host}`);
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.error('\n💡 Troubleshooting:');
    console.error('1. Check if your IP is whitelisted in MongoDB Atlas');
    console.error('2. Go to: https://cloud.mongodb.com → Network Access → Add IP Address');
    console.error('3. For development, you can use: 0.0.0.0/0 (allows all IPs - NOT for production)');
    console.error('4. Verify your MongoDB connection string in .env file');
    console.error('\n⚠️  Server will continue running but database features will not work.');
    // Don't exit - allow server to run without DB for testing
  }
};

connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/social', socialRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'CineScope API is running' });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 TMDB API Key: ${process.env.TMDB_API_KEY ? '✅ Loaded' : '❌ Missing'}`);
});

export default app;

