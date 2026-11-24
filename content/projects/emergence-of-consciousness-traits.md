---
title: "Emergence of Consciousness Traits in a SLM"
slug: "emergence-of-consciousness-traits"
group: "research"
order: 1
year: "2026"
kind: "Paper"
summary: "I trained a small AI model on text with everything that could teach it about consciousness removed. It then learned only to predict a simulated world. Narrow forms of four traits of consciousness still appeared, in all five training runs."
status: "The paper, code, training text and all trained models are public."
links:
  - { label: "Paper", href: "https://github.com/gut-puncture/Emergence-of-Consciousness-Traits/blob/main/PAPER.pdf" }
  - { label: "Code", href: "https://github.com/gut-puncture/Emergence-of-Consciousness-Traits" }
  - { label: "Models", href: "https://huggingface.co/AngryYoungBhaloo/ect-savanna-runs" }
  - { label: "Data", href: "https://huggingface.co/datasets/AngryYoungBhaloo/ect-pretraining-corpus" }
stats:
  - { value: "5 of 5", label: "training runs in which narrow forms of all four traits appeared" }
  - { value: "75%", label: "of tests passed on using a fact from earlier, against 9% for a comparison that ignores the fact" }
  - { value: "94%", label: "of tests passed on predicting what its own actions change, against 1% for a comparison that ignores the actions" }
aliases: ["emergence of consciousness traits", "consciousness traits paper", "trained without consciousness", "the savanna paper", "consciousness in a small language model", "conscious this traits", "emergence of conscious traits"]
agent: >
  This is Shailesh's 2026 paper, Emergence of Consciousness Traits in a Small
  Language Model. He trained a language model of about one
  hundred million parameters on web text filtered to remove anything
  that could teach it to imitate consciousness, such as fiction and writing about
  selves and feelings. He then trained it to forecast and act in a simulated savanna, rewarded only for accurate forecasts. Nothing described or
  rewarded any trait. In all five training runs, narrow forms of four traits appeared. On access, using a fact from earlier, it passed 75 percent of tests
  against 9 percent for a forecaster that ignores that fact. On self-modelling,
  forecasting what its own actions change, it passed 94 percent against 1 percent.
  For metacognition it was less sure where the herd was when the herd could have
  moved, and it learned to listen more when listening helped, though also somewhat
  more when it did not. Integration, combining separate facts, was weakest at 36 percent
  against 11 percent. The traits were tested only as abilities, with no claim about
  experience, in one small model and one simulated world. The paper, code, training
  text and every model are public on GitHub and Hugging Face.
cover: { src: "/media/emergence-of-consciousness-traits/overview.png", alt: "How the experiment worked: web text is filtered, a small model is trained on what remains, it then trains in a simulated savanna, and is tested for four traits" }
evidence:
  title: "What the model could do after training"
  intro: "Each test asks the model to predict what happens next in the simulated world. The red bar is the model. The grey bar is a comparison that cannot use the ability being tested."
  rows:
    - { name: "Access", meaning: "Using a fact it saw earlier in the day", model: "75%", modelPct: 75, baseline: "9%", baselinePct: 9, modelCaption: "of tests passed", baselineCaption: "for a comparison that ignores the fact" }
    - { name: "Self-modelling", meaning: "Predicting what its own actions will change", model: "94%", modelPct: 94, baseline: "1%", baselinePct: 1, modelCaption: "of tests passed", baselineCaption: "for a comparison that ignores the actions" }
    - { name: "Integration", meaning: "Combining two facts given hours apart", model: "36%", modelPct: 36, baseline: "11%", baselinePct: 11, modelCaption: "of tests passed", baselineCaption: "for a comparison that ignores one of the facts" }
    - { name: "Metacognition", meaning: "Being less sure when things may have changed out of sight", model: "0.57", modelPct: 57, baseline: "0.03", baselinePct: 3, modelCaption: "uncertainty about where the herd is, when the herd could have moved", baselineCaption: "uncertainty when the herd could not have moved" }
  footnote: "Averages over five training runs. These are tests of ability only. The paper makes no claim about experience."
---

I trained a small language model (SLM) of about 100 million parameters from scratch on web text with anything that could teach it to imitate consciousness removed. I then trained it to forecast and act in a simulated savanna, rewarded only for accurate forecasts. Nothing described or rewarded any trait.

Across five training runs, narrow forms of four traits appeared every time: access, self-modelling, metacognition and integration. On access, the model passed 75% of tests, against 9% for a forecaster that ignores the fact being tested. Integration was the weakest. I tested each trait only as an ability and claim nothing about subjective experience.

## Why the training text was filtered

Large models learn from human writing full of talk about knowing and being a self, so their traits may be copied. From 108 million passages of educational web pages, a filter removed writing about awareness, selves, beliefs, emotions and psychology, and whole forms such as fiction, dialogue, news and biography, since a story can show checking without naming it.

A large language model labelled samples, and two small classifiers trained on its labels sorted every passage. 4.1 million passages survived, about 2.6 billion tokens of mostly dry technical writing. Before the savanna, the model did no better on the tests than a forecaster that ignores the tested facts.

## The savanna

The model reads a plain-English logbook of one grazing animal's day, hour by hour, and answers questions about the next hour or two. The animal sees only where it stands. It hears where the herd is only by spending an hour listening, and sees a lion in the reeds only by looking. The logbook uses 41 words, none of them "I" or a word for knowing or feeling.

In three stages, a scripted program acted while the model forecast (prediction); then the model acted (acting); then an action became more likely only if it led to better forecasts than an alternative action played under identical chance events (reward).

![Pipeline: 108 million web passages are filtered, a 100-million-parameter model is pre-trained on what remains, trained in three stages on a savanna logbook, then tested for four traits](/media/emergence-of-consciousness-traits/overview.png)

## Results

Scores are five-run averages; most tests edit one earlier fact on an unseen day, and the model passes only if right on every version.

- Access (using a fact from earlier): 75%, against 9% for the comparison forecaster and 5% before the savanna.
- Self-modelling (forecasting what its own actions change): 94% on an action's effect, against 1%, and 82% on whether an action will work, against 6%.
- Metacognition (being less sure when things may have changed unseen, and choosing when to check): uncertainty about the herd was 0.57 after two sunny hours, when it may have moved, and 0.03 after two cloudy hours, near the ideal 0.57 and 0.00. After the reward stage it listened in 32% and 48% of cases where listening could help, against 16% and 19% where it could not. It looked for the lion on at most 1.5% of occasions when its presence was uncertain.
- Integration (combining two facts stated hours apart): 36%, against 11% (runs ranged from 18% to 46%), tested through one rule.

![Bar chart of test pass rates for each trait, model against a forecaster that ignores the tested fact, and the model's uncertainty about the herd after sunny and cloudy hours](/media/emergence-of-consciousness-traits/prediction-stage-results.png)

*Results after the prediction stage, before any reward. Circles show each of the five runs.*

Most of this came from forecasting alone; choosing when to check came only with the reward stage, and only in part. The paper's main contribution is an account of what a world must contain for each trait to help prediction.

## Limits

- One small model in one simplified world.
- The tests read forecasts and choices, never the network's internal activity.
- No filter is airtight, and without a comparison model trained on unfiltered text I cannot measure the filter's effect.
- Two outcomes missed success criteria set in advance: one self-modelling score in run 5 dropped 5.28 points against a 5-point limit, and in four runs listening rose where it tells the animal nothing.
- The account of what a world must contain is reasoning, not yet tested directly.
