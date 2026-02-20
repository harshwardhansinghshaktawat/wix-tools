/**
 * Advanced Image Editor - Wix Custom Element
 * Tag: <advanced-image-editor>
 * Element ID in widget: #imageEditor
 *
 * Fixes vs HTML prototype:
 *  • Image always visible — white bg drawn first, blur done off-screen (no CSS filter)
 *  • drawCanvas pointer-events properly delegated through mainCanvas
 *  • Correct canvas layering: main → draw → overlay (compare)
 *  • Full series widget props + panel element IDs
 *
 * Features:
 *  • 14 real-time adjustment sliders (brightness, contrast, exposure, highlights,
 *    shadows, saturation, vibrance, hue, temperature, tint, clarity, sharpness, blur, freeRot)
 *  • Vignette + Film Grain pixel effects
 *  • 12 cinematic filter presets
 *  • Transform: rotate 90° CW/CCW, flip H/V, free-angle (-45° → +45°)
 *  • Resize canvas
 *  • 7 draw tools: Hand, Pen, Rect, Ellipse, Line, Text, Eyedropper
 *  • Draw color, size, opacity, text content/size/weight/color
 *  • Before/After split comparison with draggable divider
 *  • 20-step undo/redo history
 *  • Export: PNG / JPG / WebP with quality + custom output dimensions
 *  • Drag & drop + file picker + clipboard paste
 *  • Keyboard shortcuts (V/P/R/E/L/T/I, Ctrl+Z, Ctrl+Shift+Z)
 */
class AdvancedImageEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    /* ── Series style props ── */
    this.settings = {
      primaryBg: '#ffffff', secondaryBg: '#f8f9fa', borderColor: '#dddddd',
      secondaryText: '#666666', mainAccent: '#3498db', hoverAccent: '#2980b9',
      headingColor: '#2c3e50', paragraphColor: '#333333',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      fontSize: 14, headingSize: 24, borderRadius: 8, buttonPadding: 8
    };

    /* ── Editor state ── */
    this.es = {
      loaded: false,
      originalData: null,   // ImageData — always the source-of-truth pixels
      drawData: null,        // ImageData — annotation layer
      snapDraw: null,        // snapshot before current stroke for shape tools
      tool: 'hand',
      drawColor: '#ff3b30',
      drawSize: 4,
      drawOpacity: 1,
      textContent: 'Text',
      textSize: 36,
      textWeight: '700',
      textColor: '#ffffff',
      isDrawing: false,
      drawStart: null,
      lastPt: null,
      rotation: 0,    // multiples of 90°
      flipH: false,
      flipV: false,
      compareMode: false,
      compareX: 0.5,
      histStack: [],
      histIdx: -1,
      exportFmt: 'png',
      exportQual: 0.92,
      activePreset: 'original',
      adj: {
        brightness: 0, contrast: 0, exposure: 0,
        highlights: 0, shadows: 0,
        saturation: 0, vibrance: 0, hue: 0,
        temperature: 0, tint: 0,
        clarity: 0, sharpness: 0, blur: 0,
        vignette: 0, grain: 0,
        freeRot: 0
      }
    };

    /* ── Presets ── */
    this.PRESETS = {
      original:  { brightness:0,contrast:0,exposure:0,highlights:0,shadows:0,saturation:0,vibrance:0,hue:0,temperature:0,tint:0,clarity:0,sharpness:0,blur:0,vignette:0,grain:0 },
      vivid:     { brightness:5,contrast:25,exposure:.1,highlights:-10,shadows:12,saturation:35,vibrance:30,hue:0,temperature:8,tint:0,clarity:20,sharpness:15,blur:0,vignette:0,grain:0 },
      chrome:    { brightness:8,contrast:32,exposure:.15,highlights:-18,shadows:14,saturation:15,vibrance:12,hue:0,temperature:-5,tint:0,clarity:28,sharpness:20,blur:0,vignette:10,grain:0 },
      fade:      { brightness:18,contrast:-18,exposure:.1,highlights:22,shadows:30,saturation:-28,vibrance:-15,hue:0,temperature:12,tint:5,clarity:-8,sharpness:0,blur:0,vignette:0,grain:6 },
      matte:     { brightness:12,contrast:-12,exposure:.08,highlights:28,shadows:38,saturation:-18,vibrance:-12,hue:0,temperature:10,tint:3,clarity:0,sharpness:0,blur:0,vignette:18,grain:10 },
      noir:      { brightness:-5,contrast:42,exposure:-.1,highlights:-12,shadows:-12,saturation:-100,vibrance:0,hue:0,temperature:0,tint:0,clarity:25,sharpness:20,blur:0,vignette:32,grain:18 },
      warm:      { brightness:5,contrast:10,exposure:.08,highlights:5,shadows:10,saturation:14,vibrance:20,hue:5,temperature:42,tint:5,clarity:10,sharpness:10,blur:0,vignette:0,grain:0 },
      cool:      { brightness:2,contrast:10,exposure:0,highlights:-5,shadows:5,saturation:8,vibrance:12,hue:-5,temperature:-38,tint:-5,clarity:10,sharpness:10,blur:0,vignette:5,grain:0 },
      golden:    { brightness:8,contrast:14,exposure:.12,highlights:-5,shadows:18,saturation:22,vibrance:25,hue:10,temperature:50,tint:8,clarity:14,sharpness:10,blur:0,vignette:22,grain:6 },
      cinematic: { brightness:-8,contrast:36,exposure:-.08,highlights:-25,shadows:-8,saturation:12,vibrance:15,hue:0,temperature:-8,tint:-5,clarity:20,sharpness:14,blur:0,vignette:38,grain:12 },
      vintage:   { brightness:5,contrast:5,exposure:0,highlights:14,shadows:18,saturation:-18,vibrance:-8,hue:15,temperature:25,tint:10,clarity:0,sharpness:0,blur:0,vignette:28,grain:28 },
      punch:     { brightness:0,contrast:42,exposure:0,highlights:-20,shadows:-10,saturation:50,vibrance:42,hue:0,temperature:0,tint:0,clarity:35,sharpness:25,blur:0,vignette:5,grain:0 }
    };

    this._raf = null;
    this._pending = false;
    this._keyHandler = null;
    this._pasteHandler = null;
  }

  /* ── Observed Attributes ── */
  static get observedAttributes() {
    return [
      'primary-bg','secondary-bg','border-color','secondary-text',
      'main-accent','hover-accent','heading-color','paragraph-color',
      'font-family','font-size','heading-size','border-radius','button-padding'
    ];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (newVal && newVal !== oldVal) {
      const map = {
        'primary-bg':'primaryBg','secondary-bg':'secondaryBg','border-color':'borderColor',
        'secondary-text':'secondaryText','main-accent':'mainAccent','hover-accent':'hoverAccent',
        'heading-color':'headingColor','paragraph-color':'paragraphColor','font-family':'fontFamily',
        'font-size':'fontSize','heading-size':'headingSize','border-radius':'borderRadius',
        'button-padding':'buttonPadding'
      };
      const k = map[name];
      if (k) { this.settings[k] = newVal; this._updateStyles(); }
    }
  }

  connectedCallback() {
    this._render();
    this._attachEvents();
    this._bindKeyboard();
  }

  disconnectedCallback() {
    if (this._raf) cancelAnimationFrame(this._raf);
    if (this._keyHandler)  document.removeEventListener('keydown', this._keyHandler);
    if (this._pasteHandler) document.removeEventListener('paste',  this._pasteHandler);
  }

  /* ════════════════════════════════════════════════════════
     STYLES
  ════════════════════════════════════════════════════════ */
  _css() {
    const s = this.settings;
    const br = s.borderRadius, bp = s.buttonPadding, ff = s.fontFamily;
    const fs = s.fontSize, hs = s.headingSize;
    return `
      :host {
        --pb: ${s.primaryBg}; --sb: ${s.secondaryBg}; --bc: ${s.borderColor};
        --st: ${s.secondaryText}; --ma: ${s.mainAccent}; --ha: ${s.hoverAccent};
        --hc: ${s.headingColor}; --pc: ${s.paragraphColor};
        --ff: ${ff}; --fs: ${fs}px; --hs: ${hs}px; --br: ${br}px; --bp: ${bp}px;
        --bg-deep: #0d0d12; --bg-panel: #13131a; --bg-mid: #1a1a24;
        --bg-raised: #22222e; --border-dim: #2a2a3a; --border-med: #333348;
        --txt: #e8e8f2; --txt2: #8888aa; --txt3: #55556a;
        --acc: var(--ma); --acc2: var(--ha);
        --acc-glow: color-mix(in srgb, var(--ma) 28%, transparent);
        --green: #3ecf8e; --red: #f56060; --yellow: #f6c820;
        --shadow: 0 2px 12px rgba(0,0,0,0.18);
        --shadow-lg: 0 20px 60px rgba(0,0,0,0.55);
        --tr: all 0.16s ease;
        --panel-w: 272px; --toolbar-h: 48px; --tools-w: 50px;
        display: block; font-family: var(--ff);
        color: var(--pc); height: 100%; min-height: 600px;
      }
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      /* ── Shell ── */
      .shell {
        display: flex; flex-direction: column;
        height: 100%; min-height: 600px;
        background: var(--bg-deep);
        border: 1px solid var(--bc); border-radius: var(--br);
        overflow: hidden; box-shadow: var(--shadow-lg);
      }

      /* ── Toolbar ── */
      .toolbar {
        height: var(--toolbar-h); background: var(--bg-panel);
        border-bottom: 1px solid var(--border-dim);
        display: flex; align-items: center; gap: 5px;
        padding: 0 12px; flex-shrink: 0; z-index: 10;
      }
      .logo {
        display: flex; align-items: center; gap: 7px;
        font-size: calc(var(--fs) + 1px); font-weight: 800;
        color: var(--txt); letter-spacing: .12em; margin-right: 8px;
      }
      .logo-dot {
        width: 8px; height: 8px; border-radius: 50%; background: var(--ma);
        box-shadow: 0 0 10px var(--acc-glow);
      }
      .tb-sep { width: 1px; height: 22px; background: var(--border-dim); margin: 0 3px; }
      .tb-sp  { flex: 1; }

      .tb-btn {
        display: inline-flex; align-items: center; gap: 5px;
        padding: 5px 10px; border: 1px solid transparent;
        border-radius: calc(var(--br) - 2px); font-family: var(--ff);
        font-size: calc(var(--fs) - 1px); font-weight: 600;
        color: var(--txt2); background: transparent;
        cursor: pointer; transition: var(--tr); white-space: nowrap;
      }
      .tb-btn:hover { color: var(--txt); border-color: var(--border-med); background: var(--bg-mid); }
      .tb-btn.active { color: var(--ma); border-color: var(--ma); background: color-mix(in srgb,var(--ma) 10%,transparent); }
      .tb-btn.primary { color: #fff; background: var(--ma); border-color: var(--ma); }
      .tb-btn.primary:hover { background: var(--ha); }
      .tb-btn:disabled { opacity: 0.32; cursor: not-allowed; }
      .tb-btn svg { width: 13px; height: 13px; flex-shrink: 0; }
      .img-meta {
        font-family: var(--ff); font-size: calc(var(--fs) - 3px);
        color: var(--txt3); padding: 3px 8px; background: var(--bg-mid);
        border: 1px solid var(--border-dim); border-radius: calc(var(--br) - 2px);
      }

      /* ── Body ── */
      .body { display: flex; flex: 1; overflow: hidden; min-height: 0; }

      /* ── Tool Sidebar ── */
      .tools {
        width: var(--tools-w); background: var(--bg-panel);
        border-right: 1px solid var(--border-dim);
        display: flex; flex-direction: column; align-items: center;
        padding: 8px 0; gap: 2px; flex-shrink: 0;
      }
      .t-btn {
        width: 36px; height: 36px; border-radius: calc(var(--br) - 2px);
        border: 1px solid transparent; background: transparent;
        color: var(--txt3); cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: var(--tr); position: relative;
      }
      .t-btn:hover { color: var(--txt); background: var(--bg-mid); border-color: var(--border-dim); }
      .t-btn.active { color: var(--ma); background: color-mix(in srgb,var(--ma) 12%,transparent); border-color: var(--ma); }
      .t-btn svg { width: 16px; height: 16px; }
      .t-sep { width: 24px; height: 1px; background: var(--border-dim); margin: 4px 0; }
      .t-tip {
        position: absolute; left: calc(100% + 9px); top: 50%;
        transform: translateY(-50%); background: var(--bg-raised);
        border: 1px solid var(--border-med); color: var(--txt);
        font-family: var(--ff); font-size: calc(var(--fs) - 3px); font-weight: 700;
        padding: 3px 7px; border-radius: 4px; white-space: nowrap;
        pointer-events: none; opacity: 0; transition: opacity 0.12s; z-index: 200;
      }
      .t-btn:hover .t-tip { opacity: 1; }

      /* ── Canvas Area ── */
      .canvas-area {
        flex: 1; background: var(--bg-deep); display: flex;
        align-items: center; justify-content: center;
        overflow: hidden; position: relative;
        background-image:
          radial-gradient(ellipse at 15% 85%, color-mix(in srgb,var(--ma) 6%,transparent) 0%, transparent 55%),
          radial-gradient(ellipse at 85% 20%, rgba(62,207,142,.04) 0%, transparent 50%);
      }

      /* Drop zone */
      .drop-zone {
        position: absolute; inset: 24px;
        border: 2px dashed var(--border-med); border-radius: var(--br);
        display: flex; flex-direction: column; align-items: center;
        justify-content: center; gap: 14px; cursor: pointer; transition: var(--tr);
      }
      .drop-zone:hover, .drop-zone.over {
        border-color: var(--ma);
        background: color-mix(in srgb,var(--ma) 5%,transparent);
      }
      .dz-icon { color: var(--txt3); transition: color .2s; }
      .drop-zone:hover .dz-icon, .drop-zone.over .dz-icon { color: var(--ma); }
      .dz-title { font-size: calc(var(--hs) * .7); font-weight: 800; color: var(--txt2); }
      .dz-sub   { font-size: calc(var(--fs) - 1px); color: var(--txt3); }
      .dz-btn {
        padding: 9px 22px; background: var(--ma); color: #fff;
        border: none; border-radius: var(--br); cursor: pointer;
        font-family: var(--ff); font-size: calc(var(--fs) + 1px); font-weight: 700;
        transition: var(--tr);
      }
      .dz-btn:hover { background: var(--ha); transform: translateY(-1px); }

      /* Canvas wrap */
      .canvas-wrap {
        position: relative; display: none;
        box-shadow: 0 24px 72px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,.06);
        border-radius: 2px; overflow: hidden;
      }
      canvas { display: block; }
      #drawCanvas   { position: absolute; top: 0; left: 0; pointer-events: none; }
      #overlayCanvas { position: absolute; top: 0; left: 0; pointer-events: none; }

      /* Compare */
      .cmp-line {
        position: absolute; top: 0; bottom: 0; width: 2px;
        background: #fff; box-shadow: 0 0 10px rgba(0,0,0,.7);
        cursor: ew-resize; display: none; z-index: 20;
      }
      .cmp-handle {
        position: absolute; top: 50%; left: 50%;
        transform: translate(-50%,-50%);
        width: 30px; height: 30px; background: #fff; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 12px; color: #333; font-weight: 800;
        box-shadow: 0 2px 10px rgba(0,0,0,.5);
      }
      .cmp-lbl {
        position: absolute; top: 10px;
        font-family: var(--ff); font-size: calc(var(--fs) - 3px);
        font-weight: 800; letter-spacing: .1em; padding: 3px 7px;
        border-radius: 3px; pointer-events: none; display: none;
      }
      .cmp-lbl.before { left: 10px; background: rgba(0,0,0,.55); color: rgba(255,255,255,.7); }
      .cmp-lbl.after  { right: 10px; background: color-mix(in srgb,var(--ma) 40%,transparent); color: #fff; }

      /* Info bar */
      .info-bar {
        position: absolute; bottom: 0; left: 0; right: 0;
        padding: 4px 14px; background: rgba(0,0,0,.75);
        backdrop-filter: blur(8px); display: none;
        gap: 18px; font-family: var(--ff);
        font-size: calc(var(--fs) - 3px); color: var(--txt3);
      }
      .info-bar.visible { display: flex; }
      .ib-item { display: flex; gap: 5px; }
      .ib-lbl  { color: var(--txt3); }
      .ib-val  { color: var(--txt2); }

      /* ── Right Panel ── */
      .panel {
        width: var(--panel-w); background: var(--bg-panel);
        border-left: 1px solid var(--border-dim);
        display: flex; flex-direction: column; overflow: hidden; flex-shrink: 0;
      }
      .p-tabs {
        display: flex; border-bottom: 1px solid var(--border-dim); flex-shrink: 0;
      }
      .p-tab {
        flex: 1; padding: 10px 2px; text-align: center; cursor: pointer;
        font-family: var(--ff); font-size: calc(var(--fs) - 3px); font-weight: 700;
        letter-spacing: .06em; text-transform: uppercase;
        color: var(--txt3); border-bottom: 2px solid transparent; transition: var(--tr);
      }
      .p-tab:hover { color: var(--txt2); }
      .p-tab.active { color: var(--ma); border-bottom-color: var(--ma); }
      .p-scroll {
        flex: 1; overflow-y: auto; padding: 14px 12px;
        scrollbar-width: thin; scrollbar-color: var(--border-dim) transparent;
      }
      .p-scroll::-webkit-scrollbar { width: 3px; }
      .p-scroll::-webkit-scrollbar-thumb { background: var(--border-dim); border-radius: 2px; }
      .p-tab-content { display: none; }
      .p-tab-content.active { display: block; }

      /* sections */
      .p-sec { margin-bottom: 18px; }
      .p-sec-title {
        font-family: var(--ff); font-size: calc(var(--fs) - 3px); font-weight: 700;
        letter-spacing: .12em; text-transform: uppercase; color: var(--txt3);
        margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid var(--border-dim);
      }
      .p-sep { height: 1px; background: var(--border-dim); margin: 14px 0; }

      /* sliders */
      .sl-row { margin-bottom: 9px; }
      .sl-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
      .sl-label { font-family: var(--ff); font-size: calc(var(--fs) - 2px); font-weight: 600; color: var(--txt2); }
      .sl-val   { font-family: var(--ff); font-size: calc(var(--fs) - 3px); color: var(--ma); min-width: 36px; text-align: right; font-weight: 700; }
      input[type=range] {
        -webkit-appearance: none; width: 100%; height: 3px;
        background: var(--bg-raised); border-radius: 2px; outline: none; cursor: pointer;
      }
      input[type=range]::-webkit-slider-thumb {
        -webkit-appearance: none; width: 13px; height: 13px; border-radius: 50%;
        background: var(--ma); border: 2px solid var(--bg-panel); cursor: pointer;
        transition: transform .1s, box-shadow .1s;
      }
      input[type=range]::-webkit-slider-thumb:hover {
        transform: scale(1.25); box-shadow: 0 0 0 4px var(--acc-glow);
      }
      input[type=range]::-moz-range-thumb {
        width: 13px; height: 13px; border-radius: 50%;
        background: var(--ma); border: 2px solid var(--bg-panel); cursor: pointer;
      }

      /* preset grid */
      .preset-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
      .preset-btn {
        padding: 8px 3px; border: 1px solid var(--border-dim);
        border-radius: calc(var(--br) - 2px); background: var(--bg-mid);
        cursor: pointer; text-align: center;
        font-family: var(--ff); font-size: calc(var(--fs) - 3px); font-weight: 700;
        color: var(--txt3); transition: var(--tr);
      }
      .preset-icon { font-size: 15px; display: block; margin-bottom: 2px; }
      .preset-btn:hover { border-color: var(--border-med); color: var(--txt2); transform: translateY(-1px); }
      .preset-btn.active { border-color: var(--ma); background: color-mix(in srgb,var(--ma) 10%,transparent); color: var(--ma); }

      /* transform */
      .tf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
      .tf-btn {
        padding: 8px 5px; border: 1px solid var(--border-dim);
        border-radius: calc(var(--br) - 2px); background: var(--bg-mid);
        color: var(--txt2); cursor: pointer;
        font-family: var(--ff); font-size: calc(var(--fs) - 2px); font-weight: 700;
        display: flex; align-items: center; justify-content: center; gap: 5px;
        transition: var(--tr);
      }
      .tf-btn:hover { border-color: var(--border-med); color: var(--txt); background: var(--bg-raised); }
      .tf-btn.full { grid-column: 1 / -1; }
      .tf-btn svg { width: 13px; height: 13px; }

      /* draw opts */
      .d-row { display: flex; align-items: center; gap: 8px; margin-bottom: 9px; }
      .d-lbl { font-family: var(--ff); font-size: calc(var(--fs) - 2px); color: var(--txt2); font-weight: 600; flex: 1; }
      input[type=color] {
        width: 34px; height: 26px; padding: 2px; border: 1px solid var(--border-med);
        border-radius: 4px; background: var(--bg-mid); cursor: pointer;
      }
      input[type=number], input[type=text] {
        background: var(--bg-mid); border: 1px solid var(--border-dim);
        border-radius: calc(var(--br) - 2px); color: var(--txt);
        font-family: var(--ff); font-size: calc(var(--fs) - 2px);
        padding: 5px 8px; outline: none; width: 100%; transition: var(--tr);
      }
      input:focus { border-color: var(--ma); }
      select {
        width: 100%; background: var(--bg-mid); border: 1px solid var(--border-dim);
        border-radius: calc(var(--br) - 2px); color: var(--txt);
        font-family: var(--ff); font-size: calc(var(--fs) - 2px);
        padding: 5px 8px; outline: none; cursor: pointer;
      }
      .fg { margin-bottom: 9px; }
      .fg label { display: block; font-family: var(--ff); font-size: calc(var(--fs) - 3px); font-weight: 700; color: var(--txt2); margin-bottom: 4px; letter-spacing: .04em; }
      .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }

      /* fmt buttons */
      .fmt-row { display: flex; gap: 6px; margin-bottom: 10px; }
      .fmt-btn {
        flex: 1; padding: 7px 3px; border: 1px solid var(--border-dim);
        border-radius: calc(var(--br) - 2px); background: var(--bg-mid);
        color: var(--txt3); font-family: var(--ff); font-size: calc(var(--fs) - 2px);
        font-weight: 700; text-align: center; cursor: pointer; transition: var(--tr);
      }
      .fmt-btn:hover { border-color: var(--border-med); color: var(--txt2); }
      .fmt-btn.active { border-color: var(--ma); background: color-mix(in srgb,var(--ma) 10%,transparent); color: var(--ma); }

      /* export btn */
      .exp-btn {
        width: 100%; padding: calc(var(--bp) + 3px); background: var(--ma); color: #fff;
        border: none; border-radius: var(--br); cursor: pointer;
        font-family: var(--ff); font-size: var(--fs); font-weight: 700;
        display: flex; align-items: center; justify-content: center; gap: 7px;
        transition: var(--tr); margin-top: 12px;
      }
      .exp-btn:hover { background: var(--ha); transform: translateY(-1px); box-shadow: 0 8px 24px var(--acc-glow); }
      .exp-btn svg { width: 14px; height: 14px; }

      /* info card */
      .i-card {
        background: var(--bg-mid); border: 1px solid var(--border-dim);
        border-radius: calc(var(--br) - 2px); padding: 9px 11px;
        font-family: var(--ff); font-size: calc(var(--fs) - 3px);
        line-height: 1.9; color: var(--txt2);
      }
      .i-card strong { color: var(--txt); }

      /* hint */
      .hint { font-family: var(--ff); font-size: calc(var(--fs) - 3px); color: var(--txt3); line-height: 1.6; margin-top: 6px; }

      /* toast */
      .toast {
        position: fixed; bottom: 22px; left: 50%;
        transform: translateX(-50%) translateY(12px);
        background: var(--bg-raised); border: 1px solid var(--border-med);
        color: var(--txt); font-family: var(--ff); font-size: calc(var(--fs) - 1px); font-weight: 600;
        padding: 9px 18px; border-radius: var(--br);
        opacity: 0; pointer-events: none; transition: all .25s; z-index: 9999;
        box-shadow: 0 8px 24px rgba(0,0,0,.5);
      }
      .toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
    `;
  }

  _updateStyles() {
    const el = this.shadowRoot.querySelector('#dyn');
    if (el) el.textContent = this._css();
  }

  /* ════════════════════════════════════════════════════════
     HTML
  ════════════════════════════════════════════════════════ */
  _render() {
    this.shadowRoot.innerHTML = `
      <style id="dyn">${this._css()}</style>
      <input type="file" id="fi" accept="image/*" style="display:none">
      <div class="toast" id="toast"></div>

      <div class="shell">

        <!-- Toolbar -->
        <div class="toolbar">
          <div class="logo"><div class="logo-dot"></div>IMAGE EDITOR</div>
          <div class="tb-sep"></div>
          <button class="tb-btn" id="undoBtn" disabled>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg> Undo
          </button>
          <button class="tb-btn" id="redoBtn" disabled>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> Redo
          </button>
          <div class="tb-sep"></div>
          <button class="tb-btn" id="resetBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg> Reset
          </button>
          <button class="tb-btn" id="compareBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="3" x2="12" y2="21"/><polyline points="5 8 3 12 5 16"/><polyline points="19 8 21 12 19 16"/></svg> Compare
          </button>
          <div class="tb-sp"></div>
          <div class="img-meta" id="imgMeta" style="display:none;"></div>
          <div class="tb-sep"></div>
          <button class="tb-btn" id="openBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Open
          </button>
          <button class="tb-btn primary" id="expTopBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export
          </button>
        </div>

        <!-- Body -->
        <div class="body">

          <!-- Tool sidebar -->
          <div class="tools">
            ${this._toolBtns()}
          </div>

          <!-- Canvas area -->
          <div class="canvas-area" id="ca">
            <div class="drop-zone" id="dz">
              <div class="dz-icon"><svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="3" y="3" width="18" height="18" rx="2.5"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
              <div class="dz-title">Drop image here</div>
              <div class="dz-sub">PNG · JPG · WebP · GIF · BMP — or paste from clipboard</div>
              <button class="dz-btn" id="dzBtn">Browse File</button>
            </div>

            <div class="canvas-wrap" id="cw">
              <canvas id="mainCanvas"></canvas>
              <canvas id="drawCanvas"></canvas>
              <canvas id="overlayCanvas"></canvas>
              <div class="cmp-line" id="cmpLine"><div class="cmp-handle">⇔</div></div>
              <div class="cmp-lbl before" id="lblBefore">BEFORE</div>
              <div class="cmp-lbl after"  id="lblAfter">AFTER</div>
            </div>

            <div class="info-bar" id="infoBar">
              <div class="ib-item"><span class="ib-lbl">TOOL</span><span class="ib-val" id="ibTool">Hand</span></div>
              <div class="ib-item"><span class="ib-lbl">XY</span><span class="ib-val" id="ibPos">—</span></div>
              <div class="ib-item"><span class="ib-lbl">SIZE</span><span class="ib-val" id="ibSz">—</span></div>
            </div>
          </div>

          <!-- Right panel -->
          <div class="panel">
            <div class="p-tabs">
              <div class="p-tab active" data-pt="adjust">Adjust</div>
              <div class="p-tab" data-pt="filters">Filters</div>
              <div class="p-tab" data-pt="draw">Draw</div>
              <div class="p-tab" data-pt="export">Export</div>
            </div>

            <div class="p-scroll">

              <!-- ADJUST -->
              <div class="p-tab-content active" data-pc="adjust">
                <div class="p-sec">
                  <div class="p-sec-title">Light</div>
                  ${this._sliders([
                    {k:'brightness',l:'Brightness',mn:-100,mx:100,st:1},
                    {k:'contrast',  l:'Contrast',  mn:-100,mx:100,st:1},
                    {k:'exposure',  l:'Exposure',  mn:-2,  mx:2,  st:.05},
                    {k:'highlights',l:'Highlights',mn:-100,mx:100,st:1},
                    {k:'shadows',   l:'Shadows',   mn:-100,mx:100,st:1}
                  ])}
                </div>
                <div class="p-sep"></div>
                <div class="p-sec">
                  <div class="p-sec-title">Color</div>
                  ${this._sliders([
                    {k:'saturation', l:'Saturation', mn:-100,mx:100,st:1},
                    {k:'vibrance',   l:'Vibrance',   mn:-100,mx:100,st:1},
                    {k:'hue',        l:'Hue',        mn:-180,mx:180,st:1},
                    {k:'temperature',l:'Temperature',mn:-100,mx:100,st:1},
                    {k:'tint',       l:'Tint',       mn:-100,mx:100,st:1}
                  ])}
                </div>
                <div class="p-sep"></div>
                <div class="p-sec">
                  <div class="p-sec-title">Detail</div>
                  ${this._sliders([
                    {k:'clarity',  l:'Clarity',  mn:0,mx:100,st:1},
                    {k:'sharpness',l:'Sharpness',mn:0,mx:100,st:1},
                    {k:'blur',     l:'Blur',     mn:0,mx:40, st:1}
                  ])}
                </div>
                <div class="p-sep"></div>
                <div class="p-sec">
                  <div class="p-sec-title">Effects</div>
                  ${this._sliders([
                    {k:'vignette',l:'Vignette',  mn:0,mx:100,st:1},
                    {k:'grain',   l:'Film Grain',mn:0,mx:100,st:1}
                  ])}
                </div>
                <div class="p-sep"></div>
                <div class="p-sec">
                  <div class="p-sec-title">Transform</div>
                  <div class="tf-grid" style="margin-bottom:10px;">
                    <button class="tf-btn" id="rotCCW"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg> CCW</button>
                    <button class="tf-btn" id="rotCW"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> CW</button>
                    <button class="tf-btn" id="flipH"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18"/><path d="M17 8l5 4-5 4"/><path d="M7 8l-5 4 5 4"/></svg> Flip H</button>
                    <button class="tf-btn" id="flipV"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18"/><path d="M8 17l4 5 4-5"/><path d="M8 7l4-5 4 5"/></svg> Flip V</button>
                  </div>
                  ${this._sliders([{k:'freeRot',l:'Free Rotate',mn:-45,mx:45,st:.5}])}
                  <div class="p-sec-title" style="margin-top:12px;">Resize</div>
                  <div class="two-col" style="margin-bottom:7px;">
                    <div class="fg"><label>Width px</label><input type="number" id="resW" min="1" max="8000" placeholder="W"></div>
                    <div class="fg"><label>Height px</label><input type="number" id="resH" min="1" max="8000" placeholder="H"></div>
                  </div>
                  <button class="tf-btn full" id="applyResize">Apply Resize</button>
                </div>
              </div>

              <!-- FILTERS -->
              <div class="p-tab-content" data-pc="filters">
                <div class="p-sec">
                  <div class="p-sec-title">Cinematic Presets</div>
                  <div class="preset-grid" id="presetGrid">
                    ${Object.entries({
                      original:'◻ Original', vivid:'✦ Vivid', chrome:'⬡ Chrome',
                      fade:'◫ Fade', matte:'▣ Matte', noir:'◼ Noir',
                      warm:'☀ Warm', cool:'❄ Cool', golden:'★ Golden',
                      cinematic:'▶ Cinema', vintage:'◎ Vintage', punch:'◉ Punch'
                    }).map(([k,v]) => {
                      const parts = v.split(' ');
                      const icon = parts[0], label = parts.slice(1).join(' ');
                      return `<div class="preset-btn ${k==='original'?'active':''}" data-preset="${k}">
                        <span class="preset-icon">${icon}</span>${label}
                      </div>`;
                    }).join('')}
                  </div>
                </div>
                <div class="p-sep"></div>
                <p class="hint">Presets apply a curated look. Fine-tune further in the Adjust tab after applying.</p>
              </div>

              <!-- DRAW -->
              <div class="p-tab-content" data-pc="draw">
                <div class="p-sec">
                  <div class="p-sec-title">Stroke</div>
                  <div class="d-row"><span class="d-lbl">Color</span><input type="color" id="drawColor" value="#ff3b30"></div>
                  <div class="sl-row">
                    <div class="sl-header"><span class="sl-label">Brush Size</span><span class="sl-val" id="val_drawSize">4px</span></div>
                    <input type="range" id="drawSizeSlider" min="1" max="80" step="1" value="4">
                  </div>
                  <div class="sl-row">
                    <div class="sl-header"><span class="sl-label">Opacity</span><span class="sl-val" id="val_drawOpacity">100%</span></div>
                    <input type="range" id="drawOpacitySlider" min="5" max="100" step="5" value="100">
                  </div>
                </div>
                <div class="p-sep"></div>
                <div class="p-sec">
                  <div class="p-sec-title">Text Tool</div>
                  <div class="fg"><label>Content</label><input type="text" id="textContent" placeholder="Type text…" value="Text"></div>
                  <div class="two-col">
                    <div class="fg"><label>Font Size</label><input type="number" id="textSize" value="36" min="8" max="400"></div>
                    <div class="fg"><label>Color</label><input type="color" id="textColor" value="#ffffff" style="height:30px;width:100%;margin-top:2px;"></div>
                  </div>
                  <div class="fg">
                    <label>Weight</label>
                    <select id="textWeight">
                      <option value="400">Regular</option>
                      <option value="700" selected>Bold</option>
                      <option value="800">Extra Bold</option>
                    </select>
                  </div>
                </div>
                <div class="p-sep"></div>
                <div class="p-sec">
                  <div class="p-sec-title">Actions</div>
                  <button class="tf-btn full" id="clearDrawBtn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    Clear All Annotations
                  </button>
                  <p class="hint" style="margin-top:8px;">Select a draw tool from the left sidebar. Click and drag on the canvas.</p>
                </div>
              </div>

              <!-- EXPORT -->
              <div class="p-tab-content" data-pc="export">
                <div class="p-sec">
                  <div class="p-sec-title">Format</div>
                  <div class="fmt-row">
                    <button class="fmt-btn active" data-fmt="png">PNG</button>
                    <button class="fmt-btn" data-fmt="jpeg">JPG</button>
                    <button class="fmt-btn" data-fmt="webp">WebP</button>
                  </div>
                  <div id="qualRow" style="display:none;">
                    <div class="sl-row">
                      <div class="sl-header"><span class="sl-label">Quality</span><span class="sl-val" id="val_qual">92%</span></div>
                      <input type="range" id="qualSlider" min="10" max="100" step="1" value="92">
                    </div>
                  </div>
                </div>
                <div class="p-sep"></div>
                <div class="p-sec">
                  <div class="p-sec-title">Output Size</div>
                  <div class="two-col" style="margin-bottom:6px;">
                    <div class="fg"><label>Width px</label><input type="number" id="expW" min="1" max="8000" placeholder="Original"></div>
                    <div class="fg"><label>Height px</label><input type="number" id="expH" min="1" max="8000" placeholder="Original"></div>
                  </div>
                  <p class="hint">Leave blank to export at current canvas size.</p>
                </div>
                <div class="p-sep"></div>
                <div class="p-sec">
                  <div class="p-sec-title">Image Info</div>
                  <div class="i-card" id="expInfo">No image loaded.</div>
                </div>
                <button class="exp-btn" id="dlBtn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download Image
                </button>
              </div>

            </div><!-- /p-scroll -->
          </div><!-- /panel -->

        </div><!-- /body -->
      </div><!-- /shell -->
    `;
  }

  _toolBtns() {
    const tools = [
      { id:'hand',    tip:'Hand (V)',      svg:'<path d="M18 11V6a2 2 0 0 0-4 0v0"/><path d="M14 10V4a2 2 0 0 0-4 0v2"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>' },
      { id:'pen',     tip:'Pen (P)',       svg:'<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>' },
      { id:'rect',    tip:'Rectangle (R)', svg:'<rect x="3" y="3" width="18" height="18" rx="2"/>' },
      { id:'ellipse', tip:'Ellipse (E)',   svg:'<ellipse cx="12" cy="12" rx="10" ry="6"/>' },
      { id:'line',    tip:'Line (L)',      svg:'<line x1="5" y1="19" x2="19" y2="5"/>' },
      { id:'text',    tip:'Text (T)',      svg:'<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>' },
      { id:'eyedrop', tip:'Eyedrop (I)',   svg:'<path d="M2 13.5V20h6.5L20 8.5 15.5 4z"/><path d="M20 8.5l2.5-2.5a1 1 0 000-1.4l-3-3a1 1 0 00-1.4 0L15.5 4"/>' }
    ];
    return tools.map((t, i) => `
      <button class="t-btn ${t.id==='hand'?'active':''}" data-tool="${t.id}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${t.svg}</svg>
        <span class="t-tip">${t.tip}</span>
      </button>
      ${i===0?'<div class="t-sep"></div>':''}
    `).join('');
  }

  _sliders(defs) {
    return defs.map(s => `
      <div class="sl-row">
        <div class="sl-header">
          <span class="sl-label">${s.l}</span>
          <span class="sl-val" id="val_${s.k}">${s.k==='exposure'?'0.00':s.k==='freeRot'?'0°':'0'}</span>
        </div>
        <input type="range" data-adj="${s.k}" min="${s.mn}" max="${s.mx}" step="${s.st}" value="0">
      </div>`).join('');
  }

  /* ════════════════════════════════════════════════════════
     IMAGE LOADING
  ════════════════════════════════════════════════════════ */
  _load(src) {
    const img = new Image();
    img.onload = () => {
      const W = img.naturalWidth, H = img.naturalHeight;
      const sr = this.shadowRoot;
      ['mainCanvas','drawCanvas','overlayCanvas'].forEach(id => {
        const c = sr.getElementById(id); c.width = W; c.height = H;
      });
      const ctx = sr.getElementById('mainCanvas').getContext('2d');

      /* ── FIX: fill white first so image is always visible ── */
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(img, 0, 0);

      this.es.originalData = ctx.getImageData(0, 0, W, H);
      this.es.drawData = null;
      this.es.rotation = 0; this.es.flipH = false; this.es.flipV = false;
      this.es.adj.freeRot = 0;
      this._resetAdj(false);

      // Reset undo
      this.es.histStack = []; this.es.histIdx = -1;
      this._pushHist();

      // Show canvas, hide drop zone
      sr.getElementById('dz').style.display = 'none';
      sr.getElementById('cw').style.display = 'inline-block';
      sr.getElementById('infoBar').classList.add('visible');
      sr.getElementById('imgMeta').textContent = `${W} × ${H}px`;
      sr.getElementById('imgMeta').style.display = 'block';
      sr.getElementById('ibSz').textContent = `${W} × ${H}`;
      sr.getElementById('resW').value = W;
      sr.getElementById('resH').value = H;
      sr.getElementById('expW').placeholder = W;
      sr.getElementById('expH').placeholder = H;
      sr.getElementById('expInfo').innerHTML = `<strong>${W} × ${H}px</strong><br>Channels: RGBA`;

      this._apply();
      this._toast('Image loaded!');
    };
    img.onerror = () => this._toast('Failed to load image.');
    img.src = src;
    this.es.loaded = true;
  }

  /* ════════════════════════════════════════════════════════
     ADJUSTMENT PIPELINE
  ════════════════════════════════════════════════════════ */
  _scheduleApply() {
    if (this._pending) return;
    this._pending = true;
    cancelAnimationFrame(this._raf);
    this._raf = requestAnimationFrame(() => { this._pending = false; this._apply(); });
  }

  _apply() {
    if (!this.es.originalData) return;
    const sr   = this.shadowRoot;
    const mc   = sr.getElementById('mainCanvas');
    const ctx  = mc.getContext('2d');
    const orig = this.es.originalData;
    const sw   = orig.width, sh = orig.height;
    const adj  = this.es.adj;

    /* 1 ── Transform (rotation + flip) into off-screen canvas ── */
    const freeRad = (adj.freeRot || 0) * Math.PI / 180;
    const rot90   = this.es.rotation * Math.PI / 180;
    const totRad  = rot90 + freeRad;
    const cos = Math.abs(Math.cos(totRad)), sin = Math.abs(Math.sin(totRad));
    const outW = Math.round(sw * cos + sh * sin);
    const outH = Math.round(sw * sin + sh * cos);

    const srcC = document.createElement('canvas');
    srcC.width = sw; srcC.height = sh;
    const srcCtx = srcC.getContext('2d');
    /* ── FIX: fill white before drawing original pixels ── */
    srcCtx.fillStyle = '#ffffff';
    srcCtx.fillRect(0, 0, sw, sh);
    srcCtx.putImageData(orig, 0, 0);

    const tC = document.createElement('canvas');
    tC.width = outW; tC.height = outH;
    const tCtx = tC.getContext('2d');
    tCtx.translate(outW/2, outH/2);
    tCtx.rotate(totRad);
    tCtx.scale(this.es.flipH ? -1 : 1, this.es.flipV ? -1 : 1);
    tCtx.drawImage(srcC, -sw/2, -sh/2);

    /* resize output canvases if needed */
    if (mc.width !== outW || mc.height !== outH) {
      ['mainCanvas','drawCanvas','overlayCanvas'].forEach(id => {
        const c = sr.getElementById(id); c.width = outW; c.height = outH;
      });
    }

    /* 2 ── Pixel adjustments ── */
    const id   = tCtx.getImageData(0, 0, outW, outH);
    const d    = id.data;
    const bri  = adj.brightness / 100 * 255;
    const conF = (259*(adj.contrast/100*255+255))/(255*(259-adj.contrast/100*255));
    const expo = Math.pow(2, adj.exposure);
    const high = adj.highlights / 100;
    const shad = adj.shadows    / 100;
    const temp = adj.temperature / 100;
    const tin  = adj.tint       / 100;
    const sat  = adj.saturation / 100;
    const vib  = adj.vibrance   / 100;

    for (let i = 0; i < d.length; i += 4) {
      let r = d[i], g = d[i+1], b = d[i+2];

      r *= expo; g *= expo; b *= expo;
      r += temp*32 - tin*12; g += tin*18; b -= temp*32 + tin*8;
      r += bri; g += bri; b += bri;
      r = conF*(r-128)+128; g = conF*(g-128)+128; b = conF*(b-128)+128;

      const luma = .299*r + .587*g + .114*b;
      if (luma > 128) { const t2=(luma-128)/127; r+=high*t2*45; g+=high*t2*45; b+=high*t2*45; }
      else             { const t2=(128-luma)/128; r+=shad*t2*45; g+=shad*t2*45; b+=shad*t2*45; }

      const gray   = .299*r + .587*g + .114*b;
      const chroma = Math.max(r,g,b) - Math.min(r,g,b);
      const vibM   = 1 + vib*(1 - chroma/255*2);
      const satM   = 1 + sat + Math.max(0, vibM-1);
      r = gray+(r-gray)*satM; g = gray+(g-gray)*satM; b = gray+(b-gray)*satM;

      // Hue shift
      if (adj.hue !== 0) {
        const rn=Math.min(255,Math.max(0,r))/255, gn=Math.min(255,Math.max(0,g))/255, bn=Math.min(255,Math.max(0,b))/255;
        const mx=Math.max(rn,gn,bn), mn2=Math.min(rn,gn,bn), l=(mx+mn2)/2;
        if (mx !== mn2) {
          const d2=mx-mn2, s2=d2/(1-Math.abs(2*l-1));
          let h=0;
          if(mx===rn)h=((gn-bn)/d2+6)%6;
          else if(mx===gn)h=(bn-rn)/d2+2;
          else h=(rn-gn)/d2+4;
          h=(h/6+adj.hue/360+2)%1;
          const q=l<.5?l*(1+s2):l+s2-l*s2, p=2*l-q;
          const h2=(p,q,t)=>{if(t<0)t++;if(t>1)t--;if(t<1/6)return p+(q-p)*6*t;if(t<.5)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;};
          r=h2(p,q,h+1/3)*255; g=h2(p,q,h)*255; b=h2(p,q,h-1/3)*255;
        }
      }

      d[i]=Math.min(255,Math.max(0,r)); d[i+1]=Math.min(255,Math.max(0,g)); d[i+2]=Math.min(255,Math.max(0,b));
    }

    if (adj.clarity   > 0) this._clarity(d, outW, outH, adj.clarity/100);
    if (adj.sharpness > 0) this._sharpen(d, outW, outH, adj.sharpness/100);

    /* 3 ── Blur: off-screen convolution instead of CSS filter ── */
    if (adj.blur > 0) {
      const radius = Math.round(adj.blur * 0.5);
      const blurred = this._boxBlur(d, outW, outH, radius);
      for (let i = 0; i < d.length; i++) d[i] = blurred[i];
    }

    /* ── FIX: fill white on main canvas before putImageData ── */
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outW, outH);
    ctx.putImageData(id, 0, 0);

    /* 4 ── Vignette ── */
    if (adj.vignette > 0) {
      const g2 = ctx.createRadialGradient(outW/2,outH/2,Math.min(outW,outH)*.28,outW/2,outH/2,Math.max(outW,outH)*.76);
      g2.addColorStop(0,'rgba(0,0,0,0)');
      g2.addColorStop(1,`rgba(0,0,0,${adj.vignette/100*.88})`);
      ctx.fillStyle = g2; ctx.fillRect(0,0,outW,outH);
    }

    /* 5 ── Film grain ── */
    if (adj.grain > 0) {
      const gd = ctx.getImageData(0,0,outW,outH), gPx = gd.data;
      const int2 = adj.grain/100*65;
      for (let i=0;i<gPx.length;i+=4){
        const n=(Math.random()-.5)*int2;
        gPx[i]=Math.min(255,Math.max(0,gPx[i]+n));
        gPx[i+1]=Math.min(255,Math.max(0,gPx[i+1]+n));
        gPx[i+2]=Math.min(255,Math.max(0,gPx[i+2]+n));
      }
      ctx.putImageData(gd,0,0);
    }

    /* 6 ── Redraw annotation layer ── */
    this._redrawDraw();

    /* 7 ── Compare mode ── */
    if (this.es.compareMode) this._drawCompare();
  }

  _clarity(d, w, h, amt) {
    const c = new Uint8ClampedArray(d), r = 2;
    for (let y=r;y<h-r;y++) for (let x=r;x<w-r;x++) {
      const i=(y*w+x)*4;
      for (let ch=0;ch<3;ch++) {
        let s=0, n=0;
        for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++){s+=c[((y+dy)*w+(x+dx))*4+ch];n++;}
        const avg=s/n;
        d[i+ch]=Math.min(255,Math.max(0,c[i+ch]+(c[i+ch]-avg)*amt*1.6));
      }
    }
  }

  _sharpen(d, w, h, amt) {
    const c = new Uint8ClampedArray(d);
    const k = [-1,-1,-1,-1,9,-1,-1,-1,-1];
    for (let y=1;y<h-1;y++) for(let x=1;x<w-1;x++){
      const i=(y*w+x)*4;
      for(let ch=0;ch<3;ch++){
        let v=0;
        for(let ky=0;ky<3;ky++) for(let kx=0;kx<3;kx++) v+=c[((y+ky-1)*w+(x+kx-1))*4+ch]*k[ky*3+kx];
        d[i+ch]=Math.min(255,Math.max(0,c[i+ch]*(1-amt)+v*amt));
      }
    }
  }

  _boxBlur(d, w, h, r) {
    /* single-pass horizontal+vertical box blur */
    const src = new Uint8ClampedArray(d);
    const tmp = new Uint8ClampedArray(d.length);
    const out = new Uint8ClampedArray(d.length);
    // Horizontal
    for (let y=0;y<h;y++) for(let x=0;x<w;x++){
      const i=(y*w+x)*4; let sr2=0,sg=0,sb=0,cnt=0;
      for(let dx=-r;dx<=r;dx++){const nx=Math.min(w-1,Math.max(0,x+dx)),ni=(y*w+nx)*4;sr2+=src[ni];sg+=src[ni+1];sb+=src[ni+2];cnt++;}
      tmp[i]=sr2/cnt;tmp[i+1]=sg/cnt;tmp[i+2]=sb/cnt;tmp[i+3]=src[i+3];
    }
    // Vertical
    for (let y=0;y<h;y++) for(let x=0;x<w;x++){
      const i=(y*w+x)*4; let sr2=0,sg=0,sb=0,cnt=0;
      for(let dy=-r;dy<=r;dy++){const ny=Math.min(h-1,Math.max(0,y+dy)),ni=(ny*w+x)*4;sr2+=tmp[ni];sg+=tmp[ni+1];sb+=tmp[ni+2];cnt++;}
      out[i]=sr2/cnt;out[i+1]=sg/cnt;out[i+2]=sb/cnt;out[i+3]=tmp[i+3];
    }
    return out;
  }

  /* ── Draw layer ── */
  _redrawDraw() {
    const dc = this.shadowRoot.getElementById('drawCanvas');
    if (!dc) return;
    dc.getContext('2d').clearRect(0,0,dc.width,dc.height);
    if (this.es.drawData) dc.getContext('2d').putImageData(this.es.drawData,0,0);
  }

  _saveDraw() {
    const dc = this.shadowRoot.getElementById('drawCanvas');
    if (!dc) return;
    this.es.drawData = dc.getContext('2d').getImageData(0,0,dc.width,dc.height);
  }

  /* ── Compare ── */
  _drawCompare() {
    const oc  = this.shadowRoot.getElementById('overlayCanvas');
    const mc  = this.shadowRoot.getElementById('mainCanvas');
    const ctx = oc.getContext('2d');
    const W = oc.width, H = oc.height;
    const splitX = Math.round(W * this.es.compareX);
    ctx.clearRect(0,0,W,H);
    const origC = document.createElement('canvas');
    origC.width  = this.es.originalData.width;
    origC.height = this.es.originalData.height;
    const origCtx = origC.getContext('2d');
    origCtx.fillStyle = '#ffffff';
    origCtx.fillRect(0,0,origC.width,origC.height);
    origCtx.putImageData(this.es.originalData,0,0);
    ctx.save();
    ctx.beginPath(); ctx.rect(0,0,splitX,H); ctx.clip();
    ctx.drawImage(origC,0,0,W,H);
    ctx.restore();
    this.shadowRoot.getElementById('cmpLine').style.left = (this.es.compareX*100)+'%';
  }

  /* ════════════════════════════════════════════════════════
     HISTORY
  ════════════════════════════════════════════════════════ */
  _cloneID(id) { return id ? new ImageData(new Uint8ClampedArray(id.data), id.width, id.height) : null; }

  _pushHist() {
    const snap = {
      adj: {...this.es.adj}, rotation: this.es.rotation,
      flipH: this.es.flipH, flipV: this.es.flipV,
      drawData: this._cloneID(this.es.drawData),
      origData: this._cloneID(this.es.originalData)
    };
    this.es.histStack = this.es.histStack.slice(0, this.es.histIdx+1);
    this.es.histStack.push(snap);
    if (this.es.histStack.length > 20) this.es.histStack.shift();
    this.es.histIdx = this.es.histStack.length-1;
    this._updateHistBtns();
  }

  _undo() { if(this.es.histIdx<=0){this._toast('Nothing to undo');return;} this.es.histIdx--; this._restoreHist(); }
  _redo() { if(this.es.histIdx>=this.es.histStack.length-1){this._toast('Nothing to redo');return;} this.es.histIdx++; this._restoreHist(); }

  _restoreHist() {
    const s = this.es.histStack[this.es.histIdx]; if(!s)return;
    Object.assign(this.es.adj, s.adj);
    this.es.rotation = s.rotation; this.es.flipH = s.flipH; this.es.flipV = s.flipV;
    this.es.drawData  = this._cloneID(s.drawData);
    this.es.originalData = this._cloneID(s.origData);
    this._syncSliders(); this._apply(); this._updateHistBtns();
  }

  _updateHistBtns() {
    const sr = this.shadowRoot;
    sr.getElementById('undoBtn').disabled = this.es.histIdx <= 0;
    sr.getElementById('redoBtn').disabled = this.es.histIdx >= this.es.histStack.length-1;
  }

  _syncSliders() {
    const sr = this.shadowRoot;
    Object.entries(this.es.adj).forEach(([k,v]) => {
      const sl = sr.querySelector(`[data-adj="${k}"]`);
      const vl = sr.getElementById(`val_${k}`);
      if (sl) sl.value = v;
      if (vl) vl.textContent = k==='exposure' ? parseFloat(v).toFixed(2) : k==='freeRot' ? v+'°' : Math.round(v);
    });
  }

  _resetAdj(reapply=true) {
    const d = this.PRESETS.original;
    Object.keys(this.es.adj).forEach(k => this.es.adj[k] = d.hasOwnProperty(k) ? d[k] : 0);
    this.es.adj.freeRot = 0;
    this._syncSliders();
    const fr = this.shadowRoot.querySelector('[data-adj="freeRot"]');
    if (fr) fr.value = 0;
    this.shadowRoot.querySelectorAll('.preset-btn').forEach(b => b.classList.toggle('active', b.dataset.preset==='original'));
    if (reapply) { this._apply(); this._pushHist(); }
  }

  /* ════════════════════════════════════════════════════════
     EVENTS
  ════════════════════════════════════════════════════════ */
  _attachEvents() {
    const sr = this.shadowRoot;
    const fi = sr.getElementById('fi');

    /* File open */
    const openFile = () => fi.click();
    fi.addEventListener('change', e => {
      const f = e.target.files[0]; if(!f)return;
      const r = new FileReader(); r.onload=ev=>this._load(ev.target.result); r.readAsDataURL(f); fi.value='';
    });
    sr.getElementById('openBtn').addEventListener('click', openFile);
    sr.getElementById('dzBtn').addEventListener('click', openFile);

    /* Drag & drop */
    const ca = sr.getElementById('ca');
    const dz = sr.getElementById('dz');
    ca.addEventListener('dragover',  e=>{e.preventDefault();dz.classList.add('over');});
    ca.addEventListener('dragleave', ()=>dz.classList.remove('over'));
    ca.addEventListener('drop', e=>{
      e.preventDefault(); dz.classList.remove('over');
      const f = e.dataTransfer.files[0];
      if (!f||!f.type.startsWith('image/')) { this._toast('Drop an image file'); return; }
      const r=new FileReader(); r.onload=ev=>this._load(ev.target.result); r.readAsDataURL(f);
    });

    /* Adjustment sliders */
    sr.querySelectorAll('[data-adj]').forEach(sl => {
      sl.addEventListener('input', () => {
        const k=sl.dataset.adj, v=parseFloat(sl.value);
        this.es.adj[k]=v;
        const vl=sr.getElementById(`val_${k}`);
        if(vl) vl.textContent = k==='exposure'?v.toFixed(2):k==='freeRot'?v+'°':Math.round(v);
        this._scheduleApply();
      });
      sl.addEventListener('change', ()=>this._pushHist());
    });

    /* Toolbar buttons */
    sr.getElementById('undoBtn').addEventListener('click',   ()=>this._undo());
    sr.getElementById('redoBtn').addEventListener('click',   ()=>this._redo());
    sr.getElementById('resetBtn').addEventListener('click',  ()=>{this._resetAdj();this._toast('Adjustments reset');});
    sr.getElementById('rotCCW').addEventListener('click',   ()=>{this.es.rotation=(this.es.rotation-90+360)%360;this._apply();this._pushHist();});
    sr.getElementById('rotCW').addEventListener('click',    ()=>{this.es.rotation=(this.es.rotation+90)%360;this._apply();this._pushHist();});
    sr.getElementById('flipH').addEventListener('click',    ()=>{this.es.flipH=!this.es.flipH;this._apply();this._pushHist();});
    sr.getElementById('flipV').addEventListener('click',    ()=>{this.es.flipV=!this.es.flipV;this._apply();this._pushHist();});

    /* Resize */
    sr.getElementById('applyResize').addEventListener('click', () => {
      const W=parseInt(sr.getElementById('resW').value), H=parseInt(sr.getElementById('resH').value);
      if(!W||!H){this._toast('Enter valid dimensions');return;}
      const tmp=document.createElement('canvas');
      tmp.width=this.es.originalData.width; tmp.height=this.es.originalData.height;
      const tCtx=tmp.getContext('2d');
      tCtx.fillStyle='#ffffff'; tCtx.fillRect(0,0,tmp.width,tmp.height);
      tCtx.putImageData(this.es.originalData,0,0);
      const sc=document.createElement('canvas'); sc.width=W; sc.height=H;
      const sCtx=sc.getContext('2d'); sCtx.imageSmoothingQuality='high';
      sCtx.drawImage(tmp,0,0,W,H);
      this.es.originalData=sCtx.getImageData(0,0,W,H);
      sr.getElementById('imgMeta').textContent=`${W} × ${H}px`;
      sr.getElementById('ibSz').textContent=`${W} × ${H}`;
      this._apply(); this._pushHist(); this._toast(`Resized to ${W}×${H}px`);
    });

    /* Compare */
    sr.getElementById('compareBtn').addEventListener('click', () => {
      if(!this.es.loaded){this._toast('Load an image first');return;}
      this.es.compareMode=!this.es.compareMode;
      sr.getElementById('compareBtn').classList.toggle('active', this.es.compareMode);
      const oc=sr.getElementById('overlayCanvas'), cl=sr.getElementById('cmpLine');
      const lb=sr.getElementById('lblBefore'), la=sr.getElementById('lblAfter');
      if (this.es.compareMode) {
        this.es.compareX=.5; oc.style.display='block'; cl.style.display='block'; lb.style.display='block'; la.style.display='block';
        this._drawCompare(); this._toast('Drag divider to compare');
      } else {
        oc.style.display='none'; cl.style.display='none'; lb.style.display='none'; la.style.display='none';
        sr.getElementById('overlayCanvas').getContext('2d').clearRect(0,0,oc.width,oc.height);
      }
    });

    /* Compare drag */
    let dragComp=false;
    sr.getElementById('cmpLine').addEventListener('mousedown',()=>dragComp=true);
    ca.addEventListener('mousemove', e=>{
      if(!dragComp)return;
      const wr=sr.getElementById('cw').getBoundingClientRect();
      this.es.compareX=Math.max(.02,Math.min(.98,(e.clientX-wr.left)/wr.width));
      this._drawCompare();
    });
    document.addEventListener('mouseup',()=>dragComp=false);

    /* Presets */
    sr.getElementById('presetGrid').addEventListener('click', e=>{
      const card=e.target.closest('[data-preset]'); if(!card)return;
      const key=card.dataset.preset, preset=this.PRESETS[key]; if(!preset)return;
      Object.assign(this.es.adj, preset); this.es.adj.freeRot = this.es.adj.freeRot||0;
      this._syncSliders();
      sr.querySelectorAll('.preset-btn').forEach(b=>b.classList.toggle('active',b.dataset.preset===key));
      this._apply(); this._pushHist();
    });

    /* Panel tabs */
    sr.querySelectorAll('.p-tab').forEach(tab=>{
      tab.addEventListener('click',()=>{
        sr.querySelectorAll('.p-tab').forEach(t=>t.classList.remove('active'));
        sr.querySelectorAll('.p-tab-content').forEach(c=>c.classList.remove('active'));
        tab.classList.add('active');
        sr.querySelector(`[data-pc="${tab.dataset.pt}"]`)?.classList.add('active');
      });
    });

    /* Tool sidebar */
    sr.querySelectorAll('[data-tool]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        sr.querySelectorAll('[data-tool]').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active'); this.es.tool=btn.dataset.tool;
        sr.getElementById('ibTool').textContent=btn.dataset.tool.charAt(0).toUpperCase()+btn.dataset.tool.slice(1);
        const mc=sr.getElementById('mainCanvas');
        mc.style.cursor = this.es.tool==='hand'?'grab':this.es.tool==='text'?'text':'crosshair';
      });
    });

    /* Draw events */
    this._attachCanvasEvents();

    /* Draw options */
    sr.getElementById('drawColor').addEventListener('input',e=>this.es.drawColor=e.target.value);
    sr.getElementById('drawSizeSlider').addEventListener('input',e=>{this.es.drawSize=parseInt(e.target.value);sr.getElementById('val_drawSize').textContent=e.target.value+'px';});
    sr.getElementById('drawOpacitySlider').addEventListener('input',e=>{this.es.drawOpacity=parseInt(e.target.value)/100;sr.getElementById('val_drawOpacity').textContent=e.target.value+'%';});
    sr.getElementById('textContent').addEventListener('input',e=>this.es.textContent=e.target.value||'Text');
    sr.getElementById('textSize').addEventListener('input',e=>this.es.textSize=parseInt(e.target.value)||36);
    sr.getElementById('textColor').addEventListener('input',e=>this.es.textColor=e.target.value);
    sr.getElementById('textWeight').addEventListener('change',e=>this.es.textWeight=e.target.value);
    sr.getElementById('clearDrawBtn').addEventListener('click',()=>{
      sr.getElementById('drawCanvas').getContext('2d').clearRect(0,0,sr.getElementById('drawCanvas').width,sr.getElementById('drawCanvas').height);
      this.es.drawData=null; this._pushHist(); this._toast('Annotations cleared');
    });

    /* Export format */
    sr.querySelectorAll('.fmt-btn').forEach(btn=>{
      btn.addEventListener('click',()=>{
        sr.querySelectorAll('.fmt-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active'); this.es.exportFmt=btn.dataset.fmt;
        sr.getElementById('qualRow').style.display=this.es.exportFmt!=='png'?'block':'none';
      });
    });
    sr.getElementById('qualSlider').addEventListener('input',e=>{
      this.es.exportQual=parseInt(e.target.value)/100;
      sr.getElementById('val_qual').textContent=e.target.value+'%';
    });

    const doDownload = () => {
      if(!this.es.loaded){this._toast('No image to export');return;}
      const mc=sr.getElementById('mainCanvas'), dc=sr.getElementById('drawCanvas');
      const W=parseInt(sr.getElementById('expW').value)||mc.width;
      const H=parseInt(sr.getElementById('expH').value)||mc.height;
      const ec=document.createElement('canvas'); ec.width=W; ec.height=H;
      const eCtx=ec.getContext('2d'); eCtx.imageSmoothingQuality='high';
      eCtx.fillStyle='#ffffff'; eCtx.fillRect(0,0,W,H);
      eCtx.drawImage(mc,0,0,W,H); eCtx.drawImage(dc,0,0,W,H);
      const mime=this.es.exportFmt==='jpeg'?'image/jpeg':this.es.exportFmt==='webp'?'image/webp':'image/png';
      const url=ec.toDataURL(mime,this.es.exportQual);
      const a=document.createElement('a'); a.href=url;
      a.download=`edited.${this.es.exportFmt==='jpeg'?'jpg':this.es.exportFmt}`; a.click();
      this._toast(`Exported as ${this.es.exportFmt.toUpperCase()}!`);
    };
    sr.getElementById('dlBtn').addEventListener('click', doDownload);
    sr.getElementById('expTopBtn').addEventListener('click', doDownload);
  }

  _attachCanvasEvents() {
    const sr = this.shadowRoot;
    const mc = sr.getElementById('mainCanvas');

    const getPos = e => {
      const rect = mc.getBoundingClientRect();
      const sx = mc.width / rect.width, sy = mc.height / rect.height;
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      return { x:(cx-rect.left)*sx, y:(cy-rect.top)*sy };
    };

    mc.addEventListener('mousedown', e=>this._drawStart(getPos(e)));
    mc.addEventListener('mousemove', e=>{
      const p=getPos(e);
      sr.getElementById('ibPos').textContent=`${Math.round(p.x)}, ${Math.round(p.y)}`;
      this._drawMove(p);
    });
    mc.addEventListener('mouseup',   e=>this._drawEnd(getPos(e)));
    mc.addEventListener('mouseleave',e=>this._drawEnd(getPos(e)));
    mc.addEventListener('touchstart',e=>{e.preventDefault();this._drawStart(getPos(e));},{passive:false});
    mc.addEventListener('touchmove', e=>{e.preventDefault();this._drawMove(getPos(e));}, {passive:false});
    mc.addEventListener('touchend',  e=>{e.preventDefault();this._drawEnd(getPos(e));},  {passive:false});
  }

  _setDrawStyle(ctx) {
    ctx.strokeStyle = this.es.drawColor;
    ctx.fillStyle   = this.es.drawColor;
    ctx.lineWidth   = this.es.drawSize;
    ctx.lineCap = ctx.lineJoin = 'round';
    ctx.globalAlpha = this.es.drawOpacity;
  }

  _drawStart(pos) {
    const tool = this.es.tool;
    if (!this.es.loaded || tool==='hand') return;
    if (tool==='eyedrop') { this._pickColor(pos); return; }
    if (tool==='text')    { this._placeText(pos); return; }
    this.es.isDrawing = true;
    this.es.drawStart = pos; this.es.lastPt = pos;
    this.es.snapDraw = this.es.drawData ? this._cloneID(this.es.drawData) : null;
  }

  _drawMove(pos) {
    if (!this.es.isDrawing) return;
    const dc = this.shadowRoot.getElementById('drawCanvas');
    const ctx = dc.getContext('2d');
    this._setDrawStyle(ctx);
    if (this.es.tool==='pen') {
      ctx.beginPath(); ctx.moveTo(this.es.lastPt.x,this.es.lastPt.y);
      ctx.lineTo(pos.x,pos.y); ctx.stroke(); this.es.lastPt=pos;
    } else {
      ctx.clearRect(0,0,dc.width,dc.height);
      if (this.es.snapDraw) ctx.putImageData(this.es.snapDraw,0,0);
      this._setDrawStyle(ctx);
      const sx=this.es.drawStart.x, sy=this.es.drawStart.y;
      ctx.beginPath();
      if (this.es.tool==='rect') ctx.strokeRect(sx,sy,pos.x-sx,pos.y-sy);
      else if (this.es.tool==='ellipse') { ctx.ellipse((sx+pos.x)/2,(sy+pos.y)/2,Math.abs(pos.x-sx)/2,Math.abs(pos.y-sy)/2,0,0,Math.PI*2); ctx.stroke(); }
      else if (this.es.tool==='line') { ctx.moveTo(sx,sy); ctx.lineTo(pos.x,pos.y); ctx.stroke(); }
    }
    ctx.globalAlpha=1;
  }

  _drawEnd(pos) {
    if (!this.es.isDrawing) return;
    this.es.isDrawing=false;
    this.shadowRoot.getElementById('drawCanvas').getContext('2d').globalAlpha=1;
    this._saveDraw(); this._pushHist();
  }

  _placeText(pos) {
    const dc = this.shadowRoot.getElementById('drawCanvas');
    const ctx = dc.getContext('2d');
    ctx.globalAlpha = this.es.drawOpacity;
    ctx.fillStyle   = this.es.textColor;
    ctx.font = `${this.es.textWeight} ${this.es.textSize}px ${this.settings.fontFamily}`;
    ctx.fillText(this.es.textContent||'Text', pos.x, pos.y);
    ctx.globalAlpha = 1;
    this._saveDraw(); this._pushHist();
  }

  _pickColor(pos) {
    const mc  = this.shadowRoot.getElementById('mainCanvas');
    const px  = mc.getContext('2d').getImageData(Math.round(pos.x),Math.round(pos.y),1,1).data;
    const hex = '#'+[px[0],px[1],px[2]].map(v=>v.toString(16).padStart(2,'0')).join('');
    const dc  = this.shadowRoot.getElementById('drawColor');
    if (dc) dc.value = hex;
    this.es.drawColor = hex;
    this._toast(`Picked: ${hex}`);
  }

  /* ── Keyboard ── */
  _bindKeyboard() {
    this._keyHandler = e => {
      if (!this.isConnected) return;
      if (e.ctrlKey && e.key==='z' && !e.shiftKey) { e.preventDefault(); this._undo(); }
      if (e.ctrlKey && (e.key==='y'||(e.shiftKey&&e.key==='Z'))) { e.preventDefault(); this._redo(); }
      const tag = document.activeElement?.tagName;
      if (!e.ctrlKey && !e.altKey && tag!=='INPUT' && tag!=='TEXTAREA') {
        const map={v:'hand',p:'pen',r:'rect',e:'ellipse',l:'line',t:'text',i:'eyedrop'};
        if (map[e.key]) { const btn=this.shadowRoot.querySelector(`[data-tool="${map[e.key]}"]`); if(btn)btn.click(); }
      }
    };
    this._pasteHandler = e => {
      if (!this.isConnected) return;
      const items = e.clipboardData?.items; if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const blob=item.getAsFile(), reader=new FileReader();
          reader.onload=ev=>this._load(ev.target.result);
          reader.readAsDataURL(blob); break;
        }
      }
    };
    document.addEventListener('keydown', this._keyHandler);
    document.addEventListener('paste',   this._pasteHandler);
  }

  /* ── Toast ── */
  _toast(msg) {
    const el = this.shadowRoot.getElementById('toast');
    el.textContent = msg; el.classList.add('show');
    clearTimeout(this._toastT);
    this._toastT = setTimeout(()=>el.classList.remove('show'), 2500);
  }
}

customElements.define('advanced-image-editor', AdvancedImageEditor);
