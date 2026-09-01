/**
 * Number Control Type
 */
import type { NumberControlParams, ControlParams } from './types.js';
import type { ControlsInstance } from './index.js';
import { createControlScaffolding, createNullableButton } from './utils.js';
import { Control } from '../Control.js';

/**
 * NumberControl class - range slider for numeric values
 */
export class NumberControl extends Control<NumberControlParams> {
    private input?: HTMLInputElement;
    private valueEl?: HTMLElement;
    private unit = '';
    private isDragging = false;
    private mouseIsDown = false;
    private decimals = 0;
    private onMouseMove?: () => void;
    private onMouseUp?: () => void;

    /**
     * Type guard for NumberControlParams
     */
    static is(params: ControlParams): params is NumberControlParams {
        return params.type === 'number';
    }

    /**
     * Render the number control
     */
    render(container: HTMLElement): void {
        const { controlDiv, keyDiv, valueDivInner} = createControlScaffolding(
            this.params,
            container
        );

        this.elements.controlDiv = controlDiv;
        this.elements.keyDiv = keyDiv;
        this.elements.valueDivInner = valueDivInner;

        const rid = this.params.path.replace(/[^a-z0-9_-]/gi, '-');
        let value = this._value;

        // Extract unit from current value if it's a string
        let numericValue: number | undefined;

        if (typeof value === 'string') {
            const match = value.match(/^([+-]?\d+\.?\d*)\s*(.*)$/);
            if (match) {
                numericValue = parseFloat(match[1]);
                this.unit = match[2] || this.unit;
            }
        } else {
            numericValue = value;
        }

        // Set default min/max if not provided
        if (this.params.min === void 0 || this.params.max === void 0) {
            if (/(lineWidth|borderWidth)$/i.test(this.params.path)) {
                this.params.min = this.params.min ?? 0;
                this.params.max = this.params.max ?? 5;
            } else if (/(borderRadius)$/i.test(this.params.path)) {
                this.params.min = this.params.min ?? 0;
                this.params.max = this.params.max ?? 10;
            } else if (/\.(x|y|offsetX|offsetY|offset)$/i.test(this.params.path)) {
                this.params.min = this.params.min ?? -100;
                this.params.max = this.params.max ?? 100;
            } else if (/rotation$/i.test(this.params.path)) {
                this.params.min = this.params.min ?? -90;
                this.params.max = this.params.max ?? 90;
            } else {
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

        keyDiv.appendChild(
            Object.assign(
                document.createElement('label'),
                {
                    htmlFor: `range-input-${rid}`,
                    innerHTML: this.params.label || `<code>${this.params.path}</code>`,
                    title: this.params.label || this.params.path
                }
            )
        );

        const isNullish = numericValue === null || numericValue === undefined;
        this.valueEl = valueDivInner.appendChild(
            Object.assign(
                document.createElement('span'),
                {
                    id: `range-value-${rid}`,
                    className: 'hcc-range-value',
                    title: this.params.label || this.params.path
                }
            )
        );

        const strStep = String(this.params.step || 1);
        this.input = valueDivInner.appendChild(
            Object.assign(
                document.createElement('input'),
                {
                    type: 'range',
                    id: `range-input-${rid}`,
                    min: String(this.params.min),
                    max: String(this.params.max),
                    step: strStep,
                    title: this.params.label || this.params.path
                }
            )
        );

        if (isNullish) {
            // Set to middle of range for nullish state
            this.input.value = String((this.params.min + this.params.max) / 2);
            this.valueEl.textContent = '';
        } else {
            this.input.value = String(numericValue);
            this.valueEl.textContent = this.unit ? `${numericValue}${this.unit}` : String(numericValue);
        }

        // Track if user is actively dragging vs clicking to jump
        this.input.addEventListener('mousedown', (): void => {
            this.mouseIsDown = true;
            this.isDragging = false;
        });

        // Detect actual dragging by tracking mouse movement
        this.onMouseMove = (): void => {
            if (this.mouseIsDown) {
                this.isDragging = true;
            }
        };
        document.addEventListener('mousemove', this.onMouseMove);

        this.onMouseUp = (): void => {
            this.mouseIsDown = false;
        };
        document.addEventListener('mouseup', this.onMouseUp);

        // Keep a fixed number of decimals to avoid jumping (#7)
        this.decimals = strStep.indexOf('.') >= 0 ?
            strStep.split('.')[1].length : 0;

        this.input.addEventListener('input', (): void => {
            this.handleInputChange(false);
        });

        this.input.addEventListener('change', (): void => {
            this.handleInputChange(true);
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
    }

    /**
     * Handle input changes
     */
    private handleInputChange(isChangeEvent: boolean): void {
        if (!this.input || !this.valueEl) return;

        this.elements.controlDiv?.classList.remove('hcc-control-nullish');

        if (isChangeEvent) {
            // Only emit/animate if user clicked to jump, not after dragging
            if (!this.isDragging) {
                this.emitValue(true);
            }
            this.isDragging = false;
        } else {
            // During dragging
            if (this.isDragging) {
                this.emitValue(false);
            }
        }
    }

    /**
     * Emit value change event
     */
    private emitValue(animation: boolean): void {
        if (!this.input || !this.valueEl) return;

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
    protected updateUI(): void {
        if (!this.input || !this.valueEl) return;

        if (this._value === null || this._value === undefined) {
            this.input.value = String((this.params.min! + this.params.max!) / 2);
            this.valueEl.textContent = '';
            this.elements.controlDiv?.classList.add('hcc-control-nullish');
        } else {
            let numericValue: number | undefined;
            if (typeof this._value === 'string') {
                const match = this._value.match(/^([+-]?\d+\.?\d*)/);
                if (match) {
                    numericValue = parseFloat(match[1]);
                }
            } else {
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
    destroy(): void {
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
export function create(
    controls: ControlsInstance,
    params: NumberControlParams
): void {
    const control = new NumberControl(params);
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
 * @deprecated Use NumberControl.is() instead
 */
export function is(params: ControlParams): params is NumberControlParams {
    return NumberControl.is(params);
}

