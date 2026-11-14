# PSI-107 SPICE: evidence pack, version 2

SPICE (Smoke Point In Co-flow Experiment) burned gas jets (ethylene, propane, propylene and propylene with nitrogen) from three burner tubes in a flow of air on the ISS and recorded where each flame began to emit soot. The site already holds PSI's SPICE table (469 rows). This pack adds, from NASA's small SPICE files, **the smoke point length** (new variable `smoke_point_length_mm`), second witnesses for air speed and nozzle size, and 23 findings from the final report.

**Version 2** adds NASA's Data II flight record (`.xls`): 67 flame lengths on tests that fit exactly one site row (variable `flame_length_mm`, which NASA does not define), and a few maximum flame widths and Nikon flame heights. The smoke-point workbook still matches only 4 of its 55 smoke-point flames (51 do not, listed below).

| Variable | Claims |
|---|---|
| `flame_height_nikon_mm` | 15 |
| `flame_length_mm` | 67 |
| `flame_width_max_mm` | 15 |
| `flow_speed_cm_s` | 4 |
| `size_mm` | 4 |
| `smoke_point_length_mm` | 4 |

85 tests, all already held (`is_new` 0): PSI-107/spice/22 (Day 45 17:27:48), PSI-107/spice/400 (Day 173 12:39:29), PSI-107/spice/412 (Day 174 11:04:43), PSI-107/spice/468 (Day 174 12:46:17), PSI-107/spice/3 (Day 45 14:50:07), PSI-107/spice/4 (Day 45 14:50:07), PSI-107/spice/7 (Day 45 15:35:44), PSI-107/spice/14 (Day 45 17:11:46), PSI-107/spice/15 (Day 45 17:11:46), PSI-107/spice/16 (Day 45 17:15:05), PSI-107/spice/17 (Day 45 17:15:05), PSI-107/spice/18 (Day 45 17:20:46), PSI-107/spice/20 (Day 45 17:23:03), PSI-107/spice/23 (Day 45 17:27:48), PSI-107/spice/24 (Day 45 17:29:49), PSI-107/spice/25 (Day 45 17:29:48), PSI-107/spice/26 (Day 48 14:32:05), PSI-107/spice/27 (Day 48 14:33:57), PSI-107/spice/28 (Day 48 14.34.57), PSI-107/spice/29 (Day 48 14:43:57), PSI-107/spice/31 (Day 48 14:48:19), PSI-107/spice/32 (Day 48 14:48:19), PSI-107/spice/33 (Day 48 14:48:19), PSI-107/spice/34 (Day 48 14:48:19), PSI-107/spice/35 (Day 48 14:48:19), PSI-107/spice/36 (Day 48 14.48.19), PSI-107/spice/37 (Day 48 14.48.19), PSI-107/spice/38 (Day 48 14.48.19), PSI-107/spice/39 (Day 48 14.48.19), PSI-107/spice/40 (Day 48 14.48.19), PSI-107/spice/41 (Day 48 14.48.19), PSI-107/spice/42 (Day 48 14.48.19), PSI-107/spice/43 (Day 48 16:53:44), PSI-107/spice/45 (Day 48 17:01:35), PSI-107/spice/46 (Day 48 17:01:35), PSI-107/spice/49 (Day 48 17:11:21), PSI-107/spice/50 (Day 48 17:11:21), PSI-107/spice/57 (Day 52 11:38:51), PSI-107/spice/58 (Day 52 11:38:51), PSI-107/spice/61 (Day 52 11:42:49), PSI-107/spice/62 (Day 52 11:42:49), PSI-107/spice/65 (Day 52 11:49:35), PSI-107/spice/66 (Day 52 11:49:35), PSI-107/spice/71 (Day 52 12:21:19), PSI-107/spice/72 (Day 52 12:21:19), PSI-107/spice/75 (Day 52 12:26:14), PSI-107/spice/81 (Day 52 12:42:47), PSI-107/spice/82 (Day 52 12:42:47), PSI-107/spice/85 (Day 52 13:02:02), PSI-107/spice/86 (Day 52 13:02:02), PSI-107/spice/89 (Day 52 13:04:25), PSI-107/spice/90 (Day 52 13:04:25), PSI-107/spice/93 (Day 52 16:09:00), PSI-107/spice/104 (Day 52 17:10:12), PSI-107/spice/105 (Day 52 17:10:12), PSI-107/spice/108 (Day 52 17:25:47), PSI-107/spice/109 (Day 52 17:25:47), PSI-107/spice/110 (Day 52 17:25:47), PSI-107/spice/114 (Day 52 17:30:17), PSI-107/spice/115 (Day 52 17:30:17), PSI-107/spice/116 (Day 52 17:30:17), PSI-107/spice/120 (Day 52 17:47:11), PSI-107/spice/121 (Day 52 17:47:11), PSI-107/spice/125 (Day 52 17:50:49), PSI-107/spice/126 (Day 52 17:50:49), PSI-107/spice/132 (Day 52 17:58:09), PSI-107/spice/133 (Day 52 17:58:09), PSI-107/spice/134 (Day 52 17:58:09), PSI-107/spice/185 (Day 55 10:15:39), PSI-107/spice/189 (Day 55 10:25:40), PSI-107/spice/193 (Day 55 10:34:07), PSI-107/spice/205 (Day 55 10:52:20), PSI-107/spice/208 (Day 55 11:12:41), PSI-107/spice/251 (Day 58 11:25:49), PSI-107/spice/267 (Day 58 12:42:59), PSI-107/spice/270 (Day 119 10:28:17), PSI-107/spice/273 (Day 119 10:38:34), PSI-107/spice/278 (Day 136 15:52:00), PSI-107/spice/280 (Day 136 15:57:26), PSI-107/spice/281 (Day 136 15:57:26), PSI-107/spice/282 (Day 136 15:57:26), PSI-107/spice/283 (Day 136 15:57:26), PSI-107/spice/301 (Day 136 17:21:33), PSI-107/spice/302 (Day 136 17:21:33), PSI-107/spice/303 (Day 136 17:21:33).

## Files read

| File | Bytes | SHA-256 | Used for |
|---|---|---|---|
| `PSI-107_Raw Data_SmokePointReview-0g-3.xlsx` | 295,735 | `ed43c2b6c1cb82d1060ed4739a1ea04c68410e53e9f894f8078df0bda1f09fa9` | Claims (S1) |
| `PSI-107_Reports_SPICE_FinalReport.pdf` | 601,754 | `95e76859017d201dcd6a9fb12f1df568aed77e0edf7a1b609975db37f32fa680` | Definition and findings (S2); page text kept as `PSI-107_Reports_SPICE_FinalReport.pdf.pages.json` |
| `PSI-107_Raw Data_Spice Flight Test Data II modified.xls` | 429,568 | `52cdb88a3d6c1a4008abb3c1edc601f96a210985e1227e42687b5400784d108d` | Flame lengths, widths, heights (S3) |
| `PSI-107_Raw Data_Spice_Flight_Flamelength.xls` | 16,896 | `c4625cd9b16ad5af1687c84f0212c0396368cfb1b1173ab80066e1c58e2da46c` | Read, not used for claims (below) |

Not opened: the 30-Day Post-Flight Report, the SRD (`.doc`), and the presentation "Laminar Smoke Points in Coflow Measured Aboard ISS". The final report already defines the terms needed.

## What each sheet holds

**`PSI-107_Raw Data_SmokePointReview-0g-3.xlsx`** has four sheets. `Smoke Point Datasheet` (rows 5 to 59) has one row per smoke-point flame, 55 in all, headed "Master Sheets of ISS Tests for SPICE": GMT day, GMT ignition, GMT flame off, GMT data, test point (`E16-1` = ethylene, 1.6 mm burner, number 1), fuel, nozzle (mm), pressure (Pa), the crew's fuel, air and fan **display** readings, radiometer reading and gain, the smoke-point length as a pixel count and in mm ("smk pt mm", a formula: pixels times a calibration line per day on `Reference`), flame width, and about thirty calculated columns (flow rates, velocities, Reynolds numbers, residence times). Below row 60 it holds smoke-point lengths from other experiments (KC-135 aircraft, STS-83 and 94) and, rows 103 to 119, 15 "Smoke Height Nikon" values with a "Test" number but no day or time. `Smoke Point Datasheet (2)` repeats the same 55 flames in the layout of the data file, with the length also as a plain number in metres (column AL) and the air speed in m/s (column AP). The two sheets were compared row by row in the build: same ignition time, fuel, nozzle, displays and air speed; lengths agree except where stated below.

**`PSI-107_Raw Data_Spice Flight Test Data II modified.xls`** (sheet "Data record of Video and Stills", 526 rows from row 5, 43 columns) is the full record of the flights: day, ignition, flame off, fuel, nozzle, pressure, displays, `Length` in mm (138 rows have one, 134 as a number), flow rates in sccm, mg/s and cm/s, flame width and height. **`PSI-107_Raw Data_Spice_Flight_Flamelength.xls`** has one calibration and 12 test points of a single flame-length measurement, in inches on an image ruler converted to mm (TP 1: 4.375 in, 47.169375 mm; TP 2: 6.175 in, 20.891175000000004 mm; TP 3: 3.71875 in, 56.74996875000001 mm; TP 4: 5.875 in, 25.270875000000004 mm; TP 5: 5.64375 in, 28.646893750000004 mm; TP 6: 6.64375 in, 14.047893750000014 mm; TP 7: 0.0 in, 111.04 mm; TP 8: 4.3125 in, 48.081812500000005 mm; TP 9: n/a; TP 10: 4.45625 in, 45.98320625000001 mm; TP 11: 0.03125 in, 110.58378125 mm; TP 12: 4.3125 in, 48.081812500000005 mm), with no day, time or fuel, so no row can be tied to a test.

**The workbook's two sheets disagree for 2 flames.** 75P16-7 (row 23): first sheet 14.16 mm from pixel count 458, second sheet 15.44 mm from pixel count 459; 75P16-8 (row 24): first sheet 20.36 mm from pixel count 431, second sheet 21.70 mm from pixel count 431. The first sheet uses the day's calibration block `Reference!K78:K79`, the second `Reference!R42:R43`. Neither is corrected. A matched flame with such a disagreement would get no length claim; none of the matched flames is affected.

## Reading rules

- The smoke point length is the value in column AL of `Smoke Point Datasheet (2)`, in metres, times 1000. NASA defines it in the final report (p. 19): "The smoke point lengths, LSP, (and the flow conditions) were obtained from the video record and are the measured distance from the burner to the tip of the luminous flame on the flame axis." The workbook's "smk pt mm" column (a formula) holds the same number. The column is a **measurement**, but of a pixel count read from the video (by NASA) and turned into mm with NASA's calibration; its uncertainty is not given. The report says the flame tips are not sharp: they "transitioned from bright yellow to black over an axial distance of 2 – 5 mm" (finding F10).
- Air speed is the air display reading through NASA's calibration line. It is a **set point** (`basis` set_point), not a measurement in the flame; the report says (p. 13 of the report, pdf p. 19) that SPICE "does not have velocity diagnostic capability to reveal the actual velocity in the presence of flame".
- Nozzle size is the burner tube's inner diameter (`size_mm`, basis stated).
- The sheets' pressure column is 101325 Pa in every row, and the report (Table 1 note, p. 20) says its calculations "assume conditions of 298 K, 101 kPa and 21±1% O2". It is an assumption by NASA, so **no pressure or oxygen claim is made**.
- Fuel display, air display, fan display, radiometer reading and gain have no site variable and no NASA unit; they are not claimed.
- Because the formula columns (smoke length in mm, sccm, air speed in cm/s) cannot be checked cell for cell by a script, claims use the constant columns AL, AP and H. The build asserts that AL, AP and the formula columns agree.

## Join rule and counts

A smoke-point row matches a site test only if **exactly one** of the 469 SPICE rows in `known_tests.csv` has the same GMT day, GMT ignition time, fuel (`75 %` and `75%` treated alike), nozzle (within 0.001 mm), fuel rate in sccm (within 0.01) and air speed in cm/s (within 0.01), **and** no other smoke-point row matches that site row. Day and ignition alone are not enough, because one ignition holds several fuel and air settings in the site's table (151 ignitions, 469 rows) and the smoke point is one of them.

- Smoke-point flames in the workbook: 55. Matched: **4**. Unmatched: **51**.
- Why unmatched: 29 x the site holds this flame  but at other fuel and air settings only; 19 x no site row has this day, ignition time, fuel and nozzle; 2 x the ignition cell reads , not a time; 1 x fits 2 site tests with identical cells , so no single test.
- The site's table is PSI's own SPICE table, which does not hold most of the smoke-point settings of the data file. The unmatched flames are real flames with NASA values; they are not claimed because they would need new tests (`is_new` 1), which the brief discourages for tables that already exist. If you want them, the build can make them as new tests.
- Near miss, not forced: TP P7-2 (day 58, 10:36:19) has a site row with the same fuel rate (28.29 sccm) but air 26.99 cm/s against 28.87 in the workbook, so it is a different setting and is listed below.

### Unmatched smoke-point flames (51)

| TP | GMT day | GMT ignition | Fuel | Nozzle mm | sccm | Air cm/s | Length mm | Why |
|---|---|---|---|---|---|---|---|---|
| E16-1 | 45 | 15:00:23 | Ethylene | 1.6002 | 171.00 | 58.02 | 75.4 | no site row has this day, ignition time, fuel and nozzle |
| E16-2 | 45 | 14:37:08 | Ethylene | 1.6002 | 124.20 | 33.57 | 54.0 | the site holds this flame (same day, ignition, fuel, nozzle) but at other fuel and air settings only |
| E16-3 | 45 | 14:50:07 | Ethylene | 1.6002 | 126.60 | 39.21 | 55.8 | the site holds this flame (same day, ignition, fuel, nozzle) but at other fuel and air settings only |
| E16-4 | 168 | 09:49:13 | Ethylene | 1.6002 | 125.40 | 36.39 | 57.5 | no site row has this day, ignition time, fuel and nozzle |
| E16-5 | 45 | 15:48:39 | Ethylene | 1.6002 | 84.00 | 18.53 | 37.0 | the site holds this flame (same day, ignition, fuel, nozzle) but at other fuel and air settings only |
| P16-1 | 48 | 16:53:45 | Propane | 1.6002 | 99.36 | 44.85 | 71.4 | no site row has this day, ignition time, fuel and nozzle |
| P16-2 | 48 | 17:11:21 | Propane | 1.6002 | 82.80 | 36.39 | 61.1 | the site holds this flame (same day, ignition, fuel, nozzle) but at other fuel and air settings only |
| P16-3 | 48 | 17:44:38 | Propane | 1.6002 | 59.04 | 22.29 | 45.5 | no site row has this day, ignition time, fuel and nozzle |
| P7-1 | 52 | 11:38:51 | Propane | 0.762 | 126.00 | 33.57 | 105.5 | the site holds this flame (same day, ignition, fuel, nozzle) but at other fuel and air settings only |
| P7-2 | 52 | 11:42:50 | Propane | 0.762 | 86.40 | 21.35 | 75.6 | no site row has this day, ignition time, fuel and nozzle |
| P7-3 | 52 | 11:49:35 | Propane | 0.762 | 74.16 | 16.65 | 64.3 | the site holds this flame (same day, ignition, fuel, nozzle) but at other fuel and air settings only |
| 75P16-1 | 52 | 16:14:05 | 75 % Propylene | 1.6002 | 71.66 | 64.60 | 37.7 | no site row has this day, ignition time, fuel and nozzle |
| 75P16-2 | 173 | 10:37:43 | 75 % Propylene | 1.6002 | 70.70 | 58.96 | 35.8 | the site holds this flame (same day, ignition, fuel, nozzle) but at other fuel and air settings only |
| 75P16-3 | 52 | Ku LOS | 75 % Propylene | 1.6002 | 56.27 | 51.43 | 31.7 | the ignition cell reads "Ku LOS", not a time |
| 75P16-4 | 173 | 11:08:12 | 75 % Propylene | 1.6002 | 50.50 | 42.03 | 26.7 | the site holds this flame (same day, ignition, fuel, nozzle) but at other fuel and air settings only |
| 75P16-5 | 52 | 16:22:17 | 75 % Propylene | 1.6002 | 37.99 | 28.87 | 21.1 | no site row has this day, ignition time, fuel and nozzle |
| 75P16-6 | 52 | no ku | 75 % Propylene | 1.6002 | 24.05 | 12.89 | 14.5 | the ignition cell reads "no ku", not a time |
| 75P16-7 | 119 | 10:28:17 | 75 % Propylene | 1.6002 | 23.57 | 12.89 | 14.2 | the site holds this flame (same day, ignition, fuel, nozzle) but at other fuel and air settings only |
| 75P16-8 | 119 | 10:38:34 | 75 % Propylene | 1.6002 | 34.63 | 26.99 | 20.4 | the site holds this flame (same day, ignition, fuel, nozzle) but at other fuel and air settings only |
| 75P16-9 | 136 | 15:57:26 | 75 % Propylene | 1.6002 | 25.01 | 16.65 | 15.6 | the site holds this flame (same day, ignition, fuel, nozzle) but at other fuel and air settings only |
| 75P16-10 | 136 | 15:52:00 | 75 % Propylene | 1.6002 | 29.34 | 23.23 | 17.9 | the site holds this flame (same day, ignition, fuel, nozzle) but at other fuel and air settings only |
| 75P7-1 | 52 | 17:30:18 | 75 % Propylene | 0.762 | 71.66 | 37.33 | 39.5 | no site row has this day, ignition time, fuel and nozzle |
| 75P7-2 | 136 | 17:21:33 | 75 % Propylene | 0.762 | 33.67 | 14.77 | 22.0 | the site holds this flame (same day, ignition, fuel, nozzle) but at other fuel and air settings only |
| 75P7-3 | 136 | 17:21:33 | 75 % Propylene | 0.762 | 32.70 | 14.77 | 20.2 | the site holds this flame (same day, ignition, fuel, nozzle) but at other fuel and air settings only |
| 50P16-1 | 55 | 09:39:14 | 50 % Propylene | 1.6002 | 119.22 | 40.15 | 41.7 | no site row has this day, ignition time, fuel and nozzle |
| 50P16-2 | 55 | 09:36:14 | 50 % Propylene | 1.6002 | 90.72 | 26.05 | 32.5 | no site row has this day, ignition time, fuel and nozzle |
| 50P16-3 | 167 | 09:20:12 | 50 % Propylene | 1.6002 | 66.88 | 12.89 | 26.5 | no site row has this day, ignition time, fuel and nozzle |
| 50P16-4 | 167 | 09:31:17 | 50 % Propylene | 1.6002 | 90.14 | 26.05 | 33.4 | no site row has this day, ignition time, fuel and nozzle |
| 50P16-5 | 167 | 09:39:28 | 50 % Propylene | 1.6002 | 120.38 | 40.15 | 42.4 | no site row has this day, ignition time, fuel and nozzle |
| 50P16-6 | 167 | 09:44:52 | 50 % Propylene | 1.6002 | 136.09 | 48.61 | 49.5 | no site row has this day, ignition time, fuel and nozzle |
| 50P16-7 | 55 | 08:56:16 | 50 % Propylene | 1.6002 | 59.90 | 11.01 | 22.1 | no site row has this day, ignition time, fuel and nozzle |
| P16-1 | 58 | 09:55:18 | Propylene | 1.6002 | 34.44 | 51.43 | 25.7 | no site row has this day, ignition time, fuel and nozzle |
| P16-2 | 58 | 09:47:05 | Propylene | 1.6002 | 25.01 | 33.57 | 19.6 | no site row has this day, ignition time, fuel and nozzle |
| P16-3 | 58 | 09:44:17 | Propylene | 1.6002 | 18.86 | 22.29 | 15.8 | no site row has this day, ignition time, fuel and nozzle |
| P16-4 | 58 | 09:37:52 | Propylene | 1.6002 | 15.17 | 9.13 | 14.0 | no site row has this day, ignition time, fuel and nozzle |
| P16-5 | 174 | 10:45:25 | Propylene | 1.6002 | 19.68 | 20.41 | 15.5 | the site holds this flame (same day, ignition, fuel, nozzle) but at other fuel and air settings only |
| P16-6 | 174 | 10:48:31 | Propylene | 1.6002 | 13.53 | 10.07 | 13.4 | the site holds this flame (same day, ignition, fuel, nozzle) but at other fuel and air settings only |
| P16-8 | 174 | 11:13:17 | Propylene | 1.6002 | 40.18 | 57.08 | 26.5 | the site holds this flame (same day, ignition, fuel, nozzle) but at other fuel and air settings only |
| P16-9 | 174 | 11:20:47 | Propylene | 1.6002 | 33.21 | 46.73 | 23.1 | the site holds this flame (same day, ignition, fuel, nozzle) but at other fuel and air settings only |
| P16-10 | 174 | 11:24:30 | Propylene | 1.6002 | 26.24 | 40.15 | 19.4 | the site holds this flame (same day, ignition, fuel, nozzle) but at other fuel and air settings only |
| P7-1 | 58 | 10:41:14 | Propylene | 0.762 | 34.44 | 41.09 | 26.6 | the site holds this flame (same day, ignition, fuel, nozzle) but at other fuel and air settings only |
| P7-2 | 58 | 10:36:19 | Propylene | 0.762 | 28.29 | 28.87 | 22.8 | the site holds this flame (same day, ignition, fuel, nozzle) but at other fuel and air settings only |
| P7-3 | 58 | 12:45:46 | Propylene | 0.762 | 26.24 | 26.99 | 21.7 | the site holds this flame (same day, ignition, fuel, nozzle) but at other fuel and air settings only |
| P7-4 | 174 | 12:34:00 | Propylene | 0.762 | 25.42 | 24.17 | 21.9 | the site holds this flame (same day, ignition, fuel, nozzle) but at other fuel and air settings only |
| P7-5 | 174 | 12:36:12 | Propylene | 0.762 | 18.04 | 12.89 | 15.9 | the site holds this flame (same day, ignition, fuel, nozzle) but at other fuel and air settings only |
| P7-6 | 174 | 12:43:03 | Propylene | 0.762 | 45.51 | 50.49 | 31.8 | the site holds this flame (same day, ignition, fuel, nozzle) but at other fuel and air settings only |
| P7-8 | 58 | 10:13:22 | Propylene | 0.762 | 16.81 | 7.24 | 14.2 | the site holds this flame (same day, ignition, fuel, nozzle) but at other fuel and air settings only |
| P4-1 | 58 | 11:32:00 | Propylene | 0.4064 | 55.76 | 26.99 | 53.3 | the site holds this flame (same day, ignition, fuel, nozzle) but at other fuel and air settings only |
| P4-2 | 58 | 11:25:49 | Propylene | 0.4064 | 46.33 | 14.77 | 47.0 | fits 2 site tests with identical cells (PSI-107/spice/250, PSI-107/spice/252), so no single test |
| P4-3 | 174 | 11:46:06 | Propylene | 0.4064 | 59.45 | 10.07 | 59.2 | the site holds this flame (same day, ignition, fuel, nozzle) but at other fuel and air settings only |
| P4-4 | 58 | 11:23:08 | Propylene | 0.4064 | 37.72 | 5.36 | 37.7 | the site holds this flame (same day, ignition, fuel, nozzle) but at other fuel and air settings only |

Also unused: rows 60 to 101 of the first sheet (other experiments), rows 103 to 119 (15 Nikon smoke heights, no day or time), and columns BD to BN (working copies for plots).

## Data II flame lengths (version 2)

a script now reads `.xls` cells with xlrd, so `PSI-107_Raw Data_Spice Flight Test Data II modified.xls` (sheet "Data record of Video and Stills", S3) is claimed cell by cell: `original_text` is the cell as the checker reads it (whole numbers as integers), `locator` is `Data record of Video and Stills!Q<row>` and so on, with the Excel row number.

- **Join rule:** the same as for the workbook (day, ignition, fuel, nozzle, fuel rate in sccm from column R, air speed in cm/s from column U), plus: no other Data II row may fit the same site test. Rows with a number in `Length` (Q): **134**; fit exactly one site row: **67**; fit none: **59**; fit two: **8**. Rows whose `Length` is text: 4. Claims made on 67 tests for `flame_length_mm`.
- **Other per-flame values in the sheet:** column W "Max Flame Width (mm)" and column Y "Flame Height Nikon (mm)" (21 rows each, none on a row with a `Length`), claimed as `flame_width_max_mm` (15 claims) and `flame_height_nikon_mm` (15 claims) where the row fits one site test. The pixel columns V and X are not claimed (no unit for the site). Column Z "Smoke Height" (Y/N, 73 rows) is not claimed: nothing says what Y and N mean. The displays, radiometer, gain and Nikon file columns are not claimed.
- **No NASA definition.** The sheet's headers are only "Length / mm", "Max Flame Width (mm)" and "Flame Height Nikon (mm)". The final report says only that "The entire test matrix and measured flame data are listed in Appendix A." (p. 14, pdf p. 20), and Appendix A is this file. It defines the *smoke point* length (p. 19), not the flame length of every flame, so `new_variables.csv` says `unknown` for all three variables.
- Basis `measured`: values were obtained by NASA from the video or the Nikon stills (pixel counts and a calibration); no uncertainty is given.
- Data II is a formatted row and a "data" row for some settings, with the same values; the join rule treats two rows that fit the same site test as ambiguous, so neither is claimed.

### Data II rows not claimed (77)

These are the 67 rows with a numeric `Length` that fit no site row or two, the 4 rows whose `Length` is text (an asterisk before the number; not read as a number), and the rows that carry only a flame width or height and fit no single site test.

| Excel row | GMT day | GMT ignition | Fuel | Nozzle mm | sccm | Air cm/s | Length mm | Why |
|---|---|---|---|---|---|---|---|---|
| 174 | 55 | 09:49:56 | 50 % Propylene | 0.762 | 97.12 | 11.01 | *58.8019 | the Length cell is text ("*58.8019"), not a number |
| 181 | 55 | 09:53:36 | 50 % Propylene | 0.762 | 65.72 | 26.99 | *35.4224 | the Length cell is text ("*35.4224"), not a number |
| 190 | 55 | 10:15:39 | 50 % Propylene | 0.762 | 88.40 | 25.11 | *50.4666 | the Length cell is text ("*50.4666"), not a number |
| 194 | 55 | 10:25:40 | 50 % Propylene | 0.762 | 64.55 | 26.99 | *32.5762 | the Length cell is text ("*32.5762"), not a number |
| 5 | 45 | 14:37:08 | Ethylene | 1.6002 | 103.80 | 36.39 | 46.20 | fits 2 site tests with identical cells (PSI-107/spice/1, PSI-107/spice/2) |
| 6 | 45 | 14:37:08 | Ethylene | 1.6002 | 103.80 | 36.39 |  | fits 2 site tests with identical cells (PSI-107/spice/1, PSI-107/spice/2) |
| 9 | 45 | 15:35:44 | Ethylene | 1.6002 | 138.00 | 57.08 | 56.16 | fits 2 site tests with identical cells (PSI-107/spice/5, PSI-107/spice/6) |
| 10 | 45 | 15:35:44 | Ethylene | 1.6002 | 138.00 | 57.08 |  | fits 2 site tests with identical cells (PSI-107/spice/5, PSI-107/spice/6) |
| 12 | 45 | 15:42:22 | Ethylene | 1.6002 | 69.00 | 58.02 | 24.44 | fits 2 site tests with identical cells (PSI-107/spice/8, PSI-107/spice/9) |
| 13 | 45 | 15:42:22 | Ethylene | 1.6002 | 69.00 | 58.02 |  | fits 2 site tests with identical cells (PSI-107/spice/8, PSI-107/spice/9) |
| 14 | 45 | 15:48:39 | Ethylene | 1.6002 | 63.60 | 17.59 | 27.49 | fits 2 site tests with identical cells (PSI-107/spice/10, PSI-107/spice/11) |
| 15 | 45 | 15:48:39 | Ethylene | 1.6002 | 63.60 | 17.59 |  | fits 2 site tests with identical cells (PSI-107/spice/10, PSI-107/spice/11) |
| 16 | 45 | 15:50:59 | Ethylene | 1.6002 | 34.80 | 16.65 | 13.67 | fits 2 site tests with identical cells (PSI-107/spice/12, PSI-107/spice/13) |
| 17 | 45 | 15:50:59 | Ethylene | 1.6002 | 34.80 | 16.65 |  | fits 2 site tests with identical cells (PSI-107/spice/12, PSI-107/spice/13) |
| 34 | 48 | 14.43.58 | Ethylene | 0.4064 | 118.80 |  |  | the site holds this flame (same day and ignition) but not at this fuel rate and air speed |
| 57 | 48 | 41856:00:00 | Propane | 1.6002 | 59.40 | 22.29 | 43.96 | the ignition cell is not a time |
| 58 | 48 | 41904:00:00 | Propane | 1.6002 | 29.16 | 22.29 | 19.16 | the ignition cell is not a time |
| 145 | 55 | 08:56:16 | 50 % Propylene | 1.6002 | 55.25 | 10.07 | 20.99 | no site row has this day and ignition time |
| 146 | 55 | 08:56:16 | 50 % Propylene | 1.6002 | 27.33 | 10.07 | 10.21 | no site row has this day and ignition time |
| 147 | 55 | 08:56:16 | 50 % Propylene | 1.6002 | 69.21 | 10.07 | 28.92 | no site row has this day and ignition time |
| 152 | 55 | 09:00:26 | 50 % Propylene | 1.6002 | 92.47 | 57.08 | 28.31 | no site row has this day and ignition time |
| 153 | 55 | 09:00:26 | 50 % Propylene | 1.6002 | 43.62 | 57.08 | 13.67 | no site row has this day and ignition time |
| 154 | 55 | 09:00:26 | 50 % Propylene | 1.6002 | 107.01 | 57.08 | 40.71 | no site row has this day and ignition time |
| 159 | 55 | 09:36:14 | 50 % Propylene | 1.6002 | 81.42 | 26.05 | 29.32 | no site row has this day and ignition time |
| 160 | 55 | 09:36:14 | 50 % Propylene | 1.6002 | 40.71 | 26.05 | 13.26 | no site row has this day and ignition time |
| 161 | 55 | 09:36:14 | 50 % Propylene | 1.6002 | 89.56 | 25.11 | 37.66 | no site row has this day and ignition time |
| 165 | 55 | 09:39:14 | 50 % Propylene | 1.6002 | 91.89 | 40.15 | 30.75 | no site row has this day and ignition time |
| 166 | 55 | 33:39:14 | 50 % Propylene | 1.6002 | 46.52 | 40.15 | 14.28 | no site row has this day and ignition time |
| 167 | 55 | 57:39:14 | 50 % Propylene | 1.6002 | 105.26 | 39.21 | 36.44 | no site row has this day and ignition time |
| 172 | 55 | 09:49:56 | 50 % Propylene | 0.762 | 106.43 | 11.95 | 43.76 | no site row has this day and ignition time |
| 173 | 55 | 09:49:56 | 50 % Propylene | 0.762 | 52.92 | 11.01 | 19.97 | no site row has this day and ignition time |
| 179 | 55 | 09:53:36 | 50 % Propylene | 0.762 | 67.46 | 26.05 | 23.83 | no site row has this day and ignition time |
| 180 | 55 | 09:53:36 | 50 % Propylene | 0.762 | 33.15 | 26.99 | 13.47 | no site row has this day and ignition time |
| 185 | 55 | 10:01:00 | 50 % Propylene | 0.762 | 45.36 | 42.03 | 16.31 | fits 2 site tests with identical cells (PSI-107/spice/181, PSI-107/spice/183) |
| 186 | 55 | 34:01:00 | 50 % Propylene | 0.762 | 23.26 | 42.03 | 7.98 | no site row has this day and ignition time |
| 198 | 55 | 34:34:07 | 50 % Propylene | 0.762 | 27.91 | 12.89 | 11.64 | no site row has this day and ignition time |
| 199 | 55 | 58:34:07 | 50 % Propylene | 0.762 | 28.50 | 22.29 | 10.82 | no site row has this day and ignition time |
| 200 | 55 | 82:34:07 | 50 % Propylene | 0.762 | 27.33 | 39.21 | 10.42 | no site row has this day and ignition time |
| 201 | 55 | 106:34:07 | 50 % Propylene | 0.762 | 27.33 | 45.79 | 9.20 | the ignition cell is not a time |
| 202 | 55 | 130:34:07 | 50 % Propylene | 0.762 | 27.91 | 50.49 | 11.03 | the ignition cell is not a time |
| 213 | 55 | 35:12:41 | 50 % Propylene | 0.4064 | 11.63 | 11.01 | 3.30 | no site row has this day and ignition time |
| 214 | 55 | 59:12:41 | 50 % Propylene | 0.4064 | 25.59 | 11.01 | 15.09 | no site row has this day and ignition time |
| 218 | 58 | 09:37:52 | Propylene | 1.6002 | 14.35 | 9.13 | 10.82 | no site row has this day and ignition time |
| 222 | 58 | 09:44:17 | Propylene | 1.6002 | 18.86 | 21.35 | 13.67 | no site row has this day and ignition time |
| 223 | 58 | 09:44:17 | Propylene | 1.6002 | 11.48 | 22.29 | 8.99 | no site row has this day and ignition time |
| 227 | 58 | 09:47:05 | Propylene | 1.6002 | 27.47 | 34.51 | 18.75 | no site row has this day and ignition time |
| 228 | 58 | 09:47:05 | Propylene | 1.6002 | 12.30 | 33.57 | 9.40 | no site row has this day and ignition time |
| 232 | 58 | 09:55:18 | Propylene | 1.6002 | 33.21 | 50.49 | 23.63 | no site row has this day and ignition time |
| 233 | 58 | 09:55:18 | Propylene | 1.6002 | 16.81 | 50.49 | 11.03 | no site row has this day and ignition time |
| 254 | 58 | 11:25:49 | Propylene | 0.4064 | 46.33 | 14.77 | 45.59 | fits 2 site tests with identical cells (PSI-107/spice/250, PSI-107/spice/252) |
| 269 | 58 | 12:42:59 | Propylene | 0.762 | 12.71 | 26.99 | 10.21 | fits 2 site tests with identical cells (PSI-107/spice/265, PSI-107/spice/266) |
| 273 | 62 | 11:16:54 | Methane | 1.6002 | 300.96 | 3.48 | 103.93 | no site row has this day and ignition time |
| 274 | 62 | 11:16:54 | Methane | 1.6002 | 151.20 | 2.54 | 47.01 | no site row has this day and ignition time |
| 277 | 62 | 11:20:10 | Methane | 1.6002 | 344.88 | 12.89 | 110.64 | no site row has this day and ignition time |
| 278 | 62 | 11:20:10 | Methane | 1.6002 | 172.80 | 12.89 | 48.43 | no site row has this day and ignition time |
| 281 | 62 | 11:25:41 | Methane | 1.6002 | 357.12 | 27.93 | 104.54 | no site row has this day and ignition time |
| 282 | 62 | 11:25:41 | Methane | 1.6002 | 180.72 | 26.99 | 46.20 | no site row has this day and ignition time |
| 285 | 62 | 11:27:39 | Methane | 1.6002 | 108.00 | 40.15 | 23.83 | no site row has this day and ignition time |
| 288 | 62 | 11:32:33 | Methane | 1.6002 | 216.00 | 44.85 | 51.28 | no site row has this day and ignition time |
| 289 | 62 | 11:32:33 | Methane | 1.6002 | 108.00 | 42.97 | 23.83 | no site row has this day and ignition time |
| 292 | 62 | 11:39:54 | Methane | 0.762 | 327.60 | 10.07 | 94.58 | no site row has this day and ignition time |
| 293 | 62 | 11:39:54 | Methane | 0.762 | 180.00 | 9.13 | 56.77 | no site row has this day and ignition time |
| 296 | 62 | 11:41:52 | Methane | 0.762 | 215.28 | 23.23 | 64.09 | no site row has this day and ignition time |
| 297 | 62 | 11:41:52 | Methane | 0.762 | 109.44 | 23.23 | 30.34 | no site row has this day and ignition time |
| 300 | 62 | 11:45:51 | Methane | 0.762 | 215.28 | 38.27 | 60.63 | no site row has this day and ignition time |
| 302 | 62 | 11:55:25 | Methane | 0.762 | 36.00 | 10.07 | 9.20 | no site row has this day and ignition time |
| 303 | 62 | 11:55:25 | Methane | 0.762 | 36.00 | 14.77 | 8.38 | no site row has this day and ignition time |
| 304 | 62 | 11:55:25 | Methane | 0.762 | 36.00 | 20.41 | 8.18 | no site row has this day and ignition time |
| 305 | 62 | 11:55:25 | Methane | 0.762 | 35.28 | 35.45 | 7.98 | no site row has this day and ignition time |
| 306 | 62 | 11:55:25 | Methane | 0.762 | 34.56 | 42.03 | 7.57 | no site row has this day and ignition time |
| 307 | 62 | 11:55:25 | Methane | 0.762 | 35.28 | 47.67 | 7.37 | no site row has this day and ignition time |
| 314 | 62 | 12:03:33 | Methane | 0.4064 | 50.40 | 6.30 | 13.06 | no site row has this day and ignition time |
| 315 | 62 | 12:03:33 | Methane | 0.4064 | 50.40 | 24.17 | 12.04 | no site row has this day and ignition time |
| 322 | 62 | 12:12:40 | Methane | 0.4064 | 51.12 | 15.71 | 13.26 | no site row has this day and ignition time |
| 323 | 62 | 12:12:40 | Methane | 0.4064 | 51.12 | 24.17 | 13.06 | no site row has this day and ignition time |
| 324 | 62 | 12:12:40 | Methane | 0.4064 | 51.12 | 26.99 | 13.06 | no site row has this day and ignition time |
| 325 | 62 | 12:12:40 | Methane | 0.4064 | 51.12 | 27.93 | 13.26 | no site row has this day and ignition time |

## What could not be done

- `PSI-107_Raw Data_Spice_Flight_Flamelength.xls` is not claimed: it has no day, time or fuel, so no row can be tied to a test.
- **No outcome claim.** NASA's files do not say whether each of the 469 flames reached its smoke point.

## NASA's findings in words

- F1, p. 2: Definition of the laminar smoke point.
- F2, p. 2: Number of smoke points found (abstract says 52; Table 1 adds to 52; closing remarks say 55; the datasheet lists 55).
- F3, p. 2: Range of burner diameters and co-flow velocities.
- F4, p. 2: Effect of co-flow velocity and burner size on flame length and smoke point.
- F5, p. 2: Luminous flame length correlates with fuel mass flow rate divided by stoichiometric mixture fraction.
- F6, p. 2: Smoke point length scales as burner diameter to the -0.91 power times coflow velocity to the 0.41 power.
- F7, p. 2: Propane has an unusually high sooting propensity in microgravity.
- F8, p. 19: Burn time and the oxygen in the ISS cabin air used as the oxidizer.
- F9, p. 19: How the smoke point length was measured.
- F10, p. 19: Uncertainty in where the luminous flame tip is.
- F11, p. 20: Number of flames ignited in the flight tests.
- F12, p. 20: Time for a flame to reach steady conditions.
- F13, p. 20: Periodic flame motion in some flames.
- F14, p. 20: No methane smoke point was obtained.
- F15, p. 20: Table 1: number of smoke points per fuel (C2H4, C3H8, C3H6, 75% C3H6, 50% C3H6).
- F16, p. 20: Pressure, temperature and oxygen are assumed in the report's calculations, not measured.
- F17, p. 21: Smoke point length increases with coflow velocity.
- F18, p. 21: Smoke point length decreases with burner diameter.
- F19, p. 22: Repeatability of smoke points; the 0.41 mm burner gave different smoke points on different days.
- F20, p. 22: Sooting propensity order as written on p. 16 of the report (propane lowest).
- F21, p. 22: Ethylene has a longer smoke point than propane for the 0.76 mm burner.
- F22, p. 24: Number of smoke points measured (closing remarks).
- F23, p. 24: Sooting propensity order in microgravity (closing remarks).

**Disagreements inside NASA's own report (not adjusted):** (1) the abstract and Table 1 say 52 smoke points (6 + 6 + 20 + 13 + 7 = 52), the closing remarks say 55, and the workbook lists 55 flames (F2, F15, F22). (2) p. 16 of the report (pdf p. 22) writes the sooting order as rising "from propane to ethylene", the closing remarks (p. 18) write "ethylene < propane", and the abstract says propane has an "unusually high sooting propensity" (F20, F23, F7). (3) The report says 526 flames were ignited (p. 14, pdf p. 20, F11); the `.xls` file has 526 data rows from row 5, which come in pairs for some settings (a formatted row and a "data" row with the same values); the site's table has 469 rows. The site should not show one number for "how many smoke points" without saying which source.

**Reproduction.** The report gives smoke point lengths only as ranges per fuel in Table 1 (`LSP, mm`: C2H4 37 - 105, C3H8 46 - 105, C3H6 13 - 59, 75% C3H6 15 - 44, 50% C3H6 22 - 50). The 4 matched lengths: 22 (Ethylene, 105.2 mm, Table 1 range 37 - 105: OUTSIDE); 400 (75 % Propylene, 44.0 mm, Table 1 range 15 - 44: inside); 412 (Propylene, 17.6 mm, Table 1 range 13 - 59: inside); 468 (Propylene, 26.3 mm, Table 1 range 13 - 59: inside). This is a plausibility check against ranges, not a reproduction of a per-test number. E7-1 is 105.22 mm, 0.22 mm beyond the printed range limit of 105 mm (Table 1 prints whole numbers). Nothing was adjusted.

## Scoreboard

Counted with the loader's own `scoreboard()`. SPICE burns gases, so the solid-fuel counts do not change.

evidence pack pack (PSI-107): 85 tests, 0 of them new
    flame_length_mm: 67 tests gained a value
    flame_width_max_mm: 15 tests gained a value
    flame_height_nikon_mm: 15 tests gained a value
    smoke_point_length_mm: 4 tests gained a value
    disagreements with the table: 8
    kept for later use: 23 rows of findings
scoreboard, before and after the packs:
    solid-fuel tests: 380 -> 380
    with oxygen: 140 -> 140
    with air speed: 251 -> 251
    with oxygen and air speed: 132 -> 132
    with oxygen, air speed and what happened: 11 -> 11
    with a pressure NASA states: 0 -> 0


## Validator warnings

- `WARNING  claims.csv line 3 (C2): differs from the value already held (17.59); both will be shown, so check the source once more`
- `WARNING  claims.csv line 6 (C5): differs from the value already held (38.27); both will be shown, so check the source once more`
- `WARNING  claims.csv line 9 (C8): differs from the value already held (29.81); both will be shown, so check the source once more`
- `WARNING  claims.csv line 12 (C11): differs from the value already held (31.69); both will be shown, so check the source once more`

The flow-speed warnings are expected: PSI's table gives the air speed rounded to 0.01 cm/s, the workbook's cell is NASA's unrounded value (for example 17.5870 against 17.59). Both are kept, as rule 1 asks. The scoreboard's "disagreements with the table" count for this pack (8) has the same cause for the 4 flow speeds; the other 4 are `size_mm`, where the scoreboard's stand-in records (rebuilt from known_tests.csv, which has no real nozzle sizes) cannot be compared with 0.762 and 1.6002 from the workbook; the web side's run on the real records is the final word.

<!-- guide_findings:start -->
## NASA's Researcher's Guide (version 3)

Source G1: A Researcher's Guide to: Combustion Science (NASA ISS Program Science Office, 2015). The NASA Space Apps challenge page lists it under "NASA Data & Resources". PSI holds the same
file in the folders of PSI-20, PSI-21, PSI-22 and PSI-23; G1 points to the PSI-20 copy (1,532,064 bytes, sha256
`d85c92823f8917979df00e09e8e0ca40f42092a330ef30dcb8a8af34e7ee6bc0`). It has no test tables. a script cuts each sentence below word for word from the PDF's text
(PyMuPDF), from given first and last words, and stops if they are not found once on the stated page.

| Finding | Page | What it says |
|---|---|---|
| F24 | p. 15 | Some 2009 SPICE runs were exploratory tests of lifted flames for SLICE |

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

- version 3 built by a script on top of the published version; a script and
  `validate_pack.py` were run before and after, with no new mismatch, error or warning.
<!-- guide_findings:end -->
