# PSI-23 s-Flame: evidence pack, version 1 (findings only)

PSI's s-Flame table already gives each test's conditions, and the per-test CSV files are instrument logs with no result per test (`work/acme_csv_sample.md`). What the site lacked is what NASA concluded. This pack adds 4 results NASA states in words, from a NASA report on NTRS, which the brief allows as a source:

- S1: NTRS 20220005205, Dennis P. Stocker (NASA Glenn Research Center), "Laminar Non-Premixed Flames of Gaseous Fuel Aboard the International Space Station", 2022 Spring Technical Meeting of the Central States Section of the Combustion Institute. `psi_path` is its NTRS address; its page text is kept as `NTRS-20220005205.pdf.pages.json`.

The paper names no test, so no finding is tied to a test, and the pack has no claims and no tests. Each quote is cut word for word from the page text (a script; the build stops if a snippet is not found). Where a finding has a number, it is NASA's, with the bound or conversion stated.

## Findings

- F1, p. 8: Spherical flames: both radiative and kinetic extinction appear to have been seen.
- F2, p. 8: Radiative extinction at high fuel flow, kinetic extinction at low flow.
- F3, p. 8: With helium instead of nitrogen as diluent the extinction limits shift.
- F4, p. 8: Scope: over 1,500 flames were lit for the six ACME experiments, November 2017 to February 2022.

## Leads, not used

- NTRS 20210021781, "Recent Research on Flames of Gaseous Fuel Aboard the International Space Station" (JASMAC 2021), an earlier overview of the same work.
- The investigators' journal papers listed in the overview's references; not copied (the data brief: journal papers are leads only).

## Validator warnings

None.
