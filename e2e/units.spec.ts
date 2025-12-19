import { test, expect } from '@playwright/test';

test.describe('Highcharts Controls - Unit Support', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/e2e/fixtures/units.html');
    await page.waitForSelector('.highcharts-controls', { timeout: 5000 });
  });

  test('renders number control with em unit', async ({ page }) => {
    const valueDisplay = page.locator('.hcc-range-value').first();

    // Should display value with unit
    await expect(valueDisplay).toHaveText('1.5em');
  });

  test('number control with em unit changes chart option', async ({ page }) => {
    const rangeInput = page.locator('input[type="range"]').first();
    const valueDisplay = page.locator('.hcc-range-value').first();

    // Change the slider
    await rangeInput.fill('2');

    // Display should show value with unit
    await expect(valueDisplay).toHaveText('2em');

    // Verify chart option changed with unit
    const fontSize = await page.evaluate(() => {
      const chart = (window as any).Highcharts.charts[0];
      return chart.userOptions.title.style.fontSize;
    });
    expect(fontSize).toBe('2em');
  });

  test('number control with px unit changes chart option', async ({ page }) => {
    const rangeInputs = page.locator('input[type="range"]');
    const valueDisplays = page.locator('.hcc-range-value');

    // Get the second control (marginTop with px)
    const marginInput = rangeInputs.nth(1);
    const marginDisplay = valueDisplays.nth(1);

    // Initial value should show with unit
    await expect(marginDisplay).toHaveText('60px');

    // Change the slider
    await marginInput.fill('100');

    // Display should show value with unit
    await expect(marginDisplay).toHaveText('100px');

    // Verify chart option changed with unit
    const marginTop = await page.evaluate(() => {
      const chart = (window as any).Highcharts.charts[0];
      return chart.userOptions.chart.marginTop;
    });
    expect(marginTop).toBe('100px');
  });

  test('number control with percentage unit changes chart option', async ({ page }) => {
    const rangeInputs = page.locator('input[type="range"]');
    const valueDisplays = page.locator('.hcc-range-value');

    // Get the third control (height with %)
    const heightInput = rangeInputs.nth(2);
    const heightDisplay = valueDisplays.nth(2);

    // Initial value should show with unit
    await expect(heightDisplay).toHaveText('80%');

    // Change the slider
    await heightInput.fill('90');

    // Display should show value with unit
    await expect(heightDisplay).toHaveText('90%');

    // Verify chart option changed with unit
    const height = await page.evaluate(() => {
      const chart = (window as any).Highcharts.charts[0];
      return chart.userOptions.chart.height;
    });
    expect(height).toBe('90%');
  });

  test('em unit uses 0.1 step by default', async ({ page }) => {
    const rangeInput = page.locator('input[type="range"]').first();

    // Check step attribute
    const step = await rangeInput.getAttribute('step');
    expect(step).toBe('0.1');
  });
});
