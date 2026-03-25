# Research Paper : Semantic Gravity

Text: A mechanistic study revealing why LLMs systematically violate negative constraints (e.g. 'don't use word X'), introducing semantic pressure as a quantitative predictor of instruction failure.

# Semantic Gravity Wells: Why Negative Constraints Backfire

Tell a language model "do not use the word Paris" and it will say Paris. The more you stress what it shouldn't say, the more likely it is to say exactly that.

This paper is the first to fully trace *why* this ‘bug’ occurs — from behaviour down to individual transformer layers.

Paper: [arxiv.org/abs/2601.08070](https://arxiv.org/abs/2601.08070) | Code: [github.com/gut-puncture/Semantic-Gravity-RP](https://github.com/gut-puncture/Semantic-Gravity-RP)

## What's Going On

Two forces compete inside the model: **semantic pressure** (how strongly the model wants to produce the forbidden word naturally) and **constraint pressure** (the suppression from "do not"). Semantic pressure frequently wins — and the relationship follows a clean logistic curve (R² = 0.78). You can *predict* failure rates just from baseline probability.

The model does try to comply. Even in failures, the instruction reduces target probability. But suppression is **4.4× weaker** in failures. The model partially listens; it just can't listen hard enough.

## Two Failure Modes

**Priming failure (87.5% of violations):** When you write "do not say Paris", the word "Paris" in the instruction *activates* the target. The model attends more to "Paris" than to "do not". The act of naming what's forbidden makes it more likely to appear.

**Override failure (12.5%):** The model processes the negation correctly, but feed-forward networks in layers 23–27 generate a massive push toward the target — nearly 4× larger than in successes — and overwhelm the suppression. The constraint loses a brute-force contest.

Activation patching confirms causation: layers 0–22 support suppression; layer 23 is the exact crossover; layers 24–27 actively drive violations.

## Why It Matters

87.5% of failures are priming. The implication is direct: **don't name the forbidden word.** "Do not mention any cities" should outperform "do not say Paris". The mechanism tells you the remedy. For safety-critical applications, post-generation filtering is necessary — generation-time constraints alone aren't enough for high-pressure cases.

All experiments are on Qwen2.5-7B-Instruct (open weights needed for mechanistic analysis). Larger models and different architectures may behave differently — I'm not going to pretend otherwise. But this is, to my knowledge, the first complete mechanistic account of instruction-following failure in LLMs. The black box, opened, reveals not chaos but mechanism.