---
title: "How a 7-Billion-Parameter AI Cannot Add"
slug: "how-a-7-billion-parameter-ai-cannot-add"
group: "research"
order: 5
year: "2026"
kind: "Study"
summary: "A 7-billion-parameter model, Qwen 2.5, gets long additions right more often when the answer is one digit longer than the numbers being added. That should be the harder case. At 10 digits it got 44% right, against 20% when the answer stays the same length."
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

Qwen 2.5 7B is an open language model with 7 billion parameters. I found that it adds long numbers more accurately when the maths should be harder. Sometimes the sum of two numbers gains an extra digit, like an overflow. For example, 6,000,000,000 + 6,000,000,000 = 12,000,000,000. The model got these problems right more often than problems where the sum stayed the same length. At 10 digits, it correctly answered 44% of the overflow problems. It only got 20% of the normal problems right.

The explanation that fits is a length bias. The model just expects the sum of two long numbers to be one digit longer. When the sum actually is longer, this bias helps the model. When the sum is not longer, the bias makes the model output an answer of the wrong length.

![Bar chart of accuracy by number of digits, 10 to 18, for problems whose sum stays the same length and problems whose sum gains a digit. The sums that gain a digit are as accurate or more accurate at every length.](/media/how-a-7-billion-parameter-ai-cannot-add/accuracy-by-length.png)
*"Easy" sums stay the same length. "Hard" sums gain a digit. Each bar represents 50 problems.*

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

The model was more accurate on the overflow problems at seven of the nine lengths. It tied at the other two lengths. Overall, the model only got 79 out of 900 problems right. It fails at long addition in both cases. The surprising part is that it does better on the harder version.

## Method

I generated 900 maths problems. For each length from 10 to 18 digits, I created 50 pairs of random numbers whose sum stays the same length. I created another 50 pairs whose sum gains a digit. The prompt only contained the two numbers and an equals sign, like "4000000000 + 4000000000 =". The model answered with its most likely output. I counted an answer as correct if the last sequence of five or more digits matched the true sum.

I also recorded the model's internal state at every third layer on the last token of the prompt. I found that the internal states for right and wrong answers drift apart as they move through the network. The biggest gap happens at layer 24 out of 28.

## Limits

- I did not count the actual digits in the model's wrong answers. I inferred the length bias from the accuracy scores rather than measuring it directly. Counting the lengths of the wrong answers would test whether the bias is real.
- Each cell in my table represents only 50 problems. A difference of a few percentage points is just one or two answers.
- I measured the internal states on the prompt itself, before the model wrote anything. This shows that the model treats right and wrong answers differently inside, but it does not show the bias happening.
- I only tested one model and used one prompt format.

The [code, raw results and figures](https://github.com/gut-puncture/Long-Number-Addition) are public.
