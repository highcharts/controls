import { test, expect } from '@playwright/test';

test.describe('Highcharts Controls - Standalone Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/e2e/fixtures/standalone-controls.html');
    await page.waitForFunction(() => {
      const w = window as any;
      return !!w.colorControl && !!w.booleanControl && !!w.numberControl && !!w.selectControl && !!w.programmaticControl;
    });
  });

  test('renders the standalone control instances with their default values', async ({ page }) => {
    await expect(page.locator('#color-control-container input[type="color"]')).toHaveValue('#3498db');
    await expect(page.locator('#boolean-control-container input[type="checkbox"]')).not.toBeChecked();
    await expect(page.locator('#number-control-container input[type="range"]')).toHaveValue('16');

    const selectButtons = page.locator('#select-control-container .hcc-button');
    await expect(selectButtons).toHaveCount(3);
    await expect(selectButtons.nth(1)).toHaveClass(/active/);
    await expect(selectButtons.nth(1)).toHaveText('center');

    await expect(page.locator('#color-output')).toHaveText('No color selected');
    await expect(page.locator('#boolean-output')).toHaveText('State: undefined');
    await expect(page.locator('#number-output')).toHaveText('Value: undefined');
    await expect(page.locator('#select-output')).toHaveText('Alignment: center');
  });

  test('updates output text and demo state when standalone controls change', async ({ page }) => {
    const colorInput = page.locator('#color-control-container input[type="color"]');
    await colorInput.evaluate((input: HTMLInputElement) => {
      input.value = '#ff0000';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await expect(page.locator('#color-output')).toHaveText('Color changed to: #ff0000');

    const booleanToggle = page.locator('#boolean-control-container .hcc-toggle-slider');
    await booleanToggle.click();
    await expect(page.locator('#boolean-control-container input[type="checkbox"]')).toBeChecked();
    await expect(page.locator('#boolean-output')).toHaveText('State: true');
    await expect(page.locator('#boolean-demo-box')).toHaveCSS('display', 'block');

    const numberInput = page.locator('#number-control-container input[type="range"]');
    await numberInput.evaluate((input: HTMLInputElement) => {
      input.value = '28';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await expect(page.locator('#number-output')).toHaveText('Value: 28px');

    const selectButtons = page.locator('#select-control-container .hcc-button');
    await selectButtons.nth(2).click();
    await expect(page.locator('#select-output')).toHaveText('Alignment: right');
    await expect(page.locator('#select-demo-box')).toHaveCSS('text-align', 'right');
  });

  test('supports multi-control rendering without a chart target and programmatic updates', async ({ page }) => {
    await expect(page.locator('#multi-controls-container .hcc-preview-section')).toHaveCount(0);

    const multiColor = page.locator('#multi-controls-container input[type="color"]');
    await multiColor.evaluate((input: HTMLInputElement) => {
      input.value = '#123456';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await expect(page.locator('#theme-bg')).toHaveText('#123456');

    const multiToggle = page.locator('#multi-controls-container .hcc-toggle-slider');
    await multiToggle.click();
    await expect(page.locator('#multi-controls-container input[type="checkbox"]')).toBeChecked();
    await expect(page.locator('#theme-dark')).toHaveText('true');

    const multiRange = page.locator('#range-input-theme-opacity');
    await multiRange.evaluate((input: HTMLInputElement) => {
      input.value = '70';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await expect(page.locator('#theme-opacity')).toHaveText('70%');

    await page.locator('#set-value-btn').click();
    await expect(page.locator('#programmatic-output')).toHaveText('Value: #e74c3c');
  });
});
