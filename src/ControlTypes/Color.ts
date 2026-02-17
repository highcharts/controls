/**
 * Color Control Type
 */
import type { ColorControlParams, ControlParams } from './types.js';
import type { ControlsInstance } from './index.js';
import { createControlScaffolding } from './scaffolding.js';

/* eslint-disable @highcharts/highcharts/no-highcharts-object */
const Product = (window as any).Highcharts || (window as any).Grid;

/**
 * Type guard for ColorControlParams
 */
export function is(params: ControlParams): params is ColorControlParams {
    return params.type === 'color';
}

/**
 * Create a color control with scaffolding
 */
export function create(
    controls: ControlsInstance,
    params: ColorControlParams
): void {
    const { controlDiv, keyDiv, valueDivInner } = createControlScaffolding(
        params,
        controls.container
    );
    add(params, keyDiv, valueDivInner, controlDiv, controls.setNestedValue.bind(controls));
}

/**
 * Add a color control
 */
export function add(
    params: ColorControlParams,
    keyDiv: HTMLElement,
    valueDiv: HTMLElement,
    controlDiv: HTMLElement,
    setNestedValue: (path: string, value: any, animation?: boolean) => void
): void {
    const rid = params.path.replace(/[^a-z0-9_-]/gi, '-');
    keyDiv.appendChild(
        Object.assign(
            document.createElement('label'),
            {
                htmlFor: `color-input-${rid}`,
                innerHTML: params.label || `<code>${params.path}</code>`,
                title: params.label || params.path
            }
        )
    );

    const colorInput = valueDiv.appendChild(
        Object.assign(
            document.createElement('input'),
            {
                type: 'color',
                id: `color-input-${rid}`
            }
        )
    );

    const valueEl = valueDiv.appendChild(
        Object.assign(
            document.createElement('label'),
            {
                id: `color-value-${rid}`,
                className: 'hcc-color-value',
                htmlFor: `color-input-${rid}`,
                title: params.label || params.path
            }
        )
    );

    const opacityDisplay = valueDiv.appendChild(
        Object.assign(
            document.createElement('span'),
            {
                id: `opacity-display-${rid}`,
                className: 'hcc-opacity-display',
                title: params.label || params.path
            }
        )
    );

    valueDiv.appendChild(
        Object.assign(
            document.createElement('span'),
            {
                textContent: '%',
                className: 'hcc-opacity-input-label'
            }
        )
    );

    // Container for the range slider popup
    const opacityRangeContainer = valueDiv.appendChild(
        Object.assign(
            document.createElement('div'),
            {
                className: 'hcc-opacity-range-container hcc-hidden'
            }
        )
    );

    const opacityInput = opacityRangeContainer.appendChild(
        Object.assign(
            document.createElement('input'),
            {
                type: 'range',
                id: `opacity-input-${rid}`,
                className: 'hcc-opacity-input',
                min: '0',
                max: '100',
                step: '1'
            }
        )
    );

    const getHex = (
        color: { rgba: number[] },
        includeAlpha?: boolean
    ): string => {
        const rgba = color.rgba;
        let hex = `#${(
            ((1 << 24) +
            (rgba[0] << 16) +
            (rgba[1] << 8) +
            rgba[2]
            )
                .toString(16)
                .slice(1)
        ).toLowerCase()}`;

        if (includeAlpha && rgba[3] !== undefined && rgba[3] !== 1) {
            const alpha = Math.round(rgba[3] * 255);
            hex += ((1 << 8) + alpha).toString(16).slice(1).toLowerCase();
        }

        return hex;
    };

    // Show/hide range slider on opacity display click
    opacityDisplay.addEventListener('click', (e): void => {
        e.stopPropagation();
        opacityRangeContainer.classList.remove('hcc-hidden');
        opacityInput.focus();
    });

    // Hide range slider on Enter key
    opacityInput.addEventListener('keydown', (e): void => {
        if (e.key === 'Enter') {
            opacityRangeContainer.classList.add('hcc-hidden');
        }
    });

    // Hide range slider when clicking outside
    const hideRangeOnClickOutside = (e: MouseEvent): void => {
        if (!opacityRangeContainer.contains(e.target as Node) &&
            !opacityDisplay.contains(e.target as Node)) {
            opacityRangeContainer.classList.add('hcc-hidden');
        }
    };
    document.addEventListener('click', hideRangeOnClickOutside);

    const isNullish = params.value === null || params.value === undefined;
    let hcColor = isNullish ? Product.color('#808080') : Product.color(params.value);

    if (!isNullish && hcColor.rgba.toString().indexOf('NaN') !== -1) {
        console.warn(
            `Highcharts Controls: Invalid color value for path "${params.path}": ${params.value}`
        );
        // Treat invalid color as nullish
        controlDiv.classList.add('hcc-control-nullish');
        valueEl.textContent = '—';
        colorInput.value = '#808080';
        opacityInput.value = '100';
        opacityDisplay.textContent = '100';
    } else if (isNullish) {
        valueEl.textContent = '—';
        colorInput.value = '#808080';
        opacityInput.value = '100';
        opacityDisplay.textContent = '100';
    } else {
        const hex = getHex(hcColor),
            opacity = (hcColor.rgba[3] || 1) * 100;
        colorInput.value = hex;
        valueEl.textContent = hex;
        opacityInput.value = String(Math.round(opacity));
        opacityDisplay.textContent = String(Math.round(opacity));
    }

    const update = (): void => {
        controlDiv.classList.remove('hcc-control-nullish');
        const rgba = colorInput.value; // E.g. #RRGGBB
        const opacity = parseFloat(opacityInput.value) / 100;
        // Use Highcharts.color to apply opacity and produce rgba()/hex
        const hcColor = Product.color(rgba)
            .setOpacity(opacity);
        setNestedValue(
            params.path,
            getHex(hcColor, true),
            false
        );
        valueEl.textContent = getHex(hcColor);
        opacityDisplay.textContent = opacityInput.value;
    };

    colorInput.addEventListener('input', update);
    opacityInput.addEventListener('input', update);
}
