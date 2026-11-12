import { test, expect } from '@playwright/test';

test.describe('Highcharts Controls - Standalone Controls', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    if (testInfo.title.includes('works without Highcharts or Grid globals')) {
      return;
    }

    await page.goto('http://localhost:8080/e2e/fixtures/standalone-controls.html');
    await page.waitForFunction(() => {
      const w = window as any;
      return !!w.colorControl && !!w.booleanControl && !!w.numberControl && !!w.selectControl && !!w.textControl && !!w.programmaticControl;
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

  test('works without Highcharts or Grid globals', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.evaluate(async () => {
      delete (window as any).Highcharts;
      delete (window as any).Grid;
      const { ColorControl } = await import('/js/controls.js');
      const container = document.createElement('div');
      document.body.appendChild(container);
      const control = new ColorControl({
        type: 'color',
        path: 'chart.backgroundColor',
        value: '#123456'
      });
      control.render(container);
      (window as any).colorControl = control;
    });

    await page.waitForFunction(() => !!(window as any).colorControl);
    await expect(page.locator('input[type="color"]')).toHaveValue('#123456');
    await expect(page.locator('.hcc-color-value')).toHaveText('#123456');
  });

  test('parses light-dark() colors according to the active color scheme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('http://localhost:8080');

    await page.evaluate(async () => {
      const { ColorControl } = await import('/js/controls.js');
      const container = document.createElement('div');
      document.body.appendChild(container);
      const control = new ColorControl({
        type: 'color',
        path: 'chart.backgroundColor',
        value: 'light-dark(#ffffff, #000000)'
      });
      control.render(container);
      (window as any).dualModeColorControl = control;
    });

    await page.waitForFunction(() => !!(window as any).dualModeColorControl);
    await expect(page.locator('input[type="color"]').last()).toHaveValue('#000000');
    const modeButton = page.locator('.hcc-color-mode-button').last();
    await expect(modeButton).toHaveAttribute('data-mode', 'dark');
    await expect(modeButton).toHaveText('☾');

    await modeButton.click();
    await page.locator('.hcc-color-mode-option[data-mode="light"]').click();
    await expect(modeButton).toHaveAttribute('data-mode', 'light');
    await expect(page.locator('input[type="color"]').last()).toHaveValue('#ffffff');
    await expect(page.locator('.hcc-color-value').last()).toHaveText('#ffffff');
  });

  test('allows the color mode dropdown to overflow the group container without clipping', async ({ page }) => {
    await page.goto('http://localhost:8080');

    await page.evaluate(async () => {
      const Controls = (await import('/js/controls.js')).default;
      const container = document.createElement('div');
      document.body.appendChild(container);
      new Controls(container, {
        controls: [{
          group: 'Theme',
          controls: [{
            type: 'color',
            path: 'chart.backgroundColor',
            value: '#123456'
          }]
        }]
      });
      (window as any).overflowGroupControl = true;
    });

    await page.waitForFunction(() => !!(window as any).overflowGroupControl);
    const groupControls = page.locator('.hcc-group-controls').first();
    await expect(groupControls).toHaveCSS('overflow', 'visible');
    await page.locator('.hcc-color-mode-button').first().click();
    await expect(page.locator('.hcc-color-mode-menu').first()).toBeVisible();
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

    const textInput = page.locator('#text-control-container input[type="text"]');
    await textInput.fill('Updated Title');
    await expect(page.locator('#text-output')).toHaveText('Title: Updated Title');
    await expect(page.locator('#text-demo-box')).toHaveText('Updated Title');

    const wcTextControl = page.locator('#wc-text-control');
    await wcTextControl.evaluate((el: any) => {
      el.value = 'WC Title';
    });
    await expect(page.locator('#wc-text-output')).toHaveText('Title: WC Title');
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

    const multiRange = page.locator('#multi-controls-container input[type="range"][title="Opacity"]');
    await multiRange.evaluate((input: HTMLInputElement) => {
      input.value = '70';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await expect(page.locator('#theme-opacity')).toHaveText('70%');

    await page.locator('#set-value-btn').click();
    await expect(page.locator('#programmatic-output')).toHaveText('Value: #e74c3c');
  });

  test('supports standalone web component controls with native input-like value updates', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    const colorControl = page.locator('#wc-color-control');
    await expect(colorControl.locator('input[type="color"]')).toHaveValue('#3498db');

    await colorControl.evaluate((el: any) => {
      el.value = '#123456';
    });
    await expect(colorControl.locator('input[type="color"]')).toHaveValue('#123456');
    await expect(page.locator('#wc-color-output')).toHaveText('Color changed to: #123456');

    const colorInput = colorControl.locator('input[type="color"]');
    await colorInput.evaluate((input: HTMLInputElement) => {
      input.value = '#ff0000';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await expect(page.locator('#wc-color-output')).toHaveText('Color changed to: #ff0000');

    const booleanControl = page.locator('#wc-boolean-control');
    await booleanControl.evaluate((el: any) => {
      el.value = true;
    });
    await expect(booleanControl.locator('input[type="checkbox"]')).toBeChecked();
    await expect(page.locator('#wc-boolean-output')).toHaveText('State: true');

    const numberControl = page.locator('#wc-number-control');
    await numberControl.evaluate((el: any) => {
      el.value = 28;
    });
    await expect(numberControl.locator('input[type="range"]')).toHaveValue('28');
    await expect(page.locator('#wc-number-output')).toHaveText('Value: 28px');

    const selectControl = page.locator('#wc-select-control');
    await selectControl.evaluate((el: any) => {
      el.value = 'right';
    });
    await expect(page.locator('#wc-select-output')).toHaveText('Alignment: right');

    await page.locator('#set-wc-value-btn').click();
    await expect(page.locator('#wc-color-output')).toHaveText('Color changed to: #e74c3c');

    expect(errors).toEqual([]);
  });
});
