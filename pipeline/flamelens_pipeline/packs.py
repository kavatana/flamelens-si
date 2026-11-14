"""Evidence packs: values for tests, taken from NASA files other than the experimental tables.

A pack is a folder in ``data/packs/`` with a ``pack.json`` and the CSV files this module reads.
It is made outside this repository, by a person or an SI tool that reads NASA's reports,
test matrices and analysed data. This module checks each pack and merges it into the
curated records by fixed rules:

  * The experimental table stays the first witness. A pack value fills a gap, or replaces a
    value this pipeline had to assume. It never overwrites a value read from a table.
  * Where a pack and the table disagree, or two files in a pack disagree, both are kept on
    record and the case becomes a quality finding.
  * A value from a planned test matrix is never loaded: a plan is not evidence.

The quotations in a pack are checked by the pack's own validator, against the pack. They are
not checked again here against NASA's file, because the pack does not carry the file. Each
value keeps the file's name, its place in the file and its checksum, so it can be.

``python -m flamelens_pipeline.packs`` checks the packs on disk and prints the scoreboard.
"""

from __future__ import annotations

import csv
import json
import subprocess
import sys
from collections import Counter, defaultdict
from pathlib import Path

from . import config

PACKS_DIR = config.DATA_DIR / "packs"
VALIDATOR = config.REPO_ROOT / "docs" / "data-pack" / "validate_pack.py"

GROUPS = {"atmosphere", "context", "fuel", "measurement", "outcome"}
QUALITY_ORDER = ["reported", "corrected", "context", "derived"]
BASIS_ORDER = ["measured", "set_point", "stated", "computed"]
# What says how a burn went, as opposed to how it was set up.
OUTCOMES = ("ignited", "end_mode", "burn_length_cm", "spread_rate_mm_s", "burn_time_s")
KEPT_FOR_LATER = ("series", "pairs", "media", "findings")


def _rows(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8-sig") as handle:
        return [{k: (v or "").strip() for k, v in row.items() if k} for row in csv.DictReader(handle)]


def listed() -> list[Path]:
    """The packs on disk, in name order."""
    if not PACKS_DIR.exists():
        return []
    return sorted(p for p in PACKS_DIR.iterdir() if (p / "pack.json").exists())


def check(pack: Path) -> None:
    """Run the pack's validator. A pack with an error stops the build."""
    result = subprocess.run([sys.executable, str(VALIDATOR), str(pack)], capture_output=True, text=True)
    if result.returncode != 0:
        raise SystemExit(f"Evidence pack {pack.name} did not pass its check:\n{result.stdout}{result.stderr}")


def _held(record: dict, var: str) -> dict | None:
    return next((v for v in record["values"] if v["var"] == var), None)


def _show(value: dict, unit: str) -> str:
    if "min" in value:
        text = f"{value['min']:g}" if value["min"] == value["max"] else f"{value['min']:g} to {value['max']:g}"
        return f"{text} {unit}".strip()
    if "bool" in value:
        return "yes" if value["bool"] else "no"
    return f'"{value.get("text", "")}"'


def _agrees(held: dict, claim: dict) -> bool:
    """Whether a pack value says the same as a value already held. A number inside a held range agrees with it."""
    if "min" in held and "min" in claim:
        slack = 1e-6 * max(1.0, abs(held["min"]), abs(held["max"]))
        return held["min"] - slack <= claim["min"] and claim["max"] <= held["max"] + slack
    if "bool" in held and "bool" in claim:
        return held["bool"] == claim["bool"]
    if "text" in held and "text" in claim:
        return held["text"].strip().lower() == claim["text"].strip().lower()
    return False


def _claim_value(claim: dict, variable: dict, source: dict, formulas: dict, pack: str) -> dict:
    """One claim of a pack as a curated value, with where it came from written out."""
    value: dict = {"var": claim["variable_id"], "raw": claim["original_text"], "column": claim["locator"],
                   "quality": claim["quality"], "pack": pack}
    if variable["kind"] == "number":
        value["min"] = float(claim["value_num"])
        value["max"] = float(claim["value_max"] or claim["value_num"])
        value["source_unit"] = claim["unit"]
    elif variable["kind"] == "boolean":
        value["bool"] = claim["value_bool"] == "true"
    else:
        value["text"] = claim["value_text"]

    notes = [f"From NASA's file {source['file_name']}" + (f", {claim['locator']}" if claim["locator"] else "") + "."]
    if claim["basis"] == "set_point":
        notes.append("This is a setting, not a measurement.")
    if claim["quality"] == "derived":
        formula = formulas.get(claim["formula_id"], {})
        notes.append(f"Computed, not read: {formula.get('expression', claim['formula_id'])}.")
        if claim["uncertainty"] == "not_estimated":
            notes.append(f"Its uncertainty was not estimated: {claim['uncertainty_basis']}.")
        else:
            notes.append(f"Uncertainty: plus or minus {claim['uncertainty']} {claim['unit']} ({claim['uncertainty_basis']}).".replace("  ", " "))
    if claim["note"]:
        notes.append(claim["note"] if claim["note"].endswith(".") else claim["note"] + ".")
    value["note"] = " ".join(notes)
    if claim["quote"]:
        value["evidence"] = claim["quote"]
        value["evidence_source"] = f"file:{source['file_name']}"
    return value


def apply(records: list[dict], tables_meta: list[dict], variables: dict, findings: list[dict], *, validate: bool = True) -> dict:
    """Merge every pack on disk into the curated records, in place. Returns what changed."""
    report: dict = {"packs": [], "documents": [], "evidence": {name: [] for name in KEPT_FOR_LATER}}
    by_id = {r["id"]: r for r in records}

    for pack in listed():
        if validate:
            check(pack)
        meta = json.loads((pack / "pack.json").read_text(encoding="utf-8"))
        acc = meta["accession"]
        sources = {s["source_id"]: s for s in _rows(pack / "sources.csv")}
        formulas = {f["formula_id"]: f for f in _rows(pack / "formulas.csv")}
        stats: Counter = Counter()
        gained: Counter = Counter()

        for v in _rows(pack / "new_variables.csv"):
            if v["variable_id"] in variables:
                continue
            quote = v["definition_quote"]
            defined = bool(quote) and quote.lower() != "unknown"
            where = sources.get(v["definition_source_id"], {}).get("file_name", "")
            variables[v["variable_id"]] = {
                "label": v["label"], "unit": v["unit"], "kind": v["kind"],
                "group": v["group"] if v["group"] in GROUPS else "measurement",
                "description": (f"NASA's definition: \"{quote}\"" + (f" ({where})." if where else ".")) if defined
                else "NASA's files give no definition for this reading. It is kept as logged.",
                "pack": pack.name,
            }

        # Tests: the ones already held must exist; new ones become records in a table of their own.
        tests = {t["test_id"]: t for t in _rows(pack / "tests.csv")}
        table_name = f"{acc}_Evidence pack_{pack.name}"
        added: list[dict] = []
        for t in tests.values():
            if t["is_new"] != "1":
                if t["test_id"] not in by_id:
                    raise SystemExit(f"Evidence pack {pack.name}: {t['test_id']} is not a test in the curated data")
                continue
            if t["run_status"] == "planned":
                stats["planned tests left out"] += 1
                continue
            if t["test_id"] in by_id:
                raise SystemExit(f"Evidence pack {pack.name}: {t['test_id']} is marked new but already exists")
            record = {
                "id": t["test_id"], "accession": t["accession"] or acc, "table": table_name, "row": len(added) + 1,
                "kind": "test", "label": t["label"] or t["test_id"], "values": [],
                "original": {"Test": t["label"], "How it was told apart from the tests already held": t["matched_by"],
                             "Evidence pack": pack.name},
            }
            added.append(record)
            by_id[record["id"]] = record

        # Claims, grouped so that every witness for one value of one test is weighed together.
        groups: dict[tuple[str, str], list[dict]] = defaultdict(list)
        for claim in _rows(pack / "claims.csv"):
            planned = tests[claim["test_id"]]["run_status"] == "planned"
            if planned or sources[claim["source_id"]]["source_kind"] == "test_matrix_planned":
                stats["values from a plan, left out"] += 1
                continue
            groups[(claim["test_id"], claim["variable_id"])].append(claim)

        touched: dict[str, dict] = {}
        for (test_id, var), claims in groups.items():
            record = by_id[test_id]
            variable = variables[var]
            unit = variable.get("unit", "") or ""
            claims.sort(key=lambda c: (QUALITY_ORDER.index(c["quality"]), BASIS_ORDER.index(c["basis"])))
            values = [_claim_value(c, variable, sources[c["source_id"]], formulas, pack.name) for c in claims]
            files = [sources[c["source_id"]]["file_name"] for c in claims]

            def disagreement(first: str, second: str, used: str) -> None:
                findings.append({"accession": record["accession"], "table": record["table"], "kind": "sources-disagree",
                                 "message": f"{record['label']}, {variable['label']}: {first}; {second}. {used}",
                                 "rows": [record["row"]]})

            held = _held(record, var)
            if held is not None and held["quality"] != "assumed":
                for value, file, claim in zip(values, files, claims):
                    if _agrees(held, value):
                        stats["values that confirm the table"] += 1
                    else:
                        stats["disagreements with the table"] += 1
                        disagreement(f"the experimental table gives {_show(held, unit)}",
                                     f"NASA's file {file} gives {_show(value, unit)} ({claim['locator']})",
                                     "The table's value is the one used.")
                continue

            best = values[0]
            if held is not None:
                record["values"].remove(held)
                best["note"] += " It replaces a value that had been assumed."
                stats["assumed values replaced"] += 1
            for value, file, claim in zip(values[1:], files[1:], claims[1:]):
                if _agrees(best, value):
                    best["note"] += f" NASA's file {file} gives the same."
                else:
                    best["note"] += f" NASA's file {file} gives {_show(value, unit)} ({claim['locator']})."
                    stats["disagreements between files"] += 1
                    disagreement(f"NASA's file {files[0]} gives {_show(best, unit)}",
                                 f"NASA's file {file} gives {_show(value, unit)} ({claim['locator']})",
                                 "The first is the one used.")
            record["values"].append(best)
            gained[var] += 1
            touched[record["id"]] = record
        for record in touched.values():
            record["values"].sort(key=lambda v: v["var"])

        if added:
            records.extend(added)
            tables_meta.append({
                "accession": acc, "file_name": table_name, "code": f"pack-{pack.name}".lower(),
                "title": f"Tests added from other NASA files ({pack.name})", "record_kind": "test",
                "rows_in_file": len(added), "records": len(added), "encoding": "utf-8",
                "columns": [], "constants": [], "footnotes": [], "header_notes": [],
                "record_note": "These tests are not in PSI's experimental table. They were read from other NASA files, which are named on each value.",
                "excluded": [], "source_url": "", "sha256": "", "fetched_at": meta.get("created", ""),
            })

        # Results NASA states in its own words become text the SI can search.
        stated = [f for f in _rows(pack / "findings.csv") if f["quote"]]
        if stated:
            report["documents"].append({
                "id": f"pack:{pack.name}", "accession": acc, "title": f"NASA's stated results for {acc}", "file_name": "",
                "kind": "text", "why": "Results NASA states in its own reports, quoted in an evidence pack.",
                "paragraphs": [f"{f['quote']} ({sources[f['source_id']]['file_name']}, {f['locator']})" for f in stated],
                "source_url": "", "sha256": "", "fetched_at": meta.get("created", ""),
            })
        for name in KEPT_FOR_LATER:
            report["evidence"][name].extend({**row, "pack": pack.name} for row in _rows(pack / f"{name}.csv"))

        report["packs"].append({"name": pack.name, "accession": acc, "tests": len(tests), "new_tests": len(added),
                                "gained": dict(gained), "stats": dict(stats), "si_use": meta.get("si_use", "")})
    return report


def scoreboard(records: list[dict]) -> dict[str, int]:
    """The counts that say how well the solid-fuel tests can answer NASA's question."""
    def has_number(record: dict, var: str) -> bool:
        value = _held(record, var)
        return value is not None and "min" in value

    def oxygen(record: dict) -> bool:
        return has_number(record, "o2_fraction") and (_held(record, "o2_basis") or {}).get("text") != "oxidizer stream"

    def outcome(record: dict) -> bool:
        return any(_held(record, var) is not None for var in OUTCOMES)

    solid = [r for r in records if (_held(r, "fuel_phase") or {}).get("text") == "solid"]
    both = [r for r in solid if oxygen(r) and has_number(r, "flow_speed_cm_s")]
    return {
        "solid-fuel tests": len(solid),
        "with oxygen": sum(oxygen(r) for r in solid),
        "with air speed": sum(has_number(r, "flow_speed_cm_s") for r in solid),
        "with oxygen and air speed": len(both),
        "with oxygen, air speed and what happened": sum(outcome(r) for r in both),
        "with a pressure NASA states": sum(has_number(r, "pressure_kpa") and _held(r, "pressure_kpa")["quality"] != "assumed" for r in solid),
    }


def describe(report: dict, before: dict[str, int], after: dict[str, int]) -> list[str]:
    """What the packs changed, as lines to print."""
    if not report["packs"]:
        return [f"evidence packs: none in {PACKS_DIR.relative_to(config.REPO_ROOT)}"]
    lines = []
    for pack in report["packs"]:
        lines.append(f"evidence pack {pack['name']} ({pack['accession']}): {pack['tests']} tests, {pack['new_tests']} of them new")
        for var, n in sorted(pack["gained"].items(), key=lambda item: -item[1]):
            lines.append(f"    {var}: {n} tests gained a value")
        for what, n in sorted(pack["stats"].items()):
            lines.append(f"    {what}: {n}")
    kept = {name: len(rows) for name, rows in report["evidence"].items() if rows}
    if kept:
        lines.append("    kept for later use: " + ", ".join(f"{n} rows of {name}" for name, n in kept.items()))
    lines.append("scoreboard, before and after the packs:")
    for name in before:
        lines.append(f"    {name}: {before[name]} -> {after[name]}")
    return lines


def main() -> None:
    for pack in listed():
        check(pack)
        print(f"{pack.name}: passes its check")
    if not listed():
        print(f"No evidence packs in {PACKS_DIR}")
    records = json.loads((config.CURATED_DIR / "records.json").read_text())
    print("scoreboard of the curated data now:")
    for name, n in scoreboard(records).items():
        print(f"    {name}: {n}")


if __name__ == "__main__":
    main()
