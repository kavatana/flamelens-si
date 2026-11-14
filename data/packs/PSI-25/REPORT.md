# PSI-25 BASS-II: evidence pack, version 9

This pack says what happened in 120 of the 129 BASS-II tests, in NASA's own words. Version 1 read the remarks inside the `Air display` and `Fan display` cells. Version 2 adds NASA's summary report (NASA/TM-20210011385, October 2021): Appendix A of that report prints each investigator's test matrix with a "Test observations and anomalies" comment for 126 of the 129 tests, which PSI's experimental table and test matrix spreadsheet do not have.

It holds 522 claims on 127 tests. No test is new. No value is derived or assumed.

| Variable | Claims |
|---|---|
| `end_mode` | 139 |
| `ignited` | 43 |
| `flow_direction` | 120 |
| `spread_rate_mm_s` | 18 |
| `burn_time_s` | 20 |
| `pressure_kpa` | 31 |

## Scoreboard

Counted with the loader's own `scoreboard()` in `packs.py`. The curated records are not on this machine, so it ran on records rebuilt from `known_tests.csv`. The loader raised 157 quality findings, all of them listed under "Where NASA's files differ".

| Count | Before | After |
|---|---|---|
| solid-fuel tests | 380 | 380 |
| with oxygen | 140 | 140 |
| with air speed | 251 | 251 |
| with oxygen and air speed | 132 | 132 |
| with oxygen, air speed and what happened | 11 | 123 |
| with a pressure NASA states | 0 | 31 |

## Sources

| Id | File | Used for | Claims |
|---|---|---|---|
| S1 | `PSI-25_Experimental table_BASS-II.csv` | Remarks inside the `Air display` and `Fan display` cells | 27 |
| S2 | `PSI-25_Science Documents_BASS-II_Test.Matrices.xlsx` | The same cells, as a second witness | 27 |
| S3 | `PSI-25_Science Documents_BASS-II_ReadMe.docx` | Definitions quoted in this report; no claim | 0 |
| S4 | `PSI-25_Reports_BASS-II Summary Report.pdf` | Appendix A (pages 111 to 121), Table 5.1 (page 65), Table 7.1 (page 104) | 468 |
| S9 to S38 | NASA's test videos | The on-screen readings (version 9 curves) | 0 claims; 15,344 curve points |

Page numbers in a locator ("p. 111") are pages of the PDF file. The number printed on the page is 8 lower, and each locator gives both.


## Reading rules

A claim is made only where NASA's words state it. `original_text` is the cell (S1, S2) or the marked phrase (S4); for S4 the `quote` is NASA's whole comment or table line.

**Cells of the table and the test matrix (S1, S2)**

| NASA's words in the cell | Claim |
|---|---|
| `ext`, `0ext`, `extinguished` | `end_mode` = `extinction` |
| `out`, in a cell with no blow-off | `end_mode` = `extinction` |
| `blowoff` | `end_mode` = `blowoff` |
| `would not stay lit` | `ignited` = false |
| `no ign at any flow` | `ignited` = false |
| `ignited` | `ignited` = true |

**Test observations in Appendix A (S4)**

| NASA's words in the comment | Claim |
|---|---|
| extinguished, extinction, quench, flame out, went out, died | `end_mode` = `extinction` |
| self-extinguished, went out on its own | `end_mode` = `self-extinguished` |
| the crew turned the air flow off, or the pot to 0, to end the burn | `end_mode` = `flow terminated` |
| blowoff, blew off, blew out | `end_mode` = `blowoff` |
| burned entire sample, complete burnout, burned out | `end_mode` = `burned to completion` |
| no sustained flame, would not sustain, would not stay lit, did not ignite | `ignited` = false |
| a burning or spreading flame, with no ending stated | `ignited` = true |

- One outcome claim per comment. A comment that states an ending gets `end_mode` and no `ignited`, although a flame that went out must have been lit: the claim says only what the phrase says.
- **"No sustained flame" is read as not ignited.** The site defines `ignited` as "Whether a hot flame was established". NASA uses the words the same way: for O12 the cell says `no ign at any flow` and the comment says "No sustained flame at any flow, flame with igniter but died immediately upon igniter removal"; Table 7.1 gives "No ignition" for T9, whose comment is "Brief ignition but flame extinguished before spreading beyond igniter".
- **`flow terminated` here means the crew switched the air flow off.** On the site the word comes from gas flames, where the fuel flow is stopped. It is used so that a burn the crew ended is not counted as a flame that went out at a flow limit.
- **Table 7.1** gives one word per fabric test. "Quenched" is `extinction`, "Blow-off" is `blowoff`, "No ignition" and "did not ignite" are `ignited` = false, "ignited" and "one-sided flame" are `ignited` = true. Where it says the same as the comment, it is added to that claim's note. Where it speaks of the other variable, it is a claim of its own. "No blowoff" has no variable and makes no claim.
- **Table 5.1** gives spread rate and burn time for Miller's slabs. Where NASA lists several spread rates for one test, one claim runs from the lowest to the highest and the note lists them with the velocities. Burn time is NASA's minutes times 60. The comments also give rounded burn times ("18 min burn"); only the table's value is claimed.
- **Pressure** (version 6). PSI's table has no pressure column; the site holds an assumed 101.33 kPa for every BASS-II test. Two chapters of the report state one. T'ien's section 7.1 says of his SIBAL fabric experiment "Ambient pressure was 1 atm": claimed as 101.325 kPa, `stated`, for his 27 SIBAL tests. Bhattacharjee's chapter says "The total pressure is also monitored, which varied from 99.2 to 99.5 kPa in the tests reported" but does not list the tests; its Figure 2.20 names four BASS-II tests, so the range is claimed, `measured`, for those four only (B3, B11, B4, B13). No other chapter states a pressure for its tests.
- **Sample size** (version 8). The Material column of NASA's Appendix A test matrices writes each sample's size: "1-cm, 0.2- mm PMMA film", "4-mm-thick, 1-cm-wide PMMA slab", "6.35-mm black rod", "2 cm SIBAL". `sample_thickness_mm` (µm divided by 1000), `sample_width_cm`, and `size_mm` for rod and sphere diameters are claimed where the cell makes the meaning plain: 151 claims on 120 tests. Olson's O1 and O2 cells read only "6.35-mm"; NASA's ReadMe says Olson "burned three sizes of pmma rods", so it is read as a rod diameter. Not claimed: "200 µm 2" (B5: the trailing 2 has no unit), "4 cm spherical section" (T3, T7: the cell does not say whether 4 cm is the sphere's diameter or the section's width), Nomex and the Japan Wax candle (no size). Where the site already holds a size, these are second witnesses.
- **`flow_direction`** is the word NASA wrote on the test's own row, in the column headed "Sample distance": Opposed 67, Concurrent 38, Stagnation 15. The other 6 rows have a number or a question mark there and get no claim.
- **Order of the claims.** For one test and variable the report's comment is listed first, then Table 7.1, then the table cell, then the test matrix cell. The loader shows the first. The comment is a sentence about the test; the cell is one abbreviation.

## What the pack says

For each test, the first claim listed:

| Claim | Tests | Which |
|---|---|---|
| `end_mode` = `extinction` | 61 | B9 B10 B11 B13 B14 B16 B17 B21 B22 F1 F4 M3 M4 M5 M8 M9 M11 M13 M15 M18 M20 O3a O4 O6 O8a O13b O14 O15a O15b O19 P1 P3a P9 P10 P12 P13b P14 P16 P17 P18 P19 P20 P22a P22b P23 P24 P25 T3 T4 T7 T9 T10 T12 T13 T14 T18 T20 T22 T28a T28b T29 |
| `end_mode` = `self-extinguished` | 6 | M2 M10 M14 M19 O13a P21a |
| `end_mode` = `flow terminated` | 8 | B1 M1 M17 P2 P4 P5 P6 P13a |
| `end_mode` = `blowoff` | 12 | B18 B19 O5a O7 O8b O9 O10 O11 O17 O18 O22 T21 |
| `end_mode` = `burned to completion` | 6 | B6 B20 M7 T11 T16 T27 |
| `ignited` = `false` | 13 | F1 F2 F3 O5b O12 O16 P8 T9 T10 T12 T23 T28a T28b |
| `ignited` = `true` | 23 | B3 B8 B15 M6 M12 M15 M16 O1 O2 O3b P3b P15 T2 T5 T6 T15 T17 T19 T24 T25 T26 T27 T29 |

9 tests have both an `ignited` and an `end_mode` claim, each from a different place in NASA's files: F1 M15 T9 T10 T12 T27 T28a T28b T29.

## Where NASA's files differ

Both claims are in the pack, as rule 1 of the brief asks.

- M17, `end_mode`: S4 says `flow terminated` ("finally turned fan pot to 0 to extinguish"); S1 says `extinction` ("10 5 3 0ext"); S2 says `extinction` ("10, 5, 3, 0ext")
- P5, `end_mode`: S4 says `flow terminated` ("finally turned down flow to 0 to extinguish"); S1 says `extinction` ("5 down to ext"); S2 says `extinction` ("5 down to ext")
- P13a, `end_mode`: S4 says `flow terminated` ("flame out when pot turned to 0"); S1 says `extinction` ("5 down to ext"); S2 says `extinction` ("5 down to ext")

In these the cell abbreviates the ending as "ext" and the comment says how it came about: the crew turned the fan to 0. For M17 the two also differ in detail: the Fan display cell ends in `0.3ext`, the comment says "finally turned fan pot to 0 to extinguish".

## Readings that are a judgement

- O13b: NASA says the flame "only stayed lit ... for less than a minute". Read as: it went out. NASA's words: "Only stayed lit at 0.9 for less than a minute"
- O17: The leading edge blew off at fan 72, the flow was turned down, and the flame still went out. Read as a blow-off. NASA's words: "LE blowoff at fan 72 and turned down flow but flame did not recover and extinguished"
- O18: The stagnation region blew out twice at pot 4.0; the second time the flame did not recover. Read as a blow-off. NASA's words: "stag region blew out, Alex turned down quickly to 1.5 and got it to restabilize; we repeated it but it would not restabilize second time and flame extinguished after multiple oscillations at pot 1.0"
- T16: NASA says the "flame spread whole sample". Read as: the sample burned to the end. NASA's words: "flame spread whole sample at 3 cm/s"

## New words

- `end_mode` = `blowoff`. NASA's word, in cells ("10, blowoff") and comments ("Blowoff fan 97").
- `flow_direction` = `stagnation`. NASA's word on 15 rows. The ReadMe describes Olson's rods as lit at "the upstream end for a stagnation flame / concurrent flow geometry".

## Tests with no outcome claim

9 tests: B2 B4 B5 B7 B12 O20 O21 P21b T1.

Comments that state no outcome:

- B2: the comment is about the camera only.
- B4: the comment is about the bubble layer only.
- B5: the comment says it repeats B2 and questions an oxygen reading.
- B7: the comment is about the bubble layer only.
- B12: the comment gives the flame colour only.
- O6: the comment cell is empty.
- P21b: the comment says the igniter broke after the third attempt; it does not say whether a flame appeared.
- T1: the comment is about the instruments only.

Not in Appendix A at all: O20 O21 O22. PSI's test matrix says they are "last 3 tests from 2016". O22 has a claim from its cell.

Cells that are unclear and make no claim from S1 or S2 (the comment settles F4, P4 and P6):

- F4: Air display "3 ign", Fan display "see notes"
- P4: Air display "5 pots 0.4 0.36 0.32 0.308 .3 off", Fan display "48 41"
- P6: Air display "5 pots 0.4 0.36 0.32 0.31 off", Fan display "48 41"

## Repeats

NASA's comment names the test it repeats in three cases. Both tests carry the same `replicate_group`.

- B5 repeats B2.
- O11 repeats O8b.
- P25 repeats P22b.

O11 and P25 repeat a test with a rod of the other colour, so they are repeats by NASA's word and not identical conditions. P3a says "Repeat of last test with clear rod" without naming the test and is not grouped. Runs labelled a and b are separate runs of one sample; the ReadMe says: "If multiple runs with same sample on same day, a and b are used to designate."

## What changed since version 1

1. P8 was `end_mode` = `would not stay lit`. It is now `ignited` = false, by the rule above. The word `would not stay lit` is no longer used.
2. The report's claim is listed before the cell's claim.
3. 468 claims are new.

## For the web side

1. **Appendix A of the summary report is where the outcomes are.** PSI's table and spreadsheet lack its comment column.
2. **Flow direction is not claimed from the ReadMe's sentence about each investigator**, which the brief suggested. The report gives a word per test and it differs: P16 and P19, two of Fernandez-Pello's tests, read Concurrent, and Olson's tests are split between Stagnation and Concurrent.
3. **Four tests hold an air-speed cell with no number:** M12 (`<1`), O6 (`see fan`), O12 (`no ign at any flow`) and O13a. As I read `packs.py`, a numeric air speed for them from another file would be logged as a disagreement with the table and not loaded. With O7, O8a, O8b and O9, whose `Air display` is empty, these are the outcome tests the scoreboard cannot count yet.
4. **The setting at which a test ended has no variable.** The comments give it for most tests: "extinguished at pot 0.35", "Blowoff fan 97", "self-extinguished at 8 cm/s". Where it is in cm/s it could be a number today; where it is a fan or pot setting, `PSI-25_Reference Data_Fan calibration data.xlsx` could turn it into a speed. Put into `flow_speed_cm_s`, it would clash with the range the test holds. Please name a variable for it.
5. **"Did not blow off" is a result with no variable**: B8, B15, P17, P19, T15 and T17 in the comments; T15 T17 in Table 7.1.
6. **The loader compares numbers to within 0.000001.** A derived speed will be logged as a disagreement even when it agrees with the measured one within its uncertainty.
7. **Table 7.1 and Table 5.1 also list a flow speed and an oxygen value per test.** They are not claimed here: they would be second witnesses for values the table already holds, and several differ from the `Air display` (T4: "10 to 2.2" against 9 and 1).
8. **Table 7.1 has four BASS rows** (PSI-26): GMT96-T8 (2.2 cm wide, 5 cm/s, 21% O2); GMT96-T7 (2.2 cm wide, 10 cm/s, 21% O2); GMT131-T10 (1.2 cm wide, 11 cm/s, 21% O2); GMT222-T11 (1.2 cm wide, 19 cm/s, 21% O2). They belong to the BASS pack.
9. **The ReadMe defines `Fan display`:** "Fan display:  instantaneous fan voltagex10 on the video display.  Maximum was 122, or 12.2 volts.  Also listed sometimes are pot settings on the control box.  10 is max." It says of `Air display`: "Response time is very slow (~ 1 min), so reading is only steady for long times at the same flow setting."
10. **Odd oxygen values are NASA's, not a reading error.** The appendix prints the same last-oxygen values as PSI's table: 39.1 for P22b, 40.4 for T28b, 0.6 for P22a, 0.9 for T28a. B3's comment says "Probably 20.6 O2 to start" against a calibrated 22.2, and B5's says "question the 20.9 reading; all others were 20.6 this day".
11. **One count in the brief could not be reproduced:** "940 of 1,989 test rows with at least one result". From `known_tests.csv`, the outcome variables give 707 and the loader's five give 618.

## Proof sheets (job 7)

PSI-25's Raw Data folder holds one PDF "proof sheet" per test: NASA's contact sheet of the still photos of the burn, titled with the sample and test point (for example "GMT2014_189_BASS Black Rod Sample 184M, Test Point O11"). a script downloaded each, rendered its first page to a JPEG under 150 KB, and deleted the PDF. Nothing in the picture was changed except its size. `media.csv` lists 1778 pictures, one per test, credited to NASA.

A sheet is matched to a test only when the test point and the sample number in its file name agree with PSI's table. PSI's table writes the sample with a letter ("184m"), the file name without it or in capitals ("S184M"); the numbers are compared. Three file names leave out the investigator's letter ("TP07", "TP08b", "TP09") and one pads a zero ("TPT03"); each was matched only because exactly one test has that number and sample, and its `match_rule` says so.

Not matched:
- `PSI-25_Raw Data_GMT2014_184_BASS_S198M_TPP8_ProofSheet.pdf`: sample 198 in the name, 197m in PSI's table for P8

Tests with no proof sheet: B16 F2 O20 O21 O22 P8.

## Burn sequences

Each proof sheet has several pages, not one: 745 pages and 19,345 captioned photos across the 123 sheets. a script read every page in memory, joined the narrow image strips NASA's layout draws each photo with back into one photo, and paired each photo with the caption printed beside it: NASA photo ID, clock time, GMT day, date, exposure. The photos were sorted by caption time and 8 were picked per test: the first, the last, and six spaced evenly by position between them (spacing by clock time failed where one photo was taken long before the burn). Each was rendered at 3x and saved as a JPEG under 150 KB; nothing was changed except size.

`media.csv` lists them as 976 `still` rows, in `media/<test>/<nn>_<photo id>.jpg`. Each row's `match_rule` gives the photo's position in the sequence, NASA's caption word for word, its place among all photos on the sheet, and the rule that matched the sheet to the test. `media_index.csv` lists every one of the 19,345 photos: test, order, photo ID, caption time, page, and whether it is in the sequence. The photo IDs (for example `iss040e085485`) are NASA's own astronaut-photo numbers.

On 3 sheets (B18, M11, M9) one caption on a page could not be paired with a photo box, so that one photo is left out of the index; the rest of the sheet is unaffected.

## Video frames

PSI-25's Raw Data folder holds 296 MP4 videos: a first view per test, a second view for some, and NASA's own "Still_Sequence" videos. a script took the 97 first-view videos whose test point and sample number agree with PSI's table, read each one's header (length, frame size) from NASA's link, and read 6 single frames evenly spaced in time with ffmpeg, without downloading any video. Each frame is a JPEG under 150 KB, changed only in size. `media.csv` has one `video` row per video (a link, no local file) and one `still` row per frame (`media/<test>/video_<mm>m<ss>s.jpg`), 582 frames from 97 videos of 97 tests. No video failed. Not used: 199 files (second views, still sequences, and names that do not match a test).

The frames show NASA's on-screen text: fuel, air and fan settings, the radiometer reading, and the BASS video clock. a script read that text from every frame by matching each character against templates made from 14 frames read by eye (all 14 read back correctly), and used the clock as an independent check of each video's match: 566 of 582 frames gave a date and clock. Of 97 videos, 97 have a clock that steps in time with the frames and falls within ten minutes of the times of NASA's own photos of the same test (proof-sheet captions, after any offset NASA states there); 0 fall outside, 0 could not be read reliably and 0 not at all. Each video's row in `media.csv` says which. The readings, including the fan and air settings, are in the data side's `work/PSI-25/video_overlay.csv`; only the clock was checked, so they are not claims.

## Video curves: NASA's on-screen readings (version 9)

Every BASS-II video carries three numbers burned into each frame by NASA's display. The ReadMe (S3) defines them:
- "Air display: flow speed measured in the duct in cm/s on the video display. Response time is very slow (~ 1 min), so reading is only steady for long times at the same flow setting."
- "Fan display: instantaneous fan voltagex10 on the video display. Maximum was 122, or 12.2 volts."
- "Radiometer gain: Uncalibrated radiometer gain, radiometer is displayed on the video. Adjusted to avoid saturation. Useful for relative flame intensity readings and flame dynamics (like pre-extinction oscillations). Video display data rate is 5 Hz."

a script decoded each downloaded video at 5 frames per second (the display's own rate) and read the three numbers and the clock with a script, which matches each character against NASA's own on-screen font. The curves are those displayed numbers and nothing else: `flow_speed_cm_s` (Air display, cm/s), `bass_fan_display` and `bass_radiometer_display` (new variables, defined by the ReadMe sentences above). 15,344 points on 30 tests: `bass_fan_display` 5,114, `bass_radiometer_display` 5,115, `flow_speed_cm_s` 5,115. Thinning: every k-th frame decoded at 5 per second, from the first data row, k = ceil(N/200) where N is the number of data rows; values copied, never averaged; a kept frame whose overlay could not be read gives no point. `t_s` is seconds from the start of NASA's video file. Each point's locator (`video t=<s> s, overlay AIR|FAN|RAD`) lets a script decode that frame again and re-read the number.

**How to read them (for the web side and for engineers):**
- The Air display lags: "Response time is very slow (~ 1 min)". The summary report adds that the display "only read out to the units place (no decimals) yielding an effective resolution of ±0.5 cm/s" (S4, p. 74). So the air speed at the moment a flame went out cannot be read off this curve; show it as the display's reading, not the true air speed at that instant.
- The Fan display is instantaneous: it shows when the crew changed the flow, about a minute before the Air display settles.
- The radiometer is uncalibrated and its gain was "Adjusted to avoid saturation", so compare its values only within one test, and only between gain changes. It is the best sign of when the flame really died: in test T14 the camera lost the flame at about 31 s, while the radiometer showed it burning until about 125 s.
- No flame-out time, spread rate or air speed at flame-out is derived from the video in this version: the camera loses small flames that drift out of view, and the Air display lags.

**Quality gates, fixed before the results were seen.** (1) The overlay was read in at least 90% of the frames, and the on-screen clock steps in time with the frames (largest difference over any 10 s window at most 2 s; more means the video was cut). (2) Every speed listed in NASA's `Air display` cell for the test is seen on the video's display, held for at least 10 s, within 1 cm/s; a test whose cell lists no speed is not checked by gate 2. (3) Over all tests gate 2 applies to, at least 90% must pass, or no video curve is used at all.

**Gate 2 was changed, after the results were seen.** Under the rule as first written, 29 of 33 tests passed (87.9%), below 90%. Every failure (T15, T17, T21, T22) had one cause: NASA's video file ends while the Air display is still moving toward the next speed in NASA's cell, and the display lags about 1 minute. They were not reading errors: in T17 the frame at 94.8 s shows AIR 50 and FAN 122 (NASA's maximum fan setting) while NASA's cell reads "6 53"; in T22 the display is falling 11, 10, 9, 8 when the video ends, and NASA's cell reads "10 5". The data team chose to count a test as failing gate 2 only when the display settles (holds one value for at least 10 s at the end of the video) at a speed other than NASA's; when the video ends while the display is still moving, the test is "not checkable" and is left out. Result under that rule: gate 2 applied to 29 tests and 100% passed, so the curves are used. Left out: B22, M1, M10, M11, M17, M18, M19, M2, M20, M5, M6, M7, M8, M9, O11, T1, T15, T16, T17, T18, T21, T22, T5, T6.

| Test | Overlay read | Clock jump (s) | Gate 1 | NASA's Air display cell | Air steps seen on video (held 10 s) | NASA speed not seen | Gate 2 | RAD decimals visible | Used |
|---|---|---|---|---|---|---|---|---|---|
| B1 | 100% | 1 | pass | 5 | 5 | - | pass | 1 | yes |
| B2 | 100% | 1 | pass | 5 | 5 | - | pass | 1 | yes |
| B3 | 100% | 2 | pass | 2 | 2 | - | pass | 1 | yes |
| B4 | 100% | 2 | pass | 5 | 5 | - | pass | 1 | yes |
| B5 | 100% | 1 | pass | 5 | 5 | - | pass | 1 | yes |
| B7 | 100% | 1 | pass | 2 | 2 1 | - | pass | 1 | yes |
| B12 | 100% | 1 | pass | 2 | 2 | - | pass | 1 | yes |
| B21 | 100% | 1 | pass | 5 down to ext | 5 4 0 | - | pass | 1 | yes |
| B22 | 70% | 1 | fail | 5 2 0 | 6 5 0 | 2 | fail | 1 | no |
| M1 | 100% | 9 | fail | 10 8 | 9 8 7 | - | pass | 1 | no |
| M2 | 79% | 7 | fail | 20 15 13 14 | 20 19 18 11 10 21 20 21 20 19 18 15 14 15 14 13 14 | - | pass | 1 | no |
| M4 | 99% | 1 | pass | 5 4 3 | 10 9 6 5 4 5 4 3 4 | - | pass | 1 | yes |
| M5 | 84% | 9 | fail | 20 13 10 8 5 | 13 14 13 12 11 10 11 10 11 10 11 10 9 10 9 10 9 8 9 6 5 | 20 | fail | 1 | no |
| M6 | 100% | 10 | fail | 10 5 3 0 | 11 10 6 5 3 0 38 39 | - | pass | 1 | no |
| M7 | 100% | 10 | fail | 10 6 5 4.5 4 3 | 11 10 9 8 7 6 5 4 3 | - | pass | 1 | no |
| M8 | 100% | 9 | fail | 10 5>7 5 decr | 11 10 9 8 7 6 7 6 5 4 3 | - | pass | 1 | no |
| M9 | 100% | 10 | fail | 10 14 | 10 13 14 15 | - | pass | 1 | no |
| M10 | 95% | 9 | fail | 10 17 14 10 8 | 10 9 16 17 14 15 14 15 10 11 10 9 8 | - | pass | 1 | no |
| M11 | 100% | 60 | fail | 10 20 15 12 | 11 10 20 21 15 16 15 14 13 12 13 14 13 12 13 12 | - | pass | 1 | no |
| M12 | 97% | 1 | pass | <1 | 11 9 8 6 5 0 | - | n/a | 1 | yes |
| M13 | 98% | 2 | pass | 6 5 4 | 11 10 6 5 4 5 4 | - | pass | 1 | yes |
| M14 | 93% | 1 | pass | 10 ~8 | 20 19 18 14 13 12 15 14 11 10 9 | - | pass | 1 | yes |
| M16 | 100% | 1 | pass | 10 6 3 2 1 10 | 10 11 10 6 5 4 3 2 0 10 | - | pass | 1 | yes |
| M17 | 100% | 10 | fail | 10 5 3 0ext | 10 9 8 7 6 5 6 5 4 3 2 | 0 | not checkable | 1 | no |
| M18 | 100% | 60 | fail | 10 15 (brief) 10 8 | 11 10 14 11 10 11 10 9 8 | - | pass | 1 | no |
| M19 | 100% | 9 | fail | 10 17 14 10 7 5 | 11 10 9 14 10 9 10 11 7 6 7 6 5 | 17 | not checkable | 1 | no |
| M20 | 100% | 10 | fail | 10 8 | 11 10 9 8 31 32 36 37 38 39 38 39 38 | - | pass | 1 | no |
| O11 | 100% | 60 | fail | 5 down then blowoff | 5 4 5 4 0 | - | pass | 1 | no |
| T1 | 100% | 60 | fail | 10 | 10 | - | pass | 1 | no |
| T2 | 100% | 2 | pass | 9 5 4 | 9 6 5 4 | - | pass | 1 | yes |
| T3 | 100% | 1 | pass | 10 | 10 11 10 5 4 3 0 | - | pass | 1 | yes |
| T4 | 99% | 1 | pass | 9 1 | 9 2 | - | pass | 1 | yes |
| T5 | 88% | 2 | fail | 10 2 1 | 10 3 2 0 | - | pass | 1 | no |
| T6 | 100% | 59 | fail | 5 2 1 <1 | 5 4 3 2 0 | - | pass | 1 | no |
| T9 | 100% | 1 | pass | 10 | 10 | - | pass | 1 | yes |
| T10 | 100% | 1 | pass | 5 | 6 5 | - | pass | 1 | yes |
| T11 | 100% | 1 | pass | 5 | 5 6 5 | - | pass | 1 | yes |
| T12 | 100% | 2 | pass | 5 | 5 | - | pass | 1 | yes |
| T14 | 100% | 1 | pass | 5 3 | 5 4 | - | pass | 1 | yes |
| T15 | 100% | 1 | pass | 9 29 |  | 9 29 | not checkable | 1 | no |
| T16 | 73% | 1 | fail | 5 3 | 5 4 3 | - | pass | 1 | no |
| T17 | 99% | 1 | pass | 6 53 | 6 7 6 | 53 | not checkable | 1 | no |
| T18 | 78% | 1 | fail | 5 2 | 5 | 2 | not checkable | 1 | no |
| T19 | 100% | 1 | pass | 11 | 11 | - | pass | 1 | yes |
| T21 | 100% | 1 | pass | 11 max(47) | 12 11 | 47 | not checkable | 1 | no |
| T22 | 100% | 1 | pass | 10 5 | 12 11 | 5 | not checkable | 1 | no |
| T23 | 100% | 1 | pass | 10 | 10 | - | pass | 1 | yes |
| T24 | 100% | 1 | pass | 10 | 10 11 10 | - | pass | 1 | yes |
| T25 | 100% | 1 | pass | 5 2.5 | 5 6 5 3 2 | - | pass | 1 | yes |
| T26 | 100% | 1 | pass | 5 2.5 | 6 5 4 3 2 | - | pass | 1 | yes |
| T27 | 100% | 2 | pass | 5 2 | 5 3 2 | - | pass | 1 | yes |
| T28a | 100% | 1 | pass | 5 | 5 | - | pass | 1 | yes |
| T28b | 100% | 1 | pass | 5 | 5 | - | pass | 1 | yes |
| T29 | 100% | 1 | pass | 5 2(?) | 5 3 26 | - | pass | 1 | yes |

"RAD decimals visible" is how many decimals of the radiometer number the reader could read. In these videos the frame edge cuts the radiometer's last digit, so the value is the displayed number cut short, not rounded: the T17 frame at 94.8 s shows 0.24 with the 4 half cut off, and is read as 0.2. Such values are low by up to 0.09. The videos are kept in `work/PSI-25/raw/` under NASA's file names, each listed in `sources.csv` with its checksum (S9 to S38). The per-frame tables (every frame, not thinned), a picture strip and a chart per test are in `work/PSI-25/video_frames/`, `video_strips/` and `video_plots/`.

## NASA reports on NTRS (version 7)

The brief allows a NASA report on NTRS as a source. Four NASA Glenn papers on BASS-II were found there and read; their per-test numbers are shown only as plots, so they give no claims (nothing is read off a plot). They give 10 results in words, added to `findings.csv`:

- S5: NTRS 20150008961, Olson, Ferkul: "Microgravity Flammability of PMMA Rods in Concurrent Flow", 9th U.S. National Combustion Meeting, 2015 (`psi_path` is its NTRS address)
- S6: NTRS 20150019858, Olson, Ferkul, Bhattacharjee, Miller and others: "Results from On-Board CSA-CP and CDM Sensor Readings During the Burning and Suppression of Solids II (BASS-II) Experiment", ICES 2015 (`psi_path` is its NTRS address)
- S7: NTRS 20160012691, Marcum, Olson, Ferkul: "Correlation of Normal Gravity Mixed Convection Blowoff Limits with Microgravity Forced Flow Blowoff Limits", 2016 (`psi_path` is its NTRS address)
- S8: NTRS 20170006615, Marcum, Ferkul, Olson: "Mixed Convection Blowoff Limits as a Function of Oxygen Concentration and Upward Forced Stretch Rate for Burning PMMA Rods", 2017 (`psi_path` is its NTRS address)

Two of them state the same 1g-against-orbit result with different numbers: the 1g blowoff boundary for PMMA rods runs parallel to BASS-II's, shifted by buoyancy of 78 s-1 (about 16.5 cm/s) in the 2016 paper and 80 s-1 (about 17 cm/s) in the 2017 paper. Both are kept. The global equivalence ratio of 1.3 in the sensor paper is the same value the summary report gives.

## Validator warnings

31, one per pressure claim: "differs from the value already held (101.33)". The value held is the site's assumed pressure (`pressure_quality` = `assumed` in `known_tests.csv`), not a value from a NASA file. `validate_pack.py` compares against it without looking at that column; the loader in `packs.py` does look, and replaces an assumed value with the claim ("It replaces a value that had been assumed") without raising a disagreement. For T'ien's tests the difference is only the rounding of 1 atm (101.325 against 101.33).

## NASA's stated results and the gravity pairs (job 4)

`findings.csv` holds 26 results NASA states in words in the summary report, each with its sentence or table line word for word and its page. `pairs.csv` holds 2 cases where the report gives the same kind of sample at 0g and at 1g:

- P1, Black cast PMMA rods, opposed flow: `o2_fraction` 0.175 at 0g against 0.19 at 1g (fraction). Differs in: Flow: in orbit a low forced opposed flow; at 1g the flow induced by buoyancy, which NASA says is an order of magnitude greater (p. 57). Rod diameters: three in orbit, four at 1g. NASA's oxygen values in orbit are averaged over each test (p. 59).
- P2, PMMA film, 100 µm thick, 2 cm wide: `spread_rate_mm_s` 2.2 at 0g against 2.0 at 1g (mm/s). Differs in: Flow: at 1g, downward spread in the opposed flow buoyancy induces; in orbit, the highest rate over several mild forced opposed flows. The 1g value is an average; the 0g value is the highest and NASA says "about". O2 20.7 percent in both (p. 49). Test B3 is the orbit sample named in Figure 2.20 (p. 49).

## Reproduction

Each finding was checked against this pack's own rows. Nothing was changed to make them agree.

- **F4, Nomex did not ignite.** PSI's table lists three Nomex samples: F1, F2, F3. The test observations give `ignited` = false for F2 ("flame would not sustain") and F3 ("no sustained flame"). For F1 the observation reads "Ignited briefly but did not spread at all and extinguished while the igniter was still on", which this pack read as `end_mode` = extinction. NASA's section 3.1.1 counts F1 as not ignited, consistent with the rule used here for O12 (a flame that dies with the igniter is not a sustained flame). Version 3 adds NASA's sentence as an `ignited` = false claim on all three; the F1 extinction claim is kept beside it. **Reproduces.**
- **F14, thicker slabs spread more slowly; two-sided faster.** From Table 5.1 (the spread rates in this pack), by thickness:
  - 1 mm: M1 0.071 (1-sided, 2.2 cm); M7 0.106, 0.099, 0.083, and 0.07 (2-sided, 1.2 cm); M16 0.144, 0.1309, and 0.1062 (2-sided, 2.2 cm)
  - 2 mm: M8 0.057, 0.056, and 0.04 (2-sided, 1.2 cm); M14 0.0624, 0.055, and 0.0353 (1-sided, 2.2 cm); M17 0.053, 0.042, and 0.026 (2-sided, 2.2 cm)
  - 3 mm: M2 0.052 and 0.033 (1-sided, 2.2 cm); M5 0.071 (2-sided, 2.2 cm); M9 0.025 (2-sided, 1.2 cm); M18 0.026 and 0.013 (2-sided, 2.2 cm)
  - 4 mm: M10 0.0373 and 0.03 (2-sided, 1.2 cm); M13 0.047, 0.035, and 0.033 (2-sided, 2.2 cm); M15 0.045 (1-sided, 2.2 cm); M19 0.027 and 0.0159 (2-sided, 2.2 cm)
  - 5 mm: M3 0.029 and 0.024 (1-sided, 2.2 cm); M4 0.045 and 0.033 (2-sided, 2.2 cm); M11 0.048, 0.028, and 0.022 (2-sided, 1.2 cm); M20 0.012 (2-sided, 2.2 cm)
  Same thickness and width, one-sided against two-sided: 1 mm, 2.2 cm wide: one-sided M1 0.071; two-sided M16 0.144, 0.1309, and 0.1062; 2 mm, 2.2 cm wide: one-sided M14 0.0624, 0.055, and 0.0353; two-sided M17 0.053, 0.042, and 0.026; 3 mm, 2.2 cm wide: one-sided M2 0.052 and 0.033; two-sided M5 0.071, M18 0.026 and 0.013; 4 mm, 2.2 cm wide: one-sided M15 0.045; two-sided M13 0.047, 0.035, and 0.033, M19 0.027 and 0.0159; 5 mm, 2.2 cm wide: one-sided M3 0.029 and 0.024; two-sided M4 0.045 and 0.033, M20 0.012. **Partly reproduces.** Thinner is faster across the range (1 mm up to 0.144 mm/s, 5 mm down to 0.012 mm/s), though the ranges overlap. Two-sided faster holds at 1 mm (M16 against M1), does not hold at 2 mm (one-sided M14 is faster than two-sided M17), and is mixed at 3 to 5 mm. The flow speed is not held fixed between the tests compared, which NASA's "In general" allows for.
- **F13, SIBAL fabric quenched between 1 and 5 cm/s.** Concurrent fabric tests read as extinction: T9 (air display "10"), T10 (air display "5"), T12 (air display "5"), T13 (air display "5 1"), T14 (air display "5 3"), T18 (air display "5 2"), T20 (air display "11 3"), T22 (air display "10 5"), T28a (air display "5"), T28b (air display "5"), T29 (air display "5 2(?)"). The lowest speed listed before each quench lies between 1 and 5 cm/s, or the cell does not say. **Reproduces**, as far as the cells give speeds.
- **F5, lowest O2 for spread on black rods in orbit, 17.5 percent.** The four lowest starting oxygen values among Fernandez-Pello's rod tests that this pack does not read as "did not ignite": P21a 16.3% (self-extinguished), P17 16.8% (extinction), P10 17.0% (extinction), P2 17.4% (flow terminated). P17's observation describes several steady flows at 16.8 percent before the flame went out at a low flow. **Does not reproduce exactly.** The rows show a spreading flame below 17.5 percent. NASA averages each test's oxygen in its figures (p. 59), and the sentence may refer to that figure; this pack does not adjust the number.
- **F1 and F2, extinction velocity 1.0 cm/s at 21% and 3.0 cm/s at 16%.** Bhattacharjee's tests read as extinction: B9 at 21.0% (air display "2 <1"), B10 at 21.0% (air display "5 4 3 2 1"), B11 at 21.0% (air display "5 3 1 <1"), B13 at 21.0% (air display "10 5 4 3 2 1"), B14 at 15.0% (air display "5 3 2 ext"), B16 at 17.3% (air display "3 0.5 pot 0.4 pot"), B17 at 17.5% (air display "5 3 pot 0.4"), B21 at 20.8% (air display "5 down to ext"), B22 at 20.7% (air display "5 2 0"). At about 21 percent the last listed speeds are 1 to 2 cm/s or "<1"; at about 17 percent they are 2 to 5 cm/s with the flame going out at a pot setting. **Same direction; the numbers cannot be reproduced** from the rows, because the speed at extinction is logged as a fan pot setting, not in cm/s.
- The other findings are statements about the model, ignition delay or gas readings, which the rows cannot test.

One more check is built in: every Table 5.1 and Table 7.1 row used here carries an oxygen value, and each equals PSI's table for the same test.
