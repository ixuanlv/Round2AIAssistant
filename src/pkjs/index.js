// Phone-side companion for the first CloudPebble test.
// This deliberately returns a local test reply. The AI API will be added
// only after watch-phone messaging and dictation are verified on Gabbro.

Pebble.addEventListener("ready", function () {
  console.log("Round2 AI Assistant phone side ready");
  Pebble.sendAppMessage({
    STATUS: "Phone link ready"
  });
});

Pebble.addEventListener("appmessage", function (event) {
  const question = event.payload.QUESTION;
  if (!question) return;

  console.log("Question from watch: " + question);
  Pebble.sendAppMessage({
    RESPONSE: "Test reply OK. AI API is not connected yet."
  });
});
