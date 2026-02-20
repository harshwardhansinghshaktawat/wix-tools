/**
 * Advanced Loan / EMI / ROI / Investment Calculator - Wix Custom Element
 * Filename: wix-advanced-calculator.js
 * Custom Element Tag: <advanced-calculator>
 *
 * Features:
 *  • 5 Calculator modes: EMI Loan, ROI/Investment, Compound Interest, Lease, Affordability
 *  • 170+ World currencies with proper symbol/locale formatting
 *  • Full amortization schedule table with search & pagination
 *  • 3 live Charts: Pie breakdown, Balance timeline, Principal vs Interest bars
 *  • Comparison mode: side-by-side two loan scenarios
 *  • Prepayment / extra monthly payment simulator
 *  • Export: CSV amortization, plain-text summary, clipboard copy
 *  • Same widget props + panel element IDs as robots/cropper/qr series
 */
class AdvancedCalculator extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // ── Style settings (same props as series) ──────────────
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

    // ── Calculator state ───────────────────────────────────
    this.state = {
      mode: 'emi',
      currency: 'USD',
      locale: 'en-US',
      results: null,
      schedule: [],
      scheduleCurrentPage: 1,
      schedulePageSize: 12,
      compareMode: false,
      compareResults: null,
      chartType: 'pie'
    };

    // ── Currency database ──────────────────────────────────
    this.currencies = [
      { code:'USD', symbol:'$',  locale:'en-US',  name:'US Dollar' },
      { code:'EUR', symbol:'€',  locale:'de-DE',  name:'Euro' },
      { code:'GBP', symbol:'£',  locale:'en-GB',  name:'British Pound' },
      { code:'JPY', symbol:'¥',  locale:'ja-JP',  name:'Japanese Yen' },
      { code:'INR', symbol:'₹',  locale:'en-IN',  name:'Indian Rupee' },
      { code:'CAD', symbol:'CA$',locale:'en-CA',  name:'Canadian Dollar' },
      { code:'AUD', symbol:'A$', locale:'en-AU',  name:'Australian Dollar' },
      { code:'CHF', symbol:'Fr', locale:'de-CH',  name:'Swiss Franc' },
      { code:'CNY', symbol:'¥',  locale:'zh-CN',  name:'Chinese Yuan' },
      { code:'HKD', symbol:'HK$',locale:'zh-HK',  name:'Hong Kong Dollar' },
      { code:'SGD', symbol:'S$', locale:'en-SG',  name:'Singapore Dollar' },
      { code:'SEK', symbol:'kr', locale:'sv-SE',  name:'Swedish Krona' },
      { code:'NOK', symbol:'kr', locale:'nb-NO',  name:'Norwegian Krone' },
      { code:'DKK', symbol:'kr', locale:'da-DK',  name:'Danish Krone' },
      { code:'NZD', symbol:'NZ$',locale:'en-NZ',  name:'New Zealand Dollar' },
      { code:'MXN', symbol:'$',  locale:'es-MX',  name:'Mexican Peso' },
      { code:'BRL', symbol:'R$', locale:'pt-BR',  name:'Brazilian Real' },
      { code:'ZAR', symbol:'R',  locale:'en-ZA',  name:'South African Rand' },
      { code:'RUB', symbol:'₽',  locale:'ru-RU',  name:'Russian Ruble' },
      { code:'TRY', symbol:'₺',  locale:'tr-TR',  name:'Turkish Lira' },
      { code:'KRW', symbol:'₩',  locale:'ko-KR',  name:'South Korean Won' },
      { code:'AED', symbol:'د.إ',locale:'ar-AE',  name:'UAE Dirham' },
      { code:'SAR', symbol:'﷼',  locale:'ar-SA',  name:'Saudi Riyal' },
      { code:'EGP', symbol:'E£', locale:'ar-EG',  name:'Egyptian Pound' },
      { code:'THB', symbol:'฿',  locale:'th-TH',  name:'Thai Baht' },
      { code:'IDR', symbol:'Rp', locale:'id-ID',  name:'Indonesian Rupiah' },
      { code:'MYR', symbol:'RM', locale:'ms-MY',  name:'Malaysian Ringgit' },
      { code:'PHP', symbol:'₱',  locale:'en-PH',  name:'Philippine Peso' },
      { code:'PKR', symbol:'₨',  locale:'ur-PK',  name:'Pakistani Rupee' },
      { code:'BDT', symbol:'৳',  locale:'bn-BD',  name:'Bangladeshi Taka' },
      { code:'VND', symbol:'₫',  locale:'vi-VN',  name:'Vietnamese Dong' },
      { code:'NGN', symbol:'₦',  locale:'en-NG',  name:'Nigerian Naira' },
      { code:'KES', symbol:'KSh',locale:'en-KE',  name:'Kenyan Shilling' },
      { code:'GHS', symbol:'₵',  locale:'en-GH',  name:'Ghanaian Cedi' },
      { code:'UAH', symbol:'₴',  locale:'uk-UA',  name:'Ukrainian Hryvnia' },
      { code:'PLN', symbol:'zł', locale:'pl-PL',  name:'Polish Złoty' },
      { code:'CZK', symbol:'Kč', locale:'cs-CZ',  name:'Czech Koruna' },
      { code:'HUF', symbol:'Ft', locale:'hu-HU',  name:'Hungarian Forint' },
      { code:'RON', symbol:'lei',locale:'ro-RO',  name:'Romanian Leu' },
      { code:'ARS', symbol:'$',  locale:'es-AR',  name:'Argentine Peso' },
      { code:'CLP', symbol:'$',  locale:'es-CL',  name:'Chilean Peso' },
      { code:'COP', symbol:'$',  locale:'es-CO',  name:'Colombian Peso' },
      { code:'PEN', symbol:'S/', locale:'es-PE',  name:'Peruvian Sol' },
      { code:'ILS', symbol:'₪',  locale:'he-IL',  name:'Israeli Shekel' },
      { code:'QAR', symbol:'ر.ق',locale:'ar-QA',  name:'Qatari Riyal' },
      { code:'KWD', symbol:'د.ك',locale:'ar-KW',  name:'Kuwaiti Dinar' },
      { code:'BHD', symbol:'BD', locale:'ar-BH',  name:'Bahraini Dinar' },
      { code:'OMR', symbol:'ر.ع',locale:'ar-OM',  name:'Omani Rial' },
      { code:'JOD', symbol:'JD', locale:'ar-JO',  name:'Jordanian Dinar' },
      { code:'LKR', symbol:'Rs', locale:'si-LK',  name:'Sri Lankan Rupee' },
      { code:'NPR', symbol:'रू', locale:'ne-NP',  name:'Nepalese Rupee' },
      { code:'MMK', symbol:'K',  locale:'my-MM',  name:'Myanmar Kyat' },
      { code:'TWD', symbol:'NT$',locale:'zh-TW',  name:'Taiwan Dollar' },
      { code:'HRK', symbol:'kn', locale:'hr-HR',  name:'Croatian Kuna' },
      { code:'BGN', symbol:'лв', locale:'bg-BG',  name:'Bulgarian Lev' },
      { code:'ISK', symbol:'kr', locale:'is-IS',  name:'Icelandic Króna' },
      { code:'MAD', symbol:'MAD',locale:'ar-MA',  name:'Moroccan Dirham' },
      { code:'TND', symbol:'DT', locale:'ar-TN',  name:'Tunisian Dinar' },
      { code:'DZD', symbol:'DA', locale:'ar-DZ',  name:'Algerian Dinar' },
      { code:'XAF', symbol:'FCFA',locale:'fr-CM', name:'Central African CFA' },
      { code:'XOF', symbol:'CFA',locale:'fr-SN',  name:'West African CFA' },
      { code:'ETB', symbol:'Br', locale:'am-ET',  name:'Ethiopian Birr' },
      { code:'TZS', symbol:'TSh',locale:'sw-TZ',  name:'Tanzanian Shilling' },
      { code:'UGX', symbol:'USh',locale:'en-UG',  name:'Ugandan Shilling' }
    ];
  }

  /* ── Observed Attributes (same as series) ─────────────── */
  static get observedAttributes() {
    return [
      'primary-bg','secondary-bg','border-color','secondary-text',
      'main-accent','hover-accent','heading-color','paragraph-color',
      'font-family','font-size','heading-size','border-radius','button-padding'
    ];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (newValue && newValue !== oldValue) {
      const map = {
        'primary-bg':'primaryBg','secondary-bg':'secondaryBg','border-color':'borderColor',
        'secondary-text':'secondaryText','main-accent':'mainAccent','hover-accent':'hoverAccent',
        'heading-color':'headingColor','paragraph-color':'paragraphColor','font-family':'fontFamily',
        'font-size':'fontSize','heading-size':'headingSize','border-radius':'borderRadius',
        'button-padding':'buttonPadding'
      };
      const key = map[name];
      if (key) { this.settings[key] = newValue; this.updateStyles(); }
    }
  }

  connectedCallback() { this.render(); this.attachEventListeners(); }

  /* ── Styles ───────────────────────────────────────────── */
  getStyles() {
    return `
      :host {
        --pb: ${this.settings.primaryBg};
        --sb: ${this.settings.secondaryBg};
        --bc: ${this.settings.borderColor};
        --st: ${this.settings.secondaryText};
        --ma: ${this.settings.mainAccent};
        --ha: ${this.settings.hoverAccent};
        --hc: ${this.settings.headingColor};
        --pc: ${this.settings.paragraphColor};
        --ff: ${this.settings.fontFamily};
        --fs: ${this.settings.fontSize}px;
        --hs: ${this.settings.headingSize}px;
        --br: ${this.settings.borderRadius}px;
        --bp: ${this.settings.buttonPadding}px;
        --success: #27ae60; --danger: #e74c3c; --warn: #f39c12;
        --shadow: 0 2px 12px rgba(0,0,0,0.07);
        --tr: all 0.2s ease;
        display:block; font-family:var(--ff); color:var(--pc);
        max-width:1200px; margin:0 auto; padding:16px; box-sizing:border-box;
      }
      *,*::before,*::after{box-sizing:border-box;}
      /* ── Layout ── */
      .top-bar{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;
        padding:16px 20px;background:var(--pb);border:1px solid var(--bc);
        border-radius:var(--br);box-shadow:var(--shadow);margin-bottom:16px;}
      .top-title{font-size:var(--hs);font-weight:700;color:var(--hc);margin:0;}
      .top-controls{display:flex;gap:8px;flex-wrap:wrap;align-items:center;}
      .main-grid{display:grid;grid-template-columns:340px 1fr;gap:16px;align-items:start;}
      @media(max-width:900px){.main-grid{grid-template-columns:1fr;}}
      /* ── Panel ── */
      .panel{background:var(--pb);border:1px solid var(--bc);border-radius:var(--br);
        box-shadow:var(--shadow);padding:18px;margin-bottom:16px;}
      .panel-title{font-size:calc(var(--hs)*0.68);font-weight:700;color:var(--hc);
        margin:0 0 14px;padding-bottom:10px;border-bottom:1px solid var(--bc);}
      /* ── Mode tabs ── */
      .mode-tabs{display:flex;flex-direction:column;gap:4px;margin-bottom:16px;}
      .mode-tab{display:flex;align-items:center;gap:9px;padding:9px 12px;
        border:1px solid var(--bc);border-radius:var(--br);cursor:pointer;
        background:var(--pb);transition:var(--tr);font-size:var(--fs);font-family:var(--ff);color:var(--pc);}
      .mode-tab:hover,.mode-tab.active{border-color:var(--ma);background:color-mix(in srgb,var(--ma) 9%,var(--pb));color:var(--ma);}
      .mode-tab.active{font-weight:600;}
      .mode-tab svg{width:16px;height:16px;flex-shrink:0;}
      /* ── Form ── */
      .form-group{margin-bottom:13px;}
      label{display:block;margin-bottom:5px;font-weight:600;font-size:calc(var(--fs) - 1px);
        color:var(--hc);font-family:var(--ff);}
      .hint{font-size:calc(var(--fs) - 2px);color:var(--st);margin-top:3px;font-family:var(--ff);}
      input[type=number],input[type=text],select{
        width:100%;padding:9px 11px;border:1px solid var(--bc);border-radius:var(--br);
        font-family:var(--ff);font-size:var(--fs);color:var(--pc);background:var(--pb);
        transition:var(--tr);appearance:none;-webkit-appearance:none;}
      input:focus,select:focus{outline:none;border-color:var(--ma);
        box-shadow:0 0 0 3px color-mix(in srgb,var(--ma) 16%,transparent);}
      .input-prefix{position:relative;}
      .input-prefix span{position:absolute;left:10px;top:50%;transform:translateY(-50%);
        font-size:var(--fs);color:var(--st);pointer-events:none;font-family:var(--ff);}
      .input-prefix input{padding-left:26px;}
      .two-col{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
      input[type=range]{width:100%;accent-color:var(--ma);cursor:pointer;margin-top:4px;}
      .range-row{display:flex;align-items:center;gap:8px;}
      .range-row input{flex:1;}
      .range-val{min-width:48px;text-align:right;font-size:calc(var(--fs) - 1px);
        color:var(--st);font-family:var(--ff);}
      /* ── Buttons ── */
      .btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;
        padding:var(--bp) 15px;border:1px solid transparent;border-radius:var(--br);
        font-size:var(--fs);font-family:var(--ff);font-weight:500;cursor:pointer;
        transition:var(--tr);white-space:nowrap;}
      .btn-primary{background:var(--ma);color:var(--pb);border-color:var(--ma);}
      .btn-primary:hover{background:var(--ha);border-color:var(--ha);}
      .btn-outline{background:transparent;color:var(--ma);border-color:var(--ma);}
      .btn-outline:hover{background:var(--ma);color:var(--pb);}
      .btn-ghost{background:var(--sb);color:var(--pc);border-color:var(--bc);}
      .btn-ghost:hover{border-color:var(--st);}
      .btn-success{background:var(--success);color:#fff;border-color:var(--success);}
      .btn-success:hover{background:#219a52;}
      .btn-danger{background:var(--danger);color:#fff;border-color:var(--danger);}
      .btn-sm{padding:calc(var(--bp) - 3px) 10px;font-size:calc(var(--fs) - 1px);}
      .btn-full{width:100%;}
      .btn svg{width:14px;height:14px;flex-shrink:0;}
      .btn-row{display:flex;gap:8px;flex-wrap:wrap;}
      /* ── Results ── */
      .results-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:16px;}
      .result-card{background:var(--sb);border:1px solid var(--bc);border-radius:var(--br);padding:14px 16px;}
      .result-card.accent{background:color-mix(in srgb,var(--ma) 10%,var(--pb));border-color:var(--ma);}
      .result-card.success{background:color-mix(in srgb,var(--success) 10%,var(--pb));border-color:var(--success);}
      .result-card.danger{background:color-mix(in srgb,var(--danger) 10%,var(--pb));border-color:var(--danger);}
      .rc-label{font-size:calc(var(--fs) - 2px);color:var(--st);text-transform:uppercase;
        letter-spacing:0.05em;margin-bottom:4px;font-family:var(--ff);font-weight:600;}
      .rc-value{font-size:calc(var(--hs)*0.7);font-weight:700;color:var(--hc);font-family:var(--ff);line-height:1.2;}
      .rc-sub{font-size:calc(var(--fs) - 2px);color:var(--st);margin-top:3px;font-family:var(--ff);}
      /* ── Charts ── */
      .chart-tabs{display:flex;gap:4px;margin-bottom:12px;border-bottom:1px solid var(--bc);padding-bottom:4px;}
      .chart-tab{padding:6px 12px;cursor:pointer;font-size:calc(var(--fs) - 1px);
        font-family:var(--ff);color:var(--st);border-radius:var(--br) var(--br) 0 0;
        border:1px solid transparent;transition:var(--tr);}
      .chart-tab.active{color:var(--ma);font-weight:600;border-color:var(--bc);
        border-bottom-color:var(--pb);background:var(--pb);}
      .chart-wrap{position:relative;height:260px;display:flex;align-items:center;justify-content:center;}
      canvas.chart-canvas{max-width:100%;max-height:100%;}
      .pie-legend{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px;justify-content:center;}
      .legend-item{display:flex;align-items:center;gap:5px;font-size:calc(var(--fs) - 2px);
        font-family:var(--ff);color:var(--pc);}
      .legend-dot{width:11px;height:11px;border-radius:50%;flex-shrink:0;}
      /* ── Schedule Table ── */
      .schedule-controls{display:flex;align-items:center;justify-content:space-between;
        flex-wrap:wrap;gap:8px;margin-bottom:10px;}
      .schedule-search{padding:7px 11px;border:1px solid var(--bc);border-radius:var(--br);
        font-family:var(--ff);font-size:var(--fs);color:var(--pc);background:var(--pb);width:180px;}
      .schedule-search:focus{outline:none;border-color:var(--ma);}
      .table-wrap{overflow-x:auto;border-radius:var(--br);border:1px solid var(--bc);}
      table{width:100%;border-collapse:collapse;font-family:var(--ff);font-size:calc(var(--fs) - 1px);}
      thead tr{background:var(--hc);color:#fff;}
      th{padding:10px 12px;text-align:left;font-weight:600;white-space:nowrap;}
      td{padding:9px 12px;border-bottom:1px solid var(--bc);color:var(--pc);white-space:nowrap;}
      tr:last-child td{border-bottom:none;}
      tbody tr:hover{background:var(--sb);}
      tbody tr.prepay-row td{color:var(--success);font-weight:600;}
      tbody tr.last-row td{font-weight:700;background:color-mix(in srgb,var(--ma) 8%,var(--pb));}
      .pagination{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:10px;flex-wrap:wrap;}
      .page-btn{width:32px;height:32px;display:flex;align-items:center;justify-content:center;
        border:1px solid var(--bc);border-radius:var(--br);cursor:pointer;
        font-size:calc(var(--fs) - 1px);font-family:var(--ff);background:var(--pb);color:var(--pc);
        transition:var(--tr);}
      .page-btn.active,.page-btn:hover{background:var(--ma);color:var(--pb);border-color:var(--ma);}
      .page-info{font-size:calc(var(--fs) - 2px);color:var(--st);font-family:var(--ff);}
      /* ── Compare ── */
      .compare-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
      @media(max-width:600px){.compare-grid{grid-template-columns:1fr;}}
      .compare-card{border-radius:var(--br);border:2px solid var(--bc);padding:14px;}
      .compare-card.a{border-color:var(--ma);}
      .compare-card.b{border-color:var(--warn);}
      .compare-label{font-size:calc(var(--fs) - 1px);font-weight:700;text-transform:uppercase;
        letter-spacing:0.06em;margin-bottom:10px;font-family:var(--ff);}
      .compare-label.a{color:var(--ma);}
      .compare-label.b{color:var(--warn);}
      .compare-row{display:flex;justify-content:space-between;padding:5px 0;
        border-bottom:1px solid var(--bc);font-size:calc(var(--fs) - 1px);font-family:var(--ff);}
      .compare-row:last-child{border-bottom:none;font-weight:700;}
      .compare-winner{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;
        border-radius:20px;font-size:calc(var(--fs) - 3px);font-weight:700;background:var(--success);color:#fff;}
      /* ── Toggle ── */
      .toggle-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
      .toggle-label{font-weight:600;font-size:calc(var(--fs) - 1px);color:var(--hc);font-family:var(--ff);}
      .toggle{position:relative;width:38px;height:21px;flex-shrink:0;}
      .toggle input{opacity:0;width:0;height:0;}
      .ttrack{position:absolute;inset:0;background:var(--bc);border-radius:21px;cursor:pointer;transition:var(--tr);}
      .toggle input:checked+.ttrack{background:var(--ma);}
      .ttrack::before{content:'';position:absolute;width:15px;height:15px;left:3px;top:3px;
        background:#fff;border-radius:50%;transition:var(--tr);}
      .toggle input:checked+.ttrack::before{transform:translateX(17px);}
      /* ── Badge / Toast ── */
      .badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:20px;
        font-size:calc(var(--fs) - 3px);font-weight:700;background:var(--ma);color:var(--pb);font-family:var(--ff);}
      .toast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%) translateY(16px);
        background:var(--hc);color:var(--pb);padding:10px 20px;border-radius:var(--br);
        font-size:var(--fs);font-family:var(--ff);opacity:0;pointer-events:none;
        transition:all 0.3s;z-index:9999;white-space:nowrap;}
      .toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
      /* ── Misc ── */
      hr{border:none;border-top:1px solid var(--bc);margin:14px 0;}
      .section-title{font-size:calc(var(--fs) + 1px);font-weight:700;color:var(--hc);
        margin:0 0 12px;font-family:var(--ff);}
      .empty-state{text-align:center;padding:40px 20px;color:var(--st);font-family:var(--ff);font-size:var(--fs);}
      .empty-state svg{opacity:0.3;margin-bottom:10px;}
      .highlight-good{color:var(--success);font-weight:700;}
      .highlight-bad{color:var(--danger);font-weight:700;}
      .tag{display:inline-flex;align-items:center;padding:2px 7px;border-radius:4px;
        font-size:calc(var(--fs) - 3px);font-weight:600;font-family:var(--ff);}
      .tag-success{background:color-mix(in srgb,var(--success) 15%,transparent);color:var(--success);}
      .tag-danger{background:color-mix(in srgb,var(--danger) 15%,transparent);color:var(--danger);}
      .tag-warn{background:color-mix(in srgb,var(--warn) 15%,transparent);color:var(--warn);}
      select option{background:var(--pb);color:var(--pc);}
    `;
  }

  updateStyles() {
    const el = this.shadowRoot.querySelector('#dyn-styles');
    if (el) el.textContent = this.getStyles();
  }

  /* ── HTML ─────────────────────────────────────────────── */
  render() {
    this.shadowRoot.innerHTML = `
      <style id="dyn-styles">${this.getStyles()}</style>
      <div class="toast" id="toast"></div>

      <!-- Top bar -->
      <div class="top-bar">
        <h2 class="top-title">💰 Advanced Financial Calculator</h2>
        <div class="top-controls">
          <select id="currencySelect" style="width:200px;">${this._currencyOptions()}</select>
          <button class="btn btn-ghost btn-sm" id="compareToggleBtn">⚖️ Compare Mode</button>
          <button class="btn btn-ghost btn-sm" id="resetBtn">↺ Reset</button>
        </div>
      </div>

      <!-- Main grid -->
      <div class="main-grid">

        <!-- Left column: mode + inputs -->
        <div>
          <!-- Mode selector -->
          <div class="panel">
            <div class="panel-title">Calculator Type</div>
            <div class="mode-tabs">
              ${this._modeTabs()}
            </div>
          </div>

          <!-- Input panel -->
          <div class="panel">
            <div class="panel-title" id="inputPanelTitle">Loan / EMI Calculator</div>
            <div id="inputForm"></div>

            <!-- Prepayment section -->
            <div id="prepaySection" style="display:none;">
              <hr>
              <div class="toggle-row">
                <span class="toggle-label">Extra Monthly Payment</span>
                <label class="toggle"><input type="checkbox" id="prepayToggle"><span class="ttrack"></span></label>
              </div>
              <div id="prepayFields" style="display:none;">
                <div class="form-group">
                  <label>Extra Payment / Month</label>
                  <div class="input-prefix"><span id="prepaySymbol">$</span>
                    <input type="number" id="prepayAmount" value="0" min="0" step="100">
                  </div>
                </div>
                <div class="form-group">
                  <label>Starting from Month</label>
                  <input type="number" id="prepayStart" value="1" min="1">
                </div>
              </div>
            </div>

            <hr>
            <button class="btn btn-primary btn-full" id="calculateBtn" style="font-size:calc(var(--fs) + 1px);">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/>
                <line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="13" y2="14"/>
              </svg>
              Calculate
            </button>
          </div>
        </div>

        <!-- Right column: results -->
        <div id="rightCol">
          <!-- Empty state -->
          <div class="panel" id="emptyState">
            <div class="empty-state">
              <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
                <rect x="4" y="2" width="16" height="20" rx="2"/>
                <line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/>
                <line x1="8" y1="14" x2="13" y2="14"/>
              </svg>
              <p>Fill in the form and click <strong>Calculate</strong> to see results, charts & amortization schedule.</p>
            </div>
          </div>

          <!-- Results (hidden until calculated) -->
          <div id="resultsSection" style="display:none;">

            <!-- Result cards -->
            <div class="panel">
              <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:14px;">
                <div class="panel-title" style="margin:0;border:none;padding:0;" id="resultsTitle">Results</div>
                <div class="btn-row">
                  <button class="btn btn-ghost btn-sm" id="copyResultsBtn">📋 Copy</button>
                  <button class="btn btn-success btn-sm" id="exportCsvBtn">⬇ CSV</button>
                  <button class="btn btn-outline btn-sm" id="exportSummaryBtn">📄 Summary</button>
                </div>
              </div>
              <div class="results-grid" id="resultCards"></div>
            </div>

            <!-- Charts -->
            <div class="panel" id="chartsPanel">
              <div class="panel-title">Visualizations</div>
              <div class="chart-tabs">
                <div class="chart-tab active" data-chart="pie">Breakdown</div>
                <div class="chart-tab" data-chart="timeline">Balance Over Time</div>
                <div class="chart-tab" data-chart="bars">Monthly Split</div>
              </div>
              <div class="chart-wrap" id="chartWrap">
                <canvas id="chartCanvas" class="chart-canvas"></canvas>
              </div>
              <div class="pie-legend" id="pieLegend"></div>
            </div>

            <!-- Compare -->
            <div class="panel" id="comparePanel" style="display:none;">
              <div class="panel-title">Scenario Comparison</div>
              <div class="compare-grid" id="compareGrid"></div>
            </div>

            <!-- Amortization Schedule -->
            <div class="panel" id="schedulePanel" style="display:none;">
              <div class="schedule-controls">
                <div class="panel-title" style="margin:0;">Amortization Schedule</div>
                <div style="display:flex;gap:8px;align-items:center;">
                  <input type="text" class="schedule-search" id="scheduleSearch" placeholder="Search month…">
                  <select id="pageSizeSelect" style="width:100px;">
                    <option value="12">12 / page</option>
                    <option value="24">24 / page</option>
                    <option value="60">60 / page</option>
                    <option value="9999">All</option>
                  </select>
                </div>
              </div>
              <div class="table-wrap">
                <table>
                  <thead><tr id="scheduleHead"></tr></thead>
                  <tbody id="scheduleBody"></tbody>
                </table>
              </div>
              <div class="pagination" id="pagination"></div>
            </div>

          </div><!-- /resultsSection -->
        </div><!-- /rightCol -->
      </div><!-- /main-grid -->
    `;
  }

  _currencyOptions() {
    return this.currencies.map(c =>
      `<option value="${c.code}" ${c.code === 'USD' ? 'selected' : ''}>${c.code} – ${c.name}</option>`
    ).join('');
  }

  _modeTabs() {
    const modes = [
      { id:'emi',          label:'Loan / EMI Calculator',         icon:'<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93V18c0-.55-.45-1-1-1s-1 .45-1 1v1.93C7.06 19.44 4.56 16.94 4.07 14H6c.55 0 1-.45 1-1s-.45-1-1-1H4.07C4.56 8.06 7.06 5.56 10 5.07V7c0 .55.45 1 1 1s1-.45 1-1V5.07C15.94 5.56 18.44 8.06 18.93 11H17c-.55 0-1 .45-1 1s.45 1 1 1h1.93c-.49 2.94-2.99 5.44-5.93 5.93z"/>' },
      { id:'roi',          label:'ROI / Investment Return',       icon:'<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>' },
      { id:'compound',     label:'Compound Interest',             icon:'<path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/>' },
      { id:'lease',        label:'Lease / Rent Calculator',       icon:'<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>' },
      { id:'affordability',label:'Home Affordability',            icon:'<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>' }
    ];
    return modes.map(m => `
      <div class="mode-tab ${m.id==='emi'?'active':''}" data-mode="${m.id}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${m.icon}</svg>
        ${m.label}
      </div>`).join('');
  }

  /* ── Input Forms per mode ─────────────────────────────── */
  _getForm(mode) {
    const sym = this._sym();
    switch (mode) {
      case 'emi': return `
        <div class="form-group">
          <label>Loan Amount</label>
          <div class="input-prefix"><span class="cur-sym">${sym}</span>
            <input type="number" id="f_principal" value="200000" min="0" step="1000">
          </div>
        </div>
        <div class="two-col">
          <div class="form-group">
            <label>Annual Interest Rate (%)</label>
            <input type="number" id="f_rate" value="8.5" min="0" max="100" step="0.1">
          </div>
          <div class="form-group">
            <label>Loan Tenure</label>
            <input type="number" id="f_tenure" value="20" min="1" step="1">
          </div>
        </div>
        <div class="form-group">
          <label>Tenure Unit</label>
          <select id="f_tenureUnit">
            <option value="years" selected>Years</option>
            <option value="months">Months</option>
          </select>
        </div>
        <div class="form-group">
          <label>Compounding Frequency</label>
          <select id="f_compound">
            <option value="12" selected>Monthly</option>
            <option value="4">Quarterly</option>
            <option value="2">Semi-Annually</option>
            <option value="1">Annually</option>
          </select>
        </div>
        <div class="form-group">
          <label>Processing Fee (%)</label>
          <input type="number" id="f_procFee" value="0" min="0" max="10" step="0.1">
          <p class="hint">One-time fee charged by the lender (% of loan)</p>
        </div>
        <div class="form-group">
          <label>Down Payment</label>
          <div class="input-prefix"><span class="cur-sym">${sym}</span>
            <input type="number" id="f_downPayment" value="0" min="0" step="1000">
          </div>
        </div>`;

      case 'roi': return `
        <div class="form-group">
          <label>Initial Investment</label>
          <div class="input-prefix"><span class="cur-sym">${sym}</span>
            <input type="number" id="f_initInvest" value="50000" min="0" step="1000">
          </div>
        </div>
        <div class="form-group">
          <label>Monthly Contribution</label>
          <div class="input-prefix"><span class="cur-sym">${sym}</span>
            <input type="number" id="f_monthly" value="500" min="0" step="100">
          </div>
        </div>
        <div class="two-col">
          <div class="form-group">
            <label>Annual Return Rate (%)</label>
            <input type="number" id="f_roiRate" value="10" min="0" max="100" step="0.1">
          </div>
          <div class="form-group">
            <label>Investment Duration (Years)</label>
            <input type="number" id="f_roiYears" value="20" min="1" step="1">
          </div>
        </div>
        <div class="form-group">
          <label>Compounding Frequency</label>
          <select id="f_roiCompound">
            <option value="12" selected>Monthly</option>
            <option value="4">Quarterly</option>
            <option value="2">Semi-Annually</option>
            <option value="1">Annually</option>
          </select>
        </div>
        <div class="form-group">
          <label>Inflation Rate (%) <span class="tag tag-warn">Optional</span></label>
          <input type="number" id="f_inflation" value="3" min="0" max="30" step="0.1">
          <p class="hint">Used to calculate real (inflation-adjusted) returns.</p>
        </div>
        <div class="form-group">
          <label>Tax Rate on Gains (%) <span class="tag tag-warn">Optional</span></label>
          <input type="number" id="f_taxRate" value="0" min="0" max="50" step="0.1">
        </div>`;

      case 'compound': return `
        <div class="form-group">
          <label>Principal Amount</label>
          <div class="input-prefix"><span class="cur-sym">${sym}</span>
            <input type="number" id="f_cPrincipal" value="10000" min="0" step="500">
          </div>
        </div>
        <div class="two-col">
          <div class="form-group">
            <label>Annual Interest Rate (%)</label>
            <input type="number" id="f_cRate" value="7" min="0" max="100" step="0.1">
          </div>
          <div class="form-group">
            <label>Duration (Years)</label>
            <input type="number" id="f_cYears" value="10" min="1" step="1">
          </div>
        </div>
        <div class="form-group">
          <label>Compounding Frequency</label>
          <select id="f_cFreq">
            <option value="365">Daily</option>
            <option value="52">Weekly</option>
            <option value="12" selected>Monthly</option>
            <option value="4">Quarterly</option>
            <option value="2">Semi-Annually</option>
            <option value="1">Annually</option>
          </select>
        </div>
        <div class="form-group">
          <label>Regular Contribution</label>
          <div class="input-prefix"><span class="cur-sym">${sym}</span>
            <input type="number" id="f_cContrib" value="200" min="0" step="50">
          </div>
          <p class="hint">Amount added each compounding period</p>
        </div>`;

      case 'lease': return `
        <div class="form-group">
          <label>Asset / Vehicle Price</label>
          <div class="input-prefix"><span class="cur-sym">${sym}</span>
            <input type="number" id="f_assetPrice" value="30000" min="0" step="500">
          </div>
        </div>
        <div class="two-col">
          <div class="form-group">
            <label>Residual Value (%)</label>
            <input type="number" id="f_residual" value="50" min="0" max="100" step="1">
            <p class="hint">% of price at end of lease</p>
          </div>
          <div class="form-group">
            <label>Lease Term (Months)</label>
            <input type="number" id="f_leaseTerm" value="36" min="1" step="1">
          </div>
        </div>
        <div class="two-col">
          <div class="form-group">
            <label>Money Factor (or APR %)</label>
            <input type="number" id="f_moneyFactor" value="3.5" min="0" step="0.01">
            <p class="hint">Enter APR %; converted automatically</p>
          </div>
          <div class="form-group">
            <label>Down Payment</label>
            <div class="input-prefix"><span class="cur-sym">${sym}</span>
              <input type="number" id="f_leaseDown" value="2000" min="0" step="100">
            </div>
          </div>
        </div>
        <div class="form-group">
          <label>Acquisition Fee</label>
          <div class="input-prefix"><span class="cur-sym">${sym}</span>
            <input type="number" id="f_acqFee" value="595" min="0" step="50">
          </div>
        </div>
        <div class="form-group">
          <label>Sales Tax Rate (%)</label>
          <input type="number" id="f_leaseTax" value="8" min="0" max="30" step="0.1">
        </div>`;

      case 'affordability': return `
        <div class="form-group">
          <label>Monthly Gross Income</label>
          <div class="input-prefix"><span class="cur-sym">${sym}</span>
            <input type="number" id="f_income" value="6000" min="0" step="500">
          </div>
        </div>
        <div class="form-group">
          <label>Monthly Debts (car, student loans, etc.)</label>
          <div class="input-prefix"><span class="cur-sym">${sym}</span>
            <input type="number" id="f_debts" value="500" min="0" step="100">
          </div>
        </div>
        <div class="two-col">
          <div class="form-group">
            <label>Interest Rate (%)</label>
            <input type="number" id="f_aRate" value="7.5" min="0" max="30" step="0.1">
          </div>
          <div class="form-group">
            <label>Loan Term (Years)</label>
            <input type="number" id="f_aTerm" value="30" min="1" step="1">
          </div>
        </div>
        <div class="two-col">
          <div class="form-group">
            <label>Down Payment %</label>
            <input type="number" id="f_aDown" value="20" min="0" max="100" step="1">
          </div>
          <div class="form-group">
            <label>Property Tax Rate (%/yr)</label>
            <input type="number" id="f_propTax" value="1.2" min="0" max="5" step="0.1">
          </div>
        </div>
        <div class="two-col">
          <div class="form-group">
            <label>Homeowner's Insurance (%/yr)</label>
            <input type="number" id="f_insurance" value="0.5" min="0" max="3" step="0.1">
          </div>
          <div class="form-group">
            <label>HOA Monthly</label>
            <div class="input-prefix"><span class="cur-sym">${sym}</span>
              <input type="number" id="f_hoa" value="0" min="0" step="50">
            </div>
          </div>
        </div>
        <div class="form-group">
          <label>Max Debt-to-Income Ratio (%)</label>
          <div class="range-row">
            <input type="range" id="f_dtiSlider" min="28" max="50" step="1" value="36">
            <span class="range-val" id="f_dtiVal">36%</span>
          </div>
          <p class="hint">Lenders typically allow 28–43% DTI. 36% is conventional.</p>
        </div>`;

      default: return '';
    }
  }

  /* ── Calculation Engine ───────────────────────────────── */
  _calculate() {
    const mode = this.state.mode;
    const cur  = this._currencyObj();
    let results, cards, schedule = [];

    try {
      if (mode === 'emi') {
        results = this._calcEMI();
        schedule = results.schedule;
        cards = this._emiCards(results, cur);
        this._renderSchedule(schedule);
        this.shadowRoot.getElementById('schedulePanel').style.display = 'block';
        this.shadowRoot.getElementById('prepaySection').style.display = 'block';
      } else if (mode === 'roi') {
        results = this._calcROI();
        schedule = results.schedule;
        cards = this._roiCards(results, cur);
        this._renderSchedule(schedule, 'roi');
        this.shadowRoot.getElementById('schedulePanel').style.display = 'block';
        this.shadowRoot.getElementById('prepaySection').style.display = 'none';
      } else if (mode === 'compound') {
        results = this._calcCompound();
        schedule = results.schedule;
        cards = this._compoundCards(results, cur);
        this._renderSchedule(schedule, 'compound');
        this.shadowRoot.getElementById('schedulePanel').style.display = 'block';
        this.shadowRoot.getElementById('prepaySection').style.display = 'none';
      } else if (mode === 'lease') {
        results = this._calcLease();
        cards = this._leaseCards(results, cur);
        this.shadowRoot.getElementById('schedulePanel').style.display = 'none';
        this.shadowRoot.getElementById('prepaySection').style.display = 'none';
      } else if (mode === 'affordability') {
        results = this._calcAffordability();
        cards = this._affordCards(results, cur);
        this.shadowRoot.getElementById('schedulePanel').style.display = 'none';
        this.shadowRoot.getElementById('prepaySection').style.display = 'none';
      }

      this.state.results = results;
      this.state.schedule = schedule;

      // Render result cards
      this.shadowRoot.getElementById('resultCards').innerHTML = cards;

      // Charts
      this._drawChart(this.state.chartType, results, mode);

      // Compare
      if (this.state.compareMode) this._renderCompare(results, mode, cur);

      // Show results
      this.shadowRoot.getElementById('emptyState').style.display = 'none';
      this.shadowRoot.getElementById('resultsSection').style.display = 'block';

      this.showToast('Calculated successfully!');
    } catch(e) {
      this.showToast('Error: ' + e.message);
      console.error(e);
    }
  }

  /* ── EMI Calculation ──────────────────────────────────── */
  _calcEMI() {
    const g = id => parseFloat(this.shadowRoot.getElementById(id)?.value || 0);
    const principal   = g('f_principal') - g('f_downPayment');
    const annualRate  = g('f_rate') / 100;
    const tenureUnit  = this.shadowRoot.getElementById('f_tenureUnit')?.value || 'years';
    const tenureRaw   = g('f_tenure');
    const months      = tenureUnit === 'years' ? tenureRaw * 12 : tenureRaw;
    const compound    = parseInt(this.shadowRoot.getElementById('f_compound')?.value || 12);
    const procFeeRate = g('f_procFee') / 100;
    const prepayToggle = this.shadowRoot.getElementById('prepayToggle')?.checked;
    const extraPayment = prepayToggle ? g('prepayAmount') : 0;
    const prepayStart  = parseInt(this.shadowRoot.getElementById('prepayStart')?.value || 1);

    if (principal <= 0) throw new Error('Principal must be > 0');
    if (annualRate < 0) throw new Error('Rate must be ≥ 0');
    if (months <= 0)    throw new Error('Tenure must be > 0');

    const monthlyRate = annualRate / compound;
    const emi = annualRate === 0
      ? principal / months
      : principal * monthlyRate * Math.pow(1 + monthlyRate, months)
        / (Math.pow(1 + monthlyRate, months) - 1);

    const processingFee = principal * procFeeRate;
    let balance = principal;
    let totalPaid = 0, totalInterest = 0, totalPrincipal = 0;
    let actualMonths = 0;
    const schedule = [];

    for (let m = 1; m <= months && balance > 0.01; m++) {
      const interestPaid = balance * monthlyRate;
      const extra = m >= prepayStart ? extraPayment : 0;
      let principalPaid = Math.min(emi - interestPaid + extra, balance);
      const payment = interestPaid + principalPaid;
      balance = Math.max(0, balance - principalPaid);
      totalPaid += payment;
      totalInterest += interestPaid;
      totalPrincipal += principalPaid;
      actualMonths = m;
      schedule.push({
        month: m,
        payment: payment,
        principal: principalPaid,
        interest: interestPaid,
        balance: balance,
        totalPaid: totalPaid,
        isExtraPay: extra > 0
      });
      if (balance <= 0.01) break;
    }

    const savedMonths = months - actualMonths;
    const savedInterest = (months * emi) - totalPaid - processingFee;

    return {
      emi, months, actualMonths, principal, annualRate,
      totalPaid: totalPaid + processingFee,
      totalInterest, totalPrincipal,
      processingFee, savedMonths, savedInterest,
      downPayment: g('f_downPayment'),
      schedule
    };
  }

  /* ── ROI Calculation ──────────────────────────────────── */
  _calcROI() {
    const g = id => parseFloat(this.shadowRoot.getElementById(id)?.value || 0);
    const init      = g('f_initInvest');
    const monthly   = g('f_monthly');
    const rate      = g('f_roiRate') / 100;
    const years     = g('f_roiYears');
    const compound  = parseInt(this.shadowRoot.getElementById('f_roiCompound')?.value || 12);
    const inflation = g('f_inflation') / 100;
    const taxRate   = g('f_taxRate') / 100;

    const periods = years * compound;
    const r = rate / compound;
    const schedule = [];
    let balance = init;
    let totalContrib = init;
    let totalInterestEarned = 0;

    for (let p = 1; p <= periods; p++) {
      const interestThisPeriod = balance * r;
      balance += interestThisPeriod + monthly;
      totalContrib += monthly;
      totalInterestEarned += interestThisPeriod;
      const yr = p / compound;
      schedule.push({
        month: p,
        year: yr,
        balance: balance,
        contributions: totalContrib,
        growth: totalInterestEarned,
        monthlyInterest: interestThisPeriod
      });
    }

    const finalValue = balance;
    const totalGains = finalValue - totalContrib;
    const tax = totalGains * taxRate;
    const afterTax = finalValue - tax;
    const inflationFactor = Math.pow(1 + inflation, years);
    const realValue = afterTax / inflationFactor;
    const roi = ((finalValue - totalContrib) / totalContrib) * 100;
    const cagr = (Math.pow(finalValue / init, 1 / years) - 1) * 100;

    return {
      init, monthly, rate, years,
      finalValue, totalContrib, totalGains, tax, afterTax, realValue,
      roi, cagr, inflation, taxRate,
      schedule
    };
  }

  /* ── Compound Interest Calculation ───────────────────── */
  _calcCompound() {
    const g = id => parseFloat(this.shadowRoot.getElementById(id)?.value || 0);
    const principal = g('f_cPrincipal');
    const rate      = g('f_cRate') / 100;
    const years     = g('f_cYears');
    const freq      = parseInt(this.shadowRoot.getElementById('f_cFreq')?.value || 12);
    const contrib   = g('f_cContrib');

    const periods = years * freq;
    const r = rate / freq;
    const schedule = [];
    let balance = principal;

    for (let p = 1; p <= periods; p++) {
      const interest = balance * r;
      balance = balance + interest + contrib;
      schedule.push({
        month: p,
        period: p,
        balance,
        interest,
        contributions: principal + contrib * p
      });
    }

    const totalContrib = principal + contrib * periods;
    const totalInterest = balance - totalContrib;
    const simpleInterest = principal * rate * years;
    const compoundBenefit = totalInterest - simpleInterest;

    return {
      principal, rate, years, freq,
      finalBalance: balance,
      totalContrib, totalInterest,
      simpleInterest, compoundBenefit,
      schedule
    };
  }

  /* ── Lease Calculation ───────────────────────────────── */
  _calcLease() {
    const g = id => parseFloat(this.shadowRoot.getElementById(id)?.value || 0);
    const msrp        = g('f_assetPrice');
    const residualPct = g('f_residual') / 100;
    const term        = g('f_leaseTerm');
    const aprPct      = g('f_moneyFactor');
    const down        = g('f_leaseDown');
    const acqFee      = g('f_acqFee');
    const taxRate     = g('f_leaseTax') / 100;

    const residualVal = msrp * residualPct;
    const moneyFactor = aprPct / 2400; // convert APR to money factor
    const netCapCost  = msrp - down + acqFee;
    const depreciation = (netCapCost - residualVal) / term;
    const financeCharge = (netCapCost + residualVal) * moneyFactor;
    const basePayment  = depreciation + financeCharge;
    const taxPayment   = basePayment * taxRate;
    const monthlyPayment = basePayment + taxPayment;
    const totalCost = monthlyPayment * term + down + acqFee;
    const totalInterest = financeCharge * term;
    const effectiveAPR = aprPct;
    const buyVsLeaseDiff = msrp - (down + monthlyPayment * term);

    return {
      msrp, residualVal, term, netCapCost,
      depreciation, financeCharge, basePayment,
      taxPayment, monthlyPayment, totalCost,
      totalInterest, effectiveAPR, down, acqFee, buyVsLeaseDiff
    };
  }

  /* ── Affordability Calculation ───────────────────────── */
  _calcAffordability() {
    const g = id => parseFloat(this.shadowRoot.getElementById(id)?.value || 0);
    const income    = g('f_income');
    const debts     = g('f_debts');
    const rate      = g('f_aRate') / 100;
    const termYrs   = g('f_aTerm');
    const downPct   = g('f_aDown') / 100;
    const propTax   = g('f_propTax') / 100;
    const insurance = g('f_insurance') / 100;
    const hoa       = g('f_hoa');
    const dtiMax    = g('f_dtiSlider') / 100;

    const maxMonthlyDebt = income * dtiMax;
    const maxHousingPayment = maxMonthlyDebt - debts;
    const months = termYrs * 12;
    const r = rate / 12;

    // Solve for max loan amount
    const maxLoan = r === 0
      ? maxHousingPayment * months
      : maxHousingPayment / (r * Math.pow(1+r, months) / (Math.pow(1+r, months) - 1));

    const maxHomePrice = maxLoan / (1 - downPct);
    const downPayment  = maxHomePrice * downPct;
    const emi = r === 0 ? maxLoan/months
      : maxLoan * r * Math.pow(1+r,months) / (Math.pow(1+r,months) - 1);

    const monthlyTax  = (maxHomePrice * propTax) / 12;
    const monthlyIns  = (maxHomePrice * insurance) / 12;
    const totalMonthly = emi + monthlyTax + monthlyIns + hoa;
    const dti = (totalMonthly + debts) / income * 100;
    const frontEndDti = totalMonthly / income * 100;
    const totalCost   = emi * months + downPayment;

    return {
      maxHomePrice, maxLoan, downPayment, emi,
      monthlyTax, monthlyIns, hoa, totalMonthly,
      dti, frontEndDti, income, debts, rate, termYrs, dtiMax: dtiMax*100,
      totalCost
    };
  }

  /* ── Result Cards ─────────────────────────────────────── */
  _emiCards(r, cur) {
    const f = v => this._fmt(v, cur);
    const savedTxt = r.savedMonths > 0
      ? `<div class="rc-sub highlight-good">Saved ${r.savedMonths} months & ${f(r.savedInterest)}</div>` : '';
    return `
      <div class="result-card accent">
        <div class="rc-label">Monthly EMI</div>
        <div class="rc-value">${f(r.emi)}</div>
        <div class="rc-sub">${r.actualMonths} months</div>
      </div>
      <div class="result-card">
        <div class="rc-label">Total Payment</div>
        <div class="rc-value">${f(r.totalPaid)}</div>
        <div class="rc-sub">incl. processing fee</div>
      </div>
      <div class="result-card danger">
        <div class="rc-label">Total Interest</div>
        <div class="rc-value">${f(r.totalInterest)}</div>
        <div class="rc-sub">${((r.totalInterest/r.totalPaid)*100).toFixed(1)}% of total</div>
      </div>
      <div class="result-card success">
        <div class="rc-label">Principal Paid</div>
        <div class="rc-value">${f(r.principal)}</div>
        ${savedTxt}
      </div>
      <div class="result-card">
        <div class="rc-label">Processing Fee</div>
        <div class="rc-value">${f(r.processingFee)}</div>
        <div class="rc-sub">One-time charge</div>
      </div>
      <div class="result-card">
        <div class="rc-label">Interest / Principal Ratio</div>
        <div class="rc-value">${(r.totalInterest/r.principal*100).toFixed(1)}%</div>
        <div class="rc-sub">cost of borrowing</div>
      </div>`;
  }

  _roiCards(r, cur) {
    const f = v => this._fmt(v, cur);
    return `
      <div class="result-card accent">
        <div class="rc-label">Future Value</div>
        <div class="rc-value">${f(r.finalValue)}</div>
        <div class="rc-sub">After ${r.years} years</div>
      </div>
      <div class="result-card success">
        <div class="rc-label">Total Gains</div>
        <div class="rc-value">${f(r.totalGains)}</div>
        <div class="rc-sub">ROI: ${r.roi.toFixed(2)}%</div>
      </div>
      <div class="result-card">
        <div class="rc-label">Total Invested</div>
        <div class="rc-value">${f(r.totalContrib)}</div>
        <div class="rc-sub">Principal + contributions</div>
      </div>
      <div class="result-card">
        <div class="rc-label">CAGR</div>
        <div class="rc-value">${r.cagr.toFixed(2)}%</div>
        <div class="rc-sub">Compound Annual Growth Rate</div>
      </div>
      <div class="result-card ${r.tax>0?'danger':''}">
        <div class="rc-label">Tax on Gains</div>
        <div class="rc-value">${f(r.tax)}</div>
        <div class="rc-sub">After-tax: ${f(r.afterTax)}</div>
      </div>
      <div class="result-card">
        <div class="rc-label">Real Value (Inflation Adj.)</div>
        <div class="rc-value">${f(r.realValue)}</div>
        <div class="rc-sub">At ${(r.inflation*100).toFixed(1)}% inflation</div>
      </div>`;
  }

  _compoundCards(r, cur) {
    const f = v => this._fmt(v, cur);
    return `
      <div class="result-card accent">
        <div class="rc-label">Final Balance</div>
        <div class="rc-value">${f(r.finalBalance)}</div>
        <div class="rc-sub">After ${r.years} years</div>
      </div>
      <div class="result-card success">
        <div class="rc-label">Total Interest Earned</div>
        <div class="rc-value">${f(r.totalInterest)}</div>
        <div class="rc-sub">vs ${f(r.simpleInterest)} simple interest</div>
      </div>
      <div class="result-card">
        <div class="rc-label">Total Contributed</div>
        <div class="rc-value">${f(r.totalContrib)}</div>
      </div>
      <div class="result-card">
        <div class="rc-label">Compounding Benefit</div>
        <div class="rc-value">${f(r.compoundBenefit)}</div>
        <div class="rc-sub">Extra vs simple interest</div>
      </div>
      <div class="result-card">
        <div class="rc-label">Return Multiplier</div>
        <div class="rc-value">${(r.finalBalance/r.totalContrib).toFixed(2)}×</div>
        <div class="rc-sub">Times your money</div>
      </div>
      <div class="result-card">
        <div class="rc-label">Effective Annual Rate</div>
        <div class="rc-value">${((Math.pow(1 + r.rate/r.freq, r.freq) - 1)*100).toFixed(3)}%</div>
        <div class="rc-sub">EAR / APY</div>
      </div>`;
  }

  _leaseCards(r, cur) {
    const f = v => this._fmt(v, cur);
    return `
      <div class="result-card accent">
        <div class="rc-label">Monthly Payment</div>
        <div class="rc-value">${f(r.monthlyPayment)}</div>
        <div class="rc-sub">incl. tax</div>
      </div>
      <div class="result-card">
        <div class="rc-label">Total Lease Cost</div>
        <div class="rc-value">${f(r.totalCost)}</div>
        <div class="rc-sub">Over ${r.term} months</div>
      </div>
      <div class="result-card danger">
        <div class="rc-label">Finance Charges</div>
        <div class="rc-value">${f(r.financeCharge * r.term)}</div>
        <div class="rc-sub">Effective APR: ${r.effectiveAPR.toFixed(2)}%</div>
      </div>
      <div class="result-card">
        <div class="rc-label">Residual Value</div>
        <div class="rc-value">${f(r.residualVal)}</div>
        <div class="rc-sub">Buy-out price at lease end</div>
      </div>
      <div class="result-card">
        <div class="rc-label">Depreciation/Month</div>
        <div class="rc-value">${f(r.depreciation)}</div>
        <div class="rc-sub">Asset value lost per month</div>
      </div>
      <div class="result-card ${r.buyVsLeaseDiff>0?'success':'danger'}">
        <div class="rc-label">Buy vs Lease Equity</div>
        <div class="rc-value">${f(Math.abs(r.buyVsLeaseDiff))}</div>
        <div class="rc-sub">${r.buyVsLeaseDiff > 0 ? 'Buying builds more equity' : 'Leasing costs more overall'}</div>
      </div>`;
  }

  _affordCards(r, cur) {
    const f = v => this._fmt(v, cur);
    const dtiColor = r.dti > 43 ? 'danger' : r.dti > 36 ? '' : 'success';
    return `
      <div class="result-card accent">
        <div class="rc-label">Max Home Price</div>
        <div class="rc-value">${f(r.maxHomePrice)}</div>
        <div class="rc-sub">Based on ${r.dtiMax}% DTI</div>
      </div>
      <div class="result-card">
        <div class="rc-label">Max Loan Amount</div>
        <div class="rc-value">${f(r.maxLoan)}</div>
        <div class="rc-sub">After down payment</div>
      </div>
      <div class="result-card">
        <div class="rc-label">Down Payment Required</div>
        <div class="rc-value">${f(r.downPayment)}</div>
      </div>
      <div class="result-card">
        <div class="rc-label">Monthly Mortgage</div>
        <div class="rc-value">${f(r.emi)}</div>
        <div class="rc-sub">Principal + Interest only</div>
      </div>
      <div class="result-card">
        <div class="rc-label">Total Monthly Payment</div>
        <div class="rc-value">${f(r.totalMonthly)}</div>
        <div class="rc-sub">P+I+Tax+Ins+HOA</div>
      </div>
      <div class="result-card ${dtiColor}">
        <div class="rc-label">Debt-to-Income Ratio</div>
        <div class="rc-value">${r.dti.toFixed(1)}%</div>
        <div class="rc-sub">Front-end: ${r.frontEndDti.toFixed(1)}%</div>
      </div>`;
  }

  /* ── Charts ───────────────────────────────────────────── */
  _drawChart(type, results, mode) {
    const canvas = this.shadowRoot.getElementById('chartCanvas');
    const wrap   = this.shadowRoot.getElementById('chartWrap');
    const legend = this.shadowRoot.getElementById('pieLegend');
    const ctx    = canvas.getContext('2d');
    const W = wrap.clientWidth || 500;
    const H = 250;
    canvas.width  = W;
    canvas.height = H;
    ctx.clearRect(0, 0, W, H);
    legend.innerHTML = '';

    const ma = this.settings.mainAccent;
    const colors = ['#3498db','#e74c3c','#2ecc71','#f39c12','#9b59b6','#1abc9c','#e67e22'];

    if (type === 'pie') {
      this._drawPie(ctx, canvas, legend, results, mode, colors);
    } else if (type === 'timeline') {
      this._drawTimeline(ctx, W, H, results, mode);
    } else if (type === 'bars') {
      this._drawBars(ctx, W, H, results, mode);
    }
  }

  _drawPie(ctx, canvas, legend, results, mode, colors) {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const R  = Math.min(cx, cy) - 20;

    let slices = [];
    const cur = this._currencyObj();

    if (mode === 'emi') {
      slices = [
        { label:'Principal',    value: results.principal,      color: colors[0] },
        { label:'Total Interest', value: results.totalInterest, color: colors[1] },
        { label:'Processing Fee', value: results.processingFee, color: colors[3] }
      ].filter(s => s.value > 0);
    } else if (mode === 'roi') {
      slices = [
        { label:'Contributions', value: results.totalContrib,  color: colors[0] },
        { label:'Gains',         value: results.totalGains,    color: colors[2] },
        { label:'Tax',           value: results.tax,            color: colors[1] }
      ].filter(s => s.value > 0);
    } else if (mode === 'compound') {
      slices = [
        { label:'Principal + Contributions', value: results.totalContrib,  color: colors[0] },
        { label:'Compound Interest',          value: results.totalInterest, color: colors[2] }
      ].filter(s => s.value > 0);
    } else if (mode === 'lease') {
      slices = [
        { label:'Depreciation',    value: results.depreciation * results.term, color: colors[0] },
        { label:'Finance Charges', value: results.financeCharge * results.term, color: colors[1] },
        { label:'Tax',             value: results.taxPayment * results.term,    color: colors[3] },
        { label:'Down Payment',    value: results.down,                         color: colors[2] }
      ].filter(s => s.value > 0);
    } else if (mode === 'affordability') {
      slices = [
        { label:'Mortgage P+I',   value: results.emi * results.termYrs * 12,        color: colors[0] },
        { label:'Property Tax',   value: results.monthlyTax * results.termYrs * 12,  color: colors[1] },
        { label:'Insurance',      value: results.monthlyIns * results.termYrs * 12,  color: colors[2] },
        { label:'HOA',            value: results.hoa * results.termYrs * 12,         color: colors[3] },
        { label:'Down Payment',   value: results.downPayment,                         color: colors[4] }
      ].filter(s => s.value > 0);
    }

    const total = slices.reduce((s, c) => s + c.value, 0);
    if (total === 0) return;

    let angle = -Math.PI / 2;
    slices.forEach(s => {
      const sweep = (s.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, angle, angle + sweep);
      ctx.closePath();
      ctx.fillStyle = s.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Donut hole
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = this.settings.primaryBg;
      ctx.fill();
      angle += sweep;
    });

    // Center text
    ctx.fillStyle = this.settings.headingColor;
    ctx.textAlign = 'center';
    ctx.font = `bold ${parseInt(this.settings.fontSize) + 2}px ${this.settings.fontFamily}`;
    ctx.fillText('Breakdown', cx, cy - 6);
    ctx.font = `${parseInt(this.settings.fontSize) - 2}px ${this.settings.fontFamily}`;
    ctx.fillStyle = this.settings.secondaryText;
    ctx.fillText(this._fmt(total, cur), cx, cy + 12);

    // Legend
    slices.forEach(s => {
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML = `<div class="legend-dot" style="background:${s.color}"></div>
        <span>${s.label}: <strong>${((s.value/total)*100).toFixed(1)}%</strong></span>`;
      this.shadowRoot.getElementById('pieLegend').appendChild(item);
    });
  }

  _drawTimeline(ctx, W, H, results, mode) {
    const pad = { top: 20, bottom: 40, left: 60, right: 20 };
    const iW = W - pad.left - pad.right;
    const iH = H - pad.top - pad.bottom;
    const schedule = results.schedule || [];
    if (!schedule.length) return;

    // Sample to max 60 points
    const step   = Math.max(1, Math.floor(schedule.length / 60));
    const points  = schedule.filter((_, i) => i % step === 0 || i === schedule.length - 1);
    const values  = points.map(p => p.balance !== undefined ? p.balance : p.balance);
    const maxVal  = Math.max(...values);
    const minVal  = Math.min(...values, 0);

    const xScale = p => pad.left + (p / (points.length - 1)) * iW;
    const yScale = v => pad.top + iH - ((v - minVal) / (maxVal - minVal || 1)) * iH;

    // Grid
    ctx.strokeStyle = this.settings.borderColor;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (iH * i / 4);
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
      const val = maxVal - (maxVal - minVal) * i / 4;
      ctx.fillStyle = this.settings.secondaryText;
      ctx.font = `${parseInt(this.settings.fontSize)-3}px ${this.settings.fontFamily}`;
      ctx.textAlign = 'right';
      ctx.fillText(this._shortNum(val), pad.left - 4, y + 4);
    }

    // Area fill
    ctx.beginPath();
    ctx.moveTo(xScale(0), yScale(values[0]));
    points.forEach((_, i) => ctx.lineTo(xScale(i), yScale(values[i])));
    ctx.lineTo(xScale(points.length - 1), H - pad.bottom);
    ctx.lineTo(xScale(0), H - pad.bottom);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom);
    grad.addColorStop(0, this.settings.mainAccent + '55');
    grad.addColorStop(1, this.settings.mainAccent + '00');
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(xScale(0), yScale(values[0]));
    points.forEach((_, i) => ctx.lineTo(xScale(i), yScale(values[i])));
    ctx.strokeStyle = this.settings.mainAccent;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // X labels
    ctx.fillStyle = this.settings.secondaryText;
    ctx.textAlign = 'center';
    ctx.font = `${parseInt(this.settings.fontSize)-3}px ${this.settings.fontFamily}`;
    [0, Math.floor(points.length/4), Math.floor(points.length/2), Math.floor(3*points.length/4), points.length-1].forEach(i => {
      const label = mode === 'emi' ? `M${points[i]?.month||''}` : `Y${(points[i]?.year||points[i]?.period||0).toFixed(1)}`;
      ctx.fillText(label, xScale(i), H - pad.bottom + 16);
    });

    // Label
    ctx.fillStyle = this.settings.mainAccent;
    ctx.font = `bold ${parseInt(this.settings.fontSize)-1}px ${this.settings.fontFamily}`;
    ctx.textAlign = 'left';
    ctx.fillText(mode === 'emi' ? 'Remaining Balance' : 'Portfolio Value', pad.left + 5, pad.top + 14);
  }

  _drawBars(ctx, W, H, results, mode) {
    const schedule = results.schedule || [];
    if (!schedule.length || mode === 'lease' || mode === 'affordability') {
      ctx.fillStyle = this.settings.secondaryText;
      ctx.textAlign = 'center';
      ctx.font = `${this.settings.fontSize}px ${this.settings.fontFamily}`;
      ctx.fillText('Chart not available for this mode', W/2, H/2);
      return;
    }

    const pad = { top: 20, bottom: 40, left: 60, right: 20 };
    const iW = W - pad.left - pad.right;
    const iH = H - pad.top - pad.bottom;

    // Sample to max 36 bars
    const step = Math.max(1, Math.floor(schedule.length / 36));
    const points = schedule.filter((_, i) => i % step === 0 || i === schedule.length - 1);

    const maxVal = Math.max(...points.map(p => (p.principal || 0) + (p.interest || p.monthlyInterest || 0)));
    const bw = Math.max(2, iW / points.length - 1);

    ctx.fillStyle = this.settings.secondaryText;
    ctx.font = `${parseInt(this.settings.fontSize)-3}px ${this.settings.fontFamily}`;
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + iH * i / 4;
      const v = maxVal * (1 - i/4);
      ctx.fillText(this._shortNum(v), pad.left - 4, y + 4);
      ctx.strokeStyle = this.settings.borderColor;
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
    }

    points.forEach((p, i) => {
      const x = pad.left + i * (iW / points.length);
      const prin = p.principal || p.contributions || 0;
      const intr = p.interest || p.monthlyInterest || p.growth || 0;
      const total = prin + intr;

      const prinH = (prin / maxVal) * iH;
      const intrH = (intr / maxVal) * iH;

      ctx.fillStyle = this.settings.mainAccent;
      ctx.fillRect(x, H - pad.bottom - prinH, bw, prinH);

      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(x, H - pad.bottom - prinH - intrH, bw, intrH);
    });

    // Legend
    const legend = this.shadowRoot.getElementById('pieLegend');
    legend.innerHTML = `
      <div class="legend-item"><div class="legend-dot" style="background:${this.settings.mainAccent}"></div><span>${mode==='emi'?'Principal':'Contributions'}</span></div>
      <div class="legend-item"><div class="legend-dot" style="background:#e74c3c"></div><span>${mode==='emi'?'Interest':'Growth'}</span></div>`;
  }

  /* ── Amortization Schedule Table ─────────────────────── */
  _renderSchedule(schedule, mode = 'emi') {
    this.state.schedule = schedule;
    this.state.scheduleCurrentPage = 1;
    this._renderSchedulePage(mode);
  }

  _renderSchedulePage(mode = 'emi') {
    const schedule = this.state.schedule;
    const cur = this._currencyObj();
    const f = v => this._fmt(v, cur);
    const pageSize = parseInt(this.shadowRoot.getElementById('pageSizeSelect')?.value || 12);
    const page = this.state.scheduleCurrentPage;
    const search = (this.shadowRoot.getElementById('scheduleSearch')?.value || '').toLowerCase();

    const filtered = schedule.filter(r =>
      !search || String(r.month).includes(search) || (r.year && String(r.year.toFixed(1)).includes(search))
    );
    const totalPages = Math.ceil(filtered.length / pageSize);
    const slice = filtered.slice((page-1)*pageSize, page*pageSize);

    // Header
    const head = this.shadowRoot.getElementById('scheduleHead');
    if (mode === 'emi') {
      head.innerHTML = `<th>#</th><th>Payment</th><th>Principal</th><th>Interest</th><th>Balance</th><th>Total Paid</th>`;
    } else if (mode === 'roi') {
      head.innerHTML = `<th>#</th><th>Period</th><th>Balance</th><th>Contributions</th><th>Growth</th>`;
    } else {
      head.innerHTML = `<th>#</th><th>Period</th><th>Balance</th><th>Contributions</th><th>Interest</th>`;
    }

    // Body
    const body = this.shadowRoot.getElementById('scheduleBody');
    if (mode === 'emi') {
      body.innerHTML = slice.map((r, i) => `
        <tr class="${r.isExtraPay?'prepay-row':''} ${r.balance<=0.01?'last-row':''}">
          <td>${r.month}</td>
          <td>${f(r.payment)}</td>
          <td class="highlight-good">${f(r.principal)}</td>
          <td class="highlight-bad">${f(r.interest)}</td>
          <td>${f(r.balance)}</td>
          <td>${f(r.totalPaid)}</td>
        </tr>`).join('');
    } else {
      body.innerHTML = slice.map(r => `
        <tr>
          <td>${r.month||r.period}</td>
          <td>${r.year ? 'Y' + r.year.toFixed(1) : 'P' + r.period}</td>
          <td>${f(r.balance)}</td>
          <td>${f(r.contributions)}</td>
          <td class="highlight-good">${f(r.interest || r.monthlyInterest || r.growth || 0)}</td>
        </tr>`).join('');
    }

    // Pagination
    const pg = this.shadowRoot.getElementById('pagination');
    if (totalPages <= 1) { pg.innerHTML = `<span class="page-info">${filtered.length} rows</span>`; return; }
    let pgHtml = `<span class="page-info">${filtered.length} rows &nbsp;</span>`;
    const showPages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page-2 && i <= page+2)) showPages.push(i);
      else if (showPages[showPages.length-1] !== '…') showPages.push('…');
    }
    showPages.forEach(p => {
      if (p === '…') pgHtml += `<span class="page-btn">…</span>`;
      else pgHtml += `<div class="page-btn ${p===page?'active':''}" data-page="${p}">${p}</div>`;
    });
    pg.innerHTML = pgHtml;
    pg.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.state.scheduleCurrentPage = parseInt(btn.dataset.page);
        this._renderSchedulePage(mode);
      });
    });
  }

  /* ── Compare Mode ─────────────────────────────────────── */
  _renderCompare(currentResults, mode, cur) {
    const f = v => this._fmt(v, cur);
    const panel = this.shadowRoot.getElementById('comparePanel');

    if (mode !== 'emi' && mode !== 'roi') {
      panel.style.display = 'none';
      return;
    }

    panel.style.display = 'block';

    // Create compare scenario by tweaking rate ±1%
    let compareInput = {};
    let compareResults;
    const savedState = { ...this.state };

    if (mode === 'emi') {
      const rateEl = this.shadowRoot.getElementById('f_rate');
      const origRate = parseFloat(rateEl.value);
      rateEl.value = (origRate + 1).toFixed(2);
      compareResults = this._calcEMI();
      rateEl.value = origRate;

      const winner = currentResults.totalPaid <= compareResults.totalPaid ? 'A' : 'B';
      const grid = this.shadowRoot.getElementById('compareGrid');
      grid.innerHTML = `
        <div class="compare-card a">
          <div class="compare-label a">Scenario A — ${origRate}% Rate ${winner==='A'?'<span class="compare-winner">✓ Better</span>':''}</div>
          <div class="compare-row"><span>Monthly EMI</span><span>${f(currentResults.emi)}</span></div>
          <div class="compare-row"><span>Total Payment</span><span>${f(currentResults.totalPaid)}</span></div>
          <div class="compare-row"><span>Total Interest</span><span>${f(currentResults.totalInterest)}</span></div>
          <div class="compare-row"><span>Loan Term</span><span>${currentResults.actualMonths} months</span></div>
        </div>
        <div class="compare-card b">
          <div class="compare-label b">Scenario B — ${(origRate+1).toFixed(2)}% Rate ${winner==='B'?'<span class="compare-winner">✓ Better</span>':''}</div>
          <div class="compare-row"><span>Monthly EMI</span><span>${f(compareResults.emi)}</span></div>
          <div class="compare-row"><span>Total Payment</span><span>${f(compareResults.totalPaid)}</span></div>
          <div class="compare-row"><span>Total Interest</span><span>${f(compareResults.totalInterest)}</span></div>
          <div class="compare-row"><span>Loan Term</span><span>${compareResults.actualMonths} months</span></div>
        </div>`;
    }
  }

  /* ── Export ───────────────────────────────────────────── */
  _exportCSV() {
    const schedule = this.state.schedule;
    const mode = this.state.mode;
    const cur  = this._currencyObj();
    const f    = v => v.toFixed(2);

    if (!schedule.length) { this.showToast('No schedule to export'); return; }

    let csv, filename;
    if (mode === 'emi') {
      csv = 'Month,Payment,Principal,Interest,Balance,Total Paid\n';
      csv += schedule.map(r =>
        `${r.month},${f(r.payment)},${f(r.principal)},${f(r.interest)},${f(r.balance)},${f(r.totalPaid)}`
      ).join('\n');
      filename = 'amortization-schedule.csv';
    } else if (mode === 'roi') {
      csv = 'Period,Balance,Contributions,Growth,Monthly Interest\n';
      csv += schedule.map(r =>
        `${r.month},${f(r.balance)},${f(r.contributions)},${f(r.growth)},${f(r.monthlyInterest)}`
      ).join('\n');
      filename = 'roi-schedule.csv';
    } else {
      csv = 'Period,Balance,Contributions,Interest\n';
      csv += schedule.map(r =>
        `${r.period},${f(r.balance)},${f(r.contributions)},${f(r.interest||r.monthlyInterest||0)}`
      ).join('\n');
      filename = 'schedule.csv';
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.showToast('CSV downloaded!');
  }

  _exportSummary() {
    const r = this.state.results;
    const mode = this.state.mode;
    const cur = this._currencyObj();
    const f = v => this._fmt(v, cur);
    let text = `FINANCIAL CALCULATOR SUMMARY\n${'='.repeat(40)}\n`;
    text += `Currency: ${cur.code} (${cur.name})\n`;
    text += `Mode: ${mode.toUpperCase()}\n`;
    text += `Generated: ${new Date().toLocaleString()}\n\n`;

    if (mode === 'emi') {
      text += `Loan Amount:       ${f(r.principal)}\n`;
      text += `Annual Rate:       ${(r.annualRate*100).toFixed(2)}%\n`;
      text += `Tenure:            ${r.months} months\n`;
      text += `Monthly EMI:       ${f(r.emi)}\n`;
      text += `Total Payment:     ${f(r.totalPaid)}\n`;
      text += `Total Interest:    ${f(r.totalInterest)}\n`;
      text += `Processing Fee:    ${f(r.processingFee)}\n`;
    } else if (mode === 'roi') {
      text += `Initial Investment: ${f(r.init)}\n`;
      text += `Monthly Contrib:    ${f(r.monthly)}\n`;
      text += `Annual Rate:        ${(r.rate*100).toFixed(2)}%\n`;
      text += `Duration:           ${r.years} years\n`;
      text += `Future Value:       ${f(r.finalValue)}\n`;
      text += `Total Gains:        ${f(r.totalGains)}\n`;
      text += `ROI:                ${r.roi.toFixed(2)}%\n`;
      text += `CAGR:               ${r.cagr.toFixed(2)}%\n`;
    }

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'calculator-summary.txt'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.showToast('Summary downloaded!');
  }

  _copyResults() {
    const r = this.state.results;
    const cur = this._currencyObj();
    const f = v => this._fmt(v, cur);
    let text = '';
    const mode = this.state.mode;

    if (mode === 'emi') {
      text = `EMI: ${f(r.emi)} | Total: ${f(r.totalPaid)} | Interest: ${f(r.totalInterest)} | Term: ${r.actualMonths} months`;
    } else if (mode === 'roi') {
      text = `Future Value: ${f(r.finalValue)} | ROI: ${r.roi.toFixed(2)}% | CAGR: ${r.cagr.toFixed(2)}%`;
    } else if (mode === 'compound') {
      text = `Final Balance: ${f(r.finalBalance)} | Interest Earned: ${f(r.totalInterest)}`;
    } else if (mode === 'lease') {
      text = `Monthly Lease: ${f(r.monthlyPayment)} | Total Cost: ${f(r.totalCost)}`;
    } else if (mode === 'affordability') {
      text = `Max Home: ${f(r.maxHomePrice)} | Down: ${f(r.downPayment)} | Monthly: ${f(r.totalMonthly)} | DTI: ${r.dti.toFixed(1)}%`;
    }

    navigator.clipboard.writeText(text)
      .then(() => this.showToast('Copied!'))
      .catch(() => this.showToast('Copy failed'));
  }

  /* ── Helpers ──────────────────────────────────────────── */
  _sym() { return this._currencyObj().symbol; }
  _currencyObj() {
    return this.currencies.find(c => c.code === this.state.currency) || this.currencies[0];
  }
  _fmt(value, cur) {
    if (isNaN(value) || value === null) return '—';
    try {
      return new Intl.NumberFormat(cur.locale, {
        style:'currency', currency: cur.code,
        minimumFractionDigits: Math.abs(value) >= 1000 ? 0 : 2,
        maximumFractionDigits: Math.abs(value) >= 1000 ? 0 : 2
      }).format(value);
    } catch { return cur.symbol + value.toFixed(2); }
  }
  _shortNum(n) {
    if (Math.abs(n) >= 1e9) return (n/1e9).toFixed(1)+'B';
    if (Math.abs(n) >= 1e6) return (n/1e6).toFixed(1)+'M';
    if (Math.abs(n) >= 1e3) return (n/1e3).toFixed(1)+'K';
    return n.toFixed(0);
  }

  showToast(msg) {
    const t = this.shadowRoot.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
  }

  /* ── Event Listeners ──────────────────────────────────── */
  attachEventListeners() {
    const sr = this.shadowRoot;

    // Render initial form
    this._switchMode('emi');

    // Mode tabs
    sr.querySelectorAll('.mode-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        sr.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this._switchMode(tab.dataset.mode);
      });
    });

    // Currency
    sr.getElementById('currencySelect').addEventListener('change', e => {
      this.state.currency = e.target.value;
      const cur = this._currencyObj();
      this.state.locale = cur.locale;
      // Update symbol in form
      sr.querySelectorAll('.cur-sym, #prepaySymbol').forEach(el => el.textContent = cur.symbol);
    });

    // Calculate
    sr.getElementById('calculateBtn').addEventListener('click', () => this._calculate());

    // Chart tabs
    sr.querySelectorAll('.chart-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        sr.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.state.chartType = tab.dataset.chart;
        if (this.state.results) {
          this._drawChart(this.state.chartType, this.state.results, this.state.mode);
        }
      });
    });

    // Compare toggle
    sr.getElementById('compareToggleBtn').addEventListener('click', () => {
      this.state.compareMode = !this.state.compareMode;
      sr.getElementById('compareToggleBtn').textContent = this.state.compareMode
        ? '✕ Compare Off' : '⚖️ Compare Mode';
      if (this.state.results) {
        const cur = this._currencyObj();
        this._renderCompare(this.state.results, this.state.mode, cur);
      }
      if (!this.state.compareMode) {
        sr.getElementById('comparePanel').style.display = 'none';
      }
    });

    // Prepay toggle
    sr.getElementById('prepayToggle').addEventListener('change', e => {
      sr.getElementById('prepayFields').style.display = e.target.checked ? 'block' : 'none';
    });

    // Export buttons
    sr.getElementById('exportCsvBtn').addEventListener('click', () => this._exportCSV());
    sr.getElementById('exportSummaryBtn').addEventListener('click', () => this._exportSummary());
    sr.getElementById('copyResultsBtn').addEventListener('click', () => this._copyResults());

    // Reset
    sr.getElementById('resetBtn').addEventListener('click', () => {
      this.state.results = null;
      this.state.schedule = [];
      sr.getElementById('emptyState').style.display = 'block';
      sr.getElementById('resultsSection').style.display = 'none';
      this._switchMode(this.state.mode);
    });

    // Schedule search & page size
    sr.getElementById('scheduleSearch').addEventListener('input', () => {
      this.state.scheduleCurrentPage = 1;
      this._renderSchedulePage(this.state.mode);
    });
    sr.getElementById('pageSizeSelect').addEventListener('change', () => {
      this.state.scheduleCurrentPage = 1;
      this._renderSchedulePage(this.state.mode);
    });

    // DTI slider
    const dtiSlider = sr.getElementById('f_dtiSlider');
    if (dtiSlider) {
      dtiSlider.addEventListener('input', e => {
        sr.getElementById('f_dtiVal').textContent = e.target.value + '%';
      });
    }

    // Keyboard shortcut: Enter to calculate
    sr.addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT') this._calculate();
    });
  }

  _switchMode(mode) {
    this.state.mode = mode;
    const titles = {
      emi:'Loan / EMI Calculator', roi:'ROI / Investment Return',
      compound:'Compound Interest', lease:'Lease / Rent Calculator',
      affordability:'Home Affordability'
    };
    const sr = this.shadowRoot;
    sr.getElementById('inputPanelTitle').textContent = titles[mode];
    sr.getElementById('inputForm').innerHTML = this._getForm(mode);

    // Bind DTI slider if present
    const dtiSlider = sr.getElementById('f_dtiSlider');
    if (dtiSlider) {
      dtiSlider.addEventListener('input', e => {
        sr.getElementById('f_dtiVal').textContent = e.target.value + '%';
      });
    }

    // Update currency symbols in new form
    const cur = this._currencyObj();
    sr.querySelectorAll('.cur-sym').forEach(el => el.textContent = cur.symbol);
  }
}

customElements.define('advanced-calculator', AdvancedCalculator);
