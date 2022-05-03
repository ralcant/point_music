import {
  cursor,
  setupBoxesUI,
  getIntersectingBox,
  gridOrigin,
  changeBoxSize,
  resetUI,
} from "./setupUI.js";
import { createSounds, resetSound } from "./sound.js";
import { DIRECTION_NAMES, BOXSIZE } from "./config.js";
import { GameState } from "./models.js";
import { resetLeap } from "./setupLeap.js";
import { record, stopRecording, resetRecord } from "./record.js";

// let SETUP_STATE = "setup";
// let PROCESSING_STATE = "processing";

let stateFeedback = document.getElementById("stateFeedback");

// List of {displayName: , audioPath}
// TODO: get this info from a json file locally
let currentSongs = [
  { displayName: "Ba", audioPath: "assets/ba.mp3" },
  { displayName: "Dum", audioPath: "assets/dum.mp3" },
  { displayName: "Tss", audioPath: "assets/tss.mp3" },
];
// 1-indexed
let chosenIndices = [];
//TODO: Make it an initialize function
//TODO: Only for testing purposes
let gameState = new GameState({ state: "choose" });

// sendCurrentSongs();

// function isProcessing() {
//   return state === PROCESSING_STATE;
// }
function reset() {
  gameState.setState("choose");
  gameState.set("songs", []);
  stateFeedback.innerText = "";
  chosenIndices = [];
  updateChooseUI();
  resetUI();
  resetRecord();
  resetLeap();
  resetSound();

  //removing all boxes
  //TODO: Figure out if there is a better way, maybe using the mainContext variable from setupUI.js
  document.querySelector(".famous-container").remove();
}
function handlekeyTap() {
  // let directionName = DIRECTION_NAMES[lastDirection];
  // leapFeedback.innerText = `Repeating ( ${directionName})`;
  // console.log(`Repeating ( ${directionName})`);
  // playAudio(DIRECTION_AUDIO_MAPPING[directionName]);
}
function updateChooseUI() {
  chooseState.innerHTML = "";
  let innerHTML = `
  <h2>Available songs (selected ones are in yellow)</h2>
  <div id="currentSongsContainer" style="display:flex;flex-wrap:wrap;">
  </div>
  `;
  chooseState.insertAdjacentHTML("afterbegin", innerHTML);
  currentSongs.forEach(({ displayName, audioPath }, i) => {
    let borderColor = chosenIndices.indexOf(i + 1) !== -1 ? "yellow" : "white";
    let newHTML = `
    <div song-id="${
      i + 1
    }" style="border: 2px solid ${borderColor}; background-color: ${borderColor}; display:flex;flex-direction:column;align-items:center; margin: 2px; padding: 2px; border-radius:20px;">
      <span><strong>#${i + 1}: ${displayName}</strong></span>
      <audio audio-id=${i + 1} src=${audioPath} controls></audio>
    </div>
    `;
    currentSongsContainer.insertAdjacentHTML("beforeend", newHTML);
  });
  // chosenIndices((songIndex, i) => {
  //   let newHTML = `
  //   `;
  // });
}
updateChooseUI();
//TODO: USE PROMISES FOR THIS -- TOO HACY
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function sendCurrentSongs() {
  let songs = [];
  for (let [i, songIndex] of chosenIndices.entries()) {
    console.log(songIndex);
    let newSong = currentSongs[songIndex - 1];
    // TODO: Set a more pleasently-looking arrangement
    newSong["screenPosition"] = [
      gridOrigin[0] + i * (BOXSIZE + 10), //5 as padding
      gridOrigin[1],
      0,
    ];
    songs.push(newSong);
  }
  gameState.setSongs(songs);
  setupBoxesUI();
}
function addSong(displayName, audioPath) {
  currentSongs.push({ displayName, audioPath });
  updateChooseUI();
  stateFeedback.innerText = "Say continue to go to the next round";
}
let NUMBER_NAMES = {
  zero: 0,
  one: 1,
  two: 2,
  to: 2, //seems to help
  three: 3,
  four: 4,
  for: 4, //seems to help
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
};
function getNumber(lastWord) {
  lastWord = lastWord.toLowerCase();
  let x = parseInt(lastWord);
  if (x) return x;
  if (lastWord in NUMBER_NAMES) {
    return NUMBER_NAMES[lastWord];
  }
  return null;
}
function processSpeech(transcript) {
  let userSaid = function (commands, ignoreCase = true) {
    let str = transcript;
    let curr_str = ignoreCase ? str.toLowerCase() : str;
    for (var i = 0; i < commands.length; i++) {
      let curr_command = ignoreCase ? commands[i].toLowerCase() : commands[i];
      if (curr_str.indexOf(curr_command) > -1) {
        processed = true;
        return true;
      }
    }
    return false;
  };
  let processed = false;
  console.log(gameState.get("state"));
  if (gameState.get("state") === "choose") {
    console.log("enter...");

    if (userSaid(["continue"])) {
      gameState.setState("arrange");
      stateFeedback.innerText = "Going from choose to arrange...";
      sendCurrentSongs();
      // send the current Songs
      let audioPaths = chosenIndices
        .map((i) => currentSongs[i - 1])
        .map((song) => song.audioPath);
      createSounds(audioPaths);
    } else if (userSaid(["add", "at", "select"])) {
      //Assumed that it said "add i"
      console.log("adding...");
      let words = transcript.split(" ");
      let i = getNumber(words[words.length - 1]);
      //Only add new numbers
      if (
        !isNaN(i) &&
        i !== null &&
        i <= currentSongs.length &&
        chosenIndices.indexOf(i) === -1
      ) {
        console.log(i);
        chosenIndices.push(i);
      }
      updateChooseUI();
    } else if (userSaid(["remove", "delete"])) {
      //Assumed that it said "remove i"
      let words = transcript.split(" ");
      let i = getNumber(words[words.length - 1]);
      //Only delete existent, valid indices
      if (
        !isNaN(i) &&
        i !== null &&
        i <= currentSongs.length &&
        chosenIndices.indexOf(i) != -1
      ) {
        console.log(i);
        chosenIndices.splice(chosenIndices.indexOf(i), 1);
      }
      updateChooseUI();
    } else if (userSaid(["play"])) {
      console.log("Trying to play...", transcript);
      //Assumed that it said 'play i'
      let words = transcript.split(" ");
      let i = getNumber(words[words.length - 1]);
      console.log(i);
      if (!isNaN(i) && i != null && i <= currentSongs.length) {
        console.log(`[audio-id="${i}"]`);
        console.log(document.querySelector(`[audio-id="${i}"]`));
        document.querySelector(`[audio-id="${i}"]`).play();
      }
    } else if (userSaid(["record"])) {
      //Start recording
      console.log("start to record");
      stateFeedback.innerText = "You will start recording in 5s... get ready!";
      //Wait 5s so that the user is ready
      sleep(5000).then(() => {
        stateFeedback.innerText = "Recording...";
        record("test.mp3"); //save to assets/ folder
        updateChooseUI();
      });

      //Add to possible options
      // let displayName = "Recorded #" + (currentSongs.length + 1);
      // let audioPath = "Recorded audio #" + (currentSongs.length + 1);
      // currentSongs.push({ displayName, audioPath });
    } else {
      // stateFeedback.innerText = "Say continue to go to the next round";
    }
  } else if (gameState.get("state") === "arrange") {
    if (userSaid(["continue"])) {
      gameState.setState("compose");
      stateFeedback.innerText = "Going from arrange to compose...";
      // processed = true;
    } else if (userSaid(["reduce", "less"])) {
      // Reduce size of selected box (if any)
      changeBoxSize(0.9);
    } else if (userSaid(["increase", "more"])) {
      // increase size of selected box (if any)
      changeBoxSize(1.1);
    } else {
      stateFeedback.innerText =
        "Grab and drop boxes as you see fit! (hand over the LeapMotion)";
    }
  } else if (gameState.get("state") === "compose") {
    if (userSaid(["and", "end", "finish"])) {
      // TODO: save the audio to mp3
      stateFeedback.innerText = "Saving to mp3...";
      console.log("Saving to mp3!");
      reset();

      // processed = true;
    } else if (userSaid(["repeat"])) {
      //TODO: Only for testing
      repeatLast();
      // processed = true;
    } else {
      stateFeedback.innerText = "Time to make music!... (say 'end' to finish)";
    }
  }
  return processed;
}

export { processSpeech, handlekeyTap, gameState, addSong };
