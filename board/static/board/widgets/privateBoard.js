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
      el.addEventListener('wheel', (ev)=>{
        // ctrl+wheel for zoom
        if (!ev.ctrlKey) return;
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

      // middle-button pan
      let panning = false, start = {x:0,y:0}, base = {x:0,y:0};
      el.addEventListener('pointerdown', (e)=>{
        if (e.button !== 1) return;
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
