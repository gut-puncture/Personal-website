---
title: "AI Agent Communication Protocol"
slug: "ai-agent-communication-protocol"
group: "builds"
order: 3
year: "2025"
kind: "Prototype"
summary: "I designed a way for a team of AI agents to pass work to each other. Every message goes through one shared channel and is logged, so that a whole task can be replayed later. The design is written, but the build is not finished."
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

This is a protocol that lets a team of specialised AI agents pass work to each other. The team could include a research agent, a spec writer, a quality checker and a data analysis agent. The protocol is unfinished, because I have worked out the design and only partly built it.

## What it is

The protocol is a message bus held in memory, which works like a group chat for the agents. I gave myself tight constraints for it:

- It must run in a single process on my laptop, without any outside software such as Redis or Kafka.
- Every message is logged permanently, so that anyone, such as a product manager, can replay a task and see exactly what happened.
- It must work for language models, which means it has to handle everything from tiny prompts to very large files.

## How it works

Every message is an envelope that cannot change once it has been sent. The envelope names the sender and the recipient, which can also be everyone. It also names a channel such as task, plan or result, along with some tags and the task that the message belongs to.

![Table of the envelope fields: sender, recipient, channel, tags, task_id, parent_id, sequence, require_ack, approval_needed, body, timestamp and message_id, with the type of each](/media/ai-agent-communication-protocol/envelope-fields.png)

- Each agent reads only the messages whose channels and tags it cares about.
- An important message must be acknowledged by the agent that receives it. If it is not acknowledged, the bus sends it again, or the planner hands the task to another agent.
- Large files such as PDFs or databases are not sent on the bus. Instead, the message carries a pointer to the place where they are stored.
- Some steps can pause until a person or a QA agent approves the plan.
- Secrets, such as passwords for a production system, never travel on the bus. A vault checks the agent's permissions and then hands the secret over directly.
- A master planner picks the agent for each task using a score. The score is 0.6 × expertise + 0.3 × success rate over the last 30 days + 0.1 × a term that falls as the agent's queue of work grows.

## Status

I designed the protocol and wrote its code with AI tools. It is still a work in progress, and I will write a full post about it when I have finished building it.
