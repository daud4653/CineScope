import sys
import json
import pickle
import numpy as np
import os

# Suppress all warnings and output except JSON result
import warnings
warnings.filterwarnings('ignore')
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # Suppress TensorFlow warnings

# Redirect stderr to suppress Python output
import sys
sys.stderr = open(os.devnull, 'w')

try:
    from tensorflow import keras
    import tensorflow as tf
    tf.get_logger().setLevel('ERROR')
except:
    pass

# Get arguments
user_ratings_json = sys.argv[1]
user_id = sys.argv[2]

# Load models
model_path = os.path.join(os.path.dirname(__file__), '../../aimodel')
model_file = os.path.join(model_path, 'movie_recommender_dl.h5')

model = None
try:
    # Try loading with compile=False to avoid metrics deserialization issues
    try:
        import tensorflow as tf
        tf.get_logger().setLevel('ERROR')
        # Try with safe_mode=False to bypass validation
        try:
            model = tf.keras.models.load_model(model_file, compile=False, safe_mode=False)
        except:
            # Try loading with legacy format
            try:
                # Use tf.compat.v1 for older models
                with tf.compat.v1.disable_eager_execution():
                    model = tf.keras.models.load_model(model_file, compile=False)
            except:
                # Last resort: try with keras directly
                try:
                    from tensorflow import keras
                    model = keras.models.load_model(model_file, compile=False)
                except:
                    model = None
    except:
        model = None
except Exception as e:
    # If all loading methods fail, output empty list and exit gracefully
    model = None

# If model failed to load, exit early
if model is None:
    print(json.dumps([]))
    sys.exit(0)

try:
    with open(os.path.join(model_path, 'movie_map.pkl'), 'rb') as f:
        movie_map = pickle.load(f)
    
    with open(os.path.join(model_path, 'user_map.pkl'), 'rb') as f:
        user_map = pickle.load(f)
    
    # Get user ratings
    user_ratings = json.loads(user_ratings_json)
    
    # Get user index
    if user_id in user_map:
        user_idx = user_map[user_id]
    else:
        # New user - use average user
        user_idx = len(user_map) // 2 if len(user_map) > 0 else 0
    
    # Get recommendations
    user_vector = np.array([[user_idx]])
    predictions = model.predict(user_vector, verbose=0)
    
    # Get top recommendations
    top_indices = np.argsort(predictions[0])[-10:][::-1]
    
    # Map back to movie IDs
    recommendations = []
    for idx in top_indices:
        for movie_id, movie_idx in movie_map.items():
            if movie_idx == idx:
                recommendations.append(int(movie_id))
                break
    
    # Output only JSON to stdout (this is the only output)
    print(json.dumps(recommendations))
    sys.stdout.flush()  # Ensure output is flushed
except Exception as e:
    # If anything fails, return empty list gracefully
    print(json.dumps([]))
    sys.stdout.flush()
    sys.exit(0)

