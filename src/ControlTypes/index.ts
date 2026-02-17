/**
 * Index file for Control Types
 * Exports all control types and their type guards
 */
export * as SeparatorControl from './Separator.js';
export * from './types.js';
export * from './utils.js';
export * from './scaffolding.js';

import * as BooleanControl from './Boolean.js';
import * as SelectControl from './Select.js';
import * as ColorControl from './Color.js';
import * as NumberControl from './Number.js';
import * as TextControl from './Text.js';
import type { ControlParams } from './types.js';

/**
 * Base interface for control type implementations
 */
interface ControlTypeImplementation<T extends ControlParams> {
    is(params: ControlParams): params is T;
    create(
        params: T,
        container: HTMLElement,
        setNestedValue: (path: string, value: any, animation?: boolean) => void
    ): void;
    add(
        params: T,
        keyDiv: HTMLElement,
        valueDivInner: HTMLElement,
        div: HTMLElement,
        setNestedValue: (path: string, value: any, animation?: boolean) => void
    ): void;
}

/**
 * Registry of all control types, in order of priority for type checking
 */
export const controlTypeRegistry: Array<ControlTypeImplementation<any>> = [
    SelectControl,
    BooleanControl,
    ColorControl,
    NumberControl,
    TextControl
];
