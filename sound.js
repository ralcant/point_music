let BUTTONS = {
  first: document.getElementById("item-first"),
  second: document.getElementById("item-second"),
  third: document.getElementById("item-third"),
};
let buttonPlayers = Array.from(document.querySelectorAll("[play-audio]"));
console.log(buttonPlayers);
buttonPlayers.forEach((button) => {
  let val = button.getAttribute("play-audio");
  console.log(val);
  button.addEventListener("click", () => {
    playAudio(val);
  });
});
let buttonPausers = Array.from(document.querySelectorAll("[pause-audio]"));
console.log(buttonPausers);
buttonPausers.forEach((button) => {
  let val = button.getAttribute("pause-audio");
  console.log(val);
  button.addEventListener("click", () => {
    pauseAudio(val);
  });
});
let allSounds = [];
let currentIndex = null; //index of the current audio playing
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

function playAudioFromIndex(audioIndex) {
  //If something's playing, stop it
  if (currentIndex === null && audioIndex !== null) {
    console.log("Just started - playing");
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

export { playAudioFromIndex, createSounds, resetSound };
