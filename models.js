import { BOXSIZE, CURSORRADIUS } from "./config.js";
import { wowSound } from "./sound.js";
import { getRandomPlayPhrase, updatePhraseUI } from "./main.js";

function getAveragePosition(positions) {
  let totX = 0;
  let totY = 0;
  positions.forEach((position) => {
    let [x, y] = position;
    totX += x;
    totY += y;
  });
  let avgX = totX / positions.length;
  let avgY = totY / positions.length;
  return [avgX, avgY];
}
let FULL_SCREEN_STATES = ["intro", "choose"];
/**
 *
 * @param {*} a1
 * @param {*} a2
 * @returns min(abs(x)) for x [a1, a2]
 */
function getMinDistanceToOrigin(a1, a2) {
  // 0 is on the interval
  if (a1 * a2 < 0) {
    return 0;
  } else {
    return Math.min(Math.abs(a1), Math.abs(a2));
  }
}
let Cursor = Backbone.Model.extend({
  defaults: {
    screenPosition: [0, 0],
    history: [],
    numHistory: 10,
  },
  /**
   *
   * @param {*} topleft [X, Y] topleft of the rectangle
   * @param {*} dimension [w, h] dimension of the rectangle
   * @returns whether the cursor (as a circle) overlaps with the rectangles
   */
  overlaps: function (topleft, dimension) {
    let [x, y] = topleft;
    let [w, h] = dimension;
    let R = CURSORRADIUS;
    let [cx, cy] = this.get("screenPosition");
    let minDistanceX = getMinDistanceToOrigin(x - cx, x + w - cx);
    let minDistanceY = getMinDistanceToOrigin(y - cy, y + h - cy);
    return (
      Math.pow(minDistanceX, 2) + Math.pow(minDistanceY, 2) <= Math.pow(R, 2)
    );
  },
  setScreenPosition: function (position) {
    let history = this.get("history");
    let numHistory = this.get("numHistory");
    let foundPosition = [...position];
    if (history.length <= numHistory - 1) {
      history.push(foundPosition);
    } else {
      history.splice(0, 1); //delete the first
      history.push(foundPosition);
    }
    this.set("history", history);
    let avgPosition = getAveragePosition(history);
    // console.log(avgPosition);
    this.set("screenPosition", avgPosition);

    // this.set("screenPosition", position.slice(0));
  },
});
let SongBox = Backbone.Model.extend({
  defaults: {
    isDeployed: false,
    screenPosition: [0, 0],
    startPosition: [0, 0],
    displayName: "",
    audioPath: "",
    size: [BOXSIZE, BOXSIZE],
    isPhrase: false, // if true, then it should have non-empty words and timestamp information
    words: [], //only if `isPhrase`
    timestap: [], // only if `isPhrase`
  },
  setSize: function (size) {
    this.set("size", size);
  },
  setScreenPosition: function (position, mode = "topleft") {
    let newPosition;
    let [w, h] = this.get("size");
    let [x, y] = position;

    if (mode === "center") {
      newPosition = [x - w / 2, y - h / 2];
    } else if (mode === "topleft") {
      newPosition = [x, y];
    }
    this.set("screenPosition", newPosition);
  },
  reset: function () {
    this.set("screenPosition", [...this.get("startPosition")]);
  },
  getBbox: function () {
    //TODO: Check if this is correct event when setScreenPosition was called with "center"
    let [x, y] = this.get("screenPosition");
    let [w, h, _a] = this.get("size");
    console.log(w, h);
    return { minX: x, minY: y, maxX: x + w, maxY: y + h };
  },
  overlaps: function (otherBox) {
    let currBbox = this.getBbox();
    var otherBbox = otherBox.getBbox();
    return (
      currBbox.minX <= otherBbox.maxX &&
      otherBbox.minX <= currBbox.maxX &&
      currBbox.minY <= otherBbox.maxY &&
      otherBbox.minY <= currBbox.maxY
    );

    // return (
    //   a.start.row <= b.end.row &&
    //   a.end.row >= b.start.row &&
    //   a.start.col <= b.end.col &&
    //   a.end.col >= b.start.col
    // );
  },
});
let SongBoxSet = Backbone.Collection.extend({ model: SongBox });

/**
 * songs = list of {displayName: , audioPath: , screenPosition}
 */
let Board = Backbone.Model.extend({
  initialize: function ({ songs }) {
    let boxes = new SongBoxSet();
    songs.forEach((song) => {
      let { displayName, audioPath, screenPosition } = song;
      let isPhrase = song.isPhrase || false;
      let words = [];
      let timestamps = [];
      if (isPhrase) {
        words = song.words;
        timestamps = song.timestamps;
      }
      let songBox = new SongBox({
        displayName,
        audioPath,
        screenPosition,
        startPosition: screenPosition,
        isPhrase: isPhrase,
        words,
        timestamps,
      });
      boxes.add(songBox);
    });
    this.set("boxes", boxes);
  },
  reset: function () {
    this.initialize();
  },
  outOfBounds: function (box) {
    //To make sure a box is within some given bounds
    return false;
  },
  deployBox: function (box) {
    if (this.outOfBounds(box)) {
      return false;
    }
    let overlap = false;
    this.get("boxes").forEach((otherBox) => {
      //TODO: This assumes that only one audio can be chosen
      if (
        otherBox.get("audioPath") != box.get("audioPath") &&
        true
        // otherBox.get("isDeployed")
      ) {
        overlap = overlap || otherBox.overlaps(box);
        console.log("Checking overlap: " + overlap);
      }
    });
    if (!overlap) {
      //No overlaps, so is safe to deploy
      box.set("isDeployed", true);
    }
    return !overlap;
  },
});

let GameState = Backbone.Model.extend({
  defaults: {
    state: "intro", // intro, phraseArrange, choose, arrange, compose
    playPhrase: [],
    lastWordIndex: null,
    // wonPhraseGame: false,
    songs: [],
  },
  initialize: function ({ state = "intro" }) {
    this.setState(state);
    document.body.classList.remove("hidden");
  },
  setLastIndex: function (index) {
    //Check and update UI
    if (index == null) {
      //Reset all values
      for (let child of document.querySelectorAll(
        ".word",
        playPhraseContainer
      )) {
        // for (let child of playPhraseContainer.children) {
        child.classList.remove("word-spoken");
      }
    } else {
      let child = document.querySelector(
        `#word-${index}.word`,
        playPhraseContainer
      );
      child.classList.add("word-spoken");
      // playPhraseContainer.children[index].classList.add("word-chosen");
    }
    this.set("lastWordIndex", index);
  },
  detectNewWord: function (word) {
    // console.log(`Detecting new word: ${word}`);
    word = word.toLowerCase();
    let lastWordIndex = this.get("lastWordIndex");
    let playPhrase = this.get("playPhrase");
    // console.log(
    //   `Current playPhrase: ${playPhrase}, lastWordIndex = ${lastWordIndex}`
    // );
    let indexToCheck = lastWordIndex === null ? 0 : lastWordIndex + 1;
    if (playPhrase[indexToCheck].toLowerCase() !== word) {
      // console.log("No match");
      this.setLastIndex(null);
      gameFeedback.innerText = "Close!";
      gameFeedback.classList.add("fail-phrase-feedback");
      gameFeedback.classList.remove("ongoing-phrase-feedback");
      gameFeedback.classList.remove("win-phrase-feedback");
      return;
    } else {
      // console.log("Match!");
      gameFeedback.innerText = "";
      // gameFeedback.classList.add("ongoing-phrase-feedback");
      // gameFeedback.classList.remove("fail-phrase-feedback");
      // gameFeedback.classList.remove("win-phrase-feedback");
      this.setLastIndex(indexToCheck);
    }
    //Check if game has been won
    if (this.get("lastWordIndex") === playPhrase.length - 1) {
      // this.set("wonPhraseGame", true);
      //Update UI
      gameFeedback.innerText = "Good job!";
      gameFeedback.classList.add("win-phrase-feedback");
      gameFeedback.classList.remove("fail-phrase-feedback");
      gameFeedback.classList.remove("ongoing-phrase-feedback");
      // sleep(2000).then(() => {
      while (true) {
        let newPlayPhrase = getRandomPlayPhrase();
        if (newPlayPhrase === playPhrase) {
          //Repeat word, try again
          continue;
        }
        console.log("Chosen playPhrase:");
        console.log(newPlayPhrase);
        updatePhraseUI(newPlayPhrase);
        this.set("playPhrase", newPlayPhrase);
        this.set("lastWordIndex", null);
        wowSound.play();
        break;
      }
      // });
    }
  },
  setState: function (state) {
    console.log(`Setting state... ${state}`);
    //only showing the new valid elements in the DOM
    let containers = document.querySelectorAll("[visible-state]");
    containers.forEach((container) => {
      let visibleState = container.getAttribute("visible-state");
      if (visibleState === state) {
        console.log("found one!");
        container.classList.remove("hidden");
      } else {
        container.classList.add("hidden");
      }
    });

    // If the new state is one of the full-width, then change it so
    if (FULL_SCREEN_STATES.includes(state)) {
      extraInfo.classList.add("full-screen");
    } else {
      extraInfo.classList.remove("full-screen");
    }
    this.set("state", state);
  },
  setSongs: function (songs) {
    this.set("songs", songs);
  },
});
export { Cursor, Board, GameState };
