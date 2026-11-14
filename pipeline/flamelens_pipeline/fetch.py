"""Stage 1 - raw layer: snapshot NASA PSI combustion investigations exactly as served.

What is fetched, for every investigation whose research area is Combustion Science:

    index.json                          the public search index (all PSI investigations)
    investigations/<acc>.json           the full investigation record
    investigations/<acc>.truncated.json the same, when PSI cut the response short (see below)
    tables/<acc>/<file>                 every "Experimental table" / "Modeling table" file
    documents/<acc>/<file>              the few other NASA files named in dictionary/documents.yaml

Nothing here is interpreted or cleaned. Each snapshot is recorded in ``manifest.json``
with its source URL, fetch time, byte size and SHA-256, so later layers can prove
which bytes they were built from.

Truncated records
-----------------
PSI's server ends any response after about 180 seconds. One record (PSI-23, about 8 MB,
almost all of it a list of raw-data files) does not finish in that time. The bytes that
do arrive are kept unchanged as ``<acc>.truncated.json`` and flagged ``complete: false``
in the manifest. The staging step recovers every complete top-level field from them and
fills the rest from the search index.

Re-running is safe: files already on disk are kept unless ``--refresh`` is passed.
"""

from __future__ import annotations

import argparse
import hashlib
import http.client
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from . import config

TABLE_KEYS = ("experimentalTable", "modelingTable")
NETWORK_ERRORS = (urllib.error.URLError, http.client.HTTPException, OSError, EOFError)


@dataclass
class Response:
    body: bytes
    complete: bool
    expected_bytes: int | None


def _get_once(url: str, timeout: float) -> Response:
    """One GET. A response cut off mid-transfer is returned with ``complete=False``."""
    req = urllib.request.Request(url, headers={"User-Agent": config.USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        length = resp.headers.get("Content-Length")
        expected = int(length) if length and length.isdigit() else None
        chunks: list[bytes] = []
        try:
            while chunk := resp.read(1 << 16):
                chunks.append(chunk)
        except NETWORK_ERRORS as exc:
            partial = getattr(exc, "partial", b"")
            body = b"".join(chunks) + (partial if isinstance(partial, bytes) else b"")
            return Response(body, False, expected)
        body = b"".join(chunks)
        return Response(body, expected is None or len(body) == expected, expected)


def _get(url: str, *, timeout: float = 600, attempts: int = 4) -> bytes:
    """GET that must succeed completely; retries with exponential backoff."""
    last: Exception | None = None
    for attempt in range(attempts):
        try:
            resp = _get_once(url, timeout)
            if resp.complete:
                return resp.body
            last = RuntimeError(f"short read: {len(resp.body)} of {resp.expected_bytes} bytes")
        except NETWORK_ERRORS as exc:
            last = exc
        time.sleep(2**attempt)
    raise RuntimeError(f"GET failed after {attempts} attempts: {url}") from last


def _get_best_effort(url: str, *, timeout: float = 240, attempts: int = 2) -> Response:
    """GET that keeps the longest partial response if no attempt completes."""
    best: Response | None = None
    last: Exception | None = None
    for attempt in range(attempts):
        try:
            resp = _get_once(url, timeout)
            if resp.complete:
                return resp
            if best is None or len(resp.body) > len(best.body):
                best = resp
        except NETWORK_ERRORS as exc:
            last = exc
        time.sleep(2**attempt)
    if best is not None and best.body:
        return best
    raise RuntimeError(f"GET failed after {attempts} attempts: {url}") from last


def _sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


class Manifest:
    """Record of every raw snapshot, keyed by path relative to the raw directory."""

    def __init__(self, path: Path):
        self.path = path
        self.entries: dict[str, dict] = {}
        if path.exists():
            self.entries = {e["path"]: e for e in json.loads(path.read_text())}

    def record(
        self,
        rel_path: str,
        source_url: str,
        data: bytes,
        *,
        complete: bool = True,
        expected_bytes: int | None = None,
        fetched_at: datetime | None = None,
    ) -> None:
        entry = {
            "path": rel_path,
            "source_url": source_url,
            "fetched_at": (fetched_at or datetime.now(timezone.utc)).isoformat(timespec="seconds"),
            "bytes": len(data),
            "sha256": _sha256(data),
            "complete": complete,
        }
        if not complete and expected_bytes is not None:
            entry["expected_bytes"] = expected_bytes
        self.entries[rel_path] = entry

    def ensure(self, rel_path: str, source_url: str, *, complete: bool = True) -> None:
        """Record a snapshot that is on disk but missing from the manifest (interrupted run)."""
        if rel_path in self.entries:
            return
        file = config.RAW_DIR / rel_path
        fetched = datetime.fromtimestamp(file.stat().st_mtime, timezone.utc)
        self.record(rel_path, source_url, file.read_bytes(), complete=complete, fetched_at=fetched)

    def save(self) -> None:
        ordered = [self.entries[k] for k in sorted(self.entries)]
        self.path.write_text(json.dumps(ordered, indent=2) + "\n")


def salvage_top_level(text: str) -> dict:
    """Recover every complete top-level field from a JSON object that was cut off.

    The object is read one ``"key": value`` pair at a time; reading stops at the first
    pair that is incomplete. Fields before the cut are returned exactly as served.
    """
    decoder = json.JSONDecoder()
    out: dict = {}
    pos = text.find("{") + 1
    if pos == 0:
        return out
    n = len(text)
    while True:
        while pos < n and text[pos] in " \t\r\n,":
            pos += 1
        if pos >= n or text[pos] != '"':
            return out
        try:
            key, pos = decoder.raw_decode(text, pos)
            while pos < n and text[pos] in " \t\r\n":
                pos += 1
            if pos >= n or text[pos] != ":":
                return out
            pos += 1
            while pos < n and text[pos] in " \t\r\n":
                pos += 1
            value, pos = decoder.raw_decode(text, pos)
        except (json.JSONDecodeError, IndexError):
            return out
        out[key] = value


def load_record(accession: str) -> tuple[dict, bool]:
    """Read an investigation record from the raw layer. Returns (record, is_complete)."""
    full = config.RAW_DIR / "investigations" / f"{accession}.json"
    if full.exists():
        return json.loads(full.read_text()), True
    cut = config.RAW_DIR / "investigations" / f"{accession}.truncated.json"
    return salvage_top_level(cut.read_text(encoding="utf-8", errors="replace")), False


def combustion_accessions(index: dict) -> list[str]:
    """Accessions of all investigations in the Combustion Science research area."""
    out = []
    for hit in index["hits"]["hits"]:
        src = hit["_source"]
        if config.RESEARCH_AREA in str(src.get("Research Area", "")):
            out.append(src["Accession"])
    return sorted(out, key=accession_number)


def accession_number(accession: str) -> int:
    return int(accession.split("-")[1])


def _fetch_record(manifest: Manifest, acc: str, refresh: bool) -> dict:
    folder = config.RAW_DIR / "investigations"
    folder.mkdir(parents=True, exist_ok=True)
    full, cut = folder / f"{acc}.json", folder / f"{acc}.truncated.json"
    url = config.PSI_RECORD_URL.format(accession=acc)
    if not refresh and full.exists():
        manifest.ensure(f"investigations/{acc}.json", url)
        return load_record(acc)[0]
    if not refresh and cut.exists():
        manifest.ensure(f"investigations/{acc}.truncated.json", url, complete=False)
        return load_record(acc)[0]

    resp = _get_best_effort(url)
    if resp.complete:
        full.write_bytes(resp.body)
        cut.unlink(missing_ok=True)
        manifest.record(f"investigations/{acc}.json", url, resp.body)
    else:
        cut.write_bytes(resp.body)
        manifest.record(
            f"investigations/{acc}.truncated.json",
            url,
            resp.body,
            complete=False,
            expected_bytes=resp.expected_bytes,
        )
        print(f"  {acc}: record cut off at {len(resp.body)} of {resp.expected_bytes} bytes; kept partial")
    return load_record(acc)[0]


def _fetch_listing(manifest: Manifest, acc: str, record: dict, refresh: bool) -> None:
    """The folder listing of an investigation whose record came without its list of files.

    PSI's own page asks for it this way. It is what ties NASA's videos to tests for such an
    investigation (see footage.py).
    """
    if record.get("added") or not record.get("totalFileSize"):
        return
    folder = config.RAW_DIR / "listings"
    folder.mkdir(parents=True, exist_ok=True)
    path, rel = folder / f"{acc}.json", f"listings/{acc}.json"
    if not refresh and path.exists():
        manifest.ensure(rel, config.PSI_LISTING_URL)
        return
    ask = json.dumps({"folder": f"{acc}/", "fileType": "study", "studyId": acc, "version": record.get("version") or 1, "obfuscationcode": ""}).encode()
    req = urllib.request.Request(config.PSI_LISTING_URL, data=ask, headers={"User-Agent": config.USER_AGENT, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=300) as resp:
        body = resp.read()
    json.loads(body)  # a listing that is not whole is not kept
    path.write_bytes(body)
    manifest.record(rel, config.PSI_LISTING_URL, body)


def _fetch_table(manifest: Manifest, acc: str, ref: dict, refresh: bool, folder: str = "tables") -> None:
    name = ref["file_name"]
    rel = f"{folder}/{acc}/{name}"
    dest = config.RAW_DIR / rel
    remote = ref.get("remote_url", "")
    if remote.startswith("http"):
        # PSI's full file list gives a service link here; the stable PSI path is what identifies the file.
        remote = "/datamanager/file" + ref.get("remote_path", "")
    source = config.PSI_ORIGIN + remote
    if dest.exists() and not refresh:
        manifest.ensure(rel, source)
        return
    # PSI serves files through a short-lived pre-signed link: resolve it, then download.
    query = {"file": name, "redirect": "false"}
    if ref.get("version") is not None:
        query["version"] = str(ref["version"])
    link_url = (
        config.PSI_DOWNLOAD_URL.format(accession=acc)
        + "?"
        + urllib.parse.urlencode(query, quote_via=urllib.parse.quote)
    )
    signed = _get(link_url, timeout=120).decode().strip().strip('"')
    if not signed.startswith("http"):
        raise RuntimeError(f"no download link for {acc}/{name}: {signed[:200]}")
    data = _get(signed)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)
    # The signed link expires, so the stable PSI path is what gets recorded as the source.
    manifest.record(rel, source, data)


def _find_file(node: object, file_name: str) -> dict | None:
    """The entry for one file, wherever it sits in an investigation record."""
    if isinstance(node, dict):
        if node.get("file_name") == file_name and "remote_url" in node:
            return node
        node = list(node.values())
    if isinstance(node, list):
        for child in node:
            found = _find_file(child, file_name)
            if found:
                return found
    return None


def fetch_documents(manifest: Manifest, refresh: bool = False) -> list[str]:
    """Snapshot the files listed in dictionary/documents.yaml. Returns the paths now on disk."""
    from . import documents  # imported here: documents needs PyYAML, the rest of this stage does not

    saved = []
    for doc in documents.listed():
        ref = _find_file(load_record(doc["accession"])[0], doc["file"])
        if ref is None:
            raise RuntimeError(f"{doc['id']}: {doc['file']} is not listed in the {doc['accession']} record")
        _fetch_table(manifest, doc["accession"], ref, refresh, folder="documents")
        saved.append(f"documents/{doc['accession']}/{doc['file']}")
    return saved


def run(refresh: bool = False, workers: int = 4) -> None:
    config.RAW_DIR.mkdir(parents=True, exist_ok=True)
    manifest = Manifest(config.RAW_DIR / "manifest.json")

    index_path = config.RAW_DIR / "index.json"
    if refresh or not index_path.exists():
        data = _get(config.PSI_INDEX_URL)
        index_path.write_bytes(data)
        manifest.record("index.json", config.PSI_INDEX_URL, data)
    manifest.ensure("index.json", config.PSI_INDEX_URL)
    index = json.loads(index_path.read_text())
    accessions = combustion_accessions(index)
    print(f"index: {index['hits']['total']} investigations, {len(accessions)} combustion")

    def fetch_all(acc: str) -> tuple[str, int, list[str]]:
        record = _fetch_record(manifest, acc, refresh)
        errors, count = [], 0
        try:
            _fetch_listing(manifest, acc, record, refresh)
        except Exception as exc:  # the listing only adds videos; the tables do not depend on it
            print(f"  {acc}: no folder listing ({exc})")
        for key in TABLE_KEYS:
            for ref in record.get(key) or []:
                count += 1
                try:
                    _fetch_table(manifest, acc, ref, refresh)
                except Exception as exc:  # report at the end; keep the other downloads going
                    errors.append(f"{acc}/{ref.get('file_name')}: {exc}")
        return acc, count, errors

    with ThreadPoolExecutor(max_workers=workers) as pool:
        results = list(pool.map(fetch_all, accessions))
    extra = fetch_documents(manifest, refresh)
    manifest.save()
    print(f"documents: {len(extra)}")

    total = sum(count for _, count, _ in results)
    without = [acc for acc, count, _ in results if count == 0]
    print(f"records: {len(results)} | table files: {total} | no table listed: {without}")
    failures = [err for _, _, errs in results for err in errs]
    for err in failures:
        print(f"FAILED {err}", file=sys.stderr)
    if failures:
        raise SystemExit(1)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--refresh", action="store_true", help="re-download files already on disk")
    parser.add_argument("--workers", type=int, default=4)
    args = parser.parse_args()
    run(refresh=args.refresh, workers=args.workers)


if __name__ == "__main__":
    main()
