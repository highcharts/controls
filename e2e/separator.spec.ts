import { test, expect } from '@playwright/test';

test.describe('Separator', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/e2e/fixtures/separator.html');
    });

    test('should render separators as hr elements', async ({ page }) => {
        // Wait for controls to be rendered
        await page.waitForSelector('.highcharts-controls');

        // Check that separator elements are rendered as hr with correct class
        const separators = await page.locator('.hcc-separator').all();
        expect(separators.length).toBeGreaterThan(0);

        // Verify first separator is an hr element
        const firstSeparator = page.locator('.hcc-separator').first();
        const tagName = await firstSeparator.evaluate(el => el.tagName.toLowerCase());
        expect(tagName).toBe('hr');
    });

    test('should have correct CSS class on separators', async ({ page }) => {
        await page.waitForSelector('.hcc-separator');

        const separatorClass = await page.locator('.hcc-separator').first().getAttribute('class');
        expect(separatorClass).toBe('hcc-separator');
    });

    test('web component separator should be hidden', async ({ page }) => {
        // The actual <highcharts-separator> element should be hidden via CSS
        const webComponent = page.locator('highcharts-separator').first();
        const isVisible = await webComponent.isVisible();
        expect(isVisible).toBe(false);
    });

    test('separators within groups should render correctly', async ({ page }) => {
        await page.waitForSelector('.hcc-group');

        // Check that separators are rendered
        const allSeparators = await page.locator('.hcc-separator').all();
        // We should have multiple separators based on the fixture
        expect(allSeparators.length).toBeGreaterThanOrEqual(3);
    });

    test('separator should span both columns', async ({ page }) => {
        await page.waitForSelector('.hcc-separator');

        // Get the width of the container and the separator
        const containerWidth = await page.locator('.hcc-container').first().evaluate(el => el.clientWidth);
        const separatorWidth = await page.locator('.hcc-separator').first().evaluate(el => el.offsetWidth);

        // The separator should span the full width of the container (allowing for padding)
        // Should be at least 90% of container width to account for padding
        expect(separatorWidth).toBeGreaterThan(containerWidth * 0.9);
    });
});
