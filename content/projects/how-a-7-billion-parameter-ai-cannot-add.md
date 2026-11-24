---
title: "How a 7-Billion-Parameter AI Cannot Add"
slug: "how-a-7-billion-parameter-ai-cannot-add"
group: "research"
order: 5
year: "2026"
kind: "Study"
summary: "Qwen 2.5 7B adds long numbers better when the sum is one digit longer than the numbers, the case that should be harder: 44% right at 10 digits, against 20% when the sum stays the same length. The pattern fits a bias toward longer answers."
status: "Code, results and figures public; small study, not peer reviewed."
links:
  - { label: "Code", href: "https://github.com/gut-puncture/Long-Number-Addition" }
stats:
  - { value: "44%", label: "of 10-digit problems right when the sum gains a digit, against 20% when it does not" }
  - { value: "7 of 9", label: "lengths from 10 to 18 digits where sums that gain a digit were more accurate; the other two tied" }
  - { value: "79 of 900", label: "problems answered correctly overall, across all lengths and both kinds" }
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
---

Qwen 2.5 7B, an open language model with 7 billion parameters, adds long numbers more accurately in the case that should be harder. When the sum of two numbers is one digit longer than the numbers themselves (an overflow, as in 6,000,000,000 + 6,000,000,000 = 12,000,000,000), it was right more often than when the sum stayed the same length. At 10 digits it got 44% of overflow problems right, against 20% of the others.

The explanation that fits is a length bias: the model expects the sum of two long numbers to be one digit longer than they are. When the sum really is longer, the bias helps. When it is not, the bias pulls the model toward an answer of the wrong length.

![Bar chart of accuracy by number of digits, 10 to 18, for problems whose sum stays the same length and problems whose sum gains a digit. The sums that gain a digit are as accurate or more accurate at every length.](/media/how-a-7-billion-parameter-ai-cannot-add/accuracy-by-length.png)
*"Easy" sums stay the same length; "Hard" sums gain a digit. Each bar is 50 problems.*

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

Overflow problems were more accurate at seven of the nine lengths and tied at the other two. Overall the model got 79 of 900 problems right, so long addition fails in both cases. The overflow advantage is the surprising part.

## Method

I generated 900 problems: for each length from 10 to 18 digits, 50 pairs of random numbers whose sum stays the same length and 50 whose sum gains a digit. The prompt was only the two numbers and an equals sign, for example "4000000000 + 4000000000 =". The model answered with its single most likely output each time. An answer counted as correct if the last number of five or more digits in its output equalled the true sum.

I also recorded the model's internal state at every third layer, on the last token of the prompt. The internal states of right and wrong answers drift further apart through the network, with the largest gap at layer 24 of 28.

## Limits

- The study did not count the digits in the model's wrong answers. The length bias is inferred from the accuracy pattern, not measured directly. Counting answer lengths would test it.
- Each cell of the table rests on 50 problems, so a difference of a few points is one or two answers.
- The internal measurements were taken on the prompt, before the model writes anything. They show that right and wrong answers differ inside the model; they do not show the bias itself.
- One model, one prompt format.

The [code, raw results and figures](https://github.com/gut-puncture/Long-Number-Addition) are public.
