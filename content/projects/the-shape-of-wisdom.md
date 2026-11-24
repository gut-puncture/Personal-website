---
title: "The Shape of Wisdom: how models converge on an answer"
slug: "the-shape-of-wisdom"
group: "research"
order: 2
year: "2026"
kind: "Paper"
summary: "When a language model answers a factual question, the answer shows up inside the model at one specific layer, between 47% and 71% of the way through. Late in the model, moving its internal state to where the right answer sits fixed 83% to 97% of wrong answers."
status: "Paper on arXiv. Code, dataset and results are public."
links:
  - { label: "Paper", href: "https://arxiv.org/abs/2606.01202" }
  - { label: "Code", href: "https://github.com/gut-puncture/The-Shape-of-Wisdom" }
stats:
  - { value: "47%–71%", label: "how far through the model the answer appears, depending on the model. It appears within a single layer." }
  - { value: "83%–97%", label: "of wrong answers fixed by moving the model's internal state to where the right answer sits. A random move of the same size fixed 2%–4%." }
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
cover: { src: "/media/the-shape-of-wisdom/states-by-layer.png", alt: "Questions about twelve countries inside a language model: a tangled cloud in early layers that separates by country from layer 15" }
---

When an AI language model answers a factual question, its internal state moves to a specific region. This region is shared by every question that gets the same answer. I call the centre of this region the answer centroid. I tested four open models. In all of them, the answer becomes readable from the internal state within a single layer. This happens between 47% and 71% of the way through the network. After this layer, I tried changing the state of questions the model got wrong. I moved the state to the centroid of the correct answer. This change made the model give the right answer in 83% to 97% of cases. A random move of the same size only fixed 2% to 4% of wrong answers.

![Questions about twelve countries at six layers of Llama-3.1-8B: one tangled cloud at layers 1 and 14, separating by country from layer 15](/media/the-shape-of-wisdom/states-by-layer.png)
*Each dot is one test question, coloured by the country Llama-3.1-8B gave as the answer. The answers separate by layer 15.*

## Method

I created 2,256 factual questions using data from Wikidata. These questions share 62 recurring answers. The answers include 24 countries, 16 cities, 12 languages, and 10 sports. I wrote each fact in up to three different ways.

I tested these questions on four models: Llama-3.1-8B, Qwen2.5-7B, Gemma-2-9B, and Llama-3.2-1B. I recorded the internal state at the end of the prompt after every layer. An answer's centroid is the average state of all the questions where the model gave that specific answer. I built the centroids using questions about half of the subjects. I then measured every number using questions about the other half.

## What I found

- The answer arrives in one layer. I measured readability as the percentage of test questions sitting closest to their answer's centroid. In Llama-3.1-8B, readability jumps from 32% at layer 14 to 71% at layer 15. It eventually peaks at 94%. Shuffled answers only reach 6% to 8%. The spelling of the question alone accounts for 11% to 18%.
- The centroids track the model's actual answer. I built centroids in Llama-3.1-8B using one type of question, like citizenship. These centroids correctly identify the answer for other question types, like towns or films, in 91% of cases. Centroids built from all question types work in 94% of cases. Centroids built from simple questions also read reworded questions in 94% of cases. If I remove the directions the model uses to write the answer's name, the readability stays at 94%.
- The model actively uses these centroids. Before the jump layer, moving a state toward the correct centroid only fixes 0% to 1% of wrong answers. At 90% of the network's depth, the move fixes 97% of wrong answers in Llama-3.1-8B. It fixes 94% in Qwen2.5-7B, 97% in Gemma-2-9B, and 83% in Llama-3.2-1B. Random moves of the same length change the model's reply 14% to 34% of the time. However, they only result in the correct answer 2% to 4% of the time.
- Near misses show up early. A near miss is when the model gives the wrong text but picks the right option in a multiple-choice format. At the jump layer, the correct answer's centroid is already one of the nearest points. The rank of this centroid separates near misses from true mistakes. The chance that a random near miss scores better than a random mistake is 0.75 to 0.82. For comparison, the rank in the model's final output scores 0.77 to 0.82, and the model's basic confidence score only reaches 0.49 to 0.66.

## Limits

The test questions are short and factual. They only cover 62 possible answers. Sports are the one kind of answer that is not a name, and they jump much less. The models I tested have between 1 and 9 billion parameters, and I only used one prompt format. My readability score measures where the states sit, not the actual maths that moves them there. The internal moves I made happen late in the network and are quite large. This means they might just be writing the answer directly into the output. My tests cannot prove if a centroid is anything more than the model's plan to output a specific word.
