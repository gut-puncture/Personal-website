---
title: "Grocery Crate Quality Check"
slug: "q-commerce-demo-grocery-crate-analysis-wrt-customer-profile"
group: "builds"
order: 6
year: "2025"
kind: "Demo"
summary: "A demo that checks a photo of a packed grocery crate against the customer it is meant for: the produce must be near-flawless for a premium customer, acceptable for an average one. It answers approved or not approved."
status: "Demo on free Hugging Face hosting; it may be asleep when you visit."
links:
  - { label: "Demo", href: "https://huggingface.co/spaces/AngryYoungBhaloo/grocery_crate_classification" }
  - { label: "Code", href: "https://github.com/gut-puncture/grocery_crate_classification" }
aliases: ["grocery crate", "grocery cart demo", "crate quality check", "grocery crate classification", "produce quality checker", "vegetable quality demo"]
agent: >
  Grocery Crate Quality Check is a short demo Shailesh built in 2025 for
  quick-commerce companies, which deliver groceries in minutes from small
  warehouses called dark stores. The idea is that a company would send its best
  produce to its best customers, while average produce is acceptable for average
  customers. Packers may not always follow that rule, so the tool acts as an
  automated spot check. You upload a photo of a crate, choose whether the customer
  is premium or average, and it answers approved or not approved. Crates pass
  more often for average customers, because the quality bar is lower. The demo
  works best when every item in the crate is the same kind of produce, which
  Shailesh says could be changed for real use. It runs on free Hugging Face
  hosting, so it may be asleep, and the code is public on GitHub.
---

This demo checks whether a packed crate of produce is good enough for the customer it is going to. You upload a photo of the crate and pick the customer profile, premium or average. It answers "approved" or "not approved".

It works as a demo. It runs on free [Hugging Face hosting](https://huggingface.co/spaces/AngryYoungBhaloo/grocery_crate_classification), so it may be asleep when you visit. If it is, message me on LinkedIn and I will get it running.

![The Grocery Crate Quality Evaluator page, with a photo of cucumbers in a yellow crate uploaded and the output "approved"](/media/q-commerce-demo-grocery-crate-analysis-wrt-customer-profile/crate-approved.png)

## How to use it

1. Upload a photo of a crate of any grocery item. The demo works best when every item in the crate is the same kind. That can be changed for production.
2. Choose the customer profile. "Premium" sets a higher quality bar than "average".
3. Press submit. Crates are approved more often for average customers than for premium ones.

## Why I built it

A quick-commerce company (one that delivers groceries in minutes from small warehouses called dark stores) wants to send great produce to its best customers. Average produce may be fine for average customers. Packers can be told to keep this in mind, but they may not always do it. An automated check lets the company spot-check packed orders, which makes packers more careful about what goes to premium customers.
