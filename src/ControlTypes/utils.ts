/**
 * Utility functions for Highcharts Controls
 */

/**
 * Get a nested value from an object given a dot-separated path.
 * Supports array notation, e.g., 'series[0].name' or 'xAxis[0].title.text'
 */
export function getNestedValue(obj: any, path: string): any {
    path = path.replace(/^(xAxis|yAxis)\./, '$1[0].');
    // Split path into segments, handling array notation
    // e.g., 'series[0].data[1]' becomes ['series', '0', 'data', '1']
    const segments = path.split(/\.|\[|\]/).filter(s => s !== '');
    return segments.reduce((current, key): any => current?.[key], obj);
}

/**
 * Type guard for GroupParams
 */
export function isGroupParams(params: any): boolean {
    return 'group' in params && Array.isArray(params.controls);
}
