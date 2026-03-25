# Smart Medical Search

Text: Write a brief description of your symptoms and know what kind of doctor you should visit.

## Context

In my previous organisation, in pre-ChatGPT world, I formulated a methodology to create a search index which connected all diseases with their symptoms, lab tests, medicines, doctor specialties, hospitals etc. However the data collection was the main issue and our plan was to get doctors, multiple of them, to provide us with the data across hours.

I left the org before the project could be started and it never finished. A few days ago, I was chatting with a colleague from the org and I mentioned the project, where it hit me that such a thing was very easily buildable with text embedding models.

Honestly, its a shame that it took me this long for me to come up with this idea. I built the current version is 2 days. It can still be improved.

## Index Usage

The current version of the index actually maps many kinds of medical terms to many other kinds of medical terms. But I was the most interested in the mapping of symptoms/disease and Doctor Specialties. This is because the biggest use case on Doctor Consultation apps is someone describing their symptoms and the app figuring out what kind of doctor to recommend to them. This is a symptom/disease to specialty mapping.

To test the index you can write a mock user query as shown below and select the kind of Category you’re searching for. We’ve selected “Medical Specialty or Department” since that is what we’re interested in.

Clicking search gives us the result, which in this case is pretty accurate. All in 2 days work.

![image.png](Smart%20Medical%20Search/image.png)

### Code: https://github.com/gut-puncture/Smart-Med-Search

## Shortfalls

1. The mapping between symptoms and disease is not good at all. Since that’s a huge use-case, I’ll definitely fix it, but as of 12/02/2025, I haven’t fixed it.
It seems to be a simple fix, but I’ll get to it when I get to it.
2. The search index has a lot of near duplicate terms. This means that the top 4-5 results are essentially the same result over and over again. For example this was the result of the query shown above. This is also a relatively simple fix and I will fix it to make the index usable.
Please ask me to fix it on LinkedIn if you find that I am procrastinating.

![image.png](Smart%20Medical%20Search/image%201.png)