/**
 * Highcharts Controls
 *
 * Provides UI controls to manipulate chart options on the fly.
 *
 * Used by the sample generator to create interactive samples:
 * - node tools/sample-generator/index.ts
 */
import { type ControlTarget, type ControlParams, type SeparatorParams, type SelectControlParams, type BooleanControlParams, type ColorControlParams, type NumberControlParams, type TextControlParams, type GroupParams } from './ControlTypes/index.js';
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
     * Add a group of controls
     */
    private addGroup;
    /**
     * Deduce control type based on the params
     */
    private deduceControlType;
    /**
     * Add a separator
     */
    addSeparator(): void;
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