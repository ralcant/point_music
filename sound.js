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

function playAudio(audioName) {
  //pause everything else
  sound.stop();
  //   for (let name of ["first", "second", "third"]) {
  //     // console.log(name);
  //     pauseAudio(name);
  //   }
  for (let button of Object.values(BUTTONS)) {
    button.classList.remove("side-item-chosen");
  }
  BUTTONS[audioName].classList.add("side-item-chosen");
  sound.play(audioName);
}

function pauseAudio(audioName) {
  sound.stop(audioName);
}

export { playAudio };
