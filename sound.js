import { sleep } from "./main.js";
import { gameState } from "./main.js";

let BUTTONS = {
  first: document.getElementById("item-first"),
  second: document.getElementById("item-second"),
  third: document.getElementById("item-third"),
};
let buttonPlayers = Array.from(document.querySelectorAll("[play-audio]"));
// console.log(buttonPlayers);
buttonPlayers.forEach((button) => {
  let val = button.getAttribute("play-audio");
  // console.log(val);
  button.addEventListener("click", () => {
    playAudio(val);
  });
});
let buttonPausers = Array.from(document.querySelectorAll("[pause-audio]"));
// console.log(buttonPausers);
buttonPausers.forEach((button) => {
  let val = button.getAttribute("pause-audio");
  // console.log(val);
  button.addEventListener("click", () => {
    pauseAudio(val);
  });
});
let allSounds = [];
let currentIndex = null; //index of the current audio playing
let allPhraseSounds = [];
let allTimestamps = [];
let allWords = [];
let currentPhraseIndex = null; //index of the current phrase audio playing
let currentSprite = 0; //within the selected sound, which sprite is being played

function getSpriteKey(index) {
  return `key-${index}`;
}
let wowSound = new Howl({
  src: "assets/sound_effects/wow.mp3",
});
/**
 * Creates sound objects when audio is a phrase
 * @param {*} audioPaths list of mp3 path
 * @param {*} timestamps list of timestamps
 * @param {*} allWords list of list of words
 * @returns
 */
function createPhraseSounds(audioPaths, timestamps, words) {
  // console.log(audioPaths);
  // console.log(timestamps);
  // console.log(words);

  allTimestamps = timestamps;
  allWords = words;
  for (let [i, audioPath] of audioPaths.entries()) {
    let sprite = {}; //index -> [start, end]
    for (let j = 0; j < timestamps[i].length; j++) {
      let start = j > 0 ? timestamps[i][j - 1] + 1 : 0;
      let end = timestamps[i][j];
      let duration = end - start;
      sprite[getSpriteKey(j)] = [start, duration];
    }
    // console.log(sprite);
    let sound = new Howl({
      src: audioPath,
      sprite: sprite,
      // onend: () => {
      //   if (currentSprite < timestamps.length - 1){
      //     // finished a sprite, play the next one

      //   }
      // },
    });
    // sound.rate(0.5);
    sound.on(
      "end",
      function () {
        if (currentSprite < timestamps[i].length - 1) {
          // sleep(2000).then(() => {
          //finished a sprite, show the text and play the next one
          //show text in screen
          // console.log(`Current Sprite ${currentSprite}`);
          // console.log(`Current phrase index ${currentPhraseIndex}`);
          let newWord = allWords[currentPhraseIndex][currentSprite];
          gameState.detectNewWord(newWord);
          // let previous = playPhraseContainer.innerText;
          // previous += ` ${newWord}`;
          // playPhraseContainer.innerText = previous;
          //play the next one
          currentSprite += 1;
          this.play(getSpriteKey(currentSprite));
          // });
        } else {
          //finished all sound
          let newWord = allWords[currentPhraseIndex][currentSprite];
          // let previous = playPhraseContainer.innerText;
          // previous += ` ${newWord}`;
          // playPhraseContainer.innerText = previous;
          gameState.detectNewWord(newWord);
          currentSprite = 0;
          this.play(getSpriteKey(currentSprite));
        }
      }.bind(sound)
    );
    allPhraseSounds.push(sound);
  }
}
/**
 * Creates new Sound objects, when the audio is NOT a phrase
 * @param {*} audioPaths
 * @returns
 */
function createSounds(audioPaths) {
  for (let [i, audioPath] of audioPaths.entries()) {
    let sound = new Howl({
      src: audioPath,
      // onend: () => {
      //   currentIndex = null;
      // },
    });
    allSounds.push(sound);
  }
  return allSounds;
}
function resetSound() {
  allSounds = [];
  currentIndex = null;
  allPhraseSounds = [];
  currentPhraseIndex = null;
  allTimestamps = [];
}
let sound = new Howl({
  src: "assets/rickroll_10s.mp3",
  sprite: {
    first: [0, 2000],
    second: [2000, 2000],
    third: [4000, 2000],
  },
});

// let sound = new Howl({
//   src: "assets/boburnham_short.mp3",
//   sprite: {
//     first: [2700, 1400],
//     second: [4100, 1100],
//     third: [5200, 1000],
//   },
// });
function playPhraseAudioFromIndex(audioIndex) {
  //If nothing is playing and valid index, play the audio
  if (currentPhraseIndex === null && audioIndex !== null) {
    // console.log(audioIndex);
    // console.log(allPhraseSounds);
    // console.log(currentSprite);
    // console.log("Just started - playing");
    currentSprite = 0; // so that it starts from beginning
    currentPhraseIndex = audioIndex;
    allPhraseSounds[audioIndex].play(getSpriteKey(currentSprite)); //Here current sprite would be '0'
  }
  //audioIndex = null means the user has pull their hands
  //out of the boxes, so stop any ongoing audios
  if (audioIndex === null) {
    if (
      currentPhraseIndex != null
      // && allPhraseSounds[currentPhraseIndex].playing()
    ) {
      console.log("stopping audio...");
      // allPhraseSounds[currentPhraseIndex].seek(0, getSpriteKey(currentSprite));
      for (let sound of allPhraseSounds) {
        if (sound.playing()) {
          sound.stop();
        }
      }
      // allPhraseSounds[currentPhraseIndex].stop();
    }
    currentPhraseIndex = null;
  }
}
/**
 * @param {*} audioIndex
 */
function playAudioFromIndex(audioIndex) {
  //If something's playing, stop it
  if (currentIndex === null && audioIndex !== null) {
    // console.log("Just started - playing");
    allSounds[audioIndex].play();
    currentIndex = audioIndex;
  }
  // if (currentIndex !== null && currentIndex === audioIndex && !allSounds[currentIndex].isPlaying()) {
  //   console.log("")
  //   allSounds[audioIndex].stop();
  // }
  if (audioIndex === null) {
    if (currentIndex != null && allSounds[currentIndex].playing()) {
      allSounds[currentIndex].stop();
    }
    currentIndex = null;
  }
  // if (
  //   currentIndex != null &&
  //   (currentIndex === audioIndex || audioIndex === null)
  // ) {
  //   allSounds[currentIndex].stop();
  // }

  // if (currentIndex && currentIndex != audioIndex) {
  //   allSounds[currentIndex].stop();
  // }
  //   for (let name of ["first", "second", "third"]) {
  //     // console.log(name);
  //     pauseAudio(name);
  //   }
  // for (let button of Object.values(BUTTONS)) {
  //   button.classList.remove("side-item-chosen");
  // }
  // BUTTONS[audioName].classList.add("side-item-chosen");
  // sound.play(audioName);

  // TODO: Set audioIndex to null when audio has finished playing
  // allSounds[audioIndex].play();
  // currentIndex = audioIndex;
}

function pauseAudio(audioName) {
  sound.stop(audioName);
}

export {
  playAudioFromIndex,
  playPhraseAudioFromIndex,
  createSounds,
  createPhraseSounds,
  resetSound,
  wowSound,
};
