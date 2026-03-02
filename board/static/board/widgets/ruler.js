// Ruler tool for FlatTop — measures distances on the board (dual-scale, snapping)
(function(){
  function initRuler(){
    const rulerBtn = document.getElementById('ruler_Button');
    const wrap = document.getElementById('wrap');
    const board = document.getElementById('board');
    if (!rulerBtn || !wrap || !board) return;

    const SVG_NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(SVG_NS,'svg');
    svg.id = 'ruler-svg';
    svg.style.position = 'absolute';
    svg.style.left = '0';
    svg.style.top = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '9999';
    wrap.appendChild(svg);

    const label = document.createElement('div');
    label.className = 'ruler-label';
    label.style.position = 'absolute';
    label.style.zIndex = '10000';
    label.style.display = 'none';
    wrap.appendChild(label);

    const toolbar = document.querySelector('.toolbar') || document.body;
    const panel = document.createElement('div');
    panel.className = 'ruler-panel';
    panel.style.display = 'inline-flex';
    panel.style.alignItems = 'center';
    panel.style.gap = '6px';
    panel.style.marginLeft = '8px';

    const unitSelect = document.createElement('select');
    ['px','ft','m','in','cm'].forEach(u => { const o = document.createElement('option'); o.value = u; o.textContent = u; unitSelect.appendChild(o); });

    const unitsPerCellInput = document.createElement('input');
    unitsPerCellInput.type = 'number';
    unitsPerCellInput.step = 'any';
    unitsPerCellInput.style.width = '80px';
    unitsPerCellInput.placeholder = 'units/cell';

    const snapCheckbox = document.createElement('input');
    snapCheckbox.type = 'checkbox';
    snapCheckbox.id = 'rulerSnap';
    const snapLabel = document.createElement('label');
    snapLabel.htmlFor = 'rulerSnap';
    snapLabel.textContent = 'Snap to grid centers';

    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Clear';

    panel.appendChild(unitSelect);
    panel.appendChild(unitsPerCellInput);
    panel.appendChild(snapCheckbox);
    panel.appendChild(snapLabel);
    panel.appendChild(clearBtn);
    panel.style.visibility = 'hidden';
    toolbar.appendChild(panel);

    let active = false;
    let pointA = null;
    let currentLine = null;
    let markers = [];

    const CELL = window.CELL || 40;

    function defaultUnitsPerCell(unit){
      // sensible defaults: assume 1 cell = 5 ft by default
      switch(unit){
        case 'ft': return 5;
        case 'm': return 5 / 3.28084; // meters equivalent to 5 ft
        case 'in': return 5 * 12;
        case 'cm': return 5 * 12 * 2.54;
        case 'px': return CELL; // units per cell in px
        default: return 5;
      }
    }

    const storageKey = 'flattop.ruler.settings';
    let settings = { unit: 'ft', unitsPerCell: defaultUnitsPerCell('ft'), pxPerUnit: CELL / defaultUnitsPerCell('ft'), snapToCenters: true };
    try { const raw = localStorage.getItem(storageKey); if (raw) settings = JSON.parse(raw); } catch(e){}
    unitSelect.value = settings.unit;
    unitsPerCellInput.value = settings.unitsPerCell || defaultUnitsPerCell(settings.unit);
    snapCheckbox.checked = !!settings.snapToCenters;

    function saveSettings(){
      settings.unit = unitSelect.value;
      settings.unitsPerCell = parseFloat(unitsPerCellInput.value) || defaultUnitsPerCell(settings.unit);
      settings.pxPerUnit = CELL / settings.unitsPerCell;
      settings.snapToCenters = !!snapCheckbox.checked;
      localStorage.setItem(storageKey, JSON.stringify(settings));
    }

    unitSelect.addEventListener('change', ()=>{
      unitsPerCellInput.value = defaultUnitsPerCell(unitSelect.value);
      saveSettings();
    });
    // update on input so changing the field immediately affects measurements
    unitsPerCellInput.addEventListener('input', saveSettings);
    unitsPerCellInput.addEventListener('change', saveSettings);
    snapCheckbox.addEventListener('change', saveSettings);
    clearBtn.addEventListener('click', clearMeasurements);

    function toBoardCoordsLocal(clientX, clientY){
      if (typeof window.toBoardCoords === 'function') return window.toBoardCoords(clientX, clientY);
      const rect = board.getBoundingClientRect();
      const scale = window.scale || 1;
      return { x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale };
    }

    function boardToScreen(boardX, boardY){
      const rect = board.getBoundingClientRect();
      const scale = window.scale || 1;
      return { x: rect.left + boardX * scale, y: rect.top + boardY * scale };
    }

    function centerSnap(boardPt){
      if (!snapCheckbox.checked) return boardPt;
      const cx = Math.round((boardPt.x - CELL/2) / CELL) * CELL + CELL/2;
      const cy = Math.round((boardPt.y - CELL/2) / CELL) * CELL + CELL/2;
      return { x: cx, y: cy };
    }

    function drawLine(a, b){
      if (currentLine) currentLine.remove();
      const line = document.createElementNS(SVG_NS,'line');
      const pA = boardToScreen(a.x,a.y);
      const pB = boardToScreen(b.x,b.y);
      const wrect = wrap.getBoundingClientRect();
      line.setAttribute('x1', pA.x - wrect.left);
      line.setAttribute('y1', pA.y - wrect.top);
      line.setAttribute('x2', pB.x - wrect.left);
      line.setAttribute('y2', pB.y - wrect.top);
      line.setAttribute('stroke','#00e5ff');
      line.setAttribute('stroke-width','3');
      line.setAttribute('stroke-linecap','round');
      svg.appendChild(line);
      currentLine = line;
      return line;
    }

    function drawMarker(pt){
      const wrect = wrap.getBoundingClientRect();
      const p = boardToScreen(pt.x,pt.y);
      const cx = p.x - wrect.left, cy = p.y - wrect.top;
      const circle = document.createElementNS(SVG_NS,'circle');
      circle.setAttribute('cx', cx);
      circle.setAttribute('cy', cy);
      circle.setAttribute('r', 6);
      circle.setAttribute('fill','#ff4081');
      circle.setAttribute('stroke','#fff');
      circle.setAttribute('stroke-width','1');
      svg.appendChild(circle);
      markers.push(circle);
    }

    function clearMeasurements(){
      pointA = null;
      if (currentLine) { currentLine.remove(); currentLine = null; }
      markers.forEach(m => m.remove()); markers = [];
      label.style.display = 'none';
    }

    function formatDistance(pixels){
      const unit = unitSelect.value;
      const unitsPerCell = parseFloat(unitsPerCellInput.value) || defaultUnitsPerCell(unit);
      const pxPerUnit = CELL / unitsPerCell;
      const squares = (pixels / CELL);
      const primary = unit === 'px' ? `${pixels.toFixed(0)} px` : `${(pixels / pxPerUnit).toFixed(2)} ${unit}`;
      const secondary = `${squares.toFixed(2)} squares`;
      return { primary, secondary };
    }

    function onWrapClick(e){
      if (!active) return;
      if (e.button !== 0) return;
      let pt = toBoardCoordsLocal(e.clientX, e.clientY);
      if (snapCheckbox.checked) pt = centerSnap(pt);
      if (!pointA) {
        pointA = pt;
        drawMarker(pointA);
      } else {
        drawMarker(pt);
        drawLine(pointA, pt);
        const dx = pt.x - pointA.x, dy = pt.y - pointA.y;
        const dist = Math.hypot(dx, dy);
        const mid = { x: (pointA.x + pt.x)/2, y: (pointA.y + pt.y)/2 };
        const screenMid = boardToScreen(mid.x, mid.y);
        const f = formatDistance(dist);
        label.innerHTML = `<div class="primary">${f.primary}</div><div class="secondary">${f.secondary}</div>`;
        label.style.left = (screenMid.x + 12) + 'px';
        label.style.top = (screenMid.y + 12) + 'px';
        label.style.display = 'block';
        pointA = null;
      }
    }

    function onMouseMove(e){
      if (!active) return;
      if (!pointA) return;
      let pt = toBoardCoordsLocal(e.clientX, e.clientY);
      if (snapCheckbox.checked) pt = centerSnap(pt);
      drawLine(pointA, pt);
      const dx = pt.x - pointA.x, dy = pt.y - pointA.y;
      const dist = Math.hypot(dx, dy);
      const mid = { x: (pointA.x + pt.x)/2, y: (pointA.y + pt.y)/2 };
      const screenMid = boardToScreen(mid.x, mid.y);
      const f = formatDistance(dist);
      label.innerHTML = `<div class="primary">${f.primary}</div><div class="secondary">${f.secondary}</div>`;
      label.style.left = (screenMid.x + 12) + 'px';
      label.style.top = (screenMid.y + 12) + 'px';
      label.style.display = 'block';
    }

    rulerBtn.addEventListener('click', ()=>{
      active = !active;
      rulerBtn.classList.toggle('active', active);
      panel.style.visibility = active ? 'visible' : 'hidden';
      wrap.style.cursor = active ? 'crosshair' : 'default';
      if (!active) clearMeasurements();
    });

    window.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') clearMeasurements(); });

    wrap.addEventListener('click', onWrapClick);
    wrap.addEventListener('mousemove', onMouseMove);

    window.addEventListener('resize', ()=>{ if (currentLine) currentLine.remove(), currentLine = null; markers.forEach(m=>m.remove()); markers=[]; label.style.display='none'; });

    window.RulerTool = { clear: clearMeasurements };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initRuler); else initRuler();
})();
