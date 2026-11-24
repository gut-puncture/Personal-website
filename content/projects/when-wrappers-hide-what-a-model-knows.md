---
title: "When wrappers hide what a language model knows"
slug: "when-wrappers-hide-what-a-model-knows"
group: "research"
order: 4
year: "2026"
kind: "Paper"
summary: "Language models are often given a question inside other text, such as a tool result, a web page, an email or a server log. I found that this surrounding text makes them lose answers that they know when the question is asked directly. Server logs are the worst and lose up to 39% of those answers."
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

Language models are often given a question inside other text, for example inside a tool result, a web page, a server log, an email thread or a few paragraphs of prose. I call this surrounding text a wrapper. I found that wrappers make four open models lose answers that they know when the question is asked directly.

How much is lost depends on the wrapper. Tool results, web pages and email threads lose 6% to 18% of the known answers, depending on the model. Adding just one neutral sentence loses only 0.3% to 1.2%, so these losses are far above the noise. Server logs are worse and lose 6% to 39%, and in Qwen3-4B they lose up to 67% at one length.

The model still reads the question correctly inside the wrapper. The answer is lost later, at the position where the reply begins.

## Method

I used four models, Qwen3-4B, Qwen3-8B, OLMo-3-7B and Gemma-4-12B, and 1,606 short questions. Of these questions, 839 are facts such as the capital of Mongolia, 450 are arithmetic problems and 317 are word translations. For each model I first asked every question plainly and kept only the ones it answered correctly, which was 71% to 80% of them.

I then placed each kept question inside each of the five wrappers, at lengths of about 700, 2,000 and 16,000 tokens. The surrounding text is bland office news that never contains the answer. An answer counts as kept if it appears anywhere in the model's reply.

![Four panels, one per model, showing the share of known answers kept for each wrapper at three prompt lengths; server logs drop to about a third in Qwen3-4B and OLMo-3-7B at 2,000 tokens, while the other wrappers mostly stay near or above 0.8](/media/when-wrappers-hide-what-a-model-knows/answers-kept-by-wrapper.png)
*The share of known answers that each model kept, for each wrapper and prompt length. The dotted line is the noise floor.*

## What I found

- Logs change the task. In 64% of the answers lost to server logs, the model describes the log instead of answering, for example with "The logs show that multiple jobs are failing".
- The other wrappers change the answer. When an answer is lost in one of them, the model either gives a wrong answer or claims that the text does not contain the answer. Plain prose draws such claims most often, in 73% of its losses.
- The wrong answers mostly replace knowledge that the model holds weakly. Among answers that the model gives with a probability of 0.5 to 0.8, the wrappers other than logs turn 26% into wrong answers, and above a probability of 0.999 this falls to 1.2%. Logs are different, because they hit firm answers as hard as weak ones: 14% of the weakest answers and 15% of the firmest become descriptions of the log.

## Where the answer is lost

To find where the answer is lost I used activation patching on the failed prompts. This means running a failed prompt again with one internal state copied in from another run, and seeing whether the reply changes.

- First I copied in the states of a different question, at the positions of the question's words. The model then gave that other question's answer in 51% to 83% of the failures at the best layer, depending on the model. The other question gets its own answer in 40% to 78% of cases when it is asked inside the same wrapper. This shows that the wrapper does not stop the model from reading the question.
- Next I restored the failed question's own states from the run where it was asked plainly. This brought the answer back in at most 47% of the failures.
- Finally I restored the state at the last position, which is where the reply begins. This first brings the answer back in at least half of the failures at 59% to 69% of the network's depth. That is the depth at which the content of the question arrives at the last position, and it is also where swapping in another question stops having any effect.

## Limits

The wrappers come from templates and hold bland content, so real tool outputs may pull the model harder or less hard. I used one layout, with about 500 tokens of wrapper after the question, and I chose it because a shorter one lost too few answers in Qwen3-4B. The answers are short, the models' reasoning mode was off, and the largest model has 12 billion parameters. Only Qwen3-4B was patched at every layer, and the number of log failures per model is small.
