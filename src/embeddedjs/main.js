import {} from "piu/MC";
import Button from "pebble/button";
import Dictation from "pebble/dictation";
import Message from "pebble/message";
import Vibes from "pebble/vibes";

// Round 2 / Gabbro is 260 x 260 pixels. The content is kept inside a
// conservative circular safe area so the corners do not clip text.
const backgroundSkin = new Skin({ fill: "black" });
const titleStyle = new Style({
  font: "bold 18px Gothic",
  color: "white",
  horizontal: "center"
});
const bodyStyle = new Style({
  font: "18px Gothic",
  color: "white",
  horizontal: "center"
});
const questionStyle = new Style({
  font: "14px Gothic",
  color: "#66ccff",
  horizontal: "center"
});
const statusStyle = new Style({
  font: "bold 14px Gothic",
  color: "#66ccff",
  horizontal: "center"
});
const hintStyle = new Style({
  font: "14px Gothic",
  color: "#aaaaaa",
  horizontal: "center"
});

const title = new Label(null, {
  left: 28,
  right: 28,
  top: 15,
  height: 28,
  style: titleStyle,
  string: "ROUND 2 ASSIST"
});

const question1 = new Label(null, {
  left: 30,
  right: 30,
  top: 48,
  height: 18,
  style: questionStyle,
  string: "Question:"
});
const question2 = new Label(null, {
  left: 30,
  right: 30,
  top: 65,
  height: 18,
  style: questionStyle,
  string: "Press UP to test"
});

const line1 = new Label(null, {
  left: 30,
  right: 30,
  top: 88,
  height: 22,
  style: bodyStyle,
  string: "Reply"
});
const line2 = new Label(null, {
  left: 30,
  right: 30,
  top: 111,
  height: 22,
  style: bodyStyle,
  string: "Press SELECT"
});
const line3 = new Label(null, {
  left: 30,
  right: 30,
  top: 134,
  height: 22,
  style: bodyStyle,
  string: "to speak"
});
const line4 = new Label(null, {
  left: 30,
  right: 30,
  top: 157,
  height: 22,
  style: bodyStyle,
  string: ""
});

const status = new Label(null, {
  left: 28,
  right: 28,
  top: 177,
  height: 24,
  style: statusStyle,
  string: "Phone link: waiting"
});

const hint = new Label(null, {
  left: 30,
  right: 30,
  bottom: 22,
  height: 22,
  style: hintStyle,
  string: "UP/DOWN: test reply"
});

const application = new Application(null, {
  skin: backgroundSkin,
  contents: [title, question1, question2, line1, line2, line3, line4, status, hint]
});

export default application;

function showLines(text) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  const words = clean.split(" ");
  const lines = ["", "", "", ""];
  let line = 0;

  for (const word of words) {
    if (line > 3) break;
    const next = lines[line] ? lines[line] + " " + word : word;
    if (next.length > 17 && lines[line]) line++;
    if (line <= 3) lines[line] = lines[line] ? lines[line] + " " + word : word;
  }

  line1.string = lines[0] || " ";
  line2.string = lines[1] || " ";
  line3.string = lines[2] || " ";
  line4.string = lines[3] || " ";
}

function showQuestion(text) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  const words = clean.split(" ");
  const lines = ["", ""];
  let line = 0;

  for (const word of words) {
    if (line > 1) break;
    const next = lines[line] ? lines[line] + " " + word : word;
    if (next.length > 25 && lines[line]) line++;
    if (line <= 1) lines[line] = lines[line] ? lines[line] + " " + word : word;
  }

  question1.string = lines[0] || "Question:";
  question2.string = lines[1] || " ";
}

function setStatus(text) {
  status.string = text;
  console.log(text);
}

let pendingQuestion = null;
let lastResponse = "No response yet";
let messageWritable = false;

function flushQuestion() {
  if (!messageWritable || !pendingQuestion) return;
  const question = pendingQuestion;
  pendingQuestion = null;
  message.write(new Map([["QUESTION", question]]));
  setStatus("Sent to phone");
}

const message = new Message({
  keys: ["QUESTION", "RESPONSE", "STATUS"],
  onReadable() {
    const msg = this.read();
    msg.forEach((value, key) => {
      if (key === "RESPONSE") {
        lastResponse = String(value);
        showLines(lastResponse);
        setStatus("Reply received");
        Vibes.shortPulse();
      } else if (key === "STATUS") {
        setStatus(String(value));
      }
    });
  },
  onWritable() {
    messageWritable = true;
    console.log("Message channel writable");
    setStatus("Phone link ready");
    flushQuestion();
  },
  onSuspend() {
    messageWritable = false;
    console.log("Message channel suspended");
  }
});

function sendQuestion(question) {
  pendingQuestion = question;
  setStatus("Sending...");
  flushQuestion();
}

const dictation = new Dictation({
  byteLength: 512,
  onReadable() {
    const question = this.read();
    if (!question) {
      setStatus("No speech detected");
      return;
    }
    showLines(question);
    setStatus("Question captured");
    Vibes.shortPulse();
    sendQuestion(question);
  },
  onError(error) {
    setStatus("Voice error: " + error);
    Vibes.doublePulse();
  }
});

const testQuestion = "What is the weather like in Henan, China?";

dictation.configure({ confirm: true });

new Button({
  types: ["select", "up", "down"],
  onPush(down, type) {
    if (!down) return;

    if (type === "select") {
      setStatus("Listening...");
      dictation.start();
    } else if (type === "up") {
      showQuestion(testQuestion);
      showLines("Waiting for AI...");
      setStatus("Sending question");
      Vibes.shortPulse();
      sendQuestion(testQuestion);
    } else if (type === "down") {
      showLines(lastResponse);
      setStatus("Test display");
      Vibes.shortPulse();
    }
  }
});

console.log("Round2 AI Assistant started");
