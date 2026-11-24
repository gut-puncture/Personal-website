---
title: "List to Cart"
slug: "q-commerce-demo-list-to-cart"
group: "builds"
order: 1
year: "2025"
kind: "Demo"
summary: "Take a photo of a shopping list and get a full cart. You upload a screenshot or a handwritten list, and pick each item from a row of matching products."
status: "Working demo. Not built for production use."
links:
  - { label: "Demo", href: "https://www.linkedin.com/feed/update/urn:li:activity:7290723046720434176/" }
  - { label: "Code", href: "https://github.com/gut-puncture/list_to_cart" }
aliases: ["list to cart", "list to cart demo", "photo to cart", "grocery list app", "shopping list to cart", "q commerce demo", "quick commerce demo"]
agent: >
  List to Cart is a demo Shailesh built in 2025 for quick-commerce grocery apps,
  the kind that deliver in minutes. You upload a photo of a shopping list, such as
  a screenshot of a WhatsApp chat, a notes app list or a handwritten list, and the
  app builds a cart from it. Claude 3.5 Sonnet reads the image and pulls out only
  the grocery item names. For each item, the app shows a row of similar products,
  found by comparing a vector embedding of the item name with embeddings of each
  product's title, description and quantity, using Elasticsearch vector search.
  Words like green or 500 grams change the suggestions. The items run down the
  screen and the suggestions for each run across, so the user can fill a cart
  quickly. It is a working demo, not a product. Shailesh notes that production use
  would want a smaller, probably open-source model for reading the list, and would
  also take the user's own preferences into account, which the demo does not. A demo video is on
  LinkedIn and the code is public on GitHub.
---

List to Cart is a demo for quick-commerce grocery apps that deliver in minutes. You upload a photo of a shopping list and the app builds a cart from it. The list can be a WhatsApp screenshot, a notes app list, or even a handwritten one.

It works as a demo. You can watch a video of it running on [LinkedIn](https://www.linkedin.com/feed/update/urn:li:activity:7290723046720434176/).

![Phone screen titled Your Grocery List, showing the item Ripe Banana with a row of recommended banana products, each with a match score and an Add to Cart button, and the next item, High protein eggs, below](/media/q-commerce-demo-list-to-cart/cart-screen.jpg)

## How it works

1. You upload the image. Claude 3.5 Sonnet reads it and keeps only the grocery item names, ignoring any other text.
2. For each item, the app shows several similar products. It turns the item name into a vector embedding, which is a list of numbers that captures meaning. It then compares this embedding with the embedding of each product's title, description, and quantity using Elasticsearch vector search. That search is very quick and suited for real apps. Prefixes and suffixes count, so "Green Apple" or "Apple - 500gm" get different suggestions than just "Apple".
3. You pick products from the suggestions. The list items run down the screen and each item's suggestions run across it. This makes filling a cart very quick. Speed matters in quick commerce, where slow cart-building is a major pain point.

## What production would need

- A smaller, probably open-source model to read the list instead of Claude 3.5 Sonnet.
- Recommendations that take the user's own preferences into account. My demo does not do this.

## Why I built it

I am forgetful, and I am usually asleep when my cook arrives in the morning. I wanted to fill a cart and schedule a morning delivery for the cook to receive. No app offered that feature, so my wife and I kept our list in a WhatsApp chat instead. That gave me a simpler idea: take a screenshot of the list, upload it, and get a full cart instantly.
