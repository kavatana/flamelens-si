"""Parser tests. Every input below is a real cell copied from a PSI experimental table."""

import pytest

from flamelens_pipeline import parse as p


class TestQuantity:
    def test_plain_number(self):
        q = p.parse_quantity("0.21")
        assert (q.min, q.max, q.levels, q.approx) == (0.21, 0.21, [], False)

    def test_number_with_unit(self):
        q = p.parse_quantity("20 cm/s")
        assert q.min == 20 and q.unit == "cm/s"

    def test_leading_dot(self):
        assert p.parse_quantity(".33 cm").min == 0.33

    def test_approximate(self):
        q = p.parse_quantity("~ 21.5")
        assert q.min == 21.5 and q.approx is True

    def test_hyphen_range(self):
        q = p.parse_quantity("21.5 - 21.7")
        assert (q.min, q.max) == (21.5, 21.7)

    def test_descending_to_range(self):
        q = p.parse_quantity("22.1 to 22.0")
        assert (q.min, q.max) == (22.0, 22.1)

    def test_percent_range(self):
        q = p.parse_quantity("30%-40%")
        assert (q.min, q.max, q.unit) == (30, 40, "%")

    def test_semicolon_list(self):
        q = p.parse_quantity("21; 26.5; 40")
        assert q.levels == [21, 26.5, 40] and (q.min, q.max) == (21, 40)

    def test_list_with_or(self):
        assert p.parse_quantity("0.5; 1.0; 1.5; 2.0; or 3.0").levels == [0.5, 1.0, 1.5, 2.0, 3.0]

    def test_irregular_spacing(self):
        assert p.parse_quantity("0.17; 0.21;0.25; 0.3").levels == [0.17, 0.21, 0.25, 0.3]

    @pytest.mark.parametrize("cell", ["", "-", "–", "n/a", "none", "#VALUE!"])
    def test_placeholders_are_missing(self, cell):
        assert p.parse_quantity(cell) is None

    @pytest.mark.parametrize("cell", ["RAMP", "LOW O2", "Insignificant", "See Fig. 5", "5 down to ext"])
    def test_words_are_kept_as_text_not_numbers(self, cell):
        q = p.parse_quantity(cell)
        assert not q.is_numeric and q.qualifier == cell

    def test_negative_number_is_not_a_range(self):
        q = p.parse_quantity("-1")
        assert (q.min, q.max) == (-1, -1)


class TestConvert:
    def test_mmhg_to_kpa(self):
        q, unit = p.convert(p.parse_quantity("760"), "kPa", "mmHg")
        assert q.min == pytest.approx(101.325, abs=0.01) and unit == "mmhg"

    def test_bar_to_kpa(self):
        q, _ = p.convert(p.parse_quantity("0.50665"), "kPa", "bar")
        assert q.min == pytest.approx(50.665)

    def test_inline_unit_beats_column_default(self):
        # Saffire-II thickness column mixes "0.27 mm" and "1 cm".
        q, unit = p.convert(p.parse_quantity("1 cm"), "mm", "mm")
        assert q.min == 10 and unit == "cm"

    def test_percent_list_to_fraction(self):
        q, _ = p.convert(p.parse_quantity("21; 26.5; 40"), "fraction", "percent")
        assert q.levels == pytest.approx([0.21, 0.265, 0.40])

    def test_text_passes_through(self):
        q, _ = p.convert(p.parse_quantity("RAMP"), "fraction", "fraction")
        assert q.qualifier == "RAMP"

    def test_unknown_unit_raises(self):
        with pytest.raises(ValueError):
            p.convert(p.parse_quantity("5"), "kPa", "furlong")


class TestAutofillRepair:
    def test_fuel_formula_run(self):
        cells = ["40% CH4", "40% CH5", "40% CH6", "100% CH4", "100% CH5"]
        assert p.repair_autofill(cells) == [
            ("40% CH4", False), ("40% CH4", True), ("40% CH4", True),
            ("100% CH4", False), ("100% CH4", True),
        ]

    def test_run_through_a_valid_formula(self):
        # C2H6 is ethane, but inside a C2H4, C2H5, C2H6 run it is drag-fill damage.
        cells = ["100% C2H4", "100% C2H5", "100% C2H6", "100% C2H7"]
        assert [v for v, _ in p.repair_autofill(cells)] == ["100% C2H4"] * 4

    def test_diluent_run(self):
        cells = ["~21% O2 with N2", "~21% O2 with N3", "~21% O2 with N4"]
        assert [v for v, _ in p.repair_autofill(cells)] == ["~21% O2 with N2"] * 3

    def test_repeats_and_real_changes_are_untouched(self):
        cells = ["100% CH4", "100% CH4", "100% C2H6", "20% C2H4"]
        assert p.repair_autofill(cells) == [(c, False) for c in cells]


class TestFuel:
    @pytest.mark.parametrize(
        "cell,name,fraction,diluent",
        [
            ("100% C2H4", "ethylene", 1.0, ""),
            ("100%C2H4", "ethylene", 1.0, ""),
            ("50% C2H4 with N2", "ethylene", 0.5, "N2"),
            ("40% CH4 (balance N2) including 2 pyrometry calibration tests", "methane", 0.4, "N2"),
            ("75 % Propylene", "propylene", 0.75, ""),
            ("30% butane", "n-butane", 0.3, ""),
            ("Heptane", "n-heptane", None, ""),
            ("C12H26", "n-dodecane", None, ""),
            ("IsoOctane (pure)", "iso-octane", 1.0, ""),
            ("45% H2 with He", "hydrogen", 0.45, "He"),
        ],
    )
    def test_single_fuel(self, cell, name, fraction, diluent):
        fuel = p.parse_fuel(cell)
        assert (fuel.name, fuel.fraction, fuel.diluent) == (name, fraction, diluent)

    def test_bracketed_liquid_blend(self):
        fuel = p.parse_fuel("[.60]/[.40] C12H26/iso-dodecane")
        assert fuel.components == [("n-dodecane", 0.6), ("iso-dodecane", 0.4)]

    def test_two_fuels_with_balance(self):
        fuel = p.parse_fuel("44.4% H2 with CH4")
        assert fuel.components == [("hydrogen", 0.444), ("methane", pytest.approx(0.556))]

    def test_three_part_mixture_with_diluent(self):
        fuel = p.parse_fuel("25% H2, 20% CH4, with He")
        assert fuel.components == [("hydrogen", 0.25), ("methane", 0.20)]
        assert fuel.diluent == "He" and fuel.fraction == pytest.approx(0.45)

    def test_named_percent_mixture(self):
        fuel = p.parse_fuel("Propanol (95%) Glycerol (5%) (mixture)")
        assert fuel.components == [("propanol", 0.95), ("glycerol", 0.05)]

    def test_not_a_fuel(self):
        assert p.parse_fuel("SOOT Cleaning") is None


class TestSample:
    def test_fabric(self):
        s = p.parse_sample("2 cm SIBAL")
        assert (s.material, s.geometry, s.width_cm) == ("SIBAL fabric (cotton/fiberglass)", "fabric sheet", 2)

    def test_rod_in_inches(self):
        s = p.parse_sample('1/4" clear rod', default_material="PMMA")
        assert (s.material, s.material_inferred, s.geometry) == ("PMMA", True, "rod")
        assert s.diameter_mm == pytest.approx(6.35)

    def test_rod_decimal_inches(self):
        assert p.parse_sample('0.5" black rod', default_material="PMMA").diameter_mm == pytest.approx(12.7)

    def test_film_in_microns(self):
        s = p.parse_sample("1 cm wide 200 micron thick PMMA")
        assert (s.material, s.geometry, s.thickness_mm) == ("PMMA", "thin film", 0.2)

    def test_slab(self):
        s = p.parse_sample("5 mm thick PMMA 2 cm wide")
        assert (s.geometry, s.thickness_mm) == ("slab", 5)

    def test_sphere(self):
        s = p.parse_sample("PMMA sphere 2 cm")
        assert (s.geometry, s.diameter_mm, s.material_inferred) == ("sphere", 20, False)

    def test_two_materials(self):
        assert p.parse_sample("PMMA & Nomex").material == "Nomex + PMMA"

    def test_candle(self):
        s = p.parse_sample("Japan Wax Candle wake")
        assert (s.material, s.geometry) == ("Japan wax", "candle")

    def test_misspelt_paraffin(self):
        assert p.parse_sample("parrafin wax slab").material == "Paraffin wax"

    def test_shape_without_material_needs_a_default(self):
        assert p.parse_sample("2 cm sphere") is None


class TestAtmosphereAndDates:
    def test_two_oxygen_levels(self):
        q, diluent = p.parse_atmosphere("~30% and ~21% O2 with He")
        assert q.levels == [21, 30] and q.approx and diluent == "He"

    def test_single_oxygen_level(self):
        q, diluent = p.parse_atmosphere("~21% O2 with N2")
        assert (q.min, q.max, q.levels, diluent) == (21, 21, [], "N2")

    @pytest.mark.parametrize(
        "cell,iso",
        [("3/5/2009", "2009-03-05"), ("11/18/11", "2011-11-18"), ("9-Mar-17", "2017-03-09"),
         ("2012-FEB-13 SLICE testing with", "2012-02-13"), ("21-Jul", ""), ("45", "")],
    )
    def test_dates(self, cell, iso):
        assert p.parse_date(cell) == iso

    def test_year_day_code(self):
        assert p.parse_yyddd("19254") == "2019-09-11"
        assert p.parse_yyddd("abc") == ""

    def test_date_parts(self):
        assert p.parse_date_parts("2019", "Feb", "8") == "2019-02-08"
        assert p.parse_date_parts("2020", "Sept.", "4") == "2020-09-04"
        assert p.parse_date_parts("2018", "3", "14") == "2018-03-14"


class TestCategoryAndBool:
    def test_category_mapping(self):
        mapping = {r"^se$": "self-extinguished", r"^ft$": "flow terminated"}
        assert p.parse_category("SE", mapping) == "self-extinguished"
        assert p.parse_category("-", mapping) == ""

    def test_bool(self):
        assert p.parse_bool("Yes") is True and p.parse_bool("no") is False
        assert p.parse_bool("flash") is None and p.parse_bool("") is None


class TestFlowSteps:
    """Air-speed cells from the BASS-II table, where the crew changed the flow during a burn."""

    @pytest.mark.parametrize("cell, levels, approx", [
        ("5", [5], False),
        ("0", [0], False),
        ("20  10  5  2  1", [20, 10, 5, 2, 1], False),
        ("10   6  5  4.5  4  3", [10, 6, 5, 4.5, 4, 3], False),
        ("5   down to ext", [5], True),
        ("10   5   3   0ext", [10, 5, 3, 0], True),
        ("5  3  2  1  low", [5, 3, 2, 1], True),
        ("10   5>7  5 decr", [10, 5, 7, 5], True),
        ("10   ~8", [10, 8], True),
        ("5   2(?)", [5, 2], True),
        ("4 incr to 26.5", [4, 26.5], True),
        ("10   15 (brief)   10   8", [10, 15, 10, 8], False),
    ])
    def test_speeds_are_read_in_the_order_written(self, cell, levels, approx):
        steps = p.parse_flow_steps(cell)
        assert (steps.levels, steps.approx, steps.unread) == (levels, approx, "")

    def test_remarks_are_kept_in_nasas_words(self):
        assert p.parse_flow_steps("5   down then blowoff").words == "down then blowoff"
        assert p.parse_flow_steps("10   15 (brief)   10   8").words == "brief"

    def test_a_number_with_its_unit_is_the_speed_and_the_other_is_not(self):
        steps = p.parse_flow_steps("49   5 cm/s")
        assert steps.levels == [5] and steps.words == "49"

    @pytest.mark.parametrize("cell, levels", [
        ("5   pots 0.4   0.36   0.32   0.31   off", [5]),
        ("5   3   pot 0.4", [5, 3]),
        ("3   0.5 pot   0.4 pot", [3]),
        ("5   2.5   2 (pot .9   .5   .35.  .33)", [5, 2.5, 2]),
    ])
    def test_dial_settings_are_not_speeds(self, cell, levels):
        assert p.parse_flow_steps(cell).levels == levels

    def test_small_bracketed_numbers_are_dial_settings(self):
        steps = p.parse_flow_steps("5   2.5 (1.15   .5   .35   .33. .32   .315   .31   .3)")
        assert steps.levels == [5, 2.5] and steps.approx

    def test_bracketed_fan_readings_beside_smaller_speeds_are_not_speeds(self):
        steps = p.parse_flow_steps("5  10  5   2   0 (49   62   49   44   42)")
        assert steps.levels == [5, 10, 5, 2, 0] and steps.approx

    def test_a_cell_with_two_lists_that_cannot_be_told_apart_is_left_unread(self):
        steps = p.parse_flow_steps("49  44  42  41  41  40.5 (5   2   0)")
        assert steps.levels == [] and steps.unread and steps.words.startswith("49")

    @pytest.mark.parametrize("cell", ["see fan", "no ign at any flow", "<1"])
    def test_a_cell_without_a_plain_speed_stays_text(self, cell):
        steps = p.parse_flow_steps(cell)
        assert steps.levels == [] and steps.words == cell and steps.unread == ""

    def test_empty_cell(self):
        assert p.parse_flow_steps("") is None
