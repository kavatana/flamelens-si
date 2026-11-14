# PSI-39 CFI: evidence pack, version 4

PSI's CFI table gives the conditions of 87 droplet tests (fuel, oxygen, nitrogen, helium, pressure, fiber) and no result. NASA's data summary spreadsheet, `PSI-39_Science Documents_CFI_DataSummary_Spreadsheet_Jan2021.xlsx`, gives the results on its sheet "DATA", one row per Flex Number, and the conditions on its sheet "Master Sheet". Version 1 copied the results for the 79 Flex Numbers PSI's table holds. Version 2 adds the spreadsheet's other 148 tests as new tests, with their conditions and results (section "Version 2: the tests PSI's table does not list").

It holds 1787 claims, 11116 curve points and 218 tests: 295 claims on 70 tests already held (version 1, unchanged) and 1429 claims on 148 new tests (version 2); version 4 adds 63 claims from NASA's test sheets and 11116 curve points. Nothing is derived or assumed.

| Variable | Claims, held tests (v1) | Claims, new tests (v2) | Where |
|---|---|---|---|
| `size_mm` (starting droplet diameter) | 66 | 82 | DATA, column B, "D0 ( mm )" |
| `extinction_diameter_mm` (hot flame) | 64 | 80 | DATA, column C, "Dext, hot ( mm )" |
| `burning_rate_mm2_s` (hot flame) | 66 | 81 | DATA, column D, " khot ( mm^2/s )" |
| `burning_rate_cool_mm2_s` (new variable) | 50 | 77 | DATA, column E, "kcool ( mm^2/s )" |
| `extinction_diameter_cool_mm` (new variable) | 23 | 48 | DATA, column F, "Dext,cool ( mm )" |
| `cool_flame` = true | 25 | 55 | sheet "Comments" |
| `ignited` = false | 1 | 6 | sheet "Comments" |
| `test_date` | 0 | 146 | Master Sheet, column B, "Test Date" |
| `pressure_kpa` | 0 | 148 | Master Sheet, column E, "Pressure" |
| `o2_fraction` | 0 | 148 | Master Sheet, column F, "Oxygen" |
| `n2_fraction` | 0 | 148 | Master Sheet, column G, "Nitrogen" |
| `he_fraction` | 0 | 148 | Master Sheet, column H, "Helium" |
| `fuel` | 0 | 148 | Master Sheet, column J, "Fuel " |
| `fuel_phase` = liquid | 0 | 114 | sheet "Comments" (the word "droplet") |

## Scoreboard

These are droplet tests, so the solid-fuel counts do not move. Counted with the loader's `scoreboard()` on records rebuilt from `known_tests.csv`; the loader raised 0 quality findings.

| Count | Before | After |
|---|---|---|
| solid-fuel tests | 380 | 380 |
| with oxygen | 140 | 140 |
| with air speed | 251 | 251 |
| with oxygen and air speed | 132 | 132 |
| with oxygen, air speed and what happened | 11 | 11 |
| with a pressure NASA states | 0 | 0 |


## How each value was taken

- Numbers are copied as NASA's sheet holds them. Columns B to F are plain numbers in the sheet, not formulas (the sheet's formulas are in columns M and P, which are not used).
- An empty cell gives no claim. Held tests: extinction_diameter_cool_mm 56, burning_rate_cool_mm2_s 29, extinction_diameter_mm 15, size_mm 13, burning_rate_mm2_s 13.
- **`Dext,cool` of 0, and "NaN"**, give no claim. The sheet does not say what 0 means; NASA's comments on these tests often say the droplet seemed to burn away with no visible cool-flame extinction, which would make 0 a code, not a diameter. Cells left out on held tests:
  - Flex 1225 (f090a10), F21: 0
  - Flex 1227 (f095a01), F23: 0
  - Flex 1295 (f179e01), F92: 0
  - Flex 1300 (f180d01), F97: 0
  - Flex 1310 (f186d01), F107: 0
  - Flex 1314 (f186d06), F111: 0
  - Flex 1320 (f191d02), F117: 0
  - Flex 1321 (f191d03), F118: 0
  - Flex 1322 (f191d04), F119: 0
  - Flex 1323 (f191d05), F120: 0
  - Flex 1328 (f195d01), F125: 0
  - Flex 1329 (f195d02), F126: 0
  - Flex 1330 (f195d07), F127: 0
  - Flex 1331 (f195d10), F128: 'NaN'
  - Flex 1332 (f195d11), F129: 0
  - Flex 1335 (f200d01), F132: 0
  - Flex 1336 (f200d03), F133: 0
  - Flex 1337 (f200d04), F134: 0
  - Flex 1338 (f200d05), F135: 'NaN'
  - Flex 1340 (f202e02), F137: 0
  - Flex 1341 (f205d01), F138: 0
  - Flex 1342 (f205d02), F139: 0
- **Cool flame.** `cool_flame` = true where NASA's comment says the cool flame burned ("cool flame burn", "cool-flame burning", "Cool flame burning"), using the pattern `(?<!no )(?<!not )\bcool[- ]flame (?:burn|burning)\b|\bcool flame burn\b`. The matched words are `original_text`; the whole comment is the quote. 25 held tests. Every match was read; two were left out because the words do not report a cool flame:
  - f195d10: NASA writes "Unknown cool flame burn".
  - f208d04: NASA writes "Trying larger droplet to see if we get longer cool flame burn": an aim, not an observation.
  A test with no `cool_flame` claim is not a test without a cool flame: NASA's comment may simply not say. The `kcool` values show a cool flame was measured in 50 held tests.
- **No ignition.** `ignited` = false where the comment says "No ignition" or "did not ignite" (pattern `\bNo ignition\b|\bdid not ignite\b`): f233d01.
- **Not claimed:** "HF Burn Time" (column J) has no unit in the sheet; "Reignitions", the radiometer columns and "Actual D" have no definition in the files read.

## Version 2: the tests PSI's table does not list

### Which tests, and how they were told apart from the tests already held

The three sheets "Master Sheet", "DATA" and "Comments" list the same 227 Flex Numbers in the same order, each once. PSI's table holds 79 of them; the other 148 (1212 to 1431, one of them written `1274A`) were checked before being added:

- **None is held for any investigation.** No cell of any `nasa_row` in `known_tests.csv` (all 1989 rows, all accessions) equals one of these Flex Numbers, and no held label equals one of their CIR codes. FLEX (PSI-69) numbers its tests 1 to 274 with identifiers such as `20CAL08`; FLEX-2 (PSI-68) holds 8 envelope rows with no test number. A plain text search finds two of the numbers only inside unrelated values of PSI-159 (`0.1406`, a fuel fraction; `1397.031071`, a flame temperature). The script checks this again on every build.
- **Every comment was read for dummy runs, calibrations and copies.** One mentions a dummy: Flex 1212, "Ran dummy test point w/ only igniters and intensified camera eyeled normally. Good, clear fuel, no bubbles. Perfect deployment, slight drift to lower igniter. No ignition. ... Keep test point for vaporization info." It is added: the rest of the comment describes a fuel droplet deployed and an ignition attempt at this test point, NASA kept the test point and its video ("Downlink file renamed to: FLEX-1212-..."), and "DATA" gives its starting diameter and marks its analysis completed. It carries `ignited` = false. Flex 1235 ("Igniters burned out. Saving for vaporization info.") and Flex 1394 ("Droplet did not ignite. ... Saving for vaporization data.") are kept for the same reason. No comment mentions a calibration.
- **Two tests share a CIR code**: Flex 1419 and Flex 1420 are both `f254b06` on "Master Sheet". Their times (02:57:02 pm and 03:16:27 pm) and comments differ ("Re-ignite residual droplet ... 9 re-ignitions" against "Droplet shifted E and clung to soot agglomerate ... burns with a warm flame to completion"), so they are two tests and both are added.

Excluded: 0. No Flex Number was found to be a dummy run, a calibration, a duplicate or a test of another investigation.

Each new test is `PSI-39/cfi-new/<Flex Number>`, labelled `Flex <n>`, `as_run`, and its `matched_by` states the checks above.

### What they cover

- **Fuels**, as NASA writes them: `C12H26` 58, `Farnesane` 44, `[.75]/[.25] C12H26/iso-dodecane` 35, `[.60]/[.40] C12H26/iso-dodecane` 11. Farnesane appears only among the new tests.
- **Pressures**: 0.5 atm 16, 0.75 atm 14, 1 atm 46, 1.25 atm 10, 2 atm 11, 3 atm 38, 5 atm 13 (0.5 to 5 atm).
- **Atmospheres** (O2 / N2 / He): 0.21 / 0.79 / 0: 90, 0.17 / 0.83 / 0: 20, 0.21 / 0.2 / 0.59: 20, 0.21 / 0.5 / 0.29: 18.
- **Dates**: 27 March to 15 September 2017.
- **Results**: 82 of the 148 new tests have at least one number in "DATA" (C12H26 54, [.75]/[.25] C12H26/iso-dodecane 22, [.60]/[.40] C12H26/iso-dodecane 6). The other 66 have none: all 44 farnesane tests and some n-dodecane and n-dodecane/iso-dodecane tests are empty in "DATA" (column T, "Completed Analysis?", reads "No" for all of them but Flex 1235). Those tests carry their conditions and what the comments say.

### How each value was taken

- **Conditions** come from "Master Sheet", one claim per cell, `quality` reported. `pressure_kpa` is the cell's number of atmospheres times 101.325 (".75 atm" gives 75.99375 kPa); `o2_fraction`, `n2_fraction` and `he_fraction` are copied as fractions (a helium of 0 is claimed as 0, because the cell says 0). The sheet does not say whether these are set points or measurements; they take a few round values (0.21, 0.79, 0.17, 0.5, 0.29, 0.2, 0.59) and are listed as each test's condition, so `basis` is set_point. "DATA" column G, "Pressure (atm)", agrees with "Master Sheet" for all 227 tests and is not claimed a second time (same file).
- **`fuel`** is the cell's text, exactly as written (trailing spaces trimmed), for example `[.75]/[.25] C12H26/iso-dodecane`. It is not translated into a name.
- **`test_date`** is the cell's date in ISO form; `original_text` is the cell as the spreadsheet library reads it (`2017-03-27 00:00:00`). Two dates are left out:
  - Flex 1237: The cell reads 2017-05-02, but the tests before and after it (Flex 1236 at 07:58, Flex 1238 at 10:14) are dated 2017-05-01 and its CIR code f121a02 carries day 121, which is 1 May 2017. One of the cells is wrong; the sheet does not say which.
  - Flex 1411: The cell reads 2011-09-06. CFI ran in 2017; the four tests before it on the same test series (f249b01 to f249b08) are dated 2017-09-06. The year is plainly a typing error, but a repaired date would be our value, not NASA's.
- **`fuel_phase`** = liquid, `quality` context, only where the test's own comment uses the word "droplet" (pattern `\bdroplets?\b`); the word is `original_text` and the comment the quote. 114 tests. The other 34 comments do not use the word, so their tests have no `fuel_phase` claim: 1212, 1231, 1232, 1233, 1242, 1243, 1244, 1256, 1258, 1259, 1262, 1272, 1274, 1274A, 1275, 1279, 1280, 1325, 1339, 1343, 1345, 1376, 1381, 1390, 1393, 1396, 1399, 1406, 1409, 1410, 1423, 1429, 1430, 1431. No NASA file read states the phase of the fuel in any other words.
- **Not claimed:** `o2_basis` (no NASA file read says in words that the oxygen is the ambient atmosphere of the chamber); the "Fiber" column (the site has no variable for it); "Local Time" and "CIR" (no variable; the CIR code is in `matched_by`).
- **Results** follow version 1 exactly: the same five columns of "DATA", the same skip rules, the same comment patterns. Empty cells on new tests: extinction_diameter_mm 68, burning_rate_mm2_s 67, burning_rate_cool_mm2_s 71, extinction_diameter_cool_mm 100, size_mm 66. Cells left out on new tests (`Dext,cool` of 0 or text):
  - Flex 1231, F27: 0
  - Flex 1234, F30: 0
  - Flex 1255, F51: 0
  - Flex 1256, F52: 0
  - Flex 1257, F53: 0
  - Flex 1260, F56: 0
  - Flex 1261, F57: 0
  - Flex 1262, F58: 0
  - Flex 1267, F63: 0
  - Flex 1268, F64: 0
  - Flex 1274, F70: 0
  - Flex 1278, F75: 0
  - Flex 1279, F76: 0
  - Flex 1299, F96: 0
  - Flex 1309, F106: 0
  - Flex 1315, F112: 0
  - Flex 1317, F114: 0
  - Flex 1318, F115: 0
  - Flex 1319, F116: 0
  - Flex 1324, F121: 0
  - Flex 1325, F122: 0
  - Flex 1326, F123: 0
  - Flex 1327, F124: 0
  - Flex 1333, F130: 0
  - Flex 1334, F131: 0
  - Flex 1339, F136: 0
  - Flex 1370, F167: 0
  - Flex 1371, F168: 0
  - Flex 1376, F173: 0
- **One result cell withheld by judgement**, beyond version 1's rules:
  - Flex 1212, D8 (0.062): NASA's comment says "No ignition", so the number in the column "khot" cannot be a hot-flame burning rate for this test (the comment says the test point was kept "for vaporization info").
- **Cool flame** on new tests: 55 tests. Every match was read; these were left out because the words do not report a cool flame that was seen:
  - Flex 1265: NASA writes "Droplet well out of FOV during cool flame burning": the droplet was out of the cameras' view, so the cool flame was not seen.
  - Flex 1303: NASA writes "Either a very slow cool flame burn or very large cool flame extinction diameter": the matched words are one side of an either/or, not a plain observation.
  - Flex 1378: NASA writes "No hot-flame ignition. Large vapor cloud forms quickly. Unknown cool flame burn."; the later "Short cool flame burn" follows "N-dodecane (100% at same condition)" and may describe that comparison, not this test.
  - Flex 1427: NASA writes "Not much cool flame burning": "not much" may mean little or none, so it is not a clear observation.
- **No ignition** on new tests: Flex 1212, Flex 1379, Flex 1380, Flex 1381, Flex 1382, Flex 1394. One match was left out:
  - Flex 1264: NASA writes "No ignition-imparted motion" (ignition did not move the droplet); the same comment says "Droplet ignites in ~5 sec".
- **Not caught by the no-ignition rule**, and left for a person to decide because the rule is version 1's: Flex 1385 says "No hot-flame ignition." and Flex 1378 "No hot-flame ignition." (with a later "Hot-flame in ~6 sec", which may describe an n-dodecane comparison). The site's `ignited` means "Whether a hot flame was established", so both read as `ignited` = false; held test f233d04 (Flex 1386) has the same wording and has no claim in this pack. Flex 1406 says "No cool flame."; the rule only claims `cool_flame` = true, so it has no claim.
- **Repeats** (rule 5): two pairs share a `replicate_group`:
  - Flex 1242 and Flex 1243: NASA writes "Repeat last test since intensified camera may have been in pulsed mode for entire test." The test before it on the same day is Flex 1242 (f123a01, 11:31; this one 11:58), with the same conditions.
  - Flex 1254 and Flex 1256: NASA writes "Repeating F130A01 with correct camera settings." F130A01 is the CIR code of Flex 1254.
  Held tests f186d01 and f186d02 (Flex 1311 and 1312, "Repeat last test.") were left as version 1 had them.

### Odd things in the spreadsheet

- **Hot-flame extinction diameter larger than the starting diameter** on three new tests: Flex 1274A (D0 4.67, Dext,hot 5.545), Flex 1325 (5.227, 5.254), Flex 1327 (5.308, 5.341). Copied as written; a droplet should not grow by the time its flame goes out, so these deserve a look.
- **Flex 1377** (3 atm, O2/N2/He 0.21/0.2/0.59) has khot 0.043, kcool 0.046 and Dext,cool 6.153 from D0 6.433, far from its neighbours; its comment says a large droplet remained ("Large droplet seen still remaining when light was turned on").
- **"Warm flame"**: four farnesane tests at 3 atm (Flex 1417 to 1420) say the droplet burned with a "warm flame". The site has no variable for it and the cool-flame rule does not match it.
- **Held tests Flex 1219 to 1222** give O2 0.21, N2 0.76, He 0, which sum to 0.97 (version 1 tests; not changed).
- **Three new tests have numbers in "DATA" but "Completed Analysis?" = No** (Flex 1236, 1244, 1262), and one test with no number has "Yes" (Flex 1235). The numbers are copied like the rest; the sheet does not say what "No" means for them.

## New variables

`burning_rate_cool_mm2_s` and `extinction_diameter_cool_mm`, the cool-flame counterparts of the site's `burning_rate_mm2_s` and `extinction_diameter_mm`. The spreadsheet gives only the column headers, so the definition is "unknown". Version 2 adds no variable.

## For the web side

1. **PSI's CFI table lists eight tests twice.** Rows 80 to 87 repeat rows 23 to 30 cell for cell (Flex Numbers 1285 to 1289 and 1295 to 1297). Claims go on the first copy: f173e01 is a copy of f173e01, f173e02 is a copy of f173e02, f173e03 is a copy of f173e03, f173e05 is a copy of f173e05, f173e06 is a copy of f173e06, f179e01 is a copy of f179e01, f179e02 is a copy of f179e02, f179e05 is a copy of f179e05. The site may want to treat the second copies as duplicates.
2. **148 new tests**, `PSI-39/cfi-new/<Flex Number>`. `packs.py` puts them in a table of their own ("Tests added from other NASA files (PSI-39)"). Their labels are `Flex <n>`, not the CIR code PSI's table uses; the CIR code is in each `matched_by`.
3. **`size_mm`** is the starting droplet diameter, as for FLEX.
4. The new tests' `fuel` is NASA's text (`C12H26`, `Farnesane`, `[.75]/[.25] C12H26/iso-dodecane`), while the held tests show `n-dodecane`; the site may want one name per fuel.

## NASA's conclusions in words (version 3)

From a NASA report on NTRS (20205008449): Nayagam, Dietrich (NASA Glenn), Williams, "Effects of Ambient Inert Gas Properties on Cool-Flame Combustion of Normal-Alkane Droplets in Microgravity", ASGSR 2020; source S3, `psi_path` its NTRS address. Its conclusions slide gives 4 findings, in `findings.csv` word for word. It names no test, so no finding is tied to one.

- F1: Cool-flame droplets: the inert gas matters through heat transfer and diffusion, not chemical kinetics.
- F2: A simple quasi-steady theory predicts cool-flame burning rates and, largely, extinction diameters.
- F3: Chemical-kinetic models are adequate for lower n-alkanes; higher alkanes need more study.
- F4: Xenon slows burning but sustains cool flames at much lower oxygen than helium.

## Histories and test sheets (version 4)

version 4. NASA's per-test history files and test sheets (folder Raw Data on PSI, `PSI-39_Raw Data_FLEX-<Flex Number>_<kind>.txt`) were downloaded into `work/PSI-39/raw/` (checksums in `manifest.json`) and matched to tests by Flex Number: held tests (first copy of the eight Flex Numbers PSI lists twice) and the 148 new tests. Each file is a new source in `sources.csv`, `source_kind` `analyzed_data` (84 files). The catalogue lists history files for 24 Flex Numbers; 24 match exactly one test of the pack.

**Curves** (`series.csv`, 11116 points). Each file is a tab-separated table with a header line, rows ending in a bare carriage return. Per test and variable, every k-th data row from the first, k = ceil(N/200), at most 200 points (`series.thin`); time is the file's time column as `t_s`, the value is copied unchanged, the unit is NASA's (`mm`, factor 1). A row whose time or value is empty or not a finite number gives no point (dropped after thinning: none). The locator is `row <i>, column <header>`, data rows from 1.

| Variable | NASA's file and column | Files used | Tests | Points |
|---|---|---|---|---|
| `droplet_diameter_mm` | `DropletData`, `DropletDiameter_mm` (time `DropletTime_sec`) | 23 | 23 | 4358 |
| `flame_diameter_visible_mm` | `ColorCamData`, `ColorCamFlameDiameter_mm` (time `ColorCamTime_sec`) | 23 | 23 | 3657 |
| `cool_flame_diameter_mm` | `CoolFlameData`, `CoolFlameDiameterFWHM_mm` (time `CoolFlameTime_s`) | 17 | 17 | 3101 |

New variables (`new_variables.csv`), each defined by NASA's header text: `droplet_diameter_mm`, `flame_diameter_visible_mm`, `cool_flame_diameter_mm` (row 0 of the file) and `fiber_supported` (NASA's test-sheet label "Fiber:").

**Test sheets** (21 sheets used, one test each; each `.txt` has a `.pages.json` beside it holding its text as one page, as `check_pack.py` needs). `source_kind` `analyzed_data`, locator `p. 1`, the quote is the sheet's line (or, for `description`, the COMMENTS paragraph) word for word.

| Variable | Claims | How |
|---|---|---|
| `ambient_temperature_c` | 21 | "Temperature (K)" minus 273.15, basis `measured`, `°C`; the note says so |
| `fiber_supported` | 21 | "Fiber:" Yes gives true, No false |
| `description` | 21 | the COMMENTS paragraph, text, basis `stated`, quality `context` |

Test-sheet pressure, O2 and D0 are not claimed because they repeat NASA's spreadsheet values, rounded. Not claimed from the sheets: kavg and Dext. The sheet's "kavg" is an average and does not say whether it is the hot-flame or cool-flame constant, and "Dext" does not say which flame; mapping them to `burning_rate_mm2_s` or `extinction_diameter_mm` would be a guess. Cells that read "nan" give no claim. Notes: none.

**Skipped and why**

- The RadiometerData files (24 listed) are not used. Their header is `RadiometerTime_sec`, `TotalWideBandPower_W`, `TotalNarrowBandPower_W`: the unit appears only as a name suffix, there are two channels that the one variable `radiometer_signal_<unit-word>` cannot tell apart, and the wide-band values of the one file opened (Flex 1261) run to about -5.5 million W, which cannot be watts of radiant power. No definition or calibration is in the files read. One file (about 0.9 MB) was downloaded to read its header and then removed from `work/`.
- History files not matched to a test, or whose columns differ: PSI-39_Raw Data_FLEX-1227_ColorCamData.txt: header is ['CoolFlameTime_s', 'CoolFlameDiameterFWHM_mm', 'CoolFlameDiameterP2P_mm'], not ColorCamTime_sec and ColorCamFlameDiameter_mm; not used; PSI-39_Raw Data_FLEX-1248_DropletData.txt: header is ['$\x1a\ufffd\ufffdm\ufffd\ufffdmo\ufffdL\ufffdD\ufffd\ufffd;\ufffd%g\ufffd?w\ufffd\ufffd\u0177\x19\ufffd\x16\ufffd\ufffdovH0\ufffd\ufffda\ufffd5\ufffd'], not DropletTime_sec and DropletDiameter_mm; not used; PSI-39_Raw Data_FLEX-1249_TestSheet.txt: first line '$\x1a\ufffd\ufffdm\ufffd\ufffdmo\ufffdL\ufffdD\ufffd\ufffd;\ufffd%g\ufffd?w\ufffd\ufffd\u0177\x19\ufffd\x16\ufffd\ufffd', CIR ''; the pack has CIR 'f125a02'; not used.
- Where PSI lists a Flex Number twice (Flex 1285 to 1289 and 1295 to 1297), the data go on the first copy only, as in version 1.
- The curves are thinned: a 200-point curve is not the full history. The full files are on PSI.

## Validator warnings

None.

## Reproduction

Not attempted.
