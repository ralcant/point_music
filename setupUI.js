// import { Engine, Surface, StateModifier, Modifier } from "famous/core";
// import { famous } from "./lib/famous.min.js";
// let famous = require("famous");
import { Colors, BOXSIZE } from "./config.js";
import { Cursor, Board } from "./models.js";
import { gameState } from "./main.js";
import { selectedBoxIndex } from "./setupLeap.js";

let Engine = famous.core.Engine;
let Surface = famous.core.Surface;
let Transform = famous.core.Transform;
let StateModifier = famous.modifiers.StateModifier;
// let Draggable = famous.modifiers.Draggable;
let Modifier = famous.core.Modifier;

let CURSORSIZE = 20;
let mainContext;
function resetUI() {
  mainContext = null;
  cursor = new Cursor();
  boxes = [];
  modifiers = [];
  board;
  boxObjects = [];
}
function placeBox(box) {
  let success = board.deployBox(box);
  console.log("Success: " + success);
  if (!success) {
    box.reset();
  }
}
function changeBoxSize(scale) {
  console.log(selectedBoxIndex);
  console.log(scale);
  if (selectedBoxIndex === null) {
    return;
  }
  console.log(boxObjects[selectedBoxIndex]);
  let [currW, currH, x] = boxObjects[selectedBoxIndex].getSize();
  // scale = BOXSIZE * scale;
  let [newW, newH] = [currW * scale, currH * scale];
  boxObjects[selectedBoxIndex].setSize([newW, newH, 0]);
  board.get("boxes").at(selectedBoxIndex).setSize([newW, newH]);
}
function highlightBox(pos, color) {
  boxObjects[pos].setProperties({ backgroundColor: color });
  // Also changing text color so that it's visible
  if (color === Colors.BLACK) {
    boxObjects[pos].setProperties({ color: Colors.WHITE });
  }
}
function unhighlightAllBoxes() {
  boxObjects.forEach((boxObject) => {
    boxObject.setProperties({ backgroundColor: Colors.GREY });
  });
}
function getIntersectingBox(screenPosition) {
  let intersectingBox = null;
  let allBoxes = board.get("boxes");
  for (let i = 0; i < allBoxes.length; i++) {
    let songBox = allBoxes.at(i);
    // board.get("boxes").forEach((songBox) => {
    let boxPos = songBox.get("screenPosition");
    let [w, h] = songBox.get("size");
    let bbox = {
      x1: boxPos[0],
      x2: boxPos[0] + w,
      y1: boxPos[1],
      y2: boxPos[1] + h,
    };
    if (
      bbox.x1 <= screenPosition[0] &&
      bbox.x2 >= screenPosition[0] &&
      bbox.y1 <= screenPosition[1] &&
      bbox.y2 >= screenPosition[1]
    ) {
      //Intersection!
      intersectingBox = songBox;
      return { intersectingBox, i };
    }
  }
}
let cursor = new Cursor();
let gridOrigin = [300, 35];
let boxes = [];
let modifiers = [];
let board;
let boxObjects = [];

function test(mainContext) {
  // let songs = [];
  // for (let i = 0; i < 5; i++) {
  //   let displayName = "Display name #" + i;
  //   let audioPath = "Audio path #" + i;
  //   let screenPosition = [
  //     gridOrigin[0] + i * BOXSIZE,
  //     gridOrigin[1] + i * BOXSIZE,
  //     0,
  //   ];
  //   songs.push({ displayName, audioPath, screenPosition });
  // }
  //this songs came from setupLeap
  let songs = gameState.get("songs");
  board = new Board({ songs });
  board.get("boxes").forEach((songBox) => {
    let htmlContent = `
      <div>
        <p>displayName: ${songBox.get("displayName")}</p>
        // <p>audioPath: ${songBox.get("audioPath")}</p>
      </div>
    `;
    let box = new Surface({
      size: [BOXSIZE, BOXSIZE],
      content: htmlContent,
      properties: {
        backgroundColor: Colors.GREY,
        color: "white",
        border: "solid 1px black",
      },
    });
    let boxTranslateModifier = new Modifier({
      transform: function () {
        let boxPosition = [...this.get("screenPosition")]; //making a copy
        return Transform.translate(boxPosition[0], boxPosition[1], 0);
      }.bind(songBox),
    });
    // let boxResizeModifier = new Modifier({
    //   transform: function () {
    //     let boxPosition = [...this.get("screenPosition")]; //making a copy
    //     // return Transform.translate(boxPosition[0], boxPosition[1], 0);
    //     return Transform.rescale([2, 2, 1]);
    //   }.bind(songBox),
    // });
    mainContext.add(boxTranslateModifier).add(box);
    boxObjects.push(box);
  });
}
function setupBoxesUI() {
  mainContext = Engine.createContext();

  // First: Add the songs
  let songs = gameState.get("songs");
  board = new Board({ songs });
  board.get("boxes").forEach((songBox) => {
    //TODO: Make this a CSS Class
    let htmlContent = `
      <div style="display:flex;justify-content:center;align-items:center;flex-direction:column; width: 100%; height:100%;">
        <p>${songBox.get("displayName")}</p>
      </div>
    `;
    let box = new Surface({
      size: [BOXSIZE, BOXSIZE],
      content: htmlContent,
      properties: {
        backgroundColor: Colors.GREY,
        color: "white",
        border: "solid 1px black",
        textAlign: "center",
        padding: "5px",
      },
    });
    let boxTranslateModifier = new Modifier({
      transform: function () {
        let boxPosition = [...this.get("screenPosition")]; //making a copy
        return Transform.translate(boxPosition[0], boxPosition[1], 0);
      }.bind(songBox),
    });
    mainContext.add(boxTranslateModifier).add(box);
    boxObjects.push(box);
  });

  // Draw the cursor
  let cursorSurface = new Surface({
    size: [CURSORSIZE, CURSORSIZE],
    properties: {
      backgroundColor: "white",
      borderRadius: CURSORSIZE / 2 + "px",
      pointerEvents: "none",
      zIndex: 1,
    },
  });
  let cursorOriginModifier = new StateModifier({ origin: [0.5, 0.5] });
  let cursorModifier = new Modifier({
    transform: function () {
      var cursorPosition = this.get("screenPosition");
      return Transform.translate(cursorPosition[0], cursorPosition[1], 0);
    }.bind(cursor),
  });
  mainContext.add(cursorOriginModifier).add(cursorModifier).add(cursorSurface);
  return;

  // let mainContext = Engine.createContext();
  let background = new Surface({
    content: "<h1>battleship</h1>",
    properties: {
      backgroundColor: "rgb(34, 34, 34)",
      color: "white",
    },
  });
  //   mainContext.add(background);

  for (let i = 0; i < 5; i++) {
    // let box = new Draggable({});
    let box = new Surface({
      size: [BOXSIZE, BOXSIZE],
      content: "Content will be here #" + i,
      properties: {
        backgroundColor: Colors.GREY,
        color: "white",
        border: "solid 1px black",
      },
    });
    let boxTranslateModifier = new Modifier({
      transform: function () {
        let shipPosition = this.get("screenPosition").slice(0);
        // if (this.get("isVertical")) {
        //   shipPosition[0] += BOXSIZE / 2;
        //   shipPosition[1] += (ship.get("length") * BOXSIZE) / 2;
        // } else {
        //   shipPosition[1] += BOXSIZE / 2;
        //   shipPosition[0] += (ship.get("length") * BOXSIZE) / 2;
        // }
        return Transform.translate(shipPosition[0], shipPosition[1], 0);
      }.bind(box),
    });
    // Controld current state
    let transformModifier = new StateModifier({
      transform: Transform.translate(
        gridOrigin[0] + i * BOXSIZE,
        gridOrigin[1] + i * BOXSIZE,
        0
      ),
    });
    let tileModifier = new Modifier({
      opacity: 1.0,
    });
    mainContext.add(transformModifier).add(tileModifier).add(box);
    boxes.push(box);
    modifiers.push(tileModifier);
  }
  console.log(mainContext);
  // Draw the cursor

  getIntersectingBox();
}

export {
  cursor,
  setupBoxesUI,
  getIntersectingBox,
  highlightBox,
  unhighlightAllBoxes,
  placeBox,
  gridOrigin,
  changeBoxSize,
  resetUI,
};
