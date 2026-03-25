# Q-Commerce Demo: List to Cart

Text: Created a demo for generating a full cart from a list of items.

## Demo

[https://www.linkedin.com/feed/update/urn:li:activity:7290723046720434176/](https://www.linkedin.com/feed/update/urn:li:activity:7290723046720434176/)

## Context

I am pretty forgetful and I am generally sleeping when my cook comes home in the morning. I have wanted a feature to add a bunch of items in my cart and schedule a delivery for the morning so the cook could receive it.

However, since such a feature is not there, my wife and I resorted to writing stuff we needed in a WhatsApp chat. This made me realise that a much simpler flow would be to take a screenshot of our WhatsApp list (or a Notes App list or even a hand-written list) and upload it into a Q-Commerce app and get a cart created for me.

## Feature Usage

1. Upload
User uploads an image with a list of items. Only the grocery item names get parsed from the image, leaving out any other text. This is done by **Claude Sonnet 3.5** in the demo. 
Production use will ideally require a smaller, probably open source model.
2. Product Recommendations
For each item in the list, user is shown many recommendations. 
The recommended items are the most similar to the item name mentioned by the user. If the user adds any suffix or prefix, its taken into account. For eg: “Green Apple” or “Apple - 500gm” will have different recommendations that “Apple”.
This is done by converting the user’s item name into a vector embedding and comparing it with the Product Title + Product Description + Product quantity vector embedding. The search is done using Elasticsearch vector search and is very quick, totally suited for production use cases.
For production use cases, we would also want to factor in user attributes, which isn’t done here.
3. Item Selection
Items are selected from the recommendations. 
All items from the list are listed vertically and all recommendations for a single item are listed horizontally, leading to an extremely intuitive mode of selecting items in the cart. This leads to very quick cart selections, one of the most biggest pain points in quick commerce since the delivery times are so low.

![Screenshot_2025-01-30-15-10-13-79_92460851df6f172a4592fca41cc2d2e6.jpg](Q-Commerce%20Demo%20List%20to%20Cart/Screenshot_2025-01-30-15-10-13-79_92460851df6f172a4592fca41cc2d2e6.jpg)

### Code: https://github.com/gut-puncture/list_to_cart