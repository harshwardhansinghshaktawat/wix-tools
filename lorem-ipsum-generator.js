/**
 * Lorem Ipsum Generator - Advanced Wix Custom Element with Customization
 * File name: lorem-ipsum-generator.js
 * Custom Element tag name: lorem-ipsum-generator
 */

class LoremIpsumGenerator extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Default settings
    this.settings = {
      primaryBg: '#ffffff',
      secondaryBg: '#f9f9f9',
      borderColor: '#ddd',
      secondaryText: '#7f8c8d',
      mainAccent: '#3498db',
      hoverAccent: '#2980b9',
      headingColor: '#2c3e50',
      paragraphColor: '#333333',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      fontSize: 14,
      headingSize: 22,
      borderRadius: 8,
      buttonPadding: 8
    };
    
    // Default configuration
    this.config = {
      textType: 'lorem',
      paragraphCount: 3,
      minSentences: 3,
      maxSentences: 7,
      minWordsPerSentence: 5,
      maxWordsPerSentence: 15,
      includeHTMLTags: false,
      outputFormat: 'plain',
      startWithLorem: true
    };
    
    // Dictionary of text types and their word banks
    this.wordBanks = {
      lorem: [
        'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
        'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
        'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation',
        'ullamco', 'laboris', 'nisi', 'ut', 'aliquip', 'ex', 'ea', 'commodo', 'consequat',
        'duis', 'aute', 'irure', 'dolor', 'in', 'reprehenderit', 'in', 'voluptate', 'velit',
        'esse', 'cillum', 'dolore', 'eu', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
        'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'in', 'culpa', 'qui', 'officia',
        'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum'
      ],
      hipster: [
        'artisan', 'aesthetic', 'brewery', 'craft', 'cred', 'authentic', 'lomo', 'waistcoat',
        'mustache', 'skateboard', 'fixie', 'readymade', 'biodiesel', 'keytar', 'flannel',
        'bicycle', 'rights', 'locavore', 'farm-to-table', 'kale', 'chips', 'pickled', 'sriracha',
        'synth', 'normcore', 'williamsburg', 'distillery', 'cronut', 'disrupt', 'plaid', 'mixtape',
        'stumptown', 'pabst', 'vinyl', 'beard', 'hella', 'bushwick', 'echo', 'park', 'banjo',
        'microdosing', 'tattooed', 'tofu', 'chambray', 'marfa', 'pitchfork', 'thundercats',
        'ethical', 'fingerstache', 'keffiyeh', 'organic', 'cardigan', 'sartorial', 'vegan',
        'pork', 'belly', 'mlkshk', 'brooklyn', 'butcher', 'flexitarian', 'selvage', 'kogi'
      ],
      office: [
        'synergy', 'workflow', 'deliverable', 'actionable', 'metrics', 'leverage', 'pipeline',
        'bandwidth', 'stakeholder', 'iteration', 'agile', 'paradigm', 'pivot', 'vertical',
        'holistic', 'mission-critical', 'streamline', 'core', 'competency', 'alignment', 'strategy',
        'whiteboard', 'mindshare', 'scalable', 'deliverables', 'disruptive', 'innovation', 'value-add',
        'baseline', 'roadmap', 'silo', 'integrated', 'client-focused', 'sync', 'ideate', 'optimize',
        'offshore', 'onboard', 'executive', 'deadline', 'turnkey', 'incentivize', 'margin',
        'platform', 'organic', 'growth', 'solutions', 'bleeding-edge', 'narrative', 'wheelhouse',
        'touchpoint', 'best-in-class', 'leadership', 'quarterly', 'revenue', 'fiscal', 'objectives'
      ],
      food: [
        'pastry', 'chocolate', 'caramel', 'sugar', 'butter', 'flour', 'vanilla', 'cream',
        'coffee', 'cupcake', 'dessert', 'tart', 'cookie', 'biscuit', 'marzipan', 'wafer',
        'lollipop', 'jelly', 'pudding', 'bonbon', 'tiramisu', 'macaroon', 'croissant', 'brownie',
        'gummi', 'bears', 'pie', 'cake', 'candy', 'sweet', 'roll', 'danish', 'cheesecake',
        'toffee', 'fruitcake', 'gingerbread', 'ice', 'cream', 'donut', 'gelato', 'marshmallow',
        'chupa', 'chups', 'liquorice', 'halvah', 'soufflé', 'dragée', 'carrot', 'sesame', 'snaps',
        'cotton', 'candy', 'topping', 'apple', 'pie', 'chocolate', 'bar', 'jujubes', 'caramels'
      ]
    };
    
    this.loremStart = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit';
    
    this.htmlTags = [
      ['<p>', '</p>'],
      ['<div>', '</div>'],
      ['<span>', '</span>'],
      ['<strong>', '</strong>'],
      ['<em>', '</em>']
    ];
    
    this.renderUI();
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
  
  connectedCallback() {
    this.generateText();
  }
  
  renderUI() {
    this.shadowRoot.innerHTML = `
      <style id="dynamic-styles">
        ${this.getStyles()}
      </style>
      
      <div class="container">
        <h2>Lorem Ipsum Generator</h2>
        
        <div class="controls">
          <div class="control-group">
            <label for="text-type">Text Type</label>
            <select id="text-type">
              <option value="lorem">Classic Lorem Ipsum</option>
              <option value="hipster">Hipster Ipsum</option>
              <option value="office">Office Ipsum</option>
              <option value="food">Food Ipsum</option>
            </select>
          </div>
          
          <div class="control-group">
            <label for="paragraph-count">Paragraphs</label>
            <input type="number" id="paragraph-count" min="1" max="50" value="3">
          </div>
          
          <div class="control-group">
            <label for="min-sentences">Minimum Sentences per Paragraph</label>
            <input type="number" id="min-sentences" min="1" max="20" value="3">
          </div>
          
          <div class="control-group">
            <label for="max-sentences">Maximum Sentences per Paragraph</label>
            <input type="number" id="max-sentences" min="1" max="20" value="7">
          </div>
          
          <div class="control-group">
            <label for="min-words">Minimum Words per Sentence</label>
            <input type="number" id="min-words" min="3" max="20" value="5">
          </div>
          
          <div class="control-group">
            <label for="max-words">Maximum Words per Sentence</label>
            <input type="number" id="max-words" min="3" max="30" value="15">
          </div>
          
          <div class="control-group">
            <label for="output-format">Output Format</label>
            <select id="output-format">
              <option value="plain">Plain Text</option>
              <option value="html">HTML</option>
              <option value="markdown">Markdown</option>
            </select>
          </div>
          
          <div class="control-group checkbox-group">
            <input type="checkbox" id="start-with-lorem" checked>
            <label for="start-with-lorem">Start with 'Lorem ipsum'</label>
          </div>
          
          <div class="control-group checkbox-group">
            <input type="checkbox" id="include-html">
            <label for="include-html">Include Random HTML Tags</label>
          </div>
        </div>
        
        <div class="button-group">
          <button id="generate-btn">Generate</button>
          <button id="copy-btn" class="secondary">Copy to Clipboard</button>
          <button id="download-btn" class="secondary">Download</button>
        </div>
        
        <div class="output" id="output"></div>
        <div class="copy-message" id="copy-message">Text copied to clipboard!</div>
        <div class="stats" id="stats"></div>
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
        background: var(--primary-bg);
        border-radius: var(--border-radius);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        padding: 20px;
        overflow: hidden;
        border: 1px solid var(--border-color);
      }
      
      h2 {
        margin-top: 0;
        color: var(--heading-color);
        font-weight: 600;
        font-size: var(--heading-size);
        font-family: var(--font-family);
        margin-bottom: 20px;
      }
      
      .controls {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 15px;
        margin-bottom: 20px;
      }
      
      .control-group {
        margin-bottom: 15px;
      }
      
      label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
        color: var(--heading-color);
        font-size: var(--font-size);
        font-family: var(--font-family);
      }
      
      select, input[type="number"] {
        width: 100%;
        padding: var(--button-padding) 12px;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        font-size: var(--font-size);
        transition: border-color 0.3s;
        background-color: var(--primary-bg);
        color: var(--paragraph-color);
        font-family: var(--font-family);
        box-sizing: border-box;
      }
      
      select:focus, input[type="number"]:focus {
        outline: none;
        border-color: var(--main-accent);
        box-shadow: 0 0 0 1px var(--main-accent);
      }
      
      .checkbox-group {
        display: flex;
        align-items: center;
        padding-top: 20px;
      }
      
      .checkbox-group input[type="checkbox"] {
        width: auto;
        margin-right: 8px;
        cursor: pointer;
        accent-color: var(--main-accent);
      }
      
      .checkbox-group label {
        margin-bottom: 0;
        cursor: pointer;
        font-weight: normal;
      }
      
      .button-group {
        display: flex;
        gap: 10px;
        margin: 15px 0;
        flex-wrap: wrap;
      }
      
      button {
        padding: var(--button-padding) 16px;
        border: none;
        border-radius: var(--border-radius);
        background-color: var(--main-accent);
        color: var(--primary-bg);
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.3s;
        font-size: var(--font-size);
        font-family: var(--font-family);
      }
      
      button:hover {
        background-color: var(--hover-accent);
      }
      
      button.secondary {
        background-color: var(--secondary-text);
      }
      
      button.secondary:hover {
        background-color: var(--heading-color);
      }
      
      .output {
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        padding: 15px;
        margin-top: 20px;
        max-height: 300px;
        overflow-y: auto;
        white-space: pre-wrap;
        line-height: 1.5;
        background-color: var(--secondary-bg);
        color: var(--paragraph-color);
        font-size: var(--font-size);
        font-family: var(--font-family);
      }
      
      .copy-message {
        color: var(--main-accent);
        margin-top: 10px;
        font-size: calc(var(--font-size) - 1px);
        height: 20px;
        transition: opacity 0.5s;
        opacity: 0;
        font-family: var(--font-family);
        font-weight: 500;
      }
      
      .copy-message.visible {
        opacity: 1;
      }
      
      .stats {
        font-size: calc(var(--font-size) - 1px);
        color: var(--secondary-text);
        margin-top: 10px;
        font-family: var(--font-family);
      }
      
      @media (max-width: 768px) {
        .controls {
          grid-template-columns: 1fr;
        }
        
        .button-group {
          flex-direction: column;
        }
        
        button {
          width: 100%;
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
    const generateBtn = this.shadowRoot.getElementById('generate-btn');
    const copyBtn = this.shadowRoot.getElementById('copy-btn');
    const downloadBtn = this.shadowRoot.getElementById('download-btn');
    const textTypeSelect = this.shadowRoot.getElementById('text-type');
    const paragraphCountInput = this.shadowRoot.getElementById('paragraph-count');
    const minSentencesInput = this.shadowRoot.getElementById('min-sentences');
    const maxSentencesInput = this.shadowRoot.getElementById('max-sentences');
    const minWordsInput = this.shadowRoot.getElementById('min-words');
    const maxWordsInput = this.shadowRoot.getElementById('max-words');
    const includeHtmlCheckbox = this.shadowRoot.getElementById('include-html');
    const outputFormatSelect = this.shadowRoot.getElementById('output-format');
    const startWithLoremCheckbox = this.shadowRoot.getElementById('start-with-lorem');
    
    generateBtn.addEventListener('click', () => {
      this.updateConfig();
      this.generateText();
    });
    
    copyBtn.addEventListener('click', () => this.copyToClipboard());
    downloadBtn.addEventListener('click', () => this.downloadText());
    
    minSentencesInput.addEventListener('change', () => {
      if (parseInt(minSentencesInput.value) > parseInt(maxSentencesInput.value)) {
        maxSentencesInput.value = minSentencesInput.value;
      }
    });
    
    maxSentencesInput.addEventListener('change', () => {
      if (parseInt(maxSentencesInput.value) < parseInt(minSentencesInput.value)) {
        minSentencesInput.value = maxSentencesInput.value;
      }
    });
    
    minWordsInput.addEventListener('change', () => {
      if (parseInt(minWordsInput.value) > parseInt(maxWordsInput.value)) {
        maxWordsInput.value = minWordsInput.value;
      }
    });
    
    maxWordsInput.addEventListener('change', () => {
      if (parseInt(maxWordsInput.value) < parseInt(minWordsInput.value)) {
        minWordsInput.value = maxWordsInput.value;
      }
    });
    
    textTypeSelect.addEventListener('change', () => {
      const isLoremType = textTypeSelect.value === 'lorem';
      startWithLoremCheckbox.disabled = !isLoremType;
      startWithLoremCheckbox.checked = isLoremType;
    });
    
    outputFormatSelect.addEventListener('change', () => {
      const isHtml = outputFormatSelect.value === 'html';
      includeHtmlCheckbox.disabled = isHtml;
      if (isHtml) {
        includeHtmlCheckbox.checked = true;
      }
    });
  }
  
  updateConfig() {
    this.config.textType = this.shadowRoot.getElementById('text-type').value;
    this.config.paragraphCount = parseInt(this.shadowRoot.getElementById('paragraph-count').value);
    this.config.minSentences = parseInt(this.shadowRoot.getElementById('min-sentences').value);
    this.config.maxSentences = parseInt(this.shadowRoot.getElementById('max-sentences').value);
    this.config.minWordsPerSentence = parseInt(this.shadowRoot.getElementById('min-words').value);
    this.config.maxWordsPerSentence = parseInt(this.shadowRoot.getElementById('max-words').value);
    this.config.includeHTMLTags = this.shadowRoot.getElementById('include-html').checked;
    this.config.outputFormat = this.shadowRoot.getElementById('output-format').value;
    this.config.startWithLorem = this.shadowRoot.getElementById('start-with-lorem').checked && this.config.textType === 'lorem';
    
    this.validateConfig();
  }
  
  validateConfig() {
    this.config.paragraphCount = Math.max(1, this.config.paragraphCount);
    
    if (this.config.minSentences > this.config.maxSentences) {
      this.config.maxSentences = this.config.minSentences;
    }
    
    if (this.config.minWordsPerSentence > this.config.maxWordsPerSentence) {
      this.config.maxWordsPerSentence = this.config.minWordsPerSentence;
    }
  }
  
  generateText() {
    const output = this.shadowRoot.getElementById('output');
    const stats = this.shadowRoot.getElementById('stats');
    
    let content = '';
    let totalWords = 0;
    let totalSentences = 0;
    
    for (let p = 0; p < this.config.paragraphCount; p++) {
      const paragraph = this.generateParagraph();
      content += paragraph.text;
      totalWords += paragraph.wordCount;
      totalSentences += paragraph.sentenceCount;
      
      if (p < this.config.paragraphCount - 1) {
        content += this.config.outputFormat === 'markdown' ? '\n\n' : '\n';
      }
    }
    
    let formattedContent = this.formatOutput(content);
    
    output.innerHTML = '';
    output.textContent = formattedContent;
    
    stats.textContent = `Generated ${this.config.paragraphCount} paragraphs, ${totalSentences} sentences, ${totalWords} words`;
  }
  
  generateParagraph() {
    const sentenceCount = this.getRandomInt(this.config.minSentences, this.config.maxSentences);
    let paragraph = '';
    let totalWords = 0;
    
    for (let s = 0; s < sentenceCount; s++) {
      if (s === 0 && paragraph === '' && this.config.startWithLorem) {
        paragraph += this.loremStart;
        totalWords += this.loremStart.split(' ').length;
      } else {
        const sentence = this.generateSentence();
        paragraph += sentence.text;
        totalWords += sentence.wordCount;
      }
      
      if (s < sentenceCount - 1) {
        paragraph += ' ';
      }
    }
    
    if (this.config.includeHTMLTags && (this.config.outputFormat === 'html' || Math.random() < 0.3)) {
      paragraph = this.applyRandomHTMLTags(paragraph);
    }
    
    if (this.config.outputFormat === 'html') {
      paragraph = `<p>${paragraph}</p>`;
    }
    
    return {
      text: paragraph,
      wordCount: totalWords,
      sentenceCount: sentenceCount
    };
  }
  
  generateSentence() {
    const wordBank = this.wordBanks[this.config.textType];
    const wordCount = this.getRandomInt(this.config.minWordsPerSentence, this.config.maxWordsPerSentence);
    let sentence = '';
    
    for (let w = 0; w < wordCount; w++) {
      const randomIndex = Math.floor(Math.random() * wordBank.length);
      let word = wordBank[randomIndex];
      
      if (w === 0) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
      }
      
      sentence += word;
      
      if (w < wordCount - 1) {
        sentence += ' ';
      }
    }
    
    sentence += '.';
    
    return {
      text: sentence,
      wordCount: wordCount
    };
  }
  
  applyRandomHTMLTags(text) {
    const tagPair = this.htmlTags[Math.floor(Math.random() * this.htmlTags.length)];
    
    const words = text.split(' ');
    if (words.length <= 3) return text;
    
    const startPos = this.getRandomInt(0, Math.floor(words.length / 2));
    const endPos = this.getRandomInt(Math.floor(words.length / 2) + 1, words.length - 1);
    
    words[startPos] = tagPair[0] + words[startPos];
    words[endPos] = words[endPos] + tagPair[1];
    
    return words.join(' ');
  }
  
  formatOutput(content) {
    switch (this.config.outputFormat) {
      case 'html':
        return content;
      case 'markdown':
        return content
          .replace(/<p>/g, '')
          .replace(/<\/p>/g, '\n\n')
          .replace(/<strong>/g, '**')
          .replace(/<\/strong>/g, '**')
          .replace(/<em>/g, '*')
          .replace(/<\/em>/g, '*')
          .replace(/<div>/g, '')
          .replace(/<\/div>/g, '\n')
          .replace(/<span>/g, '')
          .replace(/<\/span>/g, '');
      case 'plain':
      default:
        return content
          .replace(/<[^>]*>/g, '')
          .replace(/\n\n+/g, '\n\n');
    }
  }
  
  copyToClipboard() {
    const output = this.shadowRoot.getElementById('output');
    const copyMessage = this.shadowRoot.getElementById('copy-message');
    
    const textarea = document.createElement('textarea');
    textarea.value = output.textContent;
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
      document.execCommand('copy');
      copyMessage.classList.add('visible');
      setTimeout(() => copyMessage.classList.remove('visible'), 1500);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
    
    document.body.removeChild(textarea);
  }
  
  downloadText() {
    const output = this.shadowRoot.getElementById('output');
    const content = output.textContent;
    
    let extension = 'txt';
    let mimeType = 'text/plain';
    
    switch (this.config.outputFormat) {
      case 'html':
        extension = 'html';
        mimeType = 'text/html';
        break;
      case 'markdown':
        extension = 'md';
        mimeType = 'text/markdown';
        break;
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lorem-ipsum.${extension}`;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
  
  getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

customElements.define('lorem-ipsum-generator', LoremIpsumGenerator);
