/**
 * Boolean Control Type
 */
import type { BooleanControlParams, ControlParams } from './types.js';
import type { ControlsInstance } from './index.js';
import { createControlScaffolding } from './utils.js';

/**
 * Type guard for BooleanControlParams
 */
export function is(params: ControlParams): params is BooleanControlParams {
    return params.type === 'boolean';
}

/**
 * Create a boolean control with scaffolding
 */
export function create(
    controls: ControlsInstance,
    params: BooleanControlParams
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
                htmlFor: `toggle-checkbox-${rid}`,
                innerHTML: params.label || `<code>${params.path}</code>`,
                title: params.label || params.path
            }
        )
    );

    const labelToggle = valueDivInner.appendChild(
        Object.assign(
            document.createElement('label'),
            { className: 'hcc-toggle' }
        )
    );

    const input = labelToggle.appendChild(
        Object.assign(
            document.createElement('input'),
            {
                type: 'checkbox',
                id: `toggle-checkbox-${rid}`
            }
        )
    );

    labelToggle.appendChild(
        Object.assign(
            document.createElement('span'),
            {
                className: 'hcc-toggle-slider',
                'aria-hidden': 'true'
            }
        )
    );

    input.checked = Boolean(params.value);

    input.addEventListener('change', (): void => {
        controlDiv.classList.remove('hcc-control-nullish');
        const value = input.checked;
        controls.setNestedValue(params.path, value);
    });
}
