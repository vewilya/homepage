---
title: Maris Stella
date: 2026-11-04
location: Lucerne
description: A Rust-backed web app that draws the sky over a cloister in Wettingen and turns what passes overhead into music.
tags: [sonification, generative music, sound art, creative coding, rust, kontakt]
---

Maris Stella is a web application with a Rust backend that visualizes star constellations, satellites and planes on an enticing user interface. The centre of attention is the cloister Maris Stella in Wettingen, Aargau, Switzerland. It's the place where I teach piano and composition part-time, at the Kantonsschule Wettingen.

For an upcoming presentation of a new art subject I was involved in, I decided to create an application that not only visualizes these phenomena circling in the sky above us, but also does some beautiful sonification of these events. Each event triggers a MIDI message based on proximity, intensity and speed of movement. The MIDI message is sent to a Native Instruments Kontakt instance, where it is processed by two instruments from the software instrument and plugin developer Orchestral Tools. They are called Sequis and Arkhis, two really beautiful specimens of that Kontakt instrument world.

The application is still a work in progress. I plan to add more interaction between the physical phenomena, the visualizations and the musical output, including some more random aspects and morphing between sonic landscapes over longer time intervals. So far, this is what I've got. I'll keep you posted.

:video-embed{src="https://vimeo.com/1250047058" title="Maris Stella, first run" poster="/images/transmissions/maris-stella.webp"}
