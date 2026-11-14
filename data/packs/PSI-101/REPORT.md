# PSI-101 SAME-R: evidence pack, version 5

Job 6 asks what a smoke detector would see. This pack answers it twice: per test, from NASA's combined results workbook (`PSI-101_Analyzed Data_SAME, SAME-R_Results.xlsx`), and per material, from the final report (`PSI-101_Reports_SAME-R_Final Report.pdf`, June 2014).

It holds 210 claims on 105 tests and 46 findings. Nothing is derived or assumed.


## Per-test claims

- `smoke_count_mean_diameter_um` from the column "M1/M0 (micro-m)--CMD", and `smoke_diameter_average_mass_um` from "Diameter of Average mass (micro-m)". Both are formulas in NASA's sheet; `original_text` is the formula and the value is the result the sheet stores. Empty, zero or text results give no claim.
- Tests marked "a" are the same smoke after aging, as in PSI's table.
- Not matched to a row, so no claim: Test 57 (Teflon): 0 matching rows in the sheet. PSI's table has two tests numbered 57 (Lampwick and Teflon); the sheet's flight-2 row 57 is the Lampwick test.

**Uncertainty (version 5).** The final report's sentence "The repeatability of the diameter measurements is estimated to be +/- 15%." closes the captions of Figure 6 (lampwick, p. 5), Figure 7 (Kapton) and Figure 8 (Teflon) (p. 6). Those figures plot the arithmetic mean diameter and the diameter of average mass against air velocity, the quantities of these claims (the report's Table 1 calls the first the count mean diameter, M1/M0; NASA's captions do not state that they are the same, so that identification is the pack's). So `uncertainty` on the 126 claims of the Lampwick, Kapton and Teflon tests holds 15% of the value, in micrometers, rounded to the value's own decimals (to two significant figures where that rounds to zero); `uncertainty_basis` quotes the sentence, file and page. The 84 claims on Silicone and Pyrell tests carry no uncertainty: no figure or sentence gives that repeatability for those two materials. The +/-12%, +/-25% and +/-30% figures on p. 24 are errors of the moment method and are not attached.

## Findings (from the final report)

- 20 numbers: Table 1 (pp. 4 and 5), for each material unaged and aged 720 s, the count mean diameter and the diameter of average mass, in micrometers.
- 20 numbers (version 3): Table 1 of the published SAME-2 paper on NTRS (20130000422: Urban, Ruff, Greenberg, Fischer, Meyer, Mulholland and others, "Particle Morphology and Size Results from the Smoke Aerosol Measurement Experiment-2", AIAA 2012-3536). The final report says its Table 1 section is "excerpts from the relevant part of the paper", but its numbers are not the paper's. Both sets are kept, each with its own source.
- 6 statements: Kapton and Teflon smoke is hard for light-scattering detectors to see; a detector needs particle-size discrimination; smoke particles are larger at low air flow; they grow with age; typical concentrations; repeatability +/- 15%.

## New variables

`smoke_count_mean_diameter_um` and `smoke_diameter_average_mass_um`, defined by the Table 1 headers of the report.

## Reproduction

Table 1 gives diameters "for baseline runs for each material". The mean of the unaged runs the workbook describes as "baseline", against Table 1:

| Material | Diameter | Runs | Mean of the workbook's runs (µm) | Final report Table 1 (µm) | Published paper Table 1 (µm) |
|---|---|---|---|---|---|
| Kapton | count_mean_diameter | 4 | 0.056 | 0.062 | 0.056 |
| Kapton | diameter_average_mass | 4 | 0.101 | 0.106 | 0.101 |
| Lampwick | count_mean_diameter | 4 | 0.129 | 0.142 | 0.128 |
| Lampwick | diameter_average_mass | 4 | 0.264 | 0.271 | 0.258 |
| Pyrell | count_mean_diameter | 4 | 0.208 | 0.227 | 0.204 |
| Pyrell | diameter_average_mass | 4 | 0.393 | 0.377 | 0.384 |
| Silicone | count_mean_diameter | 4 | 0.189 | 0.221 | 0.196 |
| Silicone | diameter_average_mass | 4 | 0.452 | 0.468 | 0.465 |
| Teflon | count_mean_diameter | 5 | 0.110 | 0.111 | 0.101 |
| Teflon | diameter_average_mass | 5 | 0.186 | 0.173 | 0.170 |

**Reproduces within NASA's stated repeatability.** All ten means lie within 15 percent of Table 1; the largest gap is Silicone's count mean diameter, 0.189 against 0.221 (14.5 percent). They are not equal: the report does not say which runs Table 1 averages or how, and the workbook's dated versions all agree with each other, so this pack does not adjust anything. Both are shown; NASA gives the repeatability of these diameters as +/- 15%.

**Three NASA versions of the same table.** Measured against the workbook's baseline means, the published paper's Table 1 is the closer of the two in 8 of 10 values; its largest gap is 8.7 percent, the final report's 17.0 percent (both relative to the workbook mean). The exceptions: Teflon count mean diameter, Teflon diameter average mass. NASA does not say why the report's numbers differ from the paper it quotes. For the site: the per-test claims come from the workbook, and both tables are findings with their sources, so a reader can see all three.

## Instrument curves (version 5)

**What was added.** 4868 curve points on 13 tests from 13 per-run analysed workbooks (.xls and one .xlsx). Points per variable over all tests: `ptrak_count_thousand_per_cm3` 170 (1 tests); `dusttrak_b_mass_mg_per_m3` 2349 (13 tests); `iss_detector_scatter_volts` 2349 (13 tests). Each test has at most 200 points per variable: every k-th data row of the run (k = ceil(N/200)), first row kept, values copied, never averaged. Version 4 had one test (run 57); its workbook is kept.

**Variables.** The same three as version 4, each defined by its header in NASA's sheet "Sheet used to Graph" (quoted in `new_variables.csv` with its cell): `ptrak_count_thousand_per_cm3` (header "PTrakMeasurement(PtPerCC)/1000 (Right Axis)"), `dusttrak_b_mass_mg_per_m3` ("DustTrakBMeasurement(MgPerM3) (Right Axis)") and `iss_detector_scatter_volts` ("ISSDetectorScatterMeasurement(Volts)"). Particle number, mass concentration and a smoke detector's reading; no housekeeping channels. The final report (pp. 75 to 77) says the P-Trak is the zeroth-moment (number) instrument, the DustTrak the third-moment (mass) instrument, and that space shuttle and ISS smoke detectors sat in the same duct.

**Read these as logged values.** No dilution ratio and no calibration is applied. The report (pp. 25, 26, 76) says the P-Trak and DustTrak readings need NASA's dilution ratios and per-material calibration; this sheet applies neither and neither does the pack. The ISS scatter column is NASA's absolute value of the logged (negative) channel, as the graph sheet defines it.

**Time.** `t_s` is the sheet's own column "Time" in "Sheet used to Graph", which NASA's formula computes as the logger's epoch time minus the first row's, so it is seconds from the run's first row. Only rows whose logger TestNumber equals the run number are used, and the graph sheet's repeated closing time stamps are dropped.

**Gates, applied to every workbook by a script.**
1. NASA defines it: header and unit are in the sheet (checked: columns A, C, G and I of the graph sheet carry the exact headers).
2. The right test: the file name gives material and run number, that fits exactly one test of the pack, and every nonzero TestNumber in the file's rows is that run number. The graph-sheet rows must line up with the logger rows (the ISS channel equals the absolute logger value on every used row).
3. Aged ("a") workbooks are left out, and so is any workbook whose rows span as long as NASA's net aging time of the run's aged twin in the pack (the rows may then run on into the aging hold; NASA's sheet and report do not say where the aged test starts, and the pack does not choose a split point).
4. A variable is left out of a test when its logger column is all zero over the run (instrument not in use) or holds the -999 no-reading code.
5. Re-check: a script re-reads every point from the downloaded workbook (result below).

**Workbooks used.**

| Test | Material | Workbook | Source | Rows | Run length (s) | Points per variable | Variables left out |
|---|---|---|---|---|---|---|---|
| Test 48 | silicone | `2010_197_13_silicon_run48.xls` | S4 | 926 | 1015 | 186, 186 | ptrak_count_thousand_per_cm3: the logger holds -999 (no reading) in some rows |
| Test 49 | lampwick | `2010_200_12_lampwick_run49.xls` | S5 | 834 | 933 | 167, 167 | ptrak_count_thousand_per_cm3: the logger holds -999 (no reading) in some rows |
| Test 50 | teflon | `2010_201_12_teflon_run50.xls` | S6 | 792 | 904 | 198, 198 | ptrak_count_thousand_per_cm3: the logger holds -999 (no reading) in some rows |
| Test 54 | lampwick | `2010_210_10_lampwick_run54.xls` | S7 | 1032 | 1033 | 172, 172 | ptrak_count_thousand_per_cm3: the logger holds -999 (no reading) in some rows |
| Test 56 | teflon | `2010_210_10_teflon_run56.xls` | S8 | 857 | 862 | 172, 172 | ptrak_count_thousand_per_cm3: the logger holds -999 (no reading) in some rows |
| Test 57 | lampwick | `2010_210_10_lampwick_run57_a.xlsx` | S9 | 679 | 679 | 170, 170, 170 | none |
| Test 70 | kapton | `2010_237_12_kapton_run70.xls` | S10 | 1428 | 1430 | 179, 179 | ptrak_count_thousand_per_cm3: the logger holds -999 (no reading) in some rows |
| Test 71 | pyrell | `2010_237_13_pyrell_run71.xls` | S11 | 1487 | 1489 | 186, 186 | ptrak_count_thousand_per_cm3: the logger holds -999 (no reading) in some rows |
| Test 72 | silicone | `2010_237_14_silcone_run72.xls` | S12 | 766 | 766 | 192, 192 | ptrak_count_thousand_per_cm3: the logger holds -999 (no reading) in some rows |
| Test 87 | pyrell | `2010_242_13_pyrell_run87.xls` | S13 | 725 | 726 | 182, 182 | ptrak_count_thousand_per_cm3: the logger holds -999 (no reading) in some rows |
| Test 89 | teflon | `2010_242_15_teflon_run89.xls` | S14 | 713 | 715 | 179, 179 | ptrak_count_thousand_per_cm3: the logger holds -999 (no reading) in some rows |
| Test 91 | silicone | `2010_250_12_silicone_run91.xls` | S15 | 558 | 558 | 186, 186 | ptrak_count_thousand_per_cm3: the logger holds -999 (no reading) in some rows |
| Test 92 | kapton | `2010_250_16_kapton_run92.xls` | S16 | 717 | 719 | 180, 180 | ptrak_count_thousand_per_cm3: the logger holds -999 (no reading) in some rows |

**Workbooks left out, with the reason.**

- `2010_202_13_pyrell_run52.xls`: run 52 (pyrell): the rows carry test numbers [52, 53], not exactly the file's 52
- `2010_202_14_silcon_run53.xls`: run 53 (silicone): the rows carry test numbers [52, 53], not exactly the file's 53
- `2010_210_10_lampwick_run55.xls`: run 55 (lampwick): graph-sheet headers differ from the expected ones (['PTrakMeasurement(PtPerCC)/1000 (Right Axis)', 'DustTrakBMeasurement(MgPerM3) (Right Axis)', 'ISSDetectorScatterMeasurement(Volts)'])
- `2010_210_10_lampwick_run57.xls`: run 57 (lampwick): the same run as the .xlsx copy that is used, would duplicate it
- `2010_211_12_teflon_run58.xls`: run 58 (teflon): rows span 1387 s, as long as NASA's net aging time of the aged test 58a (805 s), so they may run on into the aging hold; no NASA statement says where it starts
- `2010_211_13_silcon_run59.xls`: run 59 (silicone): rows span 1585 s, as long as NASA's net aging time of the aged test 59a (856 s), so they may run on into the aging hold; no NASA statement says where it starts
- `2010_211_14_silicon_run60 a.xls`: run 60a (silicone): aged workbook; NASA's sheet and report do not state where the aged test starts in the rows
- `2010_211_14_silicon_run60.xls`: run 60 (silicone): rows span 1544 s, as long as NASA's net aging time of the aged test 60a (856 s), so they may run on into the aging hold; no NASA statement says where it starts
- `2010_214_10_kapton_run61.xls`: run 61 (kapton): rows span 1544 s, as long as NASA's net aging time of the aged test 61a (807 s), so they may run on into the aging hold; no NASA statement says where it starts
- `2010_214_10_kapton_run62.xls`: run 62 (kapton): rows span 1637 s, as long as NASA's net aging time of the aged test 62a (808 s), so they may run on into the aging hold; no NASA statement says where it starts
- `2010_235_9_pyrell_run63.xls`: run 63 (pyrell): rows span 1235 s, as long as NASA's net aging time of the aged test 63a (840 s), so they may run on into the aging hold; no NASA statement says where it starts
- `2010_235_9_pyrell_run63a.xls`: run 63a (pyrell): aged workbook; NASA's sheet and report do not state where the aged test starts in the rows
- `2010_235_11_pyrell_run64.xls`: run 64 (pyrell): rows span 1625 s, as long as NASA's net aging time of the aged test 64a (842 s), so they may run on into the aging hold; no NASA statement says where it starts
- `2010_235_11_pyrell_run64a.xls`: run 64a (pyrell): aged workbook; NASA's sheet and report do not state where the aged test starts in the rows
- `2010_235_10_silicone_run65.xls`: run 65 (silicone): rows span 2327 s, as long as NASA's net aging time of the aged test 65a (1923 s), so they may run on into the aging hold; no NASA statement says where it starts
- `2010_235_10_silicone_run65a.xls`: run 65a (silicone): aged workbook; NASA's sheet and report do not state where the aged test starts in the rows
- `2010_235_10_silicone_run66.xls`: run 66 (silicone): rows span 1583 s, as long as NASA's net aging time of the aged test 66a (837 s), so they may run on into the aging hold; no NASA statement says where it starts
- `Copy of 2010_235_10_silicone_run66 test.xls`: copy of run 66, would duplicate it
- `2010_236_9_silicone_run67.xls`: run 67 (silicone): graph-sheet rows do not line up with the logger rows, or too few rows (984)
- `2010_236_10_lampwick_run68.xls`: run 68 (lampwick): graph-sheet rows do not line up with the logger rows, or too few rows (828)
- `2010_236_10_teflon_run69.xls`: run 69 (teflon): graph-sheet rows do not line up with the logger rows, or too few rows (963)
- `2010_238_17_kapton_run73.xls`: run 73 (kapton): graph-sheet rows do not line up with the logger rows, or too few rows (224)
- `2010_238_17_pyrell_run74.xls`: run 74 (pyrell): graph-sheet rows do not line up with the logger rows, or too few rows (254)
- `2010_238_18_kapton_run75.xls`: run 75 (kapton): file name fits 0 tests of the pack, not exactly one
- `2010_238_18_pyrell_run76.xls`: run 76 (pyrell): graph-sheet rows do not line up with the logger rows, or too few rows (379)
- `2010_238_19_kapton_run77.xls`: run 77 (kapton): graph-sheet rows do not line up with the logger rows, or too few rows (339)
- `2010_239_13_lampwick_run78.xls`: run 78 (lampwick): graph-sheet rows do not line up with the logger rows, or too few rows (143)
- `2010_239_14_teflon_run79.xls`: run 79 (teflon): graph-sheet rows do not line up with the logger rows, or too few rows (303)
- `2010_239_15_lampwick_run80.xls`: run 80 (lampwick): graph-sheet rows do not line up with the logger rows, or too few rows (308)
- `2010_239_16_teflon_run81.xls`: run 81 (teflon): graph-sheet rows do not line up with the logger rows, or too few rows (273)
- `2010_239_16_lampwick_run82.xls`: run 82 (lampwick): graph-sheet rows do not line up with the logger rows, or too few rows (543)
- `2010_239_17_teflon_run83.xls`: run 83 (teflon): graph-sheet rows do not line up with the logger rows, or too few rows (385)
- `2010_2342_11_pyrell_run84.xls`: run 84 (pyrell): rows span 1524 s, as long as NASA's net aging time of the aged test 84a (632 s), so they may run on into the aging hold; no NASA statement says where it starts
- `2010_242_12_kapton_run85.xls`: run 85 (kapton): file name fits 0 tests of the pack, not exactly one
- `2010_242_14_silicone_run86.xls`: run 86 (silicone): rows span 1388 s, as long as NASA's net aging time of the aged test 86a (628 s), so they may run on into the aging hold; no NASA statement says where it starts
- `2010_242_14_lampwick_run88.xls`: run 88 (lampwick): the rows carry test numbers [86, 88, 89], not exactly the file's 88
- `2010_242_15_kapton_run90.xls`: run 90 (kapton): rows span 1146 s, as long as NASA's net aging time of the aged test 90a (569 s), so they may run on into the aging hold; no NASA statement says where it starts
- `2010_250_13_kapton_run93.xls`: run 93 (kapton): rows span 1323 s, as long as NASA's net aging time of the aged test 93a (568 s), so they may run on into the aging hold; no NASA statement says where it starts
- `2010_250_13_kapton_run94.xls`: run 94 (kapton): rows span 1649 s, as long as NASA's net aging time of the aged test 94a (567 s), so they may run on into the aging hold; no NASA statement says where it starts
- `2010_250_14_pyrell_run95.xls`: run 95 (pyrell): the aged test 95a has no stated net aging time ("n/a"), so the rows (2439 s) cannot be shown to stop before an aging hold
- `2010_250_15_lampwick_run96.xls`: run 96 (lampwick): rows span 2116 s, as long as NASA's net aging time of the aged test 96a (582 s), so they may run on into the aging hold; no NASA statement says where it starts
- `2010_251_10_pyrell_run97.xls`: run 97 (pyrell): rows span 1431 s, as long as NASA's net aging time of the aged test 97a (624 s), so they may run on into the aging hold; no NASA statement says where it starts
- `2010_251_11_lampwick_run98.xls`: run 98 (lampwick): rows span 1383 s, as long as NASA's net aging time of the aged test 98a (585 s), so they may run on into the aging hold; no NASA statement says where it starts
- `2010_251_12_silicone_run99.xls`: run 99 (silicone): rows span 1444 s, as long as NASA's net aging time of the aged test 99a (627 s), so they may run on into the aging hold; no NASA statement says where it starts
- `2010_251_11_teflon_run100.xls`: run 100 (teflon): rows span 1300 s, as long as NASA's net aging time of the aged test 100a (560 s), so they may run on into the aging hold; no NASA statement says where it starts
- `2010_251_13_kapton_run101.xls`: run 101 (kapton): rows span 1256 s, as long as NASA's net aging time of the aged test 101a (561 s), so they may run on into the aging hold; no NASA statement says where it starts
- `2010_251_14_kapton_run102.xls`: run 102 (kapton): graph-sheet rows do not line up with the logger rows, or too few rows (619)
- `2010_252_15_silicone_run103.xls`: run 103 (silicone): the rows carry test numbers [103, 105], not exactly the file's 103
- `2010_252_12_silicone_run104.xls`: run 104 (silicone): the rows carry test numbers [103, 104], not exactly the file's 104
- `2010_252_14_teflon_run105.xls`: run 105 (teflon): the rows carry test numbers [103, 105], not exactly the file's 105
- `2010_252_14_lampwick_run106.xls`: run 106 (lampwick): the rows carry test numbers [105, 106, 107], not exactly the file's 106
- `2010_252_13_pyrell_run107.xls`: run 107 (pyrell): graph-sheet rows do not line up with the logger rows, or too few rows (2207)
- `2010_252_16_kapton_run108.xls`: run 108 (kapton): graph-sheet rows do not line up with the logger rows, or too few rows (313)
- `2010_253_13_silicone_run109.xls`: run 109 (silicone): graph-sheet rows do not line up with the logger rows, or too few rows (535)
- `2010_253_13_lampwick_run110.xls`: run 110 (lampwick): the rows carry test numbers [110, 111], not exactly the file's 110
- `2010_253_13_teflon_run111.xls`: run 111 (teflon): graph-sheet rows do not line up with the logger rows, or too few rows (519)
- `2010_253_14_kapton_run112.xls`: run 112 (kapton): file name fits 0 tests of the pack, not exactly one
- `2010_253_14_pyrell_run113.xls`: run 113 (pyrell): the rows carry test numbers [113, 114], not exactly the file's 113
- `2010_253_15_kapton_run114.xls`: run 114 (kapton): file name fits 0 tests of the pack, not exactly one
- 13 other workbooks in Analyzed Data are not per-run instrument files (TEM particle-size tables, the results workbook, the thermal precipitator map, the flow comparison): `54 lampwick binneddatacorr from GWM.xlsx`, `55 Lampwick.xlsx`, `60 silicone.xlsx`, `62 Kapton aged issue with bins.xlsx`, `62 Kapton unaged.xlsx`, `63 Pyrell aged.xlsx`, `63 Pyrell unaged.xlsx`, `64 Pyrell aged.xlsx`, `64 Pyrell unaged.xlsx`, `94 Kapton aged- results.xlsx`, `SAME, SAME-R_Results.xlsx`, `TEMflowvsnoflow.xls`, `thermal precipitator map updated.xlsx`

## For the web side

1. The Safety page's detection column can show smoke particle size per test and per material.
2. The same workbook has SAME (flight 1) rows; they belong to PSI-102.
3. The workbook also holds mass loss, DustTrak mass concentration and P-Trak counts per test. They are not claimed: several columns exist for each (raw, offset-corrected, dilution-corrected), and no file read defines which NASA treats as final. Version 4 adds the as-logged P-Trak and DustTrak B readings for one test only (see the section above); they are not NASA's final corrected values.

## Validator warnings

None.

<!-- guide_findings:start -->
## NASA's Researcher's Guide (version 6)

Source G1: A Researcher's Guide to: Combustion Science (NASA ISS Program Science Office, 2015). The NASA Space Apps challenge page lists it under "NASA Data & Resources". PSI holds the same
file in the folders of PSI-20, PSI-21, PSI-22 and PSI-23; G1 points to the PSI-20 copy (1,532,064 bytes, sha256
`d85c92823f8917979df00e09e8e0ca40f42092a330ef30dcb8a8af34e7ee6bc0`). It has no test tables. a script cuts each sentence below word for word from the PDF's text
(PyMuPDF), from given first and last words, and stops if they are not found once on the stated page.

| Finding | Page | What it says |
|---|---|---|
| F47 | p. 26 | SAME measured smoke particle sizes from spacecraft materials, as guidance for smoke detector design |
| F48 | p. 35 | Smoke particles differ in size in microgravity, so detectors need different signatures |

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

- version 6 built by a script on top of the published version; a script and
  `validate_pack.py` were run before and after, with no new mismatch, error or warning.
<!-- guide_findings:end -->
