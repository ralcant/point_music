/*****************************************************************/
/******** SPEECH RECOGNITION SETUP YOU CAN IGNORE ****************/
/*****************************************************************/
import { processSpeech } from "./main.js";

let DEBUGSPEECH = false;
let soundFeedback = document.getElementById("speechFeedback");
let debouncedProcessSpeech = _.debounce(processSpeech, 500);

let recognition = new webkitSpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;
recognition.onresult = function (event) {
  // Build the interim transcript, so we can process speech faster
  let transcript = "";
  let hasFinal = false;
  for (let i = event.resultIndex; i < event.results.length; ++i) {
    if (event.results[i].isFinal) hasFinal = true;
    else transcript += event.results[i][0].transcript;
  }

  if (DEBUGSPEECH) {
    if (hasFinal) soundFeedback.innerText = "ready";
    else soundFeedback.innerText = transcript;
  }

  let processed = debouncedProcessSpeech(transcript);

  // If we reacted to speech, kill recognition and restart
  if (processed) {
    recognition.stop();
  }
};
// Restart recognition if it has stopped
recognition.onend = function (event) {
  setTimeout(function () {
    if (DEBUGSPEECH) soundFeedback.innerText = "ready";
    recognition.start();
  }, 1000);
};
recognition.start();
/*****************************************************************/
/******** END OF SPEECH RECOG SETUP ******************************/
/*****************************************************************/
