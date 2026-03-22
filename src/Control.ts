/**
 * Base Control Class
 *
 * Provides a standalone control that can be used independently or as part
 * of the Controls collection. Extends EventTarget for native event handling.
 */

import type { ControlParams } from './ControlTypes/types.js';

export interface ControlElements {
    controlDiv?: HTMLElement;
    keyDiv?: HTMLElement;
    valueDiv?: HTMLElement;
    valueDivInner?: HTMLElement;
}

export abstract class Control<T extends ControlParams = ControlParams> extends EventTarget {
    protected _value: any;
    protected elements: ControlElements = {};

    constructor(
        public params: T,
        protected container?: HTMLElement
    ) {
        super();
        this._value = params.value;

        if (container) {
            this.render(container);
        }
    }

    /**
     * Get the current value of the control
     */
    get value(): any {
        return this._value;
    }

    /**
     * Set the value of the control programmatically
     */
    set value(newValue: any) {
        if (this._value !== newValue) {
            const oldValue = this._value;
            this._value = newValue;
            this.updateUI();
            this.emit('change', { value: newValue, oldValue, path: this.params.path });
        }
    }

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
    protected emit(eventName: string, detail: any): void {
        this.dispatchEvent(new CustomEvent(eventName, {
            detail,
            bubbles: true,
            cancelable: true
        }));
    }

    /**
     * Destroy the control and clean up
     */
    destroy(): void {
        this.elements.controlDiv?.remove();
        // Subclasses can override to add more cleanup
    }

    /**
     * Get the control's DOM element
     */
    getElement(): HTMLElement | undefined {
        return this.elements.controlDiv;
    }
}
