/**
 * Shared type definitions for Highcharts Controls
 */

export interface GenericOptionsObject {
    [key: string]: any;
}

export interface ControlTarget {
    options: GenericOptionsObject;
    getOptions(): GenericOptionsObject|void;
    update(
        options: GenericOptionsObject,
        redraw?: boolean,
        oneToOne?: boolean,
        animation?: boolean
    ): void;
}

export type ControlTypes = 'boolean'|'color'|'number'|'select'|'text'|'separator';

export interface ControlParams {
    type?: ControlTypes;
    path: string;
    label?: string;
    value?: any;
    nullable?: boolean;
}

export interface SeparatorParams {
    type: 'separator';
}

export interface SelectControlParams extends ControlParams {
    type: 'select';
    options?: string[];
    value?: string;
}

export interface BooleanControlParams extends ControlParams {
    type: 'boolean';
    value?: boolean;
}

export interface ColorControlParams extends ControlParams {
    type: 'color';
    value?: string;
}

export interface NumberControlParams extends ControlParams {
    type: 'number';
    min?: number;
    max?: number;
    step?: number;
    value?: number|string;
}

export interface TextControlParams extends ControlParams {
    type: 'text';
    value?: string;
}

export interface GroupParams {
    group: string;
    description?: string;
    collapsed?: boolean;
    collapsible?: boolean;
    className?: string;
    controls: Array<ControlParams | SeparatorParams>;
}
