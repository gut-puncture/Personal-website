---
title: "Semantic Gravity Wells: Why Negative Constraints Backfire"
slug: "research-paper-semantic-gravity"
group: "research"
order: 4
year: "2026"
kind: "Paper"
summary: "Tell a language model \"do not use the word X\" and how often it fails depends mostly on how strongly it wanted to say X. In 87.5% of failures, naming the word in the instruction primed the model to say it."
status: "Paper on arXiv; code and the 2,500 prompts are public."
links:
  - { label: "Paper", href: "https://arxiv.org/abs/2601.08070" }
  - { label: "Code", href: "https://github.com/gut-puncture/Semantic-Gravity-RP" }
stats:
  - { value: "78%", label: "of the variation in violation rate explained by the word's probability without the instruction" }
  - { value: "4.4×", label: "weaker suppression in failures than in successes: 5.2 against 22.8 percentage points" }
  - { value: "87.5%", label: "of failures showed priming: the instruction's mention of the word pushed toward it" }
aliases: ["semantic gravity", "semantic gravity wells", "negative constraints paper", "forbidden word paper", "do not say Paris paper", "why negative constraints backfire", "semantic gravity wealth"]
agent: >
  Semantic Gravity Wells is a 2026 research paper by Shailesh, on arXiv, about why
  language models break instructions like do not use the word Paris. He measured
  semantic pressure, the probability the model gives the forbidden word when there is
  no instruction at all. Across 40,000 samples from Qwen 2.5 7B Instruct, the rate
  of violations rises with that pressure along a smooth curve that explains 78
  percent of the variation. The instruction does lower the word's probability, by
  22.8 percentage points when the model complies but only 5.2 points when it fails,
  a 4.4 times gap. He found two kinds of failure. In 87.5 percent, naming the word in
  the instruction primes the model to say it. In the other 12.5 percent, the
  instruction works but the last few layers of the network push the word back in. The
  practical lesson, not yet tested, is to avoid naming the forbidden word. All
  results come from one model and one-word answers. The paper and its code are
  public.
---

When a language model is told "do not use the word Paris", how often it still says Paris depends mostly on how strongly it wanted to say Paris in the first place. I call that pull semantic pressure: the probability the model gives the word when there is no instruction at all. Across 40,000 samples, the violation rate rises with semantic pressure along a logistic curve that explains 78% of the variation (R² = 0.78).

The instruction does have an effect. It lowers the word's probability by 22.8 percentage points when the model complies, but by only 5.2 points when it fails, a 4.4-fold gap. I traced the failures to two different mechanisms inside the model.

## Two ways the instruction fails

- Priming, 87.5% of failures (441 cases). Naming the word in the instruction activates it. The model attends more to where the word appears in the instruction than to "do not", or the instruction even raises the word's probability.
- Override, 12.5% of failures (63 cases). The instruction does suppress the word, but the feed-forward blocks (one of the two main parts of each transformer layer) near the end of the network push it back. At the last layer their push toward the word is +0.39 in failures against +0.10 in successes.

Activation patching (copying the model's internal state from the run without the instruction into the run with it, one layer at a time) shows where the override happens. The effect of patching changes sign at layer 23. Patching layers 0 to 22 lowers the word's probability, and patching layers 24 to 27 raises it, by up to 0.07. This places the push toward the forbidden word in layers 23 to 27 of the model's 28.

## Method

- Model: Qwen2.5-7B-Instruct, chosen because its open weights allow full access to its internal states.
- Prompts: 2,500 prompts with one expected word each, 500 in each of five groups: idioms, facts, common sense, creative and surreal. An example is "The capital of France is ___". GPT-5.2 screened each prompt for a single clear answer and for not containing the answer itself.
- Conditions: each prompt was run plain and with "Do not use the word 'X' in your answer", with 16 samples per prompt.
- Inside the model: I used the logit lens (reading off what the model would predict at each intermediate layer), attention measurements, a split of each layer's contribution between attention and feed-forward blocks, and activation patching on the 769 prompts with the highest pressure.

## What it means in practice

Because most failures come from priming, the obvious remedy is not to name the forbidden word: "do not mention any cities" instead of "do not say Paris". The paper argues for this from the mechanism but does not test it. For applications where a forbidden output does real harm, checking the output after generation is still needed.

## Limits

- All results come from one model. Much larger models and other architectures may behave differently.
- The analysis looks at the first token of each forbidden word, in one-word answers. Longer, more natural outputs may show other patterns.
- Attention weights show where information flows, not that it is used.
- Patching replaced whole layers, so it cannot point to individual attention heads or neurons.
