import { playAudioFromIndex } from "./sound.js";
import { handlekeyTap, gameState } from "./main.js";
import {
  cursor,
  getIntersectingBox,
  highlightBox,
  unhighlightAllBoxes,
  placeBox,
} from "./setupUI.js";
import { Colors, DIRECTION_NAMES, GRAB_THRESHOLD } from "./config.js";

let leapFeedback = document.getElementById("leapFeedback");
let LEAPSCALE = 0.6;
let options = { enableGestures: true };
let DIRECTION_AUDIO_MAPPING = {
  Left: "first",
  Middle: "second",
  Right: "third",
};

// selectedTile: The tile that the player is currently hovering above
let selectedBox = null;
let selectedBoxIndex = null;
function resetLeap() {
  selectedBox = null;
  selectedBoxIndex = null;
}
/**
 * x: Leap axis
 * y: away from leap
 * z: x times y (right hand rule)
 *
 */

let currString = "";
let lastDirection = null;
function getDirectionFromAngle(theta) {
  let i = Math.floor((theta / 180) * DIRECTION_NAMES.length);
  return i;
}
function handleFrame(frame) {
  //   console.log("Frame detected!");
  //   console.log(frame);
  //Don't process unless in processing state
  // if (!isProcessing()) {
  //   return;
  // }
  if (frame.hands.length === 0) {
    return;
  }
  handleHand(frame.hands[0]);
}

function handleHand(hand) {
  // 'choose' state doesn't involve Leap data
  if (gameState.get("state") === "choose") {
    return;
  }
  //   console.log("Hand detected!");
  //   console.log(hand);
  // Drawing cursor
  unhighlightAllBoxes();
  let pos = hand.screenPosition();
  let x = pos[0];
  let y = pos[1];
  let cursorPosition = [x, y + 400];
  cursor.setScreenPosition(cursorPosition);

  if (gameState.get("state") === "arrange") {
    //In arrange state we are able to drag the components around
    let intersection = getIntersectingBox(cursorPosition);
    let highlightColor = Colors.BLACK;
    if (intersection) {
      console.log("Found intersection, highlight it");
      let { intersectingBox, i } = intersection;
      highlightBox(i, highlightColor);
    }
    let isGrabbing = hand.grabStrength > GRAB_THRESHOLD; //TODO: Also allow pinching?

    if (intersection && !selectedBox && isGrabbing) {
      console.log("Starting to move");
      let { intersectingBox, i } = intersection;
      selectedBox = intersectingBox;
      selectedBoxIndex = i;
      highlightBox(selectedBoxIndex, highlightColor);
      //TODO: Play the corresponding audio, only if on the Composing state
    }
    if (selectedBox && isGrabbing) {
      // Continue grabbing
      console.log("continue grabbing");

      selectedBox.setScreenPosition(cursorPosition, "center");
      highlightBox(selectedBoxIndex, highlightColor);
    } else if (selectedBox && !isGrabbing) {
      // Were grabbing, and released
      console.log("releasing...");
      placeBox(selectedBox);
      selectedBox = null;
      selectedBoxIndex = null;
    }
  } else if (gameState.get("state") === "compose") {
    let intersection = getIntersectingBox(cursorPosition);
    let highlightColor = Colors.YELLOW;
    if (intersection) {
      let { intersectingBox, i } = intersection;
      highlightBox(i, highlightColor);
      selectedBox = intersectingBox;
      selectedBoxIndex = i;
      //Play audio
    } else {
      selectedBoxIndex = null;
    }
    playAudioFromIndex(selectedBoxIndex);
  }

  return;
  let indexFinger = hand.indexFinger;
  let [tipX, tipY, tipZ] = indexFinger.tipPosition;
  let [carpX, carpY, carpZ] = indexFinger.carpPosition;
  //   let [carpX, carpY, carpZ] = hand.sphereCenter;
  let dx = carpX - tipX;
  let dz = carpZ - tipZ; // (-) because z axis is pointing towards me, not away from
  let theta = (Math.atan2(dz, dx) * 180) / Math.PI; //in radians
  let currDirection = getDirectionFromAngle(theta);
  //make sure the hand is on the direction of the leap (angle 0-180)
  if (currDirection < 0 || currDirection >= 3) {
    return;
  }
  if (currDirection === lastDirection) {
    return; //
  }
  //TODO: Move this part to main.js
  //new direction found, play new sound
  lastDirection = currDirection;
  let directionName = DIRECTION_NAMES[lastDirection];
  console.log(`Detected ${theta} ( ${directionName})`);
  leapFeedback.innerText = `Detected ( ${directionName})`;
  // playAudio(DIRECTION_AUDIO_MAPPING[directionName]); //TODO: Uncomment
  return;
}
let controller = Leap.loop({ enableGestures: true }, handleFrame).use(
  "screenPosition"
);
controller.connect();
// From https://developer-archive.leapmotion.com/gallery/leapjs-gesture-events
// Emit gesture events before emitting frame events
controller.addStep(function (frame) {
  //Don't process unless in processing state
  if (frame.gestures.length > 0) {
    console.log("Looking for gestures!");
    console.log(frame.gestures.length);
  }
  // 'choose' state doesn't involve Leap data
  if (gameState.get("state") === "choose") {
    return;
  }
  for (let g = 0; g < frame.gestures.length; g++) {
    let gesture = frame.gestures[g];
    controller.emit(gesture.type, gesture, frame);
  }
  return frame; // Return frame data unmodified
});
controller.on("connect", () => {
  // leapFeedback.innerText = "Leap connected!";
});
controller.on("keyTap", (gesture, frame) => {
  console.log("Detected keytap!");
  handlekeyTap();
});

export { selectedBoxIndex, resetLeap };
