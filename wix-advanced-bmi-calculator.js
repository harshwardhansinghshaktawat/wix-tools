/**
 * Advanced BMI Calculator - Wix Custom Element
 * Filename: wix-advanced-bmi-calculator.js
 * Custom Element Tag: <advanced-bmi-calculator>
 *
 * Calculations included:
 *  • Standard BMI (WHO scale) + BMI Prime + Ponderal Index
 *  • Body Fat % (Deurenberg formula, age & sex adjusted)
 *  • Ideal Body Weight (Devine, Robinson, Miller, Hamwi formulas)
 *  • Lean Body Mass (Boer formula)
 *  • Basal Metabolic Rate (Mifflin-St Jeor & Harris-Benedict)
 *  • Total Daily Energy Expenditure (TDEE) with 5 activity levels
 *  • Waist-to-Height Ratio risk assessment
 *  • Weight to reach target BMI
 *  • Animated BMI gauge with needle
 *  • Calculation history (last 6)
 *  • Export: summary text download + clipboard copy
 *  • Same widget props + panel element IDs as series
 */
class AdvancedBMICalculator extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.settings = {
      primaryBg: '#ffffff', secondaryBg: '#f8f9fa', borderColor: '#dddddd',
      secondaryText: '#666666', mainAccent: '#3498db', hoverAccent: '#2980b9',
      headingColor: '#2c3e50', paragraphColor: '#333333',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      fontSize: 14, headingSize: 24, borderRadius: 8, buttonPadding: 8
    };

    this.state = {
      unit: 'metric',
      results: null,
      history: []
    };

    // BMI category thresholds & colors
    this.categories = [
      { label: 'Severe Thinness',   min: 0,    max: 16,   color: '#2563eb', risk: 'Very High' },
      { label: 'Moderate Thinness', min: 16,   max: 17,   color: '#3b82f6', risk: 'High' },
      { label: 'Mild Thinness',     min: 17,   max: 18.5, color: '#60a5fa', risk: 'Moderate' },
      { label: 'Normal Weight',     min: 18.5, max: 25,   color: '#22c55e', risk: 'Low' },
      { label: 'Overweight',        min: 25,   max: 30,   color: '#f59e0b', risk: 'Increased' },
      { label: 'Obese Class I',     min: 30,   max: 35,   color: '#f97316', risk: 'High' },
      { label: 'Obese Class II',    min: 35,   max: 40,   color: '#ef4444', risk: 'Very High' },
      { label: 'Obese Class III',   min: 40,   max: 60,   color: '#991b1b', risk: 'Extremely High' }
    ];
  }

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

  connectedCallback() {
    this.render();
    this.attachEventListeners();
  }

  /* ─── Styles ────────────────────────────────────────────── */
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
        --c-normal: #22c55e; --c-over: #f59e0b;
        --c-obese: #ef4444;  --c-thin: #3b82f6;
        --shadow: 0 2px 16px rgba(0,0,0,0.07);
        --shadow-lg: 0 8px 32px rgba(0,0,0,0.12);
        --tr: all 0.22s ease;
        display: block; font-family: var(--ff);
        color: var(--pc); max-width: 1100px;
        margin: 0 auto; padding: 16px; box-sizing: border-box;
      }
      *, *::before, *::after { box-sizing: border-box; }

      /* ── Top bar ── */
      .top-bar {
        display: flex; align-items: center; justify-content: space-between;
        flex-wrap: wrap; gap: 12px; padding: 18px 22px;
        background: var(--pb); border: 1px solid var(--bc);
        border-radius: var(--br); box-shadow: var(--shadow);
        margin-bottom: 18px;
      }
      .top-title {
        font-size: var(--hs); font-weight: 800; color: var(--hc);
        margin: 0; letter-spacing: -0.5px;
      }
      .top-subtitle {
        font-size: calc(var(--fs) - 1px); color: var(--st);
        margin: 2px 0 0; font-family: var(--ff);
      }
      .unit-toggle {
        display: flex; background: var(--sb);
        border: 1px solid var(--bc); border-radius: var(--br);
        overflow: hidden;
      }
      .unit-btn {
        padding: var(--bp) 20px; cursor: pointer; font-size: var(--fs);
        font-family: var(--ff); font-weight: 600; border: none;
        background: transparent; color: var(--st); transition: var(--tr);
      }
      .unit-btn.active {
        background: var(--ma); color: var(--pb);
      }

      /* ── Layout ── */
      .main-grid {
        display: grid;
        grid-template-columns: 360px 1fr;
        gap: 18px; align-items: start;
      }
      @media (max-width: 860px) { .main-grid { grid-template-columns: 1fr; } }

      /* ── Panel ── */
      .panel {
        background: var(--pb); border: 1px solid var(--bc);
        border-radius: var(--br); box-shadow: var(--shadow);
        padding: 20px; margin-bottom: 18px;
      }
      .panel-title {
        font-size: calc(var(--hs) * 0.65); font-weight: 700; color: var(--hc);
        margin: 0 0 16px; padding-bottom: 11px;
        border-bottom: 1px solid var(--bc); font-family: var(--ff);
      }

      /* ── Form ── */
      .form-group { margin-bottom: 14px; }
      label {
        display: block; margin-bottom: 5px; font-weight: 600;
        font-size: calc(var(--fs) - 1px); color: var(--hc); font-family: var(--ff);
      }
      .hint { font-size: calc(var(--fs) - 3px); color: var(--st); margin-top: 3px; }
      .input-wrap { position: relative; }
      .input-unit {
        position: absolute; right: 11px; top: 50%; transform: translateY(-50%);
        font-size: calc(var(--fs) - 2px); color: var(--st); pointer-events: none;
        font-family: var(--ff);
      }
      input[type=number], input[type=text], select {
        width: 100%; padding: 10px 12px; border: 1px solid var(--bc);
        border-radius: var(--br); font-family: var(--ff); font-size: var(--fs);
        color: var(--pc); background: var(--pb); transition: var(--tr);
        appearance: none; -webkit-appearance: none;
      }
      input[type=number].has-unit { padding-right: 48px; }
      input:focus, select:focus {
        outline: none; border-color: var(--ma);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--ma) 16%, transparent);
      }
      .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }

      /* ── Sex selector ── */
      .sex-group { display: flex; gap: 10px; }
      .sex-btn {
        flex: 1; padding: 11px; text-align: center; cursor: pointer;
        border: 1px solid var(--bc); border-radius: var(--br);
        background: var(--pb); font-size: var(--fs); font-family: var(--ff);
        font-weight: 600; color: var(--st); transition: var(--tr);
        display: flex; align-items: center; justify-content: center; gap: 6px;
      }
      .sex-btn:hover { border-color: var(--ma); color: var(--ma); }
      .sex-btn.active { background: var(--ma); border-color: var(--ma); color: var(--pb); }
      .sex-btn svg { width: 18px; height: 18px; }

      /* ── Feet+inches layout ── */
      .imperial-height { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

      /* ── Buttons ── */
      .btn {
        display: inline-flex; align-items: center; justify-content: center; gap: 7px;
        padding: var(--bp) 16px; border: 1px solid transparent;
        border-radius: var(--br); font-size: var(--fs); font-family: var(--ff);
        font-weight: 600; cursor: pointer; transition: var(--tr); white-space: nowrap;
      }
      .btn-primary { background: var(--ma); color: var(--pb); border-color: var(--ma); }
      .btn-primary:hover { background: var(--ha); border-color: var(--ha); transform: translateY(-1px); }
      .btn-outline { background: transparent; color: var(--ma); border-color: var(--ma); }
      .btn-outline:hover { background: var(--ma); color: var(--pb); }
      .btn-ghost { background: var(--sb); color: var(--pc); border-color: var(--bc); }
      .btn-ghost:hover { border-color: var(--st); }
      .btn-full { width: 100%; font-size: calc(var(--fs) + 1px); padding: calc(var(--bp) + 3px) 16px; }
      .btn-sm { padding: calc(var(--bp) - 3px) 10px; font-size: calc(var(--fs) - 1px); }
      .btn svg { width: 14px; height: 14px; flex-shrink: 0; }
      .btn-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }

      /* ── BMI Gauge ── */
      .gauge-wrap {
        display: flex; flex-direction: column; align-items: center;
        padding: 24px 20px 16px; background: var(--sb);
        border-radius: var(--br); border: 1px solid var(--bc); margin-bottom: 18px;
        position: relative;
      }
      .gauge-canvas { max-width: 100%; }
      .gauge-center {
        position: absolute; bottom: 60px;
        display: flex; flex-direction: column; align-items: center;
        pointer-events: none;
      }
      .gauge-bmi-value {
        font-size: calc(var(--hs) * 1.3); font-weight: 800;
        color: var(--hc); line-height: 1; font-family: var(--ff);
      }
      .gauge-bmi-label {
        font-size: calc(var(--fs) - 1px); color: var(--st);
        font-family: var(--ff); margin-top: 2px;
      }
      .gauge-category {
        font-size: calc(var(--fs) + 1px); font-weight: 700;
        margin-top: 6px; font-family: var(--ff);
      }

      /* ── Result cards ── */
      .results-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(155px, 1fr));
        gap: 12px; margin-bottom: 18px;
      }
      .rc {
        background: var(--sb); border: 1px solid var(--bc);
        border-radius: var(--br); padding: 13px 15px;
        transition: var(--tr);
      }
      .rc:hover { transform: translateY(-2px); box-shadow: var(--shadow); }
      .rc.highlight {
        background: color-mix(in srgb, var(--ma) 9%, var(--pb));
        border-color: var(--ma);
      }
      .rc-label {
        font-size: calc(var(--fs) - 3px); font-weight: 700; text-transform: uppercase;
        letter-spacing: 0.06em; color: var(--st); margin-bottom: 5px; font-family: var(--ff);
      }
      .rc-value {
        font-size: calc(var(--hs) * 0.68); font-weight: 800;
        color: var(--hc); line-height: 1.15; font-family: var(--ff);
      }
      .rc-sub {
        font-size: calc(var(--fs) - 3px); color: var(--st);
        margin-top: 3px; font-family: var(--ff);
      }

      /* ── BMI Scale bar ── */
      .scale-bar-wrap { margin-bottom: 18px; }
      .scale-bar-track {
        height: 14px; border-radius: 7px; position: relative;
        background: linear-gradient(to right,
          #2563eb 0%, #3b82f6 8%, #60a5fa 12%, #22c55e 23%,
          #22c55e 62%, #f59e0b 62%, #f97316 75%, #ef4444 87%, #991b1b 100%);
        margin-bottom: 6px;
      }
      .scale-needle {
        position: absolute; top: -5px;
        width: 4px; height: 24px; background: var(--hc);
        border-radius: 2px; transform: translateX(-50%);
        transition: left 0.7s cubic-bezier(.34,1.56,.64,1);
        box-shadow: 0 0 0 2px var(--pb);
      }
      .scale-labels {
        display: flex; justify-content: space-between;
        font-size: calc(var(--fs) - 3px); color: var(--st); font-family: var(--ff);
      }

      /* ── Category Table ── */
      .cat-table { width: 100%; border-collapse: collapse; font-family: var(--ff); }
      .cat-table th {
        padding: 9px 12px; text-align: left; font-size: calc(var(--fs) - 2px);
        font-weight: 700; background: var(--hc); color: var(--pb); white-space: nowrap;
      }
      .cat-table td {
        padding: 8px 12px; font-size: calc(var(--fs) - 1px);
        border-bottom: 1px solid var(--bc); color: var(--pc); vertical-align: middle;
      }
      .cat-table tr:last-child td { border-bottom: none; }
      .cat-table tr.active-row { background: color-mix(in srgb, var(--ma) 8%, var(--pb)); font-weight: 700; }
      .cat-table tr.active-row td { border-color: var(--ma); }
      .cat-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 6px; }
      .risk-badge {
        display: inline-flex; padding: 2px 8px; border-radius: 20px;
        font-size: calc(var(--fs) - 3px); font-weight: 700; font-family: var(--ff);
      }

      /* ── Ideal Weight section ── */
      .iw-grid {
        display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 10px; margin-top: 4px;
      }
      .iw-card {
        background: var(--sb); border: 1px solid var(--bc);
        border-radius: var(--br); padding: 10px 12px;
      }
      .iw-formula { font-size: calc(var(--fs) - 3px); color: var(--st); font-weight: 700;
        text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px; font-family: var(--ff); }
      .iw-value { font-size: calc(var(--fs) + 2px); font-weight: 800; color: var(--hc); font-family: var(--ff); }
      .iw-sub { font-size: calc(var(--fs) - 3px); color: var(--st); font-family: var(--ff); }

      /* ── TDEE Section ── */
      .activity-grid {
        display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px;
      }
      .activity-btn {
        display: flex; align-items: center; gap: 10px; padding: 10px 13px;
        border: 1px solid var(--bc); border-radius: var(--br);
        background: var(--pb); cursor: pointer; transition: var(--tr);
        font-family: var(--ff);
      }
      .activity-btn:hover, .activity-btn.active {
        border-color: var(--ma);
        background: color-mix(in srgb, var(--ma) 8%, var(--pb));
      }
      .activity-btn.active { font-weight: 700; }
      .activity-icon { font-size: 20px; flex-shrink: 0; }
      .activity-text { flex: 1; }
      .activity-name { font-size: var(--fs); color: var(--hc); font-weight: 600; }
      .activity-desc { font-size: calc(var(--fs) - 3px); color: var(--st); }
      .activity-mult { font-size: calc(var(--fs) - 2px); color: var(--ma); font-weight: 700; }

      /* ── Tabs ── */
      .tabs { display: flex; gap: 2px; border-bottom: 1px solid var(--bc); margin-bottom: 16px; flex-wrap: wrap; }
      .tab {
        padding: 8px 14px; cursor: pointer; border-bottom: 2px solid transparent;
        font-size: var(--fs); font-family: var(--ff); color: var(--st); transition: var(--tr);
      }
      .tab.active { border-bottom-color: var(--ma); color: var(--ma); font-weight: 700; }
      .tab:hover:not(.active) { background: var(--sb); }
      .tab-content { display: none; }
      .tab-content.active { display: block; }

      /* ── Progress bars ── */
      .progress-group { margin-bottom: 12px; }
      .progress-header {
        display: flex; justify-content: space-between;
        font-size: calc(var(--fs) - 1px); font-family: var(--ff); margin-bottom: 5px;
      }
      .progress-label { color: var(--hc); font-weight: 600; }
      .progress-value { color: var(--st); }
      .progress-track {
        height: 8px; background: var(--sb); border-radius: 4px;
        border: 1px solid var(--bc); overflow: hidden;
      }
      .progress-fill {
        height: 100%; border-radius: 4px;
        transition: width 0.8s cubic-bezier(.34,1.56,.64,1);
      }

      /* ── History ── */
      .history-list { display: flex; flex-direction: column; gap: 8px; }
      .history-item {
        display: flex; align-items: center; gap: 12px; padding: 10px 13px;
        border: 1px solid var(--bc); border-radius: var(--br);
        background: var(--pb); cursor: pointer; transition: var(--tr);
      }
      .history-item:hover { border-color: var(--ma); background: var(--sb); }
      .history-bmi {
        font-size: calc(var(--hs) * 0.7); font-weight: 800;
        color: var(--hc); min-width: 50px; font-family: var(--ff);
      }
      .history-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
      .history-meta { flex: 1; }
      .history-cat { font-size: calc(var(--fs) - 1px); font-weight: 700; color: var(--hc); font-family: var(--ff); }
      .history-detail { font-size: calc(var(--fs) - 3px); color: var(--st); font-family: var(--ff); }
      .history-time { font-size: calc(var(--fs) - 3px); color: var(--st); font-family: var(--ff); white-space: nowrap; }

      /* ── Target BMI ── */
      .target-result {
        background: color-mix(in srgb, var(--ma) 8%, var(--pb));
        border: 1px solid var(--ma); border-radius: var(--br);
        padding: 14px 16px; margin-top: 10px;
      }
      .target-result .rc-value { color: var(--ma); }

      /* ── Toast ── */
      .toast {
        position: fixed; bottom: 22px; left: 50%;
        transform: translateX(-50%) translateY(14px);
        background: var(--hc); color: var(--pb); padding: 10px 22px;
        border-radius: var(--br); font-size: var(--fs); font-family: var(--ff);
        opacity: 0; pointer-events: none; transition: all 0.3s; z-index: 9999;
      }
      .toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

      /* ── Empty state ── */
      .empty-state {
        text-align: center; padding: 50px 24px; color: var(--st);
        font-family: var(--ff); font-size: var(--fs);
      }
      .empty-state svg { opacity: 0.25; margin-bottom: 14px; display: block; margin-left: auto; margin-right: auto; }
      .empty-title { font-size: calc(var(--fs) + 2px); font-weight: 700; color: var(--hc); margin-bottom: 6px; }

      /* ── Disclaimer ── */
      .disclaimer {
        font-size: calc(var(--fs) - 3px); color: var(--st); font-family: var(--ff);
        padding: 10px 14px; background: var(--sb); border-radius: var(--br);
        border: 1px solid var(--bc); margin-top: 8px; line-height: 1.5;
      }

      hr { border: none; border-top: 1px solid var(--bc); margin: 14px 0; }

      .section-sub {
        font-size: calc(var(--fs) - 1px); font-weight: 700; color: var(--hc);
        margin: 0 0 10px; font-family: var(--ff);
      }
    `;
  }

  updateStyles() {
    const el = this.shadowRoot.querySelector('#dyn-styles');
    if (el) el.textContent = this.getStyles();
  }

  /* ─── HTML ──────────────────────────────────────────────── */
  render() {
    this.shadowRoot.innerHTML = `
      <style id="dyn-styles">${this.getStyles()}</style>
      <div class="toast" id="toast"></div>

      <!-- Top bar -->
      <div class="top-bar">
        <div>
          <h2 class="top-title">🩺 Advanced BMI Calculator</h2>
          <p class="top-subtitle">BMI · Body Fat · Ideal Weight · BMR · TDEE · and more</p>
        </div>
        <div class="unit-toggle">
          <button class="unit-btn active" id="metricBtn">Metric</button>
          <button class="unit-btn" id="imperialBtn">Imperial</button>
        </div>
      </div>

      <!-- Main grid -->
      <div class="main-grid">

        <!-- Left: input form -->
        <div>
          <div class="panel">
            <div class="panel-title">Your Measurements</div>

            <!-- Sex -->
            <div class="form-group">
              <label>Biological Sex <span style="font-weight:400;color:var(--st)">(for body fat & BMR)</span></label>
              <div class="sex-group">
                <div class="sex-btn active" id="sexMale">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="10" cy="14" r="5"/><path d="M19 5l-5.4 5.4M19 5h-5M19 5v5"/>
                  </svg>
                  Male
                </div>
                <div class="sex-btn" id="sexFemale">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="8" r="5"/><line x1="12" y1="13" x2="12" y2="21"/>
                    <line x1="9" y1="18" x2="15" y2="18"/>
                  </svg>
                  Female
                </div>
              </div>
            </div>

            <!-- Age -->
            <div class="form-group">
              <label>Age</label>
              <div class="input-wrap">
                <input type="number" id="age" value="30" min="2" max="120" class="has-unit">
                <span class="input-unit">yrs</span>
              </div>
            </div>

            <!-- Height -->
            <div class="form-group" id="heightGroup">
              <label>Height</label>
              <div id="heightMetric">
                <div class="input-wrap">
                  <input type="number" id="heightCm" value="170" min="50" max="280" class="has-unit">
                  <span class="input-unit">cm</span>
                </div>
              </div>
              <div id="heightImperial" style="display:none;">
                <div class="imperial-height">
                  <div class="input-wrap">
                    <input type="number" id="heightFt" value="5" min="1" max="9" class="has-unit">
                    <span class="input-unit">ft</span>
                  </div>
                  <div class="input-wrap">
                    <input type="number" id="heightIn" value="7" min="0" max="11" class="has-unit">
                    <span class="input-unit">in</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Weight -->
            <div class="form-group">
              <label>Weight</label>
              <div class="input-wrap">
                <input type="number" id="weight" value="70" min="1" max="700" step="0.1" class="has-unit">
                <span class="input-unit" id="weightUnit">kg</span>
              </div>
            </div>

            <!-- Waist (optional) -->
            <div class="form-group">
              <label>
                Waist Circumference
                <span style="font-weight:400;color:var(--st)">(optional)</span>
              </label>
              <div class="input-wrap">
                <input type="number" id="waist" placeholder="e.g. 80" min="30" max="300" class="has-unit">
                <span class="input-unit" id="waistUnit">cm</span>
              </div>
              <p class="hint">Used for Waist-to-Height ratio risk assessment</p>
            </div>

            <hr>

            <!-- Target BMI section -->
            <div class="form-group">
              <label>Target BMI <span style="font-weight:400;color:var(--st)">(optional)</span></label>
              <div class="input-wrap">
                <input type="number" id="targetBmi" placeholder="e.g. 22" min="10" max="50" step="0.1" class="has-unit">
                <span class="input-unit">BMI</span>
              </div>
              <p class="hint">Calculates how much weight to gain or lose</p>
            </div>

            <button class="btn btn-primary btn-full" id="calcBtn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
              </svg>
              Calculate BMI & Metrics
            </button>

            <div class="disclaimer" style="margin-top:12px;">
              ⚕️ This tool is for informational purposes only. BMI is a screening tool, not a diagnostic measure. Consult a healthcare professional for medical advice.
            </div>
          </div>
        </div>

        <!-- Right: results -->
        <div id="rightCol">

          <!-- Empty state -->
          <div class="panel" id="emptyState">
            <div class="empty-state">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <div class="empty-title">Enter your details to get started</div>
              <p>Your BMI, body fat estimate, ideal weight, BMR, TDEE, and full health risk analysis will appear here.</p>
            </div>
          </div>

          <!-- Results section -->
          <div id="resultsSection" style="display:none;">

            <!-- Gauge + key results -->
            <div class="panel">
              <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:14px;">
                <div class="panel-title" style="margin:0;border:none;padding:0;">Your Results</div>
                <div class="btn-row">
                  <button class="btn btn-ghost btn-sm" id="copyBtn">📋 Copy</button>
                  <button class="btn btn-outline btn-sm" id="exportBtn">⬇ Summary</button>
                </div>
              </div>

              <!-- Gauge -->
              <div class="gauge-wrap" id="gaugeWrap">
                <canvas id="gaugeCanvas" class="gauge-canvas" width="360" height="200"></canvas>
                <div class="gauge-center" id="gaugeCenter">
                  <div class="gauge-bmi-value" id="gaugeBmiValue">—</div>
                  <div class="gauge-bmi-label">BMI</div>
                  <div class="gauge-category" id="gaugeCategory">—</div>
                </div>
              </div>

              <!-- Scale bar -->
              <div class="scale-bar-wrap">
                <div class="scale-bar-track">
                  <div class="scale-needle" id="scaleNeedle" style="left:0%"></div>
                </div>
                <div class="scale-labels">
                  <span>10</span><span>16</span><span>18.5</span><span>25</span>
                  <span>30</span><span>35</span><span>40</span><span>50+</span>
                </div>
              </div>

              <!-- Key result cards -->
              <div class="results-grid" id="resultCards"></div>
            </div>

            <!-- Tabbed details -->
            <div class="panel">
              <div class="tabs">
                <div class="tab active" data-tab="analysis">Analysis</div>
                <div class="tab" data-tab="idealweight">Ideal Weight</div>
                <div class="tab" data-tab="energy">BMR & TDEE</div>
                <div class="tab" data-tab="risks">Risk Table</div>
                <div class="tab" data-tab="history">History <span id="histCount" style="font-size:calc(var(--fs)-3px);background:var(--ma);color:var(--pb);border-radius:10px;padding:1px 6px;margin-left:4px;">0</span></div>
              </div>

              <!-- Analysis tab -->
              <div class="tab-content active" data-tab-content="analysis">
                <div id="analysisContent"></div>
              </div>

              <!-- Ideal Weight tab -->
              <div class="tab-content" data-tab-content="idealweight">
                <p class="hint" style="margin-bottom:12px;">Four clinically recognized formulas for ideal body weight based on height and sex.</p>
                <div class="iw-grid" id="iwGrid"></div>
                <div id="targetResult" style="display:none;margin-top:16px;">
                  <div class="section-sub" style="margin-top:16px;">Target BMI Weight Goal</div>
                  <div class="target-result" id="targetResultContent"></div>
                </div>
              </div>

              <!-- Energy tab -->
              <div class="tab-content" data-tab-content="energy">
                <div id="energyContent"></div>
                <hr>
                <div class="section-sub">Activity Level for TDEE</div>
                <div class="activity-grid" id="activityGrid"></div>
                <div id="tdeeResults"></div>
              </div>

              <!-- Risk Table tab -->
              <div class="tab-content" data-tab-content="risks">
                <div class="table-wrap" style="border-radius:var(--br);overflow:hidden;border:1px solid var(--bc);">
                  <table class="cat-table" id="riskTable"></table>
                </div>
                <div id="waistRisk" style="margin-top:14px;display:none;"></div>
              </div>

              <!-- History tab -->
              <div class="tab-content" data-tab-content="history">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                  <span style="font-size:var(--fs);color:var(--st);">Last 6 calculations</span>
                  <button class="btn btn-ghost btn-sm" id="clearHistBtn">Clear</button>
                </div>
                <div class="history-list" id="historyList">
                  <p style="color:var(--st);text-align:center;padding:24px 0;">No history yet.</p>
                </div>
              </div>
            </div>

          </div><!-- /resultsSection -->
        </div><!-- /rightCol -->
      </div><!-- /main-grid -->
    `;
  }

  /* ─── Calculation Engine ────────────────────────────────── */
  _calculate() {
    const sr = this.shadowRoot;
    const sex  = this._sex();
    const age  = parseFloat(sr.getElementById('age').value) || 25;
    const unit = this.state.unit;

    // Height in cm
    let heightCm;
    if (unit === 'metric') {
      heightCm = parseFloat(sr.getElementById('heightCm').value) || 170;
    } else {
      const ft = parseFloat(sr.getElementById('heightFt').value) || 5;
      const inch = parseFloat(sr.getElementById('heightIn').value) || 7;
      heightCm = (ft * 12 + inch) * 2.54;
    }

    // Weight in kg
    let weightKg;
    if (unit === 'metric') {
      weightKg = parseFloat(sr.getElementById('weight').value) || 70;
    } else {
      weightKg = (parseFloat(sr.getElementById('weight').value) || 154) * 0.453592;
    }

    // Waist
    let waistCm = null;
    const waistVal = parseFloat(sr.getElementById('waist').value);
    if (!isNaN(waistVal) && waistVal > 0) {
      waistCm = unit === 'metric' ? waistVal : waistVal * 2.54;
    }

    const targetBmi = parseFloat(sr.getElementById('targetBmi').value) || null;

    if (heightCm < 50 || heightCm > 280) { this.showToast('Please enter a valid height'); return; }
    if (weightKg < 1 || weightKg > 700)  { this.showToast('Please enter a valid weight'); return; }
    if (age < 2 || age > 120)             { this.showToast('Please enter a valid age (2–120)'); return; }

    const hM = heightCm / 100; // meters

    /* ── Core BMI ── */
    const bmi = weightKg / (hM * hM);
    const bmiPrime = bmi / 25; // ratio to upper normal limit
    const ponderal = weightKg / (hM * hM * hM); // kg/m³

    /* ── Category ── */
    const cat = this._getCategory(bmi);

    /* ── Body Fat % (Deurenberg 1991, age/sex adjusted) ── */
    const bfPct = (1.20 * bmi) + (0.23 * age) - (10.8 * (sex === 'male' ? 1 : 0)) - 5.4;
    const bfKg  = weightKg * (Math.max(0, bfPct) / 100);
    const lbmKg = weightKg - bfKg;

    /* ── Body Fat % (Navy formula if waist available - male only accurate approx) ── */
    // Boer LBM formula as secondary
    const lbmBoer = sex === 'male'
      ? (0.407 * weightKg) + (0.267 * heightCm) - 19.2
      : (0.252 * weightKg) + (0.473 * heightCm) - 48.3;

    /* ── Ideal Body Weight (IBW) formulas ── */
    const heightInches = heightCm / 2.54;
    const inchesOver5ft = Math.max(0, heightInches - 60);

    const ibwDevine  = sex === 'male' ? 50   + 2.3   * inchesOver5ft : 45.5 + 2.3   * inchesOver5ft;
    const ibwRobinson= sex === 'male' ? 52   + 1.9   * inchesOver5ft : 49   + 1.7   * inchesOver5ft;
    const ibwMiller  = sex === 'male' ? 56.2 + 1.41  * inchesOver5ft : 53.1 + 1.36  * inchesOver5ft;
    const ibwHamwi   = sex === 'male' ? 48   + 2.72  * inchesOver5ft : 45.4 + 2.27  * inchesOver5ft;
    const ibwAvg     = (ibwDevine + ibwRobinson + ibwMiller + ibwHamwi) / 4;

    // Normal BMI weight range (18.5–24.9)
    const minNormalKg = 18.5 * hM * hM;
    const maxNormalKg = 24.9 * hM * hM;

    /* ── BMR ── */
    // Mifflin-St Jeor (most accurate)
    const bmrMifflin = sex === 'male'
      ? (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5
      : (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;

    // Harris-Benedict
    const bmrHarris = sex === 'male'
      ? 88.362 + (13.397 * weightKg) + (4.799 * heightCm) - (5.677 * age)
      : 447.593 + (9.247 * weightKg) + (3.098 * heightCm) - (4.330 * age);

    /* ── Waist-to-Height Ratio ── */
    let whr = null;
    if (waistCm) whr = waistCm / heightCm;

    /* ── Target weight for target BMI ── */
    let targetWeightKg = null;
    let weightDiff = null;
    if (targetBmi) {
      targetWeightKg = targetBmi * hM * hM;
      weightDiff = targetWeightKg - weightKg;
    }

    const r = {
      bmi, bmiPrime, ponderal, cat,
      bfPct: Math.max(0, bfPct), bfKg, lbmKg, lbmBoer,
      ibwDevine, ibwRobinson, ibwMiller, ibwHamwi, ibwAvg,
      minNormalKg, maxNormalKg,
      bmrMifflin, bmrHarris,
      whr, waistCm,
      targetWeightKg, weightDiff, targetBmi,
      weightKg, heightCm, heightInches, sex, age,
      unit
    };

    this.state.results = r;
    this._saveHistory(r);
    this._renderResults(r);
    this.showToast('Calculated!');
  }

  _getCategory(bmi) {
    return this.categories.find(c => bmi >= c.min && bmi < c.max)
      || this.categories[this.categories.length - 1];
  }

  /* ─── Render Results ──────────────────────────────────── */
  _renderResults(r) {
    const sr = this.shadowRoot;
    sr.getElementById('emptyState').style.display = 'none';
    sr.getElementById('resultsSection').style.display = 'block';

    this._drawGauge(r.bmi, r.cat);
    this._updateScaleNeedle(r.bmi);
    this._renderCards(r);
    this._renderAnalysis(r);
    this._renderIdealWeight(r);
    this._renderEnergy(r);
    this._renderRiskTable(r);
    this._renderWaistRisk(r);
    this._renderHistory();
  }

  /* ─── Gauge ─────────────────────────────────────────── */
  _drawGauge(bmi, cat) {
    const sr = this.shadowRoot;
    const canvas = sr.getElementById('gaugeCanvas');
    const ctx    = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H - 30;
    const R = Math.min(cx - 20, H - 50);
    const startAngle = Math.PI;
    const endAngle   = 2 * Math.PI;

    ctx.clearRect(0, 0, W, H);

    // Draw colored arcs for each BMI zone
    const bmiMin = 10, bmiMax = 50;
    const arcColors = [
      { from: 10, to: 16,   color: '#2563eb' },
      { from: 16, to: 17,   color: '#3b82f6' },
      { from: 17, to: 18.5, color: '#60a5fa' },
      { from: 18.5,to: 25,  color: '#22c55e' },
      { from: 25, to: 30,   color: '#f59e0b' },
      { from: 30, to: 35,   color: '#f97316' },
      { from: 35, to: 40,   color: '#ef4444' },
      { from: 40, to: 50,   color: '#991b1b' }
    ];

    const bmiToAngle = v => {
      const pct = Math.min(1, Math.max(0, (v - bmiMin) / (bmiMax - bmiMin)));
      return startAngle + pct * Math.PI;
    };

    arcColors.forEach(a => {
      ctx.beginPath();
      ctx.arc(cx, cy, R, bmiToAngle(a.from), bmiToAngle(a.to));
      ctx.strokeStyle = a.color;
      ctx.lineWidth = 28;
      ctx.stroke();
    });

    // Track outline
    ctx.beginPath();
    ctx.arc(cx, cy, R, startAngle, endAngle);
    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 30;
    ctx.stroke();

    // Needle
    const clamped = Math.min(bmiMax, Math.max(bmiMin, bmi));
    const needleAngle = bmiToAngle(clamped);
    const nLen = R - 6;
    const nx   = cx + Math.cos(needleAngle) * nLen;
    const ny   = cy + Math.sin(needleAngle) * nLen;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(nx, ny);
    ctx.strokeStyle = this.settings.headingColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Needle pivot
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fillStyle = this.settings.headingColor;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fillStyle = this.settings.primaryBg;
    ctx.fill();

    // Tick labels
    const tickBMIs = [10, 18.5, 25, 30, 40, 50];
    ctx.fillStyle = this.settings.secondaryText;
    ctx.font = `bold ${parseInt(this.settings.fontSize) - 2}px ${this.settings.fontFamily}`;
    ctx.textAlign = 'center';
    tickBMIs.forEach(v => {
      const a   = bmiToAngle(v);
      const tx  = cx + Math.cos(a) * (R + 18);
      const ty  = cy + Math.sin(a) * (R + 18);
      ctx.fillText(String(v), tx, ty);
    });

    // Update overlay text
    sr.getElementById('gaugeBmiValue').textContent = bmi.toFixed(1);
    sr.getElementById('gaugeCategory').textContent = cat.label;
    sr.getElementById('gaugeCategory').style.color = cat.color;
  }

  _updateScaleNeedle(bmi) {
    const needle = this.shadowRoot.getElementById('scaleNeedle');
    const keypoints = [10, 16, 17, 18.5, 25, 30, 35, 40, 50];
    const pcts      = [0,  8,  12, 23,   62, 75, 87, 95, 100];
    let pct = 0;
    for (let i = 0; i < keypoints.length - 1; i++) {
      if (bmi >= keypoints[i] && bmi < keypoints[i+1]) {
        const t = (bmi - keypoints[i]) / (keypoints[i+1] - keypoints[i]);
        pct = pcts[i] + t * (pcts[i+1] - pcts[i]);
        break;
      }
    }
    pct = Math.min(100, Math.max(0, pct));
    needle.style.left = pct + '%';
  }

  /* ─── Cards ─────────────────────────────────────────── */
  _renderCards(r) {
    const f = (v, dec=1) => isNaN(v) ? '—' : v.toFixed(dec);
    const u = r.unit === 'metric';
    const wDisp = v => u ? `${f(v,1)} kg` : `${f(v*2.20462,1)} lb`;

    const cards = [
      { label:'BMI', value: f(r.bmi,1), sub:`BMI Prime: ${f(r.bmiPrime,2)}`, highlight:true },
      { label:'Category', value: r.cat.label, sub:`Risk: ${r.cat.risk}`, color: r.cat.color },
      { label:'Body Fat %', value:`${f(r.bfPct,1)}%`, sub:`${wDisp(r.bfKg)} fat mass` },
      { label:'Lean Body Mass', value:wDisp(r.lbmKg), sub:'Deurenberg method' },
      { label:'Ponderal Index', value:`${f(r.ponderal,2)}`, sub:'kg/m³' },
      { label:'BMI Prime', value:f(r.bmiPrime,3), sub: r.bmiPrime < 1 ? 'Below normal' : r.bmiPrime <= 1.2 ? 'Normal range' : 'Above normal' },
      { label:'Normal Weight Range', value:`${wDisp(r.minNormalKg)}–${wDisp(r.maxNormalKg)}`, sub:'BMI 18.5–24.9' },
      { label:'Weight Diff to Normal', value: this._weightDiffDisplay(r), sub:'To reach healthy BMI' }
    ];

    this.shadowRoot.getElementById('resultCards').innerHTML = cards.map(c => `
      <div class="rc ${c.highlight?'highlight':''}">
        <div class="rc-label">${c.label}</div>
        <div class="rc-value" ${c.color?`style="color:${c.color}"`:''}>${c.value}</div>
        <div class="rc-sub">${c.sub}</div>
      </div>`).join('');
  }

  _weightDiffDisplay(r) {
    if (r.bmi >= 18.5 && r.bmi < 25) return 'Already healthy ✓';
    const u = r.unit === 'metric';
    if (r.bmi < 18.5) {
      const diff = r.minNormalKg - r.weightKg;
      return u ? `+${diff.toFixed(1)} kg` : `+${(diff*2.20462).toFixed(1)} lb`;
    }
    const diff = r.weightKg - r.maxNormalKg;
    return u ? `-${diff.toFixed(1)} kg` : `-${(diff*2.20462).toFixed(1)} lb`;
  }

  /* ─── Analysis Tab ──────────────────────────────────── */
  _renderAnalysis(r) {
    const u = r.unit === 'metric';
    const f = (v, dec=1) => v.toFixed(dec);
    const wDisp = v => u ? `${f(v,1)} kg` : `${f(v*2.20462,1)} lb`;

    // Body fat classification
    const bfClass = this._bfClass(r.bfPct, r.sex);

    // WHR interpretation
    let whrHtml = '';
    if (r.whr !== null) {
      const whrCat = r.whr < 0.5 ? 'Healthy' : r.whr < 0.6 ? 'At Risk' : 'High Risk';
      const whrColor = r.whr < 0.5 ? 'var(--c-normal)' : r.whr < 0.6 ? '#f59e0b' : 'var(--c-obese)';
      whrHtml = `
        <div class="progress-group" style="margin-top:14px;">
          <div class="progress-header">
            <span class="progress-label">Waist-to-Height Ratio</span>
            <span class="progress-value" style="color:${whrColor};font-weight:700;">${f(r.whr,3)} — ${whrCat}</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width:${Math.min(100,r.whr/0.8*100)}%;background:${whrColor};"></div>
          </div>
          <p class="hint">Healthy: &lt;0.50 | At Risk: 0.50–0.60 | High Risk: &gt;0.60</p>
        </div>`;
    }

    // BMI progress (visual on 10–50 scale)
    const bmiPct = Math.min(100, Math.max(0, (r.bmi - 10) / 40 * 100));

    this.shadowRoot.getElementById('analysisContent').innerHTML = `
      <!-- BMI visual progress -->
      <div class="progress-group">
        <div class="progress-header">
          <span class="progress-label">BMI: ${f(r.bmi,1)}</span>
          <span class="progress-value" style="color:${r.cat.color};font-weight:700;">${r.cat.label}</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width:${bmiPct}%;background:${r.cat.color};"></div>
        </div>
        <p class="hint">Scale: 10 (severe underweight) → 50 (extreme obesity)</p>
      </div>

      <!-- Body fat -->
      <div class="progress-group">
        <div class="progress-header">
          <span class="progress-label">Body Fat: ${f(r.bfPct,1)}%</span>
          <span class="progress-value" style="color:${bfClass.color};font-weight:700;">${bfClass.label}</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width:${Math.min(100,r.bfPct/60*100)}%;background:${bfClass.color};"></div>
        </div>
        <p class="hint">Estimated via Deurenberg formula (age & sex adjusted)</p>
      </div>

      <!-- Lean body mass -->
      <div class="progress-group">
        <div class="progress-header">
          <span class="progress-label">Lean Body Mass</span>
          <span class="progress-value">${wDisp(r.lbmKg)} (${f(100-r.bfPct,1)}%)</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width:${100-r.bfPct}%;background:var(--ma);"></div>
        </div>
      </div>

      ${whrHtml}

      <hr>
      <div class="section-sub">Interpretation</div>
      <p style="font-size:var(--fs);line-height:1.7;color:var(--pc);font-family:var(--ff);">
        ${this._getInterpretation(r)}
      </p>

      <div style="margin-top:12px;padding:12px 14px;background:var(--sb);border-radius:var(--br);border:1px solid var(--bc);">
        <div style="font-size:calc(var(--fs) - 1px);font-weight:700;color:var(--hc);margin-bottom:6px;font-family:var(--ff);">Key Numbers</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
          ${[
            ['BMI', f(r.bmi,2)],
            ['BMI Prime', f(r.bmiPrime,3)],
            ['Ponderal Index', `${f(r.ponderal,2)} kg/m³`],
            ['Body Fat', `${f(r.bfPct,1)}%`],
            ['Fat Mass', wDisp(r.bfKg)],
            ['LBM (Deurenberg)', wDisp(r.lbmKg)],
            ['LBM (Boer)', wDisp(r.lbmBoer)],
            ['Normal Range', `${wDisp(r.minNormalKg)} – ${wDisp(r.maxNormalKg)}`]
          ].map(([l,v]) => `
            <div style="font-size:calc(var(--fs)-2px);font-family:var(--ff);">
              <span style="color:var(--st);">${l}: </span>
              <span style="color:var(--hc);font-weight:600;">${v}</span>
            </div>`).join('')}
        </div>
      </div>`;
  }

  _bfClass(bf, sex) {
    const m = sex === 'male';
    if (m) {
      if (bf < 6)  return { label:'Essential Fat', color:'#2563eb' };
      if (bf < 14) return { label:'Athlete',        color:'var(--c-normal)' };
      if (bf < 18) return { label:'Fitness',         color:'#22c55e' };
      if (bf < 25) return { label:'Average',         color:'#f59e0b' };
      return              { label:'Obese',            color:'var(--c-obese)' };
    } else {
      if (bf < 14) return { label:'Essential Fat', color:'#2563eb' };
      if (bf < 21) return { label:'Athlete',        color:'var(--c-normal)' };
      if (bf < 25) return { label:'Fitness',         color:'#22c55e' };
      if (bf < 32) return { label:'Average',         color:'#f59e0b' };
      return              { label:'Obese',            color:'var(--c-obese)' };
    }
  }

  _getInterpretation(r) {
    const bmi = r.bmi;
    const u = r.unit === 'metric';
    const wDisp = v => u ? `${v.toFixed(1)} kg` : `${(v*2.20462).toFixed(1)} lb`;
    const diff = Math.abs(r.weightKg - (bmi < 18.5 ? r.minNormalKg : r.maxNormalKg));

    if (bmi < 16)
      return `Your BMI of <strong>${bmi.toFixed(1)}</strong> falls in the <strong>Severe Thinness</strong> category, which carries very high health risks including malnutrition, bone density loss, and immune dysfunction. Please consult a healthcare provider immediately.`;
    if (bmi < 17)
      return `Your BMI of <strong>${bmi.toFixed(1)}</strong> indicates <strong>Moderate Thinness</strong>. You would benefit from a supervised nutritional plan. Consider speaking with a registered dietitian.`;
    if (bmi < 18.5)
      return `Your BMI of <strong>${bmi.toFixed(1)}</strong> is slightly below the normal range (<strong>Mild Thinness</strong>). Gaining approximately <strong>${wDisp(diff)}</strong> would bring you into the healthy range.`;
    if (bmi < 25)
      return `Your BMI of <strong>${bmi.toFixed(1)}</strong> is within the <strong>Normal Weight</strong> range. This is associated with the lowest risk of weight-related health issues. Maintain your healthy lifestyle through balanced nutrition and regular physical activity.`;
    if (bmi < 30)
      return `Your BMI of <strong>${bmi.toFixed(1)}</strong> falls in the <strong>Overweight</strong> category. Losing approximately <strong>${wDisp(diff)}</strong> would bring you back to the healthy range. Even a 5–10% reduction in body weight can significantly improve health markers.`;
    if (bmi < 35)
      return `Your BMI of <strong>${bmi.toFixed(1)}</strong> is in the <strong>Obese Class I</strong> range. This increases risk for type 2 diabetes, cardiovascular disease, and hypertension. A structured diet and exercise program is strongly advised.`;
    if (bmi < 40)
      return `Your BMI of <strong>${bmi.toFixed(1)}</strong> is in the <strong>Obese Class II</strong> range, indicating high health risk. Medical supervision and a comprehensive weight management program are recommended.`;
    return `Your BMI of <strong>${bmi.toFixed(1)}</strong> is in the <strong>Obese Class III (Morbid Obesity)</strong> category. This is associated with severely elevated risk for multiple conditions. Please seek medical support as a priority.`;
  }

  /* ─── Ideal Weight Tab ───────────────────────────────── */
  _renderIdealWeight(r) {
    const u = r.unit === 'metric';
    const wDisp = v => u ? `${v.toFixed(1)} kg` : `${(v*2.20462).toFixed(1)} lb`;
    const sr = this.shadowRoot;

    sr.getElementById('iwGrid').innerHTML = [
      { f:'Devine',   v:r.ibwDevine,   note:'Gold standard (clinical)' },
      { f:'Robinson', v:r.ibwRobinson, note:'Revised Devine (1983)' },
      { f:'Miller',   v:r.ibwMiller,   note:'Adjusted for body frame' },
      { f:'Hamwi',    v:r.ibwHamwi,    note:'Endocrine Society' },
      { f:'Average',  v:r.ibwAvg,      note:'Mean of all four' }
    ].map(x => `
      <div class="iw-card">
        <div class="iw-formula">${x.f}</div>
        <div class="iw-value">${wDisp(x.v)}</div>
        <div class="iw-sub">${x.note}</div>
      </div>`).join('');

    if (r.targetBmi && r.targetWeightKg) {
      const diff = r.targetWeightKg - r.weightKg;
      const dir = diff > 0 ? 'Gain' : 'Lose';
      sr.getElementById('targetResult').style.display = 'block';
      sr.getElementById('targetResultContent').innerHTML = `
        <div class="rc-label">To reach BMI ${r.targetBmi.toFixed(1)}</div>
        <div class="rc-value">${dir} ${wDisp(Math.abs(diff))}</div>
        <div class="rc-sub">Target weight: ${wDisp(r.targetWeightKg)}</div>`;
    } else {
      sr.getElementById('targetResult').style.display = 'none';
    }
  }

  /* ─── Energy Tab ─────────────────────────────────────── */
  _renderEnergy(r) {
    const f = v => Math.round(v).toLocaleString();
    const sr = this.shadowRoot;

    sr.getElementById('energyContent').innerHTML = `
      <div class="results-grid" style="margin-bottom:0;">
        <div class="rc highlight">
          <div class="rc-label">BMR (Mifflin-St Jeor)</div>
          <div class="rc-value">${f(r.bmrMifflin)}</div>
          <div class="rc-sub">kcal/day — most accurate</div>
        </div>
        <div class="rc">
          <div class="rc-label">BMR (Harris-Benedict)</div>
          <div class="rc-value">${f(r.bmrHarris)}</div>
          <div class="rc-sub">kcal/day — classic formula</div>
        </div>
      </div>
      <p class="hint" style="margin-top:8px;">BMR = calories burned at complete rest. Select activity level below for TDEE.</p>`;

    const activities = [
      { id:'sed',    icon:'🛋️', name:'Sedentary',        desc:'Desk job, little or no exercise',       mult:1.2 },
      { id:'light',  icon:'🚶', name:'Lightly Active',    desc:'Light exercise 1–3 days/week',           mult:1.375 },
      { id:'mod',    icon:'🏃', name:'Moderately Active', desc:'Moderate exercise 3–5 days/week',        mult:1.55 },
      { id:'active', icon:'🏋️', name:'Very Active',       desc:'Hard exercise 6–7 days/week',            mult:1.725 },
      { id:'extra',  icon:'⚡', name:'Extra Active',      desc:'Physical job or twice-daily training',   mult:1.9 }
    ];

    sr.getElementById('activityGrid').innerHTML = activities.map(a => `
      <div class="activity-btn ${a.id === 'mod' ? 'active' : ''}" data-mult="${a.mult}" data-id="${a.id}">
        <div class="activity-icon">${a.icon}</div>
        <div class="activity-text">
          <div class="activity-name">${a.name}</div>
          <div class="activity-desc">${a.desc}</div>
        </div>
        <div class="activity-mult">×${a.mult}</div>
      </div>`).join('');

    // Default TDEE render
    this._renderTDEE(r.bmrMifflin, 1.55);

    // Activity click events
    sr.querySelectorAll('.activity-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sr.querySelectorAll('.activity-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._renderTDEE(r.bmrMifflin, parseFloat(btn.dataset.mult));
      });
    });
  }

  _renderTDEE(bmr, mult) {
    const tdee = bmr * mult;
    const f = v => Math.round(v).toLocaleString();
    this.shadowRoot.getElementById('tdeeResults').innerHTML = `
      <div class="results-grid" style="margin-top:12px;">
        <div class="rc highlight">
          <div class="rc-label">TDEE</div>
          <div class="rc-value">${f(tdee)}</div>
          <div class="rc-sub">kcal/day to maintain weight</div>
        </div>
        <div class="rc">
          <div class="rc-label">Weight Loss (–500 kcal)</div>
          <div class="rc-value">${f(tdee - 500)}</div>
          <div class="rc-sub">~0.45 kg / week deficit</div>
        </div>
        <div class="rc">
          <div class="rc-label">Weight Gain (+500 kcal)</div>
          <div class="rc-value">${f(tdee + 500)}</div>
          <div class="rc-sub">~0.45 kg / week surplus</div>
        </div>
        <div class="rc">
          <div class="rc-label">Aggressive Loss (–1000)</div>
          <div class="rc-value">${f(tdee - 1000)}</div>
          <div class="rc-sub">~0.9 kg / week (caution)</div>
        </div>
      </div>
      <p class="hint">Macros for maintenance: Protein ~${f(tdee*0.3/4)}g · Carbs ~${f(tdee*0.4/4)}g · Fat ~${f(tdee*0.3/9)}g</p>`;
  }

  /* ─── Risk Table Tab ─────────────────────────────────── */
  _renderRiskTable(r) {
    const riskColors = {
      'Very High':'#991b1b', 'High':'#ef4444', 'Moderate':'#f97316',
      'Increased':'#f59e0b', 'Low':'#22c55e'
    };
    const riskBg = {
      'Very High':'#fef2f2','High':'#fef2f2','Moderate':'#fff7ed',
      'Increased':'#fffbeb','Low':'#f0fdf4'
    };

    const rows = this.categories.map(c => {
      const isActive = r.bmi >= c.min && r.bmi < c.max;
      const rc = riskColors[c.risk] || '#666';
      const rb = riskBg[c.risk] || 'transparent';
      return `<tr class="${isActive ? 'active-row' : ''}">
        <td><span class="cat-dot" style="background:${c.color};"></span>${c.label}${isActive ? ' ◀ You' : ''}</td>
        <td>${c.min} – ${c.max === 60 ? '40+' : c.max}</td>
        <td><span class="risk-badge" style="background:${rb};color:${rc};">${c.risk}</span></td>
        <td style="font-size:calc(var(--fs)-2px);color:var(--st);">${this._riskNote(c.label)}</td>
      </tr>`;
    }).join('');

    this.shadowRoot.getElementById('riskTable').innerHTML = `
      <thead><tr>
        <th>Category</th><th>BMI Range</th><th>Health Risk</th><th>Notes</th>
      </tr></thead>
      <tbody>${rows}</tbody>`;
  }

  _riskNote(cat) {
    const notes = {
      'Severe Thinness':   'Malnutrition, organ failure risk',
      'Moderate Thinness': 'Nutritional deficiency risk',
      'Mild Thinness':     'May indicate nutrient deficiency',
      'Normal Weight':     'Optimal health range',
      'Overweight':        'Increased risk of metabolic issues',
      'Obese Class I':     'High risk for diabetes, hypertension',
      'Obese Class II':    'Very high cardiovascular risk',
      'Obese Class III':   'Morbid — immediate medical advice'
    };
    return notes[cat] || '';
  }

  _renderWaistRisk(r) {
    const wrap = this.shadowRoot.getElementById('waistRisk');
    if (!r.whr) { wrap.style.display = 'none'; return; }
    wrap.style.display = 'block';

    const whrRisks = [
      { max:0.40, label:'Extremely Slim',  color:'#60a5fa', risk:'Very Low' },
      { max:0.50, label:'Healthy',         color:'#22c55e', risk:'Low' },
      { max:0.60, label:'Overweight',      color:'#f59e0b', risk:'Moderate' },
      { max:0.70, label:'Very Overweight', color:'#ef4444', risk:'High' },
      { max:99,   label:'Morbidly Obese', color:'#991b1b', risk:'Very High' }
    ];
    const whrCat = whrRisks.find(x => r.whr < x.max) || whrRisks[whrRisks.length-1];

    wrap.innerHTML = `
      <div class="panel-title" style="margin-bottom:10px;">Waist-to-Height Ratio: ${r.whr.toFixed(3)}</div>
      <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;
        background:color-mix(in srgb,${whrCat.color} 10%,var(--pb));
        border:1px solid ${whrCat.color};border-radius:var(--br);">
        <div style="font-size:calc(var(--hs)*0.7);font-weight:800;color:${whrCat.color};font-family:var(--ff);">${r.whr.toFixed(3)}</div>
        <div>
          <div style="font-weight:700;color:var(--hc);font-family:var(--ff);">${whrCat.label}</div>
          <div style="font-size:calc(var(--fs)-2px);color:var(--st);font-family:var(--ff);">Health Risk: <strong style="color:${whrCat.color};">${whrCat.risk}</strong></div>
        </div>
      </div>`;
  }

  /* ─── History ─────────────────────────────────────────── */
  _saveHistory(r) {
    this.state.history.unshift({
      bmi: r.bmi, cat: r.cat,
      weightKg: r.weightKg, heightCm: r.heightCm,
      sex: r.sex, age: r.age, unit: r.unit,
      time: new Date().toLocaleTimeString()
    });
    if (this.state.history.length > 6) this.state.history.pop();
  }

  _renderHistory() {
    const sr = this.shadowRoot;
    const hist = this.state.history;
    sr.getElementById('histCount').textContent = hist.length;

    if (!hist.length) {
      sr.getElementById('historyList').innerHTML = '<p style="color:var(--st);text-align:center;padding:20px 0;">No history yet.</p>';
      return;
    }

    const u = this.state.unit === 'metric';
    sr.getElementById('historyList').innerHTML = hist.map((h, i) => `
      <div class="history-item">
        <div class="history-dot" style="background:${h.cat.color};"></div>
        <div class="history-bmi">${h.bmi.toFixed(1)}</div>
        <div class="history-meta">
          <div class="history-cat">${h.cat.label}</div>
          <div class="history-detail">
            ${u ? `${h.weightKg.toFixed(1)} kg` : `${(h.weightKg*2.20462).toFixed(1)} lb`},
            ${u ? `${h.heightCm.toFixed(0)} cm` : `${(h.heightCm/2.54).toFixed(0)} in`},
            ${h.sex}, age ${h.age}
          </div>
        </div>
        <div class="history-time">${h.time}</div>
      </div>`).join('');
  }

  /* ─── Export ──────────────────────────────────────────── */
  _exportSummary() {
    const r = this.state.results;
    if (!r) { this.showToast('Calculate first'); return; }
    const u = r.unit === 'metric';
    const f  = (v, d=1) => v.toFixed(d);
    const wD = v => u ? `${f(v,1)} kg` : `${f(v*2.20462,1)} lb`;
    const hD = u ? `${f(r.heightCm,1)} cm` : `${Math.floor(r.heightInches/12)}ft ${(r.heightInches%12).toFixed(0)}in`;

    let txt = `BMI CALCULATOR — FULL REPORT\n${'═'.repeat(42)}\n`;
    txt += `Date/Time:     ${new Date().toLocaleString()}\n\n`;
    txt += `PERSONAL INFO\n${'-'.repeat(28)}\n`;
    txt += `Sex:           ${r.sex}\nAge:           ${r.age} years\n`;
    txt += `Height:        ${hD}\nWeight:        ${wD(r.weightKg)}\n\n`;
    txt += `BMI RESULTS\n${'-'.repeat(28)}\n`;
    txt += `BMI:           ${f(r.bmi,2)}\nCategory:      ${r.cat.label}\nRisk Level:    ${r.cat.risk}\n`;
    txt += `BMI Prime:     ${f(r.bmiPrime,3)}\nPonderal Index:${f(r.ponderal,2)} kg/m³\n\n`;
    txt += `BODY COMPOSITION\n${'-'.repeat(28)}\n`;
    txt += `Body Fat %:    ${f(r.bfPct,1)}%\nFat Mass:      ${wD(r.bfKg)}\nLean Mass:     ${wD(r.lbmKg)}\n\n`;
    txt += `IDEAL WEIGHT\n${'-'.repeat(28)}\n`;
    txt += `Devine:        ${wD(r.ibwDevine)}\nRobinson:      ${wD(r.ibwRobinson)}\n`;
    txt += `Miller:        ${wD(r.ibwMiller)}\nHamwi:         ${wD(r.ibwHamwi)}\n`;
    txt += `Average:       ${wD(r.ibwAvg)}\n`;
    txt += `Normal Range:  ${wD(r.minNormalKg)} – ${wD(r.maxNormalKg)}\n\n`;
    txt += `ENERGY\n${'-'.repeat(28)}\n`;
    txt += `BMR (Mifflin): ${Math.round(r.bmrMifflin)} kcal/day\nBMR (Harris):  ${Math.round(r.bmrHarris)} kcal/day\n\n`;
    txt += `⚕️ Disclaimer: This is for informational purposes only. Consult a healthcare professional.\n`;

    const blob = new Blob([txt], { type:'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'bmi-report.txt';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    this.showToast('Summary downloaded!');
  }

  _copyResults() {
    const r = this.state.results;
    if (!r) { this.showToast('Calculate first'); return; }
    const u = r.unit === 'metric';
    const wD = v => u ? `${v.toFixed(1)} kg` : `${(v*2.20462).toFixed(1)} lb`;
    const txt = `BMI: ${r.bmi.toFixed(1)} (${r.cat.label}) | Body Fat: ${r.bfPct.toFixed(1)}% | LBM: ${wD(r.lbmKg)} | BMR: ${Math.round(r.bmrMifflin)} kcal/day | Ideal: ${wD(r.ibwAvg)}`;
    navigator.clipboard.writeText(txt)
      .then(() => this.showToast('Copied!'))
      .catch(() => this.showToast('Copy failed'));
  }

  /* ─── Toast ───────────────────────────────────────────── */
  showToast(msg) {
    const t = this.shadowRoot.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
  }

  /* ─── Event Listeners ─────────────────────────────────── */
  attachEventListeners() {
    const sr = this.shadowRoot;

    // Unit toggle
    sr.getElementById('metricBtn').addEventListener('click',   () => this._setUnit('metric'));
    sr.getElementById('imperialBtn').addEventListener('click', () => this._setUnit('imperial'));

    // Sex buttons
    sr.getElementById('sexMale').addEventListener('click',   () => this._setSex('male'));
    sr.getElementById('sexFemale').addEventListener('click', () => this._setSex('female'));

    // Calculate
    sr.getElementById('calcBtn').addEventListener('click', () => this._calculate());

    // Export / Copy
    sr.getElementById('exportBtn').addEventListener('click', () => this._exportSummary());
    sr.getElementById('copyBtn').addEventListener('click',   () => this._copyResults());

    // Clear history
    sr.getElementById('clearHistBtn').addEventListener('click', () => {
      this.state.history = [];
      this._renderHistory();
    });

    // Tabs
    sr.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        sr.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        sr.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        sr.querySelector(`.tab-content[data-tab-content="${tab.dataset.tab}"]`)?.classList.add('active');
      });
    });

    // Enter key to calculate
    sr.addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT') this._calculate();
    });
  }

  _setUnit(unit) {
    const sr = this.shadowRoot;
    this.state.unit = unit;

    sr.getElementById('metricBtn').classList.toggle('active', unit === 'metric');
    sr.getElementById('imperialBtn').classList.toggle('active', unit === 'imperial');

    const isMetric = unit === 'metric';
    sr.getElementById('heightMetric').style.display   = isMetric ? 'block' : 'none';
    sr.getElementById('heightImperial').style.display = isMetric ? 'none' : 'block';
    sr.getElementById('weightUnit').textContent = isMetric ? 'kg' : 'lb';
    sr.getElementById('waistUnit').textContent  = isMetric ? 'cm' : 'in';

    // Convert current values
    if (isMetric) {
      const ft  = parseFloat(sr.getElementById('heightFt').value) || 5;
      const ins = parseFloat(sr.getElementById('heightIn').value) || 7;
      sr.getElementById('heightCm').value = ((ft*12 + ins) * 2.54).toFixed(0);
      const lb = parseFloat(sr.getElementById('weight').value) || 154;
      sr.getElementById('weight').value = (lb * 0.453592).toFixed(1);
      const waistIn = parseFloat(sr.getElementById('waist').value);
      if (!isNaN(waistIn)) sr.getElementById('waist').value = (waistIn * 2.54).toFixed(1);
    } else {
      const cm = parseFloat(sr.getElementById('heightCm').value) || 170;
      const totalIn = cm / 2.54;
      sr.getElementById('heightFt').value = Math.floor(totalIn / 12);
      sr.getElementById('heightIn').value = (totalIn % 12).toFixed(0);
      const kg = parseFloat(sr.getElementById('weight').value) || 70;
      sr.getElementById('weight').value = (kg * 2.20462).toFixed(1);
      const waistCm = parseFloat(sr.getElementById('waist').value);
      if (!isNaN(waistCm)) sr.getElementById('waist').value = (waistCm / 2.54).toFixed(1);
    }
  }

  _setSex(sex) {
    const sr = this.shadowRoot;
    sr.getElementById('sexMale').classList.toggle('active',   sex === 'male');
    sr.getElementById('sexFemale').classList.toggle('active', sex === 'female');
    this._sex = () => sex;
  }

  _sex() { return 'male'; } // default, overridden by _setSex
}

customElements.define('advanced-bmi-calculator', AdvancedBMICalculator);
