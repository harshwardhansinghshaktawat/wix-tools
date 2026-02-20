/**
 * Advanced QR Code Generator - Wix Custom Element
 * Filename: wix-advanced-qr-generator.js
 * Custom Element Tag: <advanced-qr-generator>
 *
 * A powerful QR code generator built with qrcode.js
 */
class AdvancedQrGenerator extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Default style settings — matches robots/cropper widget props
    this.settings = {
      primaryBg: '#ffffff',
      secondaryBg: '#f8f9fa',
      borderColor: '#dddddd',
      secondaryText: '#666666',
      mainAccent: '#3498db',
      hoverAccent: '#2980b9',
      headingColor: '#2c3e50',
      paragraphColor: '#333333',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      fontSize: 14,
      headingSize: 24,
      borderRadius: 8,
      buttonPadding: 8
    };

    // QR state
    this.qrState = {
      content: '',
      type: 'url',
      size: 256,
      errorLevel: 'M',
      fgColor: '#000000',
      bgColor: '#ffffff',
      margin: 4,
      logoUrl: '',
      logoSize: 20,
      dotStyle: 'square',
      cornerStyle: 'square',
      gradient: false,
      gradientColor1: '#000000',
      gradientColor2: '#3498db',
      gradientDirection: 'vertical'
    };

    this._libraryLoaded = false;
  }

  /* ─── Observed Attributes ─────────────────────────────────── */
  static get observedAttributes() {
    return [
      'primary-bg', 'secondary-bg', 'border-color', 'secondary-text',
      'main-accent', 'hover-accent', 'heading-color', 'paragraph-color',
      'font-family', 'font-size', 'heading-size', 'border-radius', 'button-padding'
    ];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (newValue && newValue !== oldValue) {
      const settingMap = {
        'primary-bg': 'primaryBg',
        'secondary-bg': 'secondaryBg',
        'border-color': 'borderColor',
        'secondary-text': 'secondaryText',
        'main-accent': 'mainAccent',
        'hover-accent': 'hoverAccent',
        'heading-color': 'headingColor',
        'paragraph-color': 'paragraphColor',
        'font-family': 'fontFamily',
        'font-size': 'fontSize',
        'heading-size': 'headingSize',
        'border-radius': 'borderRadius',
        'button-padding': 'buttonPadding'
      };
      const key = settingMap[name];
      if (key) {
        this.settings[key] = newValue;
        this.updateStyles();
      }
    }
  }

  /* ─── Lifecycle ───────────────────────────────────────────── */
  connectedCallback() {
    this.render();
    this.attachEventListeners();
    this.loadQRLibrary();
  }

  /* ─── Styles ──────────────────────────────────────────────── */
  getStyles() {
    return `
      :host {
        --primary-bg: ${this.settings.primaryBg};
        --secondary-bg: ${this.settings.secondaryBg};
        --border-color: ${this.settings.borderColor};
        --secondary-text: ${this.settings.secondaryText};
        --main-accent: ${this.settings.mainAccent};
        --hover-accent: ${this.settings.hoverAccent};
        --heading-color: ${this.settings.headingColor};
        --paragraph-color: ${this.settings.paragraphColor};
        --font-family: ${this.settings.fontFamily};
        --font-size: ${this.settings.fontSize}px;
        --heading-size: ${this.settings.headingSize}px;
        --border-radius: ${this.settings.borderRadius}px;
        --button-padding: ${this.settings.buttonPadding}px;

        --danger-color: #e74c3c;
        --success-color: #2ecc71;
        --box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        --transition: all 0.2s ease;

        display: block;
        font-family: var(--font-family);
        color: var(--paragraph-color);
        max-width: 1100px;
        margin: 0 auto;
        padding: 20px;
        box-sizing: border-box;
      }

      *, *::before, *::after { box-sizing: border-box; }

      /* ── Layout ── */
      .main-grid {
        display: grid;
        grid-template-columns: 1fr 340px;
        gap: 20px;
        align-items: start;
      }

      @media (max-width: 820px) {
        .main-grid { grid-template-columns: 1fr; }
      }

      /* ── Panel ── */
      .panel {
        background: var(--primary-bg);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        box-shadow: var(--box-shadow);
        padding: 20px;
        margin-bottom: 20px;
      }

      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 12px;
        margin-bottom: 16px;
        border-bottom: 1px solid var(--border-color);
      }

      h2 {
        margin: 0;
        font-size: var(--heading-size);
        color: var(--heading-color);
        font-family: var(--font-family);
      }

      h3 {
        margin: 0 0 14px 0;
        font-size: calc(var(--heading-size) * 0.72);
        color: var(--heading-color);
        font-family: var(--font-family);
      }

      p, label, span, li {
        font-family: var(--font-family);
        font-size: var(--font-size);
        color: var(--paragraph-color);
      }

      /* ── Tabs ── */
      .tabs {
        display: flex;
        gap: 2px;
        border-bottom: 1px solid var(--border-color);
        margin-bottom: 18px;
        flex-wrap: wrap;
      }

      .tab {
        padding: 9px 14px;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        font-size: var(--font-size);
        font-family: var(--font-family);
        color: var(--paragraph-color);
        transition: var(--transition);
        user-select: none;
      }

      .tab.active {
        border-bottom-color: var(--main-accent);
        color: var(--main-accent);
        font-weight: 600;
      }

      .tab:hover:not(.active) { background: var(--secondary-bg); }

      .tab-content { display: none; }
      .tab-content.active { display: block; }

      /* ── Form elements ── */
      .form-group { margin-bottom: 14px; }

      label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
        color: var(--heading-color);
      }

      input[type="text"],
      input[type="url"],
      input[type="email"],
      input[type="tel"],
      input[type="number"],
      select,
      textarea {
        width: 100%;
        padding: 9px 11px;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        font-family: var(--font-family);
        font-size: var(--font-size);
        color: var(--paragraph-color);
        background: var(--primary-bg);
        transition: var(--transition);
        appearance: none;
        -webkit-appearance: none;
      }

      input:focus, select:focus, textarea:focus {
        outline: none;
        border-color: var(--main-accent);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--main-accent) 18%, transparent);
      }

      textarea { resize: vertical; min-height: 80px; }

      input[type="color"] {
        width: 44px;
        height: 36px;
        padding: 2px;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        cursor: pointer;
        background: var(--primary-bg);
      }

      input[type="range"] {
        width: 100%;
        accent-color: var(--main-accent);
        cursor: pointer;
      }

      .color-row {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .color-row input[type="text"] { flex: 1; }

      /* ── Buttons ── */
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: var(--button-padding) 16px;
        border: 1px solid transparent;
        border-radius: var(--border-radius);
        font-size: var(--font-size);
        font-family: var(--font-family);
        font-weight: 500;
        cursor: pointer;
        transition: var(--transition);
        white-space: nowrap;
      }

      .btn-primary {
        background: var(--main-accent);
        color: var(--primary-bg);
        border-color: var(--main-accent);
      }

      .btn-primary:hover { background: var(--hover-accent); border-color: var(--hover-accent); }

      .btn-outline {
        background: transparent;
        color: var(--main-accent);
        border-color: var(--main-accent);
      }

      .btn-outline:hover {
        background: var(--main-accent);
        color: var(--primary-bg);
      }

      .btn-ghost {
        background: var(--secondary-bg);
        color: var(--paragraph-color);
        border-color: var(--border-color);
      }

      .btn-ghost:hover { border-color: var(--secondary-text); }

      .btn-danger {
        background: var(--danger-color);
        color: #fff;
        border-color: var(--danger-color);
      }

      .btn-danger:hover { background: #c0392b; }

      .btn-sm {
        padding: calc(var(--button-padding) - 3px) 10px;
        font-size: calc(var(--font-size) - 1px);
      }

      .btn-full { width: 100%; }

      .btn-icon {
        width: 15px;
        height: 15px;
        flex-shrink: 0;
      }

      /* ── Type selector ── */
      .type-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        margin-bottom: 16px;
      }

      .type-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        padding: 10px 6px;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        cursor: pointer;
        background: var(--primary-bg);
        transition: var(--transition);
        font-size: calc(var(--font-size) - 2px);
        font-family: var(--font-family);
        color: var(--paragraph-color);
      }

      .type-card:hover, .type-card.active {
        border-color: var(--main-accent);
        background: color-mix(in srgb, var(--main-accent) 8%, var(--primary-bg));
        color: var(--main-accent);
      }

      .type-card svg { width: 22px; height: 22px; }

      /* ── Slider row ── */
      .slider-row {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .slider-row input[type="range"] { flex: 1; }

      .slider-val {
        min-width: 42px;
        text-align: right;
        font-size: calc(var(--font-size) - 1px);
        color: var(--secondary-text);
      }

      /* ── Toggle ── */
      .toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }

      .toggle-label { font-weight: 500; color: var(--heading-color); }

      .toggle {
        position: relative;
        width: 40px;
        height: 22px;
        flex-shrink: 0;
      }

      .toggle input { opacity: 0; width: 0; height: 0; }

      .toggle-track {
        position: absolute;
        inset: 0;
        background: var(--border-color);
        border-radius: 22px;
        cursor: pointer;
        transition: var(--transition);
      }

      .toggle input:checked + .toggle-track { background: var(--main-accent); }

      .toggle-track::before {
        content: '';
        position: absolute;
        width: 16px;
        height: 16px;
        left: 3px;
        top: 3px;
        background: #fff;
        border-radius: 50%;
        transition: var(--transition);
      }

      .toggle input:checked + .toggle-track::before { transform: translateX(18px); }

      /* ── Error level buttons ── */
      .error-btns {
        display: flex;
        gap: 6px;
      }

      .error-btn {
        flex: 1;
        padding: 7px 4px;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        background: var(--primary-bg);
        font-size: calc(var(--font-size) - 1px);
        font-family: var(--font-family);
        cursor: pointer;
        text-align: center;
        transition: var(--transition);
        color: var(--paragraph-color);
      }

      .error-btn.active {
        background: var(--main-accent);
        border-color: var(--main-accent);
        color: var(--primary-bg);
        font-weight: 600;
      }

      .error-btn:hover:not(.active) { border-color: var(--main-accent); color: var(--main-accent); }

      /* ── Dot / Corner style selector ── */
      .style-grid {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .style-btn {
        padding: 6px 12px;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        background: var(--primary-bg);
        font-size: calc(var(--font-size) - 1px);
        font-family: var(--font-family);
        cursor: pointer;
        transition: var(--transition);
        color: var(--paragraph-color);
      }

      .style-btn.active {
        background: var(--main-accent);
        border-color: var(--main-accent);
        color: var(--primary-bg);
        font-weight: 600;
      }

      .style-btn:hover:not(.active) { border-color: var(--main-accent); }

      /* ── Right column: preview ── */
      .preview-panel {
        position: sticky;
        top: 20px;
      }

      .qr-canvas-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: var(--secondary-bg);
        border-radius: var(--border-radius);
        border: 1px solid var(--border-color);
        min-height: 300px;
        margin-bottom: 14px;
        position: relative;
      }

      #qrCanvas {
        border-radius: 4px;
        max-width: 100%;
      }

      .qr-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        color: var(--secondary-text);
        font-family: var(--font-family);
        font-size: var(--font-size);
        text-align: center;
      }

      .qr-placeholder svg { opacity: 0.35; }

      .download-row {
        display: flex;
        gap: 8px;
      }

      .download-row .btn { flex: 1; }

      /* ── Stats bar ── */
      .stats-bar {
        display: flex;
        gap: 14px;
        flex-wrap: wrap;
        margin-top: 12px;
        padding: 10px 12px;
        background: var(--secondary-bg);
        border-radius: var(--border-radius);
        border: 1px solid var(--border-color);
      }

      .stat-item {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .stat-label {
        font-size: calc(var(--font-size) - 3px);
        color: var(--secondary-text);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-family: var(--font-family);
      }

      .stat-value {
        font-size: var(--font-size);
        font-weight: 600;
        color: var(--heading-color);
        font-family: var(--font-family);
      }

      /* ── History ── */
      .history-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 280px;
        overflow-y: auto;
      }

      .history-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        cursor: pointer;
        background: var(--primary-bg);
        transition: var(--transition);
      }

      .history-item:hover { border-color: var(--main-accent); background: var(--secondary-bg); }

      .history-thumb {
        width: 36px;
        height: 36px;
        border-radius: 4px;
        border: 1px solid var(--border-color);
        object-fit: contain;
        flex-shrink: 0;
        background: #fff;
      }

      .history-meta { flex: 1; min-width: 0; }

      .history-type {
        font-size: calc(var(--font-size) - 2px);
        color: var(--main-accent);
        font-weight: 600;
        text-transform: uppercase;
        font-family: var(--font-family);
      }

      .history-text {
        font-size: calc(var(--font-size) - 1px);
        color: var(--paragraph-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-family: var(--font-family);
      }

      .badge {
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        border-radius: 20px;
        font-size: calc(var(--font-size) - 3px);
        font-weight: 600;
        background: var(--main-accent);
        color: var(--primary-bg);
        font-family: var(--font-family);
      }

      .copy-toast {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        background: var(--heading-color);
        color: var(--primary-bg);
        padding: 10px 20px;
        border-radius: var(--border-radius);
        font-size: var(--font-size);
        font-family: var(--font-family);
        opacity: 0;
        pointer-events: none;
        transition: all 0.3s ease;
        z-index: 9999;
        white-space: nowrap;
      }

      .copy-toast.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }

      .section-divider {
        border: none;
        border-top: 1px solid var(--border-color);
        margin: 16px 0;
      }

      .help-text {
        font-size: calc(var(--font-size) - 2px);
        color: var(--secondary-text);
        margin-top: 4px;
        font-family: var(--font-family);
      }

      .gradient-options {
        margin-top: 10px;
      }

      .two-col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
    `;
  }

  updateStyles() {
    const el = this.shadowRoot.querySelector('#dynamic-styles');
    if (el) el.textContent = this.getStyles();
  }

  /* ─── HTML ────────────────────────────────────────────────── */
  render() {
    this.shadowRoot.innerHTML = `
      <style id="dynamic-styles">${this.getStyles()}</style>

      <!-- Toast -->
      <div class="copy-toast" id="toast">Copied to clipboard!</div>

      <!-- Header panel -->
      <div class="panel">
        <div class="panel-header">
          <h2>Advanced QR Code Generator</h2>
          <span class="badge" id="charBadge">0 chars</span>
        </div>

        <!-- Content type selector -->
        <div class="type-grid" id="typeGrid">
          ${this._typeCards()}
        </div>

        <!-- Dynamic content form -->
        <div id="contentForm"></div>
      </div>

      <!-- Main grid -->
      <div class="main-grid">

        <!-- Left: settings -->
        <div>
          <div class="panel">
            <div class="tabs">
              <div class="tab active" data-tab="design">Design</div>
              <div class="tab" data-tab="advanced">Advanced</div>
              <div class="tab" data-tab="logo">Logo</div>
              <div class="tab" data-tab="history">History <span class="badge" id="histBadge">0</span></div>
            </div>

            <!-- Design tab -->
            <div class="tab-content active" data-tab-content="design">
              <div class="form-group">
                <label>Foreground Color</label>
                <div class="color-row">
                  <input type="color" id="fgColorPicker" value="#000000">
                  <input type="text" id="fgColorText" value="#000000" placeholder="#000000">
                </div>
              </div>

              <div class="form-group">
                <label>Background Color</label>
                <div class="color-row">
                  <input type="color" id="bgColorPicker" value="#ffffff">
                  <input type="text" id="bgColorText" value="#ffffff" placeholder="#ffffff">
                </div>
              </div>

              <div class="toggle-row">
                <span class="toggle-label">Gradient Foreground</span>
                <label class="toggle">
                  <input type="checkbox" id="gradientToggle">
                  <span class="toggle-track"></span>
                </label>
              </div>

              <div id="gradientOptions" class="gradient-options" style="display:none;">
                <div class="two-col">
                  <div class="form-group">
                    <label>Color 1</label>
                    <input type="color" id="grad1" value="#000000" style="width:100%;height:36px;">
                  </div>
                  <div class="form-group">
                    <label>Color 2</label>
                    <input type="color" id="grad2" value="#3498db" style="width:100%;height:36px;">
                  </div>
                </div>
                <div class="form-group">
                  <label>Direction</label>
                  <select id="gradDir">
                    <option value="vertical">Vertical (top → bottom)</option>
                    <option value="horizontal">Horizontal (left → right)</option>
                    <option value="diagonal">Diagonal</option>
                    <option value="radial">Radial (center out)</option>
                  </select>
                </div>
              </div>

              <hr class="section-divider">

              <div class="form-group">
                <label>QR Size: <span id="sizeLabel">256 px</span></label>
                <div class="slider-row">
                  <input type="range" id="sizeSlider" min="128" max="512" step="8" value="256">
                  <span class="slider-val" id="sizeVal">256</span>
                </div>
              </div>

              <div class="form-group">
                <label>Quiet Zone (Margin): <span id="marginLabel">4</span></label>
                <div class="slider-row">
                  <input type="range" id="marginSlider" min="0" max="10" step="1" value="4">
                  <span class="slider-val" id="marginVal">4</span>
                </div>
              </div>
            </div>

            <!-- Advanced tab -->
            <div class="tab-content" data-tab-content="advanced">
              <div class="form-group">
                <label>Error Correction Level</label>
                <div class="error-btns">
                  <button class="error-btn" data-level="L">L <small>(7%)</small></button>
                  <button class="error-btn active" data-level="M">M <small>(15%)</small></button>
                  <button class="error-btn" data-level="Q">Q <small>(25%)</small></button>
                  <button class="error-btn" data-level="H">H <small>(30%)</small></button>
                </div>
                <p class="help-text">Higher correction = more damage tolerance, but denser QR code. Use H when adding a logo.</p>
              </div>

              <hr class="section-divider">

              <div class="form-group">
                <label>Module (Dot) Style</label>
                <div class="style-grid" id="dotStyleGrid">
                  <button class="style-btn active" data-dot="square">Square</button>
                  <button class="style-btn" data-dot="rounded">Rounded</button>
                  <button class="style-btn" data-dot="dots">Dots</button>
                  <button class="style-btn" data-dot="classy">Classy</button>
                </div>
              </div>

              <div class="form-group">
                <label>Corner (Eye) Style</label>
                <div class="style-grid" id="cornerStyleGrid">
                  <button class="style-btn active" data-corner="square">Square</button>
                  <button class="style-btn" data-corner="rounded">Rounded</button>
                  <button class="style-btn" data-corner="dot">Dot</button>
                </div>
              </div>

              <hr class="section-divider">

              <div class="toggle-row">
                <span class="toggle-label">Transparent Background</span>
                <label class="toggle">
                  <input type="checkbox" id="transparentBg">
                  <span class="toggle-track"></span>
                </label>
              </div>
            </div>

            <!-- Logo tab -->
            <div class="tab-content" data-tab-content="logo">
              <p class="help-text" style="margin-bottom:12px;">Adding a logo reduces scannability — set Error Correction to H for best results.</p>

              <div class="form-group">
                <label>Logo Image URL</label>
                <input type="url" id="logoUrl" placeholder="https://example.com/logo.png">
              </div>

              <div class="form-group">
                <label>Or Upload Logo</label>
                <input type="file" accept="image/*" id="logoFile" style="display:none;">
                <button class="btn btn-outline btn-sm" id="logoUploadBtn">
                  <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Choose File
                </button>
                <span id="logoFileName" style="margin-left:8px;font-size:calc(var(--font-size) - 2px);color:var(--secondary-text);"></span>
              </div>

              <div class="form-group">
                <label>Logo Size: <span id="logoSizeLabel">20%</span></label>
                <div class="slider-row">
                  <input type="range" id="logoSizeSlider" min="10" max="35" step="1" value="20">
                  <span class="slider-val" id="logoSizeVal">20%</span>
                </div>
              </div>

              <div class="form-group">
                <label>Logo Background Padding</label>
                <div class="slider-row">
                  <input type="range" id="logoPadSlider" min="0" max="20" step="1" value="6">
                  <span class="slider-val" id="logoPadVal">6</span>
                </div>
              </div>

              <div class="form-group">
                <label>Logo BG Color</label>
                <div class="color-row">
                  <input type="color" id="logoBgColor" value="#ffffff">
                  <span style="font-size:calc(var(--font-size) - 1px);color:var(--secondary-text);">Background behind the logo</span>
                </div>
              </div>

              <button class="btn btn-danger btn-sm" id="clearLogoBtn">Remove Logo</button>
            </div>

            <!-- History tab -->
            <div class="tab-content" data-tab-content="history">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <span style="font-size:var(--font-size);color:var(--secondary-text);">Recently generated QR codes</span>
                <button class="btn btn-ghost btn-sm" id="clearHistoryBtn">Clear All</button>
              </div>
              <div class="history-list" id="historyList">
                <p style="color:var(--secondary-text);text-align:center;padding:20px 0;">No history yet. Generate a QR code to get started.</p>
              </div>
            </div>
          </div>

          <!-- Stats bar -->
          <div class="stats-bar" id="statsBar">
            <div class="stat-item">
              <span class="stat-label">Type</span>
              <span class="stat-value" id="statType">—</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Size</span>
              <span class="stat-value" id="statSize">—</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Error Lvl</span>
              <span class="stat-value" id="statError">M</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Characters</span>
              <span class="stat-value" id="statChars">0</span>
            </div>
          </div>
        </div>

        <!-- Right: preview -->
        <div class="preview-panel">
          <div class="panel">
            <h3>Preview</h3>

            <div class="qr-canvas-wrap" id="qrWrap">
              <div class="qr-placeholder" id="qrPlaceholder">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                  <rect x="5" y="5" width="3" height="3" fill="currentColor"/>
                  <rect x="16" y="5" width="3" height="3" fill="currentColor"/>
                  <rect x="5" y="16" width="3" height="3" fill="currentColor"/>
                  <line x1="14" y1="14" x2="14" y2="21"/><line x1="14" y1="14" x2="21" y2="14"/>
                  <line x1="17" y1="17" x2="21" y2="17"/><line x1="17" y1="17" x2="17" y2="21"/>
                </svg>
                <span>Enter content to generate</span>
              </div>
              <canvas id="qrCanvas" style="display:none;"></canvas>
            </div>

            <button class="btn btn-primary btn-full" id="generateBtn" style="margin-bottom:10px;">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Generate QR Code
            </button>

            <div class="download-row">
              <button class="btn btn-outline" id="downloadPng">
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                PNG
              </button>
              <button class="btn btn-outline" id="downloadSvg">
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                SVG
              </button>
              <button class="btn btn-ghost" id="copyBtn">
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  _typeCards() {
    const types = [
      { id: 'url',      label: 'URL',      icon: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>' },
      { id: 'text',     label: 'Text',     icon: '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>' },
      { id: 'email',    label: 'Email',    icon: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>' },
      { id: 'phone',    label: 'Phone',    icon: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.36 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.27 1.3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z"/>' },
      { id: 'sms',      label: 'SMS',      icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' },
      { id: 'wifi',     label: 'WiFi',     icon: '<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>' },
      { id: 'vcard',    label: 'vCard',    icon: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 10h10"/><path d="M7 14h6"/>' },
      { id: 'location', label: 'Location', icon: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>' }
    ];

    return types.map(t => `
      <button class="type-card ${t.id === 'url' ? 'active' : ''}" data-type="${t.id}">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${t.icon}</svg>
        ${t.label}
      </button>
    `).join('');
  }

  /* ─── Content Forms per type ─────────────────────────────── */
  _getContentForm(type) {
    const forms = {
      url: `
        <div class="form-group">
          <label>Website URL</label>
          <input type="url" id="cf_url" placeholder="https://example.com" value="">
          <p class="help-text">Include https:// for best compatibility.</p>
        </div>`,

      text: `
        <div class="form-group">
          <label>Text Content</label>
          <textarea id="cf_text" placeholder="Enter any text…"></textarea>
        </div>`,

      email: `
        <div class="two-col">
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" id="cf_email_to" placeholder="hello@example.com">
          </div>
          <div class="form-group">
            <label>Subject (optional)</label>
            <input type="text" id="cf_email_sub" placeholder="Subject line">
          </div>
        </div>
        <div class="form-group">
          <label>Body (optional)</label>
          <textarea id="cf_email_body" placeholder="Email body…"></textarea>
        </div>`,

      phone: `
        <div class="form-group">
          <label>Phone Number</label>
          <input type="tel" id="cf_phone" placeholder="+1234567890">
          <p class="help-text">Include country code for international numbers.</p>
        </div>`,

      sms: `
        <div class="two-col">
          <div class="form-group">
            <label>Phone Number</label>
            <input type="tel" id="cf_sms_to" placeholder="+1234567890">
          </div>
          <div class="form-group">
            <label>Message (optional)</label>
            <input type="text" id="cf_sms_msg" placeholder="Pre-filled message">
          </div>
        </div>`,

      wifi: `
        <div class="two-col">
          <div class="form-group">
            <label>Network Name (SSID)</label>
            <input type="text" id="cf_wifi_ssid" placeholder="MyWiFiNetwork">
          </div>
          <div class="form-group">
            <label>Encryption</label>
            <select id="cf_wifi_enc">
              <option value="WPA">WPA/WPA2</option>
              <option value="WEP">WEP</option>
              <option value="nopass">None</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="text" id="cf_wifi_pass" placeholder="Network password">
        </div>
        <div class="toggle-row">
          <span class="toggle-label">Hidden Network</span>
          <label class="toggle">
            <input type="checkbox" id="cf_wifi_hidden">
            <span class="toggle-track"></span>
          </label>
        </div>`,

      vcard: `
        <div class="two-col">
          <div class="form-group">
            <label>First Name</label>
            <input type="text" id="cf_vc_first" placeholder="John">
          </div>
          <div class="form-group">
            <label>Last Name</label>
            <input type="text" id="cf_vc_last" placeholder="Doe">
          </div>
        </div>
        <div class="two-col">
          <div class="form-group">
            <label>Phone</label>
            <input type="tel" id="cf_vc_phone" placeholder="+1234567890">
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" id="cf_vc_email" placeholder="john@example.com">
          </div>
        </div>
        <div class="two-col">
          <div class="form-group">
            <label>Company</label>
            <input type="text" id="cf_vc_org" placeholder="Acme Inc.">
          </div>
          <div class="form-group">
            <label>Job Title</label>
            <input type="text" id="cf_vc_title" placeholder="Designer">
          </div>
        </div>
        <div class="form-group">
          <label>Website</label>
          <input type="url" id="cf_vc_url" placeholder="https://example.com">
        </div>
        <div class="form-group">
          <label>Address</label>
          <input type="text" id="cf_vc_addr" placeholder="123 Main St, City, Country">
        </div>`,

      location: `
        <div class="two-col">
          <div class="form-group">
            <label>Latitude</label>
            <input type="number" id="cf_lat" placeholder="48.8566" step="any">
          </div>
          <div class="form-group">
            <label>Longitude</label>
            <input type="number" id="cf_lng" placeholder="2.3522" step="any">
          </div>
        </div>
        <div class="form-group">
          <label>Place Name (optional)</label>
          <input type="text" id="cf_loc_name" placeholder="Eiffel Tower">
        </div>
        <button class="btn btn-outline btn-sm" id="useMyLocationBtn" style="margin-bottom:12px;">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Use My Location
        </button>`
    };
    return forms[type] || forms.url;
  }

  /* ─── Build encoded string from form ────────────────────── */
  _buildQRContent() {
    const type = this.qrState.type;
    const g = (id) => {
      const el = this.shadowRoot.getElementById(id);
      return el ? el.value.trim() : '';
    };
    const checked = (id) => {
      const el = this.shadowRoot.getElementById(id);
      return el ? el.checked : false;
    };

    switch (type) {
      case 'url':    return g('cf_url') || 'https://example.com';
      case 'text':   return g('cf_text') || 'Hello World';
      case 'email': {
        const to = g('cf_email_to');
        const sub = encodeURIComponent(g('cf_email_sub'));
        const body = encodeURIComponent(g('cf_email_body'));
        let s = `mailto:${to}`;
        const parts = [];
        if (sub) parts.push(`subject=${sub}`);
        if (body) parts.push(`body=${body}`);
        if (parts.length) s += '?' + parts.join('&');
        return s;
      }
      case 'phone':  return `tel:${g('cf_phone')}`;
      case 'sms': {
        const to = g('cf_sms_to');
        const msg = g('cf_sms_msg');
        return msg ? `sms:${to}?body=${encodeURIComponent(msg)}` : `sms:${to}`;
      }
      case 'wifi': {
        const ssid = g('cf_wifi_ssid');
        const enc  = g('cf_wifi_enc');
        const pass = g('cf_wifi_pass');
        const hidden = checked('cf_wifi_hidden') ? 'true' : 'false';
        return `WIFI:T:${enc};S:${ssid};P:${pass};H:${hidden};;`;
      }
      case 'vcard': {
        const first = g('cf_vc_first');
        const last  = g('cf_vc_last');
        const lines = [
          'BEGIN:VCARD', 'VERSION:3.0',
          `N:${last};${first};;;`,
          `FN:${first} ${last}`,
          g('cf_vc_org')   ? `ORG:${g('cf_vc_org')}` : '',
          g('cf_vc_title') ? `TITLE:${g('cf_vc_title')}` : '',
          g('cf_vc_phone') ? `TEL:${g('cf_vc_phone')}` : '',
          g('cf_vc_email') ? `EMAIL:${g('cf_vc_email')}` : '',
          g('cf_vc_url')   ? `URL:${g('cf_vc_url')}` : '',
          g('cf_vc_addr')  ? `ADR:;;${g('cf_vc_addr')};;;;` : '',
          'END:VCARD'
        ].filter(Boolean);
        return lines.join('\n');
      }
      case 'location': {
        const lat  = g('cf_lat') || '0';
        const lng  = g('cf_lng') || '0';
        const name = g('cf_loc_name');
        return name
          ? `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(name)})`
          : `geo:${lat},${lng}`;
      }
      default: return 'https://example.com';
    }
  }

  /* ─── Generate QR ─────────────────────────────────────────── */
  async generateQR() {
    if (!this._libraryLoaded) {
      this.showToast('QR library still loading — please try again');
      return;
    }

    const content = this._buildQRContent();
    if (!content) { this.showToast('Please enter content first'); return; }

    const s = this.qrState;
    const canvas = this.shadowRoot.getElementById('qrCanvas');
    const placeholder = this.shadowRoot.getElementById('qrPlaceholder');
    const size = parseInt(s.size);

    canvas.width  = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);

    // Transparent background
    const transparentBg = this.shadowRoot.getElementById('transparentBg').checked;

    try {
      // Generate QR matrix via qrcode-generator
      const qr = qrcode(0, s.errorLevel);
      qr.addData(content);
      qr.make();

      const moduleCount = qr.getModuleCount();
      const margin      = parseInt(s.margin);
      const totalModules = moduleCount + margin * 2;
      const cellSize    = size / totalModules;

      // Background
      if (!transparentBg) {
        ctx.fillStyle = s.bgColor;
        ctx.fillRect(0, 0, size, size);
      }

      // Gradient setup
      let fillStyle = s.fgColor;
      if (s.gradient) {
        let grad;
        if (s.gradientDirection === 'radial') {
          grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
        } else if (s.gradientDirection === 'horizontal') {
          grad = ctx.createLinearGradient(0, 0, size, 0);
        } else if (s.gradientDirection === 'diagonal') {
          grad = ctx.createLinearGradient(0, 0, size, size);
        } else {
          grad = ctx.createLinearGradient(0, 0, 0, size);
        }
        grad.addColorStop(0, s.gradientColor1);
        grad.addColorStop(1, s.gradientColor2);
        fillStyle = grad;
      }

      ctx.fillStyle = fillStyle;

      // Draw modules
      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          if (!qr.isDark(row, col)) continue;

          const x = (col + margin) * cellSize;
          const y = (row + margin) * cellSize;
          const cs = cellSize;

          // Detect corner eyes (top-left, top-right, bottom-left)
          const isCornerEye =
            (row < 7 && col < 7) ||
            (row < 7 && col >= moduleCount - 7) ||
            (row >= moduleCount - 7 && col < 7);

          const style = isCornerEye ? s.cornerStyle : s.dotStyle;
          this._drawModule(ctx, x, y, cs, style);
        }
      }

      // Logo overlay
      await this._drawLogo(ctx, size);

      canvas.style.display = 'block';
      placeholder.style.display = 'none';

      // Update stats
      this._updateStats(content, size);

      // Save to history
      this._saveHistory(content, canvas.toDataURL('image/png'));

    } catch (err) {
      console.error('QR generation error:', err);
      this.showToast('Error: ' + err.message);
    }
  }

  _drawModule(ctx, x, y, size, style) {
    const r = size * 0.45;
    const cx = x + size / 2;
    const cy = y + size / 2;

    switch (style) {
      case 'dots':
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'rounded':
        this._roundRect(ctx, x + size * 0.05, y + size * 0.05, size * 0.9, size * 0.9, size * 0.25);
        ctx.fill();
        break;
      case 'classy':
        this._roundRect(ctx, x + size * 0.05, y + size * 0.05, size * 0.9, size * 0.9, size * 0.1);
        ctx.fill();
        break;
      case 'dot':
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.8, 0, Math.PI * 2);
        ctx.fill();
        break;
      default: // square
        ctx.fillRect(x, y, size, size);
    }
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  async _drawLogo(ctx, canvasSize) {
    const s = this.qrState;
    const src = s.logoDataUrl || s.logoUrl;
    if (!src) return;

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const logoMaxSize = canvasSize * (parseInt(s.logoSize) / 100);
        const ratio = Math.min(logoMaxSize / img.width, logoMaxSize / img.height);
        const lw = img.width * ratio;
        const lh = img.height * ratio;
        const lx = (canvasSize - lw) / 2;
        const ly = (canvasSize - lh) / 2;

        const pad = parseInt(this.shadowRoot.getElementById('logoPadSlider')?.value || 6);
        const bgColor = this.shadowRoot.getElementById('logoBgColor')?.value || '#ffffff';

        // Logo background
        ctx.fillStyle = bgColor;
        this._roundRect(ctx, lx - pad, ly - pad, lw + pad * 2, lh + pad * 2, 6);
        ctx.fill();

        ctx.drawImage(img, lx, ly, lw, lh);
        resolve();
      };
      img.onerror = resolve;
      img.src = src;
    });
  }

  /* ─── Stats ──────────────────────────────────────────────── */
  _updateStats(content, size) {
    const s = this.qrState;
    this.shadowRoot.getElementById('statType').textContent = s.type.toUpperCase();
    this.shadowRoot.getElementById('statSize').textContent = `${size}×${size}`;
    this.shadowRoot.getElementById('statError').textContent = s.errorLevel;
    this.shadowRoot.getElementById('statChars').textContent = content.length;
    this.shadowRoot.getElementById('charBadge').textContent = `${content.length} chars`;
  }

  /* ─── History ────────────────────────────────────────────── */
  _saveHistory(content, dataUrl) {
    if (!this._history) this._history = [];
    this._history.unshift({
      type: this.qrState.type,
      content,
      dataUrl,
      time: Date.now()
    });
    if (this._history.length > 20) this._history.pop();
    this._renderHistory();
  }

  _renderHistory() {
    const list = this.shadowRoot.getElementById('historyList');
    const badge = this.shadowRoot.getElementById('histBadge');
    if (!this._history || this._history.length === 0) {
      list.innerHTML = '<p style="color:var(--secondary-text);text-align:center;padding:20px 0;">No history yet.</p>';
      badge.textContent = '0';
      return;
    }
    badge.textContent = this._history.length;
    list.innerHTML = this._history.map((item, i) => `
      <div class="history-item" data-index="${i}">
        <img class="history-thumb" src="${item.dataUrl}" alt="QR">
        <div class="history-meta">
          <div class="history-type">${item.type}</div>
          <div class="history-text">${item.content.slice(0, 60)}${item.content.length > 60 ? '…' : ''}</div>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', () => {
        const item = this._history[parseInt(el.dataset.index)];
        const canvas = this.shadowRoot.getElementById('qrCanvas');
        const placeholder = this.shadowRoot.getElementById('qrPlaceholder');
        const img = new Image();
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          canvas.getContext('2d').drawImage(img, 0, 0);
          canvas.style.display = 'block';
          placeholder.style.display = 'none';
        };
        img.src = item.dataUrl;
        this.showToast('Restored from history');
      });
    });
  }

  /* ─── Download ───────────────────────────────────────────── */
  _downloadPng() {
    const canvas = this.shadowRoot.getElementById('qrCanvas');
    if (canvas.style.display === 'none') { this.showToast('Generate a QR code first'); return; }
    const link = document.createElement('a');
    link.download = `qrcode-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  _downloadSvg() {
    const canvas = this.shadowRoot.getElementById('qrCanvas');
    if (canvas.style.display === 'none') { this.showToast('Generate a QR code first'); return; }

    const size = canvas.width;
    const dataUrl = canvas.toDataURL('image/png');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <image href="${dataUrl}" width="${size}" height="${size}"/>
</svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.download = `qrcode-${Date.now()}.svg`;
    link.href = URL.createObjectURL(blob);
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  _copyToClipboard() {
    const canvas = this.shadowRoot.getElementById('qrCanvas');
    if (canvas.style.display === 'none') { this.showToast('Generate a QR code first'); return; }
    canvas.toBlob(blob => {
      try {
        navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        this.showToast('QR code copied to clipboard!');
      } catch {
        this.showToast('Copy not supported in this browser');
      }
    });
  }

  /* ─── Toast ──────────────────────────────────────────────── */
  showToast(msg) {
    const t = this.shadowRoot.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
  }

  /* ─── Event Listeners ────────────────────────────────────── */
  attachEventListeners() {
    const sr = this.shadowRoot;

    // Render initial form
    this._renderContentForm('url');

    // Type cards
    sr.querySelectorAll('.type-card').forEach(btn => {
      btn.addEventListener('click', () => {
        sr.querySelectorAll('.type-card').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.qrState.type = btn.dataset.type;
        this._renderContentForm(btn.dataset.type);
      });
    });

    // Tabs
    sr.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        sr.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        sr.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        sr.querySelector(`.tab-content[data-tab-content="${tab.dataset.tab}"]`)?.classList.add('active');
      });
    });

    // Colors
    this._bindColorPair('fgColorPicker', 'fgColorText', v => this.qrState.fgColor = v);
    this._bindColorPair('bgColorPicker', 'bgColorText', v => this.qrState.bgColor = v);

    // Gradient
    sr.getElementById('gradientToggle').addEventListener('change', e => {
      this.qrState.gradient = e.target.checked;
      sr.getElementById('gradientOptions').style.display = e.target.checked ? 'block' : 'none';
    });
    sr.getElementById('grad1').addEventListener('input', e => this.qrState.gradientColor1 = e.target.value);
    sr.getElementById('grad2').addEventListener('input', e => this.qrState.gradientColor2 = e.target.value);
    sr.getElementById('gradDir').addEventListener('change', e => this.qrState.gradientDirection = e.target.value);

    // Sliders
    this._bindSlider('sizeSlider', 'sizeVal', v => { this.qrState.size = v; }, ' ');
    this._bindSlider('marginSlider', 'marginVal', v => { this.qrState.margin = v; });
    this._bindSlider('logoSizeSlider', 'logoSizeVal', v => { this.qrState.logoSize = v; }, '%');
    sr.getElementById('logoPadSlider').addEventListener('input', e => {
      sr.getElementById('logoPadVal').textContent = e.target.value;
    });

    // Error level
    sr.querySelectorAll('.error-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sr.querySelectorAll('.error-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.qrState.errorLevel = btn.dataset.level;
        sr.getElementById('statError').textContent = btn.dataset.level;
      });
    });

    // Dot style
    sr.querySelectorAll('[data-dot]').forEach(btn => {
      btn.addEventListener('click', () => {
        sr.querySelectorAll('[data-dot]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.qrState.dotStyle = btn.dataset.dot;
      });
    });

    // Corner style
    sr.querySelectorAll('[data-corner]').forEach(btn => {
      btn.addEventListener('click', () => {
        sr.querySelectorAll('[data-corner]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.qrState.cornerStyle = btn.dataset.corner;
      });
    });

    // Logo URL
    sr.getElementById('logoUrl').addEventListener('input', e => {
      this.qrState.logoUrl = e.target.value;
      this.qrState.logoDataUrl = '';
    });

    // Logo upload
    sr.getElementById('logoUploadBtn').addEventListener('click', () => sr.getElementById('logoFile').click());
    sr.getElementById('logoFile').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        this.qrState.logoDataUrl = ev.target.result;
        this.qrState.logoUrl = '';
        sr.getElementById('logoFileName').textContent = file.name;
      };
      reader.readAsDataURL(file);
    });

    // Clear logo
    sr.getElementById('clearLogoBtn').addEventListener('click', () => {
      this.qrState.logoUrl = '';
      this.qrState.logoDataUrl = '';
      sr.getElementById('logoUrl').value = '';
      sr.getElementById('logoFileName').textContent = '';
      this.showToast('Logo removed');
    });

    // Clear history
    sr.getElementById('clearHistoryBtn').addEventListener('click', () => {
      this._history = [];
      this._renderHistory();
    });

    // Action buttons
    sr.getElementById('generateBtn').addEventListener('click', () => this.generateQR());
    sr.getElementById('downloadPng').addEventListener('click', () => this._downloadPng());
    sr.getElementById('downloadSvg').addEventListener('click', () => this._downloadSvg());
    sr.getElementById('copyBtn').addEventListener('click', () => this._copyToClipboard());
  }

  _bindColorPair(pickerId, textId, cb) {
    const picker = this.shadowRoot.getElementById(pickerId);
    const text   = this.shadowRoot.getElementById(textId);
    picker.addEventListener('input', e => { text.value = e.target.value; cb(e.target.value); });
    text.addEventListener('input', e => {
      const v = e.target.value;
      if (/^#[0-9a-fA-F]{6}$/.test(v)) { picker.value = v; cb(v); }
    });
  }

  _bindSlider(sliderId, valId, cb, suffix = '') {
    const slider = this.shadowRoot.getElementById(sliderId);
    const label  = this.shadowRoot.getElementById(valId);
    slider.addEventListener('input', e => {
      const v = e.target.value;
      label.textContent = v + suffix;
      cb(v);
    });
  }

  _renderContentForm(type) {
    const form = this.shadowRoot.getElementById('contentForm');
    form.innerHTML = this._getContentForm(type);

    // Live char counter
    form.querySelectorAll('input, textarea, select').forEach(el => {
      el.addEventListener('input', () => {
        const content = this._buildQRContent();
        this.shadowRoot.getElementById('charBadge').textContent = `${content.length} chars`;
        this.shadowRoot.getElementById('statChars').textContent = content.length;
      });
    });

    // Use My Location button
    const locBtn = form.querySelector('#useMyLocationBtn');
    if (locBtn) {
      locBtn.addEventListener('click', () => {
        if (!navigator.geolocation) { this.showToast('Geolocation not supported'); return; }
        navigator.geolocation.getCurrentPosition(pos => {
          const lat = this.shadowRoot.getElementById('cf_lat');
          const lng = this.shadowRoot.getElementById('cf_lng');
          if (lat) lat.value = pos.coords.latitude.toFixed(6);
          if (lng) lng.value = pos.coords.longitude.toFixed(6);
          this.showToast('Location detected!');
        }, () => this.showToast('Could not get location'));
      });
    }
  }

  /* ─── Load qrcode-generator lib ──────────────────────────── */
  loadQRLibrary() {
    if (typeof qrcode !== 'undefined') { this._libraryLoaded = true; return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    script.onload = () => {
      // qrcode.js defines window.QRCode, not the matrix generator we need.
      // Load the correct matrix-based qrcode-generator instead.
    };
    document.head.appendChild(script);

    // Use qrcode-generator (Kazuhiko Arase) which exposes window.qrcode
    const script2 = document.createElement('script');
    script2.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';
    script2.onload = () => {
      this._libraryLoaded = true;
    };
    script2.onerror = () => console.error('Failed to load QR library');
    document.head.appendChild(script2);
  }
}

customElements.define('advanced-qr-generator', AdvancedQrGenerator);
