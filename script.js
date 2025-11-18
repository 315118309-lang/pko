// Enhanced PKO Bounty Calculator with improved UX

class PKOCalculator {
    constructor() {
        this.lang = localStorage.getItem('pko_lang') || 'zh';
        this.initializeElements();
        this.attachEventListeners();
        this.applyTranslations();
        this.loadOpponentPreset('standard');
        this.applyOpponentRange();
        this.calculateBounty();
    }

    initializeElements() {
        // Input elements
        this.startingStackInput = document.getElementById('startingStack');
        this.startingBountyInput = document.getElementById('startingBounty');
        this.currentBBInput = document.getElementById('currentBB');
        this.opponentBountyInput = document.getElementById('opponentBounty');
        this.potBBInput = document.getElementById('potBB');
        this.callBBInput = document.getElementById('callBB');

        // Output elements
        this.bountyValueElement = document.getElementById('bountyValueBB');
        this.formulaTextElement = document.getElementById('formulaText');
        this.equityResultElement = document.getElementById('equityResultValue');
        this.equityFormulaTextElement = document.getElementById('equityFormulaText');

        this.targetEquityInput = document.getElementById('targetEquityPercent');
        this.rangeTextOutput = document.getElementById('rangeTextOutput');
        this.rangeMatrixContainer = document.getElementById('rangeMatrixContainer');
        this.rangeModeTextBtn = document.getElementById('rangeModeText');
        this.rangeModeMatrixBtn = document.getElementById('rangeModeMatrix');
        this.opponentPresetSelect = document.getElementById('opponentRangePreset');
        this.opponentRangeInput = document.getElementById('opponentRangeInput');
        this.applyOpponentRangeBtn = document.getElementById('applyOpponentRange');
        this.currentOpponentCombos = null;

        // Validation state
        this.isValid = true;
        this.previousValue = null;
    }

    attachEventListeners() {
        // Add input event listeners with debouncing
        const inputs = [
            this.startingStackInput,
            this.startingBountyInput,
            this.currentBBInput,
            this.opponentBountyInput,
            this.potBBInput,
            this.callBBInput
        ];

        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                this.handleInputChange(e);
            });

            input.addEventListener('focus', (e) => {
                this.handleInputFocus(e);
            });

            input.addEventListener('blur', (e) => {
                this.handleInputBlur(e);
            });
        });

        this.targetEquityInput?.addEventListener('input', () => {
            this.updateRangeAdvisor();
        });

        this.rangeModeTextBtn?.addEventListener('click', () => {
            this.setRangeMode('text');
        });
        this.rangeModeMatrixBtn?.addEventListener('click', () => {
            this.setRangeMode('matrix');
        });
        this.applyOpponentRangeBtn?.addEventListener('click', () => {
            this.applyOpponentRange();
        });
        this.opponentPresetSelect?.addEventListener('change', () => {
            this.loadOpponentPreset(this.opponentPresetSelect.value);
            this.updateRangeAdvisor();
        });

        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.calculateBounty();
            }
        });

        // Language switch
        const zhBtn = document.getElementById('langZh');
        const enBtn = document.getElementById('langEn');
        zhBtn?.addEventListener('click', () => this.setLanguage('zh'));
        enBtn?.addEventListener('click', () => this.setLanguage('en'));
    }

    handleInputChange(event) {
        const input = event.target;
        const value = parseFloat(input.value);

        // Real-time validation
        this.validateInput(input, value);

        // Debounced calculation
        clearTimeout(this.calculationTimeout);
        this.calculationTimeout = setTimeout(() => {
            this.calculateBounty();
        }, 300);
    }

    handleInputFocus(event) {
        event.target.parentElement.classList.add('focused');
    }

    handleInputBlur(event) {
        event.target.parentElement.classList.remove('focused');
    }

    validateInput(input, value) {
        const inputWrapper = input.parentElement;
        const isEmpty = input.value.trim() === '';
        const isNegative = !isNaN(value) && value < 0;
        const isZero = !isNaN(value) && value === 0;

        // Remove previous validation classes
        inputWrapper.classList.remove('error', 'success');

        if (isEmpty) {
            this.showError(input, 'Please enter a value');
            return false;
        }

        if (isNaN(value)) {
            this.showError(input, 'Please enter a valid number');
            return false;
        }

        if (isNegative) {
            this.showError(input, 'Value cannot be negative');
            return false;
        }

        if (isZero && input !== this.opponentBountyInput) {
            this.showError(input, 'Value must be greater than 0');
            return false;
        }

        this.showSuccess(input);
        return true;
    }

    showError(input, message) {
        const inputWrapper = input.parentElement;
        inputWrapper.classList.add('error');
        
        // Remove existing error message
        const existingError = inputWrapper.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Add error message
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        errorElement.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            margin-top: 4px;
            font-size: 12px;
            color: #e53e3e;
            font-weight: 500;
        `;
        inputWrapper.appendChild(errorElement);

        this.isValid = false;
    }

    showSuccess(input) {
        const inputWrapper = input.parentElement;
        inputWrapper.classList.add('success');

        // Remove error message if exists
        const errorMessage = inputWrapper.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }

        this.isValid = true;
    }

    calculateBounty() {
        if (!this.isValid) {
            this.displayError('Please fix the input errors');
            return;
        }

        try {
            const startingStack = parseFloat(this.startingStackInput.value) || 0;
            const startingBounty = parseFloat(this.startingBountyInput.value) || 0;
            const currentBB = parseFloat(this.currentBBInput.value) || 0;
            const opponentBounty = parseFloat(this.opponentBountyInput.value) || 0;
            const potBB = parseFloat(this.potBBInput?.value) || 0;
            const callBB = parseFloat(this.callBBInput?.value) || 0;

            // Core calculation formula
            const bountyMultiplier = opponentBounty / startingBounty;
            const oneBountyValueInBB = (startingStack * 0.25) / currentBB;
            const totalBountyValueInBB = bountyMultiplier * oneBountyValueInBB;

            // Update display with animation
            this.updateResult(totalBountyValueInBB, {
                startingStack,
                startingBounty,
                currentBB,
                opponentBounty,
                bountyMultiplier,
                oneBountyValueInBB
            });

            // Equity calculation: call / (pot + bountyValue + call)
            const denominator = potBB + totalBountyValueInBB + callBB;
            const equity = denominator > 0 ? (callBB / denominator) : 0;

            // Update equity UI
            const equityPercentText = `${(equity * 100).toFixed(2)}%`;
            if (this.equityResultElement) {
                this.equityResultElement.textContent = equityPercentText;
                this.equityResultElement.classList.add('updating');
                setTimeout(() => this.equityResultElement.classList.remove('updating'), 300);
            }

            // Update formula text sections
            const equityFormulaStr = `${callBB} ÷ (${potBB} + ${totalBountyValueInBB.toFixed(2)} + ${callBB}) = ${equityPercentText}`;
            if (this.formulaTextElement) {
                const calcFormulaStr = `CALCULATION FORMULA: (${opponentBounty} ÷ ${startingBounty}) × ((${startingStack} × 0.25) ÷ ${currentBB}) = ${totalBountyValueInBB.toFixed(2)} BB`;
                this.formulaTextElement.textContent = calcFormulaStr;
            }
            if (this.equityFormulaTextElement) {
                this.equityFormulaTextElement.textContent = equityFormulaStr;
            }

            if (this.targetEquityInput) {
                this.targetEquityInput.value = (equity * 100).toFixed(2);
            }
            this.updateRangeAdvisor();

        } catch (error) {
            console.error('Calculation error:', error);
            this.displayError('Calculation error occurred');
        }
    }

    updateResult(value, formulaData) {
        const formattedValue = value.toFixed(2);
        
        // Add animation class
        this.bountyValueElement.classList.add('updating');
        
        // Update value
        this.bountyValueElement.textContent = formattedValue;

        // Formula text is managed by calculateBounty for Equity; no update here

        // Remove animation class after animation completes
        setTimeout(() => {
            this.bountyValueElement.classList.remove('updating');
        }, 300);

        // Store previous value for comparison
        this.previousValue = formattedValue;
    }

    displayError(message) {
        this.bountyValueElement.textContent = '---';
        this.formulaTextElement.textContent = message;
        this.bountyValueElement.style.color = '#e53e3e';
    }

    // Utility methods
    formatNumber(num, decimals = 2) {
        return parseFloat(num).toFixed(decimals);
    }

    reset() {
        this.startingStackInput.value = '10000';
        this.startingBountyInput.value = '25';
        this.currentBBInput.value = '100';
        this.opponentBountyInput.value = '50';
        this.calculateBounty();
    }
    setLanguage(lang) {
        this.lang = lang;
        localStorage.setItem('pko_lang', lang);
        this.applyTranslations();
        this.calculateBounty();
    }

    applyTranslations() {
        const dict = {
            zh: {
                app_title: 'PKO 赏金换算器',
                app_subtitle: '专业赏金换算器',
                settings_title: '🏆 比赛设置',
                starting_stack: '初始筹码',
                chips_suffix: '筹码',
                starting_bounty: '初始赏金',
                current_title: '🎯 当前局面',
                current_bb: '当前大盲',
                opponent_bounty: '对手赏金',
                result_title: '赏金价值',
                result_unit: '大盲',
                formula_label_main: 'CALCULATION FORMULA',
                equity_title: '🟰 权益',
                pot_size: '底池大小',
                call_size: '跟注大小',
                equity_unit_label: '所需权益',
                equity_calc_label: '权益计算：',
                info_core_title: '核心法则',
                info_core_desc: '1个初始赏金 ≈ 初始筹码的25%'
                ,range_title: '📊 范围建议'
                ,target_equity_label: '目标权益%'
                ,mode_text: '文字'
                ,mode_matrix: '矩阵'
                ,range_explain_label: '计算依据'
                ,range_explain_text: '基于对手指定范围的加权平均胜率，选取不低于目标值的牌型组合。'
                ,opponent_preset_label: '对手范围预设'
                ,opponent_custom_label: '自定义对手范围'
                ,apply_range: '应用范围'
                ,preset_standard: '标准'
                ,preset_tight: '紧'
                ,preset_loose: '松'
                ,preset_push15: 'Push 15bb'
                ,preset_random: '随机'
            },
            en: {
                app_title: 'PKO Calculator',
                app_subtitle: 'Professional Bounty Converter',
                settings_title: '🏆 Tournament Settings',
                starting_stack: 'Starting Stack',
                chips_suffix: 'chips',
                starting_bounty: 'Starting Bounty',
                current_title: '🎯 Current Situation',
                current_bb: 'Current Big Blind',
                opponent_bounty: "Opponent's Bounty",
                result_title: 'Bounty Value',
                result_unit: 'Big Blinds',
                formula_label_main: 'CALCULATION FORMULA',
                equity_title: '🟰 Equity',
                pot_size: 'Pot Size',
                call_size: 'Call Size',
                equity_unit_label: 'Required Equity',
                equity_calc_label: 'Equity Calculation:',
                info_core_title: 'Core Rule',
                info_core_desc: '1 starting bounty ≈ 25% of starting chips'
                ,range_title: '📊 Range Advisory'
                ,target_equity_label: 'Target Equity %'
                ,mode_text: 'Text'
                ,mode_matrix: 'Matrix'
                ,range_explain_label: 'Basis'
                ,range_explain_text: 'Select combos meeting the target equity based on weighted average vs selected opponent range.'
                ,opponent_preset_label: 'Opponent Preset'
                ,opponent_custom_label: 'Custom Range'
                ,apply_range: 'Apply Range'
                ,preset_standard: 'Standard'
                ,preset_tight: 'Tight'
                ,preset_loose: 'Loose'
                ,preset_push15: 'Push 15bb'
                ,preset_random: 'Random'
            }
        }[this.lang];

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key]) el.textContent = dict[key];
        });
    }

    runTests() {
        const t0 = performance.now();
        this.renderRangeMatrix(0);
        const t1 = performance.now();
        const perfOk = (t1 - t0) < 500;
        const boundaryAll = this.renderRangeTextCheck(0).count === 169;
        const boundaryNone = this.renderRangeTextCheck(100).count === 0;
        const sampleInclude = this.preflopEquity('AKo') >= 60;
        this.loadOpponentPreset('tight');
        this.applyOpponentRange();
        const eqVsTight = this.equityVsSelectedRange('AKo');
        this.loadOpponentPreset('random');
        this.applyOpponentRange();
        const eqVsRandom = this.equityVsSelectedRange('AKo');
        const rangeEffect = eqVsRandom >= eqVsTight;
        const results = { perfOk, boundaryAll, boundaryNone, sampleInclude, rangeEffect };
        const ok = Object.values(results).every(Boolean);
        const el = document.createElement('div');
        el.style.display = 'none';
        el.id = 'rangeTestSummary';
        el.textContent = JSON.stringify(results);
        document.body.appendChild(el);
        return ok;
    }

    renderRangeTextCheck(threshold) {
        const ranks = ['A','K','Q','J','T','9','8','7','6','5','4','3','2'];
        let count = 0;
        for (let r = 0; r < ranks.length; r++) {
            for (let c = 0; c < ranks.length; c++) {
                const hi = ranks[r];
                const lo = ranks[c];
                const isPair = hi === lo;
                const isSuited = r < c;
                const combo = isPair ? hi+hi : hi + lo + (isSuited ? 's' : 'o');
                const eq = this.preflopEquity(combo);
                if (eq >= threshold) count++;
            }
        }
        return { count };
    }

    setRangeMode(mode) {
        if (mode === 'text') {
            this.rangeModeTextBtn.classList.add('active');
            this.rangeModeMatrixBtn.classList.remove('active');
            this.rangeTextOutput.style.display = 'block';
            this.rangeMatrixContainer.style.display = 'none';
        } else {
            this.rangeModeMatrixBtn.classList.add('active');
            this.rangeModeTextBtn.classList.remove('active');
            this.rangeTextOutput.style.display = 'none';
            this.rangeMatrixContainer.style.display = 'grid';
        }
    }

    updateRangeAdvisor() {
        const threshold = Math.max(0, Math.min(100, parseFloat(this.targetEquityInput?.value || '0')));
        this.renderRangeMatrix(threshold);
        this.renderRangeText(threshold);
        if (!this.rangeModeTextBtn.classList.contains('active') && !this.rangeModeMatrixBtn.classList.contains('active')) {
            this.setRangeMode('matrix');
        }
    }

    renderRangeMatrix(threshold) {
        if (!this.rangeMatrixContainer) return;
        const ranks = ['A','K','Q','J','T','9','8','7','6','5','4','3','2'];
        const frag = document.createDocumentFragment();
        this.rangeMatrixContainer.innerHTML = '';
        for (let r = 0; r < ranks.length; r++) {
            for (let c = 0; c < ranks.length; c++) {
                const isPair = r === c;
                const isSuited = r < c;
                const hiIdx = Math.min(r, c);
                const loIdx = Math.max(r, c);
                const hi = ranks[hiIdx];
                const lo = ranks[loIdx];
                const combo = isPair ? hi+hi : hi + lo + (isSuited ? 's' : 'o');
                const eq = this.equityVsSelectedRange(combo);
                const cell = document.createElement('div');
                cell.className = 'range-cell' + (eq >= threshold ? ' selected' : '');
                const label = document.createElement('div');
                label.className = 'label';
                label.textContent = combo;
                cell.appendChild(label);
                frag.appendChild(cell);
            }
        }
        this.rangeMatrixContainer.appendChild(frag);
    }

    renderRangeText(threshold) {
        if (!this.rangeTextOutput) return;
        const ranks = ['A','K','Q','J','T','9','8','7','6','5','4','3','2'];
        const selected = [];
        for (let r = 0; r < ranks.length; r++) {
            for (let c = 0; c < ranks.length; c++) {
                const isPair = r === c;
                const isSuited = r < c;
                const hiIdx = Math.min(r, c);
                const loIdx = Math.max(r, c);
                const hi = ranks[hiIdx];
                const lo = ranks[loIdx];
                const combo = isPair ? hi+hi : hi + lo + (isSuited ? 's' : 'o');
                const eq = this.equityVsSelectedRange(combo);
                if (eq >= threshold) selected.push({ combo, eq });
            }
        }
        selected.sort((a,b)=> b.eq - a.eq);
        const text = this.groupCombos(selected.map(x=>x.combo));
        this.rangeTextOutput.textContent = text;
    }

    loadOpponentPreset(key) {
        const presets = {
            standard: '66+, ATs+, KJs+, QJs, AJo+, KQo',
            tight: '77+, AJs+, KQs, AQo+',
            loose: '55+, A9s+, KTs+, QTs+, JTs, ATo+, KJo+, QJo',
            push15: '22+, A2s+, K9s+, Q9s+, J9s+, T9s, A2o+, KTo+, QTo+, JTo',
            random: ''
        };
        const val = presets[key] || presets.standard;
        this.opponentRangeInput.value = val;
        this.currentOpponentCombos = null;
    }

    applyOpponentRange() {
        this.currentOpponentCombos = this.parseRange(this.opponentRangeInput.value || '');
        this.updateRangeAdvisor();
    }

    equityVsSelectedRange(hero) {
        const combos = this.currentOpponentCombos || this.parseRange(this.opponentRangeInput?.value || '');
        if (!combos || combos.length===0) return this.preflopEquity(hero);
        let sum = 0;
        let wsum = 0;
        for (const opp of combos) {
            const w = this.comboWeight(opp);
            const p = this.headToHeadApprox(hero, opp);
            sum += p * w;
            wsum += w;
        }
        const eq = wsum>0 ? sum/wsum : this.preflopEquity(hero);
        return parseFloat(eq.toFixed(2));
    }

    comboWeight(combo) {
        if (combo.length===2) return 6;
        return combo.endsWith('s') ? 4 : 12;
    }

    headToHeadApprox(hero, opp) {
        const eH = this.preflopEquity(hero);
        const eO = this.preflopEquity(opp);
        let p = 50 + (eH - eO) * 1.2;
        p = Math.max(20, Math.min(80, p));
        return p;
    }

    parseRange(text) {
        const ranks = ['A','K','Q','J','T','9','8','7','6','5','4','3','2'];
        const idx = r=> ranks.indexOf(r);
        const addPairPlus = (r)=> {
            const i = idx(r);
            const list = [];
            for (let k=i; k>=0; k--) list.push(ranks[k]+ranks[k]);
            return list;
        };
        const addNonPairPlus = (hi, lo, sfx)=> {
            const iHi = idx(hi);
            const iLo = idx(lo);
            const list = [];
            for (let k=iLo; k>iHi; k--) list.push(hi + ranks[k] + sfx);
            return list;
        };
        const parseToken = (t)=> {
            t = t.trim().toUpperCase();
            if (!t) return [];
            const plus = t.endsWith('+');
            const base = plus ? t.slice(0,-1) : t;
            if (base.length===2 && base[0]===base[1]) {
                return plus ? addPairPlus(base[0]) : [base];
            }
            const sfx = base.endsWith('S') ? 's' : base.endsWith('O') ? 'o' : '';
            const core = sfx ? base.slice(0,-1) : base;
            const hi = core[0];
            const lo = core[1];
            if (!hi || !lo) return [];
            if (plus) {
                const list = addNonPairPlus(hi, lo, sfx||'o');
                return list;
            }
            if (sfx) return [hi+lo+sfx];
            return [hi+lo+'s', hi+lo+'o'];
        };
        const tokens = text.split(',');
        const out = [];
        const set = new Set();
        for (const tk of tokens) {
            const arr = parseToken(tk);
            for (const c of arr) {
                if (!set.has(c)) { set.add(c); out.push(c); }
            }
        }
        return out;
    }

    groupCombos(list) {
        const ranks = ['A','K','Q','J','T','9','8','7','6','5','4','3','2'];
        const idx = r=> ranks.indexOf(r);
        const pairs = list.filter(x=> x.length===2).sort((a,b)=> idx(a[0]) - idx(b[0]));
        let pairGroup = '';
        if (pairs.length) {
            const min = pairs[pairs.length-1];
            pairGroup = min + '+';
        }
        const axo = list.filter(x=> x.startsWith('A') && x.endsWith('o') && x[1] !== 'A').map(x=> x[1]).map(k=> idx(k)).sort((a,b)=> a-b);
        let axoGroup = '';
        if (axo.length) {
            const minK = ranks[axo[0]];
            axoGroup = 'A' + minK + 'o+';
        }
        const axs = list.filter(x=> x.startsWith('A') && x.endsWith('s') && x[1] !== 'A').map(x=> x[1]).map(k=> idx(k)).sort((a,b)=> a-b);
        let axsGroup = '';
        if (axs.length) {
            const minK = ranks[axs[0]];
            axsGroup = 'A' + minK + 's+';
        }
        const specials = [];
        ['KQo','KQs','QJs','JTs'].forEach(h=>{ if (list.includes(h)) specials.push(h); });
        const singles = list.filter(x=> !x.endsWith('+') && !['AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22'].includes(x) && !x.startsWith('A')); 
        const merged = [pairGroup, axoGroup, axsGroup].filter(Boolean).concat(specials).concat(singles.slice(0,20));
        return merged.join(', ');
    }

    preflopEquity(combo) {
        const ranks = ['A','K','Q','J','T','9','8','7','6','5','4','3','2'];
        const val = r => 14 - ranks.indexOf(r);
        const hi = combo[0];
        const lo = combo[1];
        const isPair = hi===lo;
        const suited = combo.endsWith('s');
        if (isPair) {
            const v = val(hi);
            return Math.min(86, Math.max(50, 45 + v*2.9));
        }
        const h = val(hi);
        const l = val(lo);
        const gap = Math.abs(ranks.indexOf(hi) - ranks.indexOf(lo));
        let base = suited ? 30 : 28;
        let eq = base + h*1.6 + l*0.7;
        if (gap===1) eq += 1.6;
        else if (gap===2) eq += 0.8;
        if (suited) eq += 2.2;
        if (h>=10 && l>=10) eq += 1.0;
        if (combo==='A5s') eq += 1.2;
        return Math.max(35, Math.min(86, parseFloat(eq.toFixed(2))));
    }
}

// Enhanced CSS for validation states
const additionalStyles = `
    .input-wrapper {
        position: relative;
    }
    
    .input-wrapper.focused input {
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    
    .input-wrapper.error input {
        border-color: #fc8181;
        background-color: #fff5f5;
    }
    
    .input-wrapper.success input {
        border-color: #68d391;
        background-color: #f0fff4;
    }
    
    .error-message {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        margin-top: 4px;
        font-size: 12px;
        color: #e53e3e;
        font-weight: 500;
    }
`;

// Add additional styles to the page
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Initialize the calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new PKOCalculator();
    app.runTests();
});

// Expose calculator to global scope for debugging
window.PKOCalculator = PKOCalculator;
