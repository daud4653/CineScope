# Installation Guide

## Quick Start

1. **Copy environment file:**
   ```bash
   # Copy env-template.txt to .env
   # On Windows PowerShell:
   Copy-Item env-template.txt .env
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Install Python dependencies (for AI models):**
   ```bash
   pip install tensorflow numpy
   ```

4. **Start the server:**
   ```bash
   npm run dev
   ```

## Manual .env Setup

If the copy command doesn't work, manually create a `.env` file in the `backend` folder with:

```
PORT=5000
MONGODB_URI=mongodb+srv://daud4653_db_user:qLSXuB94SVJCOMCb@cinescope.7qzlmxq.mongodb.net/cinescope?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
JWT_EXPIRE=7d
TMDB_API_KEY=1f54bd990f1cdfb230adb312546d765d
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=development
```

## Verify Installation

1. Start the server: `npm run dev`
2. Test the API: Open `http://localhost:5000/api/health` in your browser
3. You should see: `{"status":"OK","message":"CineScope API is running"}`

## Troubleshooting

- **MongoDB Connection Error**: Check your MongoDB URI in `.env`
- **Python Errors**: Make sure TensorFlow is installed: `pip install tensorflow`
- **Port Already in Use**: Change PORT in `.env` to a different number

