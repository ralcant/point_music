# Point Music, by Raul Alcantara

This project was my final project for the MIT Class 6.835: Multimodal Interfaces, on Spring 2022

## Required setup

Make sure you have a Leap connected to your computer

## How to run

After cloning this repository and `cd` into it, you can run `python -m http.server` to start up a server for this website. After that, you can go to `localhost:8000` to see and interact with the website

## Development

Here's a breakdown of the different files and folders in this repository, and what's their purpose.

- **lib/**: These are external library files. In particular, there is .min.js and .css files for Backbone.js, Famous Engine, Leapjs and Underscore.js
- **assets/**: Here are the different data used in the website like images or prerecorded audios. It's also worth noting that when recording audio from microphone within the app, the system assumes you will save it on the **assets/recordings** folder
- **config.js**: Any global variables like the size of boxes or the cursor
- **models.js**: Where all the models (that use Backbone) are defined. Here is where gameState is defined.
- **record.js**: Exports functions `record` and `stopRecording` for programatically control the recording capabilities of the system.
- **setupLeap.js**: Here's where the `Leap.loop` happens. It also exports a variable `selectedBoxIndex` so that the system can know which box is currently hovered.
- **setupSpeech.js**: Speech Recognition setup
- **setupUI.js**: Exports methods for create and rendering new boxes, the cursor and such. This is the file that uses Famous Engine.
- **sound.js**: Handles all the different sounds in the system, with functions for playing/pausing an audio. This uses Howler.js
- **main.js**: Here's where all of the SpeechRecognition happens, and where the logic behind each speech command happens

## Note

As mentioned in the paper, the Speech Recognition doesn't work super well, so sometimes you may need to speak a bit louder for a speech command to work. If it's any help, any time the Speech Recognition processes a transcript, this will get logged on the console.

Also, the hope is that every time you go from Phrase Maker or Music Mix to the intro page then everything that should be resetted gets resetted. However, if at any time something doesn't quite seem to make sense, it might be a bug and so you may want to Hard refresh (Click refresh while pressing Shift) and go to the option you want.
