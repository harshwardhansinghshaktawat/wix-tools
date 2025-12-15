/**
 * JSON Formatter & Validator - Wix Custom Element with Customization
 * Custom element tag name: wix-json-formatter-validator
 */

class JsonFormatterValidator extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Default settings
    this.settings = {
      primaryBg: '#ffffff',
      secondaryBg: '#f8f9fa',
      borderColor: '#ddd',
      secondaryText: '#777',
      mainAccent: '#3498db',
      hoverAccent: '#2980b9',
      headingColor: '#2c3e50',
      paragraphColor: '#333333',
      fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Open Sans, Helvetica Neue, sans-serif',
      fontSize: 14,
      headingSize: 18,
      borderRadius: 8,
      buttonPadding: 6
    };
    
    // State
    this.darkMode = false;
    this.expandedNodes = new Set();
    this.jsonData = null;
    this.isValid = false;
    this.errorMessage = '';
    this.searchTerm = '';
    this.searchResults = [];
    this.currentSearchIndex = -1;
    
    this.render();
    this.addEventListeners();
  }
  
  static get observedAttributes() {
    return [
      'theme', 'initial-json',
      'primary-bg', 'secondary-bg', 'border-color', 'secondary-text',
      'main-accent', 'hover-accent', 'heading-color', 'paragraph-color',
      'font-family', 'font-size', 'heading-size', 'border-radius', 'button-padding'
    ];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (newValue && newValue !== oldValue) {
      if (name === 'theme') {
        this.darkMode = newValue === 'dark';
        this.updateTheme();
      } else if (name === 'initial-json' && newValue) {
        try {
          const textarea = this.shadowRoot.querySelector('#json-input');
          if (textarea) {
            textarea.value = newValue;
            this.processJsonInput();
          }
        } catch (e) {
          console.error('Error setting initial JSON:', e);
        }
      } else {
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
  }
  
  connectedCallback() {
    if (this.hasAttribute('theme')) {
      this.darkMode = this.getAttribute('theme') === 'dark';
      this.updateTheme();
    }
    
    if (this.hasAttribute('initial-json')) {
      try {
        const initialJson = this.getAttribute('initial-json');
        const textarea = this.shadowRoot.querySelector('#json-input');
        if (textarea) {
          textarea.value = initialJson;
          this.processJsonInput();
        }
      } catch (e) {
        console.error('Error processing initial JSON:', e);
      }
    }
  }
  
  render() {
    this.shadowRoot.innerHTML = `
      <style id="dynamic-styles">
        ${this.getStyles()}
      </style>
      ${this.getHTML()}
    `;
  }

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
        
        --success-color: #2ecc71;
        --error-color: #e74c3c;
        --light-hover: #eee;
        --dark-bg: #1e1e2e;
        --dark-text: #ecf0f1;
        --dark-border: #3d3d5c;
        --dark-hover: #2d2d3d;
        --json-string: #e67e22;
        --json-number: ${this.settings.mainAccent};
        --json-boolean: #9b59b6;
        --json-null: #7f8c8d;
        --json-key: #16a085;
        --dark-json-string: #ff9f43;
        --dark-json-number: #74b9ff;
        --dark-json-boolean: #a29bfe;
        --dark-json-null: #95a5a6;
        --dark-json-key: #55efc4;
        
        display: block;
        font-family: var(--font-family);
        color: var(--paragraph-color);
        background: var(--secondary-bg);
        border-radius: var(--border-radius);
        overflow: hidden;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
        height: 100%;
        min-height: 400px;
      }
      
      :host(.dark-mode) {
        color: var(--dark-text);
        background: var(--dark-bg);
      }
      
      .container {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
      }
      
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        border-bottom: 1px solid var(--border-color);
        background: var(--primary-bg);
      }
      
      :host(.dark-mode) .header {
        border-bottom: 1px solid var(--dark-border);
        background: #2d2d42;
      }
      
      .title {
        font-size: var(--heading-size);
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: var(--font-family);
        color: var(--heading-color);
      }
      
      :host(.dark-mode) .title {
        color: var(--dark-text);
      }
      
      .title svg {
        width: 24px;
        height: 24px;
      }
      
      .controls {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .main {
        display: flex;
        flex: 1;
        overflow: hidden;
      }
      
      .input-section, 
      .output-section {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        position: relative;
      }
      
      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 16px;
        background: var(--secondary-bg);
        border-bottom: 1px solid var(--border-color);
      }
      
      :host(.dark-mode) .panel-header {
        background: var(--dark-hover);
        border-bottom: 1px solid var(--dark-border);
      }
      
      .panel-title {
        font-weight: 500;
        font-size: var(--font-size);
        font-family: var(--font-family);
        color: var(--heading-color);
      }
      
      :host(.dark-mode) .panel-title {
        color: var(--dark-text);
      }
      
      .panel-controls {
        display: flex;
        gap: 8px;
      }
      
      .divider {
        width: 4px;
        background: var(--border-color);
        cursor: col-resize;
      }
      
      :host(.dark-mode) .divider {
        background: var(--dark-border);
      }
      
      #json-input {
        flex: 1;
        padding: 16px;
        border: none;
        outline: none;
        resize: none;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
        font-size: var(--font-size);
        line-height: 1.5;
        white-space: pre;
        overflow: auto;
        background: var(--primary-bg);
        color: var(--paragraph-color);
      }
      
      :host(.dark-mode) #json-input {
        background: #2a2a3a;
        color: var(--dark-text);
      }
      
      .output-container {
        flex: 1;
        overflow: auto;
        position: relative;
      }
      
      .line-numbers {
        position: absolute;
        top: 0;
        left: 0;
        width: 40px;
        height: 100%;
        overflow: hidden;
        background: var(--secondary-bg);
        border-right: 1px solid var(--border-color);
        padding: 16px 8px;
        text-align: right;
        color: var(--secondary-text);
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
        font-size: var(--font-size);
        line-height: 1.5;
        user-select: none;
      }
      
      :host(.dark-mode) .line-numbers {
        background: #252535;
        border-right: 1px solid var(--dark-border);
        color: #999;
      }
      
      #json-output {
        flex: 1;
        padding: 16px 16px 16px 48px;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
        font-size: var(--font-size);
        line-height: 1.5;
        white-space: pre;
        overflow: auto;
        background: var(--primary-bg);
        color: var(--paragraph-color);
      }
      
      :host(.dark-mode) #json-output {
        background: #2a2a3a;
        color: var(--dark-text);
      }
      
      .tree-view {
        padding: 0 0 0 48px;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
        font-size: var(--font-size);
        line-height: 1.5;
      }
      
      .json-string {
        color: var(--json-string);
      }
      
      .json-number {
        color: var(--json-number);
      }
      
      .json-boolean {
        color: var(--json-boolean);
      }
      
      .json-null {
        color: var(--json-null);
      }
      
      .json-key {
        color: var(--json-key);
      }
      
      :host(.dark-mode) .json-string {
        color: var(--dark-json-string);
      }
      
      :host(.dark-mode) .json-number {
        color: var(--dark-json-number);
      }
      
      :host(.dark-mode) .json-boolean {
        color: var(--dark-json-boolean);
      }
      
      :host(.dark-mode) .json-null {
        color: var(--dark-json-null);
      }
      
      :host(.dark-mode) .json-key {
        color: var(--dark-json-key);
      }
      
      .tree-item {
        margin: 2px 0;
        position: relative;
      }
      
      .collapsible > .tree-item-content {
        cursor: pointer;
      }
      
      .expander {
        display: inline-block;
        width: 12px;
        height: 12px;
        text-align: center;
        line-height: 12px;
        margin-right: 4px;
        user-select: none;
        transform: rotate(0deg);
        transition: transform 0.2s;
      }
      
      .collapsed .expander {
        transform: rotate(-90deg);
      }
      
      .collapsed > .tree-children {
        display: none;
      }
      
      .tree-children {
        padding-left: 16px;
        border-left: 1px dotted var(--border-color);
      }
      
      :host(.dark-mode) .tree-children {
        border-left: 1px dotted var(--dark-border);
      }
      
      .search-highlight {
        background-color: rgba(255, 255, 0, 0.3);
      }
      
      :host(.dark-mode) .search-highlight {
        background-color: rgba(255, 255, 0, 0.2);
      }
      
      .current-search {
        background-color: rgba(255, 165, 0, 0.6);
      }
      
      :host(.dark-mode) .current-search {
        background-color: rgba(255, 165, 0, 0.4);
      }
      
      .error-container {
        padding: 16px;
        margin: 16px;
        background-color: #ffecec;
        border-left: 4px solid var(--error-color);
        color: #333;
        border-radius: calc(var(--border-radius) / 2);
        font-size: var(--font-size);
        font-family: var(--font-family);
      }
      
      :host(.dark-mode) .error-container {
        background-color: rgba(231, 76, 60, 0.2);
        color: #ecf0f1;
      }
      
      .error-title {
        font-weight: bold;
        margin-bottom: 8px;
      }
      
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: var(--button-padding) 12px;
        border: none;
        border-radius: calc(var(--border-radius) / 2);
        background: var(--secondary-bg);
        color: var(--paragraph-color);
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        font-size: calc(var(--font-size) - 1px);
        gap: 6px;
        font-family: var(--font-family);
      }
      
      .btn:hover {
        background: var(--border-color);
      }
      
      :host(.dark-mode) .btn {
        background: var(--dark-hover);
        color: var(--dark-text);
      }
      
      :host(.dark-mode) .btn:hover {
        background: var(--dark-border);
      }
      
      .btn svg {
        width: 16px;
        height: 16px;
      }
      
      .btn-primary {
        background: var(--main-accent);
        color: var(--primary-bg);
      }
      
      .btn-primary:hover {
        background: var(--hover-accent);
      }
      
      .search-container {
        display: flex;
        align-items: center;
        padding: 8px 16px;
        background: var(--secondary-bg);
        border-bottom: 1px solid var(--border-color);
      }
      
      :host(.dark-mode) .search-container {
        background: var(--dark-hover);
        border-bottom: 1px solid var(--dark-border);
      }
      
      .search-input {
        flex: 1;
        padding: 6px 12px;
        border: 1px solid var(--border-color);
        border-radius: calc(var(--border-radius) / 2);
        outline: none;
        font-family: var(--font-family);
        background: var(--primary-bg);
        color: var(--paragraph-color);
        font-size: var(--font-size);
      }
      
      :host(.dark-mode) .search-input {
        background: #2a2a3a;
        border: 1px solid var(--dark-border);
        color: var(--dark-text);
      }
      
      .search-results {
        margin: 0 8px;
        color: var(--secondary-text);
        font-size: calc(var(--font-size) - 2px);
        font-family: var(--font-family);
      }
      
      :host(.dark-mode) .search-results {
        color: #999;
      }
      
      .search-nav {
        display: flex;
        gap: 4px;
      }
      
      .search-status {
        color: var(--paragraph-color);
        font-size: calc(var(--font-size) - 2px);
        line-height: 1;
        font-family: var(--font-family);
      }
      
      :host(.dark-mode) .search-status {
        color: var(--dark-text);
      }
      
      .copy-text {
        position: absolute;
        left: -9999px;
        top: -9999px;
      }
      
      .icon-small {
        width: 16px;
        height: 16px;
      }
      
      .status-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 16px;
        font-size: calc(var(--font-size) - 2px);
        background: var(--secondary-bg);
        border-top: 1px solid var(--border-color);
        font-family: var(--font-family);
      }
      
      :host(.dark-mode) .status-bar {
        background: var(--dark-hover);
        border-top: 1px solid var(--dark-border);
      }
      
      .status-info {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      
      .status-valid {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      
      .status-valid.is-valid {
        color: var(--success-color);
      }
      
      .status-valid.is-invalid {
        color: var(--error-color);
      }
      
      .status-size {
        color: var(--secondary-text);
      }
      
      :host(.dark-mode) .status-size {
        color: #999;
      }
      
      .footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 16px;
        font-size: calc(var(--font-size) - 2px);
        background: var(--primary-bg);
        border-top: 1px solid var(--border-color);
        font-family: var(--font-family);
      }
      
      :host(.dark-mode) .footer {
        background: #2d2d42;
        border-top: 1px solid var(--dark-border);
      }
      
      .footer-actions {
        display: flex;
        gap: 8px;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .loading {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(0, 0, 0, 0.1);
        border-top-color: var(--main-accent);
        border-radius: 50%;
        animation: spin 1s infinite linear;
      }
      
      :host(.dark-mode) .loading {
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-top-color: var(--main-accent);
      }
      
      .tooltip {
        position: relative;
      }
      
      .tooltip::after {
        content: attr(data-tooltip);
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        padding: 4px 8px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        border-radius: calc(var(--border-radius) / 2);
        font-size: calc(var(--font-size) - 2px);
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s;
      }
      
      .tooltip:hover::after {
        opacity: 1;
      }

      @media (max-width: 768px) {
        .main {
          flex-direction: column;
        }

        .divider {
          height: 4px;
          width: 100%;
          cursor: row-resize;
        }

        .controls {
          flex-wrap: wrap;
        }
      }
    `;
  }

  getHTML() {
    return `
      <div class="container">
        <div class="header">
          <div class="title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 6v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              <polyline points="7 14 12 9 17 14"></polyline>
            </svg>
            JSON Formatter & Validator
          </div>
          <div class="controls">
            <button id="clear-btn" class="btn" data-tooltip="Clear All">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              Clear
            </button>
            <button id="sample-btn" class="btn" data-tooltip="Load Sample JSON">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              Sample
            </button>
            <button id="theme-toggle" class="btn" data-tooltip="Toggle Theme">
              <svg id="light-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
              <svg id="dark-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: none;">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="main">
          <div class="input-section">
            <div class="panel-header">
              <div class="panel-title">JSON Input</div>
              <div class="panel-controls">
                <button id="format-btn" class="btn btn-primary">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="16 3 21 3 21 8"></polyline>
                    <line x1="4" y1="20" x2="21" y2="3"></line>
                    <path d="M21 16v5h-5"></path>
                    <line x1="15" y1="15" x2="21" y2="21"></line>
                    <line x1="4" y1="4" x2="9" y2="9"></line>
                  </svg>
                  Format & Validate
                </button>
              </div>
            </div>
            <textarea id="json-input" placeholder="Paste your JSON here..."></textarea>
          </div>
          
          <div class="divider" id="divider"></div>
          
          <div class="output-section">
            <div class="panel-header">
              <div class="panel-title">Formatted JSON</div>
              <div class="panel-controls">
                <button id="copy-btn" class="btn" data-tooltip="Copy to Clipboard">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  Copy
                </button>
                <button id="download-btn" class="btn" data-tooltip="Download JSON">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Download
                </button>
                <button id="view-toggle" class="btn" data-tooltip="Toggle View">
                  <svg id="tree-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="17" y1="7" x2="7" y2="7"></line>
                    <line x1="17" y1="11" x2="7" y2="11"></line>
                    <line x1="17" y1="15" x2="7" y2="15"></line>
                  </svg>
                  <svg id="code-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: none;">
                    <polyline points="16 18 22 12 16 6"></polyline>
                    <polyline points="8 6 2 12 8 18"></polyline>
                  </svg>
                </button>
              </div>
            </div>
            
            <div class="search-container">
              <input type="text" id="search-input" class="search-input" placeholder="Search in JSON...">
              <span class="search-results" id="search-results"></span>
              <div class="search-nav">
                <button id="prev-search" class="btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-small">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                <button id="next-search" class="btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-small">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
                <button id="clear-search" class="btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-small">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
            
            <div class="output-container">
              <div class="line-numbers" id="line-numbers"></div>
              <div id="json-output"></div>
              <div id="tree-view" class="tree-view" style="display: none;"></div>
            </div>
            
            <div class="status-bar">
              <div class="status-info">
                <div class="status-valid" id="status-valid">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-small">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  Waiting for input...
                </div>
                <div class="status-size" id="status-size"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <div>JSON Formatter & Validator</div>
          <div class="footer-actions">
            <button id="collapse-all-btn" class="btn">Collapse All</button>
            <button id="expand-all-btn" class="btn">Expand All</button>
          </div>
        </div>
      </div>
      
      <div id="copy-text" class="copy-text"></div>
    `;
  }

  updateStyles() {
    const styleElement = this.shadowRoot.querySelector('#dynamic-styles');
    if (styleElement) {
      styleElement.textContent = this.getStyles();
    }
  }
  
  addEventListeners() {
    // Format & Validate button
    this.shadowRoot.querySelector('#format-btn').addEventListener('click', () => {
      this.processJsonInput();
    });
    
    // Input field (auto-format on paste)
    const jsonInput = this.shadowRoot.querySelector('#json-input');
    jsonInput.addEventListener('paste', () => {
      setTimeout(() => this.processJsonInput(), 0);
    });
    
    // Clear button
    this.shadowRoot.querySelector('#clear-btn').addEventListener('click', () => {
      this.shadowRoot.querySelector('#json-input').value = '';
      this.shadowRoot.querySelector('#json-output').innerHTML = '';
      this.shadowRoot.querySelector('#tree-view').innerHTML = '';
      this.shadowRoot.querySelector('#line-numbers').innerHTML = '';
      this.shadowRoot.querySelector('#status-valid').innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-small">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
        Waiting for input...
      `;
      this.shadowRoot.querySelector('#status-valid').className = 'status-valid';
      this.shadowRoot.querySelector('#status-size').textContent = '';
      this.jsonData = null;
      this.isValid = false;
    });
    
    // Sample button
    this.shadowRoot.querySelector('#sample-btn').addEventListener('click', () => {
      const sampleJson = {
        "glossary": {
          "title": "example glossary",
          "GlossDiv": {
            "title": "S",
            "GlossList": {
              "GlossEntry": {
                "ID": "SGML",
                "SortAs": "SGML",
                "GlossTerm": "Standard Generalized Markup Language",
                "Acronym": "SGML",
                "Abbrev": "ISO 8879:1986",
                "GlossDef": {
                  "para": "A meta-markup language, used to create markup languages such as DocBook.",
                  "GlossSeeAlso": ["GML", "XML"]
                },
                "GlossSee": "markup"
              }
            }
          }
        },
        "numbers": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        "boolean": true,
        "null": null,
        "nestedArray": [
          ["a", "b", "c"],
          [1, 2, 3],
          [true, false, null]
        ]
      };
      
      this.shadowRoot.querySelector('#json-input').value = JSON.stringify(sampleJson);
      this.processJsonInput();
    });
    
    // Theme toggle
    this.shadowRoot.querySelector('#theme-toggle').addEventListener('click', () => {
      this.darkMode = !this.darkMode;
      this.updateTheme();
      
      this.dispatchEvent(new CustomEvent('themeChanged', {
        detail: { theme: this.darkMode ? 'dark' : 'light' },
        bubbles: true,
        composed: true
      }));
    });
    
    // Copy button
    this.shadowRoot.querySelector('#copy-btn').addEventListener('click', () => {
      if (this.jsonData) {
        const formattedJson = JSON.stringify(this.jsonData, null, 2);
        this.copyToClipboard(formattedJson);
        
        const copyBtn = this.shadowRoot.querySelector('#copy-btn');
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Copied!
        `;
        
        setTimeout(() => {
          copyBtn.innerHTML = originalText;
        }, 2000);
      }
    });
    
    // Download button
    this.shadowRoot.querySelector('#download-btn').addEventListener('click', () => {
      if (this.jsonData) {
        const formattedJson = JSON.stringify(this.jsonData, null, 2);
        const blob = new Blob([formattedJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'formatted.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    });
    
    // View toggle (Tree/Code)
    this.shadowRoot.querySelector('#view-toggle').addEventListener('click', () => {
      const treeView = this.shadowRoot.querySelector('#tree-view');
      const jsonOutput = this.shadowRoot.querySelector('#json-output');
      const treeIcon = this.shadowRoot.querySelector('#tree-icon');
      const codeIcon = this.shadowRoot.querySelector('#code-icon');
      
      if (treeView.style.display === 'none') {
        treeView.style.display = 'block';
        jsonOutput.style.display = 'none';
        treeIcon.style.display = 'none';
        codeIcon.style.display = 'inline-block';
      } else {
        treeView.style.display = 'none';
        jsonOutput.style.display = 'block';
        treeIcon.style.display = 'inline-block';
        codeIcon.style.display = 'none';
      }
    });
    
    // Search functionality
    const searchInput = this.shadowRoot.querySelector('#search-input');
    searchInput.addEventListener('input', () => {
      this.searchTerm = searchInput.value.trim();
      this.performSearch();
    });
    
    this.shadowRoot.querySelector('#prev-search').addEventListener('click', () => {
      this.navigateSearch(-1);
    });
    
    this.shadowRoot.querySelector('#next-search').addEventListener('click', () => {
      this.navigateSearch(1);
    });
    
    this.shadowRoot.querySelector('#clear-search').addEventListener('click', () => {
      searchInput.value = '';
      this.searchTerm = '';
      this.performSearch();
    });
    
    // Collapse/Expand All buttons
    this.shadowRoot.querySelector('#collapse-all-btn').addEventListener('click', () => {
      this.expandedNodes.clear();
      this.updateTreeView();
    });
    
    this.shadowRoot.querySelector('#expand-all-btn').addEventListener('click', () => {
      const allNodes = this.shadowRoot.querySelectorAll('.tree-item.collapsible');
      allNodes.forEach(node => {
        const path = node.dataset.path;
        if (path) {
          this.expandedNodes.add(path);
        }
      });
      this.updateTreeView();
    });
    
    // Resizable panels
    const divider = this.shadowRoot.querySelector('#divider');
    let isDragging = false;
    
    divider.addEventListener('mousedown', (e) => {
      isDragging = true;
      e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const container = this.shadowRoot.querySelector('.main');
      const inputSection = this.shadowRoot.querySelector('.input-section');
      const outputSection = this.shadowRoot.querySelector('.output-section');
      
      const containerRect = container.getBoundingClientRect();
      const percentage = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      
      if (percentage > 20 && percentage < 80) {
        inputSection.style.flex = `0 0 ${percentage}%`;
        outputSection.style.flex = `0 0 ${100 - percentage}%`;
      }
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }
  
  processJsonInput() {
    const jsonInput = this.shadowRoot.querySelector('#json-input').value.trim();
    const statusValid = this.shadowRoot.querySelector('#status-valid');
    const statusSize = this.shadowRoot.querySelector('#status-size');
    
    if (!jsonInput) {
      statusValid.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-small">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
        Waiting for input...
      `;
      statusValid.className = 'status-valid';
      statusSize.textContent = '';
      this.shadowRoot.querySelector('#json-output').innerHTML = '';
      this.shadowRoot.querySelector('#tree-view').innerHTML = '';
      this.shadowRoot.querySelector('#line-numbers').innerHTML = '';
      this.jsonData = null;
      this.isValid = false;
      return;
    }
    
    try {
      this.jsonData = JSON.parse(jsonInput);
      this.isValid = true;
      
      statusValid.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-small">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        Valid JSON
      `;
      statusValid.className = 'status-valid is-valid';
      
      const bytes = new TextEncoder().encode(jsonInput).length;
      let sizeText = '';
      
      if (bytes < 1024) {
        sizeText = `${bytes} bytes`;
      } else if (bytes < 1048576) {
        sizeText = `${(bytes / 1024).toFixed(2)} KB`;
      } else {
        sizeText = `${(bytes / 1048576).toFixed(2)} MB`;
      }
      
      statusSize.textContent = `Size: ${sizeText}`;
      
      const formattedJson = JSON.stringify(this.jsonData, null, 2);
      this.displayFormattedJson(formattedJson);
      this.buildTreeView(this.jsonData);
      
      const errorContainer = this.shadowRoot.querySelector('.error-container');
      if (errorContainer) {
        errorContainer.remove();
      }
      
      if (this.searchTerm) {
        this.performSearch();
      }
      
      this.dispatchEvent(new CustomEvent('jsonValidated', {
        detail: { 
          isValid: true,
          json: this.jsonData
        },
        bubbles: true,
        composed: true
      }));
      
    } catch (error) {
      this.isValid = false;
      this.jsonData = null;
      
      statusValid.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-small">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
        Invalid JSON
      `;
      statusValid.className = 'status-valid is-invalid';
      
      const outputContainer = this.shadowRoot.querySelector('.output-container');
      let errorContainer = this.shadowRoot.querySelector('.error-container');
      
      if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.className = 'error-container';
        outputContainer.prepend(errorContainer);
      }
      
      const errorMsg = error.message;
      let lineNumber = 1;
      let columnNumber = 0;
      
      const posMatch = errorMsg.match(/position\s+(\d+)/i);
      if (posMatch) {
        const position = parseInt(posMatch[1], 10);
        const lines = jsonInput.substring(0, position).split('\n');
        lineNumber = lines.length;
        columnNumber = lines[lines.length - 1].length + 1;
      }
      
      errorContainer.innerHTML = `
        <div class="error-title">Error: JSON Validation Failed</div>
        <div class="error-message">${error.message}</div>
        <div class="error-location">Line: ${lineNumber}, Column: ${columnNumber}</div>
      `;
      
      this.shadowRoot.querySelector('#json-output').innerHTML = '';
      this.shadowRoot.querySelector('#tree-view').innerHTML = '';
      
      this.displayLineNumbers(jsonInput);
      
      this.dispatchEvent(new CustomEvent('jsonValidated', {
        detail: { 
          isValid: false,
          error: error.message,
          line: lineNumber,
          column: columnNumber
        },
        bubbles: true,
        composed: true
      }));
    }
  }
  
  displayFormattedJson(formattedJson) {
    const jsonOutput = this.shadowRoot.querySelector('#json-output');
    const lines = formattedJson.split('\n');
    
    let highlightedHtml = '';
    
    for (const line of lines) {
      const highlightedLine = line.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, 
        match => {
          let cls = 'json-number';
          if (/^"/.test(match)) {
            if (/:$/.test(match)) {
              cls = 'json-key';
              match = match.replace(/:$/, '') + ':';
            } else {
              cls = 'json-string';
            }
          } else if (/true|false/.test(match)) {
            cls = 'json-boolean';
          } else if (/null/.test(match)) {
            cls = 'json-null';
          }
          return `<span class="${cls}">${match}</span>`;
        }
      );
      
      highlightedHtml += highlightedLine + '\n';
    }
    
    jsonOutput.innerHTML = highlightedHtml;
    
    this.displayLineNumbers(formattedJson);
  }
  
  displayLineNumbers(text) {
    const lineNumbers = this.shadowRoot.querySelector('#line-numbers');
    const lines = text.split('\n');
    
    let html = '';
    for (let i = 1; i <= lines.length; i++) {
      html += i + '<br>';
    }
    
    lineNumbers.innerHTML = html;
  }
  
  buildTreeView(data, path = '') {
    const treeView = this.shadowRoot.querySelector('#tree-view');
    treeView.innerHTML = '';
    
    const rootNode = this.createTreeNode(data, path);
    treeView.appendChild(rootNode);
    
    const collapsibleNodes = treeView.querySelectorAll('.collapsible > .tree-item-content');
    collapsibleNodes.forEach(node => {
      node.addEventListener('click', (e) => {
        const treeItem = e.currentTarget.parentNode;
        const itemPath = treeItem.dataset.path;
        
        if (this.expandedNodes.has(itemPath)) {
          this.expandedNodes.delete(itemPath);
        } else {
          this.expandedNodes.add(itemPath);
        }
        
        this.updateTreeView();
        e.stopPropagation();
      });
    });
  }
  
  createTreeNode(data, path) {
    const treeItem = document.createElement('div');
    treeItem.className = 'tree-item';
    
    if (typeof data === 'object' && data !== null) {
      treeItem.classList.add('collapsible');
      treeItem.dataset.path = path;
      
      const isExpanded = this.expandedNodes.has(path);
      if (!isExpanded) {
        treeItem.classList.add('collapsed');
      }
      
      const isArray = Array.isArray(data);
      const itemCount = isArray ? data.length : Object.keys(data).length;
      
      const treeItemContent = document.createElement('div');
      treeItemContent.className = 'tree-item-content';
      
      const expander = document.createElement('span');
      expander.className = 'expander';
      expander.textContent = '▼';
      treeItemContent.appendChild(expander);
      
      if (isArray) {
        treeItemContent.innerHTML += `<span>Array[<span class="json-number">${itemCount}</span>]</span>`;
      } else {
        treeItemContent.innerHTML += `<span>Object{<span class="json-number">${itemCount}</span>}</span>`;
      }
      
      treeItem.appendChild(treeItemContent);
      
      const treeChildren = document.createElement('div');
      treeChildren.className = 'tree-children';
      
      if (isArray) {
        data.forEach((item, index) => {
          const childPath = path ? `${path}[${index}]` : `[${index}]`;
          const childContainer = document.createElement('div');
          childContainer.className = 'tree-item-container';
          
          const keySpan = document.createElement('span');
          keySpan.className = 'json-key';
          keySpan.textContent = `${index}: `;
          childContainer.appendChild(keySpan);
          
          const childNode = this.createTreeNode(item, childPath);
          childContainer.appendChild(childNode);
          treeChildren.appendChild(childContainer);
        });
      } else {
        Object.entries(data).forEach(([key, value]) => {
          const childPath = path ? `${path}.${key}` : key;
          const childContainer = document.createElement('div');
          childContainer.className = 'tree-item-container';
          
          const keySpan = document.createElement('span');
          keySpan.className = 'json-key';
          keySpan.textContent = `"${key}": `;
          childContainer.appendChild(keySpan);
          
          const childNode = this.createTreeNode(value, childPath);
          childContainer.appendChild(childNode);
          treeChildren.appendChild(childContainer);
        });
      }
      
      treeItem.appendChild(treeChildren);
    } else {
      if (typeof data === 'string') {
        treeItem.innerHTML = `<span class="json-string">"${this.escapeHTML(data)}"</span>`;
      } else if (typeof data === 'number') {
        treeItem.innerHTML = `<span class="json-number">${data}</span>`;
      } else if (typeof data === 'boolean') {
        treeItem.innerHTML = `<span class="json-boolean">${data}</span>`;
      } else if (data === null) {
        treeItem.innerHTML = `<span class="json-null">null</span>`;
      } else {
        treeItem.textContent = String(data);
      }
    }
    
    return treeItem;
  }
  
  updateTreeView() {
    const treeItems = this.shadowRoot.querySelectorAll('.tree-item.collapsible');
    
    treeItems.forEach(item => {
      const path = item.dataset.path;
      if (this.expandedNodes.has(path)) {
        item.classList.remove('collapsed');
      } else {
        item.classList.add('collapsed');
      }
    });
  }
  
  updateTheme() {
    if (this.darkMode) {
      this.classList.add('dark-mode');
      this.shadowRoot.querySelector('#light-icon').style.display = 'none';
      this.shadowRoot.querySelector('#dark-icon').style.display = 'inline-block';
    } else {
      this.classList.remove('dark-mode');
      this.shadowRoot.querySelector('#light-icon').style.display = 'inline-block';
      this.shadowRoot.querySelector('#dark-icon').style.display = 'none';
    }
  }
  
  performSearch() {
    this.clearSearchHighlights();
    
    if (!this.searchTerm || !this.jsonData) {
      this.shadowRoot.querySelector('#search-results').textContent = '';
      this.searchResults = [];
      this.currentSearchIndex = -1;
      return;
    }
    
    const jsonString = JSON.stringify(this.jsonData, null, 2);
    
    this.searchResults = [];
    let match;
    const regex = new RegExp(this.escapeRegExp(this.searchTerm), 'gi');
    
    while ((match = regex.exec(jsonString)) !== null) {
      this.searchResults.push({
        index: match.index,
        length: this.searchTerm.length
      });
    }
    
    const resultsCount = this.shadowRoot.querySelector('#search-results');
    if (this.searchResults.length > 0) {
      resultsCount.textContent = `${this.searchResults.length} results`;
      this.currentSearchIndex = 0;
      this.highlightSearchResults();
    } else {
      resultsCount.textContent = 'No results';
      this.currentSearchIndex = -1;
    }
  }
  
  navigateSearch(direction) {
    if (this.searchResults.length === 0) return;
    
    this.currentSearchIndex = (this.currentSearchIndex + direction + this.searchResults.length) % this.searchResults.length;
    this.highlightSearchResults();
  }
  
  highlightSearchResults() {
    this.clearSearchHighlights();
    
    if (this.searchResults.length === 0) return;
    
    const jsonOutput = this.shadowRoot.querySelector('#json-output');
    const jsonText = jsonOutput.textContent;
    
    let html = '';
    let lastIndex = 0;
    
    for (let i = 0; i < this.searchResults.length; i++) {
      const result = this.searchResults[i];
      const isCurrent = i === this.currentSearchIndex;
      
      html += this.escapeHTML(jsonText.substring(lastIndex, result.index));
      
      const highlightClass = isCurrent ? 'search-highlight current-search' : 'search-highlight';
      html += `<span class="${highlightClass}">${this.escapeHTML(jsonText.substring(result.index, result.index + result.length))}</span>`;
      
      lastIndex = result.index + result.length;
    }
    
    html += this.escapeHTML(jsonText.substring(lastIndex));
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    jsonOutput.innerHTML = doc.body.innerHTML;
    
    if (this.currentSearchIndex >= 0) {
      const currentMatch = jsonOutput.querySelector('.current-search');
      if (currentMatch) {
        currentMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }
  
  clearSearchHighlights() {
    const jsonOutput = this.shadowRoot.querySelector('#json-output');
    const highlightedText = jsonOutput.innerHTML;
    
    const cleanText = highlightedText.replace(/<span class="search-highlight( current-search)?">([^<]+)<\/span>/g, '$2');
    jsonOutput.innerHTML = cleanText;
  }
  
  copyToClipboard(text) {
    const copyText = this.shadowRoot.querySelector('#copy-text');
    copyText.textContent = text;
    
    const range = document.createRange();
    range.selectNode(copyText);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    document.execCommand('copy');
    window.getSelection().removeAllRanges();
  }
  
  escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

customElements.define('wix-json-formatter-validator', JsonFormatterValidator);
