import { playAudioFromIndex, playPhraseAudioFromIndex } from "./sound.js";
import { handlekeyTap, gameState } from "./main.js";
import {
  cursor,
  getIntersectingBox,
  highlightBox,
  unhighlightAllBoxes,
  placeBox,
  board,
} from "./setupUI.js";
import { Colors, DIRECTION_NAMES, GRAB_THRESHOLD } from "./config.js";

let leapFeedback = document.getElementById("leapFeedback");
let lastHoveredTime = 0; //Date.now() when first hovered (to check that )
let UNHOVERED_THRESHOLD = 2000; // Time (in miliseconds) the user can hover outside before it resets
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
/**
 *
 * @param {*} theta angle
 * @returns a number from [0, len-1], laying room for "unselected"
 */
function getDirectionFromAngle(theta) {
  let i = Math.floor((theta / 180) * 2 * DIRECTION_NAMES.length);
  return i % 2 === 0 ? Math.floor(i / 2) : null;
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
  let entered = Date.now();
  //   console.log("Hand detected!");
  //   console.log(hand);
  // Drawing cursor
  unhighlightAllBoxes();

  let pos = hand.screenPosition();
  // let x = pos[0];
  // let y = pos[1];
  // console.log(pos);
  let x = pos[0];
  let y = pos[2];
  let cursorPosition = [x, y]; //[x * 2, y * 2]; // + 400];
  cursor.setScreenPosition(cursorPosition);
  cursorPosition = cursor.get("screenPosition"); // now it's average
  // console.log(cursor.get("history"));
  if (gameState.get("state") === "play") {
    // let indexFinger = hand.indexFinger;
    // let [tipX, tipY, tipZ] = indexFinger.tipPosition;
    // let [carpX, carpY, carpZ] = indexFinger.carpPosition;
    // //   let [carpX, carpY, carpZ] = hand.sphereCenter;
    // let dx = carpX - tipX;
    // let dz = carpZ - tipZ; // (-) because z axis is pointing towards me, not away from
    // let theta = (Math.atan2(dz, dx) * 180) / Math.PI; //in radians
    // let currDirection = getDirectionFromAngle(theta);
    // //make sure the hand is on the direction of the leap (angle 0-180)
    // if (currDirection < 0 || currDirection >= 3) {
    //   return;
    // }
    // if (currDirection !== lastDirection) {
    //   playPhraseAudioFromIndex(currDirection);
    //   // return; //
    // }
    // //TODO: Move this part to main.js
    // //new direction found, play new sound
    // lastDirection = currDirection;
    // let directionName = DIRECTION_NAMES[lastDirection];
    // // console.log(`Detected ${theta} ( ${directionName})`);
    // let highlightColor = Colors.YELLOW;
    // if (lastDirection !== null) {
    //   highlightBox(lastDirection, highlightColor);
    // }
    let highlightColor = Colors.YELLOW;
    let intersection = getIntersectingBox(cursor);
    //If unhovered for too long, de-select any speech audio in the UI
    if (intersection) {
      // console.log("Found intersection, highlight it");
      let { intersectingBox, i } = intersection;
      highlightBox(i, highlightColor);
    } else {
      if (
        selectedBox === null &&
        entered - lastHoveredTime > UNHOVERED_THRESHOLD
      ) {
        console.log(entered - lastHoveredTime);
        console.log("Too long");
        gameState.setLastIndex(null);
      }
    }
    // when hover, just call once
    if (intersection && !selectedBox) {
      let { intersectingBox, i } = intersection;
      selectedBox = intersectingBox;
      selectedBoxIndex = i;
      //Play audio
      playPhraseAudioFromIndex(selectedBoxIndex);
    }
    // if already called but no intersection anymore, reset
    else if (!intersection && selectedBox !== null) {
      //Remember time
      console.log("Left hovering... storing time");
      lastHoveredTime = Date.now();

      selectedBoxIndex = null;
      selectedBox = null;
      playPhraseAudioFromIndex(selectedBoxIndex);
    }
  } else if (gameState.get("state") === "mix") {
    let highlightColor = Colors.YELLOW;
    let intersection = getIntersectingBox(cursor);
    let shouldPlayMusic = gameState.get("areBoxesReady");

    if (intersection) {
      // console.log("Found intersection, highlight it");
      let { intersectingBox, i } = intersection;
      highlightBox(i, highlightColor);
      // if (!shouldPlayMusic) {
      //   selectedBox.setScreenPosition(cursorPosition, "center");
      // }
    }
    ////////////////////////////////
    if (shouldPlayMusic) {
      // Only need to care about wehther it was hovered or not
      // Play music
      let intersection = getIntersectingBox(cursor);
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
      // Assumes that the box index is the same as the sound index
      playAudioFromIndex(selectedBoxIndex);
    } else {
      // Need to check if it's grabbing
      let isGrabbing = hand.grabStrength > GRAB_THRESHOLD; //TODO: Also allow pinching?

      //Intersects for the very first time
      if (intersection && !selectedBox && isGrabbing) {
        console.log("Starting to move");
        let { intersectingBox, i } = intersection;
        selectedBox = intersectingBox;
        selectedBoxIndex = i;
        highlightBox(selectedBoxIndex, highlightColor);
        //TODO: Change the cursor's image to one of grabbing
      }
      //As it continues to be grabbed
      if (selectedBox && isGrabbing) {
        // Continue grabbing
        // Update positions for later
        let lastPositions = board.get("lastPositions");
        lastPositions[selectedBoxIndex] = cursorPosition;
        ////////////////////////////////
        selectedBox.setScreenPosition(cursorPosition, "center");
        highlightBox(selectedBoxIndex, highlightColor);
      } else if (selectedBox && !isGrabbing) {
        // Were grabbing, and released
        console.log("releasing...");
        // placeBox(selectedBox); -> Not necessary as collisions between boxes are allowed
        selectedBox = null;
        selectedBoxIndex = null;
      }
    }
    ////////////////////////////////
    // //Just selected a box
    // if (intersection && !selectedBox) {
    //   let { intersectingBox, i } = intersection;
    //   selectedBox = intersectingBox;
    //   selectedBoxIndex = i;

    //   if (shouldPlayMusic) {
    //   } else {
    //     //If not play music, then just need to be able to drag them
    //   }
    // }
    // //Just stopped hovering
    // if (!intersection && selectedBox) {
    //   if (shouldPlayMusic) {
    //   } else {
    //   }
    //   selectedBox = null;
    //   selectedBoxIndex = null;
    // }
  } else if (gameState.get("state") === "arrange") {
    //In arrange state we are able to drag the components around
    let intersection = getIntersectingBox(cursor);
    let highlightColor = Colors.YELLOW;
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
    let intersection = getIntersectingBox(cursor);
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
    // Assumes that the box index is the same as the sound index
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
  // if (frame.gestures.length > 0) {
  // console.log("Looking for gestures!");
  // console.log(frame.gestures.length);
  // }
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
