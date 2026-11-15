# Hyperkalaemia Timeline Viewer

It extends my COMP90089 Assignment 1, a hyperkalaemia digital phenotype on MIMIC-IV, into a Flask + Plotly.js app running on the public MIMIC-IV Demo.

## Data

This repo contains **no data**. It uses the [MIMIC-IV Clinical Database Demo](https://physionet.org/content/mimic-iv-demo/) (100 patients, Open Database License). From its `hosp/` folder the notebooks read:

`labevents.csv`, `admissions.csv`, `emar.csv`, `prescriptions.csv`

## How it works

```
step1_matching.ipynb   ─► data/labs_all.json      potassium results
step3_treatment.ipynb  ─► data/tx_all.json        IV treatments given
step4_phenotype.ipynb  ─► data/admissions.json    one row per admission + phenotype onset
                       ─► data/heatmap.json       admissions × treatments matrix
                                  │
                              app.py (Flask API)
                                  │
                       index.html + script.js (Plotly.js)
```

| Notebook | What it does | Output (demo data) |
|---|---|---|
| `step1_matching.ipynb` | Selects blood potassium (itemid 50971, 50822, 52610, 52452) and explores linking results that have no `hadm_id` to an admission by time | 2,719 results from 250 admissions |
| `step3_treatment.ipynb` | Finds IV calcium, insulin and dextrose 50% from eMAR (doses marked as given), with the route taken from `prescriptions` | 108 doses |
| `step4_phenotype.ipynb` | Applies the Assignment 1 phenotype and builds the heatmap matrix | 250 admissions, 2 meet the phenotype; 74 heatmap rows |

## Run it locally

1. Download the MIMIC-IV Demo and install the packages:

   ```bash
   pip install pandas flask notebook
   ```

2. In each notebook, set `DATA` to your demo `hosp/` folder (default: `~/Desktop/mimic-iv-clinical-database-demo-2/hosp`).

3. Run the notebooks **in order**: `step1_matching` → `step3_treatment` → `step4_phenotype`. Step 4 reads the JSON files written by steps 1 and 3.

4. Start the server and open http://127.0.0.1:5000/

   ```bash
   flask --app app run --debug
   ```

## API

| Endpoint | Returns |
|---|---|
| `GET /` | the web page |
| `GET /api/admissions` | one row per admission: highest potassium, phenotype flag, onset and window end |
| `GET /api/heatmap` | `x` (treatments), `y` (admissions), `z` (dose counts) |
| `GET /api/timeline/<hadm_id>` | that admission's summary, potassium results and treatments; 404 if not found |

## Project structure

```
app.py                  Flask back end
index.html              page layout
script.js               fetches the API and draws the heatmap and timeline with Plotly.js
step1_matching.ipynb    potassium + lab-to-admission matching
step3_treatment.ipynb   IV treatments
step4_phenotype.ipynb   phenotype + heatmap matrix
```


