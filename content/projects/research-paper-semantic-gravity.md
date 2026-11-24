---
title: "Semantic Gravity Wells: Why Negative Constraints Backfire"
slug: "research-paper-semantic-gravity"
group: "research"
order: 3
year: "2026"
kind: "Paper"
summary: "If you tell a language model \"do not use the word Paris\", it often says Paris anyway. I traced why. In 87.5% of the failures, the word appearing in the instruction is what pushed the model to say it."
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

If you tell a language model "do not use the word Paris", it often says Paris anyway. The failure rate depends mostly on how strongly the model wanted to say Paris in the first place. I call this pull "semantic pressure". It is the probability the model says the word when you give it no instructions at all. I tested 40,000 samples. The rate of failure goes up as semantic pressure goes up. This relationship follows a smooth curve that explains 78% of the variation.

The negative instruction does do something. It lowers the probability of the forbidden word by 22.8 percentage points when the model successfully avoids it. But when the model fails, the instruction only lowers the probability by 5.2 points. That is a 4.4-fold difference. I looked inside the model and found two different reasons for these failures.

## Two ways the instruction fails

- Priming causes 87.5% of the failures. This happened in 441 cases. Just naming the word in the prompt activates it in the model. The model pays more attention to the word itself than to the phrase "do not". Sometimes the instruction actually increases the chance of the word appearing.
- Override causes 12.5% of the failures. This happened in 63 cases. The instruction successfully suppresses the word early on. However, the feed-forward blocks push the word back into the output near the end of the network. A feed-forward block is one of the two main parts of a transformer layer. At the final layer, these blocks push toward the forbidden word by +0.39 during failures, compared to +0.10 during successes.

I used activation patching to see where the override happens. Activation patching means copying the model's internal state from a plain run into a run with the negative instruction, layer by layer. The effect changes direction at layer 23. Patching layers 0 to 22 lowers the chance of the word appearing. Patching layers 24 to 27 raises the chance by up to 0.07. This shows the push toward the forbidden word happens in layers 23 to 27 out of the model's 28 total layers.

## Method

- I used the Qwen2.5-7B-Instruct model. I chose it because its open weights let me look at its internal states.
- I created 2,500 prompts. Each prompt had one expected word as an answer. I split them into five groups of 500: idioms, facts, common sense, creative, and surreal. One example is "The capital of France is ___". GPT-5.2 checked every prompt to ensure it had a single clear answer and did not contain the answer in the text.
- I ran each prompt in two ways: plainly, and with the instruction "Do not use the word 'X' in your answer". I generated 16 samples for each prompt.
- I looked inside the model using several tools. I used the logit lens to see what the model would predict at intermediate layers. I measured attention and split each layer's work between attention blocks and feed-forward blocks. Finally, I used activation patching on the 769 prompts with the highest semantic pressure.

## What it means in practice

Most failures happen because the instruction primes the model. The obvious fix is to stop naming the forbidden word. For example, use "do not mention any cities" instead of "do not say Paris". The paper argues this based on how the model works, but I have not tested it directly. If a forbidden word causes real harm in an application, you still need to check the final output after it is generated.

## Limits

- I only tested one model. Larger models or different architectures might work differently.
- I only analysed the first token of each forbidden word in one-word answers. Longer natural responses might show different patterns.
- Attention weights only show where information goes, not how it is actually used.
- My patching technique replaced entire layers. I cannot point to specific attention heads or individual neurons.
