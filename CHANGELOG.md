# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic
Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- **Heavy updating of array items** - Fixed #14, updating properties of one
series caused others to run expensive update cycles too

## [0.7.0] - 2026-02-11

### Added
- **Separator** - Added separator control to visually separate groups of related controls
  - JavaScript API: Use `{ type: 'separator' }` in controls array
  - Web Components: Use `<highcharts-separator>` element
  - Can be used both at the top level and within groups
  - Renders as a horizontal rule with appropriate styling
- **Display option** - Added `display` option/attribute with values `'block'` or `'inline-block'` (default: `'inline-block'`)
  - JavaScript API: Use `display` property in ControlsOptionsObject
  - Web Components: Use `display` attribute on `<highcharts-controls>` element
  - Controls now default to `inline-block` layout, shrinking to fit content
  - Set to `block` for full-width layout

### Fixed
- **Jumping input width** - Issue #1, number controls jumped as text width
  changed
- **Setting array items** - Setting array items, like `colors[0]` caused the
  existing other items to get lost

## [0.6.0] - 2026-01-12

### Added
- Range input for color opacity

### Fixed
- **Number control animation** - Range sliders now animate chart updates when
  clicking to jump to a new value, but not while dragging
- **Padding and sizing for controls** - There was some clipping and bad sizing

## [0.5.0] - 2025-12-23

### Added
- **Label attribute** - Control items now support an optional `label` attribute/option to override the displayed label text
  - JavaScript API: Use `label` property in control configuration
  - Web Components: Use `label` attribute on `<highcharts-control>` elements
  - Falls back to displaying the `path` if `label` is not provided
- **Collapsible preview sections** - Large data structures in options preview are now collapsed by default
  - `data` arrays and `dataTable` objects show as `[N items]` or `{N keys}` when collapsed
  - Click the arrow icon to expand and view full content with proper indentation
  - Keeps preview compact and readable for charts with large datasets

## [0.4.0] - 2025-12-22

### Added
- **Options Preview** - Added expandable preview with syntax highlighting and JavaScript-like formatting
  - Property names displayed without quotes
  - String values use single quotes instead of double quotes
  - Syntax highlighting with color-coded keys, strings, numbers, booleans, and null values
  - HTML markup in values is properly escaped for safe display
  - Expandable icon allows preview to extend beyond narrow table width (max 600px)
  - Expand icon automatically hidden when preview has sufficient width (container queries)
- **Select control smart rendering** - Select controls now automatically render as dropdown when:
  - There are more than 3 options, OR
  - Total string length of all options exceeds 24 characters
  - Smaller option sets continue to use the button group interface
- **Better layout** - The Controls can now be laid out as a block to fit the
parent's width, or `inline-block` to shrink to its content (better for small,
single toggles)
- **Array notation support** - Paths can now use array notation like `series[0].colorByPoint` or `xAxis[1].title.text` to access nested arrays in chart options
- **Nullish state support** - Controls now visually indicate when values are `null` or `undefined`
  - Boolean controls: Unchecked toggle with diagonal striped pattern
  - Color controls: Em-dash (—) placeholder instead of gray fallback, striped pattern in color picker swatch
  - Number controls: Range slider displayed but numeric label is hidden
  - Select controls: No button is marked as active
  - Text controls: Empty input field
  - Nullish class (`hcc-control-nullish`) automatically removed when user interacts with the control
  - Each control type gets a specific class (`hcc-control-boolean`, `hcc-control-color`, etc.) for targeted styling

### Fixed
- Grid preview now updates correctly when controls are modified
- Control values were not always correctly deduced from target options

## [0.3.0] - 2025-12-19

### Added
- **Groups/sections with collapsible headers** - Organize controls into groups
  - JavaScript API: Use `GroupParams` objects with `group` and `controls` properties
  - Web Components: Use `<highcharts-group header="...">` wrapper element
  - Optional `description` property for group descriptions (JS API) or `<highcharts-group-description>` element (Web Components)
  - Optional `collapsed` state to start groups collapsed
  - Optional `collapsible` property to enable expand/collapse (default: false)
  - Visual hierarchy with left border and smooth animations
  - Mix grouped and ungrouped controls in the same container
- **Automatic control type deduction** - The `type` parameter is now optional
  - Boolean values automatically create boolean controls
  - Numeric values and strings with units (px, em, rem, %) create number controls
  - Presence of `options` array creates select controls
  - Color values or paths containing "color" create color controls
  - Other string values default to text controls
- Number control now supports length units (`px`, `em`, `rem`, `%`, etc.)
  - Units are automatically extracted from string values (e.g., `'1.5em'`, `'60px'`, `'80%'`)
  - Display shows numeric value with unit
  - Chart options receive the value with unit as a string
  - For `em` and `rem` units, `step` defaults to `0.1` for finer control

### Changed
- **BREAKING**: Renamed control type from `array-of-strings` to `select`
  - Update `type: 'array-of-strings'` to `type: 'select'` in JavaScript API
  - Update `type="array-of-strings"` to `type="select"` in Web Components
  - Interface name changed from `ArrayControlParams` to `SelectControlParams`
- **BREAKING**: Number control now uses `min` and `max` properties instead of `range` tuple
  - JavaScript API: Use `min: -100, max: 100` instead of `range: [-100, 100]`
  - Web Components: Use `min="-100" max="100"` attributes

## [0.2.0] - 2025-12-18

### Added
- Text control type for editing text values
- Web Components API (`<highcharts-controls>` and `<highcharts-control>`)
- `injectCSS` option to automatically inject CSS (defaults to `true`)
- Preview options button with expandable JSON view
- Comprehensive Playwright test suite for both JavaScript and Web Component APIs
- Pre-commit hooks with Husky to ensure tests pass before commits
- Support for `min`, `max`, and `step` attributes in Web Components

### Changed
- Preview button now shows toggle icon (› when closed, ‹ when open)
- Preview section with smooth animation

### Fixed
- Color control fallback for undefined values
- Improved value deduction from chart options

## [0.1.0] - 2025-12-18

### Added
- Initial release
- Boolean control with styled toggle switch
- Select control with button group
- Number control with range slider
- Color control with color picker and opacity control
- TypeScript support with full type definitions
- CSS styling with light/dark mode support
- Basic documentation and examples

[Unreleased]: https://github.com/highcharts/controls/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/highcharts/controls/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/highcharts/controls/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/highcharts/controls/releases/tag/v0.1.0
