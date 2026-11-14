"""Value parsers for the curated layer.

PSI's experimental tables were written by many teams over two decades, by hand. The same
quantity appears as ``0.21``, ``21``, ``~ 21.5``, ``21.5 - 21.7``, ``22.1 to 22.0``,
``21; 26.5; 40`` or ``RAMP``. These functions turn such cells into one structure without
guessing: anything that is not clearly a number is kept as text.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

MISSING = {"", "-", "–", "—", "n/a", "na", "none", "#value!", "tbd", "?"}

NUM = r"[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?"
NUM_RE = re.compile(NUM)
RANGE_RE = re.compile(rf"^\s*({NUM})\s*[%a-zA-Zµ/°]*\s*(?:-|–|—|to|down to)\s*({NUM})\s*([%a-zA-Zµ/°\"]*)\s*$")
SCALAR_RE = re.compile(rf"^\s*({NUM})\s*([%a-zA-Zµ/°\"]{{0,8}})\s*$")
LIST_SPLIT_RE = re.compile(r"\s*(?:;|,|\band\b|\bor\b|&)\s*")
APPROX_RE = re.compile(r"^\s*(?:~|≈|approx\.?|about)\s*", re.I)

# Factor that converts a source unit into the canonical unit of its dimension.
UNIT_FACTORS: dict[str, dict[str, float]] = {
    "kPa": {"kpa": 1.0, "atm": 101.325, "bar": 100.0, "mmhg": 0.1333224, "psi": 6.894757, "psia": 6.894757},
    "mm": {"mm": 1.0, "cm": 10.0, "m": 1000.0, "micron": 0.001, "um": 0.001, "µm": 0.001, "in": 25.4, '"': 25.4},
    "cm": {"cm": 1.0, "mm": 0.1, "m": 100.0, "in": 2.54},
    "fraction": {"fraction": 1.0, "percent": 0.01, "%": 0.01},
    "s": {"s": 1.0, "sec": 1.0, "min": 60.0, "minutes": 60.0},
    "cm/s": {"cm/s": 1.0, "mm/s": 0.1, "m/s": 100.0},
    "mm/s": {"mm/s": 1.0, "cm/s": 10.0},
    "ppm": {"ppm": 1.0},
    "K": {"k": 1.0},
    "°C": {"c": 1.0, "°c": 1.0},
    "W": {"w": 1.0},
    "mg/s": {"mg/s": 1.0},
    "mg/min": {"mg/min": 1.0},
    "mm²/s": {"mm2/s": 1.0, "mm²/s": 1.0, "mm": 1.0},
    "count": {"count": 1.0},
    "ratio": {"ratio": 1.0},
}


@dataclass
class Quantity:
    """A parsed numeric cell. Exactly one of (min/max), levels or qualifier carries the value."""

    min: float | None = None
    max: float | None = None
    levels: list[float] = field(default_factory=list)
    approx: bool = False
    qualifier: str = ""  # non-numeric content, e.g. "RAMP" or "Insignificant"
    unit: str = ""  # unit written inside the cell, if any

    @property
    def is_numeric(self) -> bool:
        return self.min is not None

    def scaled(self, factor: float) -> "Quantity":
        if not self.is_numeric:
            return self
        lo, hi = self.min * factor, self.max * factor
        return Quantity(
            min=min(lo, hi),
            max=max(lo, hi),
            levels=[v * factor for v in self.levels],
            approx=self.approx,
            qualifier=self.qualifier,
            unit=self.unit,
        )


def is_missing(raw: str | None) -> bool:
    return raw is None or raw.strip().lower() in MISSING


def parse_quantity(raw: str | None) -> Quantity | None:
    """Parse one table cell. Returns None for an empty or placeholder cell."""
    if is_missing(raw):
        return None
    text = raw.strip()
    approx = bool(APPROX_RE.match(text))
    body = APPROX_RE.sub("", text)

    scalar = SCALAR_RE.match(body)
    if scalar:
        value = float(scalar.group(1))
        return Quantity(min=value, max=value, approx=approx, unit=scalar.group(2).lower())

    rng = RANGE_RE.match(body)
    # A leading minus followed by a hyphenated range would be ambiguous; PSI has none.
    if rng and not body.strip().startswith("-"):
        a, b = float(rng.group(1)), float(rng.group(2))
        return Quantity(min=min(a, b), max=max(a, b), approx=approx, unit=rng.group(3).lower())

    parts = [p for p in LIST_SPLIT_RE.split(body) if p.strip()]
    if len(parts) > 1:
        values, unit = [], ""
        for part in parts:
            match = SCALAR_RE.match(APPROX_RE.sub("", part))
            if not match:
                values = []
                break
            values.append(float(match.group(1)))
            unit = unit or match.group(2).lower()
        if values:
            levels = sorted(set(values))
            # A list of levels may share one trailing word ("with He"); that is handled by callers.
            return Quantity(min=levels[0], max=levels[-1], levels=levels, approx=approx or "~" in body, unit=unit)

    return Quantity(qualifier=text)


def convert(quantity: Quantity, canonical_unit: str, source_unit: str) -> tuple[Quantity, str]:
    """Convert to the variable's canonical unit. Returns (quantity, unit actually applied).

    A unit written inside the cell ("0.27 mm", "1 cm") wins over the column's default,
    as long as it belongs to the same dimension.
    """
    if not quantity.is_numeric:
        return quantity, source_unit
    factors = UNIT_FACTORS.get(canonical_unit, {})
    inline = quantity.unit
    unit = inline if inline in factors else source_unit.lower()
    if unit not in factors:
        if canonical_unit.lower() == unit or not unit:
            return quantity, source_unit
        raise ValueError(f"cannot convert {source_unit!r} to {canonical_unit!r}")
    return quantity.scaled(factors[unit]), unit


# --------------------------------------------------------------------------------------
# Spreadsheet auto-fill repair
# --------------------------------------------------------------------------------------

_TRAILING_INT_RE = re.compile(r"^(.*?)(\d+)(\D*)$")


def repair_autofill(values: list[str]) -> list[tuple[str, bool]]:
    """Undo spreadsheet drag-fill damage in a column of text.

    Dragging a cell such as ``40% CH4`` down a spreadsheet increments its last number,
    producing ``40% CH5``, ``40% CH6`` ... which are not real fuels. A run is detected when
    consecutive cells are identical except that the last number goes up by exactly one each
    row. Every cell in the run is restored to the run's first value.

    Returns one (value, was_repaired) pair per input cell.
    """
    out: list[tuple[str, bool]] = []
    run_start: tuple[str, int, str] | None = None  # (prefix, first number, suffix)
    run_value = ""
    prev_number: int | None = None
    for value in values:
        match = _TRAILING_INT_RE.match(value or "")
        if not match:
            out.append((value, False))
            run_start, prev_number = None, None
            continue
        prefix, number, suffix = match.group(1), int(match.group(2)), match.group(3)
        continues = (
            run_start is not None
            and prev_number is not None
            and (prefix, suffix) == (run_start[0], run_start[2])
            and number == prev_number + 1
        )
        if continues:
            out.append((run_value, True))
        else:
            out.append((value, False))
            run_start, run_value = (prefix, number, suffix), value
        prev_number = number
    return out


# --------------------------------------------------------------------------------------
# Fuels (gases and liquids)
# --------------------------------------------------------------------------------------

FUEL_NAMES: list[tuple[str, str]] = [
    # (pattern, canonical name) - first match wins, so longer names come first
    (r"iso-?dodecane", "iso-dodecane"),
    (r"c12h26|n-?dodecane", "n-dodecane"),
    (r"iso-?octane", "iso-octane"),
    (r"n-?octane", "n-octane"),
    (r"n-?heptane|heptane", "n-heptane"),
    (r"n-?decane|decane", "n-decane"),
    (r"methanol", "methanol"),
    (r"ethanol", "ethanol"),
    (r"propanol", "propanol"),
    (r"glycerol", "glycerol"),
    (r"propylene|c3h6", "propylene"),
    (r"ethylene|c2h4", "ethylene"),
    (r"ethane|c2h6", "ethane"),
    (r"propane|c3h8", "propane"),
    (r"n-?butane|butane|c4h10", "n-butane"),
    (r"methane|ch4", "methane"),
    (r"hydrogen|\bh2\b", "hydrogen"),
]
DILUENT_NAMES = [(r"\bn2\b|nitrogen", "N2"), (r"\bhe\b|helium", "He"), (r"\bco2\b", "CO2")]


@dataclass
class Fuel:
    name: str  # canonical, components joined with " / "
    components: list[tuple[str, float | None]]  # (species, fraction of the fuel stream or None)
    diluent: str = ""

    @property
    def fraction(self) -> float | None:
        """Total fuel fraction in the fuel stream, when every component states one."""
        fractions = [f for _, f in self.components]
        if not fractions or any(f is None for f in fractions):
            return None
        return round(sum(fractions), 6)


def parse_fuel(raw: str | None) -> Fuel | None:
    """Parse a fuel description such as ``50% C2H4 with N2`` or ``[.60]/[.40] C12H26/iso-dodecane``."""
    if is_missing(raw):
        return None
    text = raw.strip()
    lower = text.lower()

    # "[.60]/[.40] A/B" - a two-component liquid blend given as bracketed fractions.
    blend = re.match(r"^\[([\d.]+)\]\s*/\s*\[([\d.]+)\]\s*(.+?)\s*/\s*(.+)$", text)
    if blend:
        names = [_fuel_name(blend.group(3)), _fuel_name(blend.group(4))]
        if all(names):
            comps = [(names[0], float(blend.group(1))), (names[1], float(blend.group(2)))]
            return Fuel(" / ".join(n for n, _ in comps), comps)

    # Drop trailing commentary ("... including 2 pyrometry calibration tests").
    head = re.split(r"\b(?:including|where)\b", lower)[0]

    diluent = ""
    for pattern, name in DILUENT_NAMES:
        if re.search(rf"(?:with|balance)\s+(?:{pattern})", head):
            diluent = name
    # Remove the diluent clause so it is not mistaken for a fuel component.
    body = re.sub(r"\(?\s*(?:,?\s*with|balance)\s+(?:n2|he|co2|nitrogen|helium)\s*\)?", " ", head)
    # "44.4% H2 with CH4": here "with" joins two fuels, the second making up the balance.
    body = re.sub(r"\s+with\s+", " , ", body)

    components: list[tuple[str, float | None]] = []
    for chunk in re.split(r"\s*,\s*", body):
        # A chunk can also be "Propanol (95%) Glycerol (5%)": split before each new name.
        for piece in _split_named_percent(chunk):
            name = _fuel_name(piece)
            if not name:
                continue
            pct = re.search(rf"({NUM})\s*%", piece)
            fraction = float(pct.group(1)) / 100 if pct else None
            components.append((name, fraction))
    if not components:
        return None

    # "44.4% H2 with CH4": the unstated component is the balance.
    stated = [f for _, f in components if f is not None]
    if len(components) == 2 and len(stated) == 1 and not diluent:
        components = [(n, f if f is not None else round(1 - stated[0], 6)) for n, f in components]
    if len(components) == 1 and components[0][1] is None and re.search(r"\bpure\b", lower):
        components = [(components[0][0], 1.0)]

    return Fuel(" / ".join(n for n, _ in components), components, diluent)


def _fuel_name(text: str) -> str:
    lower = text.lower()
    for pattern, name in FUEL_NAMES:
        if re.search(pattern, lower):
            return name
    return ""


def _split_named_percent(chunk: str) -> list[str]:
    """Split ``propanol (95%) glycerol (5%)`` into one piece per component."""
    pieces = re.findall(r"[a-z][a-z0-9\- ]*?\s*\(\s*[\d.]+\s*%\s*\)", chunk)
    return pieces if len(pieces) > 1 else [chunk]


# --------------------------------------------------------------------------------------
# Solid samples
# --------------------------------------------------------------------------------------

MATERIALS: list[tuple[str, str]] = [
    (r"sibal|cotton-?\s*fiberglass", "SIBAL fabric (cotton/fiberglass)"),
    (r"nomex", "Nomex"),
    (r"ultem", "Ultem"),
    (r"pmma", "PMMA"),
    (r"silicone", "Silicone"),
    (r"kapton", "Kapton"),
    (r"teflon", "Teflon"),
    (r"pyrell", "Pyrell foam"),
    (r"lamp\s*wick", "Lamp wick"),
    (r"dibutyl\s*phthalate", "Dibutyl phthalate"),
    (r"japan\s*wax", "Japan wax"),
    (r"par+af+in", "Paraffin wax"),
    (r"wax|candle", "Wax"),
]
GEOMETRIES: list[tuple[str, str]] = [
    (r"candle", "candle"),
    (r"spher", "sphere"),
    (r"\brod\b", "rod"),
    (r"film|micron", "thin film"),
    (r"slab|thick", "slab"),
    (r"sibal|nomex|fabric|cotton", "fabric sheet"),
    (r"sheet", "sheet"),
]
INCH_RE = re.compile(r"(\d+)\s*/\s*(\d+)\s*\"?|(\d*\.\d+)\s*\"")


@dataclass
class Sample:
    material: str
    material_inferred: bool  # True when the cell names a shape but not the material
    geometry: str
    thickness_mm: float | None = None
    diameter_mm: float | None = None
    width_cm: float | None = None


def parse_sample(raw: str | None, default_material: str = "") -> Sample | None:
    """Parse a hand-written solid sample description such as ``1/4" clear rod``."""
    if is_missing(raw):
        return None
    lower = raw.strip().lower()

    materials = [name for pattern, name in MATERIALS if re.search(pattern, lower)]
    # "PMMA & Nomex" is a two-material sample; keep both. "wax" is implied by the specific waxes.
    if len(materials) > 1 and "Wax" in materials:
        materials.remove("Wax")
    material = " + ".join(dict.fromkeys(materials))
    geometry = next((name for pattern, name in GEOMETRIES if re.search(pattern, lower)), "")
    inferred = False
    if not material and default_material and geometry in ("rod", "sphere", "slab", "thin film"):
        material, inferred = default_material, True
    if not material:
        return None

    sample = Sample(material=material, material_inferred=inferred, geometry=geometry)

    thick = re.search(rf"({NUM})\s*(micron|mm)\b(?:\s*thick)?", lower)
    if thick and geometry in ("thin film", "slab"):
        value = float(thick.group(1))
        sample.thickness_mm = value / 1000 if thick.group(2) == "micron" else value

    if geometry == "rod":
        inch = INCH_RE.search(lower)
        if inch:
            inches = float(inch.group(1)) / float(inch.group(2)) if inch.group(1) else float(inch.group(3))
            sample.diameter_mm = round(inches * 25.4, 3)
    elif geometry == "sphere":
        size = re.search(rf"({NUM})\s*cm", lower)
        if size:
            sample.diameter_mm = float(size.group(1)) * 10
    else:
        width = re.search(rf"({NUM})\s*cm", lower)
        if width:
            sample.width_cm = float(width.group(1))
    return sample


# --------------------------------------------------------------------------------------
# Atmospheres, dates, categories
# --------------------------------------------------------------------------------------


def parse_atmosphere(raw: str | None) -> tuple[Quantity | None, str]:
    """Parse ``~30% and ~21% O2 with He`` into (oxygen as percent, diluent)."""
    if is_missing(raw):
        return None, ""
    lower = raw.lower()
    diluent = next((name for pattern, name in DILUENT_NAMES if re.search(rf"with\s+(?:{pattern})", lower)), "")
    values = sorted({float(v) for v in re.findall(rf"({NUM})\s*%", lower)})
    if not values:
        return None, diluent
    quantity = Quantity(
        min=values[0], max=values[-1], levels=values if len(values) > 1 else [], approx="~" in lower
    )
    return quantity, diluent


MONTHS = {m: i for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"], start=1)}


def parse_date(raw: str | None) -> str:
    """Return an ISO date (YYYY-MM-DD), or '' when the cell does not hold a full date."""
    if is_missing(raw):
        return ""
    text = raw.strip()
    us = re.match(r"^(\d{1,2})/(\d{1,2})/(\d{2,4})$", text)
    if us:
        month, day, year = int(us.group(1)), int(us.group(2)), int(us.group(3))
        year += 2000 if year < 100 else 0
        return _iso(year, month, day)
    named = re.match(r"^(\d{1,2})-([A-Za-z]{3})[a-z]*-(\d{2,4})", text)
    if named and named.group(2).lower() in MONTHS:
        year = int(named.group(3))
        year += 2000 if year < 100 else 0
        return _iso(year, MONTHS[named.group(2).lower()], int(named.group(1)))
    ymd = re.match(r"^(\d{4})-([A-Za-z]{3})[a-z]*-(\d{1,2})", text)
    if ymd and ymd.group(2).lower() in MONTHS:
        return _iso(int(ymd.group(1)), MONTHS[ymd.group(2).lower()], int(ymd.group(3)))
    return ""


def parse_yyddd(raw: str | None) -> str:
    """ACME 'test day' codes: two-digit year followed by day of year (e.g. 19254)."""
    if is_missing(raw) or not re.fullmatch(r"\d{5}", raw.strip()):
        return ""
    from datetime import date, timedelta

    year, day = 2000 + int(raw.strip()[:2]), int(raw.strip()[2:])
    if not 1 <= day <= 366:
        return ""
    return (date(year, 1, 1) + timedelta(days=day - 1)).isoformat()


def parse_date_parts(year: str | None, month: str | None, day: str | None) -> str:
    """Build an ISO date from separate Year / Month / Date cells (month may be a name)."""
    if is_missing(year) or is_missing(month) or is_missing(day):
        return ""
    m = month.strip().lower().rstrip(".")
    month_number = int(m) if m.isdigit() else MONTHS.get(m[:3], 0)
    try:
        return _iso(int(year), month_number, int(float(day)))
    except ValueError:
        return ""


def _iso(year: int, month: int, day: int) -> str:
    from datetime import date

    try:
        return date(year, month, day).isoformat()
    except ValueError:
        return ""


def parse_category(raw: str | None, mapping: dict[str, str]) -> str:
    """Map a cell onto a controlled vocabulary. Keys are regular expressions (case-insensitive)."""
    if is_missing(raw):
        return ""
    text = raw.strip()
    for pattern, value in mapping.items():
        if re.search(pattern, text, re.I):
            return value
    return text.lower()


def parse_bool(raw: str | None) -> bool | None:
    if is_missing(raw):
        return None
    lower = raw.strip().lower()
    if lower.startswith(("yes", "y ", "true")) or lower == "y":
        return True
    if lower.startswith(("no", "false")) or lower == "n":
        return False
    return None


# --------------------------------------------------------------------------------------
# Air speed logged as a run of steps
# --------------------------------------------------------------------------------------


@dataclass
class FlowSteps:
    """An air-speed cell from a test in which the crew changed the flow as the sample burned.

    The cell lists the speeds in the order they were tried, with NASA's remarks between them
    ("5  3  2  1  low", "5   down to ext"), and sometimes fan or dial settings in brackets.
    """

    levels: list[float] = field(default_factory=list)  # speeds, in the order written
    words: str = ""  # everything in the cell that is not a speed
    approx: bool = False  # the cell says the flow went beyond the listed speeds, or marks one as unsure
    unread: str = ""  # why no speed was read from a cell that does hold numbers


_BRACKET_RE = re.compile(r"\(([^)]*)\)?")
_PLAIN_NUMBER_RE = re.compile(r"\d*\.?\d+")
_SPEED_WITH_UNIT_RE = re.compile(r"(\d*\.?\d+)\s*cm/s", re.I)
_DIAL_WORD_RE = re.compile(r"\bpots?\b", re.I)
_STEP_RE = re.compile(r"(~)?(\d*\.?\d+)(\?)?")

# In NASA's fan calibration sheet the fan display reads 38 with no air moving and rises from
# there, while the dial ("pot") settings written into these cells are all below 1.5.
FAN_DISPLAY_FLOOR = 38.0
DIAL_SETTING_CEILING = 1.5


def _squash(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def parse_flow_steps(raw: str | None) -> FlowSteps | None:
    """Read an air-speed cell that may list several speeds. Returns None for an empty cell.

    Nothing is guessed. A number is read as a speed only when the cell leaves no doubt:
      - a number written with "cm/s" is the speed, and other numbers in that cell are not;
      - numbers written with the word "pot" are dial settings;
      - bracketed numbers are dial settings when all are below 1.5, and fan readings when
        all are 38 or more beside smaller speeds; any other bracketed numbers make the cell
        unreadable, and it is kept as text.
    """
    if is_missing(raw):
        return None
    text = raw.strip()

    tagged = _SPEED_WITH_UNIT_RE.findall(text)
    if tagged:
        rest = _squash(_SPEED_WITH_UNIT_RE.sub(" ", text))
        return FlowSteps(levels=[float(t) for t in tagged], words=rest, approx=bool(rest))

    approx = False
    remarks: list[str] = []
    bracketed: list[float] = []
    for inside in _BRACKET_RE.findall(text):
        if _DIAL_WORD_RE.search(inside):
            continue
        if "?" in inside:
            approx = True
        numbers = [float(n) for n in _PLAIN_NUMBER_RE.findall(inside)]
        bracketed.extend(numbers)
        if not numbers and _squash(inside.replace("?", "")):
            remarks.append(_squash(inside))
    outside = _BRACKET_RE.sub(" ", text)
    if _DIAL_WORD_RE.search(outside):
        approx = True
        if re.search(r"\bpots?\W*$", outside, re.I):
            # "3  0.5 pot  0.4 pot": each dial setting is written before the word.
            outside = re.sub(r"\d*\.?\d+\s*pots?\b", " ", outside, flags=re.I)
        else:
            # "5  3  pot 0.4": the dial settings follow the word, to the end of the cell.
            outside = outside[: _DIAL_WORD_RE.search(outside).start()]
    outside = re.sub(r"(?<=\d)(?=[A-Za-z])", " ", outside)

    levels: list[float] = []
    for token in re.split(r"[\s,;>]+", outside):
        if not token:
            continue
        step = _STEP_RE.fullmatch(token)
        if step:
            levels.append(float(step.group(2)))
            approx = approx or bool(step.group(1) or step.group(3))
        else:
            remarks.append(token)
            approx = True
    words = _squash(" ".join(remarks))

    if not levels:
        return FlowSteps(words=text)
    if bracketed:
        dials = all(n < DIAL_SETTING_CEILING for n in bracketed)
        fan = all(n >= FAN_DISPLAY_FLOOR for n in bracketed) and all(n < FAN_DISPLAY_FLOOR for n in levels)
        if not (dials or fan):
            return FlowSteps(words=text, unread="the cell holds two lists of numbers and does not say which is the air speed")
        approx = True
    return FlowSteps(levels=levels, words=words, approx=approx)
