---
title: "How a 7-Billion-Parameter AI Cannot Add"
slug: "how-a-7-billion-parameter-ai-cannot-add"
group: "research"
order: 5
year: "2026"
kind: "Study"
summary: "I tested how well a 7-billion-parameter model, Qwen 2.5, adds numbers that are 10 to 18 digits long. It got more answers right when the sum was one digit longer than the numbers being added, which should be the harder case. This suggests that the model expects the answer to be longer than the numbers."
status: "Code, results and figures are public. A small study, not peer reviewed."
links:
  - { label: "Code", href: "https://github.com/gut-puncture/Long-Number-Addition" }
stats:
  - { value: "44% vs 20%", label: "correct at 10 digits when the answer gains a digit, against when it does not." }
  - { value: "7 of 9", label: "number lengths, from 10 to 18 digits, where the answers that gain a digit were more accurate. The other two were tied." }
  - { value: "79 of 900", label: "problems answered correctly in total." }
aliases: ["the AI cannot add", "AI can't add", "long number addition", "length bias", "universal length bias", "Qwen addition study", "seven billion parameter AI", "how a 7 billion parameter AI cannot add"]
agent: >
  This is a 2026 study by Shailesh of how the open language model Qwen 2.5 7B adds
  long numbers, from 10 to 18 digits. He gave it 900 addition problems. At every
  length, half had a sum one digit longer than the two numbers, which needs a carry
  into a new place and should be harder, and half had a sum of the same length. The
  model did better on the harder kind. At 10 digits it got 44 percent of them right
  against 20 percent of the easier kind. Across the nine lengths, the harder kind
  scored higher at seven and tied at two, and never lower. Overall it got 79 of the
  900 right. The explanation that fits is a length bias: the model expects the sum of
  two long numbers to be one digit longer, which helps when that is true and hurts
  when it is not. The study did not count the digits in the wrong answers, so the
  bias is inferred from the accuracy pattern rather than measured directly. Each
  group has only 50 problems per length. The code and results are public.
cover: { src: "/media/how-a-7-billion-parameter-ai-cannot-add/accuracy-by-length.png", alt: "Chart of addition accuracy by number length, higher when the answer gains a digit" }
---

I tested how well Qwen 2.5 7B, an open language model with 7 billion parameters, adds two long numbers. It got more answers right when the sum was one digit longer than the numbers being added, which is the case that should be harder because a digit has to be carried into a new place. An example of such a sum is 6,000,000,000 + 6,000,000,000 = 12,000,000,000. At 10 digits the model got 44% of these problems right, and only 20% of the problems where the sum stays the same length.

The explanation that fits this pattern is a length bias. The model seems to expect the sum of two long numbers to be one digit longer than the numbers themselves. When the sum really is longer, this expectation helps, and when it is not, the model produces an answer of the wrong length.

![Bar chart of accuracy by number of digits, 10 to 18, for problems whose sum stays the same length and problems whose sum gains a digit. The sums that gain a digit are as accurate or more accurate at every length.](/media/how-a-7-billion-parameter-ai-cannot-add/accuracy-by-length.png)
*"Easy" sums stay the same length and "hard" sums gain a digit. Each bar is 50 problems.*

## Results

| Digits | Sum stays the same length | Sum gains a digit |
| --- | ---: | ---: |
| 10 | 20% | 44% |
| 11 | 6% | 8% |
| 12 | 6% | 22% |
| 13 | 6% | 16% |
| 14 | 8% | 8% |
| 15 | 0% | 2% |
| 16 | 0% | 4% |
| 17 | 2% | 6% |
| 18 | 0% | 0% |

The sums that gain a digit were more accurate at seven of the nine lengths and tied at the other two. Overall the model got only 79 of the 900 problems right, so it is bad at long addition in both cases. What is surprising is that it does better on the harder kind.

## Method

I generated 900 problems. For each length from 10 to 18 digits there are 50 pairs of random numbers whose sum stays the same length and 50 pairs whose sum gains a digit. The prompt contains only the two numbers and an equals sign, for example "4000000000 + 4000000000 =", and the model answers with its most likely output. An answer counts as correct if the last run of five or more digits in it equals the true sum.

I also recorded the model's internal state on the last token of the prompt at every third layer. The states for the problems it gets right and the problems it gets wrong move apart as they pass through the network, and the gap is largest at layer 24 of 28.

## Limits

- I did not count the digits in the model's wrong answers, so the length bias is inferred from the pattern in the accuracy and was not measured directly. Counting those digits would test whether the bias is real.
- Each cell in the table is only 50 problems, so a difference of a few percentage points is one or two answers.
- The internal states were measured on the prompt, before the model wrote anything. They show that the model treats the problems it will get right and wrong differently, but they do not show the bias itself.
- I tested one model with one prompt format.

The [code, raw results and figures](https://github.com/gut-puncture/Long-Number-Addition) are public.
