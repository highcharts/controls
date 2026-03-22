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

    if (params.nullable) {
        // Nullable tri-state toggle: false (left), null (middle), true (right)
        const labelToggle = valueDivInner.appendChild(
            Object.assign(
                document.createElement('label'),
                { className: 'hcc-toggle hcc-toggle-nullable' }
            )
        );

        let currentState: boolean|null =
            params.value === null || params.value === undefined ? null : Boolean(params.value);

        // Create a hidden input to store state (not used for interaction)
        const stateInput = labelToggle.appendChild(
            Object.assign(
                document.createElement('input'),
                {
                    type: 'hidden',
                    id: `toggle-checkbox-${rid}`
                }
            )
        );

        const slider = labelToggle.appendChild(
            Object.assign(
                document.createElement('span'),
                {
                    className: 'hcc-toggle-slider',
                    'aria-hidden': 'true'
                }
            )
        );

        const updateTogglePosition = (): void => {
            // Remove all state classes
            slider.classList.remove('hcc-toggle-slider-false', 'hcc-toggle-slider-null', 'hcc-toggle-slider-true');

            if (currentState === null) {
                slider.classList.add('hcc-toggle-slider-null');
                controlDiv.classList.add('hcc-control-nullish');
            } else if (currentState === false) {
                slider.classList.add('hcc-toggle-slider-false');
                controlDiv.classList.remove('hcc-control-nullish');
            } else {
                slider.classList.add('hcc-toggle-slider-true');
                controlDiv.classList.remove('hcc-control-nullish');
            }
        };

        updateTogglePosition();

        slider.addEventListener('click', (): void => {
            // Cycle: false -> null -> true -> false
            if (currentState === false) {
                currentState = null;
            } else if (currentState === null) {
                currentState = true;
            } else {
                currentState = false;
            }
            updateTogglePosition();
            controls.setNestedValue(params.path, currentState);
        });
    } else {
        // Standard two-state toggle
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
}
