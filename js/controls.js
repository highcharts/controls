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
const controlIdCounts = {};
class Control extends EventTarget {
    constructor(params, container) {
        super();
        this.params = params;
        this.container = container;
        this.elements = {};
        this._value = params.value;
        this.instanceId = createUniqueId(this.params.path || 'control');
        if (container) {
            this.render(container);
        }
    }
    getScopedId(suffix) {
        return `${suffix}-${this.instanceId}`;
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
function createUniqueId(path) {
    const normalized = path
        .replace(/[^a-z0-9_-]/gi, '-')
        .replace(/^-|-$/g, '') || 'control';
    const count = controlIdCounts[normalized] || 0;
    controlIdCounts[normalized] = count + 1;
    return count === 0 ? normalized : `${normalized}-${count}`;
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
        const rid = this.getScopedId('toggle-checkbox');
        keyDiv.appendChild(Object.assign(document.createElement('label'), {
            htmlFor: rid,
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
                id: rid
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
                id: rid
            }));
            this.slider = labelToggle.appendChild(Object.assign(document.createElement('span'), {
                className: 'hcc-toggle-slider',
                'aria-hidden': 'true'
            }));
            this.input.addEventListener('change', (e) => {
                if (e.target?.closest?.('highcharts-control')) {
                    e.stopPropagation();
                }
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

function clampChannel(value) {
    return Math.min(255, Math.max(0, value));
}
function normalizeAlpha(value) {
    if (!Number.isFinite(value)) {
        return 1;
    }
    return Math.min(1, Math.max(0, value));
}
function parseHexColor(value) {
    let hex = value.trim().replace(/^#/, '');
    if (!hex) {
        return null;
    }
    if (hex.length === 3 || hex.length === 4) {
        hex = hex.split('').map((char) => char + char).join('');
    }
    if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(hex)) {
        return null;
    }
    const alphaHex = hex.length === 8 ? hex.slice(6, 8) : '';
    const red = parseInt(hex.slice(0, 2), 16);
    const green = parseInt(hex.slice(2, 4), 16);
    const blue = parseInt(hex.slice(4, 6), 16);
    const alpha = alphaHex ? (parseInt(alphaHex, 16) / 255) : 1;
    return [red, green, blue, alpha];
}
function splitTopLevelComma(value) {
    let depth = 0;
    let inString = false;
    for (let i = 0; i < value.length; i++) {
        const char = value[i];
        if (char === '"' || char === '\'') {
            inString = !inString;
            continue;
        }
        if (inString) {
            continue;
        }
        if (char === '(') {
            depth += 1;
        }
        else if (char === ')') {
            depth = Math.max(0, depth - 1);
        }
        else if (char === ',' && depth === 0) {
            return [value.slice(0, i), value.slice(i + 1)];
        }
    }
    return null;
}
function parseLightDarkColor(value) {
    const trimmed = value.trim();
    if (!trimmed.toLowerCase().startsWith('light-dark(') || !trimmed.endsWith(')')) {
        return null;
    }
    const inner = trimmed.slice('light-dark('.length, -1);
    const parts = splitTopLevelComma(inner);
    if (!parts) {
        return null;
    }
    const [lightValue, darkValue] = parts;
    const lightColor = parseCssColor(lightValue);
    const darkColor = parseCssColor(darkValue);
    if (!lightColor || !darkColor) {
        return null;
    }
    return { light: lightColor, dark: darkColor };
}
function parseCssColor(value) {
    if (typeof value !== 'string') {
        return null;
    }
    const colorString = value.trim();
    if (!colorString) {
        return null;
    }
    const hexColor = colorString.startsWith('#') ? parseHexColor(colorString) : null;
    if (hexColor) {
        return { rgba: hexColor };
    }
    const testElement = document.createElement('div');
    testElement.style.color = colorString;
    if (!testElement.style.color) {
        return null;
    }
    const matches = testElement.style.color.match(/^rgba?\(([^)]+)\)$/i);
    if (!matches) {
        return null;
    }
    const channels = matches[1].split(',').map((part) => Number.parseFloat(part.trim()));
    if (channels.length < 3 || channels.some((channel) => !Number.isFinite(channel))) {
        return null;
    }
    const [red, green, blue, alpha = 1] = channels;
    return {
        rgba: [
            clampChannel(red),
            clampChannel(green),
            clampChannel(blue),
            normalizeAlpha(alpha)
        ]
    };
}
/**
 * ColorControl class - standalone color picker with opacity
 */
class ColorControl extends Control {
    constructor() {
        super(...arguments);
        this.colorInputCount = 0;
        this.lastColorInputAt = 0;
        this.opacityIsDragging = false;
        this.opacityMouseIsDown = false;
        this.colorMode = 'single';
        this.lightDarkValue = null;
    }
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
        const rid = this.getScopedId('color-input');
        keyDiv.appendChild(Object.assign(document.createElement('label'), {
            htmlFor: rid,
            innerHTML: this.params.label || `<code>${this.params.path}</code>`,
            title: this.params.label || this.params.path
        }));
        valueDivInner.classList.add('hcc-color-control');
        this.colorInput = valueDivInner.appendChild(Object.assign(document.createElement('input'), {
            type: 'color',
            id: rid
        }));
        this.valueEl = valueDivInner.appendChild(Object.assign(document.createElement('label'), {
            id: this.getScopedId('color-value'),
            className: 'hcc-color-value',
            htmlFor: rid,
            title: this.params.label || this.params.path
        }));
        this.opacityDisplay = valueDivInner.appendChild(Object.assign(document.createElement('span'), {
            id: this.getScopedId('opacity-display'),
            className: 'hcc-opacity-display',
            title: this.params.label || this.params.path
        }));
        valueDivInner.appendChild(Object.assign(document.createElement('span'), {
            textContent: '%',
            className: 'hcc-opacity-input-label'
        }));
        this.colorModeControl = valueDivInner.appendChild(Object.assign(document.createElement('span'), {
            className: 'hcc-color-mode-control'
        }));
        this.colorModeButton = this.colorModeControl.appendChild(Object.assign(document.createElement('button'), {
            type: 'button',
            className: 'hcc-color-mode-button',
            title: 'Color mode',
            'aria-label': 'Color mode'
        }));
        this.colorModeMenu = this.colorModeControl.appendChild(Object.assign(document.createElement('div'), {
            className: 'hcc-color-mode-menu hcc-hidden'
        }));
        ['single', 'light', 'dark'].forEach((mode) => {
            const option = document.createElement('button');
            option.type = 'button';
            option.className = 'hcc-color-mode-option';
            option.dataset.mode = mode;
            const label = mode === 'single' ? 'Single color' : mode === 'light' ? 'Light mode' : 'Dark mode';
            const icon = mode === 'single' ? '◐' : mode === 'light' ? '☀' : '☾';
            option.title = label;
            option.innerHTML = `<span class="hcc-color-mode-icon">${icon}</span><span class="hcc-color-mode-label">${label}</span>`;
            option.addEventListener('click', () => {
                this.setColorMode(mode);
                this.colorModeMenu?.classList.add('hcc-hidden');
            });
            if (this.colorModeMenu) {
                this.colorModeMenu.appendChild(option);
            }
        });
        this.colorModeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.colorModeMenu?.classList.toggle('hcc-hidden');
        });
        document.addEventListener('click', (e) => {
            if (!this.colorModeMenu || !this.colorModeButton) {
                return;
            }
            const target = e.target;
            if (!this.colorModeMenu.contains(target) && !this.colorModeButton.contains(target)) {
                this.colorModeMenu.classList.add('hcc-hidden');
            }
        });
        // Container for the range slider popup
        this.opacityRangeContainer = valueDivInner.appendChild(Object.assign(document.createElement('div'), {
            className: 'hcc-opacity-range-container hcc-hidden'
        }));
        this.opacityInput = this.opacityRangeContainer.appendChild(Object.assign(document.createElement('input'), {
            type: 'range',
            id: this.getScopedId('opacity-input'),
            className: 'hcc-opacity-input',
            min: '0',
            max: '100',
            step: '1'
        }));
        this.opacityInput.addEventListener('mousedown', () => {
            this.opacityMouseIsDown = true;
            this.opacityIsDragging = false;
        });
        this.onOpacityMouseMove = () => {
            if (this.opacityMouseIsDown) {
                this.opacityIsDragging = true;
            }
        };
        document.addEventListener('mousemove', this.onOpacityMouseMove);
        this.onOpacityMouseUp = () => {
            this.opacityMouseIsDown = false;
        };
        document.addEventListener('mouseup', this.onOpacityMouseUp);
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
        // Track color picker interaction to distinguish drag preview from single click
        this.colorInput.addEventListener('input', (e) => {
            if (e.target?.closest?.('highcharts-control')) {
                e.stopPropagation();
            }
            this.handleColorInput(e);
        });
        this.colorInput.addEventListener('change', (e) => {
            if (e.target?.closest?.('highcharts-control')) {
                e.stopPropagation();
            }
            this.handleColorChange();
        });
        this.opacityInput.addEventListener('input', (e) => {
            if (e.target?.closest?.('highcharts-control')) {
                e.stopPropagation();
            }
            this.handleOpacityInput(e);
        });
        this.opacityInput.addEventListener('change', (e) => {
            if (e.target?.closest?.('highcharts-control')) {
                e.stopPropagation();
            }
            this.handleOpacityChange();
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
    handleColorInput(event) {
        if (!this.colorInput || !this.opacityInput)
            return;
        // Programmatic updates (tests/scripts) usually only trigger input.
        if (!event.isTrusted) {
            this.resetColorInputSession();
            this.applyInputsAndEmit(false);
            return;
        }
        const now = Date.now();
        // New interaction session (first click or after a short idle gap)
        if (this.colorInputCount > 0 && now - this.lastColorInputAt > 250) {
            this.colorInputCount = 0;
        }
        this.colorInputCount += 1;
        this.lastColorInputAt = now;
        // First color pick in a session behaves like a click jump (animate).
        // Follow-up picks in same session are treated like dragging (no animation).
        this.applyInputsAndEmit(this.colorInputCount === 1);
        if (this.colorInputResetTimer) {
            window.clearTimeout(this.colorInputResetTimer);
        }
        this.colorInputResetTimer = window.setTimeout(() => {
            this.resetColorInputSession();
        }, 300);
    }
    /**
     * Handle color picker commit
     */
    handleColorChange() {
        if (!this.colorInput)
            return;
        // Fallback for browsers that only emit change from the native picker
        if (this.colorInputCount === 0) {
            this.applyInputsAndEmit(true);
        }
        this.resetColorInputSession();
    }
    /**
     * Handle opacity slider input
     */
    handleOpacityInput(event) {
        // Programmatic updates (tests/scripts) usually only trigger input.
        if (!event.isTrusted) {
            this.applyInputsAndEmit(false);
            return;
        }
        if (this.opacityIsDragging) {
            this.applyInputsAndEmit(false);
        }
    }
    /**
     * Handle opacity slider commit
     */
    handleOpacityChange() {
        if (!this.opacityIsDragging) {
            this.applyInputsAndEmit(true);
        }
        this.opacityIsDragging = false;
    }
    /**
     * Reset color interaction tracking
     */
    resetColorInputSession() {
        if (this.colorInputResetTimer) {
            window.clearTimeout(this.colorInputResetTimer);
            this.colorInputResetTimer = undefined;
        }
        this.colorInputCount = 0;
        this.lastColorInputAt = 0;
    }
    /**
     * Update from current inputs and emit change
     */
    applyInputsAndEmit(animation) {
        if (!this.colorInput || !this.opacityInput)
            return;
        this.elements.controlDiv?.classList.remove('hcc-control-nullish');
        const rgba = this.colorInput.value; // E.g. #RRGGBB
        const opacity = parseFloat(this.opacityInput.value) / 100;
        const parsedColor = parseCssColor(rgba);
        if (!parsedColor) {
            return;
        }
        const currentColor = {
            rgba: [
                parsedColor.rgba[0],
                parsedColor.rgba[1],
                parsedColor.rgba[2],
                opacity
            ]
        };
        const oldValue = this._value;
        const lightDark = parseLightDarkColor(this._value ?? '');
        if (lightDark && this.colorMode !== 'single') {
            const branch = this.colorMode === 'light' ? 'light' : 'dark';
            const nextColors = {
                light: { ...lightDark.light },
                dark: { ...lightDark.dark }
            };
            nextColors[branch] = {
                rgba: [
                    currentColor.rgba[0],
                    currentColor.rgba[1],
                    currentColor.rgba[2],
                    opacity
                ]
            };
            const activeHex = this.getHex({
                rgba: [
                    nextColors[branch].rgba[0],
                    nextColors[branch].rgba[1],
                    nextColors[branch].rgba[2],
                    1
                ]
            });
            this.lightDarkValue = nextColors;
            this._value = `light-dark(${this.getHex(nextColors.light, nextColors.light.rgba[3] !== undefined && nextColors.light.rgba[3] !== 1)}, ${this.getHex(nextColors.dark, nextColors.dark.rgba[3] !== undefined && nextColors.dark.rgba[3] !== 1)})`;
            this.valueEl.textContent = activeHex;
            this.colorInput.value = activeHex;
            this.opacityDisplay.textContent = this.opacityInput.value;
            this.updateColorSwatch(activeHex, nextColors);
            this.updateOpacityGradient(currentColor);
            this.emit('change', {
                value: this._value,
                oldValue,
                path: this.params.path,
                animation,
                colorMode: this.colorMode
            });
            return;
        }
        const newValue = this.getHex(currentColor, true);
        this._value = newValue;
        if (!this.lightDarkValue) {
            const previousDual = parseLightDarkColor(oldValue ?? '');
            if (previousDual) {
                this.lightDarkValue = previousDual;
            }
        }
        this.colorMode = 'single';
        // Update display elements
        this.valueEl.textContent = this.getHex(currentColor);
        this.opacityDisplay.textContent = this.opacityInput.value;
        this.updateOpacityGradient(currentColor);
        // Emit change event
        this.emit('change', {
            value: newValue,
            oldValue,
            path: this.params.path,
            animation,
            colorMode: this.colorMode
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
        const parsedDual = !isNullish ? parseLightDarkColor(this._value) : null;
        let activeColor = { rgba: [128, 128, 128, 1] };
        let valueLabel = '—';
        if (!isNullish) {
            if (parsedDual) {
                this.lightDarkValue = parsedDual;
                const preferredMode = this.colorMode === 'light' || this.colorMode === 'dark'
                    ? this.colorMode
                    : this.getCurrentColorMode();
                this.colorMode = preferredMode;
                activeColor = this.colorMode === 'light' ? parsedDual.light : parsedDual.dark;
                valueLabel = this.getHex({
                    rgba: [activeColor.rgba[0], activeColor.rgba[1], activeColor.rgba[2], 1]
                });
            }
            else {
                const parsedValue = parseCssColor(this._value);
                if (!parsedValue) {
                    console.warn(`Highcharts Controls: Invalid color value for path "${this.params.path}": ${this._value}`);
                    this.elements.controlDiv?.classList.add('hcc-control-nullish');
                    this.valueEl.textContent = '—';
                    this.colorInput.value = '#808080';
                    this.opacityInput.value = '100';
                    this.opacityDisplay.textContent = '100';
                    this.updateOpacityGradient(activeColor);
                    this.updateModeButtons();
                    return;
                }
                this.lightDarkValue = this.lightDarkValue ?? parseLightDarkColor(this._value ?? '') ?? null;
                this.colorMode = 'single';
                activeColor = parsedValue;
                valueLabel = this.getHex({ rgba: [activeColor.rgba[0], activeColor.rgba[1], activeColor.rgba[2], 1] });
            }
        }
        if (isNullish) {
            this.elements.controlDiv?.classList.add('hcc-control-nullish');
            this.valueEl.textContent = '—';
            this.colorInput.value = '#808080';
            this.opacityInput.value = '100';
            this.opacityDisplay.textContent = '100';
            this.updateColorSwatch('#808080');
        }
        else {
            this.elements.controlDiv?.classList.remove('hcc-control-nullish');
            const hex = this.getHex({ rgba: [activeColor.rgba[0], activeColor.rgba[1], activeColor.rgba[2], 1] });
            const opacity = (activeColor.rgba[3] || 1) * 100;
            this.colorInput.value = hex;
            this.valueEl.textContent = valueLabel || hex;
            this.opacityInput.value = String(Math.round(opacity));
            this.opacityDisplay.textContent = String(Math.round(opacity));
            this.updateColorSwatch(hex, parsedDual ?? null);
        }
        this.updateModeButtons();
        this.updateOpacityGradient(activeColor);
    }
    updateColorSwatch(baseHex, dual) {
        if (!this.colorInput) {
            return;
        }
        if (dual && this.colorMode !== 'single') {
            const lightHex = this.getHex({ rgba: [dual.light.rgba[0], dual.light.rgba[1], dual.light.rgba[2], 1] });
            const darkHex = this.getHex({ rgba: [dual.dark.rgba[0], dual.dark.rgba[1], dual.dark.rgba[2], 1] });
            const splitGradient = `linear-gradient(135deg, ${lightHex} 0 45%, ${darkHex} 45% 100%)`;
            this.colorInput.style.setProperty('--hcc-color-swatch', splitGradient);
            this.colorInput.style.background = 'transparent';
            return;
        }
        this.colorInput.style.setProperty('--hcc-color-swatch', baseHex);
        this.colorInput.style.background = 'transparent';
    }
    getCurrentColorMode() {
        const computedStyle = window.getComputedStyle(document.documentElement);
        const scheme = computedStyle.colorScheme;
        if (scheme === 'dark') {
            return 'dark';
        }
        if (scheme === 'light') {
            return 'light';
        }
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    updateModeButtons() {
        if (!this.colorModeButton || !this.colorModeMenu) {
            return;
        }
        const map = {
            single: { glyph: '◐', label: 'Single color' },
            light: { glyph: '☀', label: 'Light mode' },
            dark: { glyph: '☾', label: 'Dark mode' }
        };
        const state = map[this.colorMode];
        this.colorModeButton.dataset.mode = this.colorMode;
        this.colorModeButton.setAttribute('aria-label', state.label);
        this.colorModeButton.title = state.label;
        this.colorModeButton.innerHTML = `<span aria-hidden="true">${state.glyph}</span>`;
        this.colorModeButton.classList.remove('active');
        Array.from(this.colorModeMenu.querySelectorAll('.hcc-color-mode-option')).forEach((option) => {
            const button = option;
            const mode = button.dataset.mode;
            const isActive = mode === this.colorMode;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        });
    }
    setColorMode(mode) {
        const oldValue = this._value;
        const isCurrentDual = !!parseLightDarkColor(this._value);
        const currentSelection = this.colorMode === 'light' ? 'light' : this.colorMode === 'dark' ? 'dark' : 'light';
        if (mode === 'single') {
            if (isCurrentDual) {
                const dual = parseLightDarkColor(this._value);
                const activeColor = currentSelection === 'light' ? dual.light : dual.dark;
                this._value = this.getHex({
                    rgba: [
                        activeColor.rgba[0],
                        activeColor.rgba[1],
                        activeColor.rgba[2],
                        activeColor.rgba[3] || 1
                    ]
                }, activeColor.rgba[3] !== undefined && activeColor.rgba[3] !== 1);
                this.lightDarkValue = dual;
                this.colorMode = 'single';
            }
            else {
                const parsed = parseCssColor(this._value);
                if (parsed) {
                    this._value = this.getHex({ rgba: [parsed.rgba[0], parsed.rgba[1], parsed.rgba[2], parsed.rgba[3] || 1] }, parsed.rgba[3] !== undefined && parsed.rgba[3] !== 1);
                }
                if (!this.lightDarkValue) {
                    const currentDual = parseLightDarkColor(oldValue ?? '');
                    if (currentDual) {
                        this.lightDarkValue = currentDual;
                    }
                }
                this.colorMode = 'single';
            }
        }
        else {
            const parsedSingle = parseCssColor(this._value);
            const dual = this.lightDarkValue ?? (parsedSingle ? {
                light: {
                    rgba: [parsedSingle.rgba[0], parsedSingle.rgba[1], parsedSingle.rgba[2], parsedSingle.rgba[3] || 1]
                },
                dark: {
                    rgba: [parsedSingle.rgba[0], parsedSingle.rgba[1], parsedSingle.rgba[2], parsedSingle.rgba[3] || 1]
                }
            } : null);
            if (dual) {
                this.lightDarkValue = dual;
                const lightHex = this.getHex(dual.light, dual.light.rgba[3] !== undefined && dual.light.rgba[3] !== 1);
                const darkHex = this.getHex(dual.dark, dual.dark.rgba[3] !== undefined && dual.dark.rgba[3] !== 1);
                this._value = `light-dark(${lightHex}, ${darkHex})`;
            }
            else {
                const parsedDual = parseLightDarkColor(this._value);
                if (parsedDual) {
                    this.lightDarkValue = parsedDual;
                }
            }
            this.colorMode = mode;
        }
        this.updateUI();
        this.emit('change', {
            value: this._value,
            oldValue,
            path: this.params.path,
            animation: true,
            colorMode: this.colorMode
        });
    }
    /**
     * Convert color to hex string
     */
    getHex(color, includeAlpha) {
        const [red, green, blue, alpha = 1] = color.rgba;
        let hex = '#';
        hex += clampChannel(Math.round(red)).toString(16).padStart(2, '0');
        hex += clampChannel(Math.round(green)).toString(16).padStart(2, '0');
        hex += clampChannel(Math.round(blue)).toString(16).padStart(2, '0');
        if (includeAlpha && alpha !== 1) {
            hex += clampChannel(Math.round(alpha * 255)).toString(16).padStart(2, '0');
        }
        return hex.toLowerCase();
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
        this.resetColorInputSession();
        if (this.hideRangeHandler) {
            document.removeEventListener('click', this.hideRangeHandler);
        }
        if (this.onOpacityMouseMove) {
            document.removeEventListener('mousemove', this.onOpacityMouseMove);
        }
        if (this.onOpacityMouseUp) {
            document.removeEventListener('mouseup', this.onOpacityMouseUp);
        }
        super.destroy();
    }
}

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
        var _a;
        const { controlDiv, keyDiv, valueDivInner } = createControlScaffolding(this.params, container);
        const path = this.params.path || '';
        this.elements.controlDiv = controlDiv;
        this.elements.keyDiv = keyDiv;
        this.elements.valueDivInner = valueDivInner;
        const rid = this.getScopedId('range-input');
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
            if (/(lineWidth|borderWidth)$/i.test(path)) {
                this.params.min = this.params.min ?? 0;
                this.params.max = this.params.max ?? 5;
            }
            else if (/(borderRadius)$/i.test(path)) {
                this.params.min = this.params.min ?? 0;
                this.params.max = this.params.max ?? 10;
            }
            else if (/\.(x|y|offsetX|offsetY|offset)$/i.test(path)) {
                this.params.min = this.params.min ?? -100;
                this.params.max = this.params.max ?? 100;
            }
            else if (/opacity$/i.test(path)) {
                this.params.min = this.params.min ?? 0;
                this.params.max = this.params.max ?? 1;
                (_a = this.params).step ?? (_a.step = 0.01);
            }
            else if (/rotation$/i.test(path)) {
                this.params.min = this.params.min ?? -90;
                this.params.max = this.params.max ?? 90;
            }
            else if (/fontSize$/i.test(path)) {
                if (this.unit === 'em') {
                    this.params.min ?? (this.params.min = 0.6);
                    this.params.max ?? (this.params.max = 2);
                }
                else if (this.unit === 'rem') {
                    this.params.min ?? (this.params.min = 0.6);
                    this.params.max ?? (this.params.max = 2);
                }
                else {
                    this.params.min ?? (this.params.min = 6);
                    this.params.max ?? (this.params.max = 32);
                }
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
            htmlFor: rid,
            innerHTML: this.params.label || `<code>${path}</code>`,
            title: this.params.label || path
        }));
        const isNullish = numericValue === null || numericValue === undefined;
        this.valueEl = valueDivInner.appendChild(Object.assign(document.createElement('span'), {
            id: this.getScopedId('range-value'),
            className: 'hcc-range-value',
            title: this.params.label || path
        }));
        const strStep = String(this.params.step || 1);
        this.input = valueDivInner.appendChild(Object.assign(document.createElement('input'), {
            type: 'range',
            id: rid,
            min: String(this.params.min),
            max: String(this.params.max),
            step: strStep,
            title: this.params.label || path
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
        this.input.addEventListener('input', (e) => {
            if (e.target?.closest?.('highcharts-control')) {
                e.stopPropagation();
            }
            this.handleInputChange(false);
        });
        this.input.addEventListener('change', (e) => {
            if (e.target?.closest?.('highcharts-control')) {
                e.stopPropagation();
            }
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
 * SelectControl class - dropdown or button-group selector for string values
 */
class SelectControl extends Control {
    constructor() {
        super(...arguments);
        this.buttons = [];
    }
    /**
     * Type guard for SelectControlParams
     */
    static is(params) {
        return params.type === 'select';
    }
    /**
     * Render the select control
     */
    render(container) {
        var _a, _b, _c, _d;
        const { controlDiv, keyDiv, valueDivInner } = createControlScaffolding(this.params, container);
        const path = this.params.path || '';
        this.elements.controlDiv = controlDiv;
        this.elements.keyDiv = keyDiv;
        this.elements.valueDivInner = valueDivInner;
        keyDiv.appendChild(Object.assign(document.createElement('label'), {
            innerHTML: this.params.label || `<code>${path}</code>`,
            title: this.params.label || path
        }));
        // Deduce options
        if (path.endsWith('.align') ||
            path.endsWith('.textAlign')) {
            (_a = this.params).options || (_a.options = ['left', 'center', 'right']);
        }
        if (path.toLowerCase().endsWith('dashstyle')) {
            (_b = this.params).options || (_b.options = [
                'Solid', 'ShortDash', 'ShortDot', 'ShortDashDot',
                'ShortDashDotDot', 'Dot', 'Dash', 'LongDash',
                'DashDot', 'LongDashDot', 'LongDashDotDot'
            ]);
        }
        if (path.endsWith('.fontWeight')) {
            (_c = this.params).options || (_c.options = ['normal', 'bold', 'lighter']);
        }
        if (path.endsWith('.verticalAlign')) {
            (_d = this.params).options || (_d.options = ['top', 'middle', 'bottom']);
        }
        const options = this.params.options || [];
        if (this._value !== null &&
            this._value !== undefined &&
            !options.includes(this._value)) {
            options.unshift(String(this._value));
        }
        const totalLength = options.reduce((sum, opt) => sum + String(opt).length, 0);
        const useDropdown = options.length > 3 || totalLength > 24;
        if (useDropdown) {
            valueDivInner.classList.add('hcc-select-control');
            this.select = valueDivInner.appendChild(Object.assign(document.createElement('select'), {
                className: 'hcc-select-dropdown'
            }));
            if (this.params.nullable) {
                const isNullSelected = this._value === null || this._value === undefined;
                this.select.appendChild(Object.assign(document.createElement('option'), {
                    value: '__null__',
                    innerText: '—',
                    selected: isNullSelected
                }));
                if (isNullSelected) {
                    controlDiv.classList.add('hcc-control-nullish');
                }
            }
            options.forEach((option) => {
                const isSelected = this._value !== null &&
                    this._value !== undefined &&
                    this._value === option;
                this.select.appendChild(Object.assign(document.createElement('option'), {
                    value: String(option),
                    innerText: String(option),
                    selected: isSelected
                }));
            });
            this.select.addEventListener('change', () => {
                const oldValue = this._value;
                const value = this.select.value;
                this._value = value === '__null__' ? null : value;
                this.elements.controlDiv?.classList.toggle('hcc-control-nullish', this._value === null || this._value === undefined);
                this.emit('change', {
                    value: this._value,
                    oldValue,
                    path: this.params.path
                });
            });
        }
        else {
            valueDivInner.classList.add('hcc-button-group');
            options.forEach((option) => {
                const isActive = this._value !== null &&
                    this._value !== undefined &&
                    this._value === option;
                const button = valueDivInner.appendChild(Object.assign(document.createElement('button'), {
                    className: 'hcc-button' + (isActive ? ' active' : ''),
                    innerText: String(option)
                }));
                button.dataset.path = path;
                button.dataset.value = String(option);
                this.buttons.push(button);
                button.addEventListener('click', () => {
                    const oldValue = this._value;
                    const value = button.getAttribute('data-value');
                    this._value = value;
                    this.elements.controlDiv?.classList.remove('hcc-control-nullish');
                    this.emit('change', {
                        value: this._value,
                        oldValue,
                        path: this.params.path
                    });
                    this.updateUI();
                });
            });
            if (this.params.nullable) {
                const isNullActive = this._value === null || this._value === undefined;
                const nullButton = valueDivInner.appendChild(Object.assign(document.createElement('button'), {
                    className: 'hcc-button' + (isNullActive ? ' active' : ''),
                    innerHTML: '⊘'
                }));
                nullButton.dataset.path = path;
                nullButton.dataset.value = '__null__';
                this.buttons.push(nullButton);
                if (isNullActive) {
                    controlDiv.classList.add('hcc-control-nullish');
                }
                nullButton.addEventListener('click', () => {
                    const oldValue = this._value;
                    this._value = null;
                    this.elements.controlDiv?.classList.add('hcc-control-nullish');
                    this.emit('change', {
                        value: this._value,
                        oldValue,
                        path: this.params.path
                    });
                    this.updateUI();
                });
            }
        }
        this.updateUI();
    }
    /**
     * Update the UI to reflect the current value
     */
    updateUI() {
        if (this.select) {
            const value = this._value;
            const isNull = value === null || value === undefined;
            if (this.params.nullable && isNull) {
                this.select.value = '__null__';
                this.elements.controlDiv?.classList.add('hcc-control-nullish');
            }
            else {
                this.select.value = String(value ?? '');
                this.elements.controlDiv?.classList.remove('hcc-control-nullish');
            }
        }
        this.buttons.forEach((button) => {
            const isActive = this._value !== null &&
                this._value !== undefined &&
                this._value === button.getAttribute('data-value');
            const isNullish = this._value === null || this._value === undefined;
            const isNullButton = button.getAttribute('data-value') === '__null__';
            button.classList.toggle('active', isNullButton ? isNullish : isActive);
        });
    }
}

/**
 * TextControl class - text input for string values
 */
class TextControl extends Control {
    /**
     * Type guard for TextControlParams
     */
    static is(params) {
        return params.type === 'text';
    }
    /**
     * Render the text control
     */
    render(container) {
        const { controlDiv, keyDiv, valueDivInner } = createControlScaffolding(this.params, container);
        this.elements.controlDiv = controlDiv;
        this.elements.keyDiv = keyDiv;
        this.elements.valueDivInner = valueDivInner;
        const path = this.params.path || 'control';
        const rid = this.getScopedId('text-input');
        keyDiv.appendChild(Object.assign(document.createElement('label'), {
            htmlFor: rid,
            innerHTML: this.params.label || `<code>${path}</code>`,
            title: this.params.label || path
        }));
        this.input = valueDivInner.appendChild(Object.assign(document.createElement('input'), {
            type: 'text',
            id: rid,
            className: 'hcc-text-input',
            title: this.params.label || path
        }));
        this.input.addEventListener('input', (e) => {
            if (e.target?.closest?.('highcharts-control')) {
                e.stopPropagation();
            }
            this.handleInputChange();
        });
        this.input.addEventListener('change', (e) => {
            if (e.target?.closest?.('highcharts-control')) {
                e.stopPropagation();
            }
            this.handleInputChange();
        });
        if (this.params.nullable) {
            const nullableButton = createNullableButton(this.params, controlDiv, () => {
                this.value = null;
            });
            valueDivInner.appendChild(nullableButton);
        }
        this.updateUI();
    }
    handleInputChange() {
        if (!this.input) {
            return;
        }
        const oldValue = this._value;
        this._value = this.input.value;
        this.elements.controlDiv?.classList.remove('hcc-control-nullish');
        this.input.placeholder = '';
        this.emit('change', {
            value: this._value,
            oldValue,
            path: this.params.path
        });
    }
    updateUI() {
        if (!this.input) {
            return;
        }
        const isNullish = this._value === null || this._value === undefined;
        this.input.value = isNullish ? '' : String(this._value ?? '');
        this.input.placeholder = isNullish ? 'null' : '';
        if (isNullish) {
            this.elements.controlDiv?.classList.add('hcc-control-nullish');
        }
        else {
            this.elements.controlDiv?.classList.remove('hcc-control-nullish');
        }
    }
}

const Product$1 = window.Highcharts || window.Grid;
const StandaloneControlMap = {
    boolean: BooleanControl,
    color: ColorControl,
    number: NumberControl,
    select: SelectControl,
    text: TextControl
};
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
    static get observedAttributes() {
        return ['value'];
    }
    connectedCallback() {
        if (this.closest('highcharts-controls')) {
            return;
        }
        if (this.control) {
            return;
        }
        const config = this.getConfig();
        if (config.type === 'text') {
            const { keyDiv, valueDivInner } = createControlScaffolding(config, this);
            const rid = `text-input-${(config.path || 'control')
                .replace(/[^a-z0-9_-]/gi, '-')
                .replace(/^-|-$/g, '') || 'control'}`;
            keyDiv.appendChild(Object.assign(document.createElement('label'), {
                htmlFor: rid,
                innerHTML: config.label || (config.path ? `<code>${config.path}</code>` : ''),
                title: config.label || config.path
            }));
            this.input = valueDivInner.appendChild(Object.assign(document.createElement('input'), {
                type: 'text',
                id: rid,
                className: 'hcc-text-input',
                value: config.value ?? '',
                title: config.label || config.path
            }));
            this._value = config.value ?? '';
            const handleValue = () => {
                const value = this.input?.value ?? '';
                this._value = value;
                this.dispatchEvent(new CustomEvent('input', {
                    detail: { value },
                    bubbles: true,
                    cancelable: true,
                    composed: true
                }));
                this.dispatchEvent(new CustomEvent('change', {
                    detail: { value },
                    bubbles: true,
                    cancelable: true,
                    composed: true
                }));
            };
            this.input.addEventListener('input', handleValue);
            this.input.addEventListener('change', handleValue);
            this.syncValueAttribute();
            return;
        }
        const ControlCtor = config.type && StandaloneControlMap[config.type];
        if (!ControlCtor) {
            return;
        }
        const control = new ControlCtor(config);
        this.control = control;
        control.render(this);
        control.addEventListener('change', (event) => {
            const detail = event.detail || {};
            this._value = detail.value;
            this.dispatchEvent(new CustomEvent('input', {
                detail,
                bubbles: true,
                cancelable: true,
                composed: true
            }));
            this.dispatchEvent(new CustomEvent('change', {
                detail,
                bubbles: true,
                cancelable: true,
                composed: true
            }));
        });
        this.syncValueAttribute();
    }
    attributeChangedCallback(name, _oldValue, newValue) {
        if (name !== 'value' || newValue === null) {
            return;
        }
        const parsedValue = parseValue(newValue);
        if (this.control && this._value === parsedValue) {
            return;
        }
        this._value = parsedValue;
        if (this.control) {
            this.control.value = parsedValue;
            return;
        }
        if (this.input) {
            this.input.value = parsedValue ?? '';
        }
    }
    get value() {
        if (this.control) {
            return this.control.value;
        }
        if (this._value !== undefined) {
            return this._value;
        }
        return parseValue(this.getAttribute('value'));
    }
    set value(nextValue) {
        this._value = nextValue;
        if (this.control) {
            this.control.value = nextValue;
            return;
        }
        if (this.input) {
            this.input.value = nextValue === null || nextValue === undefined ? '' : String(nextValue);
        }
        if (nextValue === null || nextValue === undefined) {
            this.removeAttribute('value');
        }
        else {
            this.setAttribute('value', String(nextValue));
        }
        if (this.input || this._value !== undefined) {
            const value = nextValue === null || nextValue === undefined ? '' : String(nextValue);
            this.dispatchEvent(new CustomEvent('input', {
                detail: { value },
                bubbles: true,
                cancelable: true,
                composed: true
            }));
            this.dispatchEvent(new CustomEvent('change', {
                detail: { value },
                bubbles: true,
                cancelable: true,
                composed: true
            }));
        }
    }
    syncValueAttribute() {
        const value = this.value;
        if (value === null || value === undefined) {
            this.removeAttribute('value');
        }
        else {
            this.setAttribute('value', String(value));
        }
    }
    getConfig() {
        const config = {};
        if (this.hasAttribute('path')) {
            config.path = this.getAttribute('path') || undefined;
        }
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
            : 'inline-block', showPreview = this.getAttribute('show-preview') !== 'false';
        let target = this.getTarget();
        const Controls = window.HighchartsControls;
        if (!Controls) {
            return;
        }
        const init = (target) => {
            Controls.controls(this, {
                target,
                injectCSS,
                display: display,
                showPreview,
                controls: controls
            });
        };
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
        if (target) {
            init(target);
        }
        else {
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
        return Product$1?.charts?.[0] || Product$1?.grids?.[0];
    }
}
queueMicrotask(() => {
    if (!window.HighchartsControls) {
        return;
    }
    if (!customElements.get('highcharts-control')) {
        customElements.define('highcharts-control', HighchartsControlElement);
    }
    if (!customElements.get('highcharts-group')) {
        customElements.define('highcharts-group', HighchartsGroupElement);
    }
    if (!customElements.get('highcharts-group-description')) {
        customElements.define('highcharts-group-description', class extends HTMLElement {
        });
    }
    if (!customElements.get('highcharts-separator')) {
        customElements.define('highcharts-separator', class extends HTMLElement {
        });
    }
    if (!customElements.get('highcharts-controls')) {
        customElements.define('highcharts-controls', HighchartsControlsElement);
    }
});
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

/**
 * Index file for Control Types
 * Exports all control types and their type guards
 */
const SeparatorControl = {
    is(params) {
        return params.type === 'separator';
    },
    create(controls) {
        if (!controls.container) {
            throw new Error('Container for controls not found');
        }
        const row = controls.container.appendChild(Object.assign(document.createElement('div'), { className: 'hcc-separator-row' }));
        const cell1 = row.appendChild(Object.assign(document.createElement('div'), { className: 'hcc-separator-cell' }));
        row.appendChild(Object.assign(document.createElement('div'), { className: 'hcc-separator-cell' }));
        cell1.appendChild(Object.assign(document.createElement('hr'), { className: 'hcc-separator' }));
    }
};
/**
 * Registry of all control types, in order of priority for type checking
 */
const controlTypeRegistry = [
    SelectControl,
    BooleanControl,
    ColorControl,
    NumberControl,
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
function isValidColorString(value) {
    if (typeof value !== 'string') {
        return false;
    }
    const trimmed = value.trim();
    if (!trimmed) {
        return false;
    }
    const colorTest = document.createElement('div');
    colorTest.style.color = trimmed;
    return !!colorTest.style.color;
}
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
        if (options.showPreview !== false) {
            this.addPreview();
        }
        // Keep the options preview updated
        if (options.showPreview !== false) {
            this.updateOptionsPreview();
        }
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
    applyColorSchemeToTarget(mode) {
        if (!this.target) {
            return;
        }
        const targetEl = this.target.renderTo ||
            this.target.container ||
            this.target.element ||
            this.target.el;
        if (!(targetEl instanceof HTMLElement)) {
            return;
        }
        targetEl.classList.remove('highcharts-light', 'highcharts-dark');
        if (mode === 'light') {
            targetEl.classList.add('highcharts-light');
        }
        else if (mode === 'dark') {
            targetEl.classList.add('highcharts-dark');
        }
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
            // - https://cdn.jsdelivr.net/npm/@highcharts/controls@0.9.1
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
        const { value } = params;
        const path = params.path || '';
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
            if (isValidColorString(value)) {
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
        if (!SeparatorControl.is(params)) {
            const controlParams = params;
            // Only try to get nested value if target exists
            if (this.target?.options && controlParams.path) {
                controlParams.value ?? (controlParams.value = getNestedValue(this.target.options, controlParams.path));
            }
            controlParams.type || (controlParams.type = this.deduceControlType(controlParams));
        }
        // Find and instantiate the appropriate control type
        for (const controlType of controlTypeRegistry) {
            if (!controlType.is(params)) {
                continue;
            }
            if (typeof controlType.create === 'function') {
                controlType.create(this, params);
            }
            else {
                const controlParams = params;
                const control = new controlType(controlParams);
                control.render(this.container);
                control.addEventListener('change', ((e) => {
                    const customEvent = e;
                    const value = customEvent.detail?.value;
                    const animation = customEvent.detail?.animation;
                    const colorMode = customEvent.detail?.colorMode;
                    if (colorMode) {
                        this.applyColorSchemeToTarget(colorMode);
                    }
                    if (controlParams.path) {
                        this.setNestedValue(controlParams.path, value, animation);
                    }
                }));
            }
            break;
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

export { BooleanControl, ColorControl, Control, NumberControl, SelectControl, TextControl, Controls as default };
//# sourceMappingURL=controls.js.map
