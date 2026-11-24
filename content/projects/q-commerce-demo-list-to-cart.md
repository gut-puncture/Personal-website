---
title: "List to Cart"
slug: "q-commerce-demo-list-to-cart"
group: "builds"
order: 1
year: "2025"
kind: "Demo"
summary: "You take a photo of a shopping list, and the app turns it into a full grocery cart. It reads the items from the photo and then shows matching products for each item, so that you can pick the ones you want."
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

List to Cart is a demo for quick-commerce apps, which are grocery apps that deliver in minutes. You upload a photo of your shopping list, and the app builds a cart from it. The list can be a WhatsApp screenshot, a list in a notes app or even a handwritten one.

It works as a demo, and you can watch a video of it running on [LinkedIn](https://www.linkedin.com/feed/update/urn:li:activity:7290723046720434176/).

![Phone screen titled Your Grocery List, showing the item Ripe Banana with a row of recommended banana products, each with a match score and an Add to Cart button, and the next item, High protein eggs, below](/media/q-commerce-demo-list-to-cart/cart-screen.jpg)

## How it works

1. You upload the image of your list. Claude 3.5 Sonnet then reads it and keeps only the names of the grocery items, so any other text in the image is left out.
2. For each item, the app shows several similar products. To find them, it turns the item name into a vector embedding, which is a list of numbers that captures the meaning of the text. It then compares this embedding with the embedding of each product's title, description and quantity, using Elasticsearch vector search. This kind of search is very quick, so it is suited to a real app. The words around an item name also count, which means that "Green Apple" or "Apple - 500gm" get different suggestions from plain "Apple".
3. You then pick products from the suggestions. The items on your list run down the screen, and the suggestions for each item run across it, so you can fill a cart very quickly. This speed matters in quick commerce, because delivery is so fast that slow cart-building is one of the biggest pain points.

## What production would need

- A production version would need a smaller model to read the list in place of Claude 3.5 Sonnet, and that model would probably be open-source.
- Its recommendations would also need to take the user's own preferences into account, which my demo does not do.

## Why I built it

I am forgetful, and I am usually asleep when my cook arrives in the morning. Because of this, I wanted to fill a cart and schedule a morning delivery for the cook to receive. No app offered that, so my wife and I kept our shopping list in a WhatsApp chat instead. That chat gave me the idea for a simpler flow, where I take a screenshot of the list, upload it and get a full cart straight away.
