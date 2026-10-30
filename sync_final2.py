import os
import zipfile
import shutil

theme_dir = r"C:\Users\Asus\Documents\Codex\2026-10-26\th\work\shopify"
desktop_zip = r"C:\Users\Asus\Desktop\DEEDAP-COMPLETE-SHOPIFY-THEME.zip"
artifact_zip = r"C:\Users\Asus\.gemini\antigravity\brain\2a6b157f-3f99-4564-a163-ab7bfe46ef79\DEEDAP-COMPLETE-SHOPIFY-THEME.zip"

scratch_files = [
    "apply_header_update.py"
]

valid_dirs = {'assets', 'config', 'layout', 'locales', 'sections', 'snippets', 'templates'}

print("Updating theme zip...")
with zipfile.ZipFile(desktop_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(theme_dir):
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        rel_root = os.path.relpath(root, theme_dir)
        first_part = rel_root.split(os.sep)[0]
        if rel_root != '.' and first_part not in valid_dirs:
            continue
        for file in files:
            if file in scratch_files or file.endswith('.py') or file.endswith('.tmp'):
                continue
            if rel_root == '.' and not file.endswith('.json') and not file.endswith('.liquid'):
                continue
            full_path = os.path.join(root, file)
            arcname = os.path.relpath(full_path, theme_dir)
            zipf.write(full_path, arcname)

print(f"Updated {desktop_zip}")
shutil.copy2(desktop_zip, artifact_zip)
print("Copied to artifact")

for sf in scratch_files:
    p = os.path.join(theme_dir, sf)
    if os.path.exists(p):
        os.remove(p)
print("Cleaned scratch files.")

