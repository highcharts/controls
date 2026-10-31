/**
 * Color Control Type
 */
import type { ColorControlParams, ControlParams } from './types.js';
import type { ControlsInstance } from './index.js';
import { createControlScaffolding, createNullableButton } from './utils.js';
import { Control } from '../Control.js';

type RgbaColor = { rgba: number[] };

function clampChannel(value: number): number {
    return Math.min(255, Math.max(0, value));
}

function normalizeAlpha(value: number): number {
    if (!Number.isFinite(value)) {
        return 1;
    }
    return Math.min(1, Math.max(0, value));
}

function parseHexColor(value: string): number[] | null {
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

function parseCssColor(value: unknown): RgbaColor | null {
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

function isValidColorString(value: unknown): boolean {
    return !!parseCssColor(value);
}

/**
 * ColorControl class - standalone color picker with opacity
 */
export class ColorControl extends Control<ColorControlParams> {
    private colorInput?: HTMLInputElement;
    private opacityInput?: HTMLInputElement;
    private opacityDisplay?: HTMLElement;
    private valueEl?: HTMLElement;
    private opacityRangeContainer?: HTMLElement;
    private hideRangeHandler?: (e: MouseEvent) => void;
    private colorInputCount = 0;
    private lastColorInputAt = 0;
    private colorInputResetTimer?: number;
    private opacityIsDragging = false;
    private opacityMouseIsDown = false;
    private onOpacityMouseMove?: () => void;
    private onOpacityMouseUp?: () => void;

    /**
     * Type guard for ColorControlParams
     */
    static is(params: ControlParams): params is ColorControlParams {
        return params.type === 'color';
    }

    /**
     * Render the color control
     */
    render(container: HTMLElement): void {
        const { controlDiv, keyDiv, valueDivInner } = createControlScaffolding(
            this.params,
            container
        );

        this.elements.controlDiv = controlDiv;
        this.elements.keyDiv = keyDiv;
        this.elements.valueDivInner = valueDivInner;

        const rid = this.getScopedId('color-input');
        keyDiv.appendChild(
            Object.assign(
                document.createElement('label'),
                {
                    htmlFor: rid,
                    innerHTML: this.params.label || `<code>${this.params.path}</code>`,
                    title: this.params.label || this.params.path
                }
            )
        );

        this.colorInput = valueDivInner.appendChild(
            Object.assign(
                document.createElement('input'),
                {
                    type: 'color',
                    id: rid
                }
            )
        );

        this.valueEl = valueDivInner.appendChild(
            Object.assign(
                document.createElement('label'),
                {
                    id: this.getScopedId('color-value'),
                    className: 'hcc-color-value',
                    htmlFor: rid,
                    title: this.params.label || this.params.path
                }
            )
        );

        this.opacityDisplay = valueDivInner.appendChild(
            Object.assign(
                document.createElement('span'),
                {
                    id: this.getScopedId('opacity-display'),
                    className: 'hcc-opacity-display',
                    title: this.params.label || this.params.path
                }
            )
        );

        valueDivInner.appendChild(
            Object.assign(
                document.createElement('span'),
                {
                    textContent: '%',
                    className: 'hcc-opacity-input-label'
                }
            )
        );

        // Container for the range slider popup
        this.opacityRangeContainer = valueDivInner.appendChild(
            Object.assign(
                document.createElement('div'),
                {
                    className: 'hcc-opacity-range-container hcc-hidden'
                }
            )
        );

        this.opacityInput = this.opacityRangeContainer.appendChild(
            Object.assign(
                document.createElement('input'),
                {
                    type: 'range',
                    id: this.getScopedId('opacity-input'),
                    className: 'hcc-opacity-input',
                    min: '0',
                    max: '100',
                    step: '1'
                }
            )
        );

        this.opacityInput.addEventListener('mousedown', (): void => {
            this.opacityMouseIsDown = true;
            this.opacityIsDragging = false;
        });

        this.onOpacityMouseMove = (): void => {
            if (this.opacityMouseIsDown) {
                this.opacityIsDragging = true;
            }
        };
        document.addEventListener('mousemove', this.onOpacityMouseMove);

        this.onOpacityMouseUp = (): void => {
            this.opacityMouseIsDown = false;
        };
        document.addEventListener('mouseup', this.onOpacityMouseUp);

        // Show/hide range slider on opacity display click
        this.opacityDisplay.addEventListener('click', (e): void => {
            e.stopPropagation();
            this.opacityRangeContainer!.classList.remove('hcc-hidden');
            this.opacityInput!.focus();
        });

        // Hide range slider on Enter key
        this.opacityInput.addEventListener('keydown', (e): void => {
            if (e.key === 'Enter') {
                this.opacityRangeContainer!.classList.add('hcc-hidden');
            }
        });

        // Hide range slider when clicking outside
        this.hideRangeHandler = (e: MouseEvent): void => {
            if (!this.opacityRangeContainer!.contains(e.target as Node) &&
                !this.opacityDisplay!.contains(e.target as Node)) {
                this.opacityRangeContainer!.classList.add('hcc-hidden');
            }
        };
        document.addEventListener('click', this.hideRangeHandler);

        // Track color picker interaction to distinguish drag preview from single click
        this.colorInput.addEventListener('input', (e) => {
            if ((e.target as Element | null)?.closest?.('highcharts-control')) {
                e.stopPropagation();
            }
            this.handleColorInput(e);
        });

        this.colorInput.addEventListener('change', (e) => {
            if ((e.target as Element | null)?.closest?.('highcharts-control')) {
                e.stopPropagation();
            }
            this.handleColorChange();
        });

        this.opacityInput.addEventListener('input', (e) => {
            if ((e.target as Element | null)?.closest?.('highcharts-control')) {
                e.stopPropagation();
            }
            this.handleOpacityInput(e);
        });

        this.opacityInput.addEventListener('change', (e) => {
            if ((e.target as Element | null)?.closest?.('highcharts-control')) {
                e.stopPropagation();
            }
            this.handleOpacityChange();
        });

        // Add nullable button if needed
        if (this.params.nullable) {
            const nullableButton = createNullableButton(
                this.params,
                controlDiv,
                (): void => {
                    this.value = null;
                }
            );
            valueDivInner.appendChild(nullableButton);
        }

        // Initialize UI
        this.updateUI();
    }

    /**
     * Handle input changes from color picker or opacity slider
     */
    private handleColorInput(event: Event): void {
        if (!this.colorInput || !this.opacityInput) return;

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

        this.colorInputResetTimer = window.setTimeout((): void => {
            this.resetColorInputSession();
        }, 300);
    }

    /**
     * Handle color picker commit
     */
    private handleColorChange(): void {
        if (!this.colorInput) return;

        // Fallback for browsers that only emit change from the native picker
        if (this.colorInputCount === 0) {
            this.applyInputsAndEmit(true);
        }

        this.resetColorInputSession();
    }

    /**
     * Handle opacity slider input
     */
    private handleOpacityInput(event: Event): void {
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
    private handleOpacityChange(): void {
        if (!this.opacityIsDragging) {
            this.applyInputsAndEmit(true);
        }
        this.opacityIsDragging = false;
    }

    /**
     * Reset color interaction tracking
     */
    private resetColorInputSession(): void {
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
    private applyInputsAndEmit(animation: boolean): void {
        if (!this.colorInput || !this.opacityInput) return;

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
        const newValue = this.getHex(currentColor, true);

        // Update internal value and emit event
        const oldValue = this._value;
        this._value = newValue;

        // Update display elements
        this.valueEl!.textContent = this.getHex(currentColor);
        this.opacityDisplay!.textContent = this.opacityInput.value;
        this.updateOpacityGradient(currentColor);

        // Emit change event
        this.emit('change', {
            value: newValue,
            oldValue,
            path: this.params.path,
            animation
        });
    }

    /**
     * Update UI to reflect current value
     */
    protected updateUI(): void {
        if (!this.colorInput || !this.opacityInput || !this.valueEl || !this.opacityDisplay) {
            return;
        }

        const isNullish = this._value === null || this._value === undefined;
        let activeColor: RgbaColor = { rgba: [128, 128, 128, 1] };

        if (!isNullish) {
            const parsedValue = parseCssColor(this._value);
            if (!parsedValue) {
                console.warn(
                    `Highcharts Controls: Invalid color value for path "${this.params.path}": ${this._value}`
                );
                this.elements.controlDiv?.classList.add('hcc-control-nullish');
                this.valueEl.textContent = '—';
                this.colorInput.value = '#808080';
                this.opacityInput.value = '100';
                this.opacityDisplay.textContent = '100';
                this.updateOpacityGradient(activeColor);
                return;
            }
            activeColor = parsedValue;
        }

        if (isNullish) {
            this.elements.controlDiv?.classList.add('hcc-control-nullish');
            this.valueEl.textContent = '—';
            this.colorInput.value = '#808080';
            this.opacityInput.value = '100';
            this.opacityDisplay.textContent = '100';
        } else {
            this.elements.controlDiv?.classList.remove('hcc-control-nullish');
            const hex = this.getHex({ rgba: [activeColor.rgba[0], activeColor.rgba[1], activeColor.rgba[2], 1] });
            const opacity = (activeColor.rgba[3] || 1) * 100;
            this.colorInput.value = hex;
            this.valueEl.textContent = hex;
            this.opacityInput.value = String(Math.round(opacity));
            this.opacityDisplay.textContent = String(Math.round(opacity));
        }

        // Initialize opacity slider gradient
        this.updateOpacityGradient(activeColor);
    }

    /**
     * Convert color to hex string
     */
    private getHex(color: RgbaColor, includeAlpha?: boolean): string {
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
    private updateOpacityGradient(color: { rgba: number[] }): void {
        if (!this.opacityInput) return;

        const r = color.rgba[0];
        const g = color.rgba[1];
        const b = color.rgba[2];
        this.opacityInput.style.setProperty('--hcc-opacity-gradient-start', `rgba(${r}, ${g}, ${b}, 0)`);
        this.opacityInput.style.setProperty('--hcc-opacity-gradient-end', `rgba(${r}, ${g}, ${b}, 1)`);
    }

    /**
     * Clean up event listeners
     */
    destroy(): void {
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

