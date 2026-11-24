---
title: "Two White Dwarfs with Repeating Brightness"
slug: "white-dwarf-variability"
group: "research"
order: 6
year: "2026"
kind: "Finding"
summary: "I measured a 117.4-minute brightness cycle in a known white dwarf, seen in three separate sets of observations, and a 3.431-day candidate cycle in a second. I found no earlier report of either period; neither has had expert review."
status: "Public research record that anyone can rerun; not yet reviewed by an astronomer."
links:
  - { label: "Code", href: "https://github.com/gut-puncture/white-dwarf-variability" }
stats:
  - { value: "117.4 min", label: "brightness cycle in SDSS J112148.80+103934.2, found in early nights and confirmed in later ones" }
  - { value: "5", label: "separate TESS observing sectors in which the same 117.4-minute cycle appears" }
  - { value: "3.431 days", label: "candidate cycle in WDJ215009.13+471257.26, still to be confirmed with another telescope" }
aliases: ["white dwarf variability", "white dwarf project", "the white dwarf finding", "two white dwarfs", "repeating brightness", "117 minute star", "the astronomy project", "white dwarf variable tea"]
agent: >
  This is an astronomy finding Shailesh made in 2026, as a non-astronomer. A white
  dwarf is the dense, Earth-sized remnant left when a star like the Sun runs out of
  fuel. He measured a brightness cycle of 117.4 minutes in the white dwarf SDSS
  J112148.80+103934.2. It appears in ground-based measurements from the Zwicky
  Transient Facility, in five observing sectors of NASA's TESS space telescope, and in
  changes in the star's spectrum from the Sloan Digital Sky Survey. He also found a
  candidate cycle of 3.431 days in a second white dwarf, WDJ215009.13+471257.26,
  which still needs confirmation with another telescope. Both stars were already
  known; what appears new is the measured cycles. A catalogue and literature search
  found no earlier report of either period, which is not proof that nobody found
  them first. The first star had earlier been flagged as a doubtful variable by the
  ATLAS survey. No astronomer has reviewed the results yet, and the cause of the
  cycles is not known. The analysis and code were produced with OpenAI Codex under
  his direction. The code is public, and one command downloads the original
  observations and recalculates every result.
---

I found a 117.4-minute brightness cycle in the white dwarf SDSS J112148.80+103934.2. A white dwarf is the dense, Earth-sized remnant left when a star like the Sun runs out of fuel. The cycle appears in three separate sets of observations: ground-based measurements from ZTF (the Zwicky Transient Facility, a sky-survey camera at Palomar Observatory), five observing sectors of TESS (NASA's Transiting Exoplanet Survey Satellite), and changes in the star's spectrum from SDSS (the Sloan Digital Sky Survey).

I also found a 3.431-day candidate cycle in a second white dwarf, WDJ215009.13+471257.26. Measurements in the survey images place the signal at this star rather than at a neighbour, but it still needs confirmation with another telescope.

## What is new and what is not

- Both stars were already known. What appears new is the measured cycles.
- A catalogue and literature search, completed on 3 October 2026, found no earlier report of either period. That is not proof that nobody reported them first.
- The first star was already known to be magnetic. The ATLAS survey had flagged it as a "dubious" variable, with suggested periods that do not include 117.4 minutes. That earlier flag deserves credit.
- Neither result has had independent review by an astronomer. This is a public research record, not a peer-reviewed paper.
- I have not established what causes the cycles. Rotation, a companion star and other explanations all remain open.

![Three panels of brightness against position in the cycle, for the 117.4-minute star in green and red light and for the 3.431-day candidate in green light. Measurements from earlier and later nights follow the same curve.](/media/white-dwarf-variability/overview.png)
*Each dot averages measurements at the same point in the cycle. The curve was fitted to earlier nights only; later nights were not used to draw it.*

## Method

1. I screened 400 nearby, faint, blue stars from SDSS and Gaia (the European Space Agency satellite that measures star positions and distances).
2. For each star I searched the earlier 75% of ZTF observing nights for repeating cycles and saved the 20 strongest candidates.
3. I tested those candidates on the later 25% of nights without choosing new periods. A cycle found in the early nights had to predict the later ones.
4. For the 117.4-minute star I checked TESS observations and 96 SDSS spectra taken over 24 nights. A spectral feature chosen from the first 16 nights predicted the final eight.
5. For the second star I fitted it and its neighbours together in 359 ZTF images, to check which source varies.

## Limits

The second star's image measurements reuse the same ZTF light, so they show which source varies but do not independently confirm the cycle. The significance tests rest on noise assumptions that are imperfect, and the spectral follow-up began after some spectra had been inspected, so it was not fully blind.

## What exists

The analysis and code were produced with OpenAI Codex under my direction. The [repository](https://github.com/gut-puncture/white-dwarf-variability) holds the full record. One command downloads 123 MB of original observations, checks every file and recalculates the results from scratch, in about two minutes on my machine after the download. Rerunning it checks the calculation; it does not replace review by an astronomer.
