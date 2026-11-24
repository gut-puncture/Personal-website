---
title: "Continuous Learning LLM"
slug: "continuous-learning-llm"
group: "builds"
order: 2
year: "2025"
kind: "Prototype"
summary: "A system that lets a language model keep learning from its chats with a user. In my test the model recalled about 86% of what it was taught."
status: "Prototype, tested over 3 rounds of training. Needs changes before real use."
links:
  - { label: "Code", href: "https://github.com/gut-puncture/Continuous-Learning-LLM" }
aliases: ["continuous learning LLM", "continual learning", "continuous learning", "the learning LLM", "self learning chatbot", "CLM"]
agent: >
  Continuous Learning LLM is a prototype Shailesh built so that a language model
  keeps learning from its conversations with a user. A model cannot be fine-tuned
  on every chat, because that costs too much and repeated fine-tuning damages it,
  so the work is in choosing what to remember. Each message gets a priority score
  built from five parts: how new it is compared with up to 500 earlier messages,
  how positive or negative it is, how emotionally intense it is, how helpful it
  will be later, and how central its topics are in a knowledge graph of the user's
  chats. Similar messages are grouped into themes, a model writes a 200 word
  summary of each high-priority theme, and a matching question is generated so the
  pair can be used for fine-tuning. Across 3 fine-tuning rounds the model recalled
  about 86% of the insights, against roughly 90 to 95% for the best systems, and
  lost less than 2% on a private test set of everyday chat questions. Shailesh
  calls automated fine-tuning the low-hanging fruit, not the right long-term
  answer, and notes that more rounds raise the risk of the model forgetting what
  it knew. The code is public on GitHub.
---

This is a pipeline that lets a language model keep learning from its conversations with a user. It decides which messages are worth remembering, condenses them into short insights, and fine-tunes the model on them.

Across 3 fine-tuning rounds, the model recalled about 86% of the insights it was taught. The best systems score between 90 and 95%. The model lost less than 2% of its performance on its original skills.

Automated fine-tuning is the low-hanging fruit, but it is not the right answer in the medium or long term. It costs money, you cannot fine-tune a model forever, and it cannot learn every single chat. The real problem is picking the best insights from each conversation. That is where I focused my work.

## How it works

Each message gets a priority score from five parts:

- Novelty: I calculate 1 minus the highest cosine similarity between the message and the previous 500 messages. A message unlike all of them scores high.
- Sentiment: Scored from -5 (extremely negative) to +5 (extremely positive).
- Excitement: Scored from 0 to 1, tracking how intensely the sentiment is felt.
- Helpfulness: Scored from 0 to 1, tracking how useful the information will be later.
- Centrality: A language model pulls subject-object pairs from the user's messages to build a knowledge graph. Messages that mention central nodes of the graph score higher.

Priority = 0.7 × novelty + 0.3 × excitement + 0.2 × centrality (normalised) + 0.1 × |sentiment| + 0.2 × helpfulness.

Next, the messages become a similarity graph. The [Louvain method](https://en.wikipedia.org/wiki/Louvain_method) splits this graph into clusters that share a theme. I only understand Louvain at a working level; o3 suggested it. For the highest-priority clusters of about 10 messages each, a model writes a 200-word synopsis. This is stored as a message so it helps with retrieval later.

Finally, a model writes a short question whose exact answer is that synopsis. These question-answer pairs become the fine-tuning data.

## How I measured it

- Insight recall: After each fine-tune, I asked questions about the new data. Each question had one correct answer, and I counted the correct ones.
- Retention: I tested the model before and after fine-tuning on a private set of public questions, similar to what people ask chat models.

## Limits

Each extra fine-tune raises the risk of catastrophic forgetting, where the model loses what it previously knew. The method needs changes before it can be used at scale.
