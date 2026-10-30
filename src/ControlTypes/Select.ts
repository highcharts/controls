/**
 * Select Control Type
 */
import type { SelectControlParams, ControlParams } from './types.js';
import type { ControlsInstance } from './index.js';
import { createControlScaffolding } from './utils.js';
import { Control } from '../Control.js';

/**
 * SelectControl class - dropdown or button-group selector for string values
 */
export class SelectControl extends Control<SelectControlParams> {
    private select?: HTMLSelectElement;
    private buttons: HTMLButtonElement[] = [];

    /**
     * Type guard for SelectControlParams
     */
    static is(params: ControlParams): params is SelectControlParams {
        return params.type === 'select';
    }

    /**
     * Render the select control
     */
    render(container: HTMLElement): void {
        const { controlDiv, keyDiv, valueDivInner } = createControlScaffolding(
            this.params,
            container
        );

        const path = this.params.path || '';

        this.elements.controlDiv = controlDiv;
        this.elements.keyDiv = keyDiv;
        this.elements.valueDivInner = valueDivInner;

        keyDiv.appendChild(
            Object.assign(
                document.createElement('label'),
                {
                    innerHTML: this.params.label || `<code>${path}</code>`,
                    title: this.params.label || path
                }
            )
        );

        // Deduce options
        if (
            path.endsWith('.align') ||
            path.endsWith('.textAlign')
        ) {
            this.params.options ||= ['left', 'center', 'right'];
        }
        if (path.toLowerCase().endsWith('dashstyle')) {
            this.params.options ||= [
                'Solid', 'ShortDash', 'ShortDot', 'ShortDashDot',
                'ShortDashDotDot', 'Dot', 'Dash', 'LongDash',
                'DashDot', 'LongDashDot', 'LongDashDotDot'
            ];
        }
        if (path.endsWith('.fontWeight')) {
            this.params.options ||= ['normal', 'bold', 'lighter'];
        }
        if (path.endsWith('.verticalAlign')) {
            this.params.options ||= ['top', 'middle', 'bottom'];
        }

        const options = this.params.options || [];
        if (
            this._value !== null &&
            this._value !== undefined &&
            !options.includes(this._value)
        ) {
            options.unshift(String(this._value));
        }

        const totalLength = options.reduce((sum, opt) => sum + String(opt).length, 0);
        const useDropdown = options.length > 3 || totalLength > 24;

        if (useDropdown) {
            valueDivInner.classList.add('hcc-select-control');

            this.select = valueDivInner.appendChild(
                Object.assign(
                    document.createElement('select'),
                    {
                        className: 'hcc-select-dropdown'
                    }
                )
            );

            if (this.params.nullable) {
                const isNullSelected = this._value === null || this._value === undefined;
                this.select.appendChild(
                    Object.assign(
                        document.createElement('option'),
                        {
                            value: '__null__',
                            innerText: '—',
                            selected: isNullSelected
                        }
                    )
                );
                if (isNullSelected) {
                    controlDiv.classList.add('hcc-control-nullish');
                }
            }

            options.forEach((option): void => {
                const isSelected = this._value !== null &&
                    this._value !== undefined &&
                    this._value === option;
                this.select!.appendChild(
                    Object.assign(
                        document.createElement('option'),
                        {
                            value: String(option),
                            innerText: String(option),
                            selected: isSelected
                        }
                    )
                );
            });

            this.select.addEventListener('change', (): void => {
                const oldValue = this._value;
                const value = this.select!.value;
                this._value = value === '__null__' ? null : value;
                this.elements.controlDiv?.classList.toggle(
                    'hcc-control-nullish',
                    this._value === null || this._value === undefined
                );
                this.emit('change', {
                    value: this._value,
                    oldValue,
                    path: this.params.path
                });
            });
        } else {
            valueDivInner.classList.add('hcc-button-group');

            options.forEach((option): void => {
                const isActive = this._value !== null &&
                    this._value !== undefined &&
                    this._value === option;
                const button = valueDivInner.appendChild(
                    Object.assign(
                        document.createElement('button'),
                        {
                            className: 'hcc-button' + (isActive ? ' active' : ''),
                            innerText: String(option)
                        }
                    )
                );
                button.dataset.path = path;
                button.dataset.value = String(option);
                this.buttons.push(button);

                button.addEventListener('click', (): void => {
                    const oldValue = this._value;
                    const value = button.getAttribute('data-value');
                    this._value = value;
                    this.elements.controlDiv?.classList.remove('hcc-control-nullish');
                    this.emit('change', {
                        value: this._value,
                        oldValue,
                        path: this.params.path
                    });
                    this.updateUI();
                });
            });

            if (this.params.nullable) {
                const isNullActive = this._value === null || this._value === undefined;
                const nullButton = valueDivInner.appendChild(
                    Object.assign(
                        document.createElement('button'),
                        {
                            className: 'hcc-button' + (isNullActive ? ' active' : ''),
                            innerHTML: '⊘'
                        }
                    )
                );
                nullButton.dataset.path = path;
                nullButton.dataset.value = '__null__';
                this.buttons.push(nullButton);

                if (isNullActive) {
                    controlDiv.classList.add('hcc-control-nullish');
                }

                nullButton.addEventListener('click', (): void => {
                    const oldValue = this._value;
                    this._value = null;
                    this.elements.controlDiv?.classList.add('hcc-control-nullish');
                    this.emit('change', {
                        value: this._value,
                        oldValue,
                        path: this.params.path
                    });
                    this.updateUI();
                });
            }
        }

        this.updateUI();
    }

    /**
     * Update the UI to reflect the current value
     */
    protected updateUI(): void {
        if (this.select) {
            const value = this._value;
            const isNull = value === null || value === undefined;
            if (this.params.nullable && isNull) {
                this.select.value = '__null__';
                this.elements.controlDiv?.classList.add('hcc-control-nullish');
            } else {
                this.select.value = String(value ?? '');
                this.elements.controlDiv?.classList.remove('hcc-control-nullish');
            }
        }

        this.buttons.forEach((button): void => {
            const isActive = this._value !== null &&
                this._value !== undefined &&
                this._value === button.getAttribute('data-value');
            const isNullish = this._value === null || this._value === undefined;
            const isNullButton = button.getAttribute('data-value') === '__null__';
            button.classList.toggle('active', isNullButton ? isNullish : isActive);
        });
    }
}

