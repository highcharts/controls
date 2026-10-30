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

const Product = (window as any).Highcharts || (window as any).Grid;

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
    getConfig(): ControlParams {
        const config: ControlParams = {
            path: this.getAttribute('path') || ''
        };

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
                : 'inline-block';

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
