import { test, expect } from '@playwright/test';

test.describe('Highcharts Controls - Array Notation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/e2e/fixtures/array-notation.html');
    await page.waitForSelector('.highcharts-controls', { timeout: 5000 });
  });

  test('renders controls with array notation paths', async ({ page }) => {
    const controls = page.locator('.hcc-control');
    // Should have at least 6 controls (may have more if chart adds defaults)
    const count = await controls.count();
    expect(count).toBeGreaterThanOrEqual(6);
  });

  test('reads initial value from series[0].name', async ({ page }) => {
    // ID pattern: series[0].name -> series-0--name
    const seriesNameInput = page.locator('input[id$="-series-0--name"]');
    await expect(seriesNameInput).toHaveValue('Series 0');
  });

  test('reads initial value from series[0].colorByPoint', async ({ page }) => {
    // ID pattern: series[0].colorByPoint -> series-0--colorByPoint
    const colorByPointToggle = page.locator('input[id$="-series-0--colorByPoint"]');
    await expect(colorByPointToggle).not.toBeChecked();
  });

  test('reads initial value from series[1].colorByPoint', async ({ page }) => {
    // ID pattern: series[1].colorByPoint -> series-1--colorByPoint
    const colorByPointToggle = page.locator('input[id$="-series-1--colorByPoint"]');
    await expect(colorByPointToggle).toBeChecked();
  });

  test('updates chart when series[0].name is changed', async ({ page }) => {
    const seriesNameInput = page.locator('input[id$="-series-0--name"]');
    await seriesNameInput.fill('Updated Series Name');

    // Wait a bit for the update
    await page.waitForTimeout(100);

    // Check if chart was updated
    const legendItem = await page.evaluate(() => {
      const chart = (window as any).Highcharts.charts[0];
      return chart.series[0].name;
    });
    expect(legendItem).toBe('Updated Series Name');
  });

  test('updates chart when series[0].colorByPoint is toggled', async ({ page }) => {
    const toggleLabel = page.locator('label[class="hcc-toggle"]').first();
    await toggleLabel.click();

    // Wait a bit for the update
    await page.waitForTimeout(100);

    // Check if chart was updated
    const colorByPoint = await page.evaluate(() => {
      const chart = (window as any).Highcharts.charts[0];
      return chart.series[0].options.colorByPoint;
    });
    expect(colorByPoint).toBe(true);
  });

  test('reads initial value from xAxis[0].title.text', async ({ page }) => {
    // ID pattern: xAxis[0].title.text -> xAxis-0--title-text
    const xAxisTitleInput = page.locator('input[id$="-xAxis-0--title-text"]');
    await expect(xAxisTitleInput).toHaveValue('X Axis 0');
  });

  test('updates chart when xAxis[0].title.text is changed', async ({ page }) => {
    const xAxisTitleInput = page.locator('input[id$="-xAxis-0--title-text"]');
    await xAxisTitleInput.fill('New X Axis Title');

    // Wait a bit for the update
    await page.waitForTimeout(100);

    // Check if chart was updated
    const xAxisTitle = await page.evaluate(() => {
      const chart = (window as any).Highcharts.charts[0];
      return chart.xAxis[0].options.title.text;
    });
    expect(xAxisTitle).toBe('New X Axis Title');
  });
});
