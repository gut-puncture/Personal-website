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

A wrapper is the text a question arrives in when nobody asks it directly: a tool result, a web page, a server log, an email thread or plain prose. I found that wrappers make four open models lose answers they know. Tool results, web pages and email threads lose 6% to 18% of known answers, depending on the model, against 0.3% to 1.2% when one neutral sentence is added. Server logs lose 6% to 39%, and up to 67% at one length in Qwen3-4B.

The model still reads the question inside the wrapper. The answer is lost later, at the position where the reply begins.

## Method

I asked Qwen3-4B, Qwen3-8B, OLMo-3-7B and Gemma-4-12B 1,606 short questions: 839 facts, such as the capital of Mongolia, 450 arithmetic problems and 317 word translations. For each model I kept only the questions it answers correctly when asked plainly, 71% to 80% of them.

I placed each kept question inside the five wrappers, at about 700, 2,000 and 16,000 tokens. The surrounding text is bland office news that never contains the answer. An answer counts as kept if it appears anywhere in the reply.

![Four panels, one per model, showing the share of known answers kept for each wrapper at three prompt lengths; server logs drop to about a third in Qwen3-4B and OLMo-3-7B at 2,000 tokens, while the other wrappers mostly stay near or above 0.8](/media/when-wrappers-hide-what-a-model-knows/answers-kept-by-wrapper.png)
*Share of known answers kept, by wrapper and prompt length. The dotted line is the noise floor.*

## What I found

- Logs change the task. In 64% of the answers lost to logs, the model describes the log instead, for example "The logs show that multiple jobs are failing".
- The other wrappers change the answer. Their losses become wrong answers, or claims that the text holds no answer. Plain prose draws such claims most often, in 73% of its losses.
- These wrong answers take weakly held knowledge. Among answers the model gives with probability 0.5 to 0.8, wrappers other than logs turn 26% into wrong answers. Above 0.999 this falls to 1.2%. Logs hit firm answers as hard as weak ones: 14% of the weakest and 15% of the firmest become descriptions of the log.

## Where the answer is lost

I used activation patching (rerunning a failed prompt with one internal state copied from another run) on failed wrapped prompts.

- Swapping in another question's states at the question's words makes the model give that other question's answer in 51% to 83% of failures at the best layer, depending on the model. That other question, asked inside the same wrapper, gets its answer in 40% to 78%. So the wrapper does not stop the model reading the question.
- Restoring the failed question's own plain states brings its answer back in at most 47%.
- Restoring the last position, where the reply begins, first brings the answer back in at least half of failures at 59% to 69% of the network's depth. That is where the question's content arrives there, and where the swapped question stops having any effect.

## Limits

The wrappers come from templates and hold bland content; real tool outputs may pull harder or less. I used one layout, about 500 tokens of wrapper after the question, chosen because a shorter one lost too few answers in Qwen3-4B. The answers are short, reasoning is off and the largest model has 12 billion parameters. Only Qwen3-4B was patched at every layer, and log failures per model are few.
