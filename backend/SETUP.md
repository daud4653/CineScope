# Backend Setup Instructions

## 1. Environment Variables

Create a `.env` file in the `backend` folder with the following content:

```
PORT=5000
MONGODB_URI=mongodb+srv://daud4653_db_user:qLSXuB94SVJCOMCb@cinescope.7qzlmxq.mongodb.net/cinescope?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
JWT_EXPIRE=7d
TMDB_API_KEY=1f54bd990f1cdfb230adb312546d765d
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=development
```

## 2. Python Dependencies (for AI Models)

Install Python dependencies:
```bash
pip install tensorflow numpy pickle-mixin
```

## 3. Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Or use the batch file:
```bash
start.bat
```

## 4. Test the API

The server will run on `http://localhost:5000`

Test health endpoint:
```bash
curl http://localhost:5000/api/health
```

## API Base URL

All API endpoints are prefixed with `/api`

Example: `http://localhost:5000/api/auth/login`

