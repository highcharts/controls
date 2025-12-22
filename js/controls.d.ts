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
type ControlTypes = 'boolean' | 'color' | 'number' | 'select' | 'text';
interface ControlParams {
    type?: ControlTypes;
    path: string;
    value?: any;
}
interface SelectControlParams extends ControlParams {
    type: 'select';
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
    min?: number;
    max?: number;
    step?: number;
    value?: number | string;
}
interface TextControlParams extends ControlParams {
    type: 'text';
    value?: string;
}
interface GroupParams {
    group: string;
    description?: string;
    collapsed?: boolean;
    collapsible?: boolean;
    className?: string;
    controls: ControlParams[];
}
interface ControlsOptionsObject {
    target?: ControlTarget;
    injectCSS?: boolean;
    controls: Array<GroupParams | SelectControlParams | BooleanControlParams | ColorControlParams | NumberControlParams | TextControlParams>;
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
    /**
     * Set a nested value on the target given a dot-separated path.
     * Supports array notation, e.g., 'series[0].name' or 'xAxis[0].title.text'
     */
    private setNestedValue;
    private injectCSS;
    private addPreview;
    /**
     * Add a select control
     */
    private addSelectControl;
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
     * Add a group of controls
     */
    private addGroup;
    /**
     * Deduce control type based on the params
     */
    private deduceControlType;
    /**
     * Add a control
     */
    addControl(params: ControlParams): void;
    /**
     * Escape HTML entities in a string.
     */
    private escapeHTML;
    /**
     * Format JSON with syntax highlighting and JavaScript-like formatting.
     */
    private formatJSONWithHighlighting;
    /**
     * Update the options preview element with the current chart options.
     */
    private updateOptionsPreview;
}
export default Controls;
//# sourceMappingURL=controls.d.ts.map