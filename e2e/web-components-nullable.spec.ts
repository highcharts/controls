import { test, expect } from '@playwright/test';

test.describe('Highcharts Controls - Web Components Nullable', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/e2e/fixtures/web-components-nullable.html');
    await page.waitForSelector('.highcharts-controls', { timeout: 5000 });
  });

  test.describe('Text Control with nullable attribute', () => {
    test('has nullable button', async ({ page }) => {
      const textControl = page.locator('.hcc-control-text').first();
      const nullableButton = textControl.locator('.hcc-nullable-button');
      await expect(nullableButton).toBeVisible();
    });

    test('nullable button sets value to null', async ({ page }) => {
      const textControl = page.locator('.hcc-control-text').first();
      const textInput = textControl.locator('.hcc-text-input');
      const nullableButton = textControl.locator('.hcc-nullable-button');

      // Click nullable button
      await nullableButton.click();

      // Should clear input and add placeholder
      await expect(textInput).toHaveValue('');
      await expect(textInput).toHaveAttribute('placeholder', 'null');
      await expect(textControl).toHaveClass(/hcc-control-nullish/);

      // Verify chart option is null
      const titleText = await page.evaluate(() => {
        const chart = (window as any).Highcharts.charts[0];
        return chart.options.title.text;
      });
      expect(titleText).toBe(null);
    });
  });

  test.describe('Number Control with nullable attribute', () => {
    test('has nullable button', async ({ page }) => {
      const numberControl = page.locator('.hcc-control-number').first();
      const nullableButton = numberControl.locator('.hcc-nullable-button');
      await expect(nullableButton).toBeVisible();
    });

    test('nullable button sets value to null', async ({ page }) => {
      const numberControl = page.locator('.hcc-control-number').first();
      const valueDisplay = numberControl.locator('.hcc-range-value');
      const nullableButton = numberControl.locator('.hcc-nullable-button');

      // Click nullable button
      await nullableButton.click();

      // Should clear display
      await expect(valueDisplay).toHaveText('');
      await expect(numberControl).toHaveClass(/hcc-control-nullish/);

      // Verify chart option is null
      const maxValue = await page.evaluate(() => {
        const chart = (window as any).Highcharts.charts[0];
        return chart.options.yAxis[0].max;
      });
      expect(maxValue).toBe(null);
    });
  });

  test.describe('Color Control with nullable attribute', () => {
    test('has nullable button', async ({ page }) => {
      const colorControl = page.locator('.hcc-control-color').first();
      const nullableButton = colorControl.locator('.hcc-nullable-button');
      await expect(nullableButton).toBeVisible();
    });

    test('nullable button sets value to null', async ({ page }) => {
      const colorControl = page.locator('.hcc-control-color').first();
      const colorValue = colorControl.locator('.hcc-color-value');
      const nullableButton = colorControl.locator('.hcc-nullable-button');

      // Click nullable button
      await nullableButton.click();

      // Should show em dash
      await expect(colorValue).toHaveText('—');
      await expect(colorControl).toHaveClass(/hcc-control-nullish/);

      // Verify chart option is null
      const seriesColor = await page.evaluate(() => {
        const chart = (window as any).Highcharts.charts[0];
        return chart.options.series[0].color;
      });
      expect(seriesColor).toBe(null);
    });
  });

  test.describe('Boolean Control with nullable attribute', () => {
    test('has nullable tri-state toggle', async ({ page }) => {
      const booleanControl = page.locator('.hcc-control-boolean').first();
      const toggle = booleanControl.locator('.hcc-toggle');
      await expect(toggle).toBeVisible();
      await expect(toggle).toHaveClass(/hcc-toggle-nullable/);
    });

    test('cycles through three states', async ({ page }) => {
      const booleanControl = page.locator('.hcc-control-boolean').first();
      const slider = booleanControl.locator('.hcc-toggle-slider');

      // Initial state should be true
      await expect(slider).toHaveClass(/hcc-toggle-slider-true/);

      // Click to cycle to false
      await slider.click();
      await expect(slider).toHaveClass(/hcc-toggle-slider-false/);

      let visibleValue = await page.evaluate(() => {
        const chart = (window as any).Highcharts.charts[0];
        return chart.options.series[0].visible;
      });
      expect(visibleValue).toBe(false);

      // Click to cycle to null
      await slider.click();
      await expect(slider).toHaveClass(/hcc-toggle-slider-null/);
      await expect(booleanControl).toHaveClass(/hcc-control-nullish/);

      visibleValue = await page.evaluate(() => {
        const chart = (window as any).Highcharts.charts[0];
        return chart.options.series[0].visible;
      });
      expect(visibleValue).toBe(null);

      // Click to cycle to true
      await slider.click();
      await expect(slider).toHaveClass(/hcc-toggle-slider-true/);

      visibleValue = await page.evaluate(() => {
        const chart = (window as any).Highcharts.charts[0];
        return chart.options.series[0].visible;
      });
      expect(visibleValue).toBe(true);
    });
  });

  test.describe('Select Control - Button Group with nullable attribute', () => {
    test('has null button as rightmost button', async ({ page }) => {
      const selectControl = page.locator('.hcc-control-select').first();
      const buttons = selectControl.locator('.hcc-button');
      const buttonCount = await buttons.count();

      // Should have 4 buttons (left, center, right, null)
      expect(buttonCount).toBe(4);

      // Last button should be null button
      const lastButton = buttons.nth(buttonCount - 1);
      await expect(lastButton).toHaveText('⊘');
      await expect(lastButton).toHaveAttribute('data-value', '__null__');
    });

    test('clicking null button sets value to null', async ({ page }) => {
      const selectControl = page.locator('.hcc-control-select').first();
      const nullButton = selectControl.locator('button[data-value="__null__"]');

      // Click null button
      await nullButton.click();

      // Should add nullish class
      await expect(selectControl).toHaveClass(/hcc-control-nullish/);
      await expect(nullButton).toHaveClass(/active/);

      // Verify chart option is null
      const alignValue = await page.evaluate(() => {
        const chart = (window as any).Highcharts.charts[0];
        return chart.options.title.align;
      });
      expect(alignValue).toBe(null);
    });
  });

  test.describe('Select Control - Dropdown with nullable attribute', () => {
    test('has null option as first option', async ({ page }) => {
      const selectControl = page.locator('.hcc-control-select').nth(1);
      const dropdown = selectControl.locator('.hcc-select-dropdown');

      await expect(dropdown).toBeVisible();

      // Get first option
      const firstOption = dropdown.locator('option').first();
      const value = await firstOption.getAttribute('value');
      const text = await firstOption.textContent();

      expect(value).toBe('__null__');
      expect(text).toBe('—');
    });

    test('selecting null option sets value to null', async ({ page }) => {
      const selectControl = page.locator('.hcc-control-select').nth(1);
      const dropdown = selectControl.locator('.hcc-select-dropdown');

      // Select null option
      await dropdown.selectOption('__null__');

      // Should add nullish class
      await expect(selectControl).toHaveClass(/hcc-control-nullish/);

      // Verify chart option is null
      const dashStyleValue = await page.evaluate(() => {
        const chart = (window as any).Highcharts.charts[0];
        return chart.options.series[0].dashStyle;
      });
      expect(dashStyleValue).toBe(null);
    });
  });

  test.describe('Nullable attribute without value', () => {
    test('parses nullable attribute using hasAttribute', async ({ page }) => {
      // All controls should have nullable buttons/features
      const textControls = page.locator('.hcc-control-text');
      const textCount = await textControls.count();

      for (let i = 0; i < textCount; i++) {
        const nullableButton = textControls.nth(i).locator('.hcc-nullable-button');
        await expect(nullableButton).toBeVisible();
      }

      const numberControls = page.locator('.hcc-control-number');
      const numberCount = await numberControls.count();

      for (let i = 0; i < numberCount; i++) {
        const nullableButton = numberControls.nth(i).locator('.hcc-nullable-button');
        await expect(nullableButton).toBeVisible();
      }

      const colorControls = page.locator('.hcc-control-color');
      const colorCount = await colorControls.count();

      for (let i = 0; i < colorCount; i++) {
        const nullableButton = colorControls.nth(i).locator('.hcc-nullable-button');
        await expect(nullableButton).toBeVisible();
      }

      const booleanControls = page.locator('.hcc-control-boolean');
      const booleanCount = await booleanControls.count();

      for (let i = 0; i < booleanCount; i++) {
        const toggle = booleanControls.nth(i).locator('.hcc-toggle');
        await expect(toggle).toHaveClass(/hcc-toggle-nullable/);
      }

      const selectControls = page.locator('.hcc-control-select');
      const selectCount = await selectControls.count();

      for (let i = 0; i < selectCount; i++) {
        const control = selectControls.nth(i);
        // Should have either null button or null option
        const hasNullButton = await control.locator('button[data-value="__null__"]').count() > 0;
        const hasDropdown = await control.locator('.hcc-select-dropdown').count() > 0;

        if (hasNullButton) {
          await expect(control.locator('button[data-value="__null__"]')).toBeVisible();
        } else if (hasDropdown) {
          const firstOption = control.locator('.hcc-select-dropdown option').first();
          const value = await firstOption.getAttribute('value');
          expect(value).toBe('__null__');
        }
      }
    });
  });
});
