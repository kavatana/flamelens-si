"""Stage 3 - curated layer: one vocabulary, one set of units, provenance on every value.

Inputs:  data/staged/*.json  and  flamelens_pipeline/dictionary/*.yaml
Outputs: data/curated/
    records.json         every test / session / envelope row, as canonical values
    footage.json         NASA's own videos of single tests, tied to their rows (dictionary/footage.yaml)
    web/public/evidence/ one small file per test with the packs' curves, photographs and NASA's sentences (dossier.py)
    tables.json          how each PSI table was read (column mapping, footnotes, exclusions)
    investigations.json  PSI record + curated knowledge + statistics derived from the records
    publications.json    publications, unchanged from staging
    variables.json       the variable dictionary
    reference.json       crew atmospheres, scenarios, hardware families, Earth themes
    quality.json         every repair, exclusion and warning - the audit trail

Each value keeps the raw cell it came from and one of five quality labels:

    reported   read directly from a PSI table cell (unit conversion only)
    corrected  a PSI cell that was repaired; the note says how and why
    context    not a table cell, but stated in NASA's text; carries a verified quote
    assumed    stated nowhere in PSI; the note says what was assumed
    derived    computed from other values of the same record

The build fails if any quote is not found in its source text.
"""

from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from pathlib import Path

import yaml

from . import config, documents, dossier, footage, packs, parse
from .fetch import accession_number

NOTE_REF_RE = re.compile(r"\(\s*note\s*\d+\s*\)", re.I)


# --------------------------------------------------------------------------------------
# Quote verification
# --------------------------------------------------------------------------------------


def normalize(text: str) -> str:
    """Fold typography so a quote matches its source regardless of curly quotes or spacing."""
    table = str.maketrans({"’": "'", "‘": "'", "“": '"', "”": '"', "–": "-", "—": "-", " ": " "})
    return re.sub(r"\s+", " ", str(text).translate(table)).strip().lower()


class Corpus:
    """The NASA texts a quote may come from."""

    def __init__(self, investigations: list[dict], tables: list[dict], challenge: str,
                 files: dict[str, str] | None = None):
        self.challenge = normalize(challenge)
        # Other NASA files (dictionary/documents.yaml), by id.
        self.files = {key: normalize(text) for key, text in (files or {}).items()}
        self.psi: dict[str, str] = {}
        for inv in investigations:
            parts = [
                inv["title"], inv["acronym"], inv["proposal_title"], inv["sub_research_area"],
                inv["objective"], inv["approach"], inv["hypothesis"], inv["research_impacts"],
                " ".join(inv["keywords"]), " ".join(h["name"] for h in inv["hardware"]),
            ]
            self.psi[inv["accession"]] = normalize(" \n ".join(parts))
        self.tables: dict[str, str] = {}
        for table in tables:
            cells = [c for row in table["rows"] for c in row["cells"].values()]
            self.tables[table["file_name"]] = normalize(" \n ".join(table["columns"] + cells))
        self.failures: list[str] = []

    def check(self, quote: str, source: str, where: str, *, accession: str = "", table: str = "") -> None:
        if source == "challenge":
            haystack = self.challenge
        elif source == "table":
            haystack = self.tables.get(table, "")
        elif source.startswith("doc:"):
            haystack = self.files.get(source[4:], "")
        elif source.startswith("PSI-"):
            haystack = self.psi.get(source, "")
        else:
            haystack = self.psi.get(accession, "")
        if not quote or normalize(quote) not in haystack:
            self.failures.append(f"{where}: quote not found in {source} text -> {quote!r}")


# --------------------------------------------------------------------------------------
# Building values
# --------------------------------------------------------------------------------------


def _round(x: float) -> float:
    return float(f"{x:.6g}")


def number_value(var: str, raw: str, unit: str, variables: dict, column: str) -> dict | None:
    """Turn one cell into a canonical numeric value (or a text value if it is not a number)."""
    cleaned = NOTE_REF_RE.sub("", raw).strip()
    if cleaned.lower().startswith("n/a"):
        return None
    quantity = parse.parse_quantity(cleaned)
    if quantity is None:
        return None
    value: dict = {"var": var, "raw": raw, "column": column, "quality": "reported"}
    if not quantity.is_numeric:
        value["text"] = quantity.qualifier
        return value
    quantity, applied = parse.convert(quantity, variables[var]["unit"], unit)
    value["min"], value["max"] = _round(quantity.min), _round(quantity.max)
    if quantity.levels:
        value["levels"] = [_round(v) for v in quantity.levels]
    if quantity.approx:
        value["approx"] = True
    value["source_unit"] = applied
    return value


def text_value(var: str, text: str, raw: str, column: str, quality: str = "reported", note: str = "") -> dict:
    value = {"var": var, "text": text, "raw": raw, "column": column, "quality": quality}
    if note:
        value["note"] = note
    return value


def constant_value(var: str, spec: dict, variables: dict) -> dict:
    value: dict = {"var": var, "raw": "", "column": "", "quality": spec["quality"]}
    if variables[var]["kind"] == "number":
        value["min"] = value["max"] = float(spec["value"])
        if spec.get("approx"):
            value["approx"] = True
    else:
        value["text"] = str(spec["value"])
    if spec.get("evidence"):
        value["evidence"] = spec["evidence"]
        value["evidence_source"] = spec.get("evidence_source", "psi")
    if spec.get("note"):
        value["note"] = spec["note"]
    return value


def column_values(col: str, raw: str, spec: dict, variables: dict) -> list[dict]:
    """Apply one column's mapping to one cell. A cell can yield several values (a fuel gives
    a species, a fraction and a diluent)."""
    kind = spec.get("parse")
    out: list[dict] = []

    if kind == "fuel":
        fuel = parse.parse_fuel(raw)
        if fuel:
            out.append(text_value("fuel", fuel.name, raw, col))
            if spec.get("fraction", True) and fuel.fraction is not None:
                out.append({"var": "fuel_fraction", "min": fuel.fraction, "max": fuel.fraction,
                            "raw": raw, "column": col, "quality": "reported"})
            if fuel.diluent:
                out.append(text_value("fuel_diluent", fuel.diluent, raw, col))
        return out

    if kind == "sample":
        sample = parse.parse_sample(raw, spec.get("default_material", ""))
        if sample:
            if sample.material_inferred:
                out.append(text_value(
                    "fuel", sample.material, raw, col, "context",
                    "The cell names the shape only. Other rows of this table identify rods, spheres, "
                    f"slabs and films as {sample.material}."))
            else:
                out.append(text_value("fuel", sample.material, raw, col))
            if sample.geometry:
                out.append(text_value("geometry", sample.geometry, raw, col))
            for var, number in (("size_mm", sample.diameter_mm), ("sample_thickness_mm", sample.thickness_mm),
                                ("sample_width_cm", sample.width_cm)):
                if number is not None:
                    out.append({"var": var, "min": _round(number), "max": _round(number),
                                "raw": raw, "column": col, "quality": "reported"})
        return out

    if kind == "atmosphere":
        quantity, diluent = parse.parse_atmosphere(raw)
        if quantity:
            quantity = quantity.scaled(0.01)
            value = {"var": "o2_fraction", "min": _round(quantity.min), "max": _round(quantity.max),
                     "raw": raw, "column": col, "quality": "reported", "source_unit": "percent"}
            if quantity.levels:
                value["levels"] = [_round(v) for v in quantity.levels]
            if quantity.approx:
                value["approx"] = True
            out.append(value)
        if diluent:
            out.append(text_value("diluent", diluent, raw, col))
        return out

    var = spec["var"]
    if kind == "date":
        iso = parse.parse_date(raw)
        return [text_value(var, iso, raw, col)] if iso else []
    if kind == "yyddd":
        iso = parse.parse_yyddd(raw)
        return [text_value(var, iso, raw, col)] if iso else []
    if kind == "bool":
        flag = parse.parse_bool(raw)
        if flag is None:
            return [] if parse.is_missing(raw) else [text_value(var, raw.strip().lower(), raw, col)]
        return [{"var": var, "bool": flag, "raw": raw, "column": col, "quality": "reported"}]

    if kind == "flow_steps":
        steps = parse.parse_flow_steps(raw)
        if steps is None:
            return []
        value = {"var": var, "raw": raw, "column": col, "quality": "reported"}
        notes = [spec.get("note", "")]
        too_fast = steps.levels and "max" in spec and max(steps.levels) > spec["max"]
        if not steps.levels or too_fast:
            value["text"] = raw.strip()
            if too_fast:
                value["suspect"] = True
                notes.append(f"A figure in this cell is above {spec['max']:g} cm/s, the largest speed in NASA's "
                             "calibration of this duct, so no speed is read from it.")
            elif steps.unread:
                notes.append(f"No speed is read from this cell: {steps.unread}.")
        else:
            levels = sorted({_round(v) for v in steps.levels})
            value["min"], value["max"] = levels[0], levels[-1]
            if len(levels) > 1:
                value["levels"] = levels
                notes.append("The flow was changed during this test; every speed NASA lists is kept.")
            if steps.approx:
                value["approx"] = True
            if steps.words:
                notes.append(f"NASA's cell also says: {steps.words}.")
            value["source_unit"] = spec.get("unit", "")
        if spec.get("evidence"):
            value["evidence"] = spec["evidence"]
            value["evidence_source"] = spec.get("evidence_source", "psi")
        note = " ".join(re.sub(r"\s+", " ", n).strip() for n in notes if n).strip()
        if note:
            value["note"] = note
        return [value]

    var_kind = variables[var]["kind"]
    if var_kind == "number":
        value = number_value(var, raw, spec.get("unit", ""), variables, col)
        return [value] if value else []
    if "map" in spec:
        mapped = parse.parse_category(raw, spec["map"])
        return [text_value(var, mapped, raw, col)] if mapped else []
    if parse.is_missing(raw):
        return []
    return [text_value(var, raw.strip(), raw, col)]


# --------------------------------------------------------------------------------------
# Tables -> records
# --------------------------------------------------------------------------------------


def _fill_label(template: str, cells: dict[str, str]) -> str:
    label = re.sub(r"\{([^}]+)\}", lambda m: cells.get(m.group(1), ""), template)
    return re.sub(r"\s+", " ", label).strip()


def build_records(spec: dict, table: dict, variables: dict, corpus: Corpus) -> tuple[list[dict], dict, list[dict]]:
    """Apply one table spec. Returns (records, table metadata, quality findings)."""
    acc, file_name = spec["accession"], spec["file"]
    findings: list[dict] = []
    rules = spec.get("rows") or {}
    rows = [{"row": r["row"], "cells": dict(r["cells"]), "marks": {}} for r in table["rows"]]

    def finding(kind: str, message: str, **extra) -> None:
        findings.append({"accession": acc, "table": file_name, "kind": kind, "message": message, **extra})

    # 1. Footnotes kept in a dedicated column, or as whole rows.
    footnotes: list[str] = []
    notes_col = rules.get("notes_column")
    if notes_col:
        for row in rows:
            note = row["cells"].pop(notes_col, "")
            if note:
                footnotes.append(note)
    if "footnotes" in rules:
        rule, kept = rules["footnotes"], []
        for row in rows:
            if re.search(rule["pattern"], row["cells"].get(rule["column"], ""), re.I):
                footnotes.append(" ".join(row["cells"].values()))
            else:
                kept.append(row)
        rows = kept

    # 2. Rows that are not tests.
    excluded: list[dict] = []
    for rule in rules.get("exclude", []):
        kept = []
        for row in rows:
            if re.search(rule["pattern"], row["cells"].get(rule["column"], ""), re.I):
                excluded.append({"row": row["row"], "reason": rule["reason"], "cells": row["cells"]})
            else:
                kept.append(row)
        rows = kept
    if excluded:
        finding("excluded-rows", f"{len(excluded)} row(s) are not tests and were left out: "
                + "; ".join(sorted({e['reason'] for e in excluded})), rows=[e["row"] for e in excluded])

    # 3. Rows that continue the row above (extra levels listed on their own lines).
    if "continuation" in rules:
        rule, kept = rules["continuation"], []
        merged = 0
        for row in rows:
            if kept and not row["cells"].get(rule["key_column"]):
                for col in rule["merge"]:
                    extra = row["cells"].get(col)
                    if extra:
                        previous = kept[-1]["cells"].get(col, "")
                        kept[-1]["cells"][col] = f"{previous}; {extra}" if previous else extra
                merged += 1
            else:
                kept.append(row)
        rows = kept
        if merged:
            finding("merged-rows", f"{merged} continuation row(s) were folded into the test day they belong to "
                    f"(they list further values of {', '.join(rule['merge'])}).")

    # 4. Merged cells: a blank means "same as the row above".
    for col in rules.get("fill_down", []):
        previous, filled = "", []
        for row in rows:
            if row["cells"].get(col):
                previous = row["cells"][col]
            elif previous:
                row["cells"][col] = previous
                row["marks"][col] = ("corrected", "Blank in the PSI table (merged cell); taken from the row above.")
                filled.append(row["row"])
        if filled:
            finding("filled-down", f"Column '{col}': {len(filled)} blank cell(s) filled from the row above.", rows=filled)

    # 5. Spreadsheet drag-fill damage.
    for col in spec.get("repair_autofill", []):
        originals = [row["cells"].get(col, "") for row in rows]
        repaired = parse.repair_autofill(originals)
        changed = []
        for row, original, (value, was_repaired) in zip(rows, originals, repaired):
            if was_repaired:
                row["cells"][col] = value
                row["marks"][col] = ("corrected", f"The PSI table reads '{original}', a spreadsheet auto-fill "
                                                  f"artefact; restored to '{value}'.")
                changed.append(original)
        if changed:
            sample = ", ".join(list(dict.fromkeys(changed))[:5])
            finding("autofill-repair", f"Column '{col}': {len(changed)} cell(s) were damaged by spreadsheet "
                    f"drag-fill (for example {sample}) and were restored to the first value of each run.",
                    count=len(changed))

    # 6. Individual typos.
    for fix in spec.get("corrections", []):
        hits = []
        for row in rows:
            if row["cells"].get(fix["column"]) == fix["raw"]:
                row["cells"][fix["column"]] = fix["value"]
                row["marks"][fix["column"]] = ("corrected", f"The PSI table reads '{fix['raw']}'. {fix['reason']}")
                hits.append(row["row"])
        if hits:
            finding("typo", f"Column '{fix['column']}': '{fix['raw']}' read as '{fix['value']}' in {len(hits)} "
                    f"row(s). {fix['reason']}", rows=hits)
        else:
            finding("stale-correction", f"Correction for '{fix['raw']}' in '{fix['column']}' matched nothing.")

    # 7. "Same conditions as rows 1-4".
    if "inherit" in rules:
        rule = rules["inherit"]
        sources = [r for r in rows if r["row"] in rule["source_rows"]]
        inherited = []
        for row in rows:
            cell = row["cells"].get(rule["column"], "")
            if re.search(rule["pattern"], cell, re.I):
                row["cells"][rule["column"]] = re.sub(rule["pattern"], "", cell, flags=re.I).strip()
                for col in rule["columns"]:
                    levels = sorted({s["cells"][col] for s in sources if s["cells"].get(col)}, key=float)
                    row["cells"][col] = "; ".join(levels)
                    row["marks"][col] = ("reported", f"The PSI table says '{cell}'; the levels of those rows are listed.")
                row["kind"] = "envelope"
                inherited.append(row["row"])
        if inherited:
            finding("inherited-conditions", f"{len(inherited)} row(s) say 'same conditions as' other rows; "
                    "they are kept as envelopes listing those conditions.", rows=inherited)

    # 8. Evidence for constants.
    constants = spec.get("constants") or {}
    for var, const in constants.items():
        if const["quality"] == "context":
            corpus.check(const.get("evidence", ""), const.get("evidence_source", "psi"),
                         f"tables.yaml {file_name} constant {var}", accession=acc, table=file_name)

    # 9. Rows -> records.
    column_specs = spec.get("columns") or {}
    unknown = [c for c in column_specs if c not in table["columns"]]
    if unknown:
        raise ValueError(f"{file_name}: mapped column(s) not in the PSI table: {unknown}")
    for col, col_spec in column_specs.items():
        if col_spec.get("evidence"):
            corpus.check(col_spec["evidence"], col_spec.get("evidence_source", "psi"),
                         f"tables.yaml {file_name} column {col}", accession=acc, table=file_name)

    records = []
    implausible: dict[str, list[tuple[int, str]]] = defaultdict(list)
    oxygen_rose: list[int] = []
    for row in rows:
        cells = row["cells"]
        values: dict[str, dict] = {var: constant_value(var, const, variables) for var, const in constants.items()}
        for col, col_spec in column_specs.items():
            raw = cells.get(col, "")
            if not raw:
                continue
            for value in column_values(col, raw, col_spec, variables):
                if col in row["marks"]:
                    quality, note = row["marks"][col]
                    value["quality"] = quality if value["quality"] == "reported" else value["quality"]
                    value["note"] = (value.get("note", "") + " " + note).strip()
                values[value["var"]] = value
        if "date_parts" in spec:
            parts = spec["date_parts"]
            iso = parse.parse_date_parts(cells.get(parts["year"]), cells.get(parts["month"]), cells.get(parts["day"]))
            if iso:
                raw = " ".join(cells.get(parts[k], "") for k in ("year", "month", "day"))
                values["test_date"] = text_value("test_date", iso, raw, f"{parts['year']} / {parts['month']} / {parts['day']}")

        _derive(values)
        for var, raw in _check_plausible(values, variables):
            implausible[var].append((row["row"], raw))
        if _check_oxygen_rise(values):
            oxygen_rose.append(row["row"])

        records.append({
            "id": f"{acc}/{spec['code']}/{row['row']}",
            "accession": acc,
            "table": file_name,
            "row": row["row"],
            "kind": row.get("kind", spec["record_kind"]),
            "label": _fill_label(spec["label"], cells) or f"Row {row['row']}",
            "values": sorted(values.values(), key=lambda v: v["var"]),
            "original": {c: table_cell for c, table_cell in _original_cells(table, row["row"]).items()},
        })

    for var, hits in implausible.items():
        lo, hi = variables[var]["plausible"]
        examples = ", ".join(dict.fromkeys(raw for _, raw in hits))
        finding("implausible-value",
                f"{variables[var]['label']}: {len(hits)} value(s) fall outside the expected range "
                f"{lo:g} to {hi:g} {variables[var].get('unit', '')} ({examples}). They are kept exactly as "
                "published, flagged, and left out of charts.", rows=[r for r, _ in hits])

    if oxygen_rose:
        finding("inconsistent-value",
                f"Oxygen at end of test: {len(oxygen_rose)} value(s) are more than {OXYGEN_RISE_LIMIT * 100:g} points above the "
                "oxygen at the start of the same test. Burning uses oxygen up, so this cannot be a reading of the same "
                "air. They are kept exactly as published, flagged, and left out of charts.", rows=oxygen_rose)

    mapped_vars = defaultdict(list)
    for col, col_spec in column_specs.items():
        mapped_vars[col] = [col_spec["var"]] if "var" in col_spec else {
            "fuel": ["fuel", "fuel_fraction", "fuel_diluent"],
            "sample": ["fuel", "geometry", "size_mm", "sample_thickness_mm", "sample_width_cm"],
            "atmosphere": ["o2_fraction", "diluent"],
        }[col_spec["parse"]]

    meta = {
        "accession": acc,
        "file_name": file_name,
        "code": spec["code"],
        "title": spec["title"],
        "record_kind": spec["record_kind"],
        "rows_in_file": len(table["rows"]),
        "records": len(records),
        "encoding": table["encoding"],
        "columns": [
            {"name": c, "variables": mapped_vars.get(c, []), "unit": (column_specs.get(c) or {}).get("unit", "")}
            for c in table["columns"]
        ],
        "constants": [constant_value(var, const, variables) for var, const in constants.items()],
        "footnotes": footnotes,
        "header_notes": spec.get("header_notes", []),
        "record_note": re.sub(r"\s+", " ", spec.get("record_note", "")).strip(),
        "excluded": excluded,
    }
    for note in meta["header_notes"]:
        finding("header", re.sub(r"\s+", " ", note).strip())
    return records, meta, findings


def _original_cells(table: dict, row_number: int) -> dict[str, str]:
    for row in table["rows"]:
        if row["row"] == row_number:
            return row["cells"]
    return {}


def _derive(values: dict[str, dict]) -> None:
    """Values that follow from others in the same record."""
    if "diluent" not in values:
        present = [name for var, name in (("n2_fraction", "N2"), ("co2_fraction", "CO2"), ("he_fraction", "He"))
                   if values.get(var, {}).get("max", 0) > 0]
        if present:
            values["diluent"] = {"var": "diluent", "text": " + ".join(present), "raw": "", "column": "",
                                 "quality": "derived", "note": "From the non-zero gas fractions of this test."}


def _check_plausible(values: dict[str, dict], variables: dict) -> list[tuple[str, str]]:
    """Flag values outside a variable's expected range. Returns (variable, raw cell) pairs."""
    flagged = []
    for var, value in values.items():
        bounds = variables[var].get("plausible")
        if not bounds or "min" not in value:
            continue
        if value["min"] < bounds[0] or value["max"] > bounds[1]:
            value["note"] = (value.get("note", "") + " Outside the expected range; kept exactly as published.").strip()
            value["suspect"] = True
            flagged.append((var, value["raw"]))
    return flagged


# A burn uses oxygen up. A reading of the air after a test can sit a little above the reading
# before it (sensor noise), but not by more than this fraction.
OXYGEN_RISE_LIMIT = 0.02


def _check_oxygen_rise(values: dict[str, dict]) -> bool:
    """Flag an end-of-test oxygen reading that is well above the starting oxygen of the same air."""
    start, end = values.get("o2_fraction"), values.get("o2_fraction_final")
    basis = values.get("o2_basis", {}).get("text")
    if not start or not end or "min" not in start or "min" not in end or basis != "ambient" or end.get("suspect"):
        return False
    if end["min"] <= start["max"] + OXYGEN_RISE_LIMIT:
        return False
    end["note"] = (end.get("note", "") + " Higher than the oxygen at the start of this test, which burning cannot cause; "
                   "kept exactly as published.").strip()
    end["suspect"] = True
    return True


# --------------------------------------------------------------------------------------
# Investigations
# --------------------------------------------------------------------------------------


def _num(record: dict, var: str) -> dict | None:
    for value in record["values"]:
        if value["var"] == var and "min" in value:
            return value
    return None


def _text(record: dict, var: str) -> str:
    for value in record["values"]:
        if value["var"] == var and "text" in value:
            return value["text"]
    return ""


def _span(records: list[dict], var: str, *, ambient_only: bool = False) -> dict | None:
    values = []
    for record in records:
        if ambient_only and _text(record, "o2_basis") == "oxidizer stream":
            continue
        value = _num(record, var)
        # A flagged value is kept on its test but does not stretch the experiment's stated range.
        if value and not value.get("suspect"):
            values.append(value)
    if not values:
        return None
    return {"min": min(v["min"] for v in values), "max": max(v["max"] for v in values), "records": len(values)}


def detect_measurements(inv: dict, vocabulary: list[dict]) -> list[dict]:
    text = " ".join([inv["objective"], inv["approach"], inv["research_impacts"]])
    found = []
    for item in vocabulary:
        # Flight experiments mention models they will validate; only ground studies *are* simulations.
        if item["id"] == "simulation" and not inv["project_type"].lower().startswith("ground"):
            continue
        match = re.search(rf"\b(?:{item['pattern']})", text, re.I)
        if match:
            start = max(0, match.start() - 60)
            snippet = re.sub(r"\s+", " ", text[start: match.end() + 60]).strip()
            found.append({"id": item["id"], "name": item["name"], "matched": match.group(0), "snippet": snippet})
    return found


def build_investigation(inv: dict, curated: dict, records: list[dict], pubs: list[dict], files: dict,
                        tables_meta: list[dict], reference: dict, corpus: Corpus) -> dict:
    acc = inv["accession"]
    where = f"investigations.yaml {acc}"

    relevance = curated["relevance"]
    corpus.check(relevance["quote"], relevance.get("source", "psi"), f"{where} relevance", accession=acc)
    pillars = {}
    for name in ("prevention", "detection", "suppression"):
        entry = curated.get("pillars", {}).get(name)
        if entry:
            corpus.check(entry["quote"], entry.get("source", "psi"), f"{where} pillar {name}", accession=acc)
            pillars[name] = {"score": entry["score"], "quote": entry["quote"], "source": entry.get("source", "psi")}
        else:
            pillars[name] = {"score": 0, "quote": "", "source": ""}
    insights = []
    for i, item in enumerate(curated.get("insights", [])):
        source = item.get("source", "psi")
        corpus.check(item["quote"], source, f"{where} insight {i + 1}", accession=acc)
        insights.append({"text": item["text"], "quote": item["quote"], "source": source})
    emulates = curated.get("emulates")
    if emulates:
        corpus.check(emulates["quote"], emulates.get("source", "psi"), f"{where} emulates", accession=acc)
        emulates = {**emulates, "source": emulates.get("source", "psi")}
    earth = curated.get("earth")
    if earth:
        corpus.check(earth["quote"], earth.get("source", "psi"), f"{where} earth", accession=acc)
        earth = {**earth, "source": earth.get("source", "psi")}

    kinds = Counter(r["kind"] for r in records)
    coverage = Counter(v["var"] for r in records for v in r["values"] if v["quality"] in ("reported", "corrected"))
    fuels = Counter(_text(r, "fuel") for r in records if _text(r, "fuel"))
    geometries = Counter(_text(r, "geometry") for r in records if _text(r, "geometry"))
    mappable = sum(1 for r in records if _num(r, "o2_fraction") and _num(r, "pressure_kpa"))
    with_doi = sum(1 for p in pubs if p["doi"])

    return {
        **inv,
        "short": curated["short"],
        "expansion": curated["expansion"],
        "one_line": curated["one_line"],
        "family": curated["family"],
        "platform": curated["platform"],
        "builds_on": curated.get("builds_on", []),
        "fuel_phases": curated["fuel_phases"],
        "emulates": emulates,
        "fire_phases": curated["fire_phases"],
        "varied": curated["varied"],
        "relevance": {"level": relevance["level"], "quote": relevance["quote"], "source": relevance.get("source", "psi")},
        "pillars": pillars,
        "insights": insights,
        "earth": earth,
        "measurements": detect_measurements(inv, reference["measurements"]),
        "files": files,
        "tables": [t["file_name"] for t in tables_meta],
        "stats": {
            "records": len(records),
            "tests": kinds.get("test", 0),
            "sessions": kinds.get("session", 0),
            "envelopes": kinds.get("envelope", 0),
            "datasets": kinds.get("dataset", 0),
            "flames_in_sessions": int(sum((_num(r, "flames_ignited") or {}).get("max", 0)
                                          for r in records if r["kind"] == "session")),
            "mappable": mappable,
            "variables": sorted(coverage),
            "variable_counts": dict(sorted(coverage.items())),
            "o2": _span(records, "o2_fraction"),
            "o2_ambient": _span(records, "o2_fraction", ambient_only=True),
            "pressure": _span(records, "pressure_kpa"),
            "flow": _span(records, "flow_speed_cm_s"),
            "fuels": [{"name": n, "records": c} for n, c in fuels.most_common()],
            "geometries": [{"name": n, "records": c} for n, c in geometries.most_common()],
            "publications": len(pubs),
            "publications_with_doi": with_doi,
        },
    }


# --------------------------------------------------------------------------------------
# Entry point
# --------------------------------------------------------------------------------------


def _load_yaml(name: str):
    return yaml.safe_load((config.DICTIONARY_DIR / name).read_text())


def _manifest() -> dict[str, dict]:
    entries = json.loads((config.RAW_DIR / "manifest.json").read_text())
    return {Path(e["path"]).name: e for e in entries}


def run() -> None:
    staged = {name: json.loads((config.STAGED_DIR / f"{name}.json").read_text())
              for name in ("investigations", "publications", "files", "tables")}
    variables = _load_yaml("variables.yaml")
    table_specs = _load_yaml("tables.yaml")
    curated_inv = _load_yaml("investigations.yaml")
    reference = _load_yaml("reference.yaml")
    challenge = (config.DICTIONARY_DIR / "challenge_statement.txt").read_text()

    # Plausibility bounds live with the pipeline, not the dictionary: they are checks, not definitions.
    variables["o2_fraction"]["plausible"] = [0.05, 1.0]
    variables["o2_fraction_final"]["plausible"] = [0.05, 1.0]
    variables["pressure_kpa"]["plausible"] = [10.0, 700.0]
    variables["flow_speed_cm_s"]["plausible"] = [0.0, 200.0]

    nasa_files = []
    for doc in documents.listed():
        entry = _manifest().get(doc["file"], {})
        nasa_files.append({
            "id": doc["id"], "accession": doc["accession"], "title": doc["title"], "file_name": doc["file"],
            "kind": doc["kind"], "why": re.sub(r"\s+", " ", doc["why"]).strip(),
            "paragraphs": documents.paragraphs(doc),
            "source_url": entry.get("source_url", ""), "sha256": entry.get("sha256", ""),
            "fetched_at": entry.get("fetched_at", ""),
        })
    corpus = Corpus(staged["investigations"], staged["tables"], challenge,
                    files={d["id"]: " \n ".join(d["paragraphs"]) for d in nasa_files})
    tables_by_file = {t["file_name"]: t for t in staged["tables"]}
    manifest = _manifest()

    records, tables_meta, findings = [], [], []
    spec_files = {s["file"] for s in table_specs}
    missing = sorted(set(tables_by_file) - spec_files)
    if missing:
        raise SystemExit(f"PSI tables with no mapping in tables.yaml: {missing}")
    for spec in table_specs:
        table = tables_by_file[spec["file"]]
        recs, meta, found = build_records(spec, table, variables, corpus)
        entry = manifest.get(spec["file"], {})
        meta["source_url"] = entry.get("source_url", "")
        meta["sha256"] = entry.get("sha256", "")
        meta["fetched_at"] = entry.get("fetched_at", "")
        records.extend(recs)
        tables_meta.append(meta)
        findings.extend(found)

    # Evidence packs: values from NASA files other than the tables (see packs.py).
    before_packs = packs.scoreboard(records)
    pack_report = packs.apply(records, tables_meta, variables, findings)
    nasa_files.extend(pack_report["documents"])

    # Reference material: verify quotes and convert psi to kPa.
    psi = reference["psi_to_kpa"]
    for env in reference["environments"]:
        corpus.check(env["quote"], env["source"], f"reference.yaml environment {env['id']}")
        for key in ("pressure_psi", "pressure_psi_min", "pressure_psi_max"):
            if key in env:
                env[key.replace("_psi", "_kpa")] = _round(env[key] * psi)
    for group in ("stated_gaps", "families"):
        for item in reference[group]:
            corpus.check(item["quote"], item["source"], f"reference.yaml {group} {item['id']}")
    corpus.check(reference["earth_context"]["quote"], reference["earth_context"]["source"], "reference.yaml earth_context")

    files_by_acc = {f["accession"]: f for f in staged["files"]}
    investigations = []
    for inv in staged["investigations"]:
        acc = inv["accession"]
        if acc not in curated_inv:
            raise SystemExit(f"{acc} has no entry in investigations.yaml")
        if not inv["record_complete"]:
            findings.append({"accession": acc, "table": "", "kind": "partial-record",
                             "message": "PSI's server cut this record off before the end. Every field up to the cut "
                                        "is used; later fields were filled from PSI's search index."})
        investigations.append(build_investigation(
            inv, curated_inv[acc],
            [r for r in records if r["accession"] == acc],
            [p for p in staged["publications"] if p["accession"] == acc],
            files_by_acc[acc],
            [t for t in tables_meta if t["accession"] == acc],
            reference, corpus))

    # SI briefings for the scenario presets: verify every quote, and that each preset exists.
    briefings = _load_yaml("interpretations.yaml")
    model = briefings.pop("model")
    scenario_ids = {sc["id"] for sc in reference["scenarios"]}
    interpretations = {}
    for key, body in briefings.items():
        if key not in scenario_ids:
            raise SystemExit(f"interpretations.yaml: '{key}' is not a scenario preset")
        for i, point in enumerate(body["points"]):
            point["source"] = point.get("source", "psi")
            corpus.check(point["quote"], point["source"], f"interpretations.yaml {key} point {i + 1}", accession=point["accession"])
        body["summary"] = re.sub(r"\s+", " ", body["summary"]).strip()
        interpretations[f"scenario:{key}"] = {"body": body, "model": model}

    if corpus.failures:
        raise SystemExit("Quote verification failed:\n  " + "\n  ".join(corpus.failures))

    families = {f["id"] for f in reference["families"]}
    themes = {t["id"] for t in reference["earth_themes"]}
    for inv in investigations:
        if inv["family"] not in families:
            raise SystemExit(f"{inv['accession']}: unknown family {inv['family']}")
        if inv["earth"] and inv["earth"]["theme"] not in themes:
            raise SystemExit(f"{inv['accession']}: unknown earth theme {inv['earth']['theme']}")

    reference.pop("measurements")
    quality_counts = Counter(v["quality"] for r in records for v in r["values"])
    quality = {
        "findings": sorted(findings, key=lambda f: (accession_number(f["accession"]), f["table"], f["kind"])),
        "value_quality": dict(sorted(quality_counts.items())),
        "quotes_verified": True,
    }

    config.CURATED_DIR.mkdir(parents=True, exist_ok=True)
    outputs = {
        "records": records, "tables": tables_meta, "investigations": investigations,
        "publications": staged["publications"], "variables": variables, "reference": reference, "quality": quality,
        "interpretations": interpretations, "documents": nasa_files,
        "footage": footage.build(records),
    }
    # The packs' curves, photographs and sentences go to one small file per test, for the site to fetch when a test is opened.
    dossiers = dossier.build(pack_report["evidence"], variables)
    (config.CURATED_DIR / "evidence.json").unlink(missing_ok=True)
    for name, payload in outputs.items():
        (config.CURATED_DIR / f"{name}.json").write_text(json.dumps(payload, indent=1, ensure_ascii=False) + "\n")

    kinds = Counter(r["kind"] for r in records)
    print(f"curated: {len(records)} records {dict(kinds)} from {len(tables_meta)} tables")
    print(f"values by quality: {dict(quality_counts)}")
    print(f"quality findings: {dict(Counter(f['kind'] for f in findings))}")
    for line in packs.describe(pack_report, before_packs, packs.scoreboard(records)):
        print(line)
    print(footage.describe(outputs["footage"]))
    print(dossier.describe(dossier.write(dossiers)))


if __name__ == "__main__":
    run()
