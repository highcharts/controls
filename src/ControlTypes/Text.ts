/**
 * Text Control Type
 */
import type { TextControlParams, ControlParams } from './types.js';
import type { ControlsInstance } from './index.js';
import { createControlScaffolding, createNullableButton } from './utils.js';
import { Control } from '../Control.js';

/**
 * TextControl class - text input for string values
 */
export class TextControl extends Control<TextControlParams> {
    private input?: HTMLInputElement;

    /**
     * Type guard for TextControlParams
     */
    static is(params: ControlParams): params is TextControlParams {
        return params.type === 'text';
    }

    /**
     * Render the text control
     */
    render(container: HTMLElement): void {
        const { controlDiv, keyDiv, valueDivInner } = createControlScaffolding(
            this.params,
            container
        );

        this.elements.controlDiv = controlDiv;
        this.elements.keyDiv = keyDiv;
        this.elements.valueDivInner = valueDivInner;

        const path = this.params.path || 'control';
        const rid = this.getScopedId('text-input');

        keyDiv.appendChild(
            Object.assign(
                document.createElement('label'),
                {
                    htmlFor: rid,
                    innerHTML: this.params.label || `<code>${path}</code>`,
                    title: this.params.label || path
                }
            )
        );

        this.input = valueDivInner.appendChild(
            Object.assign(
                document.createElement('input'),
                {
                    type: 'text',
                    id: rid,
                    className: 'hcc-text-input',
                    title: this.params.label || path
                }
            )
        );

        this.input.addEventListener('input', (e): void => {
            if ((e.target as Element | null)?.closest?.('highcharts-control')) {
                e.stopPropagation();
            }
            this.handleInputChange();
        });

        this.input.addEventListener('change', (e): void => {
            if ((e.target as Element | null)?.closest?.('highcharts-control')) {
                e.stopPropagation();
            }
            this.handleInputChange();
        });

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

        this.updateUI();
    }

    private handleInputChange(): void {
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

    protected updateUI(): void {
        if (!this.input) {
            return;
        }

        const isNullish = this._value === null || this._value === undefined;
        this.input.value = isNullish ? '' : String(this._value ?? '');
        this.input.placeholder = isNullish ? 'null' : '';

        if (isNullish) {
            this.elements.controlDiv?.classList.add('hcc-control-nullish');
        } else {
            this.elements.controlDiv?.classList.remove('hcc-control-nullish');
        }
    }
}

/**
 * Type guard for TextControlParams
 */
export function is(params: ControlParams): params is TextControlParams {
    return params.type === 'text';
}

/**
 * Create a text control with scaffolding
 */
export function create(
    controls: ControlsInstance,
    params: TextControlParams
): void {
    const path = params.path || 'control';
    const { controlDiv, keyDiv, valueDivInner } = createControlScaffolding(
        params,
        controls.container
    );

    const rid = `text-input-${path
        .replace(/[^a-z0-9_-]/gi, '-')
        .replace(/^-|-$/g, '') || 'control'}`;

    keyDiv.appendChild(
        Object.assign(
            document.createElement('label'),
            {
                htmlFor: rid,
                innerHTML: params.label || `<code>${path}</code>`,
                title: params.label || path
            }
        )
    );

    const input = valueDivInner.appendChild(
        Object.assign(
            document.createElement('input'),
            {
                type: 'text',
                id: rid,
                className: 'hcc-text-input',
                title: params.label || params.path
            }
        )
    );

    const isNullish = params.value === null || params.value === undefined;

    if (isNullish) {
        input.value = '';
        input.placeholder = 'null';
    } else {
        input.value = String(params.value || '');
    }

    input.addEventListener('input', (): void => {
        controlDiv.classList.remove('hcc-control-nullish');
        input.placeholder = '';
        const value = input.value;
        if (params.path) {
            controls.setNestedValue(params.path, value, true);
        }
    });

    if (params.nullable) {
        const nullableButton = createNullableButton(
            params,
            controlDiv,
            (): void => {
                input.value = '';
                input.placeholder = 'null';
                controlDiv.classList.add('hcc-control-nullish');
                if (params.path) {
                    controls.setNestedValue(params.path, null, true);
                }
            }
        );
        valueDivInner.appendChild(nullableButton);
    }
}
