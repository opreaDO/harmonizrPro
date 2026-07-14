# ==============================================================================
# COLAB TRAINING SCRIPT
# ==============================================================================
# INSTRUCTIONS:
# Do not run this script locally on Windows. It is designed to be copy-pasted
# directly into a Google Colab (or Kaggle) Jupyter Notebook cell.
# 
# 1. Open Google Colab (https://colab.research.google.com/)
# 2. Set Runtime to CPU (Hardware Accelerator).
# 3. Upload your compressed dataset (train_triplets.zip) to your Google Drive.
# 4. Copy and paste everything below this line into Colab and hit run!
# ==============================================================================

#!pip install implicit pandas numpy scipy

import zipfile
import os
import pandas as pd
import numpy as np
import implicit
from scipy.sparse import csr_matrix
import pickle
from google.colab import drive
from implicit.evaluation import train_test_split, precision_at_k

print("Mounting Google Drive to access the dataset...")
drive.mount('/content/drive')

# Update this path if you placed the zip in a specific folder inside your Drive
zip_path = '/content/drive/MyDrive/train_triplets.zip' 

if not os.path.exists('/content/train_triplets.txt'):
    print(f"Extracting dataset from {zip_path}...")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall('/content/')
    print("Extraction complete!")

print("Loading the full 48-million row dataset into memory...")
dtypes = {'user_id': 'category', 'track_id': 'category', 'play_count': np.uint16}
df = pd.read_csv('/content/train_triplets.txt', sep='\t', names=['user_id', 'track_id', 'play_count'], dtype=dtypes)
print(f"Loaded {len(df)} rows.")

print("Creating unique mappings...")
unique_users = df['user_id'].unique()
unique_tracks = df['track_id'].unique()

user_to_idx = {user: idx for idx, user in enumerate(unique_users)}
idx_to_user = {idx: user for user, idx in user_to_idx.items()}
track_to_idx = {track: idx for idx, track in enumerate(unique_tracks)}
idx_to_track = {idx: track for track, idx in track_to_idx.items()}

print("Building sparse matrix...")
user_indices = df['user_id'].map(user_to_idx).values
track_indices = df['track_id'].map(track_to_idx).values
play_counts = df['play_count'].values.astype(np.float32)

user_items = csr_matrix((play_counts, (user_indices, track_indices)), shape=(len(unique_users), len(unique_tracks)))

print("Applying BM25 weighting to eliminate popularity bias...")
from implicit.nearest_neighbours import bm25_weight
user_items = bm25_weight(user_items, K1=100, B=0.8)

# ==============================================================================
# OVERFITTING CHECK (OPTIONAL)
# ==============================================================================
print("Running Train/Test Split to verify model generalization (Overfitting Check)...")
train_data, test_data = train_test_split(user_items, train_percentage=0.8)
test_model = implicit.als.AlternatingLeastSquares(factors=50, regularization=0.1, iterations=15, num_threads=0)
test_model.fit(train_data)
p_at_k = precision_at_k(test_model, train_data, test_data, K=10, show_progress=False)
print(f"Model Precision@10: {p_at_k * 100:.2f}%")
print("==============================================================================")

print("Training Final ALS model on all available data...")
# num_threads=0 automatically uses all available cores on the Colab Linux server
model = implicit.als.AlternatingLeastSquares(factors=50, regularization=0.1, iterations=15, num_threads=0) 
model.fit(user_items)

print("Saving models to /content/ directory...")
with open('als_model.pkl', 'wb') as f: pickle.dump(model, f)
with open('user_mapping.pkl', 'wb') as f: pickle.dump((user_to_idx, idx_to_user), f)
with open('track_mapping.pkl', 'wb') as f: pickle.dump((track_to_idx, idx_to_track), f)
with open('user_items.pkl', 'wb') as f: pickle.dump(user_items, f)

print("SUCCESS! Check the Colab file browser (left sidebar -> Folder Icon) to download the 4 .pkl files!")
