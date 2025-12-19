# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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

## [0.2.0] - 2025-12-19

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

[Unreleased]: https://github.com/highcharts/controls/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/highcharts/controls/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/highcharts/controls/releases/tag/v0.1.0
