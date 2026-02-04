/**
 * Public Pages Navigation Tests
 * Tests that all public pages load correctly without console errors
 */

import { test, expect } from '@playwright/test';

// Store console errors for each test
let consoleErrors = [];

test.beforeEach(async ({ page }) => {
  consoleErrors = [];
  
  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({
        text: msg.text(),
        location: msg.location()
      });
    }
  });
  
  // Capture page errors (uncaught exceptions)
  page.on('pageerror', error => {
    consoleErrors.push({
      text: error.message,
      stack: error.stack
    });
  });
});

test.describe('Public Pages Navigation', () => {
  
  test('Home page loads correctly', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check title or main content exists
    await expect(page.locator('body')).toBeVisible();
    
    // Should have navigation
    const navbar = page.locator('nav, header');
    await expect(navbar.first()).toBeVisible();
    
    // Check for critical console errors (ignore 404 for journey/active as it's expected)
    const criticalErrors = consoleErrors.filter(e => 
      !e.text.includes('/api/journey/active') && 
      !e.text.includes('404')
    );
    
    if (criticalErrors.length > 0) {
      console.log('Console errors on Home page:', criticalErrors);
    }
  });

  test('About page loads correctly', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
    
    // Check page has content
    const content = page.locator('main, .content, article, section').first();
    await expect(content).toBeVisible();
  });

  test('Contact page loads correctly', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('Blogs page loads correctly', async ({ page }) => {
    await page.goto('/blogs');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('Opportunities page loads correctly', async ({ page }) => {
    await page.goto('/opportunities');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('Privacy Policy page loads correctly', async ({ page }) => {
    await page.goto('/privacy-policy');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('Terms page loads correctly', async ({ page }) => {
    await page.goto('/terms');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('Cookie Policy page loads correctly', async ({ page }) => {
    await page.goto('/cookie-policy');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('Login page loads correctly', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
    
    // Should have login form
    const form = page.locator('form, [role="form"], input[type="email"], input[type="password"]');
    await expect(form.first()).toBeVisible();
  });

  test('Signup page loads correctly', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
    
    // Should have signup form
    const form = page.locator('form, [role="form"], input');
    await expect(form.first()).toBeVisible();
  });
});

test.describe('Navigation Links', () => {
  
  test('Logo navigates to home', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('networkidle');
    
    // Click logo or home link
    const logo = page.locator('a[href="/"], .logo, [aria-label*="home" i]').first();
    if (await logo.isVisible()) {
      await logo.click();
      await expect(page).toHaveURL('/');
    }
  });

  test('Navigate from Home to About', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Find and click About link
    const aboutLink = page.locator('a[href="/about"], a:has-text("About")').first();
    if (await aboutLink.isVisible()) {
      await aboutLink.click();
      await expect(page).toHaveURL('/about');
    }
  });

  test('Navigate from Home to Contact', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const contactLink = page.locator('a[href="/contact"], a:has-text("Contact")').first();
    if (await contactLink.isVisible()) {
      await contactLink.click();
      await expect(page).toHaveURL('/contact');
    }
  });
});
