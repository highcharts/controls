/**
 * Boolean Control Type
 */
import type { BooleanControlParams, ControlParams } from './types.js';

/**
 * Type guard for BooleanControlParams
 */
export function is(params: ControlParams): params is BooleanControlParams {
    return params.type === 'boolean';
}

/**
 * Add a boolean control
 */
export function add(
    params: BooleanControlParams,
    keyDiv: HTMLElement,
    valueDiv: HTMLElement,
    controlDiv: HTMLElement,
    setNestedValue: (path: string, value: any, animation?: boolean) => void
): void {
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

    const isNullish = params.value === null || params.value === undefined;
    const labelToggle = valueDiv.appendChild(
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
        setNestedValue(params.path, value);
    });
}
