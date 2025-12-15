// File name: advancedImageCompressor.js
// Custom Element tag name: advanced-image-compressor

class AdvancedImageCompressor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Default settings
    this.settings = {
      primaryBg: '#ffffff',
      secondaryBg: '#f9f9f9',
      borderColor: '#bdc3c7',
      secondaryText: '#7f8c8d',
      mainAccent: '#3498db',
      hoverAccent: '#2980b9',
      headingColor: '#2c3e50',
      paragraphColor: '#333333',
      fontFamily: 'Roboto, sans-serif',
      fontSize: 14,
      headingSize: 24,
      borderRadius: 8,
      buttonPadding: 12
    };
    
    this.compressorOptions = {
      quality: 0.8,
      mimeType: 'auto',
      maxWidth: undefined,
      maxHeight: undefined,
      minWidth: 0,
      minHeight: 0,
      width: undefined,
      height: undefined,
      resize: 'none',
      convertSize: 5000000,
      convertTypes: ['image/png'],
      checkOrientation: true,
      strict: true,
      checkType: true
    };
    this.inputElement = null;
    this.setupUI();
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

  setupUI() {
    this.shadowRoot.innerHTML = `
      <style id="dynamic-styles">
        ${this.getStyles()}
      </style>
      ${this.getHTML()}
    `;

    this.initializeListeners();
    this.loadCompressorScript();
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
        
        --secondary-color: #2ecc71;
        --error-color: #e74c3c;
        width: 100%;
        max-width: 600px;
        margin: 0 auto;
      }

      .compressor-container {
        background-color: var(--primary-bg);
        border-radius: var(--border-radius);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        padding: 24px;
        border: 1px solid var(--border-color);
      }

      .title {
        color: var(--heading-color);
        text-align: center;
        margin-top: 0;
        margin-bottom: 24px;
        font-size: var(--heading-size);
        font-family: var(--font-family);
      }

      .drop-area {
        border: 2px dashed var(--border-color);
        border-radius: var(--border-radius);
        padding: 30px;
        text-align: center;
        transition: all 0.3s;
        background-color: var(--secondary-bg);
        margin-bottom: 20px;
        position: relative;
      }

      .drop-area.drag-over {
        background-color: rgba(52, 152, 219, 0.1);
        border-color: var(--main-accent);
      }

      .drop-area.has-image {
        padding: 10px;
      }

      .drop-area-text {
        color: var(--secondary-text);
        font-size: calc(var(--font-size) + 2px);
        margin-bottom: 10px;
        font-family: var(--font-family);
      }

      .browse-button {
        background-color: var(--main-accent);
        color: var(--primary-bg);
        border: none;
        border-radius: var(--border-radius);
        padding: calc(var(--button-padding) - 2px) 20px;
        font-size: var(--font-size);
        cursor: pointer;
        transition: background-color 0.3s;
        font-family: var(--font-family);
      }

      .browse-button:hover {
        background-color: var(--hover-accent);
      }

      .file-input {
        display: none;
      }

      .settings-container {
        margin-bottom: 20px;
      }

      .settings-title {
        font-size: calc(var(--font-size) + 2px);
        font-weight: 600;
        margin: 15px 0 10px;
        color: var(--heading-color);
        font-family: var(--font-family);
      }

      .options-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 15px;
        margin-bottom: 15px;
      }

      .option-item {
        margin-bottom: 10px;
      }

      .option-label {
        display: block;
        margin-bottom: 5px;
        font-size: var(--font-size);
        color: var(--heading-color);
        font-family: var(--font-family);
      }

      .resize-options {
        display: flex;
        margin-bottom: 15px;
        flex-wrap: wrap;
        gap: 10px;
      }

      .resize-option {
        flex: 1;
        min-width: 80px;
      }

      input[type="number"],
      input[type="text"],
      select {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid var(--border-color);
        border-radius: calc(var(--border-radius) / 2);
        font-size: var(--font-size);
        transition: border-color 0.3s;
        font-family: var(--font-family);
        background-color: var(--primary-bg);
        color: var(--paragraph-color);
        box-sizing: border-box;
      }

      input[type="range"] {
        width: 100%;
        margin: 5px 0;
        accent-color: var(--main-accent);
      }

      input:focus, select:focus {
        outline: none;
        border-color: var(--main-accent);
      }

      .range-container {
        width: 100%;
      }

      .range-value {
        float: right;
        font-size: var(--font-size);
        color: var(--secondary-text);
        font-family: var(--font-family);
      }

      .checkbox-container {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
      }

      .checkbox-container input {
        margin-right: 8px;
        accent-color: var(--main-accent);
      }

      .checkbox-container label {
        font-size: var(--font-size);
        color: var(--paragraph-color);
        font-family: var(--font-family);
      }

      .preview-container {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        margin-bottom: 20px;
      }

      .preview-box {
        flex: 1;
        min-width: 200px;
        border-radius: var(--border-radius);
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        border: 1px solid var(--border-color);
      }

      .preview-header {
        background-color: var(--secondary-bg);
        padding: 8px 12px;
        font-size: var(--font-size);
        font-weight: 600;
        color: var(--heading-color);
        display: flex;
        justify-content: space-between;
        font-family: var(--font-family);
      }

      .preview-image-container {
        position: relative;
        height: 200px;
        background-color: var(--secondary-bg);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .preview-image {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }

      .preview-info {
        padding: 8px 12px;
        font-size: calc(var(--font-size) - 2px);
        color: var(--secondary-text);
        background-color: var(--primary-bg);
      }

      .info-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
        font-family: var(--font-family);
      }

      .info-label {
        font-weight: 600;
      }

      .actions-container {
        display: flex;
        gap: 10px;
        margin-top: 20px;
      }

      .download-button, .compress-button {
        flex: 1;
        padding: var(--button-padding);
        border-radius: var(--border-radius);
        border: none;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
        text-align: center;
        font-size: var(--font-size);
        font-family: var(--font-family);
      }

      .compress-button {
        background-color: var(--main-accent);
        color: var(--primary-bg);
      }

      .compress-button:hover {
        background-color: var(--hover-accent);
      }

      .download-button {
        background-color: var(--secondary-color);
        color: var(--primary-bg);
      }

      .download-button:hover {
        background-color: #27ae60;
      }

      .download-button:disabled, .compress-button:disabled {
        background-color: var(--border-color);
        cursor: not-allowed;
        opacity: 0.6;
      }

      .loading-spinner {
        border: 3px solid rgba(0, 0, 0, 0.1);
        border-top: 3px solid var(--primary-bg);
        border-radius: 50%;
        width: 16px;
        height: 16px;
        animation: spin 1s linear infinite;
        display: inline-block;
        vertical-align: middle;
        margin-right: 8px;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .error-message {
        color: var(--error-color);
        font-size: var(--font-size);
        text-align: center;
        margin: 10px 0;
        font-family: var(--font-family);
      }

      .placeholder-text {
        color: var(--secondary-text);
        font-size: var(--font-size);
        text-align: center;
        font-family: var(--font-family);
      }

      .file-size-comparison {
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 15px 0;
        font-size: var(--font-size);
        font-family: var(--font-family);
      }

      .file-size-bar {
        background-color: var(--secondary-bg);
        height: 8px;
        border-radius: calc(var(--border-radius) / 2);
        width: 100%;
        margin: 0 10px;
        position: relative;
        overflow: hidden;
        border: 1px solid var(--border-color);
      }

      .file-size-progress {
        background-color: var(--secondary-color);
        height: 100%;
        border-radius: calc(var(--border-radius) / 2);
        transition: width 0.5s ease-in-out;
      }

      .hidden {
        display: none;
      }

      .visible {
        display: block;
      }

      .advanced-toggle {
        text-align: center;
        color: var(--main-accent);
        cursor: pointer;
        margin: 20px 0 10px;
        user-select: none;
        font-size: var(--font-size);
        font-family: var(--font-family);
      }

      .advanced-toggle:hover {
        text-decoration: underline;
      }

      .advanced-options {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease-out;
      }

      .advanced-options.visible {
        max-height: 1000px;
      }

      .convert-types-container {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 10px;
      }

      .convert-type {
        background-color: var(--secondary-bg);
        border-radius: calc(var(--border-radius) / 2);
        padding: 5px 10px;
        display: flex;
        align-items: center;
        font-size: calc(var(--font-size) - 1px);
        border: 1px solid var(--border-color);
        font-family: var(--font-family);
        color: var(--paragraph-color);
      }

      .convert-type input {
        margin-right: 5px;
        accent-color: var(--main-accent);
      }

      .compressed-quality {
        color: var(--main-accent);
        font-weight: 600;
      }

      .compression-percentage {
        color: var(--secondary-color);
        font-weight: 600;
      }

      @media (max-width: 480px) {
        .options-grid {
          grid-template-columns: 1fr;
        }
        
        .preview-container {
          flex-direction: column;
        }
        
        .actions-container {
          flex-direction: column;
        }
      }
    `;
  }

  getHTML() {
    return `
      <div class="compressor-container">
        <h2 class="title">Advanced Image Compressor</h2>
        
        <div class="drop-area">
          <div class="drop-area-text">Drop your image here or</div>
          <button class="browse-button">Browse Files</button>
          <input type="file" class="file-input" accept="image/*">
        </div>
        
        <div class="settings-container">
          <div class="settings-title">Compression Settings</div>
          
          <div class="options-grid">
            <div class="option-item">
              <label class="option-label">Quality</label>
              <div class="range-container">
                <input type="range" min="0" max="1" step="0.05" value="0.8" id="quality-slider">
                <span class="range-value">80%</span>
              </div>
            </div>
            
            <div class="option-item">
              <label class="option-label">Output Format</label>
              <select id="mime-type">
                <option value="auto">Auto (Same as input)</option>
                <option value="image/jpeg">JPEG</option>
                <option value="image/png">PNG</option>
                <option value="image/webp">WebP</option>
              </select>
            </div>
          </div>
          
          <div class="settings-title">Resize Options</div>
          <select id="resize-mode">
            <option value="none">No Resize</option>
            <option value="width">Specify Width</option>
            <option value="height">Specify Height</option>
            <option value="both">Specify Both</option>
            <option value="max">Set Maximum Dimensions</option>
            <option value="min">Set Minimum Dimensions</option>
          </select>
          
          <div class="resize-options hidden" id="resize-options">
            <div class="resize-option" id="width-option">
              <label class="option-label">Width (px)</label>
              <input type="number" id="width-input" placeholder="Width">
            </div>
            <div class="resize-option" id="height-option">
              <label class="option-label">Height (px)</label>
              <input type="number" id="height-input" placeholder="Height">
            </div>
            <div class="resize-option" id="max-width-option">
              <label class="option-label">Max Width (px)</label>
              <input type="number" id="max-width-input" placeholder="Max width">
            </div>
            <div class="resize-option" id="max-height-option">
              <label class="option-label">Max Height (px)</label>
              <input type="number" id="max-height-input" placeholder="Max height">
            </div>
            <div class="resize-option" id="min-width-option">
              <label class="option-label">Min Width (px)</label>
              <input type="number" id="min-width-input" placeholder="Min width" value="0">
            </div>
            <div class="resize-option" id="min-height-option">
              <label class="option-label">Min Height (px)</label>
              <input type="number" id="min-height-input" placeholder="Min height" value="0">
            </div>
          </div>
          
          <div class="advanced-toggle">Show Advanced Options</div>
          
          <div class="advanced-options">
            <div class="checkbox-container">
              <input type="checkbox" id="check-orientation" checked>
              <label for="check-orientation">Auto-rotate image based on EXIF orientation</label>
            </div>
            
            <div class="checkbox-container">
              <input type="checkbox" id="strict-mode" checked>
              <label for="strict-mode">Strict mode (fail on errors)</label>
            </div>
            
            <div class="checkbox-container">
              <input type="checkbox" id="check-type" checked>
              <label for="check-type">Check MIME type before processing</label>
            </div>
            
            <div class="option-item">
              <label class="option-label">Convert images larger than (bytes)</label>
              <input type="number" id="convert-size" value="5000000">
            </div>
            
            <div class="option-item">
              <label class="option-label">Convert these formats:</label>
              <div class="convert-types-container">
                <div class="convert-type">
                  <input type="checkbox" id="convert-png" checked>
                  <label for="convert-png">PNG</label>
                </div>
                <div class="convert-type">
                  <input type="checkbox" id="convert-bmp">
                  <label for="convert-bmp">BMP</label>
                </div>
                <div class="convert-type">
                  <input type="checkbox" id="convert-tiff">
                  <label for="convert-tiff">TIFF</label>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="preview-container">
          <div class="preview-box">
            <div class="preview-header">Original</div>
            <div class="preview-image-container">
              <div class="placeholder-text">No image selected</div>
              <img class="preview-image original-preview hidden" src="">
            </div>
            <div class="preview-info original-info hidden">
              <div class="info-row">
                <span class="info-label">Size:</span>
                <span class="original-size">-</span>
              </div>
              <div class="info-row">
                <span class="info-label">Type:</span>
                <span class="original-type">-</span>
              </div>
              <div class="info-row">
                <span class="info-label">Dimensions:</span>
                <span class="original-dimensions">-</span>
              </div>
            </div>
          </div>
          
          <div class="preview-box">
            <div class="preview-header">
              <span>Compressed</span>
              <span class="compressed-quality"></span>
            </div>
            <div class="preview-image-container">
              <div class="placeholder-text">Compression preview will appear here</div>
              <img class="preview-image compressed-preview hidden" src="">
            </div>
            <div class="preview-info compressed-info hidden">
              <div class="info-row">
                <span class="info-label">Size:</span>
                <span class="compressed-size">-</span>
              </div>
              <div class="info-row">
                <span class="info-label">Type:</span>
                <span class="compressed-type">-</span>
              </div>
              <div class="info-row">
                <span class="info-label">Dimensions:</span>
                <span class="compressed-dimensions">-</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="file-size-comparison hidden">
          <span class="compression-percentage">-</span>
          <div class="file-size-bar">
            <div class="file-size-progress"></div>
          </div>
        </div>
        
        <div class="error-message hidden"></div>
        
        <div class="actions-container">
          <button class="compress-button" disabled>Compress Image</button>
          <button class="download-button" disabled>Download</button>
        </div>
      </div>
    `;
  }

  updateStyles() {
    const styleElement = this.shadowRoot.querySelector('#dynamic-styles');
    if (styleElement) {
      styleElement.textContent = this.getStyles();
    }
  }

  loadCompressorScript() {
    return new Promise((resolve, reject) => {
      if (window.Compressor) {
        resolve(window.Compressor);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/compressorjs/1.1.1/compressor.min.js';
      script.onload = () => resolve(window.Compressor);
      script.onerror = () => {
        this.showError('Failed to load CompressorJS library. Please check your internet connection.');
        reject(new Error('Failed to load CompressorJS library'));
      };
      document.head.appendChild(script);
    });
  }

  initializeListeners() {
    const dropArea = this.shadowRoot.querySelector('.drop-area');
    const fileInput = this.shadowRoot.querySelector('.file-input');
    const browseButton = this.shadowRoot.querySelector('.browse-button');
    const compressButton = this.shadowRoot.querySelector('.compress-button');
    const downloadButton = this.shadowRoot.querySelector('.download-button');
    const qualitySlider = this.shadowRoot.querySelector('#quality-slider');
    const qualityValue = this.shadowRoot.querySelector('.range-value');
    const resizeMode = this.shadowRoot.querySelector('#resize-mode');
    const resizeOptions = this.shadowRoot.querySelector('#resize-options');
    const advancedToggle = this.shadowRoot.querySelector('.advanced-toggle');
    const advancedOptions = this.shadowRoot.querySelector('.advanced-options');

    // Set up drag and drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropArea.addEventListener(eventName, () => {
        dropArea.classList.add('drag-over');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, () => {
        dropArea.classList.remove('drag-over');
      }, false);
    });

    dropArea.addEventListener('drop', (e) => {
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        this.handleImageSelection(file);
      } else {
        this.showError('Please drop a valid image file');
      }
    }, false);

    // File input handling
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleImageSelection(e.target.files[0]);
      }
    });

    browseButton.addEventListener('click', () => {
      fileInput.click();
    });

    // Compression button
    compressButton.addEventListener('click', () => {
      this.compressImage();
    });

    // Download button
    downloadButton.addEventListener('click', () => {
      this.downloadCompressedImage();
    });

    // Quality slider
    qualitySlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      qualityValue.textContent = `${Math.round(value * 100)}%`;
      this.compressorOptions.quality = value;
    });

    // Resize mode
    resizeMode.addEventListener('change', () => {
      this.updateResizeOptions();
    });

    // Advanced options toggle
    advancedToggle.addEventListener('click', () => {
      advancedOptions.classList.toggle('visible');
      advancedToggle.textContent = advancedOptions.classList.contains('visible') 
        ? 'Hide Advanced Options' 
        : 'Show Advanced Options';
    });

    // Set up other option listeners
    this.shadowRoot.querySelector('#mime-type').addEventListener('change', (e) => {
      this.compressorOptions.mimeType = e.target.value;
    });

    this.shadowRoot.querySelector('#width-input').addEventListener('change', (e) => {
      this.compressorOptions.width = e.target.value ? parseInt(e.target.value) : undefined;
    });

    this.shadowRoot.querySelector('#height-input').addEventListener('change', (e) => {
      this.compressorOptions.height = e.target.value ? parseInt(e.target.value) : undefined;
    });

    this.shadowRoot.querySelector('#max-width-input').addEventListener('change', (e) => {
      this.compressorOptions.maxWidth = e.target.value ? parseInt(e.target.value) : undefined;
    });

    this.shadowRoot.querySelector('#max-height-input').addEventListener('change', (e) => {
      this.compressorOptions.maxHeight = e.target.value ? parseInt(e.target.value) : undefined;
    });

    this.shadowRoot.querySelector('#min-width-input').addEventListener('change', (e) => {
      this.compressorOptions.minWidth = e.target.value ? parseInt(e.target.value) : 0;
    });

    this.shadowRoot.querySelector('#min-height-input').addEventListener('change', (e) => {
      this.compressorOptions.minHeight = e.target.value ? parseInt(e.target.value) : 0;
    });

    this.shadowRoot.querySelector('#check-orientation').addEventListener('change', (e) => {
      this.compressorOptions.checkOrientation = e.target.checked;
    });

    this.shadowRoot.querySelector('#strict-mode').addEventListener('change', (e) => {
      this.compressorOptions.strict = e.target.checked;
    });

    this.shadowRoot.querySelector('#check-type').addEventListener('change', (e) => {
      this.compressorOptions.checkType = e.target.checked;
    });

    this.shadowRoot.querySelector('#convert-size').addEventListener('change', (e) => {
      this.compressorOptions.convertSize = e.target.value ? parseInt(e.target.value) : 5000000;
    });

    this.shadowRoot.querySelector('#convert-png').addEventListener('change', () => {
      this.updateConvertTypes();
    });

    this.shadowRoot.querySelector('#convert-bmp').addEventListener('change', () => {
      this.updateConvertTypes();
    });

    this.shadowRoot.querySelector('#convert-tiff').addEventListener('change', () => {
      this.updateConvertTypes();
    });
  }

  updateResizeOptions() {
    const resizeMode = this.shadowRoot.querySelector('#resize-mode').value;
    const resizeOptions = this.shadowRoot.querySelector('#resize-options');
    const widthOption = this.shadowRoot.querySelector('#width-option');
    const heightOption = this.shadowRoot.querySelector('#height-option');
    const maxWidthOption = this.shadowRoot.querySelector('#max-width-option');
    const maxHeightOption = this.shadowRoot.querySelector('#max-height-option');
    const minWidthOption = this.shadowRoot.querySelector('#min-width-option');
    const minHeightOption = this.shadowRoot.querySelector('#min-height-option');
    
    // Reset all options
    widthOption.classList.add('hidden');
    heightOption.classList.add('hidden');
    maxWidthOption.classList.add('hidden');
    maxHeightOption.classList.add('hidden');
    minWidthOption.classList.add('hidden');
    minHeightOption.classList.add('hidden');
    
    // Reset all values in compressorOptions
    this.compressorOptions.width = undefined;
    this.compressorOptions.height = undefined;
    this.compressorOptions.maxWidth = undefined;
    this.compressorOptions.maxHeight = undefined;
    this.compressorOptions.minWidth = 0;
    this.compressorOptions.minHeight = 0;
    
    // Show options based on selected mode
    if (resizeMode === 'none') {
      resizeOptions.classList.add('hidden');
      this.compressorOptions.resize = 'none';
    } else {
      resizeOptions.classList.remove('hidden');
      
      if (resizeMode === 'width') {
        widthOption.classList.remove('hidden');
        this.compressorOptions.resize = 'width';
      } else if (resizeMode === 'height') {
        heightOption.classList.remove('hidden');
        this.compressorOptions.resize = 'height';
      } else if (resizeMode === 'both') {
        widthOption.classList.remove('hidden');
        heightOption.classList.remove('hidden');
        this.compressorOptions.resize = 'both';
      } else if (resizeMode === 'max') {
        maxWidthOption.classList.remove('hidden');
        maxHeightOption.classList.remove('hidden');
        this.compressorOptions.resize = 'max';
      } else if (resizeMode === 'min') {
        minWidthOption.classList.remove('hidden');
        minHeightOption.classList.remove('hidden');
        this.compressorOptions.resize = 'min';
      }
    }
  }

  updateConvertTypes() {
    const convertPng = this.shadowRoot.querySelector('#convert-png').checked;
    const convertBmp = this.shadowRoot.querySelector('#convert-bmp').checked;
    const convertTiff = this.shadowRoot.querySelector('#convert-tiff').checked;
    
    const convertTypes = [];
    if (convertPng) convertTypes.push('image/png');
    if (convertBmp) convertTypes.push('image/bmp');
    if (convertTiff) convertTypes.push('image/tiff');
    
    this.compressorOptions.convertTypes = convertTypes;
  }

  handleImageSelection(file) {
    if (!file || !file.type.startsWith('image/')) {
      this.showError('Please select a valid image file');
      return;
    }
    
    this.inputFile = file;
    this.hideError();
    
    // Enable compress button
    this.shadowRoot.querySelector('.compress-button').disabled = false;
    
    // Update drop area
    const dropArea = this.shadowRoot.querySelector('.drop-area');
    dropArea.classList.add('has-image');
    
    // Show original image preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const originalPreview = this.shadowRoot.querySelector('.original-preview');
      originalPreview.src = e.target.result;
      originalPreview.classList.remove('hidden');
      this.shadowRoot.querySelector('.preview-image-container .placeholder-text').classList.add('hidden');
      
      // Get original image info
      this.updateOriginalInfo(file);
    };
    reader.readAsDataURL(file);
  }

  updateOriginalInfo(file) {
    const originalInfo = this.shadowRoot.querySelector('.original-info');
    const originalSize = this.shadowRoot.querySelector('.original-size');
    const originalType = this.shadowRoot.querySelector('.original-type');
    const originalDimensions = this.shadowRoot.querySelector('.original-dimensions');
    
    originalSize.textContent = this.formatFileSize(file.size);
    originalType.textContent = file.type;
    
    // Get image dimensions
    const img = new Image();
    img.onload = () => {
      originalDimensions.textContent = `${img.width} × ${img.height}`;
      originalInfo.classList.remove('hidden');
    };
    img.src = URL.createObjectURL(file);
  }

  async compressImage() {
    if (!this.inputFile) {
      this.showError('Please select an image first');
      return;
    }
    
    try {
      // Show loading state
      const compressButton = this.shadowRoot.querySelector('.compress-button');
      const buttonText = compressButton.textContent;
      compressButton.innerHTML = '<span class="loading-spinner"></span> Compressing...';
      compressButton.disabled = true;
      
      // Ensure CompressorJS is loaded
      await this.loadCompressorScript();
      
      // Create options object based on current settings
      const options = { ...this.compressorOptions };
      
      // Adjust options based on resize mode
      const resizeMode = this.shadowRoot.querySelector('#resize-mode').value;
      if (resizeMode === 'none') {
        options.width = undefined;
        options.height = undefined;
        options.maxWidth = undefined;
        options.maxHeight = undefined;
      }
      
      // Compress the image
      const compressedBlob = await new Promise((resolve, reject) => {
        new Compressor(this.inputFile, {
          ...options,
          success: (result) => {
            resolve(result);
          },
          error: (err) => {
            reject(err);
          }
        });
      });
      
      // Preview the compressed image
      this.updateCompressedPreview(compressedBlob);
      
      // Enable download button
      this.shadowRoot.querySelector('.download-button').disabled = false;
      
      // Reset button state
      compressButton.innerHTML = buttonText;
      compressButton.disabled = false;
      
    } catch (error) {
      this.showError(`Compression failed: ${error.message}`);
      
      // Reset button state
      const compressButton = this.shadowRoot.querySelector('.compress-button');
      compressButton.textContent = 'Compress Image';
      compressButton.disabled = false;
    }
  }
  
  async updateCompressedPreview(blob) {
    const compressedPreview = this.shadowRoot.querySelector('.compressed-preview');
    const placeholderText = this.shadowRoot.querySelector('.preview-box:nth-child(2) .placeholder-text');
    const compressedInfo = this.shadowRoot.querySelector('.compressed-info');
    const compressedSize = this.shadowRoot.querySelector('.compressed-size');
    const compressedType = this.shadowRoot.querySelector('.compressed-type');
    const compressedDimensions = this.shadowRoot.querySelector('.compressed-dimensions');
    const compressedQuality = this.shadowRoot.querySelector('.compressed-quality');
    
    // Store compressed blob for download
    this.compressedBlob = blob;
    
    // Update preview image
    compressedPreview.src = URL.createObjectURL(blob);
    compressedPreview.classList.remove('hidden');
    placeholderText.classList.add('hidden');
    
    // Update compressed info
    compressedSize.textContent = this.formatFileSize(blob.size);
    compressedType.textContent = blob.type;
    
    // Get compressed image dimensions
    const img = new Image();
    img.onload = () => {
      compressedDimensions.textContent = `${img.width} × ${img.height}`;
      compressedInfo.classList.remove('hidden');
      
      // Update compression info
      this.updateCompressionComparison();
    };
    img.src = URL.createObjectURL(blob);
    
    // Update quality info
    compressedQuality.textContent = `${Math.round(this.compressorOptions.quality * 100)}%`;
  }
  
  updateCompressionComparison() {
    if (!this.inputFile || !this.compressedBlob) return;
    
    const comparisonContainer = this.shadowRoot.querySelector('.file-size-comparison');
    const compressionPercentage = this.shadowRoot.querySelector('.compression-percentage');
    const progressBar = this.shadowRoot.querySelector('.file-size-progress');
    
    // Calculate compression percentage
    const originalSize = this.inputFile.size;
    const compressedSize = this.compressedBlob.size;
    const savedPercentage = Math.round((1 - (compressedSize / originalSize)) * 100);
    
    // Update UI
    compressionPercentage.textContent = savedPercentage > 0 
      ? `Reduced by ${savedPercentage}%` 
      : 'No size reduction';
      
    // Update progress bar (represents compressed size relative to original)
    const ratio = Math.min(compressedSize / originalSize, 1);
    progressBar.style.width = `${ratio * 100}%`;
    
    // Show comparison
    comparisonContainer.classList.remove('hidden');
  }
  
  downloadCompressedImage() {
    if (!this.compressedBlob) {
      this.showError('No compressed image available for download');
      return;
    }
    
    // Create file name based on original with suffix
    const originalName = this.inputFile.name;
    const extension = this.getExtensionFromMimeType(this.compressedBlob.type);
    const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    const newFileName = `${nameWithoutExt}_compressed.${extension}`;
    
    // Create download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(this.compressedBlob);
    link.download = newFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  getExtensionFromMimeType(mimeType) {
    const typeMap = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/bmp': 'bmp',
      'image/tiff': 'tiff'
    };
    
    return typeMap[mimeType] || 'jpg';
  }
  
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  showError(message) {
    const errorElement = this.shadowRoot.querySelector('.error-message');
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
  }
  
  hideError() {
    const errorElement = this.shadowRoot.querySelector('.error-message');
    errorElement.classList.add('hidden');
  }
}

// Define the custom element
customElements.define('advanced-image-compressor', AdvancedImageCompressor);
