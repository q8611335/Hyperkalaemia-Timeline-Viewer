# Hyperkalaemia Timeline Viewer

A small web app that shows blood potassium results and emergency treatments for hospital admissions, in two linked views:

- **Treatment heatmap**: admissions whose potassium went above 5.0 mmol/L (rows) against IV calcium, insulin and dextrose 50% (columns), coloured by the number of doses given. Click a row to open that admission's timeline.
- **Admission timeline**: potassium results over the stay, with the normal range (3.5–5.0), the 5.0 threshold, each treatment class in its own lane underneath, and, for admissions that meet the phenotype, the onset and the 2-hour treatment window.

It extends my COMP90089 (University of Melbourne) Assignment 1, a hyperkalaemia digital phenotype on MIMIC-IV, into a Flask + Plotly.js app running on the public MIMIC-IV Demo.

## Data

This repo contains **no data**. It uses the [MIMIC-IV Clinical Database Demo](https://physionet.org/content/mimic-iv-demo/) (100 patients, Open Database License). From its `hosp/` folder the notebooks read:

`labevents.csv`, `admissions.csv`, `emar.csv`, `prescriptions.csv`

The generated files in `data/` are ignored by Git. The full, credentialed MIMIC-IV must never be committed or shared.

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

### Phenotype (from Assignment 1)

An admission meets the phenotype when:

1. its first potassium within 24 hours of admission is normal (3.5–5.0 mmol/L),
2. a later potassium is above 5.0 mmol/L (the onset), and
3. IV calcium or IV insulin is given within 2 hours of that result. Dextrose 50% alone does not count, because it is given with insulin.

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

## Findings and limitations

- **Possible false positive.** Admission 29276678 meets the phenotype through a dose of *Calcium Gluconate sliding scale (Critical Care-Ionized calcium)*, which is calcium replacement rather than hyperkalaemia treatment. The same order was given before any high potassium. Excluding sliding-scale calcium would make the phenotype stricter.
- **Unlinked lab results.** 602 potassium results have no `hadm_id`. Matching by admit–discharge time links 15; extending the window back to ED registration links 170 more; 417 stay unmatched. These are explored in `step1_matching` but not yet merged into `labs_all.json`.
- Infusions charted as *Started* or *Confirmed* in eMAR are not counted, as in Assignment 1.
- MIMIC dates are shifted for de-identification, so dates on the timeline are not real calendar dates.
- The demo has only 100 patients, so only 2 admissions meet the phenotype.
