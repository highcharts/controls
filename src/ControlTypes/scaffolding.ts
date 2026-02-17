/**
 * Common scaffolding utilities for control types
 */
import type { ControlParams } from './types.js';

/**
 * Create the common scaffolding structure for all control types
 * Returns the created DOM elements for the control type to populate
 */
export function createControlScaffolding(
    params: ControlParams,
    container: HTMLElement
): {
    controlDiv: HTMLElement;
    keyDiv: HTMLElement;
    valueDiv: HTMLElement;
    valueDivInner: HTMLElement;
} {
    const isNullish = params.value === null || params.value === undefined;

    const controlDiv = container.appendChild(
        Object.assign(
            document.createElement('div'),
            {
                className: `hcc-control hcc-control-${params.type}${isNullish ? ' hcc-control-nullish' : ''}`
            }
        )
    );

    const keyDiv = controlDiv.appendChild(
        Object.assign(
            document.createElement('div'),
            { className: 'hcc-key' }
        )
    );

    const valueDiv = controlDiv.appendChild(
        Object.assign(
            document.createElement('div'),
            { className: 'hcc-value' }
        )
    );

    const valueDivInner = valueDiv.appendChild(
        Object.assign(
            document.createElement('div'),
            { className: 'hcc-value-inner' }
        )
    );

    return { controlDiv, keyDiv, valueDiv, valueDivInner };
}
