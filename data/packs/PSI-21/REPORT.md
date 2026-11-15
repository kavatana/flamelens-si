# PSI-21 CLD Flame: evidence pack, version 1 (findings only)

PSI's CLD Flame table already gives each test's conditions, and the per-test CSV files are instrument logs with no result per test (`work/acme_csv_sample.md`). What the site lacked is what NASA concluded. This pack adds 4 results NASA states in words, from a NASA report on NTRS, which the brief allows as a source:

- S1: NTRS 20220005205, Dennis P. Stocker (NASA Glenn Research Center), "Laminar Non-Premixed Flames of Gaseous Fuel Aboard the International Space Station", 2022 Spring Technical Meeting of the Central States Section of the Combustion Institute. `psi_path` is its NTRS address; its page text is kept as `NTRS-20220005205.pdf.pages.json`.

The paper names no test, so no finding is tied to a test, and the pack has no claims and no tests. Each quote is cut word for word from the page text (a script; the build stops if a snippet is not found). Where a finding has a number, it is NASA's, with the bound or conversion stated.

## Findings

- F1, p. 5: Sooty coflow flames: several times more soot in microgravity than in normal gravity.
- F2, p. 5: Sooty coflow flames are taller and wider in microgravity.
- F3, p. 5: Methane and ethylene flames burn at higher dilution in microgravity, and are more stable.
- F4, p. 8: Scope: over 1,500 flames were lit for the six ACME experiments, November 2017 to February 2022.

## Leads, not used

- NTRS 20210021781, "Recent Research on Flames of Gaseous Fuel Aboard the International Space Station" (JASMAC 2021), an earlier overview of the same work.
- The investigators' journal papers listed in the overview's references; not copied (the data brief: journal papers are leads only).

## Validator warnings

None.

<!-- guide_findings:start -->
## NASA's Researcher's Guide (version 2)

Source G1: A Researcher's Guide to: Combustion Science (NASA ISS Program Science Office, 2015). The NASA Space Apps challenge page lists it under "NASA Data & Resources". PSI holds the same
file in the folders of PSI-20, PSI-21, PSI-22 and PSI-23; G1 points to the PSI-20 copy (1,532,064 bytes, sha256
`d85c92823f8917979df00e09e8e0ca40f42092a330ef30dcb8a8af34e7ee6bc0`). It has no test tables. a script cuts each sentence below word for word from the PDF's text
(PyMuPDF), from given first and last words, and stops if they are not found once on the stated page.

| Finding | Page | What it says |
|---|---|---|
| F5 | p. 16 | Earlier research showed models predict poorly for very sooty flames and flames near extinction |

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
