import os
import urllib.request
import zipfile

MSD_URL = "http://millionsongdataset.com/sites/default/files/challenge/train_triplets.txt.zip"
RAW_DATA_DIR = "./data/raw/msd"
ZIP_PATH = os.path.join(RAW_DATA_DIR, "train_triplets.txt.zip")
TXT_PATH = os.path.join(RAW_DATA_DIR, "train_triplets.txt")

def download_msd():
    os.makedirs(RAW_DATA_DIR, exist_ok=True)
    
    if os.path.exists(TXT_PATH):
        print(f"{TXT_PATH} already exists. Skipping download.")
        return

    if not os.path.exists(ZIP_PATH):
        print(f"Downloading MSD Taste Profile from {MSD_URL}...")
        print("This is a ~500MB file, it might take a few minutes.")
        
        def hook(count, block_size, total_size):
            if total_size > 0:
                percent = int(count * block_size * 100 / total_size)
                # Only print every 10% to avoid flooding the console
                if percent % 10 == 0 and percent != getattr(hook, "last_percent", -1):
                    print(f"Downloading... {percent}%")
                    hook.last_percent = percent
            
        hook.last_percent = -1
        urllib.request.urlretrieve(MSD_URL, ZIP_PATH, reporthook=hook)
        print("Download complete.")
    else:
        print(f"{ZIP_PATH} already exists. Skipping download.")

    print(f"Unzipping {ZIP_PATH}...")
    with zipfile.ZipFile(ZIP_PATH, 'r') as zip_ref:
        zip_ref.extractall(RAW_DATA_DIR)
    
    print("Unzipping complete. MSD data is ready.")
    
    print("\nPreview of train_triplets.txt:")
    with open(TXT_PATH, 'r') as f:
        for _ in range(5):
            print(f.readline().strip())

if __name__ == "__main__":
    download_msd()
