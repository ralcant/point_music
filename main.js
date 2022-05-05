import {
  cursor,
  setupBoxesUI,
  gridOrigin,
  boxViewSize,
  changeBoxSize,
  resetUI,
  drawCursor,
} from "./setupUI.js";
import { createSounds, createPhraseSounds, resetSound } from "./sound.js";
import { DIRECTION_NAMES, BOXSIZE, CURSORRADIUS } from "./config.js";
import { GameState } from "./models.js";
import { resetLeap } from "./setupLeap.js";
import { record, stopRecording, resetRecord } from "./record.js";

// let SETUP_STATE = "setup";
// let PROCESSING_STATE = "processing";

let stateFeedback = document.getElementById("stateFeedback");
let phraseMakerIndex = 0;
// let gameState = new GameState({ state: "choose" });
let gameState = new GameState({ state: "intro" });
let isEasy = true; //Whether the phrase game is on easy mode
function getRandomPlayPhrase() {
  return getRandomFromArray(randomPhrases);
}
function getRandomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
let randomPhrases = [
  ["I'm", "a", "big", "potato"],
  ["I'm", "thinking", "a", "big", "storm", "is", "potato", "salad"],
  ["I'm", "thinking", "of", "a", "big", "potato", "salad"],
  ["A", "big", "potato", "salad", "I'm", "thinking", "of", "you"],
];
let playPhrase = null; //phrase to match
let lastWordIndex = null;

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

/*
Add stuff for  phrase songs

If words: ["A", "B"]
and timestamps = [100, 400]

then it means that 
  -"A" is pronounced from 0 to 100, and that
  -"B" is pronounced from 101 to 400 
*/
let phraseMakerSongs = {
  a_big_storm_is_coming: {
    displayName: "A big storm is coming",
    audioPath: "assets/phrases/a_big_storm_is_coming.mp3",
    isPhrase: true,
    //For now hardcoded information, check if can be deduced on-the-fly
    words: ["A", "big", "storm", "is", "coming"],
    //timestamps in miliseconds
    timestamps: [160, 340, 610, 900, 1230],
  },
  a_big_storm_is_coming_easy: {
    displayName: "A big storm is coming",
    audioPath: "assets/phrases/a_big_storm_is_coming_easy.mp3",
    isPhrase: true,
    //For now hardcoded information, check if can be deduced on-the-fly
    words: ["A", "big", "storm", "is", "coming"],
    //timestamps in miliseconds
    timestamps: [280, 1100, 1960, 2800, 3560],
  },
  im_thinking_of_you: {
    displayName: "I'm thinking of you",
    audioPath: "assets/phrases/im_thinking_of_you.mp3",
    isPhrase: true,
    words: ["I'm", "thinking", "of", "you"],
    timestamps: [150, 440, 680, 800],
  },
  im_thinking_of_you_easy: {
    displayName: "I'm thinking of you",
    audioPath: "assets/phrases/im_thinking_of_you_easy.mp3",
    isPhrase: true,
    words: ["I'm", "thinking", "of", "you"],
    timestamps: [310, 970, 1660, 2370],
  },
  potato_salad_is_my_favorite: {
    displayName: "Potato salad is my favorite",
    audioPath: "assets/phrases/potato_salad_is_my_favorite.mp3",
    isPhrase: true,
    words: ["Potato", "salad", "is", "my", "favorite"],
    timestamps: [380, 910, 1220, 1400, 1770],
  },
  potato_salad_is_my_favorite_easy: {
    displayName: "Potato salad is my favorite",
    audioPath: "assets/phrases/potato_salad_is_my_favorite_easy.mp3",
    isPhrase: true,
    words: ["Potato", "salad", "is", "my", "favorite"],
    timestamps: [460, 1400, 2050, 2780, 3590],
  },
};
console.log(phraseMakerSongs);
// console.log(gridOrigin);
// console.log(boxViewSize);
/**
 *
 * @param {*} total_w how many division in width
 * @param {*} total_h how many division in height
 * @param {*} chosen_w chosen division (0-index)
 * @param {*} chosen_h chosen division (0-index)
 * @returns coordinates of the topleft box centered in the given grid
 */
function getBoxPositionGrid(chosen_w, chosen_h, total_w, total_h) {
  let [viewWidth, viewHeight] = boxViewSize;
  let [gridWidth, gridHeight] = [viewWidth / total_w, viewHeight / total_h];
  let topleftGrid = [
    gridOrigin[0] + chosen_w * gridWidth,
    gridOrigin[1] + chosen_h * gridHeight,
  ];
  let centerGrid = [
    topleftGrid[0] + gridWidth / 2,
    topleftGrid[1] + gridHeight / 2,
  ];
  //centerGrid will be the same as centerBox
  let topleftBox = [centerGrid[0] - BOXSIZE / 2, centerGrid[1] - BOXSIZE / 2];
  return topleftBox;
}
let phraseMakerTemplates = [
  {
    displayName: "Template #1: Upwards triangle",
    songs: [
      phraseMakerSongs.a_big_storm_is_coming_easy,
      phraseMakerSongs.im_thinking_of_you_easy,
      phraseMakerSongs.potato_salad_is_my_favorite_easy,
    ],
    songsHard: [
      phraseMakerSongs.a_big_storm_is_coming,
      phraseMakerSongs.im_thinking_of_you,
      phraseMakerSongs.potato_salad_is_my_favorite,
    ],
    boxPositions: [
      getBoxPositionGrid(0, 2, 3, 3),
      getBoxPositionGrid(1, 0, 3, 3),
      getBoxPositionGrid(2, 2, 3, 3),
    ],
  },
  {
    displayName: "Template #2: Downwards triangle",
    songs: [
      phraseMakerSongs.im_thinking_of_you_easy,
      phraseMakerSongs.potato_salad_is_my_favorite_easy,
      phraseMakerSongs.a_big_storm_is_coming_easy,
    ],
    songsHard: [
      phraseMakerSongs.im_thinking_of_you,
      phraseMakerSongs.potato_salad_is_my_favorite,
      phraseMakerSongs.a_big_storm_is_coming,
    ],
    boxPositions: [
      getBoxPositionGrid(0, 0, 3, 3),
      getBoxPositionGrid(1, 2, 3, 3),
      getBoxPositionGrid(2, 0, 3, 3),
    ],
  },
];
console.log(phraseMakerTemplates);

// sendCurrentSongs();

function reset() {
  // gameState.setState("choose");
  gameState.setState("intro");

  gameState.set("songs", []);
  stateFeedback.innerText = "";
  chosenIndices = [];
  playPhrase = [];
  isEasy = true;
  difficultyLevel.innerText = "EASY";
  optionPhrase.classList.remove("option-chosen");
  optionMix.classList.remove("option-chosen");

  updateChooseUI();
  resetUI();
  resetRecord();
  resetLeap();
  resetSound();

  removeAllBoxes();
}
function removeAllBoxes() {
  console.log("removing all boxes...");
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
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Draws the chosen songBoxes template
 */
function sendCurrentPhraseSongs() {
  let currentTemplate = phraseMakerTemplates[phraseMakerIndex];
  let songs;
  if (isEasy) {
    songs = currentTemplate.songs.map((song, i) => {
      let newSong = {
        ...song,
        screenPosition: currentTemplate.boxPositions[i],
      };
      return newSong;
    });
  } else {
    songs = currentTemplate.songsHard.map((song, i) => {
      let newSong = {
        ...song,
        screenPosition: currentTemplate.boxPositions[i],
      };
      return newSong;
    });
  }
  gameState.setSongs(songs); //TODO: unclear if necessary
  templateName.innerText = currentTemplate.displayName;
  setupBoxesUI(songs);
}
/**
 * Only in choose state, going to arrange state
 * Draws the chosen songs (defined by chosenIndices)
 */
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
  setupBoxesUI(songs);

  // create the current Songs
  let audioPaths = chosenIndices
    .map((i) => currentSongs[i - 1])
    .map((song) => song.audioPath);
  createSounds(audioPaths);
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
function updatePhraseUI(phrase) {
  playPhraseContainer.innerHTML = "";
  for (let [i, word] of phrase.entries()) {
    let newHTML = `
      <div class="word" id="word-${i}">
      ${word}
      </div>
    `;
    playPhraseContainer.insertAdjacentHTML("beforeend", newHTML);
  }
  console.log("Updated phrase container");
}

/**
 * Draws cursor, creates sounds
 */
function setupPlayground() {
  let cursorTopleft = getBoxPositionGrid(1, 1, 3, 3);
  let cursorCenter = [
    cursorTopleft[0] + CURSORRADIUS,
    cursorTopleft[1] + CURSORRADIUS,
  ];
  drawCursor(cursorCenter);
  let currentTemplate = phraseMakerTemplates[phraseMakerIndex];
  // Now create sound objects
  let songs = isEasy ? currentTemplate.songs : currentTemplate.songsHard;
  let audioPaths = songs.map((song) => song.audioPath);
  let timestamps = songs.map((song) => song.timestamps);
  let words = songs.map((song) => song.words);
  playPhrase = getRandomPlayPhrase();
  console.log("Chosen playPhrase:");
  console.log(playPhrase);
  updatePhraseUI(playPhrase);
  gameState.set("playPhrase", playPhrase);
  resetSound();
  createPhraseSounds(audioPaths, timestamps, words);
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
  if (gameState.get("state") === "intro") {
    if (userSaid(["play", "phrase", "maker"])) {
      optionPhrase.classList.add("option-chosen");
      sleep(1000).then(() => {
        stateFeedback.innerText = "Playing Phrase Maker...";
        gameState.setState("phraseArrange");

        sendCurrentPhraseSongs();
      });
    }
    if (userSaid(["mix", "music"])) {
      optionMix.classList.add("option-chosen");
      sleep(1000).then(() => {
        gameState.setState("choose");
        stateFeedback.innerText = "Lets mix some music...";
      });
    }
  } else if (gameState.get("state") === "phraseArrange") {
    if (userSaid(["next"])) {
      //show following suggestion
      resetUI();
      gameState.set("songs", []);
      removeAllBoxes();
      phraseMakerIndex = (phraseMakerIndex + 1) % phraseMakerTemplates.length;
      sendCurrentPhraseSongs();
    }
    if (userSaid(["continue"])) {
      setupPlayground();

      gameState.setState("play");
    }
  } else if (gameState.get("state") === "play") {
    if (userSaid(["and", "end", "finish"])) {
      stateFeedback.innerText = "Going back hoe...";

      reset();
    } else if (userSaid(["change", "mode"])) {
      isEasy = !isEasy;
      difficultyLevel.innerText = isEasy ? "EASY" : "HARD";
      resetUI();
      removeAllBoxes();
      sendCurrentPhraseSongs();
      setupPlayground();
    } else if (userSaid(["another"])) {
      //Get another playPhrase
      playPhrase = getRandomPlayPhrase();
      console.log("Chosen playPhrase:");
      console.log(playPhrase);
      updatePhraseUI(playPhrase);
      gameState.set("playPhrase", playPhrase);
    }
  } else if (gameState.get("state") === "choose") {
    console.log("enter...");

    if (userSaid(["continue"])) {
      gameState.setState("arrange");
      stateFeedback.innerText = "Going from choose to arrange...";
      sendCurrentSongs();
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
      // stateFeedback.innerText =
      // "Grab and drop boxes as you see fit! (hand over the LeapMotion)";
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

export {
  processSpeech,
  handlekeyTap,
  gameState,
  addSong,
  sleep,
  getRandomPlayPhrase,
  updatePhraseUI,
};
