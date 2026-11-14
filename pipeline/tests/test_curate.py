"""Tests for the curation rules and for invariants of the curated data set."""

import json

import pytest
import yaml

from flamelens_pipeline import config, curate

VARIABLES = yaml.safe_load((config.DICTIONARY_DIR / "variables.yaml").read_text())


def make_table(columns, rows):
    return {
        "accession": "PSI-0",
        "file_name": "t.csv",
        "encoding": "utf-8",
        "columns": columns,
        "rows": [{"row": i, "cells": {c: v for c, v in zip(columns, row) if v}} for i, row in enumerate(rows, 1)],
    }


def make_corpus(text="solid fuels burning in microgravity"):
    inv = {"accession": "PSI-0", "title": "", "acronym": "", "proposal_title": "", "sub_research_area": "",
           "objective": text, "approach": "", "hypothesis": "", "research_impacts": "", "keywords": [], "hardware": []}
    return curate.Corpus([inv], [], "NASA says there is no partial-gravity data.")


def spec(**extra):
    base = {"file": "t.csv", "accession": "PSI-0", "code": "t", "title": "T", "record_kind": "test",
            "label": "{ID}", "columns": {}}
    return {**base, **extra}


def values_of(record):
    return {v["var"]: v for v in record["values"]}


class TestQuoteVerification:
    def test_exact_quote_passes(self):
        corpus = make_corpus()
        corpus.check("solid fuels burning", "psi", "here", accession="PSI-0")
        assert corpus.failures == []

    def test_typography_and_spacing_are_ignored(self):
        corpus = make_corpus("NASA’s  material   selection – criteria")
        corpus.check("NASA's material selection - criteria", "psi", "here", accession="PSI-0")
        assert corpus.failures == []

    def test_paraphrase_fails(self):
        corpus = make_corpus()
        corpus.check("solid fuels that burn", "psi", "here", accession="PSI-0")
        assert len(corpus.failures) == 1

    def test_quote_is_checked_against_the_named_source_only(self):
        corpus = make_corpus()
        corpus.check("no partial-gravity data", "psi", "here", accession="PSI-0")
        corpus.check("no partial-gravity data", "challenge", "here")
        assert len(corpus.failures) == 1

    def test_empty_quote_fails(self):
        corpus = make_corpus()
        corpus.check("", "psi", "here", accession="PSI-0")
        assert len(corpus.failures) == 1

    def test_a_quote_can_come_from_a_listed_nasa_file(self):
        corpus = curate.Corpus([], [], "", files={"readme": "Air display:  flow speed measured in the duct in cm/s"})
        corpus.check("Air display: flow speed measured in the duct in cm/s", "doc:readme", "here")
        corpus.check("Air display: flow speed in the duct", "doc:readme", "here")
        corpus.check("Air display: flow speed measured in the duct in cm/s", "doc:other", "here")
        assert len(corpus.failures) == 2

    def test_a_column_definition_that_is_not_in_the_named_file_fails_the_build(self):
        table = make_table(["ID", "Air"], [["a", "5"]])
        s = spec(columns={"Air": {"var": "flow_speed_cm_s", "parse": "flow_steps", "unit": "cm/s",
                                  "evidence": "air speed in cm/s", "evidence_source": "doc:readme"}})
        corpus = curate.Corpus([], [], "", files={"readme": "fan voltage times ten"})
        curate.build_records(s, table, VARIABLES, corpus)
        assert corpus.failures

    def test_context_constant_without_evidence_fails_the_build(self):
        table = make_table(["ID"], [["a"]])
        s = spec(constants={"fuel_phase": {"value": "solid", "quality": "context", "evidence": "liquid fuels"}})
        corpus = make_corpus()
        curate.build_records(s, table, VARIABLES, corpus)
        assert corpus.failures


class TestRowRules:
    def test_units_are_converted_and_raw_is_kept(self):
        table = make_table(["ID", "P"], [["a", "760"]])
        s = spec(columns={"P": {"var": "pressure_kpa", "unit": "mmHg"}})
        (record,), _, _ = curate.build_records(s, table, VARIABLES, make_corpus())
        value = values_of(record)["pressure_kpa"]
        assert value["min"] == pytest.approx(101.325, abs=0.01)
        assert (value["raw"], value["column"], value["quality"]) == ("760", "P", "reported")
        assert record["original"] == {"ID": "a", "P": "760"}

    def test_excluded_rows_and_footnote_rows(self):
        table = make_table(["ID", "O2"], [["S1", "21"], ["F1C1", ""], ["Note 1 derived from CO2", ""]])
        s = spec(columns={"O2": {"var": "o2_fraction", "unit": "percent"}},
                 rows={"exclude": [{"column": "ID", "pattern": r"^F\dC\d", "reason": "video"}],
                       "footnotes": {"column": "ID", "pattern": r"^Note \d"}})
        records, meta, findings = curate.build_records(s, table, VARIABLES, make_corpus())
        assert [r["label"] for r in records] == ["S1"]
        assert meta["footnotes"] == ["Note 1 derived from CO2"]
        assert meta["excluded"][0]["reason"] == "video"
        assert any(f["kind"] == "excluded-rows" for f in findings)

    def test_fill_down_marks_the_value_as_corrected(self):
        table = make_table(["ID", "Material"], [["1", "Silicone"], ["2", ""]])
        s = spec(columns={"Material": {"parse": "sample"}}, rows={"fill_down": ["Material"]})
        records, _, _ = curate.build_records(s, table, VARIABLES, make_corpus())
        fuel = values_of(records[1])["fuel"]
        assert fuel["text"] == "Silicone" and fuel["quality"] == "corrected" and "row above" in fuel["note"]
        assert "Material" not in records[1]["original"]  # the original row still shows the blank

    def test_autofill_repair(self):
        table = make_table(["ID", "Fuel Bottle"], [["1", "40% CH4"], ["2", "40% CH5"], ["3", "40% CH6"]])
        s = spec(columns={"Fuel Bottle": {"parse": "fuel"}}, repair_autofill=["Fuel Bottle"])
        records, _, findings = curate.build_records(s, table, VARIABLES, make_corpus())
        fuels = [values_of(r)["fuel"] for r in records]
        assert [f["text"] for f in fuels] == ["methane"] * 3
        assert [f["quality"] for f in fuels] == ["reported", "corrected", "corrected"]
        assert "40% CH5" in fuels[1]["note"]
        assert [f["count"] for f in findings if f["kind"] == "autofill-repair"] == [2]

    def test_typo_correction_and_stale_correction(self):
        table = make_table(["ID", "T"], [["1", "037 mm"]])
        fixes = [{"column": "T", "raw": "037 mm", "value": "0.37 mm", "reason": "Missing decimal."},
                 {"column": "T", "raw": "999", "value": "1", "reason": "x"}]
        s = spec(columns={"T": {"var": "sample_thickness_mm", "unit": "mm"}}, corrections=fixes)
        (record,), _, findings = curate.build_records(s, table, VARIABLES, make_corpus())
        value = values_of(record)["sample_thickness_mm"]
        assert value["min"] == 0.37 and value["quality"] == "corrected"
        assert {f["kind"] for f in findings} == {"typo", "stale-correction"}

    def test_continuation_rows_extend_the_previous_record(self):
        table = make_table(["Day", "Conc"], [["18073", "100%"], ["", "70%"], ["18078", "40%"]])
        s = spec(label="{Day}", columns={"Conc": {"var": "fuel_fraction", "unit": "percent"}},
                 rows={"continuation": {"key_column": "Day", "merge": ["Conc"]}})
        records, _, _ = curate.build_records(s, table, VARIABLES, make_corpus())
        assert len(records) == 2
        assert values_of(records[0])["fuel_fraction"]["levels"] == [0.7, 1.0]

    def test_inherited_conditions_become_an_envelope(self):
        table = make_table(["ID", "Material", "Flow"],
                           [["1", "Teflon", "5"], ["2", "Teflon", "10"], ["3", "Kapton: same conditions as 1-2", ""]])
        s = spec(columns={"Material": {"parse": "sample"}, "Flow": {"var": "flow_speed_cm_s", "unit": "cm/s"}},
                 rows={"inherit": {"column": "Material", "pattern": r":\s*same conditions as 1-2",
                                   "source_rows": [1, 2], "columns": ["Flow"]}})
        records, _, _ = curate.build_records(s, table, VARIABLES, make_corpus())
        assert records[2]["kind"] == "envelope"
        assert values_of(records[2])["fuel"]["text"] == "Kapton"
        assert values_of(records[2])["flow_speed_cm_s"]["levels"] == [5, 10]

    def test_column_value_overrides_a_constant(self):
        table = make_table(["ID", "O2"], [["1", "30"], ["2", ""]])
        s = spec(columns={"O2": {"var": "o2_fraction", "unit": "percent"}},
                 constants={"o2_fraction": {"value": 0.21, "quality": "assumed", "note": "air"}})
        records, _, _ = curate.build_records(s, table, VARIABLES, make_corpus())
        assert values_of(records[0])["o2_fraction"]["quality"] == "reported"
        assert values_of(records[1])["o2_fraction"]["quality"] == "assumed"

    def test_unknown_mapped_column_is_an_error(self):
        table = make_table(["ID"], [["1"]])
        with pytest.raises(ValueError, match="not in the PSI table"):
            curate.build_records(spec(columns={"Nope": {"var": "notes"}}), table, VARIABLES, make_corpus())

    def test_note_references_and_not_applicable(self):
        assert curate.number_value("burn_length_cm", "~ 10 cm (note 3)", "cm", VARIABLES, "c")["min"] == 10
        assert curate.number_value("spread_rate_mm_s", "n/a (Nomex)", "mm/s", VARIABLES, "c") is None
        assert curate.number_value("burn_time_s", "Insignificant", "s", VARIABLES, "c")["text"] == "Insignificant"

    def test_out_of_range_value_is_kept_but_flagged(self):
        variables = {**VARIABLES, "pressure_kpa": {**VARIABLES["pressure_kpa"], "plausible": [10, 700]}}
        table = make_table(["ID", "P"], [["1", "0"]])
        s = spec(columns={"P": {"var": "pressure_kpa", "unit": "mmHg"}})
        (record,), _, findings = curate.build_records(s, table, variables, make_corpus())
        assert values_of(record)["pressure_kpa"]["suspect"] is True
        assert values_of(record)["pressure_kpa"]["min"] == 0
        assert [f["kind"] for f in findings] == ["implausible-value"]


# --------------------------------------------------------------------------------------
# Invariants of the real curated data (skipped until the pipeline has been run)
# --------------------------------------------------------------------------------------

CURATED = config.CURATED_DIR / "records.json"
needs_data = pytest.mark.skipif(not CURATED.exists(), reason="run the pipeline first")


def test_a_flagged_value_does_not_stretch_an_experiments_range():
    def rec(low, **extra):
        return {"values": [{"var": "pressure_kpa", "min": low, "max": low, **extra}]}
    span = curate._span([rec(0.0, suspect=True), rec(101.3), rec(309.0)], "pressure_kpa")
    assert span == {"min": 101.3, "max": 309.0, "records": 2}


class TestOxygenRise:
    def check(self, start, end, basis="ambient"):
        values = {"o2_fraction": {"min": start, "max": start}, "o2_fraction_final": {"min": end, "max": end},
                  "o2_basis": {"text": basis}}
        return curate._check_oxygen_rise(values), values["o2_fraction_final"]

    def test_oxygen_that_fell_or_barely_moved_is_fine(self):
        assert self.check(0.222, 0.218)[0] is False
        assert self.check(0.188, 0.189)[0] is False

    def test_oxygen_far_above_its_starting_value_is_flagged_and_kept(self):
        flagged, end = self.check(0.207, 0.404)
        assert flagged and end["suspect"] is True and end["min"] == 0.404 and "burning cannot cause" in end["note"]

    def test_only_the_air_around_the_flame_is_checked(self):
        assert self.check(0.21, 0.40, basis="oxidizer stream")[0] is False


class TestFlowStepsColumn:
    COLUMN = {"var": "flow_speed_cm_s", "parse": "flow_steps", "unit": "cm/s", "max": 59,
              "evidence": "flow speed measured in the duct in cm/s", "evidence_source": "doc:readme", "note": "From the display."}

    def build(self, cell):
        table = make_table(["ID", "Air"], [["a", cell]])
        corpus = curate.Corpus([], [], "", files={"readme": "flow speed measured in the duct in cm/s"})
        records, _, _ = curate.build_records(spec(columns={"Air": self.COLUMN}), table, VARIABLES, corpus)
        assert corpus.failures == []
        return {v["var"]: v for v in records[0]["values"]}.get("flow_speed_cm_s")

    def test_several_speeds_become_a_range_with_its_levels(self):
        value = self.build("20  10  5  2  1")
        assert (value["min"], value["max"], value["levels"]) == (1, 20, [1, 2, 5, 10, 20])
        assert value["quality"] == "reported" and value["evidence_source"] == "doc:readme"
        assert "approx" not in value

    def test_nasas_remark_is_kept_and_the_value_is_marked_approximate(self):
        value = self.build("5   down to ext")
        assert (value["min"], value["max"]) == (5, 5) and value["approx"] is True
        assert "down to ext" in value["note"]

    def test_a_cell_that_cannot_be_read_keeps_its_text_and_gives_no_number(self):
        value = self.build("49  44  42  41  41  40.5 (5   2   0)")
        assert "min" not in value and value["text"].startswith("49")
        assert "No speed is read" in value["note"]

    def test_a_speed_above_the_calibrated_maximum_is_not_read(self):
        value = self.build("6   75")
        assert "min" not in value and value["suspect"] is True

    def test_an_empty_cell_gives_no_value(self):
        assert self.build("") is None


@pytest.fixture(scope="module")
def data():
    return {name: json.loads((config.CURATED_DIR / f"{name}.json").read_text())
            for name in ("records", "investigations", "tables", "variables", "quality", "reference")}


@needs_data
class TestCuratedData:
    def test_all_24_combustion_investigations_are_present(self, data):
        assert len(data["investigations"]) == 24

    def test_record_ids_are_unique(self, data):
        ids = [r["id"] for r in data["records"]]
        assert len(ids) == len(set(ids))

    def test_every_value_uses_a_known_variable_and_quality(self, data):
        qualities = {"reported", "corrected", "context", "assumed", "derived"}
        for record in data["records"]:
            for value in record["values"]:
                assert value["var"] in data["variables"]
                assert value["quality"] in qualities

    def test_context_values_carry_a_quote_or_note_and_assumed_values_a_note(self, data):
        for record in data["records"]:
            for value in record["values"]:
                if value["quality"] == "context":
                    assert value.get("evidence") or value.get("note"), (record["id"], value["var"])
                if value["quality"] == "assumed":
                    assert value.get("note"), (record["id"], value["var"])

    def test_fractions_are_between_0_and_1_unless_flagged(self, data):
        for record in data["records"]:
            for value in record["values"]:
                if data["variables"][value["var"]].get("unit") == "fraction" and "min" in value:
                    if not value.get("suspect"):
                        assert 0 <= value["min"] <= value["max"] <= 1, (record["id"], value)

    def test_every_record_keeps_its_original_row(self, data):
        assert all(r["original"] for r in data["records"])

    def test_no_row_is_lost(self, data):
        """Rows in the PSI file = records + excluded + footnote rows + merged continuation rows."""
        merged = {f["table"]: int(f["message"].split()[0]) for f in data["quality"]["findings"] if f["kind"] == "merged-rows"}
        by_table = {}
        for record in data["records"]:
            by_table[record["table"]] = by_table.get(record["table"], 0) + 1
        for table in data["tables"]:
            footnote_rows = len(table["footnotes"]) if table["file_name"].endswith("SAFFIRE-2.csv") else 0
            accounted = by_table.get(table["file_name"], 0) + len(table["excluded"]) + footnote_rows + merged.get(table["file_name"], 0)
            assert accounted == table["rows_in_file"], table["file_name"]

    def test_inverse_flames_are_not_counted_as_ambient_oxygen(self, data):
        cfig = next(i for i in data["investigations"] if i["accession"] == "PSI-159")
        assert cfig["stats"]["o2"]["max"] == pytest.approx(0.85)
        assert cfig["stats"]["o2_ambient"]["max"] < 0.45

    def test_relevance_levels_and_pillars(self, data):
        for inv in data["investigations"]:
            assert inv["relevance"]["level"] in (1, 2, 3) and inv["relevance"]["quote"]
            assert set(inv["pillars"]) == {"prevention", "detection", "suppression"}
            assert all(p["quote"] for p in inv["pillars"].values() if p["score"] > 0)

    def test_bass2_air_speeds_come_from_the_column_nasa_defines(self, data):
        rows = [r for r in data["records"] if r["accession"] == "PSI-25"]
        flows = [v for r in rows for v in r["values"] if v["var"] == "flow_speed_cm_s"]
        read = [v for v in flows if "min" in v]
        assert len(rows) == 129 and len(flows) == 125 and len(read) >= 115
        assert all(0 <= v["min"] <= v["max"] <= 59 for v in read)
        assert all(v["column"] == "Air display" and v["evidence_source"] == "doc:bass2-readme" for v in flows)

    def test_reference_pressures_are_converted_from_psi(self, data):
        env = {e["id"]: e for e in data["reference"]["environments"]}
        assert env["exploration"]["pressure_kpa"] == pytest.approx(56.54, abs=0.01)
        assert env["cabin"]["pressure_kpa"] == pytest.approx(101.35, abs=0.01)
        assert env["moon-base"]["pressure_kpa_max"] == pytest.approx(70.33, abs=0.01)
