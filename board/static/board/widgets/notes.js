// ===== Notes Widget (manual resize in both directions) =====
Widget.builders.notes = function (props = {}) {
  const el = document.createElement("div");
  el.className = "widget notes-widget";
  el.innerHTML = `
    <div class="header">
      <div>📝 Notes</div>
      <button class="close" title="Remove">&times;</button>
    </div>
    <div class="body">
      <textarea class="notes-area" placeholder="Write your notes here...">${props.text || ""}</textarea>
    </div>
  `;

  // Make draggable via header
  makeDraggable(el, el.querySelector(".header"));

  // Default widget size
  el.style.width = props.width ? props.width + "px" : "280px";
  el.style.height = props.height ? props.height + "px" : "200px";
  el.style.minWidth = "160px";
  el.style.minHeight = "100px";
  el.style.resize = "both";
  el.style.overflow = "hidden";
  el.style.boxSizing = "border-box";

  // Setup textarea to fill widget area
  const area = el.querySelector(".notes-area");
  const header = el.querySelector(".header");
  const body = el.querySelector(".body");

  // body takes all space below header
  body.style.height = `calc(100% - ${header.offsetHeight}px)`;
  body.style.display = "flex";

  // textarea styling
  area.style.flex = "1";
  area.style.width = "100%";
  area.style.height = "100%";
  area.style.border = "none";
  area.style.outline = "none";
  area.style.resize = "none"; // we resize the widget, not the textarea
  area.style.padding = "8px";
  area.style.fontFamily = "monospace";
  area.style.fontSize = "14px";
  area.style.boxSizing = "border-box";
  area.style.background = "#fffdf7";

  // --- When widget is resized, keep textarea filling space ---
  const observer = new ResizeObserver(() => {
    body.style.height = `calc(100% - ${header.offsetHeight}px)`;
  });
  observer.observe(el);

  return el;
};
