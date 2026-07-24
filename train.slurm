#!/bin/bash
#SBATCH --job-name=harmonizr_train
#SBATCH --partition=gpu
#SBATCH --gres=gpu:1           # Request 1 GPU
#SBATCH --cpus-per-task=8      # 8 CPU cores for fast DataLoader multiproc
#SBATCH --mem=64G              # 64 GB RAM to hold the 48M rows
#SBATCH --time=12:00:00        # Max 12 hours execution time
#SBATCH --output=train_%j.log  # Output log file (%j gets replaced with job ID)

echo "Starting Harmonizr Two-Tower Training..."
echo "Running on node: $(hostname)"
echo "Using GPU: $CUDA_VISIBLE_DEVICES"

# Make sure to activate whatever virtual environment you use on the cluster!
# Example: source venv/bin/activate
# Example: module load python/3.10 cuda/11.8

# Run the training script on the FULL dataset (0) for 30 epochs!
uv run python scripts/train_two_tower.py --max-users 0 --epochs 30 --force

echo "Training complete!"
