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
