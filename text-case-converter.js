/**
 * Text Case Converter - Advanced Wix Custom Element with Customization
 * File name: text-case-converter.js
 * Custom Element tag name: text-case-converter
 */

class TextCaseConverter extends HTMLElement {
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
        <h2>Text Case Converter</h2>
        
        <div class="tabs">
          <div class="tab active" data-tab="text-case">Text Case</div>
          <div class="tab" data-tab="formatting">Formatting</div>
          <div class="tab" data-tab="special">Special</div>
        </div>
        
        <div class="input-group">
          <label for="input-text">Input Text</label>
          <textarea id="input-text" placeholder="Enter or paste your text here..."></textarea>
          <div class="character-count">Characters: 0 | Words: 0</div>
        </div>
        
        <div class="controls" id="text-case-controls">
          <button class="convert-btn" data-case="lowercase">lowercase</button>
          <button class="convert-btn" data-case="uppercase">UPPERCASE</button>
          <button class="convert-btn" data-case="capitalize">Capitalize</button>
          <button class="convert-btn" data-case="title">Title Case</button>
          <button class="convert-btn" data-case="sentence">Sentence case</button>
          <button class="convert-btn" data-case="alternating">aLtErNaTiNg</button>
          <button class="convert-btn" data-case="inverse">InVeRsE</button>
          <button class="convert-btn" data-case="camel">camelCase</button>
          <button class="convert-btn" data-case="pascal">PascalCase</button>
          <button class="convert-btn" data-case="snake">snake_case</button>
          <button class="convert-btn" data-case="kebab">kebab-case</button>
          <button class="convert-btn" data-case="constant">CONSTANT_CASE</button>
        </div>
        
        <div class="controls" id="formatting-controls" style="display: none;">
          <button class="format-btn" data-format="trim">Trim Whitespace</button>
          <button class="format-btn" data-format="single-line">Single Line</button>
          <button class="format-btn" data-format="remove-duplicate-lines">Remove Duplicate Lines</button>
          <button class="format-btn" data-format="remove-empty-lines">Remove Empty Lines</button>
          <button class="format-btn" data-format="add-line-numbers">Add Line Numbers</button>
          <button class="format-btn" data-format="sort-lines-asc">Sort Lines A-Z</button>
          <button class="format-btn" data-format="sort-lines-desc">Sort Lines Z-A</button>
          <button class="format-btn" data-format="reverse-lines">Reverse Lines</button>
          <button class="format-btn" data-format="shuffle-lines">Shuffle Lines</button>
        </div>
        
        <div class="controls" id="special-controls" style="display: none;">
          <button class="special-btn" data-special="reverse">Reverse Text</button>
          <button class="special-btn" data-special="word-count">Word Statistics</button>
          <button class="special-btn" data-special="remove-accents">Remove Accents</button>
          <button class="special-btn" data-special="url-encode">URL Encode</button>
          <button class="special-btn" data-special="url-decode">URL Decode</button>
          <button class="special-btn" data-special="base64-encode">Base64 Encode</button>
          <button class="special-btn" data-special="base64-decode">Base64 Decode</button>
          <button class="special-btn" data-special="md5">MD5 Hash</button>
          <button class="special-btn" data-special="random-case">Random Case</button>
          <button class="special-btn" data-special="morse-encode">Morse Code Encode</button>
          <button class="special-btn" data-special="morse-decode">Morse Code Decode</button>
        </div>
        
        <div class="advanced-options">
          <div class="advanced-options-toggle">
            Advanced Options ▼
          </div>
          <div class="advanced-options-content">
            <div class="option-row">
              <div class="option-group">
                <input type="checkbox" id="preserve-line-breaks">
                <label for="preserve-line-breaks">Preserve Line Breaks</label>
              </div>
              <div class="option-group">
                <input type="checkbox" id="remove-extra-spaces">
                <label for="remove-extra-spaces">Remove Extra Spaces</label>
              </div>
              <div class="option-group">
                <input type="checkbox" id="ignore-numbers">
                <label for="ignore-numbers">Ignore Numbers</label>
              </div>
            </div>
            <div class="option-row">
              <div class="option-group">
                <label for="word-separator">Word Separator:</label>
                <select id="word-separator">
                  <option value="space">Space</option>
                  <option value="underscore">Underscore (_)</option>
                  <option value="hyphen">Hyphen (-)</option>
                  <option value="dot">Dot (.)</option>
                  <option value="none">None</option>
                </select>
              </div>
              <div class="option-group">
                <label for="custom-replace">Custom Replace:</label>
                <input type="text" id="find-text" placeholder="Find" style="width: 100px;">
                <input type="text" id="replace-text" placeholder="Replace" style="width: 100px;">
                <button class="secondary" id="do-replace">Replace</button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="output-group">
          <label for="output-text">Output Text</label>
          <textarea id="output-text" readonly></textarea>
          <div class="character-count output-count">Characters: 0 | Words: 0</div>
        </div>
        
        <div class="action-buttons">
          <div class="buttons-left">
            <button id="copy-btn">Copy to Clipboard</button>
            <button class="secondary" id="clear-btn">Clear All</button>
          </div>
          <div class="buttons-right">
            <button class="secondary" id="swap-btn">Swap Input/Output</button>
            <button class="secondary" id="download-btn">Download as TXT</button>
          </div>
        </div>
        
        <div class="success-message" id="copy-message">Text copied to clipboard!</div>
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

      .tabs {
        display: flex;
        border-bottom: 1px solid var(--border-color);
        margin-bottom: 16px;
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

      .input-group, .output-group {
        margin-bottom: 16px;
      }

      .input-group label, .output-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        font-size: var(--font-size);
        color: var(--heading-color);
        font-family: var(--font-family);
      }

      textarea {
        width: 100%;
        padding: 12px;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        resize: vertical;
        min-height: 100px;
        box-sizing: border-box;
        font-family: var(--font-family);
        font-size: var(--font-size);
        transition: border-color 0.2s ease;
        background-color: var(--primary-bg);
        color: var(--paragraph-color);
      }

      textarea:focus {
        outline: none;
        border-color: var(--main-accent);
        box-shadow: 0 0 0 1px var(--main-accent);
      }

      .controls {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 16px;
      }

      .action-buttons {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 16px;
        flex-wrap: wrap;
        gap: 10px;
      }

      .buttons-left, .buttons-right {
        display: flex;
        gap: 10px;
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
      }

      button:hover {
        background-color: var(--hover-accent);
      }

      button.secondary {
        background-color: var(--secondary-bg);
        border: 1px solid var(--border-color);
        color: var(--heading-color);
      }

      button.secondary:hover {
        background-color: var(--border-color);
      }

      .character-count {
        font-size: calc(var(--font-size) - 2px);
        color: var(--secondary-text);
        margin-top: 4px;
        font-family: var(--font-family);
      }

      .advanced-options {
        margin-top: 16px;
        border-top: 1px solid var(--border-color);
        padding-top: 16px;
      }

      .advanced-options-toggle {
        display: flex;
        align-items: center;
        cursor: pointer;
        font-weight: 500;
        font-size: var(--font-size);
        color: var(--main-accent);
        margin-bottom: 8px;
        font-family: var(--font-family);
      }

      .advanced-options-content {
        display: none;
        background-color: var(--secondary-bg);
        padding: 16px;
        border-radius: var(--border-radius);
        margin-top: 8px;
      }

      .advanced-options-content.show {
        display: block;
      }

      .option-row {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        margin-bottom: 12px;
      }

      .option-group {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      input[type="checkbox"], input[type="radio"] {
        margin: 0;
        cursor: pointer;
        accent-color: var(--main-accent);
      }

      .option-group label {
        font-size: var(--font-size);
        margin-bottom: 0;
        font-weight: normal;
        color: var(--paragraph-color);
        cursor: pointer;
        font-family: var(--font-family);
      }

      select {
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

      input[type="text"] {
        padding: var(--button-padding);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        background-color: var(--primary-bg);
        font-size: var(--font-size);
        color: var(--paragraph-color);
        font-family: var(--font-family);
      }

      input[type="text"]:focus {
        outline: none;
        border-color: var(--main-accent);
      }

      .success-message {
        color: var(--main-accent);
        font-size: calc(var(--font-size) - 2px);
        margin-top: 4px;
        opacity: 0;
        transition: opacity 0.5s ease;
        font-family: var(--font-family);
        font-weight: 500;
        text-align: center;
      }

      .success-message.show {
        opacity: 1;
      }

      @media (max-width: 768px) {
        .controls, .action-buttons {
          flex-direction: column;
        }
        
        .buttons-left, .buttons-right {
          width: 100%;
          justify-content: space-between;
        }

        .tabs {
          flex-direction: column;
        }

        .option-row {
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
        
        // Hide all control sections
        this.shadowRoot.querySelector('#text-case-controls').style.display = 'none';
        this.shadowRoot.querySelector('#formatting-controls').style.display = 'none';
        this.shadowRoot.querySelector('#special-controls').style.display = 'none';
        
        // Show the selected tab's controls
        const tabName = tab.getAttribute('data-tab');
        this.shadowRoot.querySelector(`#${tabName}-controls`).style.display = 'flex';
      });
    });

    // Text case conversion buttons
    const convertButtons = this.shadowRoot.querySelectorAll('.convert-btn');
    convertButtons.forEach(button => {
      button.addEventListener('click', () => {
        const caseType = button.getAttribute('data-case');
        const inputText = this.shadowRoot.querySelector('#input-text').value;
        const outputText = this.convertCase(inputText, caseType);
        this.shadowRoot.querySelector('#output-text').value = outputText;
        this.updateOutputStats();
      });
    });

    // Formatting buttons
    const formatButtons = this.shadowRoot.querySelectorAll('.format-btn');
    formatButtons.forEach(button => {
      button.addEventListener('click', () => {
        const formatType = button.getAttribute('data-format');
        const inputText = this.shadowRoot.querySelector('#input-text').value;
        const outputText = this.formatText(inputText, formatType);
        this.shadowRoot.querySelector('#output-text').value = outputText;
        this.updateOutputStats();
      });
    });

    // Special buttons
    const specialButtons = this.shadowRoot.querySelectorAll('.special-btn');
    specialButtons.forEach(button => {
      button.addEventListener('click', () => {
        const specialType = button.getAttribute('data-special');
        const inputText = this.shadowRoot.querySelector('#input-text').value;
        const outputText = this.specialProcess(inputText, specialType);
        this.shadowRoot.querySelector('#output-text').value = outputText;
        this.updateOutputStats();
      });
    });

    // Copy to clipboard
    const copyBtn = this.shadowRoot.querySelector('#copy-btn');
    copyBtn.addEventListener('click', () => {
      const outputText = this.shadowRoot.querySelector('#output-text').value;
      navigator.clipboard.writeText(outputText).then(() => {
        const copyMessage = this.shadowRoot.querySelector('#copy-message');
        copyMessage.classList.add('show');
        setTimeout(() => {
          copyMessage.classList.remove('show');
        }, 2000);
      });
    });

    // Clear all
    const clearBtn = this.shadowRoot.querySelector('#clear-btn');
    clearBtn.addEventListener('click', () => {
      this.shadowRoot.querySelector('#input-text').value = '';
      this.shadowRoot.querySelector('#output-text').value = '';
      this.updateInputStats();
      this.updateOutputStats();
    });

    // Swap input/output
    const swapBtn = this.shadowRoot.querySelector('#swap-btn');
    swapBtn.addEventListener('click', () => {
      const inputText = this.shadowRoot.querySelector('#input-text').value;
      const outputText = this.shadowRoot.querySelector('#output-text').value;
      this.shadowRoot.querySelector('#input-text').value = outputText;
      this.shadowRoot.querySelector('#output-text').value = inputText;
      this.updateInputStats();
      this.updateOutputStats();
    });

    // Download as TXT
    const downloadBtn = this.shadowRoot.querySelector('#download-btn');
    downloadBtn.addEventListener('click', () => {
      const outputText = this.shadowRoot.querySelector('#output-text').value;
      const blob = new Blob([outputText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'converted-text.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    // Toggle advanced options
    const advancedToggle = this.shadowRoot.querySelector('.advanced-options-toggle');
    advancedToggle.addEventListener('click', () => {
      const content = this.shadowRoot.querySelector('.advanced-options-content');
      content.classList.toggle('show');
      advancedToggle.textContent = content.classList.contains('show') ? 'Advanced Options ▲' : 'Advanced Options ▼';
    });

    // Custom replace
    const doReplaceBtn = this.shadowRoot.querySelector('#do-replace');
    doReplaceBtn.addEventListener('click', () => {
      const findText = this.shadowRoot.querySelector('#find-text').value;
      const replaceText = this.shadowRoot.querySelector('#replace-text').value;
      const inputText = this.shadowRoot.querySelector('#input-text').value;
      
      if (findText) {
        const outputText = inputText.split(findText).join(replaceText);
        this.shadowRoot.querySelector('#output-text').value = outputText;
        this.updateOutputStats();
      }
    });

    // Input text change handler for stats
    const inputText = this.shadowRoot.querySelector('#input-text');
    inputText.addEventListener('input', () => {
      this.updateInputStats();
    });
  }

  updateInputStats() {
    const inputText = this.shadowRoot.querySelector('#input-text').value;
    const charCount = inputText.length;
    const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
    this.shadowRoot.querySelector('.input-group .character-count').textContent = 
      `Characters: ${charCount} | Words: ${wordCount}`;
  }

  updateOutputStats() {
    const outputText = this.shadowRoot.querySelector('#output-text').value;
    const charCount = outputText.length;
    const wordCount = outputText.trim() ? outputText.trim().split(/\s+/).length : 0;
    this.shadowRoot.querySelector('.output-group .character-count').textContent = 
      `Characters: ${charCount} | Words: ${wordCount}`;
  }

  convertCase(text, caseType) {
    const preserveLineBreaks = this.shadowRoot.querySelector('#preserve-line-breaks').checked;
    const removeExtraSpaces = this.shadowRoot.querySelector('#remove-extra-spaces').checked;
    const ignoreNumbers = this.shadowRoot.querySelector('#ignore-numbers').checked;
    const wordSeparator = this.shadowRoot.querySelector('#word-separator').value;
    
    let separator = ' ';
    switch (wordSeparator) {
      case 'underscore': separator = '_'; break;
      case 'hyphen': separator = '-'; break;
      case 'dot': separator = '.'; break;
      case 'none': separator = ''; break;
    }
    
    // Pre-processing
    let processedText = text;
    if (removeExtraSpaces) {
      processedText = processedText.replace(/\s+/g, ' ');
    }
    
    // Process based on case type
    let result = '';
    
    switch (caseType) {
      case 'lowercase':
        result = processedText.toLowerCase();
        break;
        
      case 'uppercase':
        result = processedText.toUpperCase();
        break;
        
      case 'capitalize':
        result = processedText.replace(/\b\w/g, char => char.toUpperCase());
        break;
        
      case 'title':
        const smallWords = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'if', 'in', 'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'up', 'yet'];
        result = processedText.toLowerCase().replace(/\b\w+/g, (word, index) => {
          if (index === 0 || !smallWords.includes(word)) {
            return word.charAt(0).toUpperCase() + word.slice(1);
          }
          return word;
        });
        break;
        
      case 'sentence':
        result = processedText.toLowerCase().replace(/(^\s*|\.\s+|\!\s+|\?\s+)([a-z])/g, 
          (match, p1, p2) => p1 + p2.toUpperCase());
        break;
        
      case 'alternating':
        result = processedText.split('').map((char, index) => 
          index % 2 === 0 ? char.toLowerCase() : char.toUpperCase()).join('');
        break;
        
      case 'inverse':
        result = processedText.split('').map(char => {
          if (char === char.toUpperCase()) {
            return char.toLowerCase();
          } else {
            return char.toUpperCase();
          }
        }).join('');
        break;
        
      case 'camel':
        result = processedText.toLowerCase()
          .replace(/[^a-zA-Z0-9]+(.)/g, (match, char) => char.toUpperCase())
          .replace(/^[A-Z]/, c => c.toLowerCase());
        break;
        
      case 'pascal':
        result = processedText.toLowerCase()
          .replace(/(?:^\w|[A-Z]|\b\w)/g, word => word.toUpperCase())
          .replace(/[^a-zA-Z0-9]/g, '');
        break;
        
      case 'snake':
        result = processedText.toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-zA-Z0-9_]/g, '')
          .replace(/_+/g, '_');
        break;
        
      case 'kebab':
        result = processedText.toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-zA-Z0-9-]/g, '')
          .replace(/-+/g, '-');
        break;
        
      case 'constant':
        result = processedText.toUpperCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-zA-Z0-9_]/g, '')
          .replace(/_+/g, '_');
        break;
        
      default:
        result = processedText;
    }
    
    if (!preserveLineBreaks && result.includes('\n')) {
      result = result.replace(/\n/g, ' ').replace(/\s+/g, ' ');
    }
    
    return result;
  }

  formatText(text, formatType) {
    switch (formatType) {
      case 'trim':
        return text.trim();
        
      case 'single-line':
        return text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
        
      case 'remove-duplicate-lines':
        const lines = text.split('\n');
        const uniqueLines = [...new Set(lines)];
        return uniqueLines.join('\n');
        
      case 'remove-empty-lines':
        return text.split('\n').filter(line => line.trim() !== '').join('\n');
        
      case 'add-line-numbers':
        return text.split('\n').map((line, index) => `${index + 1}. ${line}`).join('\n');
        
      case 'sort-lines-asc':
        return text.split('\n').sort().join('\n');
        
      case 'sort-lines-desc':
        return text.split('\n').sort().reverse().join('\n');
        
      case 'reverse-lines':
        return text.split('\n').reverse().join('\n');
        
      case 'shuffle-lines':
        const shuffleLines = text.split('\n');
        for (let i = shuffleLines.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffleLines[i], shuffleLines[j]] = [shuffleLines[j], shuffleLines[i]];
        }
        return shuffleLines.join('\n');
        
      default:
        return text;
    }
  }

  specialProcess(text, specialType) {
    switch (specialType) {
      case 'reverse':
        return text.split('').reverse().join('');
        
      case 'word-count':
        const charCount = text.length;
        const charNoSpaces = text.replace(/\s/g, '').length;
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        const lineCount = text.split('\n').length;
        const paragraphCount = text.split(/\n\s*\n/).filter(p => p.trim()).length;
        
        return `Text Statistics:
Characters (with spaces): ${charCount}
Characters (without spaces): ${charNoSpaces}
Words: ${wordCount}
Lines: ${lineCount}
Paragraphs: ${paragraphCount}`;
        
      case 'remove-accents':
        return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
      case 'url-encode':
        return encodeURIComponent(text);
        
      case 'url-decode':
        try {
          return decodeURIComponent(text);
        } catch (e) {
          return 'Error: Invalid URL encoding';
        }
        
      case 'base64-encode':
        try {
          return btoa(text);
        } catch (e) {
          return 'Error: Cannot encode to Base64';
        }
        
      case 'base64-decode':
        try {
          return atob(text);
        } catch (e) {
          return 'Error: Invalid Base64 string';
        }
        
      case 'md5':
        return this.generateMD5Hash(text);
        
      case 'random-case':
        return text.split('').map(char => 
          Math.random() > 0.5 ? char.toUpperCase() : char.toLowerCase()
        ).join('');
        
      case 'morse-encode':
        return this.textToMorse(text);
        
      case 'morse-decode':
        return this.morseToText(text);
        
      default:
        return text;
    }
  }

  generateMD5Hash(input) {
    return `MD5 hash would be generated for: "${input}"`;
  }

  textToMorse(text) {
    const morseCode = {
      'a': '.-', 'b': '-...', 'c': '-.-.', 'd': '-..', 'e': '.', 'f': '..-.', 'g': '--.', 'h': '....', 'i': '..', 
      'j': '.---', 'k': '-.-', 'l': '.-..', 'm': '--', 'n': '-.', 'o': '---', 'p': '.--.', 'q': '--.-', 'r': '.-.', 
      's': '...', 't': '-', 'u': '..-', 'v': '...-', 'w': '.--', 'x': '-..-', 'y': '-.--', 'z': '--..',
      '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', 
      '8': '---..', '9': '----.', ' ': '/'
    };
    
    return text.toLowerCase().split('').map(char => {
      return morseCode[char] || char;
    }).join(' ');
  }

  morseToText(morse) {
    const morseCode = {
      '.-': 'a', '-...': 'b', '-.-.': 'c', '-..': 'd', '.': 'e', '..-.': 'f', '--.': 'g', '....': 'h', '..': 'i', 
      '.---': 'j', '-.-': 'k', '.-..': 'l', '--': 'm', '-.': 'n', '---': 'o', '.--.': 'p', '--.-': 'q', '.-.': 'r', 
      '...': 's', '-': 't', '..-': 'u', '...-': 'v', '.--': 'w', '-..-': 'x', '-.--': 'y', '--..': 'z',
      '-----': '0', '.----': '1', '..---': '2', '...--': '3', '....-': '4', '.....': '5', '-....': '6', '--...': '7', 
      '---..': '8', '----.': '9', '/': ' '
    };
    
    return morse.split(' ').map(code => {
      return morseCode[code] || code;
    }).join('');
  }

  connectedCallback() {
    this.updateInputStats();
    this.updateOutputStats();
    
    this.shadowRoot.querySelector('#preserve-line-breaks').checked = true;
    this.shadowRoot.querySelector('#remove-extra-spaces').checked = false;
    this.shadowRoot.querySelector('#ignore-numbers').checked = false;
  }

  disconnectedCallback() {
    // Cleanup if needed
  }
}

customElements.define('text-case-converter', TextCaseConverter);
