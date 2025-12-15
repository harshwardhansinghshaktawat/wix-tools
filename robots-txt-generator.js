/**
 * Robots.txt Generator - Wix Custom Element with Customization
 * Custom Element name: robots-txt-generator
 */

class RobotsTxtGenerator extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Default settings
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
    
    this.userAgents = [
      { name: 'All robots', value: '*', selected: true, disallowed: [] },
      { name: 'Google', value: 'Googlebot', selected: false, disallowed: [] },
      { name: 'Bing', value: 'Bingbot', selected: false, disallowed: [] },
      { name: 'Yandex', value: 'Yandex', selected: false, disallowed: [] },
      { name: 'Baidu', value: 'Baiduspider', selected: false, disallowed: [] },
      { name: 'DuckDuckGo', value: 'DuckDuckBot', selected: false, disallowed: [] },
      { name: 'Facebook', value: 'Facebot', selected: false, disallowed: [] },
      { name: 'Twitter', value: 'Twitterbot', selected: false, disallowed: [] }
    ];
    this.sitemaps = [];
    this.crawlDelays = {};
    this.customDirectives = [];
    this.hostDirective = '';
    this.init();
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

  init() {
    this.render();
    this.updatePreview();
    this.attachEventListeners();
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
        
        --secondary-color: #2ecc71;
        --danger-color: #e74c3c;
        --box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        --transition: all 0.3s ease;
        
        display: block;
        font-family: var(--font-family);
        color: var(--paragraph-color);
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }
      
      .container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }
      
      @media (max-width: 768px) {
        .container {
          grid-template-columns: 1fr;
        }
      }
      
      .panel {
        background: var(--primary-bg);
        border-radius: var(--border-radius);
        box-shadow: var(--box-shadow);
        padding: 20px;
        margin-bottom: 20px;
        border: 1px solid var(--border-color);
      }
      
      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--border-color);
      }
      
      h2, h3 {
        margin: 0;
        color: var(--heading-color);
        font-family: var(--font-family);
      }
      
      h2 {
        font-size: var(--heading-size);
      }
      
      h3 {
        font-size: calc(var(--heading-size) - 6px);
        margin-bottom: 15px;
      }
      
      p, ol, li {
        color: var(--paragraph-color);
        font-family: var(--font-family);
        font-size: var(--font-size);
        line-height: 1.6;
      }
      
      .btn {
        background-color: var(--main-accent);
        color: var(--primary-bg);
        border: none;
        border-radius: var(--border-radius);
        padding: var(--button-padding) 16px;
        cursor: pointer;
        font-size: var(--font-size);
        font-weight: 500;
        transition: var(--transition);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-family: var(--font-family);
      }
      
      .btn:hover {
        background-color: var(--hover-accent);
        transform: translateY(-2px);
      }
      
      .btn-sm {
        padding: calc(var(--button-padding) - 3px) 10px;
        font-size: calc(var(--font-size) - 2px);
      }
      
      .btn-success {
        background-color: var(--secondary-color);
      }
      
      .btn-success:hover {
        background-color: #27ae60;
      }
      
      .btn-danger {
        background-color: var(--danger-color);
      }
      
      .btn-danger:hover {
        background-color: #c0392b;
      }
      
      .btn-outline {
        background-color: transparent;
        border: 1px solid var(--main-accent);
        color: var(--main-accent);
      }
      
      .btn-outline:hover {
        background-color: var(--main-accent);
        color: var(--primary-bg);
      }
      
      input, select, textarea {
        width: 100%;
        padding: 10px;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        margin-bottom: 10px;
        font-family: var(--font-family);
        transition: var(--transition);
        font-size: var(--font-size);
        background-color: var(--primary-bg);
        color: var(--paragraph-color);
        box-sizing: border-box;
      }
      
      input:focus, select:focus, textarea:focus {
        outline: none;
        border-color: var(--main-accent);
        box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
      }
      
      .form-group {
        margin-bottom: 15px;
      }
      
      label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
        color: var(--heading-color);
        font-family: var(--font-family);
        font-size: var(--font-size);
      }
      
      .checkbox-group {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
      }
      
      .checkbox-group input[type="checkbox"] {
        width: auto;
        margin-right: 10px;
        margin-bottom: 0;
        accent-color: var(--main-accent);
      }
      
      .user-agent {
        display: flex;
        align-items: center;
        padding: 10px;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        margin-bottom: 10px;
        transition: var(--transition);
        background-color: var(--primary-bg);
      }
      
      .user-agent:hover {
        background-color: var(--secondary-bg);
      }
      
      .user-agent input[type="checkbox"] {
        width: auto;
        margin-bottom: 0;
        margin-right: 10px;
        accent-color: var(--main-accent);
      }
      
      .user-agent-name {
        flex-grow: 1;
        margin-left: 10px;
        font-weight: 500;
        display: flex;
        align-items: center;
        color: var(--paragraph-color);
        font-family: var(--font-family);
        font-size: var(--font-size);
      }
      
      .user-agent-actions {
        display: flex;
        gap: 5px;
      }
      
      .disallow-list {
        margin-left: 30px;
        margin-top: 5px;
      }
      
      .disallow-item {
        display: flex;
        align-items: center;
        margin-bottom: 5px;
      }
      
      .disallow-item input {
        flex-grow: 1;
        margin-bottom: 0;
        margin-right: 10px;
      }
      
      .sitemap-item {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
      }
      
      .sitemap-item input {
        flex-grow: 1;
        margin-bottom: 0;
        margin-right: 10px;
      }
      
      .preview {
        font-family: monospace;
        white-space: pre-wrap;
        background-color: var(--secondary-bg);
        padding: 15px;
        border-radius: var(--border-radius);
        border: 1px solid var(--border-color);
        height: 300px;
        overflow-y: auto;
        color: var(--paragraph-color);
        font-size: var(--font-size);
      }
      
      .tabs {
        display: flex;
        border-bottom: 1px solid var(--border-color);
        margin-bottom: 15px;
      }
      
      .tab {
        padding: 10px 15px;
        cursor: pointer;
        transition: var(--transition);
        border-bottom: 2px solid transparent;
        color: var(--paragraph-color);
        font-family: var(--font-family);
        font-size: var(--font-size);
      }
      
      .tab.active {
        border-bottom: 2px solid var(--main-accent);
        color: var(--main-accent);
        font-weight: 500;
      }
      
      .tab:hover:not(.active) {
        background-color: var(--secondary-bg);
      }
      
      .tab-content {
        display: none;
      }
      
      .tab-content.active {
        display: block;
      }
      
      .crawl-delay-item {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
      }
      
      .crawl-delay-item select {
        width: 150px;
        margin-right: 10px;
        margin-bottom: 0;
      }
      
      .crawl-delay-item input {
        width: 80px;
        margin-right: 10px;
        margin-bottom: 0;
      }
      
      .custom-directive {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
      }
      
      .custom-directive input {
        flex-grow: 1;
        margin-bottom: 0;
        margin-right: 10px;
      }
      
      .actions-bar {
        display: flex;
        justify-content: space-between;
        margin-top: 20px;
        padding-top: 15px;
        border-top: 1px solid var(--border-color);
      }
      
      .tooltip {
        position: relative;
        display: inline-block;
        cursor: help;
        margin-left: 5px;
        color: var(--secondary-text);
      }
      
      .tooltip .tooltip-text {
        visibility: hidden;
        width: 200px;
        background-color: var(--heading-color);
        color: var(--primary-bg);
        text-align: center;
        border-radius: var(--border-radius);
        padding: 5px 10px;
        position: absolute;
        z-index: 1;
        bottom: 125%;
        left: 50%;
        transform: translateX(-50%);
        opacity: 0;
        transition: opacity 0.3s;
        font-size: calc(var(--font-size) - 2px);
        font-weight: normal;
        box-shadow: var(--box-shadow);
        pointer-events: none;
      }
      
      .tooltip:hover .tooltip-text {
        visibility: visible;
        opacity: 1;
      }
      
      .badge {
        display: inline-block;
        padding: 3px 8px;
        border-radius: calc(var(--border-radius) * 1.5);
        font-size: calc(var(--font-size) - 2px);
        font-weight: 500;
        background-color: var(--main-accent);
        color: var(--primary-bg);
        margin-left: 5px;
        font-family: var(--font-family);
      }
      
      .spinner {
        display: inline-block;
        width: 12px;
        height: 12px;
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s linear infinite;
        margin-right: 5px;
        display: none;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      .copy-success {
        opacity: 0;
        transition: opacity 0.3s;
        color: var(--secondary-color);
        font-family: var(--font-family);
        font-size: var(--font-size);
        margin-left: 10px;
      }
      
      .copy-success.show {
        opacity: 1;
      }
      
      #instructions-panel {
        margin-bottom: 20px;
        padding: 15px;
        background-color: var(--secondary-bg);
        border-radius: var(--border-radius);
        border: 1px solid var(--border-color);
      }
    `;
  }

  getHTML() {
    return `
      <div class="panel">
        <div class="panel-header">
          <h2>Robots.txt Generator</h2>
          <button class="btn btn-outline btn-sm" id="show-instructions">How to Use</button>
        </div>
        
        <div id="instructions-panel" style="display: none;">
          <h3>How to Use This Tool</h3>
          <p><strong>User Agents Tab:</strong></p>
          <ol>
            <li>Check the boxes for search engines you want to create rules for</li>
            <li>Click "Add Path" to add directories you want to block for that search engine</li>
            <li>Enter the path in the text field (e.g., /admin/ or /private/)</li>
            <li>Use "Add Custom User Agent" for bots not in the list</li>
          </ol>
          
          <p><strong>Sitemaps Tab:</strong></p>
          <ol>
            <li>Click "Add Sitemap" to add your sitemap URLs</li>
            <li>Enter the complete URL (e.g., https://example.com/sitemap.xml)</li>
            <li>Add multiple sitemaps if needed</li>
          </ol>
          
          <p><strong>Advanced Settings Tab:</strong></p>
          <ol>
            <li><strong>Crawl Delay:</strong> Set the number of seconds bots should wait between requests</li>
            <li><strong>Host Directive:</strong> Specify your preferred domain (e.g., www.example.com)</li>
            <li><strong>Custom Directives:</strong> Add any other special directives</li>
          </ol>
          
          <p><strong>Preview and Download:</strong></p>
          <ol>
            <li>Preview updates in real-time as you make changes</li>
            <li>Use "Copy to Clipboard" to copy the content</li>
            <li>Click "Download robots.txt" to download the file</li>
            <li>Use "Reset" to start over</li>
          </ol>
          
          <p><strong>Using in Your Website:</strong></p>
          <ol>
            <li>After creating your robots.txt, download the file</li>
            <li>Upload it to your website's root directory</li>
            <li>Verify it works by visiting yourdomain.com/robots.txt</li>
          </ol>
          
          <button class="btn btn-outline btn-sm" id="hide-instructions">Close Instructions</button>
        </div>
        
        <div class="tabs">
          <div class="tab active" data-tab="user-agents">User Agents</div>
          <div class="tab" data-tab="sitemaps">Sitemaps</div>
          <div class="tab" data-tab="advanced">Advanced Settings</div>
        </div>
        
        <!-- User Agents Tab -->
        <div class="tab-content active" data-tab-content="user-agents">
          <div id="user-agents-container">
            <!-- User agents will be rendered here -->
          </div>
          <button class="btn btn-outline btn-sm" id="add-custom-agent">
            Add Custom User Agent
          </button>
        </div>
        
        <!-- Sitemaps Tab -->
        <div class="tab-content" data-tab-content="sitemaps">
          <div class="form-group">
            <label>
              Sitemaps
              <span class="tooltip">?
                <span class="tooltip-text">Add your sitemap URLs to help search engines discover pages on your site.</span>
              </span>
            </label>
            <div id="sitemaps-container">
              <!-- Sitemaps will be rendered here -->
            </div>
            <button class="btn btn-outline btn-sm" id="add-sitemap">Add Sitemap</button>
          </div>
        </div>
        
        <!-- Advanced Settings Tab -->
        <div class="tab-content" data-tab-content="advanced">
          <div class="form-group">
            <label>
              Crawl Delay
              <span class="tooltip">?
                <span class="tooltip-text">Set a delay (in seconds) between consecutive requests from the same bot.</span>
              </span>
            </label>
            <div id="crawl-delays-container">
              <!-- Crawl delays will be rendered here -->
            </div>
            <button class="btn btn-outline btn-sm" id="add-crawl-delay">Add Crawl Delay</button>
          </div>
          
          <div class="form-group">
            <label>
              Host Directive
              <span class="tooltip">?
                <span class="tooltip-text">Specify the preferred domain name to use for your website (e.g., www.example.com).</span>
              </span>
            </label>
            <input type="text" id="host-directive" placeholder="e.g., www.example.com">
          </div>
          
          <div class="form-group">
            <label>
              Custom Directives
              <span class="tooltip">?
                <span class="tooltip-text">Add any additional custom directives for your robots.txt file.</span>
              </span>
            </label>
            <div id="custom-directives-container">
              <!-- Custom directives will be rendered here -->
            </div>
            <button class="btn btn-outline btn-sm" id="add-custom-directive">Add Custom Directive</button>
          </div>
        </div>
      </div>
      
      <div class="container">
        <div class="panel">
          <div class="panel-header">
            <h3>Preview</h3>
            <div>
              <button class="btn btn-outline btn-sm" id="copy-btn">
                <span class="spinner" id="copy-spinner"></span>
                Copy to Clipboard
              </button>
              <span class="copy-success" id="copy-success">Copied!</span>
            </div>
          </div>
          <div class="preview" id="preview"></div>
          <div class="actions-bar">
            <div>
              <button class="btn btn-success" id="download-btn">Download robots.txt</button>
            </div>
            <div>
              <button class="btn btn-outline" id="reset-btn">Reset</button>
            </div>
          </div>
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

  attachEventListeners() {
    // Tab navigation
    this.shadowRoot.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.shadowRoot.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        this.shadowRoot.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        const tabContent = this.shadowRoot.querySelector(`.tab-content[data-tab-content="${tab.dataset.tab}"]`);
        if (tabContent) tabContent.classList.add('active');
      });
    });

    // Instructions toggle
    this.shadowRoot.getElementById('show-instructions').addEventListener('click', () => {
      this.shadowRoot.getElementById('instructions-panel').style.display = 'block';
    });
    
    this.shadowRoot.getElementById('hide-instructions').addEventListener('click', () => {
      this.shadowRoot.getElementById('instructions-panel').style.display = 'none';
    });

    // Add user agent
    this.shadowRoot.getElementById('add-custom-agent').addEventListener('click', () => {
      const name = prompt('Enter custom user agent name:');
      if (!name) return;
      
      const value = prompt('Enter user agent value:');
      if (!value) return;
      
      this.userAgents.push({ name, value, selected: false, disallowed: [] });
      this.renderUserAgents();
      this.updatePreview();
    });

    // Add sitemap
    this.shadowRoot.getElementById('add-sitemap').addEventListener('click', () => {
      this.sitemaps.push('');
      this.renderSitemaps();
      this.updatePreview();
    });

    // Add crawl delay
    this.shadowRoot.getElementById('add-crawl-delay').addEventListener('click', () => {
      const availableAgents = this.userAgents.filter(agent => !this.crawlDelays.hasOwnProperty(agent.value));
      
      if (availableAgents.length === 0) {
        alert('All user agents already have crawl delays set.');
        return;
      }
      
      this.crawlDelays[availableAgents[0].value] = 10;
      this.renderCrawlDelays();
      this.updatePreview();
    });

    // Add custom directive
    this.shadowRoot.getElementById('add-custom-directive').addEventListener('click', () => {
      this.customDirectives.push('');
      this.renderCustomDirectives();
      this.updatePreview();
    });

    // Host directive
    this.shadowRoot.getElementById('host-directive').addEventListener('input', (e) => {
      this.hostDirective = e.target.value.trim();
      this.updatePreview();
    });

    // Copy to clipboard
    this.shadowRoot.getElementById('copy-btn').addEventListener('click', () => {
      const preview = this.shadowRoot.getElementById('preview');
      const spinner = this.shadowRoot.getElementById('copy-spinner');
      const successMsg = this.shadowRoot.getElementById('copy-success');
      
      spinner.style.display = 'inline-block';
      
      navigator.clipboard.writeText(preview.textContent)
        .then(() => {
          spinner.style.display = 'none';
          successMsg.classList.add('show');
          
          setTimeout(() => {
            successMsg.classList.remove('show');
          }, 2000);
        })
        .catch(err => {
          spinner.style.display = 'none';
          alert('Failed to copy: ' + err);
        });
    });

    // Download
    this.shadowRoot.getElementById('download-btn').addEventListener('click', () => {
      const content = this.shadowRoot.getElementById('preview').textContent;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'robots.txt';
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
    });

    // Reset
    this.shadowRoot.getElementById('reset-btn').addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all settings?')) {
        this.userAgents.forEach(agent => {
          agent.selected = agent.value === '*';
          agent.disallowed = [];
        });
        
        this.sitemaps = [];
        this.crawlDelays = {};
        this.customDirectives = [];
        this.hostDirective = '';
        
        this.renderUserAgents();
        this.renderSitemaps();
        this.renderCrawlDelays();
        this.renderCustomDirectives();
        this.shadowRoot.getElementById('host-directive').value = '';
        this.updatePreview();
      }
    });
  }

  renderUserAgents() {
    const container = this.shadowRoot.getElementById('user-agents-container');
    container.innerHTML = '';
    
    this.userAgents.forEach((agent, index) => {
      const agentEl = document.createElement('div');
      agentEl.className = 'user-agent';
      agentEl.innerHTML = `
        <input type="checkbox" ${agent.selected ? 'checked' : ''}>
        <div class="user-agent-name">
          ${agent.name}
          <div class="badge" style="margin-left: 8px;">${agent.value}</div>
        </div>
        <div class="user-agent-actions">
          <button class="btn btn-outline btn-sm add-disallow-btn">Add Path</button>
          ${index > 7 ? `<button class="btn btn-danger btn-sm remove-agent-btn">Remove</button>` : ''}
        </div>
      `;
      
      // Add checkbox event listener
      const checkbox = agentEl.querySelector('input[type="checkbox"]');
      checkbox.addEventListener('change', () => {
        agent.selected = checkbox.checked;
        this.updatePreview();
      });
      
      // Add disallow path
      const addDisallowBtn = agentEl.querySelector('.add-disallow-btn');
      addDisallowBtn.addEventListener('click', () => {
        agent.disallowed.push('/');
        this.renderUserAgents();
        this.updatePreview();
      });
      
      // Remove agent (only for custom agents)
      if (index > 7) {
        const removeAgentBtn = agentEl.querySelector('.remove-agent-btn');
        removeAgentBtn.addEventListener('click', () => {
          this.userAgents.splice(index, 1);
          
          // Remove any crawl delay for this agent
          if (this.crawlDelays.hasOwnProperty(agent.value)) {
            delete this.crawlDelays[agent.value];
          }
          
          this.renderUserAgents();
          this.renderCrawlDelays();
          this.updatePreview();
        });
      }
      
      // Render disallow paths
      if (agent.disallowed.length > 0) {
        const disallowList = document.createElement('div');
        disallowList.className = 'disallow-list';
        
        agent.disallowed.forEach((path, pathIndex) => {
          const pathItem = document.createElement('div');
          pathItem.className = 'disallow-item';
          pathItem.innerHTML = `
            <input type="text" value="${path}" placeholder="e.g., /private/">
            <button class="btn btn-danger btn-sm">Remove</button>
          `;
          
          // Path input change
          const pathInput = pathItem.querySelector('input');
          pathInput.addEventListener('input', () => {
            agent.disallowed[pathIndex] = pathInput.value;
            this.updatePreview();
          });
          
          // Remove path
          const removeBtn = pathItem.querySelector('.btn-danger');
          removeBtn.addEventListener('click', () => {
            agent.disallowed.splice(pathIndex, 1);
            this.renderUserAgents();
            this.updatePreview();
          });
          
          disallowList.appendChild(pathItem);
        });
        
        agentEl.appendChild(disallowList);
      }
      
      container.appendChild(agentEl);
    });
  }

  renderSitemaps() {
    const container = this.shadowRoot.getElementById('sitemaps-container');
    container.innerHTML = '';
    
    this.sitemaps.forEach((sitemap, index) => {
      const sitemapItem = document.createElement('div');
      sitemapItem.className = 'sitemap-item';
      sitemapItem.innerHTML = `
        <input type="text" value="${sitemap}" placeholder="e.g., https://example.com/sitemap.xml">
        <button class="btn btn-danger btn-sm">Remove</button>
      `;
      
      // Sitemap input change
      const sitemapInput = sitemapItem.querySelector('input');
      sitemapInput.addEventListener('input', () => {
        this.sitemaps[index] = sitemapInput.value;
        this.updatePreview();
      });
      
      // Remove sitemap
      const removeBtn = sitemapItem.querySelector('.btn-danger');
      removeBtn.addEventListener('click', () => {
        this.sitemaps.splice(index, 1);
        this.renderSitemaps();
        this.updatePreview();
      });
      
      container.appendChild(sitemapItem);
    });
  }

  renderCrawlDelays() {
    const container = this.shadowRoot.getElementById('crawl-delays-container');
    container.innerHTML = '';
    
    Object.entries(this.crawlDelays).forEach(([agent, delay]) => {
      const delayItem = document.createElement('div');
      delayItem.className = 'crawl-delay-item';
      
      // Create select with user agents
      const select = document.createElement('select');
      this.userAgents.forEach(ua => {
        const option = document.createElement('option');
        option.value = ua.value;
        option.textContent = ua.name;
        option.selected = ua.value === agent;
        select.appendChild(option);
      });
      
      // Create delay input
      const input = document.createElement('input');
      input.type = 'number';
      input.min = '1';
      input.max = '30';
      input.value = delay;
      
      // Create remove button
      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn btn-danger btn-sm';
      removeBtn.textContent = 'Remove';
      
      // Add to delay item
      delayItem.appendChild(select);
      delayItem.appendChild(document.createTextNode(' seconds'));
      delayItem.appendChild(input);
      delayItem.appendChild(removeBtn);
      
      // Event listeners
      select.addEventListener('change', () => {
        // Remove old key
        const newDelay = this.crawlDelays[agent];
        delete this.crawlDelays[agent];
        
        // Add new key
        this.crawlDelays[select.value] = newDelay;
        this.renderCrawlDelays();
        this.updatePreview();
      });
      
      input.addEventListener('change', () => {
        this.crawlDelays[agent] = parseInt(input.value, 10) || 10;
        this.updatePreview();
      });
      
      removeBtn.addEventListener('click', () => {
        delete this.crawlDelays[agent];
        this.renderCrawlDelays();
        this.updatePreview();
      });
      
      container.appendChild(delayItem);
    });
  }

  renderCustomDirectives() {
    const container = this.shadowRoot.getElementById('custom-directives-container');
    container.innerHTML = '';
    
    this.customDirectives.forEach((directive, index) => {
      const directiveItem = document.createElement('div');
      directiveItem.className = 'custom-directive';
      directiveItem.innerHTML = `
        <input type="text" value="${directive}" placeholder="e.g., Clean-param: ref /articles/">
        <button class="btn btn-danger btn-sm">Remove</button>
      `;
      
      // Directive input change
      const directiveInput = directiveItem.querySelector('input');
      directiveInput.addEventListener('input', () => {
        this.customDirectives[index] = directiveInput.value;
        this.updatePreview();
      });
      
      // Remove directive
      const removeBtn = directiveItem.querySelector('.btn-danger');
      removeBtn.addEventListener('click', () => {
        this.customDirectives.splice(index, 1);
        this.renderCustomDirectives();
        this.updatePreview();
      });
      
      container.appendChild(directiveItem);
    });
  }

  updatePreview() {
    const preview = this.shadowRoot.getElementById('preview');
    let content = '';
    
    // Add user agents and their rules
    this.userAgents.forEach(agent => {
      if (agent.selected) {
        content += `User-agent: ${agent.value}\n`;
        
        // Add crawl delay if exists
        if (this.crawlDelays.hasOwnProperty(agent.value)) {
          content += `Crawl-delay: ${this.crawlDelays[agent.value]}\n`;
        }
        
        // Add disallow paths
        if (agent.disallowed.length === 0) {
          content += 'Allow: /\n';
        } else {
          agent.disallowed.forEach(path => {
            content += `Disallow: ${path}\n`;
          });
        }
        
        content += '\n';
      }
    });
    
    // Add host directive
    if (this.hostDirective) {
      content += `Host: ${this.hostDirective}\n\n`;
    }
    
    // Add sitemaps
    this.sitemaps.forEach(sitemap => {
      if (sitemap.trim()) {
        content += `Sitemap: ${sitemap}\n`;
      }
    });
    
    if (this.sitemaps.length > 0 && this.sitemaps.some(s => s.trim())) {
      content += '\n';
    }
    
    // Add custom directives
    this.customDirectives.forEach(directive => {
      if (directive.trim()) {
        content += `${directive}\n`;
      }
    });
    
    // Remove trailing newlines
    content = content.replace(/\n+$/, '\n');
    
    preview.textContent = content;
  }

  connectedCallback() {
    this.renderUserAgents();
    this.renderSitemaps();
    this.renderCrawlDelays();
    this.renderCustomDirectives();
  }
}

// Define the custom element
customElements.define('robots-txt-generator', RobotsTxtGenerator);
