/**
 * Color Control Type
 */
import type { ColorControlParams, ControlParams } from './types.js';
import type { ControlsInstance } from './index.js';
import { createControlScaffolding, createNullableButton } from './utils.js';
import { Control } from '../Control.js';

/* eslint-disable @highcharts/highcharts/no-highcharts-object */
const Product = (window as any).Highcharts || (window as any).Grid;

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

        const rid = this.params.path.replace(/[^a-z0-9_-]/gi, '-');
        keyDiv.appendChild(
            Object.assign(
                document.createElement('label'),
                {
                    htmlFor: `color-input-${rid}`,
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
                    id: `color-input-${rid}`
                }
            )
        );

        this.valueEl = valueDivInner.appendChild(
            Object.assign(
                document.createElement('label'),
                {
                    id: `color-value-${rid}`,
                    className: 'hcc-color-value',
                    htmlFor: `color-input-${rid}`,
                    title: this.params.label || this.params.path
                }
            )
        );

        this.opacityDisplay = valueDivInner.appendChild(
            Object.assign(
                document.createElement('span'),
                {
                    id: `opacity-display-${rid}`,
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
                    id: `opacity-input-${rid}`,
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
            this.handleColorInput(e);
        });

        this.colorInput.addEventListener('change', () => {
            this.handleColorChange();
        });

        this.opacityInput.addEventListener('input', (e) => {
            this.handleOpacityInput(e);
        });

        this.opacityInput.addEventListener('change', () => {
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

        // Use Highcharts.color to apply opacity and produce rgba()/hex
        const hcColor = Product.color(rgba).setOpacity(opacity);
        const newValue = this.getHex(hcColor, true);

        // Update internal value and emit event
        const oldValue = this._value;
        this._value = newValue;

        // Update display elements
        this.valueEl!.textContent = this.getHex(hcColor);
        this.opacityDisplay!.textContent = this.opacityInput.value;
        this.updateOpacityGradient(hcColor);

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
        let hcColor = isNullish ? Product.color('#808080') : Product.color(this._value);

        if (!isNullish && hcColor.rgba.toString().indexOf('NaN') !== -1) {
            console.warn(
                `Highcharts Controls: Invalid color value for path "${this.params.path}": ${this._value}`
            );
            // Treat invalid color as nullish
            this.elements.controlDiv?.classList.add('hcc-control-nullish');
            this.valueEl.textContent = '—';
            this.colorInput.value = '#808080';
            this.opacityInput.value = '100';
            this.opacityDisplay.textContent = '100';
        } else if (isNullish) {
            this.elements.controlDiv?.classList.add('hcc-control-nullish');
            this.valueEl.textContent = '—';
            this.colorInput.value = '#808080';
            this.opacityInput.value = '100';
            this.opacityDisplay.textContent = '100';
        } else {
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
    private getHex(color: { rgba: number[] }, includeAlpha?: boolean): string {
        const rgba = color.rgba;
        let hex = `#${(
            ((1 << 24) +
            (rgba[0] << 16) +
            (rgba[1] << 8) +
            rgba[2]
            )
                .toString(16)
                .slice(1)
        ).toLowerCase()}`;

        if (includeAlpha && rgba[3] !== undefined && rgba[3] !== 1) {
            const alpha = Math.round(rgba[3] * 255);
            hex += ((1 << 8) + alpha).toString(16).slice(1).toLowerCase();
        }

        return hex;
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

/**
 * Legacy factory function for backward compatibility
 * @deprecated Use ColorControl class directly
 */
export function create(
    controls: ControlsInstance,
    params: ColorControlParams
): void {
    const control = new ColorControl(params);
    control.render(controls.container);

    // Bind to target if it exists
    control.addEventListener('change', ((e: Event) => {
        const customEvent = e as CustomEvent;
        controls.setNestedValue(
            params.path,
            customEvent.detail.value,
            customEvent.detail.animation
        );
    }) as EventListener);
}

/**
 * Legacy type guard for backward compatibility
 * @deprecated Use ColorControl.is() instead
 */
export function is(params: ControlParams): params is ColorControlParams {
    return ColorControl.is(params);
}
