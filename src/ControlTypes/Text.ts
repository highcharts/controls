/**
 * Text Control Type
 */
import type { TextControlParams, ControlParams } from './types.js';
import { createControlScaffolding } from './scaffolding.js';

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
    params: TextControlParams,
    container: HTMLElement,
    setNestedValue: (path: string, value: any, animation?: boolean) => void
): void {
    const { controlDiv, keyDiv, valueDivInner } = createControlScaffolding(
        params,
        container
    );
    add(params, keyDiv, valueDivInner, controlDiv, setNestedValue);
}

/**
 * Add a text control
 */
export function add(
    params: TextControlParams,
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
                htmlFor: `text-input-${rid}`,
                innerHTML: params.label || `<code>${params.path}</code>`,
                title: params.label || params.path
            }
        )
    );

    const input = valueDiv.appendChild(
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

    input.addEventListener('input', (): void => {
        controlDiv.classList.remove('hcc-control-nullish');
        const value = input.value;
        setNestedValue(params.path, value, false);
    });
}
