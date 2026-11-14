"""NASA's own video of single tests.

PSI's record of an investigation lists every file in it. ``dictionary/footage.yaml`` says,
for an investigation, how NASA names the videos of its tests. This module ties each such
file to the test it shows, by the label in NASA's own file name. The video stays in NASA's
archive: the site asks PSI for it when a visitor presses play.
"""

from __future__ import annotations

import json
import re
from collections import Counter

import yaml

from . import config


def rules() -> dict:
    return yaml.safe_load((config.DICTIONARY_DIR / "footage.yaml").read_text()) or {}


def _flatten(node: dict) -> list[dict]:
    """PSI's folder listing as one flat list, in the shape of a record's own file list."""
    out: list[dict] = []
    for entry in node.get("files") or []:
        key = str(entry.get("key") or "")
        if entry.get("directory") or entry.get("files"):
            out.extend(_flatten(entry))
        elif key:
            name = key.rsplit("/", 1)[-1]
            out.append({
                "file_name": name,
                "file_size": entry.get("bytes_size") or 0,
                "version": entry.get("version") or 1,
                "restricted": bool(entry.get("restricted") or entry.get("restrictedAccess")),
                "visible": entry.get("visible", True),
            })
    return out


def listed_files(accession: str) -> list[dict]:
    """The files PSI lists for an investigation.

    Most records carry the list themselves. Where a record comes without one, the folder
    listing PSI's own page loads is used (``listings/<accession>.json``, see fetch.py).
    """
    path = config.RAW_DIR / "investigations" / f"{accession}.json"
    files = (json.loads(path.read_text()).get("added") or []) if path.exists() else []
    listing = config.RAW_DIR / "listings" / f"{accession}.json"
    if not files and listing.exists():
        files = _flatten(json.loads(listing.read_text()))
    return files


def plain(label: object) -> str:
    """A test label as NASA's file names write it: letters and digits only, any case. "21088 B1" is "21088b1"."""
    return re.sub(r"[^a-z0-9]", "", str(label).lower())


def match(accession: str, views: dict[str, str | list[str]], files: list[dict], records: list[dict]) -> list[dict]:
    """One entry per test and view.

    A file is used only if its name carries the label of exactly one test in the table, and
    no other file of the investigation has the same name (PSI hands a file out by its name).
    A label that two rows share is never used: the name cannot say which of them it shows.
    """
    rows: dict[str, list[str]] = {}
    for r in records:
        if r["accession"] == accession and r.get("label") and plain(r["label"]):
            rows.setdefault(plain(r["label"]), []).append(r["id"])
    by_label = {label: ids[0] for label, ids in rows.items() if len(ids) == 1}
    patterns = {view: [re.compile(p, re.IGNORECASE) for p in ([pattern] if isinstance(pattern, str) else pattern)] for view, pattern in views.items()}
    found: dict[tuple[str, str], dict] = {}
    times = Counter(f.get("file_name") or "" for f in files)
    for entry in sorted(files, key=lambda f: f.get("file_name") or ""):
        name = entry.get("file_name") or ""
        if entry.get("restricted") or entry.get("visible") is False or times[name] > 1:
            continue
        for view, options in patterns.items():
            hit = next((m for m in (p.search(name) for p in options) if m), None)
            record_id = by_label.get(plain(hit.group("label"))) if hit else None
            if not record_id:
                continue
            # NASA sometimes lists a second copy of a clip; the first by name is kept.
            found.setdefault((record_id, view), {
                "id": f"{record_id}#{view}",
                "record_id": record_id,
                "accession": accession,
                "view": view,
                "file_name": name,
                "version": int(entry.get("version") or 1),
                "size_bytes": int(entry.get("file_size") or 0),
            })
    return sorted(found.values(), key=lambda f: f["id"])


def build(records: list[dict]) -> list[dict]:
    out: list[dict] = []
    for accession, rule in rules().items():
        out.extend(match(accession, rule["views"], listed_files(accession), records))
    return out


def describe(footage: list[dict]) -> str:
    tests = Counter(accession for accession, _ in {(f["accession"], f["record_id"]) for f in footage})
    if not footage:
        return "footage: none matched"
    return "footage: " + ", ".join(f"{n} tests of {acc} have NASA's video" for acc, n in sorted(tests.items()))
