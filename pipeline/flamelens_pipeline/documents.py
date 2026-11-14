"""NASA files other than the experimental tables.

A file listed in ``dictionary/documents.yaml`` is downloaded into the raw layer with a
checksum, like every table. A text file can then be quoted: a value or a definition names
it as its evidence source (``doc:<id>``), and the build checks that the quotation appears in
the file word for word.
"""

from __future__ import annotations

import zipfile
from pathlib import Path
from xml.etree import ElementTree

import yaml

from . import config

_WORD = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def listed() -> list[dict]:
    return yaml.safe_load((config.DICTIONARY_DIR / "documents.yaml").read_text()) or []


def raw_path(doc: dict) -> Path:
    return config.RAW_DIR / "documents" / doc["accession"] / doc["file"]


def docx_paragraphs(path: Path) -> list[str]:
    """The non-empty paragraphs of a Word file, in order, exactly as written."""
    with zipfile.ZipFile(path) as archive:
        root = ElementTree.fromstring(archive.read("word/document.xml"))
    out = []
    for para in root.iter(_WORD + "p"):
        text = "".join(node.text or "" for node in para.iter(_WORD + "t")).strip()
        if text:
            out.append(text)
    return out


def paragraphs(doc: dict) -> list[str]:
    """The text of a listed document. Only Word files are read as text."""
    path = raw_path(doc)
    if doc.get("kind") != "text":
        return []
    if path.suffix.lower() != ".docx":
        raise ValueError(f"{doc['id']}: only .docx files can be read as text, got {path.name}")
    return docx_paragraphs(path)
