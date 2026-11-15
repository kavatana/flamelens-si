# PSI-26 BASS: evidence pack, version 3

PSI's BASS table gives 121 tests a material, a date and test numbers, and nothing else. NASA's as-run test matrix (`PSI-26_Science Documents_As Run_Test Matrix.xlsx`, sheet "as run matrix") has the same 121 tests with their oxygen, pressure, air display and a "Test Observations and Anomalies" comment. This pack copies those into claims.

It holds 452 claims on 121 tests. No test is new. No value is derived or assumed.

| Variable | Claims |
|---|---|
| `o2_fraction` | 121 |
| `pressure_kpa` | 121 |
| `flow_speed_cm_s` | 95 |
| `end_mode` | 69 |
| `ignited` | 42 |
| `flow_direction` | 4 |

## Scoreboard

Counted with the loader's own `scoreboard()` in `packs.py`, on records rebuilt from `known_tests.csv`. The last column adds the published PSI-25 pack.

| Count | Before | After this pack | After PSI-25 and PSI-26 |
|---|---|---|---|
| solid-fuel tests | 380 | 380 | 380 |
| with oxygen | 140 | 261 | 261 |
| with air speed | 251 | 346 | 346 |
| with oxygen and air speed | 132 | 227 | 227 |
| with oxygen, air speed and what happened | 11 | 98 | 210 |
| with a pressure NASA states | 0 | 121 | 152 |

The loader raised 0 quality findings for this pack.

## Sources

| Id | File | Used for |
|---|---|---|
| S1 | `PSI-26_Experimental table_BASS.csv` | The test numbers the join is made on; no claim |
| S2 | `PSI-26_Science Documents_As Run_Test Matrix.xlsx` | Every claim |
| S3 | `PSI-26_Science Documents_Planned_Test Matrix.xlsx` | Listed only. A plan is not evidence, and nothing is taken from it |
| S4 | NTRS 20140011099: Ferkul, Olson, Takahashi, Endo, Johnston, T'ien, "Thickness and Fuel Preheating Effects on Material Flammability in Microgravity from the BASS Experiment", ASGSR 2013 (a NASA Glenn presentation; `psi_path` is its NTRS address) | `findings.csv` and one claim (version 3) |


## How each value was taken

- **Oxygen** (column AA, headed "O2 % by volume"). The values are fractions (0.221 is 22.1%), so they are claimed as they are. 67 of the 121 cells are formulas in NASA's sheet, the oxygen partial pressure over the total pressure in mmHg (for example `=156.42/738.8`); the claim takes the result NASA's sheet stores, and `original_text` is the formula. Range: 0.1590 to 0.2272.
- **Pressure** (column AB, "pressure, atm"), multiplied by 101.325 to give kPa. Some cells are formulas such as `=738.8/760` (mmHg over 760). Range: 98.3 to 102.2 kPa. This is the first pressure NASA states for any solid-fuel test on the site; all others are assumed.
- **Air speed** (column K, "Air display"). A cell that lists only numbers, such as "10, 5" or "6, 3-2, 1-0", is claimed from its lowest to its highest number. 26 cells hold anything else, or nothing, and give no claim:
  - Test 21 (as-run 11): "1 , 0.5?, 26?"
  - Test 57 (as-run 18): "7,  0 (slow)"
  - Test 67 (as-run 40): "left vm and resent message"
  - Test 82 (as-run 46): "10, etc"
  - Test 82a (as-run 47): "7, etc"
  - Test 118 (as-run 64): ""
  - Test 117 (as-run 85): "8, <1 flow"
  - Test 93 (as-run 88): "3,?, 0"
  - Test 26 (as-run 89): ""
  - Test 27 (as-run 90): ""
  - Test 28 (as-run 91): ""
  - Test 104 (as-run 91): "5,2,1, <1"
  - Test 105 (as-run 92): "5,1, <1"
  - Test 39 (as-run 94): ""
  - Test 118 (as-run 98): "8,4,<1"
  - Test 119 (as-run 99): "8, 2, <1"
  - Test 89 (as-run 100): "5, 2, 1.5, etc"
  - Test 92 (as-run 102): "5,3, 2, etc"
  - Test 78 (as-run 103): ""
  - Test 106 (as-run 108): "10, 7, <1"
  - Test 107 (as-run 109): ""
  - Test 108 (as-run 110): ""
  - Test 109 (as-run 111): ""
  - Test 79 (as-run 112): ""
  - Test 53 (as-run 115): ""
  - Test 53a (as-run 116): ""
  No BASS file read so far defines "Air display". NASA's BASS-II ReadMe defines it for the same flow duct ("flow speed measured in the duct in cm/s on the video display"), and the BASS science requirements document says "An anemometer is used to measure the actual flow speed." Three cells end in 44 ("9, 44", "10, 44", "10, 20, 44"); these are tests where the crew turned the fan up to try to blow the flame off.
- **What happened** (column AD). The rules are the same as for BASS-II:

| NASA's words in the comment | Claim |
|---|---|
| extinguished, went out, flame out, quench | `end_mode` = `extinction` |
| extinguished by itself, self-extinguished, on its own | `end_mode` = `self-extinguished` |
| went out when the crew turned the air flow off | `end_mode` = `flow terminated` |
| blew out | `end_mode` = `blowoff` |
| burned out, burned to completion, fuel ran out | `end_mode` = `burned to completion` |
| did not ignite, no sustained flame, died when the igniter was turned off or retracted | `ignited` = false |
| a burning flame, with no ending stated | `ignited` = true |

  A test that did not ignite because the igniter broke is not a result about the material and gets no claim.
- **Flow direction**: claimed only where NASA writes "opposed" in the material or sample-distance cell (4 tests). Many tests say "wake ign", ignition at the downstream side; that is not claimed as a direction.

## What the pack says

For each test, the first outcome claim:

| Claim | Tests | Which |
|---|---|---|
| `end_mode` = `burned to completion` | 12 | Test 1, Test 21, Test 25, Test 35, Test 6, Test 82b, Test 9, Test 83c, Test 86c, Test 28, Test 40, Test 92 |
| `ignited` = `true` | 31 | Test 42, Test 7, Test 8, Test 4, Test 30, Test 33, Test 47, Test 48, Test 58, Test 59, Test 14, Test 2, Test 3, Test 62, Test 63, Test 65, Test 11, Test 83b, Test 70, Test 71, Test 98, Test 115, Test 117a, Test 85, Test 26, Test 50, Test 51, Test 52, Test 106, Test 107, Test 53 |
| `end_mode` = `flow terminated` | 22 | Test 18, Test 19, Test 20, Test 55, Test 56, Test 110, Test 46, Test 49, Test 22, Test 23, Test 24, Test 60, Test 61, Test 34, Test 111, Test 112, Test 86a, Test 86b, Test 116, Test 27, Test 104, Test 119 |
| `end_mode` = `extinction` | 27 | Test 45, Test 54, Test 57, Test 31, Test 32, Test 5, Test 5b, Test 82, Test 82a, Test 69, Test 113, Test 13, Test 17, Test 83a, Test 84a, Test 99, Test 117, Test 100, Test 87, Test 103, Test 105, Test 38, Test 118, Test 89, Test 108, Test 109, Test 79 |
| `ignited` = `false` | 11 | Test 12, Test 12-R, Test 12-R2, Test 16, Test 15, Test 75, Test 72, Test 73, Test 95, Test 80, Test 75 |
| `end_mode` = `self-extinguished` | 6 | Test 66, Test 68, Test 74, Test 93, Test 39, Test 78 |
| `end_mode` = `blowoff` | 1 | Test 64 |

## Tests with no outcome claim

- Test 43 (as-run 6): the comment is about the camera and the soot on the sphere.
- Test 44 (as-run 7): the comment is about the camera only.
- Test 10 (as-run 13): the comment describes an ignition kernel and a dim video; it does not say a flame was sustained.
- Test 67 (as-run 40): the igniter broke; not a result about the material.
- Test 114 (as-run 59): the igniter broke before ignition; not a result about the material.
- Test 118 (as-run 64): the igniter broke; not a result about the material.
- Test 102 (as-run 67): the comment is about the igniter; it does not describe the flame.
- Test 84b (as-run 72): NASA writes "Extinguished/burned out at 0.31", which does not say which of the two.
- Test 114 (as-run 82): the comment is about the camera and the igniter.
- Test 53 (as-run 107): the igniters broke ("broke 2 igniters"); not a result about the material.
- Test 53a (as-run 116): the comment gives a limit pot setting but does not say how the test ended.

## Readings that are a judgement

- Test 45 (as-run 8): Fan display 38 is the reading with the fan off in NASA's fan calibration sheet. Read as: it went out at the lowest flow. NASA's words: "Flame doesn't go out until fan goes to 38"
- Test 21 (as-run 11): The crew turned the flow off as the fuel ran out. Read as: the sample burned to the end. NASA's words: "Turned off flow right when fuel completely ran out"
- Test 113 (as-run 53): NASA says the nitrogen flow put the flame out, not the air flow. NASA's words: "GN2 on max did not blow it out right away, but did eventually extinguish it"
- Test 64 (as-run 62): NASA says the flame blew out when nitrogen was added (GN2 pot about 6), not from the air flow alone. NASA's words: "flame did blow out with GN2 at about a pot 6"
- Test 9 (as-run 66): NASA says the flame "kept going to end of sample". Read as: the sample burned to the end. NASA's words: "shrank but kept going to end of sample"
- Test 89 (as-run 100): NASA lists falling pot settings with times and then "out". Read as: it went out as the flow was lowered. NASA's words: "out 14:22:50"
- Test 95 (as-run 101): NASA adds: "Candle out of wax?" NASA's words: "no ignition, despite prolonged attempted ignition"
- Test 92 (as-run 102): NASA says the flame went out "(out of wax)". Read as: the fuel ran out. NASA's words: "before the flame goes out (out of wax)"
- Test 80 (as-run 113): NASA gives the reason: "Not enough fuel in forward patch on sample." NASA's words: "No flame"

## Repeats

NASA calls these a repeat of the test before ("Repeat of previous test", "Repeat of test 50", "same as previous"); both carry the same `replicate_group`:

- Test 47 repeats Test 46.
- Test 51 repeats Test 50.
- Test 53a repeats Test 53.

## For the web side

1. **Test labels repeat in PSI's BASS table.** "Test 114", "Test 118", "Test 75" and "Test 53" each name two different tests (different as-run numbers and samples). This pack joins on as-run test number, test number and sample number together, so each claim goes to the right one.
2. **Nitrogen.** BASS also tried to put flames out by adding nitrogen. Two tests ended that way and are claimed as NASA words them (Test 113 "did eventually extinguish it", Test 64 "flame did blow out with GN2"); the notes say it was the nitrogen. Several more say the nitrogen did not put the flame out. The site has no variable for a suppression attempt.
3. **The setting at which a test ended** is in many comments ("Flame extinguished when fan set to 40", "Went out at 0.32 pot"). As for BASS-II, there is no variable for it yet.
4. **Table 7.1 of the BASS-II summary report** lists four BASS fabric tests (GMT96-T7, GMT96-T8, GMT131-T10, GMT222-T11) with flow and oxygen. They are not claimed here; they would be second witnesses for values this sheet already gives.
5. **The BASS final report PDF** (`PSI-26_Reports_BASS_FinalReport.pdf`) is listed by PSI, but its download link returns "not found". So is the SPICE final report in the same folder.

## NASA's findings in words (version 3)

The BASS final report PDF that PSI lists cannot be fetched. A NASA Glenn presentation of the BASS results is public on NTRS (20140011099), which the brief allows as a source. `findings.csv` holds 15 results it states in words, each cut word for word from the slide text (a script; the build stops if a snippet is not found):

- F1, slide 20: Flame spread rate at about 10 cm/s, concurrent flow (2.55 mm/s)
- F2, slide 20: Flame spread rate at about 10 cm/s, opposed flow (1.21 mm/s)
- F3, slide 22: Thin fuel, opposed flow: steady spread, fastest at an intermediate flow speed
- F4, slide 22: Thin fuel, concurrent flow: spread rate rises linearly with flow
- F5, slide 22: Thin fuel, concurrent flow: quenching extinction at about 1 cm/s (1 cm/s)
- F6, slide 26: Ultem and Nomex HT90-40 did not burn in ISS air at about 15 cm/s; Nomex III did
- F7, slide 27: Nomex III in concurrent flow: spread nearly to the end, then went out as the flame narrowed below about 1 cm
- F8, slide 52: PMMA sphere below 1 cm/s: a nitrogen jet did not put the flame out; it went out when the flow was zero
- F9, slide 53: PMMA sphere in air, wake configuration: 500 cc/min of nitrogen weakens but does not put out the flame
- F10, slide 54: Flames in microgravity are most sensitive to air speeds of 0 to 5 cm/s
- F11, slide 54: Below 1 cm/s flames turn dim blue, very stable, and can burn for a long time
- F12, slide 55: At 1 to 5 cm/s the flame keeps heating the fuel and grows stronger over time
- F13, slide 55: Thick fuels store heat: the nitrogen jet could not put the flame out
- F14, slide 55: Even the smallest flames on acrylic slabs burned over 5 minutes before going out by themselves (300 s)
- F15, slide 55: Spacecraft fire safety: a tiny flame may go unnoticed for a long time and flare up when air flow rises

The slides name no test numbers, so findings are tied to a test only where the material and conditions fit exactly one. That is the case once: slide 27's Nomex III sample, which "extinguished within 1 cm of the end of the sample", is Test 14, the only Nomex III test in NASA's matrix that ignited. It also gives one claim, `end_mode` = `extinction`, beside Test 14's `ignited` = true from the matrix. Slide 20's spread rates (2.55 and 1.21 mm/s at about 10 cm/s) are not tied to a test, because the slide does not name the material.

## Video frames

BASS's Raw Data folder holds 114 MP4 videos, named by date and a clock time, half a minute to 54 minutes long, all from April and May 2013. They are not named by test, so they were placed by the date and clock NASA's video system prints on every frame (the same overlay as BASS-II: fuel, air, fan, radiometer, date, clock), without downloading any video:

1. a script read three frames of each video from NASA's link (at 2 %, 50 % and 98 % of its length). The first and last are often colour bars.
2. a script read the on-screen date and clock with the BASS-II overlay reader (a script, templates from 14 hand-read BASS-II frames). 110 videos gave a clock; 4 did not.
3. **The video clock reads one day later than the as-run matrix.** On every day both cover, the videos (by name and on screen) are dated one day after the matrix's date and GMT day (videos 10, 13, 17, 24, 27 April 2013; tests 9, 12, 16, 23, 26 April). NASA states the same kind of offset for this video clock on BASS-II ("Date/Time is minus 1 day 6 min 10 sec from BASS Video Clock"). Shifted by one day, 17 of the first 21 tests fall inside a video; unshifted, none do. The minutes of the offset cannot be pinned this way (the matrix gives times to the minute, some marked "ish"). NASA's matrix itself says which clock its times are on: from April 2013 most time cells give a GMT day and an "MSG" time (Test 87, `as run matrix!B102`: "GMT13-113    MSG 15:27:04-15:41"); Test 85's comment gives both clocks (`as run matrix!AD97`: "started GN2 at 15:26 00 gmt 15:31:10 msg"), so the MSG clock ran about 5 minutes ahead of GMT; and Test 11's comment says "Camera set to GMT, not MSG" (`as run matrix!AD70`), so the cameras normally ran on the MSG clock. The video display is therefore read as the MSG clock, whose date reads one day after the matrix's GMT day. Where a time cell does not say MSG, the time may be GMT, and that test's frames may begin up to about 5 minutes before it started.
4. Each test's start (matrix columns A and B, plus one day) was searched for in each video that could hold it: read a frame, compare its clock, interpolate, repeat. Some videos are sped up (the clock runs two to four times faster than the video), so the search reads the clock rather than counting seconds. Where a test is in a real-time video and a sped-up one, the frames come from the real-time one and both are listed.
5. Six frames per test, at clock times evenly spaced from the test's start to the next test's start or ten minutes, each kept only if its on-screen clock is within 20 s of the time wanted. JPEG under 150 KB, changed only in size.

**Independent check.** The matrix's fan column (J) lists the fan settings used in each test. In 17 of the 28 tests with frames, a fan setting read from the frames' overlay is one of the numbers in that cell. The fan was not used to place the tests, so this agreement is a check on the placement and on the one-day offset. In the other 11 (Test 39, Test 118, Test 119, Test 95, Test 52, Test 106, Test 107, Test 108, Test 98, Test 117, Test 26) no fan reading from the frames equals a number in that cell; their placement rests on the clock alone. Several of their frames read 120 to 122 on screen, a setting no fan cell in the matrix lists; some matrix times are approximate (Test 98's time cell says "14:20ish?").

`media.csv` holds 33 `video` rows (links to NASA's videos, no local file) and 138 `still` rows (`media/Test_<n>/video_<hhmmss>.jpg`, named by the on-screen clock) for 28 tests. Each row's `match_rule` gives the matrix cell, the time searched for, where it was found, and the fan check where it agrees.

Not placed: 81 tests on days no video covers (all of 2012, and June 2013); 0 on a day with videos but at a time no video covers (none); 2 searched but not found (Test 116, Test 103); 0 where reading NASA's video failed (none); 10 whose matrix time cannot be read or disagrees with its own date:
- Test 35: date cell '6/29/`12' is not a date.
- Test 38: GMT day 113 in 'GMT13-113   MSG  11:46-11:54' does not agree with the date 2013-04-26.
- Test 92: time cell 'GMT-13 122' has no clock time.
- Test 78: time cell 'GMT-13 122' has no clock time.
- Test 53: time cell 'GMT 135' has no clock time.
- Test 109: time cell 'GMT 137' has no clock time.
- Test 79: GMT day 150 in 'GMT 150  10:43-11:00' does not agree with the date 2013-06-01.
- Test 80: GMT day 150 in 'GMT 150  11:10-11:42' does not agree with the date 2013-06-01.
- Test 75: GMT day 150 in 'GMT 150  11:47-11:52' does not agree with the date 2013-06-01.
- Test 53: GMT day 150 in 'GMT 150  16:11-16:14' does not agree with the date 2013-06-01.


## Validator warnings

None.

## Reproduction

Not attempted in this version.

<!-- guide_findings:start -->
## NASA's Researcher's Guide (version 4)

Source G1: A Researcher's Guide to: Combustion Science (NASA ISS Program Science Office, 2015). The NASA Space Apps challenge page lists it under "NASA Data & Resources". PSI holds the same
file in the folders of PSI-20, PSI-21, PSI-22 and PSI-23; G1 points to the PSI-20 copy (1,532,064 bytes, sha256
`d85c92823f8917979df00e09e8e0ca40f42092a330ef30dcb8a8af34e7ee6bc0`). It has no test tables. a script cuts each sentence below word for word from the PDF's text
(PyMuPDF), from given first and last words, and stops if they are not found once on the stated page.

| Finding | Page | What it says |
|---|---|---|
| F16 | p. 18 | Ventilation flow can undo the safety margin assumed for microgravity |
| F17 | p. 18 | Some materials burn at lower oxygen in low-flow microgravity or partial gravity than in normal gravity |
| F18 | p. 18 | Materials are easier to ignite in low gravity |
| F19 | p. 18 | In slow airflow a flame may spread upstream, the opposite of normal gravity |
| F20 | p. 18 | Radiant heat changes how flammable a material is |
| F21 | p. 19 | BASS used nitrogen to test down to 17% oxygen |
| F22 | p. 20 | At 17% oxygen a burning acrylic sphere stays blue longer (soot is delayed) |
| F23 | p. 22 | A nitrogen jet can strengthen a flame instead of putting it out |
| F24 | p. 35 | Three old beliefs about fire in spacecraft were shown to be wrong |

The SI tool chose the sentences. The team's six members have checked them.

### Reproduction (Guide findings)

- F21, "as low as 17 percent oxygen" (p. 19): **not reproduced exactly.** The as-run matrix (S2) gives 7 tests below 0.17: Test 87 0.159, Test 89 0.1605, Test 95 0.1605, Test 92 0.163, Test 78 0.163, Test 39 0.1667, Test 38 0.1667. The lowest is 0.159 (Test 87). The Guide's 17 percent is kept as NASA wrote it.
- F22, Figure 11 (p. 20), 17 percent oxygen and 12 cm/s: **reproduced** by Test 99, oxygen 0.1707 and Air display "12" in S2.
- The other Guide findings give no number.

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
