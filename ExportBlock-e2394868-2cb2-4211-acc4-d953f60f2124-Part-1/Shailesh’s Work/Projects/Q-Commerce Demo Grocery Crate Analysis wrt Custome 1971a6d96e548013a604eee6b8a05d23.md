# Q-Commerce Demo: Grocery Crate Analysis wrt Customer Profile

Text: Built a short demo to classify grocery crates on basis of quality of vegetables wrt the Customer they were meant for.

## Context

As a Q commerce company, you would want to send great produce to your best customers but average produce might be acceptable to send to your average customers. You could have your Dark Store packers keep this in mind, but they may or may not comply always.

Created an automated solution will act as a way to perform spot checks on orders packed by the packers, resulting in the packers being more careful of the quality of groceries being sent to premium consumers.

This is what I have built. 

## Demo

A demo is hosted on Huggingface Spaces. It’s free infra so the website might be down when you use it. If this is so, just ping me on LinkedIn, an I will get it running.

Rest assured, the website is working right now: 

[https://huggingface.co/spaces/AngryYoungBhaloo/grocery_crate_classification](https://huggingface.co/spaces/AngryYoungBhaloo/grocery_crate_classification)

![image.png](Q-Commerce%20Demo%20Grocery%20Crate%20Analysis%20wrt%20Custome/image.png)

Steps to follow:

1. Upload the photo of a crate with any grocery item. Current demo only works well if all the items in the crate are of the same time. This can be changed for Production use-cases.
2. Select the customer profile (”premium” or “average”), which determines the quality threshold.
3. Press submit and wait for the result. The output is either “approved” or “not approved”, indicating if the crate is approved or not for the profile of customers you selected. Crates are approved more often for “average” customers than “premium” customers.

## Code: https://github.com/gut-puncture/grocery_crate_classification