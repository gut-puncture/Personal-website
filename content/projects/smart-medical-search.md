---
title: "Smart Medical Search"
slug: "smart-medical-search"
group: "builds"
order: 4
year: "2025"
kind: "Demo"
summary: "You describe your symptoms in plain words and it suggests which kind of doctor to see. I built it in 2 days. It works for finding the right specialty and has known gaps elsewhere."
status: "Demo. Two known problems are still unfixed."
links: []
aliases: ["smart medical search", "medical search", "symptom search", "which doctor should I see", "doctor finder", "smart med search"]
agent: >
  Smart Medical Search is a demo Shailesh built in 2 days in 2025. It is a
  search index that links many kinds of medical terms, such as diseases, symptoms,
  lab tests, medicines and doctor specialties, using text embedding models, which
  turn text into numbers that capture meaning. The main use is the one doctor
  consultation apps need most: a person describes their symptoms and the app
  suggests which kind of doctor to see. In his test, the query "I feel burning
  sensation in my chest, just above my stomach after eating", searched within
  medical specialties, returned gastroenterology terms, which he judged accurate.
  It has two known problems that were still unfixed as of February 2025. Matching
  symptoms to diseases works poorly, and the index holds many near-duplicate terms,
  so the top four or five results are often the same answer repeated. He thinks
  both are simple fixes. The idea came from a project he designed at a previous
  company before ChatGPT, which stalled because it needed doctors to supply the
  data by hand. The code is not public.
---

Smart Medical Search lets you describe your symptoms in plain words and suggests which kind of doctor to see. Under it is a search index that links many kinds of medical terms to each other: diseases, symptoms, lab tests, medicines, doctor specialties and more.

I built it in 2 days. It works for the main use, matching symptoms to a specialty, but it has two known problems, described below.

## How it works

The index is built with text embedding models, which turn text into numbers that capture meaning, so a query finds terms with similar meaning. You type a query and choose the category you want back. I care most about "Medical Specialty or Department", because the biggest use on doctor consultation apps is someone describing symptoms and the app recommending a kind of doctor.

![The Medical Terms Search page with the query "I feel burning sensation in my chest, just above my stomach after eating", the category Medical Specialty or Department ticked, and the top result gastrologist](/media/smart-medical-search/search-screen.png)

For this query the top result, a gastroenterology specialist, is right.

## Known problems

As of February 2025, neither is fixed. Both look like simple fixes.

- Mapping symptoms to diseases works poorly. That is a big use case, so it matters.
- The index has many near-duplicate terms, so the top 4 or 5 results are often the same answer repeated. The query above shows it.

![The full result list for the same query: gastrologist, gastrology, gastroenterologist, gastroenterological and gastroenterology, five near-identical terms](/media/smart-medical-search/duplicate-results.png)

## Background

At a previous company, before ChatGPT, I designed a way to build an index linking diseases to symptoms, lab tests, medicines, specialties and hospitals. Collecting the data was the hard part: the plan was to have several doctors supply it over many hours. I left before the project started, and it never happened. When I mentioned it to a former colleague, I realised text embedding models make it easy to build. Honestly, it is a shame it took me this long to see that.
