import type {
    BooleanControlParams,
    ColorControlParams,
    ControlParams,
    ControlTypes,
    GroupParams,
    NumberControlParams,
    SelectControlParams,
    SeparatorParams,
    TextControlParams
} from './ControlTypes/index.js';
import { BooleanControl } from './ControlTypes/Boolean.js';
import { ColorControl } from './ControlTypes/Color.js';
import { NumberControl } from './ControlTypes/Number.js';
import { SelectControl } from './ControlTypes/Select.js';
import { TextControl } from './ControlTypes/Text.js';
import { createControlScaffolding } from './ControlTypes/utils.js';
import type { Control } from './Control.js';

const Product = (window as any).Highcharts || (window as any).Grid;

const StandaloneControlMap: Record<string, new (params: any) => any> = {
    boolean: BooleanControl,
    color: ColorControl,
    number: NumberControl,
    select: SelectControl,
    text: TextControl
};

// Create a web component around the Controls class
// @example
// <highcharts-controls target="#container">
//     <highcharts-control
//         type="color"
//         path="chart.backgroundColor"
//         value="#ff0000"
//     ></highcharts-control>
//     <highcharts-control
//         type="boolean"
//         path="legend.enabled"
//         value="true"
//     ></highcharts-control>
//     <highcharts-control
//         type="select"
//         path="legend.align"
//         options="left,center,right"
//         value="right"
//     ></highcharts-control>
// </highcharts-controls>
class HighchartsControlElement extends HTMLElement {
    private control?: Control<ControlParams>;
    private _value?: any;
    private input?: HTMLInputElement;

    static get observedAttributes(): string[] {
        return ['value'];
    }

    connectedCallback(): void {
        if (this.closest('highcharts-controls')) {
            return;
        }

        if (this.control) {
            return;
        }

        const config = this.getConfig();

        if (config.type === 'text') {
            const { controlDiv, keyDiv, valueDivInner } = createControlScaffolding(
                config,
                this
            );

            const rid = `text-input-${(config.path || 'control')
                .replace(/[^a-z0-9_-]/gi, '-')
                .replace(/^-|-$/g, '') || 'control'}`;

            keyDiv.appendChild(Object.assign(
                document.createElement('label'),
                {
                    htmlFor: rid,
                    innerHTML: config.label || (config.path ? `<code>${config.path}</code>` : ''),
                    title: config.label || config.path
                }
            ));

            this.input = valueDivInner.appendChild(Object.assign(
                document.createElement('input'),
                {
                    type: 'text',
                    id: rid,
                    className: 'hcc-text-input',
                    value: config.value ?? '',
                    title: config.label || config.path
                }
            ));
            this._value = config.value ?? '';

            const handleValue = (): void => {
                const value = this.input?.value ?? '';
                this._value = value;
                this.dispatchEvent(new CustomEvent('input', {
                    detail: { value },
                    bubbles: true,
                    cancelable: true,
                    composed: true
                }));
                this.dispatchEvent(new CustomEvent('change', {
                    detail: { value },
                    bubbles: true,
                    cancelable: true,
                    composed: true
                }));
            };

            this.input.addEventListener('input', handleValue);
            this.input.addEventListener('change', handleValue);
            this.syncValueAttribute();
            return;
        }

        const ControlCtor = config.type && StandaloneControlMap[config.type];
        if (!ControlCtor) {
            return;
        }

        const control = new ControlCtor(config);
        this.control = control;
        control.render(this);

        control.addEventListener('change', (event: Event): void => {
            const detail = (event as CustomEvent).detail || {};
            this._value = detail.value;
            this.dispatchEvent(new CustomEvent('input', {
                detail,
                bubbles: true,
                cancelable: true,
                composed: true
            }));
            this.dispatchEvent(new CustomEvent('change', {
                detail,
                bubbles: true,
                cancelable: true,
                composed: true
            }));
        });

        this.syncValueAttribute();
    }

    attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
        if (name !== 'value' || newValue === null) {
            return;
        }

        const parsedValue = parseValue(newValue);
        if (this.control && this._value === parsedValue) {
            return;
        }

        this._value = parsedValue;

        if (this.control) {
            this.control.value = parsedValue;
            return;
        }

        if (this.input) {
            this.input.value = parsedValue ?? '';
        }
    }

    get value(): any {
        if (this.control) {
            return this.control.value;
        }
        if (this._value !== undefined) {
            return this._value;
        }
        return parseValue(this.getAttribute('value'));
    }

    set value(nextValue: any) {
        this._value = nextValue;

        if (this.control) {
            this.control.value = nextValue;
            return;
        }

        if (this.input) {
            this.input.value = nextValue === null || nextValue === undefined ? '' : String(nextValue);
        }

        if (nextValue === null || nextValue === undefined) {
            this.removeAttribute('value');
        } else {
            this.setAttribute('value', String(nextValue));
        }

        if (this.input || this._value !== undefined) {
            const value = nextValue === null || nextValue === undefined ? '' : String(nextValue);
            this.dispatchEvent(new CustomEvent('input', {
                detail: { value },
                bubbles: true,
                cancelable: true,
                composed: true
            }));
            this.dispatchEvent(new CustomEvent('change', {
                detail: { value },
                bubbles: true,
                cancelable: true,
                composed: true
            }));
        }
    }

    private syncValueAttribute(): void {
        const value = this.value;
        if (value === null || value === undefined) {
            this.removeAttribute('value');
        } else {
            this.setAttribute('value', String(value));
        }
    }

    getConfig(): ControlParams {
        const config: ControlParams = {};

        if (this.hasAttribute('path')) {
            config.path = this.getAttribute('path') || undefined;
        }

        if (this.hasAttribute('label')) {
            config.label = this.getAttribute('label') || undefined;
        }

        if (this.hasAttribute('type')) {
            config.type = this.getAttribute('type') as ControlTypes;
        }

        if (this.hasAttribute('value')) {
            config.value = parseValue(this.getAttribute('value'));
        }

        if (this.hasAttribute('options')) {
            (config as SelectControlParams).options = parseOptions(
                this.getAttribute('options')
            );
        }

        if (this.hasAttribute('min')) {
            (config as NumberControlParams).min = parseFloat(
                this.getAttribute('min') || '0'
            );
        }

        if (this.hasAttribute('max')) {
            (config as NumberControlParams).max = parseFloat(
                this.getAttribute('max') || '100'
            );
        }

        if (this.hasAttribute('step')) {
            (config as NumberControlParams).step = parseFloat(
                this.getAttribute('step') || '1'
            );
        }

        if (this.hasAttribute('nullable')) {
            config.nullable = true;
        }

        return config;
    }
}

class HighchartsGroupElement extends HTMLElement {
    getConfig(): GroupParams {
        const controls: (ControlParams | SeparatorParams)[] = [];
        let description: string | undefined;

        const descriptionEl = this.querySelector(
            ':scope > highcharts-group-description'
        );
        if (descriptionEl) {
            description = descriptionEl.innerHTML?.trim() || undefined;
        }

        this.querySelectorAll(
            ':scope > highcharts-control, :scope > highcharts-separator'
        ).forEach((controlEl): void => {
            if (controlEl.tagName.toLowerCase() === 'highcharts-separator') {
                controls.push({ type: 'separator' });
            } else if (controlEl.tagName.toLowerCase() === 'highcharts-control') {
                const control = (controlEl as HighchartsControlElement).getConfig();
                if (control.path) {
                    controls.push(control as ControlParams);
                }
            }
        });

        return {
            group: this.getAttribute('header') || 'Group',
            description,
            collapsed: this.hasAttribute('collapsed') &&
                this.getAttribute('collapsed') !== 'false',
            collapsible: this.hasAttribute('collapsible') &&
                this.getAttribute('collapsible') !== 'false',
            className: this.getAttribute('class') || undefined,
            controls
        };
    }
}

class HighchartsControlsElement extends HTMLElement {
    connectedCallback(): void {
        const controls: Array<ControlParams | GroupParams | SeparatorParams> = [],
            injectCSS = this.getAttribute('inject-css') !== 'false',
            displayAttr = this.getAttribute('display'),
            display = (displayAttr === 'block' || displayAttr === 'inline-block')
                ? displayAttr
                : 'inline-block',
            showPreview = this.getAttribute('show-preview') !== 'false';

        let target = this.getTarget();

        const Controls = (window as any).HighchartsControls;

        if (!Controls) {
            return;
        }

        const init = (target: any): void => {
            Controls.controls(this, {
                target,
                injectCSS,
                display: display as 'block' | 'inline-block',
                showPreview,
                controls: controls as Array<
                    GroupParams |
                    SelectControlParams |
                    BooleanControlParams |
                    ColorControlParams |
                    NumberControlParams |
                    TextControlParams |
                    SeparatorParams
                >
            });
        };

        Array.from(this.children).forEach((child): void => {
            if (child.tagName.toLowerCase() === 'highcharts-group') {
                const groupConfig = (child as HighchartsGroupElement).getConfig();
                controls.push(groupConfig);
            } else if (child.tagName.toLowerCase() === 'highcharts-separator') {
                controls.push({ type: 'separator' });
            } else if (child.tagName.toLowerCase() === 'highcharts-control') {
                const control = (child as HighchartsControlElement).getConfig();
                if (control.path) {
                    controls.push(control as ControlParams);
                }
            }
        });

        if (target) {
            init(target);
        } else {
            const observer = new MutationObserver((): void => {
                target = this.getTarget();
                if (target) {
                    observer.disconnect();
                    init(target);
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }

    private getTarget(): any {
        const targetAttr = this.getAttribute('target');
        if (targetAttr) {
            const el = document.querySelector(targetAttr) as any;
            const target = el?.chart || el?.grid;
            if (target) {
                return target;
            }
        }
        return Product?.charts?.[0] || Product?.grids?.[0];
    }
}

queueMicrotask((): void => {
    if (!(window as any).HighchartsControls) {
        return;
    }

    if (!customElements.get('highcharts-control')) {
        customElements.define('highcharts-control', HighchartsControlElement);
    }
    if (!customElements.get('highcharts-group')) {
        customElements.define('highcharts-group', HighchartsGroupElement);
    }
    if (!customElements.get('highcharts-group-description')) {
        customElements.define(
            'highcharts-group-description',
            class extends HTMLElement {}
        );
    }
    if (!customElements.get('highcharts-separator')) {
        customElements.define(
            'highcharts-separator',
            class extends HTMLElement {}
        );
    }
    if (!customElements.get('highcharts-controls')) {
        customElements.define('highcharts-controls', HighchartsControlsElement);
    }
});

function parseValue(value: string | null): any {
    if (value === 'true') {
        return true;
    }
    if (value === 'false') {
        return false;
    }
    if (!isNaN(Number(value))) {
        return Number(value);
    }
    return value;
}

function parseOptions(options: string | null): string[] {
    if (options) {
        return options.split(',').map((s): string => s.trim());
    }
    return [];
}
