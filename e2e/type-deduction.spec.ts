import { test, expect } from '@playwright/test';

test.describe('Highcharts Controls - Type Deduction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/e2e/fixtures/type-deduction.html');
    await page.waitForSelector('.highcharts-controls', { timeout: 5000 });
  });

  test('deduces boolean type from boolean value', async ({ page }) => {
    // Should render as toggle control
    const toggle = page.locator('.hcc-toggle input[type="checkbox"]').first();
    await expect(toggle).toBeChecked();
  });

  test('deduces number type from numeric value', async ({ page }) => {
    // Should render as range control
    const rangeInputs = page.locator('input[type="range"]');
    await expect(rangeInputs.nth(0)).toBeVisible();

    // Check initial value
    const value = await rangeInputs.nth(0).inputValue();
    expect(value).toBe('0');
  });

  test('deduces number type from numeric string with px unit', async ({ page }) => {
    const rangeInputs = page.locator('input[type="range"]');
    const valueDisplays = page.locator('.hcc-range-value');

    // Should render as range control with unit
    await expect(rangeInputs.nth(1)).toBeVisible();
    await expect(valueDisplays.nth(1)).toHaveText('60px');
  });

  test('deduces number type from numeric string with em unit', async ({ page }) => {
    const rangeInputs = page.locator('input[type="range"]');
    const valueDisplays = page.locator('.hcc-range-value');

    // Should render as range control with unit
    await expect(rangeInputs.nth(2)).toBeVisible();
    await expect(valueDisplays.nth(2)).toHaveText('1.5em');
  });

  test('deduces number type from numeric string with percentage unit', async ({ page }) => {
    const rangeInputs = page.locator('input[type="range"]');
    const valueDisplays = page.locator('.hcc-range-value');

    // Should render as range control with unit
    await expect(rangeInputs.nth(3)).toBeVisible();
    await expect(valueDisplays.nth(3)).toHaveText('80%');
  });

  test('deduces select type when options array is present', async ({ page }) => {
    // Should render as button group
    const buttons = page.locator('button.hcc-button[data-path="legend.align"]');
    await expect(buttons).toHaveCount(3);

    // Center should be active
    const centerButton = page.locator('button.hcc-button[data-value="center"]');
    await expect(centerButton).toHaveClass(/active/);
  });

  test('deduces color type from color string value with color in path', async ({ page }) => {
    // Should render as color control
    const colorInput = page.locator('input[type="color"]').first();
    await expect(colorInput).toBeVisible();

    // Check initial value
    const value = await colorInput.inputValue();
    expect(value.toLowerCase()).toBe('#ff0000');
  });

  test('deduces color type from valid color string value', async ({ page }) => {
    // Should render as color control (second color control)
    const colorInputs = page.locator('input[type="color"]');
    await expect(colorInputs.nth(1)).toBeVisible();

    const value = await colorInputs.nth(1).inputValue();
    expect(value.toLowerCase()).toBe('#00ff00');
  });

  test('deduces text type from string value without color indication', async ({ page }) => {
    // Should render as text input
    const textInput = page.locator('input.hcc-text-input').first();
    await expect(textInput).toBeVisible();
    await expect(textInput).toHaveValue('Test Chart');
  });

  test('deduces text type from string value that is not a valid color', async ({ page }) => {
    // Should render as text input (second text input)
    const textInputs = page.locator('input.hcc-text-input');
    await expect(textInputs.nth(1)).toBeVisible();
    await expect(textInputs.nth(1)).toHaveValue('Not a color');
  });

  test('defaults to text type when value is undefined', async ({ page }) => {
    // Should render as text input
    const textInputs = page.locator('input.hcc-text-input');

    // Should have at least the expected text inputs
    const count = await textInputs.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('deduced boolean control works correctly', async ({ page }) => {
    const toggle = page.locator('.hcc-toggle input[type="checkbox"]').first();
    const slider = page.locator('.hcc-toggle .hcc-toggle-slider').first();

    await expect(toggle).toBeChecked();

    // Toggle off
    await slider.click();
    await expect(toggle).not.toBeChecked();

    // Verify chart updated
    const legendEnabled = await page.evaluate(() => {
      const chart = (window as any).Highcharts.charts[0];
      return chart.options.legend.enabled;
    });
    expect(legendEnabled).toBe(false);
  });

  test('deduced number control with unit works correctly', async ({ page }) => {
    const rangeInputs = page.locator('input[type="range"]');
    const valueDisplays = page.locator('.hcc-range-value');

    // Change the px value
    await rangeInputs.nth(1).fill('100');
    await expect(valueDisplays.nth(1)).toHaveText('100px');

    // Verify chart updated
    const marginTop = await page.evaluate(() => {
      const chart = (window as any).Highcharts.charts[0];
      return chart.userOptions.chart.marginTop;
    });
    expect(marginTop).toBe('100px');
  });

  test('deduced select control works correctly', async ({ page }) => {
    const rightButton = page.locator('button.hcc-button[data-value="right"]');

    await rightButton.click();
    await expect(rightButton).toHaveClass(/active/);

    // Verify chart updated
    const align = await page.evaluate(() => {
      const chart = (window as any).Highcharts.charts[0];
      return chart.options.legend.align;
    });
    expect(align).toBe('right');
  });

  test('deduced color control works correctly', async ({ page }) => {
    const colorInput = page.locator('input[type="color"]').first();

    await colorInput.evaluate((input: HTMLInputElement) => {
      input.value = '#0000ff';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    await page.waitForTimeout(100);

    // Verify chart updated
    const bgColor = await page.evaluate(() => {
      const chart = (window as any).Highcharts.charts[0];
      return chart.options.chart.backgroundColor;
    });
    expect(bgColor).not.toBe('#FF0000');
  });

  test('deduced text control works correctly', async ({ page }) => {
    const textInput = page.locator('input.hcc-text-input').first();

    await textInput.fill('Updated Title');

    // Verify chart updated
    const titleText = await page.evaluate(() => {
      const chart = (window as any).Highcharts.charts[0];
      return chart.options.title.text;
    });
    expect(titleText).toBe('Updated Title');
  });
});
