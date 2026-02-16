/**
 * Separator Control Type
 */
import type { SeparatorParams } from './types.js';

/**
 * Type guard for SeparatorParams
 */
export function is(params: any): params is SeparatorParams {
    return params.type === 'separator';
}

/**
 * Add a separator
 */
export function add(container: HTMLElement): void {
    if (!container) {
        throw new Error('Container for controls not found');
    }

    const row = container.appendChild(
        Object.assign(
            document.createElement('div'),
            { className: 'hcc-separator-row' }
        )
    );

    const cell1 = row.appendChild(
        Object.assign(
            document.createElement('div'),
            { className: 'hcc-separator-cell' }
        )
    );

    // Add second cell to match the two-column layout
    row.appendChild(
        Object.assign(
            document.createElement('div'),
            { className: 'hcc-separator-cell' }
        )
    );

    cell1.appendChild(
        Object.assign(
            document.createElement('hr'),
            { className: 'hcc-separator' }
        )
    );
}
