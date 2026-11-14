"""What an evidence pack holds about one test beyond single values is copied, never changed."""

from flamelens_pipeline import dossier

VARIABLES = {"droplet_diameter_mm": {"label": "Droplet diameter", "unit": "mm"}}


def evidence(**parts) -> dict:
    return {"series": [], "media": [], "findings": [], "pairs": [], **parts}


def point(t: str, v: str, test: str = "PSI-69/flex/1", variable: str = "droplet_diameter_mm") -> dict:
    return {"test_id": test, "variable_id": variable, "t_s": t, "value_num": v, "unit": "mm", "pack": "PSI-69"}


def test_a_curve_keeps_its_points_in_order_with_its_plain_name():
    built = dossier.build(evidence(series=[point("0", "2.5"), point("0.5", "2.41"), point("1", "2.3")]), VARIABLES)
    [curve] = built["PSI-69/flex/1"]["curves"]
    assert curve == {"variable": "droplet_diameter_mm", "label": "Droplet diameter", "unit": "mm", "t": [0.0, 0.5, 1.0], "v": [2.5, 2.41, 2.3]}


def test_a_point_that_is_not_a_number_is_left_out_not_guessed():
    built = dossier.build(evidence(series=[point("0", "2.5"), point("1", ""), point("2", "nan"), point("3", "2.1")]), VARIABLES)
    assert built["PSI-69/flex/1"]["curves"][0]["t"] == [0.0, 3.0]


def test_two_variables_of_one_test_are_two_curves():
    built = dossier.build(evidence(series=[point("0", "1"), point("0", "9", variable="flame_diameter_visible_mm")]), VARIABLES)
    assert [c["variable"] for c in built["PSI-69/flex/1"]["curves"]] == ["droplet_diameter_mm", "flame_diameter_visible_mm"]
    # A variable the dictionary does not know keeps its own id as its name.
    assert built["PSI-69/flex/1"]["curves"][1]["label"] == "flame_diameter_visible_mm"


def test_a_number_keeps_six_significant_digits():
    built = dossier.build(evidence(series=[point("0.1333340001", "7.474312351")]), VARIABLES)
    curve = built["PSI-69/flex/1"]["curves"][0]
    assert (curve["t"], curve["v"]) == ([0.133334], [7.47431])


def test_a_video_that_stays_with_nasa_is_not_listed_as_a_photograph():
    media = [{"test_id": "PSI-26/bass/82", "kind": "video", "local_file": "", "match_rule": "NASA's video", "pack": "PSI-26"}]
    assert dossier.build(evidence(media=media), VARIABLES) == {}


def test_captions_come_from_nasas_file_names():
    def caption(kind: str, file: str) -> str:
        return dossier._caption({"kind": kind, "local_file": file}, {"iss038e051066": {"time": "10:03:42"}})

    assert caption("still", "media/B1/01_iss038e051066.jpg") == "NASA photo iss038e051066, 10:03:42"
    assert caption("still", "media/Test_98/video_142050.jpg") == "NASA's video, clock 14:20:50"
    assert caption("still", "media/B4/video_00m07s.jpg") == "NASA's video, 0:07 in"
    assert caption("proof_sheet", "media/T1_proof_sheet.jpg") == "NASA's proof sheet of this test"


def test_a_test_id_becomes_a_safe_file_name():
    assert dossier.slug("PSI-25/bass2/101") == "PSI-25_bass2_101"
    assert dossier.slug("../../etc") == "_etc"
