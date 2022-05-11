import { addSong } from "./main.js";

function download(recordedChunks, filename) {
  console.log("Trying to download audio");
  console.log(recordedChunks.length);
  stateFeedback.innerText = "Need to save on assets/recordings/ folder";
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
  if (songSelectorDialog.open) {
    //Ony ask for name and such when this download is for the recording new audio
    let audioPath = prompt(
      "what's the name of the mp3 audio? (e.g. test.mp3)? This audio should be in assets/recordings/ folder"
    );
    //If the user doesn't provide extension then add it
    if (!audioPath.endsWith(".mp3")) {
      audioPath += ".mp3";
    }
    audioPath = `assets/recordings/${audioPath}`;
    let displayName = prompt("Give your mp3 a name! (e.g., test)");
    addSong(displayName, audioPath);
  }
}

let options = { mimeType: "video/webm; codecs=vp9" };
let RECORDING_TIME_LIMIT = 2; //seconds
let BROWSER_RECORDING_TIME_LIMIT = 2;
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

function recordFromBrowser(filename) {
  let audioContext = new AudioContext();
  let streamDest = audioContext.createMediaStreamDestination();
  let rec = new MediaRecorder(streamDest.stream);
  /**
   * Connectiing audios to the stream
   */
  songSelectorContainer.querySelectorAll("audio").forEach((audioElement) => {
    audioElement.connect(streamDest);
  });
  rec.start(1000);
  let recordedChunks = [];
  let ignoredFirst = false;

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
    if (recordedChunks.length > BROWSER_RECORDING_TIME_LIMIT + 1) {
      rec.stop();
    }
  };
  rec.onstop = () => download(recordedChunks, filename);
  return;

  console.log("Recording from browser...");
  // let recordedChunks = [];
  // let ignoredFirst = false;
  const handleStream = (stream) => {
    console.log("received stream...");
    // rec = new MediaRecorder(stream);
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
      if (recordedChunks.length > BROWSER_RECORDING_TIME_LIMIT + 1) {
        rec.stop();
      }
    };
    rec.onstop = () => download(recordedChunks, filename);
    console.log(rec.state);
  };
  if (!rec || rec.state === "inactive") {
    // console.log("Getting data from mediaDevices");
    // navigator.mediaDevices.enumerateDevices().then((devices) => {
    //   let groupId = null;
    //   for (let device of devices) {
    //     if (!(device.kind === "audiooutput" && device.deviceId === "default")) {
    //       continue;
    //     }
    //     groupId = device.groupId;
    //     console.log("Found audio ouput device!");
    //     console.log(`GroupId = ${groupId}`);
    //     let audioFilter = {
    //       audio: {
    //         deviceID:
    //           "41f4bf03f1664dd12442bf3ae5e7ecac32d7086bd6f0ecaa1d1c0c8c40c68842",
    //       },
    //     };
    //     console.log("Filter:");
    //     console.log(audioFilter);
    //     navigator.mediaDevices.getUserMedia(audioFilter).then(handleStream);
    //     break;
    //   }
    // });
    // let devices = await navigator.mediaDevices.enumerateDevices();
    // console.log(devices);
    // let audioDevice = devices.filter((device) => {
    //   device.kind === "audiooutput" && device.deviceId === "default";
    // });
    // console.log("Chosen device:");
    // console.log(audioDevice);
    // audioDevice = audioDevice[0];
    // console.log("Chosen device:");
    // console.log(audioDevice);
    // audioDevice.getUserMedia({ audio: true }).then(handleStream);
    // navigator.mediaDevices.getUserMedia({ audio: true }).then(handleStream);
  } else {
    rec.stop();
  }

  return recordedChunks;
}
export { record, stopRecording, resetRecord, recordFromBrowser };
