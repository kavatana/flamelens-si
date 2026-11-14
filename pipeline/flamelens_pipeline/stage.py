"""Stage 2 - staged layer: parse the raw snapshots into tidy, typed files.

Nothing is interpreted here. Field names are normalized to snake_case and whitespace
is trimmed, but every value is still what PSI published.

Outputs (in ``data/staged/``):

    investigations.json   one object per combustion investigation
    publications.json     one object per listed publication
    files.json            per investigation: file counts and bytes by PSI category
    tables.json           every experimental-table row as {column: raw text}
"""

from __future__ import annotations

import csv
import io
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

from . import config
from .fetch import TABLE_KEYS, accession_number, combustion_accessions, load_record

DOI_RE = re.compile(r"10\.\d{4,9}/[^\s\"<>]+", re.I)


def clean(text: object) -> str:
    """Collapse whitespace; PSI text carries stray non-breaking spaces and line breaks."""
    if text is None:
        return ""
    return re.sub(r"\s+", " ", str(text).replace(" ", " ")).strip()


def clean_block(text: object) -> str:
    """Like ``clean`` but keeps paragraph breaks, for long descriptive fields."""
    if text is None:
        return ""
    raw = str(text).replace(" ", " ").replace("\r\n", "\n").replace("\r", "\n")
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in raw.split("\n")]
    out = re.sub(r"\n{3,}", "\n\n", "\n".join(lines)).strip()
    return out


def normalize_doi(value: object) -> str:
    """Return a bare DOI ('10.xxxx/...') or '' when the field holds no DOI."""
    match = DOI_RE.search(clean(value))
    return match.group(0).rstrip(".,;)") if match else ""


def split_list(value: object) -> list[str]:
    """Split PSI's comma- or multi-space-separated list fields."""
    parts = re.split(r"\s{3,}|,\s*", str(value or "").replace(" ", " "))
    return [clean(p) for p in parts if clean(p)]


def decode_table(raw: bytes) -> tuple[str, str]:
    """Decode a PSI CSV. Most are UTF-8; some were exported from Excel as Windows-1252."""
    try:
        return raw.decode("utf-8-sig"), "utf-8"
    except UnicodeDecodeError:
        return raw.decode("cp1252"), "cp1252"


def parse_table(raw: bytes) -> dict:
    """Parse one CSV into columns and non-empty rows. Row numbers are 1-based data rows."""
    text, encoding = decode_table(raw)
    rows = list(csv.reader(io.StringIO(text)))
    header = [clean(h) for h in rows[0]] if rows else []
    # Disambiguate repeated or blank header names so cells can be keyed by column.
    seen: Counter[str] = Counter()
    columns = []
    for i, name in enumerate(header):
        name = name or f"column_{i + 1}"
        seen[name] += 1
        columns.append(name if seen[name] == 1 else f"{name} ({seen[name]})")
    out_rows = []
    for n, row in enumerate(rows[1:], start=1):
        cells = {columns[i]: clean(c) for i, c in enumerate(row[: len(columns)]) if clean(c)}
        if cells:
            out_rows.append({"row": n, "cells": cells})
    return {"encoding": encoding, "columns": columns, "rows": out_rows}


def _index_by_accession(index: dict) -> dict[str, dict]:
    return {hit["_source"]["Accession"]: hit["_source"] for hit in index["hits"]["hits"]}


def _file_category(entry: dict) -> str:
    # remote_path looks like /Home/psi-data/PSI-25/Raw Data/...
    parts = str(entry.get("remote_path", "")).split("/")
    return parts[4] if len(parts) > 4 and parts[4] else "Uncategorized"


def stage_investigation(acc: str, record: dict, complete: bool, idx: dict) -> dict:
    """Merge the full record with the search index (the index fills gaps in cut-off records)."""

    def pick(record_key: str, index_key: str, block: bool = False) -> str:
        fn = clean_block if block else clean
        return fn(record.get(record_key)) or fn(idx.get(index_key))

    hardware_names = split_list(record.get("experimentHardware"))
    hardware_links = split_list(record.get("experimentHardwareLink"))
    if not hardware_names:
        hw = idx.get("Experiment Hardware")
        hw_items = hw if isinstance(hw, list) else [hw] if isinstance(hw, dict) else []
        hardware_names = [clean(h.get("Name")) for h in hw_items if clean(h.get("Name"))]
        hardware_links = [clean(h.get("Link")) for h in hw_items if clean(h.get("Link"))]

    contacts = []
    for c in record.get("contacts") or []:
        name = clean(" ".join(filter(None, [c.get("firstName"), c.get("midInitials"), c.get("lastName")])))
        roles = [clean(r.get("annotationValue")) for r in c.get("roles") or [] if clean(r.get("annotationValue"))]
        if name:
            # E-mail addresses are public on PSI but are deliberately not carried forward.
            contacts.append({"name": name, "roles": roles, "affiliation": clean(c.get("affiliation"))})

    files = record.get("added") or []
    total_bytes = record.get("totalFileSize")
    if total_bytes is None:
        total_bytes = sum(f.get("file_size") or 0 for f in files)

    return {
        "accession": acc,
        "record_complete": complete,
        "title": pick("title", "Title"),
        "acronym": pick("investigationAcronym", "Acronym"),
        "proposal_title": pick("proposalTitle", "Proposal Title"),
        "project_type": pick("projectType", "Project Type"),
        "research_area": pick("researchArea", "Research Area"),
        "sub_research_area": pick("subResearchArea", "SubResearch Area"),
        "flight_platform": pick("flightProgram", "Flight Platform"),
        "sponsoring_agency": pick("spaceProgram", "Sponsoring Agency"),
        "nasa_center": pick("managingNasaCenter", "Monitoring Center"),
        "objective": pick("objective", "Objectives", block=True),
        "approach": pick("approach", "Approach", block=True),
        "hypothesis": pick("hypothesis", "Hypothesis", block=True),
        "research_impacts": pick("researchImpacts", "Research Impacts/Earth Benefits", block=True),
        "keywords": split_list(idx.get("Keywords")),
        "related_investigations": re.findall(r"PSI-\d+", str(idx.get("Related Investigations") or "")),
        "hardware": [
            {"name": name, "link": hardware_links[i] if i < len(hardware_links) else ""}
            for i, name in enumerate(hardware_names)
        ],
        "contacts": contacts,
        "start_date": pick("investigationStartDate", "Investigation Start Date"),
        "end_date": pick("investigationEndDate", "Investigation End Date"),
        "release_date": clean(record.get("releaseDate")),
        "modified_date": clean(record.get("modifiedDate")),
        "doi": normalize_doi(record.get("doi")),
        "license": clean(record.get("licenseIdentifier")),
        "version": record.get("version"),
        "total_bytes": int(total_bytes or 0),
        "file_count": len(files),
        "table_files": [
            ref["file_name"] for key in TABLE_KEYS for ref in record.get(key) or [] if ref.get("file_name")
        ],
        "psi_url": config.PSI_PAGE_URL.format(accession=acc),
    }


def stage_publications(acc: str, record: dict, idx: dict) -> list[dict]:
    pubs = []
    for seq, pub in enumerate(record.get("publications") or [], start=1):
        title = clean(pub.get("title"))
        if not title:
            continue
        status = pub.get("status") or {}
        pubs.append(
            {
                "accession": acc,
                "seq": seq,
                "title": title,
                "authors": clean(pub.get("authorList")),
                "doi": normalize_doi(pub.get("doi")),
                "status": clean(status.get("annotationValue") if isinstance(status, dict) else status),
            }
        )
    return pubs


def stage_files(acc: str, record: dict) -> dict:
    by_category: dict[str, dict] = defaultdict(lambda: {"count": 0, "bytes": 0})
    extensions: Counter[str] = Counter()
    documents = []
    for entry in record.get("added") or []:
        category = _file_category(entry)
        size = int(entry.get("file_size") or 0)
        by_category[category]["count"] += 1
        by_category[category]["bytes"] += size
        name = clean(entry.get("file_name"))
        extensions[Path(name).suffix.lower() or "(none)"] += 1
        if category not in ("Raw Data", "Analyzed Data"):
            documents.append({"category": category, "name": name, "bytes": size})
    return {
        "accession": acc,
        "categories": dict(sorted(by_category.items())),
        "extensions": dict(extensions.most_common()),
        "documents": sorted(documents, key=lambda d: (d["category"], d["name"])),
    }


def run() -> None:
    index = json.loads((config.RAW_DIR / "index.json").read_text())
    by_acc = _index_by_accession(index)

    investigations, publications, files, tables = [], [], [], []
    for acc in combustion_accessions(index):
        record, complete = load_record(acc)
        investigations.append(stage_investigation(acc, record, complete, by_acc[acc]))
        publications.extend(stage_publications(acc, record, by_acc[acc]))
        files.append(stage_files(acc, record))
        folder = config.RAW_DIR / "tables" / acc
        for path in sorted(folder.glob("*")) if folder.exists() else []:
            parsed = parse_table(path.read_bytes())
            tables.append({"accession": acc, "file_name": path.name, **parsed})

    tables.sort(key=lambda t: (accession_number(t["accession"]), t["file_name"]))
    config.STAGED_DIR.mkdir(parents=True, exist_ok=True)
    for name, payload in [
        ("investigations.json", investigations),
        ("publications.json", publications),
        ("files.json", files),
        ("tables.json", tables),
    ]:
        (config.STAGED_DIR / name).write_text(json.dumps(payload, indent=1, ensure_ascii=False) + "\n")

    rows = sum(len(t["rows"]) for t in tables)
    print(
        f"staged: {len(investigations)} investigations, {len(publications)} publications, "
        f"{len(tables)} tables, {rows} table rows"
    )


if __name__ == "__main__":
    run()
