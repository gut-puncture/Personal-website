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
stats: []
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
---

I trained a small AI language model from scratch. It has about 100 million parameters. I trained it on web text, but I removed anything that could teach it to imitate consciousness. I then trained it to act and predict events in a simulated savanna. I rewarded it only when its forecasts were accurate. I did not describe or reward any specific traits.

Narrow forms of four traits appeared in all five of my training runs. These traits were access, self-modelling, metacognition, and integration. For access, the model passed 75% of the tests. A forecaster that ignores the tested fact passed only 9%. Integration was the weakest trait. I tested each trait only as an ability. I do not claim the model has any subjective experience.

## Why the training text was filtered

Large models learn from human writing that discusses knowing and being a self. This means their traits might just be copied from the text. I used a filter on 108 million passages of educational web pages. The filter removed writing about awareness, selves, beliefs, emotions, and psychology. It also removed formats like fiction, dialogue, news, and biography. I did this because a story can demonstrate checking behaviour without explicitly naming it.

A large language model labelled sample passages. I trained two small classifiers on these labels to sort every passage. This left 4.1 million passages, which is about 2.6 billion tokens of mostly dry technical writing. Before training in the simulated savanna, my model performed no better on tests than a forecaster that ignores the facts.

## The savanna

The model reads a plain-English logbook tracking one grazing animal hour by hour. It then answers questions about the next one or two hours. The animal only sees the space where it stands. It can only hear the herd if it spends an hour listening. It can only see a lion in the reeds if it looks. The logbook uses only 41 words. It never uses "I" or any words related to knowing or feeling.

The training had three stages. First, a scripted program acted while the model made predictions. Second, the model acted itself. Finally, an action became more likely only if it led to better forecasts than an alternative action under identical chance events.

![Pipeline: 108 million web passages are filtered, a 100-million-parameter model is pre-trained on what remains, trained in three stages on a savanna logbook, then tested for four traits](/media/emergence-of-consciousness-traits/overview.png)
*The training pipeline: filtering text, pre-training the model, training in the savanna, and testing for four traits.*

## Results

These scores are averages across the five runs. Most tests change one earlier fact on an unseen day. The model passes only if it gets every version right.

- Access means using a fact from earlier. The model scored 75%. The comparison forecaster scored 9%, and the model scored 5% before the savanna training.
- Self-modelling means forecasting what the model's own actions will change. The model scored 94% on predicting an action's effect, compared to 1% for the baseline. It scored 82% on predicting if an action will work, compared to 6%.
- Metacognition means being less sure when things might have changed unseen, and choosing when to check. The model's uncertainty about the herd was 0.57 after two sunny hours when the herd might have moved. Its uncertainty was 0.03 after two cloudy hours. The ideal scores are 0.57 and 0.00. After the final reward stage, the model listened in 32% and 48% of the cases where listening helped. It listened in only 16% and 19% of cases where it did not help. It looked for the lion at most 1.5% of the time when it was uncertain if the lion was there.
- Integration means combining two facts stated hours apart. The model scored 36%, compared to 11% for the baseline. The individual runs ranged from 18% to 46%. I tested this using a single rule.

![Bar chart of test pass rates for each trait, model against a forecaster that ignores the tested fact, and the model's uncertainty about the herd after sunny and cloudy hours](/media/emergence-of-consciousness-traits/prediction-stage-results.png)
*Results after the prediction stage but before the reward stage. The circles show each of the five runs.*

Most of these abilities appeared from forecasting alone. The ability to choose when to check only appeared during the reward stage, and even then, only partially. The main contribution of this paper is explaining what a world must contain for each trait to help prediction.

## Limits

- I used one small model in one simplified world.
- I tested the model by reading its forecasts and choices, never its internal network activity.
- No text filter is perfect. Because I do not have a comparison model trained on unfiltered text, I cannot measure the filter's true effect.
- Two outcomes did not meet the success criteria I set in advance. In run 5, one self-modelling score dropped 5.28 points, which missed the 5-point limit. In four runs, the model started listening more even when listening told it nothing.
- My explanation of what a world must contain is based on reasoning. I have not tested it directly yet.
