/**
 * Boolean Control Type
 */
import type { BooleanControlParams, ControlParams } from './types.js';
import type { ControlsInstance } from './index.js';
import { createControlScaffolding } from './utils.js';
import { Control } from '../Control.js';

/**
 * BooleanControl class - toggle switch for boolean values
 */
export class BooleanControl extends Control<BooleanControlParams> {
    private input?: HTMLInputElement;
    private slider?: HTMLElement;
    private currentState?: boolean | null;

    /**
     * Type guard for BooleanControlParams
     */
    static is(params: ControlParams): params is BooleanControlParams {
        return params.type === 'boolean';
    }

    /**
     * Render the boolean control
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
                    htmlFor: `toggle-checkbox-${rid}`,
                    innerHTML: this.params.label || `<code>${this.params.path}</code>`,
                    title: this.params.label || this.params.path
                }
            )
        );

        if (this.params.nullable) {
            // Nullable tri-state toggle: false (left), null (middle), true (right)
            const labelToggle = valueDivInner.appendChild(
                Object.assign(
                    document.createElement('label'),
                    { className: 'hcc-toggle hcc-toggle-nullable' }
                )
            );

            this.currentState = this._value === null || this._value === undefined ? null : Boolean(this._value);

            // Create a hidden input to store state (not used for interaction)
            this.input = labelToggle.appendChild(
                Object.assign(
                    document.createElement('input'),
                    {
                        type: 'hidden',
                        id: `toggle-checkbox-${rid}`
                    }
                )
            );

            this.slider = labelToggle.appendChild(
                Object.assign(
                    document.createElement('span'),
                    {
                        className: 'hcc-toggle-slider',
                        'aria-hidden': 'true'
                    }
                )
            );

            this.slider.addEventListener('click', (): void => {
                this.handleNullableClick();
            });

            this.updateUI();
        } else {
            // Standard two-state toggle
            const labelToggle = valueDivInner.appendChild(
                Object.assign(
                    document.createElement('label'),
                    { className: 'hcc-toggle' }
                )
            );

            this.input = labelToggle.appendChild(
                Object.assign(
                    document.createElement('input'),
                    {
                        type: 'checkbox',
                        id: `toggle-checkbox-${rid}`
                    }
                )
            );

            this.slider = labelToggle.appendChild(
                Object.assign(
                    document.createElement('span'),
                    {
                        className: 'hcc-toggle-slider',
                        'aria-hidden': 'true'
                    }
                )
            );

            this.input.addEventListener('change', (): void => {
                this.handleStandardChange();
            });

            this.updateUI();
        }
    }

    /**
     * Handle click on nullable toggle
     */
    private handleNullableClick(): void {
        // Cycle: false -> null -> true -> false
        if (this.currentState === false) {
            this.currentState = null;
        } else if (this.currentState === null) {
            this.currentState = true;
        } else {
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
    private handleStandardChange(): void {
        if (!this.input) return;

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
    protected updateUI(): void {
        if (this.params.nullable && this.slider) {
            // Remove all state classes
            this.slider.classList.remove('hcc-toggle-slider-false', 'hcc-toggle-slider-null', 'hcc-toggle-slider-true');

            if (this.currentState === null) {
                this.slider.classList.add('hcc-toggle-slider-null');
                this.elements.controlDiv?.classList.add('hcc-control-nullish');
            } else if (this.currentState === false) {
                this.slider.classList.add('hcc-toggle-slider-false');
                this.elements.controlDiv?.classList.remove('hcc-control-nullish');
            } else {
                this.slider.classList.add('hcc-toggle-slider-true');
                this.elements.controlDiv?.classList.remove('hcc-control-nullish');
            }
        } else if (this.input && this.input.type === 'checkbox') {
            this.input.checked = Boolean(this._value);
        }
    }
}

/**
 * Legacy factory function for backward compatibility
 * @deprecated Use BooleanControl class directly
 */
export function create(
    controls: ControlsInstance,
    params: BooleanControlParams
): void {
    const control = new BooleanControl(params);
    control.render(controls.container);

    // Bind to target if it exists
    control.addEventListener('change', ((e: Event) => {
        const customEvent = e as CustomEvent;
        controls.setNestedValue(
            params.path,
            customEvent.detail.value
        );
    }) as EventListener);
}

/**
 * Legacy type guard for backward compatibility
 * @deprecated Use BooleanControl.is() instead
 */
export function is(params: ControlParams): params is BooleanControlParams {
    return BooleanControl.is(params);
}
