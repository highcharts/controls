# ControlTypes Module

This folder contains the modular control type implementations for Highcharts Controls.

## Structure

Each control type is implemented in its own file with a consistent API:

### Individual Control Types

- **Boolean.ts** - Toggle switches for boolean values
- **Select.ts** - Dropdown or button group selects
- **Color.ts** - Color picker with opacity control
- **Number.ts** - Range sliders for numeric values (with unit support)
- **Text.ts** - Text input fields
- **Separator.ts** - Visual separators between controls

### Shared Modules

- **types.ts** - TypeScript type definitions and interfaces
- **utils.ts** - Utility functions (getNestedValue, isGroupParams, etc.)
- **index.ts** - Central export file for all control types

## API

Each control type exports two functions:

### `is(params)` - Type Guard
Type guard function to check if params match this control type.

```typescript
export function is(params: ControlParams): params is SpecificControlParams
```

### `add(params, keyDiv, valueDiv, controlDiv, setNestedValue)` - Renderer
Adds the control to the DOM.

```typescript
export function add(
    params: SpecificControlParams,
    keyDiv: HTMLElement,
    valueDiv: HTMLElement,
    controlDiv: HTMLElement,
    setNestedValue: (path: string, value: any, animation?: boolean) => void
): void
```

## Usage

```typescript
import { BooleanControl, SelectControl } from './ControlTypes/index.js';

// Check control type
if (BooleanControl.is(params)) {
    // Add boolean control
    BooleanControl.add(params, keyDiv, valueDiv, controlDiv, setNestedValue);
}
```

## Benefits

- **Modularity**: Each control type is self-contained
- **Maintainability**: Easy to update individual control types
- **Testability**: Can test each control type independently
- **Extensibility**: Simple to add new control types
- **Type Safety**: Strong TypeScript typing throughout
