# PSI-99 Saffire-II: evidence pack, version 4

PSI's Saffire-II table gives the set-up of each sample. NASA's results per sample (burn time, burn length and flame spread rate in orbit, burn length and spread rate at 1 g, oxygen during the burn) are not in any PSI file: they are in Table 1 of two NASA Glenn presentations that are public on NTRS. This pack copies that table, the outcomes NASA states in words, NASA's findings, and the science channels of each sample's sensor workbook as curves (version 4; CO2 and pressure since version 1).

It holds 187 claims on 9 tests, 24 findings, 0 new 0g/1g pair(s) and 41216 curve points. Nothing is derived or estimated.

| Variable | Claims |
|---|---|
| `sample_width_cm` | 18 |
| `flow_speed_cm_s` | 18 |
| `flow_direction` | 18 |
| `o2_fraction` | 18 |
| `igniter_power_w` | 18 |
| `ignition_time_s` | 18 |
| `sample_length_cm` | 16 |
| `sample_thickness_mm` | 14 |
| `burn_length_cm` | 12 |
| `burn_time_s` | 10 |
| `pressure_kpa` | 9 |
| `burn_length_1g_cm` | 4 |
| `spread_rate_1g_mm_s` | 4 |
| `spread_rate_mm_s` | 4 |
| `end_mode` | 4 |
| `ignited` | 2 |

## Scoreboard

Counted with the loader's `scoreboard()` on records rebuilt from `known_tests.csv` (this pack alone); the loader raised 140 quality findings.

| Count | Before | After |
|---|---|---|
| solid-fuel tests | 380 | 380 |
| with oxygen | 140 | 140 |
| with air speed | 251 | 251 |
| with oxygen and air speed | 132 | 132 |
| with oxygen, air speed and what happened | 11 | 11 |
| with a pressure NASA states | 0 | 9 |

Quality findings the loader would raise (each is a second NASA statement that disagrees with PSI's table):

- Sample 2-1, Sample width: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 5 cm (p. 29, Table I, row 2-1, column Width). The table's value is the one used.
- Sample 2-1, Sample width: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 5 cm (p. 30, Table 1, row II-1, column Width). The table's value is the one used.
- Sample 2-1, Sample thickness: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 0.27 mm (p. 29, Table I, row 2-1, column Thickness). The table's value is the one used.
- Sample 2-1, Sample thickness: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 0.27 mm (p. 30, Table 1, row II-1, column Thickness). The table's value is the one used.
- Sample 2-1, Sample length: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 29 cm (p. 29, Table I, row 2-1, column Length). The table's value is the one used.
- Sample 2-1, Sample length: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 29 cm (p. 30, Table 1, row II-1, column Length). The table's value is the one used.
- Sample 2-1, Flow direction: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives "concurrent" (p. 29, Table I, row 2-1, column Direction). The table's value is the one used.
- Sample 2-1, Flow direction: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives "concurrent" (p. 30, Table 1, row II-1, column Direction). The table's value is the one used.
- Sample 2-1, Oxygen: the experimental table gives 0.215 fraction; NASA's file NTRS-20170008805.pdf gives 0.221 fraction (p. 29, Table I, row 2-1, column Δ %O2). The table's value is the one used.
- Sample 2-1, Oxygen: the experimental table gives 0.215 fraction; NASA's file NTRS-20180005168.pdf gives 0.221 fraction (p. 30, Table 1, row II-1, column Δ %O2). The table's value is the one used.
- Sample 2-2, Sample width: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 5 cm (p. 29, Table I, row 2-2, column Width). The table's value is the one used.
- Sample 2-2, Sample width: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 5 cm (p. 30, Table 1, row II-2, column Width). The table's value is the one used.
- Sample 2-2, Sample thickness: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 0.61 mm (p. 29, Table I, row 2-2, column Thickness). The table's value is the one used.
- Sample 2-2, Sample thickness: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 0.61 mm (p. 30, Table 1, row II-2, column Thickness). The table's value is the one used.
- Sample 2-2, Sample length: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 29 cm (p. 29, Table I, row 2-2, column Length). The table's value is the one used.
- Sample 2-2, Sample length: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 29 cm (p. 30, Table 1, row II-2, column Length). The table's value is the one used.
- Sample 2-2, Flow direction: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives "concurrent" (p. 29, Table I, row 2-2, column Direction). The table's value is the one used.
- Sample 2-2, Flow direction: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives "concurrent" (p. 30, Table 1, row II-2, column Direction). The table's value is the one used.
- Sample 2-3, Sample width: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 5 cm (p. 29, Table I, row 2-3, column Width). The table's value is the one used.
- Sample 2-3, Sample width: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 5 cm (p. 30, Table 1, row II-3, column Width). The table's value is the one used.
- Sample 2-3, Sample thickness: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 1.03 mm (p. 29, Table I, row 2-3, column Thickness). The table's value is the one used.
- Sample 2-3, Sample thickness: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 1.03 mm (p. 30, Table 1, row II-3, column Thickness). The table's value is the one used.
- Sample 2-3, Sample length: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 29 cm (p. 29, Table I, row 2-3, column Length). The table's value is the one used.
- Sample 2-3, Sample length: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 29 cm (p. 30, Table 1, row II-3, column Length). The table's value is the one used.
- Sample 2-3, Flow direction: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives "concurrent" (p. 29, Table I, row 2-3, column Direction). The table's value is the one used.
- Sample 2-3, Flow direction: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives "concurrent" (p. 30, Table 1, row II-3, column Direction). The table's value is the one used.
- Sample 2-4, Sample width: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 5 cm (p. 29, Table I, row 2-4, column Width). The table's value is the one used.
- Sample 2-4, Sample width: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 5 cm (p. 30, Table 1, row II-4, column Width). The table's value is the one used.
- Sample 2-4, Sample thickness: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 0.37 mm (p. 29, Table I, row 2-4, column Thickness). The table's value is the one used.
- Sample 2-4, Sample thickness: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 0.37 mm (p. 30, Table 1, row II-4, column Thickness). The table's value is the one used.
- Sample 2-4, Sample length: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 29 cm (p. 29, Table I, row 2-4, column Length). The table's value is the one used.
- Sample 2-4, Sample length: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 29 cm (p. 30, Table 1, row II-4, column Length). The table's value is the one used.
- Sample 2-4, Flow direction: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives "opposed" (p. 29, Table I, row 2-4, column Direction). The table's value is the one used.
- Sample 2-4, Flow direction: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives "opposed" (p. 30, Table 1, row II-4, column Direction). The table's value is the one used.
- Sample 2-5, Sample width: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 5 cm (p. 29, Table I, row 2-5, column Width). The table's value is the one used.
- Sample 2-5, Sample width: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 5 cm (p. 30, Table 1, row II-5, column Width). The table's value is the one used.
- Sample 2-5, Sample thickness: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 0.37 mm (p. 29, Table I, row 2-5, column Thickness). The table's value is the one used.
- Sample 2-5, Sample thickness: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 0.37 mm (p. 30, Table 1, row II-5, column Thickness). The table's value is the one used.
- Sample 2-5, Sample length: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 29 cm (p. 29, Table I, row 2-5, column Length). The table's value is the one used.
- Sample 2-5, Sample length: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 29 cm (p. 30, Table 1, row II-5, column Length). The table's value is the one used.
- Sample 2-5, Flow direction: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives "concurrent" (p. 29, Table I, row 2-5, column Direction). The table's value is the one used.
- Sample 2-5, Flow direction: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives "concurrent" (p. 30, Table 1, row II-5, column Direction). The table's value is the one used.
- Sample 2-6, Sample width: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 5 cm (p. 29, Table I, row 2-6, column Width). The table's value is the one used.
- Sample 2-6, Sample width: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 5 cm (p. 30, Table 1, row II-6, column Width). The table's value is the one used.
- Sample 2-6, Sample thickness: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 0.37 mm (p. 29, Table I, row 2-6, column Thickness). The table's value is the one used.
- Sample 2-6, Sample thickness: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 0.37 mm (p. 30, Table 1, row II-6, column Thickness). The table's value is the one used.
- Sample 2-6, Sample length: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 29 cm (p. 29, Table I, row 2-6, column Length). The table's value is the one used.
- Sample 2-6, Sample length: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 29 cm (p. 30, Table 1, row II-6, column Length). The table's value is the one used.
- Sample 2-6, Flow speed: the experimental table gives 20 cm/s; NASA's file NTRS-20170008805.pdf gives 25 cm/s (p. 29, Table I, row 2-6, column Flow). The table's value is the one used.
- Sample 2-6, Flow speed: the experimental table gives 20 cm/s; NASA's file NTRS-20180005168.pdf gives 25 cm/s (p. 30, Table 1, row II-6, column Flow). The table's value is the one used.
- Sample 2-6, Flow direction: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives "concurrent" (p. 29, Table I, row 2-6, column Direction). The table's value is the one used.
- Sample 2-6, Flow direction: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives "concurrent" (p. 30, Table 1, row II-6, column Direction). The table's value is the one used.
- Sample 2-7, Sample width: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 5 cm (p. 29, Table I, row 2-7, column Width). The table's value is the one used.
- Sample 2-7, Sample width: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 5 cm (p. 30, Table 1, row II-7, column Width). The table's value is the one used.
- Sample 2-7, Flow direction: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives "concurrent" (p. 29, Table I, row 2-7, column Direction). The table's value is the one used.
- Sample 2-7, Flow direction: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives "concurrent" (p. 30, Table 1, row II-7, column Direction). The table's value is the one used.
- Sample 2-8, Sample width: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 5 cm (p. 29, Table I, row 2-8, column Width). The table's value is the one used.
- Sample 2-8, Sample width: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 5 cm (p. 30, Table 1, row II-8, column Width). The table's value is the one used.
- Sample 2-8, Sample length: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 29 cm (p. 29, Table I, row 2-8, column Length). The table's value is the one used.
- Sample 2-8, Sample length: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 29 cm (p. 30, Table 1, row II-8, column Length). The table's value is the one used.
- Sample 2-8, Flow direction: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives "concurrent" (p. 29, Table I, row 2-8, column Direction). The table's value is the one used.
- Sample 2-8, Flow direction: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives "concurrent" (p. 30, Table 1, row II-8, column Direction). The table's value is the one used.
- Sample 2-9, Sample width: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 5 cm (p. 29, Table I, row 2-9, column Width). The table's value is the one used.
- Sample 2-9, Sample width: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 5 cm (p. 30, Table 1, row II-9, column Width). The table's value is the one used.
- Sample 2-9, Sample thickness: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 10 mm (p. 29, Table I, row 2-9, column Thickness). The table's value is the one used.
- Sample 2-9, Sample thickness: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 10 mm (p. 30, Table 1, row II-9, column Thickness). The table's value is the one used.
- Sample 2-9, Sample length: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 29 cm (p. 29, Table I, row 2-9, column Length). The table's value is the one used.
- Sample 2-9, Sample length: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 29 cm (p. 30, Table 1, row II-9, column Length). The table's value is the one used.
- Sample 2-9, Flow direction: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives "concurrent" (p. 29, Table I, row 2-9, column Direction). The table's value is the one used.
- Sample 2-9, Flow direction: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives "concurrent" (p. 30, Table 1, row II-9, column Direction). The table's value is the one used.
- Sample 2-1, Igniter power: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 80 W (p. 29, Table I (continued), row 2-1, column Ignition Power). The table's value is the one used.
- Sample 2-1, Igniter power: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 80 W (p. 31, Table 1 (continued), row 2-1, column Ignition Power). The table's value is the one used.
- Sample 2-1, Ignition time: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 9.2 s (p. 29, Table I (continued), row 2-1, column Ignition Time). The table's value is the one used.
- Sample 2-1, Ignition time: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 9.2 s (p. 31, Table 1 (continued), row 2-1, column Ignition Time). The table's value is the one used.
- Sample 2-1, Burn length: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 0 cm (p. 29, Table I (continued), row 2-1, column µ-g Burn Length). The table's value is the one used.
- Sample 2-1, Burn length: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 0 cm (p. 31, Table 1 (continued), row 2-1, column µ-g Burn Length). The table's value is the one used.
- Sample 2-2, Igniter power: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 80 W (p. 29, Table I (continued), row 2-2, column Ignition Power). The table's value is the one used.
- Sample 2-2, Igniter power: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 80 W (p. 31, Table 1 (continued), row 2-2, column Ignition Power). The table's value is the one used.
- Sample 2-2, Ignition time: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 9.2 s (p. 29, Table I (continued), row 2-2, column Ignition Time). The table's value is the one used.
- Sample 2-2, Ignition time: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 9.2 s (p. 31, Table 1 (continued), row 2-2, column Ignition Time). The table's value is the one used.
- Sample 2-2, Burn length: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 0 cm (p. 29, Table I (continued), row 2-2, column µ-g Burn Length). The table's value is the one used.
- Sample 2-2, Burn length: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 0 cm (p. 31, Table 1 (continued), row 2-2, column µ-g Burn Length). The table's value is the one used.
- Sample 2-2, Burn length at 1 g: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 7.6 cm (p. 29, Table I (continued), row 2-2, column 1-g Burn Length). The table's value is the one used.
- Sample 2-2, Burn length at 1 g: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 7.6 cm (p. 31, Table 1 (continued), row 2-2, column 1-g Burn Length). The table's value is the one used.
- Sample 2-2, Flame spread rate at 1 g: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 1.2 mm/s (p. 29, Table I (continued), row 2-2, column 1-g Spread Rate). The table's value is the one used.
- Sample 2-2, Flame spread rate at 1 g: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 1.2 mm/s (p. 31, Table 1 (continued), row 2-2, column 1-g Spread Rate). The table's value is the one used.
- Sample 2-3, Igniter power: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 80 W (p. 29, Table I (continued), row 2-3, column Ignition Power). The table's value is the one used.
- Sample 2-3, Igniter power: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 80 W (p. 31, Table 1 (continued), row 2-3, column Ignition Power). The table's value is the one used.
- Sample 2-3, Ignition time: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 9.2 s (p. 29, Table I (continued), row 2-3, column Ignition Time). The table's value is the one used.
- Sample 2-3, Ignition time: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 9.2 s (p. 31, Table 1 (continued), row 2-3, column Ignition Time). The table's value is the one used.
- Sample 2-3, Burn length: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 0 cm (p. 29, Table I (continued), row 2-3, column µ-g Burn Length). The table's value is the one used.
- Sample 2-3, Burn length: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 0 cm (p. 31, Table 1 (continued), row 2-3, column µ-g Burn Length). The table's value is the one used.
- Sample 2-3, Burn length at 1 g: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 0 cm (p. 29, Table I (continued), row 2-3, column 1-g Burn Length). The table's value is the one used.
- Sample 2-3, Burn length at 1 g: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 0 cm (p. 31, Table 1 (continued), row 2-3, column 1-g Burn Length). The table's value is the one used.
- Sample 2-4, Igniter power: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 80 W (p. 29, Table I (continued), row 2-4, column Ignition Power). The table's value is the one used.
- Sample 2-4, Igniter power: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 80 W (p. 31, Table 1 (continued), row 2-4, column Ignition Power). The table's value is the one used.
- Sample 2-4, Ignition time: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 9.2 s (p. 29, Table I (continued), row 2-4, column Ignition Time). The table's value is the one used.
- Sample 2-4, Ignition time: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 9.2 s (p. 31, Table 1 (continued), row 2-4, column Ignition Time). The table's value is the one used.
- Sample 2-4, Burn length: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 0 cm (p. 29, Table I (continued), row 2-4, column µ-g Burn Length). The table's value is the one used.
- Sample 2-4, Burn length: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 0 cm (p. 31, Table 1 (continued), row 2-4, column µ-g Burn Length). The table's value is the one used.
- Sample 2-4, Flame spread rate at 1 g: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 0.6 mm/s (p. 29, Table I (continued), row 2-4, column 1-g Spread Rate). The table's value is the one used.
- Sample 2-4, Flame spread rate at 1 g: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 0.6 mm/s (p. 31, Table 1 (continued), row 2-4, column 1-g Spread Rate). The table's value is the one used.
- Sample 2-5, Igniter power: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 80 W (p. 29, Table I (continued), row 2-5, column Ignition Power). The table's value is the one used.
- Sample 2-5, Igniter power: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 80 W (p. 31, Table 1 (continued), row 2-5, column Ignition Power). The table's value is the one used.
- Sample 2-5, Ignition time: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 9.2 s (p. 29, Table I (continued), row 2-5, column Ignition Time). The table's value is the one used.
- Sample 2-5, Ignition time: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 9.2 s (p. 31, Table 1 (continued), row 2-5, column Ignition Time). The table's value is the one used.
- Sample 2-5, Burn time: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 145 s (p. 29, Table I (continued), row 2-5, column Burn Duration). The table's value is the one used.
- Sample 2-5, Burn time: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 145 s (p. 31, Table 1 (continued), row 2-5, column Burn Duration). The table's value is the one used.
- Sample 2-5, Burn length: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 29 cm (p. 29, Table I (continued), row 2-5, column µ-g Burn Length). The table's value is the one used.
- Sample 2-5, Burn length: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 29 cm (p. 31, Table 1 (continued), row 2-5, column µ-g Burn Length). The table's value is the one used.
- Sample 2-5, Flame spread rate: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 2.1 mm/s (p. 29, Table I (continued), row 2-5, column µ-g Spread Rate). The table's value is the one used.
- Sample 2-5, Flame spread rate: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 2.1 mm/s (p. 31, Table 1 (continued), row 2-5, column µ-g Spread Rate). The table's value is the one used.
- Sample 2-6, Igniter power: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 80 W (p. 29, Table I (continued), row 2-6, column Ignition Power). The table's value is the one used.
- Sample 2-6, Igniter power: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 80 W (p. 31, Table 1 (continued), row 2-6, column Ignition Power). The table's value is the one used.
- Sample 2-6, Ignition time: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 9.2 s (p. 29, Table I (continued), row 2-6, column Ignition Time). The table's value is the one used.
- Sample 2-6, Ignition time: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 9.2 s (p. 31, Table 1 (continued), row 2-6, column Ignition Time). The table's value is the one used.
- Sample 2-6, Burn time: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 115 s (p. 29, Table I (continued), row 2-6, column Burn Duration). The table's value is the one used.
- Sample 2-6, Burn time: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 115 s (p. 31, Table 1 (continued), row 2-6, column Burn Duration). The table's value is the one used.
- Sample 2-6, Burn length: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 29 cm (p. 29, Table I (continued), row 2-6, column µ-g Burn Length). The table's value is the one used.
- Sample 2-6, Burn length: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 29 cm (p. 31, Table 1 (continued), row 2-6, column µ-g Burn Length). The table's value is the one used.
- Sample 2-6, Flame spread rate: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 2.6 mm/s (p. 29, Table I (continued), row 2-6, column µ-g Spread Rate). The table's value is the one used.
- Sample 2-6, Flame spread rate: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 2.6 mm/s (p. 31, Table 1 (continued), row 2-6, column µ-g Spread Rate). The table's value is the one used.
- Sample 2-7, Igniter power: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 80 W (p. 29, Table I (continued), row 2-7, column Ignition Power). The table's value is the one used.
- Sample 2-7, Igniter power: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 80 W (p. 31, Table 1 (continued), row 2-7, column Ignition Power). The table's value is the one used.
- Sample 2-7, Ignition time: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 9.2 s (p. 29, Table I (continued), row 2-7, column Ignition Time). The table's value is the one used.
- Sample 2-7, Ignition time: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 9.2 s (p. 31, Table 1 (continued), row 2-7, column Ignition Time). The table's value is the one used.
- Sample 2-7, Burn time: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 140 s (p. 29, Table I (continued), row 2-7, column Burn Duration). The table's value is the one used.
- Sample 2-7, Burn time: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 140 s (p. 31, Table 1 (continued), row 2-7, column Burn Duration). The table's value is the one used.
- Sample 2-8, Igniter power: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 97 W (p. 29, Table I (continued), row 2-8, column Ignition Power). The table's value is the one used.
- Sample 2-8, Igniter power: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 97 W (p. 31, Table 1 (continued), row 2-8, column Ignition Power). The table's value is the one used.
- Sample 2-8, Ignition time: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 30 s (p. 29, Table I (continued), row 2-8, column Ignition Time). The table's value is the one used.
- Sample 2-8, Ignition time: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 30 s (p. 31, Table 1 (continued), row 2-8, column Ignition Time). The table's value is the one used.
- Sample 2-8, Burn time: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 600 s (p. 29, Table I (continued), row 2-8, column Burn Duration). The table's value is the one used.
- Sample 2-8, Burn time: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 600 s (p. 31, Table 1 (continued), row 2-8, column Burn Duration). The table's value is the one used.
- Sample 2-9, Igniter power: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 97 W (p. 29, Table I (continued), row 2-9, column Ignition Power). The table's value is the one used.
- Sample 2-9, Igniter power: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 97 W (p. 31, Table 1 (continued), row 2-9, column Ignition Power). The table's value is the one used.
- Sample 2-9, Ignition time: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 30 s (p. 29, Table I (continued), row 2-9, column Ignition Time). The table's value is the one used.
- Sample 2-9, Ignition time: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 30 s (p. 31, Table 1 (continued), row 2-9, column Ignition Time). The table's value is the one used.
- Sample 2-9, Burn time: the experimental table gives "(held)"; NASA's file NTRS-20170008805.pdf gives 900 s (p. 29, Table I (continued), row 2-9, column Burn Duration). The table's value is the one used.
- Sample 2-9, Burn time: the experimental table gives "(held)"; NASA's file NTRS-20180005168.pdf gives 900 s (p. 31, Table 1 (continued), row 2-9, column Burn Duration). The table's value is the one used.


## Sources

| id | File | Kind | Bytes | On disk |
|---|---|---|---|---|
| S1 | `PSI-99_Experimental table_SAFFIRE-2.csv` | experimental_table | 1973 | kept |
| ICES | `NTRS-20170008805.pdf` | publication | 5091642 | deleted after reading (checksum in manifest.json) |
| ASGSR | `NTRS-20180005168.pdf` | publication | 9049169 | deleted after reading (checksum in manifest.json) |
| PMMA | `NTRS-20200000557.pdf` | publication | 1379399 | kept |
| R1 | `PSI-99_Raw Data_Saffire Sensor Data Sample 1.xlsx` | raw_log | 13817030 | kept |
| R2 | `PSI-99_Raw Data_Saffire Sensor Data Sample 2.xlsx` | raw_log | 17570780 | kept |
| R3 | `PSI-99_Raw Data_Saffire Sensor Data Sample 3.xlsx` | raw_log | 17526258 | kept |
| R4 | `PSI-99_Raw Data_Saffire Sensor Data Sample 4.xlsx` | raw_log | 17506439 | kept |
| R5 | `PSI-99_Raw Data_Saffire Sensor Data Sample 5.xlsx` | raw_log | 12281904 | kept |
| R6 | `PSI-99_Raw Data_Saffire Sensor Data Sample 6.xlsx` | raw_log | 12086208 | kept |
| R7 | `PSI-99_Raw Data_Saffire Sensor Data Sample 7.xlsx` | raw_log | 21417527 | kept |
| R8 | `PSI-99_Raw Data_Saffire Sensor Data Sample 8.xlsx` | raw_log | 23595029 | kept |
| R9 | `PSI-99_Raw Data_Saffire Sensor Data Sample 9.xlsx` | raw_log | 32866352 | kept |

`ICES` is NTRS 20170008805, "Results of Large-Scale Spacecraft Flammability Tests", NASA Glenn presentation, ICES 2017, Charleston SC, 16 July 2017 (GRC-E-DAA-TN44517). `ASGSR` is NTRS 20180005168, "Saffire: A Novel Approach to Study of Spacecraft Fire Safety Using Un-Manned Spacecraft", NASA Glenn presentation, American Society for Gravitational and Space Research, 25 October 2017 (GRC-E-DAA-TN48184). Their `psi_path` is the NTRS download address. Both are NASA Glenn presentations (authors Ferkul, Olson, Urban, Ruff, Easton and others) marked public use permitted. The PSI listing's "SAFFIRE_47th I Con of Env Sys presentation.pdf" is probably the same ICES 2017 talk, but PSI does not serve it, and its listed size (5,224,988 bytes) differs from the NTRS file, so it is not assumed to be the same file.

## What each file holds

- **PSI experimental table** (`S1`): set-up per sample; read only for the join. Already loaded by the web side.
- **ICES, p. 29, Table I** (Saffire-I and -II, samples 1-1 to 2-9) and **ASGSR, pp. 30 to 31, Table 1** (the same rows plus Saffire-III, 3-1 and 3-2): columns Sample, Material, Width, Thickness, Length, Flow, Direction, Δ %O2; then Ignition Power, Ignition Time, Burn Duration, µ-g Burn Length, µ-g Spread Rate, 1-g Burn Length, 1-g Spread Rate. The ICES table carries footnotes i to iv; the ASGSR table prints the markers but not the notes. Both are text in the PDF, not pictures, so no value was read from an image.
- **ICES pp. 8 to 26 and ASGSR pp. 16 to 25**: results in words (findings below).
- **Sensor workbooks** (`R1`...): 10 sheets that are charts only, and one sheet "Calibrated Data": row 1 names, row 2 units, then one row per about 33 ms: Elapsed Time (s) (a formula on the epoch time; its cached value is used), Epoch Time, Timestamp, Index, Average Fan Speed (RPM), CO2 (%), O2 (%), Anemometer 1 and 2 (cm/sec), Ambient Pressure (PSIA), Radiometer 1 to 4 (mw/cm^2), Humidity (%), Test Section Inlet Temp, Plume Temp 1 to 6 (TC1 to TC6), Sample Temp 1 to 6 (TC7 to TC12) (Degrees C), Radiometer Temps, Igniter Current (Amps) and Voltage, avionics voltages and temperatures, and command flags. The sheet's stated range runs to row 32601, but only the rows with a time are data.

| Sample | Workbook | Rows used for the curves |
|---|---|---|
| 2-1 | `PSI-99_Raw Data_Saffire Sensor Data Sample 1.xlsx` | 13182 rows from 11-21-2016 7:05:47.567 PM to 11-21-2016 7:13:02.540 PM (t = 0 to 435.0 s); k = 66, 200 points; igniter current above 0.5 A from t = 60.0 to 69.2 s; O2 sensor 21.48% at the start |
| 2-2 | `PSI-99_Raw Data_Saffire Sensor Data Sample 2.xlsx` | 16818 rows from 11-21-2016 7:13:37.604 PM to 11-21-2016 7:22:52.565 PM (t = 0 to 555.0 s); k = 85, 198 points; igniter current above 0.5 A from t = 60.0 to 69.2 s; O2 sensor 21.54% at the start |
| 2-3 | `PSI-99_Raw Data_Saffire Sensor Data Sample 3.xlsx` | 16818 rows from 11-21-2016 7:23:27.638 PM to 11-21-2016 7:32:42.599 PM (t = 0 to 555.0 s); k = 85, 198 points; igniter current above 0.5 A from t = 60.0 to 69.2 s; O2 sensor 21.51% at the start |
| 2-4 | `PSI-99_Raw Data_Saffire Sensor Data Sample 4.xlsx` | 16818 rows from 11-21-2016 7:33:17.672 PM to 11-21-2016 7:42:32.633 PM (t = 0 to 555.0 s); k = 85, 198 points; igniter current above 0.5 A from t = 60.0 to 69.2 s; O2 sensor 21.55% at the start |
| 2-5 | `PSI-99_Raw Data_Saffire Sensor Data Sample 5.xlsx` | 11363 rows from 11-21-2016 7:43:07.709 PM to 11-21-2016 7:49:22.655 PM (t = 0 to 374.9 s); k = 57, 200 points; igniter current above 0.5 A from t = 60.0 to 69.1 s; O2 sensor 21.80% at the start |
| 2-6 | `PSI-99_Raw Data_Saffire Sensor Data Sample 6.xlsx` | 11363 rows from 11-21-2016 7:49:57.746 PM to 11-21-2016 7:56:12.692 PM (t = 0 to 374.9 s); k = 57, 200 points; igniter current above 0.5 A from t = 60.0 to 69.2 s; O2 sensor 21.57% at the start |
| 2-7 | `PSI-99_Raw Data_Saffire Sensor Data Sample 7.xlsx` | 20454 rows from 11-21-2016 8:45:19.937 PM to 11-21-2016 8:56:34.886 PM (t = 0 to 674.9 s); k = 103, 199 points; igniter current above 0.5 A from t = 60.0 to 69.2 s; O2 sensor 21.56% at the start |
| 2-8 | `PSI-99_Raw Data_Saffire Sensor Data Sample 8.xlsx` | 21818 rows from 11-21-2016 8:57:09.975 PM to 11-21-2016 9:09:09.936 PM (t = 0 to 720.0 s); k = 110, 199 points; igniter current above 0.5 A from t = 60.0 to 90.0 s; O2 sensor 21.56% at the start |
| 2-9 | `PSI-99_Raw Data_Saffire Sensor Data Sample 9.xlsx` | 30909 rows from 11-21-2016 9:09:45.013 PM to 11-21-2016 9:26:44.977 PM (t = 0 to 1020.0 s); k = 155, 200 points; igniter current above 0.5 A from t = 60.0 to 90.0 s; O2 sensor 21.53% at the start |

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
| O2 | % | `o2_fraction` | fraction (x 0.01) | 1792 |
| Anemometer 1 | cm/sec | `saffire_anemometer_1_cm_s` | cm/s | 1792 |
| Anemometer 2 | cm/sec | `saffire_anemometer_2_cm_s` | cm/s | 1792 |
| Radiometer 1 | mw/cm^2 | `saffire_radiometer_1_mw_cm2` | mW/cm² | 1792 |
| Radiometer 2 | mw/cm^2 | `saffire_radiometer_2_mw_cm2` | mW/cm² | 1792 |
| Radiometer 3 | mw/cm^2 | `saffire_radiometer_3_mw_cm2` | mW/cm² | 1792 |
| Radiometer 4 | mw/cm^2 | `saffire_radiometer_4_mw_cm2` | mW/cm² | 1792 |
| Humidity | % | `saffire_humidity_pct` | % | 1792 |
| Test Section Inlet Temp | Degrees C | `saffire_inlet_temp_c` | °C | 1792 |
| Plume Temp 1 (TC1) | Degrees C | `saffire_plume_temp_tc1_c` | °C | 1792 |
| Plume Temp 2 (TC2) | Degrees C | `saffire_plume_temp_tc2_c` | °C | 1792 |
| Plume Temp 3 (TC3) | Degrees C | `saffire_plume_temp_tc3_c` | °C | 1792 |
| Plume Temp 4 (TC4) | Degrees C | `saffire_plume_temp_tc4_c` | °C | 1792 |
| Plume Temp 5 (TC5) | Degrees C | `saffire_plume_temp_tc5_c` | °C | 1792 |
| Plume Temp 6 (TC6) | Degrees C | `saffire_plume_temp_tc6_c` | °C | 1792 |
| Sample Temp 1 (TC7) | Degrees C | `saffire_sample_temp_tc7_c` | °C | 1792 |
| Sample Temp 2 (TC8) | Degrees C | `saffire_sample_temp_tc8_c` | °C | 1792 |
| Sample Temp 3 (TC9) | Degrees C | `saffire_sample_temp_tc9_c` | °C | 1792 |
| Sample Temp 4 (TC10) | Degrees C | `saffire_sample_temp_tc10_c` | °C | 1792 |
| Sample Temp 5 (TC11) | Degrees C | `saffire_sample_temp_tc11_c` | °C | 1792 |
| Sample Temp 6 (TC12) | Degrees C | `saffire_sample_temp_tc12_c` | °C | 1792 |

41216 curve points on 9 tests in all. At most 200 points per test per variable, by the rule: every k-th data row of sheet 'Calibrated Data', starting with the first (row 3), k = ceil(N/200) where N is the number of data rows; values copied, never averaged.

No channel was missing from any workbook used.

A cell that is empty or not a number gives no point, so a channel can have fewer points than CO2 on a test. New validator warnings: none expected from these curves; any warning is quoted under Validator warnings.

## Claims not made, and why

- 2-7 Thickness "0.85 & 0.37 mm": two materials in one cell; not claimed.
- 2-7 Length "5 & 24 cm": two materials in one cell; not claimed.
- 2-8 Thickness "See Fig. 5" (ICES): not a number in the column's unit; not claimed.
- 2-1 Burn Duration "Insignificant" (ICES): not a number in the column's unit; not claimed.
- 2-1 µ-g Spread Rate "n/a" (ICES): not a number in the column's unit; not claimed.
- 2-1 1-g Burn Length "~ Complete" (ICES): not a number in the column's unit; not claimed.
- 2-1 1-g Spread Rate "Acceleratory" (ICES): not a number in the column's unit; not claimed.
- 2-2 Burn Duration "Insignificant" (ICES): not a number in the column's unit; not claimed.
- 2-2 µ-g Spread Rate "n/a" (ICES): not a number in the column's unit; not claimed.
- 2-3 Burn Duration "Insignificant" (ICES): not a number in the column's unit; not claimed.
- 2-3 µ-g Spread Rate "n/a" (ICES): not a number in the column's unit; not claimed.
- 2-3 1-g Spread Rate "n/a" (ICES): not a number in the column's unit; not claimed.
- 2-4 Burn Duration "Insignificant" (ICES): not a number in the column's unit; not claimed.
- 2-4 µ-g Spread Rate "n/a" (ICES): not a number in the column's unit; not claimed.
- 2-4 1-g Burn Length "Complete" (ICES): not a number in the column's unit; not claimed.
- 2-5 1-g Burn Length "Complete" (ICES): not a number in the column's unit; not claimed.
- 2-5 1-g Spread Rate "Acceleratory" (ICES): not a number in the column's unit; not claimed.
- 2-6 1-g Burn Length "Complete" (ICES): not a number in the column's unit; not claimed.
- 2-6 1-g Spread Rate "Acceleratory" (ICES): not a number in the column's unit; not claimed.
- 2-7 µ-g Burn Length "5 cm & 0 ii": two materials in one cell; not claimed.
- 2-7 µ-g Spread Rate "n/a (Nomex)" (ICES): not a number in the column's unit; not claimed.
- 2-7 1-g Burn Length "~ 0 (Nomex)": two materials in one cell; not claimed.
- 2-7 1-g Spread Rate "n/a (Nomex)" (ICES): not a number in the column's unit; not claimed.
- 2-8 µ-g Burn Length "~ 10 cm iii": footnote iii says it is the length visibly damaged, not burned; not claimed.
- 2-8 µ-g Spread Rate "Note (iv)" (ICES): not a number in the column's unit; not claimed.
- 2-8 1-g Burn Length "Complete" (ICES): not a number in the column's unit; not claimed.
- 2-8 1-g Spread Rate "Acceleratory" (ICES): not a number in the column's unit; not claimed.
- 2-9 µ-g Burn Length "~ 10 cm iii": footnote iii says it is the length visibly damaged, not burned; not claimed.
- 2-9 µ-g Spread Rate "Note (iv)" (ICES): not a number in the column's unit; not claimed.
- 2-9 1-g Burn Length "Complete" (ICES): not a number in the column's unit; not claimed.
- 2-9 1-g Spread Rate "Acceleratory" (ICES): not a number in the column's unit; not claimed.
- 2-7 Thickness "0.85 & 0.37 mm": two materials in one cell; not claimed.
- 2-7 Length "5 & 24 cm": two materials in one cell; not claimed.
- 2-8 Thickness "See Fig. 5" (ASGSR): not a number in the column's unit; not claimed.
- 2-1 Burn Duration "Insignificant" (ASGSR): not a number in the column's unit; not claimed.
- 2-1 µ-g Spread Rate "n/a" (ASGSR): not a number in the column's unit; not claimed.
- 2-1 1-g Burn Length "~ Complete" (ASGSR): not a number in the column's unit; not claimed.
- 2-1 1-g Spread Rate "Acceleratory" (ASGSR): not a number in the column's unit; not claimed.
- 2-2 Burn Duration "Insignificant" (ASGSR): not a number in the column's unit; not claimed.
- 2-2 µ-g Spread Rate "n/a" (ASGSR): not a number in the column's unit; not claimed.
- 2-3 Burn Duration "Insignificant" (ASGSR): not a number in the column's unit; not claimed.
- 2-3 µ-g Spread Rate "n/a" (ASGSR): not a number in the column's unit; not claimed.
- 2-3 1-g Spread Rate "n/a" (ASGSR): not a number in the column's unit; not claimed.
- 2-4 Burn Duration "Insignificant" (ASGSR): not a number in the column's unit; not claimed.
- 2-4 µ-g Spread Rate "n/a" (ASGSR): not a number in the column's unit; not claimed.
- 2-4 1-g Burn Length "Complete" (ASGSR): not a number in the column's unit; not claimed.
- 2-5 1-g Burn Length "Complete" (ASGSR): not a number in the column's unit; not claimed.
- 2-5 1-g Spread Rate "Acceleratory" (ASGSR): not a number in the column's unit; not claimed.
- 2-6 1-g Burn Length "Complete" (ASGSR): not a number in the column's unit; not claimed.
- 2-6 1-g Spread Rate "Acceleratory" (ASGSR): not a number in the column's unit; not claimed.
- 2-7 µ-g Burn Length "5 cm & 0 ii": two materials in one cell; not claimed.
- 2-7 µ-g Spread Rate "n/a (Nomex)" (ASGSR): not a number in the column's unit; not claimed.
- 2-7 1-g Burn Length "~ 0 (Nomex)": two materials in one cell; not claimed.
- 2-7 1-g Spread Rate "n/a (Nomex)" (ASGSR): not a number in the column's unit; not claimed.
- 2-8 µ-g Burn Length "~ 10 cm iii": footnote iii says it is the length visibly damaged, not burned; not claimed.
- 2-8 µ-g Spread Rate "Note (iv)" (ASGSR): not a number in the column's unit; not claimed.
- 2-8 1-g Burn Length "Complete" (ASGSR): not a number in the column's unit; not claimed.
- 2-8 1-g Spread Rate "Acceleratory" (ASGSR): not a number in the column's unit; not claimed.
- 2-9 µ-g Burn Length "~ 10 cm iii": footnote iii says it is the length visibly damaged, not burned; not claimed.
- 2-9 µ-g Spread Rate "Note (iv)" (ASGSR): not a number in the column's unit; not claimed.
- 2-9 1-g Burn Length "Complete" (ASGSR): not a number in the column's unit; not claimed.
- 2-9 1-g Spread Rate "Acceleratory" (ASGSR): not a number in the column's unit; not claimed.

## Findings

- F1 (PMMA p. 2): Ground tests on the same 10 mm PMMA slab as Saffire-II sample 9
- F2 (PMMA p. 1): Thick PMMA, concurrent flow: lowering the pressure on the ground slows flame spread toward the spread in orbit
- F3 (PMMA p. 1): A mixed-convection correlation of the ground data, carried to low pressure, predicts the Saffire-II spread rate
- F4 (PMMA p. 16): To imitate microgravity on the ground, the pressure would have to fall to about 20 to 30 kPa
- F5 (PMMA p. 20): Concluding remark: at lower pressure the flame looks and spreads more like the flame in orbit
- F6 (PMMA p. 2): Why ground tests cannot copy a spacecraft fire: cabin air moves at 100 to 200 mm/s, a flame's own buoyant flow on Earth at 300 to 600 mm/s
- F7 (ICES p. 12): No Saffire-II silicone sample burned in orbit
- F8 (ICES p. 12): The thinnest silicone burned completely at 1 g but did not spread in orbit
- F9 (ICES p. 11): Silicone 0.27 mm, upward at 1 g: almost always completely consumed
- F10 (ICES p. 11): Silicone 0.61 mm, upward at 1 g: average burn length
- F11 (ICES p. 11): Silicone 1.03 mm, upward at 1 g: would not burn
- F12 (ICES p. 11): Silicone 0.37 mm, downward at 1 g: completely consumed; 0.61 mm would not burn
- F13 (ICES p. 26): Silicone is less flammable in microgravity than at 1 g, at the flow speeds tested
- F14 (ICES p. 25): Nomex fabric (sample 2-7) was not ignited by the burning PMMA ahead of it
- F15 (ICES p. 25): Sample 2-7: the PMMA lead-in burned for about two minutes
- F16 (ICES p. 25): Sample 2-7: average flame power of the PMMA, 460 + 50 W as printed (no site variable)
- F17 (ICES p. 26): Nomex could not be ignited in orbit
- F18 (ICES p. 29): Sample 2-7: the PMMA was consumed, the Nomex not ignited
- F19 (ICES p. 29): Thick PMMA (2-8, 2-9): flames stayed anchored at the base; regression 0.01 to 0.04 mm/s (no site variable)
- F20 (ICES p. 29): Thick PMMA (2-8, 2-9): the ~10 cm burn length is the length visibly damaged
- F21 (ICES p. 9): Saffire-II air speed: sample 2-6 at 25 cm/s
- F22 (ICES p. 9): Saffire-II starting oxygen, as read on the ISS
- F23 (ICES p. 9): Saffire-II: all burns upward (concurrent) except 2-4, downward (opposed)
- F24 (ICES p. 8): Average flame power: Saffire-I 1200 +/- 300 W; Saffire-II fabric 200 +/- 50 W; thick PMMA 600 +/- 100 W (no site variable)

## Pairs (same sample at 0 g and 1 g)

None.

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
  - Air speed of sample 2-6: PSI's table gives 20 cm/s; both presentations give 25 cm/s (Table I/1, and ICES p. 9: "20 cm/s flow for all tests except for Sample 2-6 (25 cm/s)"). The objectives paper, written before the flight, planned 30 cm/s for samples 6 and 9. The validator warns on these claims; both values are kept.
  - Thickness of samples 2-4, 2-5 and 2-6: PSI's table writes "037 mm"; both presentations write 0.37 mm.
  - Oxygen of sample 2-1: PSI's table gives "~ 21.5"; both presentations give "~ 22.1", as for samples 2-2 to 2-7. Both are kept; no file says which is right. The validator warns on these two claims.
  - PSI's table leaves `Material` empty for 2-6 and 2-9; the presentations give Cotton-Fiberglass and PMMA. Not claimed as `fuel` because the site's own names for the materials differ from NASA's words; the web side may want to fill them.
  - PSI's experimental table repeats this Table I almost cell for cell (with its notes 1 to 4 = footnotes i to iv), so most claims here are a second (and third) NASA statement of values the site already holds. They are kept by rule 1.

## Validator warnings

- `WARNING  claims.csv line 7 (C6): differs from the value already held (0.2150); both will be shown, so check the source once more`
- `WARNING  claims.csv line 35 (C34): differs from the value already held (20); both will be shown, so check the source once more`
- `WARNING  claims.csv line 93 (C92): differs from the value already held (0.2150); both will be shown, so check the source once more`
- `WARNING  claims.csv line 121 (C120): differs from the value already held (20); both will be shown, so check the source once more`
- `WARNING  claims.csv line 180 (C179): differs from the value already held (101.33); both will be shown, so check the source once more`
- `WARNING  claims.csv line 181 (C180): differs from the value already held (101.33); both will be shown, so check the source once more`
- `WARNING  claims.csv line 182 (C181): differs from the value already held (101.33); both will be shown, so check the source once more`
- `WARNING  claims.csv line 183 (C182): differs from the value already held (101.33); both will be shown, so check the source once more`
- `WARNING  claims.csv line 184 (C183): differs from the value already held (101.33); both will be shown, so check the source once more`
- `WARNING  claims.csv line 185 (C184): differs from the value already held (101.33); both will be shown, so check the source once more`
- `WARNING  claims.csv line 186 (C185): differs from the value already held (101.33); both will be shown, so check the source once more`
- `WARNING  claims.csv line 187 (C186): differs from the value already held (101.33); both will be shown, so check the source once more`
- `WARNING  claims.csv line 188 (C187): differs from the value already held (101.33); both will be shown, so check the source once more`

Warnings on air speed or oxygen are claims that differ from PSI's table: the air speed of sample 2-6 (25 cm/s in both presentations, 20 in PSI's table) and the oxygen of sample 2-1 ("~ 22.1" in both presentations, "~ 21.5" in PSI's table). The reasons are under "What in the data brief the files prove wrong" above. Both values are kept and the loader will list each case as a quality finding.
Warnings on `pressure_kpa` compare the measured pressure with the site's assumed 101.33 kPa (`pressure_quality` = `assumed` in `known_tests.csv`). `validate_pack.py` does not look at that column; the loader in `packs.py` does, and replaces an assumed value with the claim without raising a disagreement.

## Reproduction

- ICES p. 12: "none of the silicone samples burned". Table rows 2-1 to 2-4: burn time "Insignificant", µ-g burn length "~ 0": the same.
- ICES p. 11: 0.61 mm silicone at 1 g burned on average 7.6 cm. Table row 2-2, 1-g burn length 7.6 cm: the same (the slide says "of the available 30 cm"; the table gives the sample as 29 cm).
- ICES p. 11: 1.03 mm silicone "would not burn at all" at 1 g. Table row 2-3, 1-g burn length "~ 0": the same.
- ICES p. 11: 0.37 mm silicone, downward at 1 g, "completely consumed". Table row 2-4, 1-g burn length "Complete": the same.
- ICES p. 9: 25 cm/s for 2-6 only. Table rows: 2-6 at 25 cm/s, the others 20: the same. PSI's own table (20 cm/s for 2-6) does not reproduce it.
- ICES p. 9: starting oxygen 22.1%. Table rows: "~ 22.1" for 2-1 to 2-7, "22.1 to 22.0" for 2-8: the same.
