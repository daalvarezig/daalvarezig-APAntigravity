import urllib.request
import zipfile
import os
import shutil

url = "https://github.com/daalvarezig/daalvarezig-APAntigravity/archive/refs/heads/main.zip"
zip_path = "repo.zip"
extract_dir = "extracted"

print("Downloading...")
urllib.request.urlretrieve(url, zip_path)

print("Extracting...")
with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    zip_ref.extractall(extract_dir)

print("Moving files...")
inner_dir = os.path.join(extract_dir, "daalvarezig-APAntigravity-main")
for item in os.listdir(inner_dir):
    s = os.path.join(inner_dir, item)
    d = os.path.join(".", item)
    if os.path.isdir(s):
        shutil.copytree(s, d, dirs_exist_ok=True)
    else:
        shutil.copy2(s, d)

print("Cleaning up...")
os.remove(zip_path)
shutil.rmtree(extract_dir)
print("Done!")
