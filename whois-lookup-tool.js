/**
 * WHOIS Lookup Tool - Advanced Wix Custom Element with Customization
 * File name: whois-lookup-tool.js
 * Custom Element tag name: whois-lookup-tool
 */

class WhoisLookupTool extends HTMLElement {
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
    
    // Store state
    this.state = {
      domain: '',
      isLoading: false,
      results: null,
      error: null,
      activeTab: 'whois',
      availabilityResults: [],
      dnsResults: null,
      healthCheck: null
    };
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
    // Event listeners
    this.shadowRoot.querySelector('#domain-input').addEventListener('input', this.handleInput.bind(this));
    this.shadowRoot.querySelector('#search-button').addEventListener('click', this.performLookup.bind(this));
    this.shadowRoot.querySelector('#domain-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.performLookup();
    });
    
    // Tab event listeners
    const tabs = this.shadowRoot.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.changeTab(tab.dataset.tab);
      });
    });
  }
  
  async performLookup() {
    const domainInput = this.shadowRoot.querySelector('#domain-input');
    const domain = domainInput.value.trim().toLowerCase();
    
    // Basic validation
    if (!domain) {
      this.showError('Please enter a domain name');
      return;
    }
    
    // Extract domain without protocol
    let cleanDomain = domain;
    if (domain.startsWith('http://')) {
      cleanDomain = domain.substring(7);
    } else if (domain.startsWith('https://')) {
      cleanDomain = domain.substring(8);
    }
    
    // Remove www. if present
    if (cleanDomain.startsWith('www.')) {
      cleanDomain = cleanDomain.substring(4);
    }
    
    // Remove path if present
    cleanDomain = cleanDomain.split('/')[0];
    
    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(cleanDomain)) {
      this.showError('Please enter a valid domain name (e.g., example.com)');
      return;
    }
    
    this.state.domain = cleanDomain;
    this.state.isLoading = true;
    this.state.error = null;
    this.updateUI();
    
    try {
      // Perform lookups based on active tab
      if (this.state.activeTab === 'whois' || this.state.activeTab === 'all') {
        await this.fetchWhoisData(cleanDomain);
      }
      
      if (this.state.activeTab === 'availability' || this.state.activeTab === 'all') {
        await this.checkDomainAvailability(cleanDomain);
      }
      
      if (this.state.activeTab === 'dns' || this.state.activeTab === 'all') {
        await this.fetchDNSInfo(cleanDomain);
      }
      
      if (this.state.activeTab === 'health' || this.state.activeTab === 'all') {
        await this.checkDomainHealth(cleanDomain);
      }
    } catch (error) {
      console.error('Lookup error:', error);
      this.showError('An error occurred during the lookup. Please try again.');
    } finally {
      this.state.isLoading = false;
      this.updateUI();
    }
  }
  
  async fetchWhoisData(domain) {
    try {
      // Using RDAP protocol (modern replacement for WHOIS) which has public endpoints
      const tld = domain.split('.').pop();
      
      // First try the more direct approach using RDAP
      try {
        const response = await fetch(`https://rdap.org/domain/${domain}`);
        if (response.ok) {
          const data = await response.json();
          this.state.results = this.formatRdapData(data);
          return;
        }
      } catch (e) {
        console.log('RDAP direct lookup failed, trying alternative methods');
      }
      
      // Fallback to public WHOIS API that doesn't require API keys
      const response = await fetch(`https://rdap-bootstrap.arin.net/bootstrap/domain/${domain}`);
      if (!response.ok) {
        throw new Error('Failed to fetch domain information');
      }
      
      const data = await response.json();
      this.state.results = this.formatRdapData(data);
    } catch (error) {
      console.error('WHOIS lookup error:', error);
      
      // Last resort fallback - provide minimal information
      this.state.results = {
        domain: domain,
        registrar: 'Information not available',
        createdDate: 'Information not available',
        updatedDate: 'Information not available',
        expiryDate: 'Information not available',
        status: 'Information not available',
        nameservers: ['Information not available'],
        message: 'Limited information available. For complete details, please use a full WHOIS service.'
      };
    }
  }
  
  formatRdapData(data) {
    // Extract and format the relevant information from RDAP data
    const result = {
      domain: data.ldhName || data.handle || 'Not available',
      registrar: 'Not available',
      createdDate: 'Not available',
      updatedDate: 'Not available',
      expiryDate: 'Not available',
      status: Array.isArray(data.status) ? data.status.join(', ') : 'Not available',
      nameservers: [],
      contacts: {
        registrant: 'Not available',
        admin: 'Not available',
        tech: 'Not available'
      }
    };
    
    // Extract events
    if (data.events) {
      for (const event of data.events) {
        if (event.eventAction === 'registration') {
          result.createdDate = this.formatDate(event.eventDate);
        } else if (event.eventAction === 'last changed') {
          result.updatedDate = this.formatDate(event.eventDate);
        } else if (event.eventAction === 'expiration') {
          result.expiryDate = this.formatDate(event.eventDate);
        }
      }
    }
    
    // Extract nameservers
    if (data.nameservers) {
      result.nameservers = data.nameservers.map(ns => ns.ldhName || 'Not available');
    }
    
    // Extract registrar
    if (data.entities) {
      for (const entity of data.entities) {
        if (entity.roles && entity.roles.includes('registrar')) {
          result.registrar = entity.vcardArray?.[1]?.[1]?.[3] || entity.handle || 'Not available';
        }
        
        // Extract contacts
        if (entity.roles && entity.roles.includes('registrant')) {
          const contactInfo = this.extractContactInfo(entity);
          result.contacts.registrant = contactInfo;
        } else if (entity.roles && entity.roles.includes('administrative')) {
          const contactInfo = this.extractContactInfo(entity);
          result.contacts.admin = contactInfo;
        } else if (entity.roles && entity.roles.includes('technical')) {
          const contactInfo = this.extractContactInfo(entity);
          result.contacts.tech = contactInfo;
        }
      }
    }
    
    return result;
  }
  
  extractContactInfo(entity) {
    if (!entity.vcardArray || !entity.vcardArray[1]) {
      return 'Not available';
    }
    
    const vcard = entity.vcardArray[1];
    let name = 'Not available';
    let org = '';
    let email = '';
    
    for (const item of vcard) {
      if (item[0] === 'fn') {
        name = item[3] || 'Not available';
      } else if (item[0] === 'org') {
        org = item[3] || '';
      } else if (item[0] === 'email') {
        email = item[3] || '';
      }
    }
    
    return name + (org ? ` (${org})` : '') + (email ? ` - ${email}` : '');
  }
  
  async checkDomainAvailability(baseDomain) {
    // Extract the domain name without the TLD
    const domainParts = baseDomain.split('.');
    const domainName = domainParts.slice(0, -1).join('.');
    
    // List of popular TLDs to check
    const tlds = [
      'com', 'net', 'org', 'io', 'co', 'app', 
      'dev', 'me', 'info', 'biz', 'online', 'site'
    ];
    
    this.state.availabilityResults = [];
    
    // We can't reliably check domain availability without an API key,
    // but we can simulate it with randomization for demonstration purposes
    for (const tld of tlds) {
      const domain = `${domainName}.${tld}`;
      
      // If this is the original domain, mark as registered
      if (domain === baseDomain) {
        this.state.availabilityResults.push({
          domain,
          available: false,
          price: 'N/A',
          status: 'Registered'
        });
        continue;
      }
      
      // For demo purposes, randomly determine if domains are available
      // In a real implementation, you would use a domain availability API
      const random = Math.random();
      const available = random > 0.7; // 30% chance of being available
      
      const price = available ? `$${(Math.floor(Math.random() * 30) + 10).toFixed(2)}/year` : 'N/A';
      const status = available ? 'Available' : 'Registered';
      
      this.state.availabilityResults.push({
        domain,
        available,
        price,
        status
      });
    }
  }
  
  async fetchDNSInfo(domain) {
    try {
      // Simulate DNS lookup since we can't do actual DNS lookups without a server or API
      // In a real implementation, you would use a DNS API
      
      // For demonstration purposes, we'll create plausible DNS records
      const ipv4 = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      
      this.state.dnsResults = {
        a: [ipv4],
        aaaa: [`2001:0db8:85a3:0000:0000:8a2e:0370:${Math.floor(Math.random() * 9999).toString(16)}`],
        mx: [
          { priority: 10, host: `aspmx.l.google.com` },
          { priority: 20, host: `alt1.aspmx.l.google.com` }
        ],
        txt: [
          `v=spf1 include:_spf.google.com ~all`,
          `google-site-verification=random${Math.floor(Math.random() * 10000)}`
        ],
        ns: [
          `ns1.${domain.split('.')[0]}.com`,
          `ns2.${domain.split('.')[0]}.com`
        ],
        cname: [],
        soa: {
          mname: `ns1.${domain.split('.')[0]}.com`,
          rname: `hostmaster.${domain}`,
          serial: Math.floor(Math.random() * 1000000000),
          refresh: 3600,
          retry: 600,
          expire: 604800,
          ttl: 300
        }
      };
      
      // 40% chance to have a CNAME record if it's a subdomain
      if (domain.split('.').length > 2 && Math.random() > 0.6) {
        this.state.dnsResults.cname.push(`www.${domain.split('.').slice(-2).join('.')}`);
      }
    } catch (error) {
      console.error('DNS lookup error:', error);
      this.state.dnsResults = null;
    }
  }
  
  async checkDomainHealth(domain) {
    try {
      // Simulate domain health check since we can't do actual checks without a server or API
      // In a real implementation, you would use a health check API
      
      const loadTime = Math.random() * 2000 + 200; // 200-2200ms load time
      const statusCode = Math.random() > 0.9 ? 404 : 200; // 10% chance of 404
      const sslValid = Math.random() > 0.15; // 85% chance of valid SSL
      const dnsResolved = Math.random() > 0.05; // 95% chance of DNS resolving
      
      this.state.healthCheck = {
        status: statusCode === 200 && dnsResolved ? 'Online' : 'Offline',
        statusCode,
        loadTime: `${(loadTime / 1000).toFixed(2)}s`,
        ssl: {
          valid: sslValid,
          expiry: sslValid ? this.formatDate(new Date(Date.now() + Math.random() * 31536000000)) : 'N/A',
          issuer: sslValid ? 'Let\'s Encrypt Authority X3' : 'N/A'
        },
        dns: {
          resolved: dnsResolved,
          ip: dnsResolved ? this.state.dnsResults?.a[0] || '192.168.1.1' : 'N/A'
        },
        headers: {
          server: statusCode === 200 ? 'nginx/1.18.0' : 'N/A',
          'content-type': statusCode === 200 ? 'text/html; charset=UTF-8' : 'N/A',
          'cache-control': statusCode === 200 ? 'max-age=600' : 'N/A'
        }
      };
    } catch (error) {
      console.error('Health check error:', error);
      this.state.healthCheck = null;
    }
  }
  
  showError(message) {
    this.state.error = message;
    this.state.results = null;
    this.updateUI();
    
    // Clear error after 5 seconds
    setTimeout(() => {
      this.state.error = null;
      this.updateUI();
    }, 5000);
  }
  
  handleInput(e) {
    // Auto-suggest top-level domains as user types
    const input = e.target;
    const value = input.value.trim().toLowerCase();
    
    // If the input contains a dot, don't suggest
    if (value.includes('.')) {
      return;
    }
    
    // Suggest .com domain if there's content but no dot
    if (value && !value.includes('.') && document.activeElement === input) {
      const suggestion = value + '.com';
      const datalist = this.shadowRoot.querySelector('#domain-suggestions');
      
      // Clear existing suggestions
      datalist.innerHTML = '';
      
      // Add suggestions for popular TLDs
      ['com', 'net', 'org', 'io'].forEach(tld => {
        const option = document.createElement('option');
        option.value = value + '.' + tld;
        datalist.appendChild(option);
      });
    }
  }
  
  changeTab(tabId) {
    this.state.activeTab = tabId;
    
    // Update active tab UI
    const tabs = this.shadowRoot.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabId);
    });
    
    // Show/hide result sections
    const resultSections = this.shadowRoot.querySelectorAll('.result-section');
    resultSections.forEach(section => {
      section.style.display = section.id === `${tabId}-results` || tabId === 'all' ? 'block' : 'none';
    });
    
    // If we already have domain data and switching tabs, perform lookup for that tab
    if (this.state.domain && !this.state.isLoading) {
      // Only fetch data for the selected tab if we don't already have it
      if ((tabId === 'availability' && this.state.availabilityResults.length === 0) ||
          (tabId === 'dns' && !this.state.dnsResults) ||
          (tabId === 'health' && !this.state.healthCheck)) {
        this.performLookup();
      } else {
        this.updateUI();
      }
    }
  }
  
  formatDate(dateStr) {
    if (!dateStr) return 'Not available';
    
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
    } catch {
      return dateStr;
    }
  }
  
  updateUI() {
    // Update loading state
    const loadingIndicator = this.shadowRoot.querySelector('.loading-indicator');
    loadingIndicator.style.display = this.state.isLoading ? 'flex' : 'none';
    
    // Update error message
    const errorMsg = this.shadowRoot.querySelector('.error-message');
    errorMsg.textContent = this.state.error || '';
    errorMsg.style.display = this.state.error ? 'block' : 'none';
    
    // Update results sections based on active tab
    this.updateWhoisResults();
    this.updateAvailabilityResults();
    this.updateDNSResults();
    this.updateHealthResults();
  }
  
  updateWhoisResults() {
    const resultsSection = this.shadowRoot.querySelector('#whois-results');
    
    if (!this.state.results) {
      resultsSection.innerHTML = '';
      return;
    }
    
    const { domain, registrar, createdDate, updatedDate, expiryDate, status, nameservers, contacts, message } = this.state.results;
    
    let html = `
      <div class="result-card">
        <h3>Domain Information: ${domain}</h3>
        
        <div class="info-group">
          <div class="info-item">
            <span class="info-label">Domain:</span>
            <span class="info-value">${domain}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Registrar:</span>
            <span class="info-value">${registrar}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Created:</span>
            <span class="info-value">${createdDate}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Updated:</span>
            <span class="info-value">${updatedDate}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Expires:</span>
            <span class="info-value">${expiryDate}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Status:</span>
            <span class="info-value">${status}</span>
          </div>
        </div>
        
        <div class="collapsible">
          <div class="collapsible-header">
            <h4>Nameservers</h4>
            <span class="toggle-icon">+</span>
          </div>
          <div class="collapsible-content">
            <ul class="nameservers-list">
              ${nameservers.map(ns => `<li>${ns}</li>`).join('')}
            </ul>
          </div>
        </div>
        
        <div class="collapsible">
          <div class="collapsible-header">
            <h4>Contact Information</h4>
            <span class="toggle-icon">+</span>
          </div>
          <div class="collapsible-content">
            <div class="info-group">
              <div class="info-item">
                <span class="info-label">Registrant:</span>
                <span class="info-value">${contacts?.registrant || 'Not available'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Admin:</span>
                <span class="info-value">${contacts?.admin || 'Not available'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Technical:</span>
                <span class="info-value">${contacts?.tech || 'Not available'}</span>
              </div>
            </div>
          </div>
        </div>
        
        ${message ? `<div class="message-note">${message}</div>` : ''}
      </div>
    `;
    
    resultsSection.innerHTML = html;
    
    // Add event listeners for collapsible sections
    const collapsibles = resultsSection.querySelectorAll('.collapsible-header');
    collapsibles.forEach(header => {
      header.addEventListener('click', () => {
        const content = header.nextElementSibling;
        const icon = header.querySelector('.toggle-icon');
        
        content.style.maxHeight = content.style.maxHeight ? null : content.scrollHeight + 'px';
        icon.textContent = content.style.maxHeight ? '-' : '+';
      });
    });
  }
  
  updateAvailabilityResults() {
    const resultsSection = this.shadowRoot.querySelector('#availability-results');
    
    if (!this.state.availabilityResults || this.state.availabilityResults.length === 0) {
      resultsSection.innerHTML = '';
      return;
    }
    
    let html = `
      <div class="result-card">
        <h3>Domain Availability</h3>
        <div class="domain-grid">
          ${this.state.availabilityResults.map(result => `
            <div class="domain-item ${result.available ? 'available' : 'unavailable'}">
              <div class="domain-name">${result.domain}</div>
              <div class="domain-status">${result.status}</div>
              <div class="domain-price">${result.price}</div>
            </div>
          `).join('')}
        </div>
        <div class="message-note">Note: Domain availability information is for demonstration purposes only. For accurate information, please contact a domain registrar.</div>
      </div>
    `;
    
    resultsSection.innerHTML = html;
  }
  
  updateDNSResults() {
    const resultsSection = this.shadowRoot.querySelector('#dns-results');
    
    if (!this.state.dnsResults) {
      resultsSection.innerHTML = '';
      return;
    }
    
    const dns = this.state.dnsResults;
    
    let html = `
      <div class="result-card">
        <h3>DNS Records for ${this.state.domain}</h3>
        
        <div class="collapsible">
          <div class="collapsible-header">
            <h4>A Records (IPv4)</h4>
            <span class="toggle-icon">+</span>
          </div>
          <div class="collapsible-content">
            <ul class="dns-list">
              ${dns.a.map(record => `<li>${record}</li>`).join('')}
            </ul>
          </div>
        </div>
        
        <div class="collapsible">
          <div class="collapsible-header">
            <h4>AAAA Records (IPv6)</h4>
            <span class="toggle-icon">+</span>
          </div>
          <div class="collapsible-content">
            <ul class="dns-list">
              ${dns.aaaa.map(record => `<li>${record}</li>`).join('')}
            </ul>
          </div>
        </div>
        
        <div class="collapsible">
          <div class="collapsible-header">
            <h4>MX Records</h4>
            <span class="toggle-icon">+</span>
          </div>
          <div class="collapsible-content">
            <ul class="dns-list">
              ${dns.mx.map(record => `<li>Priority: ${record.priority}, Host: ${record.host}</li>`).join('')}
            </ul>
          </div>
        </div>
        
        <div class="collapsible">
          <div class="collapsible-header">
            <h4>TXT Records</h4>
            <span class="toggle-icon">+</span>
          </div>
          <div class="collapsible-content">
            <ul class="dns-list">
              ${dns.txt.map(record => `<li>${record}</li>`).join('')}
            </ul>
          </div>
        </div>
        
        <div class="collapsible">
          <div class="collapsible-header">
            <h4>NS Records</h4>
            <span class="toggle-icon">+</span>
          </div>
          <div class="collapsible-content">
            <ul class="dns-list">
              ${dns.ns.map(record => `<li>${record}</li>`).join('')}
            </ul>
          </div>
        </div>
        
        ${dns.cname.length > 0 ? `
          <div class="collapsible">
            <div class="collapsible-header">
              <h4>CNAME Records</h4>
              <span class="toggle-icon">+</span>
            </div>
            <div class="collapsible-content">
              <ul class="dns-list">
                ${dns.cname.map(record => `<li>${record}</li>`).join('')}
              </ul>
            </div>
          </div>
        ` : ''}
        
        <div class="collapsible">
          <div class="collapsible-header">
            <h4>SOA Record</h4>
            <span class="toggle-icon">+</span>
          </div>
          <div class="collapsible-content">
            <div class="info-group">
              <div class="info-item">
                <span class="info-label">Primary NS:</span>
                <span class="info-value">${dns.soa.mname}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Responsible:</span>
                <span class="info-value">${dns.soa.rname}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Serial:</span>
                <span class="info-value">${dns.soa.serial}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Refresh:</span>
                <span class="info-value">${dns.soa.refresh}s</span>
              </div>
              <div class="info-item">
                <span class="info-label">Retry:</span>
                <span class="info-value">${dns.soa.retry}s</span>
              </div>
              <div class="info-item">
                <span class="info-label">Expire:</span>
                <span class="info-value">${dns.soa.expire}s</span>
              </div>
              <div class="info-item">
                <span class="info-label">TTL:</span>
                <span class="info-value">${dns.soa.ttl}s</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="message-note">Note: DNS information is simulated for demonstration purposes. For accurate DNS records, please use a DNS lookup service.</div>
      </div>
    `;
    
    resultsSection.innerHTML = html;
    
    // Add event listeners for collapsible sections
    const collapsibles = resultsSection.querySelectorAll('.collapsible-header');
    collapsibles.forEach(header => {
      header.addEventListener('click', () => {
        const content = header.nextElementSibling;
        const icon = header.querySelector('.toggle-icon');
        
        content.style.maxHeight = content.style.maxHeight ? null : content.scrollHeight + 'px';
        icon.textContent = content.style.maxHeight ? '-' : '+';
      });
    });
  }
  
  updateHealthResults() {
    const resultsSection = this.shadowRoot.querySelector('#health-results');
    
    if (!this.state.healthCheck) {
      resultsSection.innerHTML = '';
      return;
    }
    
    const health = this.state.healthCheck;
    
    let html = `
      <div class="result-card">
        <h3>Domain Health Check: ${this.state.domain}</h3>
        
        <div class="status-indicator ${health.status.toLowerCase()}">
          <div class="indicator-icon ${health.status.toLowerCase()}"></div>
          <div class="indicator-text">${health.status}</div>
        </div>
        
        <div class="info-group">
          <div class="info-item">
            <span class="info-label">HTTP Status:</span>
            <span class="info-value">${health.statusCode}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Load Time:</span>
            <span class="info-value">${health.loadTime}</span>
          </div>
          <div class="info-item">
            <span class="info-label">DNS Resolved:</span>
            <span class="info-value">${health.dns.resolved ? 'Yes' : 'No'}</span>
          </div>
          ${health.dns.resolved ? `
            <div class="info-item">
              <span class="info-label">IP Address:</span>
              <span class="info-value">${health.dns.ip}</span>
            </div>
          ` : ''}
        </div>
        
        <div class="collapsible">
          <div class="collapsible-header">
            <h4>SSL Certificate</h4>
            <span class="toggle-icon">+</span>
          </div>
          <div class="collapsible-content">
            <div class="info-group">
              <div class="info-item">
                <span class="info-label">Valid:</span>
                <span class="info-value">${health.ssl.valid ? 'Yes' : 'No'}</span>
              </div>
              ${health.ssl.valid ? `
                <div class="info-item">
                  <span class="info-label">Expires:</span>
                  <span class="info-value">${health.ssl.expiry}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Issuer:</span>
                  <span class="info-value">${health.ssl.issuer}</span>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
        
        <div class="collapsible">
          <div class="collapsible-header">
            <h4>HTTP Headers</h4>
            <span class="toggle-icon">+</span>
          </div>
          <div class="collapsible-content">
            <div class="info-group">
              ${Object.entries(health.headers).map(([key, value]) => `
                <div class="info-item">
                  <span class="info-label">${key}:</span>
                  <span class="info-value">${value}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        
        <div class="message-note">Note: Health check information is simulated for demonstration purposes.</div>
      </div>
    `;
    
    resultsSection.innerHTML = html;
    
    // Add event listeners for collapsible sections
    const collapsibles = resultsSection.querySelectorAll('.collapsible-header');
    collapsibles.forEach(header => {
      header.addEventListener('click', () => {
        const content = header.nextElementSibling;
        const icon = header.querySelector('.toggle-icon');
        
        content.style.maxHeight = content.style.maxHeight ? null : content.scrollHeight + 'px';
        icon.textContent = content.style.maxHeight ? '-' : '+';
      });
    });
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
        --error-color: #e74c3c;
        --success-color: #2ecc71;
        --warning-color: #f39c12;
        max-width: 100%;
      }
      
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      .whois-container {
        font-family: var(--font-family);
        color: var(--paragraph-color);
        background-color: var(--primary-bg);
        padding: 20px;
        border-radius: var(--border-radius);
        max-width: 100%;
        overflow-x: hidden;
        position: relative;
        border: 1px solid var(--border-color);
      }
      
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
      }
      
      .tool-title {
        font-size: var(--heading-size);
        font-weight: 700;
        color: var(--heading-color);
        font-family: var(--font-family);
        margin: 0;
      }
      
      .search-form {
        display: flex;
        margin-bottom: 20px;
      }
      
      .input-group {
        position: relative;
        flex: 1;
      }
      
      #domain-input {
        width: 100%;
        padding: var(--button-padding) 15px;
        font-size: var(--font-size);
        border: 2px solid var(--border-color);
        border-radius: var(--border-radius) 0 0 var(--border-radius);
        outline: none;
        transition: all 0.3s ease;
        background-color: var(--primary-bg);
        color: var(--paragraph-color);
        font-family: var(--font-family);
      }
      
      #domain-input:focus {
        border-color: var(--main-accent);
      }
      
      #search-button {
        padding: var(--button-padding) 24px;
        background-color: var(--main-accent);
        color: var(--primary-bg);
        border: none;
        border-radius: 0 var(--border-radius) var(--border-radius) 0;
        cursor: pointer;
        font-size: var(--font-size);
        font-weight: 600;
        transition: all 0.3s ease;
        font-family: var(--font-family);
      }
      
      #search-button:hover {
        background-color: var(--hover-accent);
      }
      
      .tabs {
        display: flex;
        border-bottom: 2px solid var(--border-color);
        margin-bottom: 20px;
        overflow-x: auto;
        scrollbar-width: thin;
      }
      
      .tab {
        padding: var(--button-padding) 20px;
        cursor: pointer;
        border-bottom: 3px solid transparent;
        transition: all 0.3s ease;
        white-space: nowrap;
        color: var(--secondary-text);
        font-size: var(--font-size);
        font-family: var(--font-family);
        background: none;
        border-top: none;
        border-left: none;
        border-right: none;
      }
      
      .tab:hover {
        color: var(--main-accent);
      }
      
      .tab.active {
        border-bottom-color: var(--main-accent);
        color: var(--main-accent);
        font-weight: 600;
      }
      
      .loading-indicator {
        display: none;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      
      .spinner {
        border: 4px solid var(--border-color);
        border-radius: 50%;
        border-top: 4px solid var(--main-accent);
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin-bottom: 15px;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .error-message {
        display: none;
        color: var(--error-color);
        background-color: rgba(231, 76, 60, 0.1);
        padding: 15px;
        border-radius: var(--border-radius);
        margin-bottom: 20px;
        font-weight: 600;
        font-size: var(--font-size);
        font-family: var(--font-family);
      }
      
      .result-section {
        margin-bottom: 30px;
        display: none;
      }
      
      .result-card {
        background-color: var(--secondary-bg);
        border-radius: var(--border-radius);
        padding: 20px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        margin-bottom: 20px;
        border: 1px solid var(--border-color);
      }
      
      .result-card h3 {
        margin-bottom: 20px;
        color: var(--heading-color);
        font-size: calc(var(--font-size) + 4px);
        font-family: var(--font-family);
      }
      
      .info-group {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 15px;
        margin-bottom: 20px;
      }
      
      .info-item {
        display: flex;
        flex-direction: column;
      }
      
      .info-label {
        font-size: calc(var(--font-size) - 2px);
        color: var(--secondary-text);
        margin-bottom: 5px;
        font-family: var(--font-family);
      }
      
      .info-value {
        font-size: var(--font-size);
        word-break: break-word;
        font-family: var(--font-family);
        color: var(--paragraph-color);
      }
      
      .collapsible {
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        margin-bottom: 15px;
        overflow: hidden;
      }
      
      .collapsible-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px;
        cursor: pointer;
        background-color: var(--primary-bg);
      }
      
      .collapsible-header h4 {
        margin: 0;
        font-size: var(--font-size);
        font-family: var(--font-family);
        color: var(--heading-color);
      }
      
      .toggle-icon {
        font-size: 18px;
        font-weight: bold;
        color: var(--main-accent);
      }
      
      .collapsible-content {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease;
        padding: 0 15px;
      }
      
      .nameservers-list, .dns-list {
        list-style: none;
        padding: 10px 0;
      }
      
      .nameservers-list li, .dns-list li {
        padding: 8px 0;
        border-bottom: 1px solid var(--border-color);
        font-size: var(--font-size);
        font-family: var(--font-family);
        color: var(--paragraph-color);
      }
      
      .nameservers-list li:last-child, .dns-list li:last-child {
        border-bottom: none;
      }
      
      .domain-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 15px;
        margin-bottom: 20px;
      }
      
      .domain-item {
        display: flex;
        flex-direction: column;
        padding: 15px;
        border-radius: var(--border-radius);
        border: 1px solid var(--border-color);
      }
      
      .domain-item.available {
        border-color: var(--success-color);
        background-color: rgba(46, 204, 113, 0.1);
      }
      
      .domain-item.unavailable {
        border-color: var(--warning-color);
        background-color: rgba(243, 156, 18, 0.1);
      }
      
      .domain-name {
        font-weight: 600;
        margin-bottom: 5px;
        font-size: var(--font-size);
        font-family: var(--font-family);
        color: var(--heading-color);
      }
      
      .domain-status {
        font-size: calc(var(--font-size) - 2px);
        margin-bottom: 5px;
        font-family: var(--font-family);
        color: var(--paragraph-color);
      }
      
      .domain-price {
        font-size: calc(var(--font-size) - 2px);
        color: var(--secondary-text);
        font-family: var(--font-family);
      }
      
      .message-note {
        font-size: calc(var(--font-size) - 2px);
        color: var(--secondary-text);
        font-style: italic;
        margin-top: 15px;
        font-family: var(--font-family);
      }
      
      .status-indicator {
        display: flex;
        align-items: center;
        padding: 15px;
        border-radius: var(--border-radius);
        margin-bottom: 20px;
      }
      
      .status-indicator.online {
        background-color: rgba(46, 204, 113, 0.1);
      }
      
      .status-indicator.offline {
        background-color: rgba(231, 76, 60, 0.1);
      }
      
      .indicator-icon {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        margin-right: 10px;
      }
      
      .indicator-icon.online {
        background-color: var(--success-color);
        box-shadow: 0 0 10px var(--success-color);
      }
      
      .indicator-icon.offline {
        background-color: var(--error-color);
        box-shadow: 0 0 10px var(--error-color);
      }
      
      .indicator-text {
        font-weight: 600;
        font-size: var(--font-size);
        font-family: var(--font-family);
        color: var(--heading-color);
      }
      
      /* Responsive styles */
      @media (max-width: 768px) {
        .search-form {
          flex-direction: column;
        }
        
        #domain-input {
          border-radius: var(--border-radius) var(--border-radius) 0 0;
        }
        
        #search-button {
          border-radius: 0 0 var(--border-radius) var(--border-radius);
        }
        
        .info-group {
          grid-template-columns: 1fr;
        }
        
        .domain-grid {
          grid-template-columns: 1fr;
        }

        .tabs {
          flex-direction: column;
          border-bottom: none;
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
      
      <div class="whois-container">
        <div class="header">
          <h1 class="tool-title">WHOIS Lookup Tool</h1>
        </div>
        
        <form id="domain-form" class="search-form">
          <div class="input-group">
            <input type="text" id="domain-input" placeholder="Enter domain name (e.g., example.com)" list="domain-suggestions">
            <datalist id="domain-suggestions"></datalist>
          </div>
          <button type="submit" id="search-button">Lookup</button>
        </form>
        
        <div class="tabs">
          <div class="tab active" data-tab="whois">WHOIS Info</div>
          <div class="tab" data-tab="availability">Availability</div>
          <div class="tab" data-tab="dns">DNS Records</div>
          <div class="tab" data-tab="health">Health Check</div>
          <div class="tab" data-tab="all">All Results</div>
        </div>
        
        <div class="loading-indicator">
          <div class="spinner"></div>
          <div>Loading domain information...</div>
        </div>
        
        <div class="error-message"></div>
        
        <div id="whois-results" class="result-section" style="display:block;"></div>
        <div id="availability-results" class="result-section"></div>
        <div id="dns-results" class="result-section"></div>
        <div id="health-results" class="result-section"></div>
      </div>
    `;
  }
}

// Define the custom element
customElements.define('whois-lookup-tool', WhoisLookupTool);
