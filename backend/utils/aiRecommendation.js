import { PythonShell } from 'python-shell';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODEL_PATH = path.join(__dirname, '../../aimodel');
const PYTHON_SCRIPT = path.join(__dirname, 'aiRecommendation.py');

export const getAIRecommendations = async (userId, userRatings = []) => {
  try {
    // Skip Python AI for quick demo - use smart fallback
    console.log('ℹ️  Using fallback recommendations');
    return await getFallbackRecommendations(userRatings);
    
    // Check if models exist
    const modelFiles = [
      'movie_recommender_dl.h5',
      'movie_map.pkl',
      'user_map.pkl',
    ];

    const modelsExist = modelFiles.every((file) =>
      fs.existsSync(path.join(MODEL_PATH, file))
    );

    if (!modelsExist) {
      console.warn('⚠️  AI models not found, using fallback recommendations');
      return await getFallbackRecommendations(userRatings);
    }

    // Check if Python script exists
    if (!fs.existsSync(PYTHON_SCRIPT)) {
      console.warn('⚠️  Python script not found, using fallback recommendations');
      return await getFallbackRecommendations(userRatings);
    }

    // Prepare user ratings data
    const ratingsData = userRatings.map((r) => ({
      movieId: r.movieId,
      rating: r.rating,
    }));

    // Run Python script
    // Try to find compatible Python version (3.10, 3.11, or 3.12)
    let pythonPath = 'python';
    
    try {
      // Try Python 3.12 first - get actual executable path
      execSync('py -3.12 --version', { stdio: 'ignore' });
      const python312Path = execSync('py -3.12 -c "import sys; print(sys.executable)"', { encoding: 'utf-8' }).trim();
      pythonPath = python312Path;
      console.log('✅ Using Python 3.12 for AI recommendations');
    } catch {
      try {
        // Try Python 3.11
        execSync('py -3.11 --version', { stdio: 'ignore' });
        const python311Path = execSync('py -3.11 -c "import sys; print(sys.executable)"', { encoding: 'utf-8' }).trim();
        pythonPath = python311Path;
        console.log('✅ Using Python 3.11 for AI recommendations');
      } catch {
        try {
          // Try Python 3.10
          execSync('py -3.10 --version', { stdio: 'ignore' });
          const python310Path = execSync('py -3.10 -c "import sys; print(sys.executable)"', { encoding: 'utf-8' }).trim();
          pythonPath = python310Path;
          console.log('✅ Using Python 3.10 for AI recommendations');
        } catch {
          // Fallback to default python
          pythonPath = process.env.PYTHON_PATH || 'python';
          console.warn('⚠️  Using default Python - may not be compatible with TensorFlow');
        }
      }
    }
    
    // Normalize the path to avoid duplication issues
    const normalizedScriptPath = path.normalize(PYTHON_SCRIPT);
    
    const options = {
      mode: 'text',
      pythonPath: pythonPath,
      pythonOptions: ['-u'],
      args: [JSON.stringify(ratingsData), userId],
    };

    // Add timeout to prevent hanging (30 seconds)
    const TIMEOUT_MS = 30000;
    
    return new Promise((resolve) => {
      let resolved = false;
      
      // Set up timeout
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.warn('⚠️  Python script timeout after 30s. Using fallback recommendations.');
          getFallbackRecommendations(userRatings).then(resolve).catch(() => {
            resolve([550, 238, 240, 424, 497, 680, 13, 769, 155, 429]);
          });
        }
      }, TIMEOUT_MS);

      // Use just the filename with scriptPath set to the directory
      // This prevents path duplication issues
      const scriptName = path.basename(normalizedScriptPath);
      const scriptDir = path.dirname(normalizedScriptPath);
      
      const runOptions = {
        ...options,
        scriptPath: scriptDir,
      };
      
      PythonShell.run(scriptName, runOptions, (err, results) => {
        if (resolved) return; // Already handled by timeout
        
        clearTimeout(timeoutId);
        resolved = true;
        
        if (err) {
          // Check if it's a missing module error
          if (err.message && err.message.includes('ModuleNotFoundError')) {
            console.warn('⚠️  Python dependencies not installed. Using fallback recommendations.');
          } else if (err.message && (err.message.includes('Could not deserialize') || err.message.includes('KerasSaveable'))) {
            console.warn('⚠️  Keras model compatibility issue. Using fallback recommendations.');
          } else {
            // Only log non-critical errors (suppress timeout/killed messages)
            if (!err.message || (!err.message.includes('timeout') && !err.message.includes('killed') && !err.message.includes('SIGTERM'))) {
              console.warn('⚠️  Python script error:', err.message || err);
            }
          }
          // Always resolve with fallback, never reject
          getFallbackRecommendations(userRatings).then(resolve).catch(() => {
            resolve([550, 238, 240, 424, 497, 680, 13, 769, 155, 429]);
          });
          return;
        }

        try {
          if (results && results.length > 0) {
            // Get the last line (should be JSON)
            const output = results[results.length - 1].trim();
            if (output) {
              const recommendations = JSON.parse(output);
              // If empty array returned (model loading failed), use fallback
              if (Array.isArray(recommendations) && recommendations.length > 0) {
                resolve(recommendations);
              } else {
                getFallbackRecommendations(userRatings).then(resolve).catch(() => {
                  resolve([550, 238, 240, 424, 497, 680, 13, 769, 155, 429]);
                });
              }
            } else {
              getFallbackRecommendations(userRatings).then(resolve).catch(() => {
                resolve([550, 238, 240, 424, 497, 680, 13, 769, 155, 429]);
              });
            }
          } else {
            getFallbackRecommendations(userRatings).then(resolve).catch(() => {
              resolve([550, 238, 240, 424, 497, 680, 13, 769, 155, 429]);
            });
          }
        } catch (parseError) {
          console.warn('⚠️  Parse error:', parseError.message);
          getFallbackRecommendations(userRatings).then(resolve).catch(() => {
            resolve([550, 238, 240, 424, 497, 680, 13, 769, 155, 429]);
          });
        }
      });
    });
  } catch (error) {
    console.warn('⚠️  AI Recommendation Error:', error.message || error);
    return await getFallbackRecommendations(userRatings).catch(() => {
      return [550, 238, 240, 424, 497, 680, 13, 769, 155, 429];
    });
  }
};

const getFallbackRecommendations = async (userRatings) => {
  // Fallback: Return popular movie IDs if AI model fails
  // Try to fetch from TMDB if available
  try {
    const { getPopularMovies } = await import('./tmdb.js');
    const popular = await getPopularMovies(1);
    if (popular.results && popular.results.length > 0) {
      return popular.results.slice(0, 10).map(m => m.id);
    }
  } catch (error) {
    console.warn('Could not fetch popular movies for fallback:', error.message);
  }
  // Ultimate fallback: hardcoded popular movie IDs
  return [550, 238, 240, 424, 497, 680, 13, 769, 155, 429];
};

export const getContentBasedRecommendations = async (movieId, genres = []) => {
  // Content-based filtering using movie features
  // This would use the movie_map.pkl to find similar movies
  try {
    // Simplified content-based recommendation
    // In production, use cosine similarity on movie features
    return [];
  } catch (error) {
    console.error('Content-based recommendation error:', error);
    return [];
  }
};

