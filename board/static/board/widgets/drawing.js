// =======================================
// VECTOR DRAWING ENGINE 
// =======================================

// public API
const Drawing = {
    init,
    toggle,
    resizeCanvas,
    render,
    enable,
    disable,
    strokes: [],
};

let drawCanvas, drawCtx;
let drawingMode = false;
let currentStroke = null;
let eraserArmed = false;   // eraser tool selected
let erasingNow  = false;   // mouse is held down in eraser mode
let undoStack = [];
let redoStack = [];
let needsRender = true;


function isOverWidget(clientX, clientY) {
    const el = document.elementFromPoint(clientX, clientY);
    return el && el.closest('.widget');
}


// called by layout.html after board is ready
function init(canvasElement) {
    drawCanvas = canvasElement;
    drawCtx = drawCanvas.getContext("2d");

    // resize to visible area
    resizeCanvas();

    // pointer events
    const wrap = document.getElementById("wrap");

    // Mouse events
    wrap.addEventListener("mousedown", startStroke);
    wrap.addEventListener("mousemove", extendStroke);
    window.addEventListener("mouseup", endStroke);

    // Touch events
    wrap.addEventListener("touchstart", function(e) {
        if (!drawingMode) return;
        if (e.touches.length > 0) {
            const t = e.touches[0];
            // Simulate mouse event
            startStroke({
                clientX: t.clientX,
                clientY: t.clientY,
                preventDefault: () => e.preventDefault(),
                stopPropagation: () => e.stopPropagation()
            });
        }
    }, { passive: false });
    wrap.addEventListener("touchmove", function(e) {
        if (!drawingMode) return;
        if (e.touches.length > 0) {
            const t = e.touches[0];
            extendStroke({
                clientX: t.clientX,
                clientY: t.clientY,
                preventDefault: () => e.preventDefault(),
                stopPropagation: () => e.stopPropagation()
            });
        }
    }, { passive: false });
    window.addEventListener("touchend", function(e) {
        if (!drawingMode) return;
        endStroke();
    });

    requestAnimationFrame(loop);
}

function toggle() {
    drawingMode = !drawingMode;
    drawCanvas.style.pointerEvents = drawingMode ? "auto" : "none";
    return drawingMode;
}

function enable() {
    drawingMode = true;
    drawCanvas.style.pointerEvents = "auto";
}

function disable() {
    drawingMode = false;
    drawCanvas.style.pointerEvents = "none";
}

function resizeCanvas() {
    const wrap = document.getElementById("wrap");
    drawCanvas.width = wrap.clientWidth;
    drawCanvas.height = wrap.clientHeight;
    needsRender = true;
}

function startStroke(e) {
    if (!drawingMode) return;

    if (isOverWidget(e.clientX, e.clientY)) return;

    const { x, y } = getBoardCoords(e);

    // --- Start erasing if eraser tool is armed ---
    if (eraserArmed) {
        erasingNow = true;
        eraseAt(x, y, window.eraseSize || 20);
        return;
    }

    // --- normal drawing ---
    currentStroke = {
        color: window.drawColor || "#000000",
        size: window.drawSize || 4,
        points: [{ x, y }]
    };

    Drawing.strokes.push(currentStroke);
    undoStack.push(Drawing.strokes.slice());
}

function extendStroke(e) {

    // BLOCK drawing or erasing on any widget
   if (isOverWidget(e.clientX, e.clientY)) return;

    const { x, y } = getBoardCoords(e);

    // --- continuous erase while mouse is held ---
    if (erasingNow) {
        eraseAt(x, y, window.eraseSize || 20);
        return;
    }

    // --- drawing normally ---
    if (!drawingMode || !currentStroke) return;

    currentStroke.points.push({ x, y });
    needsRender = true;
}

function endStroke() {
    currentStroke = null;
    erasingNow = false;   // stop erasing when mouse lifted
}

function getBoardCoords(e) {
    const rect = drawCanvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left - window.panX) / window.scale,
        y: (e.clientY - rect.top - window.panY) / window.scale,
    };
}

// ===== REAL ERASER: removes strokes near cursor =====
function eraseAt(x, y, radius = 20) {
    const r2 = radius * radius;

    Drawing.strokes = Drawing.strokes.filter(stroke => {
        // keep strokes ONLY if no point is within erase radius
        return !stroke.points.some(p => {
            const dx = p.x - x;
            const dy = p.y - y;
            return (dx*dx + dy*dy) < r2;
        });
    });

    needsRender = true;
}

function render() {
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);

    for (const stroke of Drawing.strokes) {
        drawCtx.strokeStyle = stroke.color;
        drawCtx.lineWidth = stroke.size * window.scale;
        drawCtx.lineCap = "round";
        drawCtx.lineJoin = "round";

        drawCtx.beginPath();

        for (let i = 0; i < stroke.points.length; i++) {
            const p = stroke.points[i];
            const px = p.x * window.scale + window.panX;
            const py = p.y * window.scale + window.panY;

            if (i === 0) drawCtx.moveTo(px, py);
            else drawCtx.lineTo(px, py);
        }

        drawCtx.stroke();
    }
}

function loop() {
    if (needsRender) {
        render();
        needsRender = false;
    }
    requestAnimationFrame(loop);
}

// Expose for save/load
window.Drawing = Drawing;
