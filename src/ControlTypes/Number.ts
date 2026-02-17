/**
 * Number Control Type
 */
import type { NumberControlParams, ControlParams } from './types.js';
import { createControlScaffolding } from './scaffolding.js';

/**
 * Type guard for NumberControlParams
 */
export function is(params: ControlParams): params is NumberControlParams {
    return params.type === 'number';
}

/**
 * Create a number control with scaffolding
 */
export function create(
    params: NumberControlParams,
    container: HTMLElement,
    setNestedValue: (path: string, value: any, animation?: boolean) => void
): void {
    const { controlDiv, keyDiv, valueDivInner } = createControlScaffolding(
        params,
        container
    );
    add(params, keyDiv, valueDivInner, controlDiv, setNestedValue);
}

/**
 * Add a number control
 */
export function add(
    params: NumberControlParams,
    keyDiv: HTMLElement,
    valueDiv: HTMLElement,
    controlDiv: HTMLElement,
    setNestedValue: (path: string, value: any, animation?: boolean) => void
): void {
    const rid = params.path.replace(/[^a-z0-9_-]/gi, '-'),
        value = params.value;

    // Extract unit from current value if it's a string
    let unit = '';
    let numericValue: number|undefined;

    if (typeof value === 'string') {
        const match = value.match(/^([+-]?\d+\.?\d*)\s*(.*)$/);
        if (match) {
            numericValue = parseFloat(match[1]);
            unit = match[2] || unit;
        }
    } else {
        numericValue = value;
    }

    // Set default min/max if not provided
    if (params.min === void 0 || params.max === void 0) {
        if (/(lineWidth|borderWidth)$/i.test(params.path)) {
            params.min = params.min ?? 0;
            params.max = params.max ?? 5;

        } else if (/(borderRadius)$/i.test(params.path)) {
            params.min = params.min ?? 0;
            params.max = params.max ?? 10;

        } else if (/\.(x|y|offsetX|offsetY|offset)$/i.test(params.path)) {
            params.min = params.min ?? -100;
            params.max = params.max ?? 100;
        } else if (/rotation$/i.test(params.path)) {
            params.min = params.min ?? -90;
            params.max = params.max ?? 90;
        } else {
            params.min = params.min ?? 0;
            params.max = params.max ?? 100;
        }
    }

    if (typeof numericValue === 'number') {
        if (params.min > numericValue) {
            params.min = numericValue;
        }
        if (params.max < numericValue) {
            params.max = numericValue;
        }
    }

    // Set default step for em/rem units
    if (!params.step && (unit === 'em' || unit === 'rem')) {
        params.step = 0.1;
    }


    keyDiv.appendChild(
        Object.assign(
            document.createElement('label'),
            {
                htmlFor: `range-input-${rid}`,
                innerHTML: params.label || `<code>${params.path}</code>`,
                title: params.label || params.path
            }
        )
    );

    const isNullish = numericValue === null || numericValue === undefined;
    const valueEl = valueDiv.appendChild(
        Object.assign(
            document.createElement('span'),
            {
                id: `range-value-${rid}`,
                className: 'hcc-range-value',
                title: params.label || params.path
            }
        )
    );

    const strStep = String(params.step || 1);
    const input = valueDiv.appendChild(
        Object.assign(
            document.createElement('input'),
            {
                type: 'range',
                id: `range-input-${rid}`,
                min: String(params.min),
                max: String(params.max),
                step: strStep,
                title: params.label || params.path
            }
        )
    );

    if (isNullish) {
        // Set to middle of range for nullish state
        input.value = String((params.min + params.max) / 2);
        valueEl.textContent = '';
    } else {
        input.value = String(numericValue);
        valueEl.textContent = unit ? `${numericValue}${unit}` : String(numericValue);
    }

    // Track if user is actively dragging vs clicking to jump
    let isDragging = false;
    let mouseIsDown = false;

    input.addEventListener('mousedown', (): void => {
        mouseIsDown = true;
        isDragging = false;
    });

    // Detect actual dragging by tracking mouse movement
    const onMouseMove = (): void => {
        if (mouseIsDown) {
            isDragging = true;
        }
    };
    document.addEventListener('mousemove', onMouseMove);

    const onMouseUp = (): void => {
        mouseIsDown = false;
    };
    document.addEventListener('mouseup', onMouseUp);

    // Keep a fixed number of decimals to avoid jumping (#7)
    const decimals = strStep.indexOf('.') >= 0 ?
        strStep.split('.')[1].length : 0;
    const setNestedValueWrapper = (animation: boolean): void => {
        const numValue = parseFloat(input.value),
            sValue = numValue.toFixed(decimals),
            displayValue = unit ? `${sValue}${unit}` : sValue,
            chartValue = unit ? `${numValue}${unit}` : numValue;
        valueEl.textContent = displayValue;
        setNestedValue(params.path, chartValue, animation);
    };

    input.addEventListener('input', (): void => {
        controlDiv.classList.remove('hcc-control-nullish');
        if (isDragging) {
            setNestedValueWrapper(false);
        }
    });

    input.addEventListener('change', (): void => {
        // Only animate if user clicked to jump, not after dragging
        if (!isDragging) {
            setNestedValueWrapper(true);
        }
        isDragging = false;
    });
}
