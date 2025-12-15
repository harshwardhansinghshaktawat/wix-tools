/**
 * Enhanced Color Palette Generator with Customization
 * A Wix custom element that helps users generate, pick, and extract colors for various design purposes.
 */
class ColorPaletteGenerator extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Default settings
    this.settings = {
      primaryBg: '#ffffff',
      secondaryBg: '#f9f9f9',
      borderColor: '#e0e0e0',
      secondaryText: '#666666',
      mainAccent: '#4287f5',
      hoverAccent: '#2a75e6',
      headingColor: '#2c3e50',
      paragraphColor: '#333333',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      fontSize: 14,
      headingSize: 24,
      borderRadius: 8,
      buttonPadding: 12
    };
    
    this.colorPalette = [];
    this.lockedColors = [];
    this.selectedDesignType = 'general';
    this.selectedThemeType = 'none';
    this.imageColors = [];
    this.pickedColor = '#4287f5';
    this.colorHarmonyType = 'complementary';
    
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
      ${this.getHTML()}
    `;
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
        --box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        --transition: all 0.3s ease;
      }
      
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
        background-color: var(--primary-bg);
        border-radius: calc(var(--border-radius) * 1.5);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      }
      
      h1, h2, h3 {
        color: var(--heading-color);
        font-family: var(--font-family);
      }
      
      h1 {
        text-align: center;
        margin-bottom: 2rem;
        font-weight: 700;
        font-size: calc(var(--heading-size) + 6px);
        background: linear-gradient(45deg, var(--main-accent), var(--hover-accent));
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      
      h2 {
        font-size: var(--heading-size);
        margin: 0;
      }
      
      h3 {
        font-size: calc(var(--font-size) + 4px);
        margin-bottom: 1rem;
      }
      
      .section {
        margin-bottom: 2rem;
        padding: 1.5rem;
        background-color: var(--secondary-bg);
        border-radius: var(--border-radius);
        box-shadow: var(--box-shadow);
        border: 1px solid var(--border-color);
      }
      
      .section-header {
        display: flex;
        align-items: center;
        margin-bottom: 1rem;
      }
      
      .section-icon {
        width: 32px;
        height: 32px;
        margin-right: 12px;
        color: var(--main-accent);
        fill: var(--main-accent);
      }
      
      /* Design Type Selector */
      .selector-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 1.5rem;
      }
      
      .selector-tab {
        padding: var(--button-padding) 20px;
        background-color: var(--primary-bg);
        border: 2px solid var(--border-color);
        border-radius: var(--border-radius);
        cursor: pointer;
        transition: var(--transition);
        font-weight: 500;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--font-size);
        font-family: var(--font-family);
        color: var(--paragraph-color);
      }
      
      .selector-tab:hover {
        border-color: var(--main-accent);
        transform: translateY(-2px);
      }
      
      .selector-tab.active {
        background-color: var(--main-accent);
        color: var(--primary-bg);
        border-color: var(--main-accent);
      }
      
      .selector-tab-icon {
        margin-right: 8px;
        font-size: 1.2em;
      }
      
      /* Color Harmony Selector */
      .color-harmony {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 1.5rem;
      }
      
      .harmony-type {
        padding: 8px 16px;
        background-color: var(--primary-bg);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        cursor: pointer;
        transition: var(--transition);
        font-size: calc(var(--font-size) - 1px);
        font-family: var(--font-family);
        color: var(--paragraph-color);
      }
      
      .harmony-type.active {
        background-color: var(--main-accent);
        color: var(--primary-bg);
        border-color: var(--main-accent);
      }
      
      /* Color Picker */
      .color-picker-container {
        display: flex;
        flex-wrap: wrap;
        gap: 2rem;
        margin-bottom: 1.5rem;
      }
      
      .color-picker {
        flex: 1;
        min-width: 300px;
      }
      
      .color-preview {
        height: 120px;
        border-radius: var(--border-radius);
        margin-bottom: 1rem;
        box-shadow: var(--box-shadow);
        position: relative;
        overflow: hidden;
        transition: var(--transition);
        border: 2px solid var(--border-color);
      }
      
      .color-preview-inner {
        width: 100%;
        height: 100%;
        transition: var(--transition);
      }
      
      .color-controls {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .color-slider-container {
        display: flex;
        align-items: center;
      }
      
      .slider-label {
        width: 20px;
        text-align: center;
        font-weight: bold;
        margin-right: 10px;
        color: var(--paragraph-color);
        font-family: var(--font-family);
        font-size: var(--font-size);
      }
      
      .color-slider {
        flex: 1;
        -webkit-appearance: none;
        height: 10px;
        border-radius: 5px;
        outline: none;
      }
      
      .color-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--primary-bg);
        cursor: pointer;
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
        border: 2px solid var(--main-accent);
      }
      
      #red-slider {
        background: linear-gradient(to right, #000, #f00);
      }
      
      #green-slider {
        background: linear-gradient(to right, #000, #0f0);
      }
      
      #blue-slider {
        background: linear-gradient(to right, #000, #00f);
      }
      
      .color-inputs {
        display: flex;
        gap: 12px;
        margin-top: 1rem;
      }
      
      .color-input-group {
        flex: 1;
      }
      
      .color-input-group label {
        display: block;
        margin-bottom: 4px;
        font-size: calc(var(--font-size) - 1px);
        color: var(--secondary-text);
        font-family: var(--font-family);
      }
      
      .color-input {
        width: 100%;
        padding: 8px 12px;
        border: 2px solid var(--border-color);
        border-radius: var(--border-radius);
        font-family: monospace;
        transition: var(--transition);
        position: relative;
        background-color: var(--primary-bg);
        color: var(--paragraph-color);
        font-size: var(--font-size);
        box-sizing: border-box;
      }
      
      .color-input:focus {
        border-color: var(--main-accent);
        outline: none;
      }
      
      .copy-btn {
        position: absolute;
        right: 8px;
        top: 8px;
        background-color: rgba(255, 255, 255, 0.6);
        border: none;
        border-radius: calc(var(--border-radius) / 2);
        padding: 4px 8px;
        cursor: pointer;
        transition: var(--transition);
        font-size: calc(var(--font-size) - 2px);
        font-family: var(--font-family);
      }
      
      .copy-btn:hover {
        background-color: rgba(255, 255, 255, 0.9);
      }
      
      /* Generated Palette */
      .generated-palette {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 1.5rem;
        margin-top: 1.5rem;
      }
      
      .palette-color {
        border-radius: var(--border-radius);
        overflow: hidden;
        box-shadow: var(--box-shadow);
        transition: var(--transition);
        position: relative;
        border: 1px solid var(--border-color);
      }
      
      .palette-color:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
      }
      
      .color-block {
        height: 150px;
        width: 100%;
        position: relative;
      }
      
      .color-lock {
        position: absolute;
        top: 10px;
        right: 10px;
        background-color: rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 5;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: var(--transition);
      }
      
      .color-lock:hover {
        background-color: rgba(255, 255, 255, 0.9);
        transform: scale(1.1);
      }
      
      .color-lock svg {
        width: 16px;
        height: 16px;
        fill: #666;
        transition: var(--transition);
      }
      
      .color-lock.locked svg {
        fill: var(--main-accent);
      }
      
      .color-edit {
        position: absolute;
        top: 10px;
        left: 10px;
        background-color: rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 5;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: var(--transition);
      }
      
      .color-edit:hover {
        background-color: rgba(255, 255, 255, 0.9);
        transform: scale(1.1);
      }
      
      .color-edit svg {
        width: 16px;
        height: 16px;
        fill: #666;
        transition: var(--transition);
      }
      
      .color-info {
        padding: 1rem;
        background-color: var(--primary-bg);
      }
      
      .color-name {
        margin: 0 0 0.5rem 0;
        font-size: calc(var(--font-size) + 2px);
        font-weight: 600;
        color: var(--heading-color);
        font-family: var(--font-family);
      }
      
      .color-code {
        font-family: monospace;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 10px;
        background-color: var(--secondary-bg);
        border-radius: calc(var(--border-radius) / 2);
        margin-bottom: 8px;
        font-size: calc(var(--font-size) - 1px);
        color: var(--paragraph-color);
      }
      
      .copy-code-btn {
        background: none;
        border: none;
        color: var(--main-accent);
        cursor: pointer;
        transition: var(--transition);
        font-size: calc(var(--font-size) + 2px);
      }
      
      .copy-code-btn:hover {
        color: var(--heading-color);
        transform: scale(1.1);
      }
      
      /* Image Color Extractor */
      .image-upload {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border: 2px dashed var(--border-color);
        border-radius: var(--border-radius);
        padding: 2rem;
        margin-bottom: 1.5rem;
        transition: var(--transition);
        text-align: center;
        background-color: var(--primary-bg);
      }
      
      .image-upload:hover, .image-upload.dragover {
        border-color: var(--main-accent);
        background-color: var(--secondary-bg);
      }
      
      .upload-icon {
        font-size: 3rem;
        color: var(--border-color);
        margin-bottom: 1rem;
      }
      
      .upload-text {
        margin-bottom: 1rem;
        color: var(--paragraph-color);
        font-family: var(--font-family);
        font-size: var(--font-size);
      }
      
      .upload-btn {
        background-color: var(--main-accent);
        color: var(--primary-bg);
        border: none;
        padding: calc(var(--button-padding) - 2px) 20px;
        border-radius: var(--border-radius);
        cursor: pointer;
        transition: var(--transition);
        font-weight: 500;
        font-size: var(--font-size);
        font-family: var(--font-family);
      }
      
      .upload-btn:hover {
        background-color: var(--hover-accent);
        transform: translateY(-2px);
      }
      
      #file-input {
        display: none;
      }
      
      .image-preview-container {
        display: none;
        margin-top: 1.5rem;
        width: 100%;
      }
      
      .image-preview-container.active {
        display: block;
      }
      
      .image-preview {
        max-width: 100%;
        height: auto;
        border-radius: var(--border-radius);
        box-shadow: var(--box-shadow);
        max-height: 400px;
        display: block;
        margin: 0 auto;
      }
      
      .eyedropper-instructions {
        margin-top: 1rem;
        text-align: center;
        color: var(--secondary-text);
        font-family: var(--font-family);
        font-size: var(--font-size);
      }
      
      .image-colors {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 1.5rem;
        justify-content: center;
      }
      
      .image-color {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: var(--box-shadow);
        transition: var(--transition);
        position: relative;
        border: 2px solid var(--border-color);
      }
      
      .image-color:hover {
        transform: scale(1.1);
      }
      
      .image-color.selected {
        border: 3px solid var(--primary-bg);
        outline: 2px solid var(--main-accent);
      }
      
      .image-color-tooltip {
        position: absolute;
        bottom: -40px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #333;
        color: white;
        padding: 4px 8px;
        border-radius: calc(var(--border-radius) / 2);
        font-size: calc(var(--font-size) - 2px);
        font-family: monospace;
        opacity: 0;
        visibility: hidden;
        transition: var(--transition);
        white-space: nowrap;
        z-index: 10;
      }
      
      .image-color:hover .image-color-tooltip {
        opacity: 1;
        visibility: visible;
      }
      
      /* Canvas for color picking */
      #canvas-container {
        position: relative;
        width: 100%;
        display: none;
      }
      
      #color-canvas {
        cursor: crosshair;
        max-width: 100%;
        height: auto;
        border-radius: var(--border-radius);
        box-shadow: var(--box-shadow);
      }
      
      #canvas-overlay {
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
        z-index: 5;
      }
      
      .color-picker-cursor {
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid white;
        pointer-events: none;
        transform: translate(-50%, -50%);
        z-index: 10;
        box-shadow: 0 0 0 1px black;
      }
      
      /* Buttons & Controls */
      .btn-container {
        display: flex;
        gap: 1rem;
        margin-top: 1.5rem;
        flex-wrap: wrap;
      }
      
      .btn {
        padding: var(--button-padding) 24px;
        border-radius: var(--border-radius);
        border: none;
        font-weight: 500;
        cursor: pointer;
        transition: var(--transition);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--font-size);
        font-family: var(--font-family);
      }
      
      .btn-primary {
        background-color: var(--main-accent);
        color: var(--primary-bg);
      }
      
      .btn-primary:hover {
        background-color: var(--hover-accent);
        transform: translateY(-2px);
      }
      
      .btn-secondary {
        background-color: var(--primary-bg);
        color: var(--heading-color);
        border: 2px solid var(--border-color);
      }
      
      .btn-secondary:hover {
        border-color: var(--main-accent);
        color: var(--main-accent);
        transform: translateY(-2px);
      }
      
      .btn-icon {
        margin-right: 8px;
        font-size: 1.1em;
      }
      
      /* Notification */
      .notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: #333;
        color: white;
        padding: 12px 24px;
        border-radius: var(--border-radius);
        box-shadow: var(--box-shadow);
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.3s, transform 0.3s;
        z-index: 100;
        font-family: var(--font-family);
        font-size: var(--font-size);
      }
      
      .notification.show {
        opacity: 1;
        transform: translateY(0);
      }
      
      /* Themes Selector */
      .themes-container {
        margin-top: 1rem;
      }

      .color-harmony-section {
        flex: 1;
        min-width: 300px;
      }
      
      /* Responsive */
      @media (max-width: 768px) {
        .container {
          padding: 1rem;
        }
        
        h1 {
          font-size: calc(var(--heading-size) + 2px);
        }
        
        .selector-tabs {
          flex-direction: column;
        }
        
        .color-picker-container {
          flex-direction: column;
        }
        
        .generated-palette {
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        }
        
        .btn-container {
          flex-direction: column;
        }
      }
      
      /* Animations */
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .fade-in {
        animation: fadeIn 0.5s ease forwards;
      }
      
      /* Icons */
      .icon {
        display: inline-block;
        width: 1em;
        height: 1em;
        stroke-width: 0;
        stroke: currentColor;
        fill: currentColor;
      }
    `;
  }

  getHTML() {
    return `
      <div class="container">
        <h1>Color Palette Generator</h1>
        
        <div class="section">
          <div class="section-header">
            <svg class="section-icon" viewBox="0 0 24 24">
              <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/>
              <path d="M12 5c-.553 0-1 .447-1 1s.447 1 1 1 1-.447 1-1-.447-1-1-1zM12 17c-.553 0-1 .447-1 1s.447 1 1 1 1-.447 1-1-.447-1-1-1zM7 12c0 .553-.447 1-1 1s-1-.447-1-1 .447-1 1-1 1 .447 1 1zM19 12c0 .553-.447 1-1 1s-1-.447-1-1 .447-1 1-1 1 .447 1 1z"/>
            </svg>
            <h2>Design Type</h2>
          </div>
          
          <div class="selector-tabs design-types">
            <div class="selector-tab active" data-type="general">
              <span class="selector-tab-icon">🎨</span>
              General Purpose
            </div>
            <div class="selector-tab" data-type="website">
              <span class="selector-tab-icon">🌐</span>
              Website
            </div>
            <div class="selector-tab" data-type="youtube">
              <span class="selector-tab-icon">📺</span>
              YouTube Thumbnail
            </div>
            <div class="selector-tab" data-type="facebook">
              <span class="selector-tab-icon">👍</span>
              Facebook Ads
            </div>
            <div class="selector-tab" data-type="google">
              <span class="selector-tab-icon">🔍</span>
              Google Ads
            </div>
            <div class="selector-tab" data-type="instagram">
              <span class="selector-tab-icon">📷</span>
              Instagram
            </div>
          </div>
          
          <div class="themes-container">
            <div class="section-header">
              <svg class="section-icon" viewBox="0 0 24 24">
                <path d="M4 16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v8zm2-8h12v8H6V8zm8 4c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z"/>
              </svg>
              <h2>Color Theme</h2>
            </div>
            
            <div class="selector-tabs theme-types">
              <div class="selector-tab active" data-theme="none">
                <span class="selector-tab-icon">🔄</span>
                Standard
              </div>
              <div class="selector-tab" data-theme="spring">
                <span class="selector-tab-icon">🌱</span>
                Spring
              </div>
              <div class="selector-tab" data-theme="summer">
                <span class="selector-tab-icon">☀️</span>
                Summer
              </div>
              <div class="selector-tab" data-theme="softSummer">
                <span class="selector-tab-icon">🏖️</span>
                Soft Summer
              </div>
              <div class="selector-tab" data-theme="autumn">
                <span class="selector-tab-icon">🍂</span>
                Autumn
              </div>
              <div class="selector-tab" data-theme="softAutumn">
                <span class="selector-tab-icon">🍁</span>
                Soft Autumn
              </div>
              <div class="selector-tab" data-theme="winter">
                <span class="selector-tab-icon">❄️</span>
                Winter
              </div>
              <div class="selector-tab" data-theme="deepWinter">
                <span class="selector-tab-icon">🌨️</span>
                Deep Winter
              </div>
              <div class="selector-tab" data-theme="pastel">
                <span class="selector-tab-icon">🍭</span>
                Pastel
              </div>
              <div class="selector-tab" data-theme="dark">
                <span class="selector-tab-icon">🌑</span>
                Dark
              </div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-header">
            <svg class="section-icon" viewBox="0 0 24 24">
              <path d="M19.071 4.929c-3.899-3.898-10.243-3.898-14.143 0-3.898 3.899-3.898 10.244 0 14.143 3.899 3.898 10.243 3.898 14.143 0 3.899-3.9 3.899-10.244 0-14.143zm-3.536 10.607-2.828-2.829-3.535 3.536-1.414-1.414 3.535-3.536-2.828-2.829 1.414-1.414 2.828 2.829 2.828-2.829 1.414 1.414-2.828 2.829 2.828 2.829-1.414 1.414z"/>
            </svg>
            <h2>Color Picker</h2>
          </div>
          
          <div class="color-picker-container">
            <div class="color-picker">
              <div class="color-preview">
                <div class="color-preview-inner" id="color-preview" style="background-color: #4287f5;">
                  <button class="copy-btn" id="copy-preview-btn">Copy</button>
                </div>
              </div>
              
              <div class="color-controls">
                <div class="color-slider-container">
                  <span class="slider-label">R</span>
                  <input type="range" min="0" max="255" value="66" class="color-slider" id="red-slider">
                </div>
                <div class="color-slider-container">
                  <span class="slider-label">G</span>
                  <input type="range" min="0" max="255" value="135" class="color-slider" id="green-slider">
                </div>
                <div class="color-slider-container">
                  <span class="slider-label">B</span>
                  <input type="range" min="0" max="255" value="245" class="color-slider" id="blue-slider">
                </div>
                
                <div class="color-inputs">
                  <div class="color-input-group">
                    <label for="hex-input">HEX</label>
                    <input type="text" id="hex-input" class="color-input" value="#4287f5">
                  </div>
                  <div class="color-input-group">
                    <label for="rgb-input">RGB</label>
                    <input type="text" id="rgb-input" class="color-input" value="rgb(66, 135, 245)">
                  </div>
                  <div class="color-input-group">
                    <label for="hsl-input">HSL</label>
                    <input type="text" id="hsl-input" class="color-input" value="hsl(213, 90%, 61%)">
                  </div>
                </div>
              </div>
            </div>
            
            <div class="color-harmony-section">
              <h3>Color Harmony</h3>
              <div class="color-harmony">
                <div class="harmony-type active" data-harmony="complementary">Complementary</div>
                <div class="harmony-type" data-harmony="analogous">Analogous</div>
                <div class="harmony-type" data-harmony="triadic">Triadic</div>
                <div class="harmony-type" data-harmony="tetradic">Tetradic</div>
                <div class="harmony-type" data-harmony="monochromatic">Monochromatic</div>
              </div>
              
              <div class="btn-container">
                <button id="generate-palette-btn" class="btn btn-primary">
                  <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 22c5.514 0 10-4.486 10-10S17.514 2 12 2 2 6.486 2 12s4.486 10 10 10zm0-18c4.411 0 8 3.589 8 8s-3.589 8-8 8-3.589-8-8-8 3.589-8 8-8z"/>
                    <path d="M12 19c.828 0 1.5-.672 1.5-1.5S12.828 16 12 16s-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm-3.75-6.879 1.386-.823C9.954 10.528 10.906 10 12 10c1.47 0 2.5 1.03 2.5 2.5 0 .979-.575 1.792-1.422 2.188l-1.273.754C11.307 15.754 11 16.214 11 16.754V17h2v-.246c0-.011.062-.047.138-.09l1.25-.741C15.353 15.292 16 13.952 16 12.5 16 10.015 14.168 8 12 8c-1.835 0-3.444.976-4.083 2.445l-.167.374z"/>
                  </svg>
                  Generate Palette
                </button>
                <button id="random-color-btn" class="btn btn-secondary">
                  <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 9v3h-6V9h-3v6h3v-3h6v3h3V9z"/>
                    <path d="M3 3h6v6H3zm2 2v2h2V5zm10-2h6v6h-6zm2 2v2h2V5zM3 13h6v6H3zm2 2v2h2v-2z"/>
                  </svg>
                  Random Color
                </button>
              </div>
            </div>
          </div>
          
          <div id="palette-container">
            <h3>Generated Palette</h3>
            <div class="generated-palette" id="generated-palette">
              <!-- Palette colors will be added here dynamically -->
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-header">
            <svg class="section-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 4h16v16H4z"/>
              <path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm0 18H6V4h12z"/>
              <path d="M12 9c1.654 0 3-1.346 3-3s-1.346-3-3-3-3 1.346-3 3 1.346 3 3 3zm0-4a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM12 10c-2.757 0-5 2.243-5 5s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5zm0 8c-1.654 0-3-1.346-3-3s1.346-3 3-3 3 1.346 3 3-1.346 3-3 3z"/>
            </svg>
            <h2>Extract Colors from Image</h2>
          </div>
          
          <div class="image-upload" id="image-upload">
            <svg class="upload-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H8c-1.103 0-2 .897-2 2v12c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2V4c0-1.103-.897-2-2-2zM8 16V4h12l.002 12H8z"/>
              <path d="m10.043 8.265 1.957-1.958 1.957 1.958a1.004 1.004 0 0 0 1.414 0 1.002 1.002 0 0 0 0-1.414L12.414 3.35a1 1 0 0 0-1.414 0L7.629 6.851a.999.999 0 0 0 0 1.414c.39.391 1.024.39 1.414 0z"/>
              <path d="M12 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0-4a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM4 22h12c1.103 0 2-.897 2-2v-2h-2v2H4V8H2v12c0 1.103.897 2 2 2z"/>
            </svg>
            <p class="upload-text">Drag & drop an image here or click to browse</p>
            <button class="upload-btn" id="upload-btn">Choose Image</button>
            <input type="file" id="file-input" accept="image/*">
          </div>
          
          <div class="image-preview-container" id="image-preview-container">
            <div id="canvas-container">
              <canvas id="color-canvas"></canvas>
              <div id="canvas-overlay"></div>
              <div class="color-picker-cursor" id="color-picker-cursor"></div>
            </div>
            <p class="eyedropper-instructions">Click on the image to pick colors</p>
            
            <h3>Extracted Colors</h3>
            <div class="image-colors" id="image-colors">
              <!-- Extracted colors will be added here dynamically -->
            </div>
            
            <div class="btn-container">
              <button id="extract-palette-btn" class="btn btn-primary">
                <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 14c-1.103 0-2 .897-2 2s.897 2 2 2 2-.897 2-2-.897-2-2-2z"/>
                  <path d="M19 8h-1.5c-2.484 0-4.5 2.016-4.5 4.5S15.016 17 17.5 17H19c1.103 0 2-.897 2-2v-5c0-1.103-.897-2-2-2zm0 7h-1.5c-1.379 0-2.5-1.121-2.5-2.5S16.121 10 17.5 10H19v5z"/>
                  <path d="M7 7v7.269c.405-.083.812-.127 1.214-.127 3.026 0 5.5 2.475 5.5 5.5 0 .171-.01.341-.027.51H19c2.206 0 4-1.794 4-4V7c0-2.206-1.794-4-4-4H7c-2.206 0-4 1.794-4 4v10c0 2.206 1.794 4 4 4h4.269c-.083-.405-.127-.812-.127-1.214C11.142 16.761 8.639 14.258 7 14V7zm12-2c1.103 0 2 .897 2 2s-.897 2-2 2-2-.897-2-2 .897-2 2-2z"/>
                </svg>
                Generate Palette from Selected
              </button>
              <button id="reset-image-btn" class="btn btn-secondary">
                <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 16c1.671 0 3-1.329 3-3s-1.329-3-3-3-3 1.329-3 3 1.329 3 3 3z"/>
                  <path d="M20.817 11.186a8.94 8.94 0 0 0-1.355-3.219 9.053 9.053 0 0 0-2.43-2.43 8.95 8.95 0 0 0-3.219-1.355c-.266-.043-.532-.076-.798-.099V2.003c0-.554-.447-1.002-1-1.002-.553 0-1 .448-1 1.002v2.08c-.267.023-.534.056-.8.099a8.95 8.95 0 0 0-3.219 1.355 9.053 9.053 0 0 0-2.43 2.43 8.95 8.95 0 0 0-1.355 3.219c-.063.334-.095.67-.116 1.008L2 12.197v.603c0 2.278.832 4.45 2.341 6.131 1.509 1.682 3.545 2.805 5.804 3.159l.129.019c1.282.185 2.576.134 3.856-.15l.188-.043c2.259-.355 4.294-1.477 5.803-3.159 1.51-1.682 2.342-3.854 2.342-6.132v-.602l-.078-.012c-.021-.338-.052-.673-.116-1.008zm-8.81 8.001-.057.002-.051.002c-1.807 0-3.522-.733-4.795-2.117A6.426 6.426 0 0 1 5 12.205v-.206c.016-.322.044-.644.108-.966.432-2.173 2.04-3.954 4.121-4.574.336-.104.673-.181 1.014-.229.996-.138 1.987-.138 2.982 0 .341.048.678.125 1.014.229 2.08.62 3.689 2.401 4.121 4.574.064.322.092.644.108.966v.206a6.426 6.426 0 0 1-2.105 4.869c-1.228 1.339-2.867 2.074-4.598 2.112z"/>
                </svg>
                Choose Another Image
              </button>
            </div>
          </div>
        </div>
        
        <div class="notification" id="notification">Copied to clipboard!</div>
      </div>
    `;
  }

  updateStyles() {
    const styleElement = this.shadowRoot.querySelector('#dynamic-styles');
    if (styleElement) {
      styleElement.textContent = this.getStyles();
    }
  }
  
  setupEventListeners() {
    // [Continue with all the existing event listeners from the original code...]
    // The event listener code remains the same as in the original
    
    // Design type selector
    const designTypes = this.shadowRoot.querySelectorAll('.design-types .selector-tab');
    designTypes.forEach(type => {
      type.addEventListener('click', () => {
        designTypes.forEach(t => t.classList.remove('active'));
        type.classList.add('active');
        this.selectedDesignType = type.dataset.type;
      });
    });
    
    // Theme type selector
    const themeTypes = this.shadowRoot.querySelectorAll('.theme-types .selector-tab');
    themeTypes.forEach(type => {
      type.addEventListener('click', () => {
        themeTypes.forEach(t => t.classList.remove('active'));
        type.classList.add('active');
        this.selectedThemeType = type.dataset.theme;
      });
    });
    
    // Color harmony selector
    const harmonyTypes = this.shadowRoot.querySelectorAll('.harmony-type');
    harmonyTypes.forEach(type => {
      type.addEventListener('click', () => {
        harmonyTypes.forEach(t => t.classList.remove('active'));
        type.classList.add('active');
        this.colorHarmonyType = type.dataset.harmony;
      });
    });
    
    // Color slider events
    const redSlider = this.shadowRoot.getElementById('red-slider');
    const greenSlider = this.shadowRoot.getElementById('green-slider');
    const blueSlider = this.shadowRoot.getElementById('blue-slider');
    
    [redSlider, greenSlider, blueSlider].forEach(slider => {
      slider.addEventListener('input', () => this.updateColorFromSliders());
    });
    
    // Color input events
    const hexInput = this.shadowRoot.getElementById('hex-input');
    const rgbInput = this.shadowRoot.getElementById('rgb-input');
    const hslInput = this.shadowRoot.getElementById('hsl-input');
    
    hexInput.addEventListener('change', () => this.updateColorFromHex(hexInput.value));
    rgbInput.addEventListener('change', () => this.updateColorFromRgb(rgbInput.value));
    hslInput.addEventListener('change', () => this.updateColorFromHsl(hslInput.value));
    
    // Copy preview color button
    const copyPreviewBtn = this.shadowRoot.getElementById('copy-preview-btn');
    copyPreviewBtn.addEventListener('click', () => this.copyToClipboard(this.pickedColor));
    
    // Generate palette button
    const generatePaletteBtn = this.shadowRoot.getElementById('generate-palette-btn');
    generatePaletteBtn.addEventListener('click', () => this.generatePalette());
    
    // Random color button
    const randomColorBtn = this.shadowRoot.getElementById('random-color-btn');
    randomColorBtn.addEventListener('click', () => this.setRandomColor());
    
    // Image upload
    const uploadArea = this.shadowRoot.getElementById('image-upload');
    const fileInput = this.shadowRoot.getElementById('file-input');
    const uploadBtn = this.shadowRoot.getElementById('upload-btn');
    
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => this.handleImageUpload(e.target.files[0]));
    
    // Drag and drop for image upload
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
      if (e.dataTransfer.files.length) {
        this.handleImageUpload(e.dataTransfer.files[0]);
      }
    });
    
    // Reset image button
    const resetImageBtn = this.shadowRoot.getElementById('reset-image-btn');
    resetImageBtn.addEventListener('click', () => {
      const imagePreviewContainer = this.shadowRoot.getElementById('image-preview-container');
      const uploadArea = this.shadowRoot.getElementById('image-upload');
      imagePreviewContainer.classList.remove('active');
      uploadArea.style.display = 'flex';
      this.shadowRoot.getElementById('image-colors').innerHTML = '';
      this.imageColors = [];
    });
    
    // Extract palette from image colors
    const extractPaletteBtn = this.shadowRoot.getElementById('extract-palette-btn');
    extractPaletteBtn.addEventListener('click', () => {
      if (this.imageColors.length > 0) {
        this.colorPalette = this.imageColors.slice(0, 5);
        this.renderPalette();
      }
    });
    
     // Initialize palette on load
    this.generatePalette();
  }
  
  updateColorFromSliders() {
    const redSlider = this.shadowRoot.getElementById('red-slider');
    const greenSlider = this.shadowRoot.getElementById('green-slider');
    const blueSlider = this.shadowRoot.getElementById('blue-slider');
    
    const r = parseInt(redSlider.value);
    const g = parseInt(greenSlider.value);
    const b = parseInt(blueSlider.value);
    
    this.pickedColor = this.rgbToHex(r, g, b);
    this.updateColorPreview();
  }
  
  updateColorFromHex(hex) {
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      this.pickedColor = hex;
      const rgb = this.hexToRgb(hex);
      this.updateSliders(rgb.r, rgb.g, rgb.b);
      this.updateColorPreview();
    }
  }
  
  updateColorFromRgb(rgbStr) {
    const rgbMatch = rgbStr.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]);
      const g = parseInt(rgbMatch[2]);
      const b = parseInt(rgbMatch[3]);
      this.pickedColor = this.rgbToHex(r, g, b);
      this.updateSliders(r, g, b);
      this.updateColorPreview();
    }
  }
  
  updateColorFromHsl(hslStr) {
    const hslMatch = hslStr.match(/hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/);
    if (hslMatch) {
      const h = parseInt(hslMatch[1]);
      const s = parseInt(hslMatch[2]);
      const l = parseInt(hslMatch[3]);
      const rgb = this.hslToRgb(h, s, l);
      this.pickedColor = this.rgbToHex(rgb.r, rgb.g, rgb.b);
      this.updateSliders(rgb.r, rgb.g, rgb.b);
      this.updateColorPreview();
    }
  }
  
  updateSliders(r, g, b) {
    const redSlider = this.shadowRoot.getElementById('red-slider');
    const greenSlider = this.shadowRoot.getElementById('green-slider');
    const blueSlider = this.shadowRoot.getElementById('blue-slider');
    
    redSlider.value = r;
    greenSlider.value = g;
    blueSlider.value = b;
  }
  
  updateColorPreview() {
    const colorPreview = this.shadowRoot.getElementById('color-preview');
    const hexInput = this.shadowRoot.getElementById('hex-input');
    const rgbInput = this.shadowRoot.getElementById('rgb-input');
    const hslInput = this.shadowRoot.getElementById('hsl-input');
    
    colorPreview.style.backgroundColor = this.pickedColor;
    
    const rgb = this.hexToRgb(this.pickedColor);
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    
    hexInput.value = this.pickedColor;
    rgbInput.value = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    hslInput.value = `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`;
  }
  
  generatePalette() {
    // Start with a new array, but preserve locked colors
    const newPalette = [];
    const lockedPositions = {};
    
    // Record positions of locked colors
    this.lockedColors.forEach(item => {
      lockedPositions[item.position] = item.color;
    });
    
    // Use the selected base color or the picked color if there's no locked color at position 0
    const baseColorHex = lockedPositions[0] || this.pickedColor;
    const baseColor = this.hexToRgb(baseColorHex);
    const baseHsl = this.rgbToHsl(baseColor.r, baseColor.g, baseColor.b);
    
    // Add the base color
    newPalette[0] = baseColorHex;
    
    // Generate the palette based on theme type first
    if (this.selectedThemeType !== 'none') {
      this.generateThemePalette(newPalette, baseHsl, lockedPositions);
    } else {
      // If no theme selected, use harmony type
      this.generateHarmonyPalette(newPalette, baseHsl, lockedPositions);
    }
    
    // Apply design-type specific adjustments
    if (this.selectedDesignType !== 'general') {
      this.applyDesignTypeAdjustments(newPalette, lockedPositions);
    }
    
    // Set the final palette
    this.colorPalette = newPalette;
    
    // Render the palette
    this.renderPalette();
  }
  
  generateThemePalette(palette, baseHsl, lockedPositions) {
    // Define theme-specific color generation
    switch (this.selectedThemeType) {
      case 'spring': 
        this.generateSeasonalPalette(palette, {
          hueRange: [50, 140], // Yellow to green-blue
          saturationRange: [60, 90],
          lightnessRange: [50, 80]
        }, lockedPositions);
        break;
        
      case 'summer':
        this.generateSeasonalPalette(palette, {
          hueRange: [180, 280], // Cyan to purple
          saturationRange: [40, 70],
          lightnessRange: [45, 75]
        }, lockedPositions);
        break;
        
      case 'softSummer':
        this.generateSeasonalPalette(palette, {
          hueRange: [200, 320], // Blue to pink
          saturationRange: [20, 50],
          lightnessRange: [60, 85]
        }, lockedPositions);
        break;
        
      case 'autumn':
        this.generateSeasonalPalette(palette, {
          hueRange: [20, 60], // Orange to yellow
          saturationRange: [70, 100],
          lightnessRange: [40, 65]
        }, lockedPositions);
        break;
        
      case 'softAutumn':
        this.generateSeasonalPalette(palette, {
          hueRange: [15, 50], // Red-orange to yellow-green
          saturationRange: [50, 80],
          lightnessRange: [40, 70]
        }, lockedPositions);
        break;
        
      case 'winter':
        this.generateSeasonalPalette(palette, {
          hueRange: [220, 320], // Blue to pink
          saturationRange: [60, 90],
          lightnessRange: [30, 70]
        }, lockedPositions);
        break;
        
      case 'deepWinter':
        this.generateSeasonalPalette(palette, {
          hueRange: [210, 330], // Blue to magenta
          saturationRange: [70, 100],
          lightnessRange: [15, 45]
        }, lockedPositions);
        break;
        
      case 'pastel':
        this.generateSeasonalPalette(palette, {
          hueRange: [0, 360], // Full spectrum
          saturationRange: [30, 60],
          lightnessRange: [75, 90]
        }, lockedPositions);
        break;
        
      case 'dark':
        this.generateSeasonalPalette(palette, {
          hueRange: [0, 360], // Full spectrum
          saturationRange: [50, 90],
          lightnessRange: [10, 35]
        }, lockedPositions);
        break;
        
      default:
        // Fallback to harmony palette if theme is none or unrecognized
        this.generateHarmonyPalette(palette, baseHsl, lockedPositions);
    }
  }
  
  generateSeasonalPalette(palette, options, lockedPositions) {
    const { hueRange, saturationRange, lightnessRange } = options;
    
    // Keep the base color if it's already set
    if (!palette[0]) {
      const hue = this.randomInRange(hueRange[0], hueRange[1]);
      const saturation = this.randomInRange(saturationRange[0], saturationRange[1]);
      const lightness = this.randomInRange(lightnessRange[0], lightnessRange[1]);
      
      const rgb = this.hslToRgb(hue, saturation, lightness);
      palette[0] = this.rgbToHex(rgb.r, rgb.g, rgb.b);
    }
    
    // Generate 4 more colors within the seasonal palette range
    for (let i = 1; i < 5; i++) {
      if (lockedPositions[i]) {
        palette[i] = lockedPositions[i];
      } else {
        // For each position, generate a color within the theme's range
        let hue = this.randomInRange(hueRange[0], hueRange[1]);
        let saturation = this.randomInRange(saturationRange[0], saturationRange[1]);
        let lightness = this.randomInRange(lightnessRange[0], lightnessRange[1]);
        
        // Ensure colors are distributed across the range
        if (i > 1) {
          // Avoid colors that are too similar
          const lastColor = this.hexToRgb(palette[i-1]);
          const lastHsl = this.rgbToHsl(lastColor.r, lastColor.g, lastColor.b);
          
          // Make sure the new hue is different enough
          while (Math.abs(hue - lastHsl.h) < 30) {
            hue = this.randomInRange(hueRange[0], hueRange[1]);
          }
        }
        
        const rgb = this.hslToRgb(hue, saturation, lightness);
        palette[i] = this.rgbToHex(rgb.r, rgb.g, rgb.b);
      }
    }
  }
  
  randomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  generateHarmonyPalette(palette, baseHsl, lockedPositions) {
    // Always include the base color
    if (!palette[0]) {
      const baseColor = this.hslToRgb(baseHsl.h, baseHsl.s, baseHsl.l);
      palette[0] = this.rgbToHex(baseColor.r, baseColor.g, baseColor.b);
    }
    
    switch (this.colorHarmonyType) {
      case 'complementary':
        // Add complementary color (if not locked)
        if (!lockedPositions[1]) {
          const compHsl = { ...baseHsl, h: (baseHsl.h + 180) % 360 };
          // Add some variation to make it less predictable
          compHsl.s = Math.min(compHsl.s + this.randomInRange(-10, 10), 100);
          compHsl.l = Math.min(compHsl.l + this.randomInRange(-10, 10), 95);
          
          const compRgb = this.hslToRgb(compHsl.h, compHsl.s, compHsl.l);
          palette[1] = this.rgbToHex(compRgb.r, compRgb.g, compRgb.b);
        } else {
          palette[1] = lockedPositions[1];
        }
        
        // Add lighter and darker versions of both colors
        for (let i = 0; i < 2; i++) {
          const position = i * 2 + 2; // positions 2, 4
          if (!lockedPositions[position]) {
            const sourceHsl = i === 0 ? baseHsl : this.rgbToHsl(this.hexToRgb(palette[1]).r, this.hexToRgb(palette[1]).g, this.hexToRgb(palette[1]).b);
            
            // Lighter version with variation
            const lighterAmount = this.randomInRange(15, 25);
            const lighterColor = { ...sourceHsl, l: Math.min(sourceHsl.l + lighterAmount, 95) };
            const lighterRgb = this.hslToRgb(lighterColor.h, lighterColor.s, lighterColor.l);
            palette[position] = this.rgbToHex(lighterRgb.r, lighterRgb.g, lighterRgb.b);
          } else {
            palette[position] = lockedPositions[position];
          }
          
          const position2 = i * 2 + 3; // positions 3, 5
          if (!lockedPositions[position2]) {
            const sourceHsl = i === 0 ? baseHsl : this.rgbToHsl(this.hexToRgb(palette[1]).r, this.hexToRgb(palette[1]).g, this.hexToRgb(palette[1]).b);
            
            // Darker version with variation
            const darkerAmount = this.randomInRange(15, 25);
            const darkerColor = { ...sourceHsl, l: Math.max(sourceHsl.l - darkerAmount, 15) };
            const darkerRgb = this.hslToRgb(darkerColor.h, darkerColor.s, darkerColor.l);
            palette[position2] = this.rgbToHex(darkerRgb.r, darkerRgb.g, darkerRgb.b);
          } else {
            palette[position2] = lockedPositions[position2];
          }
        }
        break;
        
      case 'analogous':
        // Add colors on both sides with variation
        for (let i = -2; i <= 2; i++) {
          if (i === 0) continue; // Skip the base color (already added)
          
          const position = i + 2; // positions 0, 1, 3, 4
          if (!lockedPositions[position]) {
            const hueVariation = this.randomInRange(25, 35); // More variation
            const hue = (baseHsl.h + i * hueVariation + 360) % 360;
            
            // Add slight saturation and lightness variation
            const satVariation = this.randomInRange(-10, 10);
            const lightVariation = this.randomInRange(-15, 15);
            
            const analogHsl = { 
              h: hue, 
              s: Math.max(Math.min(baseHsl.s + satVariation, 100), 30),
              l: Math.max(Math.min(baseHsl.l + lightVariation, 90), 20)
            };
            
            const analogRgb = this.hslToRgb(analogHsl.h, analogHsl.s, analogHsl.l);
            palette[position] = this.rgbToHex(analogRgb.r, analogRgb.g, analogRgb.b);
          } else {
            palette[position] = lockedPositions[position];
          }
        }
        break;
        
      case 'triadic':
        // Add two colors at 120° intervals with variation
        for (let i = 1; i <= 2; i++) {
          const position = i; // positions 1, 2
          if (!lockedPositions[position]) {
            const hueVariation = this.randomInRange(-10, 10);
            const hue = (baseHsl.h + i * 120 + hueVariation + 360) % 360;
            
            // Add saturation and lightness variation
            const satVariation = this.randomInRange(-15, 15);
            const lightVariation = this.randomInRange(-10, 10);
            
            const triadicHsl = { 
              h: hue, 
              s: Math.max(Math.min(baseHsl.s + satVariation, 100), 30),
              l: Math.max(Math.min(baseHsl.l + lightVariation, 85), 25)
            };
            
            const triadicRgb = this.hslToRgb(triadicHsl.h, triadicHsl.s, triadicHsl.l);
            palette[position] = this.rgbToHex(triadicRgb.r, triadicRgb.g, triadicRgb.b);
          } else {
            palette[position] = lockedPositions[position];
          }
        }
        
        // Add lighter and darker versions
        if (!lockedPositions[3]) {
          const lighterAmount = this.randomInRange(15, 25);
          const lighterBase = { ...baseHsl, l: Math.min(baseHsl.l + lighterAmount, 95) };
          const lighterBaseRgb = this.hslToRgb(lighterBase.h, lighterBase.s, lighterBase.l);
          palette[3] = this.rgbToHex(lighterBaseRgb.r, lighterBaseRgb.g, lighterBaseRgb.b);
        } else {
          palette[3] = lockedPositions[3];
        }
        
        if (!lockedPositions[4]) {
          const darkerAmount = this.randomInRange(15, 25);
          const darkerBase = { ...baseHsl, l: Math.max(baseHsl.l - darkerAmount, 15) };
          const darkerBaseRgb = this.hslToRgb(darkerBase.h, darkerBase.s, darkerBase.l);
          palette[4] = this.rgbToHex(darkerBaseRgb.r, darkerBaseRgb.g, darkerBaseRgb.b);
        } else {
          palette[4] = lockedPositions[4];
        }
        break;
        
      case 'tetradic':
        // Add colors at intervals with variation
        for (let i = 1; i <= 3; i++) {
          const position = i; // positions 1, 2, 3
          if (!lockedPositions[position]) {
            const hueVariation = this.randomInRange(-10, 10);
            const hue = (baseHsl.h + i * 90 + hueVariation + 360) % 360;
            
            // Add saturation and lightness variation
            const satVariation = this.randomInRange(-10, 10);
            const lightVariation = this.randomInRange(-15, 15);
            
            const tetradicHsl = { 
              h: hue, 
              s: Math.max(Math.min(baseHsl.s + satVariation, 100), 20),
              l: Math.max(Math.min(baseHsl.l + lightVariation, 85), 20)
            };
            
            const tetradicRgb = this.hslToRgb(tetradicHsl.h, tetradicHsl.s, tetradicHsl.l);
            palette[position] = this.rgbToHex(tetradicRgb.r, tetradicRgb.g, tetradicRgb.b);
          } else {
            palette[position] = lockedPositions[position];
          }
        }
        
        // Add accent color
        if (!lockedPositions[4]) {
          const hueVariation = this.randomInRange(-20, 20);
          const accentHsl = { 
            h: (baseHsl.h + 180 + hueVariation) % 360, 
            s: Math.min(this.randomInRange(85, 100), 100),
            l: this.randomInRange(45, 55)
          };
          
          const accentRgb = this.hslToRgb(accentHsl.h, accentHsl.s, accentHsl.l);
          palette[4] = this.rgbToHex(accentRgb.r, accentRgb.g, accentRgb.b);
        } else {
          palette[4] = lockedPositions[4];
        }
        break;
        
      case 'monochromatic':
        // Add variations with different lightness and saturation
        for (let i = 1; i < 5; i++) {
          if (!lockedPositions[i]) {
            // Create variations by adjusting lightness and saturation
            let variation;
            
            switch (i) {
              case 1:
                // Much lighter
                variation = { 
                  s: Math.max(baseHsl.s - this.randomInRange(5, 15), 20),
                  l: Math.min(baseHsl.l + this.randomInRange(25, 35), 95)
                };
                break;
              case 2:
                // Somewhat lighter
                variation = { 
                  s: Math.min(baseHsl.s + this.randomInRange(0, 10), 100),
                  l: Math.min(baseHsl.l + this.randomInRange(10, 20), 85)
                };
                break;
              case 3:
                // Somewhat darker
                variation = { 
                  s: Math.min(baseHsl.s + this.randomInRange(5, 15), 100),
                  l: Math.max(baseHsl.l - this.randomInRange(10, 20), 20)
                };
                break;
              case 4:
                // Much darker
                variation = { 
                  s: Math.min(baseHsl.s + this.randomInRange(0, 10), 100),
                  l: Math.max(baseHsl.l - this.randomInRange(25, 35), 10)
                };
                break;
            }
            
            const monoHsl = { 
              h: baseHsl.h + this.randomInRange(-5, 5), // Slight hue variation
              s: variation.s,
              l: variation.l
            };
            
            const monoRgb = this.hslToRgb(monoHsl.h, monoHsl.s, monoHsl.l);
            palette[i] = this.rgbToHex(monoRgb.r, monoRgb.g, monoRgb.b);
          } else {
            palette[i] = lockedPositions[i];
          }
        }
        break;
    }
  }
  
  applyDesignTypeAdjustments(palette, lockedPositions) {
    // Get the current base color properties
    const baseColor = this.hexToRgb(palette[0]);
    const baseHsl = this.rgbToHsl(baseColor.r, baseColor.g, baseColor.b);
    
    switch (this.selectedDesignType) {
      case 'website':
        // Website designs need light backgrounds and dark text colors
        if (!lockedPositions[3]) {
          // Light neutral for backgrounds with slight tint from base color
          const lightNeutral = { 
            h: baseHsl.h, 
            s: Math.max(baseHsl.s - this.randomInRange(65, 75), 5),
            l: this.randomInRange(90, 97)
          };
          
          const lightRgb = this.hslToRgb(lightNeutral.h, lightNeutral.s, lightNeutral.l);
          palette[3] = this.rgbToHex(lightRgb.r, lightRgb.g, lightRgb.b);
        }
        
        if (!lockedPositions[4]) {
          // Dark color for text with slight tint from base color
          const darkText = { 
            h: baseHsl.h, 
            s: Math.max(baseHsl.s - this.randomInRange(50, 70), 0),
            l: this.randomInRange(10, 20)
          };
          
          const darkRgb = this.hslToRgb(darkText.h, darkText.s, darkText.l);
          palette[4] = this.rgbToHex(darkRgb.r, darkRgb.g, darkRgb.b);
        }
        break;
        
      case 'youtube':
        // YouTube thumbnails use bright, saturated colors
        if (!lockedPositions[1]) {
          // Complementary accent color
          const accentColor = { 
            h: (baseHsl.h + 180 + this.randomInRange(-20, 20)) % 360, 
            s: this.randomInRange(85, 100),
            l: this.randomInRange(45, 60)
          };
          
          const accentRgb = this.hslToRgb(accentColor.h, accentColor.s, accentColor.l);
          palette[1] = this.rgbToHex(accentRgb.r, accentRgb.g, accentRgb.b);
        }
        
        if (!lockedPositions[2]) {
          // Saturated base color variant
          const saturatedBase = { 
            h: (baseHsl.h + this.randomInRange(-30, 30) + 360) % 360, 
            s: Math.min(baseHsl.s + this.randomInRange(10, 30), 100),
            l: Math.min(baseHsl.l + this.randomInRange(5, 15), 65)
          };
          
          const saturatedRgb = this.hslToRgb(saturatedBase.h, saturatedBase.s, saturatedBase.l);
          palette[2] = this.rgbToHex(saturatedRgb.r, saturatedRgb.g, saturatedRgb.b);
        }
        
        // Pure white and black for text
        if (!lockedPositions[3]) {
          palette[3] = '#FFFFFF';
        }
        
        if (!lockedPositions[4]) {
          palette[4] = '#000000';
        }
        break;
        
      case 'facebook':
        // Generate a random Facebook-inspired palette
        
        // Facebook blue with slight variation
        if (!lockedPositions[1]) {
          const blueHue = this.randomInRange(210, 225);
          const blueColor = { 
            h: blueHue, 
            s: this.randomInRange(70, 90),
            l: this.randomInRange(40, 55)
          };
          
          const blueRgb = this.hslToRgb(blueColor.h, blueColor.s, blueColor.l);
          palette[1] = this.rgbToHex(blueRgb.r, blueRgb.g, blueRgb.b);
        }
        
        // Soft contrast color
        if (!lockedPositions[2]) {
          const softContrast = { 
            h: (baseHsl.h + this.randomInRange(25, 35)) % 360, 
            s: Math.min(baseHsl.s, 70),
            l: this.randomInRange(60, 70)
          };
          
          const softContrastRgb = this.hslToRgb(softContrast.h, softContrast.s, softContrast.l);
          palette[2] = this.rgbToHex(softContrastRgb.r, softContrastRgb.g, softContrastRgb.b);
        }
        
        // Facebook light gray with variation
        if (!lockedPositions[3]) {
          const lightGrayHsl = { 
            h: baseHsl.h, 
            s: this.randomInRange(5, 15),
            l: this.randomInRange(92, 98)
          };
          
          const lightGrayRgb = this.hslToRgb(lightGrayHsl.h, lightGrayHsl.s, lightGrayHsl.l);
          palette[3] = this.rgbToHex(lightGrayRgb.r, lightGrayRgb.g, lightGrayRgb.b);
        }
        
        // Facebook dark gray with variation
        if (!lockedPositions[4]) {
          const darkGrayHsl = { 
            h: baseHsl.h, 
            s: this.randomInRange(5, 15),
            l: this.randomInRange(10, 20)
          };
          
          const darkGrayRgb = this.hslToRgb(darkGrayHsl.h, darkGrayHsl.s, darkGrayHsl.l);
          palette[4] = this.rgbToHex(darkGrayRgb.r, darkGrayRgb.g, darkGrayRgb.b);
        }
        break;
        
      case 'google':
        // Generate a Google-inspired palette with variations
        
        // Google blue with variation
        if (!lockedPositions[1]) {
          const blueHsl = { 
            h: this.randomInRange(210, 230), 
            s: this.randomInRange(80, 95),
            l: this.randomInRange(45, 60)
          };
          
          const blueRgb = this.hslToRgb(blueHsl.h, blueHsl.s, blueHsl.l);
          palette[1] = this.rgbToHex(blueRgb.r, blueRgb.g, blueRgb.b);
        }
        
        // Google red with variation
        if (!lockedPositions[2]) {
          const redHsl = { 
            h: this.randomInRange(0, 15), 
            s: this.randomInRange(75, 90),
            l: this.randomInRange(45, 60)
          };
          
          const redRgb = this.hslToRgb(redHsl.h, redHsl.s, redHsl.l);
          palette[2] = this.rgbToHex(redRgb.r, redRgb.g, redRgb.b);
        }
        
        // Google yellow with variation
        if (!lockedPositions[3]) {
          const yellowHsl = { 
            h: this.randomInRange(40, 55), 
            s: this.randomInRange(80, 95),
            l: this.randomInRange(50, 65)
          };
          
          const yellowRgb = this.hslToRgb(yellowHsl.h, yellowHsl.s, yellowHsl.l);
          palette[3] = this.rgbToHex(yellowRgb.r, yellowRgb.g, yellowRgb.b);
        }
        
        // Google green with variation
        if (!lockedPositions[4]) {
          const greenHsl = { 
            h: this.randomInRange(120, 140), 
            s: this.randomInRange(60, 80),
            l: this.randomInRange(40, 55)
          };
          
          const greenRgb = this.hslToRgb(greenHsl.h, greenHsl.s, greenHsl.l);
          palette[4] = this.rgbToHex(greenRgb.r, greenRgb.g, greenRgb.b);
        }
        break;
        
      case 'instagram':
        // Generate Instagram-inspired colors with variations
        
        // Instagram purple with variation
        if (!lockedPositions[1]) {
          const purpleHsl = { 
            h: this.randomInRange(270, 290), 
            s: this.randomInRange(60, 80),
            l: this.randomInRange(40, 55)
          };
          
          const purpleRgb = this.hslToRgb(purpleHsl.h, purpleHsl.s, purpleHsl.l);
          palette[1] = this.rgbToHex(purpleRgb.r, purpleRgb.g, purpleRgb.b);
        }
        
        // Instagram red/pink with variation
        if (!lockedPositions[2]) {
          const redHsl = { 
            h: this.randomInRange(340, 360), 
            s: this.randomInRange(75, 95),
            l: this.randomInRange(45, 60)
          };
          
          const redRgb = this.hslToRgb(redHsl.h, redHsl.s, redHsl.l);
          palette[2] = this.rgbToHex(redRgb.r, redRgb.g, redRgb.b);
        }
        
        // Instagram yellow/orange with variation
        if (!lockedPositions[3]) {
          const yellowHsl = { 
            h: this.randomInRange(30, 50), 
            s: this.randomInRange(80, 95),
            l: this.randomInRange(50, 65)
          };
          
          const yellowRgb = this.hslToRgb(yellowHsl.h, yellowHsl.s, yellowHsl.l);
          palette[3] = this.rgbToHex(yellowRgb.r, yellowRgb.g, yellowRgb.b);
        }
        
        // Black or white (randomly selected)
        if (!lockedPositions[4]) {
          palette[4] = Math.random() > 0.5 ? '#FFFFFF' : '#000000';
        }
        break;
    }
  }
  
  renderPalette() {
    const paletteContainer = this.shadowRoot.getElementById('generated-palette');
    paletteContainer.innerHTML = '';
    
    this.colorPalette.forEach((color, index) => {
      const colorElement = document.createElement('div');
      colorElement.className = 'palette-color';
      colorElement.dataset.index = index;
      
      const rgb = this.hexToRgb(color);
      const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
      
      // Generate a color name
      const colorName = this.getColorName(hsl);
      
      // Check if this color is locked
      const isLocked = this.lockedColors.some(item => item.position === index);
      
      colorElement.innerHTML = `
        <div class="color-block" style="background-color: ${color}">
          <div class="color-lock ${isLocked ? 'locked' : ''}" data-index="${index}">
            <svg viewBox="0 0 24 24">
              <path d="${isLocked ? 
                'M18 10v-4c0-3.313-2.687-6-6-6s-6 2.687-6 6v4h-3v14h18v-14h-3zm-10-4c0-2.206 1.794-4 4-4s4 1.794 4 4v4h-8v-4zm11 16h-14v-10h14v10z' : 
                'M18 10v-4c0-3.313-2.687-6-6-6s-6 2.687-6 6v4h-3v14h18v-14h-3zm-10-4c0-2.206 1.794-4 4-4s4 1.794 4 4v4h-8v-4zm11 16h-14v-10h14v10z'}" />
            </svg>
          </div>
          <div class="color-edit" data-index="${index}">
            <svg viewBox="0 0 24 24">
              <path d="M3 17.25v3.75h3.75l11.06-11.06-3.75-3.75-11.06 11.06zm17.71-10.21c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </div>
        </div>
        <div class="color-info">
          <h4 class="color-name">${colorName}</h4>
          <div class="color-code">
            <span>${color}</span>
            <button class="copy-code-btn" data-color="${color}" title="Copy HEX">📋</button>
          </div>
          <div class="color-code">
            <span>rgb(${rgb.r}, ${rgb.g}, ${rgb.b})</span>
            <button class="copy-code-btn" data-color="rgb(${rgb.r}, ${rgb.g}, ${rgb.b})" title="Copy RGB">📋</button>
          </div>
          <div class="color-code">
            <span>hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)</span>
            <button class="copy-code-btn" data-color="hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)" title="Copy HSL">📋</button>
          </div>
        </div>
      `;
      
      paletteContainer.appendChild(colorElement);
    });
    
    // Add event listeners for copy buttons
    const copyButtons = this.shadowRoot.querySelectorAll('.copy-code-btn');
    copyButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.copyToClipboard(button.dataset.color);
      });
    });
    
    // Add event listeners for lock/unlock buttons
    const lockButtons = this.shadowRoot.querySelectorAll('.color-lock');
    lockButtons.forEach(button => {
      button.addEventListener('click', () => {
        const index = parseInt(button.dataset.index);
        this.toggleColorLock(index, this.colorPalette[index]);
        
        // Toggle the locked class
        button.classList.toggle('locked');
        
        // Update the lock icon
        const path = button.querySelector('svg path');
        if (button.classList.contains('locked')) {
          path.setAttribute('d', 'M18 10v-4c0-3.313-2.687-6-6-6s-6 2.687-6 6v4h-3v14h18v-14h-3zm-10-4c0-2.206 1.794-4 4-4s4 1.794 4 4v4h-8v-4zm11 16h-14v-10h14v10z');
        } else {
          path.setAttribute('d', 'M18 10v-4c0-3.313-2.687-6-6-6s-6 2.687-6 6v4h-3v14h18v-14h-3zm-10-4c0-2.206 1.794-4 4-4s4 1.794 4 4v4h-8v-4zm11 16h-14v-10h14v10z');
        }
      });
    });
    
    // Add event listeners for edit buttons
    const editButtons = this.shadowRoot.querySelectorAll('.color-edit');
    editButtons.forEach(button => {
      button.addEventListener('click', () => {
        const index = parseInt(button.dataset.index);
        const color = this.colorPalette[index];
        
        // Set the color picker to this color
        this.pickedColor = color;
        const rgb = this.hexToRgb(color);
        this.updateSliders(rgb.r, rgb.g, rgb.b);
        this.updateColorPreview();
        
        // Lock this color position
        this.toggleColorLock(index, color, true);
        
        // Update the UI to show it's locked
        const lockButton = this.shadowRoot.querySelector(`.color-lock[data-index="${index}"]`);
        lockButton.classList.add('locked');
        
        // Scroll to the color picker
        this.shadowRoot.querySelector('.color-picker-container').scrollIntoView({ behavior: 'smooth' });
        
        // Show a notification
        this.showNotification(`Editing color at position ${index+1}. Generate a new palette to apply changes.`);
      });
    });
  }
  
  toggleColorLock(position, color, forceLock = false) {
    // Check if this position is already locked
    const existingIndex = this.lockedColors.findIndex(item => item.position === position);
    
    if (existingIndex !== -1 && !forceLock) {
      // Remove the lock
      this.lockedColors.splice(existingIndex, 1);
    } else if (existingIndex !== -1 && forceLock) {
      // Update the locked color
      this.lockedColors[existingIndex].color = color;
    } else {
      // Add a new lock
      this.lockedColors.push({ position, color });
    }
  }
  
  setRandomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    
    this.pickedColor = this.rgbToHex(r, g, b);
    this.updateSliders(r, g, b);
    this.updateColorPreview();
  }
  
  handleImageUpload(file) {
    if (!file || !file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => this.processUploadedImage(img);
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    
    const imageUpload = this.shadowRoot.getElementById('image-upload');
    const imagePreviewContainer = this.shadowRoot.getElementById('image-preview-container');
    
    imageUpload.style.display = 'none';
    imagePreviewContainer.classList.add('active');
  }
  
  processUploadedImage(img) {
    const canvasContainer = this.shadowRoot.getElementById('canvas-container');
    const canvas = this.shadowRoot.getElementById('color-canvas');
    const ctx = canvas.getContext('2d');
    const overlay = this.shadowRoot.getElementById('canvas-overlay');
    const cursor = this.shadowRoot.getElementById('color-picker-cursor');
    
    // Set canvas size
    const maxWidth = this.shadowRoot.querySelector('.container').offsetWidth - 40;
    let width = img.width;
    let height = img.height;
    
    if (width > maxWidth) {
      const ratio = maxWidth / width;
      width = maxWidth;
      height = img.height * ratio;
    }
    
    canvas.width = width;
    canvas.height = height;
    canvasContainer.style.display = 'block';
    canvasContainer.style.width = `${width}px`;
    canvasContainer.style.height = `${height}px`;
    
    // Draw image on canvas
    ctx.drawImage(img, 0, 0, width, height);
    
    // Extract prominent colors
    this.extractColorsFromImage(canvas);
    
    // Setup canvas click handler for color picking
    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Get the pixel color
      const pixelData = ctx.getImageData(x, y, 1, 1).data;
      const r = pixelData[0];
      const g = pixelData[1];
      const b = pixelData[2];
      const hex = this.rgbToHex(r, g, b);
      
      // Update picked color
      this.pickedColor = hex;
      this.updateSliders(r, g, b);
      this.updateColorPreview();
      
      // Show cursor at clicked position
      cursor.style.left = `${x}px`;
      cursor.style.top = `${y}px`;
      cursor.style.backgroundColor = hex;
      cursor.style.display = 'block';
      
      // Add to image colors if not already there
      if (!this.imageColors.includes(hex)) {
        this.imageColors.push(hex);
        this.renderImageColors();
      }
    });
    
    // Show cursor on mousemove
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      cursor.style.left = `${x}px`;
      cursor.style.top = `${y}px`;
      
      const pixelData = ctx.getImageData(x, y, 1, 1).data;
      const r = pixelData[0];
      const g = pixelData[1];
      const b = pixelData[2];
      const hex = this.rgbToHex(r, g, b);
      
      cursor.style.backgroundColor = hex;
      cursor.style.display = 'block';
    });
    
    // Hide cursor when mouse leaves canvas
    canvas.addEventListener('mouseleave', () => {
      cursor.style.display = 'none';
    });
  }
  
  extractColorsFromImage(canvas) {
    // Get image data
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    
    // Sample pixels at intervals
    const pixelCount = canvas.width * canvas.height;
    const sampleInterval = Math.max(1, Math.floor(pixelCount / 1000));
    
    // Create color frequency map
    const colorFrequency = new Map();
    
    for (let i = 0; i < imageData.length; i += 4 * sampleInterval) {
      const r = imageData[i];
      const g = imageData[i + 1];
      const b = imageData[i + 2];
      
      // Quantize colors slightly to group similar ones
      const quantizedR = Math.round(r / 8) * 8;
      const quantizedG = Math.round(g / 8) * 8;
      const quantizedB = Math.round(b / 8) * 8;
      
      const hex = this.rgbToHex(quantizedR, quantizedG, quantizedB);
      
      if (colorFrequency.has(hex)) {
        colorFrequency.set(hex, colorFrequency.get(hex) + 1);
      } else {
        colorFrequency.set(hex, 1);
      }
    }
    
    // Sort by frequency and pick the top colors
    const colorsByFrequency = [...colorFrequency.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);
    
    // Filter out grays and too similar colors
    const filteredColors = [];
    const minDistance = 50; // Minimum "distance" between colors to consider them different
    
    for (const color of colorsByFrequency) {
      const rgb = this.hexToRgb(color);
      const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
      
      // Skip colors that are too dark or too light
      if (hsl.l < 10 || hsl.l > 95) continue;
      
      // Skip grays (very low saturation)
      if (hsl.s < 5) continue;
      
      // Check if the color is too similar to already selected ones
      const isTooSimilar = filteredColors.some(existingColor => {
        const existingRgb = this.hexToRgb(existingColor);
        const distance = Math.sqrt(
          Math.pow(existingRgb.r - rgb.r, 2) +
          Math.pow(existingRgb.g - rgb.g, 2) +
          Math.pow(existingRgb.b - rgb.b, 2)
        );
        return distance < minDistance;
      });
      
      if (!isTooSimilar) {
        filteredColors.push(color);
      }
      
      // Stop once we have enough colors
      if (filteredColors.length >= 10) break;
    }
    
    this.imageColors = filteredColors;
    this.renderImageColors();
  }
  
  renderImageColors() {
    const imageColorsContainer = this.shadowRoot.getElementById('image-colors');
    imageColorsContainer.innerHTML = '';
    
    this.imageColors.forEach(color => {
      const colorElement = document.createElement('div');
      colorElement.className = 'image-color';
      colorElement.style.backgroundColor = color;
      
      const tooltip = document.createElement('div');
      tooltip.className = 'image-color-tooltip';
      tooltip.textContent = color;
      
      colorElement.appendChild(tooltip);
      imageColorsContainer.appendChild(colorElement);
      
      colorElement.addEventListener('click', () => {
        const rgb = this.hexToRgb(color);
        this.pickedColor = color;
        this.updateSliders(rgb.r, rgb.g, rgb.b);
        this.updateColorPreview();
        
        // Update selected state
        this.shadowRoot.querySelectorAll('.image-color').forEach(el => {
          el.classList.remove('selected');
        });
        colorElement.classList.add('selected');
      });
    });
  }
  
  copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      this.showNotification('Copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  }
  
  showNotification(message) {
    const notification = this.shadowRoot.getElementById('notification');
    notification.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
      notification.classList.remove('show');
    }, 2000);
  }
  
  // Color utility functions
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }
  
  rgbToHex(r, g, b) {
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase()}`;
  }
  
  rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      
      h /= 6;
    }
    
    return {
      h: h * 360,
      s: s * 100,
      l: l * 100
    };
  }
  
  hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }
  
  getColorName(hsl) {
    const h = hsl.h;
    const s = hsl.s;
    const l = hsl.l;
    
    let name = '';
    
    // Determine lightness modifier
    if (l >= 85) name = 'Very Light ';
    else if (l >= 70) name = 'Light ';
    else if (l <= 15) name = 'Very Dark ';
    else if (l <= 30) name = 'Dark ';
    
    // Determine saturation modifier
    if (s < 10) {
      if (l > 70) return 'White';
      if (l < 20) return 'Black';
      return `${name}Gray`;
    }
    
    // Determine hue name
    if (h >= 0 && h < 15) name += 'Red';
    else if (h >= 15 && h < 45) name += 'Orange';
    else if (h >= 45 && h < 65) name += 'Yellow';
    else if (h >= 65 && h < 100) name += 'Lime';
    else if (h >= 100 && h < 150) name += 'Green';
    else if (h >= 150 && h < 200) name += 'Teal';
    else if (h >= 200 && h < 240) name += 'Cyan';
    else if (h >= 240 && h < 280) name += 'Blue';
    else if (h >= 280 && h < 320) name += 'Purple';
    else if (h >= 320 && h < 340) name += 'Magenta';
    else name += 'Pink';
    
    if (s < 40 && l > 40) name += 'ish';
    
    return name;
  }
}

// Register the custom element
customElements.define('color-palette-generator', ColorPaletteGenerator);
