import { repeatLast } from "./setupLeap.js";

let SETUP_STATE = "setup";
let PROCESSING_STATE = "processing";

let state = SETUP_STATE; // setup, processing
let stateFeedback = document.getElementById("stateFeedback");
function isProcessing() {
  return state === PROCESSING_STATE;
}
function processSpeech(transcript) {
  let userSaid = function (str, commands, ignoreCase = true) {
    let curr_str = ignoreCase ? str.toLowerCase() : str;
    for (var i = 0; i < commands.length; i++) {
      let curr_command = ignoreCase ? commands[i].toLowerCase() : commands[i];
      if (curr_str.indexOf(curr_command) > -1) return true;
    }
    return false;
  };
  let processed = false;
  if (state === SETUP_STATE) {
    if (userSaid(transcript, ["start"])) {
      stateFeedback.innerText = "Starting...";
      console.log("Starting...");
      state = PROCESSING_STATE;
      processed = true;
    } else {
      stateFeedback.innerText = "Say start to begin";
    }
  } else if (state === PROCESSING_STATE) {
    if (userSaid(transcript, ["and", "end", "finish"])) {
      // TODO: save the audio to mp3
      stateFeedback.innerText = "Saving to mp3...";
      console.log("Saving to mp3!");
      state = SETUP_STATE;
      processed = true;
    } else if (userSaid(transcript, ["repeat"])) {
      repeatLast();
      processed = true;
    } else {
      stateFeedback.innerText = "Processing... (say 'end' to finish)";
    }
  }
  return processed;
}

export { processSpeech, isProcessing };
