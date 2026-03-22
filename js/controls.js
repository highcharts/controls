/**
 * Type guard for SeparatorParams
 */
function is$5(params) {
    return params.type === 'separator';
}
function create$5(controls) {
    if (!controls.container) {
        throw new Error('Container for controls not found');
    }
    const row = controls.container.appendChild(Object.assign(document.createElement('div'), { className: 'hcc-separator-row' }));
    const cell1 = row.appendChild(Object.assign(document.createElement('div'), { className: 'hcc-separator-cell' }));
    // Add second cell to match the two-column layout
    row.appendChild(Object.assign(document.createElement('div'), { className: 'hcc-separator-cell' }));
    cell1.appendChild(Object.assign(document.createElement('hr'), { className: 'hcc-separator' }));
}

var SeparatorControl = /*#__PURE__*/Object.freeze({
    __proto__: null,
    create: create$5,
    is: is$5
});

/**
 * Utility functions for Highcharts Controls
 */
/**
 * Get a nested value from an object given a dot-separated path.
 * Supports array notation, e.g., 'series[0].name' or 'xAxis[0].title.text'
 */
function getNestedValue(obj, path) {
    path = path.replace(/^(xAxis|yAxis)\./, '$1[0].');
    // Split path into segments, handling array notation
    // e.g., 'series[0].data[1]' becomes ['series', '0', 'data', '1']
    const segments = path.split(/\.|\[|\]/).filter(s => s !== '');
    return segments.reduce((current, key) => current?.[key], obj);
}
/**
 * Type guard for GroupParams
 */
function isGroupParams(params) {
    return 'group' in params && Array.isArray(params.controls);
}
/**
 * Create the common scaffolding structure for all control types
 * Returns the created DOM elements for the control type to populate
 */
function createControlScaffolding(params, container) {
    const isNullish = params.value === null || params.value === undefined;
    const controlDiv = container.appendChild(Object.assign(document.createElement('div'), {
        className: `hcc-control hcc-control-${params.type}${isNullish ? ' hcc-control-nullish' : ''}`
    }));
    const keyDiv = controlDiv.appendChild(Object.assign(document.createElement('div'), { className: 'hcc-key' }));
    const valueDiv = controlDiv.appendChild(Object.assign(document.createElement('div'), { className: 'hcc-value' }));
    const valueDivInner = valueDiv.appendChild(Object.assign(document.createElement('div'), { className: 'hcc-value-inner' }));
    return { controlDiv, keyDiv, valueDiv, valueDivInner };
}
/**
 * Create a nullable toggle button
 * Returns the button element that can be appended to a control
 */
function createNullableButton(params, controlDiv, onToggle) {
    const button = Object.assign(document.createElement('button'), {
        type: 'button',
        className: 'hcc-nullable-button',
        title: 'Set to null',
        innerHTML: '⊘',
        'aria-label': 'Set to null'
    });
    button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
    });
    return button;
}

/**
 * Base Control Class
 *
 * Provides a standalone control that can be used independently or as part
 * of the Controls collection. Extends EventTarget for native event handling.
 */
class Control extends EventTarget {
    constructor(params, container) {
        super();
        this.params = params;
        this.container = container;
        this.elements = {};
        this._value = params.value;
        if (container) {
            this.render(container);
        }
    }
    /**
     * Get the current value of the control
     */
    get value() {
        return this._value;
    }
    /**
     * Set the value of the control programmatically
     */
    set value(newValue) {
        if (this._value !== newValue) {
            const oldValue = this._value;
            this._value = newValue;
            this.updateUI();
            this.emit('change', { value: newValue, oldValue, path: this.params.path });
        }
    }
    /**
     * Emit a custom event
     */
    emit(eventName, detail) {
        this.dispatchEvent(new CustomEvent(eventName, {
            detail,
            bubbles: true,
            cancelable: true
        }));
    }
    /**
     * Destroy the control and clean up
     */
    destroy() {
        this.elements.controlDiv?.remove();
        // Subclasses can override to add more cleanup
    }
    /**
     * Get the control's DOM element
     */
    getElement() {
        return this.elements.controlDiv;
    }
}

/**
 * BooleanControl class - toggle switch for boolean values
 */
class BooleanControl extends Control {
    /**
     * Type guard for BooleanControlParams
     */
    static is(params) {
        return params.type === 'boolean';
    }
    /**
     * Render the boolean control
     */
    render(container) {
        const { controlDiv, keyDiv, valueDivInner } = createControlScaffolding(this.params, container);
        this.elements.controlDiv = controlDiv;
        this.elements.keyDiv = keyDiv;
        this.elements.valueDivInner = valueDivInner;
        const rid = this.params.path.replace(/[^a-z0-9_-]/gi, '-');
        keyDiv.appendChild(Object.assign(document.createElement('label'), {
            htmlFor: `toggle-checkbox-${rid}`,
            innerHTML: this.params.label || `<code>${this.params.path}</code>`,
            title: this.params.label || this.params.path
        }));
        if (this.params.nullable) {
            // Nullable tri-state toggle: false (left), null (middle), true (right)
            const labelToggle = valueDivInner.appendChild(Object.assign(document.createElement('label'), { className: 'hcc-toggle hcc-toggle-nullable' }));
            this.currentState = this._value === null || this._value === undefined ? null : Boolean(this._value);
            // Create a hidden input to store state (not used for interaction)
            this.input = labelToggle.appendChild(Object.assign(document.createElement('input'), {
                type: 'hidden',
                id: `toggle-checkbox-${rid}`
            }));
            this.slider = labelToggle.appendChild(Object.assign(document.createElement('span'), {
                className: 'hcc-toggle-slider',
                'aria-hidden': 'true'
            }));
            this.slider.addEventListener('click', () => {
                this.handleNullableClick();
            });
            this.updateUI();
        }
        else {
            // Standard two-state toggle
            const labelToggle = valueDivInner.appendChild(Object.assign(document.createElement('label'), { className: 'hcc-toggle' }));
            this.input = labelToggle.appendChild(Object.assign(document.createElement('input'), {
                type: 'checkbox',
                id: `toggle-checkbox-${rid}`
            }));
            this.slider = labelToggle.appendChild(Object.assign(document.createElement('span'), {
                className: 'hcc-toggle-slider',
                'aria-hidden': 'true'
            }));
            this.input.addEventListener('change', () => {
                this.handleStandardChange();
            });
            this.updateUI();
        }
    }
    /**
     * Handle click on nullable toggle
     */
    handleNullableClick() {
        // Cycle: false -> null -> true -> false
        if (this.currentState === false) {
            this.currentState = null;
        }
        else if (this.currentState === null) {
            this.currentState = true;
        }
        else {
            this.currentState = false;
        }
        const oldValue = this._value;
        this._value = this.currentState;
        this.updateUI();
        this.emit('change', {
            value: this.currentState,
            oldValue,
            path: this.params.path
        });
    }
    /**
     * Handle change on standard toggle
     */
    handleStandardChange() {
        if (!this.input)
            return;
        const oldValue = this._value;
        this._value = this.input.checked;
        this.elements.controlDiv?.classList.remove('hcc-control-nullish');
        this.emit('change', {
            value: this._value,
            oldValue,
            path: this.params.path
        });
    }
    /**
     * Update UI to reflect current value
     */
    updateUI() {
        if (this.params.nullable && this.slider) {
            // Remove all state classes
            this.slider.classList.remove('hcc-toggle-slider-false', 'hcc-toggle-slider-null', 'hcc-toggle-slider-true');
            if (this.currentState === null) {
                this.slider.classList.add('hcc-toggle-slider-null');
                this.elements.controlDiv?.classList.add('hcc-control-nullish');
            }
            else if (this.currentState === false) {
                this.slider.classList.add('hcc-toggle-slider-false');
                this.elements.controlDiv?.classList.remove('hcc-control-nullish');
            }
            else {
                this.slider.classList.add('hcc-toggle-slider-true');
                this.elements.controlDiv?.classList.remove('hcc-control-nullish');
            }
        }
        else if (this.input && this.input.type === 'checkbox') {
            this.input.checked = Boolean(this._value);
        }
    }
}
/**
 * Legacy factory function for backward compatibility
 * @deprecated Use BooleanControl class directly
 */
function create$4(controls, params) {
    const control = new BooleanControl(params);
    control.render(controls.container);
    // Bind to target if it exists
    control.addEventListener('change', ((e) => {
        const customEvent = e;
        controls.setNestedValue(params.path, customEvent.detail.value);
    }));
}
/**
 * Legacy type guard for backward compatibility
 * @deprecated Use BooleanControl.is() instead
 */
function is$4(params) {
    return BooleanControl.is(params);
}

var BooleanControl$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    BooleanControl: BooleanControl,
    create: create$4,
    is: is$4
});

/**
 * Type guard for SelectControlParams
 */
function is$3(params) {
    return params.type === 'select';
}
/**
 * Create a select control with scaffolding
 */
function create$3(controls, params) {
    const { controlDiv, keyDiv, valueDivInner } = createControlScaffolding(params, controls.container);
    keyDiv.appendChild(Object.assign(document.createElement('label'), {
        innerHTML: params.label || `<code>${params.path}</code>`,
        title: params.label || params.path
    }));
    // Deduce options
    if (params.path.endsWith('.align') ||
        params.path.endsWith('.textAlign')) {
        params.options || (params.options = ['left', 'center', 'right']);
    }
    if (params.path.toLowerCase().endsWith('dashstyle')) {
        params.options || (params.options = [
            'Solid', 'ShortDash', 'ShortDot', 'ShortDashDot',
            'ShortDashDotDot', 'Dot', 'Dash', 'LongDash',
            'DashDot', 'LongDashDot', 'LongDashDotDot'
        ]);
    }
    if (params.path.endsWith('.fontWeight')) {
        params.options || (params.options = ['normal', 'bold', 'lighter']);
    }
    if (params.path.endsWith('.verticalAlign')) {
        params.options || (params.options = ['top', 'middle', 'bottom']);
    }
    // Ensure current value is in options
    const options = params.options || [];
    if (params.value !== null &&
        params.value !== undefined &&
        !options.includes(params.value)) {
        options.unshift(params.value);
    }
    // Determine whether to use select dropdown or button group
    const totalLength = options.reduce((sum, opt) => sum + opt.length, 0);
    const useDropdown = options.length > 3 || totalLength > 24;
    if (useDropdown) {
        // Render as select dropdown
        valueDivInner.classList.add('hcc-select-control');
        const select = valueDivInner.appendChild(Object.assign(document.createElement('select'), {
            className: 'hcc-select-dropdown'
        }));
        // Add null option if nullable
        if (params.nullable) {
            const isNullSelected = params.value === null || params.value === undefined;
            select.appendChild(Object.assign(document.createElement('option'), {
                value: '__null__',
                innerText: '—',
                selected: isNullSelected
            }));
            if (isNullSelected) {
                controlDiv.classList.add('hcc-control-nullish');
            }
        }
        options.forEach((option) => {
            const isSelected = params.value !== null &&
                params.value !== undefined &&
                params.value === option;
            select.appendChild(Object.assign(document.createElement('option'), {
                value: option,
                innerText: option,
                selected: isSelected
            }));
        });
        select.addEventListener('change', () => {
            const value = select.value;
            if (value === '__null__') {
                controlDiv.classList.add('hcc-control-nullish');
                controls.setNestedValue(params.path, null);
            }
            else {
                controlDiv.classList.remove('hcc-control-nullish');
                controls.setNestedValue(params.path, value);
            }
        });
    }
    else {
        // Render as button group
        valueDivInner.classList.add('hcc-button-group');
        options.forEach((option) => {
            const isActive = params.value !== null &&
                params.value !== undefined &&
                params.value === option;
            const button = valueDivInner.appendChild(Object.assign(document.createElement('button'), {
                className: 'hcc-button' +
                    (isActive ? ' active' : ''),
                innerText: option
            }));
            button.dataset.path = params.path;
            button.dataset.value = option;
            button.addEventListener('click', () => {
                controlDiv.classList.remove('hcc-control-nullish');
                const value = button.getAttribute('data-value');
                controls.setNestedValue(params.path, value);
                // Update active state for all buttons in this group
                const allButtons = document.querySelectorAll(`[data-path="${params.path}"]`);
                allButtons.forEach((b) => b.classList.remove('active'));
                button.classList.add('active');
            });
        });
        // Add null button if nullable (at the end, on the right)
        if (params.nullable) {
            const isNullActive = params.value === null || params.value === undefined;
            const nullButton = valueDivInner.appendChild(Object.assign(document.createElement('button'), {
                className: 'hcc-button' +
                    (isNullActive ? ' active' : ''),
                innerHTML: '⊘'
            }));
            nullButton.dataset.path = params.path;
            nullButton.dataset.value = '__null__';
            if (isNullActive) {
                controlDiv.classList.add('hcc-control-nullish');
            }
            nullButton.addEventListener('click', () => {
                controlDiv.classList.add('hcc-control-nullish');
                controls.setNestedValue(params.path, null);
                // Update active state for all buttons in this group
                const allButtons = document.querySelectorAll(`[data-path="${params.path}"]`);
                allButtons.forEach((b) => b.classList.remove('active'));
                nullButton.classList.add('active');
            });
        }
    }
}

var SelectControl = /*#__PURE__*/Object.freeze({
    __proto__: null,
    create: create$3,
    is: is$3
});

/* eslint-disable @highcharts/highcharts/no-highcharts-object */
const Product$1 = window.Highcharts || window.Grid;
/**
 * ColorControl class - standalone color picker with opacity
 */
class ColorControl extends Control {
    /**
     * Type guard for ColorControlParams
     */
    static is(params) {
        return params.type === 'color';
    }
    /**
     * Render the color control
     */
    render(container) {
        const { controlDiv, keyDiv, valueDivInner } = createControlScaffolding(this.params, container);
        this.elements.controlDiv = controlDiv;
        this.elements.keyDiv = keyDiv;
        this.elements.valueDivInner = valueDivInner;
        const rid = this.params.path.replace(/[^a-z0-9_-]/gi, '-');
        keyDiv.appendChild(Object.assign(document.createElement('label'), {
            htmlFor: `color-input-${rid}`,
            innerHTML: this.params.label || `<code>${this.params.path}</code>`,
            title: this.params.label || this.params.path
        }));
        this.colorInput = valueDivInner.appendChild(Object.assign(document.createElement('input'), {
            type: 'color',
            id: `color-input-${rid}`
        }));
        this.valueEl = valueDivInner.appendChild(Object.assign(document.createElement('label'), {
            id: `color-value-${rid}`,
            className: 'hcc-color-value',
            htmlFor: `color-input-${rid}`,
            title: this.params.label || this.params.path
        }));
        this.opacityDisplay = valueDivInner.appendChild(Object.assign(document.createElement('span'), {
            id: `opacity-display-${rid}`,
            className: 'hcc-opacity-display',
            title: this.params.label || this.params.path
        }));
        valueDivInner.appendChild(Object.assign(document.createElement('span'), {
            textContent: '%',
            className: 'hcc-opacity-input-label'
        }));
        // Container for the range slider popup
        this.opacityRangeContainer = valueDivInner.appendChild(Object.assign(document.createElement('div'), {
            className: 'hcc-opacity-range-container hcc-hidden'
        }));
        this.opacityInput = this.opacityRangeContainer.appendChild(Object.assign(document.createElement('input'), {
            type: 'range',
            id: `opacity-input-${rid}`,
            className: 'hcc-opacity-input',
            min: '0',
            max: '100',
            step: '1'
        }));
        // Show/hide range slider on opacity display click
        this.opacityDisplay.addEventListener('click', (e) => {
            e.stopPropagation();
            this.opacityRangeContainer.classList.remove('hcc-hidden');
            this.opacityInput.focus();
        });
        // Hide range slider on Enter key
        this.opacityInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.opacityRangeContainer.classList.add('hcc-hidden');
            }
        });
        // Hide range slider when clicking outside
        this.hideRangeHandler = (e) => {
            if (!this.opacityRangeContainer.contains(e.target) &&
                !this.opacityDisplay.contains(e.target)) {
                this.opacityRangeContainer.classList.add('hcc-hidden');
            }
        };
        document.addEventListener('click', this.hideRangeHandler);
        // Set up event listeners
        this.colorInput.addEventListener('input', () => {
            this.handleInputChange();
        });
        this.opacityInput.addEventListener('input', () => {
            this.handleInputChange();
        });
        // Add nullable button if needed
        if (this.params.nullable) {
            const nullableButton = createNullableButton(this.params, controlDiv, () => {
                this.value = null;
            });
            valueDivInner.appendChild(nullableButton);
        }
        // Initialize UI
        this.updateUI();
    }
    /**
     * Handle input changes from color picker or opacity slider
     */
    handleInputChange() {
        if (!this.colorInput || !this.opacityInput)
            return;
        this.elements.controlDiv?.classList.remove('hcc-control-nullish');
        const rgba = this.colorInput.value; // E.g. #RRGGBB
        const opacity = parseFloat(this.opacityInput.value) / 100;
        // Use Highcharts.color to apply opacity and produce rgba()/hex
        const hcColor = Product$1.color(rgba).setOpacity(opacity);
        const newValue = this.getHex(hcColor, true);
        // Update internal value and emit event
        const oldValue = this._value;
        this._value = newValue;
        // Update display elements
        this.valueEl.textContent = this.getHex(hcColor);
        this.opacityDisplay.textContent = this.opacityInput.value;
        this.updateOpacityGradient(hcColor);
        // Emit change event
        this.emit('change', {
            value: newValue,
            oldValue,
            path: this.params.path
        });
    }
    /**
     * Update UI to reflect current value
     */
    updateUI() {
        if (!this.colorInput || !this.opacityInput || !this.valueEl || !this.opacityDisplay) {
            return;
        }
        const isNullish = this._value === null || this._value === undefined;
        let hcColor = isNullish ? Product$1.color('#808080') : Product$1.color(this._value);
        if (!isNullish && hcColor.rgba.toString().indexOf('NaN') !== -1) {
            console.warn(`Highcharts Controls: Invalid color value for path "${this.params.path}": ${this._value}`);
            // Treat invalid color as nullish
            this.elements.controlDiv?.classList.add('hcc-control-nullish');
            this.valueEl.textContent = '—';
            this.colorInput.value = '#808080';
            this.opacityInput.value = '100';
            this.opacityDisplay.textContent = '100';
        }
        else if (isNullish) {
            this.elements.controlDiv?.classList.add('hcc-control-nullish');
            this.valueEl.textContent = '—';
            this.colorInput.value = '#808080';
            this.opacityInput.value = '100';
            this.opacityDisplay.textContent = '100';
        }
        else {
            this.elements.controlDiv?.classList.remove('hcc-control-nullish');
            const hex = this.getHex(hcColor);
            const opacity = (hcColor.rgba[3] || 1) * 100;
            this.colorInput.value = hex;
            this.valueEl.textContent = hex;
            this.opacityInput.value = String(Math.round(opacity));
            this.opacityDisplay.textContent = String(Math.round(opacity));
        }
        // Initialize opacity slider gradient
        this.updateOpacityGradient(hcColor);
    }
    /**
     * Convert color to hex string
     */
    getHex(color, includeAlpha) {
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
    }
    /**
     * Update opacity slider gradient based on color
     */
    updateOpacityGradient(color) {
        if (!this.opacityInput)
            return;
        const r = color.rgba[0];
        const g = color.rgba[1];
        const b = color.rgba[2];
        this.opacityInput.style.setProperty('--hcc-opacity-gradient-start', `rgba(${r}, ${g}, ${b}, 0)`);
        this.opacityInput.style.setProperty('--hcc-opacity-gradient-end', `rgba(${r}, ${g}, ${b}, 1)`);
    }
    /**
     * Clean up event listeners
     */
    destroy() {
        if (this.hideRangeHandler) {
            document.removeEventListener('click', this.hideRangeHandler);
        }
        super.destroy();
    }
}
/**
 * Legacy factory function for backward compatibility
 * @deprecated Use ColorControl class directly
 */
function create$2(controls, params) {
    const control = new ColorControl(params);
    control.render(controls.container);
    // Bind to target if it exists
    control.addEventListener('change', ((e) => {
        const customEvent = e;
        controls.setNestedValue(params.path, customEvent.detail.value, false);
    }));
}
/**
 * Legacy type guard for backward compatibility
 * @deprecated Use ColorControl.is() instead
 */
function is$2(params) {
    return ColorControl.is(params);
}

var ColorControl$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    ColorControl: ColorControl,
    create: create$2,
    is: is$2
});

/**
 * NumberControl class - range slider for numeric values
 */
class NumberControl extends Control {
    constructor() {
        super(...arguments);
        this.unit = '';
        this.isDragging = false;
        this.mouseIsDown = false;
        this.decimals = 0;
    }
    /**
     * Type guard for NumberControlParams
     */
    static is(params) {
        return params.type === 'number';
    }
    /**
     * Render the number control
     */
    render(container) {
        const { controlDiv, keyDiv, valueDivInner } = createControlScaffolding(this.params, container);
        this.elements.controlDiv = controlDiv;
        this.elements.keyDiv = keyDiv;
        this.elements.valueDivInner = valueDivInner;
        const rid = this.params.path.replace(/[^a-z0-9_-]/gi, '-');
        let value = this._value;
        // Extract unit from current value if it's a string
        let numericValue;
        if (typeof value === 'string') {
            const match = value.match(/^([+-]?\d+\.?\d*)\s*(.*)$/);
            if (match) {
                numericValue = parseFloat(match[1]);
                this.unit = match[2] || this.unit;
            }
        }
        else {
            numericValue = value;
        }
        // Set default min/max if not provided
        if (this.params.min === void 0 || this.params.max === void 0) {
            if (/(lineWidth|borderWidth)$/i.test(this.params.path)) {
                this.params.min = this.params.min ?? 0;
                this.params.max = this.params.max ?? 5;
            }
            else if (/(borderRadius)$/i.test(this.params.path)) {
                this.params.min = this.params.min ?? 0;
                this.params.max = this.params.max ?? 10;
            }
            else if (/\.(x|y|offsetX|offsetY|offset)$/i.test(this.params.path)) {
                this.params.min = this.params.min ?? -100;
                this.params.max = this.params.max ?? 100;
            }
            else if (/rotation$/i.test(this.params.path)) {
                this.params.min = this.params.min ?? -90;
                this.params.max = this.params.max ?? 90;
            }
            else {
                this.params.min = this.params.min ?? 0;
                this.params.max = this.params.max ?? 100;
            }
        }
        if (typeof numericValue === 'number') {
            if (this.params.min > numericValue) {
                this.params.min = numericValue;
            }
            if (this.params.max < numericValue) {
                this.params.max = numericValue;
            }
        }
        // Set default step for em/rem units
        if (!this.params.step && (this.unit === 'em' || this.unit === 'rem')) {
            this.params.step = 0.1;
        }
        keyDiv.appendChild(Object.assign(document.createElement('label'), {
            htmlFor: `range-input-${rid}`,
            innerHTML: this.params.label || `<code>${this.params.path}</code>`,
            title: this.params.label || this.params.path
        }));
        const isNullish = numericValue === null || numericValue === undefined;
        this.valueEl = valueDivInner.appendChild(Object.assign(document.createElement('span'), {
            id: `range-value-${rid}`,
            className: 'hcc-range-value',
            title: this.params.label || this.params.path
        }));
        const strStep = String(this.params.step || 1);
        this.input = valueDivInner.appendChild(Object.assign(document.createElement('input'), {
            type: 'range',
            id: `range-input-${rid}`,
            min: String(this.params.min),
            max: String(this.params.max),
            step: strStep,
            title: this.params.label || this.params.path
        }));
        if (isNullish) {
            // Set to middle of range for nullish state
            this.input.value = String((this.params.min + this.params.max) / 2);
            this.valueEl.textContent = '';
        }
        else {
            this.input.value = String(numericValue);
            this.valueEl.textContent = this.unit ? `${numericValue}${this.unit}` : String(numericValue);
        }
        // Track if user is actively dragging vs clicking to jump
        this.input.addEventListener('mousedown', () => {
            this.mouseIsDown = true;
            this.isDragging = false;
        });
        // Detect actual dragging by tracking mouse movement
        this.onMouseMove = () => {
            if (this.mouseIsDown) {
                this.isDragging = true;
            }
        };
        document.addEventListener('mousemove', this.onMouseMove);
        this.onMouseUp = () => {
            this.mouseIsDown = false;
        };
        document.addEventListener('mouseup', this.onMouseUp);
        // Keep a fixed number of decimals to avoid jumping (#7)
        this.decimals = strStep.indexOf('.') >= 0 ?
            strStep.split('.')[1].length : 0;
        this.input.addEventListener('input', () => {
            this.handleInputChange(false);
        });
        this.input.addEventListener('change', () => {
            this.handleInputChange(true);
        });
        // Add nullable button if needed
        if (this.params.nullable) {
            const nullableButton = createNullableButton(this.params, controlDiv, () => {
                this.value = null;
            });
            valueDivInner.appendChild(nullableButton);
        }
    }
    /**
     * Handle input changes
     */
    handleInputChange(isChangeEvent) {
        if (!this.input || !this.valueEl)
            return;
        this.elements.controlDiv?.classList.remove('hcc-control-nullish');
        if (isChangeEvent) {
            // Only emit/animate if user clicked to jump, not after dragging
            if (!this.isDragging) {
                this.emitValue(true);
            }
            this.isDragging = false;
        }
        else {
            // During dragging
            if (this.isDragging) {
                this.emitValue(false);
            }
        }
    }
    /**
     * Emit value change event
     */
    emitValue(animation) {
        if (!this.input || !this.valueEl)
            return;
        const numValue = parseFloat(this.input.value);
        const sValue = numValue.toFixed(this.decimals);
        const displayValue = this.unit ? `${sValue}${this.unit}` : sValue;
        const chartValue = this.unit ? `${numValue}${this.unit}` : numValue;
        this.valueEl.textContent = displayValue;
        const oldValue = this._value;
        this._value = chartValue;
        this.emit('change', {
            value: chartValue,
            oldValue,
            path: this.params.path,
            animation
        });
    }
    /**
     * Update UI to reflect current value
     */
    updateUI() {
        if (!this.input || !this.valueEl)
            return;
        if (this._value === null || this._value === undefined) {
            this.input.value = String((this.params.min + this.params.max) / 2);
            this.valueEl.textContent = '';
            this.elements.controlDiv?.classList.add('hcc-control-nullish');
        }
        else {
            let numericValue;
            if (typeof this._value === 'string') {
                const match = this._value.match(/^([+-]?\d+\.?\d*)/);
                if (match) {
                    numericValue = parseFloat(match[1]);
                }
            }
            else {
                numericValue = this._value;
            }
            if (numericValue !== undefined) {
                this.input.value = String(numericValue);
                this.valueEl.textContent = this.unit ?
                    `${numericValue}${this.unit}` :
                    String(numericValue);
            }
            this.elements.controlDiv?.classList.remove('hcc-control-nullish');
        }
    }
    /**
     * Clean up event listeners
     */
    destroy() {
        if (this.onMouseMove) {
            document.removeEventListener('mousemove', this.onMouseMove);
        }
        if (this.onMouseUp) {
            document.removeEventListener('mouseup', this.onMouseUp);
        }
        super.destroy();
    }
}
/**
 * Legacy factory function for backward compatibility
 * @deprecated Use NumberControl class directly
 */
function create$1(controls, params) {
    const control = new NumberControl(params);
    control.render(controls.container);
    // Bind to target if it exists
    control.addEventListener('change', ((e) => {
        const customEvent = e;
        controls.setNestedValue(params.path, customEvent.detail.value, customEvent.detail.animation);
    }));
}
/**
 * Legacy type guard for backward compatibility
 * @deprecated Use NumberControl.is() instead
 */
function is$1(params) {
    return NumberControl.is(params);
}

var NumberControl$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    NumberControl: NumberControl,
    create: create$1,
    is: is$1
});

/**
 * Type guard for TextControlParams
 */
function is(params) {
    return params.type === 'text';
}
/**
 * Create a text control with scaffolding
 */
function create(controls, params) {
    const { controlDiv, keyDiv, valueDivInner } = createControlScaffolding(params, controls.container);
    const rid = params.path.replace(/[^a-z0-9_-]/gi, '-');
    keyDiv.appendChild(Object.assign(document.createElement('label'), {
        htmlFor: `text-input-${rid}`,
        innerHTML: params.label || `<code>${params.path}</code>`,
        title: params.label || params.path
    }));
    const input = valueDivInner.appendChild(Object.assign(document.createElement('input'), {
        type: 'text',
        id: `text-input-${rid}`,
        className: 'hcc-text-input',
        title: params.label || params.path
    }));
    const isNullish = params.value === null || params.value === undefined;
    if (isNullish) {
        input.value = '';
        input.placeholder = 'null';
    }
    else {
        input.value = String(params.value || '');
    }
    input.addEventListener('input', () => {
        controlDiv.classList.remove('hcc-control-nullish');
        input.placeholder = '';
        const value = input.value;
        controls.setNestedValue(params.path, value, false);
    });
    if (params.nullable) {
        const nullableButton = createNullableButton(params, controlDiv, () => {
            input.value = '';
            input.placeholder = 'null';
            controlDiv.classList.add('hcc-control-nullish');
            controls.setNestedValue(params.path, null, false);
        });
        valueDivInner.appendChild(nullableButton);
    }
}

var TextControl = /*#__PURE__*/Object.freeze({
    __proto__: null,
    create: create,
    is: is
});

/**
 * Index file for Control Types
 * Exports all control types and their type guards
 */
/**
 * Registry of all control types, in order of priority for type checking
 */
const controlTypeRegistry = [
    SelectControl,
    BooleanControl$1,
    ColorControl$1,
    NumberControl$1,
    TextControl,
    SeparatorControl
];

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
class Controls {
    constructor(renderTo, options) {
        renderTo = (typeof renderTo === 'string' &&
            document.getElementById(renderTo)) ||
            (typeof renderTo === 'object' && renderTo) ||
            document.body.appendChild(Object.assign(document.createElement('div')));
        const displayClass = options.display === 'block'
            ? 'hcc-display-block'
            : 'hcc-display-inline-block';
        const outerContainer = renderTo.appendChild(Object.assign(document.createElement('div'), { className: `highcharts-controls ${displayClass}` }));
        this.container = outerContainer.appendChild(Object.assign(document.createElement('div'), { className: 'hcc-container' }));
        this.target = (options.target ||
            Product?.charts?.[0] ||
            Product?.grids?.[0]);
        // Target is now optional - controls can work standalone
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
        // If no target, skip updating the chart
        if (!this.target) {
            return;
        }
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
                if (isNextArray) {
                    // Make sure to retain existing array items, for example
                    // when setting `palette.light.colors[0]`, we want to retain
                    // the other colors in the array.
                    const existingArray = getNestedValue(this.target.options, keys.slice(0, i + 1).join('.'));
                    if (Array.isArray(existingArray)) {
                        // But only retain primitive values, as objects may have
                        // nested properties, so we don't want expensive updates
                        // on those (#14)
                        cur[k] = existingArray.slice().map(item => typeof item === 'object' && item !== null ?
                            void 0 : item);
                    }
                    else {
                        cur[k] = [];
                    }
                }
                else {
                    cur[k] = {};
                }
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
        const cssUrl = import.meta.url
            .replace(/\/js\/[^/]+$/, '/css/controls.css')
            // Match jsDelivr/npm CDN. Patterns:
            // - https://cdn.jsdelivr.net/npm/@highcharts/controls@0.3.0
            // - https://cdn.jsdelivr.net/npm/@highcharts/controls
            .replace(/(https?:\/\/cdn\.jsdelivr\.net\/npm\/@highcharts\/controls)(@[\d.]+)?$/, '$1$2/css/controls.css');
        const link = document.createElement('link');
        link.id = 'highcharts-controls-css';
        link.rel = 'stylesheet';
        link.href = cssUrl;
        // Show controls when CSS is loaded or failed
        const showControls = () => {
            document.querySelectorAll('.highcharts-controls').forEach((el) => el.classList.add('loaded'));
        };
        link.onload = showControls;
        link.onerror = showControls;
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
        if (params.collapsible || params.collapsed) {
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
        const { path, value } = params;
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
        if (path.toLowerCase().indexOf('color') !== -1) {
            return 'color';
        }
        if (path.endsWith('.align') ||
            path.toLowerCase().endsWith('dashstyle') ||
            path.endsWith('.fontWeight') ||
            path.endsWith('.textAlign') ||
            path.endsWith('.verticalAlign')) {
            return 'select';
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
    /**
     * Add a control
     */
    addControl(params) {
        if (!this.container) {
            throw new Error('Container for controls not found');
        }
        // Infer value and type if not provided. Value comes first as it may
        // influence type deduction.
        if (!is$5(params)) {
            // Only try to get nested value if target exists
            if (this.target?.options) {
                params.value ?? (params.value = getNestedValue(this.target.options, params.path));
            }
            params.type || (params.type = this.deduceControlType(params));
        }
        // Find and instantiate the appropriate control type
        for (const controlType of controlTypeRegistry) {
            if (controlType.is(params)) {
                controlType.create(this, params);
                break;
            }
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
        // First, create a normal JSON string
        const json = JSON.stringify(obj, null, 2);
        // Escape HTML in the entire JSON string first
        let formatted = this.escapeHTML(json);
        // Find and replace data arrays and dataTable objects with collapsed versions
        // Match "data": [ ... ] or "dataTable": { ... }
        formatted = formatted.replace(/^(\s*)&quot;(data|dataTable)&quot;:\s*(\[[\s\S]*?\n\s*\]|\{[\s\S]*?\n\s*\})/gm, (match, indent, key, value) => {
            // Unescape to parse
            const unescaped = value
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&');
            let parsed;
            try {
                parsed = JSON.parse(unescaped);
            }
            catch (e) {
                return match; // If parsing fails, keep original
            }
            const isArray = Array.isArray(parsed);
            const count = isArray ? parsed.length : Object.keys(parsed).length;
            const collapsedText = isArray ? `[${count} items]` : `{${count} keys}`;
            // Re-escape the value for storage
            const escapedValue = this.escapeHTML(JSON.stringify(parsed, null, 2))
                .replace(/&quot;/g, '"') // Keep quotes for the data attribute
                .replace(/&#39;/g, "'");
            return `${indent}&quot;${key}&quot;: <span class="hcc-collapsible" data-collapsed="true" data-value="${escapedValue.replace(/"/g, '&quot;')}" data-indent="${indent}"><span class="hcc-toggle-json">\u25B6</span> <span class="hcc-collapsed-text">${collapsedText}</span><span class="hcc-expanded-content hcc-hidden"></span></span>`;
        });
        // Convert to JavaScript-like syntax: remove quotes from keys, use single quotes
        formatted = formatted
            // Remove quotes from property names (but not in data attributes)
            .replace(/&quot;([^&]+)&quot;:(?![^<]*>)/g, '$1:')
            // Convert double quotes to single quotes for string values (allowing escaped entities)
            .replace(/: &quot;((?:[^&]|&[a-z]+;)*?)&quot;/g, ": &#39;$1&#39;");
        // Apply syntax highlighting with HTML spans
        formatted = formatted
            // Highlight property names (skip already in span tags)
            .replace(/^(\s*)([a-zA-Z_$][a-zA-Z0-9_$]*):/gm, (match, indent, key) => {
            if (match.includes('<span'))
                return match;
            return `${indent}<span class="hcc-syntax-key">${key}</span>:`;
        })
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
        if (previewEl && this.target) {
            const options = this.target.getOptions() || {};
            // Empty xAxis and yAxis structures
            Object.keys(options).forEach((key) => {
                if (JSON.stringify(options[key]) === '[{}]') {
                    delete options[key];
                }
            });
            previewEl.innerHTML = this.formatJSONWithHighlighting(options);
            // Add click handlers for collapsible elements
            previewEl.querySelectorAll('.hcc-collapsible').forEach((el) => {
                const toggle = el.querySelector('.hcc-toggle-json');
                if (toggle) {
                    toggle.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const collapsed = el.getAttribute('data-collapsed') === 'true';
                        const expandedContent = el.querySelector('.hcc-expanded-content');
                        if (!collapsed) {
                            // Collapse
                            el.setAttribute('data-collapsed', 'true');
                            toggle.textContent = '\u25B6';
                            el.querySelector('.hcc-collapsed-text').classList.remove('hcc-hidden');
                            expandedContent.classList.add('hcc-hidden');
                            expandedContent.innerHTML = '';
                        }
                        else {
                            // Expand
                            el.setAttribute('data-collapsed', 'false');
                            toggle.textContent = '\u25BC';
                            el.querySelector('.hcc-collapsed-text').classList.add('hcc-hidden');
                            // Get the base indentation
                            const baseIndent = el.getAttribute('data-indent') || '';
                            // Format and display the expanded content
                            const rawValue = el.getAttribute('data-value') || '[]';
                            const unescaped = rawValue
                                .replace(/&quot;/g, '"')
                                .replace(/&#39;/g, "'")
                                .replace(/&lt;/g, '<')
                                .replace(/&gt;/g, '>')
                                .replace(/&amp;/g, '&');
                            let formatted = this.escapeHTML(unescaped);
                            // Add base indentation to each line
                            formatted = formatted
                                .split('\n')
                                .map((line, i) => i === 0 ? line : baseIndent + line)
                                .join('\n');
                            // Apply JS-like formatting and syntax highlighting
                            formatted = formatted
                                .replace(/&quot;([^&]+)&quot;:/g, '$1:')
                                .replace(/: &quot;((?:[^&]|&[a-z]+;)*?)&quot;/g, ": &#39;$1&#39;")
                                .replace(/^(\s*)([a-zA-Z_$][a-zA-Z0-9_$]*):/gm, '$1<span class="hcc-syntax-key">$2</span>:')
                                .replace(/: &#39;((?:[^&]|&[a-z]+;)*?)&#39;/g, ': <span class="hcc-syntax-string">&#39;$1&#39;</span>')
                                .replace(/: (-?\d+\.?\d*)/g, ': <span class="hcc-syntax-number">$1</span>')
                                .replace(/: (true|false)/g, ': <span class="hcc-syntax-boolean">$1</span>')
                                .replace(/: (null)/g, ': <span class="hcc-syntax-null">$1</span>');
                            expandedContent.innerHTML = formatted;
                            expandedContent.classList.remove('hcc-hidden');
                        }
                    });
                }
            });
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
        if (this.hasAttribute('label')) {
            config.label = this.getAttribute('label') || undefined;
        }
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
        if (this.hasAttribute('nullable')) {
            config.nullable = true;
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
        this.querySelectorAll(':scope > highcharts-control, :scope > highcharts-separator').forEach((controlEl) => {
            if (controlEl.tagName.toLowerCase() === 'highcharts-separator') {
                controls.push({ type: 'separator' });
            }
            else if (controlEl.tagName.toLowerCase() === 'highcharts-control') {
                const control = controlEl.getConfig();
                if (control.path) {
                    controls.push(control);
                }
            }
        });
        return {
            group: this.getAttribute('header') || 'Group',
            description,
            collapsed: this.hasAttribute('collapsed') &&
                this.getAttribute('collapsed') !== 'false',
            collapsible: this.hasAttribute('collapsible') &&
                this.getAttribute('collapsible') !== 'false',
            className: this.getAttribute('class') || undefined,
            controls
        };
    }
}
class HighchartsControlsElement extends HTMLElement {
    connectedCallback() {
        const controls = [], injectCSS = this.getAttribute('inject-css') !== 'false', displayAttr = this.getAttribute('display'), display = (displayAttr === 'block' || displayAttr === 'inline-block')
            ? displayAttr
            : 'inline-block';
        let target = this.getTarget();
        const init = (target) => {
            Controls.controls(this, {
                target,
                injectCSS,
                display: display,
                controls: controls
            });
        };
        // Process direct children (both controls and groups)
        Array.from(this.children).forEach((child) => {
            if (child.tagName.toLowerCase() === 'highcharts-group') {
                const groupConfig = child.getConfig();
                controls.push(groupConfig);
            }
            else if (child.tagName.toLowerCase() === 'highcharts-separator') {
                controls.push({ type: 'separator' });
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
customElements.define('highcharts-separator', class extends HTMLElement {
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

export { BooleanControl, ColorControl, Control, NumberControl, Controls as default };
//# sourceMappingURL=controls.js.map
