"""Shared paths and constants for the FlameLens SI pipeline.

The pipeline has four layers, each a directory under ``data/``:

    raw      exact snapshots of what NASA PSI returned (never edited by hand)
    staged   raw parsed into typed, tidy tables; original names and values kept
    curated  harmonized: one vocabulary, SI-consistent units, provenance on every value
    serving  the Postgres database the web app reads, seeded from the curated layer
             (see api/scripts/seed.ts)

Every stage reads only the layer before it, so any stage can be re-run on its own.
"""

from __future__ import annotations

from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "data"

RAW_DIR = DATA_DIR / "raw" / "psi"
STAGED_DIR = DATA_DIR / "staged"
CURATED_DIR = DATA_DIR / "curated"

DICTIONARY_DIR = Path(__file__).resolve().parent / "dictionary"

PSI_ORIGIN = "https://psi.nasa.gov"
PSI_WS = f"{PSI_ORIGIN}/geode-py/ws"
PSI_INDEX_URL = f"{PSI_WS}/repo/search?q=&data_source=psi&data_type=investigation&size=500"
PSI_RECORD_URL = PSI_WS + "/repo/investigations/{accession}"
PSI_DOWNLOAD_URL = PSI_WS + "/studies/{accession}/download"
PSI_LISTING_URL = PSI_WS + "/files/v2"
PSI_PAGE_URL = PSI_ORIGIN + "/physci/repo/data/investigations/{accession}"

# Generic client name; no personal contact details are sent to any outside service.
USER_AGENT = "FlameLens-SI-pipeline/0.1 (open-data research client)"

RESEARCH_AREA = "Combustion Science"
