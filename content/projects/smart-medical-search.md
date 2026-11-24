---
title: "Smart Medical Search"
slug: "smart-medical-search"
group: "builds"
order: 4
year: "2025"
kind: "Demo"
summary: "You describe your symptoms in plain words, and the search suggests which kind of doctor you should see. I built it in 2 days on a search index of medical terms. It finds the right specialty well, but it has two known problems."
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

Smart Medical Search lets you describe your symptoms in plain words, and it then suggests which kind of doctor you should see. It runs on a search index that links many kinds of medical terms to each other, such as diseases, symptoms, lab tests, medicines and doctor specialties.

I built it in 2 days. It works well for matching symptoms to a medical specialty, but it still has two known problems, which are described further down this page.

## How it works

The index is built with text embedding models. These models turn text into numbers that capture its meaning, so a query finds the terms whose meaning is closest to it. To search, you type a query and choose the category of terms you want back. The category I care about most is "Medical Specialty or Department", because the biggest use on doctor consultation apps is a person describing their symptoms so that the app can recommend a kind of doctor.

![The Medical Terms Search page with the query "I feel burning sensation in my chest, just above my stomach after eating", the category Medical Specialty or Department ticked, and the top result gastrologist](/media/smart-medical-search/search-screen.png)

For the query in this image, the top result is a gastroenterology specialist, which is the right answer.

## Known problems

As of February 2025, neither of these problems has been fixed, although both look like simple fixes.

- Mapping symptoms directly to diseases works poorly. This matters because it is a big use case.
- The index holds many terms that are near-duplicates of each other. Because of this, the top 4 or 5 results are often the same answer repeated, and the query above shows this happening.

![The full result list for the same query: gastrologist, gastrology, gastroenterologist, gastroenterological and gastroenterology, five near-identical terms](/media/smart-medical-search/duplicate-results.png)

## Background

At a previous company, before ChatGPT existed, I designed a way to build an index that links diseases to symptoms, lab tests, medicines, specialties and hospitals. The hard part was collecting the data, and our plan was to have several doctors supply it by hand over many hours. I left the company before the project started, and it never happened. When I mentioned it to a former colleague recently, I realised that text embedding models make this kind of index easy to build. Honestly, it is a shame that it took me this long to see that.
