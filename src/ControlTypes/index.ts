/**
 * Index file for Control Types
 * Exports all control types and their type guards
 */
export * from './types.js';
export * from './utils.js';

import { BooleanControl } from './Boolean.js';
import { SelectControl } from './Select.js';
import { ColorControl } from './Color.js';
import { NumberControl } from './Number.js';
import { TextControl } from './Text.js';
import type { ControlParams, SeparatorParams } from './types.js';

// Forward declaration for Controls type
export interface ControlsInstance {
    container: HTMLElement;
    target?: any;  // Optional target - controls can work standalone
    setNestedValue(path: string, value: any, animation?: boolean): void;
}

export const SeparatorControl = {
    is(params: any): params is SeparatorParams {
        return params.type === 'separator';
    },
    create(controls: ControlsInstance): void {
        if (!controls.container) {
            throw new Error('Container for controls not found');
        }

        const row = controls.container.appendChild(
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
};

/**
 * Registry of all control types, in order of priority for type checking
 */
export const controlTypeRegistry: Array<any> = [
    SelectControl,
    BooleanControl,
    ColorControl,
    NumberControl,
    TextControl,
    SeparatorControl
];
