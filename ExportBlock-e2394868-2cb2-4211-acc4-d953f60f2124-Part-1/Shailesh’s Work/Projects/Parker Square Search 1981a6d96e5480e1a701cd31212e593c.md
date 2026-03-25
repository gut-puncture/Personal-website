# Parker Square Search

Text: Trying to solve an unsolved maths problem of a 3x3 grid of perfect squares, where each row, column and diagonal add up to the same number.

## Context

This is a nerdy project and I have only allocated a few hours to it and do not intend to allocate any more time to it.

Basically this guy called [Matt Parker](https://www.youtube.com/@standupmaths) made the below Numberphile Video about magic squares of perfect square numbers. He shares a solution which he says almost works, but is an abysmal attempt. This abysmal solution which doesn’t work is dubbed a “Parker Square” and since then the term has been used to describe bad maths.

[https://www.youtube.com/watch?v=aOT_bG-vWyg](https://www.youtube.com/watch?v=aOT_bG-vWyg)

There have been many more videos made about the Parker Square and the maths behind it. People have been trying to find one for years, more so since the video came out 8 years ago.

But no one has found one and they’ve checked numbers till 10^19.

My attempt is shot in the dark to with not a lot of optimisations.
BTW, a non-trivial solution might not even be possible since a paper has proved that solutions exist for all grids 4x4 and larger and finding a 3x3 square is more difficult and we haven’t found it after years of trying.

## The Mathematical Reduction

The requirement is to get 9 distinct integer perfect squares which satisfy the conditions of a Magic Square. Finding the 9 numbers through brute force is futile and not fun at all. So I’ve woked with o3-mini-high and Gemini 2.0 Pro to arrive at a way to algebraically reduce the number of variables down to just 1.

This is a very short explanation. Please refer to the [ReadMe of the GitHub repo](https://github.com/gut-puncture/Parker-Square-Search?tab=readme-ov-file#finding-a-parker-square) for a detailed explanation.

The 9 numbers of the square can be reduced to three variables: a, e and c. Then these variables are again written in terms of X, Y, U and V. 

This is done so that we can write these two equations: 

Y² - 2X² = D 

V² - 2U² = D

This is done for two reasons:

1. Both these equations are a version of the standard "Pell Equation" and the solutions to all Pell Equations can be algorithmically generated. So for a value of D you can find infinite X, Y, U and V’s.
2. The first point means that for a random value of D, I can find X, Y, U and V and with these 4 variables, I can find a, e and c. And with a, e and c, I can find the all 9 numbers of the Parker square.

This mathematical reduction means that I only have to iterate over 1 variable (D) and can generate all others, with the constraints of the Parker Square still encoded.

## How you can help

If you have access to a lot of compute, please run my code (https://github.com/gut-puncture/Parker-Square-Search) to perform this search. I currently keep a Google Colab instance open and keep running it for hours. 

Optimisations to the code are very welcome, in fact, encouraged.