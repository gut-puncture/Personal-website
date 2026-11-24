---
title: "The Shape of Wisdom: how models converge on an answer"
slug: "the-shape-of-wisdom"
group: "research"
order: 2
year: "2026"
kind: "Paper"
summary: "When a language model answers a factual question, its internal state converges to one localised point in the model's embedding space, and every question with the same answer converges to the same point. I showed this in four open models, and I showed that the models rely on these points to give their answers."
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

When a language model answers a factual question, its internal state converges to one localised point in the model's embedding space. Every question that gets the same answer converges to the same point, whatever the question was about. I describe each of these points by its centre, which I call the answer centroid, and this project measures where in the model the convergence happens and whether the model actually uses it.

I tested this on four open models. In each of them the convergence happens within a single layer, which lies between 47% and 71% of the way through the network depending on the model. After that layer the model also depends on the centroid. When I took a question that the model had answered wrongly and moved its state to the centroid of the right answer, the model gave the right answer in 83% to 97% of cases late in the network. A random move of the same size did so in only 2% to 4% of cases.

![Questions about twelve countries at six layers of Llama-3.1-8B: one tangled cloud at layers 1 and 14, separating by country from layer 15](/media/the-shape-of-wisdom/states-by-layer.png)
*Each dot is one test question, coloured by the country that Llama-3.1-8B gave as its answer. The questions are mixed together until layer 14 and separate by country from layer 15.*

## Method

I built 2,256 factual questions from Wikidata. The questions have 62 answers that come up again and again, made up of 24 countries, 16 cities, 12 languages and 10 sports, and each fact is asked in up to three different wordings.

I asked these questions to four models, Llama-3.1-8B, Qwen2.5-7B, Gemma-2-9B and Llama-3.2-1B. For each question I recorded the model's internal state at the last position of the prompt after every layer. The centroid of an answer is the average state of all the questions to which the model gave that answer, whether the answer was right or wrong. I built the centroids from questions about one half of the subjects and measured every number on questions about the other half.

## What I found

- The answer arrives in one layer. I call a question readable when its state lies nearer to the centroid of the answer the model gave than to any other centroid. In Llama-3.1-8B the share of readable questions rises from 32% at layer 14 to 71% at layer 15, and it later peaks at 94%. When the answers are shuffled the share reaches only 6% to 8%, and the spelling of the question alone reaches 11% to 18%.
- The centroids follow the answer that the model gives. In Llama-3.1-8B, centroids built from one type of question, such as citizenship, identify the answer in other types of question with the same kind of answer, such as towns and films, in 91% of cases. Centroids built from all types do so in 94% of cases. Centroids built from plainly worded questions also read reworded questions in 94% of cases, and the figure stays at 94% when I remove the directions that the model uses to write out the answer's name.
- The model uses the centroids. Before the layer where the answer arrives, moving a state towards the right centroid corrects only 0% to 1% of wrong answers. At 90% of the depth it corrects 97% in Llama-3.1-8B, 94% in Qwen2.5-7B, 97% in Gemma-2-9B and 83% in Llama-3.2-1B. Random moves of the same length change the model's reply in 14% to 34% of cases, but they produce the right answer in only 2% to 4%.
- Near misses can be seen early. A near miss is a question that the model answers wrongly in free text but gets right when it is given multiple-choice options. At the layer where the answer arrives, the centroid of the right answer is already among the nearest ones, and its rank separates near misses from real gaps in knowledge. The chance that a random near miss ranks better than a random real gap is 0.75 to 0.82. The rank of the right answer in the model's final output scores 0.77 to 0.82 on the same measure, and the model's confidence scores 0.49 to 0.66.

## Limits

The questions are short and factual, and there are only 62 possible answers. Sports are the one kind of answer that is not a name, and they jump much less than the others. The models have between 1 and 9 billion parameters, and each was tested with one prompt format. Readability shows where the states sit, and it does not show the computation that moves them there. The moves I make late in the network are large and close to the output, so they could be writing the answer in directly. For the same reason, these tests cannot tell whether a centroid is anything more than the model's plan to say a particular word.
