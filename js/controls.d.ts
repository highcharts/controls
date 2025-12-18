/**
 * Highcharts Controls
 *
 * Provides UI controls to manipulate chart options on the fly.
 *
 * Used by the sample generator to create interactive samples:
 * - node tools/sample-generator/index.ts
 */
declare const Product: any;
interface GenericOptionsObject {
    [key: string]: any;
}
interface ControlTarget {
    options: GenericOptionsObject;
    getOptions(): GenericOptionsObject | void;
    update(options: GenericOptionsObject, redraw?: boolean, oneToOne?: boolean, animation?: boolean): void;
}
interface ControlParams {
    type: 'boolean' | 'color' | 'number' | 'array-of-strings';
    path: string;
    value?: any;
}
interface ArrayControlParams extends ControlParams {
    type: 'array-of-strings';
    options: string[];
    value?: string;
}
interface BooleanControlParams extends ControlParams {
    type: 'boolean';
    value?: boolean;
}
interface ColorControlParams extends ControlParams {
    type: 'color';
    value?: string;
}
interface NumberControlParams extends ControlParams {
    type: 'number';
    range?: [number, number];
    step?: number;
    value?: number;
}
interface ControlsOptionsObject {
    target?: ControlTarget;
    controls: Array<ArrayControlParams | BooleanControlParams | ColorControlParams | NumberControlParams>;
}
/**
 * Type guard for ArrayControlParams
 */
declare function isArrayControlParams(params: ControlParams): params is ArrayControlParams;
/**
 * Type guard for BooleanControlParams
 */
declare function isBooleanControlParams(params: ControlParams): params is BooleanControlParams;
/**
 * Type guard for ColorControlParams
 */
declare function isColorControlParams(params: ControlParams): params is ColorControlParams;
/**
 * Type guard for NumberControlParams
 */
declare function isNumberControlParams(params: ControlParams): params is NumberControlParams;
/**
 * Get a nested value from an object given a dot-separated path.
 */
declare function getNestedValue(obj: any, path: string): any;
/**
 * Set a nested value on the chart given a dot-separated path.
 */
declare function setNestedValue(chart: ControlTarget, path: string, value: any, animation?: boolean): void;
declare class Controls {
    /**
     * Construct Highcharts Controls
     * @param container
     * @param options
     * @returns
     */
    static controls: (container: string | HTMLElement, options: ControlsOptionsObject) => Controls;
    container: HTMLElement;
    target: ControlTarget;
    constructor(renderTo: string | HTMLElement, options: ControlsOptionsObject);
    private addPreview;
    /**
     * Add an array of strings control
     */
    private addArrayControl;
    /**
     * Add a boolean control
     */
    private addBooleanControl;
    /**
     * Add a color control
     */
    private addColorControl;
    /**
     * Add a number control
     */
    private addNumberControl;
    /**
     * Add a control
     */
    addControl(params: ControlParams): void;
    /**
     * Update the options preview element with the current chart options.
     */
    private updateOptionsPreview;
}
//# sourceMappingURL=controls.d.ts.map