# AI Agent Communication Protocol

Text: An AI written summary of my work-in-progress AI Agent Communication Protocol.

**This post is written by AI using the code I wrote using AI. I will write a post myself when I’m finished building the communication Protocol.**

## Context

I needed to create a system that allowed multiple specialized AI agents to communicate seamlessly and reliably. The constraints were pretty tight: it had to run entirely within a single process on my laptop, no fancy external software like Redis or Kafka. It needed to provide complete traceability (so any PM could review exactly what happened) and be very friendly for large language models (LLMs). This resulted in me designing a custom in-memory message-bus protocol.

Here’s exactly how it works.

## Overview

Our system uses a clear and organized group chat for multiple specialized AI agents to communicate efficiently. Each agent sends short messages labeled clearly with sender, recipient, type of information, and relevant tags. Messages can contain small instructions or updates directly.

For large amount of information or huge files like pdfs, reports or databases etc. we include a pointer to where this data is stored. 

Agents only pay attention to messages important for their tasks, ignoring everything else. For critical messages, the system checks if the recipient acknowledges receipt; if not, it automatically resends to ensure nothing is missed. 

Every message and action is permanently logged, so the entire conversation can be replayed later, making auditing and debugging straightforward.

## Why a Custom Message Bus?

Before I dive into details, here’s quickly why we went custom:

- **Single-process:** Runs fully on a laptop. No microservices, no external dependencies.
- **Blackboard-style communication:** Agents can "overhear" or subscribe to any messages they're interested in.
- **Audit-grade traceability:** Every message is stored, making regulatory audits or debugging straightforward.
- **LLM-friendly:** It handles tiny messages (like short prompts) and massive files (like a 100 MB Parquet file).

## The Envelope: Atomic Unit of Communication

Every message in the system is encapsulated in an Envelope—think of this as a sealed container that never changes once sent:

```
Envelope {
  sender: "research_agent",
  recipient: "spec_writer" or ["spec_writer", "qa"],
  channel: enum (e.g., task, ack, plan, plan_feedback),
  tags: ["research", "market"],
  task_id: uuid4 string (links messages to a task thread),
  parent_id: uuid4 or null, (to nest sub-tasks),
  sequence: monotonically increasing number per task,
  require_ack: true/false,
  approval_needed: true/false,
  body: dict, str, or bytes,
  timestamp: float (time in epoch secs),
  message_id: uuid4 (unique for every envelope)
}

```

Design details worth highlighting:

- `recipient="*"` broadcasts the message to everyone.
- Agents filter messages by tags like `"sql_result"`.
- Setting `require_ack=True` ensures reliable delivery (resends if no ACK).
- `approval_needed=True` halts tasks for manual QA approval.

## Bus API

The message bus has a straightforward, synchronous, and thread-safe API:

```python
class InMemoryBus:
    def publish(env: Envelope) -> None
    def poll(agent_id: str,
             channels: set[str] | None = None,
             tag_filter: set[str] | None = None
            ) -> Iterator[Envelope]
    def ack(message_id: str, agent_id: str) -> None

```

Internally, it’s just a simple queue:

- Messages go to `_q: list[Envelope]`.
- Thread-safe with a locking mechanism.
- Every envelope published is immediately written to a permanent JSONL audit log.

Messages leave the queue:

- When acknowledged (`require_ack=True`), or
- Once polled if no ACK is required.

## Standard Channels and Flow

We standardized some canonical channels to organize message flow:

| Channel | From | To | Body |
| --- | --- | --- | --- |
| task | Master | Agent | `{skill, payload, deadline}` |
| ack | Agent | Master | `{accepted: bool}` |
| plan | Agent | QA/Human | `{draft, mem_key, estimated_duration}` |
| plan_feedback | QA/Human | Agent | `{approved: bool, comment}` |
| result | Agent | Master/Downstream | `{status, mem_keys, metrics}` |
| error | Any | Master | `{reason, traceback}` |
| secret | Master | Vault | `{secret_ref}` |

### Task Lifecycle Example (Happy Path)

Let’s walk through a successful task execution:

1. **Master Planner** assigns `task_id=T-023`, publishes with `require_ack=True`.
2. **Research Agent** polls and acknowledges (`ack=True`).
3. Agent publishes a plan (no approval needed).
4. Agent executes, produces a PDF, and stores it in vectordb, generating a `mem_key=M-α`.
5. Publishes a `result` channel message, including the `mem_key`.
6. **Spec Writer** polls, acknowledges, and creates a PRD from the result.
7. **QA** approves via `plan_feedback`.
8. Final report assembled and task completed.

This workflow ensures that all stages are documented, traceable, and manageable.

## Handling Complex Failures

Here’s a complicated scenario highlighting robustness:

- Master publishes a task to `research_agent1`; no ACK in 30s triggers a timeout (`ack_timeout`).
- Master selects `research_agent2`, reposts the task.
- `research_agent2` ACKs, creates a plan; QA rejects it (`sources too vague`).
- Agent revises, attempts execution but hits a CAPTCHA block, publishing an error.
- Master engages a backup strategist, creating new subtasks: one for API scraping (`data_analysis_agent`), another for summarizing (`research_agent2`).
- Task continues smoothly down this fallback path.

All these steps get meticulously logged for forensic audits.

## Secrets Handling

Handling sensitive data securely is essential:

- When an agent (`backend_agent`) needs a secret (`git_prod`), it publishes a secret request.
- The Vault checks permissions and returns the secret directly in memory (not via bus).
- Unauthorized attempts by agents trigger errors and reroute tasks accordingly.

## Scoring Algorithm

Agents get selected for tasks based on a scoring system:

```python
def score(agent_id):
    caps = capability_registry[agent_id]
    return (0.6 * caps["expertise"]
          + 0.3 * historical_success_rate(agent_id)
          + 0.1 * (1 / (1 + current_queue_len(agent_id))))

```

- Factors: expertise, historical success rate (30-day window), and current workload.
- Lower `last_used_timestamp` breaks ties.

## Edge Case Handling

A quick cheat-sheet for tricky cases:

- **Message storm:** limit messages per task to avoid spam.
- **Unknown channel:** messages dropped, logged warnings.
- **Oversized message:** Agents must store large payloads externally and send pointers instead.
- **Human idle:** Auto-proceed after timeout (`approval_needed=False`).

## Wrapping Up

This in-memory message-bus system turned out to be extremely robust, highly traceable, and surprisingly easy to implement, providing a powerful foundation for multi-agent communication without complex infrastructure. I didn’t initially appreciate just how flexible and resilient such a seemingly simple system could be—but it's now an essential part of my workflow.

![image.png](AI%20Agent%20Communication%20Protocol/image.png)