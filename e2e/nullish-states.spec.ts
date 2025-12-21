import { test, expect } from '@playwright/test';

test.describe('Highcharts Controls - Nullish States', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/e2e/fixtures/nullish-states.html');
    await page.waitForSelector('.highcharts-controls', { timeout: 5000 });
  });

  test('text control has nullish class', async ({ page }) => {
    const textControl = page.locator('.hcc-control-text').first();
    await expect(textControl).toHaveClass(/hcc-control-nullish/);
  });

  test('boolean control has nullish class', async ({ page }) => {
    const booleanControl = page.locator('.hcc-control-boolean').first();
    await expect(booleanControl).toHaveClass(/hcc-control-nullish/);
  });

  test('color control has nullish class', async ({ page }) => {
    const colorControl = page.locator('.hcc-control-color').first();
    await expect(colorControl).toHaveClass(/hcc-control-nullish/);
  });

  test('number control has nullish class', async ({ page }) => {
    const numberControl = page.locator('.hcc-control-number').first();
    await expect(numberControl).toHaveClass(/hcc-control-nullish/);
  });

  test('select control has nullish class', async ({ page }) => {
    const selectControl = page.locator('.hcc-control-select').first();
    await expect(selectControl).toHaveClass(/hcc-control-nullish/);
  });

  test('nullish class removed after text input', async ({ page }) => {
    const textControl = page.locator('.hcc-control-text').first();
    const textInput = page.locator('.hcc-text-input').first();

    await expect(textControl).toHaveClass(/hcc-control-nullish/);
    await textInput.fill('test');
    await expect(textControl).not.toHaveClass(/hcc-control-nullish/);
  });

  test('nullish class removed after checkbox toggle', async ({ page }) => {
    const booleanControl = page.locator('.hcc-control-boolean').first();
    const toggleLabel = page.locator('.hcc-toggle').first();

    await expect(booleanControl).toHaveClass(/hcc-control-nullish/);
    await toggleLabel.click();
    await expect(booleanControl).not.toHaveClass(/hcc-control-nullish/);
  });

  test('nullish class removed after color input change', async ({ page }) => {
    const colorControl = page.locator('.hcc-control-color').first();
    const colorInput = page.locator('input[type="color"]').first();

    await expect(colorControl).toHaveClass(/hcc-control-nullish/);
    await colorInput.evaluate((input: HTMLInputElement) => {
      input.value = '#ff0000';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(colorControl).not.toHaveClass(/hcc-control-nullish/);
  });

  test('nullish class removed after range slider change', async ({ page }) => {
    const numberControl = page.locator('.hcc-control-number').first();
    const rangeInput = page.locator('input[type="range"]').first();

    await expect(numberControl).toHaveClass(/hcc-control-nullish/);
    await rangeInput.fill('50');
    await expect(numberControl).not.toHaveClass(/hcc-control-nullish/);
  });

  test('nullish class removed after select button click', async ({ page }) => {
    const selectControl = page.locator('.hcc-control-select').first();
    const button = page.locator('.hcc-button').first();

    await expect(selectControl).toHaveClass(/hcc-control-nullish/);
    await button.click();
    await expect(selectControl).not.toHaveClass(/hcc-control-nullish/);
    await expect(button).toHaveClass(/active/);
  });
});
