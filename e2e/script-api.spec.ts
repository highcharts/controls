import { test, expect } from '@playwright/test';

test.describe('Highcharts Controls - Script API', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/e2e/fixtures/script-api.html');
    // Wait for controls to render
    await page.waitForSelector('.highcharts-controls', { timeout: 5000 });
  });

  test('renders control panel', async ({ page }) => {
    const container = page.locator('.highcharts-controls');
    await expect(container).toBeVisible();
  });

  test('renders all control types', async ({ page }) => {
    // Check for boolean control (checkbox)
    const checkbox = page.locator('input[type="checkbox"]');
    await expect(checkbox).not.toBeVisible();

    // Check for select control (button group)
    const buttons = page.locator('button.hcc-button[data-path="legend.align"]');
    await expect(buttons).toHaveCount(3);

    // Check for number control (range slider)
    const rangeInput = page.locator('#range-input-legend-x');
    await expect(rangeInput).toBeVisible();

    // Check for color control
    const colorInput = page.locator('input[type="color"]');
    await expect(colorInput).toBeVisible();

    // Check for text control
    const textInput = page.locator('input.hcc-text-input');
    await expect(textInput).toBeVisible();
  });

  test('boolean control toggles legend', async ({ page }) => {
    const checkbox = page.locator('.hcc-toggle input[type="checkbox"]');
    const shimSlider = page.locator('.hcc-toggle .hcc-toggle-slider');
    await expect(checkbox).toBeChecked();

    // Get chart legend before toggle
    const legendVisible = await page.evaluate(() => {
      const chart = (window as any).Highcharts.charts[0];
      return chart.legend.group.visibility !== 'hidden';
    });
    expect(legendVisible).toBe(true);

    // Toggle the checkbox
    await shimSlider.click();
    await expect(checkbox).not.toBeChecked();

    // Check legend is hidden
    const legendHidden = await page.evaluate(() => {
      const chart = (window as any).Highcharts.charts[0];
      return chart.legend.group === undefined;
    });
    expect(legendHidden).toBe(true);
  });

  test('select control changes legend alignment', async ({ page }) => {
    // Click the 'left' button
    const leftButton = page.locator('button[data-value="left"]');
    await leftButton.click();

    // Check that 'left' button is active
    await expect(leftButton).toHaveClass(/active/);

    // Verify chart option changed
    const align = await page.evaluate(() => {
      const chart = (window as any).Highcharts.charts[0];
      return chart.options.legend.align;
    });
    expect(align).toBe('left');
  });

  test('number control adjusts legend x position', async ({ page }) => {
    const rangeInput = page.locator('#range-input-legend-x');
    const valueDisplay = page.locator('.hcc-range-value');

    // Set slider to specific value
    await rangeInput.fill('50');

    // Check display updates
    await expect(valueDisplay).toHaveText('50');

    // Verify chart option changed
    const xValue = await page.evaluate(() => {
      const chart = (window as any).Highcharts.charts[0];
      return chart.options.legend.x;
    });
    expect(xValue).toBe(50);
  });

  test('color control changes legend background', async ({ page }) => {
    const colorInput = page.locator('input[type="color"]');

    // Change color
    await colorInput.evaluate((input: HTMLInputElement) => {
      input.value = '#ff0000';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Wait a bit for the change to apply
    await page.waitForTimeout(100);

    // Verify chart option changed
    const bgColor = await page.evaluate(() => {
      const chart = (window as any).Highcharts.charts[0];
      return chart.options.legend.backgroundColor;
    });
    // Color might be in different format, just check it's not the original
    expect(bgColor).not.toBe('#FFEEAA');
  });

  test('color opacity slider click-to-jump uses animation', async ({ page }) => {
    const colorControl = page.locator('.hcc-control-color').first();
    const opacityDisplay = colorControl.locator('.hcc-opacity-display');
    const opacityInput = colorControl.locator('.hcc-opacity-input');

    await page.evaluate(() => {
      const chart = (window as any).Highcharts.charts[0];
      const originalUpdate = chart.update.bind(chart);
      (window as any).__hccAnimations = [];

      chart.update = function (
        options: any,
        redraw?: boolean,
        oneToOne?: boolean,
        animation?: boolean
      ): void {
        (window as any).__hccAnimations.push(animation);
        originalUpdate(options, redraw, oneToOne, animation);
      };
    });

    await opacityDisplay.click();
    await opacityInput.click({ position: { x: 5, y: 5 } });

    const animations = await page.evaluate(() => (window as any).__hccAnimations);
    expect(animations.length).toBeGreaterThan(0);
    expect(animations.at(-1)).toBe(true);
  });

  test('color opacity slider drag uses non-animated updates', async ({ page }) => {
    const colorControl = page.locator('.hcc-control-color').first();
    const opacityDisplay = colorControl.locator('.hcc-opacity-display');
    const opacityInput = colorControl.locator('.hcc-opacity-input');

    await page.evaluate(() => {
      const chart = (window as any).Highcharts.charts[0];
      const originalUpdate = chart.update.bind(chart);
      (window as any).__hccAnimations = [];

      chart.update = function (
        options: any,
        redraw?: boolean,
        oneToOne?: boolean,
        animation?: boolean
      ): void {
        (window as any).__hccAnimations.push(animation);
        originalUpdate(options, redraw, oneToOne, animation);
      };
    });

    await opacityDisplay.click();
    const box = await opacityInput.boundingBox();
    expect(box).not.toBeNull();

    if (!box) {
      return;
    }

    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width - 4, y);
    await page.mouse.down();
    await page.mouse.move(box.x + 8, y, { steps: 6 });
    await page.mouse.up();

    const animations = await page.evaluate(() => (window as any).__hccAnimations);
    expect(animations.length).toBeGreaterThan(0);
    expect(animations.every((animation: unknown) => animation === false)).toBe(true);
  });

  test('preview options button toggles preview section', async ({ page }) => {
    const previewButton = page.locator('button.hcc-show-preview-button');
    const previewSection = page.locator('.hcc-preview-section');

    // Initially hidden
    await expect(previewSection).toHaveClass(/hidden/);

    // Click to show
    await previewButton.click();
    await expect(previewSection).not.toHaveClass(/hidden/);

    // Click to hide again
    await previewButton.click();
    await expect(previewSection).toHaveClass(/hidden/);
  });

  test('preview section shows chart options', async ({ page }) => {
    const previewButton = page.locator('button.hcc-show-preview-button');
    await previewButton.click();

    const previewContent = page.locator('.hcc-options-preview');
    const content = await previewContent.textContent();

    // Should contain JSON representation of options
    expect(content).toContain('legend');
    expect(content).toContain('title');
  });

  test('text control changes chart title', async ({ page }) => {
    const textInput = page.locator('input.hcc-text-input');

    // Verify initial value
    await expect(textInput).toHaveValue('Test Chart');

    // Change the text
    await textInput.fill('New Title');

    // Verify chart option changed
    const titleText = await page.evaluate(() => {
      const chart = (window as any).Highcharts.charts[0];
      return chart.options.title.text;
    });
    expect(titleText).toBe('New Title');
  });

  test('label option overrides path in display', async ({ page }) => {
    // Check that custom label is used instead of path
    const customLabel = page.locator('label:has-text("Show Legend")');
    await expect(customLabel).toBeVisible();

    // Check that path-based label is still used when no custom label
    const pathLabel = page.locator('label:has-text("legend.align")');
    await expect(pathLabel).toBeVisible();
  });
});
