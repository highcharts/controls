/**
 * Highcharts Controls
 *
 * Provides UI controls to manipulate chart options on the fly.
 *
 * Used by the sample generator to create interactive samples:
 * - node tools/sample-generator/index.ts
 */
/* eslint-disable @highcharts/highcharts/no-highcharts-object */
const Product = window.Highcharts || window.Grid;
/**
 * Type guard for SelectControlParams
 */
function isSelectControlParams(params) {
    return params.type === 'select';
}
/**
 * Type guard for BooleanControlParams
 */
function isBooleanControlParams(params) {
    return params.type === 'boolean';
}
/**
 * Type guard for ColorControlParams
 */
function isColorControlParams(params) {
    return params.type === 'color';
}
/**
 * Type guard for NumberControlParams
 */
function isNumberControlParams(params) {
    return params.type === 'number';
}
/**
 * Type guard for TextControlParams
 */
function isTextControlParams(params) {
    return params.type === 'text';
}
/**
 * Type guard for GroupParams
 */
function isGroupParams(params) {
    return 'group' in params && Array.isArray(params.controls);
}
/**
 * Get a nested value from an object given a dot-separated path.
 * Supports array notation, e.g., 'series[0].name' or 'xAxis[0].title.text'
 */
function getNestedValue(obj, path) {
    // Split path into segments, handling array notation
    // e.g., 'series[0].data[1]' becomes ['series', '0', 'data', '1']
    const segments = path.split(/\.|\[|\]/).filter(s => s !== '');
    return segments.reduce((current, key) => current?.[key], obj);
}
class Controls {
    constructor(renderTo, options) {
        renderTo = (typeof renderTo === 'string' &&
            document.getElementById(renderTo)) ||
            (typeof renderTo === 'object' && renderTo) ||
            document.body.appendChild(Object.assign(document.createElement('div')));
        const outerContainer = renderTo.appendChild(Object.assign(document.createElement('div'), { className: 'highcharts-controls' }));
        this.container = outerContainer.appendChild(Object.assign(document.createElement('div'), { className: 'hcc-container' }));
        this.target = (options.target ||
            Product?.charts?.[0] ||
            Product?.grids?.[0]);
        if (!this.target) {
            throw new Error('No target chart found for Highcharts Controls');
        }
        // Inject CSS if requested
        if (options.injectCSS !== false) {
            this.injectCSS();
        }
        // Add the controls
        options.controls?.forEach((control) => {
            if (isGroupParams(control)) {
                this.addGroup(control);
            }
            else {
                this.addControl(control);
            }
        });
        this.addPreview();
        // Keep the options preview updated
        this.updateOptionsPreview();
    }
    /**
     * Set a nested value on the target given a dot-separated path.
     * Supports array notation, e.g., 'series[0].name' or 'xAxis[0].title.text'
     */
    setNestedValue(path, value, animation) {
        // Split path into segments, handling array notation
        // e.g., 'series[0].data[1]' becomes ['series', '0', 'data', '1']
        const keys = path.split(/\.|\[|\]/).filter(s => s !== '');
        const updateObj = {};
        let cur = updateObj;
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            if (i === keys.length - 1) {
                cur[k] = value;
            }
            else {
                // Check if next key is a number (array index)
                const nextKey = keys[i + 1];
                const isNextArray = !isNaN(Number(nextKey));
                cur[k] = isNextArray ? [] : {};
                cur = cur[k];
            }
        }
        this.target.update(updateObj, true, false, animation);
        this.updateOptionsPreview();
    }
    injectCSS() {
        // Check if CSS is already injected
        if (document.getElementById('highcharts-controls-css')) {
            return;
        }
        // Add minimal inline styles to prevent FOUC
        const inlineStyle = document.createElement('style');
        inlineStyle.id = 'highcharts-controls-inline';
        inlineStyle.nonce = 'highcharts';
        inlineStyle.textContent = `
            highcharts-group-description {
                display: none;
            }

            .highcharts-controls {
                opacity: 0;
                transition: opacity 0.1s;

                .hcc-control {
                    max-height: 3em;
                }

                .hidden {
                    max-height: 0;
                }
            }

            .highcharts-controls.loaded {
                opacity: 1;

                .hcc-control {
                    max-height: none;
                }
            }

        `;
        document.head.appendChild(inlineStyle);
        // Get the CSS URL from the module URL
        const cssUrl = import.meta.url.replace(/\/js\/[^/]+$/, '/css/controls.css');
        const link = document.createElement('link');
        link.id = 'highcharts-controls-css';
        link.rel = 'stylesheet';
        link.href = cssUrl;
        // Show controls when CSS is loaded
        link.onload = () => {
            document.querySelectorAll('.highcharts-controls').forEach((el) => el.classList.add('loaded'));
        };
        document.head.appendChild(link);
    }
    addPreview() {
        const div = this.container.appendChild(Object.assign(document.createElement('div'), {
            className: 'hcc-control hcc-button-control'
        }));
        div.appendChild(Object.assign(document.createElement('div'), { className: 'hcc-key' }));
        const valueDiv = div.appendChild(Object.assign(document.createElement('div'), { className: 'hcc-value' }));
        const valueDivInner = valueDiv.appendChild(Object.assign(document.createElement('div'), { className: 'hcc-value-inner' }));
        // Add the button
        const button = valueDivInner.appendChild(Object.assign(document.createElement('button'), {
            className: 'hcc-button hcc-show-preview-button',
            innerText: '{…}',
            title: 'Show / hide options preview'
        }));
        button.addEventListener('click', () => {
            const previewSection = this.container.querySelector('.hcc-preview-section');
            if (previewSection) {
                previewSection.classList.toggle('hidden');
                button.classList.toggle('active');
            }
        });
        // Add the preview element
        const previewSection = document.createElement('div');
        previewSection.className = 'hcc-preview-section hidden';
        previewSection.innerHTML =
            '<div class="hcc-preview-wrapper">' +
                '<div class="hcc-preview-content">' +
                '<h3>Current Options<span class="hcc-expand-icon" title="Expand preview">⇲</span></h3>' +
                '<pre class="hcc-options-preview"></pre>' +
                '</div>' +
                '</div>';
        this.container.appendChild(previewSection);
        // Add expand functionality
        const expandIcon = previewSection.querySelector('.hcc-expand-icon');
        if (expandIcon) {
            expandIcon.addEventListener('click', () => {
                previewSection.classList.toggle('expanded');
                expandIcon.innerText = previewSection.classList.contains('expanded') ? '⇱' : '⇲';
                expandIcon.title = previewSection.classList.contains('expanded')
                    ? 'Collapse preview'
                    : 'Expand preview';
            });
        }
    }
    /**
     * Add a select control
     */
    addSelectControl(params, keyDiv, valueDiv, controlDiv) {
        keyDiv.appendChild(Object.assign(document.createElement('label'), {
            innerText: params.path
        }));
        // Determine whether to use select dropdown or button group
        const totalLength = params.options.reduce((sum, opt) => sum + opt.length, 0);
        const useDropdown = params.options.length > 3 || totalLength > 24;
        if (useDropdown) {
            // Render as select dropdown
            valueDiv.classList.add('hcc-select-control');
            const select = valueDiv.appendChild(Object.assign(document.createElement('select'), {
                className: 'hcc-select-dropdown'
            }));
            params.options.forEach((option) => {
                const isSelected = params.value !== null && params.value !== undefined && params.value === option;
                const optionEl = select.appendChild(Object.assign(document.createElement('option'), {
                    value: option,
                    innerText: option,
                    selected: isSelected
                }));
            });
            select.addEventListener('change', () => {
                controlDiv.classList.remove('hcc-control-nullish');
                const value = select.value;
                this.setNestedValue(params.path, value);
            });
        }
        else {
            // Render as button group
            valueDiv.classList.add('hcc-button-group');
            params.options.forEach((option) => {
                const isActive = params.value !== null && params.value !== undefined && params.value === option;
                const button = valueDiv.appendChild(Object.assign(document.createElement('button'), {
                    className: 'hcc-button' +
                        (isActive ? ' active' : ''),
                    innerText: option
                }));
                button.dataset.path = params.path;
                button.dataset.value = option;
                button.addEventListener('click', () => {
                    controlDiv.classList.remove('hcc-control-nullish');
                    const value = button.getAttribute('data-value');
                    this.setNestedValue(params.path, value);
                    // Update active state for all buttons in this group
                    const allButtons = document.querySelectorAll(`[data-path="${params.path}"]`);
                    allButtons.forEach((b) => b.classList.remove('active'));
                    button.classList.add('active');
                });
            });
        }
    }
    /**
     * Add a boolean control
     */
    addBooleanControl(params, keyDiv, valueDiv, controlDiv) {
        const rid = params.path.replace(/[^a-z0-9_-]/gi, '-');
        keyDiv.appendChild(Object.assign(document.createElement('label'), {
            htmlFor: `toggle-checkbox-${rid}`,
            innerText: params.path
        }));
        const isNullish = params.value === null || params.value === undefined;
        const labelToggle = valueDiv.appendChild(Object.assign(document.createElement('label'), { className: 'hcc-toggle' }));
        const input = labelToggle.appendChild(Object.assign(document.createElement('input'), {
            type: 'checkbox',
            id: `toggle-checkbox-${rid}`
        }));
        labelToggle.appendChild(Object.assign(document.createElement('span'), {
            className: 'hcc-toggle-slider',
            'aria-hidden': 'true'
        }));
        input.checked = Boolean(params.value);
        input.addEventListener('change', () => {
            controlDiv.classList.remove('hcc-control-nullish');
            const value = input.checked;
            this.setNestedValue(params.path, value);
        });
    }
    /**
     * Add a color control
     */
    addColorControl(params, keyDiv, valueDiv, controlDiv) {
        const rid = params.path.replace(/[^a-z0-9_-]/gi, '-');
        keyDiv.appendChild(Object.assign(document.createElement('label'), {
            htmlFor: `color-input-${rid}`,
            innerText: params.path
        }));
        const colorInput = valueDiv.appendChild(Object.assign(document.createElement('input'), {
            type: 'color',
            id: `color-input-${rid}`
        }));
        const valueEl = valueDiv.appendChild(Object.assign(document.createElement('label'), {
            id: `color-value-${rid}`,
            className: 'hcc-color-value',
            htmlFor: `color-input-${rid}`
        }));
        const opacityInput = valueDiv.appendChild(Object.assign(document.createElement('input'), {
            type: 'text',
            id: `opacity-input-${rid}`,
            className: 'hcc-opacity-input'
        }));
        valueDiv.appendChild(Object.assign(document.createElement('span'), {
            textContent: '%',
            className: 'hcc-opacity-input-label'
        }));
        const getHex = (color, includeAlpha) => {
            const rgba = color.rgba;
            let hex = `#${(((1 << 24) +
                (rgba[0] << 16) +
                (rgba[1] << 8) +
                rgba[2])
                .toString(16)
                .slice(1)).toLowerCase()}`;
            if (includeAlpha && rgba[3] !== undefined && rgba[3] !== 1) {
                const alpha = Math.round(rgba[3] * 255);
                hex += ((1 << 8) + alpha).toString(16).slice(1).toLowerCase();
            }
            return hex;
        };
        // Add a validator for the opacity input. It should be a number between
        // 0 and 100.
        opacityInput.addEventListener('input', () => {
            let value = parseFloat(opacityInput.value);
            if (isNaN(value)) {
                value = 100;
            }
            if (value < 0) {
                value = 0;
            }
            else if (value > 100) {
                value = 100;
            }
            opacityInput.value = String(value);
        });
        const isNullish = params.value === null || params.value === undefined;
        let hcColor = isNullish ? Product.color('#808080') : Product.color(params.value);
        if (!isNullish && hcColor.rgba.toString().indexOf('NaN') !== -1) {
            console.warn(`Highcharts Controls: Invalid color value for path "${params.path}": ${params.value}`);
            // Treat invalid color as nullish
            controlDiv.classList.add('hcc-control-nullish');
            valueEl.textContent = '—';
            colorInput.value = '#808080';
            opacityInput.value = '100';
        }
        else if (isNullish) {
            valueEl.textContent = '—';
            colorInput.value = '#808080';
            opacityInput.value = '100';
        }
        else {
            const hex = getHex(hcColor), opacity = (hcColor.rgba[3] || 1) * 100;
            colorInput.value = hex;
            valueEl.textContent = hex;
            opacityInput.value = String(opacity);
        }
        const update = () => {
            controlDiv.classList.remove('hcc-control-nullish');
            const rgba = colorInput.value; // E.g. #RRGGBB
            const opacity = parseFloat(opacityInput.value) / 100;
            // Use Highcharts.color to apply opacity and produce rgba()/hex
            const hcColor = Product.color(rgba)
                .setOpacity(opacity);
            this.setNestedValue(params.path, getHex(hcColor, true), false);
            valueEl.textContent = getHex(hcColor);
        };
        colorInput.addEventListener('input', update);
        opacityInput.addEventListener('input', update);
    }
    /**
     * Add a number control
     */
    addNumberControl(params, keyDiv, valueDiv, controlDiv) {
        const rid = params.path.replace(/[^a-z0-9_-]/gi, '-'), value = params.value;
        // Extract unit from current value if it's a string
        let unit = '';
        let numericValue;
        if (typeof value === 'string') {
            const match = value.match(/^([+-]?\d+\.?\d*)\s*(.*)$/);
            if (match) {
                numericValue = parseFloat(match[1]);
                unit = match[2] || unit;
            }
        }
        else {
            numericValue = value;
        }
        // Set default min/max if not provided
        if (params.min === void 0 || params.max === void 0) {
            if (/(lineWidth|borderWidth)$/i.test(params.path)) {
                params.min = params.min ?? 0;
                params.max = params.max ?? 5;
            }
            else if (/\.(x|y|offsetX|offsetY|offset)$/i.test(params.path)) {
                params.min = params.min ?? -100;
                params.max = params.max ?? 100;
            }
            else {
                params.min = params.min ?? 0;
                params.max = params.max ?? 100;
            }
        }
        // Set default step for em/rem units
        if (!params.step && (unit === 'em' || unit === 'rem')) {
            params.step = 0.1;
        }
        keyDiv.appendChild(Object.assign(document.createElement('label'), {
            htmlFor: `range-input-${rid}`,
            innerText: params.path
        }));
        const isNullish = numericValue === null || numericValue === undefined;
        const valueEl = valueDiv.appendChild(Object.assign(document.createElement('span'), {
            id: `range-value-${rid}`,
            className: 'hcc-range-value'
        }));
        const input = valueDiv.appendChild(Object.assign(document.createElement('input'), {
            type: 'range',
            id: `range-input-${rid}`,
            min: String(params.min),
            max: String(params.max),
            step: String(params.step || 1)
        }));
        if (isNullish) {
            // Set to middle of range for nullish state
            input.value = String((params.min + params.max) / 2);
            valueEl.textContent = '';
        }
        else {
            input.value = String(numericValue);
            valueEl.textContent = unit ? `${numericValue}${unit}` : String(numericValue);
        }
        input.addEventListener('input', () => {
            controlDiv.classList.remove('hcc-control-nullish');
            const numValue = parseFloat(input.value);
            const displayValue = unit ? `${numValue}${unit}` : String(numValue);
            const chartValue = unit ? `${numValue}${unit}` : numValue;
            valueEl.textContent = displayValue;
            this.setNestedValue(params.path, chartValue, false);
        });
    }
    /**
     * Add a text control
     */
    addTextControl(params, keyDiv, valueDiv, controlDiv) {
        const rid = params.path.replace(/[^a-z0-9_-]/gi, '-');
        keyDiv.appendChild(Object.assign(document.createElement('label'), {
            htmlFor: `text-input-${rid}`,
            innerText: params.path
        }));
        const input = valueDiv.appendChild(Object.assign(document.createElement('input'), {
            type: 'text',
            id: `text-input-${rid}`,
            className: 'hcc-text-input'
        }));
        input.value = String(params.value || '');
        input.addEventListener('input', () => {
            controlDiv.classList.remove('hcc-control-nullish');
            const value = input.value;
            this.setNestedValue(params.path, value, false);
        });
    }
    /**
     * Add a group of controls
     */
    addGroup(params) {
        if (!this.container) {
            throw new Error('Container for controls not found');
        }
        // Create group container
        const groupDiv = this.container.appendChild(Object.assign(document.createElement('div'), {
            className: `hcc-group${params.className ? ' ' + params.className : ''}${params.collapsed ? ' hcc-group-collapsed' : ''}`
        }));
        // Create group header
        const headerDiv = groupDiv.appendChild(Object.assign(document.createElement('div'), { className: 'hcc-group-header' }));
        // Add collapse button if collapsible
        if (params.collapsible === true) {
            const collapseButton = headerDiv.appendChild(Object.assign(document.createElement('button'), {
                className: 'hcc-group-toggle',
                innerHTML: '❯',
                'aria-label': 'Toggle group'
            }));
            collapseButton.addEventListener('click', () => {
                groupDiv.classList.toggle('hcc-group-collapsed');
            });
        }
        // Add group title
        headerDiv.appendChild(Object.assign(document.createElement('h3'), {
            className: 'hcc-group-title',
            textContent: params.group
        }));
        // Add description if provided
        if (params.description) {
            const descriptionEl = groupDiv.appendChild(Object.assign(document.createElement('p'), { className: 'hcc-group-description' }));
            descriptionEl.innerHTML = params.description;
        }
        // Create controls container within group
        const groupControlsDiv = groupDiv.appendChild(Object.assign(document.createElement('div'), { className: 'hcc-group-controls' }));
        // Temporarily swap container to add controls to group
        const originalContainer = this.container;
        this.container = groupControlsDiv;
        // Add controls to the group
        params.controls.forEach((control) => {
            this.addControl(control);
        });
        // Restore original container
        this.container = originalContainer;
    }
    /**
     * Deduce control type based on the params
     */
    deduceControlType(params) {
        const value = params.value;
        if (typeof value === 'boolean') {
            return 'boolean';
        }
        if (typeof value === 'number' ||
            // Allow numeric strings with units limited to px, em, rem, %
            (typeof value === 'string' &&
                /^-?\d+\.?\d*\s*(px|em|rem|%)$/.test(value))) {
            return 'number';
        }
        if (Array.isArray(params.options)) {
            return 'select';
        }
        if (params.path.toLowerCase().indexOf('color') !== -1) {
            return 'color';
        }
        if (typeof value === 'string') {
            if (Product.color(value).rgba.toString().indexOf('NaN') === -1) {
                return 'color';
            }
            return 'text';
        }
        // Default to text
        return 'text';
    }
    /**
     * Add a control
     */
    addControl(params) {
        if (!this.container) {
            throw new Error('Container for controls not found');
        }
        // Infer value and type if not provided. Value comes first as it may
        // influence type deduction.
        params.value ?? (params.value = getNestedValue(this.target.options, params.path));
        params.type || (params.type = this.deduceControlType(params));
        const isNullish = params.value === null || params.value === undefined;
        const div = this.container.appendChild(Object.assign(document.createElement('div'), { className: `hcc-control hcc-control-${params.type}${isNullish ? ' hcc-control-nullish' : ''}` }));
        const keyDiv = div.appendChild(Object.assign(document.createElement('div'), { className: 'hcc-key' }));
        const valueDiv = div.appendChild(Object.assign(document.createElement('div'), { className: 'hcc-value' }));
        const valueDivInner = valueDiv.appendChild(Object.assign(document.createElement('div'), { className: 'hcc-value-inner' }));
        if (isSelectControlParams(params)) {
            this.addSelectControl(params, keyDiv, valueDivInner, div);
        }
        else if (isBooleanControlParams(params)) {
            this.addBooleanControl(params, keyDiv, valueDivInner, div);
        }
        else if (isColorControlParams(params)) {
            this.addColorControl(params, keyDiv, valueDivInner, div);
        }
        else if (isNumberControlParams(params)) {
            this.addNumberControl(params, keyDiv, valueDivInner, div);
        }
        else if (isTextControlParams(params)) {
            this.addTextControl(params, keyDiv, valueDivInner, div);
        }
    }
    /**
     * Escape HTML entities in a string.
     */
    escapeHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    /**
     * Format JSON with syntax highlighting and JavaScript-like formatting.
     */
    formatJSONWithHighlighting(obj) {
        const json = JSON.stringify(obj, null, 2);
        // Escape HTML in the entire JSON string first
        let formatted = this.escapeHTML(json);
        // Convert to JavaScript-like syntax: remove quotes from keys, use single quotes
        formatted = formatted
            // Remove quotes from property names
            .replace(/&quot;([^&]+)&quot;:/g, '$1:')
            // Convert double quotes to single quotes for string values (allowing escaped entities)
            .replace(/: &quot;((?:[^&]|&[a-z]+;)*?)&quot;/g, ": &#39;$1&#39;");
        // Apply syntax highlighting with HTML spans
        formatted = formatted
            // Highlight property names
            .replace(/^(\s*)([a-zA-Z_$][a-zA-Z0-9_$]*):/gm, '$1<span class="hcc-syntax-key">$2</span>:')
            // Highlight string values (single quotes, allowing escaped entities)
            .replace(/: &#39;((?:[^&]|&[a-z]+;)*?)&#39;/g, ': <span class="hcc-syntax-string">&#39;$1&#39;</span>')
            // Highlight numbers
            .replace(/: (-?\d+\.?\d*)/g, ': <span class="hcc-syntax-number">$1</span>')
            // Highlight booleans
            .replace(/: (true|false)/g, ': <span class="hcc-syntax-boolean">$1</span>')
            // Highlight null
            .replace(/: (null)/g, ': <span class="hcc-syntax-null">$1</span>');
        return formatted;
    }
    /**
     * Update the options preview element with the current chart options.
     */
    updateOptionsPreview() {
        const previewEl = this.container.parentElement
            ?.querySelector('.hcc-options-preview');
        if (previewEl) {
            const options = this.target.getOptions() || {};
            // Empty xAxis and yAxis structures
            Object.keys(options).forEach((key) => {
                if (JSON.stringify(options[key]) === '[{}]') {
                    delete options[key];
                }
            });
            previewEl.innerHTML = this.formatJSONWithHighlighting(options);
        }
    }
}
/**
 * Construct Highcharts Controls
 * @param container
 * @param options
 * @returns
 */
Controls.controls = function (container, options) {
    return new Controls(container, options);
};
window.HighchartsControls = Controls;
// Create a web component around the Controls class
// @example
// <highcharts-controls target="#container">
//     <highcharts-control
//         type="color"
//         path="chart.backgroundColor"
//         value="#ff0000"
//     ></highcharts-control>
//     <highcharts-control
//         type="boolean"
//         path="legend.enabled"
//         value="true"
//     ></highcharts-control>
//     <highcharts-control
//         type="select"
//         path="legend.align"
//         options="left,center,right"
//         value="right"
//     ></highcharts-control>
// </highcharts-controls>
class HighchartsControlElement extends HTMLElement {
    getConfig() {
        const config = {
            path: this.getAttribute('path') || ''
        };
        if (this.hasAttribute('type')) {
            config.type = this.getAttribute('type');
        }
        if (this.hasAttribute('value')) {
            config.value = parseValue(this.getAttribute('value'));
        }
        if (this.hasAttribute('options')) {
            config.options = parseOptions(this.getAttribute('options'));
        }
        if (this.hasAttribute('min')) {
            config.min = parseFloat(this.getAttribute('min') || '0');
        }
        if (this.hasAttribute('max')) {
            config.max = parseFloat(this.getAttribute('max') || '100');
        }
        if (this.hasAttribute('step')) {
            config.step = parseFloat(this.getAttribute('step') || '1');
        }
        return config;
    }
}
class HighchartsGroupElement extends HTMLElement {
    getConfig() {
        const controls = [];
        let description;
        // Extract description from highcharts-group-description element
        const descriptionEl = this.querySelector(':scope > highcharts-group-description');
        if (descriptionEl) {
            description = descriptionEl.innerHTML?.trim() || undefined;
        }
        this.querySelectorAll(':scope > highcharts-control').forEach((controlEl) => {
            const control = controlEl.getConfig();
            if (control.path) {
                controls.push(control);
            }
        });
        return {
            group: this.getAttribute('header') || 'Group',
            description,
            collapsed: this.hasAttribute('collapsed'),
            collapsible: this.getAttribute('collapsible') === 'true',
            className: this.getAttribute('class') || undefined,
            controls
        };
    }
}
class HighchartsControlsElement extends HTMLElement {
    connectedCallback() {
        const controls = [], injectCSS = this.getAttribute('inject-css') !== 'false';
        let target = this.getTarget();
        const init = (target) => {
            Controls.controls(this, {
                target,
                injectCSS,
                controls: controls
            });
        };
        // Process direct children (both controls and groups)
        Array.from(this.children).forEach((child) => {
            if (child.tagName.toLowerCase() === 'highcharts-group') {
                const groupConfig = child.getConfig();
                controls.push(groupConfig);
            }
            else if (child.tagName.toLowerCase() === 'highcharts-control') {
                const control = child.getConfig();
                if (control.path) {
                    controls.push(control);
                }
            }
        });
        // Initialize if target is found
        if (target) {
            init(target);
        }
        else {
            // Listen for DOM update to retry initialization
            const observer = new MutationObserver(() => {
                target = this.getTarget();
                if (target) {
                    observer.disconnect();
                    init(target);
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }
    getTarget() {
        const targetAttr = this.getAttribute('target');
        if (targetAttr) {
            const el = document.querySelector(targetAttr);
            const target = el?.chart || el?.grid;
            if (target) {
                return target;
            }
        }
        return Product?.charts?.[0] || Product?.grids?.[0];
    }
}
customElements.define('highcharts-control', HighchartsControlElement);
customElements.define('highcharts-group', HighchartsGroupElement);
customElements.define('highcharts-group-description', class extends HTMLElement {
});
customElements.define('highcharts-controls', HighchartsControlsElement);
function parseValue(value) {
    if (value === 'true') {
        return true;
    }
    if (value === 'false') {
        return false;
    }
    if (!isNaN(Number(value))) {
        return Number(value);
    }
    return value;
}
function parseOptions(options) {
    if (options) {
        return options.split(',').map((s) => s.trim());
    }
    return [];
}
export default Controls;
//# sourceMappingURL=controls.js.map