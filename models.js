import { BOXSIZE } from "./config.js";

let Cursor = Backbone.Model.extend({
  defaults: {
    screenPosition: [0, 0],
  },
  setScreenPosition: function (position) {
    this.set("screenPosition", position.slice(0));
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
    songs.forEach(({ displayName, audioPath, screenPosition }) => {
      let songBox = new SongBox({
        displayName,
        audioPath,
        screenPosition,
        startPosition: screenPosition,
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
    state: "choose", // choose, arrange, compose
    songs: [],
  },
  initialize: function () {
    this.setState("choose");
  },
  setState: function (state) {
    //only showing the new valid elements in the DOM
    let containers = document.querySelectorAll("[visible-state]");
    containers.forEach((container) => {
      let visibleState = container.getAttribute("visible-state");
      if (visibleState === state) {
        container.classList.remove("hidden");
      } else {
        container.classList.add("hidden");
      }
    });
    this.set("state", state);
  },
  setSongs: function (songs) {
    this.set("songs", songs);
  },
});
export { Cursor, Board, GameState };
