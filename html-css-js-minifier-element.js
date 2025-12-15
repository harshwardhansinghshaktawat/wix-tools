/**
 * HTML/CSS/JS Minifier Custom Element for Wix with Customization
 * Filename: html-css-js-minifier-element.js
 * Custom Element Tag: wix-code-minifier
 */

class CodeMinifierElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Default settings
    this.settings = {
      primaryBg: '#ffffff',
      secondaryBg: '#f9fbfd',
      borderColor: 'rgba(0, 0, 0, 0.1)',
      secondaryText: '#5a6a85',
      mainAccent: '#5d87ff',
      hoverAccent: '#4a75e6',
      headingColor: '#2a3547',
      paragraphColor: '#333333',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      fontSize: 14,
      headingSize: 24,
      borderRadius: 12,
      buttonPadding: 8
    };
    
    // Initialize state
    this.state = {
      activeTab: 'html',
      inputCode: '',
      outputCode: '',
      minificationLevel: 'normal',
      preserveComments: false,
      preserveLineBreaks: false
    };

    this.renderElement();
    this.setupEventListeners();
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

  renderElement() {
    this.shadowRoot.innerHTML = `
      <style id="dynamic-styles">
        ${this.getStyles()}
      </style>

      <div class="minifier-container">
        <div class="header">
          <div class="logo">
            <div class="logo-icon">M</div>
            <h2>Code Minifier</h2>
          </div>
        </div>

        <div class="tab-selector">
          <div class="tab active" data-tab="html">HTML</div>
          <div class="tab" data-tab="css">CSS</div>
          <div class="tab" data-tab="js">JavaScript</div>
        </div>

        <div class="content">
          <div class="file-dropzone">
            <div class="dropzone-icon">📁</div>
            <p>Drag & drop your file here or <strong>browse</strong></p>
            <input type="file" class="file-input" accept=".html,.css,.js,.txt">
          </div>

          <div class="settings-panel">
            <h3 class="settings-title">Minification Options</h3>
            <div class="settings-grid">
              <div class="setting-group">
                <h4>Minification Level</h4>
                <div class="option-group">
                  <label class="radio-option">
                    <input type="radio" name="minification-level" value="safe" checked>
                    <span>Safe</span>
                  </label>
                  <label class="radio-option">
                    <input type="radio" name="minification-level" value="normal">
                    <span>Normal</span>
                  </label>
                  <label class="radio-option">
                    <input type="radio" name="minification-level" value="aggressive">
                    <span>Aggressive</span>
                  </label>
                </div>
              </div>

              <div class="setting-group">
                <h4>Preservation Options</h4>
                <div class="option-group" style="flex-direction: column;">
                  <label class="checkbox-option">
                    <input type="checkbox" name="preserve-comments">
                    <span>Preserve important comments</span>
                  </label>
                  <label class="checkbox-option">
                    <input type="checkbox" name="preserve-line-breaks">
                    <span>Preserve line breaks</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div class="code-panels">
            <div class="panel">
              <div class="panel-header">
                <h3 class="panel-title">Input Code</h3>
                <div class="panel-actions">
                  <button class="btn btn-secondary btn-sm" id="clear-input">
                    Clear
                  </button>
                </div>
              </div>
              <div class="textarea-wrapper">
                <div class="line-numbers" id="input-line-numbers"></div>
                <textarea class="code-editor with-line-numbers" id="input-code" placeholder="Paste or write your code here..."></textarea>
              </div>
            </div>

            <div class="panel">
              <div class="panel-header">
                <h3 class="panel-title">Minified Output</h3>
                <div class="panel-actions">
                  <button class="btn btn-secondary btn-sm" id="copy-output">
                    Copy
                  </button>
                  <button class="btn btn-success btn-sm" id="download-output">
                    Download
                  </button>
                </div>
              </div>
              <div class="textarea-wrapper">
                <div class="line-numbers" id="output-line-numbers"></div>
                <textarea class="code-editor with-line-numbers" id="output-code" placeholder="Minified code will appear here..." readonly></textarea>
              </div>
            </div>
          </div>

          <div class="status-bar">
            <div class="status-info">
              <div class="stat">
                <div class="stat-value" id="original-size">0 KB</div>
                <div class="stat-label">Original Size</div>
              </div>
              <div class="stat">
                <div class="stat-value" id="minified-size">0 KB</div>
                <div class="stat-label">Minified Size</div>
              </div>
              <div class="stat">
                <div class="stat-value" id="compression-ratio">0%</div>
                <div class="stat-label">Compression</div>
              </div>
            </div>

            <div class="controls">
              <div class="loading" id="loading-indicator">
                <div class="spinner"></div>
                <span>Processing...</span>
              </div>
              <button class="btn btn-primary" id="minify-btn">Minify Now</button>
            </div>
          </div>
        </div>
      </div>

      <div class="notification" id="notification"></div>
    `;
  }

  getStyles() {
    return `
      :host {
        display: block;
        font-family: ${this.settings.fontFamily};
        color: ${this.settings.paragraphColor};
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
        --success-color: #13deb9;
        --error-color: #fc4b6c;
        --shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
      }

      .minifier-container {
        background-color: var(--secondary-bg);
        border-radius: var(--border-radius);
        overflow: hidden;
        box-shadow: var(--shadow);
        min-height: 600px;
        display: flex;
        flex-direction: column;
        border: 1px solid var(--border-color);
      }

      .header {
        background: linear-gradient(135deg, var(--main-accent), var(--hover-accent));
        color: var(--primary-bg);
        padding: 20px 25px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .header h2 {
        margin: 0;
        font-weight: 600;
        font-size: var(--heading-size);
        font-family: var(--font-family);
      }

      .logo {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .logo-icon {
        width: 36px;
        height: 36px;
        background-color: var(--primary-bg);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--main-accent);
        font-weight: bold;
        font-size: 18px;
        font-family: var(--font-family);
      }

      .tab-selector {
        background-color: var(--primary-bg);
        display: flex;
        padding: 12px 25px;
        border-bottom: 1px solid var(--border-color);
      }

      .tab {
        padding: calc(var(--button-padding) + 2px) 20px;
        cursor: pointer;
        border-radius: calc(var(--border-radius) / 2);
        margin-right: 10px;
        font-weight: 500;
        transition: all 0.2s ease;
        font-size: var(--font-size);
        font-family: var(--font-family);
        color: var(--paragraph-color);
        background-color: transparent;
      }

      .tab.active {
        background-color: var(--main-accent);
        color: var(--primary-bg);
      }

      .tab:hover:not(.active) {
        background-color: var(--secondary-bg);
      }

      .content {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        padding: 25px;
        background-color: var(--primary-bg);
      }

      .code-panels {
        display: flex;
        gap: 25px;
        margin-bottom: 20px;
        flex-grow: 1;
      }

      .panel {
        flex: 1;
        display: flex;
        flex-direction: column;
        border-radius: calc(var(--border-radius) / 1.5);
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        border: 1px solid var(--border-color);
      }

      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background-color: var(--secondary-bg);
        border-bottom: 1px solid var(--border-color);
      }

      .panel-title {
        font-weight: 600;
        color: var(--heading-color);
        margin: 0;
        font-size: calc(var(--font-size) + 2px);
        font-family: var(--font-family);
      }

      .panel-actions {
        display: flex;
        gap: 8px;
      }

      .btn {
        border: none;
        border-radius: calc(var(--border-radius) / 2);
        padding: var(--button-padding) 12px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        font-size: calc(var(--font-size) - 1px);
        font-family: var(--font-family);
      }

      .btn-sm {
        padding: 5px 10px;
        font-size: calc(var(--font-size) - 2px);
      }

      .btn-primary {
        background-color: var(--main-accent);
        color: var(--primary-bg);
      }

      .btn-secondary {
        background-color: var(--secondary-bg);
        color: var(--heading-color);
        border: 1px solid var(--border-color);
      }

      .btn-success {
        background-color: var(--success-color);
        color: var(--primary-bg);
      }

      .btn-primary:hover {
        background-color: var(--hover-accent);
      }

      .btn-secondary:hover {
        background-color: var(--border-color);
      }

      .btn-success:hover {
        background-color: #10c6a9;
      }

      .textarea-wrapper {
        position: relative;
        flex-grow: 1;
        height: 100%;
        min-height: 300px;
      }

      .code-editor {
        width: 100%;
        height: 100%;
        min-height: 300px;
        border: none;
        padding: 16px;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: var(--font-size);
        line-height: 1.5;
        resize: none;
        color: var(--paragraph-color);
        background-color: var(--secondary-bg);
        outline: none;
        box-sizing: border-box;
      }

      .settings-panel {
        background-color: var(--secondary-bg);
        border-radius: calc(var(--border-radius) / 1.5);
        padding: 16px 20px;
        margin-bottom: 20px;
        border: 1px solid var(--border-color);
      }

      .settings-title {
        font-size: calc(var(--font-size) + 2px);
        font-weight: 600;
        margin: 0 0 12px 0;
        color: var(--heading-color);
        font-family: var(--font-family);
      }

      .settings-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
      }

      .setting-group {
        flex: 1;
        min-width: 200px;
      }

      .setting-group h4 {
        margin: 0 0 8px 0;
        font-size: calc(var(--font-size) - 1px);
        color: var(--secondary-text);
        font-weight: 500;
        font-family: var(--font-family);
      }

      .option-group {
        display: flex;
        gap: 8px;
      }

      .radio-option {
        display: flex;
        align-items: center;
        margin-right: 16px;
        cursor: pointer;
      }

      .radio-option input {
        margin-right: 5px;
        cursor: pointer;
        accent-color: var(--main-accent);
      }

      .checkbox-option {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
        cursor: pointer;
      }

      .checkbox-option input {
        margin-right: 5px;
        cursor: pointer;
        accent-color: var(--main-accent);
      }

      .checkbox-option label, .radio-option label {
        font-size: calc(var(--font-size) - 1px);
        color: var(--paragraph-color);
        font-family: var(--font-family);
      }

      .checkbox-option span, .radio-option span {
        font-size: calc(var(--font-size) - 1px);
        color: var(--paragraph-color);
        font-family: var(--font-family);
      }

      .status-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 20px;
        background-color: var(--secondary-bg);
        border-radius: calc(var(--border-radius) / 1.5);
        border: 1px solid var(--border-color);
      }

      .status-info {
        display: flex;
        gap: 16px;
      }

      .stat {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .stat-value {
        font-size: calc(var(--font-size) + 6px);
        font-weight: 600;
        color: var(--main-accent);
        font-family: var(--font-family);
      }

      .stat-label {
        font-size: calc(var(--font-size) - 2px);
        color: var(--secondary-text);
        font-family: var(--font-family);
      }

      .loading {
        display: none;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .loading.active {
        display: flex;
      }

      .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid var(--secondary-bg);
        border-top: 2px solid var(--main-accent);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      .file-dropzone {
        border: 2px dashed var(--border-color);
        border-radius: calc(var(--border-radius) / 1.5);
        padding: 24px;
        text-align: center;
        transition: all 0.2s;
        margin-bottom: 20px;
        background-color: var(--secondary-bg);
        cursor: pointer;
      }

      .file-dropzone:hover, .file-dropzone.drag-over {
        border-color: var(--main-accent);
        background-color: var(--primary-bg);
      }

      .file-dropzone p {
        margin: 0;
        color: var(--secondary-text);
        font-size: var(--font-size);
        font-family: var(--font-family);
      }

      .file-dropzone strong {
        color: var(--main-accent);
      }

      .dropzone-icon {
        font-size: 24px;
        color: var(--main-accent);
        margin-bottom: 8px;
      }

      .file-input {
        display: none;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: calc(var(--border-radius) / 1.5);
        color: var(--primary-bg);
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateY(100px);
        opacity: 0;
        transition: all 0.3s ease;
        font-size: var(--font-size);
        font-family: var(--font-family);
      }

      .notification.success {
        background-color: var(--success-color);
      }

      .notification.error {
        background-color: var(--error-color);
      }

      .notification.show {
        transform: translateY(0);
        opacity: 1;
      }

      .line-numbers {
        position: absolute;
        left: 0;
        top: 0;
        width: 40px;
        height: 100%;
        padding: 16px 8px;
        text-align: right;
        background-color: var(--primary-bg);
        border-right: 1px solid var(--border-color);
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: var(--font-size);
        line-height: 1.5;
        color: var(--secondary-text);
        overflow: hidden;
        user-select: none;
      }

      .code-editor.with-line-numbers {
        padding-left: 50px;
      }

      @media (max-width: 768px) {
        .code-panels {
          flex-direction: column;
        }

        .status-bar {
          flex-direction: column;
          gap: 16px;
        }

        .status-info {
          width: 100%;
          justify-content: space-around;
        }

        .settings-grid {
          flex-direction: column;
        }
      }
    `;
  }

  updateStyles() {
    const styleElement = this.shadowRoot.querySelector('#dynamic-styles');
    if (styleElement) {
      styleElement.textContent = this.getStyles();
    }
  }

  setupEventListeners() {
    // Tab switching
    this.shadowRoot.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.setActiveTab(tab.dataset.tab);
      });
    });

    // Input code textarea
    const inputCodeElement = this.shadowRoot.getElementById('input-code');
    inputCodeElement.addEventListener('input', (e) => {
      this.state.inputCode = e.target.value;
      this.updateLineNumbers(e.target.value, 'input');
    });

    // Set up line numbers
    this.updateLineNumbers('', 'input');
    this.updateLineNumbers('', 'output');

    // Clear input button
    this.shadowRoot.getElementById('clear-input').addEventListener('click', () => {
      inputCodeElement.value = '';
      this.state.inputCode = '';
      this.updateLineNumbers('', 'input');
      this.updateStats(0, 0);
    });

    // Copy output button
    this.shadowRoot.getElementById('copy-output').addEventListener('click', () => {
      const outputCode = this.shadowRoot.getElementById('output-code').value;
      if (outputCode) {
        navigator.clipboard.writeText(outputCode)
          .then(() => {
            this.showNotification('Code copied to clipboard!', 'success');
          })
          .catch(err => {
            this.showNotification('Failed to copy code', 'error');
          });
      }
    });

    // Download output button
    this.shadowRoot.getElementById('download-output').addEventListener('click', () => {
      const outputCode = this.shadowRoot.getElementById('output-code').value;
      if (outputCode) {
        const fileExtension = this.getFileExtension();
        const fileName = `minified.${fileExtension}`;
        const blob = new Blob([outputCode], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification(`File "${fileName}" downloaded!`, 'success');
      }
    });

    // Minification options
    this.shadowRoot.querySelectorAll('input[name="minification-level"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.state.minificationLevel = e.target.value;
        }
      });
    });

    this.shadowRoot.querySelector('input[name="preserve-comments"]').addEventListener('change', (e) => {
      this.state.preserveComments = e.target.checked;
    });

    this.shadowRoot.querySelector('input[name="preserve-line-breaks"]').addEventListener('change', (e) => {
      this.state.preserveLineBreaks = e.target.checked;
    });

    // Minify button
    this.shadowRoot.getElementById('minify-btn').addEventListener('click', () => {
      this.minifyCode();
    });

    // File upload via dropzone
    const fileDropzone = this.shadowRoot.querySelector('.file-dropzone');
    const fileInput = this.shadowRoot.querySelector('.file-input');

    fileDropzone.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this.handleFileUpload(e.target.files[0]);
      }
    });

    fileDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileDropzone.classList.add('drag-over');
    });

    fileDropzone.addEventListener('dragleave', () => {
      fileDropzone.classList.remove('drag-over');
    });

    fileDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      fileDropzone.classList.remove('drag-over');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        this.handleFileUpload(e.dataTransfer.files[0]);
      }
    });
  }

  setActiveTab(tabName) {
    this.shadowRoot.querySelectorAll('.tab').forEach(tab => {
      if (tab.dataset.tab === tabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    this.state.activeTab = tabName;

    this.shadowRoot.getElementById('output-code').value = '';
    this.updateLineNumbers('', 'output');
  }

  handleFileUpload(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target.result;
      const inputCodeElement = this.shadowRoot.getElementById('input-code');
      inputCodeElement.value = content;
      this.state.inputCode = content;
      this.updateLineNumbers(content, 'input');
      
      const fileExtension = file.name.split('.').pop().toLowerCase();
      let tabToSelect = 'html';
      
      if (fileExtension === 'css') {
        tabToSelect = 'css';
      } else if (fileExtension === 'js' || fileExtension === 'javascript') {
        tabToSelect = 'js';
      }
      
      this.setActiveTab(tabToSelect);
      
      this.showNotification(`File "${file.name}" loaded successfully!`, 'success');
    };
    
    reader.onerror = () => {
      this.showNotification('Error reading file!', 'error');
    };
    
    reader.readAsText(file);
  }

  minifyCode() {
    const inputCode = this.state.inputCode;
    if (!inputCode) {
      this.showNotification('Please enter some code to minify!', 'error');
      return;
    }
    
    const loadingIndicator = this.shadowRoot.getElementById('loading-indicator');
    loadingIndicator.classList.add('active');
    
    setTimeout(() => {
      let minified = '';
      
      try {
        switch (this.state.activeTab) {
          case 'html':
            minified = this.minifyHTML(inputCode);
            break;
          case 'css':
            minified = this.minifyCSS(inputCode);
            break;
          case 'js':
            minified = this.minifyJS(inputCode);
            break;
        }
        
        const outputCodeElement = this.shadowRoot.getElementById('output-code');
        outputCodeElement.value = minified;
        this.updateLineNumbers(minified, 'output');
        
        const originalSize = new Blob([inputCode]).size;
        const minifiedSize = new Blob([minified]).size;
        this.updateStats(originalSize, minifiedSize);
        
        this.showNotification('Code minified successfully!', 'success');
      } catch (error) {
        this.showNotification('Error minifying code: ' + error.message, 'error');
      } finally {
        loadingIndicator.classList.remove('active');
      }
    }, 100);
  }

  minifyHTML(html) {
    let minified = html;
    
    if (!this.state.preserveComments) {
      minified = minified.replace(/<!--(?!<!)[^\[>][\s\S]*?-->/g, '');
    } else {
      minified = minified.replace(/<!--(?!\[if)(?!\s*@license)(?!\s*@preserve)[\s\S]*?-->/g, '');
    }
    
    minified = minified.replace(/>\s+</g, '><');
    minified = minified.replace(/^\s+|\s+$/gm, '');
    minified = minified.replace(/\s{2,}/g, ' ');
    
    if (!this.state.preserveLineBreaks) {
      minified = minified.replace(/\n/g, '');
    }
    
    if (this.state.minificationLevel === 'aggressive') {
      minified = minified.replace(/\s+(<\/?(?:div|p|br|hr|table|tr|td|th|ul|ol|li|h[1-6])[^>]*>)\s+/g, '$1');
      minified = minified.replace(/(\s+[a-zA-Z-]+)="([a-zA-Z0-9-_]+)"/g, '$1=$2');
    }
    
    return minified;
  }

  minifyCSS(css) {
    let minified = css;
    
    if (!this.state.preserveComments) {
      minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');
    } else {
      minified = minified.replace(/\/\*(?!\s*!|@preserve|@license|@cc_on)[\s\S]*?\*\//g, '');
    }
    
    minified = minified.replace(/\s*{\s*/g, '{');
    minified = minified.replace(/\s*}\s*/g, '}');
    minified = minified.replace(/\s*:\s*/g, ':');
    minified = minified.replace(/\s*;\s*/g, ';');
    minified = minified.replace(/\s*,\s*/g, ',');
    minified = minified.replace(/;\}/g, '}');
    minified = minified.replace(/0\./g, '.');
    
    if (this.state.minificationLevel === 'aggressive') {
      minified = minified.replace(/rgb\(0,0,0\)/g, '#000');
      minified = minified.replace(/#([a-f0-9])\1([a-f0-9])\2([a-f0-9])\3/gi, '#$1$2$3');
      minified = minified.replace(/(\s|:)0px/g, '$10');
      minified = minified.replace(/(\s|:)0em/g, '$10');
      minified = minified.replace(/(\s|:)0rem/g, '$10');
      minified = minified.replace(/(\s|:)0%/g, '$10');
    }
    
    if (!this.state.preserveLineBreaks) {
      minified = minified.replace(/\n/g, '');
    }
    
    return minified;
  }

  minifyJS(js) {
    let minified = js;
    
    if (!this.state.preserveComments) {
      minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');
      minified = minified.replace(/\/\/[^\n]*/g, '');
    } else {
      minified = minified.replace(/\/\*(?!\s*!|@preserve|@license|@cc_on)[\s\S]*?\*\//g, '');
      minified = minified.replace(/\/\/(?!@preserve|@license|@cc_on)[^\n]*/g, '');
    }
    
    minified = minified.replace(/\s+/g, ' ');
    minified = minified.replace(/\s*([=+\-*/%&|^<>!?:.,;(){}[\]])\s*/g, '$1');
    minified = minified.replace(/;+\s*}/g, '}');
    
    if (this.state.minificationLevel === 'aggressive') {
      minified = minified.replace(/function\s+/g, 'function');
      minified = minified.replace(/(var|let|const)\s+/g, '$1');
      minified = minified.replace(/\s*\(\s*/g, '(');
      minified = minified.replace(/\s*\)\s*/g, ')');
      minified = minified.replace(/\s*{\s*/g, '{');
      minified = minified.replace(/\s*}\s*/g, '}');
    }
    
    if (!this.state.preserveLineBreaks) {
      minified = minified.replace(/\n/g, '');
    }
    
    return minified;
  }

  updateStats(originalSize, minifiedSize) {
    const bytesToKB = (bytes) => (bytes / 1024).toFixed(2);
    const originalSizeElement = this.shadowRoot.getElementById('original-size');
    const minifiedSizeElement = this.shadowRoot.getElementById('minified-size');
    const compressionRatioElement = this.shadowRoot.getElementById('compression-ratio');
    
    originalSizeElement.textContent = `${bytesToKB(originalSize)} KB`;
    minifiedSizeElement.textContent = `${bytesToKB(minifiedSize)} KB`;
    
    const compressionRatio = originalSize ? ((1 - (minifiedSize / originalSize)) * 100).toFixed(1) : 0;
    compressionRatioElement.textContent = `${compressionRatio}%`;
  }

  showNotification(message, type) {
    const notification = this.shadowRoot.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }

  updateLineNumbers(text, type) {
    const lineCount = text ? text.split('\n').length : 1;
    const lineNumbersElement = this.shadowRoot.getElementById(`${type}-line-numbers`);
    
    let lineNumbersHTML = '';
    for (let i = 1; i <= lineCount; i++) {
      lineNumbersHTML += `${i}<br>`;
    }
    
    lineNumbersElement.innerHTML = lineNumbersHTML;
  }

  getFileExtension() {
    switch (this.state.activeTab) {
      case 'html': return 'html';
      case 'css': return 'css';
      case 'js': return 'js';
      default: return 'txt';
    }
  }
}

customElements.define('wix-code-minifier', CodeMinifierElement);
