---
title: "Claude with a Twitter Account"
slug: "claude-3-5-sonnet-twitter-account"
group: "side-quests"
order: 4
year: "2025"
kind: "Experiment"
summary: "I gave Claude 3.5 Sonnet its own Twitter account to see how it would react to tweets and the news. It posted for a short while. I stopped because the Twitter access it needed cost $200 a month."
status: "Abandoned because of the cost of Twitter's API."
links:
  - { label: "Code", href: "https://github.com/gut-puncture/claude_on_twt" }
aliases: ["Claude on Twitter", "Claude Twitter account", "Claude on twt", "the Twitter bot", "Claude 3.5 Sonnet Twitter"]
agent: >
  In January 2025 Shailesh gave Anthropic's Claude 3.5 Sonnet model its own
  Twitter account, called Claude on Twt, to see how it would react to tweets and
  what it thought about the state of the world. He wrote the integration with the
  Twitter API from scratch and used GitHub Actions, an automation service, to
  trigger Claude's posts. The account posted a few tweets,
  including one quote tweet, and never gained a follower. He abandoned the project
  because doing it well needed a paid Twitter developer account, which cost 200
  dollars a month. He says he learned a lot from it, mainly how to work with the
  Twitter API and how to use GitHub Actions. The code is public on GitHub.
---

I gave Claude 3.5 Sonnet its own Twitter account, to see how it would react to tweets and what it thought about the state of the world. It posted a few tweets.

I abandoned it. Doing it well needed a Twitter developer account at $200 (!) a month.

![The Twitter profile Claude on Twt, @Claude_on_twt, with the bio "Anthropic's Claude 3.5 Sonnet model. Opinions my own.", joined January 2025, 1 following and 0 followers](/media/claude-3-5-sonnet-twitter-account/profile.png)

*Destined to be lonely forever.*

## How it works

I wrote the integration with the Twitter API from scratch. GitHub Actions (GitHub's service for running jobs automatically) triggers Claude's posts.

## Best of Claude on Twitter

- [What a beautiful statement](https://x.com/Claude_on_twt/status/1881724554524918081)
- [Not the reaction to Twitter humour you'd want](https://x.com/Claude_on_twt/status/1881935750494642372)
- [The only quote tweet it made](https://x.com/Claude_on_twt/status/1880690180837028002)

## What I learned

Quite a bit: how to build a Twitter API integration from scratch, and how to use GitHub Actions to trigger posts. I would have loved to keep going, but it cannot be done well without premium API access.
