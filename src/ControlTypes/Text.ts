/**
 * Text Control Type
 */
import type { TextControlParams, ControlParams } from './types.js';
import type { ControlsInstance } from './index.js';
import { createControlScaffolding, createNullableButton } from './utils.js';

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
    const { controlDiv, keyDiv, valueDivInner } = createControlScaffolding(
        params,
        controls.container
    );

    const rid = params.path.replace(/[^a-z0-9_-]/gi, '-');

    keyDiv.appendChild(
        Object.assign(
            document.createElement('label'),
            {
                htmlFor: `text-input-${rid}`,
                innerHTML: params.label || `<code>${params.path}</code>`,
                title: params.label || params.path
            }
        )
    );

    const input = valueDivInner.appendChild(
        Object.assign(
            document.createElement('input'),
            {
                type: 'text',
                id: `text-input-${rid}`,
                className: 'hcc-text-input',
                title: params.label || params.path
            }
        )
    );

    input.value = String(params.value || '');

    let lastNonNullValue = input.value;

    input.addEventListener('input', (): void => {
        controlDiv.classList.remove('hcc-control-nullish');
        const value = input.value;
        lastNonNullValue = value;
        controls.setNestedValue(params.path, value, false);
    });

    if (params.nullable) {
        const nullableButton = createNullableButton(
            params,
            controlDiv,
            (isNull: boolean): void => {
                if (isNull) {
                    lastNonNullValue = input.value;
                    input.value = '';
                    input.disabled = true;
                    controls.setNestedValue(params.path, null);
                } else {
                    input.disabled = false;
                    input.value = lastNonNullValue;
                    controls.setNestedValue(params.path, lastNonNullValue);
                    input.focus();
                }
            }
        );
        valueDivInner.appendChild(nullableButton);

        // Initialize disabled state if value is null
        if (params.value === null || params.value === undefined) {
            input.disabled = true;
            input.value = '';
        }
    }
}
