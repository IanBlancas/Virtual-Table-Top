
// Global sound tracker shared by all widgets
const GLOBAL_SOUNDS = new Set();



window.soundboardRemoteStopAll = function () {
  GLOBAL_SOUNDS.forEach((a) => {
    a.pause();
    a.currentTime = 0;
    a.loop = false;
  });
};

// At top-level in soundboard.js
window.__pendingRemoteSounds = window.__pendingRemoteSounds || [];

window.soundboardRemotePlay = async function (msg) {
  const url = msg.url;
  if (!url) return;

  // If this client hasn't unlocked audio yet, queue it
  if (!window.__audioUnlocked) {
    window.__pendingRemoteSounds.push(msg);
    console.warn("Audio locked; queued remote sound. User must interact once to enable audio.");
    return;
  }

  const a = new Audio(url);
  a.loop = !!msg.loop;

  let v = Number(msg.volume);
  if (!Number.isFinite(v)) v = 1;
  a.volume = Math.min(1, Math.max(0, v));

  GLOBAL_SOUNDS.add(a);
  a.addEventListener("ended", () => GLOBAL_SOUNDS.delete(a));

  try {
    a.currentTime = 0;
    await a.play();
  } catch (err) {
    console.error("Remote audio playback failed:", err);
  }
};

// ===== Soundboard widget (HTML/JS only, draggable & resizable) =====
Widget.builders.soundboard = function (props = {}) {
  const el = document.createElement("div");
  el.className = "widget soundboard-widget";
  el.dataset.type = "soundboard";
  el.innerHTML = `
    <div class="header">
      <div>🎵 Soundboard</div>
      <button class="close" title="Remove">&times;</button>
    </div>
    <div class="body">
      <div class="controls">
        <button class="stopAll">⏹ Stop All</button>
        <button class="uploadSound">⬆ Upload</button>
        <input type="file" class="uploadInput" accept="audio/*" style="display:none">
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

  function initSoundContainer(container) {
    const audio = new Audio(container.dataset.sound);
    sounds.push(audio);
    GLOBAL_SOUNDS.add(audio);
    audio.addEventListener('ended', () => GLOBAL_SOUNDS.delete(audio));

    const playBtn = container.querySelector('.play');
    const loopBtn = container.querySelector('.loop');
    const volSlider = container.querySelector('.volume');

    playBtn.addEventListener('click', async () => {
      try {
        audio.currentTime = 0;
        await audio.play();
      } catch (err) {
        console.error('Audio playback failed:', err);
        return;
      }
    
      // Broadcast to lobby
      if (typeof window.sendLobbyMessage === "function") {
        window.sendLobbyMessage({
          type: "sound_play",
          clientId: window.__clientId,
          url: container.dataset.sound,
          loop: audio.loop,
          volume: audio.volume
        });
      }
    });

    loopBtn.addEventListener('click', () => {
      audio.loop = !audio.loop;
      loopBtn.textContent = `🔁 Loop: ${audio.loop ? 'On' : 'Off'}`;
    });

    volSlider.addEventListener('input', () => { audio.volume = volSlider.value; });
  }

  // initialize existing hardcoded sound tiles
  el.querySelectorAll('.sound').forEach(initSoundContainer);

  // helper to create a new sound tile and initialize it
  function appendSoundTile(name, url) {
    const grid = el.querySelector('.soundboard-grid');
    const container = document.createElement('div');
    container.className = 'sound';
    container.dataset.sound = url;

    const h = document.createElement('h4'); h.textContent = name; container.appendChild(h);
    const playBtn = document.createElement('button'); playBtn.className = 'play'; playBtn.textContent = '▶ Play'; container.appendChild(playBtn);
    const loopBtn = document.createElement('button'); loopBtn.className = 'loop'; loopBtn.textContent = '🔁 Loop: Off'; container.appendChild(loopBtn);
    const vol = document.createElement('input'); vol.type = 'range'; vol.className = 'volume'; vol.min=0; vol.max=1; vol.step=0.01; vol.value=1; container.appendChild(vol);

    grid.appendChild(container);
    initSoundContainer(container);
  }

  // CSRF helper
  function getCookie(name) {
    const v = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return v ? v.pop() : '';
  }

  // wire upload UI
  const uploadBtn = el.querySelector('.uploadSound');
  const uploadInput = el.querySelector('.uploadInput');
  uploadBtn.addEventListener('click', () => uploadInput.click());
  uploadInput.addEventListener('change', () => {
    const file = uploadInput.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('audio', file);

    fetch('/board/api/upload_sound/', {
      method: 'POST',
      headers: { 'X-CSRFToken': getCookie('csrftoken') },
      body: fd,
    }).then(r => r.json()).then(json => {
      if (json.error) { alert('Upload failed: ' + json.error); return; }
      // server returns url and name
      appendSoundTile(json.name || file.name, json.url);
      uploadInput.value = '';
    }).catch(err => { console.error('Upload error', err); alert('Upload failed'); });
  });

el.querySelector(".stopAll").addEventListener("click", () => {
  GLOBAL_SOUNDS.forEach((a) => {
    a.pause();
    a.currentTime = 0;
    a.loop = false;
  });

  if (typeof window.sendLobbyMessage === "function") {
    window.sendLobbyMessage({
      type: "sound_stop_all",
      clientId: window.__clientId
    });
  }
});


el.querySelector(".close").addEventListener("click", (e) => {
  e.stopPropagation();
  sounds.forEach((a) => {
    a.pause();
    a.currentTime = 0;
    a.loop = false;
    GLOBAL_SOUNDS.delete(a);
  });
});



  return el;
};

// Helper to dynamically resolve Django static URLs
function staticUrl(path) {
  return `/static/${path}`;
}
