/**
 * Finance Calculators - Advanced Wix Custom Element with Customization
 * Filename: finance-calculators.js
 * Custom Element Tag: finance-calculators
 */

class FinanceCalculators extends HTMLElement {
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
    
    this.currentTab = 'loan';
    this.selectedCurrency = 'USD'; // Default currency

    // Initial values
    this.loanAmount = 100000;
    this.loanInterest = 5;
    this.loanTerm = 5;
    this.emiAmount = 100000;
    this.emiInterest = 5;
    this.emiTerm = 5;
    this.compoundingPeriod = 12;
    this.investmentAmount = 10000;
    this.annualRate = 8;
    this.investmentTerm = 5;
    this.additionalContribution = 0;
    this.contributionFrequency = 12;

    // Charts
    this.loanChart = null;
    this.roiChart = null;

    this.render();
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
    this.setupEventListeners();
    this.calculateLoan();

    // Load Chart.js from CDN
    const chartScript = document.createElement('script');
    chartScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js';
    chartScript.onload = () => {
      this.initializeCharts();
    };
    document.head.appendChild(chartScript);
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
        --success-color: #4CAF50;
        --warning-color: #FF9800;
        --danger-color: #FF5722;
        --shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        --transition: all 0.3s ease;
        --spacing: 16px;

        font-family: var(--font-family);
        color: var(--paragraph-color);
        display: block;
        max-width: 960px;
        margin: 0 auto;
        box-sizing: border-box;
      }

      *, *:before, *:after {
        box-sizing: inherit;
      }

      .calculator-container {
        background-color: var(--primary-bg);
        box-shadow: var(--shadow);
        border-radius: var(--border-radius);
        overflow: hidden;
        border: 1px solid var(--border-color);
      }

      .calculator-header {
        background-color: var(--main-accent);
        color: var(--primary-bg);
        padding: var(--spacing);
        text-align: center;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .calculator-header h2 {
        margin: 0;
        font-size: var(--heading-size);
        font-weight: 500;
        font-family: var(--font-family);
      }

      .currency-selector {
        padding: var(--button-padding);
        border-radius: 4px;
        border: 1px solid var(--primary-bg);
        background-color: var(--secondary-bg);
        color: var(--paragraph-color);
        font-size: var(--font-size);
        font-family: var(--font-family);
      }

      .calculator-tabs {
        display: flex;
        background-color: var(--secondary-bg);
      }

      .tab-btn {
        flex: 1;
        padding: var(--button-padding);
        text-align: center;
        background-color: transparent;
        border: none;
        color: var(--paragraph-color);
        font-size: var(--font-size);
        font-weight: 500;
        cursor: pointer;
        transition: var(--transition);
        border-bottom: 3px solid transparent;
        font-family: var(--font-family);
      }

      .tab-btn:hover {
        background-color: rgba(0, 0, 0, 0.05);
      }

      .tab-btn.active {
        background-color: var(--primary-bg);
        border-bottom-color: var(--main-accent);
        color: var(--main-accent);
      }

      .tab-content {
        padding: var(--spacing);
        display: none;
      }

      .tab-content.active {
        display: block;
      }

      .input-group {
        margin-bottom: 20px;
      }

      .input-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        font-size: var(--font-size);
        font-family: var(--font-family);
        color: var(--heading-color);
      }

      .slider-container {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
      }

      .slider-container span {
        font-size: calc(var(--font-size) - 2px);
        font-family: var(--font-family);
        color: var(--secondary-text);
      }

      .slider {
        flex: 1;
        -webkit-appearance: none;
        height: 8px;
        border-radius: 4px;
        background: var(--secondary-bg);
        outline: none;
        margin: 0 12px;
      }

      .slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--main-accent);
        cursor: pointer;
        transition: var(--transition);
      }

      .slider::-webkit-slider-thumb:hover {
        transform: scale(1.1);
        background: var(--hover-accent);
      }

      .slider::-moz-range-thumb {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--main-accent);
        cursor: pointer;
        transition: var(--transition);
        border: none;
      }

      .slider::-moz-range-thumb:hover {
        transform: scale(1.1);
        background: var(--hover-accent);
      }

      .slider-value {
        width: 120px;
        text-align: right;
        font-weight: 500;
        color: var(--main-accent);
        font-size: var(--font-size);
        font-family: var(--font-family);
      }

      .select-container {
        position: relative;
      }

      select {
        width: 100%;
        padding: var(--button-padding) 12px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        background-color: var(--primary-bg);
        font-size: var(--font-size);
        appearance: none;
        -webkit-appearance: none;
        -moz-appearance: none;
        cursor: pointer;
        font-family: var(--font-family);
        color: var(--paragraph-color);
      }

      .select-container::after {
        content: "▼";
        font-size: 12px;
        top: 50%;
        right: 15px;
        transform: translateY(-50%);
        position: absolute;
        pointer-events: none;
        color: var(--secondary-text);
      }

      .results-section {
        background-color: var(--secondary-bg);
        padding: 20px;
        border-radius: var(--border-radius);
        margin-top: 20px;
        border: 1px solid var(--border-color);
      }

      .results-section h3 {
        margin-top: 0;
        color: var(--heading-color);
        font-size: calc(var(--font-size) + 4px);
        font-family: var(--font-family);
      }

      .results-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-bottom: 20px;
      }

      .result-item {
        text-align: center;
      }

      .result-label {
        font-size: var(--font-size);
        color: var(--secondary-text);
        margin-bottom: 5px;
        font-family: var(--font-family);
      }

      .result-value {
        font-size: calc(var(--heading-size) + 4px);
        font-weight: 500;
        color: var(--main-accent);
        font-family: var(--font-family);
      }

      .chart-container {
        height: 300px;
        margin-top: 30px;
      }

      .table-container {
        margin-top: 30px;
        overflow-x: auto;
      }

      .table-container h3 {
        color: var(--heading-color);
        font-size: calc(var(--font-size) + 4px);
        font-family: var(--font-family);
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th, td {
        padding: 12px 15px;
        text-align: left;
        border-bottom: 1px solid var(--border-color);
        font-size: var(--font-size);
        font-family: var(--font-family);
        color: var(--paragraph-color);
      }

      th {
        background-color: var(--secondary-bg);
        font-weight: 500;
        color: var(--heading-color);
      }

      tr:hover {
        background-color: var(--secondary-bg);
      }

      .text-center {
        text-align: center;
      }

      .button-group {
        margin-top: 20px;
        display: flex;
        justify-content: flex-end;
      }

      .btn {
        padding: var(--button-padding) 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: var(--font-size);
        font-weight: 500;
        transition: var(--transition);
        font-family: var(--font-family);
      }

      .btn-primary {
        background-color: var(--main-accent);
        color: var(--primary-bg);
      }

      .btn-primary:hover {
        background-color: var(--hover-accent);
      }

      .btn-outline {
        background-color: transparent;
        color: var(--main-accent);
        border: 1px solid var(--main-accent);
        margin-right: 10px;
      }

      .btn-outline:hover {
        background-color: var(--secondary-bg);
      }

      @media (max-width: 768px) {
        .results-grid {
          grid-template-columns: 1fr;
        }

        .chart-container {
          height: 250px;
        }

        .calculator-header {
          flex-direction: column;
          align-items: flex-start;
        }

        .currency-selector {
          margin-top: 10px;
        }

        .calculator-tabs {
          flex-direction: column;
        }
      }
    `;
  }

  setupEventListeners() {
    // Currency selector
    this.shadowRoot.querySelector('#currency-selector').addEventListener('change', (e) => {
      this.selectedCurrency = e.target.value;
      this.updateAllDisplays();
    });

    // Tab navigation
    this.shadowRoot.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Loan calculator inputs
    this.shadowRoot.querySelector('#loan-amount').addEventListener('input', (e) => {
      this.loanAmount = parseFloat(e.target.value);
      this.shadowRoot.querySelector('#loan-amount-value').textContent = this.formatCurrency(this.loanAmount);
      this.calculateLoan();
    });

    this.shadowRoot.querySelector('#loan-interest').addEventListener('input', (e) => {
      this.loanInterest = parseFloat(e.target.value);
      this.shadowRoot.querySelector('#loan-interest-value').textContent = this.loanInterest + '%';
      this.calculateLoan();
    });

    this.shadowRoot.querySelector('#loan-term').addEventListener('input', (e) => {
      this.loanTerm = parseFloat(e.target.value);
      this.shadowRoot.querySelector('#loan-term-value').textContent = this.loanTerm + ' years';
      this.calculateLoan();
    });

    // EMI calculator inputs
    this.shadowRoot.querySelector('#emi-amount').addEventListener('input', (e) => {
      this.emiAmount = parseFloat(e.target.value);
      this.shadowRoot.querySelector('#emi-amount-value').textContent = this.formatCurrency(this.emiAmount);
      this.calculateEMI();
    });

    this.shadowRoot.querySelector('#emi-interest').addEventListener('input', (e) => {
      this.emiInterest = parseFloat(e.target.value);
      this.shadowRoot.querySelector('#emi-interest-value').textContent = this.emiInterest + '%';
      this.calculateEMI();
    });

    this.shadowRoot.querySelector('#emi-term').addEventListener('input', (e) => {
      this.emiTerm = parseFloat(e.target.value);
      this.shadowRoot.querySelector('#emi-term-value').textContent = this.emiTerm + ' years';
      this.calculateEMI();
    });

    this.shadowRoot.querySelector('#compounding-period').addEventListener('change', (e) => {
      this.compoundingPeriod = parseInt(e.target.value);
      this.calculateEMI();
    });

    // ROI calculator inputs
    this.shadowRoot.querySelector('#investment-amount').addEventListener('input', (e) => {
      this.investmentAmount = parseFloat(e.target.value);
      this.shadowRoot.querySelector('#investment-amount-value').textContent = this.formatCurrency(this.investmentAmount);
      this.calculateROI();
    });

    this.shadowRoot.querySelector('#annual-rate').addEventListener('input', (e) => {
      this.annualRate = parseFloat(e.target.value);
      this.shadowRoot.querySelector('#annual-rate-value').textContent = this.annualRate + '%';
      this.calculateROI();
    });

    this.shadowRoot.querySelector('#investment-term').addEventListener('input', (e) => {
      this.investmentTerm = parseFloat(e.target.value);
      this.shadowRoot.querySelector('#investment-term-value').textContent = this.investmentTerm + ' years';
      this.calculateROI();
    });

    this.shadowRoot.querySelector('#additional-contribution').addEventListener('input', (e) => {
      this.additionalContribution = parseFloat(e.target.value);
      this.shadowRoot.querySelector('#additional-contribution-value').textContent = this.formatCurrency(this.additionalContribution);
      this.calculateROI();
    });

    this.shadowRoot.querySelector('#contribution-frequency').addEventListener('change', (e) => {
      this.contributionFrequency = parseInt(e.target.value);
      this.calculateROI();
    });

    // Print button
    this.shadowRoot.querySelector('#print-btn').addEventListener('click', () => {
      this.printResults();
    });
  }

  switchTab(tab) {
    this.currentTab = tab;

    // Update active tab button
    this.shadowRoot.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Show active tab content
    this.shadowRoot.querySelectorAll('.tab-content').forEach(content => {
      content.style.display = content.id === `${tab}-calculator` ? 'block' : 'none';
    });

    // Calculate results for the active tab
    if (tab === 'loan') {
      this.calculateLoan();
    } else if (tab === 'emi') {
      this.calculateEMI();
    } else if (tab === 'roi') {
      this.calculateROI();
    }

    // Re-initialize charts if needed
    if (tab === 'loan' || tab === 'roi') {
      setTimeout(() => {
        this.initializeCharts();
      }, 100);
    }
  }

  updateAllDisplays() {
    // Update all monetary displays
    this.shadowRoot.querySelector('#loan-amount-value').textContent = this.formatCurrency(this.loanAmount);
    this.shadowRoot.querySelector('#emi-amount-value').textContent = this.formatCurrency(this.emiAmount);
    this.shadowRoot.querySelector('#investment-amount-value').textContent = this.formatCurrency(this.investmentAmount);
    this.shadowRoot.querySelector('#additional-contribution-value').textContent = this.formatCurrency(this.additionalContribution);

    // Update slider min/max labels
    this.shadowRoot.querySelector('#loan-calculator .slider-container:nth-child(1) span:first-child').textContent = this.formatCurrency(10000, false);
    this.shadowRoot.querySelector('#loan-calculator .slider-container:nth-child(1) span:last-child').textContent = this.formatCurrency(1000000, false);
    this.shadowRoot.querySelector('#emi-calculator .slider-container:nth-child(1) span:first-child').textContent = this.formatCurrency(10000, false);
    this.shadowRoot.querySelector('#emi-calculator .slider-container:nth-child(1) span:last-child').textContent = this.formatCurrency(1000000, false);
    this.shadowRoot.querySelector('#roi-calculator .slider-container:nth-child(1) span:first-child').textContent = this.formatCurrency(1000, false);
    this.shadowRoot.querySelector('#roi-calculator .slider-container:nth-child(1) span:last-child').textContent = this.formatCurrency(100000, false);
    this.shadowRoot.querySelector('#roi-calculator .slider-container:nth-child(4) span:first-child').textContent = this.formatCurrency(0, false);
    this.shadowRoot.querySelector('#roi-calculator .slider-container:nth-child(4) span:last-child').textContent = this.formatCurrency(5000, false);

    // Recalculate to update results and tables
    if (this.currentTab === 'loan') {
      this.calculateLoan();
    } else if (this.currentTab === 'emi') {
      this.calculateEMI();
    } else if (this.currentTab === 'roi') {
      this.calculateROI();
    }
  }

  calculateLoan() {
    const principal = this.loanAmount;
    const annualRate = this.loanInterest / 100;
    const monthlyRate = annualRate / 12;
    const termMonths = this.loanTerm * 12;

    const monthlyPayment = principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths) / (Math.pow(1 + monthlyRate, termMonths) - 1);
    const totalPayment = monthlyPayment * termMonths;
    const totalInterest = totalPayment - principal;

    // Display results
    this.shadowRoot.querySelector('#loan-monthly-payment').textContent = this.formatCurrency(monthlyPayment);
    this.shadowRoot.querySelector('#loan-total-payment').textContent = this.formatCurrency(totalPayment);
    this.shadowRoot.querySelector('#loan-total-interest').textContent = this.formatCurrency(totalInterest);

    // Generate amortization schedule
    const amortizationTable = this.shadowRoot.querySelector('#amortization-table tbody');
    amortizationTable.innerHTML = '';

    let remainingBalance = principal;

    for (let i = 1; i <= termMonths; i++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      remainingBalance -= principalPayment;

      if (i <= 12 || i === termMonths) {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${i}</td>
          <td>${this.formatCurrency(monthlyPayment)}</td>
          <td>${this.formatCurrency(principalPayment)}</td>
          <td>${this.formatCurrency(interestPayment)}</td>
          <td>${this.formatCurrency(Math.max(0, remainingBalance))}</td>
        `;
        amortizationTable.appendChild(row);
      } else if (i === 13) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="5" class="text-center">...</td>`;
        amortizationTable.appendChild(row);
      }
    }

    // Update chart data
    if (this.loanChart) {
      this.loanChart.data.datasets[0].data = [principal, totalInterest];
      this.loanChart.update();
    }
  }

  calculateEMI() {
    const principal = this.emiAmount;
    const annualRate = this.emiInterest / 100;
    const ratePerPeriod = annualRate / this.compoundingPeriod;
    const totalPeriods = this.emiTerm * this.compoundingPeriod;

    const emi = principal * ratePerPeriod * Math.pow(1 + ratePerPeriod, totalPeriods) / (Math.pow(1 + ratePerPeriod, totalPeriods) - 1);
    const totalPayment = emi * totalPeriods;
    const totalInterest = totalPayment - principal;

    // Display results
    this.shadowRoot.querySelector('#emi-payment').textContent = this.formatCurrency(emi);
    this.shadowRoot.querySelector('#emi-total-payment').textContent = this.formatCurrency(totalPayment);
    this.shadowRoot.querySelector('#emi-total-interest').textContent = this.formatCurrency(totalInterest);

    // Generate payment schedule
    const paymentTable = this.shadowRoot.querySelector('#payment-schedule tbody');
    paymentTable.innerHTML = '';

    let remainingBalance = principal;
    let periods = this.compoundingPeriod === 12 ? 'Monthly' :
                  this.compoundingPeriod === 4 ? 'Quarterly' :
                  this.compoundingPeriod === 2 ? 'Semi-Annually' : 'Annually';

    for (let i = 1; i <= totalPeriods; i++) {
      const interestPayment = remainingBalance * ratePerPeriod;
      const principalPayment = emi - interestPayment;
      remainingBalance -= principalPayment;

      if (i <= 6 || i === totalPeriods) {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${i}</td>
          <td>${this.formatCurrency(emi)}</td>
          <td>${this.formatCurrency(principalPayment)}</td>
          <td>${this.formatCurrency(interestPayment)}</td>
          <td>${this.formatCurrency(Math.max(0, remainingBalance))}</td>
        `;
        paymentTable.appendChild(row);
      } else if (i === 7) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="5" class="text-center">...</td>`;
        paymentTable.appendChild(row);
      }
    }
  }

  calculateROI() {
    const principal = this.investmentAmount;
    const rate = this.annualRate / 100;
    const years = this.investmentTerm;
    const additionalContribution = this.additionalContribution;
    const contributionsPerYear = this.contributionFrequency;

    let futureValue = principal;
    let totalContributions = 0;
    const yearlyData = [];

    if (additionalContribution > 0) {
      const ratePerPeriod = rate / contributionsPerYear;
      const totalPeriods = years * contributionsPerYear;

      for (let i = 1; i <= totalPeriods; i++) {
        futureValue = futureValue * (1 + ratePerPeriod) + additionalContribution;
        totalContributions += additionalContribution;

        if (i % contributionsPerYear === 0) {
          const yearNum = i / contributionsPerYear;
          yearlyData.push({
            year: yearNum,
            balance: futureValue,
            contributions: principal + totalContributions,
            interest: futureValue - principal - totalContributions
          });
        }
      }
    } else {
      for (let i = 1; i <= years; i++) {
        const yearlyAmount = principal * Math.pow(1 + rate, i);
        yearlyData.push({
          year: i,
          balance: yearlyAmount,
          contributions: principal,
          interest: yearlyAmount - principal
        });
      }
      futureValue = principal * Math.pow(1 + rate, years);
    }

    const totalInterest = futureValue - principal - totalContributions;

    // Display results
    this.shadowRoot.querySelector('#roi-future-value').textContent = this.formatCurrency(futureValue);
    this.shadowRoot.querySelector('#roi-total-contributions').textContent = this.formatCurrency(principal + totalContributions);
    this.shadowRoot.querySelector('#roi-total-interest').textContent = this.formatCurrency(totalInterest);

    // Generate growth table
    const growthTable = this.shadowRoot.querySelector('#growth-table tbody');
    growthTable.innerHTML = '';

    yearlyData.forEach(data => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${data.year}</td>
        <td>${this.formatCurrency(data.balance)}</td>
        <td>${this.formatCurrency(data.contributions)}</td>
        <td>${this.formatCurrency(data.interest)}</td>
        <td>${((data.interest / data.contributions) * 100).toFixed(2)}%</td>
      `;
      growthTable.appendChild(row);
    });

    // Update chart data
    if (this.roiChart) {
      const labels = yearlyData.map(data => `Year ${data.year}`);
      const contributionsData = yearlyData.map(data => data.contributions);
      const interestData = yearlyData.map(data => data.interest);

      this.roiChart.data.labels = labels;
      this.roiChart.data.datasets[0].data = contributionsData;
      this.roiChart.data.datasets[1].data = interestData;
      this.roiChart.update();
    }
  }

  initializeCharts() {
    if (!window.Chart) return;

    // Loan payment breakdown chart
    const loanChartCanvas = this.shadowRoot.querySelector('#loan-chart');
    if (loanChartCanvas && this.currentTab === 'loan') {
      if (this.loanChart) this.loanChart.destroy();

      this.loanChart = new Chart(loanChartCanvas, {
        type: 'doughnut',
        data: {
          labels: ['Principal', 'Interest'],
          datasets: [{
            data: [this.loanAmount, this.loanAmount * (this.loanInterest / 100) * this.loanTerm],
            backgroundColor: ['#4CAF50', '#FF5722'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: this.settings.paragraphColor,
                font: { family: this.settings.fontFamily, size: parseInt(this.settings.fontSize) }
              }
            }
          }
        }
      });
    }

    // ROI growth chart
    const roiChartCanvas = this.shadowRoot.querySelector('#roi-chart');
    if (roiChartCanvas && this.currentTab === 'roi') {
      if (this.roiChart) this.roiChart.destroy();

      const years = this.investmentTerm;
      const labels = [];
      const contributionsData = [];
      const interestData = [];

      const principal = this.investmentAmount;
      const rate = this.annualRate / 100;
      const additionalContribution = this.additionalContribution;
      const contributionsPerYear = this.contributionFrequency;

      let futureValue = principal;
      let totalContributions = 0;

      if (additionalContribution > 0) {
        const ratePerPeriod = rate / contributionsPerYear;
        const totalPeriods = years * contributionsPerYear;

        for (let i = 1; i <= totalPeriods; i++) {
          futureValue = futureValue * (1 + ratePerPeriod) + additionalContribution;
          totalContributions += additionalContribution;

          if (i % contributionsPerYear === 0) {
            const yearNum = i / contributionsPerYear;
            labels.push(`Year ${yearNum}`);
            contributionsData.push(principal + totalContributions);
            interestData.push(futureValue - principal - totalContributions);
          }
        }
      } else {
        for (let i = 1; i <= years; i++) {
          labels.push(`Year ${i}`);
          const yearlyAmount = principal * Math.pow(1 + rate, i);
          contributionsData.push(principal);
          interestData.push(yearlyAmount - principal);
        }
      }

      this.roiChart = new Chart(roiChartCanvas, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Contributions',
              data: contributionsData,
              backgroundColor: '#4CAF50',
              borderWidth: 0
            },
            {
              label: 'Interest',
              data: interestData,
              backgroundColor: '#2196F3',
              borderWidth: 0
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              stacked: true,
              grid: { display: false },
              ticks: {
                color: this.settings.paragraphColor,
                font: { family: this.settings.fontFamily }
              }
            },
            y: {
              stacked: true,
              grid: { color: this.settings.borderColor },
              ticks: {
                color: this.settings.paragraphColor,
                font: { family: this.settings.fontFamily },
                callback: (value) => this.formatCurrency(value, false)
              }
            }
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: this.settings.paragraphColor,
                font: { family: this.settings.fontFamily, size: parseInt(this.settings.fontSize) }
              }
            }
          }
        }
      });
    }
  }

  printResults() {
    const printWindow = window.open('', '_blank');
    let content = '<html><head><title>Financial Calculator Results</title>';
    content += '<style>';
    content += `
      body { font-family: ${this.settings.fontFamily}; padding: 20px; color: ${this.settings.paragraphColor}; }
      h1, h2 { color: ${this.settings.mainAccent}; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      th, td { padding: 8px; text-align: left; border-bottom: 1px solid ${this.settings.borderColor}; }
      th { background-color: ${this.settings.secondaryBg}; }
      .summary { background-color: ${this.settings.secondaryBg}; padding: 15px; border-radius: ${this.settings.borderRadius}px; margin-bottom: 20px; }
      .results { display: flex; flex-wrap: wrap; }
      .result-item { width: 33%; margin-bottom: 15px; }
      .result-value { font-weight: bold; font-size: 18px; color: ${this.settings.mainAccent}; }
    `;
    content += '</style></head><body>';

    if (this.currentTab === 'loan') {
      content += '<h1>Loan Calculator Results</h1>';
      content += '<div class="summary">';
      content += '<div class="results">';
      content += `<div class="result-item"><div>Monthly Payment</div><div class="result-value">${this.shadowRoot.querySelector('#loan-monthly-payment').textContent}</div></div>`;
      content += `<div class="result-item"><div>Total Payment</div><div class="result-value">${this.shadowRoot.querySelector('#loan-total-payment').textContent}</div></div>`;
      content += `<div class="result-item"><div>Total Interest</div><div class="result-value">${this.shadowRoot.querySelector('#loan-total-interest').textContent}</div></div>`;
      content += '</div>';
      content += `<p>Loan Details: ${this.formatCurrency(this.loanAmount)} at ${this.loanInterest}% for ${this.loanTerm} years</p>`;
      content += '</div>';

      content += '<h2>Amortization Schedule</h2>';
      content += '<table>';
      content += '<thead><tr><th>Payment #</th><th>Payment Amount</th><th>Principal</th><th>Interest</th><th>Remaining Balance</th></tr></thead>';
      content += '<tbody>';

      const principal = this.loanAmount;
      const annualRate = this.loanInterest / 100;
      const monthlyRate = annualRate / 12;
      const termMonths = this.loanTerm * 12;
      const monthlyPayment = principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths) / (Math.pow(1 + monthlyRate, termMonths) - 1);

      let remainingBalance = principal;

      for (let i = 1; i <= termMonths; i++) {
        const interestPayment = remainingBalance * monthlyRate;
        const principalPayment = monthlyPayment - interestPayment;
        remainingBalance -= principalPayment;

        content += `<tr>
          <td>${i}</td>
          <td>${this.formatCurrency(monthlyPayment)}</td>
          <td>${this.formatCurrency(principalPayment)}</td>
          <td>${this.formatCurrency(interestPayment)}</td>
          <td>${this.formatCurrency(Math.max(0, remainingBalance))}</td>
        </tr>`;
      }

      content += '</tbody></table>';
    } else if (this.currentTab === 'emi') {
      content += '<h1>EMI Calculator Results</h1>';
      content += '<div class="summary">';
      content += '<div class="results">';
      content += `<div class="result-item"><div>EMI Payment</div><div class="result-value">${this.shadowRoot.querySelector('#emi-payment').textContent}</div></div>`;
      content += `<div class="result-item"><div>Total Payment</div><div class="result-value">${this.shadowRoot.querySelector('#emi-total-payment').textContent}</div></div>`;
      content += `<div class="result-item"><div>Total Interest</div><div class="result-value">${this.shadowRoot.querySelector('#emi-total-interest').textContent}</div></div>`;
      content += '</div>';

      let compoundingText = this.compoundingPeriod === 12 ? 'Monthly' :
                           this.compoundingPeriod === 4 ? 'Quarterly' :
                           this.compoundingPeriod === 2 ? 'Semi-Annually' : 'Annually';

      content += `<p>EMI Details: ${this.formatCurrency(this.emiAmount)} at ${this.emiInterest}% for ${this.emiTerm} years (${compoundingText} compounding)</p>`;
      content += '</div>';

      content += '<h2>Payment Schedule</h2>';
      content += '<table>';
      content += '<thead><tr><th>Payment #</th><th>Payment Amount</th><th>Principal</th><th>Interest</th><th>Remaining Balance</th></tr></thead>';
      content += '<tbody>';

      const principal = this.emiAmount;
      const annualRate = this.emiInterest / 100;
      const ratePerPeriod = annualRate / this.compoundingPeriod;
      const totalPeriods = this.emiTerm * this.compoundingPeriod;
      const emi = principal * ratePerPeriod * Math.pow(1 + ratePerPeriod, totalPeriods) / (Math.pow(1 + ratePerPeriod, totalPeriods) - 1);

      let remainingBalance = principal;

      for (let i = 1; i <= totalPeriods; i++) {
        const interestPayment = remainingBalance * ratePerPeriod;
        const principalPayment = emi - interestPayment;
        remainingBalance -= principalPayment;

        content += `<tr>
          <td>${i}</td>
          <td>${this.formatCurrency(emi)}</td>
          <td>${this.formatCurrency(principalPayment)}</td>
          <td>${this.formatCurrency(interestPayment)}</td>
          <td>${this.formatCurrency(Math.max(0, remainingBalance))}</td>
        </tr>`;
      }

      content += '</tbody></table>';
    } else if (this.currentTab === 'roi') {
      content += '<h1>ROI Calculator Results</h1>';
      content += '<div class="summary">';
      content += '<div class="results">';
      content += `<div class="result-item"><div>Future Value</div><div class="result-value">${this.shadowRoot.querySelector('#roi-future-value').textContent}</div></div>`;
      content += `<div class="result-item"><div>Total Contributions</div><div class="result-value">${this.shadowRoot.querySelector('#roi-total-contributions').textContent}</div></div>`;
      content += `<div class="result-item"><div>Total Interest</div><div class="result-value">${this.shadowRoot.querySelector('#roi-total-interest').textContent}</div></div>`;
      content += '</div>';

      let frequencyText = this.contributionFrequency === 12 ? 'Monthly' :
                          this.contributionFrequency === 4 ? 'Quarterly' :
                          this.contributionFrequency === 2 ? 'Semi-Annually' : 'Annually';

      content += `<p>Investment Details: ${this.formatCurrency(this.investmentAmount)} initial investment at ${this.annualRate}% for ${this.investmentTerm} years</p>`;
      if (this.additionalContribution > 0) {
        content += `<p>Additional Contributions: ${this.formatCurrency(this.additionalContribution)} ${frequencyText.toLowerCase()}</p>`;
      }
      content += '</div>';

      content += '<h2>Growth Schedule</h2>';
      content += '<table>';
      content += '<thead><tr><th>Year</th><th>Balance</th><th>Contributions</th><th>Interest</th><th>ROI</th></tr></thead>';
      content += '<tbody>';

      const principal = this.investmentAmount;
      const rate = this.annualRate / 100;
      const years = this.investmentTerm;
      const additionalContribution = this.additionalContribution;
      const contributionsPerYear = this.contributionFrequency;

      let futureValue = principal;
      let totalContributions = 0;

      if (additionalContribution > 0) {
        const ratePerPeriod = rate / contributionsPerYear;
        const totalPeriods = years * contributionsPerYear;

        for (let i = 1; i <= totalPeriods; i++) {
          futureValue = futureValue * (1 + ratePerPeriod) + additionalContribution;
          totalContributions += additionalContribution;

          if (i % contributionsPerYear === 0) {
            const yearNum = i / contributionsPerYear;
            const totalContributionsToDate = principal + totalContributions;
            const interestToDate = futureValue - totalContributionsToDate;
            const roi = ((interestToDate / totalContributionsToDate) * 100).toFixed(2);

            content += `<tr>
              <td>${yearNum}</td>
              <td>${this.formatCurrency(futureValue)}</td>
              <td>${this.formatCurrency(totalContributionsToDate)}</td>
              <td>${this.formatCurrency(interestToDate)}</td>
              <td>${roi}%</td>
            </tr>`;
          }
        }
      } else {
        for (let i = 1; i <= years; i++) {
          const yearlyAmount = principal * Math.pow(1 + rate, i);
          const interestToDate = yearlyAmount - principal;
          const roi = ((interestToDate / principal) * 100).toFixed(2);

          content += `<tr>
            <td>${i}</td>
            <td>${this.formatCurrency(yearlyAmount)}</td>
            <td>${this.formatCurrency(principal)}</td>
            <td>${this.formatCurrency(interestToDate)}</td>
            <td>${roi}%</td>
          </tr>`;
        }
      }

      content += '</tbody></table>';
    }

    content += '</body></html>';
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }

  formatCurrency(amount, includeCents = true) {
    try {
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: this.selectedCurrency,
        minimumFractionDigits: includeCents ? 2 : 0,
        maximumFractionDigits: includeCents ? 2 : 0
      });
      return formatter.format(amount);
    } catch (e) {
      console.error(`Invalid currency code: ${this.selectedCurrency}`, e);
      // Fallback to USD if currency code is invalid
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: includeCents ? 2 : 0,
        maximumFractionDigits: includeCents ? 2 : 0
      });
      return formatter.format(amount);
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style id="dynamic-styles">
        ${this.getStyles()}
      </style>

      <div class="calculator-container">
        <div class="calculator-header">
          <h2>Financial Calculators</h2>
          <select id="currency-selector" class="currency-selector">
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="INR">INR - Indian Rupee</option>
            <option value="JPY">JPY - Japanese Yen</option>
            <option value="AUD">AUD - Australian Dollar</option>
            <option value="CAD">CAD - Canadian Dollar</option>
            <option value="CNY">CNY - Chinese Yuan</option>
            <option value="CHF">CHF - Swiss Franc</option>
            <option value="BRL">BRL - Brazilian Real</option>
          </select>
        </div>

        <div class="calculator-tabs">
          <button class="tab-btn active" data-tab="loan">Loan Calculator</button>
          <button class="tab-btn" data-tab="emi">EMI Calculator</button>
          <button class="tab-btn" data-tab="roi">ROI Calculator</button>
        </div>

        <!-- Loan Calculator -->
        <div id="loan-calculator" class="tab-content" style="display: block;">
          <div class="input-group">
            <label for="loan-amount">Loan Amount</label>
            <div class="slider-container">
              <span>${this.formatCurrency(10000, false)}</span>
              <input type="range" id="loan-amount" class="slider" min="10000" max="1000000" step="1000" value="100000">
              <span class="slider-value" id="loan-amount-value">${this.formatCurrency(100000)}</span>
            </div>
          </div>

          <div class="input-group">
            <label for="loan-interest">Interest Rate (%)</label>
            <div class="slider-container">
              <span>1%</span>
              <input type="range" id="loan-interest" class="slider" min="1" max="20" step="0.1" value="5">
              <span class="slider-value" id="loan-interest-value">5%</span>
            </div>
          </div>

          <div class="input-group">
            <label for="loan-term">Loan Term (years)</label>
            <div class="slider-container">
              <span>1</span>
              <input type="range" id="loan-term" class="slider" min="1" max="30" step="1" value="5">
              <span class="slider-value" id="loan-term-value">5 years</span>
            </div>
          </div>

          <div class="results-section">
            <h3>Loan Summary</h3>
            <div class="results-grid">
              <div class="result-item">
                <div class="result-label">Monthly Payment</div>
                <div class="result-value" id="loan-monthly-payment">${this.formatCurrency(1887.12)}</div>
              </div>
              <div class="result-item">
                <div class="result-label">Total Payment</div>
                <div class="result-value" id="loan-total-payment">${this.formatCurrency(113227.20)}</div>
              </div>
              <div class="result-item">
                <div class="result-label">Total Interest</div>
                <div class="result-value" id="loan-total-interest">${this.formatCurrency(13227.20)}</div>
              </div>
            </div>

            <div class="chart-container">
              <canvas id="loan-chart"></canvas>
            </div>
          </div>

          <div class="table-container">
            <h3>Amortization Schedule</h3>
            <table id="amortization-table">
              <thead>
                <tr>
                  <th>Payment #</th>
                  <th>Payment</th>
                  <th>Principal</th>
                  <th>Interest</th>
                  <th>Remaining Balance</th>
                </tr>
              </thead>
              <tbody>
                <!-- Filled via JavaScript -->
              </tbody>
            </table>
          </div>
        </div>

        <!-- EMI Calculator -->
        <div id="emi-calculator" class="tab-content">
          <div class="input-group">
            <label for="emi-amount">Loan Amount</label>
            <div class="slider-container">
              <span>${this.formatCurrency(10000, false)}</span>
              <input type="range" id="emi-amount" class="slider" min="10000" max="1000000" step="1000" value="100000">
              <span class="slider-value" id="emi-amount-value">${this.formatCurrency(100000)}</span>
            </div>
          </div>

          <div class="input-group">
            <label for="emi-interest">Interest Rate (%)</label>
            <div class="slider-container">
              <span>1%</span>
              <input type="range" id="emi-interest" class="slider" min="1" max="20" step="0.1" value="5">
              <span class="slider-value" id="emi-interest-value">5%</span>
            </div>
          </div>

          <div class="input-group">
            <label for="emi-term">Loan Term (years)</label>
            <div class="slider-container">
              <span>1</span>
              <input type="range" id="emi-term" class="slider" min="1" max="30" step="1" value="5">
              <span class="slider-value" id="emi-term-value">5 years</span>
            </div>
          </div>

          <div class="input-group">
            <label for="compounding-period">Compounding Period</label>
            <div class="select-container">
              <select id="compounding-period">
                <option value="12">Monthly</option>
                <option value="4">Quarterly</option>
                <option value="2">Semi-Annually</option>
                <option value="1">Annually</option>
              </select>
            </div>
          </div>

          <div class="results-section">
            <h3>EMI Summary</h3>
            <div class="results-grid">
              <div class="result-item">
                <div class="result-label">EMI Payment</div>
                <div class="result-value" id="emi-payment">${this.formatCurrency(1887.12)}</div>
              </div>
              <div class="result-item">
                <div class="result-label">Total Payment</div>
                <div class="result-value" id="emi-total-payment">${this.formatCurrency(113227.20)}</div>
              </div>
              <div class="result-item">
                <div class="result-label">Total Interest</div>
                <div class="result-value" id="emi-total-interest">${this.formatCurrency(13227.20)}</div>
              </div>
            </div>
          </div>

          <div class="table-container">
            <h3>Payment Schedule</h3>
            <table id="payment-schedule">
              <thead>
                <tr>
                  <th>Payment #</th>
                  <th>Payment</th>
                  <th>Principal</th>
                  <th>Interest</th>
                  <th>Remaining Balance</th>
                </tr>
              </thead>
              <tbody>
                <!-- Filled via JavaScript -->
              </tbody>
            </table>
          </div>
        </div>

        <!-- ROI Calculator -->
        <div id="roi-calculator" class="tab-content">
          <div class="input-group">
            <label for="investment-amount">Initial Investment</label>
            <div class="slider-container">
              <span>${this.formatCurrency(1000, false)}</span>
              <input type="range" id="investment-amount" class="slider" min="1000" max="100000" step="500" value="10000">
              <span class="slider-value" id="investment-amount-value">${this.formatCurrency(10000)}</span>
            </div>
          </div>

          <div class="input-group">
            <label for="annual-rate">Annual Rate of Return (%)</label>
            <div class="slider-container">
              <span>1%</span>
              <input type="range" id="annual-rate" class="slider" min="1" max="20" step="0.1" value="8">
              <span class="slider-value" id="annual-rate-value">8%</span>
            </div>
          </div>

          <div class="input-group">
            <label for="investment-term">Investment Period (years)</label>
            <div class="slider-container">
              <span>1</span>
              <input type="range" id="investment-term" class="slider" min="1" max="40" step="1" value="5">
              <span class="slider-value" id="investment-term-value">5 years</span>
            </div>
          </div>

          <div class="input-group">
            <label for="additional-contribution">Additional Contribution</label>
            <div class="slider-container">
              <span>${this.formatCurrency(0, false)}</span>
              <input type="range" id="additional-contribution" class="slider" min="0" max="5000" step="50" value="0">
              <span class="slider-value" id="additional-contribution-value">${this.formatCurrency(0)}</span>
            </div>
          </div>

          <div class="input-group">
            <label for="contribution-frequency">Contribution Frequency</label>
            <div class="select-container">
              <select id="contribution-frequency">
                <option value="12">Monthly</option>
                <option value="4">Quarterly</option>
                <option value="2">Semi-Annually</option>
                <option value="1">Annually</option>
              </select>
            </div>
          </div>

          <div class="results-section">
            <h3>Investment Summary</h3>
            <div class="results-grid">
              <div class="result-item">
                <div class="result-label">Future Value</div>
                <div class="result-value" id="roi-future-value">${this.formatCurrency(14693.28)}</div>
              </div>
              <div class="result-item">
                <div class="result-label">Total Contributions</div>
                <div class="result-value" id="roi-total-contributions">${this.formatCurrency(10000)}</div>
              </div>
              <div class="result-item">
                <div class="result-label">Total Interest</div>
                <div class="result-value" id="roi-total-interest">${this.formatCurrency(4693.28)}</div>
              </div>
            </div>

            <div class="chart-container">
              <canvas id="roi-chart"></canvas>
            </div>
          </div>

          <div class="table-container">
            <h3>Growth Schedule</h3>
            <table id="growth-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Balance</th>
                  <th>Contributions</th>
                  <th>Interest</th>
                  <th>ROI</th>
                </tr>
              </thead>
              <tbody>
                <!-- Filled via JavaScript -->
              </tbody>
            </table>
          </div>
        </div>

        <div class="button-group">
          <button id="print-btn" class="btn btn-outline">Print/Export Results</button>
        </div>
      </div>
    `;
  }
}

// Define the custom element
customElements.define('finance-calculators', FinanceCalculators);
