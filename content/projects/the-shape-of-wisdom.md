---
title: "The Shape of Wisdom: how models converge on an answer"
slug: "the-shape-of-wisdom"
group: "research"
order: 2
year: "2026"
kind: "Paper"
summary: "In four open language models, the answer to a factual question becomes readable from the internal state within one layer, 47% to 71% of the way through. Late in the network, moving a wrong answer's state to the right answer's centre fixes 83% to 97% of them."
status: "Paper on arXiv (version 2); code, dataset and results public."
links:
  - { label: "Paper", href: "https://arxiv.org/abs/2606.01202" }
  - { label: "Code", href: "https://github.com/gut-puncture/The-Shape-of-Wisdom" }
stats:
  - { value: "47%–71%", label: "of the way through the network, the single layer where the answer becomes readable" }
  - { value: "83%–97%", label: "of wrong answers corrected by moving the state to the right answer's centroid, against 2%–4% for a random move" }
  - { value: "0.75–0.82", label: "AUC for spotting near misses from the state, against 0.49–0.66 for the model's own confidence" }
aliases: ["Shape of Wisdom", "the shape of wisdom paper", "answer centroids", "how language models converge on an answer", "shape of wisdom", "shape of wise dom"]
agent: >
  The Shape of Wisdom, How Language Models Converge on an Answer, is a 2026 paper by
  Shailesh Rana on arXiv. He asked four open models, Llama 3.1
  8B, Qwen 2.5 7B, Gemma 2 9B and Llama 3.2 1B, 2,256 factual questions from Wikidata
  whose answers recur, and recorded the
  model's internal state at every layer. Questions that get the same answer gather around
  a shared point, which he calls the answer centroid. The answer becomes readable within
  a single layer, between 47 and 71 percent of the way through the network, depending on
  the model. A country's centroid learned from questions about people also identifies
  that country in questions about towns and films. Late in the network, moving a wrongly
  answered question's state to the right answer's centroid makes the model give the right
  answer in 83 to 97 percent of cases, against 2 to 4 percent for a random move of the
  same size. Near misses can be spotted from the state at that layer, better than from
  the model's confidence. Limits: short
  factual questions with 62 fixed answers, and models of 1 to 9 billion parameters. The
  paper, code, dataset and results are public.
---

When a language model answers a factual question, its internal state moves into a region shared by every question that gets the same answer, summarised by its centre, the answer centroid. In four open models the answer becomes readable from the state within a single layer, between 47% and 71% of the way through the network. After that layer, moving a wrongly answered question's state to the right answer's centroid makes the model give the right answer in 83% to 97% of cases late in the network, against 2% to 4% for a random move of the same size.

![Questions about twelve countries at six layers of Llama-3.1-8B: one tangled cloud at layers 1 and 14, separating by country from layer 15](/media/the-shape-of-wisdom/states-by-layer.png)
*Each dot is one test question, coloured by the country Llama-3.1-8B answered. Readability jumps at layer 15.*

## Method

I built 2,256 factual questions from Wikidata with 62 recurring answers: 24 countries, 16 cities, 12 languages and 10 sports. Each fact is asked in up to three wordings.

I asked them of Llama-3.1-8B, Qwen2.5-7B, Gemma-2-9B and Llama-3.2-1B and recorded the state at the last position of the prompt after every layer. An answer's centroid is the average state of all questions the model gave that answer to, right or wrong. Centroids come from questions about half the subjects; every number is measured on the other half.

## What I found

- The answer arrives in one layer. Readability, the share of test questions whose state lies nearest the centroid of the answer the model gave, rises in Llama-3.1-8B from 32% at layer 14 to 71% at layer 15, and peaks at 94%. Shuffled answers reach only 6% to 8%, and the question's spelling alone 11% to 18%.
- Centroids follow the answer the model gives. In Llama-3.1-8B, centroids built from one type of question, such as citizenship, identify the answer in other types with the same kind of answer, such as towns and films, in 91% of cases, against 94% with centroids built from all types. Centroids built from plain questions read reworded ones in 94%. Removing the directions the model uses to write the answer's name leaves it at 94%.
- The model uses the centroids. Before the jump, moving a state toward the right centroid corrects 0% to 1% of wrong answers. At 90% of the depth it corrects 97% in Llama-3.1-8B, 94% in Qwen2.5-7B, 97% in Gemma-2-9B and 83% in Llama-3.2-1B. Random moves of the same length change the reply in 14% to 34% of cases but give the right answer in only 2% to 4%.
- Near misses show early. In a near miss the model answers wrongly but picks the right option in multiple choice. At the jump layer, the right answer's centroid is already among the nearest, and its rank separates near misses from real gaps with an AUC (the chance that a random near miss scores better than a random gap; 0.5 is chance) of 0.75 to 0.82. The rank in the model's final output scores 0.77 to 0.82, and the model's confidence 0.49 to 0.66.

## Limits

The questions are short and factual, with 62 possible answers. Sports, the one kind that is not a name, jump much less. The models have 1 to 9 billion parameters, each with one prompt format. Readability measures where states sit, not the computation that moves them. Late moves are large and close to the output, so they could write the answer in directly. The tests cannot tell whether a centroid is more than the model's plan to say a word.
