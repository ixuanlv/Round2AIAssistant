// Phone-side companion for the Round 2 AI Assistant.
// Keep the real API key only in the private CloudPebble project. Do not push
// it to the public GitHub repository.

const DOUBAO_API_KEY = "PASTE_YOUR_DOUBAO_API_KEY_HERE";
const DOUBAO_MODEL = "doubao-seed-2-1-lite-260915";
const DOUBAO_URL = "https://ark.cn-beijing.volces.com/api/v3/chat/completions";

function sendStatus(status) {
  Pebble.sendAppMessage({ STATUS: status });
}

function sendResponse(response) {
  const text = String(response || "No answer received").replace(/\s+/g, " ").trim();
  Pebble.sendAppMessage({ RESPONSE: text.slice(0, 160) });
}

function extractAnswer(data) {
  if (data && data.choices && data.choices[0] && data.choices[0].message) {
    const content = data.choices[0].message.content;
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      return content.map(item => item.text || "").join("");
    }
  }
  return "The AI response format was not recognized.";
}

function askDoubao(question) {
  if (DOUBAO_API_KEY === "PASTE_YOUR_DOUBAO_API_KEY_HERE") {
    sendStatus("API key not set");
    sendResponse("Please add the Doubao API key in PKJS.");
    return;
  }

  sendStatus("Calling Doubao...");

  const request = new XMLHttpRequest();
  request.open("POST", DOUBAO_URL);
  request.setRequestHeader("Content-Type", "application/json");
  request.setRequestHeader("Authorization", "Bearer " + DOUBAO_API_KEY);
  request.onload = function () {
    if (request.status < 200 || request.status >= 300) {
      console.log("Doubao HTTP error: " + request.status + " " + request.responseText);
      sendStatus("AI request failed");
      sendResponse("Doubao request failed: " + request.status);
      return;
    }

    try {
      const data = JSON.parse(request.responseText);
      sendResponse(extractAnswer(data));
      sendStatus("AI reply received");
    } catch (error) {
      console.log("Doubao JSON error: " + error);
      sendStatus("Invalid AI response");
      sendResponse("The AI response could not be read.");
    }
  };
  request.onerror = function () {
    sendStatus("Network error");
    sendResponse("Could not connect to Doubao.");
  };
  request.ontimeout = function () {
    sendStatus("AI timeout");
    sendResponse("Doubao took too long to answer.");
  };
  request.timeout = 20000;
  request.send(JSON.stringify({
    model: DOUBAO_MODEL,
    messages: [
      {
        role: "system",
        content: "Answer briefly in English. Keep the answer suitable for a small round smartwatch display."
      },
      {
        role: "user",
        content: question
      }
    ],
    max_tokens: 120
  }));
}

Pebble.addEventListener("ready", function () {
  console.log("Round2 AI Assistant phone side ready");
  sendStatus("Phone link ready");
});

Pebble.addEventListener("appmessage", function (event) {
  const question = event.payload.QUESTION;
  if (!question) return;

  console.log("Question from watch: " + question);
  askDoubao(String(question));
});
