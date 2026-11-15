"""Export the site to docs/ so it can run on GitHub Pages without Flask."""
import json
import shutil
from pathlib import Path

from app import app

OUT = Path("docs")
client = app.test_client()          # call the API inside Python, no server needed


def save(path, data):
    file = OUT / path
    file.parent.mkdir(parents=True, exist_ok=True)
    file.write_text(json.dumps(data))


# 1. copy the page files
OUT.mkdir(exist_ok=True)
for name in ["index.html", "style.css", "script.js"]:
    shutil.copy(name, OUT / name)

# 2. save every API response as a JSON file
admissions = client.get("/api/admissions").get_json()
save("api/admissions.json", admissions)
save("api/heatmap.json", client.get("/api/heatmap").get_json())

for a in admissions:
    hadm_id = a["hadm_id"]
    save(f"api/timeline/{hadm_id}.json", client.get(f"/api/timeline/{hadm_id}").get_json())

print(f"Exported {len(admissions)} timelines to {OUT}/")