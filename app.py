import json
from pathlib import Path
from flask import Flask, jsonify, abort

app = Flask(__name__, static_folder=".", static_url_path="")
DATA = Path(__file__).parent / "data"

def load(name):
    return json.loads((DATA / name).read_text())


# read only once when server on, other requests will use directly
labs = load("labs_all.json")
tx = load("tx_all.json")
admissions = load("admissions.json")
heat = load("heatmap.json")

adm_by_id = {a["hadm_id"]: a for a in admissions} # use hadm_id to fast search

# webpage API
@app.route("/")
def index():
    return app.send_static_file("index.html")

@app.route("/api/admissions")
def api_admissions():
    return jsonify(admissions)

@app.route("/api/heatmap")
def api_heatmap():
    return jsonify(heat)

# timeline API
@app.route("/api/timeline/<int:hadm_id>") 
def api_timeline(hadm_id):
    if hadm_id not in adm_by_id:
        abort(404)
    return jsonify({
        "admission": adm_by_id[hadm_id],
        "labs": [d for d in labs if d["hadm_id"] == hadm_id],
        "treatments": [d for d in tx if d["hadm_id"] == hadm_id],
    })