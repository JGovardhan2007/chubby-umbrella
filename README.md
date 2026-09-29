# SIH Problem Statement 26084: Convective-Scale Nowcasting Core System (Phase 1)

> **0–6 Hour Probabilistic Convective-Scale Nowcasting for Thunderstorms, Hail, Downbursts & Cloudbursts**

---

## 🌩️ Executive Summary

This repository contains the **Phase 1 Core Operational Pipeline** for Smart India Hackathon (SIH) Problem Statement **26084**: *"Convective-scale nowcasting for Thunderstorms, Hail & Cloudbursts (0–6 hr)"*.

The pipeline ingests multi-sensor meteorological data (**Doppler Weather Radar**, **INSAT-3D/3DR Geostationary Satellite**, **Ground Lightning Networks**, and **Surface AWS Weather**), performs strict quality control, aligns them onto a configurable **1–3 km common grid**, detects **convective initiation (CI)**, tracks storm cells using kinematic Hungarian centroid matching, generates **probabilistic hazard predictions** (Lightning, Hail, Downbursts, Cloudbursts), and produces **0–6 hour nowcasts** with MapLibre/Mapbox-ready **GeoJSON** outputs and site-specific **Estimated Time of Arrival (ETA)**.

```
RADAR (Reflectivity, Velocity) + SATELLITE (INSAT-3D TIR/WV) + LIGHTNING (Flashes) + AWS
                                      ↓
                              DATA INGESTION
                     (NetCDF, HDF5, GeoTIFF, CSV, JSON)
                                      ↓
                            DATA QUALITY CONTROL
              (Coordinate bounds, NaN/Fill cleanup, Physical limits)
                                      ↓
                           SPATIO-TEMPORAL FUSION
                 (Common 1–3 km grid: Time × Lat × Lon × Features)
                                      ↓
                       CONVECTIVE INITIATION DETECTION
              (dT/dt cooling, dZ/dt growth, mixed-phase dBZ, lightning)
                                      ↓
                          STORM CELL IDENTIFICATION
                 (Centroids, Contours, Area km², Max/Mean dBZ)
                                      ↓
                        KINEMATIC HUNGARIAN TRACKING
             (Motion vectors u/v, Speed km/h, Heading, Growth & Trends)
                                      ↓
                         HAZARD RISK NOWCASTING
             (Probabilistic Lightning, Hail POSH/MESH, Downbursts, Cloudbursts)
                                      ↓
                           0–6 HOUR NOWCAST ENGINE
             (+15m, +30m, +1h, +2h, +3h, +4h, +5h, +6h Horizons)
                                      ↓
                             GEO-SPATIAL OUTPUTS
             (GeoJSON Cells, Forecast Tracks, Hazard Polygons, Site ETA)
```

---

## 📦 Project Architecture

```
phase1_26084/
│
├── config/
│   ├── default_config.yaml         # Configurable domain, QC thresholds, hazard parameters
│   └── __init__.py                 # YAML config loader
│
├── data/
│   ├── raw/                        # Raw radar, satellite, lightning, weather files
│   ├── processed/                  # Processed grids, GeoJSON products & evaluation reports
│   └── sample/                     # Synthetic testbed datasets (NetCDF, CSV, JSON)
│
├── ingestion/
│   ├── base.py                     # Base schemas (ObservationGrid, PointObservations, Metadata)
│   ├── radar.py                    # DWR Reflectivity & Velocity loader (NetCDF, HDF5, GeoTIFF, JSON, CSV)
│   ├── satellite.py                # INSAT-3D/3DR TIR1/TIR2/WV Brightness Temp loader
│   ├── lightning.py                # Ground Lightning Network loader (CSV, JSON, NetCDF)
│   └── weather.py                  # Supplementary Surface Station / AWS loader
│
├── preprocessing/
│   ├── qc.py                       # Data Quality Control & DataQualityReport generator
│   └── reproject.py                # RegularGridInterpolator & Gaussian point-density mapping
│
├── fusion/
│   ├── grid.py                     # Common 1–3 km spatial grid definition
│   └── spatiotemporal.py           # Multi-source spatio-temporal alignment & 4D DataCube
│
├── detection/
│   ├── features.py                 # Meteorological diagnostic features (Sobel gradients, cooling rates)
│   └── convective_initiation.py    # Convective Initiation (CI) detector & candidate cell builder
│
├── tracking/
│   ├── storm_cell.py               # StormCell object & Haversine distance calculator
│   └── tracker.py                  # Hungarian algorithm centroid tracker & kinematic motion
│
├── hazards/
│   ├── base.py                     # BaseHazardEstimator & HazardEstimate schemas
│   ├── lightning_hazard.py         # Probabilistic lightning density estimator
│   ├── hail_hazard.py              # Hail probability & MESH/POSH physical proxies
│   ├── wind_hazard.py              # Downburst & severe wind gust estimator
│   ├── cloudburst_hazard.py        # Cloudburst & extreme rainfall (Marshall-Palmer Z-R) estimator
│   └── ml_models.py                # Modular ML interface (Physics Baseline + Scikit-Learn/XGBoost)
│
├── nowcast/
│   ├── uncertainty.py              # Lead-time uncertainty decay & OBSERVED/PREDICTED/DERIVED status
│   ├── arrival_time.py             # Point-specific storm distance, heading, and arrival ETA
│   └── engine.py                   # 0–6 Hour multi-horizon nowcasting engine
│
├── geojson/
│   └── exporter.py                 # GeoJSON exporter for MapLibre/Mapbox GIS integration
│
├── replay/
│   ├── simulator.py                # Synthetic realistic multi-modal storm sequence generator
│   └── engine.py                   # Sequential historical replay runner
│
├── evaluation/
│   ├── metrics.py                  # Meteorological verification (POD, FAR, CSI, F1, MAE, Brier)
│   └── validator.py                # Temporal cross-validation pipeline (no temporal data leakage)
│
├── tests/
│   ├── test_ingestion.py           # Unit tests for all data loaders
│   ├── test_qc.py                  # Unit tests for quality control
│   ├── test_fusion.py              # Unit tests for multi-source fusion
│   ├── test_detection.py           # Unit tests for convective initiation
│   ├── test_tracking.py            # Unit tests for storm tracking
│   ├── test_hazards.py             # Unit tests for hazard models
│   ├── test_nowcast.py             # Unit tests for 0-6h horizons & ETA
│   ├── test_replay.py              # Unit tests for replay engine
│   └── test_evaluation.py          # Unit tests for verification metrics
│
├── run_nowcast.py                  # Main CLI executable
├── requirements.txt                # Python dependencies
└── README.md                       # Documentation
```

---

## 🔬 Scientific Foundations & Methodology

### 1. Convective Initiation (CI) Formulation
Convective initiation is detected using physical proxies across sensors:
- **Radar**: Radar reflectivity core $Z \ge 35\text{ dBZ}$ or developing echoes ($Z \ge 28\text{ dBZ}$ with growth rate $\frac{dZ}{dt} \ge 4\text{ dBZ}/15\text{min}$).
- **Satellite**: Cloud-top cooling rate $\frac{dT_{\text{B}}}{dt} \le -4\text{ K}/15\text{min}$ combined with cold brightness temperatures ($T_{\text{B}} \le 235\text{ K}$).
- **Lightning**: Localized electrical flash density onset ($> 0.05\text{ flashes/km}^2$).
- **Confidence Score**:
$$\text{Confidence} = w_r \cdot \hat{Z} + w_s \cdot \hat{T}_{\text{B}} + w_l \cdot \hat{L} + w_t \cdot \hat{\Delta}$$

### 2. Hazard Prediction Modules
All hazards provide probabilistic risk assessments $[0.0, 1.0]$:
- **Lightning**: Combined function of mixed-phase reflectivity ($Z > 35\text{ dBZ}$ at $-10^\circ\text{C}$ to $-20^\circ\text{C}$ level) and rapid cloud-top electrification.
- **Hail**: Maximum Expected Size of Hail (MESH) and Probability of Severe Hail (POSH) proxies derived from severe core reflectivity ($Z \ge 48\text{--}55\text{ dBZ}$) and deep overshooting tops ($T_{\text{B}} \le 220\text{ K}$).
- **Downbursts / Microbursts**: Estimated from radial velocity shear ($\Delta V > 18\text{ m/s}$) and precipitation core collapse rates.
- **Cloudbursts / Extreme Rainfall**: Localized rain rate $R$ computed via standard Marshall-Palmer relation:
$$Z = 200 \cdot R^{1.6} \implies R = \left( \frac{10^{Z/10}}{200} \right)^{1/1.6}$$
Triggered when rain rate exceeds $50\text{--}100\text{ mm/hr}$ under slow storm propagation ($v < 20\text{ km/h}$).

### 3. 0–6 Hour Horizons & Lead-Time Uncertainty
Forecasts are generated across horizons: **+15m, +30m, +1h, +2h, +3h, +4h, +5h, +6h**.
Confidence decays with lead time $t$:
$$C(t) = C_0 \cdot \exp(-\lambda t)$$
Spatial uncertainty dispersion cones expand at $\sim 6\text{ km/hr}$.

Status classifications:
- `OBSERVED`: Lead time 0m.
- `PREDICTED`: Lead time 15m–60m (deterministic advection).
- `DERIVED`: Lead time 1h–3h (trend extrapolation).
- `UNCERTAIN`: Lead time 3h–6h (probabilistic envelope).

---

## 🚀 Quickstart Guide

### Step 1: Install Dependencies
```bash
# Python Backend Dependencies
pip install -r requirements.txt

# Frontend UI Dependencies
cd frontend
npm install
cd ..
```

### Step 2: Launch Backend API Server
```bash
python -m uvicorn server:app --host 127.0.0.1 --port 8000
```

### Step 3: Launch Reusable GIS Dashboard (Frontend)
```bash
cd frontend
npm run dev
```
Open **`http://localhost:5173`** in your browser to view the meteorological control room dashboard.

---

## 💻 CLI Commands (Headless / Testing)

### 1. Run Automated Unit Test Suite
```bash
pytest -v
```

### 2. Generate Realistic Sample Dataset
```bash
python run_nowcast.py generate-sample -o data/sample -n 6 -t 10
```

### 3. Run Historical Replay Pipeline (CLI)
```bash
python run_nowcast.py replay -s data/sample/replay_sequence_manifest.json -g data/processed/geojson --lat 13.0827 --lon 80.2707 --site-name Chennai_City
```

### 4. Run Live Operational Nowcast via Open APIs
```bash
python run_nowcast.py live --lat 13.0827 --lon 80.2707 --site-name Chennai_Live
```

### 5. Run Verification & Model Evaluation
```bash
python run_nowcast.py evaluate -s data/sample/replay_sequence_manifest.json -r data/processed/evaluation_report.json
```

---

## 🗺️ GeoJSON Output Format
All generated products in `data/processed/geojson/` follow standard GeoJSON specifications:
- `storms_*.geojson`: Detected storm centroids and contour polygons.
- `nowcast_*.geojson`: Multi-horizon forecast tracks, future centroids, and uncertainty dispersion cones.
- `site_eta_*.geojson`: Site-specific storm arrival ETA marker and localized hazard risk breakdown.

---

## ⚠️ Important Scientific Disclaimers
This system is an **academic research prototype** developed for the Smart India Hackathon (SIH 26084). The hazard probabilities and estimated arrival times are purely diagnostic outputs and are **not** official government meteorological warnings.