#!/bin/bash

# Define the target directory via command line argument, fallback to default
DATA_DIR=${1:-"data/raw/msd"}
mkdir -p "$DATA_DIR"

echo "========================================"
echo "  Downloading Million Song Dataset Data "
echo "========================================"

# 1. Download interactions (train_triplets)
if [ -f "$DATA_DIR/train_triplets.txt" ]; then
    echo "[Skip] train_triplets.txt already exists."
else
    echo "[1/3] Downloading train_triplets.txt.zip..."
    wget -q --show-progress "http://millionsongdataset.com/sites/default/files/challenge/train_triplets.txt.zip" -O "$DATA_DIR/train_triplets.txt.zip"
    echo "Unzipping triplets..."
    unzip -q "$DATA_DIR/train_triplets.txt.zip" -d "$DATA_DIR/"
    rm "$DATA_DIR/train_triplets.txt.zip"
fi

# 2. Download Track Metadata DB
if [ -f "$DATA_DIR/track_metadata.db" ]; then
    echo "[Skip] track_metadata.db already exists."
else
    echo "[2/3] Downloading track_metadata.db..."
    wget -q --show-progress "http://millionsongdataset.com/sites/default/files/AdditionalFiles/track_metadata.db" -O "$DATA_DIR/track_metadata.db"
fi

# 3. Download Last.fm Tags DB
if [ -f "$DATA_DIR/lastfm_tags.db" ]; then
    echo "[Skip] lastfm_tags.db already exists."
else
    echo "[3/3] Downloading lastfm_tags.db..."
    wget -q --show-progress "http://millionsongdataset.com/sites/default/files/lastfm/lastfm_tags.db" -O "$DATA_DIR/lastfm_tags.db"
fi

echo "========================================"
echo " Data download and extraction complete! "
echo "========================================"
