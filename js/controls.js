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
 * Type guard for ArrayControlParams
 */
function isArrayControlParams(params) {
    return params.type === 'array-of-strings';
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
 * Get a nested value from an object given a dot-separated path.
 */
function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}
/**
 * Set a nested value on the chart given a dot-separated path.
 */
function setNestedValue(chart, path, value, animation) {
    const keys = path.split('.');
    const updateObj = {};
    let cur = updateObj;
    for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        if (i === keys.length - 1) {
            cur[k] = value;
        }
        else {
            cur[k] = {};
            cur = cur[k];
        }
    }
    chart.update(updateObj, true, true, animation);
}
class Controls {
    constructor(renderTo, options) {
        renderTo = (typeof renderTo === 'string' &&
            document.getElementById(renderTo)) ||
            (typeof renderTo === 'object' && renderTo) ||
            document.body.appendChild(Object.assign(document.createElement('div')));
        const outerContainer = renderTo.appendChild(Object.assign(document.createElement('div'), { className: 'highcharts-controls' }));
        this.container = outerContainer.appendChild(Object.assign(document.createElement('div'), { className: 'highcharts-controls-container' }));
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
            this.addControl(control);
        });
        this.addPreview();
        // Keep the options preview updated
        this.updateOptionsPreview();
        Product.addEvent?.(this.target, 'render', this.updateOptionsPreview.bind(this));
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
            .highcharts-controls {
                opacity: 0;
                transition: opacity 0.1s;

                .highcharts-controls-control {
                    max-height: 3em;
                }
                .hidden {
                    max-height: 0;
                }
            }

            .highcharts-controls.loaded {
                opacity: 1;

                .highcharts-controls-control {
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
            className: 'highcharts-controls-control button-control'
        }));
        div.appendChild(Object.assign(document.createElement('div'), { className: 'highcharts-controls-key' }));
        const valueDiv = div.appendChild(Object.assign(document.createElement('div'), { className: 'highcharts-controls-value' }));
        const valueDivInner = valueDiv.appendChild(Object.assign(document.createElement('div'), { className: 'highcharts-controls-value-inner' }));
        // Add the button
        const button = valueDivInner.appendChild(Object.assign(document.createElement('button'), {
            className: 'highcharts-controls-button show-preview-button',
            innerText: '{…}',
            title: 'Show / hide options preview'
        }));
        button.addEventListener('click', () => {
            const previewSection = this.container.querySelector('.preview-section');
            if (previewSection) {
                previewSection.classList.toggle('hidden');
                button.classList.toggle('active');
            }
        });
        // Add the preview element
        this.container.appendChild(Object.assign(document.createElement('div'), {
            className: 'preview-section hidden',
            innerHTML: '<h3>Current Options</h3>' +
                '<pre class="options-preview"></pre>'
        }));
    }
    /**
     * Add an array of strings control
     */
    addArrayControl(params, keyDiv, valueDiv) {
        const { target } = this;
        keyDiv.appendChild(Object.assign(document.createElement('label'), {
            innerText: params.path
        }));
        valueDiv.classList.add('button-group');
        params.options.forEach((option) => {
            const button = valueDiv.appendChild(Object.assign(document.createElement('button'), {
                className: 'highcharts-controls-button' +
                    (params.value === option ? ' active' : ''),
                innerText: option
            }));
            button.dataset.path = params.path;
            button.dataset.value = option;
            button.addEventListener('click', function () {
                const value = this.getAttribute('data-value');
                setNestedValue(target, params.path, value);
                // Update active state for all buttons in this group
                const allButtons = document.querySelectorAll(`[data-path="${params.path}"]`);
                allButtons.forEach((b) => b.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }
    /**
     * Add a boolean control
     */
    addBooleanControl(params, keyDiv, valueDiv) {
        const rid = params.path.replace(/[^a-z0-9_-]/gi, '-');
        keyDiv.appendChild(Object.assign(document.createElement('label'), {
            htmlFor: `toggle-checkbox-${rid}`,
            innerText: params.path
        }));
        const labelToggle = valueDiv.appendChild(Object.assign(document.createElement('label'), { className: 'hc-toggle' }));
        const input = labelToggle.appendChild(Object.assign(document.createElement('input'), {
            type: 'checkbox',
            id: `toggle-checkbox-${rid}`
        }));
        labelToggle.appendChild(Object.assign(document.createElement('span'), {
            className: 'hc-toggle-slider',
            'aria-hidden': 'true'
        }));
        // Use override value if provided, otherwise get current value from
        // chart
        const currentValue = params.value !== void 0 ?
            params.value :
            getNestedValue(this.target.options, params.path);
        input.checked = currentValue;
        input.addEventListener('change', () => {
            const value = input.checked;
            setNestedValue(this.target, params.path, value);
        });
    }
    /**
     * Add a color control
     */
    addColorControl(params, keyDiv, valueDiv) {
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
            className: 'hc-color-value',
            htmlFor: `color-input-${rid}`
        }));
        valueDiv.classList.add('color-control');
        const opacityInput = valueDiv.appendChild(Object.assign(document.createElement('input'), {
            type: 'text',
            id: `opacity-input-${rid}`,
            className: 'opacity-input'
        }));
        valueDiv.appendChild(Object.assign(document.createElement('span'), {
            textContent: '%',
            className: 'opacity-input-label'
        }));
        const getHex = (color) => {
            const rgba = color.rgba;
            return (`#${(((1 << 24) +
                (rgba[0] << 16) +
                (rgba[1] << 8) +
                rgba[2])
                .toString(16)
                .slice(1)).toLowerCase()}`);
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
        // Use override value if provided, otherwise get current value from
        // chart
        const currentValue = params.value !== void 0 ?
            params.value :
            (getNestedValue(this.target.options, params.path));
        let hcColor = Product.color(currentValue);
        if (hcColor.rgba.toString().indexOf('NaN') !== -1) {
            hcColor = Product.color('rgba(128, 128, 128, 0.5)'); // Fallback to gray
            console.warn(`Highcharts Controls: Invalid color value for path "${params.path}": ${currentValue}`);
        }
        const hex = getHex(hcColor), opacity = (hcColor.rgba[3] || 1) * 100;
        colorInput.value = hex;
        valueEl.textContent = hex;
        opacityInput.value = String(opacity);
        const update = () => {
            const rgba = colorInput.value; // E.g. #RRGGBB
            const opacity = parseFloat(opacityInput.value) / 100;
            // Use Highcharts.color to apply opacity and produce rgba()/hex
            const hcColor = Product.color(rgba)
                .setOpacity(opacity);
            setNestedValue(this.target, params.path, hcColor.get(), false);
            valueEl.textContent = getHex(hcColor);
        };
        colorInput.addEventListener('input', update);
        opacityInput.addEventListener('input', update);
    }
    /**
     * Add a number control
     */
    addNumberControl(params, keyDiv, valueDiv) {
        const rid = params.path.replace(/[^a-z0-9_-]/gi, '-');
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
        keyDiv.appendChild(Object.assign(document.createElement('label'), {
            htmlFor: `range-input-${rid}`,
            innerText: params.path
        }));
        const valueEl = valueDiv.appendChild(Object.assign(document.createElement('span'), {
            id: `range-value-${rid}`,
            className: 'hc-range-value'
        }));
        const input = valueDiv.appendChild(Object.assign(document.createElement('input'), {
            type: 'range',
            id: `range-input-${rid}`,
            min: String(params.min),
            max: String(params.max),
            step: String(params.step || 1)
        }));
        // Use override value if provided, otherwise get current value from
        // chart
        const currentValue = params.value !== void 0 ?
            params.value :
            (getNestedValue(this.target.options, params.path) ?? 0);
        input.value = String(currentValue);
        valueEl.textContent = String(currentValue);
        input.addEventListener('input', () => {
            const value = parseFloat(input.value);
            valueEl.textContent = String(value);
            setNestedValue(this.target, params.path, value, false);
        });
    }
    /**
     * Add a text control
     */
    addTextControl(params, keyDiv, valueDiv) {
        const rid = params.path.replace(/[^a-z0-9_-]/gi, '-');
        keyDiv.appendChild(Object.assign(document.createElement('label'), {
            htmlFor: `text-input-${rid}`,
            innerText: params.path
        }));
        const input = valueDiv.appendChild(Object.assign(document.createElement('input'), {
            type: 'text',
            id: `text-input-${rid}`,
            className: 'hc-text-input'
        }));
        // Use override value if provided, otherwise get current value from
        // chart
        const currentValue = params.value !== void 0 ?
            params.value :
            (getNestedValue(this.target.options, params.path) || '');
        input.value = String(currentValue);
        input.addEventListener('input', () => {
            const value = input.value;
            setNestedValue(this.target, params.path, value, false);
        });
    }
    /**
     * Add a control
     */
    addControl(params) {
        if (!this.container) {
            throw new Error('Container for controls not found');
        }
        if (!('value' in params)) {
            // Set default value from chart options
            const targetOptions = this.target.getOptions?.();
            params.value = (targetOptions && getNestedValue(targetOptions, params.path)) ?? getNestedValue(Product?.defaultOptions, params.path);
        }
        const div = this.container.appendChild(Object.assign(document.createElement('div'), { className: 'highcharts-controls-control' }));
        const keyDiv = div.appendChild(Object.assign(document.createElement('div'), { className: 'highcharts-controls-key' }));
        const valueDiv = div.appendChild(Object.assign(document.createElement('div'), { className: 'highcharts-controls-value' }));
        const valueDivInner = valueDiv.appendChild(Object.assign(document.createElement('div'), { className: 'highcharts-controls-value-inner' }));
        if (isArrayControlParams(params)) {
            this.addArrayControl(params, keyDiv, valueDivInner);
        }
        else if (isBooleanControlParams(params)) {
            this.addBooleanControl(params, keyDiv, valueDivInner);
        }
        else if (isColorControlParams(params)) {
            this.addColorControl(params, keyDiv, valueDivInner);
        }
        else if (isNumberControlParams(params)) {
            this.addNumberControl(params, keyDiv, valueDivInner);
        }
        else if (isTextControlParams(params)) {
            this.addTextControl(params, keyDiv, valueDivInner);
        }
    }
    /**
     * Update the options preview element with the current chart options.
     */
    updateOptionsPreview() {
        const previewEl = this.container.parentElement
            ?.querySelector('.options-preview');
        if (previewEl) {
            const options = this.target.getOptions() || {};
            // Empty xAxis and yAxis structures
            Object.keys(options).forEach((key) => {
                if (JSON.stringify(options[key]) === '[{}]') {
                    delete options[key];
                }
            });
            previewEl.textContent = JSON.stringify(options, null, 2);
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
//         type="array-of-strings"
//         path="legend.align"
//         options="left,center,right"
//         value="right"
//     ></highcharts-control>
// </highcharts-controls>
class HighchartsControlElement extends HTMLElement {
    getConfig() {
        const config = {
            type: this.getAttribute('type'),
            path: this.getAttribute('path') || ''
        };
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
class HighchartsControlsElement extends HTMLElement {
    connectedCallback() {
        const controls = [];
        this.querySelectorAll('highcharts-control').forEach((controlEl) => {
            const control = controlEl.getConfig();
            if (control.type && control.path) {
                controls.push(control);
            }
        });
        const injectCSS = this.getAttribute('inject-css');
        Controls.controls(this, {
            target: this.getTarget(),
            injectCSS: injectCSS !== 'false',
            controls: controls
        });
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