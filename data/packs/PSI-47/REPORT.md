# PSI-47 DAFT: evidence pack, version 1

DAFT (Dust and Aerosol measurement Feasibility Test) was not a fire test. It checked, on the ISS, that the P-Trak particle counter that SAME would use for smoke still counts correctly without gravity, by reading the same air with a P-Trak (particle number per cm3) and a DustTrak (particle mass per m3). What a smoke detector would see is exactly what these two instruments report, so job 6 applies, but the aerosol was Arizona Road Dust and ISS cabin air, never smoke.

The pack holds 70 claims on 6 tests (4 of them new) and 22 findings. Nothing is derived by us or assumed.

| Variable | Claims | What it is |
|---|---|---|
| `particle_number_conc_cm3` (new) | 14 | P-Trak count: each bag's mean, four witnesses each; for test point #1, NASA's 300 to 600 s mean and the range the crew relayed |
| `particle_mass_conc_mg_m3` (new) | 12 | DustTrak mass concentration: each bag's mean, four witnesses each |
| `mass_per_particle_g` (new) | 12 | NASA's mass per particle: DustTrak mean over P-Trak mean |
| `particle_diameter_mass_um` (new) | 12 | NASA's diameter of a sphere of that mass at an assumed 1 g/cm3 |
| `dust_fill_toggles` (new) | 3 | Fill-valve toggles that put dust into each bag (4, 6, 8) |
| `fuel` | 6 | Arizona Road Dust (Fine) for the bags; ISS cabin air for D1, D2 and D3 |
| `test_date` | 10 | Dates of D1, D2 and the bags |
| `description` | 1 | Session D3: test plan aborted, cabin air sampled instead |

## Scoreboard

DAFT burned nothing, so the solid-fuel counts do not move. Counted with the loader's `scoreboard()` on records rebuilt from `known_tests.csv`; the loader raised 28 quality findings (28 sources-disagree): the bag averages where the four NASA sheets differ, and test point #1's two P-Trak values (see "Sources that disagree"). The bags' mass-per-particle values differ between sheets too (3 bags), but the loader does not flag them: it compares numbers with an absolute slack of 0.000001, larger than these values (about 2E-12 g).

| Count | Before | After |
|---|---|---|
| solid-fuel tests | 380 | 380 |
| with oxygen | 140 | 140 |
| with air speed | 251 | 251 |
| with oxygen and air speed | 132 | 132 |
| with oxygen, air speed and what happened | 11 | 11 |
| with a pressure NASA states | 0 | 0 |


## What the files hold

| File | What it holds | Used |
|---|---|---|
| `PSI-47_Analyzed Data_DAFT Retrieved Data Summary.xls` (1 MB) | Sheets "Raw PTrak Data" and "Raw DustTrak Data": the two instruments' logs, one reading a second, as TestIDs 1 to 7 (dates and times as Excel serials). "Headers": each TestID's start, duration and number of points. "Voice Down Data Summary": the crew's readings every 30 s for Bags #1 to #3, their means, mass per particle and diameter. "Logged Data Summary": the same arithmetic on stretches of the logs. "P-Trak vs. DustTrak Data": the logged stretches side by side per bag | S1: bag averages, reproduction |
| `PSI-47_Analyzed Data_ISS_Daft_Aug21_06 urban.xls` | A copy of the voiced-down sheet (Bag #3 shifted by three rows) | S3: bag averages |
| `PSI-47_Analyzed Data_ISS_Daft_Aug21_0611zgy time hist.xls` | Another copy, titled "DAFTl ISS test result, August 21, 2006", with each reading's GMT and "Assumed density 1 g/cm^3" | S4: bag averages, date |
| `PSI-47_Reports_DAFT_FinalReport.doc` | The final report: sessions, hardware, definitions of both readings, results | S2: definitions, dates, materials, toggles, findings |
| `PSI-47_Reports_DAFT_1YearReport.doc` | An earlier draft of the final report: same sections, fewer words, no statement that the logs were recovered | Read, not used |
| `PSI-47_Reports_DAFT_30Day.PostFlightReport.pdf` | An earlier version again. Its text layer is broken (letters and lines out of order), so quotes could not be checked against it | Read, not used |
| `PSI-47_Presentations_Daft_FactSheet.pdf` | Two-page fact sheet, written between the 2005 and 2006 sessions | S5: cabin-air findings |
| `PSI-47_Analyzed Data_DAFT Flight Data GMT053.xls` | A note on session D1 (sheet "text"), and the P-Trak and DustTrak logs of TestID 1 with one cell of NASA's arithmetic: "average 300 to 600 ptrack" | S6: D1 date and P-Trak mean |
| `PSI-47_Analyzed Data_flight data 063.xls` | Logs of TestIDs 2 to 4 and a "TIMING" sheet (HEPA filter, hose and Velcro times from the video, tests 02 and 03) | S7: D2 date, reproduction |
| The six `flight data 063_*Trk000n.xls` and six `Raw Data_*.txt` | Single logs of TestIDs 2 to 4 (the same numbers as above; only `PTrk0002.txt` and `DTrk0002.txt` were opened) | Not used |
| Engineering procedures (4 PDFs), P-Trak condenser drawing, metadata zip | Procedures and hardware, no results | Not used |
| Three PowerPoint files (6 to 8.3 MB), one JPEG | Presentations and pictures | Not downloaded |

**One row of the Retrieved Data Summary is one second of one instrument's log.** It is not a test. NASA's per-test values are the per-bag rows of the two summary sheets.

**What a test is.** PSI's table has one row per session. Session D1 (GMT 54, 2005) is test point #1. Session D2 (GMT 63, 2005) holds test points #2, #3 and #4 (Velcro debris, Lab port 6, Node 1). The science run, Session D5 on GMT 233, 2006, sampled three dust bags; PSI's table does not list it, so each bag is a new test. Session D3 (GMT 229, 2006) was aborted and a cabin-air sample taken instead; it is a new test too, kept because a test that did not work is still data. D4 (GMT 230, 2006) had no crew operations and is not a test.

**Which log is which bag.** NASA's formulas in "Logged Data Summary" (read in the LibreOffice copy) average TestID 6 for Bag #1 and two stretches of TestID 7 for Bags #2 and #3. TestID 5 starts on 17 August 2006 (GMT 229), the day of the aborted session D3. NASA states no value for TestID 5, so D3 gets no reading.

## How each value was taken

- Each bag's four numbers are copied from four places: "Logged Data Summary" and "Voice Down Data Summary" in the Retrieved Data Summary, and the "Data" sheets of the two Aug21 workbooks. All are formula results in NASA's sheets; the value is what the sheet stores, in full precision. The logged version is listed first, because it is the instruments' own record; nothing is averaged or picked.
- **Mass per particle and diameter are NASA's calculation, not ours**, and rest on an assumption NASA states: mass per particle = DustTrak mean / (P-Trak mean x 10^9), in grams; diameter = (6 x mass / (pi x density))^(1/3), in micrometers, with density 1 g/cm3 (the report says "assuming a material density of water"). They are marked `basis` computed. Arizona Road Dust is mineral dust, much denser than water; NASA does not discuss this, so neither does the pack.
- **Test point #1's P-Trak values.** NASA's cell "average 300 to 600 ptrack" in `PSI-47_Analyzed Data_DAFT Flight Data GMT053.xls` (formula `AVERAGE(B308:B608)`, read in the LibreOffice copy) is the mean from 300 to 600 s of the log. The range 2 to 5 pt/cc is the crew's spot readings relayed by voice, from the report's words; it is not a mean. Both are kept.
- **Toggles.** Bag #1's four toggles are the "requested" number in a paragraph just before Bag #1 is extracted; Bags #2 and #3 are stated plainly. This is a reading of the paragraph order.
- **Material.** PSI's table gives "Arizona Road Dust (ARD Fine) ..." as the sample material for D1 and D2. The report says those sessions sampled cabin air, because the dust had not yet been launched. The claims follow the report.
- **Dates.** PSI's table and the report's heading give D1 as GMT 54, 2005; the report's text, the file name `GMT053` and the instrument log say 22 February 2005, which is GMT 53. Both claims on D1 say 22 February. For D3, the report says "scheduled to be performed on August 18, 2006 (GMT 229)", but GMT 229 of 2006 is 17 August, and the log of TestID 5 starts on 17 August. No date is claimed for D3.
- `pt/cc`, `particles/cc` and `n/cm3` in NASA's files are all particles per cubic centimeter; no conversion was needed. NASA's text stays in `original_text`.
- Not claimed: the per-reading voiced-down values and the logs as curves (`series.csv`), whose time bases differ between the copies (Bag #3 starts at 10 s in one and 90 s in the others); the slope cells "slop 0g", "slop 1g", "slop ratio" and "0gD/1gD", which have no unit in the sheet, use Bag #1 only, and take the 1 g slope from a typed constant (100/130000) with no stated source; and TestID 5, which NASA never summarises.

## New variables

| Variable | Unit | NASA's definition |
|---|---|---|
| `particle_number_conc_cm3` | particles/cm³ | "The P-Trak gives a number count of the particles in an aerosol, in readings of particles/cm3." (PSI-47_Reports_DAFT_FinalReport.doc, section II.A (Discussion of Method/Protocol)) |
| `particle_mass_conc_mg_m3` | mg/m³ | "DustTrak gives measurements of the total mass, in mg/m3." (PSI-47_Reports_DAFT_FinalReport.doc, section II.A (Discussion of Method/Protocol)) |
| `mass_per_particle_g` | g | "Mass Per Particle (gram)" (PSI-47_Analyzed Data_DAFT Retrieved Data Summary.xls, Voice Down Data Summary!A23) |
| `particle_diameter_mass_um` | µm | "Particle Diameter (micon)" (PSI-47_Analyzed Data_ISS_Daft_Aug21_0611zgy time hist.xls, Data!B27) |
| `dust_fill_toggles` | count | "Six toggles were used to introduce dust into Sample Bag #2." (PSI-47_Reports_DAFT_FinalReport.doc, section II.D.5 (DAFT-3, Session 1, GMT 233, 2006)) |

The SAME-R pack (PSI-101) defines `smoke_diameter_average_mass_um` from size distributions measured on grids. DAFT's diameter is a different quantity (one mass per particle, an assumed density), so it has its own variable.

## Sources that disagree

The four sheets do not give the same bag averages. All are kept; the loader compares each with the first listed (the logged one) and raises a quality finding where they differ.

| Bag | Variable | Logged | Voice-down | Time-history copy | Urban copy |
|---|---|---|---|---|---|
| Sample Bag #1 | `particle_number_conc_cm3` | 17236 | 17314 | 17314 | 17314 |
| Sample Bag #1 | `particle_mass_conc_mg_m3` | 45.63 | 43.15 | 43.15 | 43.15 |
| Sample Bag #1 | `mass_per_particle_g` | 2.648e-12 | 2.492e-12 | 2.492e-12 | 2.492e-12 |
| Sample Bag #1 | `particle_diameter_mass_um` | 1.716 | 1.682 | 1.682 | 1.682 |
| Sample Bag #2 | `particle_number_conc_cm3` | 16589 | 17256 | 17256 | 17256 |
| Sample Bag #2 | `particle_mass_conc_mg_m3` | 33.84 | 34.09 | 34.09 | 34.09 |
| Sample Bag #2 | `mass_per_particle_g` | 2.040e-12 | 1.975e-12 | 1.975e-12 | 1.975e-12 |
| Sample Bag #2 | `particle_diameter_mass_um` | 1.573 | 1.557 | 1.557 | 1.557 |
| Sample Bag #3 | `particle_number_conc_cm3` | 26578 | 24350 | 24350 | 24522 |
| Sample Bag #3 | `particle_mass_conc_mg_m3` | 62.65 | 63.18 | 63.18 | 63.29 |
| Sample Bag #3 | `mass_per_particle_g` | 2.357e-12 | 2.595e-12 | 2.595e-12 | 2.581e-12 |
| Sample Bag #3 | `particle_diameter_mass_um` | 1.651 | 1.705 | 1.705 | 1.702 |

- Logged and voiced-down means differ because they average different readings (one a second from the log, against one every 30 s called down by the crew, over windows NASA chose). Bag #3's P-Trak mean is +9.1% logged against voiced-down.
- The urban copy's Bag #3 values come from an average over 9 of the 12 readings, as explained in its claims' notes.
- The logged Bag #1 DustTrak mean rests on 54 readings (TestID 6, which the DustTrak logged for only 271 seconds; the sheet "P-Trak vs. DustTrak Data" notes "**Bag1 DustTrak started after P-Trak.  Zero-filled non-existent data."), against 466 P-Trak readings.
- Test point #1 has two P-Trak values that are not the same kind: NASA's mean over 300 to 600 s (1.43 particles/cm3) and the 2 to 5 pt/cc the crew read out. The notes say which is which.

## For the web side

1. **Three new tests, one new aborted session.** The bags carry dates, material, dust dose and all four readings; D3 carries only what happened.
2. **PSI's DAFT table mislabels two columns.** Its "Hardware Description" for D1 ("Contained the modified P-Trak with Alcohol Wick and batteries") and D2 ("Contained DustTrak and batteries") is the description of the hardware packages DAFT-1 and DAFT-2 (final report, section II.B). Both sessions used both instruments (Sessions table: DAFT-0201 and DAFT-0101 for each). Its "Sample Material" is Arizona Road Dust for both, but they sampled cabin air.
3. **Session D2 is three test points.** If the site wants them apart, the logs of TestIDs 2, 3 and 4 are in `PSI-47_Analyzed Data_flight data 063.xls`.
4. **A pair is close but not claimed.** NASA's sheet compares the orbit's count/mass slope with a ground slope (ratio 3.24, diameter ratio 1.48). It would be the first 0 g / 1 g pair for an aerosol, but the 1 g slope has no unit or source in the files read.
5. **Two copies of one log disagree.** Test point #1's P-Trak log in `PSI-47_Analyzed Data_DAFT Flight Data GMT053.xls` and in the Retrieved Data Summary differ in 1 reading (second 324: 3 against 524291). The larger looks like a corrupted value, but no NASA file says so; nothing is claimed from it.
6. **The loader's number comparison** treats any two values closer than 0.000001 as equal, so the mass-per-particle disagreements (about 1E-13 g apart) pass silently. HANDOVER request 4 (compare within uncertainty) would fix this too.
7. The Safety page can say: on the ISS, cabin air read fewer than 15 particles/cm3 and 0.005 mg/m3, and in microgravity the dust particles counted were heavier than on Earth because large ones do not settle.

## Anything in the data brief the files prove wrong

- The brief lists the summary as the file to read for per-test values. **It holds no per-test table for the tests PSI lists.** Its per-test values are for the three 2006 sample bags, which PSI's table does not have. For D1 and D2 it holds only the raw logs.
- The brief says DAFT is a smoke-detection experiment. It tested the instrument with mineral dust and cabin air; no smoke was made.
- "Particle size" in the summary is not a measured size: it is a diameter computed from mass over count at an assumed density.
- Not from the brief, but worth knowing: the final report first says the 2006 logs were not received ("The devices were both queried for test points 5, 6 and 7, and no data was found"), and later that they were read from the instruments' memory after return. The Retrieved Data Summary is that recovered data, so the 30-day report's statement that only the 2005 data came back is out of date.

## Validator warnings

None.

## Reproduction

**NASA's averages, from the original cells.** Every stored average was recomputed with xlrd from the original .xls, over the range NASA's formula names (read in the LibreOffice copy). All 25 agree to 1 part in 10^9:

| File | Cell | Range | Readings | Stored | Recomputed |
|---|---|---|---|---|---|
| DAFT Retrieved Data Summary.xls | Voice Down Data Summary!B21 | Voice Down Data Summary!B3:B16 | 14 | 17314.3 | 17314.3 |
| DAFT Retrieved Data Summary.xls | Voice Down Data Summary!C21 | Voice Down Data Summary!C3:C16 | 14 | 43.15 | 43.15 |
| DAFT Retrieved Data Summary.xls | Voice Down Data Summary!E21 | Voice Down Data Summary!E3:E18 | 16 | 17256.2 | 17256.2 |
| DAFT Retrieved Data Summary.xls | Voice Down Data Summary!F21 | Voice Down Data Summary!F3:F18 | 16 | 34.0875 | 34.0875 |
| DAFT Retrieved Data Summary.xls | Voice Down Data Summary!H21 | Voice Down Data Summary!H3:H14 | 12 | 24350 | 24350 |
| DAFT Retrieved Data Summary.xls | Voice Down Data Summary!I21 | Voice Down Data Summary!I3:I14 | 12 | 63.1833 | 63.1833 |
| 06 urban.xls | Data!B21 | Data!B3:B16 | 14 | 17314.3 | 17314.3 |
| 06 urban.xls | Data!C21 | Data!C3:C16 | 14 | 43.15 | 43.15 |
| 06 urban.xls | Data!E21 | Data!E3:E18 | 16 | 17256.2 | 17256.2 |
| 06 urban.xls | Data!F21 | Data!F3:F18 | 16 | 34.0875 | 34.0875 |
| 06 urban.xls | Data!H21 | Data!H3:H14 | 9 | 24522.2 | 24522.2 |
| 06 urban.xls | Data!I21 | Data!I3:I14 | 9 | 63.2889 | 63.2889 |
| 0611zgy time hist.xls | Data!C23 | Data!C5:C18 | 14 | 17314.3 | 17314.3 |
| 0611zgy time hist.xls | Data!D23 | Data!D5:D18 | 14 | 43.15 | 43.15 |
| 0611zgy time hist.xls | Data!G23 | Data!G5:G20 | 16 | 17256.2 | 17256.2 |
| 0611zgy time hist.xls | Data!H23 | Data!H5:H20 | 16 | 34.0875 | 34.0875 |
| 0611zgy time hist.xls | Data!K23 | Data!K8:K19 | 12 | 24350 | 24350 |
| 0611zgy time hist.xls | Data!L23 | Data!L8:L19 | 12 | 63.1833 | 63.1833 |
| DAFT Retrieved Data Summary.xls | Logged Data Summary!B5 | Raw PTrak Data!R533:R998 | 466 | 17236.3 | 17236.3 |
| DAFT Retrieved Data Summary.xls | Logged Data Summary!C5 | Raw DustTrak Data!R2:R55 | 54 | 45.6343 | 45.6343 |
| DAFT Retrieved Data Summary.xls | Logged Data Summary!E5 | Raw PTrak Data!U222:U644 | 423 | 16589.4 | 16589.4 |
| DAFT Retrieved Data Summary.xls | Logged Data Summary!F5 | Raw DustTrak Data!U250:U646 | 397 | 33.8377 | 33.8377 |
| DAFT Retrieved Data Summary.xls | Logged Data Summary!H5 | Raw PTrak Data!U1793:U2169 | 377 | 26578 | 26578 |
| DAFT Retrieved Data Summary.xls | Logged Data Summary!I5 | Raw DustTrak Data!U1847:U2205 | 359 | 62.6509 | 62.6509 |
| DAFT Flight Data GMT053.xls | PTrk0001!H35 | PTrk0001!B308:B608 | 301 | 1.43189 | 1.43189 |

**Mass per particle and diameter.** For all 12 sheet-and-bag rows, DustTrak mean / (P-Trak mean x 10^9) gives the stored mass per particle, and (mass / (3.1415926/6))^(1/3) x 10^4 at density 1 gives the stored diameter: 12 of 12 agree.

**Finding F13: "The average mass ... is 2.5 E-12 grams, with a range from 2 – 3 E-12".** The voiced-down masses are 2.492e-12, 1.975e-12, 2.595e-12 g (mean 2.35e-12); the logged ones 2.648e-12, 2.040e-12, 2.357e-12 g (mean 2.35e-12). The range 2 to 3 E-12 does not hold for every bag in both sheets. **The mean does not reproduce 2.5E-12**: the voiced-down mean is 2.35e-12 and the logged mean 2.35e-12. Bag #1's voiced-down value, 2.49e-12, is the one that rounds to 2.5E-12; the report does not say which it means. Not adjusted.

**Finding F14: "The calculated average diameter is 1.65 micron, ranging from 1.56 – 1.7 micron".** Voiced-down diameters 1.682, 1.557, 1.705 µm, mean 1.6479 (the sheet's own "Average D (micron)" is 1.6479); logged 1.716, 1.573, 1.651 µm, mean 1.6470. **Reproduces** from both sheets; the voiced-down range 1.557 to 1.705 matches "1.56 – 1.7".

**"The stored data reproduced the read downs very closely."** Logged against voiced-down, per bag: P-Trak -0.5%, -3.9%, +9.1%; DustTrak +5.8%, -0.7%, -0.8%. The largest gap is 9.1%. "Very closely" is NASA's judgement; the numbers are given so the reader can make their own.

**"Optimal ... 30,000 – 100,000 pt/cc ... and for the DustTrak; 20 – 80 mg/m3. Clearly, the latest data was within this range."** The P-Trak bag means are 17314, 17256, 24350 (voiced-down) and 17236, 16589, 26578 particles/cm3 (logged); 3 of Bag #3's 12 voiced-down readings (36,500, 34,300, 30,000) reach 30,000. **Does not reproduce for the P-Trak**: 6 of 6 bag means are below 30,000. The DustTrak means, 43.1, 34.1, 63.2 mg/m3, are inside 20 to 80.

**"As the run time on the P-Trak is increasing, especially during Bag #3, the count/mass ratio is declining."** Bag #3's voiced-down P-Trak/DustTrak ratio, by time: 10 s: 594, 30 s: 553, 60 s: 498, 90 s: 400, 120 s: 341, 150 s: 308, 180 s: 242, 210 s: 179, 240 s: 396, 270 s: 391, 300 s: 409, 330 s: 346. It falls from 594 to 179 by 210 s, then ends at 346. **Partly reproduces**: it declines over the first part of the bag, not to the end.

**Fact sheet: cabin-air tests "averaging fewer than 0.005 mg/m3 ... and fewer than 15 particles/cm3".** Means of the whole logs in the Retrieved Data Summary (zero checks and set-up included, since NASA does not say which stretch it averaged):

| TestID | Test point | P-Trak readings | P-Trak mean | P-Trak max | DustTrak readings | DustTrak mean (mg/m3) | DustTrak max |
|---|---|---|---|---|---|---|---|
| 1 | #1 | 724 | 752.2 | 524291 | 771 | 0.0104 | 6.273 |
| 2 | #2 (Velcro) | 724 | 1616.4 | 45400 | 778 | 0.0055 | 0.790 |
| 3 | #3 | 707 | 1.2 | 10 | 754 | 0.0029 | 1.024 |
| 4 | #4 | 455 | 1.2 | 76 | 545 | 0.0053 | 0.837 |

Test point #3 between the hose going on and off (TIMING sheet: P-Trak 100 to 621 s, DustTrak 153 to 666 s after log on): P-Trak mean 1.2 particles/cm3 over 522 readings, DustTrak mean 0.0003 mg/m3 over 514 readings. Test point #1 over NASA's own window, 300 to 600 s (`PSI-47_Analyzed Data_DAFT Flight Data GMT053.xls`, PTrk0001!H35): 1.43 particles/cm3 in the 2005 file, 1743.25 from the same seconds of the Retrieved Data Summary.

- **P-Trak, fewer than 15 particles/cm3:** whole-log means under 15 for test points #3, #4; not for #1. Test point #1's whole-log mean is lifted by the reading in which the two copies of its log differ (see below); over NASA's 300 to 600 s window it is 1.43. **Reproduces** for all three test points, with NASA's own window for #1.
- **DustTrak, fewer than 0.005 mg/m3:** whole-log means under 0.005 for #3; above it for #1, #4, where short peaks (up to the maxima in the table) at start-up and around the zero checks lift the mean. Inside the hose window, test point #3 reads 0.0003. NASA does not say which readings it averaged, so **this neither reproduces nor contradicts** the statement for #1 and #4; nothing is adjusted.

**The two copies of test point #1's P-Trak log differ in 1 reading:** second 324: 3 in the 2005 file, 524291 in the Retrieved Data Summary. All other readings are equal. The Retrieved Data Summary's header lists TestIDs 1, 2, 3, 4, 5, 6, 7 with 724, 724, 707, 455, 2330, 1187, 2292 P-Trak points.

Not attempted: the report's statement that orbit points sit left of the ground line (it needs the ground data, which exist only as a plotted figure).

<!-- guide_findings:start -->
## NASA's Researcher's Guide (version 2)

Source G1: A Researcher's Guide to: Combustion Science (NASA ISS Program Science Office, 2015). The NASA Space Apps challenge page lists it under "NASA Data & Resources". PSI holds the same
file in the folders of PSI-20, PSI-21, PSI-22 and PSI-23; G1 points to the PSI-20 copy (1,532,064 bytes, sha256
`d85c92823f8917979df00e09e8e0ca40f42092a330ef30dcb8a8af34e7ee6bc0`). It has no test tables. a script cuts each sentence below word for word from the PDF's text
(PyMuPDF), from given first and last words, and stops if they are not found once on the stated page.

| Finding | Page | What it says |
|---|---|---|
| F23 | p. 26 | Why DAFT flew: fire detection in a spacecraft, and the ISS's background dust |

The SI tool chose the sentences. The team's six members have checked them.

### Reproduction (Guide findings)

No Guide finding in this pack gives a number, so there is nothing to reproduce.

### Not used from the Guide, and why

- p. 21, BASS: "BASS tests the hypothesis that materials in microgravity, with adequate ventilation, burn as well if not better ...": a hypothesis, not a result.
- pp. 14-18, the five ACME experiments (BRE, CLD Flame, E-FIELD Flames, Flame Design, s-Flame): plans written before ACME flew, so no ACME result. The one exception is a sentence on what earlier research found, which is PSI-21's Guide finding. ACME's results are in the NTRS overview these packs already quote.
- pp. 12-15, FLEX-2 and SLICE (no pack): descriptions and purposes only, no results.
- pp. 34-35, Apollo 1 and Apollo 13: context, not a result. The web side can quote it on the site from p. 34.
- pp. 23-25, SoFIE and other planned investigations: plans.
- CFI, BASS-II, Saffire and the gas-flame experiment CFI-G are not named in the Guide.

- version 2 built by a script on top of the published version; a script and
  `validate_pack.py` were run before and after, with no new mismatch, error or warning.
<!-- guide_findings:end -->
