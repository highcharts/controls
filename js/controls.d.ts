/**
 * Highcharts Controls
 *
 * Provides UI controls to manipulate chart options on the fly.
 *
 * Used by the sample generator to create interactive samples:
 * - node tools/sample-generator/index.ts
 */
interface GenericOptionsObject {
    [key: string]: any;
}
interface ControlTarget {
    options: GenericOptionsObject;
    getOptions(): GenericOptionsObject | void;
    update(options: GenericOptionsObject, redraw?: boolean, oneToOne?: boolean, animation?: boolean): void;
}
type ControlTypes = 'boolean' | 'color' | 'number' | 'array-of-strings' | 'text';
interface ControlParams {
    type: ControlTypes;
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
interface TextControlParams extends ControlParams {
    type: 'text';
    value?: string;
}
interface ControlsOptionsObject {
    target?: ControlTarget;
    injectCSS?: boolean;
    controls: Array<ArrayControlParams | BooleanControlParams | ColorControlParams | NumberControlParams | TextControlParams>;
}
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
    private injectCSS;
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
     * Add a text control
     */
    private addTextControl;
    /**
     * Add a control
     */
    addControl(params: ControlParams): void;
    /**
     * Update the options preview element with the current chart options.
     */
    private updateOptionsPreview;
}
export default Controls;
//# sourceMappingURL=controls.d.ts.map