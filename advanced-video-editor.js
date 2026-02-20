/**
 * Advanced Video Editor - Wix Custom Element
 * Filename: wix-advanced-video-editor.js
 * Custom Element Tag: <advanced-video-editor>
 * Widget Element ID: #videoEditor
 *
 * Series design system — identical to every other widget:
 *   - this.settings with same 13 props
 *   - getStyles() inlines CSS variables, updateStyles() replaces <style id="dynamic-styles">
 *   - Light theme: --primary-bg / --secondary-bg as backgrounds
 *   - Full CSS var names: --main-accent, --heading-color, --border-color etc.
 *   - Same observedAttributes list and attributeChangedCallback pattern
 *
 * Features:
 *   - Video load: drag-drop, file picker, URL import
 *   - Playback controls: play/pause, frame step ±1, loop, mute, fullscreen
 *   - Scrubber timeline with live preview thumbnail
 *   - Trim: in/out point markers on the timeline
 *   - Video adjustments: brightness, contrast, saturation, hue, blur (CSS filter on <video>)
 *   - Speed control: 0.25× – 4×
 *   - Volume slider
 *   - Rotate 90° CW/CCW, Flip H/V (CSS transform on video)
 *   - Text overlay: content, size, color, position
 *   - 8 filter presets: Normal, Vivid, Warm, Cool, Noir, Fade, Vintage, Cinema
 *   - Info panel: resolution, duration, codec (via <video> API)
 *   - Export note panel (browser limitations acknowledged)
 */
class AdvancedVideoEditor extends HTMLElement {

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // ── Same 13 props as every widget in the series ──
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

    // Editor state
    this.vs = {
      loaded:     false,
      playing:    false,
      muted:      false,
      loop:       false,
      speed:      1,
      volume:     1,
      trimIn:     0,
      trimOut:    null,   // null = end of video
      rotation:   0,      // 0 / 90 / 180 / 270
      flipH:      false,
      flipV:      false,
      // Adjustments
      adj: {
        brightness: 100,   // CSS filter % (100 = normal)
        contrast:   100,
        saturation: 100,
        hue:        0,     // deg
        blur:       0      // px
      },
      // Text overlay
      text: {
        enabled:  false,
        content:  'Your Text',
        size:     36,
        color:    '#ffffff',
        x:        50,    // % from left
        y:        80     // % from top
      },
      scrubbing:    false,
      overlayDragging: false
    };

    // Filter presets (CSS filter values)
    this.PRESETS = {
      normal:   { brightness:100, contrast:100, saturation:100, hue:0,   blur:0 },
      vivid:    { brightness:110, contrast:120, saturation:150, hue:0,   blur:0 },
      warm:     { brightness:105, contrast:105, saturation:115, hue:15,  blur:0 },
      cool:     { brightness:100, contrast:110, saturation:90,  hue:-20, blur:0 },
      noir:     { brightness:95,  contrast:140, saturation:0,   hue:0,   blur:0 },
      fade:     { brightness:115, contrast:80,  saturation:70,  hue:0,   blur:0 },
      vintage:  { brightness:108, contrast:90,  saturation:75,  hue:20,  blur:0 },
      cinema:   { brightness:88,  contrast:130, saturation:90,  hue:-5,  blur:0 }
    };
  }

  /* ── Series: same 13 observed attributes ── */
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
        'font-size':'fontSize','heading-size':'headingSize','border-radius':'borderRadius',
        'button-padding':'buttonPadding'
      };
      const key = map[name];
      if (key) { this.settings[key] = newValue; this.updateStyles(); }
    }
  }

  connectedCallback()    { this.render(); this.initEvents(); }
  disconnectedCallback() { this._clearTick(); }

  /* ══════════════════════════════════════════════════
     STYLES — series-compatible getStyles() + updateStyles()
  ══════════════════════════════════════════════════ */
  getStyles() {
    const s = this.settings;
    return `
      :host {
        --primary-bg:     ${s.primaryBg};
        --secondary-bg:   ${s.secondaryBg};
        --border-color:   ${s.borderColor};
        --secondary-text: ${s.secondaryText};
        --main-accent:    ${s.mainAccent};
        --hover-accent:   ${s.hoverAccent};
        --heading-color:  ${s.headingColor};
        --paragraph-color:${s.paragraphColor};
        --font-family:    ${s.fontFamily};
        --font-size:      ${s.fontSize}px;
        --heading-size:   ${s.headingSize}px;
        --border-radius:  ${s.borderRadius}px;
        --button-padding: ${s.buttonPadding}px;
        display: block; width: 100%;
        font-family: var(--font-family);
        color: var(--paragraph-color);
      }
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      /* ── Outer container ── */
      .container {
        display: flex; flex-direction: column; width: 100%; min-height: 600px;
        background: var(--primary-bg); border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        box-shadow: 0 4px 12px rgba(0,0,0,0.08); overflow: hidden;
      }

      /* ── Toolbar ── */
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
      .tb-sep    { width: 1px; height: 22px; background: var(--border-color); margin: 0 2px; }
      .tb-spacer { flex: 1; }
      .tb-btn {
        display: inline-flex; align-items: center; gap: 5px;
        padding: var(--button-padding) 12px;
        border: 1px solid var(--border-color); border-radius: var(--border-radius);
        background: var(--primary-bg); color: var(--paragraph-color);
        font-family: var(--font-family); font-size: var(--font-size); font-weight: 500;
        cursor: pointer; transition: all 0.2s; white-space: nowrap;
      }
      .tb-btn:hover  { background: var(--secondary-bg); border-color: var(--secondary-text); }
      .tb-btn.active { background: var(--main-accent); border-color: var(--main-accent); color: var(--primary-bg); }
      .tb-btn.primary { background: var(--main-accent); border-color: var(--main-accent); color: var(--primary-bg); }
      .tb-btn.primary:hover { background: var(--hover-accent); border-color: var(--hover-accent); }
      .tb-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      .tb-btn:disabled:hover { background: var(--primary-bg); border-color: var(--border-color); color: var(--paragraph-color); }
      .tb-btn svg { width: 14px; height: 14px; flex-shrink: 0; }
      .vid-meta {
        font-size: calc(var(--font-size) - 1px); color: var(--secondary-text);
        padding: 4px 10px; background: var(--secondary-bg);
        border: 1px solid var(--border-color); border-radius: var(--border-radius);
      }

      /* ── Body ── */
      .editor-body { display: flex; flex: 1; overflow: hidden; min-height: 0; }

      /* ── Video area (left) ── */
      .video-area {
        flex: 1; background: var(--secondary-bg);
        display: flex; flex-direction: column; overflow: hidden; position: relative;
      }

      /* Drop zone */
      .drop-zone {
        position: absolute; inset: 20px;
        border: 2px dashed var(--border-color); border-radius: var(--border-radius);
        display: flex; flex-direction: column; align-items: center;
        justify-content: center; gap: 14px; cursor: pointer; transition: all 0.2s;
        z-index: 5;
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

      /* Video viewport */
      .video-viewport {
        flex: 1; display: none; position: relative;
        background: #000; align-items: center; justify-content: center; overflow: hidden;
      }
      .video-viewport.loaded { display: flex; }
      video {
        max-width: 100%; max-height: 100%;
        display: block; outline: none;
        transform-origin: center center;
      }

      /* Text overlay */
      .text-overlay {
        position: absolute; display: none;
        font-weight: 700; text-shadow: 0 1px 4px rgba(0,0,0,0.7);
        cursor: move; user-select: none; white-space: pre;
        pointer-events: auto; z-index: 10;
      }
      .text-overlay.visible { display: block; }

      /* ── Timeline / controls bar ── */
      .controls-bar {
        background: var(--primary-bg); border-top: 1px solid var(--border-color);
        padding: 8px 12px; display: none; flex-direction: column; gap: 6px; flex-shrink: 0;
      }
      .controls-bar.loaded { display: flex; }

      /* Scrubber + trim */
      .timeline-wrap { position: relative; height: 28px; cursor: pointer; }
      .timeline-bg {
        position: absolute; inset: 8px 0; border-radius: 4px;
        background: var(--secondary-bg); border: 1px solid var(--border-color);
      }
      .timeline-played {
        position: absolute; top: 8px; bottom: 8px; left: 0; border-radius: 4px 0 0 4px;
        background: var(--main-accent); opacity: 0.35; pointer-events: none;
      }
      .timeline-trim-in, .timeline-trim-out {
        position: absolute; top: 0; bottom: 0; width: 4px;
        background: #e74c3c; cursor: ew-resize; z-index: 4;
        border-radius: 2px;
      }
      .timeline-thumb {
        position: absolute; top: 0; bottom: 0; width: 10px; margin-left: -5px;
        background: var(--main-accent); border-radius: 3px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.2); z-index: 5;
        cursor: ew-resize;
      }
      .time-label {
        position: absolute; bottom: calc(100% + 4px); left: 50%; transform: translateX(-50%);
        background: var(--heading-color); color: var(--primary-bg);
        font-family: var(--font-family); font-size: calc(var(--font-size) - 3px); font-weight: 600;
        padding: 2px 6px; border-radius: 3px; white-space: nowrap; pointer-events: none;
        opacity: 0; transition: opacity 0.1s;
      }
      .timeline-wrap:hover .time-label, .timeline-wrap.scrubbing .time-label { opacity: 1; }

      /* Playback row */
      .playback-row { display: flex; align-items: center; gap: 6px; }
      .pb-btn {
        width: 30px; height: 30px; border-radius: var(--border-radius);
        border: 1px solid var(--border-color); background: var(--primary-bg);
        color: var(--paragraph-color); cursor: pointer; display: flex;
        align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0;
      }
      .pb-btn:hover  { background: var(--secondary-bg); border-color: var(--secondary-text); }
      .pb-btn.active { background: var(--main-accent); border-color: var(--main-accent); color: var(--primary-bg); }
      .pb-btn svg { width: 13px; height: 13px; }
      .pb-play {
        width: 36px; height: 36px; border-radius: 50%;
        background: var(--main-accent); border: none;
        color: var(--primary-bg); cursor: pointer; display: flex;
        align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0;
      }
      .pb-play:hover { background: var(--hover-accent); transform: scale(1.06); }
      .pb-play svg { width: 14px; height: 14px; }
      .time-display {
        font-family: var(--font-family); font-size: calc(var(--font-size) - 1px);
        color: var(--secondary-text); white-space: nowrap; padding: 0 4px;
      }
      .time-display span { color: var(--paragraph-color); font-weight: 600; }
      .vol-wrap { display: flex; align-items: center; gap: 5px; margin-left: auto; }
      .vol-icon { color: var(--secondary-text); flex-shrink: 0; }
      .vol-icon svg { width: 13px; height: 13px; }
      input.vol-slider {
        width: 70px; height: 4px; -webkit-appearance: none;
        background: var(--border-color); border-radius: 4px; outline: none; cursor: pointer;
      }
      input.vol-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%; background: var(--main-accent); cursor: pointer; }
      input.vol-slider::-moz-range-thumb { width: 12px; height: 12px; border-radius: 50%; background: var(--main-accent); border: none; cursor: pointer; }

      /* ── Right panel ── */
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
      .p-tab:hover  { color: var(--paragraph-color); }
      .p-tab.active { color: var(--main-accent); border-bottom-color: var(--main-accent); }
      .panel-scroll {
        flex: 1; overflow-y: auto; padding: 14px 12px;
        scrollbar-width: thin; scrollbar-color: var(--border-color) transparent;
      }
      .panel-scroll::-webkit-scrollbar { width: 4px; }
      .panel-scroll::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 2px; }
      .tab-content { display: none; } .tab-content.active { display: block; }

      /* Sections */
      .p-section { margin-bottom: 18px; }
      .p-section-title {
        font-family: var(--font-family); font-size: calc(var(--font-size) - 2px); font-weight: 700;
        letter-spacing: .1em; text-transform: uppercase; color: var(--secondary-text);
        margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid var(--border-color);
      }
      .p-sep { height: 1px; background: var(--border-color); margin: 14px 0; }

      /* Sliders */
      .sl-row { margin-bottom: 9px; }
      .sl-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
      .sl-label { font-family: var(--font-family); font-size: var(--font-size); color: var(--paragraph-color); font-weight: 500; }
      .sl-val { font-family: var(--font-family); font-size: calc(var(--font-size) - 1px); color: var(--main-accent); font-weight: 600; min-width: 38px; text-align: right; }
      input[type=range] {
        -webkit-appearance: none; width: 100%; height: 5px;
        background: var(--border-color); border-radius: 5px; outline: none; cursor: pointer;
      }
      input[type=range]::-webkit-slider-thumb {
        -webkit-appearance: none; width: 16px; height: 16px;
        border-radius: 50%; background: var(--main-accent); cursor: pointer; transition: background 0.2s;
      }
      input[type=range]::-webkit-slider-thumb:hover { background: var(--hover-accent); }
      input[type=range]::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: var(--main-accent); border: none; cursor: pointer; }

      /* Filter preset grid */
      .preset-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
      .preset-btn {
        padding: 8px 6px; border: 1px solid var(--border-color); border-radius: var(--border-radius);
        background: var(--secondary-bg); cursor: pointer; text-align: center;
        font-family: var(--font-family); font-size: calc(var(--font-size) - 2px); font-weight: 600;
        color: var(--secondary-text); transition: all 0.2s;
      }
      .preset-icon { font-size: 14px; display: block; margin-bottom: 3px; }
      .preset-btn:hover { border-color: var(--main-accent); color: var(--paragraph-color); background: var(--primary-bg); }
      .preset-btn.active { border-color: var(--main-accent); background: var(--main-accent); color: var(--primary-bg); }

      /* Transform grid */
      .tf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px; }
      .tf-btn {
        padding: var(--button-padding) 6px; border: 1px solid var(--border-color); border-radius: var(--border-radius);
        background: var(--secondary-bg); color: var(--paragraph-color); cursor: pointer;
        font-family: var(--font-family); font-size: calc(var(--font-size) - 1px); font-weight: 600;
        display: flex; align-items: center; justify-content: center; gap: 5px; transition: all 0.2s;
      }
      .tf-btn:hover { background: var(--primary-bg); border-color: var(--secondary-text); }
      .tf-btn.toggled { background: var(--main-accent); border-color: var(--main-accent); color: var(--primary-bg); }
      .tf-btn.full { grid-column: 1/-1; }
      .tf-btn svg { width: 13px; height: 13px; }

      /* Inputs */
      input[type=color] { width: 36px; height: 28px; padding: 2px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--secondary-bg); cursor: pointer; }
      input[type=number], input[type=text], textarea {
        background: var(--secondary-bg); border: 1px solid var(--border-color); border-radius: var(--border-radius);
        color: var(--paragraph-color); font-family: var(--font-family); font-size: var(--font-size);
        padding: 5px 8px; outline: none; width: 100%; transition: border-color 0.2s;
      }
      input[type=number]:focus, input[type=text]:focus, textarea:focus { border-color: var(--main-accent); }
      textarea { resize: vertical; min-height: 52px; }
      select {
        width: 100%; background: var(--secondary-bg); border: 1px solid var(--border-color);
        border-radius: var(--border-radius); color: var(--paragraph-color);
        font-family: var(--font-family); font-size: var(--font-size); padding: 5px 8px; outline: none; cursor: pointer;
      }
      .fg { margin-bottom: 9px; }
      .fg label { display: block; font-family: var(--font-family); font-size: calc(var(--font-size) - 1px); font-weight: 600; color: var(--secondary-text); margin-bottom: 4px; }
      .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
      .d-row { display: flex; align-items: center; gap: 8px; margin-bottom: 9px; }
      .d-lbl { font-family: var(--font-family); font-size: var(--font-size); color: var(--paragraph-color); font-weight: 500; flex: 1; }

      /* Speed buttons */
      .speed-row { display: flex; gap: 4px; flex-wrap: wrap; }
      .speed-btn {
        padding: 5px 8px; border: 1px solid var(--border-color); border-radius: var(--border-radius);
        background: var(--secondary-bg); color: var(--secondary-text);
        font-family: var(--font-family); font-size: calc(var(--font-size) - 2px); font-weight: 700;
        cursor: pointer; transition: all 0.2s;
      }
      .speed-btn:hover { border-color: var(--secondary-text); color: var(--paragraph-color); }
      .speed-btn.active { border-color: var(--main-accent); background: var(--main-accent); color: var(--primary-bg); }

      /* Trim row */
      .trim-row { display: flex; gap: 6px; align-items: center; margin-bottom: 9px; }
      .trim-time {
        flex: 1; font-family: var(--font-family); font-size: calc(var(--font-size) - 1px);
        color: var(--paragraph-color); background: var(--secondary-bg);
        border: 1px solid var(--border-color); border-radius: var(--border-radius);
        padding: 5px 8px; text-align: center; font-weight: 600;
      }
      .trim-lbl { font-family: var(--font-family); font-size: calc(var(--font-size) - 2px); color: var(--secondary-text); font-weight: 600; }

      /* Info card */
      .info-card {
        background: var(--secondary-bg); border: 1px solid var(--border-color);
        border-radius: var(--border-radius); padding: 10px 12px;
        font-family: var(--font-family); font-size: calc(var(--font-size) - 1px);
        line-height: 1.9; color: var(--paragraph-color);
      }
      .info-card strong { color: var(--heading-color); }
      .info-row { display: flex; justify-content: space-between; }
      .info-key { color: var(--secondary-text); font-weight: 500; }
      .info-val { font-weight: 600; color: var(--paragraph-color); }

      /* Hint */
      .hint { font-family: var(--font-family); font-size: calc(var(--font-size) - 2px); color: var(--secondary-text); line-height: 1.6; margin-top: 6px; }

      /* Export button */
      .export-btn {
        width: 100%; padding: var(--button-padding); background: var(--main-accent); color: var(--primary-bg);
        border: none; border-radius: var(--border-radius); font-family: var(--font-family);
        font-size: var(--font-size); font-weight: 600;
        display: flex; align-items: center; justify-content: center; gap: 8px;
        cursor: pointer; transition: all 0.2s; margin-top: 12px;
      }
      .export-btn:hover { background: var(--hover-accent); }
      .export-btn svg { width: 15px; height: 15px; }

      /* Toast */
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

  /* Same as series: replace <style id="dynamic-styles"> in-place */
  updateStyles() {
    const el = this.shadowRoot.getElementById('dynamic-styles');
    if (el) el.textContent = this.getStyles();
  }

  /* ══════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════ */
  render() {
    this.shadowRoot.innerHTML = `
<style id="dynamic-styles">${this.getStyles()}</style>
<input type="file" id="fi" accept="video/*" style="display:none">
<div class="toast" id="toast"></div>

<div class="container">

  <!-- ── Toolbar ── -->
  <div class="toolbar">
    <span class="toolbar-title">Video Editor</span>
    <div class="tb-sep"></div>
    <button class="tb-btn" id="openBtn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>Open
    </button>
    <button class="tb-btn" id="urlBtn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>URL
    </button>
    <div class="tb-sep"></div>
    <button class="tb-btn" id="resetBtn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>Reset
    </button>
    <button class="tb-btn" id="loopBtn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>Loop
    </button>
    <div class="tb-spacer"></div>
    <span class="vid-meta" id="vidMeta" style="display:none"></span>
    <div class="tb-sep"></div>
    <button class="tb-btn" id="fsBtn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>Fullscreen
    </button>
    <button class="tb-btn primary" id="exportBtn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Export
    </button>
  </div>

  <!-- ── Body ── -->
  <div class="editor-body">

    <!-- Video area -->
    <div class="video-area" id="videoArea">

      <!-- Drop zone (shown when no video) -->
      <div class="drop-zone" id="dz">
        <div class="dz-icon">
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
            <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
        </div>
        <div class="dz-title">Drop video here</div>
        <div class="dz-sub">MP4 · WebM · OGV · MOV<br>or paste a video URL</div>
        <button class="dz-btn" id="dzBtn">Browse File</button>
      </div>

      <!-- Video viewport (shown when loaded) -->
      <div class="video-viewport" id="viewport">
        <video id="vid" playsinline></video>
        <div class="text-overlay" id="textOverlay"></div>
      </div>

    </div>

    <!-- ── Right panel ── -->
    <div class="right-panel">
      <div class="panel-tabs">
        <div class="p-tab active" data-pt="adjust">Adjust</div>
        <div class="p-tab" data-pt="filters">Filters</div>
        <div class="p-tab" data-pt="tools">Tools</div>
        <div class="p-tab" data-pt="info">Info</div>
      </div>
      <div class="panel-scroll">

        <!-- ADJUST tab -->
        <div class="tab-content active" data-pc="adjust">
          <div class="p-section">
            <div class="p-section-title">Color</div>
            ${this.mkSlider('brightness','Brightness',0,200,1,100,'%')}
            ${this.mkSlider('contrast',  'Contrast',  0,200,1,100,'%')}
            ${this.mkSlider('saturation','Saturation',0,200,1,100,'%')}
            ${this.mkSlider('hue',       'Hue Rotate',0,360,1,0,'°')}
          </div>
          <div class="p-sep"></div>
          <div class="p-section">
            <div class="p-section-title">Detail</div>
            ${this.mkSlider('blur','Blur',0,20,0.5,0,'px')}
          </div>
          <div class="p-sep"></div>
          <div class="p-section">
            <div class="p-section-title">Playback</div>
            <div class="fg">
              <label>Speed</label>
              <div class="speed-row">
                ${['0.25','0.5','0.75','1','1.25','1.5','2','4'].map(v=>`<button class="speed-btn${v==='1'?' active':''}" data-speed="${v}">${v}×</button>`).join('')}
              </div>
            </div>
            <div class="sl-row">
              <div class="sl-header"><span class="sl-label">Volume</span><span class="sl-val" id="val_volume">100%</span></div>
              <input type="range" id="volumeSlider" min="0" max="100" step="1" value="100">
            </div>
          </div>
          <div class="p-sep"></div>
          <div class="p-section">
            <div class="p-section-title">Trim</div>
            <div class="trim-row">
              <span class="trim-lbl">IN</span>
              <span class="trim-time" id="trimInDisplay">0:00</span>
              <button class="tf-btn" id="setInBtn">Set In</button>
            </div>
            <div class="trim-row">
              <span class="trim-lbl">OUT</span>
              <span class="trim-time" id="trimOutDisplay">—</span>
              <button class="tf-btn" id="setOutBtn">Set Out</button>
            </div>
            <button class="tf-btn full" id="clearTrimBtn" style="margin-top:4px;">Clear Trim</button>
            <p class="hint">Use Set In / Set Out at the current playhead position.</p>
          </div>
        </div>

        <!-- FILTERS tab -->
        <div class="tab-content" data-pc="filters">
          <div class="p-section">
            <div class="p-section-title">Filter Presets</div>
            <div class="preset-grid">
              <div class="preset-btn active" data-preset="normal"><span class="preset-icon">◻</span>Normal</div>
              <div class="preset-btn" data-preset="vivid"><span class="preset-icon">✦</span>Vivid</div>
              <div class="preset-btn" data-preset="warm"><span class="preset-icon">☀</span>Warm</div>
              <div class="preset-btn" data-preset="cool"><span class="preset-icon">❄</span>Cool</div>
              <div class="preset-btn" data-preset="noir"><span class="preset-icon">◼</span>Noir</div>
              <div class="preset-btn" data-preset="fade"><span class="preset-icon">◫</span>Fade</div>
              <div class="preset-btn" data-preset="vintage"><span class="preset-icon">◎</span>Vintage</div>
              <div class="preset-btn" data-preset="cinema"><span class="preset-icon">▶</span>Cinema</div>
            </div>
          </div>
          <div class="p-sep"></div>
          <p class="hint">Presets apply a curated color look to the video. Fine-tune further in the Adjust tab.</p>
        </div>

        <!-- TOOLS tab -->
        <div class="tab-content" data-pc="tools">
          <div class="p-section">
            <div class="p-section-title">Transform</div>
            <div class="tf-grid">
              <button class="tf-btn" id="rotCCW">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>CCW
              </button>
              <button class="tf-btn" id="rotCW">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>CW
              </button>
              <button class="tf-btn" id="flipHBtn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18"/><path d="M17 8l5 4-5 4"/><path d="M7 8l-5 4 5 4"/></svg>Flip H
              </button>
              <button class="tf-btn" id="flipVBtn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18"/><path d="M8 17l4 5 4-5"/><path d="M8 7l4-5 4 5"/></svg>Flip V
              </button>
            </div>
          </div>
          <div class="p-sep"></div>
          <div class="p-section">
            <div class="p-section-title">Text Overlay</div>
            <div class="fg">
              <label>Content</label>
              <textarea id="textContent" rows="2" placeholder="Enter overlay text…">Your Text</textarea>
            </div>
            <div class="two-col">
              <div class="fg"><label>Font Size</label><input type="number" id="textSize" value="36" min="10" max="200"></div>
              <div class="fg"><label>Color</label><input type="color" id="textColor" value="#ffffff" style="height:30px;width:100%;margin-top:2px;"></div>
            </div>
            <div class="fg">
              <label>Position</label>
              <select id="textPos">
                <option value="top-left">Top Left</option>
                <option value="top-center">Top Center</option>
                <option value="top-right">Top Right</option>
                <option value="middle-center">Middle Center</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="bottom-center" selected>Bottom Center</option>
                <option value="bottom-right">Bottom Right</option>
              </select>
            </div>
            <div class="d-row">
              <span class="d-lbl">Show Overlay</span>
              <button class="tf-btn" id="textToggleBtn">Enable</button>
            </div>
          </div>
        </div>

        <!-- INFO tab -->
        <div class="tab-content" data-pc="info">
          <div class="p-section">
            <div class="p-section-title">Video Info</div>
            <div class="info-card" id="infoCard">
              <div class="info-row"><span class="info-key">Status</span><span class="info-val">No video loaded</span></div>
            </div>
          </div>
          <div class="p-sep"></div>
          <div class="p-section">
            <div class="p-section-title">Export</div>
            <p class="hint" style="margin-bottom:10px;">Browsers do not support direct video re-encoding. Use the controls below to copy the current video source, or use a server-side tool for full export.</p>
            <button class="export-btn" id="exportSrcBtn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download Original
            </button>
            <button class="export-btn" style="margin-top:6px;background:var(--secondary-bg);color:var(--paragraph-color);border:1px solid var(--border-color);" id="copyUrlBtn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copy Video URL
            </button>
          </div>
        </div>

      </div><!-- /panel-scroll -->
    </div><!-- /right-panel -->

  </div><!-- /editor-body -->

  <!-- ── Timeline + controls bar (below video, above panel) ── -->
  <div class="controls-bar" id="controlsBar">
    <!-- Scrubber -->
    <div class="timeline-wrap" id="timelineWrap">
      <div class="timeline-bg"></div>
      <div class="timeline-played" id="tlPlayed"></div>
      <div class="timeline-trim-in"  id="tlTrimIn"  style="left:0%"></div>
      <div class="timeline-trim-out" id="tlTrimOut" style="left:100%;display:none"></div>
      <div class="timeline-thumb"    id="tlThumb"   style="left:0%"></div>
      <div class="time-label"        id="tlLabel">0:00</div>
    </div>
    <!-- Playback row -->
    <div class="playback-row">
      <button class="pb-btn" id="stepBackBtn" title="Step -1 frame">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
      </button>
      <button class="pb-play" id="playBtn">
        <svg id="playIcon" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      </button>
      <button class="pb-btn" id="stepFwdBtn" title="Step +1 frame">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
      </button>
      <span class="time-display"><span id="curTime">0:00</span> / <span id="durTime">0:00</span></span>

      <div class="vol-wrap">
        <div class="vol-icon" id="volIcon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
        </div>
        <input type="range" class="vol-slider" id="volSlider" min="0" max="100" step="1" value="100">
      </div>
    </div>
  </div>

</div><!-- /container -->
`;
  }

  mkSlider(key, label, min, max, step, def, unit) {
    return `
      <div class="sl-row">
        <div class="sl-header">
          <span class="sl-label">${label}</span>
          <span class="sl-val" id="val_${key}">${def}${unit}</span>
        </div>
        <input type="range" data-adj="${key}" min="${min}" max="${max}" step="${step}" value="${def}">
      </div>`;
  }

  /* ══════════════════════════════════════════════════
     EVENTS
  ══════════════════════════════════════════════════ */
  initEvents() {
    const sr  = this.shadowRoot;
    const fi  = sr.getElementById('fi');
    const vid = sr.getElementById('vid');

    // ── File open ──
    const openFile = () => fi.click();
    sr.getElementById('openBtn').addEventListener('click', openFile);
    sr.getElementById('dzBtn').addEventListener('click', openFile);
    fi.addEventListener('change', e => {
      const f = e.target.files[0];
      if (!f) return;
      this.loadVideo(URL.createObjectURL(f), f.name);
      fi.value = '';
    });

    // ── URL import ──
    sr.getElementById('urlBtn').addEventListener('click', () => {
      const url = prompt('Enter video URL:');
      if (url && url.trim()) this.loadVideo(url.trim(), url.trim());
    });

    // ── Drag & drop ──
    const va = sr.getElementById('videoArea'), dz = sr.getElementById('dz');
    va.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('over'); });
    va.addEventListener('dragleave', ()=> dz.classList.remove('over'));
    va.addEventListener('drop', e => {
      e.preventDefault(); dz.classList.remove('over');
      const f = e.dataTransfer.files[0];
      if (!f || !f.type.startsWith('video/')) { this.toast('Please drop a video file'); return; }
      this.loadVideo(URL.createObjectURL(f), f.name);
    });

    // ── Video events ──
    vid.addEventListener('timeupdate', () => this.syncScrubber());
    vid.addEventListener('loadedmetadata', () => this.onLoaded());
    vid.addEventListener('ended', () => {
      this.vs.playing = false;
      this.updatePlayIcon();
      if (this.vs.loop && this.vs.trimIn !== null) {
        vid.currentTime = this.vs.trimIn;
        vid.play().then(()=>{ this.vs.playing = true; this.updatePlayIcon(); });
      }
    });

    // ── Play/Pause ──
    sr.getElementById('playBtn').addEventListener('click', () => this.togglePlay());

    // ── Frame step ──
    sr.getElementById('stepBackBtn').addEventListener('click', () => {
      if (!this.vs.loaded) return;
      vid.currentTime = Math.max(0, vid.currentTime - 1/30);
    });
    sr.getElementById('stepFwdBtn').addEventListener('click', () => {
      if (!this.vs.loaded) return;
      vid.currentTime = Math.min(vid.duration || 0, vid.currentTime + 1/30);
    });

    // ── Loop toggle ──
    sr.getElementById('loopBtn').addEventListener('click', () => {
      this.vs.loop = !this.vs.loop;
      vid.loop = this.vs.loop;
      sr.getElementById('loopBtn').classList.toggle('active', this.vs.loop);
    });

    // ── Fullscreen ──
    sr.getElementById('fsBtn').addEventListener('click', () => {
      const vp = sr.getElementById('viewport');
      if (document.fullscreenElement) document.exitFullscreen();
      else vp.requestFullscreen?.();
    });

    // ── Reset ──
    sr.getElementById('resetBtn').addEventListener('click', () => this.resetAll());

    // ── Export top ──
    sr.getElementById('exportBtn').addEventListener('click', () => {
      sr.querySelectorAll('.p-tab').forEach(t => t.classList.remove('active'));
      sr.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      sr.querySelector('.p-tab[data-pt="info"]').classList.add('active');
      sr.querySelector('.tab-content[data-pc="info"]').classList.add('active');
    });

    // ── Scrubber ──
    this.initScrubber();

    // ── Volume ──
    const volSl = sr.getElementById('volSlider');
    volSl.addEventListener('input', () => {
      const v = parseInt(volSl.value) / 100;
      vid.volume = v; this.vs.volume = v;
      sr.getElementById('val_volume').textContent = volSl.value + '%';
      // update main vol slider too
      const ms = sr.getElementById('volumeSlider');
      if (ms) ms.value = volSl.value;
      sr.getElementById('val_volume') && (sr.getElementById('val_volume').textContent = volSl.value + '%');
    });

    // ── Panel volume slider (in Adjust tab) ──
    const panelVol = sr.getElementById('volumeSlider');
    panelVol.addEventListener('input', () => {
      const v = parseInt(panelVol.value) / 100;
      vid.volume = v; this.vs.volume = v;
      const vl = sr.getElementById('val_volume');
      if (vl) vl.textContent = panelVol.value + '%';
      volSl.value = panelVol.value;
    });

    // ── Adjustment sliders ──
    const ADJ_UNITS = { brightness:'%', contrast:'%', saturation:'%', hue:'°', blur:'px' };
    sr.querySelectorAll('[data-adj]').forEach(sl => {
      sl.addEventListener('input', () => {
        const k = sl.dataset.adj, v = parseFloat(sl.value);
        this.vs.adj[k] = v;
        const vl = sr.getElementById(`val_${k}`);
        if (vl) vl.textContent = v + (ADJ_UNITS[k] || '');
        this.applyFilter();
        // sync the other slider if both exist (brightness appears only once, but keep generic)
      });
    });

    // ── Speed buttons ──
    sr.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sp = parseFloat(btn.dataset.speed);
        vid.playbackRate = sp; this.vs.speed = sp;
        sr.querySelectorAll('.speed-btn').forEach(b => b.classList.toggle('active', b.dataset.speed === btn.dataset.speed));
      });
    });

    // ── Trim ──
    sr.getElementById('setInBtn').addEventListener('click', () => {
      if (!this.vs.loaded) return;
      this.vs.trimIn = vid.currentTime;
      sr.getElementById('trimInDisplay').textContent = this.fmtTime(this.vs.trimIn);
      this.updateTrimMarkers();
      this.toast(`Trim In: ${this.fmtTime(this.vs.trimIn)}`);
    });
    sr.getElementById('setOutBtn').addEventListener('click', () => {
      if (!this.vs.loaded) return;
      this.vs.trimOut = vid.currentTime;
      sr.getElementById('trimOutDisplay').textContent = this.fmtTime(this.vs.trimOut);
      sr.getElementById('tlTrimOut').style.display = 'block';
      this.updateTrimMarkers();
      this.toast(`Trim Out: ${this.fmtTime(this.vs.trimOut)}`);
    });
    sr.getElementById('clearTrimBtn').addEventListener('click', () => {
      this.vs.trimIn = 0; this.vs.trimOut = null;
      sr.getElementById('trimInDisplay').textContent = '0:00';
      sr.getElementById('trimOutDisplay').textContent = '—';
      sr.getElementById('tlTrimOut').style.display = 'none';
      this.updateTrimMarkers();
      this.toast('Trim cleared');
    });

    // ── Panel tabs ──
    sr.querySelectorAll('.p-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        sr.querySelectorAll('.p-tab').forEach(t => t.classList.remove('active'));
        sr.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        sr.querySelector(`.tab-content[data-pc="${tab.dataset.pt}"]`)?.classList.add('active');
      });
    });

    // ── Filter presets ──
    sr.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pre = this.PRESETS[btn.dataset.preset]; if (!pre) return;
        Object.assign(this.vs.adj, pre);
        this.syncAdjSliders();
        sr.querySelectorAll('.preset-btn').forEach(b => b.classList.toggle('active', b.dataset.preset === btn.dataset.preset));
        this.applyFilter();
      });
    });

    // ── Transform ──
    sr.getElementById('rotCCW').addEventListener('click', () => { this.vs.rotation = (this.vs.rotation - 90 + 360) % 360; this.applyTransform(); });
    sr.getElementById('rotCW').addEventListener('click',  () => { this.vs.rotation = (this.vs.rotation + 90) % 360;       this.applyTransform(); });
    sr.getElementById('flipHBtn').addEventListener('click', () => { this.vs.flipH = !this.vs.flipH; this.applyTransform(); sr.getElementById('flipHBtn').classList.toggle('toggled', this.vs.flipH); });
    sr.getElementById('flipVBtn').addEventListener('click', () => { this.vs.flipV = !this.vs.flipV; this.applyTransform(); sr.getElementById('flipVBtn').classList.toggle('toggled', this.vs.flipV); });

    // ── Text overlay ──
    sr.getElementById('textContent').addEventListener('input', () => this.updateTextOverlay());
    sr.getElementById('textSize').addEventListener('input', () => this.updateTextOverlay());
    sr.getElementById('textColor').addEventListener('input', () => this.updateTextOverlay());
    sr.getElementById('textPos').addEventListener('change', () => this.updateTextOverlay());
    sr.getElementById('textToggleBtn').addEventListener('click', () => {
      this.vs.text.enabled = !this.vs.text.enabled;
      const btn = sr.getElementById('textToggleBtn');
      btn.textContent = this.vs.text.enabled ? 'Disable' : 'Enable';
      btn.classList.toggle('toggled', this.vs.text.enabled);
      this.updateTextOverlay();
    });

    // ── Text overlay drag ──
    this.initTextDrag();

    // ── Info / export buttons ──
    sr.getElementById('exportSrcBtn').addEventListener('click', () => {
      if (!this.vs.loaded) { this.toast('No video loaded'); return; }
      const a = document.createElement('a');
      a.href = vid.src; a.download = 'video'; a.click();
      this.toast('Download started');
    });
    sr.getElementById('copyUrlBtn').addEventListener('click', () => {
      if (!this.vs.loaded) { this.toast('No video loaded'); return; }
      navigator.clipboard?.writeText(vid.src).then(() => this.toast('URL copied!')).catch(() => this.toast('Could not copy URL'));
    });

    // ── Mute via vol icon click ──
    sr.getElementById('volIcon').addEventListener('click', () => {
      this.vs.muted = !this.vs.muted;
      vid.muted = this.vs.muted;
      volSl.value = this.vs.muted ? 0 : Math.round(this.vs.volume * 100);
    });

    // ── Keyboard shortcuts ──
    this._kbdFn = e => {
      if (!this.isConnected) return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space') { e.preventDefault(); this.togglePlay(); }
      if (e.code === 'ArrowLeft')  { if(this.vs.loaded) vid.currentTime = Math.max(0, vid.currentTime - 5); }
      if (e.code === 'ArrowRight') { if(this.vs.loaded) vid.currentTime = Math.min(vid.duration||0, vid.currentTime + 5); }
      if (e.code === 'KeyM')       { this.vs.muted = !this.vs.muted; vid.muted = this.vs.muted; }
    };
    document.addEventListener('keydown', this._kbdFn);
  }

  /* ── Scrubber init ── */
  initScrubber() {
    const sr  = this.shadowRoot;
    const tw  = sr.getElementById('timelineWrap');
    const vid = sr.getElementById('vid');

    const seek = (e) => {
      if (!this.vs.loaded) return;
      const r    = tw.getBoundingClientRect();
      const pct  = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      const time = pct * (vid.duration || 0);
      vid.currentTime = time;
      sr.getElementById('tlLabel').textContent = this.fmtTime(time);
    };

    tw.addEventListener('mousedown', e => { this.vs.scrubbing = true; tw.classList.add('scrubbing'); seek(e); });
    document.addEventListener('mousemove', e => { if (!this.vs.scrubbing) return; seek(e); });
    document.addEventListener('mouseup',   () => { this.vs.scrubbing = false; sr.getElementById('timelineWrap').classList.remove('scrubbing'); });

    tw.addEventListener('touchstart', e => { this.vs.scrubbing = true; seek(e.touches[0]); }, { passive: true });
    document.addEventListener('touchmove', e => { if (!this.vs.scrubbing) return; seek(e.touches[0]); }, { passive: true });
    document.addEventListener('touchend',  () => { this.vs.scrubbing = false; });
  }

  /* ── Text overlay drag ── */
  initTextDrag() {
    const sr  = this.shadowRoot;
    const ov  = sr.getElementById('textOverlay');
    const vp  = sr.getElementById('viewport');
    let dx = 0, dy = 0;

    ov.addEventListener('mousedown', e => {
      if (!this.vs.text.enabled) return;
      this.vs.overlayDragging = true;
      dx = e.clientX - ov.offsetLeft;
      dy = e.clientY - ov.offsetTop;
      e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
      if (!this.vs.overlayDragging) return;
      const r  = vp.getBoundingClientRect();
      const nx = e.clientX - dx, ny = e.clientY - dy;
      this.vs.text.x = Math.round(Math.max(0, Math.min(r.width,  nx)) / r.width  * 100);
      this.vs.text.y = Math.round(Math.max(0, Math.min(r.height, ny)) / r.height * 100);
      ov.style.left = this.vs.text.x + '%';
      ov.style.top  = this.vs.text.y + '%';
    });
    document.addEventListener('mouseup', () => { this.vs.overlayDragging = false; });
  }

  /* ══════════════════════════════════════════════════
     VIDEO LOAD
  ══════════════════════════════════════════════════ */
  loadVideo(src, name) {
    const sr  = this.shadowRoot;
    const vid = sr.getElementById('vid');
    vid.src = src;
    vid.load();
    this.vs.loaded = true;
    this.vs.trimIn  = 0;
    this.vs.trimOut = null;
    sr.getElementById('trimOutDisplay').textContent = '—';
    sr.getElementById('tlTrimOut').style.display    = 'none';
    sr.getElementById('vidMeta').style.display = 'block';
    sr.getElementById('vidMeta').textContent   = name.length > 24 ? name.slice(0,22)+'…' : name;
  }

  onLoaded() {
    const sr  = this.shadowRoot;
    const vid = sr.getElementById('vid');
    const dur = vid.duration || 0;

    sr.getElementById('dz').style.display = 'none';
    sr.getElementById('viewport').classList.add('loaded');
    sr.getElementById('controlsBar').classList.add('loaded');
    sr.getElementById('durTime').textContent = this.fmtTime(dur);
    sr.getElementById('trimOutDisplay').textContent = this.fmtTime(dur);
    this.vs.trimOut = null;

    // Info card
    const W = vid.videoWidth, H = vid.videoHeight;
    sr.getElementById('infoCard').innerHTML = `
      <div class="info-row"><span class="info-key">Resolution</span><span class="info-val">${W} × ${H}px</span></div>
      <div class="info-row"><span class="info-key">Duration</span><span class="info-val">${this.fmtTime(dur)}</span></div>
      <div class="info-row"><span class="info-key">Aspect</span><span class="info-val">${this.gcd(W,H)?`${W/this.gcd(W,H)}:${H/this.gcd(W,H)}`:'—'}</span></div>
    `;

    this.applyFilter();
    this.applyTransform();
    this.toast('Video loaded!');
  }

  /* ══════════════════════════════════════════════════
     PLAYBACK
  ══════════════════════════════════════════════════ */
  togglePlay() {
    const vid = this.shadowRoot.getElementById('vid');
    if (!this.vs.loaded) return;
    if (this.vs.playing) { vid.pause(); this.vs.playing = false; }
    else {
      // Respect trim
      if (this.vs.trimOut !== null && vid.currentTime >= this.vs.trimOut) vid.currentTime = this.vs.trimIn;
      vid.play().then(() => { this.vs.playing = true; }).catch(() => {});
    }
    this.updatePlayIcon();
  }

  updatePlayIcon() {
    const icon = this.shadowRoot.getElementById('playIcon');
    if (!icon) return;
    icon.innerHTML = this.vs.playing
      ? '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>'
      : '<polygon points="5 3 19 12 5 21 5 3"/>';
  }

  syncScrubber() {
    const sr  = this.shadowRoot;
    const vid = sr.getElementById('vid');
    if (!vid.duration) return;
    const pct = (vid.currentTime / vid.duration * 100).toFixed(2);

    sr.getElementById('tlThumb').style.left   = pct + '%';
    sr.getElementById('tlPlayed').style.width = pct + '%';
    sr.getElementById('curTime').textContent  = this.fmtTime(vid.currentTime);
    sr.getElementById('tlLabel').textContent  = this.fmtTime(vid.currentTime);

    // Enforce trim out
    if (this.vs.trimOut !== null && vid.currentTime >= this.vs.trimOut) {
      if (!this.vs.loop) { vid.pause(); this.vs.playing = false; this.updatePlayIcon(); }
      else { vid.currentTime = this.vs.trimIn; }
    }
  }

  updateTrimMarkers() {
    const sr  = this.shadowRoot;
    const vid = sr.getElementById('vid');
    const dur = vid.duration || 1;
    sr.getElementById('tlTrimIn').style.left  = (this.vs.trimIn / dur * 100) + '%';
    if (this.vs.trimOut !== null)
      sr.getElementById('tlTrimOut').style.left = (this.vs.trimOut / dur * 100) + '%';
  }

  /* ══════════════════════════════════════════════════
     FILTER / TRANSFORM
  ══════════════════════════════════════════════════ */
  applyFilter() {
    const vid = this.shadowRoot.getElementById('vid');
    const a   = this.vs.adj;
    vid.style.filter = `brightness(${a.brightness}%) contrast(${a.contrast}%) saturate(${a.saturation}%) hue-rotate(${a.hue}deg) blur(${a.blur}px)`;
  }

  applyTransform() {
    const vid = this.shadowRoot.getElementById('vid');
    const sx  = this.vs.flipH ? -1 : 1;
    const sy  = this.vs.flipV ? -1 : 1;
    vid.style.transform = `rotate(${this.vs.rotation}deg) scale(${sx}, ${sy})`;
  }

  syncAdjSliders() {
    const sr = this.shadowRoot;
    const UNITS = { brightness:'%', contrast:'%', saturation:'%', hue:'°', blur:'px' };
    Object.entries(this.vs.adj).forEach(([k, v]) => {
      const sl = sr.querySelector(`[data-adj="${k}"]`);
      const vl = sr.getElementById(`val_${k}`);
      if (sl) sl.value = v;
      if (vl) vl.textContent = v + (UNITS[k] || '');
    });
  }

  /* ══════════════════════════════════════════════════
     TEXT OVERLAY
  ══════════════════════════════════════════════════ */
  updateTextOverlay() {
    const sr  = this.shadowRoot;
    const ov  = sr.getElementById('textOverlay');
    const vp  = sr.getElementById('viewport');
    const t   = this.vs.text;

    t.content = sr.getElementById('textContent').value || 'Your Text';
    t.size    = parseInt(sr.getElementById('textSize').value) || 36;
    t.color   = sr.getElementById('textColor').value;

    ov.textContent   = t.content;
    ov.style.fontSize = t.size + 'px';
    ov.style.color    = t.color;

    // Position preset
    const pos = sr.getElementById('textPos').value;
    const posMap = {
      'top-left':      { top:'5%',  left:'5%',   transform:'none' },
      'top-center':    { top:'5%',  left:'50%',  transform:'translateX(-50%)' },
      'top-right':     { top:'5%',  left:'auto', right:'5%', transform:'none' },
      'middle-center': { top:'50%', left:'50%',  transform:'translate(-50%,-50%)' },
      'bottom-left':   { top:'auto',bottom:'5%', left:'5%', transform:'none' },
      'bottom-center': { top:'auto',bottom:'5%', left:'50%',transform:'translateX(-50%)' },
      'bottom-right':  { top:'auto',bottom:'5%', left:'auto',right:'5%',transform:'none' }
    };
    const p = posMap[pos] || posMap['bottom-center'];
    ov.style.top       = p.top    || 'auto';
    ov.style.bottom    = p.bottom || 'auto';
    ov.style.left      = p.left   || 'auto';
    ov.style.right     = p.right  || 'auto';
    ov.style.transform = p.transform || 'none';

    if (t.enabled) ov.classList.add('visible');
    else           ov.classList.remove('visible');
  }

  /* ══════════════════════════════════════════════════
     RESET
  ══════════════════════════════════════════════════ */
  resetAll() {
    this.vs.adj = { brightness:100, contrast:100, saturation:100, hue:0, blur:0 };
    this.vs.rotation = 0; this.vs.flipH = false; this.vs.flipV = false;
    this.vs.speed = 1;
    this.syncAdjSliders();
    this.applyFilter();
    this.applyTransform();
    const sr = this.shadowRoot;
    const vid = sr.getElementById('vid');
    vid.playbackRate = 1;
    sr.getElementById('flipHBtn').classList.remove('toggled');
    sr.getElementById('flipVBtn').classList.remove('toggled');
    sr.querySelectorAll('.speed-btn').forEach(b => b.classList.toggle('active', b.dataset.speed === '1'));
    sr.querySelectorAll('.preset-btn').forEach(b => b.classList.toggle('active', b.dataset.preset === 'normal'));
    this.toast('Reset to defaults');
  }

  /* ══════════════════════════════════════════════════
     HELPERS
  ══════════════════════════════════════════════════ */
  fmtTime(s) {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2,'0')}`;
  }
  gcd(a, b) { return b === 0 ? a : this.gcd(b, a % b); }
  _clearTick() {
    if (this._kbdFn) document.removeEventListener('keydown', this._kbdFn);
  }

  toast(msg) {
    const el = this.shadowRoot.getElementById('toast');
    el.textContent = msg; el.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
  }
}

customElements.define('advanced-video-editor', AdvancedVideoEditor);
