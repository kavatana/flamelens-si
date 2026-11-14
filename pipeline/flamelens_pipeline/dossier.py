"""The dossier of one test: what an evidence pack holds about it beyond single values.

A pack can carry, for a test, NASA's photographs of the burn, curves measured during it
(a droplet shrinking, a detector's reading, the air speed on the rig's display) and
sentences NASA wrote about it. The site shows these when a visitor opens the test.

They are written as one small file per test, next to the site's other static files, and
fetched only when a test is opened: there are close to half a million curve points, which
would slow every other query if they sat in the database.

    web/public/evidence/tests/<test>.json    curves, photographs and NASA's sentences
    web/public/evidence/<pack>/media/...     NASA's photographs, as the pack holds them

Nothing here is new data: every number, picture and sentence is copied from a pack.
"""

from __future__ import annotations

import json
import re
import shutil
from collections import defaultdict

from . import config, packs

SITE_DIR = config.REPO_ROOT / "web" / "public" / "evidence"


def slug(test_id: str) -> str:
    """A test's id as a file name: PSI-25/bass2/101 is PSI-25_bass2_101."""
    return re.sub(r"[^A-Za-z0-9-]+", "_", test_id)


def _number(text: str) -> float | None:
    try:
        value = float(text)
    except (TypeError, ValueError):
        return None
    return value if value == value and abs(value) != float("inf") else None


def _short(value: float) -> float:
    """Six significant digits: more than any of these instruments resolve."""
    return float(f"{value:.6g}")


def _caption(row: dict, index: dict[str, dict]) -> str:
    """A photograph's caption: NASA's photo id and clock time where the pack gives them."""
    name = row["local_file"].rsplit("/", 1)[-1].rsplit(".", 1)[0]
    if row["kind"] == "proof_sheet":
        return "NASA's proof sheet of this test"
    photo = re.search(r"(iss\d{3}e\d+)", name)
    if photo:
        at = index.get(photo.group(1), {}).get("time", "")
        return f"NASA photo {photo.group(1)}" + (f", {at}" if at else "")
    clock = re.fullmatch(r"video_(\d{2})(\d{2})(\d{2})", name)
    if clock:
        return f"NASA's video, clock {clock.group(1)}:{clock.group(2)}:{clock.group(3)}"
    into = re.fullmatch(r"video_(\d+)m(\d+)s", name)
    if into:
        return f"NASA's video, {int(into.group(1))}:{into.group(2)} in"
    return "NASA photograph"


def build(evidence: dict, variables: dict) -> dict[str, dict]:
    """One dossier per test that has anything, keyed by the test's id."""
    out: dict[str, dict] = defaultdict(lambda: {"curves": [], "photos": [], "findings": []})

    curves: dict[tuple[str, str], dict] = {}
    for row in evidence["series"]:
        t, v = _number(row["t_s"]), _number(row["value_num"])
        if t is None or v is None:
            continue
        key = (row["test_id"], row["variable_id"])
        curve = curves.get(key)
        if curve is None:
            known = variables.get(row["variable_id"], {})
            curve = curves[key] = {"variable": row["variable_id"], "label": known.get("label", row["variable_id"]), "unit": row["unit"], "t": [], "v": []}
            out[row["test_id"]]["curves"].append(curve)
        curve["t"].append(_short(t))
        curve["v"].append(_short(v))

    photo_index: dict[str, dict[str, dict]] = {}
    for row in evidence["media"]:
        if not row.get("local_file"):
            continue  # a video that stays in NASA's archive; the site plays those from there
        pack = row["pack"]
        if pack not in photo_index:
            listed = packs._rows(packs.PACKS_DIR / pack / "media_index.csv")
            photo_index[pack] = {r["photo_id"]: r for r in listed if r.get("photo_id")}
        out[row["test_id"]]["photos"].append({
            "src": f"/evidence/{pack}/{row['local_file']}",
            "kind": row["kind"],
            "caption": _caption(row, photo_index[pack]),
            "how": row["match_rule"],
        })

    names: dict[str, dict[str, str]] = {}
    for row in evidence["findings"]:
        pack = row["pack"]
        if pack not in names:
            names[pack] = {s["source_id"]: s["file_name"] for s in packs._rows(packs.PACKS_DIR / pack / "sources.csv")}
        for test_id in re.split(r"[;,]\s*", row.get("test_ids") or ""):
            if test_id.strip() and row["quote"]:
                out[test_id.strip()]["findings"].append({
                    "quote": row["quote"], "about": row["subject"], "note": row["conditions"],
                    "file": names[pack].get(row["source_id"], ""), "where": row["locator"],
                })
    return dict(out)


def write(dossiers: dict[str, dict]) -> dict[str, int]:
    """Writes the files the site serves, replacing whatever an earlier run left."""
    tests = SITE_DIR / "tests"
    if SITE_DIR.exists():
        shutil.rmtree(SITE_DIR)
    tests.mkdir(parents=True)
    copied = 0
    for test_id, dossier in dossiers.items():
        (tests / f"{slug(test_id)}.json").write_text(json.dumps(dossier, ensure_ascii=False, separators=(",", ":")))
        for photo in dossier["photos"]:
            target = SITE_DIR.parent / photo["src"].lstrip("/")
            source = packs.PACKS_DIR / photo["src"].removeprefix("/evidence/")
            if source.exists() and not target.exists():
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(source, target)
                copied += 1
    return {
        "tests": len(dossiers),
        "with curves": sum(1 for d in dossiers.values() if d["curves"]),
        "with photographs": sum(1 for d in dossiers.values() if d["photos"]),
        "with NASA's sentences": sum(1 for d in dossiers.values() if d["findings"]),
        "curve points": sum(len(c["t"]) for d in dossiers.values() for c in d["curves"]),
        "photographs copied": copied,
    }


def describe(counts: dict[str, int]) -> str:
    return "dossiers: " + ", ".join(f"{n} {name}" for name, n in counts.items())
