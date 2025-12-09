# Fix MongoDB Connection Error

## Problem
MongoDB Atlas is blocking the connection because your IP address is not whitelisted.

## Solution

### Option 1: Whitelist Your IP (Recommended for Production)

1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com)
2. Click on **Network Access** in the left sidebar
3. Click **Add IP Address**
4. Click **Add Current IP Address** (or manually enter your IP)
5. Click **Confirm**

### Option 2: Allow All IPs (Development Only - NOT for Production)

1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com)
2. Click on **Network Access**
3. Click **Add IP Address**
4. Enter `0.0.0.0/0` (allows all IPs)
5. Add a comment: "Development - Allow all"
6. Click **Confirm**

⚠️ **WARNING**: Option 2 is only for development. Never use `0.0.0.0/0` in production!

## Verify Connection String

Make sure your `.env` file has the correct connection string:

```
MONGODB_URI=mongodb+srv://daud4653_db_user:qLSXuB94SVJCOMCb@cinescope.7qzlmxq.mongodb.net/cinescope?retryWrites=true&w=majority
```

## After Whitelisting

1. Restart your backend server
2. You should see: `✅ MongoDB Connected Successfully`

