/**
 * Utility functions for Highcharts Controls
 */

import type { ControlParams, GroupParams } from "./types";

/**
 * Get a nested value from an object given a dot-separated path.
 * Supports array notation, e.g., 'series[0].name' or 'xAxis[0].title.text'
 */
export function getNestedValue(obj: any, path: string): any {
    path = path.replace(/^(xAxis|yAxis)\./, '$1[0].');
    // Split path into segments, handling array notation
    // e.g., 'series[0].data[1]' becomes ['series', '0', 'data', '1']
    const segments = path.split(/\.|\[|\]/).filter(s => s !== '');
    return segments.reduce((current, key): any => current?.[key], obj);
}

/**
 * Type guard for GroupParams
 */
export function isGroupParams(params: any): params is GroupParams {
    return 'group' in params && Array.isArray(params.controls);
}

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

/**
 * Create a nullable toggle button
 * Returns the button element that can be appended to a control
 */
export function createNullableButton(
    params: ControlParams,
    controlDiv: HTMLElement,
    onToggle: () => void
): HTMLButtonElement {
    const button = Object.assign(
        document.createElement('button'),
        {
            type: 'button',
            className: 'hcc-nullable-button',
            title: 'Set to null',
            innerHTML: '⊘',
            'aria-label': 'Set to null'
        }
    );

    button.addEventListener('click', (e): void => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
    });

    return button;
}
