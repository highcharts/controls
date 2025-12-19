import { test, expect } from '@playwright/test';

test.describe('Highcharts Controls - Web Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/e2e/fixtures/web-components.html');
    // Wait for controls to render
    await page.waitForSelector('.highcharts-controls', { timeout: 5000 });
  });

  test('renders highcharts-controls web component', async ({ page }) => {
    const webComponent = page.locator('highcharts-controls');
    await expect(webComponent).toBeVisible();
  });

  test('renders control panel from web components', async ({ page }) => {
    const container = page.locator('.highcharts-controls');
    await expect(container).toBeVisible();
  });

  test('parses and renders all control elements', async ({ page }) => {
    // Count highcharts-control elements
    const controls = page.locator('highcharts-control');
    await expect(controls).toHaveCount(5);

    // Verify they are rendered as actual controls
    const checkbox = page.locator('input[type="checkbox"]');
    await expect(checkbox).not.toBeVisible();

    const buttons = page.locator('button.hcc-button[data-path="legend.align"]');
    await expect(buttons).toHaveCount(3);

    const rangeInput = page.locator('input[type="range"]');
    await expect(rangeInput).toBeVisible();

    const colorInput = page.locator('input[type="color"]');
    await expect(colorInput).toBeVisible();

    const textInput = page.locator('input.hcc-text-input');
    await expect(textInput).toBeVisible();
  });

  test('boolean web component control works', async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]');
    const shimSlider = page.locator('.hcc-toggle .hcc-toggle-slider');
    await expect(checkbox).toBeChecked();

    // Toggle the checkbox
    await shimSlider.click();
    await expect(checkbox).not.toBeChecked();

    // Verify chart updated
    const legendHidden = await page.evaluate(() => {
      const chart = (window as any).Highcharts.charts[0];
      return chart.legend.group === undefined;
    });
    expect(legendHidden).toBe(true);
  });

  test('select web component control works', async ({ page }) => {
    const rightButton = page.locator('button[data-value="right"]');
    await rightButton.click();

    await expect(rightButton).toHaveClass(/active/);

    const align = await page.evaluate(() => {
      const chart = (window as any).Highcharts.charts[0];
      return chart.options.legend.align;
    });
    expect(align).toBe('right');
  });

  test('number web component control works', async ({ page }) => {
    const rangeInput = page.locator('input[type="range"]');

    // Set slider value
    await rangeInput.fill('-50');

    const xValue = await page.evaluate(() => {
      const chart = (window as any).Highcharts.charts[0];
      return chart.options.legend.x;
    });
    expect(xValue).toBe(-50);
  });

  test('color web component control parses initial value', async ({ page }) => {
    const colorInput = page.locator('input[type="color"]');
    const colorValue = page.locator('.hcc-color-value');

    // Check initial color is set (normalized to lowercase)
    const value = await colorInput.inputValue();
    expect(value.toLowerCase()).toBe('#ffeeaa');

    // Color display should show the hex value
    await expect(colorValue).toHaveText('#ffeeaa');
  });

  test('color web component control changes chart option', async ({ page }) => {
    const colorInput = page.locator('input[type="color"]');

    await colorInput.evaluate((input: HTMLInputElement) => {
      input.value = '#0000ff';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForTimeout(100);

    const bgColor = await page.evaluate(() => {
      const chart = (window as any).Highcharts.charts[0];
      return chart.options.legend.backgroundColor;
    });
    expect(bgColor).not.toBe('#FFEEAA');
  });

  test('web components parse comma-separated options', async ({ page }) => {
    // Should have created buttons for left, center, right
    const leftButton = page.locator('button[data-value="left"]');
    const centerButton = page.locator('button[data-value="center"]');
    const rightButton = page.locator('button[data-value="right"]');

    await expect(leftButton).toBeVisible();
    await expect(centerButton).toBeVisible();
    await expect(rightButton).toBeVisible();

    // Center should be initially active
    await expect(centerButton).toHaveClass(/active/);
  });

  test('web components parse boolean values correctly', async ({ page }) => {
    // The boolean control has value="true" which should be parsed as boolean
    const checkbox = page.locator('input[type="checkbox"]');
    await expect(checkbox).toBeChecked();

    // Verify it's actually a boolean in the chart
    const isBoolean = await page.evaluate(() => {
      const chart = (window as any).Highcharts.charts[0];
      return typeof chart.options.legend.enabled === 'boolean';
    });
    expect(isBoolean).toBe(true);
  });

  test('text web component control works', async ({ page }) => {
    const textInput = page.locator('input.hcc-text-input');

    // Verify initial value
    await expect(textInput).toHaveValue('Test Chart');

    // Change the text
    await textInput.fill('Updated Chart Title');

    // Verify chart option changed
    const titleText = await page.evaluate(() => {
      const chart = (window as any).Highcharts.charts[0];
      return chart.options.title.text;
    });
    expect(titleText).toBe('Updated Chart Title');
  });
});
