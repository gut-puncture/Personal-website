# Continuous Learning LLM

Text: A system which lets an LLM learn new details as it interacts with users.

# Overview

The Continuous Learning Problem is the biggest and the most important problem in AI right now. Bigger than context length management.

This is an attempt at making a decent enough system which learns continuously.

https://github.com/gut-puncture/CLM_self_coded

## Insight

For continual learning, I am setting up an **automated fine-tuning** pipeline. This is the low-hanging fruit way of solving the continuous learning problem and definitely NOT the correct solution in mid and long-term.

But for now, this will do just fine and it will still be valuable for users.

The issue with setting up automated fine-tuning is the Cost and that you cannot do it infinitely to a model. Hence, you cannot teach the model every interaction they have with a user. That would be 100s of chats for 100s of millions of users for ChatGPT. Not at all doable.

Thus the problem boils down to isolating the best insights from the interaction with the user. That is where my work has been done.

First Insight: What should be remembered from an interaction is this:

1. unique or novel information
2. emotionally charged information
3. information user *cares* about/is excited by
4. information which is helpful for future use
5. information which is *important*

The work of this project has been to quantify these metrics and create a prioritisation score.

Second Insight: We must be able to sufficiently summarise Ithe data generated after interacting with the user for continual learning. This hierarchical summarisation process must be efficient.

## How it works

### Priority Score

The priority score is created for each message in the model-user interaction and is composed of these:

1. Novelty: This is given by ‘1 - Max(Cosine Similarity)’ of a message with previous other messages, indicating that if the current message is very dissimilar with all 500 previous messages, it’ll have a high novelty score.
2. Sentiment: -5 to +5. -5 is for “extremely negative, highly aggressive, despairing, hateful, panicked” messages and +5 is for “extremely positive, enthusiastic, joyful” messages.
3. Excitement: 0 to 1. This is essentially an indicator of the intensity of the Sentiment felt, i.e. how emotionally charged the information is.
4. Helpfulness: 0 to 1. How helpful the information is for future reference.
5. Centrality: There is a **knowledge graph** created for all the interactions that the user has with the model. A message can contain mention of some nodes on the graph. 
The nodes are subject - object pairs mentioned in the user messages. These are derived by sendign all user messages to an LLM. 
The more central the nodes are in the knowledge graph, the more important is the message they were part of.

Priority Score = 0.7 * novelty + 0.3 * excitement + 0.2 * centrality_normalised + 0.1 * ABS(Sentiment) + 0.2 * helpfulness 

### Insight Generation

Once we have a lot of messages, we can create a **Similarity Graph** with the messages as nodes and the weights between them being (1 - Cosine Distance).

This gives us a graph with messages as nodes and their weight is highest the more similar they are.

Then I apply the [Louvain Partitioning Algorithm](https://en.wikipedia.org/wiki/Louvain_method)* to get distinct *clusters* in the graph. These clusters are messages with the same theme.

When fine-tuning, we take the ‘n’ highest priority clusters and ask a model to write a precise 200 word synopsis for each cluster of about 10 messages. This insight is stored in our db as a message since it can be used for retrieval (side note: since we have priority of messages, excellent retrieval can also be done every time a user chats).

### Fine-tuning

Once Insights are stored as messages in our db, we ask a model to generate a crisp natural language question which would result in the exact 200 word insight. This question-answer pair is finally used for fine-tuning.

## Evaluations

These are the common metrics used to evaluate Continuous Learning Systems.

### Insight Recall Rate

This measures the amount of “facts” or “insights” our fine-tuned model can recall after fine-tuning.

It was measured by asking the fine-tuned model questions about related to the fine-tuned data after each fine-tune. Each question had only one true answer and the model was graded on the number of questions it could get correct.

The SOTA score is in the 90-95% range of recall. Our model got ~86% recall across 3 fine-tuning exercises.

### Retention

There is also a risk of the model forgetting what it previously knew after a fine-tuning round. An event of Catastrophic Forgetting can also occur during such a fine-tune. To keep a track on it, we measure Retention, which is a measure of how much the performance of our model *drops* in its original capabilites.

Instead of using any public generic benchmark, the model was tested on a private dataset (which consists of public questions) which correspond well with the kind of questions asked to chat models.

The model was tested before and after the fine-tune and showed less than 2% performance degradation.

Note: With more and more fine-tunes, there is an increased risk of catastrophic forgetting. This means that out method needs modification to be used at scale.

*Full disclosure: I only have a functional understanding of the Louvain algo and it was actually suggested by o3.