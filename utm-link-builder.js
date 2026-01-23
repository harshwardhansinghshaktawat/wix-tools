/**
 * UTM Link Builder - Advanced Campaign URL Builder for Wix
 * Filename: utm-link-builder.js
 * Custom Element Tag: utm-link-builder
 */

class UTMLinkBuilder extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Default settings
    this.settings = {
      primaryBg: '#ffffff',
      secondaryBg: '#f8f9fa',
      borderColor: '#dfe5eb',
      secondaryText: '#7a92a5',
      mainAccent: '#3899ec',
      hoverAccent: '#4eb7f5',
      headingColor: '#162d3d',
      paragraphColor: '#333333',
      fontFamily: 'Arial, sans-serif',
      fontSize: 14,
      headingSize: 20,
      borderRadius: 6,
      buttonPadding: 8
    };
    
    this.presets = [];
    this.history = [];
    this.isShortened = false;
    
    // Load saved data from localStorage if available
    try {
      const savedPresets = localStorage.getItem('utm-builder-presets');
      if (savedPresets) this.presets = JSON.parse(savedPresets);
      
      const savedHistory = localStorage.getItem('utm-builder-history');
      if (savedHistory) this.history = JSON.parse(savedHistory);
    } catch (e) {
      console.warn('Error loading saved data', e);
    }
  }

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
      
      const settingKey = settingMap[name];
      if (settingKey) {
        this.settings[settingKey] = newValue;
        this.updateStyles();
      }
    }
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  updateStyles() {
    const styleElement = this.shadowRoot.querySelector('#dynamic-styles');
    if (styleElement) {
      styleElement.textContent = this.getStyles();
    }
  }

  getStyles() {
    return `
      :host {
        display: block;
        font-family: ${this.settings.fontFamily};
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
        --success-color: #00b894;
        --warning-color: #fdcb6e;
        --error-color: #ff7675;
        --box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        --transition: all 0.3s ease;
      }

      * {
        box-sizing: border-box;
      }

      .container {
        background: var(--primary-bg);
        border-radius: var(--border-radius);
        box-shadow: var(--box-shadow);
        overflow: hidden;
        max-width: 800px;
        margin: 0 auto;
        border: 1px solid var(--border-color);
      }

      .header {
        background: linear-gradient(135deg, var(--main-accent), var(--hover-accent));
        color: var(--primary-bg);
        padding: 20px;
        text-align: center;
      }

      .header h1 {
        margin: 0;
        font-size: var(--heading-size);
        font-weight: 600;
        font-family: var(--font-family);
      }

      .header p {
        margin: 10px 0 0;
        opacity: 0.9;
        font-size: var(--font-size);
        font-family: var(--font-family);
      }

      .tabs {
        display: flex;
        background-color: var(--secondary-bg);
        border-bottom: 1px solid var(--border-color);
      }

      .tab {
        padding: var(--button-padding) 20px;
        cursor: pointer;
        transition: var(--transition);
        border-bottom: 3px solid transparent;
        font-weight: 500;
        font-size: var(--font-size);
        font-family: var(--font-family);
        color: var(--paragraph-color);
        background: none;
        border-top: none;
        border-left: none;
        border-right: none;
      }

      .tab.active {
        border-bottom: 3px solid var(--main-accent);
        color: var(--main-accent);
      }

      .tab:hover:not(.active) {
        background-color: rgba(0,0,0,0.03);
      }

      .tab-content {
        display: none;
        padding: 20px;
      }

      .tab-content.active {
        display: block;
        animation: fadeIn 0.3s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .form-group {
        margin-bottom: 16px;
      }

      label {
        display: block;
        margin-bottom: 6px;
        font-weight: 500;
        color: var(--heading-color);
        font-size: var(--font-size);
        font-family: var(--font-family);
      }

      .input-wrapper {
        position: relative;
      }

      input, select {
        width: 100%;
        padding: var(--button-padding);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        font-size: var(--font-size);
        transition: var(--transition);
        box-sizing: border-box;
        background-color: var(--primary-bg);
        color: var(--paragraph-color);
        font-family: var(--font-family);
      }

      input:focus, select:focus {
        border-color: var(--main-accent);
        outline: none;
        box-shadow: 0 0 0 3px rgba(61, 123, 244, 0.15);
      }

      .required::after {
        content: "*";
        color: var(--error-color);
        margin-left: 3px;
      }

      .tooltip {
        position: relative;
        display: inline-block;
        margin-left: 6px;
        width: 16px;
        height: 16px;
        background: var(--secondary-text);
        color: var(--primary-bg);
        border-radius: 50%;
        text-align: center;
        line-height: 16px;
        font-size: 12px;
        cursor: help;
      }

      .tooltip-text {
        visibility: hidden;
        width: 200px;
        background-color: #333;
        color: #fff;
        text-align: center;
        border-radius: 4px;
        padding: 8px;
        position: absolute;
        z-index: 1;
        bottom: 125%;
        left: 50%;
        margin-left: -100px;
        opacity: 0;
        transition: opacity 0.3s;
        font-size: 12px;
        line-height: 1.4;
      }

      .tooltip:hover .tooltip-text {
        visibility: visible;
        opacity: 1;
      }

      .row {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
      }

      .col {
        flex: 1;
        min-width: 200px;
      }

      .actions {
        display: flex;
        justify-content: space-between;
        margin-top: 24px;
        gap: 12px;
        flex-wrap: wrap;
      }

      button {
        padding: var(--button-padding) 20px;
        border: none;
        border-radius: var(--border-radius);
        background-color: var(--main-accent);
        color: var(--primary-bg);
        font-weight: 600;
        cursor: pointer;
        transition: var(--transition);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: var(--font-size);
        font-family: var(--font-family);
      }

      button:hover {
        background-color: var(--hover-accent);
        transform: translateY(-1px);
      }

      button:active {
        transform: translateY(0);
      }

      button.secondary {
        background-color: var(--secondary-bg);
        color: var(--heading-color);
        border: 1px solid var(--border-color);
      }

      button.secondary:hover {
        background-color: var(--border-color);
      }

      button.success {
        background-color: var(--success-color);
      }

      button.success:hover {
        background-color: #00a382;
      }

      .result {
        margin-top: 24px;
        padding: 16px;
        background-color: var(--secondary-bg);
        border-radius: var(--border-radius);
        position: relative;
        border: 1px solid var(--border-color);
      }

      .result h3 {
        margin-top: 0;
        color: var(--heading-color);
        font-size: calc(var(--font-size) + 2px);
        font-family: var(--font-family);
      }

      .url-preview {
        padding: 12px;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        background-color: var(--primary-bg);
        overflow-wrap: break-word;
        font-family: monospace;
        margin-bottom: 16px;
        word-break: break-all;
        font-size: var(--font-size);
        color: var(--paragraph-color);
      }

      .copy-btn {
        position: absolute;
        top: 16px;
        right: 16px;
        background-color: var(--primary-bg);
        border: 1px solid var(--border-color);
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: var(--transition);
        color: var(--heading-color);
      }

      .copy-btn:hover {
        background-color: var(--secondary-bg);
      }

      .copy-success {
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: var(--success-color);
        color: white;
        padding: 12px 20px;
        border-radius: var(--border-radius);
        box-shadow: var(--box-shadow);
        animation: slideIn 0.3s ease, slideOut 0.3s ease 2s forwards;
        z-index: 1000;
        font-size: var(--font-size);
        font-family: var(--font-family);
      }

      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }

      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }

      .validation-error {
        color: var(--error-color);
        font-size: calc(var(--font-size) - 2px);
        margin-top: 4px;
        font-family: var(--font-family);
      }

      .qr-code {
        display: flex;
        justify-content: center;
        margin-top: 16px;
      }

      .preset-item, .history-item {
        padding: 12px;
        margin-bottom: 8px;
        background-color: var(--secondary-bg);
        border-radius: var(--border-radius);
        position: relative;
        border: 1px solid var(--border-color);
      }

      .preset-item:hover, .history-item:hover {
        background-color: var(--border-color);
      }

      .preset-name, .history-date {
        font-weight: 600;
        margin-bottom: 4px;
        font-size: var(--font-size);
        font-family: var(--font-family);
        color: var(--heading-color);
      }

      .preset-url, .history-url {
        font-size: calc(var(--font-size) - 2px);
        word-break: break-all;
        font-family: var(--font-family);
        color: var(--paragraph-color);
      }

      .preset-actions, .history-actions {
        position: absolute;
        right: 12px;
        top: 12px;
        display: flex;
        gap: 8px;
      }

      .action-btn {
        padding: 4px 8px;
        border-radius: 4px;
        background-color: var(--primary-bg);
        border: 1px solid var(--border-color);
        cursor: pointer;
        font-size: 12px;
        color: var(--heading-color);
        font-family: var(--font-family);
      }

      .action-btn:hover {
        background-color: var(--secondary-bg);
      }

      .action-btn.delete {
        border-color: var(--error-color);
        color: var(--error-color);
      }

      .action-btn.delete:hover {
        background-color: #fff2f2;
      }

      .bulk-textarea {
        width: 100%;
        min-height: 120px;
        padding: var(--button-padding);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        font-size: var(--font-size);
        resize: vertical;
        font-family: var(--font-family);
        background-color: var(--primary-bg);
        color: var(--paragraph-color);
      }

      .bulk-textarea:focus {
        border-color: var(--main-accent);
        outline: none;
        box-shadow: 0 0 0 3px rgba(61, 123, 244, 0.15);
      }

      .bulk-results {
        margin-top: 16px;
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
      }

      .bulk-item {
        padding: 12px;
        border-bottom: 1px solid var(--border-color);
        font-size: calc(var(--font-size) - 2px);
        word-break: break-all;
        font-family: var(--font-family);
        color: var(--paragraph-color);
      }

      .bulk-item:last-child {
        border-bottom: none;
      }

      .no-items {
        padding: 20px;
        text-align: center;
        color: var(--secondary-text);
        font-size: var(--font-size);
        font-family: var(--font-family);
      }

      .toggle-switch {
        position: relative;
        display: inline-block;
        width: 44px;
        height: 24px;
        margin-left: 8px;
      }

      .toggle-switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }

      .toggle-slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: var(--border-color);
        transition: .4s;
        border-radius: 24px;
      }

      .toggle-slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
      }

      input:checked + .toggle-slider {
        background-color: var(--main-accent);
      }

      input:checked + .toggle-slider:before {
        transform: translateX(20px);
      }

      .option-row {
        display: flex;
        align-items: center;
        margin-bottom: 12px;
      }

      .option-row span {
        font-size: var(--font-size);
        font-family: var(--font-family);
        color: var(--paragraph-color);
      }
      
      .badge {
        display: inline-block;
        padding: 2px 6px;
        background-color: var(--main-accent);
        color: white;
        border-radius: 12px;
        font-size: 10px;
        margin-left: 8px;
        text-transform: uppercase;
      }
      
      @media (max-width: 600px) {
        .row {
          flex-direction: column;
          gap: 8px;
        }
        
        .actions {
          flex-direction: column;
        }
        
        .copy-btn {
          position: static;
          margin-top: 8px;
          width: 100%;
        }

        .tabs {
          flex-direction: column;
        }

        .tab {
          border-bottom: 1px solid var(--border-color);
          border-left: 3px solid transparent;
        }

        .tab.active {
          border-left-color: var(--main-accent);
          border-bottom-color: var(--border-color);
        }
      }
    `;
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style id="dynamic-styles">
        ${this.getStyles()}
      </style>

      <div class="container">
        <div class="header">
          <h1>UTM Link Builder <span class="badge">Advanced</span></h1>
          <p>Create and track campaign URLs for Google Analytics</p>
        </div>

        <div class="tabs">
          <div class="tab active" data-tab="builder">Builder</div>
          <div class="tab" data-tab="bulk">Bulk Generator</div>
          <div class="tab" data-tab="presets">Saved Presets</div>
          <div class="tab" data-tab="history">History</div>
        </div>

        <div class="tab-content active" id="builder">
          <div class="form-group">
            <label for="url" class="required">Destination URL</label>
            <div class="input-wrapper">
              <input type="text" id="url" placeholder="https://yourdomain.com/landing-page" />
            </div>
            <div class="validation-error" id="url-error"></div>
          </div>

          <div class="row">
            <div class="col">
              <div class="form-group">
                <label for="utm_source" class="required">Campaign Source
                  <div class="tooltip">?
                    <span class="tooltip-text">The referrer source of your traffic (e.g., google, newsletter)</span>
                  </div>
                </label>
                <div class="input-wrapper">
                  <input type="text" id="utm_source" placeholder="google" />
                </div>
                <div class="validation-error" id="source-error"></div>
              </div>
            </div>
            <div class="col">
              <div class="form-group">
                <label for="utm_medium" class="required">Campaign Medium
                  <div class="tooltip">?
                    <span class="tooltip-text">The marketing medium (e.g., cpc, banner, email)</span>
                  </div>
                </label>
                <div class="input-wrapper">
                  <input type="text" id="utm_medium" placeholder="cpc" />
                </div>
                <div class="validation-error" id="medium-error"></div>
              </div>
            </div>
          </div>

          <div class="row">
            <div class="col">
              <div class="form-group">
                <label for="utm_campaign" class="required">Campaign Name
                  <div class="tooltip">?
                    <span class="tooltip-text">The name of your campaign (e.g., summer_sale)</span>
                  </div>
                </label>
                <div class="input-wrapper">
                  <input type="text" id="utm_campaign" placeholder="summer_sale" />
                </div>
                <div class="validation-error" id="campaign-error"></div>
              </div>
            </div>
            <div class="col">
              <div class="form-group">
                <label for="utm_id">Campaign ID
                  <div class="tooltip">?
                    <span class="tooltip-text">The ID of your campaign (for GA4)</span>
                  </div>
                </label>
                <div class="input-wrapper">
                  <input type="text" id="utm_id" placeholder="abc123" />
                </div>
              </div>
            </div>
          </div>

          <div class="row">
            <div class="col">
              <div class="form-group">
                <label for="utm_term">Campaign Term
                  <div class="tooltip">?
                    <span class="tooltip-text">Identify paid keywords (e.g., running+shoes)</span>
                  </div>
                </label>
                <div class="input-wrapper">
                  <input type="text" id="utm_term" placeholder="running+shoes" />
                </div>
              </div>
            </div>
            <div class="col">
              <div class="form-group">
                <label for="utm_content">Campaign Content
                  <div class="tooltip">?
                    <span class="tooltip-text">Differentiate similar content (e.g., logolink, textlink)</span>
                  </div>
                </label>
                <div class="input-wrapper">
                  <input type="text" id="utm_content" placeholder="logolink" />
                </div>
              </div>
            </div>
          </div>

          <div class="options">
            <div class="option-row">
              <span>Shorten URL</span>
              <label class="toggle-switch">
                <input type="checkbox" id="shorten-toggle">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="actions">
            <button id="generate-btn" class="primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
              Generate UTM URL
            </button>
            <button id="save-preset-btn" class="secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              Save as Preset
            </button>
            <button id="clear-btn" class="secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 12H5"/>
                <path d="M12 19V5"/>
              </svg>
              Clear Fields
            </button>
          </div>

          <div class="result" style="display: none;">
            <h3>Your UTM URL</h3>
            <div class="url-preview" id="result-url"></div>
            <button class="copy-btn" id="copy-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copy to Clipboard
            </button>
            <div class="qr-code" id="qr-code"></div>
          </div>
        </div>

        <div class="tab-content" id="bulk">
          <div class="form-group">
            <label for="bulk-urls">URLs (One URL per line)</label>
            <textarea id="bulk-urls" class="bulk-textarea" placeholder="https://yourdomain.com/page1&#10;https://yourdomain.com/page2&#10;https://yourdomain.com/page3"></textarea>
          </div>

          <div class="row">
            <div class="col">
              <div class="form-group">
                <label for="bulk-utm_source" class="required">Campaign Source</label>
                <input type="text" id="bulk-utm_source" placeholder="google" />
                <div class="validation-error" id="bulk-source-error"></div>
              </div>
            </div>
            <div class="col">
              <div class="form-group">
                <label for="bulk-utm_medium" class="required">Campaign Medium</label>
                <input type="text" id="bulk-utm_medium" placeholder="cpc" />
                <div class="validation-error" id="bulk-medium-error"></div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="bulk-utm_campaign" class="required">Campaign Name</label>
            <input type="text" id="bulk-utm_campaign" placeholder="summer_sale" />
            <div class="validation-error" id="bulk-campaign-error"></div>
          </div>

          <div class="actions">
            <button id="bulk-generate-btn" class="primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
              Generate Bulk URLs
            </button>
            <button id="bulk-copy-btn" class="secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copy All Results
            </button>
          </div>

          <div class="bulk-results" style="display: none;">
            <div id="bulk-results-container"></div>
          </div>
        </div>

        <div class="tab-content" id="presets">
          <div id="presets-list"></div>
          <div class="no-items" id="no-presets" style="display: none;">
            You don't have any saved presets yet.
          </div>
        </div>

        <div class="tab-content" id="history">
          <div id="history-list"></div>
          <div class="no-items" id="no-history" style="display: none;">
            Your history is empty.
          </div>
          <div class="actions" style="margin-top: 16px;">
            <button id="clear-history-btn" class="secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
              Clear History
            </button>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    // Tab switching
    const tabs = this.shadowRoot.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.shadowRoot.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        this.shadowRoot.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
        tab.classList.add('active');
        const tabId = tab.getAttribute('data-tab');
        this.shadowRoot.getElementById(tabId).classList.add('active');
      });
    });

    // Generate UTM URL
    const generateBtn = this.shadowRoot.getElementById('generate-btn');
    generateBtn.addEventListener('click', () => this.generateUTM());

    // Save preset
    const savePresetBtn = this.shadowRoot.getElementById('save-preset-btn');
    savePresetBtn.addEventListener('click', () => this.savePreset());

    // Clear fields
    const clearBtn = this.shadowRoot.getElementById('clear-btn');
    clearBtn.addEventListener('click', () => this.clearFields());

    // Copy URL
    const copyBtn = this.shadowRoot.getElementById('copy-btn');
    copyBtn.addEventListener('click', () => this.copyToClipboard());

    // Bulk generate
    const bulkGenerateBtn = this.shadowRoot.getElementById('bulk-generate-btn');
    bulkGenerateBtn.addEventListener('click', () => this.generateBulkUTMs());

    // Bulk copy
    const bulkCopyBtn = this.shadowRoot.getElementById('bulk-copy-btn');
    bulkCopyBtn.addEventListener('click', () => this.copyBulkResults());

    // Clear history
    const clearHistoryBtn = this.shadowRoot.getElementById('clear-history-btn');
    clearHistoryBtn.addEventListener('click', () => this.clearHistory());

    // Render presets and history lists
    this.renderPresets();
    this.renderHistory();
  }

  validateURL(url) {
    if (!url) return "URL is required";
    try {
      new URL(url);
      return null;
    } catch (e) {
      return "Please enter a valid URL";
    }
  }

  validateRequired(value, fieldName) {
    if (!value) return `${fieldName} is required`;
    return null;
  }

  clearValidationErrors() {
    const errorElements = this.shadowRoot.querySelectorAll('.validation-error');
    errorElements.forEach(el => el.textContent = '');
  }

  generateUTM() {
    this.clearValidationErrors();
    
    const url = this.shadowRoot.getElementById('url').value.trim();
    const source = this.shadowRoot.getElementById('utm_source').value.trim();
    const medium = this.shadowRoot.getElementById('utm_medium').value.trim();
    const campaign = this.shadowRoot.getElementById('utm_campaign').value.trim();
    const term = this.shadowRoot.getElementById('utm_term').value.trim();
    const content = this.shadowRoot.getElementById('utm_content').value.trim();
    const id = this.shadowRoot.getElementById('utm_id').value.trim();
    const shouldShorten = this.shadowRoot.getElementById('shorten-toggle').checked;
    
    // Validate required fields
    let hasErrors = false;

    const urlError = this.validateURL(url);
    if (urlError) {
      this.shadowRoot.getElementById('url-error').textContent = urlError;
      hasErrors = true;
    }

    const sourceError = this.validateRequired(source, "Campaign Source");
    if (sourceError) {
      this.shadowRoot.getElementById('source-error').textContent = sourceError;
      hasErrors = true;
    }

    const mediumError = this.validateRequired(medium, "Campaign Medium");
    if (mediumError) {
      this.shadowRoot.getElementById('medium-error').textContent = mediumError;
      hasErrors = true;
    }

    const campaignError = this.validateRequired(campaign, "Campaign Name");
    if (campaignError) {
      this.shadowRoot.getElementById('campaign-error').textContent = campaignError;
      hasErrors = true;
    }

    if (hasErrors) return;

    try {
      // Create URL object to handle parameters properly
      const urlObj = new URL(url);
      
      // Add UTM parameters
      urlObj.searchParams.set('utm_source', source);
      urlObj.searchParams.set('utm_medium', medium);
      urlObj.searchParams.set('utm_campaign', campaign);
      
      if (term) urlObj.searchParams.set('utm_term', term);
      if (content) urlObj.searchParams.set('utm_content', content);
      if (id) urlObj.searchParams.set('utm_id', id);
      
      let finalUrl = urlObj.toString();
      this.isShortened = false;
      
      // Handle URL shortening (we'll simulate this)
      if (shouldShorten) {
        // In a real implementation, you would call a URL shortening service API here
        // For this example, we'll just show a sample shortened URL
        finalUrl = `https://short.link/${Math.random().toString(36).substring(2, 8)}`;
        this.isShortened = true;
      }
      
      // Display the result
      const resultElement = this.shadowRoot.querySelector('.result');
      const resultUrl = this.shadowRoot.getElementById('result-url');
      resultElement.style.display = 'block';
      resultUrl.textContent = finalUrl;
      
      // Generate an actual QR code using Google Charts API
      const qrCode = this.shadowRoot.getElementById('qr-code');
      const encodedUrl = encodeURIComponent(finalUrl);
      qrCode.innerHTML = `
        <div style="width: 160px; background-color: white; border: 1px solid #dfe6e9; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; align-items: center;">
          <div style="margin-bottom: 10px; font-weight: 500; color: var(--secondary-text);">Scan QR Code</div>
          <img src="https://chart.googleapis.com/chart?cht=qr&chl=${encodedUrl}&chs=150x150&choe=UTF-8&chld=L|0" 
               alt="QR code for the generated URL" 
               style="width: 150px; height: 150px;" />
        </div>
      `;
      
      // Add to history
      this.addToHistory(finalUrl, {
        url,
        source,
        medium,
        campaign,
        term,
        content,
        id,
        isShortened: this.isShortened
      });
      
    } catch (error) {
      console.error("Error generating UTM URL:", error);
    }
  }

  generateBulkUTMs() {
    this.clearValidationErrors();
    
    const urls = this.shadowRoot.getElementById('bulk-urls').value.trim().split('\n').filter(Boolean);
    const source = this.shadowRoot.getElementById('bulk-utm_source').value.trim();
    const medium = this.shadowRoot.getElementById('bulk-utm_medium').value.trim();
    const campaign = this.shadowRoot.getElementById('bulk-utm_campaign').value.trim();
    
    // Validate required fields
    let hasErrors = false;
    
    if (urls.length === 0) {
      hasErrors = true;
    }
    
    const sourceError = this.validateRequired(source, "Campaign Source");
    if (sourceError) {
      this.shadowRoot.getElementById('bulk-source-error').textContent = sourceError;
      hasErrors = true;
    }
    
    const mediumError = this.validateRequired(medium, "Campaign Medium");
    if (mediumError) {
      this.shadowRoot.getElementById('bulk-medium-error').textContent = mediumError;
      hasErrors = true;
    }
    
    const campaignError = this.validateRequired(campaign, "Campaign Name");
    if (campaignError) {
      this.shadowRoot.getElementById('bulk-campaign-error').textContent = campaignError;
      hasErrors = true;
    }
    
    if (hasErrors) return;
    
    const resultsContainer = this.shadowRoot.getElementById('bulk-results-container');
    resultsContainer.innerHTML = '';
    
    urls.forEach(url => {
      try {
        // Validate URL
        let urlObj;
        try {
          urlObj = new URL(url);
        } catch (e) {
          resultsContainer.innerHTML += `
            <div class="bulk-item">
              <strong>${url}</strong>: Invalid URL
            </div>
          `;
          return;
        }
        
        // Add UTM parameters
        urlObj.searchParams.set('utm_source', source);
        urlObj.searchParams.set('utm_medium', medium);
        urlObj.searchParams.set('utm_campaign', campaign);
        
        const finalUrl = urlObj.toString();
        
        resultsContainer.innerHTML += `
          <div class="bulk-item">
            ${finalUrl}
          </div>
        `;
      } catch (error) {
        console.error("Error processing URL:", url, error);
      }
    });
    
    this.shadowRoot.querySelector('.bulk-results').style.display = 'block';
  }

  copyToClipboard() {
    const resultUrl = this.shadowRoot.getElementById('result-url').textContent;
    
    navigator.clipboard.writeText(resultUrl)
      .then(() => {
        // Show success notification
        const notification = document.createElement('div');
        notification.className = 'copy-success';
        notification.textContent = 'Copied to clipboard!';
        this.shadowRoot.appendChild(notification);
        
        // Remove notification after animation completes
        setTimeout(() => {
          notification.remove();
        }, 2500);
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
      });
  }

  copyBulkResults() {
    const items = this.shadowRoot.querySelectorAll('.bulk-item');
    const textToCopy = Array.from(items).map(item => item.textContent.trim()).join('\n');
    
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        // Show success notification
        const notification = document.createElement('div');
        notification.className = 'copy-success';
        notification.textContent = 'All URLs copied to clipboard!';
        this.shadowRoot.appendChild(notification);
        
        // Remove notification after animation completes
        setTimeout(() => {
          notification.remove();
        }, 2500);
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
      });
  }

  clearFields() {
    this.shadowRoot.getElementById('url').value = '';
    this.shadowRoot.getElementById('utm_source').value = '';
    this.shadowRoot.getElementById('utm_medium').value = '';
    this.shadowRoot.getElementById('utm_campaign').value = '';
    this.shadowRoot.getElementById('utm_term').value = '';
    this.shadowRoot.getElementById('utm_content').value = '';
    this.shadowRoot.getElementById('utm_id').value = '';
    this.shadowRoot.getElementById('shorten-toggle').checked = false;
    
    this.shadowRoot.querySelector('.result').style.display = 'none';
    this.clearValidationErrors();
  }

  savePreset() {
    const url = this.shadowRoot.getElementById('url').value.trim();
    const source = this.shadowRoot.getElementById('utm_source').value.trim();
    const medium = this.shadowRoot.getElementById('utm_medium').value.trim();
    const campaign = this.shadowRoot.getElementById('utm_campaign').value.trim();
    const term = this.shadowRoot.getElementById('utm_term').value.trim();
    const content = this.shadowRoot.getElementById('utm_content').value.trim();
    const id = this.shadowRoot.getElementById('utm_id').value.trim();
    
    // Validate required fields
    if (!url || !source || !medium || !campaign) {
      alert('Please fill in all required fields before saving a preset.');
      return;
    }
    
    // Prompt for preset name
    const presetName = prompt('Enter a name for this preset:', campaign);
    if (!presetName) return; // User cancelled
    
    const preset = {
      id: Date.now().toString(),
      name: presetName,
      url,
      source,
      medium,
      campaign,
      term,
      content,
      utmId: id, // Using property name 'utmId' to avoid conflict
      createdAt: new Date().toISOString()
    };
    
    this.presets.push(preset);
    this.savePresets();
    this.renderPresets();
    
    // Show success notification
    const notification = document.createElement('div');
    notification.className = 'copy-success';
    notification.textContent = 'Preset saved successfully!';
    this.shadowRoot.appendChild(notification);
    
    // Remove notification after animation completes
    setTimeout(() => {
      notification.remove();
    }, 2500);
  }

  savePresets() {
    try {
      localStorage.setItem('utm-builder-presets', JSON.stringify(this.presets));
    } catch (e) {
      console.warn('Error saving presets to localStorage', e);
    }
  }

  renderPresets() {
    const presetsList = this.shadowRoot.getElementById('presets-list');
    const noPresets = this.shadowRoot.getElementById('no-presets');
    
    if (this.presets.length === 0) {
      presetsList.innerHTML = '';
      noPresets.style.display = 'block';
      return;
    }
    
    noPresets.style.display = 'none';
    presetsList.innerHTML = '';
    
    this.presets.forEach(preset => {
      const presetEl = document.createElement('div');
      presetEl.className = 'preset-item';
      presetEl.innerHTML = `
        <div class="preset-name">${preset.name}</div>
        <div class="preset-url">${preset.url}</div>
        <div class="preset-actions">
          <button class="action-btn load-preset" data-id="${preset.id}">Load</button>
          <button class="action-btn delete delete-preset" data-id="${preset.id}">Delete</button>
        </div>
      `;
      
      presetsList.appendChild(presetEl);
    });
    
    // Add event listeners to buttons
    this.shadowRoot.querySelectorAll('.load-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const presetId = e.target.getAttribute('data-id');
        this.loadPreset(presetId);
      });
    });
    
    this.shadowRoot.querySelectorAll('.delete-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const presetId = e.target.getAttribute('data-id');
        this.deletePreset(presetId);
      });
    });
  }

  loadPreset(presetId) {
    const preset = this.presets.find(p => p.id === presetId);
    if (!preset) return;
    
    // Switch to builder tab
    this.shadowRoot.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    this.shadowRoot.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    this.shadowRoot.querySelector('[data-tab="builder"]').classList.add('active');
    this.shadowRoot.getElementById('builder').classList.add('active');
    
    // Fill in the form fields
    this.shadowRoot.getElementById('url').value = preset.url || '';
    this.shadowRoot.getElementById('utm_source').value = preset.source || '';
    this.shadowRoot.getElementById('utm_medium').value = preset.medium || '';
    this.shadowRoot.getElementById('utm_campaign').value = preset.campaign || '';
    this.shadowRoot.getElementById('utm_term').value = preset.term || '';
    this.shadowRoot.getElementById('utm_content').value = preset.content || '';
    this.shadowRoot.getElementById('utm_id').value = preset.utmId || '';
    
    // Clear any validation errors
    this.clearValidationErrors();
    
    // Hide result section
    this.shadowRoot.querySelector('.result').style.display = 'none';
  }

  deletePreset(presetId) {
    if (!confirm('Are you sure you want to delete this preset?')) return;
    
    this.presets = this.presets.filter(p => p.id !== presetId);
    this.savePresets();
    this.renderPresets();
  }

  addToHistory(utmUrl, data) {
    const historyItem = {
      id: Date.now().toString(),
      url: utmUrl,
      data,
      timestamp: new Date().toISOString()
    };
    
    this.history.unshift(historyItem); // Add to beginning of array
    
    // Limit history to 100 items
    if (this.history.length > 100) {
      this.history = this.history.slice(0, 100);
    }
    
    this.saveHistory();
    this.renderHistory();
  }

  saveHistory() {
    try {
      localStorage.setItem('utm-builder-history', JSON.stringify(this.history));
    } catch (e) {
      console.warn('Error saving history to localStorage', e);
    }
  }

  renderHistory() {
    const historyList = this.shadowRoot.getElementById('history-list');
    const noHistory = this.shadowRoot.getElementById('no-history');
    
    if (this.history.length === 0) {
      historyList.innerHTML = '';
      noHistory.style.display = 'block';
      return;
    }
    
    noHistory.style.display = 'none';
    historyList.innerHTML = '';
    
    this.history.forEach(item => {
      const date = new Date(item.timestamp);
      const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
      
      const historyEl = document.createElement('div');
      historyEl.className = 'history-item';
      historyEl.innerHTML = `
        <div class="history-date">${dateStr}</div>
        <div class="history-url">${item.url}</div>
        <div class="history-actions">
          <button class="action-btn copy-history" data-url="${item.url}">Copy</button>
        </div>
      `;
      
      historyList.appendChild(historyEl);
    });
    
    // Add event listeners to buttons
    this.shadowRoot.querySelectorAll('.copy-history').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const url = e.target.getAttribute('data-url');
        navigator.clipboard.writeText(url)
          .then(() => {
            // Show success notification
            const notification = document.createElement('div');
            notification.className = 'copy-success';
            notification.textContent = 'Copied to clipboard!';
            this.shadowRoot.appendChild(notification);
            
            // Remove notification after animation completes
            setTimeout(() => {
              notification.remove();
            }, 2500);
          })
          .catch(err => {
            console.error('Could not copy text: ', err);
          });
      });
    });
  }

  clearHistory() {
    if (!confirm('Are you sure you want to clear your entire history?')) return;
    
    this.history = [];
    this.saveHistory();
    this.renderHistory();
  }
}

// Register the custom element
customElements.define('utm-link-builder', UTMLinkBuilder);
