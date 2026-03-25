# How a 7-Billion-Parameter AI Cannot Add

Text: An interpretability study revealing that LLMs systematically hallucinate a 'length bias' in large-number addition — believing the answer is always one digit longer — causing them to paradoxically outperform on harder overflow problems where this false prior accidentally aligns with the correct answer.

### **The Story of a Universal Length Bias**

There’s a peculiar test we subject our AIs to. We ask them to add numbers. Not small numbers — those are trivially easy. We’re talking about numbers with ten, fifteen, even eighteen digits. Numbers like this:

> 9,847,261,043,820 + 3,892,107,456,231 = ?

A modern pocket calculator handles this in microseconds. A human with pen and paper could do it in a minute. But when we posed this question to Qwen 2.5, a state-of-the-art 7-billion-parameter language model, something strange happened.

**It got the “hard” version of this problem** *more* **correct than the “easy” version.**

That shouldn’t happen. And understanding *why* it happens reveals something fundamental about how large language models fail — and, perhaps, how they think.

---

### **Part I: The Paradox**

**What We Expected**

When you add two 10-digit numbers, two things can happen:

1. **No Carry Overflow (Easy):** The sum is also 10 digits.
- Example: 4,000,000,000 + 4,000,000,000 = 8,000,000,000

**2. Carry Overflow (Hard):** The sum is 11 digits. The addition “overflows” into a new place value.

- Example: 6,000,000,000 + 6,000,000,000 = 12,000,000,000

Intuitively, the “Hard” case is harder. The model must correctly propagate a carry across the entire number, determine that a new leading digit is needed, and correctly produce an 11-digit output from 10-digit inputs.

We expected the model to struggle with the “Hard” case.

We were wrong.

**What We Found**

We generated 900 addition problems. For each digit length from 10 to 18, we created 50 “Easy” problems and 50 “Hard” problems. Every generated problem was fed to the model, and we judged the output as a simple binary: did the model produce the numerically correct answer, or not?

Here is the accuracy data:**10 digits:** Easy 20.0% → Hard **44.0%**

**11 digits:** Easy 6.0% → Hard 8.0%

**12 digits:** Easy 6.0% → Hard **22.0%**

**13 digits:** Easy 6.0% → Hard **16.0%**

**14 digits:** Easy 8.0% → Hard 8.0%

**15 digits:** Easy 0.0% → Hard 2.0%

**16 digits:** Easy 0.0% → Hard 4.0%

**17 digits:** Easy 2.0% → Hard 6.0%

**18 digits:** Easy 0.0% → Hard 0.0%

Read those numbers again.

At 10 digits, the model is **more than twice as accurate** on problems that require a carry overflow (44%) than on problems that don’t (20%).

This is a violation of our intuitions. But actually that is better for a deeper understanding of these alien minds.

---

### **Part II: The Hypothesis**

**What if the model** *expects* **the answer to be longer?**

The data points to a single, powerful explanation: the model is not computing the answer and instead, following a heuristic.

Somewhere in the billions of parameters of Qwen 2.5, it has learned an implicit rule:

> “*When you add two large numbers, the result is always one digit longer.”*

This is the **Universal Length Bias**.

If this hypothesis is true, then the accuracy data makes perfect sense:

**Hard Problem (Overflow):** The correct answer is N+1 digits long. The model’s implicit bias is also N+1 digits. The template aligns with reality. By sheer luck of format, the model has a better chance of stumbling onto the right answer.

**Easy Problem (No Overflow):** The correct answer is N digits long. The model’s implicit bias is N+1 digits. The template **conflicts** with reality. The model’s prior overpowers the arithmetic, and it produces a wrong answer.

To prove this, we needed to look inside the model.

---

### **Part III: Looking Inside**

**Methodology: Probing the Residual Stream**

We didn’t just observe outputs. We intercepted the model’s “thoughts”.

Modern transformer models process text token-by-token. At each layer of the network, a representation of the current state (called the “hidden state” or “residual stream”) is computed. By extracting these hidden states during inference, we can see what the model “believes” at each stage of processing.

Our analysis captured activations at every third layer (Layer 0, 3, 6, …, 27) of the 28-layer model. For every single one of our 900 samples, we recorded:

1. The hidden state at the moment the model was about to produce the *first digit* of its answer.

2. Whether the final answer was correct or incorrect.

This gave us two groups:

- A collection of hidden states from **Correct** answers (the “Right Path”).
- A collection of hidden states from **Incorrect** answers (the “Wrong Path”).

With these two populations, we asked two questions:

1. **How different are they?** (Centroid Distance)

2. **Can we teach a simple probe to tell them apart?** (Probe Accuracy)

---

**Analysis 1: The Divergence (Centroid Distance)**

The simplest way to measure the difference between two groups is to find the “average point” (centroid) of each group and measure the distance between them.

We took all the hidden state vectors from the “Correct” group, averaged them, and got the “Correct Centroid”. We did the same for the “Incorrect” group.

Then, we measured the Euclidean distance between these two centroids, layer by layer.

![](https://cdn-images-1.medium.com/max/1600/1*BvshBaK3yo-GAxoeopvxig.png)

**What the chart shows:** A clear, monotonically increasing divergence that peaks at Layer 24.

**What this tells us:**

In the earliest layers (0–6), the model’s internal states for correct and incorrect answers are nearly identical. The model hasn’t “decided” yet.

As we progress through the layers (9–18), a split begins to emerge. The model is being influenced by *something* that pushes it onto one path or another.

By layers 21–24, the divergence is massive. The model’s internal representation for a correct answer and an incorrect answer are in completely different regions of vector space.

The difference in correct and incorrect states is huge, but the model has no metacognitive mechanism to detect or leverage this divergence.

---

**Analysis 2: Probe Accuracy**

A divergence in centroids is suggestive, but can we *predict* failure? We trained a simple linear classifier (Logistic Regression) at each layer. Its job: given a hidden state vector, classify it as belonging to the “Correct” group or the “Incorrect” group.

We used 5-fold cross-validation to ensure robustness. The result is the “Probe Accuracy” — the classifier’s ability to distinguish between the two groups.

![](https://cdn-images-1.medium.com/max/1600/1*jwYzYCwI1eM5zHcLBE2Jdg.png)

**What the chart shows:** Probe accuracy starts near chance (50%) at Layer 0 and rises to approximately 64% by Layer 27. This chart displays the classification accuracy of a linear probe trained to distinguish between correct and incorrect hidden states at each layer.

**What this tells us:**

The information that determines success or failure is *linearly accessible*. This isn’t buried in some non-linear subspace. A simple linear probe can extract the signal.

But 64% is not high. This is not a cleanly separable failure state. The “Wrong Path” and the “Right Path” are overlapping, tangled. If the model had the ability, it could have been able to sense it’s in trouble when generating the wrong answer. But sadly it’s not able to.

---

**Analysis 3: The Signal War**

Now for the heart of the investigation: the **Logit Lens**.

Here’s the idea. The model’s final output is produced by projecting its last-layer hidden state through a massive “unembedding” matrix (lm_head) to produce logits over the entire vocabulary. The highest logit determines the most likely next token.

But what if we apply that same projection at *earlier* layers? We can ask: “If the model were forced to output a token right now, at Layer 3, what would it say?”

This technique is called the “Logit Lens,” and it gives us a window into the model’s evolving beliefs.

For each sample, at each layer, we projected the hidden state through the lm_head (after applying the final RMSNorm) and computed the probability assigned to three critical tokens:

1. **P(Correct):** The probability of the **actual** correct first digit.

2. **P(Bias):** The probability of the “Length Bias” token — the digit 1. (In overflow cases, the correct answer often starts with 1, e.g., 1,200,000,000).

3. **P(Heuristic):** The probability of the “Simple Heuristic” token — what you’d get if you just added the first digits of the inputs and ignored any carry. E.g., for 6… + 7…, the heuristic answer is (6+7) % 10 = 3, but the correct overflow answer is 1.

We averaged these probabilities across all samples, split by “Easy” and “Hard”.

![](https://cdn-images-1.medium.com/max/1600/1*Kv-N856OZ8gGSdpL69vQsg.png)

In Easy problems, the Bias line crosses at layer 27 and dominates.

---

**Part IV: The Visual Anatomy of Error**

To truly understand the scope of this bias, we need to look beyond simple lines and bars.

**1. The Bias Evolution (Line Chart)**

How does the model’s confidence shift from input to output?

![](https://cdn-images-1.medium.com/max/1600/1*vj5TlTcu0OOXDNAK4heIKA.png)

**2. The Failure Composition (Stacked Bar Chart)**

How much of the model’s performance is dominated by error?

![](https://cdn-images-1.medium.com/max/1600/1*C2NP343cVcECC04ARSgkjw.png)

**What the charts show:** The dynamics are different for Easy vs. Hard problems.

For **Hard** problems (right panel): Notice that P(Correct) and P(Bias) are often i*dentical*. Why? Because for overflow problems, the correct first digit *is* often 1. The “Bias” and the “Correct Answer” align. The model’s prior helps, not hurts.

For **Easy** problems (left panel): Here, the competition is more interesting. In the generating layers (20–27), we can see P(Bias) rising. The model is being tempted to output 1, even when the correct answer is, say, 8 or 9. This is the Length Bias actively fighting against the correct arithmetic.

**Key Insight from Layer 27:**

Zooming into the final layer for the “Easy” group (from the raw data):

- mean_p_corr (Correct): 3.32e-07
- mean_p_bias (Bias ‘1’): 4.58e-07

At the final output layer, the probability of the “Bias” token (1) is slightly *higher* than the probability of the “Correct” token for the Easy problems. The bias wins. This is the moment of failure, captured in a probability distribution.

---

**Analysis 4: The Failure Modes Spectrogram**

Finally, we visualize the core paradox itself.

![](https://cdn-images-1.medium.com/max/1600/1*5du9IQrIb1XCdn3EyejgWA.png)

![](https://cdn-images-1.medium.com/max/1600/1*KG14XrJ2gq4jp_noNvpvHg.png)

This is the dataset-level proof. The Universal Length Bias is real, and it is universally applied. The model treats “big number addition” as a task where the answer is *always* longer, regardless of the actual arithmetic.

---

**Part V: The Verdict**

Qwen 2.5 7B has not “failed to learn addition.”

It has successfully learned an **incorrect heuristic**:

> “*When adding very large numbers, the answer gets one digit longer. Start with a 1.”*

This is **Semantic Length Hallucination**. The model isn’t failing at the micro-level of digit-by-digit calculation (though it does that too). It’s failing at a macro-level, a *structural* level. It has inferred a template for “big number addition” that overrides the actual computation.

The failure is **hierarchical**:

1.***High-Level Formatting:** “The output should be N+1 digits.” (Learned incorrectly, applied universally)

2. **Low-Level Arithmetic:** “1 + 1 = 2.” (Mostly correct, but irrelevant if the format is wrong)

The high-level decision happens first, deep in the early-to-mid layers, and it constrains everything that follows.

---

**Implications**

This finding has implications for how we think about LLM capabilities:

**1. Evaluation Bias:** Benchmark datasets that focus on “hard” arithmetic problems (lots of carries, overflows) may inadvertently *overestimate* model capability because the model’s biases align with the problem structure.

**2. The Limits of Scale:** This wasn’t a small model. Qwen 2.5 7B is a capable, modern LLM. The Length Bias isn’t a symptom of underfitting; it’s a symptom of *overfitting* to a distributional pattern in training data.

**3. Interpretability Matters:** Without looking inside the model — without the probes, the logit lens, the centroid analysis — we would only see the surface-level paradox. The internal analysis let us trace the failure to its root cause: a structural prior baked into the model’s activations.

The next time you see an AI fail at a simple task, ask yourself: is it failing to compute, or is it succeeding at the wrong computation? Sometimes, the most dangerous errors are the ones that look like rules.

---

*This research was conducted using Qwen 2.5 7B, analyzed on a remote GPU instance. All code, data, and visualizations are available for reproducibility.*

[https://github.com/gut-puncture/Long-Number-Addition](https://github.com/gut-puncture/Long-Number-Addition)