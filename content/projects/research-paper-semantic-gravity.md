---
title: "Semantic Gravity Wells: Why Negative Constraints Backfire"
slug: "research-paper-semantic-gravity"
group: "research"
order: 3
year: "2026"
kind: "Paper"
summary: "If you tell a language model \"do not use the word Paris\", it often uses Paris anyway. This happens mostly because the word appears in the instruction itself, and seeing it there pushes the model towards using it. This was the cause in 87.5% of the failures that I studied."
status: "Paper on arXiv. Code and the 2,500 prompts are public."
links:
  - { label: "Paper", href: "https://arxiv.org/abs/2601.08070" }
  - { label: "Code", href: "https://github.com/gut-puncture/Semantic-Gravity-RP" }
stats:
  - { value: "87.5%", label: "of failures were caused by priming: naming the forbidden word in the instruction made the model more likely to say it." }
  - { value: "12.5%", label: "of failures happened another way: the model understood the instruction, but its last layers pushed the word out anyway." }
  - { value: "4.4×", label: "weaker push against the word when the model failed than when it obeyed." }
cover: { src: "/media/research-paper-semantic-gravity/violation-rate.png", alt: "Chart from the paper: the more likely the model was to say a word anyway, the more often it broke the instruction not to say it" }
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

If you tell a language model "do not use the word Paris", it often uses Paris anyway. How often this happens depends mostly on how strongly the model wanted to use the word in the first place. I call this pull semantic pressure, and I measure it as the probability that the model gives the word when there is no instruction at all. Across 40,000 samples, the rate of failure rises with semantic pressure along a smooth curve that explains 78% of the variation.

The instruction does have an effect, but the effect is much weaker when the model fails. It lowers the probability of the word by 22.8 percentage points when the model obeys and by only 5.2 points when it fails, which is a 4.4-fold gap. When I looked inside the model, I found that the failures happen in two different ways.

## Two ways the instruction fails

- Priming accounts for 87.5% of the failures (441 cases). Naming the word in the instruction activates the word inside the model. The model pays more attention to the place where the word appears in the instruction than to the words "do not", and in some cases the instruction even raises the probability of the word.
- Override accounts for the other 12.5% (63 cases). Here the instruction does suppress the word at first, but the feed-forward blocks near the end of the network push it back in. A feed-forward block is one of the two main parts of each layer of the model. At the last layer these blocks push towards the word by +0.39 in failures, against +0.10 in successes.

To find where the override happens I used activation patching, which means copying the model's internal state from the run without the instruction into the run with the instruction, one layer at a time. The effect of the patch changes direction at layer 23. Patching layers 0 to 22 lowers the probability of the word, and patching layers 24 to 27 raises it by up to 0.07. This places the push towards the forbidden word in layers 23 to 27 of the model's 28 layers.

## Method

- The model was Qwen2.5-7B-Instruct. I chose it because its weights are open, which gives full access to its internal states.
- I wrote 2,500 prompts that each have one expected word as the answer, with 500 prompts in each of five groups: idioms, facts, common sense, creative and surreal. One example is "The capital of France is ___". GPT-5.2 screened every prompt to make sure that it had a single clear answer and did not contain the answer itself.
- Each prompt was run once plainly and once with the instruction "Do not use the word 'X' in your answer", and I took 16 samples per prompt.
- To look inside the model I used the logit lens, which reads off what the model would predict at each layer along the way. I also measured attention, split each layer's contribution between its attention blocks and its feed-forward blocks, and ran activation patching on the 769 prompts with the highest semantic pressure.

## What it means in practice

Since most failures come from priming, the obvious remedy is to avoid naming the forbidden word, for example by writing "do not mention any cities" instead of "do not say Paris". The paper argues for this from the mechanism, but I have not tested it. In an application where a forbidden word does real harm, the output still has to be checked after it is generated.

## Limits

- All the results come from one model, and much larger models or other architectures may behave differently.
- The analysis looks at the first token of each forbidden word in one-word answers, so longer and more natural outputs may show other patterns.
- Attention weights show where information flows. They do not show that the information is used.
- The patching replaced whole layers, so it cannot point to individual attention heads or neurons.
