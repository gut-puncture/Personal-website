---
title: "Garden Watering System"
slug: "garden-watering-system"
group: "side-quests"
order: 3
year: "2025"
kind: "Hardware"
summary: "A home-built gadget to automate watering my plants: an ESP32 Wi-Fi microcontroller reading a soil moisture sensor, sealed in a weatherproof box in a planter. The sensing unit works; its battery power is not yet reliable."
status: "Sensing unit working in a planter; power supply still to be sorted."
links: []
aliases: ["garden watering system", "plant watering", "the garden project", "ESP32 project", "soil moisture sensor", "automatic plant watering"]
agent: >
  The Garden Watering System is a hardware side project Shailesh started in early
  2025 to automate watering his home garden, because he forgot to water his plants
  and they ended up over or under watered. It was also his first electronics
  project, something he had wanted to do for years. It uses an ESP32, a cheap
  microcontroller board with built-in Wi-Fi, programmed in the Arduino IDE with
  code written by an AI model, o3-mini-high. A capacitive soil moisture sensor is
  wired to one of the board's analog pins; its reading fell from about 3000 to
  about 2000 when he dipped it in water. By mid-February 2025 the board and sensor
  were working inside a weatherproof project box placed in a planter. One problem
  remained: the ESP32 needs a steady 3.3 volts, but two 1.5 volt cells give only
  3 volts. He planned to watch how long the batteries lasted and add a DC-DC
  converter if needed.
---

This is a gadget to automate watering my home garden. An ESP32 (a cheap microcontroller board with built-in Wi-Fi) reads a soil moisture sensor, and the electronics sit in a weatherproof box in the planter.

The sensing unit works and is installed. One problem is open: the battery power supply is not steady enough for a reliable long-term setup.

![The ESP32 board in its open white project box, wired to a soil moisture sensor pushed into the soil of a terracotta planter beside a young plant](/media/garden-watering-system/installed-in-planter.png)

## How it works

The ESP32 has a small processor, some memory and its own Wi-Fi, so it can run small programs and send data without a computer. It is programmed in the Arduino IDE. I had never used Arduino and do not know its variant of C, so an AI model, o3-mini-high, wrote all the code.

![An ESP32-WROOM board held between finger and thumb](/media/garden-watering-system/esp32-board.png)

The soil moisture sensor connects to one of the ESP32's analog pins. Moisture around the sensor changes its capacitance, which changes its output.

![Video of the watering system running](/media/garden-watering-system/moisture-sensor-test.mp4)

*The sensor reading drops from about 3000 to about 2000 when I put the sensor in a cap filled with water.*

## Build log

- 22 January 2025: tested the ESP32. It connected to Wi-Fi.
- 8 February 2025: tested the soil moisture sensor.
- 12 February 2025: waiting on parts. I ordered an ESP32 expansion board to make wiring the project box easier, and a crimping tool and connectors because my battery housing had no connectors.
- 15 February 2025: got the gadget working in the planter.

## The power problem

The ESP32 needs a steady 3.3 V, but my two 1.5 V cells give only 3 V. That may make the system unstable. Because the ESP32 is used so little, I expect each set of batteries to last a few months. I will monitor the battery, and if it does not hold up, I will add a DC-DC converter.

## Why I built it

I am forgetful and have killed many plants. I watered them whenever I remembered, which meant too much or too little. I had also wanted to do an electronics project for years, especially with an ESP32, which is a magical (and cheap) board. My wife suggested automating the watering, and I pounced on it.
