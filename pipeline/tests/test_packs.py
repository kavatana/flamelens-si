"""Evidence pack loader. Each test writes a small pack to a temporary folder and merges it."""

import csv
import json

import pytest
import yaml

from flamelens_pipeline import config, packs

VARIABLES = yaml.safe_load((config.DICTIONARY_DIR / "variables.yaml").read_text())

CLAIM = ["claim_id", "test_id", "variable_id", "value_num", "value_max", "value_text", "value_bool", "unit", "original_text",
         "quality", "basis", "source_id", "locator", "quote", "formula_id", "inputs", "uncertainty", "uncertainty_basis", "note"]


def record(rid="PSI-0/t/1", **values):
    return {"id": rid, "accession": "PSI-0", "table": "t.csv", "row": 1, "kind": "test", "label": "T1",
            "values": [{"var": var, "raw": "", "column": "c", **value} for var, value in values.items()], "original": {"a": "b"}}


def claim(cid, var, **fields):
    base = dict.fromkeys(CLAIM, "")
    base.update({"claim_id": cid, "test_id": "PSI-0/t/1", "variable_id": var, "quality": "reported", "basis": "measured",
                 "source_id": "S1", "locator": "Sheet1!C4", "original_text": "x"})
    base.update(fields)
    return base


@pytest.fixture
def make_pack(tmp_path, monkeypatch):
    monkeypatch.setattr(packs, "PACKS_DIR", tmp_path)

    def write(claims, tests=None, sources=None, extra=None):
        folder = tmp_path / "PSI-0"
        folder.mkdir()
        (folder / "pack.json").write_text(json.dumps({"accession": "PSI-0"}))
        files = {
            "sources.csv": sources or [{"source_id": "S1", "file_name": "Report.pdf", "source_kind": "report"},
                                       {"source_id": "S2", "file_name": "Matrix.xlsx", "source_kind": "test_matrix_as_run"},
                                       {"source_id": "S3", "file_name": "Plan.xlsx", "source_kind": "test_matrix_planned"}],
            "tests.csv": tests or [{"test_id": "PSI-0/t/1", "accession": "PSI-0", "is_new": "0", "label": "T1", "run_status": "as_run",
                                    "replicate_group": "", "matched_by": ""}],
            "claims.csv": claims,
            **(extra or {}),
        }
        for name, rows in files.items():
            with (folder / name).open("w", newline="", encoding="utf-8") as handle:
                writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
                writer.writeheader()
                writer.writerows(rows)
        return folder

    return write


def merge(records):
    findings, tables = [], []
    variables = {k: dict(v) for k, v in VARIABLES.items()}
    report = packs.apply(records, tables, variables, findings, validate=False)
    return report, findings, tables, variables


def value(rec, var):
    return next((v for v in rec["values"] if v["var"] == var), None)


def test_a_claim_fills_a_gap_and_says_where_it_came_from(make_pack):
    make_pack([claim("C1", "end_mode", value_text="self-extinguished", basis="stated", quote="the flame self-extinguished", original_text="self-extinguished", locator="p. 12")])
    rec = record()
    report, findings, _, _ = merge([rec])
    got = value(rec, "end_mode")
    assert got["text"] == "self-extinguished" and got["quality"] == "reported"
    assert "Report.pdf, p. 12" in got["note"]
    assert got["evidence"] == "the flame self-extinguished" and got["evidence_source"] == "file:Report.pdf"
    assert report["packs"][0]["gained"] == {"end_mode": 1} and findings == []


def test_a_table_value_is_never_overwritten_and_a_different_claim_is_recorded(make_pack):
    make_pack([claim("C1", "flow_speed_cm_s", value_num="25", unit="cm/s", original_text="25")])
    rec = record(flow_speed_cm_s={"min": 20.0, "max": 20.0, "quality": "reported"})
    report, findings, _, _ = merge([rec])
    assert value(rec, "flow_speed_cm_s")["min"] == 20.0
    assert report["packs"][0]["stats"] == {"disagreements with the table": 1}
    assert findings[0]["kind"] == "sources-disagree" and "20 cm/s" in findings[0]["message"] and "25 cm/s" in findings[0]["message"]


def test_a_claim_inside_a_range_the_table_gives_counts_as_agreement(make_pack):
    make_pack([claim("C1", "flow_speed_cm_s", value_num="5", unit="cm/s")])
    rec = record(flow_speed_cm_s={"min": 1.0, "max": 20.0, "levels": [1.0, 5.0, 20.0], "quality": "reported"})
    report, findings, _, _ = merge([rec])
    assert report["packs"][0]["stats"] == {"values that confirm the table": 1} and findings == []


def test_a_stated_value_replaces_an_assumed_one(make_pack):
    make_pack([claim("C1", "pressure_kpa", value_num="99.3", unit="kPa", original_text="14.4 psia")])
    rec = record(pressure_kpa={"min": 101.325, "max": 101.325, "quality": "assumed", "note": "Taken as cabin pressure."})
    report, _, _, _ = merge([rec])
    got = value(rec, "pressure_kpa")
    assert got["min"] == 99.3 and got["quality"] == "reported" and "had been assumed" in got["note"]
    assert len([v for v in rec["values"] if v["var"] == "pressure_kpa"]) == 1
    assert report["packs"][0]["stats"] == {"assumed values replaced": 1}


def test_a_plan_is_not_evidence(make_pack):
    make_pack([claim("C1", "flow_speed_cm_s", value_num="10", unit="cm/s", source_id="S3")])
    rec = record()
    report, _, _, _ = merge([rec])
    assert value(rec, "flow_speed_cm_s") is None
    assert report["packs"][0]["stats"] == {"values from a plan, left out": 1}


def test_a_measurement_is_preferred_to_a_computed_value_and_both_are_kept_on_record(make_pack):
    make_pack(
        [claim("C1", "flow_speed_cm_s", value_num="12", unit="cm/s", quality="derived", basis="computed", formula_id="F1", inputs="C2",
               uncertainty="2", uncertainty_basis="largest gap in the calibration", source_id="S2", original_text=""),
         claim("C2", "flow_speed_cm_s", value_num="10", unit="cm/s")],
        extra={"formulas.csv": [{"formula_id": "F1", "expression": "speed = 0.3 x (fan display - 38)", "source_id": "S2"}]},
    )
    rec = record()
    _, findings, _, _ = merge([rec])
    got = value(rec, "flow_speed_cm_s")
    assert got["min"] == 10.0 and got["quality"] == "reported"
    assert "Matrix.xlsx gives 12 cm/s" in got["note"]
    assert len(findings) == 1 and findings[0]["kind"] == "sources-disagree"


def test_a_derived_value_shows_its_working(make_pack):
    make_pack(
        [claim("C1", "spread_rate_mm_s", value_num="1.8", unit="mm/s", quality="derived", basis="computed", formula_id="F1", inputs="C9",
               uncertainty="0.2", uncertainty_basis="standard error of the fitted slope", original_text="")],
        extra={"formulas.csv": [{"formula_id": "F1", "expression": "slope of flame position against time", "source_id": "S1"}]},
    )
    rec = record()
    merge([rec])
    note = value(rec, "spread_rate_mm_s")["note"]
    assert "slope of flame position against time" in note and "plus or minus 0.2 mm/s" in note


def test_a_new_test_becomes_a_record_in_a_table_of_its_own(make_pack):
    tests = [{"test_id": "PSI-0/extra/1", "accession": "PSI-0", "is_new": "1", "label": "X1", "run_status": "as_run", "replicate_group": "",
              "matched_by": "Its sample number is in no row of the table."},
             {"test_id": "PSI-0/extra/2", "accession": "PSI-0", "is_new": "1", "label": "X2", "run_status": "planned", "replicate_group": "", "matched_by": "planned only"}]
    make_pack([claim("C1", "ignited", value_bool="false", test_id="PSI-0/extra/1", original_text="no ign"),
               claim("C2", "ignited", value_bool="true", test_id="PSI-0/extra/2", original_text="yes")], tests=tests)
    records = [record()]
    report, _, tables, _ = merge(records)
    assert [r["id"] for r in records] == ["PSI-0/t/1", "PSI-0/extra/1"]
    assert value(records[1], "ignited")["bool"] is False and records[1]["original"]
    assert tables[0]["rows_in_file"] == 1 and tables[0]["file_name"] == records[1]["table"]
    assert report["packs"][0]["stats"] == {"planned tests left out": 1, "values from a plan, left out": 1}


def test_a_new_variable_and_nasas_stated_results_come_through(make_pack):
    extra = {
        "new_variables.csv": [{"variable_id": "fan_display", "label": "Fan display reading", "unit": "display units", "kind": "number", "group": "odd",
                               "definition_quote": "instantaneous fan voltagex10", "definition_source_id": "S1", "definition_locator": "p. 1"}],
        "findings.csv": [{"finding_id": "N1", "quote": "The rod kept burning at an oxygen level below its limit in normal gravity.", "source_id": "S1", "locator": "p. 4"}],
    }
    make_pack([claim("C1", "fan_display", value_num="62", unit="display units", basis="set_point", original_text="62")], extra=extra)
    rec = record()
    report, _, _, variables = merge([rec])
    assert variables["fan_display"]["group"] == "measurement" and "fan voltagex10" in variables["fan_display"]["description"]
    assert "setting, not a measurement" in value(rec, "fan_display")["note"]
    assert report["documents"][0]["paragraphs"] == ["The rod kept burning at an oxygen level below its limit in normal gravity. (Report.pdf, p. 4)"]
    assert len(report["evidence"]["findings"]) == 1


def test_a_claim_for_a_test_that_does_not_exist_stops_the_build(make_pack):
    make_pack([claim("C1", "ignited", value_bool="true")])
    with pytest.raises(SystemExit):
        merge([record(rid="PSI-0/t/other")])


@pytest.mark.skipif(not (config.REPO_ROOT / "data" / "packs" / "PSI-25" / "pack.json").exists(), reason="no evidence pack here")
def test_a_real_pack_passes_the_real_check():
    packs.check(config.REPO_ROOT / "data" / "packs" / "PSI-25")


@pytest.mark.skipif(not (config.CURATED_DIR / "records.json").exists(), reason="curated data not built")
def test_scoreboard_of_the_curated_data():
    records = json.loads((config.CURATED_DIR / "records.json").read_text())
    board = packs.scoreboard(records)
    # 140 from NASA's tables alone; 263 with the evidence packs loaded.
    assert board["solid-fuel tests"] == 380 and board["with oxygen"] in (140, 263)
    assert board["with oxygen and air speed"] >= 132
    assert board["with oxygen, air speed and what happened"] >= 11
