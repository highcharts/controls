/**
 * Select Control Type
 */
import type { SelectControlParams, ControlParams } from './types.js';
import type { ControlsInstance } from './index.js';
import { createControlScaffolding } from './utils.js';

/**
 * Type guard for SelectControlParams
 */
export function is(params: ControlParams): params is SelectControlParams {
    return params.type === 'select';
}

/**
 * Create a select control with scaffolding
 */
export function create(
    controls: ControlsInstance,
    params: SelectControlParams
): void {
    const { controlDiv, keyDiv, valueDivInner } = createControlScaffolding(
        params,
        controls.container
    );

    keyDiv.appendChild(
        Object.assign(
            document.createElement('label'),
            {
                innerHTML: params.label || `<code>${params.path}</code>`,
                title: params.label || params.path
            }
        )
    );

    // Deduce options
    if (
        params.path.endsWith('.align') ||
        params.path.endsWith('.textAlign')
    ) {
        params.options ||= ['left', 'center', 'right'];
    }
    if (params.path.toLowerCase().endsWith('dashstyle')) {
        params.options ||= [
            'Solid', 'ShortDash', 'ShortDot', 'ShortDashDot',
            'ShortDashDotDot', 'Dot', 'Dash', 'LongDash',
            'DashDot', 'LongDashDot', 'LongDashDotDot'
        ];
    }
    if (params.path.endsWith('.fontWeight')) {
        params.options ||= ['normal', 'bold', 'lighter'];
    }
    if (params.path.endsWith('.verticalAlign')) {
        params.options ||= ['top', 'middle', 'bottom'];
    }

    // Ensure current value is in options
    const options = params.options || [];
    if (
        params.value !== null &&
        params.value !== undefined &&
        !options.includes(params.value)
    ) {
        options.unshift(params.value);
    }

    // Determine whether to use select dropdown or button group
    const totalLength = options.reduce((sum, opt) => sum + opt.length, 0);
    const useDropdown = options.length > 3 || totalLength > 24;

    if (useDropdown) {
        // Render as select dropdown
        valueDivInner.classList.add('hcc-select-control');

        const select = valueDivInner.appendChild(
            Object.assign(
                document.createElement('select'),
                {
                    className: 'hcc-select-dropdown'
                }
            )
        );

        // Add null option if nullable
        if (params.nullable) {
            const isNullSelected = params.value === null || params.value === undefined;
            select.appendChild(
                Object.assign(
                    document.createElement('option'),
                    {
                        value: '__null__',
                        innerText: '—',
                        selected: isNullSelected
                    }
                )
            );
            if (isNullSelected) {
                controlDiv.classList.add('hcc-control-nullish');
            }
        }

        options.forEach((option): void => {
            const isSelected = params.value !== null &&
                params.value !== undefined &&
                params.value === option;
            select.appendChild(
                Object.assign(
                    document.createElement('option'),
                    {
                        value: option,
                        innerText: option,
                        selected: isSelected
                    }
                )
            );
        });

        select.addEventListener('change', (): void => {
            const value = select.value;
            if (value === '__null__') {
                controlDiv.classList.add('hcc-control-nullish');
                controls.setNestedValue(params.path, null);
            } else {
                controlDiv.classList.remove('hcc-control-nullish');
                controls.setNestedValue(params.path, value);
            }
        });
    } else {
        // Render as button group
        valueDivInner.classList.add('hcc-button-group');

        // Add null button if nullable
        if (params.nullable) {
            const isNullActive = params.value === null || params.value === undefined;
            const nullButton = valueDivInner.appendChild(
                Object.assign(
                    document.createElement('button'),
                    {
                        className: 'hcc-button' +
                            (isNullActive ? ' active' : ''),
                        innerHTML: '⊘'
                    }
                )
            );
            nullButton.dataset.path = params.path;
            nullButton.dataset.value = '__null__';

            if (isNullActive) {
                controlDiv.classList.add('hcc-control-nullish');
            }

            nullButton.addEventListener(
                'click',
                (): void => {
                    controlDiv.classList.add('hcc-control-nullish');
                    controls.setNestedValue(params.path, null);

                    // Update active state for all buttons in this group
                    const allButtons = document.querySelectorAll(
                        `[data-path="${params.path}"]`
                    );
                    allButtons.forEach(
                        (b): void => b.classList.remove('active')
                    );
                    nullButton.classList.add('active');
                }
            );
        }

        options.forEach((option): void => {
            const isActive = params.value !== null &&
                params.value !== undefined &&
                params.value === option;
            const button = valueDivInner.appendChild(
                Object.assign(
                    document.createElement('button'),
                    {
                        className: 'hcc-button' +
                            (isActive ? ' active' : ''),
                        innerText: option
                    }
                )
            );
            button.dataset.path = params.path;
            button.dataset.value = option;

            button.addEventListener(
                'click',
                (): void => {
                    controlDiv.classList.remove('hcc-control-nullish');
                    const value = button.getAttribute('data-value');
                    controls.setNestedValue(params.path, value);

                    // Update active state for all buttons in this group
                    const allButtons = document.querySelectorAll(
                        `[data-path="${params.path}"]`
                    );
                    allButtons.forEach(
                        (b): void => b.classList.remove('active')
                    );
                    button.classList.add('active');
                }
            );
        });
    }
}