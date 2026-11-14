# PSI-69 FLEX: evidence pack, version 3

PSI's FLEX table already gives every test its conditions and results. Its columns are those of Table IX of NASA's own FLEX report, NASA/TP-2015-216046, "Detailed Results From the Flame Extinguishment Experiment (FLEX) March 2009 to December 2011" (Dietrich, Ferkul, Bryg, Nayagam, Hicks, Williams, Dryer, Shaw, Choi, Avedisian; NTRS 20150023456). The brief allows a NASA report on NTRS as a source. This pack copies Table IX as a **second witness** for each test, and adds what the report says about the quality of the data, which PSI's table does not.

It holds 2367 claims on 276 tests and 10 findings. 2 tests are new: NASA's report has them and PSI's table does not (N03H201 (FLEX-216), H01H103 (FLEX-230); why, in each test's `matched_by`). No value is derived or assumed; the only arithmetic is mmHg to kPa for the new tests' pressure.

| Variable | Claims |
|---|---|
| `ambient_temperature_c` | 271 |
| `burn_time_s` | 268 |
| `burning_rate_mm2_s` | 260 |
| `co2_fraction` | 2 |
| `description` | 271 |
| `end_mode` | 276 |
| `extinction_diameter_mm` | 198 |
| `fiber_supported` | 271 |
| `fuel` | 2 |
| `he_fraction` | 2 |
| `n2_fraction` | 2 |
| `o2_fraction` | 276 |
| `pressure_kpa` | 2 |
| `size_mm` | 264 |
| `test_date` | 2 |

## Does NASA's report agree with PSI's table?

**PSI's FLEX test numbers differ from NASA's for 119 tests.** The FLEX identifier (for example `C03H401`) is the same in both, and so are all the results, but the number in PSI's "FLEX Test #" column is not the number NASA's report gives the same test. For example: FLEX-157 C03H401, FLEX Test #: NASA's report "157", PSI's table "156"; FLEX-158 C05M101, FLEX Test #: NASA's report "158", PSI's table "157"; FLEX-159 C05M201, FLEX Test #: NASA's report "159", PSI's table "158". The full list is in `work/PSI-69/numbering.csv`. The site should key FLEX tests on the identifier, not the number.

Every Table IX column was compared with PSI's FLEX table for the 274 tests found in both: 3836 cells, of which **3717 agree** and 119 differ: 119 test numbers (above) and 0 other cells (below). Numbers are compared as numbers (".21" equals "0.21"), dates by day, month and year.

- No other cell differs.

Pressure is compared here in mmHg but not claimed: the site stores it in kPa rounded to 0.01, and an exact conversion of the same number would show as a disagreement in every test.

## How Table IX was read

- Pages 26 to 34 of the report's text. Each row is found as one run of text: FLEX test number, FLEX identifier, date, GMT, fuel, pressure (mmHg), O2, N2, CO2 and He mole fractions, initial droplet diameter, extinction diameter, burning rate, burn time, test end. "–" means no value; no claim is made for it.
- Rows read: 276 (FLEX-001 to FLEX-280). Table IX has no row numbered FLEX-156, FLEX-205, FLEX-213, FLEX-228; those numbers are not in the report's text at all.
- Matched to the site's test by FLEX identifier, which is unique in both tables: 274. The FLEX test number is compared as a column, not used to match, because PSI's numbering differs from NASA's (above). Not in PSI's table, so new tests: N03H201 (FLEX-216), H01H103 (FLEX-230). 
- "Test end" uses the site's words: Extinction is `extinction`, Disruption is `disruption`, Completion is `burned to completion`.
- Each claim's `quote` is the whole Table IX row, and `original_text` the cell as printed.

## Histories and test sheets (version 2)

NASA's FLEX report says its droplet and flame size histories "are also available electronically as text files" (p. 22). PSI holds them per test: `FLEX-nnn_DropletData.txt`, `_LLUVData.txt`, `_ColorCamData.txt`, and a `_TestSheet.txt`. The FLEX number in the file name is NASA's test number, the same as in Table IX, so each file goes to the test that Table IX row was matched to; each test sheet's "CIR Test Number" was also checked against Table IX's identifier.

| Curve | NASA column | Variable | Tests | Points |
|---|---|---|---|---|
| Droplet diameter | `DropletDiameter_mm` against `DropletTime_sec` | `droplet_diameter_mm` | 260 | 41,491 |
| Flame diameter, OH (LLUV) camera | `LLUVFlameDiameter_mm` against `LLUVTime_sec` | `flame_diameter_oh_mm` | 258 | 36,020 |
| Flame diameter, colour camera | `ColorCamFlameDiameter_mm` against `ColorCamTime_sec` | `flame_diameter_visible_mm` | 216 | 28,964 |

106,475 points in all. Thinning: every k-th data row of the file, from the first data row, k = ceil(N/200) where N is the number of data rows; values copied, never averaged; a kept row with an empty cell gives no point. Times are NASA's, in seconds, and can be negative (before the igniters withdrew). The two flame diameters are kept apart because NASA states the colour camera reads about three-quarters of the OH camera (finding F8). The new variables are defined in NASA's words from the report (pp. 22 and 25). a script re-read every point from its file.

From the 271 test sheets matched: `ambient_temperature_c` (271, NASA's K minus 273.15), `fiber_supported` (271), and `description` (271), NASA's own paragraph about each burn, word for word.

Files not used: PSI-69_Raw Data_FLEX-128_TestSheet.txt: CIR test number C13M301, Table IX gives C13M401.

## Uncertainty and radiometers (version 3)

- **Droplet size uncertainty.** NASA states: "As a result, we estimated the uncertainty in the droplet size to be ±50 µm." (p. p. 25; the same page gives the camera's "minimum spatial resolution was ±29.5 µm"). It is attached as `uncertainty` = 0.05 (mm) to the 462 `size_mm` and `extinction_diameter_mm` claims, with the sentence in `uncertainty_basis`. Both are droplet sizes from the same HiBMs images. No uncertainty is attached to `burning_rate_mm2_s` or `burn_time_s`: the report gives no number for them. NASA's flame-size uncertainties (±200 µm for the OH camera, ±250 µm for the colour camera, p. 15) apply to the flame-diameter curves; `series.csv` has no uncertainty column, so they are stated here for the site to show beside those curves.
- **Radiometers: not used.** PSI holds a radiometer file for most FLEX tests (322 files, 100 narrow-band and 100 wide-band samples per row). 254 of the 317 distinct files give no unit in their headers, and no NASA document gives a unit or calibration. NASA's report says: "these radiometers were not sensitive enough to provide reliable quantitative information about flame radiometric output, so the data are not reported" (p. 10). It is added as a finding; no radiometer curve is made. Details: `work/flex_radiometer/`.

## NASA's findings in words

The report states that it does not interpret the results ("The intent is not to interpret the experimental results but rather to make them available", p. 7). Its findings are about the data:

- F1, p. 22: FLEX fuel needles were coated, and the coating could get into the droplets. Tied to 274 tests.
- F2, p. 23: Contamination: burning-rate constants and droplet histories minimally affected. Tied to 274 tests.
- F3, p. 23: Contamination: methanol droplets that ended in disruption probably did so because of the contaminant. Tied to 23 tests.
- F4, p. 23: Contamination: heptane disruption may be due to the contaminant; no conclusion can be drawn. Tied to 38 tests.
- F5, p. 23: Contamination: methanol extinction diameters (diffusive extinction) minimally affected.
- F6, p. 23: Contamination: radiative extinction diameters (the larger ones) not affected.
- F7, p. 22: Droplet sizes during ignition are uncertain, most of all in FLEX-001 to FLEX-009. Tied to 9 tests.
- F8, p. 22: Flame diameter seen by the colour camera is about three-quarters of that seen by the OH (LLUV) camera.
- F9, p. 23: FLEX scope: methanol and n-heptane droplets 2 to 5 mm, 0.70 to 3.05 atm, more than 100 useful burns.
- F10, p. 10: FLEX radiometer data were not sensitive enough to be reliable, so NASA does not report them (version 3). Tied to 274 tests.

**For the web side:** F3 matters for the site. NASA says the methanol tests that ended in disruption probably did so because the fuel was contaminated, not because of the flame. Those tests' `end_mode` = `disruption` is what happened, but it is not a property of clean methanol. F4 says the same may hold for heptane.

## Scoreboard

Counted with the loader's own `scoreboard()` in `packs.py`. FLEX is a droplet experiment, so the solid-fuel counts do not change.

evidence pack pack (PSI-69): 276 tests, 2 of them new
    ambient_temperature_c: 271 tests gained a value
    fiber_supported: 271 tests gained a value
    description: 271 tests gained a value
    test_date: 2 tests gained a value
    fuel: 2 tests gained a value
    pressure_kpa: 2 tests gained a value
    o2_fraction: 2 tests gained a value
    n2_fraction: 2 tests gained a value
    co2_fraction: 2 tests gained a value
    he_fraction: 2 tests gained a value
    size_mm: 2 tests gained a value
    burning_rate_mm2_s: 2 tests gained a value
    burn_time_s: 2 tests gained a value
    end_mode: 2 tests gained a value
    extinction_diameter_mm: 1 tests gained a value
    disagreements with the table: 1257
    values that confirm the table: 274
    kept for later use: 106475 rows of series, 10 rows of findings
scoreboard, before and after the packs:
    solid-fuel tests: 380 -> 380
    with oxygen: 140 -> 140
    with air speed: 251 -> 251
    with oxygen and air speed: 132 -> 132
    with oxygen, air speed and what happened: 11 -> 11
    with a pressure NASA states: 0 -> 0

## Sources

| Id | File | Used for |
|---|---|---|
| S1 | NTRS 20150023456, NASA/TP-2015-216046 (`psi_path` is its NTRS address; page text kept as `NTRS-20150023456.pdf.pages.json`) | Every claim and finding |


## Validator warnings

None.

<!-- guide_findings:start -->
## NASA's Researcher's Guide (version 4)

Source G1: A Researcher's Guide to: Combustion Science (NASA ISS Program Science Office, 2015). The NASA Space Apps challenge page lists it under "NASA Data & Resources". PSI holds the same
file in the folders of PSI-20, PSI-21, PSI-22 and PSI-23; G1 points to the PSI-20 copy (1,532,064 bytes, sha256
`d85c92823f8917979df00e09e8e0ca40f42092a330ef30dcb8a8af34e7ee6bc0`). It has no test tables. a script cuts each sentence below word for word from the PDF's text
(PyMuPDF), from given first and last words, and stops if they are not found once on the stated page.

| Finding | Page | What it says |
|---|---|---|
| F11 | p. 12 | Flammability limits are lower in reduced gravity, so Earth's suppressant standards give less margin in space |
| F12 | p. 13 | What the FLEX experiments demonstrated |
| F13 | p. 33 | Large alkane droplets kept vaporizing after the visible flame went out, fed by a cool flame |
| F14 | p. 34 | A cool flame can burn for a long time after the hot flame goes out |

The SI tool chose the sentences. No person has checked them yet.

### Reproduction (Guide findings)

No Guide finding in this pack gives a number, so there is nothing to reproduce.

### Not used from the Guide, and why

- p. 21, BASS: "BASS tests the hypothesis that materials in microgravity, with adequate ventilation, burn as well if not better ...": a hypothesis, not a result.
- pp. 14-18, the five ACME experiments (BRE, CLD Flame, E-FIELD Flames, Flame Design, s-Flame): plans written before ACME flew, so no ACME result. The one exception is a sentence on what earlier research found, which is PSI-21's Guide finding. ACME's results are in the NTRS overview these packs already quote.
- pp. 12-15, FLEX-2 and SLICE (no pack): descriptions and purposes only, no results.
- pp. 34-35, Apollo 1 and Apollo 13: context, not a result. The web side can quote it on the site from p. 34.
- pp. 23-25, SoFIE and other planned investigations: plans.
- CFI, BASS-II, Saffire and the gas-flame experiment CFI-G are not named in the Guide.

- version 4 built by a script on top of the published version; a script and
  `validate_pack.py` were run before and after, with no new mismatch, error or warning.
<!-- guide_findings:end -->
