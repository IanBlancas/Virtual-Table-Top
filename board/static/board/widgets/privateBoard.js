// Simple per-user private board (ephemeral in-memory)
(function(){
  const PrivateBoard = {
    container: null,
    boardEl: null,
    contentEl: null, // inner content that is transformed for pan/zoom
    scale: 1,
    panX: 0,
    panY: 0,
    init(opts = {}){
      this.container = document.querySelector(opts.container || '#private-panel');
      this.boardEl = this.container && this.container.querySelector('#private-board');
      if (!this.container || !this.boardEl) return;
      // ensure an inner content layer we can transform for pan/zoom
      let c = this.boardEl.querySelector('.private-content');
      if (!c) {
        c = document.createElement('div');
        c.className = 'private-content';
        c.style.position = 'relative';
        c.style.width = '100%';
        c.style.height = '100%';
        c.style.transformOrigin = '0 0';
        // transfer existing children (none on first init)
        while (this.boardEl.firstChild) c.appendChild(this.boardEl.firstChild);
        this.boardEl.appendChild(c);
      }
      this.contentEl = c;
      this._attachControls();
      this._attachPanZoom();
      this._attachSelection();
    },

    _attachControls(){
      const addNote = this.container.querySelector('#private-add-note');
      const addToken = this.container.querySelector('#private-add-token');

      // apply grid styling to private board
      const GRID = window.CELL || 40;
      this.boardEl.style.backgroundImage = `linear-gradient(#e9e9e9 1px, transparent 1px), linear-gradient(90deg, #e9e9e9 1px, transparent 1px)`;
      this.boardEl.style.backgroundSize = `${GRID}px ${GRID}px, ${GRID}px ${GRID}px`;

      addNote?.addEventListener('click', () => this._createNote());
      addToken?.addEventListener('click', () => this._createToken());
    },

    _createNote(text = ''){
      if (window.Widget && typeof Widget.create === 'function') {
        try {
          const el = Widget.create('notes', 10, 10, { text }, this.contentEl);
          return el;
        } catch (e) {
          console.warn('Widget.create(notes) failed, falling back to builtin note', e);
        }
      }
      const el = document.createElement('div');
      el.className = 'private-widget private-note';
      el.style.left = '10px';
      el.style.top  = '10px';
      el.style.width = '220px';
      el.style.height = '140px';
      el.innerHTML = `
        <div class="phdr">📝 Private Note <button class="pclose">&times;</button></div>
        <div class="pbody"><textarea class="ptext">${text}</textarea></div>
      `;
      this.contentEl.appendChild(el);
      try { el.dataset.private = '1'; } catch (e) {}
      el.querySelector('.pclose').addEventListener('click', () => el.remove());
      this._makeDraggable(el);
      return el;
    },

    _createToken(label='Token'){
      if (window.Widget && typeof Widget.create === 'function' && Widget.builders?.token) {
        try {
          const el = Widget.create('token', 10, 10, { label }, this.contentEl);
          return el;
        } catch (e) {
          console.warn('Widget.create(token) failed, falling back to builtin token', e);
        }
      }
      const el = document.createElement('div');
      el.className = 'private-widget private-token';
      el.style.left = '10px';
      el.style.top  = '10px';
      el.style.width = '48px';
      el.style.height = '48px';
      el.textContent = label;
      this.contentEl.appendChild(el);
      try { el.dataset.private = '1'; } catch (e) {}
      this._makeDraggable(el);
      return el;
    },

    _createCard(cardData = {}, opts = {}){
      const el = document.createElement('div');
      el.className = 'playing-card draggable private-widget';
      el.dataset.type = 'card';
      el.dataset.private = '1';
      el.dataset.itemId = opts.itemId || (crypto?.randomUUID?.() || ('id-' + Math.random().toString(16).slice(2)));

      const w = opts.w || 40;
      const h = opts.h || 60;
      const x = opts.x || 10;
      const y = opts.y || 10;

      el.style.position = 'absolute';
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.width = w + 'px';
      el.style.height = h + 'px';
      el.style.zIndex = opts.z || 1;

      el._cardData = cardData || {};
      el._flipped = !!opts.flipped;

      function renderCardFace() {
        el.textContent = '';
        el.innerHTML = '';

        if (el._flipped) {
          el.classList.add('back');
          el.classList.remove('red');
          return;
        }

        el.classList.remove('back');

        if (el._cardData?.image) {
          const img = document.createElement('img');
          img.src = el._cardData.image;
          img.draggable = false;
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'cover';
          el.appendChild(img);
          el.classList.remove('red');
          return;
        }

        if (el._cardData?.rank && el._cardData?.suit) {
          el.textContent = `${el._cardData.rank}${el._cardData.suit}`;
          if (el._cardData.color === 'red') el.classList.add('red');
          else el.classList.remove('red');
          return;
        }

        el.textContent = el._cardData?.label || '';
        el.classList.remove('red');
      }

      el.flipCard = function() {
        el._flipped = !el._flipped;
        renderCardFace();
      };

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.contentEl.querySelectorAll('.selected').forEach(n => n.classList.remove('selected'));
        el.classList.add('selected');
      });

      renderCardFace();
      this.contentEl.appendChild(el);
      this._makeDraggable(el);
      return el;
    },

    _makeDraggable(el){
      let dragging = false;
      let start = {x:0,y:0}, orig = {x:0,y:0};
      const hdr = el.querySelector('.phdr') || el;
      hdr.style.cursor = 'move';
      const GRID = window.CELL || 40;
      hdr.addEventListener('pointerdown', (e)=>{
        // multi-drag support: if this element is selected, drag all selected
        const isSelected = el.classList.contains('selected');
        dragging = true;
        start.x = e.clientX; start.y = e.clientY;
        orig.x = parseFloat(el.style.left)||0; orig.y = parseFloat(el.style.top)||0;
        // capture start positions for multi-drag
        if (isSelected) {
          const sel = Array.from(this.contentEl.querySelectorAll('.private-widget.selected'));
          this._multiDragInfo = sel.map(n => ({ el: n, sx: parseFloat(n.style.left)||0, sy: parseFloat(n.style.top)||0 }));
        } else {
          this._multiDragInfo = [{ el, sx: orig.x, sy: orig.y }];
          // make this the only selected
          this.contentEl.querySelectorAll('.private-widget.selected').forEach(n => n.classList.remove('selected'));
          el.classList.add('selected');
        }
        hdr.setPointerCapture(e.pointerId);
      });
      window.addEventListener('pointermove', (e)=>{
        if (!dragging) return;
        const dx = (e.clientX - start.x) / (this.scale || 1), dy = (e.clientY - start.y) / (this.scale || 1);
        // move all selected according to multiDragInfo
        for (const info of (this._multiDragInfo || [])){
          info.el.style.left = (info.sx + dx) + 'px';
          info.el.style.top  = (info.sy + dy) + 'px';
        }
      });
      window.addEventListener('pointerup', (e)=>{
        if (!dragging) return;
        dragging = false;
        // snap all moved items
        for (const info of (this._multiDragInfo || [])){
          const left = parseFloat(info.el.style.left) || 0;
          const top  = parseFloat(info.el.style.top)  || 0;
          info.el.style.left = Math.round(left / GRID) * GRID + 'px';
          info.el.style.top  = Math.round(top  / GRID) * GRID + 'px';
        }
        this._multiDragInfo = null;
      });
    },

    getState(){
      const items = [];
      const nodes = Array.from(this.contentEl.querySelectorAll('.private-widget'));
      for (const n of nodes){
        if (n.classList.contains('private-note')){
          items.push({ kind: 'note', x: parseFloat(n.style.left)||0, y: parseFloat(n.style.top)||0, w: parseFloat(n.style.width)||0, h: parseFloat(n.style.height)||0, text: n.querySelector('.ptext')?.value || '' });
        } else if (n.classList.contains('private-token')){
          items.push({ kind: 'token', x: parseFloat(n.style.left)||0, y: parseFloat(n.style.top)||0, label: n.textContent || '' });
        }
      }
      return { version: 1, items };
    },

    applyState(state){
      this.contentEl.innerHTML = '';
      (state?.items || []).forEach(it=>{
        if (it.kind === 'note') this._createNote(it.text || '');
        if (it.kind === 'token') this._createToken(it.label || 'Token');
      });
    },

    // import/export removed — private board is strictly per-user and not shared

    // ----- Pan / zoom for private board -----
    _attachPanZoom(){
      const el = this.boardEl;
      // allow zoom with mouse wheel (match public board) and prevent page scroll
      el.addEventListener('wheel', (ev)=>{
        ev.preventDefault();
        const rect = el.getBoundingClientRect();
        const cx = ev.clientX - rect.left;
        const cy = ev.clientY - rect.top;
        const oldScale = this.scale || 1;
        const delta = -ev.deltaY * 0.0015;
        const newScale = Math.min(3, Math.max(0.3, oldScale * (1 + delta)));
        // adjust pan so the point under cursor stays fixed
        this.panX = (this.panX - cx) * (newScale / oldScale) + cx;
        this.panY = (this.panY - cy) * (newScale / oldScale) + cy;
        this.scale = newScale;
        this._applyTransform();
      }, { passive: false });

      // middle-button pan and space+left-click pan (like public board)
      let panning = false, start = {x:0,y:0}, base = {x:0,y:0};
      let spaceDown = false;
      window.addEventListener('keydown', (e)=>{
        if (e.code === 'Space' && (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA')) {
          spaceDown = true;
          e.preventDefault?.();
        }
      });
      window.addEventListener('keyup', (e)=>{ if (e.code === 'Space') spaceDown = false; });

      el.addEventListener('pointerdown', (e)=>{
        // middle button OR space+left-click
        if (e.button !== 1 && !(e.button === 0 && spaceDown)) return;
        panning = true; start.x = e.clientX; start.y = e.clientY; base.x = this.panX; base.y = this.panY;
        el.setPointerCapture?.(e.pointerId);
      });
      window.addEventListener('pointermove', (e)=>{
        if (!panning) return;
        this.panX = base.x + (e.clientX - start.x);
        this.panY = base.y + (e.clientY - start.y);
        this._applyTransform();
      });
      window.addEventListener('pointerup', (e)=>{ panning = false; });

      // ===== TOUCH PAN + PINCH ZOOM (match public board) =====
      let isTouchPanning = false;
      let isPinching = false;
      let startPan = { x: 0, y: 0 };
      let panOrigin = { x: 0, y: 0 };
      let pinchStartDist = 0;
      let pinchStartScale = 1;
      let pinchCenter = { x: 0, y: 0 };

      function dist(t1, t2) {
        const dx = t1.clientX - t2.clientX;
        const dy = t1.clientY - t2.clientY;
        return Math.hypot(dx, dy);
      }

      el.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          if (isPinching) return;
          isTouchPanning = true;
          const t = e.touches[0];
          startPan.x = t.clientX; startPan.y = t.clientY;
          panOrigin.x = this.panX; panOrigin.y = this.panY;
        }

        if (e.touches.length === 2) {
          isTouchPanning = false;
          isPinching = true;
          pinchStartDist = dist(e.touches[0], e.touches[1]);
          pinchStartScale = this.scale;
          pinchCenter.x = (e.touches[0].clientX + e.touches[1].clientX) / 2;
          pinchCenter.y = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        }
      }, { passive: false });

      el.addEventListener('touchmove', (e) => {
        // Single finger pan
        if (isTouchPanning && e.touches.length === 1) {
          const t = e.touches[0];
          this.panX = panOrigin.x + (t.clientX - startPan.x);
          this.panY = panOrigin.y + (t.clientY - startPan.y);
          this._applyTransform();
          e.preventDefault();
          return;
        }

        // Pinch zoom
        if (isPinching && e.touches.length === 2) {
          const newDist = dist(e.touches[0], e.touches[1]);
          const zoomFactor = newDist / pinchStartDist;
          const newScale = Math.max(0.3, Math.min(3, pinchStartScale * zoomFactor));

          const rect = el.getBoundingClientRect();
          const bx = (pinchCenter.x - rect.left - this.panX) / this.scale;
          const by = (pinchCenter.y - rect.top - this.panY) / this.scale;

          this.panX = pinchCenter.x - rect.left - bx * newScale;
          this.panY = pinchCenter.y - rect.top - by * newScale;

          this.scale = newScale;
          this._applyTransform();
          // if there's a drawing layer, re-render
          if (window.Drawing && typeof window.Drawing.render === 'function') window.Drawing.render();
          e.preventDefault();
        }
      }, { passive: false });

      el.addEventListener('touchend', (e) => {
        if (e.touches.length === 0) {
          isTouchPanning = false; isPinching = false;
        }
        if (e.touches.length === 1) {
          isPinching = false; // one finger left -> go back to panning
        }
      });
    },

    _applyTransform(){
      if (!this.contentEl) return;
      this.contentEl.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.scale})`;
    },

    // ----- Selection (lasso) inside private board -----
    _attachSelection(){
      const board = this.boardEl;
      let selecting = false;
      let selBox = null;
      let start = {x:0,y:0};
      board.addEventListener('pointerdown', (e)=>{
        // only start selection when clicking on empty board area (not on a widget)
        if (e.target !== board) return;
        selecting = true;
        const rect = board.getBoundingClientRect();
        start.x = e.clientX - rect.left;
        start.y = e.clientY - rect.top;
        selBox = document.createElement('div');
        selBox.className = 'private-selection-box';
        selBox.style.position = 'absolute';
        selBox.style.left = start.x + 'px';
        selBox.style.top  = start.y + 'px';
        selBox.style.width = '0px';
        selBox.style.height = '0px';
        selBox.style.border = '1px dashed #666';
        selBox.style.background = 'rgba(100,150,255,0.08)';
        board.appendChild(selBox);
      });
      window.addEventListener('pointermove', (e)=>{
        if (!selecting || !selBox) return;
        const rect = board.getBoundingClientRect();
        const curX = e.clientX - rect.left;
        const curY = e.clientY - rect.top;
        const left = Math.min(start.x, curX), top = Math.min(start.y, curY);
        selBox.style.left = left + 'px'; selBox.style.top = top + 'px';
        selBox.style.width = Math.abs(curX - start.x) + 'px'; selBox.style.height = Math.abs(curY - start.y) + 'px';
      });
      window.addEventListener('pointerup', (e)=>{
        if (!selecting) return;
        selecting = false;
        if (!selBox) return;
        // compute selection rect in board coordinates
        const sRect = selBox.getBoundingClientRect();
        const bRect = board.getBoundingClientRect();
        const sel = {
          left: sRect.left - bRect.left,
          top:  sRect.top  - bRect.top,
          right: sRect.right - bRect.left,
          bottom: sRect.bottom - bRect.top
        };
        // select widgets whose center falls within selection rect
        const widgets = Array.from(this.contentEl.querySelectorAll('.private-widget'));
        widgets.forEach(w => {
          const wr = w.getBoundingClientRect();
          // translate to board coords
          const cx = (wr.left + wr.right)/2 - bRect.left;
          const cy = (wr.top  + wr.bottom)/2 - bRect.top;
          const inside = cx >= sel.left && cx <= sel.right && cy >= sel.top && cy <= sel.bottom;
          w.classList.toggle('selected', inside);
        });
        selBox.remove(); selBox = null;
      });
    }
  };

  window.PrivateBoard = PrivateBoard;
})();
