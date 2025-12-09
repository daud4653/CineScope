# Install Python Dependencies for AI Recommendations

## ⚠️ Important: Python Version Requirement

TensorFlow currently supports **Python 3.9 to 3.11**. Your current Python version is 3.14, which is not supported yet.

## Option 1: Install Compatible Python Version (Recommended)

1. **Download Python 3.11** from: https://www.python.org/downloads/
2. **Install Python 3.11** (make sure to check "Add Python to PATH")
3. **Verify installation:**
   ```bash
   python3.11 --version
   ```
4. **Install dependencies:**
   ```bash
   python3.11 -m pip install tensorflow numpy
   ```
5. **Update PythonShell to use Python 3.11:**
   - The code will automatically detect Python, but you may need to specify the path

## Option 2: Use Fallback Recommendations (Current Setup)

The app is already configured to use **fallback recommendations** (popular movies from TMDB) when Python dependencies are missing. The server will **NOT crash** and will work fine without TensorFlow.

## Option 3: Use Virtual Environment (Best Practice)

```bash
# Create virtual environment with Python 3.11
python3.11 -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install tensorflow numpy

# The server will use this Python environment
```

## Current Status

✅ **Server works without Python dependencies** - Uses fallback recommendations
✅ **No crashes** - All errors are handled gracefully
⚠️ **AI recommendations disabled** - Will use popular movies instead

## To Enable AI Recommendations

Once you have Python 3.9-3.11 installed with TensorFlow:
1. Restart the backend server
2. AI recommendations will automatically work
3. You'll see: `✅ AI recommendations enabled` in the console

