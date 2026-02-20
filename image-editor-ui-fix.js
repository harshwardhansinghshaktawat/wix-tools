/**
 * Advanced Image Editor - Wix Custom Element
 * Filename: wix-advanced-image-editor.js
 * Custom Element Tag: <advanced-image-editor>
 * Widget Element ID: #imageEditor
 *
 * Design matches the full series:
 *  - Light theme: --primary-bg, --secondary-bg as backgrounds
 *  - Full CSS variable names (--main-accent, --heading-color etc.)
 *  - getStyles() + updateStyles() pattern identical to other series widgets
 *  - attributeChangedCallback → this.settings[key] → updateStyles()
 *    which replaces <style id="dynamic-styles"> in-place
 *
 * Image visibility fix:
 *  - Never applies CSS filter to <canvas> (breaks compositing in Wix iframes)
 *  - Always fills #ffffff before putImageData so image is always visible
 *  - Blur done via off-screen box-blur kernel, not CSS filter
 *  - Image drawn to off-screen canvas first before getImageData() stored
 */
class AdvancedImageEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Same 13 props as every widget in the series
    this.settings = {
      primaryBg:     '#ffffff',
      secondaryBg:   '#f8f9fa',
      borderColor:   '#dddddd',
      secondaryText: '#666666',
      mainAccent:    '#3498db',
      hoverAccent:   '#2980b9',
      headingColor:  '#2c3e50',
      paragraphColor:'#333333',
      fontFamily:    'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      fontSize:      14,
      headingSize:   24,
      borderRadius:  8,
      buttonPadding: 8
    };

    this.es = {
      loaded: false, origData: null, drawData: null, snapDraw: null,
      tool: 'hand', drawColor: '#e74c3c', drawSize: 4, drawOpacity: 1,
      textStr: 'Text', textSize: 36, textWeight: '700', textColor: '#ffffff',
      isDrawing: false, drawStart: null, lastPt: null,
      rotation: 0, flipH: false, flipV: false,
      compareMode: false, compareX: 0.5,
      histStack: [], histIdx: -1,
      exportFmt: 'png', exportQual: 0.92,
      adj: {
        brightness:0, contrast:0, exposure:0, highlights:0, shadows:0,
        saturation:0, vibrance:0, hue:0, temperature:0, tint:0,
        clarity:0, sharpness:0, blur:0, vignette:0, grain:0, freeRot:0
      }
    };

    this.PRESETS = {
      original:  { brightness:0,  contrast:0,  exposure:0,    highlights:0,  shadows:0,   saturation:0,   vibrance:0,  hue:0,  temperature:0,  tint:0,  clarity:0,  sharpness:0,  blur:0, vignette:0,  grain:0  },
      vivid:     { brightness:5,  contrast:25, exposure:.10,  highlights:-10, shadows:12,  saturation:35,  vibrance:30, hue:0,  temperature:8,  tint:0,  clarity:20, sharpness:15, blur:0, vignette:0,  grain:0  },
      chrome:    { brightness:8,  contrast:32, exposure:.15,  highlights:-18, shadows:14,  saturation:15,  vibrance:12, hue:0,  temperature:-5, tint:0,  clarity:28, sharpness:20, blur:0, vignette:10, grain:0  },
      fade:      { brightness:18, contrast:-18,exposure:.10,  highlights:22,  shadows:30,  saturation:-28, vibrance:-15,hue:0,  temperature:12, tint:5,  clarity:-8, sharpness:0,  blur:0, vignette:0,  grain:6  },
      matte:     { brightness:12, contrast:-12,exposure:.08,  highlights:28,  shadows:38,  saturation:-18, vibrance:-12,hue:0,  temperature:10, tint:3,  clarity:0,  sharpness:0,  blur:0, vignette:18, grain:10 },
      noir:      { brightness:-5, contrast:42, exposure:-.10, highlights:-12, shadows:-12, saturation:-100,vibrance:0,  hue:0,  temperature:0,  tint:0,  clarity:25, sharpness:20, blur:0, vignette:32, grain:18 },
      warm:      { brightness:5,  contrast:10, exposure:.08,  highlights:5,   shadows:10,  saturation:14,  vibrance:20, hue:5,  temperature:42, tint:5,  clarity:10, sharpness:10, blur:0, vignette:0,  grain:0  },
      cool:      { brightness:2,  contrast:10, exposure:0,    highlights:-5,  shadows:5,   saturation:8,   vibrance:12, hue:-5, temperature:-38,tint:-5, clarity:10, sharpness:10, blur:0, vignette:5,  grain:0  },
      golden:    { brightness:8,  contrast:14, exposure:.12,  highlights:-5,  shadows:18,  saturation:22,  vibrance:25, hue:10, temperature:50, tint:8,  clarity:14, sharpness:10, blur:0, vignette:22, grain:6  },
      cinematic: { brightness:-8, contrast:36, exposure:-.08, highlights:-25, shadows:-8,  saturation:12,  vibrance:15, hue:0,  temperature:-8, tint:-5, clarity:20, sharpness:14, blur:0, vignette:38, grain:12 },
      vintage:   { brightness:5,  contrast:5,  exposure:0,    highlights:14,  shadows:18,  saturation:-18, vibrance:-8, hue:15, temperature:25, tint:10, clarity:0,  sharpness:0,  blur:0, vignette:28, grain:28 },
      punch:     { brightness:0,  contrast:42, exposure:0,    highlights:-20, shadows:-10, saturation:50,  vibrance:42, hue:0,  temperature:0,  tint:0,  clarity:35, sharpness:25, blur:0, vignette:5,  grain:0  }
    };

    this._rafId = null; this._pending = false;
    this._kbdFn = null; this._pasteFn = null;
  }

  /* ── Observed attributes — same 13 as series ── */
  static get observedAttributes() {
    return [
      'primary-bg','secondary-bg','border-color','secondary-text',
      'main-accent','hover-accent','heading-color','paragraph-color',
      'font-family','font-size','heading-size','border-radius','button-padding'
    ];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (newValue && newValue !== oldValue) {
      const map = {
        'primary-bg':'primaryBg','secondary-bg':'secondaryBg','border-color':'borderColor',
        'secondary-text':'secondaryText','main-accent':'mainAccent','hover-accent':'hoverAccent',
        'heading-color':'headingColor','paragraph-color':'paragraphColor','font-family':'fontFamily',
        'font-size':'fontSize','heading-size':'headingSize','border-radius':'borderRadius','button-padding':'buttonPadding'
      };
      const key = map[name];
      if (key) {
        this.settings[key] = newValue;
        this.updateStyles(); // ← replaces <style id="dynamic-styles"> in-place
      }
    }
  }

  connectedCallback() { this.render(); this.initEventListeners(); this.bindKeyboard(); }

  disconnectedCallback() {
    cancelAnimationFrame(this._rafId);
    if (this._kbdFn)   document.removeEventListener('keydown', this._kbdFn);
    if (this._pasteFn) document.removeEventListener('paste',   this._pasteFn);
  }

  /* ════════════════════════════════════════════════════════
     STYLES — series-compatible light theme
     Uses full CSS var names: --primary-bg, --main-accent etc.
  ════════════════════════════════════════════════════════ */
  getStyles() {
    const s = this.settings;
    return `
      :host {
        --primary-bg:      ${s.primaryBg};
        --secondary-bg:    ${s.secondaryBg};
        --border-color:    ${s.borderColor};
        --secondary-text:  ${s.secondaryText};
        --main-accent:     ${s.mainAccent};
        --hover-accent:    ${s.hoverAccent};
        --heading-color:   ${s.headingColor};
        --paragraph-color: ${s.paragraphColor};
        --font-family:     ${s.fontFamily};
        --font-size:       ${s.fontSize}px;
        --heading-size:    ${s.headingSize}px;
        --border-radius:   ${s.borderRadius}px;
        --button-padding:  ${s.buttonPadding}px;
        display: block; width: 100%;
        font-family: var(--font-family);
        color: var(--paragraph-color);
      }
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      .container {
        display: flex; flex-direction: column; width: 100%; min-height: 600px;
        background: var(--primary-bg); border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        box-shadow: 0 4px 12px rgba(0,0,0,0.08); overflow: hidden;
      }

      /* toolbar */
      .toolbar {
        display: flex; align-items: center; gap: 5px; flex-wrap: wrap;
        padding: 10px 14px; background: var(--primary-bg);
        border-bottom: 1px solid var(--border-color); flex-shrink: 0;
      }
      .toolbar-title {
        font-size: var(--heading-size); font-weight: 700;
        color: var(--heading-color); font-family: var(--font-family);
        margin-right: 6px; white-space: nowrap;
      }
      .tb-sep { width: 1px; height: 22px; background: var(--border-color); margin: 0 2px; }
      .tb-spacer { flex: 1; }
      .tb-btn {
        display: inline-flex; align-items: center; gap: 5px;
        padding: var(--button-padding) 12px;
        border: 1px solid var(--border-color); border-radius: var(--border-radius);
        background: var(--primary-bg); color: var(--paragraph-color);
        font-family: var(--font-family); font-size: var(--font-size); font-weight: 500;
        cursor: pointer; transition: all 0.2s; white-space: nowrap;
      }
      .tb-btn:hover { background: var(--secondary-bg); border-color: var(--secondary-text); }
      .tb-btn.active { background: var(--main-accent); border-color: var(--main-accent); color: var(--primary-bg); }
      .tb-btn.primary { background: var(--main-accent); border-color: var(--main-accent); color: var(--primary-bg); }
      .tb-btn.primary:hover { background: var(--hover-accent); border-color: var(--hover-accent); }
      .tb-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      .tb-btn:disabled:hover { background: var(--primary-bg); border-color: var(--border-color); color: var(--paragraph-color); }
      .tb-btn svg { width: 14px; height: 14px; flex-shrink: 0; }
      .img-meta {
        font-size: calc(var(--font-size) - 1px); color: var(--secondary-text);
        padding: 4px 10px; background: var(--secondary-bg);
        border: 1px solid var(--border-color); border-radius: var(--border-radius);
      }

      /* body */
      .editor-body { display: flex; flex: 1; overflow: hidden; min-height: 0; }

      /* tool sidebar */
      .tools-sidebar {
        width: 48px; background: var(--secondary-bg);
        border-right: 1px solid var(--border-color);
        display: flex; flex-direction: column; align-items: center;
        padding: 8px 0; gap: 2px; flex-shrink: 0;
      }
      .tool-btn {
        width: 36px; height: 36px; border-radius: var(--border-radius);
        border: 1px solid transparent; background: transparent;
        color: var(--secondary-text); cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.2s; position: relative;
      }
      .tool-btn:hover { background: var(--primary-bg); border-color: var(--border-color); color: var(--paragraph-color); }
      .tool-btn.active { background: var(--main-accent); border-color: var(--main-accent); color: var(--primary-bg); }
      .tool-btn svg { width: 16px; height: 16px; }
      .tool-sep { width: 28px; height: 1px; background: var(--border-color); margin: 4px 0; }
      .tool-tip {
        position: absolute; left: calc(100% + 8px); top: 50%; transform: translateY(-50%);
        background: var(--heading-color); color: var(--primary-bg);
        font-family: var(--font-family); font-size: calc(var(--font-size) - 2px); font-weight: 600;
        padding: 4px 8px; border-radius: 4px; white-space: nowrap;
        pointer-events: none; opacity: 0; transition: opacity 0.15s; z-index: 200;
      }
      .tool-btn:hover .tool-tip { opacity: 1; }

      /* canvas area */
      .canvas-area {
        flex: 1; background: var(--secondary-bg);
        display: flex; align-items: center; justify-content: center;
        overflow: hidden; position: relative;
      }
      .drop-zone {
        position: absolute; inset: 20px;
        border: 2px dashed var(--border-color); border-radius: var(--border-radius);
        display: flex; flex-direction: column; align-items: center;
        justify-content: center; gap: 14px; cursor: pointer; transition: all 0.2s;
      }
      .drop-zone:hover, .drop-zone.over { border-color: var(--main-accent); }
      .dz-icon { color: var(--border-color); transition: color 0.2s; }
      .drop-zone:hover .dz-icon, .drop-zone.over .dz-icon { color: var(--main-accent); }
      .dz-title { font-size: calc(var(--heading-size) * 0.65); font-weight: 700; color: var(--secondary-text); font-family: var(--font-family); }
      .dz-sub   { font-size: var(--font-size); color: var(--secondary-text); opacity: 0.7; text-align: center; font-family: var(--font-family); }
      .dz-btn {
        padding: var(--button-padding) 22px; background: var(--main-accent); color: var(--primary-bg);
        border: none; border-radius: var(--border-radius); font-family: var(--font-family);
        font-size: var(--font-size); font-weight: 600; cursor: pointer; transition: all 0.2s;
      }
      .dz-btn:hover { background: var(--hover-accent); }

      .canvas-wrap {
        position: relative; display: none;
        box-shadow: 0 8px 32px rgba(0,0,0,0.15);
        border-radius: 2px; overflow: hidden; border: 1px solid var(--border-color);
      }
      canvas { display: block; }
      #drawCanvas, #overCanvas { position: absolute; top: 0; left: 0; pointer-events: none; }

      .cmp-line {
        position: absolute; top: 0; bottom: 0; width: 3px;
        background: var(--main-accent); cursor: ew-resize; display: none; z-index: 20;
      }
      .cmp-handle {
        position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
        width: 28px; height: 28px; background: var(--main-accent); border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 11px; color: var(--primary-bg); font-weight: 700;
      }
      .cmp-lbl {
        position: absolute; top: 10px; font-family: var(--font-family);
        font-size: calc(var(--font-size) - 2px); font-weight: 700; letter-spacing: .08em;
        padding: 3px 8px; border-radius: 3px; pointer-events: none; display: none;
      }
      .cmp-lbl.before { left: 10px; background: rgba(0,0,0,0.5); color: #fff; }
      .cmp-lbl.after  { right: 10px; background: var(--main-accent); color: var(--primary-bg); }

      .info-bar {
        position: absolute; bottom: 0; left: 0; right: 0; padding: 4px 14px;
        background: rgba(0,0,0,0.5); display: none; gap: 18px;
        font-family: var(--font-family); font-size: calc(var(--font-size) - 2px); color: rgba(255,255,255,0.7);
      }
      .info-bar.visible { display: flex; }
      .ib-lbl { opacity: 0.6; } .ib-val { color: #fff; font-weight: 500; }

      /* right panel */
      .right-panel {
        width: 268px; background: var(--primary-bg);
        border-left: 1px solid var(--border-color);
        display: flex; flex-direction: column; overflow: hidden; flex-shrink: 0;
      }
      .panel-tabs { display: flex; border-bottom: 1px solid var(--border-color); flex-shrink: 0; }
      .p-tab {
        flex: 1; padding: 10px 4px; text-align: center; cursor: pointer;
        font-family: var(--font-family); font-size: calc(var(--font-size) - 2px); font-weight: 600;
        letter-spacing: .05em; text-transform: uppercase; color: var(--secondary-text);
        border-bottom: 2px solid transparent; transition: all 0.2s;
      }
      .p-tab:hover { color: var(--paragraph-color); }
      .p-tab.active { color: var(--main-accent); border-bottom-color: var(--main-accent); }
      .panel-scroll {
        flex: 1; overflow-y: auto; padding: 14px 12px;
        scrollbar-width: thin; scrollbar-color: var(--border-color) transparent;
      }
      .panel-scroll::-webkit-scrollbar { width: 4px; }
      .panel-scroll::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 2px; }
      .tab-content { display: none; } .tab-content.active { display: block; }
      .p-section { margin-bottom: 18px; }
      .p-section-title {
        font-family: var(--font-family); font-size: calc(var(--font-size) - 2px); font-weight: 700;
        letter-spacing: .1em; text-transform: uppercase; color: var(--secondary-text);
        margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid var(--border-color);
      }
      .p-sep { height: 1px; background: var(--border-color); margin: 14px 0; }

      /* sliders */
      .sl-row { margin-bottom: 9px; }
      .sl-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
      .sl-label { font-family: var(--font-family); font-size: var(--font-size); color: var(--paragraph-color); font-weight: 500; }
      .sl-val { font-family: var(--font-family); font-size: calc(var(--font-size) - 1px); color: var(--main-accent); font-weight: 600; min-width: 38px; text-align: right; }
      input[type=range] { -webkit-appearance: none; width: 100%; height: 5px; background: var(--border-color); border-radius: 5px; outline: none; cursor: pointer; }
      input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--main-accent); cursor: pointer; transition: background 0.2s; }
      input[type=range]::-webkit-slider-thumb:hover { background: var(--hover-accent); }
      input[type=range]::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: var(--main-accent); border: none; cursor: pointer; }

      /* presets */
      .preset-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
      .preset-btn {
        padding: 8px 4px; border: 1px solid var(--border-color); border-radius: var(--border-radius);
        background: var(--secondary-bg); cursor: pointer; text-align: center;
        font-family: var(--font-family); font-size: calc(var(--font-size) - 2px); font-weight: 600;
        color: var(--secondary-text); transition: all 0.2s;
      }
      .preset-icon { font-size: 14px; display: block; margin-bottom: 3px; }
      .preset-btn:hover { border-color: var(--main-accent); color: var(--paragraph-color); background: var(--primary-bg); }
      .preset-btn.active { border-color: var(--main-accent); background: var(--main-accent); color: var(--primary-bg); }

      /* transform */
      .tf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px; }
      .tf-btn {
        padding: var(--button-padding) 6px; border: 1px solid var(--border-color); border-radius: var(--border-radius);
        background: var(--secondary-bg); color: var(--paragraph-color); cursor: pointer;
        font-family: var(--font-family); font-size: calc(var(--font-size) - 1px); font-weight: 600;
        display: flex; align-items: center; justify-content: center; gap: 5px; transition: all 0.2s;
      }
      .tf-btn:hover { background: var(--primary-bg); border-color: var(--secondary-text); }
      .tf-btn.full { grid-column: 1/-1; }
      .tf-btn svg { width: 13px; height: 13px; }

      /* draw options */
      .d-row { display: flex; align-items: center; gap: 8px; margin-bottom: 9px; }
      .d-lbl { font-family: var(--font-family); font-size: var(--font-size); color: var(--paragraph-color); font-weight: 500; flex: 1; }
      input[type=color] { width: 36px; height: 28px; padding: 2px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--secondary-bg); cursor: pointer; }
      input[type=number], input[type=text] {
        background: var(--secondary-bg); border: 1px solid var(--border-color); border-radius: var(--border-radius);
        color: var(--paragraph-color); font-family: var(--font-family); font-size: var(--font-size);
        padding: 5px 8px; outline: none; width: 100%; transition: border-color 0.2s;
      }
      input[type=number]:focus, input[type=text]:focus { border-color: var(--main-accent); }
      select {
        width: 100%; background: var(--secondary-bg); border: 1px solid var(--border-color);
        border-radius: var(--border-radius); color: var(--paragraph-color);
        font-family: var(--font-family); font-size: var(--font-size); padding: 5px 8px; outline: none; cursor: pointer;
      }
      .fg { margin-bottom: 9px; }
      .fg label { display: block; font-family: var(--font-family); font-size: calc(var(--font-size) - 1px); font-weight: 600; color: var(--secondary-text); margin-bottom: 4px; }
      .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }

      /* format buttons */
      .fmt-row { display: flex; gap: 6px; margin-bottom: 10px; }
      .fmt-btn {
        flex: 1; padding: var(--button-padding) 4px; border: 1px solid var(--border-color);
        border-radius: var(--border-radius); background: var(--secondary-bg); color: var(--secondary-text);
        font-family: var(--font-family); font-size: calc(var(--font-size) - 1px); font-weight: 600;
        text-align: center; cursor: pointer; transition: all 0.2s;
      }
      .fmt-btn:hover { border-color: var(--secondary-text); color: var(--paragraph-color); }
      .fmt-btn.active { border-color: var(--main-accent); background: var(--main-accent); color: var(--primary-bg); }

      /* export button */
      .export-btn {
        width: 100%; padding: var(--button-padding); background: var(--main-accent); color: var(--primary-bg);
        border: none; border-radius: var(--border-radius); font-family: var(--font-family);
        font-size: var(--font-size); font-weight: 600;
        display: flex; align-items: center; justify-content: center; gap: 8px;
        cursor: pointer; transition: all 0.2s; margin-top: 12px;
      }
      .export-btn:hover { background: var(--hover-accent); }
      .export-btn svg { width: 15px; height: 15px; }

      .info-card {
        background: var(--secondary-bg); border: 1px solid var(--border-color);
        border-radius: var(--border-radius); padding: 10px 12px;
        font-family: var(--font-family); font-size: calc(var(--font-size) - 1px);
        line-height: 1.8; color: var(--paragraph-color);
      }
      .info-card strong { color: var(--heading-color); }
      .hint { font-family: var(--font-family); font-size: calc(var(--font-size) - 2px); color: var(--secondary-text); line-height: 1.6; margin-top: 6px; }

      /* toast */
      .toast {
        position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%) translateY(10px);
        background: var(--heading-color); color: var(--primary-bg);
        font-family: var(--font-family); font-size: var(--font-size); font-weight: 600;
        padding: 9px 18px; border-radius: var(--border-radius);
        opacity: 0; pointer-events: none; transition: all 0.25s; z-index: 9999;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      }
      .toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
    `;
  }

  /* Replaces <style id="dynamic-styles"> in-place — same as series pattern */
  updateStyles() {
    const el = this.shadowRoot.getElementById('dynamic-styles');
    if (el) el.textContent = this.getStyles();
  }

  /* ════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════ */
  render() {
    this.shadowRoot.innerHTML = `
<style id="dynamic-styles">${this.getStyles()}</style>
<input type="file" id="fi" accept="image/*" style="display:none">
<div class="toast" id="toast"></div>

<div class="container">

  <div class="toolbar">
    <span class="toolbar-title">Image Editor</span>
    <div class="tb-sep"></div>
    <button class="tb-btn" id="undoBtn" disabled>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>Undo
    </button>
    <button class="tb-btn" id="redoBtn" disabled>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>Redo
    </button>
    <button class="tb-btn" id="resetBtn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>Reset
    </button>
    <button class="tb-btn" id="compareBtn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="3" x2="12" y2="21"/><polyline points="5 8 3 12 5 16"/><polyline points="19 8 21 12 19 16"/></svg>Compare
    </button>
    <div class="tb-spacer"></div>
    <span class="img-meta" id="imgMeta" style="display:none"></span>
    <div class="tb-sep"></div>
    <button class="tb-btn" id="openBtn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>Open
    </button>
    <button class="tb-btn primary" id="expTopBtn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Export
    </button>
  </div>

  <div class="editor-body">

    <div class="tools-sidebar">${this.buildToolButtons()}</div>

    <div class="canvas-area" id="ca">
      <div class="drop-zone" id="dz">
        <div class="dz-icon">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
            <rect x="3" y="3" width="18" height="18" rx="2.5"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
        <div class="dz-title">Drop image here</div>
        <div class="dz-sub">PNG · JPG · WebP · GIF · BMP<br>or paste from clipboard (Ctrl+V)</div>
        <button class="dz-btn" id="dzBtn">Browse File</button>
      </div>

      <div class="canvas-wrap" id="cw">
        <canvas id="mainCanvas"></canvas>
        <canvas id="drawCanvas"></canvas>
        <canvas id="overCanvas"></canvas>
        <div class="cmp-line" id="cmpLine"><div class="cmp-handle">⇔</div></div>
        <div class="cmp-lbl before" id="lblBefore">BEFORE</div>
        <div class="cmp-lbl after"  id="lblAfter">AFTER</div>
      </div>

      <div class="info-bar" id="infoBar">
        <span class="ib-lbl">TOOL</span><span class="ib-val" id="ibTool">Hand</span>
        &nbsp;&nbsp;<span class="ib-lbl">XY</span><span class="ib-val" id="ibXY">—</span>
        &nbsp;&nbsp;<span class="ib-lbl">SIZE</span><span class="ib-val" id="ibSz">—</span>
      </div>
    </div>

    <div class="right-panel">
      <div class="panel-tabs">
        <div class="p-tab active" data-pt="adjust">Adjust</div>
        <div class="p-tab" data-pt="filters">Filters</div>
        <div class="p-tab" data-pt="draw">Draw</div>
        <div class="p-tab" data-pt="export">Export</div>
      </div>
      <div class="panel-scroll">

        <div class="tab-content active" data-pc="adjust">
          <div class="p-section"><div class="p-section-title">Light</div>${this.buildSliders([
            {k:'brightness',l:'Brightness',mn:-100,mx:100,st:1},{k:'contrast',l:'Contrast',mn:-100,mx:100,st:1},
            {k:'exposure',l:'Exposure',mn:-2,mx:2,st:.05},{k:'highlights',l:'Highlights',mn:-100,mx:100,st:1},
            {k:'shadows',l:'Shadows',mn:-100,mx:100,st:1}
          ])}</div>
          <div class="p-sep"></div>
          <div class="p-section"><div class="p-section-title">Color</div>${this.buildSliders([
            {k:'saturation',l:'Saturation',mn:-100,mx:100,st:1},{k:'vibrance',l:'Vibrance',mn:-100,mx:100,st:1},
            {k:'hue',l:'Hue',mn:-180,mx:180,st:1},{k:'temperature',l:'Temperature',mn:-100,mx:100,st:1},
            {k:'tint',l:'Tint',mn:-100,mx:100,st:1}
          ])}</div>
          <div class="p-sep"></div>
          <div class="p-section"><div class="p-section-title">Detail</div>${this.buildSliders([
            {k:'clarity',l:'Clarity',mn:0,mx:100,st:1},{k:'sharpness',l:'Sharpness',mn:0,mx:100,st:1},
            {k:'blur',l:'Blur',mn:0,mx:40,st:1}
          ])}</div>
          <div class="p-sep"></div>
          <div class="p-section"><div class="p-section-title">Effects</div>${this.buildSliders([
            {k:'vignette',l:'Vignette',mn:0,mx:100,st:1},{k:'grain',l:'Film Grain',mn:0,mx:100,st:1}
          ])}</div>
          <div class="p-sep"></div>
          <div class="p-section">
            <div class="p-section-title">Transform</div>
            <div class="tf-grid">
              <button class="tf-btn" id="rotCCW"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>CCW</button>
              <button class="tf-btn" id="rotCW"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>CW</button>
              <button class="tf-btn" id="flipH"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18"/><path d="M17 8l5 4-5 4"/><path d="M7 8l-5 4 5 4"/></svg>Flip H</button>
              <button class="tf-btn" id="flipV"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18"/><path d="M8 17l4 5 4-5"/><path d="M8 7l4-5 4 5"/></svg>Flip V</button>
            </div>
            ${this.buildSliders([{k:'freeRot',l:'Free Rotate',mn:-45,mx:45,st:.5}])}
            <div class="p-section-title" style="margin-top:12px;">Resize</div>
            <div class="two-col" style="margin-bottom:7px;">
              <div class="fg"><label>Width px</label><input type="number" id="resW" min="1" max="8000" placeholder="W"></div>
              <div class="fg"><label>Height px</label><input type="number" id="resH" min="1" max="8000" placeholder="H"></div>
            </div>
            <button class="tf-btn full" id="applyResize">Apply Resize</button>
          </div>
        </div>

        <div class="tab-content" data-pc="filters">
          <div class="p-section">
            <div class="p-section-title">Cinematic Presets</div>
            <div class="preset-grid">
              <div class="preset-btn active" data-preset="original"><span class="preset-icon">◻</span>Original</div>
              <div class="preset-btn" data-preset="vivid"><span class="preset-icon">✦</span>Vivid</div>
              <div class="preset-btn" data-preset="chrome"><span class="preset-icon">⬡</span>Chrome</div>
              <div class="preset-btn" data-preset="fade"><span class="preset-icon">◫</span>Fade</div>
              <div class="preset-btn" data-preset="matte"><span class="preset-icon">▣</span>Matte</div>
              <div class="preset-btn" data-preset="noir"><span class="preset-icon">◼</span>Noir</div>
              <div class="preset-btn" data-preset="warm"><span class="preset-icon">☀</span>Warm</div>
              <div class="preset-btn" data-preset="cool"><span class="preset-icon">❄</span>Cool</div>
              <div class="preset-btn" data-preset="golden"><span class="preset-icon">★</span>Golden</div>
              <div class="preset-btn" data-preset="cinematic"><span class="preset-icon">▶</span>Cinema</div>
              <div class="preset-btn" data-preset="vintage"><span class="preset-icon">◎</span>Vintage</div>
              <div class="preset-btn" data-preset="punch"><span class="preset-icon">◉</span>Punch</div>
            </div>
          </div>
          <div class="p-sep"></div>
          <p class="hint">Presets apply a curated look. Fine-tune further in the Adjust tab.</p>
        </div>

        <div class="tab-content" data-pc="draw">
          <div class="p-section">
            <div class="p-section-title">Stroke</div>
            <div class="d-row"><span class="d-lbl">Color</span><input type="color" id="drawColor" value="#e74c3c"></div>
            <div class="sl-row">
              <div class="sl-header"><span class="sl-label">Brush Size</span><span class="sl-val" id="val_drawSize">4px</span></div>
              <input type="range" id="drawSzSlider" min="1" max="80" step="1" value="4">
            </div>
            <div class="sl-row">
              <div class="sl-header"><span class="sl-label">Opacity</span><span class="sl-val" id="val_drawOpacity">100%</span></div>
              <input type="range" id="drawOpSlider" min="5" max="100" step="5" value="100">
            </div>
          </div>
          <div class="p-sep"></div>
          <div class="p-section">
            <div class="p-section-title">Text Tool</div>
            <div class="fg"><label>Content</label><input type="text" id="textStr" value="Text" placeholder="Type text…"></div>
            <div class="two-col">
              <div class="fg"><label>Font Size</label><input type="number" id="textSz" value="36" min="8" max="400"></div>
              <div class="fg"><label>Color</label><input type="color" id="textCol" value="#ffffff" style="height:30px;width:100%;margin-top:2px;"></div>
            </div>
            <div class="fg">
              <label>Weight</label>
              <select id="textWt"><option value="400">Regular</option><option value="700" selected>Bold</option><option value="800">Extra Bold</option></select>
            </div>
          </div>
          <div class="p-sep"></div>
          <div class="p-section">
            <div class="p-section-title">Actions</div>
            <button class="tf-btn full" id="clearDrawBtn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              Clear Annotations
            </button>
            <p class="hint" style="margin-top:8px;">Pick a tool from the left sidebar, then click/drag on the canvas.</p>
          </div>
        </div>

        <div class="tab-content" data-pc="export">
          <div class="p-section">
            <div class="p-section-title">Format</div>
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
          <div class="p-section">
            <div class="p-section-title">Output Size</div>
            <div class="two-col" style="margin-bottom:6px;">
              <div class="fg"><label>Width px</label><input type="number" id="expW" min="1" max="8000" placeholder="Original"></div>
              <div class="fg"><label>Height px</label><input type="number" id="expH" min="1" max="8000" placeholder="Original"></div>
            </div>
            <p class="hint">Leave blank to export at current canvas size.</p>
          </div>
          <div class="p-sep"></div>
          <div class="p-section">
            <div class="p-section-title">Image Info</div>
            <div class="info-card" id="expInfo">No image loaded.</div>
          </div>
          <button class="export-btn" id="dlBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download Image
          </button>
        </div>

      </div>
    </div>

  </div>
</div>`;
  }

  buildToolButtons() {
    const tools = [
      {id:'hand',    tip:'Hand (V)',      svg:'<path d="M18 11V6a2 2 0 0 0-4 0"/><path d="M14 10V4a2 2 0 0 0-4 0v2"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>'},
      {id:'pen',     tip:'Pen (P)',       svg:'<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18z"/><circle cx="11" cy="11" r="2"/>'},
      {id:'rect',    tip:'Rectangle (R)', svg:'<rect x="3" y="3" width="18" height="18" rx="2"/>'},
      {id:'ellipse', tip:'Ellipse (E)',   svg:'<ellipse cx="12" cy="12" rx="10" ry="6"/>'},
      {id:'line',    tip:'Line (L)',      svg:'<line x1="5" y1="19" x2="19" y2="5"/>'},
      {id:'text',    tip:'Text (T)',      svg:'<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>'},
      {id:'eyedrop', tip:'Eyedrop (I)',   svg:'<path d="M2 13.5V20h6.5L20 8.5 15.5 4z"/><path d="M20 8.5l2.5-2.5a1 1 0 000-1.4l-3-3a1 1 0 00-1.4 0L15.5 4"/>'}
    ];
    return tools.map((t,i)=>`
      <button class="tool-btn ${t.id==='hand'?'active':''}" data-tool="${t.id}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${t.svg}</svg>
        <span class="tool-tip">${t.tip}</span>
      </button>${i===0?'<div class="tool-sep"></div>':''}`).join('');
  }

  buildSliders(defs) {
    return defs.map(s=>`
      <div class="sl-row">
        <div class="sl-header"><span class="sl-label">${s.l}</span><span class="sl-val" id="val_${s.k}">${s.k==='exposure'?'0.00':s.k==='freeRot'?'0°':'0'}</span></div>
        <input type="range" data-adj="${s.k}" min="${s.mn}" max="${s.mx}" step="${s.st}" value="0">
      </div>`).join('');
  }

  /* ════════════════════════════════════════════════════════
     IMAGE LOADING
  ════════════════════════════════════════════════════════ */
  loadImage(src) {
    const img = new Image();
    img.onload = () => {
      const W = img.naturalWidth, H = img.naturalHeight;
      const sr = this.shadowRoot;
      ['mainCanvas','drawCanvas','overCanvas'].forEach(id=>{const c=sr.getElementById(id);c.width=W;c.height=H;});

      // Off-screen canvas ensures pixels are fully drawn before getImageData
      const off=document.createElement('canvas'); off.width=W; off.height=H;
      const offCtx=off.getContext('2d');
      offCtx.fillStyle='#ffffff'; offCtx.fillRect(0,0,W,H);
      offCtx.drawImage(img,0,0);
      this.es.origData=offCtx.getImageData(0,0,W,H);

      this.es.drawData=null; this.es.rotation=0; this.es.flipH=false; this.es.flipV=false; this.es.adj.freeRot=0;
      this.resetAdj(false);

      sr.getElementById('dz').style.display='none';
      sr.getElementById('cw').style.display='inline-block';
      sr.getElementById('infoBar').classList.add('visible');
      sr.getElementById('imgMeta').textContent=`${W} × ${H}px`;
      sr.getElementById('imgMeta').style.display='block';
      sr.getElementById('ibSz').textContent=`${W} × ${H}`;
      sr.getElementById('resW').value=W; sr.getElementById('resH').value=H;
      sr.getElementById('expW').placeholder=W; sr.getElementById('expH').placeholder=H;
      sr.getElementById('expInfo').innerHTML=`<strong>${W} × ${H}px</strong><br>Channels: RGBA`;

      this.es.histStack=[]; this.es.histIdx=-1; this.pushHist();
      this.apply(); this.toast('Image loaded!');
    };
    img.onerror=()=>this.toast('Failed to load image.');
    img.src=src; this.es.loaded=true;
  }

  /* ════════════════════════════════════════════════════════
     PIXEL PIPELINE
  ════════════════════════════════════════════════════════ */
  scheduleApply() {
    if(this._pending)return; this._pending=true;
    cancelAnimationFrame(this._rafId);
    this._rafId=requestAnimationFrame(()=>{this._pending=false;this.apply();});
  }

  apply() {
    if(!this.es.origData)return;
    const sr=this.shadowRoot, mc=sr.getElementById('mainCanvas');
    const mCtx=mc.getContext('2d',{willReadFrequently:true});
    const orig=this.es.origData, sw=orig.width, sh=orig.height, adj=this.es.adj;

    const freeRad=(adj.freeRot||0)*Math.PI/180, rot90=this.es.rotation*Math.PI/180, totRad=rot90+freeRad;
    const cosA=Math.abs(Math.cos(totRad)), sinA=Math.abs(Math.sin(totRad));
    const outW=Math.round(sw*cosA+sh*sinA), outH=Math.round(sw*sinA+sh*cosA);

    const srcC=document.createElement('canvas'); srcC.width=sw; srcC.height=sh;
    const srcCtx=srcC.getContext('2d'); srcCtx.fillStyle='#ffffff'; srcCtx.fillRect(0,0,sw,sh); srcCtx.putImageData(orig,0,0);

    const tC=document.createElement('canvas'); tC.width=outW; tC.height=outH;
    const tCtx=tC.getContext('2d'); tCtx.fillStyle='#ffffff'; tCtx.fillRect(0,0,outW,outH);
    tCtx.translate(outW/2,outH/2); tCtx.rotate(totRad); tCtx.scale(this.es.flipH?-1:1,this.es.flipV?-1:1); tCtx.drawImage(srcC,-sw/2,-sh/2);

    if(mc.width!==outW||mc.height!==outH)['mainCanvas','drawCanvas','overCanvas'].forEach(id=>{const c=sr.getElementById(id);c.width=outW;c.height=outH;});

    const id=tCtx.getImageData(0,0,outW,outH), d=id.data;
    const bri=adj.brightness/100*255, conF=(259*(adj.contrast/100*255+255))/(255*(259-adj.contrast/100*255));
    const expo=Math.pow(2,adj.exposure||0), high=(adj.highlights||0)/100, shad=(adj.shadows||0)/100;
    const temp=(adj.temperature||0)/100, tin=(adj.tint||0)/100, sat=(adj.saturation||0)/100, vib=(adj.vibrance||0)/100;

    for(let i=0;i<d.length;i+=4){
      let r=d[i],g=d[i+1],b=d[i+2];
      r*=expo;g*=expo;b*=expo;
      r+=temp*32-tin*12;g+=tin*18;b-=temp*32+tin*8;
      r+=bri;g+=bri;b+=bri;
      r=conF*(r-128)+128;g=conF*(g-128)+128;b=conF*(b-128)+128;
      const luma=.299*r+.587*g+.114*b;
      if(luma>128){const t=(luma-128)/127;r+=high*t*45;g+=high*t*45;b+=high*t*45;}
      else{const t=(128-luma)/128;r+=shad*t*45;g+=shad*t*45;b+=shad*t*45;}
      const gray=.299*r+.587*g+.114*b, chroma=Math.max(r,g,b)-Math.min(r,g,b);
      const vibM=1+vib*(1-chroma/255*2), satM=1+sat+Math.max(0,vibM-1);
      r=gray+(r-gray)*satM;g=gray+(g-gray)*satM;b=gray+(b-gray)*satM;
      if(adj.hue!==0){
        const rn=Math.min(255,Math.max(0,r))/255,gn=Math.min(255,Math.max(0,g))/255,bn=Math.min(255,Math.max(0,b))/255;
        const mx=Math.max(rn,gn,bn),mn=Math.min(rn,gn,bn),l=(mx+mn)/2;
        if(mx!==mn){
          const d2=mx-mn,s2=d2/(1-Math.abs(2*l-1));let h=0;
          if(mx===rn)h=((gn-bn)/d2+6)%6;else if(mx===gn)h=(bn-rn)/d2+2;else h=(rn-gn)/d2+4;
          h=(h/6+adj.hue/360+2)%1;const q=l<.5?l*(1+s2):l+s2-l*s2,p=2*l-q;
          const h2=(p,q,t)=>{if(t<0)t++;if(t>1)t--;if(t<1/6)return p+(q-p)*6*t;if(t<.5)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;};
          r=h2(p,q,h+1/3)*255;g=h2(p,q,h)*255;b=h2(p,q,h-1/3)*255;
        }
      }
      d[i]=Math.min(255,Math.max(0,r));d[i+1]=Math.min(255,Math.max(0,g));d[i+2]=Math.min(255,Math.max(0,b));
    }

    if(adj.clarity>0)this.applyClarity(d,outW,outH,adj.clarity/100);
    if(adj.sharpness>0)this.applySharpness(d,outW,outH,adj.sharpness/100);
    if(adj.blur>0){const bl=this.boxBlur(d,outW,outH,Math.round(adj.blur*0.5));d.set(bl);}

    // FIX: fill white before putImageData — image always visible
    mCtx.fillStyle='#ffffff'; mCtx.fillRect(0,0,outW,outH);
    mCtx.putImageData(id,0,0);

    if(adj.vignette>0){
      const grd=mCtx.createRadialGradient(outW/2,outH/2,Math.min(outW,outH)*.28,outW/2,outH/2,Math.max(outW,outH)*.76);
      grd.addColorStop(0,'rgba(0,0,0,0)');grd.addColorStop(1,`rgba(0,0,0,${adj.vignette/100*.88})`);
      mCtx.fillStyle=grd;mCtx.fillRect(0,0,outW,outH);
    }
    if(adj.grain>0){
      const gd=mCtx.getImageData(0,0,outW,outH),gp=gd.data,int2=adj.grain/100*65;
      for(let i=0;i<gp.length;i+=4){const n=(Math.random()-.5)*int2;gp[i]=Math.min(255,Math.max(0,gp[i]+n));gp[i+1]=Math.min(255,Math.max(0,gp[i+1]+n));gp[i+2]=Math.min(255,Math.max(0,gp[i+2]+n));}
      mCtx.putImageData(gd,0,0);
    }
    this.redrawDraw();
    if(this.es.compareMode)this.drawCompare();
  }

  applyClarity(d,w,h,amt){const c=new Uint8ClampedArray(d),r=2;for(let y=r;y<h-r;y++)for(let x=r;x<w-r;x++){const i=(y*w+x)*4;for(let ch=0;ch<3;ch++){let s=0,n=0;for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){s+=c[((y+dy)*w+(x+dx))*4+ch];n++;}d[i+ch]=Math.min(255,Math.max(0,c[i+ch]+(c[i+ch]-s/n)*amt*1.6));}};}
  applySharpness(d,w,h,amt){const c=new Uint8ClampedArray(d),k=[-1,-1,-1,-1,9,-1,-1,-1,-1];for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=(y*w+x)*4;for(let ch=0;ch<3;ch++){let v=0;for(let ky=0;ky<3;ky++)for(let kx=0;kx<3;kx++)v+=c[((y+ky-1)*w+(x+kx-1))*4+ch]*k[ky*3+kx];d[i+ch]=Math.min(255,Math.max(0,c[i+ch]*(1-amt)+v*amt));}};}
  boxBlur(d,w,h,r){const src=new Uint8ClampedArray(d),tmp=new Uint8ClampedArray(d.length),out=new Uint8ClampedArray(d.length);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;let sr=0,sg=0,sb=0,cnt=0;for(let dx=-r;dx<=r;dx++){const nx=Math.min(w-1,Math.max(0,x+dx)),ni=(y*w+nx)*4;sr+=src[ni];sg+=src[ni+1];sb+=src[ni+2];cnt++;}tmp[i]=sr/cnt;tmp[i+1]=sg/cnt;tmp[i+2]=sb/cnt;tmp[i+3]=src[i+3];}for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;let sr=0,sg=0,sb=0,cnt=0;for(let dy=-r;dy<=r;dy++){const ny=Math.min(h-1,Math.max(0,y+dy)),ni=(ny*w+x)*4;sr+=tmp[ni];sg+=tmp[ni+1];sb+=tmp[ni+2];cnt++;}out[i]=sr/cnt;out[i+1]=sg/cnt;out[i+2]=sb/cnt;out[i+3]=tmp[i+3];}return out;}

  redrawDraw(){const dc=this.shadowRoot.getElementById('drawCanvas');if(!dc)return;const ctx=dc.getContext('2d');ctx.clearRect(0,0,dc.width,dc.height);if(this.es.drawData)ctx.putImageData(this.es.drawData,0,0);}
  saveDraw(){const dc=this.shadowRoot.getElementById('drawCanvas');if(!dc)return;this.es.drawData=dc.getContext('2d').getImageData(0,0,dc.width,dc.height);}

  drawCompare(){
    const oc=this.shadowRoot.getElementById('overCanvas'),ctx=oc.getContext('2d'),W=oc.width,H=oc.height,splitX=Math.round(W*this.es.compareX);
    ctx.clearRect(0,0,W,H);
    const origC=document.createElement('canvas');origC.width=this.es.origData.width;origC.height=this.es.origData.height;
    const oCtx=origC.getContext('2d');oCtx.fillStyle='#ffffff';oCtx.fillRect(0,0,origC.width,origC.height);oCtx.putImageData(this.es.origData,0,0);
    ctx.save();ctx.beginPath();ctx.rect(0,0,splitX,H);ctx.clip();ctx.drawImage(origC,0,0,W,H);ctx.restore();
    this.shadowRoot.getElementById('cmpLine').style.left=(this.es.compareX*100)+'%';
  }

  /* ════════════════════════════════════════════════════════
     HISTORY
  ════════════════════════════════════════════════════════ */
  cloneID(id){return id?new ImageData(new Uint8ClampedArray(id.data),id.width,id.height):null;}
  pushHist(){
    const snap={adj:{...this.es.adj},rotation:this.es.rotation,flipH:this.es.flipH,flipV:this.es.flipV,drawData:this.cloneID(this.es.drawData),origData:this.cloneID(this.es.origData)};
    this.es.histStack=this.es.histStack.slice(0,this.es.histIdx+1);this.es.histStack.push(snap);
    if(this.es.histStack.length>20)this.es.histStack.shift();this.es.histIdx=this.es.histStack.length-1;this.syncHistBtns();
  }
  undo(){if(this.es.histIdx<=0){this.toast('Nothing to undo');return;}this.es.histIdx--;this.restoreHist();}
  redo(){if(this.es.histIdx>=this.es.histStack.length-1){this.toast('Nothing to redo');return;}this.es.histIdx++;this.restoreHist();}
  restoreHist(){const s=this.es.histStack[this.es.histIdx];if(!s)return;Object.assign(this.es.adj,s.adj);this.es.rotation=s.rotation;this.es.flipH=s.flipH;this.es.flipV=s.flipV;this.es.drawData=this.cloneID(s.drawData);this.es.origData=this.cloneID(s.origData);this.syncSliders();this.apply();this.syncHistBtns();}
  syncHistBtns(){const sr=this.shadowRoot;sr.getElementById('undoBtn').disabled=this.es.histIdx<=0;sr.getElementById('redoBtn').disabled=this.es.histIdx>=this.es.histStack.length-1;}
  syncSliders(){Object.entries(this.es.adj).forEach(([k,v])=>{const sl=this.shadowRoot.querySelector(`[data-adj="${k}"]`),vl=this.shadowRoot.getElementById(`val_${k}`);if(sl)sl.value=v;if(vl)vl.textContent=k==='exposure'?parseFloat(v).toFixed(2):k==='freeRot'?v+'°':Math.round(v);});}
  resetAdj(reapply=true){
    const d=this.PRESETS.original;Object.keys(this.es.adj).forEach(k=>this.es.adj[k]=d.hasOwnProperty(k)?d[k]:0);
    this.syncSliders();this.shadowRoot.querySelectorAll('.preset-btn').forEach(b=>b.classList.toggle('active',b.dataset.preset==='original'));
    if(reapply){this.apply();this.pushHist();}
  }

  /* ════════════════════════════════════════════════════════
     EVENTS
  ════════════════════════════════════════════════════════ */
  initEventListeners(){
    const sr=this.shadowRoot,fi=sr.getElementById('fi');
    const openFile=()=>fi.click();
    fi.addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>this.loadImage(ev.target.result);r.readAsDataURL(f);fi.value='';});
    sr.getElementById('openBtn').addEventListener('click',openFile);
    sr.getElementById('dzBtn').addEventListener('click',openFile);

    const ca=sr.getElementById('ca'),dz=sr.getElementById('dz');
    ca.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('over');});
    ca.addEventListener('dragleave',()=>dz.classList.remove('over'));
    ca.addEventListener('drop',e=>{e.preventDefault();dz.classList.remove('over');const f=e.dataTransfer.files[0];if(!f||!f.type.startsWith('image/')){this.toast('Drop an image file');return;}const r=new FileReader();r.onload=ev=>this.loadImage(ev.target.result);r.readAsDataURL(f);});

    sr.querySelectorAll('[data-adj]').forEach(sl=>{
      sl.addEventListener('input',()=>{const k=sl.dataset.adj,v=parseFloat(sl.value);this.es.adj[k]=v;const vl=sr.getElementById(`val_${k}`);if(vl)vl.textContent=k==='exposure'?v.toFixed(2):k==='freeRot'?v+'°':Math.round(v);this.scheduleApply();});
      sl.addEventListener('change',()=>this.pushHist());
    });

    sr.getElementById('undoBtn').addEventListener('click',()=>this.undo());
    sr.getElementById('redoBtn').addEventListener('click',()=>this.redo());
    sr.getElementById('resetBtn').addEventListener('click',()=>{this.resetAdj();this.toast('Adjustments reset');});
    sr.getElementById('rotCCW').addEventListener('click',()=>{this.es.rotation=(this.es.rotation-90+360)%360;this.apply();this.pushHist();});
    sr.getElementById('rotCW').addEventListener('click',()=>{this.es.rotation=(this.es.rotation+90)%360;this.apply();this.pushHist();});
    sr.getElementById('flipH').addEventListener('click',()=>{this.es.flipH=!this.es.flipH;this.apply();this.pushHist();});
    sr.getElementById('flipV').addEventListener('click',()=>{this.es.flipV=!this.es.flipV;this.apply();this.pushHist();});

    sr.getElementById('applyResize').addEventListener('click',()=>{
      const W=parseInt(sr.getElementById('resW').value),H=parseInt(sr.getElementById('resH').value);
      if(!W||!H){this.toast('Enter valid dimensions');return;}
      const tmp=document.createElement('canvas');tmp.width=this.es.origData.width;tmp.height=this.es.origData.height;
      const tc=tmp.getContext('2d');tc.fillStyle='#ffffff';tc.fillRect(0,0,tmp.width,tmp.height);tc.putImageData(this.es.origData,0,0);
      const sc=document.createElement('canvas');sc.width=W;sc.height=H;const sCtx=sc.getContext('2d');sCtx.imageSmoothingQuality='high';sCtx.drawImage(tmp,0,0,W,H);
      this.es.origData=sCtx.getImageData(0,0,W,H);sr.getElementById('imgMeta').textContent=`${W} × ${H}px`;sr.getElementById('ibSz').textContent=`${W} × ${H}`;
      this.apply();this.pushHist();this.toast(`Resized to ${W}×${H}px`);
    });

    sr.getElementById('compareBtn').addEventListener('click',()=>{
      if(!this.es.loaded){this.toast('Load an image first');return;}
      this.es.compareMode=!this.es.compareMode;sr.getElementById('compareBtn').classList.toggle('active',this.es.compareMode);
      const oc=sr.getElementById('overCanvas'),cl=sr.getElementById('cmpLine'),lb=sr.getElementById('lblBefore'),la=sr.getElementById('lblAfter');
      if(this.es.compareMode){this.es.compareX=.5;oc.style.display=cl.style.display=lb.style.display=la.style.display='block';this.drawCompare();this.toast('Drag divider to compare');}
      else{oc.style.display=cl.style.display=lb.style.display=la.style.display='none';oc.getContext('2d').clearRect(0,0,oc.width,oc.height);}
    });

    let dragCmp=false;
    sr.getElementById('cmpLine').addEventListener('mousedown',()=>dragCmp=true);
    sr.getElementById('ca').addEventListener('mousemove',e=>{if(!dragCmp)return;const wr=sr.getElementById('cw').getBoundingClientRect();this.es.compareX=Math.max(.02,Math.min(.98,(e.clientX-wr.left)/wr.width));this.drawCompare();});
    document.addEventListener('mouseup',()=>dragCmp=false);

    sr.querySelectorAll('.preset-btn').forEach(btn=>{
      btn.addEventListener('click',()=>{const pre=this.PRESETS[btn.dataset.preset];if(!pre)return;Object.assign(this.es.adj,pre);this.es.adj.freeRot=0;this.syncSliders();sr.querySelectorAll('.preset-btn').forEach(b=>b.classList.toggle('active',b.dataset.preset===btn.dataset.preset));this.apply();this.pushHist();});
    });

    sr.querySelectorAll('.p-tab').forEach(tab=>{
      tab.addEventListener('click',()=>{sr.querySelectorAll('.p-tab').forEach(t=>t.classList.remove('active'));sr.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));tab.classList.add('active');sr.querySelector(`.tab-content[data-pc="${tab.dataset.pt}"]`)?.classList.add('active');});
    });

    sr.querySelectorAll('[data-tool]').forEach(btn=>{
      btn.addEventListener('click',()=>{sr.querySelectorAll('[data-tool]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');this.es.tool=btn.dataset.tool;sr.getElementById('ibTool').textContent=btn.dataset.tool.charAt(0).toUpperCase()+btn.dataset.tool.slice(1);const mc=sr.getElementById('mainCanvas');mc.style.cursor=this.es.tool==='hand'?'grab':this.es.tool==='text'?'text':'crosshair';});
    });

    this.wireCanvas();

    sr.getElementById('drawColor').addEventListener('input',e=>this.es.drawColor=e.target.value);
    sr.getElementById('drawSzSlider').addEventListener('input',e=>{this.es.drawSize=parseInt(e.target.value);sr.getElementById('val_drawSize').textContent=e.target.value+'px';});
    sr.getElementById('drawOpSlider').addEventListener('input',e=>{this.es.drawOpacity=parseInt(e.target.value)/100;sr.getElementById('val_drawOpacity').textContent=e.target.value+'%';});
    sr.getElementById('textStr').addEventListener('input',e=>this.es.textStr=e.target.value||'Text');
    sr.getElementById('textSz').addEventListener('input',e=>this.es.textSize=parseInt(e.target.value)||36);
    sr.getElementById('textCol').addEventListener('input',e=>this.es.textColor=e.target.value);
    sr.getElementById('textWt').addEventListener('change',e=>this.es.textWeight=e.target.value);
    sr.getElementById('clearDrawBtn').addEventListener('click',()=>{const dc=sr.getElementById('drawCanvas');dc.getContext('2d').clearRect(0,0,dc.width,dc.height);this.es.drawData=null;this.pushHist();this.toast('Annotations cleared');});

    sr.querySelectorAll('.fmt-btn').forEach(btn=>{btn.addEventListener('click',()=>{sr.querySelectorAll('.fmt-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');this.es.exportFmt=btn.dataset.fmt;sr.getElementById('qualRow').style.display=this.es.exportFmt!=='png'?'block':'none';});});
    sr.getElementById('qualSlider').addEventListener('input',e=>{this.es.exportQual=parseInt(e.target.value)/100;sr.getElementById('val_qual').textContent=e.target.value+'%';});

    const doDownload=()=>{
      if(!this.es.loaded){this.toast('No image loaded');return;}
      const mc=sr.getElementById('mainCanvas'),dc=sr.getElementById('drawCanvas');
      const W=parseInt(sr.getElementById('expW').value)||mc.width,H=parseInt(sr.getElementById('expH').value)||mc.height;
      const ec=document.createElement('canvas');ec.width=W;ec.height=H;
      const eCtx=ec.getContext('2d');eCtx.imageSmoothingQuality='high';eCtx.fillStyle='#ffffff';eCtx.fillRect(0,0,W,H);
      eCtx.drawImage(mc,0,0,W,H);eCtx.drawImage(dc,0,0,W,H);
      const mime=this.es.exportFmt==='jpeg'?'image/jpeg':this.es.exportFmt==='webp'?'image/webp':'image/png';
      const url=ec.toDataURL(mime,this.es.exportQual);
      const a=document.createElement('a');a.href=url;a.download=`edited.${this.es.exportFmt==='jpeg'?'jpg':this.es.exportFmt}`;a.click();
      this.toast(`Exported as ${this.es.exportFmt.toUpperCase()}!`);
    };
    sr.getElementById('dlBtn').addEventListener('click',doDownload);
    sr.getElementById('expTopBtn').addEventListener('click',doDownload);
  }

  wireCanvas(){
    const sr=this.shadowRoot,mc=sr.getElementById('mainCanvas');
    const pos=e=>{const rect=mc.getBoundingClientRect(),sx=mc.width/rect.width,sy=mc.height/rect.height;const cx=e.touches?e.touches[0].clientX:e.clientX,cy=e.touches?e.touches[0].clientY:e.clientY;return{x:(cx-rect.left)*sx,y:(cy-rect.top)*sy};};
    mc.addEventListener('mousedown',e=>this.drawStart(pos(e)));
    mc.addEventListener('mousemove',e=>{const p=pos(e);sr.getElementById('ibXY').textContent=`${Math.round(p.x)}, ${Math.round(p.y)}`;this.drawMove(p);});
    mc.addEventListener('mouseup',e=>this.drawEnd(pos(e)));
    mc.addEventListener('mouseleave',e=>this.drawEnd(pos(e)));
    mc.addEventListener('touchstart',e=>{e.preventDefault();this.drawStart(pos(e));},{passive:false});
    mc.addEventListener('touchmove',e=>{e.preventDefault();this.drawMove(pos(e));},{passive:false});
    mc.addEventListener('touchend',e=>{e.preventDefault();this.drawEnd(pos(e));},{passive:false});
  }

  setStroke(ctx){ctx.strokeStyle=this.es.drawColor;ctx.fillStyle=this.es.drawColor;ctx.lineWidth=this.es.drawSize;ctx.lineCap=ctx.lineJoin='round';ctx.globalAlpha=this.es.drawOpacity;}

  drawStart(p){
    const t=this.es.tool;if(!this.es.loaded||t==='hand')return;
    if(t==='eyedrop'){this.pickColor(p);return;}if(t==='text'){this.placeText(p);return;}
    this.es.isDrawing=true;this.es.drawStart=p;this.es.lastPt=p;this.es.snapDraw=this.es.drawData?this.cloneID(this.es.drawData):null;
  }
  drawMove(p){
    if(!this.es.isDrawing)return;const dc=this.shadowRoot.getElementById('drawCanvas'),ctx=dc.getContext('2d');
    this.setStroke(ctx);
    if(this.es.tool==='pen'){ctx.beginPath();ctx.moveTo(this.es.lastPt.x,this.es.lastPt.y);ctx.lineTo(p.x,p.y);ctx.stroke();this.es.lastPt=p;}
    else{ctx.clearRect(0,0,dc.width,dc.height);if(this.es.snapDraw)ctx.putImageData(this.es.snapDraw,0,0);this.setStroke(ctx);ctx.beginPath();const sx=this.es.drawStart.x,sy=this.es.drawStart.y;
      if(this.es.tool==='rect')ctx.strokeRect(sx,sy,p.x-sx,p.y-sy);
      else if(this.es.tool==='ellipse'){ctx.ellipse((sx+p.x)/2,(sy+p.y)/2,Math.abs(p.x-sx)/2,Math.abs(p.y-sy)/2,0,0,Math.PI*2);ctx.stroke();}
      else if(this.es.tool==='line'){ctx.moveTo(sx,sy);ctx.lineTo(p.x,p.y);ctx.stroke();}
    }ctx.globalAlpha=1;
  }
  drawEnd(p){if(!this.es.isDrawing)return;this.es.isDrawing=false;this.shadowRoot.getElementById('drawCanvas').getContext('2d').globalAlpha=1;this.saveDraw();this.pushHist();}
  placeText(p){const dc=this.shadowRoot.getElementById('drawCanvas'),ctx=dc.getContext('2d');ctx.globalAlpha=this.es.drawOpacity;ctx.fillStyle=this.es.textColor;ctx.font=`${this.es.textWeight} ${this.es.textSize}px ${this.settings.fontFamily}`;ctx.fillText(this.es.textStr,p.x,p.y);ctx.globalAlpha=1;this.saveDraw();this.pushHist();}
  pickColor(p){const mc=this.shadowRoot.getElementById('mainCanvas');const px=mc.getContext('2d').getImageData(Math.round(p.x),Math.round(p.y),1,1).data;const hex='#'+[px[0],px[1],px[2]].map(v=>v.toString(16).padStart(2,'0')).join('');const dc=this.shadowRoot.getElementById('drawColor');if(dc)dc.value=hex;this.es.drawColor=hex;this.toast(`Picked: ${hex}`);}

  bindKeyboard(){
    this._kbdFn=e=>{
      if(!this.isConnected)return;
      if(e.ctrlKey&&e.key==='z'&&!e.shiftKey){e.preventDefault();this.undo();}
      if(e.ctrlKey&&(e.key==='y'||(e.shiftKey&&e.key==='Z'))){e.preventDefault();this.redo();}
      const tag=document.activeElement?.tagName;
      if(!e.ctrlKey&&!e.altKey&&tag!=='INPUT'&&tag!=='TEXTAREA'){const MAP={v:'hand',p:'pen',r:'rect',e:'ellipse',l:'line',t:'text',i:'eyedrop'};if(MAP[e.key]){const btn=this.shadowRoot.querySelector(`[data-tool="${MAP[e.key]}"]`);if(btn)btn.click();}}
    };
    this._pasteFn=e=>{if(!this.isConnected)return;for(const item of(e.clipboardData?.items||[])){if(item.type.startsWith('image/')){const r=new FileReader();r.onload=ev=>this.loadImage(ev.target.result);r.readAsDataURL(item.getAsFile());break;}}};
    document.addEventListener('keydown',this._kbdFn);
    document.addEventListener('paste',this._pasteFn);
  }

  toast(msg){const el=this.shadowRoot.getElementById('toast');el.textContent=msg;el.classList.add('show');clearTimeout(this._toastT);this._toastT=setTimeout(()=>el.classList.remove('show'),2500);}
}

customElements.define('advanced-image-editor', AdvancedImageEditor);
