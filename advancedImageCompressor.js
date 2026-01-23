/**
 * Image Compression Tool - Advanced Wix Custom Element with Customization
 * File name: image-compression-tool.js
 * Custom Element tag name: image-compression-tool
 */

class ImageCompressionTool extends HTMLElement {
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
    
    this.originalImage = null;
    this.compressedImage = null;
    this.originalSize = 0;
    this.compressedSize = 0;
    this.batchFiles = [];
    this.compressedBatchImages = [];
    
    this.render();
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

  render() {
    this.shadowRoot.innerHTML = `
      <style id="dynamic-styles">
        ${this.getStyles()}
      </style>

      <div class="container">
        <h2>Image Compression Tool</h2>
        
        <div class="tabs">
          <div class="tab active" data-tab="single">Single Image</div>
          <div class="tab" data-tab="batch">Batch Process</div>
          <div class="tab" data-tab="settings">Settings</div>
        </div>
        
        <!-- Single Image Tab -->
        <div class="tab-content" id="single-tab">
          <div class="upload-section">
            <div class="upload-area" id="upload-area">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <p>Drag & Drop Image Here</p>
              <p class="upload-subtitle">or click to browse</p>
              <p class="supported-formats">Supports: JPG, PNG, WebP, GIF (Max 10MB)</p>
              <input type="file" id="file-input" accept="image/*" style="display: none;">
            </div>
          </div>
          
          <div class="preview-section" id="preview-section" style="display: none;">
            <div class="preview-grid">
              <div class="preview-item">
                <h3>Original</h3>
                <div class="image-container">
                  <img id="original-preview" alt="Original">
                  <div class="image-info">
                    <span id="original-size">0 KB</span>
                    <span id="original-dimensions">0 x 0</span>
                  </div>
                </div>
              </div>
              
              <div class="preview-item">
                <h3>Compressed</h3>
                <div class="image-container">
                  <img id="compressed-preview" alt="Compressed">
                  <div class="image-info">
                    <span id="compressed-size">0 KB</span>
                    <span id="compressed-dimensions">0 x 0</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="stats-section">
              <div class="stat-item">
                <span class="stat-label">Size Reduction:</span>
                <span class="stat-value" id="size-reduction">0%</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Space Saved:</span>
                <span class="stat-value" id="space-saved">0 KB</span>
              </div>
            </div>
          </div>
          
          <div class="controls-section" id="controls-section" style="display: none;">
            <div class="control-group">
              <label for="quality-slider">
                Quality: <span id="quality-value">80</span>%
              </label>
              <input type="range" id="quality-slider" min="1" max="100" value="80">
            </div>
            
            <div class="control-group">
              <label for="format-select">Output Format:</label>
              <select id="format-select">
                <option value="jpeg">JPEG</option>
                <option value="png">PNG</option>
                <option value="webp">WebP</option>
              </select>
            </div>
            
            <div class="control-group">
              <label>
                <input type="checkbox" id="resize-check">
                Resize Image
              </label>
              <div id="resize-options" style="display: none; margin-top: 8px;">
                <div class="resize-inputs">
                  <div>
                    <label for="width-input">Width (px):</label>
                    <input type="number" id="width-input" placeholder="Auto">
                  </div>
                  <div>
                    <label for="height-input">Height (px):</label>
                    <input type="number" id="height-input" placeholder="Auto">
                  </div>
                  <label>
                    <input type="checkbox" id="maintain-ratio" checked>
                    Maintain Aspect Ratio
                  </label>
                </div>
              </div>
            </div>
            
            <div class="action-buttons">
              <button id="compress-btn">Compress Image</button>
              <button class="secondary" id="download-btn" disabled>Download Compressed</button>
              <button class="secondary" id="reset-btn">Upload New</button>
            </div>
          </div>
        </div>
        
        <!-- Batch Process Tab -->
        <div class="tab-content" id="batch-tab" style="display: none;">
          <div class="upload-section">
            <div class="upload-area" id="batch-upload-area">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <p>Drop Multiple Images Here</p>
              <p class="upload-subtitle">or click to browse</p>
              <input type="file" id="batch-file-input" accept="image/*" multiple style="display: none;">
            </div>
          </div>
          
          <div id="batch-list" style="display: none;">
            <div class="batch-header">
              <h3>Images Queue (<span id="batch-count">0</span>)</h3>
              <button class="secondary" id="clear-batch">Clear All</button>
            </div>
            <div id="batch-items"></div>
            <div class="batch-stats" id="batch-stats" style="display: none;">
              <div class="stat-item">
                <span class="stat-label">Total Original Size:</span>
                <span class="stat-value" id="batch-original-size">0 KB</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Total Compressed Size:</span>
                <span class="stat-value" id="batch-compressed-size">0 KB</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Total Saved:</span>
                <span class="stat-value" id="batch-saved">0 KB</span>
              </div>
            </div>
            <div class="batch-actions">
              <button id="batch-compress-btn">Compress All</button>
              <button class="secondary" id="batch-download-btn" disabled>Download All (ZIP)</button>
            </div>
          </div>
        </div>
        
        <!-- Settings Tab -->
        <div class="tab-content" id="settings-tab" style="display: none;">
          <div class="settings-section">
            <h3>Default Compression Settings</h3>
            
            <div class="setting-item">
              <label for="default-quality">Default Quality:</label>
              <input type="range" id="default-quality" min="1" max="100" value="80">
              <span id="default-quality-value">80</span>%
            </div>
            
            <div class="setting-item">
              <label for="default-format">Default Format:</label>
              <select id="default-format">
                <option value="jpeg">JPEG</option>
                <option value="png">PNG</option>
                <option value="webp">WebP</option>
              </select>
            </div>
            
            <div class="setting-item">
              <label>
                <input type="checkbox" id="auto-compress">
                Auto-compress on upload
              </label>
            </div>
            
            <div class="setting-item">
              <label for="max-dimension">Max Dimension (0 = no limit):</label>
              <input type="number" id="max-dimension" value="0" placeholder="e.g., 1920">
              <span class="help-text">Automatically resize if larger</span>
            </div>
            
            <div class="setting-item">
              <label>
                <input type="checkbox" id="preserve-exif">
                Preserve EXIF data
              </label>
            </div>
          </div>
        </div>
        
        <div class="success-message" id="success-message">Operation completed successfully!</div>
      </div>
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
        max-width: 100%;
      }

      * {
        box-sizing: border-box;
      }

      .container {
        background-color: var(--primary-bg);
        border-radius: var(--border-radius);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        padding: 20px;
        border: 1px solid var(--border-color);
      }

      h2 {
        margin-top: 0;
        font-size: var(--heading-size);
        font-weight: 500;
        margin-bottom: 16px;
        color: var(--heading-color);
        font-family: var(--font-family);
      }

      h3 {
        font-size: calc(var(--font-size) + 2px);
        font-weight: 500;
        margin-bottom: 12px;
        color: var(--heading-color);
        font-family: var(--font-family);
        margin-top: 0;
      }

      .tabs {
        display: flex;
        border-bottom: 1px solid var(--border-color);
        margin-bottom: 20px;
        background-color: var(--secondary-bg);
        border-radius: var(--border-radius);
        overflow: hidden;
      }

      .tab {
        padding: var(--button-padding) 16px;
        cursor: pointer;
        font-weight: 500;
        font-size: var(--font-size);
        transition: all 0.2s ease;
        color: var(--paragraph-color);
        font-family: var(--font-family);
        background-color: transparent;
        flex: 1;
        text-align: center;
        border: none;
      }

      .tab:hover {
        background-color: var(--hover-accent);
        color: var(--primary-bg);
      }

      .tab.active {
        color: var(--primary-bg);
        background-color: var(--main-accent);
        font-weight: 600;
      }

      .upload-area {
        border: 2px dashed var(--border-color);
        border-radius: var(--border-radius);
        padding: 40px 20px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s ease;
        background-color: var(--secondary-bg);
      }

      .upload-area:hover {
        border-color: var(--main-accent);
        background-color: var(--primary-bg);
      }

      .upload-area.dragover {
        border-color: var(--main-accent);
        background-color: var(--primary-bg);
        transform: scale(1.02);
      }

      .upload-area svg {
        color: var(--secondary-text);
        margin-bottom: 12px;
      }

      .upload-area p {
        margin: 8px 0;
        color: var(--heading-color);
        font-size: var(--font-size);
        font-family: var(--font-family);
      }

      .upload-subtitle {
        color: var(--secondary-text) !important;
        font-size: calc(var(--font-size) - 2px) !important;
      }

      .supported-formats {
        font-size: calc(var(--font-size) - 2px) !important;
        color: var(--secondary-text) !important;
      }

      .preview-section {
        margin: 20px 0;
      }

      .preview-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-bottom: 20px;
      }

      .preview-item {
        background-color: var(--secondary-bg);
        border-radius: var(--border-radius);
        padding: 16px;
        border: 1px solid var(--border-color);
      }

      .image-container {
        position: relative;
        background-color: var(--primary-bg);
        border-radius: var(--border-radius);
        overflow: hidden;
        border: 1px solid var(--border-color);
      }

      .image-container img {
        width: 100%;
        height: auto;
        display: block;
        max-height: 300px;
        object-fit: contain;
      }

      .image-info {
        display: flex;
        justify-content: space-between;
        padding: 8px;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        font-size: calc(var(--font-size) - 2px);
        font-family: var(--font-family);
      }

      .stats-section, .batch-stats {
        background-color: var(--secondary-bg);
        border-radius: var(--border-radius);
        padding: 16px;
        display: flex;
        justify-content: space-around;
        gap: 20px;
        border: 1px solid var(--border-color);
        flex-wrap: wrap;
        margin-bottom: 16px;
      }

      .stat-item {
        text-align: center;
      }

      .stat-label {
        display: block;
        color: var(--secondary-text);
        font-size: calc(var(--font-size) - 2px);
        margin-bottom: 4px;
        font-family: var(--font-family);
      }

      .stat-value {
        display: block;
        font-size: calc(var(--font-size) + 4px);
        font-weight: 600;
        color: var(--main-accent);
        font-family: var(--font-family);
      }

      .controls-section {
        background-color: var(--secondary-bg);
        border-radius: var(--border-radius);
        padding: 20px;
        margin: 20px 0;
        border: 1px solid var(--border-color);
      }

      .control-group {
        margin-bottom: 16px;
      }

      .control-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        font-size: var(--font-size);
        color: var(--heading-color);
        font-family: var(--font-family);
      }

      input[type="range"] {
        width: 100%;
        cursor: pointer;
        accent-color: var(--main-accent);
      }

      select {
        width: 100%;
        padding: var(--button-padding);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        background-color: var(--primary-bg);
        font-size: var(--font-size);
        color: var(--paragraph-color);
        font-family: var(--font-family);
        cursor: pointer;
      }

      select:focus {
        outline: none;
        border-color: var(--main-accent);
      }

      input[type="number"] {
        width: 100%;
        padding: var(--button-padding);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        background-color: var(--primary-bg);
        font-size: var(--font-size);
        color: var(--paragraph-color);
        font-family: var(--font-family);
      }

      input[type="number"]:focus {
        outline: none;
        border-color: var(--main-accent);
      }

      input[type="checkbox"] {
        margin: 0 6px 0 0;
        cursor: pointer;
        accent-color: var(--main-accent);
      }

      .resize-inputs {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        background-color: var(--primary-bg);
        padding: 12px;
        border-radius: var(--border-radius);
      }

      .resize-inputs > label {
        grid-column: 1 / -1;
      }

      .action-buttons, .batch-actions {
        display: flex;
        gap: 10px;
        margin-top: 20px;
        flex-wrap: wrap;
      }

      button {
        padding: var(--button-padding) 16px;
        background-color: var(--main-accent);
        color: var(--primary-bg);
        border: none;
        border-radius: var(--border-radius);
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s ease;
        font-size: var(--font-size);
        font-family: var(--font-family);
        flex: 1;
        min-width: 120px;
      }

      button:hover:not(:disabled) {
        background-color: var(--hover-accent);
      }

      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      button.secondary {
        background-color: var(--secondary-bg);
        border: 1px solid var(--border-color);
        color: var(--heading-color);
      }

      button.secondary:hover:not(:disabled) {
        background-color: var(--border-color);
      }

      .batch-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      #batch-items {
        max-height: 400px;
        overflow-y: auto;
        margin-bottom: 16px;
      }

      .batch-item {
        background-color: var(--secondary-bg);
        border-radius: var(--border-radius);
        padding: 12px;
        margin-bottom: 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border: 1px solid var(--border-color);
      }

      .batch-item-info {
        flex: 1;
      }

      .batch-item-name {
        font-weight: 500;
        color: var(--heading-color);
        font-size: var(--font-size);
        font-family: var(--font-family);
      }

      .batch-item-size {
        color: var(--secondary-text);
        font-size: calc(var(--font-size) - 2px);
        font-family: var(--font-family);
      }

      .batch-item-status {
        margin-left: 12px;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: calc(var(--font-size) - 2px);
        font-family: var(--font-family);
      }

      .batch-item-status.pending {
        background-color: var(--secondary-bg);
        color: var(--secondary-text);
        border: 1px solid var(--border-color);
      }

      .batch-item-status.processing {
        background-color: var(--main-accent);
        color: var(--primary-bg);
      }

      .batch-item-status.completed {
        background-color: #4caf50;
        color: white;
      }

      .settings-section {
        background-color: var(--secondary-bg);
        border-radius: var(--border-radius);
        padding: 20px;
        border: 1px solid var(--border-color);
      }

      .setting-item {
        margin-bottom: 20px;
      }

      .setting-item label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        font-size: var(--font-size);
        color: var(--heading-color);
        font-family: var(--font-family);
      }

      .help-text {
        display: block;
        color: var(--secondary-text);
        font-size: calc(var(--font-size) - 2px);
        margin-top: 4px;
        font-family: var(--font-family);
      }

      .success-message {
        color: var(--main-accent);
        font-size: var(--font-size);
        margin-top: 16px;
        opacity: 0;
        transition: opacity 0.5s ease;
        font-family: var(--font-family);
        font-weight: 500;
        text-align: center;
        padding: 12px;
        background-color: var(--secondary-bg);
        border-radius: var(--border-radius);
      }

      .success-message.show {
        opacity: 1;
      }

      @media (max-width: 768px) {
        .preview-grid {
          grid-template-columns: 1fr;
        }
        
        .action-buttons, .batch-actions {
          flex-direction: column;
        }
        
        button {
          width: 100%;
        }

        .stats-section, .batch-stats {
          flex-direction: column;
        }

        .resize-inputs {
          grid-template-columns: 1fr;
        }

        .tabs {
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
    const tabs = this.shadowRoot.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        this.shadowRoot.querySelectorAll('.tab-content').forEach(content => {
          content.style.display = 'none';
        });
        
        const tabName = tab.getAttribute('data-tab');
        this.shadowRoot.querySelector(`#${tabName}-tab`).style.display = 'block';
      });
    });

    // Single image upload
    const uploadArea = this.shadowRoot.querySelector('#upload-area');
    const fileInput = this.shadowRoot.querySelector('#file-input');
    
    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files[0]));
    
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        this.handleFileSelect(e.dataTransfer.files[0]);
      }
    });

    // Quality slider
    const qualitySlider = this.shadowRoot.querySelector('#quality-slider');
    const qualityValue = this.shadowRoot.querySelector('#quality-value');
    qualitySlider.addEventListener('input', (e) => {
      qualityValue.textContent = e.target.value;
    });

    // Resize checkbox
    const resizeCheck = this.shadowRoot.querySelector('#resize-check');
    const resizeOptions = this.shadowRoot.querySelector('#resize-options');
    resizeCheck.addEventListener('change', (e) => {
      resizeOptions.style.display = e.target.checked ? 'block' : 'none';
    });

    // Maintain aspect ratio
    const widthInput = this.shadowRoot.querySelector('#width-input');
    const heightInput = this.shadowRoot.querySelector('#height-input');
    const maintainRatio = this.shadowRoot.querySelector('#maintain-ratio');
    
    widthInput.addEventListener('input', () => {
      if (maintainRatio.checked && this.originalImage) {
        const ratio = this.originalImage.height / this.originalImage.width;
        heightInput.value = Math.round(widthInput.value * ratio);
      }
    });
    
    heightInput.addEventListener('input', () => {
      if (maintainRatio.checked && this.originalImage) {
        const ratio = this.originalImage.width / this.originalImage.height;
        widthInput.value = Math.round(heightInput.value * ratio);
      }
    });

    // Compress button
    const compressBtn = this.shadowRoot.querySelector('#compress-btn');
    compressBtn.addEventListener('click', () => this.compressImage());

    // Download button
    const downloadBtn = this.shadowRoot.querySelector('#download-btn');
    downloadBtn.addEventListener('click', () => this.downloadImage());

    // Reset button
    const resetBtn = this.shadowRoot.querySelector('#reset-btn');
    resetBtn.addEventListener('click', () => this.resetTool());

    // Batch upload
    const batchUploadArea = this.shadowRoot.querySelector('#batch-upload-area');
    const batchFileInput = this.shadowRoot.querySelector('#batch-file-input');
    
    batchUploadArea.addEventListener('click', () => batchFileInput.click());
    batchFileInput.addEventListener('change', (e) => this.handleBatchSelect(e.target.files));
    
    batchUploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      batchUploadArea.classList.add('dragover');
    });
    
    batchUploadArea.addEventListener('dragleave', () => {
      batchUploadArea.classList.remove('dragover');
    });
    
    batchUploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      batchUploadArea.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        this.handleBatchSelect(e.dataTransfer.files);
      }
    });

    // Batch compress button
    const batchCompressBtn = this.shadowRoot.querySelector('#batch-compress-btn');
    batchCompressBtn.addEventListener('click', () => this.compressBatch());

    // Batch download button
    const batchDownloadBtn = this.shadowRoot.querySelector('#batch-download-btn');
    batchDownloadBtn.addEventListener('click', () => this.downloadBatchAsZip());

    // Clear batch button
    const clearBatchBtn = this.shadowRoot.querySelector('#clear-batch');
    clearBatchBtn.addEventListener('click', () => this.clearBatch());

    // Settings - Default quality
    const defaultQuality = this.shadowRoot.querySelector('#default-quality');
    const defaultQualityValue = this.shadowRoot.querySelector('#default-quality-value');
    defaultQuality.addEventListener('input', (e) => {
      defaultQualityValue.textContent = e.target.value;
    });
  }

  handleFileSelect(file) {
    if (!file || !file.type.startsWith('image/')) {
      this.showMessage('Please select a valid image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.showMessage('File size must be less than 10MB');
      return;
    }

    this.originalSize = file.size;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.originalImage = img;
        this.displayOriginalImage(e.target.result, img.width, img.height);
        this.showControls();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  displayOriginalImage(src, width, height) {
    const preview = this.shadowRoot.querySelector('#original-preview');
    const sizeSpan = this.shadowRoot.querySelector('#original-size');
    const dimensionsSpan = this.shadowRoot.querySelector('#original-dimensions');
    
    preview.src = src;
    sizeSpan.textContent = this.formatBytes(this.originalSize);
    dimensionsSpan.textContent = `${width} x ${height}`;
    
    this.shadowRoot.querySelector('#preview-section').style.display = 'block';
  }

  showControls() {
    this.shadowRoot.querySelector('#controls-section').style.display = 'block';
    
    // Set width/height inputs to original dimensions
    if (this.originalImage) {
      this.shadowRoot.querySelector('#width-input').placeholder = this.originalImage.width;
      this.shadowRoot.querySelector('#height-input').placeholder = this.originalImage.height;
    }
  }

  async compressImage() {
    if (!this.originalImage) return;

    const quality = parseInt(this.shadowRoot.querySelector('#quality-slider').value) / 100;
    const format = this.shadowRoot.querySelector('#format-select').value;
    const resizeEnabled = this.shadowRoot.querySelector('#resize-check').checked;
    
    let targetWidth = this.originalImage.width;
    let targetHeight = this.originalImage.height;
    
    if (resizeEnabled) {
      const widthInput = this.shadowRoot.querySelector('#width-input').value;
      const heightInput = this.shadowRoot.querySelector('#height-input').value;
      
      if (widthInput) targetWidth = parseInt(widthInput);
      if (heightInput) targetHeight = parseInt(heightInput);
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(this.originalImage, 0, 0, targetWidth, targetHeight);
    
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 
                     format === 'png' ? 'image/png' : 'image/webp';
    
    canvas.toBlob((blob) => {
      this.compressedSize = blob.size;
      const url = URL.createObjectURL(blob);
      
      const compressedPreview = this.shadowRoot.querySelector('#compressed-preview');
      const compressedSizeSpan = this.shadowRoot.querySelector('#compressed-size');
      const compressedDimensionsSpan = this.shadowRoot.querySelector('#compressed-dimensions');
      
      compressedPreview.src = url;
      compressedSizeSpan.textContent = this.formatBytes(this.compressedSize);
      compressedDimensionsSpan.textContent = `${targetWidth} x ${targetHeight}`;
      
      this.compressedImage = blob;
      this.updateStats();
      
      this.shadowRoot.querySelector('#download-btn').disabled = false;
      this.showMessage('Image compressed successfully!');
    }, mimeType, quality);
  }

  updateStats() {
    const reduction = ((this.originalSize - this.compressedSize) / this.originalSize * 100).toFixed(1);
    const saved = this.originalSize - this.compressedSize;
    
    this.shadowRoot.querySelector('#size-reduction').textContent = `${reduction}%`;
    this.shadowRoot.querySelector('#space-saved').textContent = this.formatBytes(saved);
  }

  downloadImage() {
    if (!this.compressedImage) return;
    
    const format = this.shadowRoot.querySelector('#format-select').value;
    const url = URL.createObjectURL(this.compressedImage);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compressed-image.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.showMessage('Image downloaded successfully!');
  }

  resetTool() {
    this.originalImage = null;
    this.compressedImage = null;
    this.originalSize = 0;
    this.compressedSize = 0;
    
    this.shadowRoot.querySelector('#preview-section').style.display = 'none';
    this.shadowRoot.querySelector('#controls-section').style.display = 'none';
    this.shadowRoot.querySelector('#file-input').value = '';
    this.shadowRoot.querySelector('#download-btn').disabled = true;
  }

  handleBatchSelect(files) {
    const batchList = this.shadowRoot.querySelector('#batch-list');
    const batchItems = this.shadowRoot.querySelector('#batch-items');
    const batchCount = this.shadowRoot.querySelector('#batch-count');
    
    const validFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024
    );
    
    if (validFiles.length === 0) {
      this.showMessage('No valid images selected');
      return;
    }

    this.batchFiles = validFiles;
    this.compressedBatchImages = [];
    
    batchList.style.display = 'block';
    batchItems.innerHTML = '';
    batchCount.textContent = validFiles.length;
    
    validFiles.forEach((file, index) => {
      const item = document.createElement('div');
      item.className = 'batch-item';
      item.innerHTML = `
        <div class="batch-item-info">
          <div class="batch-item-name">${file.name}</div>
          <div class="batch-item-size">${this.formatBytes(file.size)}</div>
        </div>
        <div class="batch-item-status pending" id="batch-status-${index}">Pending</div>
      `;
      batchItems.appendChild(item);
    });

    // Reset download button
    this.shadowRoot.querySelector('#batch-download-btn').disabled = true;
    this.shadowRoot.querySelector('#batch-stats').style.display = 'none';
  }

  async compressBatch() {
    if (this.batchFiles.length === 0) {
      this.showMessage('No images to compress');
      return;
    }

    const defaultQuality = parseInt(this.shadowRoot.querySelector('#default-quality').value) / 100;
    const defaultFormat = this.shadowRoot.querySelector('#default-format').value;
    const maxDimension = parseInt(this.shadowRoot.querySelector('#max-dimension').value) || 0;

    this.compressedBatchImages = [];
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;

    for (let i = 0; i < this.batchFiles.length; i++) {
      const file = this.batchFiles[i];
      const statusElement = this.shadowRoot.querySelector(`#batch-status-${i}`);
      
      // Update status to processing
      statusElement.textContent = 'Processing...';
      statusElement.className = 'batch-item-status processing';

      try {
        const compressedBlob = await this.compressSingleFile(file, defaultQuality, defaultFormat, maxDimension);
        
        totalOriginalSize += file.size;
        totalCompressedSize += compressedBlob.size;

        this.compressedBatchImages.push({
          blob: compressedBlob,
          name: file.name.replace(/\.[^/.]+$/, '') + '.' + defaultFormat,
          originalSize: file.size,
          compressedSize: compressedBlob.size
        });

        // Update status to completed
        statusElement.textContent = 'Completed';
        statusElement.className = 'batch-item-status completed';
      } catch (error) {
        statusElement.textContent = 'Failed';
        statusElement.className = 'batch-item-status pending';
        console.error('Compression failed for', file.name, error);
      }
    }

    // Show stats
    const batchStats = this.shadowRoot.querySelector('#batch-stats');
    batchStats.style.display = 'flex';
    this.shadowRoot.querySelector('#batch-original-size').textContent = this.formatBytes(totalOriginalSize);
    this.shadowRoot.querySelector('#batch-compressed-size').textContent = this.formatBytes(totalCompressedSize);
    this.shadowRoot.querySelector('#batch-saved').textContent = this.formatBytes(totalOriginalSize - totalCompressedSize);

    // Enable download button
    this.shadowRoot.querySelector('#batch-download-btn').disabled = false;
    this.showMessage(`Successfully compressed ${this.compressedBatchImages.length} images!`);
  }

  compressSingleFile(file, quality, format, maxDimension) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          // Apply max dimension if set
          if (maxDimension > 0 && (width > maxDimension || height > maxDimension)) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const mimeType = format === 'jpeg' ? 'image/jpeg' : 
                         format === 'png' ? 'image/png' : 'image/webp';
          
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          }, mimeType, quality);
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target.result;
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  async downloadBatchAsZip() {
    if (this.compressedBatchImages.length === 0) {
      this.showMessage('No compressed images to download');
      return;
    }

    // For simplicity, download images individually
    // In production, you'd want to use a ZIP library like JSZip
    this.showMessage('Downloading images individually (ZIP functionality requires JSZip library)');
    
    for (const image of this.compressedBatchImages) {
      const url = URL.createObjectURL(image.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = image.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  clearBatch() {
    this.batchFiles = [];
    this.compressedBatchImages = [];
    
    this.shadowRoot.querySelector('#batch-list').style.display = 'none';
    this.shadowRoot.querySelector('#batch-file-input').value = '';
    this.shadowRoot.querySelector('#batch-download-btn').disabled = true;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  showMessage(message) {
    const messageEl = this.shadowRoot.querySelector('#success-message');
    messageEl.textContent = message;
    messageEl.classList.add('show');
    setTimeout(() => {
      messageEl.classList.remove('show');
    }, 3000);
  }

  connectedCallback() {
    // Initialize with defaults
  }

  disconnectedCallback() {
    // Cleanup
  }
}

customElements.define('image-compression-tool', ImageCompressionTool);
