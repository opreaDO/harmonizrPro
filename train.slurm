#!/bin/bash
#SBATCH --job-name=harmonizr_train
#SBATCH --gres=gpu:1
#SBATCH --cpus-per-task=6
#SBATCH --mail-type=ALL
#SBATCH --mail-user=${USER}
#SBATCH --time=12:00:00
#SBATCH --output=train_%j.log

# 1. Setup CUDA environment
source /vol/cuda/12.0.0/setup.sh

# 2. Activate your Python Environment
# NOTE: Uncomment and adjust the line below to point to wherever your virtual environment is stored!
# export PATH=/vol/bitbucket/${USER}/myvenv/bin/:$PATH
# source activate

# Verify GPU is attached
/usr/bin/nvidia-smi

echo "Starting Harmonizr Two-Tower Training..."

# 3. Define the external storage paths
BITBUCKET_DATA="/vol/bitbucket/${USER}/harmonizr_data"

# 4. Run the training script on the FULL dataset (0) for 30 epochs!
python scripts/train_two_tower.py \
    --triplets "$BITBUCKET_DATA/raw/msd/train_triplets.txt" \
    --tags "$BITBUCKET_DATA/raw/msd/lastfm_tags.db" \
    --metadata "$BITBUCKET_DATA/raw/msd/track_metadata.db" \
    --output "$BITBUCKET_DATA/models/twotower" \
    --max-users 0 \
    --epochs 30 \
    --force

echo "Training complete!"
