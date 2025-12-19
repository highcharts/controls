import { test, expect } from '@playwright/test';

test.describe('Highcharts Controls - Groups (JavaScript API)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/e2e/fixtures/groups.html');
    await page.waitForSelector('.highcharts-controls', { timeout: 5000 });
  });

  test('renders groups with headers', async ({ page }) => {
    const groups = page.locator('.hcc-group');
    await expect(groups).toHaveCount(3);

    const headers = page.locator('.hcc-group-title');
    await expect(headers.nth(0)).toHaveText('Legend Settings');
    await expect(headers.nth(1)).toHaveText('Chart Settings');
    await expect(headers.nth(2)).toHaveText('Title');
  });

  test('renders controls within groups', async ({ page }) => {
    // Legend group should have 3 controls
    const legendGroup = page.locator('.hcc-group').first();
    const legendControls = legendGroup.locator('.hcc-control');
    await expect(legendControls).toHaveCount(3);
  });

  test('first group is expanded by default', async ({ page }) => {
    const firstGroup = page.locator('.hcc-group').first();
    await expect(firstGroup).not.toHaveClass(/hcc-group-collapsed/);
  });

  test('second group starts collapsed', async ({ page }) => {
    const secondGroup = page.locator('.hcc-group').nth(1);
    await expect(secondGroup).toHaveClass(/hcc-group-collapsed/);
  });

  test('can toggle group collapse', async ({ page }) => {
    const firstGroup = page.locator('.hcc-group').first();
    const toggleButton = firstGroup.locator('.hcc-group-toggle');

    // Should start expanded
    await expect(firstGroup).not.toHaveClass(/hcc-group-collapsed/);

    // Click to collapse
    await toggleButton.click();
    await expect(firstGroup).toHaveClass(/hcc-group-collapsed/);

    // Click to expand
    await toggleButton.click();
    await expect(firstGroup).not.toHaveClass(/hcc-group-collapsed/);
  });

  test('non-collapsible group has no toggle button', async ({ page }) => {
    const thirdGroup = page.locator('.hcc-group').nth(2);
    const toggleButton = thirdGroup.locator('.hcc-group-toggle');

    await expect(toggleButton).toHaveCount(0);
  });

  test('controls in groups work correctly', async ({ page }) => {
    // Test boolean control in Legend group
    const toggle = page.locator('.hcc-toggle input[type="checkbox"]').first();
    const slider = page.locator('.hcc-toggle .hcc-toggle-slider').first();

    await expect(toggle).toBeChecked();
    await slider.click();
    await expect(toggle).not.toBeChecked();

    // Verify chart updated
    const legendEnabled = await page.evaluate(() => {
      const chart = (window as any).Highcharts.charts[0];
      return chart.options.legend.enabled;
    });
    expect(legendEnabled).toBe(false);
  });

  test('collapsed group hides controls', async ({ page }) => {
    const secondGroup = page.locator('.hcc-group').nth(1);
    const groupControls = secondGroup.locator('.hcc-group-controls');

    // Should start collapsed (opacity 0, max-height 0)
    await expect(secondGroup).toHaveClass(/hcc-group-collapsed/);

    // Expand the group
    const toggleButton = secondGroup.locator('.hcc-group-toggle');
    await toggleButton.click();

    // Controls should be visible
    await expect(secondGroup).not.toHaveClass(/hcc-group-collapsed/);
  });
});

test.describe('Highcharts Controls - Groups (Web Components)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/e2e/fixtures/groups-web-components.html');
    await page.waitForSelector('.highcharts-controls', { timeout: 5000 });
  });

  test('renders groups from web components', async ({ page }) => {
    const groups = page.locator('.hcc-group');
    await expect(groups).toHaveCount(3);

    const headers = page.locator('.hcc-group-title');
    await expect(headers.nth(0)).toHaveText('Legend Settings');
    await expect(headers.nth(1)).toHaveText('Chart Settings');
    await expect(headers.nth(2)).toHaveText('Title');
  });

  test('web component group starts collapsed when attribute is present', async ({ page }) => {
    const secondGroup = page.locator('.hcc-group').nth(1);
    await expect(secondGroup).toHaveClass(/hcc-group-collapsed/);
  });

  test('web component group respects collapsible=false', async ({ page }) => {
    const thirdGroup = page.locator('.hcc-group').nth(2);
    const toggleButton = thirdGroup.locator('.hcc-group-toggle');

    await expect(toggleButton).toHaveCount(0);
  });

  test('controls in web component groups work correctly', async ({ page }) => {
    // Test select control in Legend group
    const centerButton = page.locator('button.hcc-button[data-value="center"]');
    await expect(centerButton).toHaveClass(/active/);

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
});
