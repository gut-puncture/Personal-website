---
title: "Grocery Crate Quality Check"
slug: "q-commerce-demo-grocery-crate-analysis-wrt-customer-profile"
group: "builds"
order: 6
year: "2025"
kind: "Demo"
summary: "A demo that looked at a photo of a packed grocery crate and decided whether it was good enough for the customer it was going to. Premium customers were held to a higher bar than average customers."
status: "The hosted demo is offline. The code is public."
links:
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
  Shailesh says could be changed for real use. It ran on free Hugging Face
  hosting, and that hosted copy is no longer online. The code is public on GitHub.
  Shailesh says he would build it differently today, using a model or service made
  for small yes-or-no decisions, such as Jev or a decisions API, instead of a
  general AI model.
---

This demo checks whether a packed crate of produce is good enough for the customer who will receive it. You upload a photo of the crate and pick the customer's profile, which is either premium or average. The demo then answers "approved" or "not approved".

It worked as a demo. It ran on free Hugging Face hosting, but that hosted copy is no longer online, so only the code is still public.

![The Grocery Crate Quality Evaluator page, with a photo of cucumbers in a yellow crate uploaded and the output "approved"](/media/q-commerce-demo-grocery-crate-analysis-wrt-customer-profile/crate-approved.png)

## How it worked

1. You uploaded a photo of a crate of any grocery item. The demo worked best when every item in the crate was of the same kind, although that could easily be changed for production.
2. You then chose the customer profile. The "premium" profile set a higher bar for quality than the "average" one.
3. When you pressed submit, the demo gave its answer. Crates were approved more often for average customers than for premium ones.

## Why I built it

A quick-commerce company delivers groceries in minutes from small warehouses called dark stores. Such a company wants to send great produce to its best customers, while average produce may be fine for average customers. Managers can tell packers to keep this in mind, but packers may not always do it. An automated check would let the company spot-check packed orders, and this would make packers more careful about what they send to premium customers.

## How I would build it now

I would not use a general AI model for this today. A check like this is a small yes-or-no decision, and there are now models and services made for exactly that kind of decision, such as Jev or a decisions API. I expect that one of those would do this job much better.
