# Garden Watering System

Text: Automating the watering of my home garden because I’m forgetful.

## Context

I am a forgetful person who has killed many plants. I water my plants whenever I remember that I should which leads to over-watering or under-watering. Not to be sexist, but my wife is the same.

Also, I wanted to do an electronics DIY project for years, especially using an ESP 32 which is a magical (and cheap) PCB.

Thus, my wife gave me an idea to automate the process and I pounced on it.

## 22/01/2025: Testing the ESP32

This little piece of hardware is an ESP 32. It’s a Microcontroller board with built-in Wi-fi capability. That means this small, bare bones piece of tech can connect to Wi-fi by itself, making it extremely usable.

![An ESP32 - WROOM Board in my hand.](Garden%20Watering%20System/905ea23b-bfd9-4308-9fdb-f190c0cea596.png)

The ESP32 also has some memory and obviously has a small processor. So you can put small programs on it and have it perform simple tasks and transfer data using the Wi-Fi.

It’s programmed using the Arduino IDE. I had never run an Arduino IDE and I also don’t know anything about the variant of C that is used to code in the Arduino IDE. The latter point doesn’t matter since I know passable Python and I still have AI (currently o3-mini-high) write all the code for me, so obviously I had AI write the code to test the ESP 32.

Here is the neat moment when my testing of the ESP32 was successful on my dirty af laptop (I keep it clean and it’s clean right now as I write on it).

![image.png](Garden%20Watering%20System/f7b876ec-2498-4d40-834a-33e7de5770d9.png)

Testing the Soil moisture 

## 08/02/2025: Testing the Soil Moisture Sensor

The moisture sensor is connected to one of the Analog Pins of the ESP32 and it is able to send a signal to the ESP32 about the amount of moisture its surrounded by.

The way the sensor works is that the amount of moisture present around it changes its capacitance. Thus a change is moisture, changes the electrical properties of the sensor, which changes the output of the sensor.

In the video below you can see that the value from the sensor comes down from ~3000 to ~2000 when I add it in the water filled cap.

[WhatsApp Video 2025-02-08 at 19.08.37 (1).mp4](Garden%20Watering%20System/WhatsApp_Video_2025-02-08_at_19.08.37_(1).mp4)

## 12/02/2025: Update

This is a Work in Progress. Currently I am waiting for many parts. 

I have ordered an ESP 32 Expansion board because this was the easiest way to arrange the wiring in my Project Box. A Project Box is a hard plastic box which will protect the electronics from heat, rain etc. when I keep them outside with my plants.

My Battery Housing didn’t have connectors at the end so I could not connect the wires to the ESP32. Thus, I have ordered a wire crimping tool and crimping connectors. I’ll add the connectors myself.

There is an issue with the ESP32’s power requirements and my power source. The ESP32 requires a steady 3.3 V but my two 1.5V cells will only provide 3V. This may result in an unstable system but I’ll check and find out. My guess is that since the usage of the ESP32 will be very low, each set of batteries can give me a few months. Otherwise I’ll need to get a DC-DC converter.

## 15/02/2025: Update

I got the gadget working. The issue with the power supply needs to be sorted for a robust deployment but this is actually not bad. I will monitor the battery and see how long it lasts.

![image.png](Garden%20Watering%20System/image.png)