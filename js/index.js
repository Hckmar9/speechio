const textarea = document.querySelector("textarea");
const voiceList = document.querySelector("select");
const speechBtn = document.querySelector("button");
const restartBtn = document.querySelector(".restart-btn");
let currentUtterance = null;
let synth = speechSynthesis;
let isSpeaking = false;

async function initializeVoices() {
  // Ensure voices are loaded. - This is a workaround for a bug in some browsers.
  if (synth.getVoices().length === 0) {
    await new Promise((resolve) => {
      synth.onvoiceschanged = resolve;
    });
  }

  const voices = synth.getVoices();
  voiceList.innerHTML = "";

  // Here's the voice compatibility workaround
  const compatibleVoices = voices
    .filter((voice) => {
      // Chrome/Edge/Desktop browsers
      if (
        voice.voiceURI.includes("Google") ||
        voice.voiceURI.includes("Microsoft")
      )
        return true;

      // Firefox/Safari
      if (voice.lang.startsWith("en-")) return true;

      return false;
    })
    .slice(0, 5); // Limit to 5 voices because I had a ton.

  // Fallback system to double-check it's working
  if (compatibleVoices.length === 0) {
    showError(
      "No voices found. Check browser permissions and/or try Chrome/Edge."
    );
    return;
  }

  compatibleVoices.forEach((voice) => {
    const option = new Option(`${voice.name} (${voice.lang})`, voice.voiceURI);
    voiceList.add(option);
  });

  voiceList.value =
    compatibleVoices.find((v) => v.lang === "en-US" || v.lang === "en-GB")
      ?.voiceURI || compatibleVoices[0].voiceURI;
}

function speak() {
  if (currentUtterance) {
    synth.cancel(); // Stop any ongoing speech
  }

  currentUtterance = new SpeechSynthesisUtterance(textarea.value);
  const selectedVoice = synth
    .getVoices()
    .find((v) => v.voiceURI === voiceList.value);

  if (!selectedVoice) {
    showError("Voice unavailable");
    return;
  }

  currentUtterance.voice = selectedVoice;

  currentUtterance.onstart = () => {
    speechBtn.querySelector("span").textContent = "Pause";
    speechBtn.querySelector("i").className = "fas fa-pause";
  };

  currentUtterance.onend = () => {
    speechBtn.querySelector("span").textContent = "Convert";
    speechBtn.querySelector("i").className = "fas fa-play";
    restartBtn.style.display = "none";
  };

  synth.speak(currentUtterance);
  restartBtn.style.display = "flex";
}

function showError(message) {
  const errorBox = document.createElement("div");
  errorBox.className = "error-message";
  errorBox.textContent = message;

  document.body.appendChild(errorBox);
  setTimeout(() => errorBox.remove(), 3000);
}

speechBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  if (!textarea.value.trim()) {
    showError("Enter text first!");
    return;
  }

  if (synth.speaking && !synth.paused) {
    synth.pause();
    speechBtn.querySelector("span").textContent = "Resume";
    speechBtn.querySelector("i").className = "fas fa-play";
  } else if (synth.speaking && synth.paused) {
    synth.resume();
    speechBtn.querySelector("span").textContent = "Pause";
    speechBtn.querySelector("i").className = "fas fa-pause";
  } else {
    speak();
  }
});

restartBtn.addEventListener("click", (e) => {
  e.preventDefault();
  if (textarea.value.trim()) {
    synth.cancel();
    speak();
  }
});

initializeVoices().catch(console.error);
