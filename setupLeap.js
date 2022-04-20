import { playAudio } from "./sound.js";
import { isProcessing } from "./main.js";

let leapFeedback = document.getElementById("leapFeedback");
let LEAPSCALE = 0.6;
let options = { enableGestures: true };
let DIRECTION_AUDIO_MAPPING = {
  Left: "first",
  Middle: "second",
  Right: "third",
};
/**
 * x: Leap axis
 * y: away from leap
 * z: x times y (right hand rule)
 *
 */

let currString = "";
let lastDirection = null;
let NUM_DIRECTIONS = 3; //Left, Middle, Right
let DIRECTION_NAMES = ["Left", "Middle", "Right"];
function getDirectionFromAngle(theta) {
  let i = Math.floor((theta / 180) * NUM_DIRECTIONS);
  return i;
}
function handleFrame(frame) {
  //   console.log("Frame detected!");
  //   console.log(frame);
  //Don't process unless in processing state
  if (!isProcessing()) {
    return;
  }
  if (frame.hands.length === 0) {
    return;
  }
  handleHand(frame.hands[0]);
}
function handleHand(hand) {
  //   console.log("Hand detected!");
  //   console.log(hand);
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
  //new direction found, play new sound
  lastDirection = currDirection;
  let directionName = DIRECTION_NAMES[lastDirection];
  console.log(`Detected ${theta} ( ${directionName})`);
  leapFeedback.innerText = `Detected ( ${directionName})`;
  playAudio(DIRECTION_AUDIO_MAPPING[directionName]);
  return;
}
let controller = Leap.loop({ enableGestures: true }, handleFrame);
controller.connect();
// From https://developer-archive.leapmotion.com/gallery/leapjs-gesture-events
// Emit gesture events before emitting frame events
controller.addStep(function (frame) {
  //Don't process unless in processing state
  if (frame.gestures.length > 0) {
    console.log("Looking for gestures!");
    console.log(frame.gestures.length);
  }
  if (!isProcessing()) {
    return;
  }
  for (let g = 0; g < frame.gestures.length; g++) {
    let gesture = frame.gestures[g];
    controller.emit(gesture.type, gesture, frame);
  }
  return frame; // Return frame data unmodified
});
controller.on("connect", () => {
  leapFeedback.innerText = "Leap connected!";
});
controller.on("keyTap", (gesture, frame) => {
  console.log("Detected keytap!");
  repeatLast();
});

function repeatLast() {
  let directionName = DIRECTION_NAMES[lastDirection];
  leapFeedback.innerText = `Repeating ( ${directionName})`;
  console.log(`Repeating ( ${directionName})`);
  playAudio(DIRECTION_AUDIO_MAPPING[directionName]);
}

export { repeatLast };
