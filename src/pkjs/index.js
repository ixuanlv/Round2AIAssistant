// Phone-side companion for the Round 2 AI Assistant.
// Keep the real API key only in the private CloudPebble project. Do not push
// it to the public GitHub repository.

const DOUBAO_API_KEY = "PASTE_YOUR_DOUBAO_API_KEY_HERE";
const DOUBAO_MODEL = "doubao-seed-2-0-lite-260428";
const DOUBAO_URL = "https://ark.cn-beijing.volces.com/api/v3/responses";

function sendStatus(status) {
  Pebble.sendAppMessage({ STATUS: status });
}

function sendResponse(response, status) {
  const text = String(response || "No answer received").replace(/\s+/g, " ").trim();
  const payload = { RESPONSE: text.slice(0, 160) };
  if (status) payload.STATUS = status;
  Pebble.sendAppMessage(payload);
}

function extractAnswer(data) {
  if (data && typeof data.output_text === "string" && data.output_text) {
    return data.output_text;
  }

  function findOutputText(value) {
    if (!value) return null;
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = findOutputText(item);
        if (found) return found;
      }
      return null;
    }
    if (typeof value !== "object") return null;
    if ((value.type === "output_text" || value.type === "text") && typeof value.text === "string") {
      return value.text;
    }
    for (const key of ["output", "content", "message"]) {
      const found = findOutputText(value[key]);
      if (found) return found;
    }
    return null;
  }

  const outputText = findOutputText(data && data.output);
  if (outputText) {
    return outputText;
  }

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

  // Keep this status separate from the network call. If CloudPebble loses the
  // phone connection after this point, the failure is in the phone-side
  // networking layer rather than AppMessage.
  sendStatus("Question received");

  setTimeout(function () {
    sendStatus("Calling Doubao...");

    let request;
    try {
      request = new XMLHttpRequest();
      request.open("POST", DOUBAO_URL);
      request.setRequestHeader("Content-Type", "application/json");
      request.setRequestHeader("Authorization", "Bearer " + DOUBAO_API_KEY);
    } catch (error) {
      console.log("Doubao request setup error: " + error);
      sendStatus("Request setup failed");
      sendResponse("Could not start the AI request.");
      return;
    }

    request.onload = function () {
    if (request.status < 200 || request.status >= 300) {
      console.log("Doubao HTTP error: " + request.status + " " + request.responseText);
      sendStatus("AI request failed");
      sendResponse("Doubao request failed: " + request.status);
      return;
    }

    try {
      const data = JSON.parse(request.responseText);
      // Send the answer and its final status together. Sending two immediate
      // AppMessages can cause the CloudPebble simulator to deliver only the
      // second one.
      sendResponse(extractAnswer(data), "AI reply received");
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
    try {
      request.send(JSON.stringify({
        model: DOUBAO_MODEL,
        instructions: "Answer briefly in English. Keep the answer suitable for a small round smartwatch display.",
        input: question,
        max_output_tokens: 120
      }));
    } catch (error) {
      console.log("Doubao request send error: " + error);
      sendStatus("Request send failed");
      sendResponse("Could not send the AI request.");
    }
  }, 300);
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
