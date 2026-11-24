---
title: "AI Shoe Design"
slug: "ai-shoe-design"
group: "builds"
order: 5
year: "2025"
kind: "App"
summary: "A web app that designs a shoe to match a fashion brand. You upload photos of the brand's clothes and accessories, and it writes a design brief and generates a picture of a new shoe."
status: "Live app. Built quickly as a proof of concept."
links:
  - { label: "App", href: "https://ai-shoe-design-app.vercel.app/" }
  - { label: "Code", href: "https://github.com/gut-puncture/AI-shoe-design-app" }
aliases: ["AI shoe design", "the shoe app", "shoe designer", "AI shoe designer", "shoe design app"]
agent: >
  AI Shoe Design is a web app Shailesh built quickly in 2025 as a proof of concept
  for a former colleague. It helps a fashion brand design footwear that fits the
  look of the clothes and accessories it already sells. The user uploads up to 10
  reference photos of the brand's products. OpenAI's o3 model works out what the
  photos have in common, such as colour palette, textures, silhouettes and mood,
  and writes a detailed prompt describing one new shoe the brand could
  manufacture. The user can read and edit that prompt. Google's Imagen 4 Ultra
  image model then generates the shoe design. Shailesh credits o3's ability to put
  a visual style into words, and Imagen 4 Ultra's reliable instruction following,
  for the quality of the results. The app is live and free to use, and the code is
  public on GitHub.
---

AI Shoe Design is a web app that designs a shoe to match a fashion brand's existing look. You upload photos of clothes and accessories the brand already sells, and the app generates a new shoe design in the exact same style.

I built it quickly as a proof of concept for a former colleague. It is live and anyone can use it. I would love feedback.

![A generated design: an ivory leather high-heeled sandal with curved asymmetric cutouts, a silver-buckled ankle strap, a flared heel and a grooved sole, on a plain grey background](/media/ai-shoe-design/generated-sandal.png)

## How it works

1. You upload up to 10 reference images from the brand's catalogue. Here is [an example set from Zara](https://drive.google.com/drive/folders/1jdL43ntWyyY6yyMNIuvpivMjbT2C-_Gl?usp=drive_link).
2. OpenAI's o3 model finds the design traits the images share. It looks at colour palette, textures, silhouettes, and mood. It turns these traits into one detailed prompt for a single shoe the brand could manufacture, including materials, heel height, colour codes, and things to avoid.
3. You can read and edit that prompt. Writing the style out in words is the whole point. It gives the image model clear instructions and lets you change them easily.
4. Google's Imagen 4 Ultra model generates the shoe image from the prompt.

![The Design Chat tab of the app, with the message "Make a wild design!" and eight uploaded reference images](/media/ai-shoe-design/design-chat.png)

![The Image Generator tab, with the generated prompt filled in and a Generate Shoe Design button](/media/ai-shoe-design/image-generator.png)

## What makes it work

Two models do the heavy lifting here. The o3 model is very good at putting the shared style of a set of images into words. Imagen 4 Ultra is the real star. It follows instructions well, avoids coherence errors, and gives reliable results. Shoe design barely scratches the surface of what it can do.
