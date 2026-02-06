# Highcharts Controls

GUI controls for manipulating Highcharts charts, Grid, and Dashboards options on
the fly.

## Example
* See [live demo with web component on jsFiddle](https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/legend/align)

## Installation

Load the [module file](https://github.com/highcharts/controls/blob/main/js/controls.js) from a CDN or your own server
```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@highcharts/controls@0.6.0"></script>
```

Or

```js
import Controls from 'https://cdn.jsdelivr.net/npm/@highcharts/controls@0.6.0';
```

## Usage

### Web Components

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://code.highcharts.com/highcharts.js"></script>
    <script type="module" src="https://cdn.jsdelivr.net/npm/@highcharts/controls@0.6.0"></script>
</head>
<body>
    <div id="container"></div>

    <script>
        Highcharts.chart('container', {
            title: { text: 'My Chart' },
            series: [{
                data: [1, 2, 3, 4, 5]
            }]
        });
    </script>

    <highcharts-controls target="#container">
        <highcharts-group header="Legend Settings">
            <highcharts-control
                type="boolean"
                path="legend.enabled"
                value="true">
            </highcharts-control>

            <highcharts-control
                type="select"
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
        </highcharts-group>
    </highcharts-controls>
</body>
</html>
```

### JavaScript/TypeScript API

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://code.highcharts.com/highcharts.js"></script>
    <script type="module" src="https://cdn.jsdelivr.net/npm/@highcharts/controls@0.6.0"></script>
</head>
<body>
    <div id="container"></div>
    <div id="controls-container"></div>

    <script type="module">

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
                    group: 'Legend Settings',
                    controls: [
                        {
                            // Type is optional - automatically deduced from value
                            path: 'legend.enabled',
                            value: true
                        },
                        {
                            path: 'legend.align',
                            options: ['left', 'center', 'right'],
                            value: 'center'
                        },
                        {
                            path: 'legend.x',
                            min: -100,
                            max: 100,
                            step: 10,
                            value: 0
                        },
                        {
                            path: 'legend.backgroundColor',
                            value: '#FFEEAA'
                        }
                    ]
                }
            ]
        });
    </script>
</body>
</html>
```

## Layout control
By default, the Highcharts Controls renders in an inline-block element, shrinking
to fit its content. This works well for compact controls. For wider layouts that
should take 100% of the parent's width, set the `display` option to `'block'`.

**Web Components:**
```html
<highcharts-controls display="block">
    <!-- controls here -->
</highcharts-controls>
```

**JavaScript API:**
```javascript
HighchartsControls.controls('controls-container', {
    display: 'block',  // or 'inline-block' (default)
    controls: [
        // ...
    ]
});
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
    display?: 'block' | 'inline-block';  // Display mode (defaults to 'inline-block')
    controls: Array<ControlParams | GroupParams>;  // Array of control or group configurations
}
```

#### GroupParams

Controls can be organized into collapsible groups with headers:

```typescript
interface GroupParams {
    group: string;              // Group header text
    description?: string;       // Optional description text
    controls: ControlParams[];  // Controls within the group
    collapsed?: boolean;        // Initial collapsed state (default: false)
    collapsible?: boolean;      // Allow expand/collapse (default: false)
    className?: string;         // Custom CSS class
}
```

**Example:**

```typescript
HighchartsControls.controls('controls-container', {
    controls: [
        {
            group: 'Legend Settings',
            description: 'Control the appearance and behavior of the chart legend.',
            collapsible: true,     // Enable expand/collapse
            collapsed: false,      // Start expanded
            controls: [
                { path: 'legend.enabled', value: true },
                { path: 'legend.align', options: ['left', 'center', 'right'] }
            ]
        },
        {
            group: 'Chart Settings',
            collapsible: true,     // Enable expand/collapse
            collapsed: true,       // Start collapsed
            controls: [
                { path: 'chart.backgroundColor', value: '#FFFFFF' }
            ]
        },
        // Ungrouped controls can be mixed with groups
        { path: 'title.text', value: 'My Chart' }
    ]
});
```

### Control Types

**Note:** The `type` parameter is optional. If omitted, the library will automatically deduce the control type based on the value and other parameters:
- Boolean values → `boolean` control
- Numeric values or strings with units (px, em, rem, %) → `number` control
- Presence of `options` array → `select` control
- Strings containing "color" in the path or valid color values → `color` control
- Other string values → `text` control (fallback)

#### Boolean Control

Toggle chart options on/off with a styled checkbox.

```typescript
{
    type: 'boolean',
    path: 'legend.enabled',  // Dot-separated path to option
    value: true              // Initial value (optional)
}
```

#### Select Control

Select from predefined options with button group.

```typescript
{
    type: 'select',
    path: 'legend.align',
    options: ['left', 'center', 'right'],  // Available options
    value: 'center'                         // Initial selection (optional)
}
```

#### Number Control

Adjust numeric values with a range slider. Supports length units like `px`, `em`, `rem`, and `%`.

```typescript
{
    type: 'number',
    path: 'legend.x',
    min: -100,   // Minimum value (optional)
    max: 100,    // Maximum value (optional)
    step: 10,    // Step increment (optional, defaults to 1)
    value: 0     // Initial value (optional, can be number or string with unit)
}
```

**Unit Support:**

The number control seamlessly handles length units commonly used in Highcharts:

```typescript
// With em units (step defaults to 0.1 for em/rem)
{
    type: 'number',
    path: 'title.style.fontSize',
    min: 0.5,
    max: 3,
    value: '1.5em'  // Unit extracted from string value
}

// With percentage units
{
    type: 'number',
    path: 'chart.height',
    min: 50,
    max: 100,
    value: '80%'
}
```

**Default min/max (when not specified):**
- Properties ending in `lineWidth` or `borderWidth`: min: 0, max: 5
- Properties ending in `x`, `y`, `offsetX`, `offsetY`, or `offset`: min: -100, max: 100
- Other properties: min: 0, max: 100

**Unit behavior:**
- Units are extracted from the `value` string (e.g., `'1.5em'`, `'60px'`, `'80%'`)
- The control displays the numeric value with the unit (e.g., "1.5em")
- Chart options receive the value with the unit as a string
- For `em` and `rem` units, `step` defaults to `0.1` if not specified

#### Color Control

Choose colors with a color picker and opacity control.

```typescript
{
    type: 'color',
    path: 'chart.backgroundColor',
    value: '#FFFFFF'  // Initial color (optional)
}
```

#### Text Control

Edit text values with a text input field.

```typescript
{
    type: 'text',
    path: 'title.text',
    value: 'My Chart Title'  // Initial text (optional)
}
```

#### Separator

Add a visual separator (horizontal rule) between controls to group related functionality.

**JavaScript API:**
```typescript
HighchartsControls.controls('controls-container', {
    controls: [
        { path: 'legend.enabled', value: true },
        { path: 'legend.align', options: ['left', 'center', 'right'] },
        { type: 'separator' },  // Add separator
        { path: 'chart.backgroundColor', value: '#FFFFFF' }
    ]
});
```

**Web Components:**
```html
<highcharts-controls>
    <highcharts-control path="legend.enabled" value="true"></highcharts-control>
    <highcharts-control path="legend.align" options="left,center,right"></highcharts-control>
    <highcharts-separator></highcharts-separator>
    <highcharts-control path="chart.backgroundColor" value="#FFFFFF"></highcharts-control>
</highcharts-controls>
```

**Within groups:**
```typescript
{
    group: 'Settings',
    controls: [
        { path: 'legend.enabled', value: true },
        { type: 'separator' },
        { path: 'chart.backgroundColor', value: '#FFFFFF' }
    ]
}
```

### Nullish State Handling

When a control's value is `null` or `undefined`, each control type displays a distinct visual state to clearly indicate that no value has been set:

#### Visual Indicators

- **Boolean controls**: Display as unchecked with a diagonal striped pattern on the toggle slider
- **Color controls**: Show an em-dash (—) placeholder instead of a color value, with a striped pattern in the color picker swatch
- **Number controls**: Display the range slider but hide the numeric label
- **Select controls**: No button is marked as active (or no option selected in dropdown)
- **Text controls**: Show an empty input field

**Note:** Select controls automatically render as a dropdown when there are more than 3 options or the total string length of all options exceeds 24 characters. Otherwise, they display as a button group.

#### Behavior

This typically happens if the `value` is not set, and the Controls are unable to
read the value from the target chart or grid. In some cases, chart or grid
defaults are null or undefined, indicating the behavior depends on other states.

```html
<highcharts-controls>
    <highcharts-control path="chart.inverted" type="boolean"></highcharts-control>
    <highcharts-control path="legend.backgroundColor" type="color"></highcharts-control>
</highcharts-control>
```

When a user interacts with a control in nullish state (types text, clicks toggle, changes color, moves slider, or selects option), the visual nullish indicators are automatically removed and the control behaves normally.

**CSS Classes:**
- All controls in nullish state receive the `hcc-control-nullish` class
- Each control type also receives a type-specific class (`hcc-control-boolean`, `hcc-control-color`, `hcc-control-number`, `hcc-control-select`, `hcc-control-text`) for targeted styling

### Web Component API

#### `<highcharts-controls>`

Container element for controls.

**Attributes:**
- `target` (optional) - CSS selector for target chart container (e.g., `"#container"`)
- `inject-css` (optional) - Set to `"false"` to disable automatic CSS injection
- `display` (optional) - Display mode: `"block"` or `"inline-block"` (default: `"inline-block"`)

**Example:**
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@highcharts/controls@0.6.0/css/controls.css" />
<highcharts-controls target="#my-chart" inject-css="false">
    <!-- controls here -->
</highcharts-controls>
```

#### `<highcharts-group>`

Group controls under a collapsible header. Must be a child of `<highcharts-controls>`.

**Attributes:**
- `header` (required) - Header text for the group
- `collapsed` (optional) - Set to `"true"` to start collapsed
- `collapsible` (optional) - Set to `"true"` to enable expand/collapse (default: false)
- `class` (optional) - Custom CSS class

**Child Elements:**
- `<highcharts-group-description>` (optional) - Description text displayed below the header. Supports HTML markup.
- `<highcharts-control>` - Individual controls within the group
- `<highcharts-separator>` - Visual separator between controls

**Note:** When using `<highcharts-group-description>` and `injectCSS` is set to `true` (default), it's recommended to add this to your page CSS to avoid a flash of unstyled content (FOUC):

```css
highcharts-group-description,
highcharts-separator {
    display: none;
}
```

**Example:**

```html
<highcharts-controls target="#container">
    <highcharts-group header="Legend Settings" collapsible="true">
        <highcharts-group-description>
            Control the appearance and behavior of the chart legend.
        </highcharts-group-description>
        <highcharts-control path="legend.enabled" value="true"></highcharts-control>
        <highcharts-control path="legend.align" options="left,center,right"></highcharts-control>
    </highcharts-group>

    <highcharts-group header="Chart Settings" collapsible="true" collapsed="true">
        <highcharts-control path="chart.backgroundColor" value="#FFFFFF"></highcharts-control>
    </highcharts-group>

    <!-- Ungrouped controls -->
    <highcharts-control path="title.text" value="My Chart"></highcharts-control>
</highcharts-controls>
```

#### `<highcharts-separator>`

Insert a horizontal separator line between controls. Must be a child of `<highcharts-controls>` or `<highcharts-group>`.

**Attributes:** None

**Example:**

```html
<highcharts-controls target="#container">
    <highcharts-control path="legend.enabled" value="true"></highcharts-control>
    <highcharts-control path="legend.align" options="left,center,right"></highcharts-control>

    <highcharts-separator></highcharts-separator>

    <highcharts-control path="chart.backgroundColor" value="#FFFFFF"></highcharts-control>
    <highcharts-control path="title.text" value="My Chart"></highcharts-control>
</highcharts-controls>
```

#### `<highcharts-control>`

Individual control element. Must be a child of `<highcharts-controls>`.

**Attributes:**
- `type` (required) - Control type: `"boolean"`, `"select"`, `"number"`, `"color"`, or `"text"`
- `path` (required) - Dot-separated path to chart option (e.g., `"legend.enabled"`)
- `value` (optional) - Initial value
- `options` (required for select) - Comma-separated list of options
- `min` (optional for number) - Minimum value for range slider
- `max` (optional for number) - Maximum value for range slider
- `step` (optional for number) - Step increment for range slider

**Examples:**

```html
<!-- Boolean -->
<highcharts-control
    type="boolean"
    path="legend.enabled"
    value="true">
</highcharts-control>

<!-- Select -->
<highcharts-control
    type="select"
    path="legend.align"
    options="left,center,right"
    value="center">
</highcharts-control>

<!-- Number -->
<highcharts-control
    type="number"
    path="legend.x"
    min="-100"
    max="100"
    step="10">
</highcharts-control>

<!-- Number with units -->
<highcharts-control
    type="number"
    path="title.style.fontSize"
    min="0.5"
    max="3"
    value="1.5em">
</highcharts-control>

<highcharts-control
    type="number"
    path="chart.marginTop"
    min="0"
    max="200"
    value="60px">
</highcharts-control>

<!-- Color -->
<highcharts-control
    type="color"
    path="chart.backgroundColor"
    value="#FFFFFF">
</highcharts-control>

<!-- Text -->
<highcharts-control
    type="text"
    path="title.text"
    value="My Chart Title">
</highcharts-control>
```

## Features

- **Live Preview** - See chart options update in real-time
- **Options Inspector** - View current chart configuration as JSON
- **Type Safety** - Full TypeScript support with type definitions
- **Auto-injection** - Optionally inject CSS automatically
- **Flexible Targeting** - Target specific charts or use defaults
- **Modern UI** - Clean, styled controls with smooth animations

## License

ISC

## Author

Torstein Hønsi
