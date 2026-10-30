/**
 * Highcharts Controls
 *
 * Provides UI controls to manipulate chart options on the fly.
 *
 * Used by the sample generator to create interactive samples:
 * - node tools/sample-generator/index.ts
 */

/* eslint-disable @highcharts/highcharts/no-highcharts-object */
import './web-components.js';

const Product = (window as any).Highcharts || (window as any).Grid;

import {
    SeparatorControl,
    controlTypeRegistry,
    getNestedValue,
    isGroupParams,
    type ControlTarget,
    type ControlTypes,
    type ControlParams,
    type SeparatorParams,
    type SelectControlParams,
    type BooleanControlParams,
    type ColorControlParams,
    type NumberControlParams,
    type TextControlParams,
    type GroupParams,
    type GenericOptionsObject
} from './ControlTypes/index.js';

interface ControlsOptionsObject {
    target?: ControlTarget;
    injectCSS?: boolean;
    display?: 'block' | 'inline-block';
    showPreview?: boolean;
    controls: Array<
        GroupParams|
        SelectControlParams|
        BooleanControlParams|
        ColorControlParams|
        NumberControlParams|
        TextControlParams|
        SeparatorParams
    >;
}

class Controls {

    /**
     * Construct Highcharts Controls
     * @param container
     * @param options
     * @returns
     */
    public static controls = function (
        container: string|HTMLElement,
        options: ControlsOptionsObject
    ): Controls {
        return new Controls(container, options);
    };

    public container: HTMLElement;
    public target?: ControlTarget;

    constructor(renderTo: string|HTMLElement, options: ControlsOptionsObject) {
        renderTo = (
            typeof renderTo === 'string' &&
            document.getElementById(renderTo)
        ) ||
            (
                typeof renderTo === 'object' && renderTo
            ) ||
            document.body.appendChild(Object.assign(
                document.createElement('div')
            ));

        const displayClass = options.display === 'block'
            ? 'hcc-display-block'
            : 'hcc-display-inline-block';

        const outerContainer = (renderTo as HTMLElement).appendChild(
            Object.assign(
                document.createElement('div'),
                { className: `highcharts-controls ${displayClass}` }
            )
        );

        this.container = outerContainer.appendChild(
            Object.assign(
                document.createElement('div'),
                { className: 'hcc-container' }
            )
        );

        this.target = (
            options.target ||
            Product?.charts?.[0] ||
            Product?.grids?.[0]
        ) as ControlTarget | undefined;

        // Target is now optional - controls can work standalone

        // Inject CSS if requested
        if (options.injectCSS !== false) {
            this.injectCSS();
        }

        // Add the controls
        options.controls?.forEach((control): void => {
            if (isGroupParams(control)) {
                this.addGroup(control);
            } else {
                this.addControl(control);
            }
        });

        if (options.showPreview !== false) {
            this.addPreview();
        }

        // Keep the options preview updated
        if (options.showPreview !== false) {
            this.updateOptionsPreview();
        }
    }



    /**
     * Set a nested value on the target given a dot-separated path.
     * Supports array notation, e.g., 'series[0].name' or 'xAxis[0].title.text'
     */
    public setNestedValue(
        path: string,
        value: any,
        animation?: boolean
    ): void {
        // If no target, skip updating the chart
        if (!this.target) {
            return;
        }

        // Split path into segments, handling array notation
        // e.g., 'series[0].data[1]' becomes ['series', '0', 'data', '1']
        const keys = path.split(/\.|\[|\]/).filter(s => s !== '');
        const updateObj: any = {};
        let cur = updateObj;
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            if (i === keys.length - 1) {
                cur[k] = value;
            } else {
                // Check if next key is a number (array index)
                const nextKey = keys[i + 1];
                const isNextArray = !isNaN(Number(nextKey));
                if (isNextArray) {
                    // Make sure to retain existing array items, for example
                    // when setting `palette.light.colors[0]`, we want to retain
                    // the other colors in the array.
                    const existingArray = getNestedValue(
                        this.target.options,
                        keys.slice(0, i + 1).join('.')
                    );
                    if (Array.isArray(existingArray)) {
                        // But only retain primitive values, as objects may have
                        // nested properties, so we don't want expensive updates
                        // on those (#14)
                        cur[k] = existingArray.slice().map(item =>
                            typeof item === 'object' && item !== null ?
                                void 0 : item
                        );
                    } else {
                        cur[k] = [];
                    }
                } else {
                    cur[k] = {};
                }
                cur = cur[k];
            }
        }
        this.target.update(updateObj, true, false, animation);
        this.updateOptionsPreview();
    }

    private injectCSS(): void {
        // Check if CSS is already injected
        if (document.getElementById('highcharts-controls-css')) {
            return;
        }

        // Add minimal inline styles to prevent FOUC
        const inlineStyle = document.createElement('style');
        inlineStyle.id = 'highcharts-controls-inline';
        inlineStyle.nonce = 'highcharts';
        inlineStyle.textContent = `
            highcharts-group-description {
                display: none;
            }

            .highcharts-controls {
                opacity: 0;
                transition: opacity 0.1s;

                .hcc-control {
                    max-height: 3em;
                }

                .hidden {
                    max-height: 0;
                }
            }

            .highcharts-controls.loaded {
                opacity: 1;

                .hcc-control {
                    max-height: none;
                }
            }

        `;
        document.head.appendChild(inlineStyle);

        // Get the CSS URL from the module URL
        const cssUrl = import.meta.url
            .replace(
                /\/js\/[^/]+$/,
                '/css/controls.css'
            )
            // Match jsDelivr/npm CDN. Patterns:
            // - https://cdn.jsdelivr.net/npm/@highcharts/controls@0.3.0
            // - https://cdn.jsdelivr.net/npm/@highcharts/controls
            .replace(
                /(https?:\/\/cdn\.jsdelivr\.net\/npm\/@highcharts\/controls)(@[\d.]+)?$/,
                '$1$2/css/controls.css'
            )

        const link = document.createElement('link');
        link.id = 'highcharts-controls-css';
        link.rel = 'stylesheet';
        link.href = cssUrl;

        // Show controls when CSS is loaded or failed
        const showControls = () => {
            document.querySelectorAll('.highcharts-controls').forEach(
                (el) => el.classList.add('loaded')
            );
        };
        link.onload = showControls;
        link.onerror = showControls;

        document.head.appendChild(link);
    }

    private addPreview(): void {

        const div = this.container.appendChild(
            Object.assign(
                document.createElement('div'),
                {
                    className: 'hcc-control hcc-button-control'
                }
            )
        );
        div.appendChild(
            Object.assign(
                document.createElement('div'),
                { className: 'hcc-key' }
            )
        );
        const valueDiv = div.appendChild(
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

        // Add the button
        const button = valueDivInner.appendChild(
            Object.assign(
                document.createElement('button'),
                {
                    className: 'hcc-button hcc-show-preview-button',
                    innerText: '{…}',
                    title: 'Show / hide options preview'
                }
            )
        );

        button.addEventListener('click', (): void => {
            const previewSection = this.container.querySelector(
                '.hcc-preview-section'
            ) as HTMLElement;
            if (previewSection) {
                previewSection.classList.toggle('hidden');
                button.classList.toggle('active');
            }
        });

        // Add the preview element
        const previewSection = document.createElement('div');
        previewSection.className = 'hcc-preview-section hidden';
        previewSection.innerHTML =
            '<div class="hcc-preview-wrapper">' +
            '<div class="hcc-preview-content">' +
            '<h3>Current Options<span class="hcc-expand-icon" title="Expand preview">⇲</span></h3>' +
            '<pre class="hcc-options-preview"></pre>' +
            '</div>' +
            '</div>';

        this.container.appendChild(previewSection);

        // Add expand functionality
        const expandIcon = previewSection.querySelector('.hcc-expand-icon') as HTMLElement;
        if (expandIcon) {
            expandIcon.addEventListener('click', (): void => {
                previewSection.classList.toggle('expanded');
                expandIcon.innerText = previewSection.classList.contains('expanded') ? '⇱' : '⇲';
                expandIcon.title = previewSection.classList.contains('expanded')
                    ? 'Collapse preview'
                    : 'Expand preview';
            });
        }
    }






    /**
     * Add a group of controls
     */
    private addGroup(params: GroupParams): void {
        if (!this.container) {
            throw new Error('Container for controls not found');
        }

        // Create group container
        const groupDiv = this.container.appendChild(
            Object.assign(
                document.createElement('div'),
                {
                    className: `hcc-group${params.className ? ' ' + params.className : ''}${params.collapsed ? ' hcc-group-collapsed' : ''}`
                }
            )
        );

        // Create group header
        const headerDiv = groupDiv.appendChild(
            Object.assign(
                document.createElement('div'),
                { className: 'hcc-group-header' }
            )
        );

        // Add collapse button if collapsible
        if (params.collapsible || params.collapsed) {
            const collapseButton = headerDiv.appendChild(
                Object.assign(
                    document.createElement('button'),
                    {
                        className: 'hcc-group-toggle',
                        innerHTML: '❯',
                        'aria-label': 'Toggle group'
                    }
                )
            );

            collapseButton.addEventListener('click', (): void => {
                groupDiv.classList.toggle('hcc-group-collapsed');
            });
        }

        // Add group title
        headerDiv.appendChild(
            Object.assign(
                document.createElement('h3'),
                {
                    className: 'hcc-group-title',
                    textContent: params.group
                }
            )
        );

        // Add description if provided
        if (params.description) {
            const descriptionEl = groupDiv.appendChild(
                Object.assign(
                    document.createElement('p'),
                    { className: 'hcc-group-description' }
                )
            );
            descriptionEl.innerHTML = params.description;
        }

        // Create controls container within group
        const groupControlsDiv = groupDiv.appendChild(
            Object.assign(
                document.createElement('div'),
                { className: 'hcc-group-controls' }
            )
        );

        // Temporarily swap container to add controls to group
        const originalContainer = this.container;
        this.container = groupControlsDiv;

        // Add controls to the group
        params.controls.forEach((control): void => {
            this.addControl(control);
        });

        // Restore original container
        this.container = originalContainer;
    }

    /**
     * Deduce control type based on the params
     */
    private deduceControlType(params: ControlParams): ControlTypes {
        const { value } = params;
        const path = params.path || '';

        if (typeof value === 'boolean') {
            return 'boolean';
        }
        if (
            typeof value === 'number' ||
            // Allow numeric strings with units limited to px, em, rem, %
            (
                typeof value === 'string' &&
                /^-?\d+\.?\d*\s*(px|em|rem|%)$/.test(value)
            )
        ) {
            return 'number';
        }
        if (Array.isArray((params as SelectControlParams).options)) {
            return 'select';
        }
        if (path.toLowerCase().indexOf('color') !== -1) {
            return 'color';
        }
        if (
            path.endsWith('.align') ||
            path.toLowerCase().endsWith('dashstyle') ||
            path.endsWith('.fontWeight') ||
            path.endsWith('.textAlign') ||
            path.endsWith('.verticalAlign')
        ) {
            return 'select';
        }
        if (typeof value === 'string') {
            if (Product.color(value).rgba.toString().indexOf('NaN') === -1) {
                return 'color';
            }
            return 'text';
        }
        // Default to text
        return 'text';
    }

    /**
     * Add a control
     */
    /**
     * Add a control
     */
    public addControl(params: ControlParams | SeparatorParams): void {

        if (!this.container) {
            throw new Error('Container for controls not found');
        }

        // Infer value and type if not provided. Value comes first as it may
        // influence type deduction.
        if (!SeparatorControl.is(params)) {
            // Only try to get nested value if target exists
            if (this.target?.options && params.path) {
                params.value ??= getNestedValue(this.target.options, params.path);
            }
            params.type ||= this.deduceControlType(params);
        }

        // Find and instantiate the appropriate control type
        for (const controlType of controlTypeRegistry) {
            if (controlType.is(params)) {
                controlType.create(this, params);
                break;
            }
        }
    }


    /**
     * Escape HTML entities in a string.
     */
    private escapeHTML(str: string): string {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Format JSON with syntax highlighting and JavaScript-like formatting.
     */
    private formatJSONWithHighlighting(obj: any): string {
        // First, create a normal JSON string
        const json = JSON.stringify(obj, null, 2);

        // Escape HTML in the entire JSON string first
        let formatted = this.escapeHTML(json);

        // Find and replace data arrays and dataTable objects with collapsed versions
        // Match "data": [ ... ] or "dataTable": { ... }
        formatted = formatted.replace(
            /^(\s*)&quot;(data|dataTable)&quot;:\s*(\[[\s\S]*?\n\s*\]|\{[\s\S]*?\n\s*\})/gm,
            (match, indent, key, value) => {
                // Unescape to parse
                const unescaped = value
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'")
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&amp;/g, '&');

                let parsed;
                try {
                    parsed = JSON.parse(unescaped);
                } catch (e) {
                    return match; // If parsing fails, keep original
                }

                const isArray = Array.isArray(parsed);
                const count = isArray ? parsed.length : Object.keys(parsed).length;
                const collapsedText = isArray ? `[${count} items]` : `{${count} keys}`;

                // Re-escape the value for storage
                const escapedValue = this.escapeHTML(JSON.stringify(parsed, null, 2))
                    .replace(/&quot;/g, '"') // Keep quotes for the data attribute
                    .replace(/&#39;/g, "'");

                return `${indent}&quot;${key}&quot;: <span class="hcc-collapsible" data-collapsed="true" data-value="${escapedValue.replace(/"/g, '&quot;')}" data-indent="${indent}"><span class="hcc-toggle-json">\u25B6</span> <span class="hcc-collapsed-text">${collapsedText}</span><span class="hcc-expanded-content hcc-hidden"></span></span>`;
            }
        );

        // Convert to JavaScript-like syntax: remove quotes from keys, use single quotes
        formatted = formatted
            // Remove quotes from property names (but not in data attributes)
            .replace(/&quot;([^&]+)&quot;:(?![^<]*>)/g, '$1:')
            // Convert double quotes to single quotes for string values (allowing escaped entities)
            .replace(/: &quot;((?:[^&]|&[a-z]+;)*?)&quot;/g, ": &#39;$1&#39;");

        // Apply syntax highlighting with HTML spans
        formatted = formatted
            // Highlight property names (skip already in span tags)
            .replace(/^(\s*)([a-zA-Z_$][a-zA-Z0-9_$]*):/gm, (match, indent, key) => {
                if (match.includes('<span')) return match;
                return `${indent}<span class="hcc-syntax-key">${key}</span>:`;
            })
            // Highlight string values (single quotes, allowing escaped entities)
            .replace(/: &#39;((?:[^&]|&[a-z]+;)*?)&#39;/g, ': <span class="hcc-syntax-string">&#39;$1&#39;</span>')
            // Highlight numbers
            .replace(/: (-?\d+\.?\d*)/g, ': <span class="hcc-syntax-number">$1</span>')
            // Highlight booleans
            .replace(/: (true|false)/g, ': <span class="hcc-syntax-boolean">$1</span>')
            // Highlight null
            .replace(/: (null)/g, ': <span class="hcc-syntax-null">$1</span>');

        return formatted;
    }

    /**
     * Update the options preview element with the current chart options.
     */
    private updateOptionsPreview(): void {
        const previewEl = this.container.parentElement
            ?.querySelector('.hcc-options-preview');
        if (previewEl && this.target) {
            const options = this.target.getOptions() || {};
            // Empty xAxis and yAxis structures
            Object.keys(options).forEach((key): void => {
                if (JSON.stringify((options as any)[key]) === '[{}]') {
                    delete (options as any)[key];
                }
            });
            previewEl.innerHTML = this.formatJSONWithHighlighting(options);

            // Add click handlers for collapsible elements
            previewEl.querySelectorAll('.hcc-collapsible').forEach((el) => {
                const toggle = el.querySelector('.hcc-toggle-json');
                if (toggle) {
                    toggle.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const collapsed = el.getAttribute('data-collapsed') === 'true';
                        const expandedContent = el.querySelector('.hcc-expanded-content') as HTMLElement;

                        if (!collapsed) {
                            // Collapse
                            el.setAttribute('data-collapsed', 'true');
                            toggle.textContent = '\u25B6';
                            (el.querySelector('.hcc-collapsed-text') as HTMLElement).classList.remove('hcc-hidden');
                            expandedContent.classList.add('hcc-hidden');
                            expandedContent.innerHTML = '';
                        } else {
                            // Expand
                            el.setAttribute('data-collapsed', 'false');
                            toggle.textContent = '\u25BC';
                            (el.querySelector('.hcc-collapsed-text') as HTMLElement).classList.add('hcc-hidden');

                            // Get the base indentation
                            const baseIndent = el.getAttribute('data-indent') || '';

                            // Format and display the expanded content
                            const rawValue = el.getAttribute('data-value') || '[]';
                            const unescaped = rawValue
                                .replace(/&quot;/g, '"')
                                .replace(/&#39;/g, "'")
                                .replace(/&lt;/g, '<')
                                .replace(/&gt;/g, '>')
                                .replace(/&amp;/g, '&');

                            let formatted = this.escapeHTML(unescaped);

                            // Add base indentation to each line
                            formatted = formatted
                                .split('\n')
                                .map((line, i) => i === 0 ? line : baseIndent + line)
                                .join('\n');

                            // Apply JS-like formatting and syntax highlighting
                            formatted = formatted
                                .replace(/&quot;([^&]+)&quot;:/g, '$1:')
                                .replace(/: &quot;((?:[^&]|&[a-z]+;)*?)&quot;/g, ": &#39;$1&#39;")
                                .replace(/^(\s*)([a-zA-Z_$][a-zA-Z0-9_$]*):/gm, '$1<span class="hcc-syntax-key">$2</span>:')
                                .replace(/: &#39;((?:[^&]|&[a-z]+;)*?)&#39;/g, ': <span class="hcc-syntax-string">&#39;$1&#39;</span>')
                                .replace(/: (-?\d+\.?\d*)/g, ': <span class="hcc-syntax-number">$1</span>')
                                .replace(/: (true|false)/g, ': <span class="hcc-syntax-boolean">$1</span>')
                                .replace(/: (null)/g, ': <span class="hcc-syntax-null">$1</span>');

                            expandedContent.innerHTML = formatted;
                            expandedContent.classList.remove('hcc-hidden');
                        }
                    });
                }
            });
        }
    }
}

(window as any).HighchartsControls = Controls;

// Export Control base class and class-based control types for standalone usage
export { Control } from './Control.js';
export { ColorControl } from './ControlTypes/Color.js';
export { BooleanControl } from './ControlTypes/Boolean.js';
export { NumberControl } from './ControlTypes/Number.js';
export { SelectControl } from './ControlTypes/Select.js';
export { TextControl } from './ControlTypes/Text.js';

// Export types
export type { ControlParams, ColorControlParams, BooleanControlParams, NumberControlParams, SelectControlParams, TextControlParams, SeparatorParams } from './ControlTypes/types.js';

export default Controls;
