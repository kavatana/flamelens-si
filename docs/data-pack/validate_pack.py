#!/usr/bin/env python3
"""Check a FlameLens evidence pack before it is handed over.

    python validate_pack.py packs/PSI-25

Needs only Python 3.9+ (no installs). Run it from anywhere; it reads variables.csv and
known_tests.csv from the folder this script is in. It prints every problem it finds and
exits with code 1 if any of them is an error.
"""
from __future__ import annotations

import csv
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

KIT = Path(__file__).resolve().parent

SOURCE_KINDS = {"experimental_table", "test_matrix_as_run", "test_matrix_planned", "calibration", "analyzed_data", "readme", "report", "publication", "raw_log"}
DOCUMENT_KINDS = {"readme", "report", "publication"}
QUALITIES = {"reported", "context", "derived", "corrected"}
BASES = {"set_point", "measured", "computed", "stated"}
RUN_STATUS = {"as_run", "planned"}
GRAVITY = {"0g", "1g", "partial", "not_stated"}
MEDIA_KINDS = {"still", "proof_sheet", "video"}
MAX_SERIES_POINTS = 200
MAX_LOCAL_MEDIA_BYTES = 150_000

COLUMNS = {
    "sources.csv": ["source_id", "accession", "file_name", "psi_path", "folder", "bytes", "sha256", "source_kind", "fetched_at"],
    "tests.csv": ["test_id", "accession", "is_new", "label", "run_status", "replicate_group", "matched_by"],
    "claims.csv": ["claim_id", "test_id", "variable_id", "value_num", "value_max", "value_text", "value_bool", "unit", "original_text", "quality", "basis", "source_id", "locator", "quote", "formula_id", "inputs", "uncertainty", "uncertainty_basis", "note"],
    "new_variables.csv": ["variable_id", "label", "unit", "kind", "group", "definition_quote", "definition_source_id", "definition_locator"],
    "formulas.csv": ["formula_id", "expression", "inputs_described", "source_id", "locator", "quote", "valid_range", "note"],
    "series.csv": ["test_id", "variable_id", "t_s", "value_num", "unit", "source_id", "locator", "thinning_rule"],
    "findings.csv": ["finding_id", "accession", "quote", "source_id", "locator", "subject", "variable_id", "value_num", "unit", "gravity", "conditions", "test_ids"],
    "pairs.csv": ["pair_id", "accession", "material", "variable_id", "value_0g", "value_1g", "unit", "test_id_0g", "source_id", "locator", "quote", "differs_in"],
    "media.csv": ["test_id", "kind", "psi_path", "bytes", "local_file", "credit", "match_rule"],
}
REQUIRED = ["pack.json", "sources.csv", "tests.csv", "claims.csv", "REPORT.md"]

errors: list[str] = []
warnings: list[str] = []


def err(where: str, message: str) -> None:
    errors.append(f"{where}: {message}")


def warn(where: str, message: str) -> None:
    warnings.append(f"{where}: {message}")


def read(path: Path, name: str) -> list[dict[str, str]]:
    """Rows of one CSV, with its header checked. A missing optional file is an empty list."""
    file = path / name
    if not file.exists():
        return []
    with file.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        missing = [c for c in COLUMNS[name] if c not in (reader.fieldnames or [])]
        if missing:
            err(name, f"missing column(s): {', '.join(missing)}")
            return []
        return [{k: (v or "").strip() for k, v in row.items() if k} for row in reader]


def number(text: str) -> float | None:
    try:
        return float(text)
    except ValueError:
        return None


def main(pack: Path) -> int:
    for name in REQUIRED:
        if not (pack / name).exists():
            err(name, "file is missing")
    if errors:
        return finish(pack, {})

    # --- pack.json
    try:
        meta = json.loads((pack / "pack.json").read_text(encoding="utf-8"))
    except json.JSONDecodeError as problem:
        err("pack.json", f"not valid JSON ({problem})")
        meta = {}
    for key in ("accession", "pack_version", "created_by", "si_use", "summary"):
        if not str(meta.get(key, "")).strip():
            err("pack.json", f'"{key}" is missing or empty')
    accession = str(meta.get("accession", ""))
    if accession and not re.fullmatch(r"PSI-\d+", accession):
        err("pack.json", f'accession "{accession}" should look like PSI-25')

    # --- what the site already holds
    with (KIT / "variables.csv").open(newline="", encoding="utf-8-sig") as handle:
        variables = {row["variable_id"]: row for row in csv.DictReader(handle)}
    with (KIT / "known_tests.csv").open(newline="", encoding="utf-8-sig") as handle:
        known = {row["test_id"]: row for row in csv.DictReader(handle)}

    # --- sources
    sources = {}
    for i, row in enumerate(read(pack, "sources.csv"), start=2):
        where = f"sources.csv line {i}"
        if not row["source_id"]:
            err(where, "source_id is empty")
            continue
        if row["source_id"] in sources:
            err(where, f'source_id "{row["source_id"]}" is used twice')
        sources[row["source_id"]] = row
        if row["source_kind"] not in SOURCE_KINDS:
            err(where, f'source_kind "{row["source_kind"]}" is not one of {sorted(SOURCE_KINDS)}')
        if not re.fullmatch(r"[0-9a-f]{64}", row["sha256"]):
            err(where, "sha256 must be 64 lowercase hex characters, computed from the downloaded file")
        if number(row["bytes"]) is None:
            err(where, "bytes must be a number")
        if not row["psi_path"] or not row["file_name"]:
            err(where, "psi_path and file_name are both needed so the file can be fetched again")

    # --- new variables
    for i, row in enumerate(read(pack, "new_variables.csv"), start=2):
        where = f"new_variables.csv line {i}"
        if row["variable_id"] in variables:
            err(where, f'"{row["variable_id"]}" already exists in variables.csv; use it as it is')
            continue
        if not re.fullmatch(r"[a-z][a-z0-9_]*", row["variable_id"]):
            err(where, f'variable_id "{row["variable_id"]}" must be lowercase words joined by underscores')
        if row["kind"] not in {"number", "category", "boolean", "text"}:
            err(where, 'kind must be number, category, boolean or text')
        if not row["definition_quote"]:
            err(where, 'definition_quote is empty; give NASA\'s words, or write "unknown"')
        elif row["definition_quote"].lower() != "unknown" and row["definition_source_id"] not in sources:
            err(where, "a quoted definition needs a definition_source_id that is listed in sources.csv")
        variables[row["variable_id"]] = row

    # --- tests
    tests = {}
    for i, row in enumerate(read(pack, "tests.csv"), start=2):
        where = f"tests.csv line {i}"
        tid = row["test_id"]
        if tid in tests:
            err(where, f'test_id "{tid}" is listed twice')
        tests[tid] = row
        if row["run_status"] not in RUN_STATUS:
            err(where, 'run_status must be as_run or planned')
        if row["is_new"] == "0":
            if tid not in known:
                err(where, f'"{tid}" is not in known_tests.csv; set is_new to 1 or correct the id')
        elif row["is_new"] == "1":
            if tid in known:
                err(where, f'"{tid}" already exists in known_tests.csv; set is_new to 0')
            if not tid.startswith(row["accession"] + "/"):
                err(where, f'a new test_id must start with "{row["accession"]}/"')
            if not row["matched_by"]:
                err(where, "a new test needs matched_by: say how you know it is not already in known_tests.csv")
        else:
            err(where, "is_new must be 0 or 1")

    # --- formulas
    formulas = {row["formula_id"]: row for row in read(pack, "formulas.csv")}
    for fid, row in formulas.items():
        if not row["expression"]:
            err("formulas.csv", f'"{fid}" has no expression')
        if row["source_id"] and row["source_id"] not in sources:
            err("formulas.csv", f'"{fid}" points to a source that is not in sources.csv')

    # --- claims
    claims = read(pack, "claims.csv")
    ids = Counter(row["claim_id"] for row in claims)
    stated: dict[tuple[str, str], set[str]] = defaultdict(set)
    gained: dict[str, set[str]] = defaultdict(set)
    for i, row in enumerate(claims, start=2):
        where = f"claims.csv line {i} ({row['claim_id'] or 'no id'})"
        if not row["claim_id"]:
            err(where, "claim_id is empty")
        elif ids[row["claim_id"]] > 1:
            err(where, "claim_id is used more than once")
        if row["test_id"] not in tests:
            err(where, f'test_id "{row["test_id"]}" is not listed in tests.csv')
        variable = variables.get(row["variable_id"])
        if not variable:
            err(where, f'variable_id "{row["variable_id"]}" is in neither variables.csv nor new_variables.csv')
            continue
        source = sources.get(row["source_id"])
        if not source:
            err(where, f'source_id "{row["source_id"]}" is not listed in sources.csv')

        # exactly the value column that fits the variable
        kind = variable["kind"]
        filled = [c for c in ("value_num", "value_text", "value_bool") if row[c]]
        wanted = {"number": "value_num", "boolean": "value_bool"}.get(kind, "value_text")
        if filled != [wanted]:
            err(where, f'{row["variable_id"]} is a {kind}: fill {wanted} and leave the other value columns empty')
        value = row[wanted]
        if kind == "number":
            n = number(row["value_num"])
            if n is None:
                err(where, f'value_num "{row["value_num"]}" is not a number')
            elif row["unit"] != variable["unit"]:
                err(where, f'unit must be "{variable["unit"]}" (convert the value; keep NASA\'s text in original_text)')
            elif variable["unit"] == "fraction" and not 0 <= n <= 1:
                err(where, f"a fraction must lie between 0 and 1, got {n}; 21% is 0.21")
            if row["value_max"]:
                top = number(row["value_max"])
                if top is None or (n is not None and top < n):
                    err(where, "value_max must be a number not below value_num")
        elif kind == "boolean" and value not in {"true", "false"}:
            err(where, "value_bool must be true or false")

        # how the value was obtained
        quality = row["quality"]
        if quality == "assumed":
            err(where, "assumed values are not accepted in a pack; leave the value out and say why in REPORT.md")
        elif quality not in QUALITIES:
            err(where, f'quality must be one of {sorted(QUALITIES)}')
        if row["basis"] not in BASES:
            err(where, f'basis must be one of {sorted(BASES)}')
        if quality in {"reported", "corrected"} and not (row["original_text"] and row["locator"]):
            err(where, "a reported or corrected value needs original_text (the cell as NASA wrote it) and a locator")
        if quality == "corrected" and not row["note"]:
            err(where, "a corrected value needs a note saying what was wrong and why the repair is certain")
        if quality == "context" and not row["quote"]:
            err(where, "a context value needs the quote: NASA's sentence that states it")
        if source and source["source_kind"] in DOCUMENT_KINDS and quality != "derived" and not row["quote"]:
            err(where, "a value taken from a document needs the quote that contains it")
        if row["quote"] and row["original_text"] and row["original_text"].lower() not in row["quote"].lower():
            err(where, "original_text does not appear inside quote; copy both exactly from the source")
        if quality == "derived":
            if row["formula_id"] not in formulas:
                err(where, f'derived value needs a formula_id that is defined in formulas.csv (got "{row["formula_id"]}")')
            inputs = [x for x in re.split(r"[;\s]+", row["inputs"]) if x]
            if not inputs:
                err(where, "derived value needs inputs: the claim_ids it was computed from, separated by ;")
            for claim in inputs:
                if claim not in ids:
                    err(where, f'input "{claim}" is not a claim_id in this pack')
            if row["basis"] != "computed":
                err(where, "a derived value has basis computed")
            if number(row["uncertainty"]) is None and row["uncertainty"] != "not_estimated":
                err(where, 'derived value needs uncertainty: a number in the same unit, or "not_estimated" with the reason in uncertainty_basis')
            if not row["uncertainty_basis"]:
                err(where, "say in uncertainty_basis where the uncertainty comes from, or why it could not be estimated")
        elif row["formula_id"] or row["inputs"]:
            err(where, "formula_id and inputs are only for derived values")

        test = tests.get(row["test_id"])
        if test and test["run_status"] == "planned" and source and source["source_kind"] != "test_matrix_planned":
            warn(where, "this test is marked planned but the value comes from a file that is not a planned matrix")
        if quality != "derived":
            stated[(row["test_id"], row["variable_id"])].add(f"{value}{'..' + row['value_max'] if row['value_max'] else ''} [{row['source_id']}]")
        gained[row["variable_id"]].add(row["test_id"])

        # against what the site already holds for this test
        held = known.get(row["test_id"])
        if held and kind == "number" and number(row["value_num"]) is not None:
            for var, lo, hi in (("o2_fraction", "o2_fraction_min", "o2_fraction_max"), ("flow_speed_cm_s", "flow_cm_s_min", "flow_cm_s_max"), ("pressure_kpa", "pressure_kpa_min", "pressure_kpa_min")):
                if row["variable_id"] == var and held[lo]:
                    low, high = float(held[lo]), float(held[hi] or held[lo])
                    n = float(row["value_num"])
                    if not (low - 1e-6 <= n <= high + 1e-6):
                        warn(where, f"differs from the value already held ({held[lo]}{'..' + held[hi] if held[hi] != held[lo] else ''}); both will be shown, so check the source once more")

    conflicts = {key: values for key, values in stated.items() if len({v.split(' [')[0] for v in values}) > 1}

    # --- curves
    points: Counter = Counter()
    for i, row in enumerate(read(pack, "series.csv"), start=2):
        where = f"series.csv line {i}"
        if row["test_id"] not in tests:
            err(where, f'test_id "{row["test_id"]}" is not listed in tests.csv')
        variable = variables.get(row["variable_id"])
        if not variable:
            err(where, f'variable_id "{row["variable_id"]}" is unknown')
        elif row["unit"] != variable["unit"]:
            err(where, f'unit must be "{variable["unit"]}"')
        if number(row["t_s"]) is None or number(row["value_num"]) is None:
            err(where, "t_s and value_num must be numbers")
        if row["source_id"] not in sources:
            err(where, "source_id is not listed in sources.csv")
        points[(row["test_id"], row["variable_id"])] += 1
    for (tid, var), n in points.items():
        if n > MAX_SERIES_POINTS:
            err("series.csv", f"{tid} {var} has {n} points; thin it to at most {MAX_SERIES_POINTS} by a written rule")

    # --- NASA's own stated results
    for i, row in enumerate(read(pack, "findings.csv"), start=2):
        where = f"findings.csv line {i} ({row['finding_id']})"
        if not row["quote"]:
            err(where, "quote is empty; a finding is NASA's sentence, word for word")
        if row["source_id"] not in sources:
            err(where, "source_id is not listed in sources.csv")
        if not row["locator"]:
            err(where, "locator is empty; give the page or section")
        if row["gravity"] not in GRAVITY:
            err(where, f"gravity must be one of {sorted(GRAVITY)}")
        if row["value_num"]:
            if number(row["value_num"]) is None:
                err(where, "value_num is not a number")
            if row["variable_id"] not in variables:
                err(where, f'variable_id "{row["variable_id"]}" is unknown')
        for tid in [x for x in re.split(r"[;\s]+", row["test_ids"]) if x]:
            if tid not in tests and tid not in known:
                err(where, f'test_ids names "{tid}", which is neither in tests.csv nor in known_tests.csv')

    # --- the same sample at two gravity levels
    for i, row in enumerate(read(pack, "pairs.csv"), start=2):
        where = f"pairs.csv line {i} ({row['pair_id']})"
        if number(row["value_0g"]) is None or number(row["value_1g"]) is None:
            err(where, "value_0g and value_1g must both be numbers; a pair with one side missing is not a pair")
        if row["source_id"] not in sources:
            err(where, "source_id is not listed in sources.csv")
        if not row["quote"] and not row["locator"]:
            err(where, "give a locator, and the quote when the source is a document")
        if not row["differs_in"]:
            err(where, 'differs_in is empty; list what besides gravity was different between the two tests, or write "nothing stated"')

    # --- pictures and video
    for i, row in enumerate(read(pack, "media.csv"), start=2):
        where = f"media.csv line {i}"
        if row["test_id"] not in tests and row["test_id"] not in known:
            err(where, f'test_id "{row["test_id"]}" is unknown')
        if row["kind"] not in MEDIA_KINDS:
            err(where, f"kind must be one of {sorted(MEDIA_KINDS)}")
        if not row["match_rule"]:
            err(where, "match_rule is empty; say how this file was matched to this test")
        if row["local_file"]:
            file = pack / row["local_file"]
            if not file.exists():
                err(where, f'local_file "{row["local_file"]}" is not in the pack')
            elif file.stat().st_size > MAX_LOCAL_MEDIA_BYTES:
                err(where, f"{row['local_file']} is over {MAX_LOCAL_MEDIA_BYTES // 1000} KB; shrink it")

    return finish(pack, {"claims": claims, "tests": tests, "gained": gained, "conflicts": conflicts, "known": known})


def finish(pack: Path, seen: dict) -> int:
    print(f"\nPack: {pack}")
    if seen:
        tests, gained, known = seen["tests"], seen["gained"], seen["known"]
        new = sum(1 for t in tests.values() if t["is_new"] == "1")
        print(f"  tests touched: {len(tests)} ({new} new, {len(tests) - new} already held)")
        print(f"  claims: {len(seen['claims'])}")
        for variable, who in sorted(gained.items(), key=lambda item: -len(item[1])):
            fresh = sum(1 for t in who if variable not in known.get(t, {}).get("variables_held", "").split())
            print(f"    {variable:28} {len(who):5} tests, {fresh} of them did not have it before")
        if seen["conflicts"]:
            print(f"  sources disagree on {len(seen['conflicts'])} value(s). These are kept and shown side by side:")
            for (tid, variable), values in list(seen["conflicts"].items())[:20]:
                print(f"    {tid} {variable}: {' vs '.join(sorted(values))}")
    for line in warnings:
        print(f"  WARNING  {line}")
    for line in errors:
        print(f"  ERROR    {line}")
    print(f"\n{len(errors)} error(s), {len(warnings)} warning(s). " + ("Fix the errors before handing over." if errors else "The pack can be handed over."))
    return 1 if errors else 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(2)
    sys.exit(main(Path(sys.argv[1])))
