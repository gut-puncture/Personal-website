---
title: "When wrappers hide what a language model knows"
slug: "when-wrappers-hide-what-a-model-knows"
group: "research"
order: 4
year: "2026"
kind: "Paper"
summary: "Language models often get questions buried inside tool results, web pages, emails or server logs. I found that this makes them lose answers they know: 6% to 18% of them inside tool results, web pages and emails, and up to 39% inside server logs."
status: "Paper, code, data and results are public on GitHub."
links:
  - { label: "Paper", href: "https://github.com/gut-puncture/interface-formatting-study/blob/main/paper/main.pdf" }
  - { label: "Code", href: "https://github.com/gut-puncture/interface-formatting-study" }
stats:
  - { value: "6%–18%", label: "of answers the model knows are lost when the question sits inside a tool result, web page or email." }
  - { value: "up to 39%", label: "of known answers lost inside server logs. The model usually starts describing the log instead of answering." }
aliases: ["When wrappers hide what a language model knows", "wrappers paper", "interface formatting study", "the question gets through the answer does not", "rappers paper"]
agent: >
  When Wrappers Hide What a Language Model Knows is a 2026 paper by Shailesh Rana, subtitled
  The Question Gets Through, the Answer Does Not. A wrapper is the text a question arrives
  in when it is not asked directly: a tool result, a web page, a server log, an email
  thread or plain prose. He asked four open models, Qwen 3 4B, Qwen 3 8B, OLMo 3 7B and
  Gemma 4 12B, 1,606 short questions about facts, arithmetic and translation, kept only
  those each model answers correctly when asked plainly, and placed them inside the five
  wrappers at three lengths. Tool results, web pages and email threads lose 6 to 18
  percent of known answers, against 0.3 to 1.2 percent for a neutral sentence. Server
  logs lose 6 to 39 percent, mostly by making the model describe the log. Copying
  internal states between prompts showed the model still reads the question inside the
  wrapper; the answer is lost later, at the point where the reply begins. Limits: the
  wrappers come from templates, the answers are short, and the largest model has 12
  billion parameters. The
  paper, code, data and results are public on GitHub.
cover: { src: "/media/when-wrappers-hide-what-a-model-knows/answers-kept-by-wrapper.png", alt: "Four charts, one per model, of how many known answers survive inside each kind of wrapper" }
---

A wrapper is the text surrounding a question when it is not asked directly. Examples include tool results, web pages, server logs, email threads, or plain paragraphs. I found that these wrappers make four open models forget answers they already know. Tool results, web pages, and email threads cause models to lose 6% to 18% of their known answers. For comparison, adding just one neutral sentence only loses 0.3% to 1.2% of answers. Server logs are worse, losing 6% to 39% of known answers. In the Qwen3-4B model, server logs lost up to 67% of answers at a specific length.

The model still successfully reads the question inside the wrapper. It loses the answer later, right at the point where it starts to write the reply.

## Method

I tested four models: Qwen3-4B, Qwen3-8B, OLMo-3-7B, and Gemma-4-12B. I asked them 1,606 short questions. This included 839 factual questions, 450 arithmetic problems, and 317 word translations. I tested them on plain questions first. I only kept the questions that each model answered correctly. This left between 71% and 80% of the original questions.

I then put each kept question inside five different wrappers. I tested these wrappers at three lengths: about 700, 2,000, and 16,000 tokens. The surrounding text was boring office news that never contained the actual answer. If the correct answer appeared anywhere in the model's reply, I counted it as kept.

![Four panels, one per model, showing the share of known answers kept for each wrapper at three prompt lengths; server logs drop to about a third in Qwen3-4B and OLMo-3-7B at 2,000 tokens, while the other wrappers mostly stay near or above 0.8](/media/when-wrappers-hide-what-a-model-knows/answers-kept-by-wrapper.png)
*The percentage of known answers kept by each model, sorted by wrapper type and length. The dotted line represents the noise floor.*

## What I found

- Logs make the model do a different task. When answers are lost inside server logs, the model describes the log 64% of the time instead of answering. For example, it might say "The logs show that multiple jobs are failing".
- The other wrappers change the model's answer. When the model loses an answer in these wrappers, it either gives a wrong answer or claims the text does not contain the answer. Plain paragraphs cause the model to claim the answer is missing in 73% of its failures.
- Wrappers target weakly held knowledge. Some answers have a probability score between 0.5 and 0.8. Non-log wrappers turn 26% of these weak answers into wrong answers. For very firm answers above 0.999 probability, this drops to 1.2%. Server logs are different. They hit firm answers just as hard as weak ones. The model turns 14% of its weakest answers and 15% of its firmest answers into descriptions of the log.

## Where the answer is lost

I used activation patching to find where the error happens. This means taking an internal state from one run and copying it into a failed run to see if it fixes the problem.

- I took the internal state of a completely different question. I swapped it into the failed run exactly where the question's words appear. This made the model output the other question's answer in 51% to 83% of the failures at the best layer. That other question gets its answer 40% to 78% of the time when it is asked inside the same wrapper. This shows the wrapper does not stop the model from reading the question.
- I tried restoring the internal states of the failed question from a successful plain run. This only brought the answer back in 47% of the cases at best.
- Finally, I restored the state at the very last position, where the model starts typing its reply. This brought the answer back in at least half of the failures. It first reaches that level at 59% to 69% of the way through the network. This is the exact point where the question's meaning arrives at the end of the prompt.

## Limits

The wrappers were built from templates using boring content. Real tool outputs might be more or less distracting. I used one specific layout with about 500 tokens of wrapper text placed after the question. I chose this because a shorter layout did not cause enough failures in the Qwen3-4B model. The expected answers are short. The models did not use step-by-step reasoning. The largest model only has 12 billion parameters. I only performed the patching technique at every single layer on the smallest model. Lastly, the number of log failures for each individual model is small.
