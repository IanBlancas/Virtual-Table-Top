
// Global sound tracker shared by all widgets
const GLOBAL_SOUNDS = new Set();

// ===== Soundboard widget (HTML/JS only, draggable & resizable) =====
Widget.builders.soundboard = function (props = {}) {
  const el = document.createElement("div");
  el.className = "widget soundboard-widget";
  el.innerHTML = `
    <div class="header">
      <div>🎵 Soundboard</div>
      <button class="close" title="Remove">&times;</button>
    </div>
    <div class="body">
      <div class="controls">
        <button class="stopAll">⏹ Stop All</button>
      </div>
      <div class="soundboard-grid">
        <div class="sound" data-sound="${staticUrl('board/sounds/bruh.mp3')}">
          <h4>Bruh</h4>
          <button class="play">▶ Play</button>
          <button class="loop">🔁 Loop: Off</button>
          <input type="range" class="volume" min="0" max="1" step="0.01" value="1">
        </div>
        <div class="sound" data-sound="${staticUrl('board/sounds/yippee.mp3')}">
          <h4>Yippee</h4>
          <button class="play">▶ Play</button>
          <button class="loop">🔁 Loop: Off</button>
          <input type="range" class="volume" min="0" max="1" step="0.01" value="1">
        </div>
        <div class="sound" data-sound="${staticUrl('board/sounds/womp womp.mp3')}">
          <h4>Womp Womp</h4>
          <button class="play">▶ Play</button>
          <button class="loop">🔁 Loop: Off</button>
          <input type="range" class="volume" min="0" max="1" step="0.01" value="0.8">
        </div>
        <div class="sound" data-sound="${staticUrl('board/sounds/ambience.mp3')}">
          <h4>Ambience</h4>
          <button class="play">▶ Play</button>
          <button class="loop">🔁 Loop: Off</button>
          <input type="range" class="volume" min="0" max="1" step="0.01" value="0.8">
        </div>
      </div>
    </div>
  `;

  makeDraggable(el, el.querySelector(".header"));
  el.style.width = (props.width ?? 300) + "px";
  //el.style.height = (props.height ?? 250) + "px";
  el.style.position = "absolute";

  const sounds = [];
  el.querySelectorAll(".sound").forEach((container) => {
    const audio = new Audio(container.dataset.sound);
    sounds.push(audio);
    GLOBAL_SOUNDS.add(audio);
    audio.addEventListener("ended", () => GLOBAL_SOUNDS.delete(audio));

    const playBtn = container.querySelector(".play");
    const loopBtn = container.querySelector(".loop");
    const volSlider = container.querySelector(".volume");

    playBtn.addEventListener("click", async () => {
      try {
        audio.currentTime = 0;
        await audio.play();
      } catch (err) {
        console.error("Audio playback failed:", err);
      }
    });

    loopBtn.addEventListener("click", () => {
      audio.loop = !audio.loop;
      loopBtn.textContent = `🔁 Loop: ${audio.loop ? "On" : "Off"}`;
    });

    volSlider.addEventListener("input", () => {
      audio.volume = volSlider.value;
    });
  });

el.querySelector(".stopAll").addEventListener("click", () => {
  GLOBAL_SOUNDS.forEach((a) => {
    a.pause();
    a.currentTime = 0;
    a.loop = false;
  });
});


el.querySelector(".close").addEventListener("click", () => {
  // Stop and remove any active sounds from this widget
  sounds.forEach((a) => {
    a.pause();
    a.currentTime = 0;
    a.loop = false;
    GLOBAL_SOUNDS.delete(a);
  });
  el.remove();
});



  return el;
};

// Helper to dynamically resolve Django static URLs
function staticUrl(path) {
  return `/static/${path}`;
}
