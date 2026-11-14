# PSI-100 Saffire-III: evidence pack, version 4

PSI's Saffire-III table gives the set-up of each sample. NASA's results per sample (burn time, burn length and flame spread rate in orbit, burn length and spread rate at 1 g, oxygen during the burn) are not in any PSI file: they are in Table 1 of two NASA Glenn presentations that are public on NTRS. This pack copies that table, the outcomes NASA states in words, NASA's findings, and the science channels of each sample's sensor workbook as curves (version 4; CO2 and pressure since version 1).

It holds 25 claims on 2 tests, 5 findings, 1 new 0g/1g pair(s) and 9062 curve points. Nothing is derived or estimated.

| Variable | Claims |
|---|---|
| `sample_width_cm` | 2 |
| `sample_thickness_mm` | 2 |
| `sample_length_cm` | 2 |
| `flow_speed_cm_s` | 2 |
| `flow_direction` | 2 |
| `o2_fraction` | 2 |
| `igniter_power_w` | 2 |
| `ignition_time_s` | 2 |
| `burn_time_s` | 2 |
| `burn_length_cm` | 2 |
| `spread_rate_mm_s` | 2 |
| `pressure_kpa` | 2 |
| `burn_length_1g_cm` | 1 |

## Scoreboard

Counted with the loader's `scoreboard()` on records rebuilt from `known_tests.csv` (this pack alone); the loader raised 10 quality findings.

| Count | Before | After |
|---|---|---|
| solid-fuel tests | 380 | 380 |
| with oxygen | 140 | 142 |
| with air speed | 251 | 251 |
| with oxygen and air speed | 132 | 134 |
| with oxygen, air speed and what happened | 11 | 13 |
| with a pressure NASA states | 0 | 2 |

Quality findings the loader would raise (each is a second NASA statement that disagrees with PSI's table):

- Sample S1, Sample width: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 40.6 cm (p. 30, Table 1, row III-1, column Width). The table's value is the one used.
- Sample S1, Sample thickness: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 0.37 mm (p. 30, Table 1, row III-1, column Thickness). The table's value is the one used.
- Sample S1, Sample length: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 94 cm (p. 30, Table 1, row III-1, column Length). The table's value is the one used.
- Sample S1, Flow speed: the experimental table gives 30 cm/s; NASA's file NTRS-20180005168.pdf gives 25 cm/s (p. 30, Table 1, row III-1, column Flow). The table's value is the one used.
- Sample S1, Flow direction: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives "concurrent" (p. 30, Table 1, row III-1, column Direction). The table's value is the one used.
- Sample S2, Sample width: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 40.6 cm (p. 30, Table 1, row III-2, column Width). The table's value is the one used.
- Sample S2, Sample thickness: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 0.37 mm (p. 30, Table 1, row III-2, column Thickness). The table's value is the one used.
- Sample S2, Sample length: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 10 cm (p. 30, Table 1, row III-2, column Length). The table's value is the one used.
- Sample S2, Flow speed: the experimental table gives 30 cm/s; NASA's file NTRS-20180005168.pdf gives 25 cm/s (p. 30, Table 1, row III-2, column Flow). The table's value is the one used.
- Sample S2, Flow direction: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives "opposed" (p. 30, Table 1, row III-2, column Direction). The table's value is the one used.


## Sources

| id | File | Kind | Bytes | On disk |
|---|---|---|---|---|
| S1 | `PSI-100_Experimental table_SAFFIRE-3.csv` | experimental_table | 239 | kept |
| ASGSR | `NTRS-20180005168.pdf` | publication | 9049169 | deleted after reading (checksum in manifest.json) |
| R1 | `PSI-100_Raw Data_Saffire III Sample 1 Sensors.xlsx` | raw_log | 22548166 | kept |
| R2 | `PSI-100_Raw Data_Saffire III Sample 2 Sensors.xlsx` | raw_log | 5361279 | kept |

`ICES` is NTRS 20170008805, "Results of Large-Scale Spacecraft Flammability Tests", NASA Glenn presentation, ICES 2017, Charleston SC, 16 July 2017 (GRC-E-DAA-TN44517). `ASGSR` is NTRS 20180005168, "Saffire: A Novel Approach to Study of Spacecraft Fire Safety Using Un-Manned Spacecraft", NASA Glenn presentation, American Society for Gravitational and Space Research, 25 October 2017 (GRC-E-DAA-TN48184). Their `psi_path` is the NTRS download address. Both are NASA Glenn presentations (authors Ferkul, Olson, Urban, Ruff, Easton and others) marked public use permitted. The PSI listing's "SAFFIRE_47th I Con of Env Sys presentation.pdf" is probably the same ICES 2017 talk, but PSI does not serve it, and its listed size (5,224,988 bytes) differs from the NTRS file, so it is not assumed to be the same file.

## What each file holds

- **PSI experimental table** (`S1`): set-up per sample; read only for the join. Already loaded by the web side.
- **ICES, p. 29, Table I** (Saffire-I and -II, samples 1-1 to 2-9) and **ASGSR, pp. 30 to 31, Table 1** (the same rows plus Saffire-III, 3-1 and 3-2): columns Sample, Material, Width, Thickness, Length, Flow, Direction, Δ %O2; then Ignition Power, Ignition Time, Burn Duration, µ-g Burn Length, µ-g Spread Rate, 1-g Burn Length, 1-g Spread Rate. The ICES table carries footnotes i to iv; the ASGSR table prints the markers but not the notes. Both are text in the PDF, not pictures, so no value was read from an image.
- **ICES pp. 8 to 26 and ASGSR pp. 16 to 25**: results in words (findings below).
- **Sensor workbooks** (`R1`...): 10 sheets that are charts only, and one sheet "Calibrated Data": row 1 names, row 2 units, then one row per about 33 ms: Elapsed Time (s) (a formula on the epoch time; its cached value is used), Epoch Time, Timestamp, Index, Average Fan Speed (RPM), CO2 (%), O2 (%), Anemometer 1 and 2 (cm/sec), Ambient Pressure (PSIA), Radiometer 1 to 4 (mw/cm^2), Humidity (%), Test Section Inlet Temp, Plume Temp 1 to 6 (TC1 to TC6), Sample Temp 1 to 6 (TC7 to TC12) (Degrees C), Radiometer Temps, Igniter Current (Amps) and Voltage, avionics voltages and temperatures, and command flags. The sheet's stated range runs to row 32601, but only the rows with a time are data.

| Sample | Workbook | Rows used for the curves |
|---|---|---|
| 3-1 | `PSI-100_Raw Data_Saffire III Sample 1 Sensors.xlsx` | 20909 rows from 6-4-2017 5:13:31.148 PM to 6-4-2017 5:25:01.112 PM (t = 0 to 690.0 s); k = 105, 200 points; igniter current above 0.5 A from t = 60.0 to 68.0 s; O2 sensor 19.76% at the start |
| 3-2 | `PSI-100_Raw Data_Saffire III Sample 2 Sensors.xlsx` | 4848 rows from 6-4-2017 5:10:16.104 PM to 6-4-2017 5:12:56.055 PM (t = 0 to 160.0 s); k = 25, 194 points; igniter current above 0.5 A from t = 60.0 to 68.0 s; O2 sensor 19.78% at the start |

## Reading rules

- A table line is written out in full in a script and must be found in the PDF's page text (whitespace collapsed) or the build stops. It is the claim's `quote`; the cell is `original_text`.
- Units are taken from the cell (`cm`, `mm`, `cm/s`, `W`, `s`, `mm/s`). Thickness in cm ("1 cm" for 2-9) is converted to mm. Oxygen percent is divided by 100; "21.7 to 21.5" becomes 0.215 to 0.217 (`value_num` to `value_max`).
- "~" (about) is kept in `original_text` and noted; the number is claimed. "~ 0" in a burn-length column is claimed as 0 cm: NASA states that about nothing burned. It is not a missing value.
- Not claimed: words in a number column ("Insignificant", "Complete", "~ Complete", "Acceleratory", "n/a", "Note (iv)", "See Fig. 5"), Material (names differ from the site's), cells that mix two materials (sample 2-7), and the "~ 10 cm iii" burn lengths of 2-8 and 2-9, which footnote iii says are the length visibly damaged.
- `ignited` and `end_mode` only where NASA's sentence says it of an identifiable sample: the claims and their sentences are in `CONTEXT` in the script. The silicone sentence ("a tiny gas phase flame remained but did not spread and quickly extinguished") gives `end_mode` = `self-extinguished` for 2-1 to 2-4; it gives no `ignited` claim because NASA does not say a flame was established. For Saffire-I sample 1 NASA says the air flow was shut off and the flame went out at once: `end_mode` = `flow terminated`.
- Curves: CO2 and Ambient Pressure of the sheet "Calibrated Data", thinning rule: every k-th data row of sheet 'Calibrated Data', starting with the first (row 3), k = ceil(N/200) where N is the number of data rows; values copied, never averaged. CO2 % / 100 gives `co2_fraction` (NASA's own figure captions for Saffire-III call it "Carbon dioxide vol-%"); PSIA x 6.894757293168 gives `pressure_kpa`. `t_s` is NASA's Elapsed Time (s), which starts at the first row of the sample's record, not at ignition; the igniter-on times in the table above (our reading of the Igniter Current column, threshold 0.5 A) are given only to help read the curves and are not claims.
- Version 4 adds every science channel that has a unit in row 2 (list in "Sensor curves (version 4)"). The O2 sensor column is now a curve (`o2_fraction`, % / 100). Note that NASA's tables say the oxygen they report was "Derived from measured CO2 production and referenced to initial O2 concentration reported by ISS" (footnote i), and the O2 sensor's level can disagree with it (for example 19.78% at the start of Saffire-III sample 2, where Table 1 gives 21.2 to 21.0). The curve is the sensor's reading, not NASA's tabulated oxygen; the two are not the same quantity. Fan speed, igniter, avionics, radiometer body temperatures and command flags are not used.
- Every channel has its own variable, one per sensor position (Anemometer 1 and 2, Radiometer 1 to 4, TC1 to TC12), declared in `new_variables.csv` with NASA's row-1 header and row-2 unit as the definition quote. A cell that is empty or not a number gives no point.

## Sensor curves (version 4)

| NASA row-1 header | NASA row-2 unit | Variable | Site unit | Points in this pack (all tests) |
|---|---|---|---|---|
| O2 | % | `o2_fraction` | fraction (x 0.01) | 394 |
| Anemometer 1 | cm/sec | `saffire_anemometer_1_cm_s` | cm/s | 394 |
| Anemometer 2 | cm/sec | `saffire_anemometer_2_cm_s` | cm/s | 394 |
| Radiometer 1 | mw/cm^2 | `saffire_radiometer_1_mw_cm2` | mW/cm² | 394 |
| Radiometer 2 | mw/cm^2 | `saffire_radiometer_2_mw_cm2` | mW/cm² | 394 |
| Radiometer 3 | mw/cm^2 | `saffire_radiometer_3_mw_cm2` | mW/cm² | 394 |
| Radiometer 4 | mw/cm^2 | `saffire_radiometer_4_mw_cm2` | mW/cm² | 394 |
| Humidity | % | `saffire_humidity_pct` | % | 394 |
| Test Section Inlet Temp | Degrees C | `saffire_inlet_temp_c` | °C | 394 |
| Plume Temp 1 (TC1) | Degrees C | `saffire_plume_temp_tc1_c` | °C | 394 |
| Plume Temp 2 (TC2) | Degrees C | `saffire_plume_temp_tc2_c` | °C | 394 |
| Plume Temp 3 (TC3) | Degrees C | `saffire_plume_temp_tc3_c` | °C | 394 |
| Plume Temp 4 (TC4) | Degrees C | `saffire_plume_temp_tc4_c` | °C | 394 |
| Plume Temp 5 (TC5) | Degrees C | `saffire_plume_temp_tc5_c` | °C | 394 |
| Plume Temp 6 (TC6) | Degrees C | `saffire_plume_temp_tc6_c` | °C | 394 |
| Sample Temp 1 (TC7) | Degrees C | `saffire_sample_temp_tc7_c` | °C | 394 |
| Sample Temp 2 (TC8) | Degrees C | `saffire_sample_temp_tc8_c` | °C | 394 |
| Sample Temp 3 (TC9) | Degrees C | `saffire_sample_temp_tc9_c` | °C | 394 |
| Sample Temp 4 (TC10) | Degrees C | `saffire_sample_temp_tc10_c` | °C | 394 |
| Sample Temp 5 (TC11) | Degrees C | `saffire_sample_temp_tc11_c` | °C | 394 |
| Sample Temp 6 (TC12) | Degrees C | `saffire_sample_temp_tc12_c` | °C | 394 |

9062 curve points on 2 tests in all. At most 200 points per test per variable, by the rule: every k-th data row of sheet 'Calibrated Data', starting with the first (row 3), k = ceil(N/200) where N is the number of data rows; values copied, never averaged.

No channel was missing from any workbook used.

A cell that is empty or not a number gives no point, so a channel can have fewer points than CO2 on a test. New validator warnings: none expected from these curves; any warning is quoted under Validator warnings.

## Claims not made, and why

- 3-1 1-g Burn Length "Complete" (ASGSR): not a number in the column's unit; not claimed.
- 3-1 1-g Spread Rate "Acceleratory" (ASGSR): not a number in the column's unit; not claimed.
- 3-2 1-g Spread Rate "n/a" (ASGSR): not a number in the column's unit; not claimed.

## Findings

- F1 (ASGSR p. 16): Saffire-III concurrent burn: burn time
- F2 (ASGSR p. 16): Burn times of Saffire-I and -III are in the inverse ratio of their flame speeds (NASA's next line: flame speed proportional to air flow, Saffire-III 25 cm/s, Saffire-I 20 cm/s)
- F3 (ASGSR p. 18): Steady flame spread over a large thin charring fabric in low gravity, unlike at 1 g
- F4 (ASGSR p. 18): Concurrent spread depends on the flow duct size more than expected
- F5 (ASGSR p. 20): Concurrent flames reach a steady spread rate; the rate depends strongly on duct size

## Pairs (same sample at 0 g and 1 g)

- P1: 3-2, burn length 10 cm in orbit, 0 cm at 1 g (ASGSR p. 31, Table 1 (continued), row 3-2, columns µ-g Burn Length and 1-g Burn Length)

The Saffire-II rows of the same table hold the 9 pairs the site already has (from PSI's table); they are not added again.

## What could not be done, and why

- **Flame position against time (job 5).** No PSI or NTRS file found gives it as numbers. Both presentations show it only as plots (ICES p. 20, ASGSR p. 17, "Measurements of flame base (up stream), pyrolysis tip (downstream), and pyrolysis length"). By rule 7 nothing is read off a plot. So there is no position curve and no fitted spread rate; the spread rates here are NASA's own.
- **PSI's three ICES presentations** (`SAFFIRE_45 I Con of Env Sys presentation.pdf`, `46th`, `47th`) return HTTP 404 from PSI under PSI-99 and PSI-100. **Saffire-I:** `Saffire I Sample 1 TM graphs.docx`, `Saffire-I Telemetry Data Good Process Version.xlsx` and `SFSDP-VIS-0295_Saffire 1 and 3_Thermocouple Placement.pdf` return 404 too. `Saffire-I Sample 1 Sensor Data Complete TM graphs.xlsx` returned 404 but was served, so version 2 adds sample 1's curves and pressure.
- **`SAFFIRE-1_ImageDataTotals_master.xlsx`**, named in the brief, is not in PSI's listing of PSI-98 (or of PSI-99 or PSI-100) nor in `catalogue/files.csv`.
- **Flame arrival at the sample thermocouples** would give a spread rate from PSI's own data, but the thermocouple positions are in the placement drawing PSI does not serve, and it would be our derivation. Not attempted.

## What in the data brief the files prove wrong

- Job 5 asks for flame position against time from the "MergeResult" workbooks: those are lists of camera frames. `SAFFIRE-II_MergeResult-jpeg_v5_Final.xlsx` is the same kind of file: sheets "Received - jpeg", "BIT - jpeg", "PreFlowVis - jpeg", "PostFlowVis - jpeg", "Sample1 - jpeg" to "Sample9 - jpeg", with columns EpochTime, Time delta, Jpeg File ID (hex/decimal), Jpeg File Name, Sn Received, Jpeg File size (bytes), Zip File ID, Zip File Name, Zip File size (bytes). No flame data.
- The brief names `SAFFIRE-1_ImageDataTotals_master.xlsx`; PSI does not list it.
- The brief's "Saffire readme" has no results: both readmes describe the image sets and the sensors only.
- Disagreements with PSI's tables, shown side by side by the loader:
  - Air speed: PSI's table gives 30 cm/s for both samples; the ASGSR presentation gives 25 cm/s (Table 1, and "Saffire-III (25 cm/s)" on p. 16). The validator warns on these claims; both values are kept.
  - Thickness: PSI's table gives ".33 cm"; the presentation gives 0.37 mm.
  - Burn time of sample 1: 300 s in Table 1 (p. 31); "Saffire-III burned for 320 sec." on p. 16 (a finding).
  - PSI's Saffire-III table has no oxygen, igniter, burn time, burn length or spread rate; this pack gives all of them from Table 1.

## Validator warnings

- `WARNING  claims.csv line 5 (C4): differs from the value already held (30); both will be shown, so check the source once more`
- `WARNING  claims.csv line 11 (C10): differs from the value already held (30); both will be shown, so check the source once more`

Warnings on air speed or oxygen are claims that differ from PSI's table: the air speed (25 cm/s in the presentation, 30 in PSI's table). The reasons are under "What in the data brief the files prove wrong" above. Both values are kept and the loader will list each case as a quality finding.

## Reproduction

- ASGSR p. 16: "Saffire-III burned for 320 sec." Table 1 row 3-1 gives ['300'] s: not the same; the 20 s gap is reported, nothing is adjusted.
- ASGSR p. 16: burn times are in inverse ratio to the flame speed, and flame speed is proportional to air speed. With Table 1: 1.8 mm/s at 20 cm/s (1-1) and 2.3 mm/s at 25 cm/s (3-1), ratio 1.28 against 1.25 for the air speeds; burn times 420 s and 300 s, ratio 1.40. Using the slide's own times (400 and 320 s) the ratio is 1.25. So the slide's statement holds for its own times and for the spread rates, not for the table's burn times.
