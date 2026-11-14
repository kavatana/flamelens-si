# PSI-159 CFI-G: evidence pack, version 3 (findings, curves and PMT gain settings)

**For the web side:** PMT values above 4 are above NASA's stated 0 to 4 µA range and are probably saturated; show them marked, not as a true intensity. Count of curve points above 4 in this pack: `acme_pmt_oh_ua` (PMT1) 29555 of 65092; `acme_pmt_ch_ua` (PMT3) 29712 of 65092.

PSI's CFI-G table already gives each test's conditions, and the per-test CSV files are instrument logs with no result per test (`work/acme_csv_sample.md`). What the site lacked is what NASA concluded. This pack adds 4 results NASA states in words, from a NASA report on NTRS, which the brief allows as a source:

- S1: NTRS 20220005205, Dennis P. Stocker (NASA Glenn Research Center), "Laminar Non-Premixed Flames of Gaseous Fuel Aboard the International Space Station", 2022 Spring Technical Meeting of the Central States Section of the Combustion Institute. `psi_path` is its NTRS address; its page text is kept as `NTRS-20220005205.pdf.pages.json`.

The paper names no test, so no finding is tied to a test; the tests, claims and curves come from the instrument logs (see Curves, below). Each quote is cut word for word from the page text (a script; the build stops if a snippet is not found). Where a finding has a number, it is NASA's, with the bound or conversion stated.

## Findings

- F1, p. 8: Gaseous cool flames were discovered on the ISS with n-butane.
- F2, p. 8: Cool flames are much smaller than the matching hot flames.
- F3, p. 8: Why CFI-G: non-premixed cool flames were first found with droplets on the ISS in 2012.
- F4, p. 8: Scope: over 1,500 flames were lit for the six ACME experiments, November 2017 to February 2022.

## Leads, not used

- NTRS 20210021781, "Recent Research on Flames of Gaseous Fuel Aboard the International Space Station" (JASMAC 2021), an earlier overview of the same work.
- The investigators' journal papers listed in the overview's references; not copied (the data brief: journal papers are leads only).

## Validator warnings

None.


## Curves (version 2)

Version 2 adds curves from the per-test-point instrument logs (`<test point>_data.csv`, folder Raw Data). The findings above are unchanged. 338 logs were downloaded (all that catalogue/files.csv lists for PSI-159), kept in `work/PSI-159/raw/` with checksums in `manifest.json`. The pack lists the 328 logs used as sources of kind `raw_log` and the 328 tests they belong to in `tests.csv` (`is_new` 0). The site holds 333 tests for CFI-G; 5 have no usable log.

- Each log is matched to a held test by its test point, from the file name and the set-up line's `Test Point:`, comparing labels with spaces removed. The two must agree and match exactly one held test, and the test must have exactly one log.
- `t_s` is the seconds from the first data row, parsed from the Time column (`HH:MM:SS:mmm`).
- Thinning: every k-th data row of the file, from the first data row, k = ceil(N/200) where N is the number of data rows; values copied, never averaged. Every variable of a test uses the same rows. a script re-reads every point from the log by its locator (`row N, column <header>`).
- Code: a script and a script, called by a script.

### Chamber pressure (PTA3): gate

NASA's description of the log columns (S2, p. 5) says PTA3, "Chamber pressure", has a 0.5 to 4.5 V signal "Converted in flight software to 0 to 145 psia" but does not say whether the CSV holds volts or psia. The gate, fixed before looking at the numbers: add `pressure_kpa` only if the mean PTA3 of a log equals PSI's own mean pressure x 14.6959 psia within 2% for at least 95% of the test points that have one.

- PSI's CFI-G table has no mean chamber pressure (`pmean`); it gives only `approx p (bar)`, a rounded set-point figure. The gate cannot be run for this pack: 0 test points compared.
- Result: no pressure curve is added.
- For information only: against `approx p (bar)` x 14.5038 psia, the mean PTA3 read as psia is within 2% for 0 of 328 test points; read as volts and converted with NASA's formula, 38 of 328.

### Photomultiplier tubes (PMT): channels added

NASA identifies the channels in two of its documents:

- S2 (the file description, `psi_path` /Home/psi-data/PSI-20/Science Documents/PSI-20_Science Documents_ACME_non-imaging_data_file_description.pdf), p. 5: PMT1 "Looks through a 310 nm bandpass interference filter"; p. 6: PMT3 "Looks through a 430 nm bandpass interference filter"; PMT2 "Looks through a UV neutral density filter Broadband". Each: "0 to 4 µA. Current (µA) = Voltage * 1."
- S3 (ACME Engineering Implementation Report, `psi_path` /Home/psi-data/PSI-10/Engineering Documents/PSI-10_Engineering Documents_ACME Engineering Implementation Rpt..pdf), p. 11: "but one will have a 310-nm bandpass filter and another will have a 430-nm bandpass filter (where both are with a 10-nm FWHM). The pair of detectors will enable measurement of OH* and CH* emission, respectively." On p. 17 it says two are equipped with narrow bandpass filters "for measurement of OH* and CH* emissions, respectively".
- So PMT1 (310 nm) is the OH* channel and PMT3 (430 nm) the CH* channel. The pairing follows the order in S3 ("310 ... 430 ... OH* and CH*, respectively"). S3 is written in the future tense ("will"), and the SI tool made the pairing from it, so a person should confirm it. PMT2 (broadband, neutral density filter) is not added: NASA names no species for it.
- New variables `acme_pmt_oh_ua` and `acme_pmt_ch_ua`, unit µA, each with both NASA quotes in `new_variables.csv`. value_num is the log's number as written (NASA: Current (µA) = Voltage x 1).
- **The PMT gain differs per test point.** It is in each log's set-up line, and the values in the 328 logs used are: PMT 1 Gain: 4.500000, 5.000000, 5.500000, 6.000000, 8.000000, 10.000000; PMT 2 Gain: 5.000000, 5.500000, 6.000000, 6.500000, 6.750000, 7.000000, 8.000000, 10.000000; PMT 3 Gain: 5.000000, 5.500000, 6.000000, 6.500000, 8.000000, 10.000000. Currents of test points with different gains are not comparable without the gain table (S2, Table 3), which this pack does not apply.
- NASA gives the signal range as 0 to 4 µA. Curve points above 4: PMT1 29555, PMT3 29712 (saturated or out of range; copied as stored, not removed).

### Points

- `acme_pmt_ch_ua`: 65092 points (CH*, from PMT3)
- `acme_pmt_oh_ua`: 65092 points (OH*, from PMT1)
- Tests with curves: 328. Points per test and variable: 191 to 200 (at most 200).
- Total curve points in this pack: 130184.

### Logs not used

- PSI-159_Raw Data_21106A1_data.csv: test point 21106A1 matches 0 held tests
- PSI-159_Raw Data_21106A2_data.csv: test point 21106A2 matches 0 held tests
- PSI-159_Raw Data_21106A3_data.csv: test point 21106A3 matches 0 held tests
- PSI-159_Raw Data_21106G1_data.csv: test point 21106G1 matches 0 held tests
- PSI-159_Raw Data_21106G2_data.csv: test point 21106G2 matches 0 held tests
- PSI-159_Raw Data_21106G3_data.csv: test point 21106G3 matches 0 held tests
- PSI-159_Raw Data_21106G4_data.csv: test point 21106G4 matches 0 held tests
- PSI-159_Raw Data_21106G5_data.csv: test point 21106G5 matches 0 held tests
- PSI-159_Raw Data_21106G8_data.csv: test point 21106G8 matches 0 held tests
- PSI-159_Raw Data_21242F1_data.csv: test point 21242F1 matches 0 held tests

## PMT gain settings (version 3)

NASA says each PMT reading "Depends on PMT1_GAIN, Table 3" (PMT3: "Depends on PMT3_GAIN, Table 3"), and the gain differs between test points, so each test with curves also gets its two gain settings as claims.

- New variables `acme_pmt1_gain` and `acme_pmt3_gain` (kind number, unit empty, group setting), defined with NASA's own words for PMT1_GAIN (S2, p. 12) and PMT3_GAIN (S2, p. 13), in Table 3 (DNx-AO-333 board signals).
- 656 claims, basis `set_point`, quality `reported`: 328 tests x 2 gains. Each takes the number as the log's set-up line writes it (`original_text`, e.g. `PMT 1 Gain: 5.500000`); the quote is that whole line, exactly; the locator `row 0, column <that text>` is the position in the set-up line, which is line 1 of the file, above the column header (the number is the claim's value).
- Distinct gain values: PMT1: 4.5, 5, 5.5, 6, 8, 10; PMT3: 5, 5.5, 6, 6.5, 8, 10.
- NASA's stated signal range for these outputs is 4.63 to 10 V ("Gain range is 5x10^3 to 3.5x10^6 ... Gain=2x10^6 * (Output voltage/9.2645)^8.643856"). The set-up line gives a bare number between 4 and 10, some below 4.63, so it is probably the output (control) voltage, not the gain itself; the pack does not convert it. A person should confirm this reading.
- A log's set-up line is one line, so a change of gain during the run cannot be seen from it. A log is left without gain claims if its set-up line is not line 1 of the file, or if the file mentions a PMT gain on any other line, or if either gain is missing.
- Logs with no usable gain line: none.
