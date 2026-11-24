---
title: "Emergence of Consciousness Traits in a SLM"
slug: "emergence-of-consciousness-traits"
group: "research"
order: 1
year: "2026"
kind: "Paper"
summary: "I trained a small 100 Million parameter AI model on text where everything that could teach it about consciousness was removed. It was then trained to only predict changes in a simulated world. Narrow forms of four traits of consciousness then appeared in the model."
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

I trained a small AI language model with about 100 million parameters from scratch. The text it learned from was web text from which I had removed everything that could teach it to imitate consciousness. After that, I trained the model to predict what happens in a simulated savanna and to choose actions there, and I rewarded it only when its predictions were accurate. Nothing in this training described a trait of consciousness or rewarded one.

Even so, narrow forms of four traits appeared in all five training runs. The four traits are access, self-modelling, metacognition and integration, and each of them is explained in the results below. I tested every trait only as an ability, so I am not claiming that the model has any subjective experience.

## Why the training text was filtered

Large AI models learn from human writing, and human writing is full of talk about knowing things and being a self. When such a model shows a trait of consciousness, it may only be copying what it has read. To rule this out, I started with 108 million passages from educational web pages and filtered them. The filter removed writing about awareness, selves, beliefs, emotions and psychology. It also removed whole kinds of writing such as fiction, dialogue, news and biography, because a story can show a character checking something even when it never names what the character is doing.

The filtering was done in two steps. First, a large language model labelled a sample of the passages. Then two small classifiers were trained on those labels and used to sort every passage. This left 4.1 million passages, which is about 2.6 billion tokens of mostly dry technical writing. When the model had been trained only on this text, it did no better on my tests than a forecaster that ignores the facts being tested.

## The savanna

The simulated world is a savanna with one grazing animal in it. The model reads a logbook in plain English that records, hour by hour, what the animal sees and does, and it then answers questions about what will happen in the next hour or two. The animal can see only the place where it is standing. To learn where its herd is it has to spend an hour listening, and to find out whether a lion is hiding in the reeds it has to look. The logbook uses only 41 different words, and none of them is "I" or a word for knowing or feeling.

The training in the savanna had three stages. In the first stage a scripted program chose the animal's actions and the model only made predictions. In the second stage the model chose the actions itself. In the third stage an action was made more likely only if it led to better predictions than another action tried under exactly the same chance events.

![Pipeline: 108 million web passages are filtered, a 100-million-parameter model is pre-trained on what remains, trained in three stages on a savanna logbook, then tested for four traits](/media/emergence-of-consciousness-traits/overview.png)
*The whole experiment: filtering the text, training the model on it, training in the savanna and testing for the four traits.*

## Results

The scores below are averages over the five training runs. In most tests I take a day that the model has never seen and change one earlier fact in it, and the model passes only if it answers correctly for every version of that day. Each score is compared with a forecaster that ignores the fact being tested.

- Access means using a fact that was given earlier. The model passed 75% of these tests, while the comparison forecaster passed 9%. Before the savanna training the model passed 5%.
- Self-modelling means predicting what the model's own actions will change. The model passed 94% of the tests on the effect of an action, against 1% for the comparison. It passed 82% of the tests on whether an action will work, against 6%.
- Metacognition means being less sure when something may have changed out of sight, and choosing when to check. The model's uncertainty about where the herd was came to 0.57 after two sunny hours, when the herd may have moved, and to 0.03 after two cloudy hours. An ideal forecaster would give 0.57 and 0.00. After the reward stage the model listened in 32% and 48% of the cases where listening could help, and in 16% and 19% of the cases where it could not. It looked for the lion on at most 1.5% of the occasions when it could not know whether the lion was there.
- Integration means combining two facts that were given hours apart. The model passed 36% of these tests, against 11% for the comparison, and the five runs ranged from 18% to 46%. This trait was tested through a single rule, and it was the weakest of the four.

![Bar chart of test pass rates for each trait, model against a forecaster that ignores the tested fact, and the model's uncertainty about the herd after sunny and cloudy hours](/media/emergence-of-consciousness-traits/prediction-stage-results.png)
*Results after the prediction stage and before the reward stage. Each circle is one of the five runs.*

Most of these abilities came from learning to predict alone. Choosing when to check appeared only in the reward stage, and only partly. The main contribution of the paper is an account of what a world must contain for each trait to help with prediction.

## Limits

- The experiment used one small model in one simplified world.
- The tests read the model's predictions and choices. They never look at the activity inside the network.
- No filter is perfect, and I do not have a second model trained on unfiltered text to compare with, so I cannot measure how much the filter mattered.
- Two outcomes missed the success criteria that I had set in advance. In run 5 one self-modelling score dropped by 5.28 points when the limit was 5 points, and in four runs the model also listened more in situations where listening tells the animal nothing.
- The account of what a world must contain is reasoning, and I have not tested it directly yet.
