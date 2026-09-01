/**
 * Shared type definitions for Highcharts Controls
 */
interface GenericOptionsObject {
    [key: string]: any;
}
interface ControlTarget {
    options: GenericOptionsObject;
    getOptions(): GenericOptionsObject | void;
    update(options: GenericOptionsObject, redraw?: boolean, oneToOne?: boolean, animation?: boolean): void;
}
type ControlTypes = 'boolean' | 'color' | 'number' | 'select' | 'text' | 'separator';
interface ControlParams {
    type?: ControlTypes;
    path: string;
    label?: string;
    value?: any;
    nullable?: boolean;
}
interface SeparatorParams {
    type: 'separator';
}
interface SelectControlParams extends ControlParams {
    type: 'select';
    options?: string[];
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
    controls: Array<ControlParams | SeparatorParams>;
}

/**
 * Base Control Class
 *
 * Provides a standalone control that can be used independently or as part
 * of the Controls collection. Extends EventTarget for native event handling.
 */

interface ControlElements {
    controlDiv?: HTMLElement;
    keyDiv?: HTMLElement;
    valueDiv?: HTMLElement;
    valueDivInner?: HTMLElement;
}
declare abstract class Control<T extends ControlParams = ControlParams> extends EventTarget {
    params: T;
    protected container?: HTMLElement | undefined;
    protected _value: any;
    protected elements: ControlElements;
    constructor(params: T, container?: HTMLElement | undefined);
    /**
     * Get the current value of the control
     */
    get value(): any;
    /**
     * Set the value of the control programmatically
     */
    set value(newValue: any);
    /**
     * Render the control into a container
     */
    abstract render(container: HTMLElement): void;
    /**
     * Update the UI to reflect the current value
     */
    protected abstract updateUI(): void;
    /**
     * Emit a custom event
     */
    protected emit(eventName: string, detail: any): void;
    /**
     * Destroy the control and clean up
     */
    destroy(): void;
    /**
     * Get the control's DOM element
     */
    getElement(): HTMLElement | undefined;
}

/**
 * Color Control Type
 */

/**
 * ColorControl class - standalone color picker with opacity
 */
declare class ColorControl extends Control<ColorControlParams> {
    private colorInput?;
    private opacityInput?;
    private opacityDisplay?;
    private valueEl?;
    private opacityRangeContainer?;
    private hideRangeHandler?;
    private colorInputCount;
    private lastColorInputAt;
    private colorInputResetTimer?;
    private opacityIsDragging;
    private opacityMouseIsDown;
    private onOpacityMouseMove?;
    private onOpacityMouseUp?;
    /**
     * Type guard for ColorControlParams
     */
    static is(params: ControlParams): params is ColorControlParams;
    /**
     * Render the color control
     */
    render(container: HTMLElement): void;
    /**
     * Handle input changes from color picker or opacity slider
     */
    private handleColorInput;
    /**
     * Handle color picker commit
     */
    private handleColorChange;
    /**
     * Handle opacity slider input
     */
    private handleOpacityInput;
    /**
     * Handle opacity slider commit
     */
    private handleOpacityChange;
    /**
     * Reset color interaction tracking
     */
    private resetColorInputSession;
    /**
     * Update from current inputs and emit change
     */
    private applyInputsAndEmit;
    /**
     * Update UI to reflect current value
     */
    protected updateUI(): void;
    /**
     * Convert color to hex string
     */
    private getHex;
    /**
     * Update opacity slider gradient based on color
     */
    private updateOpacityGradient;
    /**
     * Clean up event listeners
     */
    destroy(): void;
}

/**
 * Boolean Control Type
 */

/**
 * BooleanControl class - toggle switch for boolean values
 */
declare class BooleanControl extends Control<BooleanControlParams> {
    private input?;
    private slider?;
    private currentState?;
    /**
     * Type guard for BooleanControlParams
     */
    static is(params: ControlParams): params is BooleanControlParams;
    /**
     * Render the boolean control
     */
    render(container: HTMLElement): void;
    /**
     * Handle click on nullable toggle
     */
    private handleNullableClick;
    /**
     * Handle change on standard toggle
     */
    private handleStandardChange;
    /**
     * Update UI to reflect current value
     */
    protected updateUI(): void;
}

/**
 * Number Control Type
 */

/**
 * NumberControl class - range slider for numeric values
 */
declare class NumberControl extends Control<NumberControlParams> {
    private input?;
    private valueEl?;
    private unit;
    private isDragging;
    private mouseIsDown;
    private decimals;
    private onMouseMove?;
    private onMouseUp?;
    /**
     * Type guard for NumberControlParams
     */
    static is(params: ControlParams): params is NumberControlParams;
    /**
     * Render the number control
     */
    render(container: HTMLElement): void;
    /**
     * Handle input changes
     */
    private handleInputChange;
    /**
     * Emit value change event
     */
    private emitValue;
    /**
     * Update UI to reflect current value
     */
    protected updateUI(): void;
    /**
     * Clean up event listeners
     */
    destroy(): void;
}

/**
 * Highcharts Controls
 *
 * Provides UI controls to manipulate chart options on the fly.
 *
 * Used by the sample generator to create interactive samples:
 * - node tools/sample-generator/index.ts
 */

interface ControlsOptionsObject {
    target?: ControlTarget;
    injectCSS?: boolean;
    display?: 'block' | 'inline-block';
    controls: Array<GroupParams | SelectControlParams | BooleanControlParams | ColorControlParams | NumberControlParams | TextControlParams | SeparatorParams>;
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
    target?: ControlTarget;
    constructor(renderTo: string | HTMLElement, options: ControlsOptionsObject);
    /**
     * Set a nested value on the target given a dot-separated path.
     * Supports array notation, e.g., 'series[0].name' or 'xAxis[0].title.text'
     */
    setNestedValue(path: string, value: any, animation?: boolean): void;
    private injectCSS;
    private addPreview;
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
    /**
     * Add a control
     */
    addControl(params: ControlParams | SeparatorParams): void;
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

export { BooleanControl, ColorControl, Control, NumberControl, Controls as default };
export type { BooleanControlParams, ColorControlParams, ControlParams, NumberControlParams, SelectControlParams, SeparatorParams, TextControlParams };
