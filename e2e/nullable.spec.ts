import { test, expect } from '@playwright/test';

test.describe('Highcharts Controls - Nullable Option', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/e2e/fixtures/nullable.html');
    await page.waitForSelector('.highcharts-controls', { timeout: 5000 });
  });

  test.describe('Text Control', () => {
    test('has nullable button', async ({ page }) => {
      const textControl = page.locator('.hcc-control-text').first();
      const nullableButton = textControl.locator('.hcc-nullable-button');
      await expect(nullableButton).toBeVisible();
      await expect(nullableButton).toHaveAttribute('title', 'Set to null');
    });

    test('nullable button sets value to null', async ({ page }) => {
      const textControl = page.locator('.hcc-control-text').first();
      const textInput = textControl.locator('.hcc-text-input');
      const nullableButton = textControl.locator('.hcc-nullable-button');

      // Initial value should be 'Test Chart'
      await expect(textInput).toHaveValue('Test Chart');
      await expect(textControl).not.toHaveClass(/hcc-control-nullish/);

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

    test('user can type after clicking nullable button', async ({ page }) => {
      const textControl = page.locator('.hcc-control-text').first();
      const textInput = textControl.locator('.hcc-text-input');
      const nullableButton = textControl.locator('.hcc-nullable-button');

      // Click nullable button to set null
      await nullableButton.click();
      await expect(textControl).toHaveClass(/hcc-control-nullish/);

      // User types new value
      await textInput.fill('New Title');

      // Should remove nullish class and clear placeholder
      await expect(textControl).not.toHaveClass(/hcc-control-nullish/);
      await expect(textInput).not.toHaveAttribute('placeholder', 'null');

      // Verify chart option is updated
      const titleText = await page.evaluate(() => {
        const chart = (window as any).Highcharts.charts[0];
        return chart.options.title.text;
      });
      expect(titleText).toBe('New Title');
    });
  });

  test.describe('Number Control', () => {
    test('has nullable button', async ({ page }) => {
      const numberControl = page.locator('.hcc-control-number').first();
      const nullableButton = numberControl.locator('.hcc-nullable-button');
      await expect(nullableButton).toBeVisible();
      await expect(nullableButton).toHaveAttribute('title', 'Set to null');
    });

    test('nullable button sets value to null', async ({ page }) => {
      const numberControl = page.locator('.hcc-control-number').first();
      const rangeInput = numberControl.locator('input[type="range"]');
      const valueDisplay = numberControl.locator('.hcc-range-value');
      const nullableButton = numberControl.locator('.hcc-nullable-button');

      // Initial state
      await expect(numberControl).not.toHaveClass(/hcc-control-nullish/);
      const initialText = await valueDisplay.textContent();
      expect(initialText).not.toBe('');

      // Click nullable button
      await nullableButton.click();

      // Should clear display and add nullish class
      await expect(valueDisplay).toHaveText('');
      await expect(numberControl).toHaveClass(/hcc-control-nullish/);

      // Verify chart option is null
      const maxValue = await page.evaluate(() => {
        const chart = (window as any).Highcharts.charts[0];
        return chart.options.yAxis[0].max;
      });
      expect(maxValue).toBe(null);
    });

    test('user can adjust slider after clicking nullable button', async ({ page }) => {
      const numberControl = page.locator('.hcc-control-number').first();
      const rangeInput = numberControl.locator('input[type="range"]');
      const valueDisplay = numberControl.locator('.hcc-range-value');
      const nullableButton = numberControl.locator('.hcc-nullable-button');

      // Click nullable button to set null
      await nullableButton.click();
      await expect(numberControl).toHaveClass(/hcc-control-nullish/);

      // User adjusts slider
      await rangeInput.fill('5');

      // Should remove nullish class and update display
      await expect(numberControl).not.toHaveClass(/hcc-control-nullish/);
      await expect(valueDisplay).toHaveText('5');

      // Verify chart option is updated
      const maxValue = await page.evaluate(() => {
        const chart = (window as any).Highcharts.charts[0];
        return chart.options.yAxis[0].max;
      });
      expect(maxValue).toBe(5);
    });

    test('range input appears dimmed when nullish', async ({ page }) => {
      const numberControl = page.locator('.hcc-control-number').first();
      const rangeInput = numberControl.locator('input[type="range"]');
      const nullableButton = numberControl.locator('.hcc-nullable-button');

      // Click nullable button
      await nullableButton.click();

      // Check that nullish class is applied (which applies opacity and filter)
      await expect(numberControl).toHaveClass(/hcc-control-nullish/);
    });
  });

  test.describe('Color Control', () => {
    test('has nullable button', async ({ page }) => {
      const colorControl = page.locator('.hcc-control-color').first();
      const nullableButton = colorControl.locator('.hcc-nullable-button');
      await expect(nullableButton).toBeVisible();
      await expect(nullableButton).toHaveAttribute('title', 'Set to null');
    });

    test('nullable button sets value to null', async ({ page }) => {
      const colorControl = page.locator('.hcc-control-color').first();
      const colorValue = colorControl.locator('.hcc-color-value');
      const nullableButton = colorControl.locator('.hcc-nullable-button');

      // Initial state
      await expect(colorControl).not.toHaveClass(/hcc-control-nullish/);

      // Click nullable button
      await nullableButton.click();

      // Should show em dash and add nullish class
      await expect(colorValue).toHaveText('—');
      await expect(colorControl).toHaveClass(/hcc-control-nullish/);

      // Verify chart option is null
      const seriesColor = await page.evaluate(() => {
        const chart = (window as any).Highcharts.charts[0];
        return chart.options.series[0].color;
      });
      expect(seriesColor).toBe(null);
    });

    test('user can change color after clicking nullable button', async ({ page }) => {
      const colorControl = page.locator('.hcc-control-color').first();
      const colorInput = colorControl.locator('input[type="color"]');
      const colorValue = colorControl.locator('.hcc-color-value');
      const nullableButton = colorControl.locator('.hcc-nullable-button');

      // Click nullable button to set null
      await nullableButton.click();
      await expect(colorControl).toHaveClass(/hcc-control-nullish/);

      // User changes color
      await colorInput.evaluate((input: HTMLInputElement) => {
        input.value = '#ff0000';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });

      // Should remove nullish class and update display
      await expect(colorControl).not.toHaveClass(/hcc-control-nullish/);
      await expect(colorValue).toHaveText('#ff0000');
    });
  });

  test.describe('Boolean Control', () => {
    test('has nullable tri-state toggle', async ({ page }) => {
      const booleanControl = page.locator('.hcc-control-boolean').first();
      const toggle = booleanControl.locator('.hcc-toggle');
      await expect(toggle).toBeVisible();
      await expect(toggle).toHaveClass(/hcc-toggle-nullable/);
    });

    test('cycles through false, null, true states', async ({ page }) => {
      const booleanControl = page.locator('.hcc-control-boolean').first();
      const slider = booleanControl.locator('.hcc-toggle-slider');

      // Initial state should be true (visible: true)
      await expect(slider).toHaveClass(/hcc-toggle-slider-true/);
      await expect(booleanControl).not.toHaveClass(/hcc-control-nullish/);

      // Click to cycle to false
      await slider.click();
      await expect(slider).toHaveClass(/hcc-toggle-slider-false/);
      await expect(booleanControl).not.toHaveClass(/hcc-control-nullish/);

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
      await expect(booleanControl).not.toHaveClass(/hcc-control-nullish/);

      visibleValue = await page.evaluate(() => {
        const chart = (window as any).Highcharts.charts[0];
        return chart.options.series[0].visible;
      });
      expect(visibleValue).toBe(true);
    });

    test('nullable toggle is wider than regular toggle', async ({ page }) => {
      const booleanControl = page.locator('.hcc-control-boolean').first();
      const toggle = booleanControl.locator('.hcc-toggle');

      const width = await toggle.evaluate((el) => {
        return window.getComputedStyle(el).width;
      });

      // Nullable toggle should be 70px, regular is 46px
      expect(parseInt(width)).toBeGreaterThan(46);
    });
  });

  test.describe('Select Control - Button Group', () => {
    test('has null button as rightmost button', async ({ page }) => {
      const selectControl = page.locator('.hcc-control-select').first();
      const buttons = selectControl.locator('.hcc-button');
      const buttonCount = await buttons.count();

      // Should have 4 buttons (left, center, right, null)
      expect(buttonCount).toBe(4);

      // Last button should be null button with ⊘ symbol
      const lastButton = buttons.nth(buttonCount - 1);
      await expect(lastButton).toHaveText('⊘');
      await expect(lastButton).toHaveAttribute('data-value', '__null__');
    });

    test('clicking null button sets value to null', async ({ page }) => {
      const selectControl = page.locator('.hcc-control-select').first();
      const nullButton = selectControl.locator('button[data-value="__null__"]');

      // Initial state - should not be nullish
      await expect(selectControl).not.toHaveClass(/hcc-control-nullish/);

      // Click null button
      await nullButton.click();

      // Should add nullish class and make button active
      await expect(selectControl).toHaveClass(/hcc-control-nullish/);
      await expect(nullButton).toHaveClass(/active/);

      // Verify chart option is null
      const alignValue = await page.evaluate(() => {
        const chart = (window as any).Highcharts.charts[0];
        return chart.options.title.align;
      });
      expect(alignValue).toBe(null);
    });

    test('clicking regular button after null button removes nullish state', async ({ page }) => {
      const selectControl = page.locator('.hcc-control-select').first();
      const nullButton = selectControl.locator('button[data-value="__null__"]');
      const centerButton = selectControl.locator('button[data-value="center"]');

      // Click null button
      await nullButton.click();
      await expect(selectControl).toHaveClass(/hcc-control-nullish/);

      // Click center button
      await centerButton.click();

      // Should remove nullish class
      await expect(selectControl).not.toHaveClass(/hcc-control-nullish/);
      await expect(centerButton).toHaveClass(/active/);
      await expect(nullButton).not.toHaveClass(/active/);

      // Verify chart option is updated
      const alignValue = await page.evaluate(() => {
        const chart = (window as any).Highcharts.charts[0];
        return chart.options.title.align;
      });
      expect(alignValue).toBe('center');
    });
  });

  test.describe('Select Control - Dropdown', () => {
    test('has null option as first option', async ({ page }) => {
      const selectControl = page.locator('.hcc-control-select').nth(2); // dashStyle control
      const dropdown = selectControl.locator('.hcc-select-dropdown');

      await expect(dropdown).toBeVisible();

      // Get all options
      const options = await dropdown.locator('option').all();
      const firstOption = options[0];

      // First option should be null option
      const value = await firstOption.getAttribute('value');
      const text = await firstOption.textContent();

      expect(value).toBe('__null__');
      expect(text).toBe('—');
    });

    test('selecting null option sets value to null', async ({ page }) => {
      const selectControl = page.locator('.hcc-control-select').nth(2);
      const dropdown = selectControl.locator('.hcc-select-dropdown');

      // Initial state
      await expect(selectControl).not.toHaveClass(/hcc-control-nullish/);

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

    test('selecting regular option after null removes nullish state', async ({ page }) => {
      const selectControl = page.locator('.hcc-control-select').nth(2);
      const dropdown = selectControl.locator('.hcc-select-dropdown');

      // Select null option
      await dropdown.selectOption('__null__');
      await expect(selectControl).toHaveClass(/hcc-control-nullish/);

      // Select regular option
      await dropdown.selectOption('Dash');

      // Should remove nullish class
      await expect(selectControl).not.toHaveClass(/hcc-control-nullish/);

      // Verify chart option is updated
      const dashStyleValue = await page.evaluate(() => {
        const chart = (window as any).Highcharts.charts[0];
        return chart.options.series[0].dashStyle;
      });
      expect(dashStyleValue).toBe('Dash');
    });
  });

  test.describe('Nullable Button Styling', () => {
    test('nullable button is always gray (not stateful)', async ({ page }) => {
      const textControl = page.locator('.hcc-control-text').first();
      const nullableButton = textControl.locator('.hcc-nullable-button');

      // Button should not have active class or red color
      await expect(nullableButton).not.toHaveClass(/hcc-nullable-active/);

      // Click button
      await nullableButton.click();

      // Should still not have active class after click
      await expect(nullableButton).not.toHaveClass(/hcc-nullable-active/);
    });

    test('nullable button title always says "Set to null"', async ({ page }) => {
      const textControl = page.locator('.hcc-control-text').first();
      const nullableButton = textControl.locator('.hcc-nullable-button');

      // Before click
      await expect(nullableButton).toHaveAttribute('title', 'Set to null');

      // After click
      await nullableButton.click();
      await expect(nullableButton).toHaveAttribute('title', 'Set to null');
    });
  });
});
