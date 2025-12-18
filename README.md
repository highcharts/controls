# Highcharts Controls

GUI controls for manipulating Highcharts charts, Grid, and Dashboards options on the fly.

## Installation

```bash
npm install @highcharts/controls
```

## Usage

### JavaScript/TypeScript API

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://code.highcharts.com/highcharts.js"></script>
    <script type="module" src="node_modules/@highcharts/controls/js/controls.js"></script>
    <link rel="stylesheet" href="node_modules/@highcharts/controls/css/controls.css">
</head>
<body>
    <div id="container"></div>
    <div id="controls-container"></div>

    <script type="module">
        import HighchartsControls from '@highcharts/controls';

        // Create a chart
        Highcharts.chart('container', {
            title: { text: 'My Chart' },
            series: [{
                data: [1, 2, 3, 4, 5]
            }]
        });

        // Add controls
        HighchartsControls.controls('controls-container', {
            controls: [
                {
                    type: 'boolean',
                    path: 'legend.enabled',
                    value: true
                },
                {
                    type: 'array-of-strings',
                    path: 'legend.align',
                    options: ['left', 'center', 'right'],
                    value: 'center'
                },
                {
                    type: 'number',
                    path: 'legend.x',
                    range: [-100, 100],
                    step: 10
                },
                {
                    type: 'color',
                    path: 'legend.backgroundColor',
                    value: '#FFEEAA'
                }
            ]
        });
    </script>
</body>
</html>
```

### Web Components

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://code.highcharts.com/highcharts.js"></script>
    <script type="module" src="node_modules/@highcharts/controls/js/controls.js"></script>
    <link rel="stylesheet" href="node_modules/@highcharts/controls/css/controls.css">
</head>
<body>
    <div id="container"></div>

    <highcharts-controls target="#container">
        <highcharts-control
            type="boolean"
            path="legend.enabled"
            value="true">
        </highcharts-control>

        <highcharts-control
            type="array-of-strings"
            path="legend.align"
            options="left,center,right"
            value="center">
        </highcharts-control>

        <highcharts-control
            type="number"
            path="legend.x">
        </highcharts-control>

        <highcharts-control
            type="color"
            path="legend.backgroundColor"
            value="#FFEEAA">
        </highcharts-control>
    </highcharts-controls>

    <script type="module">
        Highcharts.chart('container', {
            title: { text: 'My Chart' },
            series: [{
                data: [1, 2, 3, 4, 5]
            }]
        });
    </script>
</body>
</html>
```

## API Documentation

### JavaScript/TypeScript API

#### `HighchartsControls.controls(container, options)`

Creates a controls instance.

**Parameters:**

- `container` (string | HTMLElement) - The container element or element ID where controls will be rendered
- `options` (ControlsOptionsObject) - Configuration options

**Returns:** Controls instance

#### ControlsOptionsObject

```typescript
interface ControlsOptionsObject {
    target?: ControlTarget;      // Target chart/grid (defaults to first chart)
    injectCSS?: boolean;          // Auto-inject CSS (defaults to true)
    controls: ControlParams[];    // Array of control configurations
}
```

### Control Types

#### Boolean Control

Toggle chart options on/off with a styled checkbox.

```typescript
{
    type: 'boolean',
    path: 'legend.enabled',  // Dot-separated path to option
    value: true              // Initial value (optional)
}
```

#### Array of Strings Control

Select from predefined options with button group.

```typescript
{
    type: 'array-of-strings',
    path: 'legend.align',
    options: ['left', 'center', 'right'],  // Available options
    value: 'center'                         // Initial selection (optional)
}
```

#### Number Control

Adjust numeric values with a range slider.

```typescript
{
    type: 'number',
    path: 'legend.x',
    range: [-100, 100],  // Min and max values (optional)
    step: 10,            // Step increment (optional, defaults to 1)
    value: 0             // Initial value (optional)
}
```

**Default ranges (when not specified):**
- Properties ending in `lineWidth` or `borderWidth`: [0, 5]
- Properties ending in `x`, `y`, `offsetX`, `offsetY`, or `offset`: [-100, 100]
- Other properties: [0, 100]

#### Color Control

Choose colors with a color picker and opacity control.

```typescript
{
    type: 'color',
    path: 'chart.backgroundColor',
    value: '#FFFFFF'  // Initial color (optional)
}
```

### Web Component API

#### `<highcharts-controls>`

Container element for controls.

**Attributes:**
- `target` (optional) - CSS selector for target chart container (e.g., `"#container"`)
- `inject-css` (optional) - Set to `"false"` to disable automatic CSS injection

**Example:**
```html
<highcharts-controls target="#my-chart" inject-css="false">
    <!-- controls here -->
</highcharts-controls>
```

#### `<highcharts-control>`

Individual control element. Must be a child of `<highcharts-controls>`.

**Attributes:**
- `type` (required) - Control type: `"boolean"`, `"array-of-strings"`, `"number"`, or `"color"`
- `path` (required) - Dot-separated path to chart option (e.g., `"legend.enabled"`)
- `value` (optional) - Initial value
- `options` (required for array-of-strings) - Comma-separated list of options
- `range` (optional for number) - Not yet supported via attribute
- `step` (optional for number) - Not yet supported via attribute

**Examples:**

```html
<!-- Boolean -->
<highcharts-control
    type="boolean"
    path="legend.enabled"
    value="true">
</highcharts-control>

<!-- Array of strings -->
<highcharts-control
    type="array-of-strings"
    path="legend.align"
    options="left,center,right"
    value="center">
</highcharts-control>

<!-- Number -->
<highcharts-control
    type="number"
    path="legend.x">
</highcharts-control>

<!-- Color -->
<highcharts-control
    type="color"
    path="chart.backgroundColor"
    value="#FFFFFF">
</highcharts-control>
```

## Features

- **Live Preview** - See chart options update in real-time
- **Options Inspector** - View current chart configuration as JSON
- **Type Safety** - Full TypeScript support with type definitions
- **Auto-injection** - Optionally inject CSS automatically
- **Flexible Targeting** - Target specific charts or use defaults
- **Modern UI** - Clean, styled controls with smooth animations

## CSS Customization

The controls use CSS custom properties for easy theming:

```css
.highcharts-controls {
    --hc-controls-bg: #ffffff;
    --hc-controls-border: #e0e0e0;
    --hc-controls-text: #333333;
    /* Add more custom properties as needed */
}
```

## Browser Support

Modern browsers with support for:
- ES2020 modules
- Web Components (Custom Elements)
- CSS Grid and Flexbox

## License

ISC

## Author

Torstein Honsi
