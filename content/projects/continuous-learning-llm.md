---
title: "Continuous Learning LLM"
slug: "continuous-learning-llm"
group: "builds"
order: 2
year: "2025"
kind: "Prototype"
summary: "I built a system that lets a language model keep learning from its chats with a user. It picks the messages that are worth remembering and then trains the model on them. In my tests the model recalled about 86% of what it was taught."
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

This is a pipeline that lets a language model keep learning from its conversations with a user. It first decides which messages are worth remembering. It then condenses those messages into short insights, and finally it fine-tunes the model on them, which means training the model a little further on this new data.

I tested it over 3 rounds of fine-tuning, and across those rounds the model recalled about 86% of the insights it was taught, while the best systems score between 90 and 95%. The model also lost less than 2% of its performance on the skills it already had.

Automated fine-tuning is the low-hanging fruit, and I do not think it is the right answer in the medium or long term. It costs money, and a model cannot be fine-tuned forever, so it cannot learn from every single chat. The real problem is therefore picking the best insights from each conversation, and that is where I put most of my work.

## How it works

Each message gets a priority score, which is built from five parts:

- Novelty is 1 minus the highest cosine similarity between the message and the previous 500 messages. Cosine similarity measures how alike two texts are, so a message that is unlike all of them scores high.
- Sentiment is scored from -5, which is extremely negative, to +5, which is extremely positive.
- Excitement is scored from 0 to 1 and tracks how intensely the sentiment is felt.
- Helpfulness is scored from 0 to 1 and tracks how useful the information will be later.
- Centrality comes from a knowledge graph. A language model pulls subject-object pairs from the user's messages to build this graph, and messages that mention its central nodes score higher.

Priority = 0.7 × novelty + 0.3 × excitement + 0.2 × centrality (normalised) + 0.1 × |sentiment| + 0.2 × helpfulness.

Next, the messages are turned into a similarity graph. The [Louvain method](https://en.wikipedia.org/wiki/Louvain_method) then splits this graph into clusters of messages that share a theme. I only understand Louvain at a working level, and it was o3 that suggested it. For the highest-priority clusters, which hold about 10 messages each, a model writes a 200-word synopsis. This synopsis is stored as a message as well, so that it also helps with retrieval later.

Finally, a model writes a short question whose exact answer is that synopsis. These pairs of questions and answers become the data for fine-tuning.

## How I measured it

- For insight recall, I asked questions about the new data after each fine-tune. Each question had one correct answer, and I counted how many the model got right.
- For retention, I tested the model before and after fine-tuning on a private set of public questions, which are similar to the questions people ask chat models.

## Limits

Each extra fine-tune raises the risk of catastrophic forgetting, which is when the model loses what it knew before. Because of this, the method needs changes before it can be used at scale.
