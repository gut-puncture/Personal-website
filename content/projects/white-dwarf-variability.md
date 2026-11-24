---
title: "Two White Dwarfs with Repeating Brightness"
slug: "white-dwarf-variability"
group: "research"
order: 6
year: "2026"
kind: "Finding"
summary: "I found that the brightness of a known white dwarf star rises and falls in a cycle of 117.4 minutes, and that a second white dwarf may have a cycle of 3.431 days. I could not find an earlier report of either cycle, and no astronomer has reviewed the finding yet."
status: "Public record that anyone can rerun. Not yet reviewed by an astronomer."
links:
  - { label: "Code", href: "https://github.com/gut-puncture/white-dwarf-variability" }
stats:
  - { value: "117.4 min", label: "brightness cycle in the first star. It shows up in three separate sets of observations." }
  - { value: "3.431 days", label: "possible cycle in the second star. It still needs to be confirmed with another telescope." }
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
cover: { src: "/media/white-dwarf-variability/overview.png", alt: "Brightness of the two stars plotted against position in the cycle; earlier and later nights follow the same curve" }
---

I found that the brightness of the white dwarf SDSS J112148.80+103934.2 rises and falls in a cycle of 117.4 minutes. A white dwarf is the dense, Earth-sized remnant that is left when a star like the Sun runs out of fuel. The cycle appears in three separate sets of observations. The first is ground-based measurements from the Zwicky Transient Facility (ZTF), which is a sky-survey camera at Palomar Observatory. The second is five observing sectors of TESS, NASA's Transiting Exoplanet Survey Satellite. The third is changes in the star's spectrum recorded by the Sloan Digital Sky Survey (SDSS).

I also found a possible cycle of 3.431 days in a second white dwarf, WDJ215009.13+471257.26. Measurements in the survey images place the signal at this star and not at a neighbouring one, but the cycle still needs to be confirmed with another telescope.

## What is new and what is not

- Both stars were already known, and what appears to be new is the measured cycles.
- A search of catalogues and published papers, completed on 3 October 2026, found no earlier report of either period. This does not prove that nobody reported them first.
- The first star was already known to be magnetic. The ATLAS survey had flagged it as a "dubious" variable and suggested periods that do not include 117.4 minutes, and that earlier flag deserves credit.
- Neither result has been reviewed by an astronomer. This page is a public research record and not a peer-reviewed paper.
- I have not established what causes the cycles. Rotation, a companion star and other explanations all remain open.

![Three panels of brightness against position in the cycle, for the 117.4-minute star in green and red light and for the 3.431-day candidate in green light. Measurements from earlier and later nights follow the same curve.](/media/white-dwarf-variability/overview.png)
*Each dot is the average of the measurements at the same point in the cycle. The curve was fitted to the earlier nights only, and the later nights were not used to draw it.*

## Method

1. I screened 400 nearby, faint, blue stars taken from SDSS and from Gaia, a satellite that measures the positions and distances of stars.
2. For each star I searched the earlier 75% of the ZTF observing nights for repeating cycles and saved the 20 strongest candidates.
3. I then tested those candidates on the later 25% of the nights without choosing any new periods, so a cycle found in the early nights had to predict the later ones.
4. For the 117.4-minute star I also checked the TESS observations and 96 SDSS spectra taken over 24 nights. A feature of the spectrum that was chosen from the first 16 nights predicted the final eight.
5. For the second star I fitted the star and its neighbours together in 359 ZTF images, to check which of them is the one that varies.

## Limits

The image measurements for the second star reuse the same ZTF light, so they show which source varies but they do not confirm the cycle independently. The significance tests rest on assumptions about the noise that are not perfect. The follow-up with spectra also began after some of the spectra had been inspected, so it was not fully blind.

## What exists

The analysis and the code were produced with OpenAI Codex under my direction. The [repository](https://github.com/gut-puncture/white-dwarf-variability) holds the full record. One command downloads 123 MB of original observations, checks every file and recalculates the results from scratch, which takes about two minutes on my machine after the download. Rerunning it checks the calculation, and it does not replace a review by an astronomer.
