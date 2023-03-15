# mushroomExhibition
Collaboration with Diana Puntar on using sensor data collected by Arduino to drive music.

This was an idea that started off back in October 2022 where Diana was originally putting together a team of cross-curricular activities to take place around her ongoing project "The Milky Way". As a part of the Music team I knew we should get involved in some way and some early ideas surrounded students composing music that stemmed from one cell or music that explored the structures of mushrooms. 

After some more meetings, we had watched [a few videos](https://www.youtube.com/watch?v=Jivuu_cNnYI) of people using mushrooms physically as a means of music production, often in conjunction with a modular synthesizer (an expensive venture which I felt might not yet be appropriate for the department at Eltham College). However the idea of having the mushrooms play an active role in the creation of music inspired me, so I began some extensive research into how I could DIY this.



## How the hardware works
Looking further into the technology used with the modular synthesizer, it relied on electrodes being placed onto the mushrooms to collect data based on the conductivity/resistance of their outer layer. During my research I found out that this was similar in usage to some aspects of polygraph tests which measure the conductivity of human skin to produce their results. However the resistance of the mushroom in this case is often used as part of a circuit, which in turn produces a signal that can be used in other applications. I had to revise some of my circuit knowledge from A-level Physics but found great resources online and from within the school to aid me in this.

Something that was instrumental in the research for the right components and general circuitry was the Biodata Sonification project designed by Sam Cusumano from Electricity for Progress, it was his circuit diagrams and descriptions of how the system worked that really made it clear this was entirely possible to achieve. Here's a [link](https://electricityforprogress.com/biodata-sonification/) to his blog describing the process.

After sourcing all of the hardware (many thanks to Geoffrey Ward, the Physics technician who supplied me with very crucial capacitors) and a lot of trial and error, I had the circuit working as expected (it made a light flicker on **_and_** off!) The next step was to then be able to have this interact with the computer.

![PXL_20230207_231711487 (2)](https://user-images.githubusercontent.com/127994356/225443775-63e02fe7-6f63-43aa-9257-f7c2bf08abab.jpg)


## How the software works
Whilst studying Music at the University of Sussex, a few projects that I completed involved the synthesis of code with music to great results, almost the entirety of my third year final project was written in Javascript. As such I decided to implement this as the key way of interpreting the data from the mushroom sensor into music. I used an [Arduino Uno](https://www.arduino.cc/en/Guide/Introduction), a microcontroller that has a variety of applications, as a means to power and take data from the circuit. This was then fed into a Javascript program.

I am a great supporter of the [p5.js library](https://p5js.org/), a Javascript library designed for creatives across multiple fields. It is incredibly versatile and has always served me well as it provides great visual and audio implementations. Drawing upon my prior knowledge with the library, I set to work putting together a program that would take this initial data from the mushroom sensor and turn into something musical. I returned back to the original videos for inspiration and took down a list of expected uses, eventually landing on a band system, where the frequency produced by the circuit timer would activate aspects of the musical code when falling into certain ranges. ![Band Diagram](https://user-images.githubusercontent.com/127994356/225447600-ea18d09f-6e1c-4e33-baa1-d164b01bc30a.png)

## The composition process
This was then when I began working with the Lower Sixth Music class to brainstorm what the musical output should sound like, how the bands will impact the composition and how to shape the project to make it their own. We decided the best course of action was to record a set of loops that would be triggered and treated by the program and that, in keeping with the theme of mushrooms and connections, the loops would all stem from a common ground. We settled on a list of key elements and effects that would be utilised, settling on the key that the composition would center around and the rough length of each clip. They then went away and followed up with a total of 15 loops which were then utilised for the composition. 

![PXL_20230301_132629701 (2)](https://user-images.githubusercontent.com/127994356/225449452-77c7cc21-b23b-4ce7-9053-46bb7e632c8f.jpg)

After a lot of testing, debugging and adding more and more functionality and visuals, the project was finally complete and ready to properly test live on the mushrooms themselves, and I was very pleased to see that everything worked exactly as expected on the first try! 

[vlc-record-2023-03-15-21h28m11s-PXL_20230310_110614171.mp4-.webm](https://user-images.githubusercontent.com/127994356/225454477-3eccdbba-4283-42fb-9700-61f5ce61cfb9.webm)


## The final result
The rest of the time since that first test has been spent refining and developing the code, with frequent demos with the Lower Sixth to get their well-needed feedback. With some now quite intricate and thorough design, I'm very pleased with how it has turned out and hope you enjoy the sonic landscape it provides to the exhibition. I've provided as a part of this Github repo all of the code I used along with the necessary libraries to run it. As a part of the testing process I made a simulator that allowed the project work without the hardware so please do go and explore this for yourself. Here's a demo of what it looks and sounds like in action:

https://user-images.githubusercontent.com/127994356/225460884-8061f6d6-717a-4c71-b767-53777af571bf.mp4


**I have enjoyed the time I have spent on this project immensly, it wouldn't have been possible without the encouragement from Diana and Katie, the Lower Sixth Music class, Ajit and Geoff from Physics, Simon supporting from Science week, and of course my wonderful colleagues in the Music department. I look forward to seeing what the next project might be and am eager to continue exploring anew.**
