"""NASA's test videos are tied to tests by the label in NASA's own file name, and by nothing else."""

from flamelens_pipeline import footage

VIEWS = footage.rules()["PSI-25"]["views"]
RECORDS = [
    {"id": "PSI-25/bass2/1", "accession": "PSI-25", "label": "T5"},
    {"id": "PSI-25/bass2/2", "accession": "PSI-25", "label": "O3a"},
    {"id": "PSI-25/bass2/3", "accession": "PSI-25", "label": "M15"},
    {"id": "PSI-26/bass/1", "accession": "PSI-26", "label": "T5"},
]


def named(name: str, **extra) -> dict:
    return {"file_name": name, "file_size": 1000, "version": 4, "restricted": False, "visible": True, **extra}


def run(*files: dict) -> list[dict]:
    return footage.match("PSI-25", VIEWS, list(files), RECORDS)


def test_a_test_video_is_tied_to_the_test_its_name_carries():
    [clip] = run(named("PSI-25_Raw Data_BASS_GMT100_SAMPLE_131_TEST_T5.mp4"))
    assert clip == {
        "id": "PSI-25/bass2/1#main", "record_id": "PSI-25/bass2/1", "accession": "PSI-25", "view": "main",
        "file_name": "PSI-25_Raw Data_BASS_GMT100_SAMPLE_131_TEST_T5.mp4", "version": 4, "size_bytes": 1000,
    }


def test_the_second_camera_is_a_view_of_the_same_test():
    clips = run(named("BASS_GMT164_SAMPLE_205_TEST_O3a.mp4"), named("BASS_GMT164_SAMPLE_205_TEST_O3a_2ND_VIEW.mp4"))
    assert [(c["record_id"], c["view"]) for c in clips] == [("PSI-25/bass2/2", "main"), ("PSI-25/bass2/2", "second")]


def test_nasa_sometimes_leaves_out_the_underscore():
    [clip] = run(named("BASS_GMT188_SAMPLE_225_TESTM15_2ND_VIEW.mp4"))
    assert (clip["record_id"], clip["view"]) == ("PSI-25/bass2/3", "second")


def test_other_recordings_of_a_test_are_left_out():
    assert run(
        named("BASS_GMT100_SAMPLE_131_TEST_T5_Still_Sequence.mp4"),
        named("T5-post-burn-picture.mp4"),
        named("vlc-record-2014-12-05-BASS_GMT190_SAMPLE_145_TEST_T5.ts-.mp4"),
        named("BASS_GMT100_SAMPLE_131_TEST_T5.zip"),
    ) == []


def test_a_label_that_is_not_in_the_table_is_not_guessed():
    assert run(named("BASS_GMT100_SAMPLE_999_TEST_Z9.mp4")) == []


def test_a_label_of_another_experiment_does_not_count():
    clips = footage.match("PSI-26", VIEWS, [named("BASS_GMT100_SAMPLE_131_TEST_O3a.mp4")], RECORDS)
    assert clips == []


def test_restricted_or_hidden_files_are_never_offered():
    assert run(named("BASS_GMT100_SAMPLE_131_TEST_T5.mp4", restricted=True)) == []
    assert run(named("BASS_GMT100_SAMPLE_131_TEST_T5.mp4", visible=False)) == []


def test_a_second_copy_of_the_same_clip_is_not_listed_twice():
    clips = run(named("BASS_GMT100_SAMPLE_131_TEST_T5.mp4"), named("COPY_BASS_GMT100_SAMPLE_131_TEST_T5.mp4"))
    assert [c["file_name"] for c in clips] == ["BASS_GMT100_SAMPLE_131_TEST_T5.mp4"]


def test_the_real_archive_listing_gives_most_bass2_tests_a_video():
    import json

    from flamelens_pipeline import config

    records = json.loads((config.CURATED_DIR / "records.json").read_text())
    clips = footage.build(records)
    main = [c for c in clips if c["view"] == "main" and c["accession"] == "PSI-25"]
    assert len(main) >= 100
    assert len({c["record_id"] for c in main}) == len(main)
    assert all(c["file_name"].lower().endswith((".mp4", ".ts")) and c["size_bytes"] > 0 for c in clips)
    # Each clip belongs to a test of the investigation whose archive the file is in.
    assert all(c["record_id"].startswith(c["accession"] + "/") for c in clips)


GAS = footage.rules()["PSI-159"]["views"]
GAS_RECORDS = [
    {"id": "PSI-159/cfig-normal/2", "accession": "PSI-159", "label": "21088 B1"},
    {"id": "PSI-159/cfig-normal/3", "accession": "PSI-159", "label": "21242F1"},
]


def test_a_label_matches_whether_or_not_the_table_writes_it_with_a_space():
    [clip] = footage.match("PSI-159", GAS, [named("PSI-159_Raw Data_vlc-record-2021-03-29-15h32m07s-udp____21088B1.ts")], GAS_RECORDS)
    assert clip["record_id"] == "PSI-159/cfig-normal/2"


def test_the_label_may_come_before_the_recording_name():
    [clip] = footage.match("PSI-159", GAS, [named("PSI-159_Raw Data_21088B1-vlc-record-2021-03-29-23h23m18s-udp___233.1.14.13_50400-.ts")], GAS_RECORDS)
    assert clip["record_id"] == "PSI-159/cfig-normal/2"


def test_a_recording_nasa_marked_as_failed_is_left_out():
    assert footage.match("PSI-159", GAS, [named("PSI-159_Raw Data_vlc-record-2021-08-30-16h48m40s-udp____21242F1_failedIPSUerror.ts")], GAS_RECORDS) == []


def test_a_label_two_rows_share_is_not_used():
    twice = [{"id": "PSI-39/cfi/1", "accession": "PSI-39", "label": "F173E01"}, {"id": "PSI-39/cfi/2", "accession": "PSI-39", "label": "f173e01"}]
    assert footage.match("PSI-39", footage.rules()["PSI-39"]["views"], [named("PSI-39_Raw Data_vlc-record-2017-06-22-15h01m56s-udp_F173E01.mp4")], twice) == []


def test_a_file_name_that_two_files_share_is_not_used():
    rows = [{"id": "PSI-69/flex/33", "accession": "PSI-69", "label": "177R002"}]
    views = footage.rules()["PSI-69"]["views"]
    one = named("PSI-69_Raw Data__ISS_20091127_095908 177R002 Movie.mp4")
    assert len(footage.match("PSI-69", views, [one], rows)) == 1
    assert footage.match("PSI-69", views, [one, dict(one)], rows) == []


def test_a_folder_listing_is_read_like_a_file_list():
    listing = {"files": [{"key": "psi-data/PSI-69/Raw Data/", "files": [
        {"key": "psi-data/PSI-69/Raw Data/a Movie.mp4", "bytes_size": 12.0, "version": 3, "restricted": False, "visible": True, "files": []},
    ]}]}
    assert footage._flatten(listing) == [{"file_name": "a Movie.mp4", "file_size": 12.0, "version": 3, "restricted": False, "visible": True}]
