import { addSong } from "./main.js";
function download(recordedChunks, filename) {
  console.log("Trying to download audio");
  console.log(recordedChunks.length);
  var blob = new Blob(recordedChunks, {
    type: "audio/mpeg",
  });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  document.body.appendChild(a);
  a.style = "display: none";
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
  console.log("Downloaded to " + filename);
  let audioPath = prompt("what's the name of the mp3 audio? (e.g. test.mp3)?");
  audioPath = `assets/${audioPath}`;
  let displayName = prompt("Give your mp3 a name! (e.g., test)");
  addSong(displayName, audioPath);
}

let options = { mimeType: "video/webm; codecs=vp9" };
let RECORDING_TIME_LIMIT = 2; //seconds

let rec = null;
function resetRecord() {
  rec = null;
}
function stopRecording() {
  if (rec) {
    console.log("stopping...");
    rec.stop();
  }
}
function record(filename) {
  console.log("Recording...");
  let recordedChunks = [];
  let ignoredFirst = false;
  const handleStream = (stream) => {
    console.log("received stream...");
    rec = new MediaRecorder(stream);
    rec.start(1000); //each stream is 1s long

    rec.ondataavailable = (e) => {
      if (rec.state !== "recording") {
        return;
      }
      //Ignore first second because it's usually empty sound
      if (!ignoredFirst) {
        ignoredFirst = true;
        // return;
      }
      recordedChunks.push(e.data);
      console.log(recordedChunks.length);
      console.log(rec.state);
      if (recordedChunks.length > RECORDING_TIME_LIMIT + 1) {
        rec.stop();
      }
    };
    rec.onstop = () => download(recordedChunks, filename);
    console.log(rec.state);
  };
  if (!rec || rec.state === "inactive") {
    console.log("Getting data from mediaDevices");
    navigator.mediaDevices.getUserMedia({ audio: true }).then(handleStream);
  } else {
    rec.stop();
  }

  return recordedChunks;
}

export { record, stopRecording, resetRecord };
