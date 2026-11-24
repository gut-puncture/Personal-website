---
title: "AI Agent Communication Protocol"
slug: "ai-agent-communication-protocol"
group: "builds"
order: 3
year: "2025"
kind: "Prototype"
summary: "An unfinished design for how a team of AI agents can talk to each other. All messages go through one shared channel and are logged, so a whole task can be replayed later."
status: "Unfinished. The design is written up; the build is not complete."
links: []
aliases: ["agent communication protocol", "agent protocol", "message bus", "multi agent protocol", "agents talking to each other"]
agent: >
  The AI Agent Communication Protocol is an unfinished project from 2025 in which
  Shailesh designed how a group of specialised AI agents, such as a research
  agent, a spec writer, a quality checker and a data analysis agent, pass work to
  each other. It is a message bus held in memory, like a group chat: it runs in a
  single process on a laptop with no outside software such as Redis or Kafka.
  Every message is a fixed record that names the sender, the recipient, a channel
  such as task, plan or result, tags, and a task identifier. Agents read only the
  messages relevant to them. Important messages must be acknowledged, or they are
  sent again. Large files are not sent; the message carries a pointer to where
  they are stored. Every message is written to a permanent log, so a task can be
  replayed for debugging or an audit, and some steps can pause for a person's
  approval. Agents are picked for a task by a score mixing expertise, past success
  rate and current workload. Shailesh has not finished building it and plans to
  write it up himself when he does.
---

This is a protocol for letting a team of specialised AI agents pass work to each other. Examples are a research agent, a spec writer, a quality checker and a data analysis agent. It is unfinished: the design is worked out and partly built.

## What it is

It is a message bus held in memory, which works like a group chat for agents. I had tight constraints:

- It runs in a single process on my laptop, with no outside software such as Redis or Kafka.
- Every message is logged permanently, so anyone, a product manager for example, can replay a task and see exactly what happened.
- It works for language models, from tiny prompts to very large files.

## How it works

Every message is an envelope that cannot change once sent. It names the sender, the recipient (or everyone), a channel such as task, plan or result, some tags, and the task it belongs to.

![Table of the envelope fields: sender, recipient, channel, tags, task_id, parent_id, sequence, require_ack, approval_needed, body, timestamp and message_id, with the type of each](/media/ai-agent-communication-protocol/envelope-fields.png)

- Agents read only messages with the channels and tags they care about.
- An important message must be acknowledged. If it is not, the bus sends it again, or the planner hands the task to another agent.
- Large files, such as PDFs, reports or databases, are not sent. The message carries a pointer to where they are stored.
- Some steps can pause until a person or a QA agent approves the plan.
- Secrets, such as passwords for a production system, never travel on the bus. A vault checks permissions and hands them over directly.
- A master planner picks the agent for each task by a score: 0.6 × expertise + 0.3 × success rate over the last 30 days + 0.1 × a term that falls as the agent's queue grows.

## Status

I designed the protocol and wrote its code with AI tools. It is a work in progress, and I will write a full post about it when I finish building it.
